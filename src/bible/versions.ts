/**
 * Bible versions bundled with the app. KJV, WEB, ASV and YLT are public domain; the NTBT is
 * used with permission (free NTBT licence — keep its wording and attribution).
 * To add a public-domain version: add it to scripts/build-bibles.mjs, run
 * `npm run build:bibles`, then add an entry here.
 */
export type Version = {
  id: string;
  abbr: string;
  name: string;
  year: string;
  /** Language of the text; book names are shown in this language ('en' | 'es'). */
  lang: 'en' | 'es';
  /** Shown under the chapter text. */
  copyright: string;
  /** If set, the credit under the chapter links here (required for the NTBT). */
  creditUrl?: string;
  /** Where the bundled text came from (About & credits screen). */
  source: string;
  /**
   * Which study material the panel's second tab shows for this version:
   * Matthew Henry's commentary (English versions) or the NTBT's own study notes.
   */
  study: 'mhcc' | 'ntbt';
};

export const VERSIONS: readonly Version[] = [
  {
    id: 'KJV',
    abbr: 'KJV',
    name: 'King James Version',
    year: '1769',
    copyright: 'Public domain.',
    source: 'scrollmapper/bible_databases (GitHub)',
    lang: 'en',
    study: 'mhcc',
  },
  {
    id: 'WEB',
    abbr: 'WEB',
    name: 'World English Bible',
    year: '',
    copyright: 'Public domain. “World English Bible” is a trademark of eBible.org.',
    source: 'eBible.org, via the world-english-bible npm package',
    lang: 'en',
    study: 'mhcc',
  },
  {
    id: 'ASV',
    abbr: 'ASV',
    name: 'American Standard Version',
    year: '1901',
    copyright: 'Public domain.',
    source: 'scrollmapper/bible_databases (GitHub)',
    lang: 'en',
    study: 'mhcc',
  },
  {
    id: 'YLT',
    abbr: 'YLT',
    name: "Young's Literal Translation",
    year: '1898',
    copyright: 'Public domain.',
    source: 'scrollmapper/bible_databases (GitHub)',
    lang: 'en',
    study: 'mhcc',
  },
  {
    id: 'NTBT',
    abbr: 'NTBT',
    name: 'Nueva Traducción BibliaTodo',
    year: 'Español',
    lang: 'es',
    // Official credit required by the NTBT licence (keep exactly as written).
    copyright:
      'Santa Biblia, Nueva Traducción BibliaTodo (NTBT). Publicada por BibliaTodo Bible Society, sello editorial de BibliaTodo LLC.',
    creditUrl: 'https://www.bibliatodo.com/ntbt/',
    source: 'BibliaTodo Bible Society (study edition, used with permission)',
    study: 'ntbt',
  },
];

export const DEFAULT_VERSION = 'KJV';

export function getVersion(id: string | undefined): Version | undefined {
  return id ? VERSIONS.find((v) => v.id === id.toUpperCase()) : undefined;
}
