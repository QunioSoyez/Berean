<p align="center">
  <img src="assets/images/berean_logo_500x500.png" alt="Berean logo" width="180" />
</p>

# Berean

Bible Study App — read and compare Bible versions, highlight, bookmark and take notes.
Everything is stored on your device; no account needed.

**Test web app:** [berean.michaelbarnes0.workers.dev](https://berean.michaelbarnes0.workers.dev)

Built with [Expo](https://expo.dev) (React Native + Expo Router) for iOS, Android and web.

See [FEATURES.md](FEATURES.md) for the feature checklist and build rounds.

## Run it

```bash
npm install
npx expo start
```

Then press `w` for web, or scan the QR code with **Expo Go** on your phone.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the dev server |
| `npm run web` | Start and open in the browser |
| `npm run typecheck` | TypeScript check |
| `npm run build:bibles` | Rebuild the bundled Bible text in `assets/bibles/` |
| `npm run export:web` | Build the static web app into `dist/` |

## Project layout

```
src/app/        Screens (Expo Router — every file is a route)
src/bible/      Bible data: books, versions, loading
src/components/ UI pieces
src/constants/  Theme (colors, fonts, spacing)
src/state/      Saved app state (last position)
src/userdata/   Your data: highlights, bookmarks, notes — SQLite on phones, browser storage on web
assets/bibles/  Bundled Bible text, one .bjson file per book (generated)
scripts/        Build scripts (Bible data)
```

## Web deploy (Cloudflare)

The web version is a Cloudflare Worker serving static files (`wrangler.jsonc`).
Cloudflare rebuilds and deploys it on every push to `main`:

- Build command: `npx expo export --platform web`
- Deploy command: `npx wrangler deploy`

On iPhone, open the link in Safari → Share → **Add to Home Screen** to use it like an app.

## Bible texts

All bundled versions are public domain. Sources are listed in
[assets/bibles/README.md](assets/bibles/README.md).

## License

App code: [MIT](LICENSE). Bundled Bible texts are public domain (see above).
