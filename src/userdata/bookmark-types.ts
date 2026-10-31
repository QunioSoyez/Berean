import { getBook } from '@/bible/books';
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

/** Default bookmark name: "John-3:16", "1 John-4:7–8". */
export function defaultBookmarkLabel(book: string, chapter: number, verses: number[]): string {
  const name = getBook(book)?.name ?? book;
  return `${name}-${chapter}:${formatVerseList(verses)}`;
}

export function bookmarkTitle(b: Bookmark): string {
  return b.label ?? defaultBookmarkLabel(b.book, b.chapter, b.verses);
}

/** Empty or whitespace-only names mean "use the default". */
export function cleanLabel(label: string | null | undefined): string | null {
  const t = label?.trim();
  return t ? t : null;
}
