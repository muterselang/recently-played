import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
// import Header from "./components/Header";
import { groupAlbums } from "./lib/groupAlbums";
// import AlbumCarousel from "./components/AlbumCarousel";
import "./styles/layout.css";
import RecentStrip from "./components/RecentStrip";
import NowPlaying from "./components/NowPlaying";

export default function App() {
  const [tracks, setTracks] = useState([]);
  const albums = groupAlbums(tracks);

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
      {/* <Header status={status} trackCount={tracks.length} /> */}

      {error && <p>Error: {error}</p>}

      <RecentStrip albums={albums} />

      <NowPlaying track={tracks[0] ?? null} />
      {/* <section>
        <h2>Album archive</h2>
        <p>{albums.length} unique albums</p>

        <ol>
          {albums.map((album) => (
            <li key={album.key}>
              <article>
                {album.artwork && (
                  <img
                    src={album.artwork}
                    alt={`Artwork for ${album.album}`}
                    width="80"
                    height="80"
                    loading="lazy"
                  />
                )}

                <div>
                  <h3>{album.album}</h3>
                  <p>{album.artist}</p>
                  <p>{album.tracks.length} tracks recorded</p>
                  <p>
                    Last played:{" "}
                    {new Date(album.latestPlayedAt).toLocaleString()}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section> */}

      {/* <ol>
        {tracks.map((track) => (
          <li key={track.id}>
            <article>
              {track.artwork?.[0] && (
                <img
                  src={track.artwork[0]}
                  alt={`Artwork for ${track.album || track.title}`}
                  width="500"
                  height="500"
                  loading="lazy"
                />
              )}

              <div>
                <h2>{track.title}</h2>
                <p>{track.artist || "Unknown artist"}</p>
                <p>{track.album || "Unknown album"}</p>
                <p>
                  {track.source === "bandcamp" ? "Bandcamp" : "Apple Music"}
                  {new Date(track.played_at).toLocaleString()}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ol> */}
    </main>
  );
}
