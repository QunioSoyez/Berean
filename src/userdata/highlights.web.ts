import AsyncStorage from '@react-native-async-storage/async-storage';

/** verse number → color id, for one chapter. */
export type ChapterHighlights = Map<number, string>;

/**
 * Web: highlights stored in the browser (localStorage), one entry per chapter:
 *   berean.hl.v1.JHN.3 → {"16":"yellow","17":"green"}
 * Data stays in this browser on this device; clearing site data removes it.
 */
const key = (book: string, chapter: number) => `berean.hl.v1.${book}.${chapter}`;

async function read(book: string, chapter: number): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(key(book, chapter));
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
}

async function write(book: string, chapter: number, data: Record<string, string>): Promise<void> {
  if (Object.keys(data).length === 0) await AsyncStorage.removeItem(key(book, chapter));
  else await AsyncStorage.setItem(key(book, chapter), JSON.stringify(data));
}

export async function getChapterHighlights(book: string, chapter: number): Promise<ChapterHighlights> {
  const data = await read(book, chapter);
  return new Map(Object.entries(data).map(([v, c]) => [Number(v), c]));
}

export async function setHighlights(
  book: string,
  chapter: number,
  verses: number[],
  color: string,
): Promise<void> {
  const data = await read(book, chapter);
  for (const v of verses) data[v] = color;
  await write(book, chapter, data);
}

export async function removeHighlights(book: string, chapter: number, verses: number[]): Promise<void> {
  const data = await read(book, chapter);
  for (const v of verses) delete data[v];
  await write(book, chapter, data);
}
