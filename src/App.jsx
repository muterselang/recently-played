import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Header from "./components/Header";
import "./styles/layout.css";

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [status, setStatus] = useState("loading...");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTracks() {
      const { data, error } = await supabase
        .from("listens")
        .select("id, title, artist, album, artwork, played_at, source")
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

  return (
    <main>
      <Header status={status} trackCount={tracks.length} />

      {error && <p>Error: {error}</p>}

      <ol>
        {tracks.map((track) => (
          <li key={track.id}>
            <article>
              {track.artwork?.[0] && (
                <img
                  src={track.artwork[0]}
                  alt={`Artwork for ${track.album || track.title}`}
                  width="80"
                  height="80"
                  loading="lazy"
                />
              )}

              <div>
                <h2>{track.title}</h2>
                <p>{track.artist || "Unknown artist"}</p>
                <p>{track.album || "Unknown album"}</p>
                <p>
                  {track.source === "bandcamp" ? "Bandcamp" : "Apple Music"}
                  {" · "}
                  {new Date(track.played_at).toLocaleString()}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </main>
  );
}
