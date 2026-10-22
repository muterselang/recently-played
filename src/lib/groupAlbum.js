export function groupAlbums(tracks) {
  const albums = new Map();

  for (const track of tracks) {
    const albumName = track.album?.trim();
    const artistName = track.artist?.trim();

    // Skip records without an album name.
    if (!albumName) continue;

    // Keep albums from different artists separate.
    const key = `${artistName || "Unknown artist"}::${albumName}`;

    const existingAlbum = albums.get(key);

    if (!existingAlbum) {
      albums.set(key, {
        key,
        album: albumName,
        artist: artistName || "Unknown artist",
        artwork: track.artwork?.[0] || null,
        latestPlayedAt: track.played_at,
        source: track.source,
        tracks: [track],
      });

      continue;
    }

    existingAlbum.tracks.push(track);

    // Keep the timestamp and artwork from the newest record.
    if (new Date(track.played_at) > new Date(existingAlbum.latestPlayedAt)) {
      existingAlbum.latestPlayedAt = track.played_at;
      existingAlbum.artwork = track.artwork?.[0] || existingAlbum.artwork;
      existingAlbum.source = track.source;
    }
  }

  return [...albums.values()].sort(
    (a, b) => new Date(b.latestPlayedAt) - new Date(a.latestPlayedAt)
  );
}
