const MAX_VISIBLE_ALBUMS = 12;

export default function AlbumCarousel({ albums }) {
  if (!albums.length) {
    return <p>No albums recorded yet.</p>;
  }

  const visibleAlbums = albums.slice(0, MAX_VISIBLE_ALBUMS);

  // Count recorded plays for every album available to the frontend.
  const getListenCount = (album) => album.tracks?.length ?? 0;

  const maxListens = Math.max(...albums.map(getListenCount), 1);

  function getAlbumSize(album) {
    const listens = getListenCount(album);
    const ratio = listens / maxListens;

    if (ratio >= 0.75) return "large";
    if (ratio >= 0.4) return "medium";
    return "small";
  }

  const latestDate = new Date(albums[0].latestPlayedAt);
  const month = latestDate
    .toLocaleDateString("en-US", { month: "long" })
    .toLowerCase();

  return (
    <section className="archive-composition">
      <header className="composition-heading">
        <h2>{month}</h2>
        <p>{albums.length} albums listened</p>
      </header>

      <div className="composition-field">
        <div className="composition-grid">
          {visibleAlbums.map((album, index) => (
            <article
              className={`composition-album is-${getAlbumSize(album)}`}
              key={album.key}
            >
              <div
                className="composition-cover"
                style={{ animationDelay: `${index * -1.7}s` }}
              >
                {album.artwork && (
                  <img
                    src={album.artwork}
                    alt={`Cover of ${album.album}`}
                    loading="lazy"
                  />
                )}
              </div>

              <div className="composition-meta">
                <p className="composition-artist" title={album.artist}>
                  {album.artist}
                </p>

                <p className="composition-album-title" title={album.album}>
                  {album.album}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
