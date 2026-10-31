import { getBook } from './books';

/** [1,2,3,5,7,8] → "1–3, 5, 7–8" */
export function formatVerseList(verses: number[]): string {
  const sorted = [...new Set(verses)].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const v = sorted[i];
    if (v === prev + 1) {
      prev = v;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = v;
    prev = v;
  }
  return parts.join(', ');
}

/** "John 3:16–17" */
export function formatReference(book: string, chapter: number, verses: number[]): string {
  const name = getBook(book)?.name ?? book;
  return verses.length ? `${name} ${chapter}:${formatVerseList(verses)}` : `${name} ${chapter}`;
}

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n: number) => String(n).replace(/\d/g, (d) => SUPERSCRIPT[Number(d)]);

/**
 * Text for copy/share. One verse: just the text. Several: one verse per line with a
 * superscript verse number. Then the reference and version on the last line.
 */
export function formatPassageForSharing(
  book: string,
  chapter: number,
  verseTexts: { verse: number; text: string }[],
  versionAbbr: string,
): string {
  const sorted = [...verseTexts].sort((a, b) => a.verse - b.verse);
  const body =
    sorted.length === 1
      ? sorted[0].text
      : sorted.map(({ verse, text }) => `${sup(verse)} ${text}`).join('\n');
  const ref = formatReference(
    book,
    chapter,
    sorted.map((v) => v.verse),
  );
  return `${body}\n— ${ref} (${versionAbbr})`;
}
