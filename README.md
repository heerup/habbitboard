# Habitboard

Minimal, static habit board with weekly rows and 7 day toggles per row. Data is stored locally in the browser using `localStorage`.

## Features

- ISO weeks (Mon–Sun) with `YYYY · WNN` labels
- 7-wide grid, each row is one week
- Tap to toggle a day; state persists locally
- Starts at the current week; scroll down to load older weeks (infinite)
- Mobile-first layout optimized for smartphone portrait
- PWA manifest + offline cache (installable)
- Multiple tabs: create and name separate boards; rename without data loss

## Local Development

Open `index.html` in your browser. No build step or dependencies.

## Deploy to GitHub Pages

Option A: Pages from root (recommended)

1. Commit these files to your repo `main` branch
2. In GitHub: Settings → Pages → Build and deployment:
   - Source: `Deploy from a branch`
   - Branch: `main` / `/ (root)`
3. Save. GitHub will publish at `https://<user>.github.io/<repo>/`.

Option B: `gh-pages` branch

1. Create a `gh-pages` branch containing the same files
2. Settings → Pages → Source: `gh-pages` / `/ (root)`

## Notes

- Weeks load backwards in time as you scroll down.
- The “Today” button jumps to the current week (top of list).
- Storage key: `habitboard:v1`. Clearing site data resets the board.
- PWA: After first visit, you can Install/Add to Home Screen. Service worker caches core files for offline.
-
  Tabs are stored with stable IDs; renaming a tab only changes its label. Data is versioned under `habitboard:v2` and migrates automatically from legacy `v1` on first run.
