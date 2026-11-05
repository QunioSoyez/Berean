import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

import { BUNDLED_BIBLES } from './bundled.generated';
import { BUNDLED_NTBT } from './ntbt.generated';
import { readAssetText } from './read-asset-text';

/** A run of heading text; parallel-passage headings can contain links. */
export type HeadingRun = string | { t: string; i?: 1; b?: 1; lang?: string; ref?: string };

/** Heading shown above a verse: major division, section, subsection, or parallel passages. */
export type Heading = { k: 'ms' | 's1' | 's2' | 'r'; t: HeadingRun[] };

/** chapter → verse → headings shown above that verse. */
export type BookHeadings = Record<string, Record<string, Heading[]>>;

/**
 * One book of one version.
 * chapters[chapterIndex][verseIndex] — empty string = verse not in this version.
 */
export type BookText = { chapters: string[][]; headings: BookHeadings };

export type ChapterText = { verses: string[]; headings: Record<string, Heading[]> };

const cache = new Map<string, Promise<BookText>>();

function moduleFor(version: string, book: string): number | undefined {
  if (version === 'NTBT') return BUNDLED_NTBT[book];
  return BUNDLED_BIBLES[version]?.[book];
}

async function fetchBook(version: string, book: string): Promise<BookText> {
  const moduleId = moduleFor(version, book);
  if (moduleId == null) throw new Error(`${version} ${book} is not available`);

  const asset = Asset.fromModule(moduleId);
  if (Platform.OS !== 'web') await asset.downloadAsync();
  const uri = Platform.OS === 'web' ? asset.uri : (asset.localUri ?? asset.uri);
  const data = JSON.parse(await readAssetText(uri)) as string[][] | { v: string[][]; h: BookHeadings };
  // English versions are a bare array of chapters; the NTBT also carries section headings.
  return Array.isArray(data) ? { chapters: data, headings: {} } : { chapters: data.v, headings: data.h ?? {} };
}

/** Loads (and caches in memory) a whole book. */
export function loadBook(version: string, book: string): Promise<BookText> {
  const key = `${version}/${book}`;
  let p = cache.get(key);
  if (!p) {
    p = fetchBook(version, book);
    p.catch(() => cache.delete(key)); // allow retry after a failure
    cache.set(key, p);
  }
  return p;
}

/** Verses and headings of one chapter (1-based chapter number). */
export async function loadChapter(version: string, book: string, chapter: number): Promise<ChapterText> {
  const text = await loadBook(version, book);
  const verses = text.chapters[chapter - 1];
  if (!verses) throw new Error(`${version} ${book} ${chapter} not found`);
  return { verses, headings: text.headings[String(chapter)] ?? {} };
}
