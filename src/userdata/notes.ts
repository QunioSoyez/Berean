import { normalizeVerses, versesKey } from './bookmark-types';
import { getDb } from './db';
import { cleanTags, type Note, type NoteInput } from './note-types';

/** Phones: notes stored in SQLite. */

type Row = {
  id: number;
  book: string;
  chapter: number;
  verses: string;
  body: string;
  format: string;
  tags: string;
  created_at: number;
  updated_at: number;
};

const toNote = (r: Row): Note => ({
  id: String(r.id),
  book: r.book,
  chapter: r.chapter,
  verses: r.verses.split(',').map(Number),
  body: r.body,
  format: r.format === 'markdown' ? 'markdown' : 'plain',
  tags: r.tags ? r.tags.split(',') : [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** All notes, newest first. */
export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM notes ORDER BY created_at DESC, id DESC');
  return rows.map(toNote);
}

export async function getChapterNotes(book: string, chapter: number): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM notes WHERE book = ? AND chapter = ? ORDER BY created_at DESC, id DESC',
    book,
    chapter,
  );
  return rows.map(toNote);
}

export async function createNote(
  book: string,
  chapter: number,
  verses: number[],
  input: NoteInput,
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO notes (book, chapter, verses, body, format, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'markdown', ?, ?, ?)`,
    book,
    chapter,
    versesKey(normalizeVerses(verses)),
    input.body.trim(),
    cleanTags(input.tags).join(','),
    now,
    now,
  );
}

export async function updateNote(id: string, input: NoteInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE notes SET body = ?, format = 'markdown', tags = ?, updated_at = ? WHERE id = ?",
    input.body.trim(),
    cleanTags(input.tags).join(','),
    Date.now(),
    Number(id),
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', Number(id));
}
