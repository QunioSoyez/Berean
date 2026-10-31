import * as SQLite from 'expo-sqlite';

/**
 * Phones (iOS/Android): the user's highlights, bookmarks and notes live in one SQLite
 * database on the device. Web uses db.web.ts instead.
 *
 * Schema changes: add a new entry to MIGRATIONS (never edit an old one). Each runs once,
 * tracked by SQLite's built-in `user_version`.
 */
const MIGRATIONS: string[] = [
  // 1 — highlights, keyed to the verse (not the version) so they show in every version
  `CREATE TABLE IF NOT EXISTS highlights (
     book TEXT NOT NULL,
     chapter INTEGER NOT NULL,
     verse INTEGER NOT NULL,
     color TEXT NOT NULL,
     updated_at INTEGER NOT NULL,
     PRIMARY KEY (book, chapter, verse)
   );`,
  // 2 — bookmarks on a verse or set of verses; `verses` is a sorted comma list ("16,17")
  `CREATE TABLE IF NOT EXISTS bookmarks (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     book TEXT NOT NULL,
     chapter INTEGER NOT NULL,
     verses TEXT NOT NULL,
     label TEXT,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL,
     UNIQUE (book, chapter, verses)
   );
   CREATE INDEX IF NOT EXISTS bookmarks_by_chapter ON bookmarks (book, chapter);`,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('berean.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    version += 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open();
    dbPromise.catch(() => (dbPromise = null)); // allow a retry after a failure
  }
  return dbPromise;
}
