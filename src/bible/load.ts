import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

import { BUNDLED_BIBLES } from './bundled.generated';
import { readAssetText } from './read-asset-text';

/** One book of one version: chapters[chapterIndex][verseIndex]. Empty string = verse not in this version. */
export type BookText = string[][];

const cache = new Map<string, Promise<BookText>>();

async function fetchBook(version: string, book: string): Promise<BookText> {
  const moduleId = BUNDLED_BIBLES[version]?.[book];
  if (moduleId == null) throw new Error(`${version} ${book} is not available`);

  const asset = Asset.fromModule(moduleId);
  if (Platform.OS !== 'web') await asset.downloadAsync();
  const uri = Platform.OS === 'web' ? asset.uri : (asset.localUri ?? asset.uri);
  return JSON.parse(await readAssetText(uri)) as BookText;
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

/** Verses of one chapter (1-based chapter number). */
export async function loadChapter(version: string, book: string, chapter: number): Promise<string[]> {
  const text = await loadBook(version, book);
  const verses = text[chapter - 1];
  if (!verses) throw new Error(`${version} ${book} ${chapter} not found`);
  return verses;
}
