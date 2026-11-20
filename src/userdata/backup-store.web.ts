import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Bookmark } from './bookmark-types';
import { planMerge, type BackupData, type BackupFile, type BackupSettings, type ChapterHighlightEntry, type MergePlan } from './backup';
import type { Note } from './note-types';

/**
 * Web: reads/writes the backup data in this browser's storage.
 * The storage keys must match highlights.web.ts, bookmarks.web.ts and notes.web.ts.
 */
const HL_PREFIX = 'berean.hl.v1.';
const BM_KEY = 'berean.bm.v1';
const NOTES_KEY = 'berean.notes.v1';

const hlKey = (book: string, chapter: number) => `${HL_PREFIX}${book}.${chapter}`;

/** Backups are available on this platform. */
export const BACKUP_SUPPORTED = true;

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function readBookmarks(): Promise<Bookmark[]> {
  return parseJson<Bookmark[]>(await AsyncStorage.getItem(BM_KEY), []);
}

async function readNotes(): Promise<Note[]> {
  return parseJson<Note[]>(await AsyncStorage.getItem(NOTES_KEY), []);
}

async function readChapterHighlights(book: string, chapter: number): Promise<Record<string, string>> {
  return parseJson<Record<string, string>>(await AsyncStorage.getItem(hlKey(book, chapter)), {});
}

/** Everything that goes into a backup file (settings come from the SettingsProvider). */
export async function collectBackupData(settings: BackupSettings): Promise<BackupData> {
  // Highlights: one storage entry per chapter → berean.hl.v1.JHN.3
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(HL_PREFIX));
  const pairs = keys.length ? await AsyncStorage.multiGet(keys) : [];
  const highlights: ChapterHighlightEntry[] = [];
  for (const [key, raw] of pairs) {
    const [book, ch] = key.slice(HL_PREFIX.length).split('.');
    const chapter = Number(ch);
    const verses = parseJson<Record<string, string>>(raw, {});
    if (book && Number.isInteger(chapter) && Object.keys(verses).length > 0) {
      highlights.push({ book, chapter, verses });
    }
  }

  // Older notes may be missing newer fields — fill them in so the file always checks out.
  const notes = (await readNotes()).map<Note>((n) => ({
    ...n,
    format: n.format === 'markdown' ? 'markdown' : 'plain',
    tags: Array.isArray(n.tags) ? n.tags : [],
    updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : n.createdAt,
  }));

  return { highlights, bookmarks: await readBookmarks(), notes, settings };
}

export type RestoreResult = {
  plan: MergePlan;
  /** Set if saving stopped partway (e.g. browser storage is full); says what did get saved. */
  error: string | null;
};

/**
 * Merge-only restore: adds what's missing, never deletes or changes what's already here.
 * The backup must already have passed parseBackup().
 * Order: highlights → bookmarks → notes, so a failure can say what got saved.
 */
export async function restoreBackup(backup: BackupFile): Promise<RestoreResult> {
  const plan = await planMerge(backup, {
    bookmarks: await readBookmarks(),
    notes: await readNotes(),
    getChapterHighlights: readChapterHighlights,
  });

  const saved: string[] = [];
  try {
    if (plan.highlightWrites.length) {
      await AsyncStorage.multiSet(
        plan.highlightWrites.map((h) => [hlKey(h.book, h.chapter), JSON.stringify(h.verses)] as const),
      );
      saved.push('highlights');
    }
    if (plan.bookmarksToAdd.length) {
      // Re-read right before writing so nothing saved meanwhile is lost.
      await AsyncStorage.setItem(BM_KEY, JSON.stringify([...(await readBookmarks()), ...plan.bookmarksToAdd]));
      saved.push('bookmarks');
    }
    if (plan.notesToAdd.length) {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify([...(await readNotes()), ...plan.notesToAdd]));
      saved.push('notes');
    }
    return { plan, error: null };
  } catch {
    const what = saved.length ? `Your ${saved.join(' and ')} were restored, but the rest` : 'The backup';
    return {
      plan,
      error: `${what} couldn’t be saved — this browser’s storage may be full. Nothing already here was changed.`,
    };
  }
}
