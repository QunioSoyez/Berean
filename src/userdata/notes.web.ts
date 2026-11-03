import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizeVerses } from './bookmark-types';
import { cleanTags, type Note, type NoteInput } from './note-types';

/**
 * Web: all notes in one browser-storage entry.
 * Data stays in this browser on this device; clearing site data removes it.
 */
const KEY = 'berean.notes.v1';

async function readAll(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Note[]) : [];
}

async function writeAll(list: Note[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

/** All notes, newest first. */
export async function listNotes(): Promise<Note[]> {
  return (await readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getChapterNotes(book: string, chapter: number): Promise<Note[]> {
  return (await listNotes()).filter((n) => n.book === book && n.chapter === chapter);
}

export async function createNote(
  book: string,
  chapter: number,
  verses: number[],
  input: NoteInput,
): Promise<void> {
  const list = await readAll();
  const now = Date.now();
  list.push({
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    book,
    chapter,
    verses: normalizeVerses(verses),
    body: input.body.trim(),
    format: 'markdown',
    tags: cleanTags(input.tags),
    createdAt: now,
    updatedAt: now,
  });
  await writeAll(list);
}

export async function updateNote(id: string, input: NoteInput): Promise<void> {
  const list = await readAll();
  const n = list.find((x) => x.id === id);
  if (!n) return;
  n.body = input.body.trim();
  n.format = 'markdown';
  n.tags = cleanTags(input.tags);
  n.updatedAt = Date.now();
  await writeAll(list);
}

export async function deleteNote(id: string): Promise<void> {
  await writeAll((await readAll()).filter((n) => n.id !== id));
}
