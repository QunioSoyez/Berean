import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Note, NoteInput } from './note-types';
import { createNote, deleteNote, getChapterNotes, listNotes, updateNote } from './notes';

/** Every tag used so far, most-used first (for suggestions). */
export async function listAllTags(): Promise<string[]> {
  const counts = new Map<string, number>();
  for (const n of await listNotes()) for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}

/** Notes in one chapter, plus helpers for the reader. */
export function useChapterNotes(book: string, chapter: number) {
  const [list, setList] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setList(await getChapterNotes(book, chapter));
    } catch {
      setError('Couldn’t load your notes.');
    }
  }, [book, chapter]);

  useEffect(() => {
    setList([]);
    reload();
  }, [reload]);

  /** verse → number of notes attached to it (for the note marker). */
  const counts = useMemo(() => {
    const m = new Map<number, number>();
    for (const n of list) for (const v of n.verses) m.set(v, (m.get(v) ?? 0) + 1);
    return m;
  }, [list]);

  const run = useCallback(
    async (fn: () => Promise<void>, failMessage: string) => {
      setError(null);
      try {
        await fn();
        await reload();
        return true;
      } catch {
        setError(failMessage);
        return false;
      }
    },
    [reload],
  );

  return {
    notes: list,
    counts,
    error,
    add: (verses: number[], input: NoteInput) =>
      run(() => createNote(book, chapter, verses, input), 'Couldn’t save the note. Please try again.'),
    edit: (id: string, input: NoteInput) =>
      run(() => updateNote(id, input), 'Couldn’t save the note. Please try again.'),
    remove: (id: string) => run(() => deleteNote(id), 'Couldn’t delete the note. Please try again.'),
  };
}
