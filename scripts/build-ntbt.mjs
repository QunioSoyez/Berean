#!/usr/bin/env node
/**
 * Builds the NTBT (Nueva Traducción BibliaTodo) Bible text and study notes.
 *
 *   npm run build:ntbt                       (reads ../reference/NTBT-estudio-json.zip)
 *   npm run build:ntbt -- path/to/NTBT-json.zip
 *
 * Source: the NTBT study edition in JSON from BibliaTodo Bible Society
 *   https://cdn.bibliatodo.com/ntbt/estudio/NTBT-json.zip
 * Used with permission under the free NTBT licence; the wording must be kept exactly and
 * the attribution shown (see assets/bibles/ntbt/LICENCIA.txt and CREDITOS.txt).
 *
 * Output (all committed to git):
 *   assets/bibles/ntbt/<BOOK>.bjson        Bible text built into the app:
 *                                           { v: string[][], h: { "<ch>": { "<verse>": Heading[] } } }
 *   assets/bibles/ntbt/*.txt               the licence, credits and readme from the source zip
 *   src/bible/ntbt.generated.ts             require() map, Spanish book names, edition id
 *   public/ntbt-estudio/<BOOK>/intro.json   book introduction  → { blocks }
 *   public/ntbt-estudio/<BOOK>/<ch>.json    study notes        → [{ v, blocks }]
 *     (public/ is published with the website, so the app downloads notes from
 *      https://bereanbible.live/ntbt-estudio/... the first time they're opened)
 *
 * Heading = { k: 'ms' | 's1' | 's2' | 'r', t: Run[] }   (major heading, section, subsection, parallel refs)
 * Block   = { k: 'h2' | 'h3' | 'p' | 'li', n?: number, r: Run[] }
 * Run     = string | { t: string, i?: 1, b?: 1, lang?: string, ref?: "JHN.3.14-JHN.3.15" }
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(ROOT, process.argv[2] ?? '../reference/NTBT-estudio-json.zip');
const TEXT_OUT = path.join(ROOT, 'assets', 'bibles', 'ntbt');
const STUDY_OUT = path.join(ROOT, 'public', 'ntbt-estudio');
const GENERATED = path.join(ROOT, 'src', 'bible', 'ntbt.generated.ts');

// ---------------------------------------------------------------------------- zip

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

// ---------------------------------------------------------------------------- HTML → runs/blocks

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');

const slug = (name) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');

let SLUG_TO_ID = {};
const unknownLinks = new Set();

/** "/biblia/nueva-traduccion-bibliatodo/juan-3-14" + label "Juan 3:14–15" → "JHN.3.14-JHN.3.15" */
function linkRef(href, label) {
  const m = href.match(/\/([a-z0-9]+)-(\d+)(?:-(\d+))?\/?$/);
  if (!m || !SLUG_TO_ID[m[1]]) {
    unknownLinks.add(href);
    return undefined;
  }
  const book = SLUG_TO_ID[m[1]];
  const ch = m[2];
  if (!m[3]) return `${book}.${ch}`;
  const start = Number(m[3]);
  // The label carries the end of the range: "3:14–15", "1:1–3,14" (we take 1–3).
  const lm = label.match(/(\d+):(\d+)\s*[–-]\s*(\d+)(?!\s*:)/);
  const end = lm && Number(lm[1]) === Number(ch) && Number(lm[2]) === start ? Number(lm[3]) : start;
  return end > start ? `${book}.${ch}.${start}-${book}.${ch}.${end}` : `${book}.${ch}.${start}`;
}

/** Parse limited HTML into blocks. Inline: a, em/i, strong/b, bdi. Blocks: h2, h3, p, li (ul/ol). */
function htmlToBlocks(html) {
  const blocks = [];
  let cur = null;
  const style = { i: 0, b: 0, lang: null, href: null };
  let olCount = null; // number of the next <li> in an <ol>, or null in a <ul>
  let linkText = null; // collecting text inside <a>

  const open = (k, n) => {
    cur = { k, r: [] };
    if (n != null) cur.n = n;
    blocks.push(cur);
  };
  const pushText = (text) => {
    if (!text) return;
    if (linkText !== null) {
      linkText += text;
      return;
    }
    if (!cur) open('p');
    const plain = !style.i && !style.b && !style.lang;
    if (plain) cur.r.push(text);
    else {
      const run = { t: text };
      if (style.i) run.i = 1;
      if (style.b) run.b = 1;
      if (style.lang) run.lang = style.lang;
      cur.r.push(run);
    }
  };

  const re = /<(\/?)(\w+)([^>]*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) {
      pushText(decode(m[4]));
      continue;
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const attrs = m[3];
    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'p':
        if (closing) cur = null;
        else open(tag === 'h1' ? 'h2' : tag === 'h4' ? 'h3' : tag);
        break;
      case 'ul':
        olCount = closing ? null : null;
        cur = null;
        break;
      case 'ol':
        olCount = closing ? null : 1;
        cur = null;
        break;
      case 'li':
        if (closing) cur = null;
        else open('li', olCount != null ? olCount++ : undefined);
        break;
      case 'em':
      case 'i':
        style.i += closing ? -1 : 1;
        break;
      case 'strong':
      case 'b':
        style.b += closing ? -1 : 1;
        break;
      case 'bdi':
      case 'span':
        if (closing) style.lang = null;
        else {
          const lang = attrs.match(/lang="([^"]+)"/);
          if (lang) style.lang = lang[1];
        }
        break;
      case 'a':
        if (!closing) {
          style.href = attrs.match(/href="([^"]+)"/)?.[1] ?? null;
          linkText = '';
        } else {
          const label = linkText ?? '';
          linkText = null;
          const ref = style.href ? linkRef(style.href, label) : undefined;
          if (!cur) open('p');
          if (ref) cur.r.push({ t: label, ref });
          else pushText(label);
          style.href = null;
        }
        break;
      case 'br':
        pushText('\n');
        break;
      default:
        break; // unknown tags: keep their text, drop the tag
    }
  }
  // Tidy: merge neighbouring plain strings, trim block edges, drop empty blocks.
  for (const b of blocks) {
    const out = [];
    for (const r of b.r) {
      if (typeof r === 'string' && typeof out[out.length - 1] === 'string') out[out.length - 1] += r;
      else out.push(r);
    }
    if (typeof out[0] === 'string') out[0] = out[0].replace(/^\s+/, '');
    const l = out.length - 1;
    if (typeof out[l] === 'string') out[l] = out[l].replace(/\s+$/, '');
    b.r = out.filter((r) => r !== '');
  }
  return blocks.filter((b) => b.r.length);
}

