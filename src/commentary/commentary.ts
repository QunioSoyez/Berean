import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

import { readAssetText } from '@/bible/read-asset-text';

import { BUNDLED_MHCC } from './bundled.generated';

/** A run of commentary text; cross-references carry a USFM ref like "NUM.21.6-NUM.21.9". */
export type Run = string | { t: string; ref: string };
export type Para = Run[];

export type CommentarySection = { title: string; start: number; end: number; paras: Para[] };
export type CommentaryChapter = {
  outline: { text: string; verses: string }[];
  sections: CommentarySection[];
};
export type BookCommentary = { intro: Para[]; chapters: CommentaryChapter[] };

export const COMMENTARY_NAME = "Matthew Henry's Concise Commentary";

const cache = new Map<string, Promise<BookCommentary>>();

async function fetchBook(book: string): Promise<BookCommentary> {
  const moduleId = BUNDLED_MHCC[book];
  if (moduleId == null) throw new Error(`No commentary for ${book}`);
  const asset = Asset.fromModule(moduleId);
  if (Platform.OS !== 'web') await asset.downloadAsync();
  const uri = Platform.OS === 'web' ? asset.uri : (asset.localUri ?? asset.uri);
  return JSON.parse(await readAssetText(uri)) as BookCommentary;
}

export function loadCommentary(book: string): Promise<BookCommentary> {
  let p = cache.get(book);
  if (!p) {
    p = fetchBook(book);
    p.catch(() => cache.delete(book));
    cache.set(book, p);
  }
  return p;
}

/**
 * The section to show for a verse: the one whose range covers it, otherwise the nearest
 * section that starts before it (some comments run past the range in their heading).
 */
export function sectionForVerse(sections: CommentarySection[], verse: number): number {
  const exact = sections.findIndex((s) => verse >= s.start && verse <= s.end);
  if (exact !== -1) return exact;
  let best = 0;
  sections.forEach((s, i) => {
    if (s.start <= verse) best = i;
  });
  return best;
}

/** "NUM.21.6-NUM.21.9" → { book: 'NUM', chapter: 21, verses: [6, 7, 8, 9] } (single chapter only). */
export function parseRef(ref: string): { book: string; chapter: number; verses: number[] } | null {
  const [from, to] = ref.split('-');
  const a = from.match(/^([1-3]?[A-Z]{2,3})\.(\d+)(?:\.(\d+))?$/);
  if (!a) return null;
  const book = a[1];
  const chapter = Number(a[2]);
  const start = a[3] ? Number(a[3]) : undefined;
  if (start === undefined) return { book, chapter, verses: [] };
  const b = to?.match(/^([1-3]?[A-Z]{2,3})\.(\d+)\.(\d+)$/);
  let end = start;
  if (b && b[1] === book && Number(b[2]) === chapter) end = Math.max(start, Number(b[3]));
  return { book, chapter, verses: Array.from({ length: Math.min(end - start + 1, 200) }, (_, i) => start + i) };
}
