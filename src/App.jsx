import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

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
      <header>
        <h1>Recently Played</h1>
        <p>
          {status === "loading..." && "Loading listening history..."}
          {status === "success" && `${tracks.length} tracks archived`}
          {status === "failed" && "Could not load listening history"}
        </p>
      </header>

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
