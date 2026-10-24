const MAX_VISIBLE_ALBUMS = 25;

export default function RecentStrip({ albums }) {
  const recentAlbums = albums.slice(0, MAX_VISIBLE_ALBUMS);

  if (!recentAlbums.length) {
    return (
      <section className="recent-strip">
        <div className="recent-strip-heading">
          <h2>RECENTLY PLAYED</h2>
          <p>0 albums</p>
        </div>
      </section>
    );
  }

  return (
    <section className="recent-strip" aria-label="Recently played albums">
      <div className="recent-strip-heading">
        <h2>RECENTLY PLAYED</h2>
        <p>{albums.length} albums</p>
      </div>

      <div className="recent-strip-window">
        <div className="recent-strip-track">
          {[0, 1].map((copy) => (
            <div
              className="recent-strip-group"
              key={copy}
              aria-hidden={copy === 1}
            >
              {recentAlbums.map((album) => (
                <article
                  className="recent-strip-item"
                  key={album.key}
                  title={`${album.artist} — ${album.album}`}
                >
                  {album.sourceUrl && copy === 0 ? (
                    <a
                      className="recent-strip-cover"
                      href={album.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${album.album} by ${album.artist} on ${
                        album.source === "bandcamp" ? "Bandcamp" : "Apple Music"
                      }`}
                    >
                      {album.artwork && (
                        <img
                          src={album.artwork}
                          alt={`Cover of ${album.album}`}
                          loading="lazy"
                        />
                      )}
                    </a>
                  ) : (
                    <div className="recent-strip-cover">
                      {album.artwork && (
                        <img
                          src={album.artwork}
                          alt={copy === 0 ? `Cover of ${album.album}` : ""}
                          loading="lazy"
                        />
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
