(() => {
  const HISTORY_KEY = "trackHistory";
  const MAX_HISTORY = 200;
  const config = globalThis.RECENTLY_PLAYED_CONFIG;

  if (!config?.workerUrl || !config?.ingestToken) {
    console.error("[Recently Played] Missing config.");
    return;
  }

  let lastTrackKey = "";

  function readCurrentTrack() {
    const audioPlaying = [...document.querySelectorAll("audio")].some(
      (audio) => !audio.paused && audio.currentTime > 0
    );

    if (!audioPlaying) return;

    let title = "";
    let artist = "";
    let album = "";
    let artwork = "";

    // Layout lama: halaman album dengan .track_row_view
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

    // Layout baru: halaman album dengan li.track.playing
    const newTrack = document.querySelector("li.track.playing");

    if (!title && newTrack) {
      title = newTrack.querySelector(".info .name")?.innerText.trim() ?? "";

      const heading = document.querySelector("h1")?.innerText ?? "";
      artist = heading.split(/\nby\s*/i)[1]?.trim() ?? "";

      album =
        document
          .querySelector('img[alt^="Album artwork for "]')
          ?.alt.replace(/^Album artwork for\s*/i, "") ?? "";

      artwork =
        document.querySelector('img[alt^="Album artwork for "]')?.src ?? "";
    }

    if (!title) return;

    const track = {
      title,
      artist: artist || null,
      album: album || null,
      artwork: artwork ? [artwork] : [],
      playedAt: new Date().toISOString(),
      source: "bandcamp",
    };

    const key = [
      track.source,
      location.hostname,
      track.title,
      track.artist,
      track.album,
    ].join("::");

    if (key === lastTrackKey) return;
    lastTrackKey = key;

    saveTrack(track, key);
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

        console.log("[Recently Played] Saved Bandcamp track:", track.title);

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
  setInterval(readCurrentTrack, 2000);
})();
