export default function NowPlaying({ track }) {
  if (!track) {
    return (
      <section className="now-playing">
        <h2 className="now-playing-label">NOW PLAYING</h2>

        <p className="now-playing-empty">No listening history recorded yet.</p>
      </section>
    );
  }

  const artwork = track.artwork?.[0];

  return (
    <section className="now-playing">
      <h2 className="now-playing-label">NOW PLAYING</h2>

      <div className="now-playing-content">
        <div className="now-playing-cover">
          {artwork && (
            <img src={artwork} alt={`Cover of ${track.album || track.title}`} />
          )}
        </div>

        <div className="now-playing-meta">
          <h3 className="now-playing-title">{track.title}</h3>

          <p className="now-playing-artist">
            {track.artist || "Unknown artist"}
          </p>

          <p className="now-playing-album">{track.album || "Unknown album"}</p>

          <p className="now-playing-source">
            {track.source === "bandcamp" ? "Bandcamp" : "Apple Music"}
            {" · "}
            {new Date(track.played_at).toLocaleString()}
          </p>
        </div>
      </div>
    </section>
  );
}
