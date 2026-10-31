import { cleanLabel, normalizeVerses, versesKey, type Bookmark } from './bookmark-types';
import { getDb } from './db';

/** Phones: bookmarks stored in SQLite. */

type Row = {
  id: number;
  book: string;
  chapter: number;
  verses: string;
  label: string | null;
  created_at: number;
};

const toBookmark = (r: Row): Bookmark => ({
  id: String(r.id),
  book: r.book,
  chapter: r.chapter,
  verses: r.verses.split(',').map(Number),
  label: r.label,
  createdAt: r.created_at,
});

/** All bookmarks, newest first. */
export async function listBookmarks(): Promise<Bookmark[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM bookmarks ORDER BY created_at DESC, id DESC');
  return rows.map(toBookmark);
}

export async function getChapterBookmarks(book: string, chapter: number): Promise<Bookmark[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM bookmarks WHERE book = ? AND chapter = ? ORDER BY created_at DESC',
    book,
    chapter,
  );
  return rows.map(toBookmark);
}

/** Adds a bookmark. If one already exists for exactly these verses, just updates its name. */
export async function saveBookmark(
  book: string,
  chapter: number,
  verses: number[],
  label: string | null,
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO bookmarks (book, chapter, verses, label, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (book, chapter, verses) DO UPDATE SET label = excluded.label, updated_at = excluded.updated_at`,
    book,
    chapter,
    versesKey(normalizeVerses(verses)),
    cleanLabel(label),
    now,
    now,
  );
}

export async function renameBookmark(id: string, label: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE bookmarks SET label = ?, updated_at = ? WHERE id = ?',
    cleanLabel(label),
    Date.now(),
    Number(id),
  );
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM bookmarks WHERE id = ?', Number(id));
}
