import { useCallback, useEffect, useState } from 'react';

import { loadChapter, type Heading } from './load';

type State =
  | { status: 'loading' }
  | { status: 'ready'; verses: string[]; headings: Record<string, Heading[]> }
  | { status: 'error'; message: string };

export function useChapter(version: string, book: string, chapter: number) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loadChapter(version, book, chapter)
      .then((c) => !cancelled && setState({ status: 'ready', verses: c.verses, headings: c.headings }))
      .catch((e: unknown) => {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [version, book, chapter, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
