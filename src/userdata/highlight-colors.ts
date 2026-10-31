/**
 * Highlight colors. The id is what gets saved, so never rename an id —
 * only add new ones or change the swatch value.
 */
export const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', swatch: '#FFF1A0' },
  { id: 'green', label: 'Green', swatch: '#CDEFC4' },
  { id: 'blue', label: 'Blue', swatch: '#CFE4FF' },
  { id: 'pink', label: 'Pink', swatch: '#FAD3E3' },
  { id: 'orange', label: 'Orange', swatch: '#FFDDB5' },
] as const;

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]['id'];

const BY_ID = new Map<string, string>(HIGHLIGHT_COLORS.map((c) => [c.id, c.swatch]));

/** Swatch for a saved color id (falls back to yellow for unknown ids). */
export function highlightSwatch(id: string): string {
  return BY_ID.get(id) ?? HIGHLIGHT_COLORS[0].swatch;
}
