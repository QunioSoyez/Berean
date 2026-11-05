import { BOOKS } from './books';
import { loadBook } from './load';

export type SearchHit = { book: string; chapter: number; verse: number; text: string };

export type SearchResult = {
  hits: SearchHit[];
  /** Total matches (hits may be capped at MAX_RESULTS). */
  total: number;
  /** Words to highlight in the results. */
  terms: string[];
};

export const MAX_RESULTS = 1000;

/**
 * Lowercase, straight quotes, and accents removed (á→a, ñ→n) so "jesus" finds "Jesús".
 * Works character by character so the result has the same length as the input, which
 * keeps highlight positions lined up with the original text.
 */
function normalize(s: string): string {
  let out = '';
  for (const ch of s.toLowerCase()) {
    if (ch === '‘' || ch === '’' || ch === '`') out += "'";
    else if (ch === '“' || ch === '”') out += '"';
    else {
      const base = ch.normalize('NFD')[0];
      out += ch.length === 1 && base ? base : ch;
    }
  }
  return out;
}

const isWordChar = (c: string | undefined) => !!c && /[a-z0-9æ]/.test(c);

/**
 * Split a query into terms. "Quoted phrases" stay together; other words are separate.
 * Every term must appear in the verse (in any order).
 */
export function parseQuery(query: string): string[] {
  const terms: string[] = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m: RegExpExecArray | null;
  const q = normalize(query);
  while ((m = re.exec(q))) {
    const t = (m[1] ?? m[2]).replace(/^[^a-z0-9'æ]+|[^a-z0-9'æ]+$/g, '').trim();
    // (the query was normalized above, so accented letters are already plain)
    if (t) terms.push(t);
  }
  return [...new Set(terms)];
}

/**
 * Every place `term` appears at the start of a word in already-normalized text, so "love"
 * finds "love", "loved", "loveth" but not "glove".
 */
function wordStartMatches(norm: string, term: string): number[] {
  const out: number[] = [];
  let i = norm.indexOf(term);
  while (i !== -1) {
    if (!isWordChar(norm[i - 1])) out.push(i);
    i = norm.indexOf(term, i + 1);
  }
  return out;
}

function hasWordStart(norm: string, term: string): boolean {
  let i = norm.indexOf(term);
  while (i !== -1) {
    if (!isWordChar(norm[i - 1])) return true;
    i = norm.indexOf(term, i + 1);
  }
  return false;
}

/** Search every verse of one version. Loads books as needed (cached after the first search). */
export async function searchBible(
  version: string,
  query: string,
  onProgress?: (loadedBooks: number, totalBooks: number) => void,
): Promise<SearchResult> {
  const terms = parseQuery(query);
  if (!terms.length) return { hits: [], total: 0, terms };

  const hits: SearchHit[] = [];
  let total = 0;
  let loaded = 0;
  // Load in small batches so phones don't read all 66 files at once.
  for (let i = 0; i < BOOKS.length; i += 8) {
    const batch = BOOKS.slice(i, i + 8);
    const texts = await Promise.all(batch.map((b) => loadBook(version, b.id)));
    texts.forEach(({ chapters }, bi) => {
      const book = batch[bi].id;
      chapters.forEach((verses, ci) => {
        verses.forEach((text, vi) => {
          if (!text) return;
          const n = normalize(text);
          if (terms.every((t) => hasWordStart(n, t))) {
            total += 1;
            if (hits.length < MAX_RESULTS) hits.push({ book, chapter: ci + 1, verse: vi + 1, text });
          }
        });
      });
    });
    loaded += batch.length;
    onProgress?.(loaded, BOOKS.length);
  }
  return { hits, total, terms };
}

/** Split verse text into plain and matching parts for highlighting. */
export function splitForHighlight(text: string, terms: string[]): { text: string; match: boolean }[] {
  if (!terms.length) return [{ text, match: false }];
  const norm = normalize(text); // same length as text (1:1 character replacements)
  const ranges: [number, number][] = [];
  for (const t of terms) {
    for (const i of wordStartMatches(norm, t)) {
      // Highlight the whole word ("loveth", not just "love").
      let end = i + t.length;
      while (isWordChar(norm[end])) end += 1;
      ranges.push([i, end]);
    }
  }
  if (!ranges.length) return [{ text, match: false }];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  const parts: { text: string; match: boolean }[] = [];
  let pos = 0;
  for (const [s, e] of merged) {
    if (s > pos) parts.push({ text: text.slice(pos, s), match: false });
    parts.push({ text: text.slice(s, e), match: true });
    pos = e;
  }
  if (pos < text.length) parts.push({ text: text.slice(pos), match: false });
  return parts;
}
