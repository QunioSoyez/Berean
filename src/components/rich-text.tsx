import { Text, type TextStyle } from 'react-native';

import { getBook } from '@/bible/books';
import { parseRef } from '@/commentary/commentary';
import { Colors } from '@/constants/theme';

/** Text run used by NTBT headings and study notes. */
export type RichRun = string | { t: string; i?: 1; b?: 1; lang?: string; ref?: string };

export type OpenRef = (book: string, chapter: number, verses: number[]) => void;

/** Renders runs inside a parent <Text>: italic/bold, original-language words, tappable verse links. */
export function RichRuns({ runs, onOpenRef }: { runs: RichRun[]; onOpenRef?: OpenRef }) {
  return (
    <>
      {runs.map((r, i) => {
        if (typeof r === 'string') return r;
        const style: TextStyle[] = [];
        if (r.i) style.push({ fontStyle: 'italic' });
        if (r.b) style.push({ fontWeight: '700' });
        const target = r.ref ? parseRef(r.ref) : null;
        if (target && onOpenRef && getBook(target.book)) {
          return (
            <Text
              key={i}
              style={[...style, { color: Colors.navy, textDecorationLine: 'underline' }]}
              onPress={() => onOpenRef(target.book, target.chapter, target.verses)}
              accessibilityRole="link">
              {r.t}
            </Text>
          );
        }
        return (
          <Text key={i} style={style} lang={r.lang}>
            {r.t}
          </Text>
        );
      })}
    </>
  );
}
