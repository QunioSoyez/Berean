import { getBook } from '@/bible/books';

import { normalizeVerses, versesKey, type Bookmark } from './bookmark-types';
import { HIGHLIGHT_COLORS } from './highlight-colors';
import { cleanTags, MAX_TAG_LENGTH, MAX_TAGS, type Note } from './note-types';

/**
 * Backup file format — platform-neutral so the phone apps can read/write the same file later.
 * Everything is keyed by USFM book id + chapter + verse (never by storage keys) and holds
 * references only, never Bible text.
 *
 *   { app: "berean", format: 1, exportedAt: "2026-11-19T…Z",
 *     data: { highlights: [{ book: "JHN", chapter: 3, verses: { "16": "yellow" } }],
 *             bookmarks: Bookmark[], notes: Note[],
 *             settings: { textSize, tutorialSeen, dataNoticeSeen } } }
 *
 * Imported files are untrusted: parseBackup() checks everything and returns an error
 * before anything is saved.
 */

export const BACKUP_APP = 'berean';
export const BACKUP_FORMAT = 1;

// Limits for imported files (anything over → the whole file is rejected).
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_NOTES = 10_000;
const MAX_BOOKMARKS = 10_000;
const MAX_HIGHLIGHT_VERSES = 50_000;
const MAX_NOTE_BODY = 50_000;
const MAX_LABEL = 200;
const MAX_ID = 100;
/** Psalm 119 (176 verses) is the longest chapter. */
const MAX_VERSE = 176;

const TEXT_SIZE_IDS = ['small', 'medium', 'large', 'xlarge'] as const;
type BackupTextSize = (typeof TEXT_SIZE_IDS)[number];

/** Highlights for one chapter: verse number (as a string) → color id. */
export type ChapterHighlightEntry = { book: string; chapter: number; verses: Record<string, string> };

export type BackupSettings = {
  textSize?: BackupTextSize;
  tutorialSeen?: boolean;
  dataNoticeSeen?: boolean;
};

export type BackupData = {
  highlights: ChapterHighlightEntry[];
  bookmarks: Bookmark[];
  notes: Note[];
  settings: BackupSettings;
};

export type BackupFile = {
  app: typeof BACKUP_APP;
  format: typeof BACKUP_FORMAT;
  /** ISO 8601 time the file was made. */
  exportedAt: string;
  data: BackupData;
};

export function makeBackup(data: BackupData, now = new Date()): BackupFile {
  return { app: BACKUP_APP, format: BACKUP_FORMAT, exportedAt: now.toISOString(), data };
}

