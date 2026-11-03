#!/usr/bin/env node
/**
 * Builds the bundled Matthew Henry's Concise Commentary.
 *
 *   npm run build:commentary                 (reads ../reference/MHCC.zip)
 *   npm run build:commentary -- path/to/MHCC.zip
 *
 * Source: CrossWire SWORD module "MHCC" (zCom format, public domain), downloaded from
 *   https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/MHCC.zip
 *
 * Output (committed to git):
 *   assets/commentary/mhcc/<BOOK>.bjson    one file per book (format below)
 *   src/commentary/bundled.generated.ts    static require() map for Metro
 *
 * Book file format:
 *   {
 *     intro: Para[],                               // book introduction (may be empty)
 *     chapters: [{                                 // index = chapter - 1
 *       outline: [{ text, verses }],               // "Christ's discourse with Nicodemus." "1-21"
 *       sections: [{ title, start, end, paras }]   // "Verses 1-8", 1, 8, [...]
 *     }]
 *   }
 *   Para = Run[];  Run = string | { t: string, ref: "NUM.21.6-NUM.21.9" }  (USFM book ids)
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(ROOT, process.argv[2] ?? '../reference/MHCC.zip');
const OUT = path.join(ROOT, 'assets', 'commentary', 'mhcc');
const GENERATED = path.join(ROOT, 'src', 'commentary', 'bundled.generated.ts');

// USFM id + OSIS id in canonical order (must match src/bible/books.ts).
const BOOKS = [
  ['GEN', 'Gen'], ['EXO', 'Exod'], ['LEV', 'Lev'], ['NUM', 'Num'], ['DEU', 'Deut'], ['JOS', 'Josh'],
  ['JDG', 'Judg'], ['RUT', 'Ruth'], ['1SA', '1Sam'], ['2SA', '2Sam'], ['1KI', '1Kgs'], ['2KI', '2Kgs'],
  ['1CH', '1Chr'], ['2CH', '2Chr'], ['EZR', 'Ezra'], ['NEH', 'Neh'], ['EST', 'Esth'], ['JOB', 'Job'],
  ['PSA', 'Ps'], ['PRO', 'Prov'], ['ECC', 'Eccl'], ['SNG', 'Song'], ['ISA', 'Isa'], ['JER', 'Jer'],
  ['LAM', 'Lam'], ['EZK', 'Ezek'], ['DAN', 'Dan'], ['HOS', 'Hos'], ['JOL', 'Joel'], ['AMO', 'Amos'],
  ['OBA', 'Obad'], ['JON', 'Jonah'], ['MIC', 'Mic'], ['NAM', 'Nah'], ['HAB', 'Hab'], ['ZEP', 'Zeph'],
  ['HAG', 'Hag'], ['ZEC', 'Zech'], ['MAL', 'Mal'], ['MAT', 'Matt'], ['MRK', 'Mark'], ['LUK', 'Luke'],
  ['JHN', 'John'], ['ACT', 'Acts'], ['ROM', 'Rom'], ['1CO', '1Cor'], ['2CO', '2Cor'], ['GAL', 'Gal'],
  ['EPH', 'Eph'], ['PHP', 'Phil'], ['COL', 'Col'], ['1TH', '1Thess'], ['2TH', '2Thess'], ['1TI', '1Tim'],
  ['2TI', '2Tim'], ['TIT', 'Titus'], ['PHM', 'Phlm'], ['HEB', 'Heb'], ['JAS', 'Jas'], ['1PE', '1Pet'],
  ['2PE', '2Pet'], ['1JN', '1John'], ['2JN', '2John'], ['3JN', '3John'], ['JUD', 'Jude'], ['REV', 'Rev'],
];
const OSIS_TO_USFM = Object.fromEntries(BOOKS.map(([u, o]) => [o, u]));

// ---------------------------------------------------------------------------- zip

/** Minimal zip reader (stored + deflate), enough for SWORD module zips. */
function readZip(file) {
  const buf = fs.readFileSync(file);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error(`${file} is not a zip file`);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(local + 26);
    const lExtraLen = buf.readUInt16LE(local + 28);
    const data = buf.subarray(local + 30 + lNameLen + lExtraLen, local + 30 + lNameLen + lExtraLen + csize);
    files[name] = method === 0 ? data : zlib.inflateRawSync(data);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

// ---------------------------------------------------------------------------- SWORD zCom

/**
 * zCom index: .bzs = blocks (offset, size, uncompressed size), .bzv = one 10-byte entry per
 * verse slot (block, offset, size), .bzz = zlib blocks. Consecutive verses covered by one
 * comment point at the same text.
 */
function readTestament(files, dir, t) {
  const bzs = files[`${dir}${t}.bzs`];
  const bzv = files[`${dir}${t}.bzv`];
  const bzz = files[`${dir}${t}.bzz`];
  const cache = new Map();
  const block = (n) => {
    if (!cache.has(n)) {
      const off = bzs.readUInt32LE(n * 12);
      const size = bzs.readUInt32LE(n * 12 + 4);
      cache.set(n, zlib.inflateSync(bzz.subarray(off, off + size)));
    }
    return cache.get(n);
  };
  const entries = [];
  for (let i = 0; i < bzv.length; i += 10) {
    const b = bzv.readUInt32LE(i);
    const o = bzv.readUInt32LE(i + 4);
    const s = bzv.readUInt16LE(i + 8);
    entries.push({ key: `${b}:${o}:${s}`, text: s ? block(b).subarray(o, o + s).toString('utf8') : '' });
  }
  return entries;
}

// ---------------------------------------------------------------------------- markup → data

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** "Num.21.6-Num.21.9" → "NUM.21.6-NUM.21.9" (unknown books left as-is). */
const toUsfmRef = (osis) =>
  osis.replace(/([1-3]?[A-Za-z]+)\.(?=\d)/g, (m, b) => `${OSIS_TO_USFM[b] ?? b}.`);

/** Split one chapter's markup into a token stream. */
function tokenize(xml) {
  const tokens = [];
  const re =
    /<title type="([\w-]+)">([\s\S]*?)<\/title>|<hi type="bold">([\s\S]*?)<\/hi>|<reference osisRef="([^"]+)">([\s\S]*?)<\/reference>|<row><cell>([\s\S]*?)<\/cell><cell>([\s\S]*?)<\/cell><\/row>|<div[^>]*type="x-p"[^>]*\/>|<[^>]+>/g;
  let last = 0;
  let m;
  const pushText = (s) => {
    if (s) tokens.push({ k: 'text', v: decode(s) });
  };
  while ((m = re.exec(xml))) {
    pushText(xml.slice(last, m.index));
    last = re.lastIndex;
    if (m[1]) tokens.push({ k: 'title', type: m[1], v: decode(m[2].replace(/<[^>]+>/g, '')) });
    else if (m[3] !== undefined) tokens.push({ k: 'bold', v: decode(m[3].replace(/<[^>]+>/g, '')) });
    else if (m[4]) tokens.push({ k: 'ref', ref: toUsfmRef(m[4]), v: decode(m[5].replace(/<[^>]+>/g, '')) });
    else if (m[6] !== undefined) tokens.push({ k: 'row', text: decode(m[6]), verses: decode(m[7]) });
    else if (m[0].includes('type="x-p"')) tokens.push({ k: 'para' });
    // other tags (milestones, tables, introduction divs) carry no content
  }
  pushText(xml.slice(last));
  return tokens;
}

