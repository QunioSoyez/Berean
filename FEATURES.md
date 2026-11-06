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
- [x] Web test deploy on Cloudflare (auto-deploys on push)

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
- [x] Formatting toolbar in notes: bold, italic, headings, bulleted and numbered lists, with Write/Preview

## Round 5 — Bible search
- [x] Keyword search across all books of the version you're reading *(PRD)*
- [x] All words must appear (any order); "quotes" for an exact phrase; "love" also finds loved/loveth
- [x] Results show the reference and verse with matches highlighted; tap to open the verse
- [x] Search page in the menu and on the landing screen (replaces "coming soon")

## Round 6 — Commentary (Matthew Henry)
- [x] Matthew Henry's Concise Commentary bundled, works offline *(PRD: preloaded notes)*
- [x] Build script (`npm run build:commentary`) converts the CrossWire MHCC module
- [x] Commentary tab in the pop-out panel (next to My notes); opens from the chapter heading or the selection bar
- [x] Jumps to the section covering the selected verse; chapter outline jumps to sections
- [x] Book introduction ("About Genesis") on chapter 1
- [x] Cross-references in the commentary are tappable and open that passage
- [x] Wide screens: drag the panel's left edge to resize it (remembered; double-click/tap the edge to reset)
- [ ] Room for more: Matthew Henry Complete, Treasury of Scripture Knowledge, JFB, Geneva notes, etc.

## Round 7 — Spanish: NTBT (Nueva Traducción BibliaTodo)
- [x] NTBT text built in (all 66 books) with its section headings, used with permission
- [x] Spanish book names when reading the NTBT (app menus stay English)
- [x] NTBT study edition: "Estudio NTBT" tab replaces Matthew Henry when reading the NTBT — book introductions + a note on every verse, with tappable verse links
- [x] Study notes hosted on bereanbible.live and downloaded per chapter when opened (keeps the app small)
- [x] Official NTBT credit with link under the chapter, in the study tab, and in About & credits (plus edition id and acknowledgments)
- [x] Search ignores accents ("jesus" finds "Jesús")
- [ ] Save downloaded study notes on the phone for offline reading

## Funding — donations & website ads
- [x] Support Berean page (menu + landing link) with Ko-fi and Buy Me a Coffee
- [x] Privacy policy written for Mission CTRL (local-only data, non-personalized website ads, donations)
- [x] About & credits privacy wording updated
- [x] Ad spots ready on Home, Search, Bookmarks, Notes — website only, never in the reader, labeled "Advertisement"
- [ ] Apply for Google AdSense with bereanbible.live
- [ ] After approval: publisher ID + ad slot in src/ads/config.ts, ads.txt in public/
- [ ] In AdSense: block sensitive categories; turn on the EEA/UK consent message

## Round 8 — Settings, tutorial & polish
- [x] Settings screen (in the menu) — saved on each device
- [x] Text size: Small, Medium, Large, Extra large — Bible text, notes and commentary, with a live preview
- [x] First-run tutorial: 4 short cards (select, highlight, bookmark, notes & commentary); skippable, replay from Settings *(PRD)*
- [x] Save failures: clear message every time; highlight changes roll back; a note that can't be saved stays in the editor with its text *(PRD)*
- [x] About page: link to this feature list and the contact email

## Round 9 — Launch
- [x] Web app on its own domain: https://bereanbible.live (www redirects; old workers.dev address off)
- [ ] EAS builds; App Store and Google Play listings
- [x] Privacy policy page (menu → Privacy policy; https://bereanbible.live/privacy)

## Later / ideas
- [ ] Compare versions side by side / verse by verse *(PRD — on hold)*
- [ ] Swipe left/right to change chapter on phones
- [ ] Screen reader + keyboard pass on all screens *(PRD)*
- [ ] Save NTBT study notes on the phone for offline reading (see Round 7)
- [ ] More public-domain versions (Darby, BBE, Webster, Geneva 1599…)
- [ ] Optional download-on-demand for versions to keep the app small
- [ ] Export / import notes (backup)
- [ ] Optional cloud sync (accounts) — out of MVP scope

## Known data notes
- WEB source has no Psalm titles (superscriptions); KJV/ASV/YLT include them in verse 1.
- Some verses are absent from ASV/WEB by design (e.g. Acts 8:37) — they're simply skipped.
