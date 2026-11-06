import { useCallback, useEffect, useMemo, useState } from 'react';

import { versesKey, type Bookmark } from './bookmark-types';
import { deleteBookmark, getChapterBookmarks, saveBookmark } from './bookmarks';

/** Bookmarks in one chapter, plus helpers for the reader. */
export function useChapterBookmarks(book: string, chapter: number) {
  const [list, setList] = useState<Bookmark[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setList(await getChapterBookmarks(book, chapter));
    } catch {
      setError('Couldn’t load your bookmarks.');
    }
  }, [book, chapter]);

  useEffect(() => {
    setList([]);
    reload();
  }, [reload]);

  /** Every verse covered by at least one bookmark (for the little marker). */
  const bookmarkedVerses = useMemo(() => new Set(list.flatMap((b) => b.verses)), [list]);

  /** The bookmark for exactly these verses, if there is one. */
  const find = useCallback(
    (verses: number[]) => {
      const key = versesKey(verses);
      return list.find((b) => versesKey(b.verses) === key);
    },
    [list],
  );

  const save = useCallback(
    async (verses: number[], label: string | null) => {
      setError(null);
      try {
        await saveBookmark(book, chapter, verses, label);
        await reload();
        return true;
      } catch {
        setError('Couldn’t save the bookmark. Please try again.');
        return false;
      }
    },
    [book, chapter, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteBookmark(id);
        await reload();
        return true;
      } catch {
        setError('Couldn’t remove the bookmark. Please try again.');
        return false;
      }
    },
    [reload],
  );

  const clearError = useCallback(() => setError(null), []);

  return { bookmarkedVerses, find, save, remove, error, clearError };
}
