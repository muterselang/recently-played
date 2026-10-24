(() => {
  const HISTORY_KEY = "trackHistory";
  const MAX_HISTORY = 200;
  const MIN_PLAY_SECONDS = 10;
  const POLL_INTERVAL = 500;
  const MAX_PROGRESS_STEP = 1.5;

  const config = globalThis.RECENTLY_PLAYED_CONFIG;

  if (!config?.workerUrl || !config?.ingestToken) {
    console.error("[Recently Played] Missing config.js settings.");
    return;
  }

  let candidate = null;
  let lastQualifiedTrackKey = "";

  function getTrackKey(track) {
    return [track.title, track.artist, track.album].join("::");
  }

  function readTrackMetadata() {
    const metadata = navigator.mediaSession?.metadata;
    const audio = [...document.querySelectorAll("audio")].find(
      (item) => !item.paused && !item.ended && item.readyState >= 2
    );

    // Tanpa audio yang benar-benar berjalan, jangan menambah hitungan.
    if (!audio) {
      if (candidate) {
        candidate.lastAudioTime = null;
        candidate.audio = null;
      }
      return;
    }

    if (!metadata?.title) return;

    const track = {
      title: metadata.title,
      artist: metadata.artist || null,
      album: metadata.album || null,
      artwork: metadata.artwork?.map((image) => image.src) ?? [],
      source: "apple-music",
      sourceUrl: window.location.href,
    };

    const trackKey = getTrackKey(track);

    if (trackKey === lastQualifiedTrackKey) return;

    // Track berubah: mulai hitungan baru dari nol.
    if (!candidate || candidate.key !== trackKey) {
      candidate = {
        key: trackKey,
        track,
        elapsed: 0,
        audio,
        lastAudioTime: audio.currentTime,
      };

      console.log("[Recently Played] Tracking candidate:", track.title);
      return;
    }

    candidate.track = track;

    // Jika elemen audio berubah, jadikan posisi sekarang sebagai baseline.
    if (candidate.audio !== audio || candidate.lastAudioTime === null) {
      candidate.audio = audio;
      candidate.lastAudioTime = audio.currentTime;
      return;
    }

    const currentTime = audio.currentTime;
    const delta = currentTime - candidate.lastAudioTime;

    // Polling 500 ms: abaikan seek, reset posisi, dan loncatan tak wajar.
    if (delta > 0 && delta <= MAX_PROGRESS_STEP) {
      candidate.elapsed += delta;
    }

    candidate.lastAudioTime = currentTime;

    if (candidate.elapsed < MIN_PLAY_SECONDS) return;

    const qualifiedTrack = {
      ...candidate.track,
      playedAt: new Date().toISOString(),
    };

    const qualifiedKey = candidate.key;

    // Cegah track yang sama dikualifikasi berulang kali.
    lastQualifiedTrackKey = qualifiedKey;
    candidate = null;

    saveTrack(qualifiedTrack, qualifiedKey);
  }

  function saveTrack(track, trackKey) {
    chrome.storage.local.get([HISTORY_KEY], (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "[Recently Played] Read failed:",
          chrome.runtime.lastError.message
        );
        return;
      }

      const history = result[HISTORY_KEY] ?? [];

      if (history[0]?.key === trackKey) {
        console.log("[Recently Played] Already saved:", track.title);
        sendTrackToWorker(track);
        return;
      }

      const entry = {
        ...track,
        key: trackKey,
      };

      const updatedHistory = [entry, ...history].slice(0, MAX_HISTORY);

      chrome.storage.local.set({ [HISTORY_KEY]: updatedHistory }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "[Recently Played] Save failed:",
            chrome.runtime.lastError.message
          );
          return;
        }

        console.log(
          "[Recently Played] Qualified after 10 seconds:",
          track.title
        );

        sendTrackToWorker(track);
      });
    });
  }

  async function sendTrackToWorker(track) {
    try {
      const response = await fetch(`${config.workerUrl}/tracks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.ingestToken}`,
        },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          album: track.album,
          artwork: track.artwork,
          playedAt: track.playedAt,
          source: "apple-music",
          sourceUrl: track.sourceUrl,
        }),
      });

      if (!response.ok) {
        console.error(
          "[Recently Played] Worker rejected track:",
          response.status,
          await response.text()
        );
        return;
      }

      console.log("[Recently Played] Synced to cloud:", track.title);
    } catch (error) {
      console.error("[Recently Played] Sync failed:", error);
    }
  }

  readTrackMetadata();

  chrome.storage.local.get([HISTORY_KEY], (result) => {
    if (chrome.runtime.lastError) {
      console.error(
        "[Recently Played] Read failed:",
        chrome.runtime.lastError.message
      );
      return;
    }

    console.log("[Recently Played] Stored tracks:", result[HISTORY_KEY] ?? []);
  });

  setInterval(readTrackMetadata, POLL_INTERVAL);
})();
