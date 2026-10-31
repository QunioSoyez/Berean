# Berean — Feature Checklist

Work happens one round at a time. Each round ends with testing on web, iOS and Android, then a commit.

Legend: `[x]` done · `[ ]` to do · *(PRD)* = from the PRD · *(added)* = decided during build

---

## Round 1 — Foundation & reader
- [x] Expo SDK 58 project (Expo Router, TypeScript), one codebase for iOS, Android, web
- [x] App icon, Android adaptive icon, splash screen, web favicon from the Berean logo
- [x] Minimal theme: black text on white, navy/gold from the logo for accents only
- [x] Bundled public-domain texts: KJV, WEB, ASV, YLT *(PRD)* — fully offline
- [x] Data build script (`npm run build:bibles`) so more versions can be added later
- [x] Reader: one verse per line, serif text, verse numbers
- [x] Book & chapter picker with "find a book" filter *(PRD: browse by book/chapter)*
- [x] Version switcher — keeps your place when switching *(PRD)*
- [x] Previous / next chapter (crosses book boundaries)
- [x] Reopens at the last chapter you read
- [x] Web: shareable URLs (`/read/KJV/JHN/3`), left/right arrow keys change chapter

## Round 1b — Landing screen & menu
- [x] Landing screen: centered logo, Bible version selector, Start/Continue reading button
- [x] Landing quick links: Browse books, Bookmarks (coming soon), Search (coming soon)
- [x] Reader: tap the logo (top left) to go home
- [x] Hamburger menu (top right): Bible version, Search, Bookmarks, Settings, About & credits, License
- [x] About & credits page (Bible text sources, privacy) and License page (MIT)
- [x] Placeholder "coming soon" pages for Bookmarks, Search, Settings

## Round 2 — Verse selection & highlighting
- [ ] Tap verse(s) to select; action bar appears *(PRD)*
- [ ] Highlight in a few colors; remove highlight *(added)*
- [ ] Copy / share selected verses with reference
- [ ] Local database for user data (SQLite on phones; web storage decision made here)
- [ ] Highlights stay attached to the verse across all versions

## Round 3 — Bookmarks
- [ ] Add / remove bookmark on a verse or chapter *(PRD)*
- [ ] Prevent duplicate bookmarks *(PRD)*
- [ ] Bookmarks list; tap to jump to passage
- [ ] Edit bookmark label; delete *(PRD)*

## Round 4 — Personal notes
- [ ] Add / edit / delete a note on a verse or range *(PRD)*
- [ ] Tags on notes *(PRD)*
- [ ] Note indicator on verses that have notes
- [ ] Notes list with filter by tag / book, and text search *(PRD)*

## Round 5 — Bible search
- [ ] Keyword search in the current version *(PRD)*
- [ ] Filter by Old/New Testament or book
- [ ] Jump to a typed reference ("John 3:16", "jn 3 16")

## Round 6 — Commentary (Matthew Henry)
- [ ] Commentary framework that supports more public-domain resources later
- [ ] Matthew Henry's Commentary (Complete) bundled *(PRD: preloaded notes)*
- [ ] Commentary indicator on verses/chapters; open in a panel or sheet
- [ ] Room for more: Treasury of Scripture Knowledge, JFB, Geneva notes, etc.

## Round 7 — Compare versions
- [ ] Side-by-side or verse-by-verse comparison of 2+ versions *(PRD)*

## Round 8 — Settings, polish & accessibility
- [ ] Settings screen (in the menu)
- [ ] Text size setting
- [ ] Optional paragraph (flowing) layout
- [ ] Swipe left/right to change chapter on phones
- [ ] First-run tutorial on highlights, bookmarks and notes *(PRD)*
- [ ] Screen reader + keyboard pass on all screens *(PRD)*
- [ ] Graceful handling of local save failures *(PRD)*

## Round 9 — Launch
- [ ] Web deploy to Cloudflare Pages
- [ ] EAS builds; App Store and Google Play listings
- [ ] Privacy policy page (no data collected)

## Later / ideas
- [ ] More public-domain versions (Darby, BBE, Webster, Geneva 1599…)
- [ ] Optional download-on-demand for versions to keep the app small
- [ ] Export / import notes (backup)
- [ ] Optional cloud sync (accounts) — out of MVP scope

## Known data notes
- WEB source has no Psalm titles (superscriptions); KJV/ASV/YLT include them in verse 1.
- Some verses are absent from ASV/WEB by design (e.g. Acts 8:37) — they're simply skipped.
