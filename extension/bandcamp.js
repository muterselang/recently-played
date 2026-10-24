(() => {
  const HISTORY_KEY = "trackHistory";
  const MAX_HISTORY = 200;
  const MIN_PLAY_SECONDS = 10;
  const POLL_INTERVAL = 500;
  const config = globalThis.RECENTLY_PLAYED_CONFIG;

  if (!config?.workerUrl || !config?.ingestToken) {
    console.error("[Recently Played] Missing config.");
    return;
  }

  let candidate = null;

  function readCurrentTrack() {
    const audio = [...document.querySelectorAll("audio")].find(
      (item) => !item.paused && !item.ended && item.currentTime > 0
    );

    if (!audio) {
      if (candidate) {
        candidate.lastAudioTime = null;
        candidate.audio = null;
      }
      return;
    }

    let title = "";
    let artist = "";
    let album = "";
    let artwork = "";

    const oldTrack = document.querySelector(".track_row_view.current_track");

    if (oldTrack) {
      title = oldTrack.querySelector(".track-title")?.innerText.trim() ?? "";
      artist =
        document
          .querySelector("#band-name-location .title")
          ?.innerText.trim() ?? "";
      album =
        document.querySelector("#name-section h2")?.innerText.trim() ?? "";
      artwork = document.querySelector(".trackView img")?.src ?? "";
    }

    const newTrack = document.querySelector("li.track.playing");

    if (!title && newTrack) {
      title = newTrack.querySelector(".info .name")?.innerText.trim() ?? "";

      const heading = document.querySelector("h1")?.innerText ?? "";
      artist = heading.split(/\nby\s*/i)[1]?.trim() ?? "";

      const albumImage = document.querySelector(
        'img[alt^="Album artwork for "]'
      );

      album = albumImage?.alt.replace(/^Album artwork for\s*/i, "") ?? "";
      artwork = albumImage?.src ?? "";
    }

    if (!title) return;

    const track = {
      title,
      artist: artist || null,
      album: album || null,
      artwork: artwork ? [artwork] : [],
      source: "bandcamp",
      sourceUrl: window.location.href,
    };

    const key = [
      track.source,
      location.hostname,
      track.title,
      track.artist,
      track.album,
    ].join("::");

    if (!candidate || candidate.key !== key) {
      candidate = {
        key,
        track,
        elapsed: 0,
        audio,
        lastAudioTime: audio.currentTime,
      };

      console.log("[Recently Played] Tracking candidate:", track.title);
      return;
    }

    // Keep metadata/artwork up to date.
    candidate.track = track;

    // Count actual audio progress, not wall-clock time.
    // This excludes pauses and avoids counting time between tracks.
    if (candidate.audio === audio && candidate.lastAudioTime !== null) {
      const delta = audio.currentTime - candidate.lastAudioTime;

      // Ignore seeks and unexpectedly large jumps.
      if (delta > 0 && delta <= 2) {
        candidate.elapsed += delta;
      }
    }

    candidate.audio = audio;
    candidate.lastAudioTime = audio.currentTime;

    if (candidate.elapsed < MIN_PLAY_SECONDS) return;

    const qualifiedTrack = {
      ...candidate.track,
      playedAt: new Date().toISOString(),
    };

    const qualifiedKey = candidate.key;

    // Clear first so this candidate cannot be submitted repeatedly.
    candidate = null;

    saveTrack(qualifiedTrack, qualifiedKey);
  }

  function saveTrack(track, key) {
    chrome.storage.local.get([HISTORY_KEY], (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "[Recently Played] Local read failed:",
          chrome.runtime.lastError.message
        );
        return;
      }

      const history = result[HISTORY_KEY] ?? [];

      if (history[0]?.key === key) {
        console.log("[Recently Played] Already saved:", track.title);
        return;
      }

      const entry = { ...track, key };
      const updatedHistory = [entry, ...history].slice(0, MAX_HISTORY);

      chrome.storage.local.set({ [HISTORY_KEY]: updatedHistory }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "[Recently Played] Local save failed:",
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
        body: JSON.stringify(track),
      });

      if (!response.ok) {
        console.error(
          "[Recently Played] Bandcamp sync failed:",
          response.status,
          await response.text()
        );
        return;
      }

      console.log("[Recently Played] Synced Bandcamp track:", track.title);
    } catch (error) {
      console.error("[Recently Played] Bandcamp sync failed:", error);
    }
  }

  readCurrentTrack();
  setInterval(readCurrentTrack, POLL_INTERVAL);
})();
