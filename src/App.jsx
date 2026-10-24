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
  const currentArtwork = tracks[0]?.artwork?.[0];
  const albums = groupAlbums(tracks);

  const [status, setStatus] = useState("loading...");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTracks() {
      const { data, error } = await supabase
        .from("listens")
        .select(
          "id, title, artist, album, artwork, played_at, source, source_url"
        )
        .order("played_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[Supabase] Fetch failed:", error);
        setError(error.message);
        setStatus("failed");
        return;
      }

      setTracks(data ?? []);
      setStatus("success");
    }

    fetchTracks();

    const interval = setInterval(fetchTracks, 5000);

    return () => clearInterval(interval);
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
      {error && <p>Error: {error}</p>}

      <RecentStrip albums={albums} />

      <NowPlaying track={tracks[0] ?? null} />
      <Disclaimer />
    </main>
  );
}
