/**
 * The small Markdown subset used for formatted notes:
 *   **bold**   *italic*   # Heading   ## Subheading   - bullet   1. numbered
 * Parsing and the editor's toolbar actions live here so the UI stays simple.
 */

export type Inline = { text: string; bold?: boolean; italic?: boolean };

export type Block =
  | { type: 'heading'; level: 1 | 2; content: Inline[] }
  | { type: 'bullet'; content: Inline[] }
  | { type: 'number'; n: number; content: Inline[] }
  | { type: 'paragraph'; content: Inline[] }
  | { type: 'blank' };

const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*(\d+)[.)]\s+/;
const HEADING = /^(#{1,2})\s+/;

/** "**bold** and *italic*" → inline runs. Unmatched markers are kept as plain text. */
export function parseInline(line: string): Inline[] {
  const out: Inline[] = [];
  // Markers must hug the text (no space just inside), so "2 * 3 * 4" stays plain.
  const re = /\*\*(\S|\S.*?\S)\*\*|\*([^\s*]|[^\s*].*?\S)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) });
    if (m[1] !== undefined) {
      // Bold may contain italic: **a *b* c**
      for (const part of parseInline(m[1])) out.push({ ...part, bold: true });
    } else {
      out.push({ text: m[2], italic: true });
    }
    last = re.lastIndex;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out;
}

export function parseBlocks(source: string): Block[] {
  return source.split('\n').map((line): Block => {
    if (!line.trim()) return { type: 'blank' };
    let m = line.match(HEADING);
    if (m) return { type: 'heading', level: m[1].length as 1 | 2, content: parseInline(line.slice(m[0].length)) };
    m = line.match(BULLET);
    if (m) return { type: 'bullet', content: parseInline(line.slice(m[0].length)) };
    m = line.match(NUMBER);
    if (m) return { type: 'number', n: Number(m[1]), content: parseInline(line.slice(m[0].length)) };
    return { type: 'paragraph', content: parseInline(line) };
  });
}

/** Plain text without formatting marks (for list previews and search). */
export function stripMarkdown(source: string): string {
  return parseBlocks(source)
    .map((b) => {
      if (b.type === 'blank') return '';
      const text = b.content.map((c) => c.text).join('');
      if (b.type === 'bullet') return `• ${text}`;
      if (b.type === 'number') return `${b.n}. ${text}`;
      return text;
    })
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

// ---------------------------------------------------------------------------
// Editor actions. Each takes the text and selection and returns new text and selection.

export type Selection = { start: number; end: number };
export type Edit = { text: string; selection: Selection };

/** Wrap the selection in a marker (** or *); with nothing selected, insert a pair and put the cursor inside. */
export function toggleWrap(text: string, sel: Selection, marker: '**' | '*'): Edit {
  const { start, end } = sel;
  const before = text.slice(0, start);
  const inner = text.slice(start, end);
  const after = text.slice(end);
  const n = marker.length;
  // Already wrapped → unwrap.
  if (before.endsWith(marker) && after.startsWith(marker) && !(marker === '*' && before.endsWith('**') && after.startsWith('**'))) {
    return {
      text: before.slice(0, -n) + inner + after.slice(n),
      selection: { start: start - n, end: end - n },
    };
  }
  return {
    text: before + marker + inner + marker + after,
    selection: { start: start + n, end: end + n },
  };
}

/** Start/end offsets of the full lines touched by the selection. */
function lineRange(text: string, sel: Selection) {
  const lineStart = text.lastIndexOf('\n', sel.start - 1) + 1;
  let lineEnd = text.indexOf('\n', sel.end);
  if (lineEnd === -1) lineEnd = text.length;
  return { lineStart, lineEnd };
}

type LineKind = 'heading' | 'bullet' | 'number';

/** Turn the selected lines into headings / bullets / a numbered list, or back to plain lines. */
export function toggleLines(text: string, sel: Selection, kind: LineKind): Edit {
  const { lineStart, lineEnd } = lineRange(text, sel);
  const lines = text.slice(lineStart, lineEnd).split('\n');
  const prefix = kind === 'heading' ? HEADING : kind === 'bullet' ? BULLET : NUMBER;
  const nonEmpty = lines.filter((l) => l.trim());
  const allHave = nonEmpty.length > 0 && nonEmpty.every((l) => prefix.test(l));
  let i = 0;
  const changed = lines.map((l) => {
    const bare = l.replace(HEADING, '').replace(BULLET, '').replace(NUMBER, '');
    if (allHave) return bare;
    if (!l.trim() && lines.length > 1) return l;
    i += 1;
    if (kind === 'heading') return `## ${bare}`;
    if (kind === 'bullet') return `- ${bare}`;
    return `${i}. ${bare}`;
  });
  const block = changed.join('\n');
  const newText = text.slice(0, lineStart) + block + text.slice(lineEnd);
  // Single empty line: put the cursor after the new prefix.
  const cursor = lineStart + block.length;
  return { text: newText, selection: { start: cursor, end: cursor } };
}

/**
 * After the user presses Enter at the end of a list line, continue the list
 * ("- " or the next number). Pressing Enter on an empty list item ends the list.
 * Returns null when nothing should change.
 */
export function continueList(prev: string, next: string, cursor: number): Edit | null {
  if (next.length !== prev.length + 1 || next[cursor - 1] !== '\n') return null;
  const lineStart = next.lastIndexOf('\n', cursor - 2) + 1;
  const line = next.slice(lineStart, cursor - 1);
  const bullet = line.match(BULLET);
  const number = line.match(NUMBER);
  const m = bullet ?? number;
  if (!m) return null;
  if (!line.slice(m[0].length).trim()) {
    // Empty item → remove it and stop the list.
    const text = next.slice(0, lineStart) + next.slice(cursor);
    return { text, selection: { start: lineStart, end: lineStart } };
  }
  const insert = bullet ? '- ' : `${Number(number![1]) + 1}. `;
  const text = next.slice(0, cursor) + insert + next.slice(cursor);
  const pos = cursor + insert.length;
  return { text, selection: { start: pos, end: pos } };
}
