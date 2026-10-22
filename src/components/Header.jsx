export default function Header({ status, trackCount }) {
  return (
    <header className="site-header">
      <a className="site-title" href="/">
        Recently Played<span className="title-period">.</span>
      </a>

      <p className="site-description">A personal listening archive.</p>

      <div className="archive-status">
        <span className="status-label">ARCHIVE STATUS</span>

        <span className="status-value">
          {status === "loading..." && "Loading history…"}
          {status === "success" && `${trackCount} tracks archived`}
          {status === "failed" && "Connection failed"}
        </span>
      </div>
    </header>
  );
}