/** Inline-only HTML (headings, parallel refs) → runs. */
function htmlToRuns(html) {
  return htmlToBlocks(`<p>${html}</p>`).flatMap((b) => b.r);
}

// ---------------------------------------------------------------------------- main

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Can't find ${SRC}. Download the NTBT study edition JSON (see the top of this file).`);
    process.exit(1);
  }
  console.log(`Reading ${SRC}`);
  const files = readZip(SRC);
  const jsonName = Object.keys(files).find((f) => f.toLowerCase().endsWith('.json'));
  const data = JSON.parse(files[jsonName].toString('utf8'));
  if (data.version !== 'NTBT') throw new Error(`Expected NTBT, got ${data.version}`);
  const edition = data.identificacion;

  SLUG_TO_ID = Object.fromEntries(data.libros.map((b) => [slug(b.nombre), b.codigo]));

  for (const dir of [TEXT_OUT, STUDY_OUT]) {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  }
  // Keep the licence, credits and readme with the materials, as the licence asks.
  for (const name of ['LICENCIA.txt', 'CREDITOS.txt', 'LEEME.txt']) {
    if (files[name]) fs.writeFileSync(path.join(TEXT_OUT, name), files[name]);
  }

  let verses = 0;
  let notes = 0;
  let studyBytes = 0;
  const names = {};
  for (const book of data.libros) {
    const id = book.codigo;
    names[id] = book.nombre;
    const v = [];
    const h = {};
    const studyDir = path.join(STUDY_OUT, id);
    fs.mkdirSync(studyDir, { recursive: true });

    if (book.intro) {
      const json = JSON.stringify({ blocks: htmlToBlocks(book.intro) });
      fs.writeFileSync(path.join(studyDir, 'intro.json'), json);
      studyBytes += json.length;
    }

    for (const ch of book.capitulos) {
      const c = Number(ch.numero);
      const texts = [];
      const chapterNotes = [];
      for (const verse of ch.versiculos) {
        const n = Number(verse.numero);
        texts[n - 1] = verse.texto.replace(/\s+/g, ' ').trim();
        verses += 1;
        const heads = [];
        if (verse.encabezado) heads.push({ k: 'ms', t: htmlToRuns(verse.encabezado) });
        if (verse.titulo) heads.push({ k: 's1', t: htmlToRuns(verse.titulo) });
        if (verse.subtitulo) heads.push({ k: 's2', t: htmlToRuns(verse.subtitulo) });
        if (verse.referencias) heads.push({ k: 'r', t: htmlToRuns(verse.referencias) });
        if (heads.length) ((h[c] ??= {})[n] = heads);
        if (verse.nota) {
          chapterNotes.push({ v: n, blocks: htmlToBlocks(verse.nota) });
          notes += 1;
        }
      }
      v[c - 1] = Array.from(texts, (t) => t ?? '');
      const json = JSON.stringify(chapterNotes);
      fs.writeFileSync(path.join(studyDir, `${c}.json`), json);
      studyBytes += json.length;
    }
    fs.writeFileSync(path.join(TEXT_OUT, `${id}.bjson`), JSON.stringify({ v, h }));
  }

  const ids = data.libros.map((b) => b.codigo);
  const lines = [
    '// AUTO-GENERATED by scripts/build-ntbt.mjs — do not edit by hand.',
    '',
    `/** Delivery identifier of the bundled NTBT edition (shown in the credits, as the licence asks). */`,
    `export const NTBT_EDITION = ${JSON.stringify(edition)};`,
    '',
    '/** Spanish book names used by the NTBT, keyed by USFM id. */',
    'export const NTBT_BOOK_NAMES: Record<string, string> = {',
    ...ids.map((id) => `  '${id}': ${JSON.stringify(names[id])},`),
    '};',
    '',
    '/** Bundled NTBT text, one asset per book (see metro.config.js). */',
    'export const BUNDLED_NTBT: Record<string, number> = {',
    ...ids.map((id) => `  '${id}': require('../../assets/bibles/ntbt/${id}.bjson'),`),
    '};',
    '',
  ];
  fs.writeFileSync(GENERATED, lines.join('\n'));

  console.log(`Done: ${edition}, ${ids.length} books, ${verses} verses, ${notes} study notes.`);
  console.log(`  Study notes: ${(studyBytes / 1e6).toFixed(1)} MB in ${path.relative(ROOT, STUDY_OUT)}`);
  if (unknownLinks.size) console.warn(`  ! ${unknownLinks.size} links not recognised, e.g. ${[...unknownLinks].slice(0, 3).join(', ')}`);
}

main();
