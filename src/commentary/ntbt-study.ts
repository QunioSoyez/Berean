import { Platform } from 'react-native';

import type { RichRun } from '@/components/rich-text';

/**
 * NTBT study edition (book introductions + a note on every verse). It's large (~70 MB), so
 * it isn't built into the app: scripts/build-ntbt.mjs writes one small file per chapter into
 * public/ntbt-estudio/, which is published with the website. The app fetches a chapter the
 * first time it's opened and keeps it in memory.
 */
export type StudyBlock = { k: 'h2' | 'h3' | 'p' | 'li'; n?: number; r: RichRun[] };
export type StudyNote = { v: number; blocks: StudyBlock[] };

/** Web: same site. Phones: the published website. */
const BASE = Platform.OS === 'web' ? '' : 'https://bereanbible.live';

const cache = new Map<string, Promise<unknown>>();

async function getJson<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = (async () => {
      const res = await fetch(`${BASE}${path}`);
      if (!res.ok) throw new Error(`${res.status} for ${path}`);
      // The website answers unknown paths with the app page (HTML), so check it's JSON.
      const text = await res.text();
      if (!text.trimStart().startsWith('[') && !text.trimStart().startsWith('{')) {
        throw new Error(`Not found: ${path}`);
      }
      return JSON.parse(text) as T;
    })();
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return p;
}

export function loadNtbtNotes(book: string, chapter: number): Promise<StudyNote[]> {
  return getJson<StudyNote[]>(`/ntbt-estudio/${book}/${chapter}.json`);
}

export async function loadNtbtIntro(book: string): Promise<StudyBlock[]> {
  return (await getJson<{ blocks: StudyBlock[] }>(`/ntbt-estudio/${book}/intro.json`)).blocks;
}
