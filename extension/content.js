(() => {
  let lastTrackKey = "";

  const HISTORY_KEY = "trackHistory";
  const MAX_HISTORY = 200;

  const config = globalThis.RECENTLY_PLAYED_CONFIG;

  if (!config?.workerUrl || !config?.ingestToken) {
    console.error("[Recently Played] Missing config.js settings.");
    return;
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
          artist: track.artist ?? null,
          album: track.album ?? null,
          artwork: track.artwork ?? [],
          playedAt: track.playedAt,
          source: "apple-music",
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        console.error(
          "[Recently Played] Worker rejected track:",
          response.status,
          message
        );
        return;
      }

      console.log("[Recently Played] Synced to cloud:", track.title);
    } catch (error) {
      console.error("[Recently Played] Sync failed:", error);
    }
  }

  function readTrackMetadata() {
    const metadata = navigator.mediaSession?.metadata;

    if (!metadata?.title) return;

    const track = {
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      artwork: metadata.artwork?.map((image) => image.src) ?? [],
    };

    const trackKey = [track.title, track.artist, track.album].join("::");

    if (trackKey === lastTrackKey) return;

    lastTrackKey = trackKey;

    saveTrack(track, trackKey);
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
      const latestTrack = history[0];

      if (latestTrack?.key === trackKey) {
        console.log("[Recently Played] Already saved:", track.title);
        return;
      }

      const entry = {
        ...track,
        key: trackKey,
        playedAt: new Date().toISOString(),
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

        console.log("[Recently Played] Saved to local history:", entry);
        sendTrackToWorker(entry);
      });
    });
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

  setInterval(readTrackMetadata, 2000);
})();
