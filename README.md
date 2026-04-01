# Skatetrax Frontend

React-based UI for Skatetrax, built with Vite.

## Stack

- **React 19** with React Router 7
- **Vite 6** (dev server and production build)
- **React-Bootstrap 2** + Bootstrap 5
- **Chart.js 4** via react-chartjs-2
- **Day.js** for date formatting

## Development

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:3000` and proxies `/api` requests to `http://127.0.0.1:5000` (the Flask backend).

## Production Build

```bash
npm run build
```

Output goes to `dist/`. The `VITE_API_BASE_URL` env var sets the API base URL at build time (defaults to `http://<hostname>:5000/api/v4`).

## Pages

| Route | Auth | Description |
|---|---|---|
| `/login` | No | Login page |
| `/dashboard` | Yes | Overview dashboard with charts |
| `/skater_overview` | Yes | Profile, preferences, share controls |
| `/skater_card` | Yes | Skater Card -- resume-style stats summary |
| `/ice_time` | Yes | Session history, calendar, financial overview |
| `/equipment/configs` | Yes | Equipment configurations |
| `/equipment/maintenance` | Yes | Blade maintenance tracking |
| `/performances/competitions` | Yes | Competition results and history |
| `/performances/exhibitions` | Yes | Exhibition and showcase history |
| `/performances/music` | Yes | Music library -- tracks, playlists, sharing |
| `/add-session` | Yes | Mobile-friendly session entry |
| `/shared/playlist/:token` | No | Public shared playlist page |
| `/shared/card/:token` | No | Public shared skater card |

## CI

PRs to `dev`/`main` trigger validation: `npm ci`, `npm audit` (report only), and a production build check.

Pushes to `main` build and push the Docker image to Docker Hub via `build-push.yml`.
