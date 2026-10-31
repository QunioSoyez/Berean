#!/usr/bin/env node
/**
 * Builds the bundled Bible text assets.
 *
 *   npm run build:bibles
 *
 * Output (both are committed to git, so this only needs re-running when a
 * version is added or a source is updated):
 *   assets/bibles/<version>/<BOOK>.bjson   one file per book: string[][] (chapters → verses)
 *   src/bible/bundled.generated.ts         static require() map Metro uses to bundle the files
 *
 * Sources (all public domain texts):
 *   KJV, ASV, YLT  github.com/scrollmapper/bible_databases (formats/json)
 *   WEB            npm package `world-english-bible` (devDependency)
 *
 * Downloads are cached in scripts/.cache/ (git-ignored).
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'scripts', '.cache');
const OUT = path.join(ROOT, 'assets', 'bibles');
const GENERATED = path.join(ROOT, 'src', 'bible', 'bundled.generated.ts');
const require = createRequire(import.meta.url);

// USFM ids in canonical order — must match src/bible/books.ts
const BOOK_IDS = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH',
  'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS',
  'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT', 'MRK', 'LUK',
  'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT',
  'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV',
];

// File names in the world-english-bible package, same order as BOOK_IDS
const WEB_FILES = [
  'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth',
  '1samuel', '2samuel', '1kings', '2kings', '1chronicles', '2chronicles', 'ezra', 'nehemiah',
  'esther', 'job', 'psalms', 'proverbs', 'ecclesiastes', 'songofsolomon', 'isaiah', 'jeremiah',
  'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah',
  'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi', 'matthew', 'mark', 'luke',
  'john', 'acts', 'romans', '1corinthians', '2corinthians', 'galatians', 'ephesians',
  'philippians', 'colossians', '1thessalonians', '2thessalonians', '1timothy', '2timothy', 'titus',
  'philemon', 'hebrews', 'james', '1peter', '2peter', '1john', '2john', '3john', 'jude',
  'revelation',
];

const SCROLLMAPPER =
  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json';

/** Per-version text clean-up. Keep this minimal — the goal is faithful text. */
const HEBREW = /[\u0590-\u05FF]/;

