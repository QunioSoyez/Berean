import { useCallback, useEffect, useState } from 'react';

import {
  getChapterHighlights,
  removeHighlights,
  setHighlights,
  type ChapterHighlights,
} from './highlights';

/**
 * Highlights for one chapter. Updates show immediately; if saving fails the change is
 * rolled back and `error` is set so the screen can tell the user.
 */
export function useHighlights(book: string, chapter: number) {
  const [map, setMap] = useState<ChapterHighlights>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMap(new Map());
    getChapterHighlights(book, chapter)
      .then((m) => !cancelled && setMap(m))
      .catch(() => !cancelled && setError('Couldn’t load your highlights.'));
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  const apply = useCallback(
    async (verses: number[], color: string | null) => {
      const before = map;
      const next = new Map(map);
      for (const v of verses) {
        if (color) next.set(v, color);
        else next.delete(v);
      }
      setMap(next);
      setError(null);
      try {
        if (color) await setHighlights(book, chapter, verses, color);
        else await removeHighlights(book, chapter, verses);
      } catch {
        setMap(before);
        setError('Couldn’t save that change. Please try again.');
      }
    },
    [book, chapter, map],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    highlights: map,
    error,
    clearError,
    highlight: (verses: number[], color: string) => apply(verses, color),
    unhighlight: (verses: number[]) => apply(verses, null),
  };
}
