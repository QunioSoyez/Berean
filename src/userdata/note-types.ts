export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 30;

export type Note = {
  id: string;
  book: string;
  chapter: number;
  /** Sorted, unique verse numbers the note is attached to. */
  verses: number[];
  body: string;
  /** 'plain' for now; a formatted variant can be added later without changing old notes. */
  format: 'plain';
  /** Lowercase tags, at most MAX_TAGS. */
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

export type NoteInput = { body: string; tags: string[] };

/** "Sunday  School," → "sunday school" */
export function cleanTag(tag: string): string {
  return tag
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, MAX_TAG_LENGTH);
}

export function cleanTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const t of tags.map(cleanTag)) {
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

/** True if the note is attached to any of these verses. */
export function noteCovers(note: Note, verses: number[]): boolean {
  return note.verses.some((v) => verses.includes(v));
}
