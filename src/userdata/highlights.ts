import { getDb } from './db';

/** verse number → color id, for one chapter. */
export type ChapterHighlights = Map<number, string>;

/** Phones: highlights stored in SQLite. */
export async function getChapterHighlights(book: string, chapter: number): Promise<ChapterHighlights> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ verse: number; color: string }>(
    'SELECT verse, color FROM highlights WHERE book = ? AND chapter = ?',
    book,
    chapter,
  );
  return new Map(rows.map((r) => [r.verse, r.color]));
}

export async function setHighlights(
  book: string,
  chapter: number,
  verses: number[],
  color: string,
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const verse of verses) {
      await db.runAsync(
        `INSERT INTO highlights (book, chapter, verse, color, updated_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (book, chapter, verse) DO UPDATE SET color = excluded.color, updated_at = excluded.updated_at`,
        book,
        chapter,
        verse,
        color,
        now,
      );
    }
  });
}

export async function removeHighlights(book: string, chapter: number, verses: number[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const verse of verses) {
      await db.runAsync(
        'DELETE FROM highlights WHERE book = ? AND chapter = ? AND verse = ?',
        book,
        chapter,
        verse,
      );
    }
  });
}
