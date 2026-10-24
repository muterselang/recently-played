export default function NowPlaying({ track }) {
  if (!track) {
    return (
      <section className="now-playing">
        <h2 className="now-playing-label">listening now</h2>

        <p className="now-playing-empty">No listening history recorded yet.</p>
      </section>
    );
  }

  const artwork = track.artwork?.[0]?.replace(
    /\/\d+x\d+bb\.jpg(?=\?|$)/,
    "/1000x1000bb.jpg"
  );

  return (
    <section className="now-playing">
      <h2 className="now-playing-label">currently listening to</h2>

      <div className="now-playing-content">
        {track.source_url ? (
          <a
            className="now-playing-cover"
            href={track.source_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${track.album || track.title} on ${
              track.source === "bandcamp" ? "Bandcamp" : "Apple Music"
            }`}
          >
            {artwork && (
              <img
                src={artwork}
                alt={`Cover of ${track.album || track.title}`}
              />
            )}
          </a>
        ) : (
          <div className="now-playing-cover">
            {artwork && (
              <img
                src={artwork}
                alt={`Cover of ${track.album || track.title}`}
              />
            )}
          </div>
        )}

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
