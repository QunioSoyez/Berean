# Berean

Bible Study App — read and compare Bible versions, highlight, bookmark and take notes.
Everything is stored on your device; no account needed.

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
src/state/      Saved app state (last position, later: user data)
assets/bibles/  Bundled Bible text, one .bjson file per book (generated)
scripts/        Build scripts (Bible data)
```

## Bible texts

All bundled versions are public domain. Sources are listed in
[assets/bibles/README.md](assets/bibles/README.md).

## License

App code: [MIT](LICENSE). Bundled Bible texts are public domain (see above).