function tidyRuns(runs) {
  // Merge neighbouring strings, collapse whitespace, fix the source's "#(11-13)" artifacts.
  const out = [];
  for (const r of runs) {
    if (typeof r === 'string') {
      const s = r.replace(/#\(/g, '(').replace(/\s+/g, ' ');
      if (typeof out[out.length - 1] === 'string') out[out.length - 1] += s;
      else out.push(s);
    } else out.push(r);
  }
  if (typeof out[0] === 'string') out[0] = out[0].trimStart();
  const end = out.length - 1;
  if (typeof out[end] === 'string') out[end] = out[end].trimEnd();
  return out.filter((r) => r !== '');
}

/** "Verses 1-8" → [1, 8]; "Verse 3" → [3, 3]. */
function parseRange(title) {
  const m = title.match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
  return m ? [Number(m[1]), Number(m[2] ?? m[1])] : null;
}

function buildChapter(tokens, isFirstChapter, verseCount) {
  const intro = [];
  const outline = [];
  const sections = [];
  // Text after the chapter title but before any "Verses …" heading. Short chapters (e.g.
  // Psalm 23) have no heading at all, so this becomes one section for the whole chapter.
  const untitled = [];
  let target = isFirstChapter ? intro : untitled; // book intro comes before "Chapter 1"
  let para = [];
  const flush = () => {
    const runs = tidyRuns(para);
    para = [];
    if (target && runs.length) target.push(runs);
  };
  for (const t of tokens) {
    if (t.k === 'para') flush();
    else if (t.k === 'title') {
      flush();
      // "Chapter N" / "Chapter Outline" titles start the chapter part; anything before was intro.
      if ((t.type === 'x-s2' || t.type === 'x-IS') && !sections.length) target = untitled;
    } else if (t.k === 'row') {
      outline.push({ text: t.text.trim(), verses: t.verses.replace(/[()]/g, '').trim() });
    } else if (t.k === 'bold') {
      const range = parseRange(t.v);
      if (range) {
        flush();
        const s = { title: t.v.trim(), start: range[0], end: range[1], paras: [] };
        sections.push(s);
        target = s.paras;
      } else para.push(t.v);
    } else if (t.k === 'ref') para.push({ t: t.v, ref: t.ref });
    else if (t.k === 'text') para.push(t.v);
  }
  flush();
  if (untitled.length) {
    const whole = { title: verseCount > 1 ? `Verses 1-${verseCount}` : 'Verse 1', start: 1, end: verseCount, paras: untitled };
    if (!sections.length) sections.push(whole);
    else sections[0].paras.unshift(...untitled); // stray lead-in text joins the first section
  }
  return { intro, outline, sections };
}

// ---------------------------------------------------------------------------- main

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Can't find ${SRC}. Download MHCC.zip from CrossWire (see the top of this file).`);
    process.exit(1);
  }
  console.log(`Reading ${SRC}`);
  const files = readZip(SRC);
  const dir = Object.keys(files).find((f) => f.endsWith('ot.bzs')).replace('ot.bzs', '');
  const testaments = { ot: readTestament(files, dir, 'ot'), nt: readTestament(files, dir, 'nt') };

  // Verse counts per chapter come from the bundled KJV (the module uses KJV versification).
  const kjv = (book) =>
    JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'bibles', 'kjv', `${book}.bjson`), 'utf8'));

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  let sectionCount = 0;
  const emptyChapters = [];
  for (const [t, books] of [
    ['ot', BOOKS.slice(0, 39)],
    ['nt', BOOKS.slice(39)],
  ]) {
    const entries = testaments[t];
    let idx = 2; // 0 = module heading, 1 = testament heading
    for (const [book] of books) {
      idx += 1; // book heading
      const chapters = kjv(book);
      const out = { intro: [], chapters: [] };
      chapters.forEach((verses, ci) => {
        idx += 1; // chapter heading
        // Unique comment texts in verse order (several verses share one comment).
        const seen = new Set();
        let xml = '';
        for (let v = 0; v < verses.length; v++) {
          const e = entries[idx + v];
          if (e.text && !seen.has(e.key)) {
            seen.add(e.key);
            xml += ` ${e.text}`;
          }
        }
        idx += verses.length;
        const { intro, outline, sections } = buildChapter(tokenize(xml), ci === 0, verses.length);
        if (ci === 0) out.intro = intro;
        out.chapters.push({ outline, sections });
        sectionCount += sections.length;
        if (!sections.length) emptyChapters.push(`${book} ${ci + 1}`);
      });
      fs.writeFileSync(path.join(OUT, `${book}.bjson`), JSON.stringify(out));
    }
    if (idx !== entries.length) {
      throw new Error(`${t}: index mismatch (used ${idx} of ${entries.length} entries) — versification differs?`);
    }
  }

  const lines = [
    '// AUTO-GENERATED by scripts/build-commentary.mjs — do not edit by hand.',
    "// Matthew Henry's Concise Commentary, one bundled asset per book (see metro.config.js).",
    '',
    'export const BUNDLED_MHCC: Record<string, number> = {',
    ...BOOKS.map(([b]) => `  '${b}': require('../../assets/commentary/mhcc/${b}.bjson'),`),
    '};',
    '',
  ];
  fs.mkdirSync(path.dirname(GENERATED), { recursive: true });
  fs.writeFileSync(GENERATED, lines.join('\n'));

  console.log(`Done: ${BOOKS.length} books, ${sectionCount} sections.`);
  if (emptyChapters.length) {
    console.log(`  ${emptyChapters.length} chapters have no section of their own (covered by a neighbouring chapter's comment):`);
    console.log(`  ${emptyChapters.join(', ')}`);
  }
}

main();
