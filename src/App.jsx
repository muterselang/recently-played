import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { groupAlbums } from "./lib/groupAlbums";
import RecentStrip from "./components/RecentStrip";
import NowPlaying from "./components/NowPlaying";
import useDominantColor from "./hook/useDominantColor";
import Disclaimer from "./components/Disclaimer";
import "./styles/layout.css";

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState(null);

  const currentArtwork = tracks[0]?.artwork?.[0];
  const albums = groupAlbums(tracks);

  useEffect(() => {
    let stopped = false;
    let fetching = false;
    let timeoutId = null;

    async function fetchTracks() {
      // Jangan fetch saat tab tersembunyi atau browser offline.
      if (
        stopped ||
        fetching ||
        !navigator.onLine ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      fetching = true;

      try {
        const { data, error } = await supabase
          .from("listens")
          .select(
            "id, title, artist, album, artwork, played_at, source, source_url"
          )
          .order("played_at", { ascending: false })
          .limit(100);

        if (stopped) return;

        if (error) {
          setError(error.message);
          console.warn("[Supabase] Fetch failed:", error.message);
        } else {
          setTracks(data ?? []);
          setError(null);
        }
      } catch (err) {
        if (!stopped) {
          setError(err.message || "Unable to fetch listens.");
          console.warn("[Supabase] Fetch failed:", err);
        }
      } finally {
        fetching = false;

        // Jadwalkan request berikutnya hanya jika halaman aktif.
        if (
          !stopped &&
          navigator.onLine &&
          document.visibilityState === "visible"
        ) {
          timeoutId = setTimeout(fetchTracks, 5000);
        }
      }
    }

    function resumeFetching() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      fetchTracks();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        resumeFetching();
      } else if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    window.addEventListener("online", resumeFetching);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    fetchTracks();

    return () => {
      stopped = true;

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      window.removeEventListener("online", resumeFetching);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const { background, foreground } = useDominantColor(currentArtwork);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--album-background",
      background
    );

    document.documentElement.style.setProperty(
      "--album-foreground",
      foreground
    );
  }, [background, foreground]);

  return (
    <main>
      {error && (
        <p role="status">
          Archive temporarily unavailable. Showing the last loaded data.
        </p>
      )}

      <RecentStrip albums={albums} />

      <NowPlaying track={tracks[0] ?? null} />

      <Disclaimer />
    </main>
  );
}
