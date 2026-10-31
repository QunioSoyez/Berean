/**
 * The 66-book Protestant canon in order.
 * `id` uses the standard USFM/Paratext 3-letter book codes so other data sources
 * (commentaries, cross-references) can be keyed against it later.
 */
export type Testament = 'OT' | 'NT';

export type Book = {
  id: string;
  name: string;
  /** Short label for tight spaces (chapter grid header, tab titles). */
  abbr: string;
  chapters: number;
  testament: Testament;
};

export const BOOKS: readonly Book[] = [
  { id: 'GEN', name: 'Genesis', abbr: 'Gen', chapters: 50, testament: 'OT' },
  { id: 'EXO', name: 'Exodus', abbr: 'Exod', chapters: 40, testament: 'OT' },
  { id: 'LEV', name: 'Leviticus', abbr: 'Lev', chapters: 27, testament: 'OT' },
  { id: 'NUM', name: 'Numbers', abbr: 'Num', chapters: 36, testament: 'OT' },
  { id: 'DEU', name: 'Deuteronomy', abbr: 'Deut', chapters: 34, testament: 'OT' },
  { id: 'JOS', name: 'Joshua', abbr: 'Josh', chapters: 24, testament: 'OT' },
  { id: 'JDG', name: 'Judges', abbr: 'Judg', chapters: 21, testament: 'OT' },
  { id: 'RUT', name: 'Ruth', abbr: 'Ruth', chapters: 4, testament: 'OT' },
  { id: '1SA', name: '1 Samuel', abbr: '1 Sam', chapters: 31, testament: 'OT' },
  { id: '2SA', name: '2 Samuel', abbr: '2 Sam', chapters: 24, testament: 'OT' },
  { id: '1KI', name: '1 Kings', abbr: '1 Kgs', chapters: 22, testament: 'OT' },
  { id: '2KI', name: '2 Kings', abbr: '2 Kgs', chapters: 25, testament: 'OT' },
  { id: '1CH', name: '1 Chronicles', abbr: '1 Chr', chapters: 29, testament: 'OT' },
  { id: '2CH', name: '2 Chronicles', abbr: '2 Chr', chapters: 36, testament: 'OT' },
  { id: 'EZR', name: 'Ezra', abbr: 'Ezra', chapters: 10, testament: 'OT' },
  { id: 'NEH', name: 'Nehemiah', abbr: 'Neh', chapters: 13, testament: 'OT' },
  { id: 'EST', name: 'Esther', abbr: 'Esth', chapters: 10, testament: 'OT' },
  { id: 'JOB', name: 'Job', abbr: 'Job', chapters: 42, testament: 'OT' },
  { id: 'PSA', name: 'Psalms', abbr: 'Ps', chapters: 150, testament: 'OT' },
  { id: 'PRO', name: 'Proverbs', abbr: 'Prov', chapters: 31, testament: 'OT' },
  { id: 'ECC', name: 'Ecclesiastes', abbr: 'Eccl', chapters: 12, testament: 'OT' },
  { id: 'SNG', name: 'Song of Solomon', abbr: 'Song', chapters: 8, testament: 'OT' },
  { id: 'ISA', name: 'Isaiah', abbr: 'Isa', chapters: 66, testament: 'OT' },
  { id: 'JER', name: 'Jeremiah', abbr: 'Jer', chapters: 52, testament: 'OT' },
  { id: 'LAM', name: 'Lamentations', abbr: 'Lam', chapters: 5, testament: 'OT' },
  { id: 'EZK', name: 'Ezekiel', abbr: 'Ezek', chapters: 48, testament: 'OT' },
  { id: 'DAN', name: 'Daniel', abbr: 'Dan', chapters: 12, testament: 'OT' },
  { id: 'HOS', name: 'Hosea', abbr: 'Hos', chapters: 14, testament: 'OT' },
  { id: 'JOL', name: 'Joel', abbr: 'Joel', chapters: 3, testament: 'OT' },
  { id: 'AMO', name: 'Amos', abbr: 'Amos', chapters: 9, testament: 'OT' },
  { id: 'OBA', name: 'Obadiah', abbr: 'Obad', chapters: 1, testament: 'OT' },
  { id: 'JON', name: 'Jonah', abbr: 'Jonah', chapters: 4, testament: 'OT' },
  { id: 'MIC', name: 'Micah', abbr: 'Mic', chapters: 7, testament: 'OT' },
  { id: 'NAM', name: 'Nahum', abbr: 'Nah', chapters: 3, testament: 'OT' },
  { id: 'HAB', name: 'Habakkuk', abbr: 'Hab', chapters: 3, testament: 'OT' },
  { id: 'ZEP', name: 'Zephaniah', abbr: 'Zeph', chapters: 3, testament: 'OT' },
  { id: 'HAG', name: 'Haggai', abbr: 'Hag', chapters: 2, testament: 'OT' },
  { id: 'ZEC', name: 'Zechariah', abbr: 'Zech', chapters: 14, testament: 'OT' },
  { id: 'MAL', name: 'Malachi', abbr: 'Mal', chapters: 4, testament: 'OT' },
  { id: 'MAT', name: 'Matthew', abbr: 'Matt', chapters: 28, testament: 'NT' },
  { id: 'MRK', name: 'Mark', abbr: 'Mark', chapters: 16, testament: 'NT' },
  { id: 'LUK', name: 'Luke', abbr: 'Luke', chapters: 24, testament: 'NT' },
  { id: 'JHN', name: 'John', abbr: 'John', chapters: 21, testament: 'NT' },
  { id: 'ACT', name: 'Acts', abbr: 'Acts', chapters: 28, testament: 'NT' },
  { id: 'ROM', name: 'Romans', abbr: 'Rom', chapters: 16, testament: 'NT' },
  { id: '1CO', name: '1 Corinthians', abbr: '1 Cor', chapters: 16, testament: 'NT' },
  { id: '2CO', name: '2 Corinthians', abbr: '2 Cor', chapters: 13, testament: 'NT' },
  { id: 'GAL', name: 'Galatians', abbr: 'Gal', chapters: 6, testament: 'NT' },
  { id: 'EPH', name: 'Ephesians', abbr: 'Eph', chapters: 6, testament: 'NT' },
  { id: 'PHP', name: 'Philippians', abbr: 'Phil', chapters: 4, testament: 'NT' },
  { id: 'COL', name: 'Colossians', abbr: 'Col', chapters: 4, testament: 'NT' },
  { id: '1TH', name: '1 Thessalonians', abbr: '1 Thess', chapters: 5, testament: 'NT' },
  { id: '2TH', name: '2 Thessalonians', abbr: '2 Thess', chapters: 3, testament: 'NT' },
  { id: '1TI', name: '1 Timothy', abbr: '1 Tim', chapters: 6, testament: 'NT' },
  { id: '2TI', name: '2 Timothy', abbr: '2 Tim', chapters: 4, testament: 'NT' },
  { id: 'TIT', name: 'Titus', abbr: 'Titus', chapters: 3, testament: 'NT' },
  { id: 'PHM', name: 'Philemon', abbr: 'Phlm', chapters: 1, testament: 'NT' },
  { id: 'HEB', name: 'Hebrews', abbr: 'Heb', chapters: 13, testament: 'NT' },
  { id: 'JAS', name: 'James', abbr: 'Jas', chapters: 5, testament: 'NT' },
  { id: '1PE', name: '1 Peter', abbr: '1 Pet', chapters: 5, testament: 'NT' },
  { id: '2PE', name: '2 Peter', abbr: '2 Pet', chapters: 3, testament: 'NT' },
  { id: '1JN', name: '1 John', abbr: '1 John', chapters: 5, testament: 'NT' },
  { id: '2JN', name: '2 John', abbr: '2 John', chapters: 1, testament: 'NT' },
  { id: '3JN', name: '3 John', abbr: '3 John', chapters: 1, testament: 'NT' },
  { id: 'JUD', name: 'Jude', abbr: 'Jude', chapters: 1, testament: 'NT' },
  { id: 'REV', name: 'Revelation', abbr: 'Rev', chapters: 22, testament: 'NT' },
];

