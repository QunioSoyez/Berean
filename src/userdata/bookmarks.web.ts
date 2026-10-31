import AsyncStorage from '@react-native-async-storage/async-storage';

import { cleanLabel, normalizeVerses, versesKey, type Bookmark } from './bookmark-types';

/**
 * Web: all bookmarks in one browser-storage entry (a small list).
 * Data stays in this browser on this device; clearing site data removes it.
 */
const KEY = 'berean.bm.v1';

async function readAll(): Promise<Bookmark[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Bookmark[]) : [];
}

async function writeAll(list: Bookmark[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

/** All bookmarks, newest first. */
export async function listBookmarks(): Promise<Bookmark[]> {
  return (await readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getChapterBookmarks(book: string, chapter: number): Promise<Bookmark[]> {
  return (await listBookmarks()).filter((b) => b.book === book && b.chapter === chapter);
}

/** Adds a bookmark. If one already exists for exactly these verses, just updates its name. */
export async function saveBookmark(
  book: string,
  chapter: number,
  verses: number[],
  label: string | null,
): Promise<void> {
  const list = await readAll();
  const key = versesKey(verses);
  const existing = list.find(
    (b) => b.book === book && b.chapter === chapter && versesKey(b.verses) === key,
  );
  if (existing) {
    existing.label = cleanLabel(label);
  } else {
    list.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      book,
      chapter,
      verses: normalizeVerses(verses),
      label: cleanLabel(label),
      createdAt: Date.now(),
    });
  }
  await writeAll(list);
}

export async function renameBookmark(id: string, label: string | null): Promise<void> {
  const list = await readAll();
  const b = list.find((x) => x.id === id);
  if (b) {
    b.label = cleanLabel(label);
    await writeAll(list);
  }
}

export async function deleteBookmark(id: string): Promise<void> {
  await writeAll((await readAll()).filter((b) => b.id !== id));
}