const CLEAN = {
  // en dash used inside names (Beth–el) → hyphen; Psalm 119 stanza letters ("נ NUN. …") keep
  // only the English name, since a Hebrew character flips the line to right-to-left layout.
  KJV: (t) => t.replace(/–/g, '-').replace(/^[\u0590-\u05FF]+\s*/, ''),
  ASV: (t) => t,
  YLT: (t) => t.replace(/`/g, "'"), // source uses `quote' style
  WEB: (t) => t,
};

function tidy(t) {
  return t.replace(/\s+/g, ' ').trim();
}

async function cached(name, url) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, name);
  if (!fs.existsSync(file)) {
    console.log(`  downloading ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * ASV puts Psalm 119's next stanza heading at the END of the previous verse
 * ("… utterly. ב BETH."). Move it to the start of the verse it belongs to ("BETH. …"),
 * matching KJV/YLT, and drop the Hebrew letter.
 */
function moveStanzaHeadings(verses) {
  const out = [...verses];
  for (let i = 0; i < out.length; i++) {
    const m = out[i].match(/\s*[\u0590-\u05FF]+\s+([A-Z]+)\.?\s*$/);
    if (m && i + 1 < out.length) {
      out[i] = out[i].slice(0, m.index).trim();
      out[i + 1] = `${m[1]}. ${out[i + 1]}`;
    }
  }
  return out;
}

/** scrollmapper format: { books: [{ name, chapters: [{ chapter, verses: [{ verse, text }] }] }] } */
async function loadScrollmapper(id) {
  const data = await cached(`${id}.json`, `${SCROLLMAPPER}/${id}.json`);
  if (data.books.length !== 66) throw new Error(`${id}: expected 66 books, got ${data.books.length}`);
  return data.books.map((book) => {
    const chapters = [];
    for (const ch of book.chapters) {
      const verses = [];
      for (const v of ch.verses) verses[v.verse - 1] = tidy(CLEAN[id](v.text));
      chapters[ch.chapter - 1] = moveStanzaHeadings(Array.from(verses, (v) => v ?? ''));
    }
    return chapters;
  });
}

/** world-english-bible format: flat array of typed entries; verse text can be split into sections. */
function loadWeb() {
  const dir = path.join(path.dirname(require.resolve('world-english-bible/package.json')), 'json');
  return WEB_FILES.map((file) => {
    const entries = JSON.parse(fs.readFileSync(path.join(dir, `${file}.json`), 'utf8'));
    const chapters = [];
    for (const e of entries) {
      if (typeof e.verseNumber !== 'number' || typeof e.value !== 'string') continue;
      const ch = (chapters[e.chapterNumber - 1] ??= []);
      const i = e.verseNumber - 1;
      ch[i] = ch[i] ? `${ch[i]} ${e.value}` : e.value;
    }
    return Array.from(chapters, (ch) => Array.from(ch ?? [], (v) => tidy(CLEAN.WEB(v ?? ''))));
  });
}

function writeVersion(id, books) {
  const dir = path.join(OUT, id.toLowerCase());
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let verses = 0;
  let empty = 0;
  books.forEach((chapters, i) => {
    for (const ch of chapters) {
      while (ch.length && !ch[ch.length - 1]) ch.pop(); // drop trailing empty slots
      verses += ch.length;
      empty += ch.filter((v) => !v).length;
    }
    fs.writeFileSync(path.join(dir, `${BOOK_IDS[i]}.bjson`), JSON.stringify(chapters));
  });
  const chapterCounts = books.map((b) => b.length);
  console.log(`  ${id}: ${books.length} books, ${verses} verse slots, ${empty} empty`);
  return chapterCounts;
}

function writeGenerated(versionIds) {
  const lines = [
    '// AUTO-GENERATED by scripts/build-bibles.mjs — do not edit by hand.',
    '// Maps version → book → bundled asset module. Metro bundles each .bjson as an asset',
    '// (see metro.config.js), so the text is loaded on demand instead of living in the JS bundle.',
    '',
    'export const BUNDLED_BIBLES: Record<string, Record<string, number>> = {',
  ];
  for (const v of versionIds) {
    lines.push(`  ${v}: {`);
    for (const b of BOOK_IDS) {
      lines.push(`    '${b}': require('../../assets/bibles/${v.toLowerCase()}/${b}.bjson'),`);
    }
    lines.push('  },');
  }
  lines.push('};', '');
  fs.writeFileSync(GENERATED, lines.join('\n'));
}

async function main() {
  console.log('Building Bible assets…');
  const counts = {};
  for (const id of ['KJV', 'ASV', 'YLT']) counts[id] = writeVersion(id, await loadScrollmapper(id));
  counts.WEB = writeVersion('WEB', loadWeb());

  // Every version must have the same chapter count per book as the KJV.
  for (const [id, c] of Object.entries(counts)) {
    c.forEach((n, i) => {
      if (n !== counts.KJV[i]) console.warn(`  ! ${id} ${BOOK_IDS[i]}: ${n} chapters (KJV ${counts.KJV[i]})`);
    });
  }

  writeGenerated(['KJV', 'WEB', 'ASV', 'YLT']);
  // Warn about any Hebrew characters left in verse text (they break left-to-right layout).
  for (const v of ['kjv', 'web', 'asv', 'ylt']) {
    for (const b of BOOK_IDS) {
      const chapters = JSON.parse(fs.readFileSync(path.join(OUT, v, `${b}.bjson`), 'utf8'));
      chapters.forEach((ch, c) =>
        ch.forEach((t, i) => HEBREW.test(t) && console.warn(`  ! ${v} ${b} ${c + 1}:${i + 1} has Hebrew: ${t.slice(0, 50)}`)),
      );
    }
  }
  console.log(`Done. Wrote ${path.relative(ROOT, OUT)} and ${path.relative(ROOT, GENERATED)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
