const MAX_VISIBLE_ALBUMS = 10;

export default function RecentStrip({ albums }) {
  const recentAlbums = albums.slice(0, MAX_VISIBLE_ALBUMS);

  return (
    <section className="recent-strip" aria-label="Recently played albums">
      <div className="recent-strip-heading">
        <h2>RECENTLY PLAYED (PREVIOUSLY)</h2>
        <p>{albums.length} albums</p>
      </div>

      <div className="recent-strip-list">
        {recentAlbums.map((album) => (
          <article
            className="recent-strip-item"
            key={album.key}
            title={`${album.artist} — ${album.album}`}
          >
            <div className="recent-strip-cover">
              {album.artwork && (
                <img
                  src={album.artwork}
                  alt={`Cover of ${album.album}`}
                  loading="lazy"
                />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
