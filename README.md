# Recently Played

A personal listening archive for music played on Apple Music and Bandcamp.

**Recently Played** is a small web project that collects listening activity from music platforms and stores it in a personal database. The project combines a browser extension, a lightweight API, and a custom frontend to build a chronological archive of tracks.

Rather than focusing on charts, rankings, or listening statistics, the project treats listening history as an ongoing personal collection.

## Features

- Collect track metadata from Apple Music Web.
- Collect track metadata from Bandcamp.
- Store listening records in Supabase.
- Send collected data through a Cloudflare Worker.
- Display listening history in a React frontend.
- Automatically refresh the archive while the page is open.
- Preserve track metadata, artwork, timestamps, and source platform.

## Tech Stack

| Layer             | Technology                                         |
| ----------------- | -------------------------------------------------- |
| Frontend          | React, Vite                                        |
| Styling           | CSS                                                |
| Browser collector | Chrome Extension, Manifest V3                      |
| API               | Cloudflare Workers                                 |
| Database          | Supabase                                           |
| Deployment        | GitHub, Netlify or another static hosting provider |

## Architecture

```text
Apple Music Web ──┐
                  ├──> Chrome Extension
Bandcamp ─────────┘           │
                              ▼
                       Cloudflare Worker
                              │
                              ▼
                           Supabase
                              │
                              ▼
                        React Frontend
                              │
                              ▼
                      Listening Archive
```

The browser extension collects track metadata from supported music pages and sends it to the Worker. The Worker validates incoming requests and inserts records into Supabase. The frontend reads the stored records and presents them as a chronological list.

## Project Structure

```text
recently-played/
├── extension/
│   ├── manifest.json
│   ├── content.js
│   ├── bandcamp.js
│   └── config.js          # Local configuration; not committed
├── src/
│   ├── components/
│   ├── lib/
│   │   └── supabase.js
│   ├── styles/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.local             # Local environment variables; not committed
├── .nvmrc
├── .gitignore
├── index.html
├── package.json
└── README.md
```

Some frontend folders may still be under development.

## Getting Started

### Requirements

- Node.js compatible with the project configuration.
- npm.
- A Supabase project.
- A Cloudflare account for the ingestion Worker.
- Google Chrome or another Chromium-based browser for the extension.

### 1. Clone the repository

```bash
git clone https://github.com/muterselang/recently-played.git
cd recently-played
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Supabase

Create a `.env.local` file in the project root and add the public Supabase project URL and publishable key used by the frontend:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

Use the exact environment variable names expected by `src/lib/supabase.js`. Do not commit `.env.local` or place a Supabase secret key in frontend code.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your browser.

### 5. Configure the browser extension

The extension uses a local `extension/config.js` file for the Worker endpoint and ingestion token. Create this file using the configuration expected by the collector scripts.

Keep the file local and out of version control.

To load the extension in Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the project's `extension/` directory.
5. Open a supported Apple Music or Bandcamp page and play a track.

After changing extension files, reload the extension from the Chrome extensions page.

## Database

The project uses a Supabase table named `public.listens`.

| Column       | Purpose                                              |
| ------------ | ---------------------------------------------------- |
| `id`         | Record identifier                                    |
| `title`      | Track title                                          |
| `artist`     | Artist name                                          |
| `album`      | Album or release title                               |
| `artwork`    | Artwork URLs                                         |
| `played_at`  | Listening timestamp                                  |
| `created_at` | Record creation timestamp                            |
| `source`     | Source platform, such as `apple-music` or `bandcamp` |

The frontend queries recent records ordered by `played_at`, newest first.

Configure appropriate Row Level Security policies for the database. The public frontend should only have the access it needs to read archive records.

## Security Notes

- Never commit `.env.local` or `extension/config.js`.
- Never expose the Supabase secret key in frontend code.
- Validate ingestion requests in the Cloudflare Worker.
- Keep the ingestion token private.
- A token embedded in a locally installed browser extension can be extracted by someone with access to the extension files. The current approach is intended for personal use, not as a secure public ingestion service.
- Review database permissions before making the archive publicly accessible.

## Design Direction

The interface is being developed as an editorial index rather than a conventional music dashboard.

The visual direction emphasizes:

- Minimal typography and restrained color.
- Structured grids and thin rules.
- Compact track metadata.
- Album artwork as supporting material.
- A chronological, continuously growing archive.

## Status

**In development.**

The collection pipeline for Apple Music and Bandcamp is working. The frontend's editorial layout and styling are still being developed.

## License

No license has been specified yet. All rights remain with their respective owners unless a license is added to this repository.
