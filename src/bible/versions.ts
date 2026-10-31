/**
 * Bible versions bundled with the app. All are public domain.
 * To add a version: add it to scripts/build-bibles.mjs, run `npm run build:bibles`,
 * then add an entry here.
 */
export type Version = {
  id: string;
  abbr: string;
  name: string;
  year: string;
  /** Shown under the chapter text. */
  copyright: string;
  /** Where the bundled text came from (About & credits screen). */
  source: string;
};

export const VERSIONS: readonly Version[] = [
  {
    id: 'KJV',
    abbr: 'KJV',
    name: 'King James Version',
    year: '1769',
    copyright: 'Public domain.',
    source: 'scrollmapper/bible_databases (GitHub)',
  },
  {
    id: 'WEB',
    abbr: 'WEB',
    name: 'World English Bible',
    year: '',
    copyright: 'Public domain. “World English Bible” is a trademark of eBible.org.',
    source: 'eBible.org, via the world-english-bible npm package',
  },
  {
    id: 'ASV',
    abbr: 'ASV',
    name: 'American Standard Version',
    year: '1901',
    copyright: 'Public domain.',
    source: 'scrollmapper/bible_databases (GitHub)',
  },
  {
    id: 'YLT',
    abbr: 'YLT',
    name: "Young's Literal Translation",
    year: '1898',
    copyright: 'Public domain.',
    source: 'scrollmapper/bible_databases (GitHub)',
  },
];

export const DEFAULT_VERSION = 'KJV';

export function getVersion(id: string | undefined): Version | undefined {
  return id ? VERSIONS.find((v) => v.id === id.toUpperCase()) : undefined;
}
