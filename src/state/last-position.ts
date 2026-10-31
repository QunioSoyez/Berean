import AsyncStorage from '@react-native-async-storage/async-storage';

import { getBook } from '@/bible/books';
import { DEFAULT_VERSION, getVersion } from '@/bible/versions';

export type Position = { version: string; book: string; chapter: number };

const KEY = 'berean.lastPosition.v1';

export const DEFAULT_POSITION: Position = { version: DEFAULT_VERSION, book: 'GEN', chapter: 1 };

/** Returns the last chapter the reader opened, or Genesis 1 (KJV) the first time. */
export async function getLastPosition(): Promise<Position> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_POSITION;
    const p = JSON.parse(raw) as Partial<Position>;
    const book = getBook(p.book);
    if (!getVersion(p.version) || !book || !p.chapter || p.chapter < 1 || p.chapter > book.chapters) {
      return DEFAULT_POSITION;
    }
    return p as Position;
  } catch {
    return DEFAULT_POSITION;
  }
}

/** True once the reader has opened any chapter (used for "Start" vs "Continue" reading). */
export async function hasSavedPosition(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) != null;
  } catch {
    return false;
  }
}

export async function saveLastPosition(p: Position): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Not critical — worst case the app reopens at the default chapter.
  }
}
