import { bookName } from '@/bible/books';
import { formatVerseList } from '@/bible/reference';

export type Bookmark = {
  id: string;
  book: string;
  chapter: number;
  /** Sorted, unique verse numbers. */
  verses: number[];
  /** User-given name, or null to use the default ("John-3:16"). */
  label: string | null;
  createdAt: number;
};

export function normalizeVerses(verses: number[]): number[] {
  return [...new Set(verses)].sort((a, b) => a - b);
}

export const versesKey = (verses: number[]) => normalizeVerses(verses).join(',');

/** Default bookmark name: "John-3:16", "1 John-4:7–8" ("Juan-3:16" when reading the NTBT). */
export function defaultBookmarkLabel(
  book: string,
  chapter: number,
  verses: number[],
  version?: string,
): string {
  const name = bookName(book, version);
  return `${name}-${chapter}:${formatVerseList(verses)}`;
}

export function bookmarkTitle(b: Bookmark, version?: string): string {
  return b.label ?? defaultBookmarkLabel(b.book, b.chapter, b.verses, version);
}

/** Empty or whitespace-only names mean "use the default". */
export function cleanLabel(label: string | null | undefined): string | null {
  const t = label?.trim();
  return t ? t : null;
}