/** "berean-backup-2026-11-19.json" (local date). */
export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `berean-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

export type BackupSummary = {
  bookmarks: number;
  notes: number;
  /** Highlighted verses (not chapters). */
  highlights: number;
  exportedAt: Date | null;
};

export function summarizeBackup(b: BackupFile): BackupSummary {
  const d = new Date(b.exportedAt);
  return {
    bookmarks: b.data.bookmarks.length,
    notes: b.data.notes.length,
    highlights: b.data.highlights.reduce((n, h) => n + Object.keys(h.verses).length, 0),
    exportedAt: b.exportedAt && !Number.isNaN(d.getTime()) ? d : null,
  };
}

// ---------- validation ----------

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string };

class BadFile extends Error {}

const fail = (msg: string): never => {
  throw new BadFile(msg);
};

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x);

const isTime = (x: unknown): x is number =>
  typeof x === 'number' && Number.isFinite(x) && x >= 0 && x < 8.64e15;

function checkId(x: unknown, what: string): string {
  if (typeof x !== 'string' || x.length === 0 || x.length > MAX_ID) fail(`${what} has a missing or invalid id.`);
  return x as string;
}

function checkRef(book: unknown, chapter: unknown, what: string): { book: string; chapter: number } {
  const b = typeof book === 'string' ? getBook(book) : undefined;
  if (!b) fail(`${what} has an unknown book.`);
  if (!isInt(chapter) || chapter < 1 || chapter > b!.chapters) fail(`${what} has an invalid chapter.`);
  return { book: b!.id, chapter: chapter as number };
}

function checkVerse(v: unknown, what: string): number {
  if (!isInt(v) || v < 1 || v > MAX_VERSE) fail(`${what} has an invalid verse number.`);
  return v as number;
}

function checkVerses(x: unknown, what: string): number[] {
  if (!Array.isArray(x) || x.length === 0 || x.length > MAX_VERSE) fail(`${what} has invalid verses.`);
  return normalizeVerses((x as unknown[]).map((v) => checkVerse(v, what)));
}

const COLOR_IDS = new Set<string>(HIGHLIGHT_COLORS.map((c) => c.id));

function checkHighlights(x: unknown): ChapterHighlightEntry[] {
  if (!Array.isArray(x)) fail('The highlights list is missing or damaged.');
  // Merge entries for the same chapter (a hand-edited file might repeat one).
  const byChapter = new Map<string, ChapterHighlightEntry>();
  let total = 0;
  for (const item of x as unknown[]) {
    if (!isObj(item) || !isObj(item.verses)) fail('A highlight entry is damaged.');
    const it = item as Record<string, unknown>;
    const ref = checkRef(it.book, it.chapter, 'A highlight');
    const k = `${ref.book}.${ref.chapter}`;
    const entry = byChapter.get(k) ?? { ...ref, verses: {} };
    for (const [vs, color] of Object.entries(it.verses as Record<string, unknown>)) {
      // Keys must be plain whole numbers ("16", not "016" or "16.5").
      const v = String(Number(vs)) === vs ? Number(vs) : NaN;
      checkVerse(v, 'A highlight');
      if (typeof color !== 'string' || !COLOR_IDS.has(color)) fail('A highlight has an unknown color.');
      if (!(vs in entry.verses)) total++;
      entry.verses[vs] = color as string;
    }
    byChapter.set(k, entry);
    if (total > MAX_HIGHLIGHT_VERSES) fail(`The file has more than ${MAX_HIGHLIGHT_VERSES.toLocaleString()} highlighted verses.`);
  }
  return [...byChapter.values()].filter((e) => Object.keys(e.verses).length > 0);
}

function checkBookmarks(x: unknown): Bookmark[] {
  if (!Array.isArray(x)) fail('The bookmarks list is missing or damaged.');
  if ((x as unknown[]).length > MAX_BOOKMARKS) fail(`The file has more than ${MAX_BOOKMARKS.toLocaleString()} bookmarks.`);
  return (x as unknown[]).map((item) => {
    if (!isObj(item)) fail('A bookmark is damaged.');
    const it = item as Record<string, unknown>;
    const label = it.label;
    if (label !== null && label !== undefined && (typeof label !== 'string' || label.length > MAX_LABEL))
      fail(`A bookmark name is too long (over ${MAX_LABEL} characters) or invalid.`);
    if (!isTime(it.createdAt)) fail('A bookmark has an invalid date.');
    const trimmed = typeof label === 'string' ? label.trim() : '';
    return {
      id: checkId(it.id, 'A bookmark'),
      ...checkRef(it.book, it.chapter, 'A bookmark'),
      verses: checkVerses(it.verses, 'A bookmark'),
      label: trimmed ? trimmed : null,
      createdAt: it.createdAt as number,
    };
  });
}

function checkNotes(x: unknown): Note[] {
  if (!Array.isArray(x)) fail('The notes list is missing or damaged.');
  if ((x as unknown[]).length > MAX_NOTES) fail(`The file has more than ${MAX_NOTES.toLocaleString()} notes.`);
  return (x as unknown[]).map((item) => {
    if (!isObj(item)) fail('A note is damaged.');
    const it = item as Record<string, unknown>;
    if (typeof it.body !== 'string' || it.body.length > MAX_NOTE_BODY)
      fail(`A note is too long (over ${MAX_NOTE_BODY.toLocaleString()} characters) or invalid.`);
    if (it.format !== 'plain' && it.format !== 'markdown') fail('A note has an unknown format.');
    const tags = it.tags ?? [];
    if (!Array.isArray(tags) || tags.length > MAX_TAGS) fail(`A note has more than ${MAX_TAGS} tags.`);
    for (const t of tags as unknown[]) {
      if (typeof t !== 'string' || t.length > MAX_TAG_LENGTH) fail(`A note tag is longer than ${MAX_TAG_LENGTH} characters.`);
    }
    if (!isTime(it.createdAt) || !isTime(it.updatedAt)) fail('A note has an invalid date.');
    return {
      id: checkId(it.id, 'A note'),
      ...checkRef(it.book, it.chapter, 'A note'),
      verses: checkVerses(it.verses, 'A note'),
      body: it.body as string,
      format: it.format as Note['format'],
      tags: cleanTags(tags as string[]),
      createdAt: it.createdAt as number,
      updatedAt: it.updatedAt as number,
    };
  });
}

function checkSettings(x: unknown): BackupSettings {
  if (x === undefined) return {};
  if (!isObj(x)) fail('The settings section is damaged.');
  const s = x as Record<string, unknown>;
  const out: BackupSettings = {};
  if (s.textSize !== undefined) {
    if (!TEXT_SIZE_IDS.includes(s.textSize as BackupTextSize)) fail('The text size setting is invalid.');
    out.textSize = s.textSize as BackupTextSize;
  }
  if (s.tutorialSeen !== undefined) out.tutorialSeen = s.tutorialSeen === true;
  if (s.dataNoticeSeen !== undefined) out.dataNoticeSeen = s.dataNoticeSeen === true;
  return out;
}

/** Parses and checks a backup file's text. Nothing is saved here. */
export function parseBackup(text: string): ParseResult {
  if (text.length > MAX_FILE_BYTES) return { ok: false, error: 'That file is too big to be a Berean backup (over 5 MB).' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file isn’t a Berean backup (it couldn’t be read as JSON).' };
  }
  try {
    if (!isObj(raw) || raw.app !== BACKUP_APP) fail('That file isn’t a Berean backup.');
    const r = raw as Record<string, unknown>;
    if (r.format !== BACKUP_FORMAT) fail('This backup was made by a newer or unknown version of Berean.');
    if (!isObj(r.data)) fail('The backup’s data section is missing.');
    const d = r.data as Record<string, unknown>;
    const exportedAt = typeof r.exportedAt === 'string' ? r.exportedAt : '';
    return {
      ok: true,
      backup: {
        app: BACKUP_APP,
        format: BACKUP_FORMAT,
        exportedAt, // shown only if it's a real date (see summarizeBackup)
        data: {
          highlights: checkHighlights(d.highlights ?? []),
          bookmarks: checkBookmarks(d.bookmarks ?? []),
          notes: checkNotes(d.notes ?? []),
          settings: checkSettings(d.settings),
        },
      },
    };
  } catch (e) {
    if (e instanceof BadFile) return { ok: false, error: `${e.message} Nothing was restored.` };
    return { ok: false, error: 'That backup file couldn’t be read. Nothing was restored.' };
  }
}

// ---------- merge (restore is merge-only: nothing on the device is deleted or changed) ----------

export type MergePlan = {
  /** Chapters whose highlights change: the FULL new map for each (existing + added verses). */
  highlightWrites: ChapterHighlightEntry[];
  /** Bookmarks/notes to append. */
  bookmarksToAdd: Bookmark[];
  notesToAdd: Note[];
  added: { bookmarks: number; notes: number; highlights: number };
  skipped: { bookmarks: number; notes: number; highlights: number };
};

export type ExistingData = {
  bookmarks: Bookmark[];
  notes: Note[];
  /** Current highlights for a chapter (verse → color). */
  getChapterHighlights: (book: string, chapter: number) => Promise<Record<string, string>>;
};

export async function planMerge(backup: BackupFile, existing: ExistingData): Promise<MergePlan> {
  const { data } = backup;
  const added = { bookmarks: 0, notes: 0, highlights: 0 };
  const skipped = { bookmarks: 0, notes: 0, highlights: 0 };

  // Bookmarks: skip same id, or a bookmark already on the same verses (also within the file).
  const bmIds = new Set(existing.bookmarks.map((b) => b.id));
  const bmVerses = new Set(existing.bookmarks.map((b) => `${b.book}.${b.chapter}:${versesKey(b.verses)}`));
  const bookmarksToAdd: Bookmark[] = [];
  for (const b of data.bookmarks) {
    const vk = `${b.book}.${b.chapter}:${versesKey(b.verses)}`;
    if (bmIds.has(b.id) || bmVerses.has(vk)) {
      skipped.bookmarks++;
      continue;
    }
    bmIds.add(b.id);
    bmVerses.add(vk);
    bookmarksToAdd.push(b);
    added.bookmarks++;
  }

  // Notes: skip same id.
  const noteIds = new Set(existing.notes.map((n) => n.id));
  const notesToAdd: Note[] = [];
  for (const n of data.notes) {
    if (noteIds.has(n.id)) {
      skipped.notes++;
      continue;
    }
    noteIds.add(n.id);
    notesToAdd.push(n);
    added.notes++;
  }

  // Highlights: only verses not already highlighted here; existing colors are kept.
  const highlightWrites: ChapterHighlightEntry[] = [];
  for (const h of data.highlights) {
    const current = await existing.getChapterHighlights(h.book, h.chapter);
    const next = { ...current };
    let changed = false;
    for (const [v, color] of Object.entries(h.verses)) {
      if (v in current) {
        skipped.highlights++;
      } else {
        next[v] = color;
        added.highlights++;
        changed = true;
      }
    }
    if (changed) highlightWrites.push({ book: h.book, chapter: h.chapter, verses: next });
  }

  return { highlightWrites, bookmarksToAdd, notesToAdd, added, skipped };
}

/** "Added 10 bookmarks, 28 notes, 80 highlights · skipped 2 already here" */
export function describeMerge(plan: Pick<MergePlan, 'added' | 'skipped'>): string {
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  const { added, skipped } = plan;
  const addedText = `Added ${n(added.bookmarks, 'bookmark', 'bookmarks')}, ${n(added.notes, 'note', 'notes')}, ${n(added.highlights, 'highlight', 'highlights')}`;
  const skippedTotal = skipped.bookmarks + skipped.notes + skipped.highlights;
  return skippedTotal > 0 ? `${addedText} · skipped ${skippedTotal} already here` : addedText;
}
