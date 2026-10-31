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
- [x] Android preview build (EAS) tested on device
- [x] Web test deploy on Cloudflare (auto-deploys on push): https://berean.michaelbarnes0.workers.dev

## Round 2 — Verse selection & highlighting
- [x] Tap verse(s) to select; action bar appears *(PRD)*
- [x] Highlight in 5 colors (yellow, green, blue, pink, orange); remove highlight *(added)*
- [x] Copy / share selected verses with reference (one verse per line, superscript numbers)
- [x] Local storage for user data: SQLite on phones, browser storage on web
- [x] Highlights attach to the verse, so they show in every version
- [x] iPhone "Add to Home Screen" icon for the web app
- [x] Web: Esc clears the selection

## Round 3 — Bookmarks
- [x] Bookmark a verse or several verses from the selection bar *(PRD)*
- [x] Optional name; default name is "Book-Chapter:Verse" (e.g. John-3:16)
- [x] Prevent duplicate bookmarks — same verses show "Bookmarked ✓" and open the edit dialog *(PRD)*
- [x] Small gold marker on bookmarked verses
- [x] Bookmarks list (newest first) with verse preview in the version you're reading
- [x] Tap a bookmark to open it in your current version, scrolled to the verse
- [x] Rename / delete bookmarks (delete asks to confirm) *(PRD)*
- [x] Fix: Psalm 119 stanza headings (KJV/ASV) no longer flip lines right-to-left

## Round 4 — Personal notes
- [x] Add / edit / delete notes on a verse or several verses; many notes per verse *(PRD)*
- [x] Notes show in every version (attached to the verse, like highlights)
- [x] Up to 5 tags per note, with suggestions from tags you've used *(PRD)*
- [x] Note marker (with count) beside verses that have notes
- [x] Notes panel pops out when you tap a marker or "Note": side column on wide screens, slides over on phones
- [x] Notes page (menu): search, filter by tag or book, newest first; tap to open the verse with its notes *(PRD)*
- [ ] Simple formatting in notes (bold, italic, lists) — next up (notes are stored ready for it)

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
- [ ] Production web deploy (custom domain?)
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