const BY_ID = new Map(BOOKS.map((b, i) => [b.id, { book: b, index: i }]));

export function getBook(id: string | undefined): Book | undefined {
  return id ? BY_ID.get(id.toUpperCase())?.book : undefined;
}

export function bookIndex(id: string): number {
  return BY_ID.get(id)?.index ?? -1;
}

export type ChapterRef = { book: string; chapter: number };

/** The chapter after `ref`, crossing into the next book. Undefined at Revelation 22. */
export function nextChapter(ref: ChapterRef): ChapterRef | undefined {
  const i = bookIndex(ref.book);
  const book = BOOKS[i];
  if (!book) return undefined;
  if (ref.chapter < book.chapters) return { book: book.id, chapter: ref.chapter + 1 };
  const next = BOOKS[i + 1];
  return next ? { book: next.id, chapter: 1 } : undefined;
}

/** The chapter before `ref`, crossing into the previous book. Undefined at Genesis 1. */
export function prevChapter(ref: ChapterRef): ChapterRef | undefined {
  const i = bookIndex(ref.book);
  const book = BOOKS[i];
  if (!book) return undefined;
  if (ref.chapter > 1) return { book: book.id, chapter: ref.chapter - 1 };
  const prev = BOOKS[i - 1];
  return prev ? { book: prev.id, chapter: prev.chapters } : undefined;
}
