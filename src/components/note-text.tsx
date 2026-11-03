import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { parseBlocks, type Inline } from '@/notes-format/markdown';

type Props = {
  body: string;
  /** 'plain' notes (written before formatting existed) show exactly as typed. */
  format: 'plain' | 'markdown';
};

/** Shows a note with its formatting: headings, bold/italic, bullet and numbered lists. */
export function NoteText({ body, format }: Props) {
  if (format === 'plain') {
    return (
      <Text style={styles.text} selectable>
        {body}
      </Text>
    );
  }

  const blocks = parseBlocks(body);
  return (
    <View style={styles.wrap}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'blank':
            return <View key={i} style={styles.blank} />;
          case 'heading':
            return (
              <Text
                key={i}
                style={[styles.text, b.level === 1 ? styles.h1 : styles.h2]}
                accessibilityRole="header"
                selectable>
                <Runs runs={b.content} />
              </Text>
            );
          case 'bullet':
            return (
              <View key={i} style={styles.listRow}>
                <Text style={[styles.text, styles.marker]}>•</Text>
                <Text style={[styles.text, styles.listText]} selectable>
                  <Runs runs={b.content} />
                </Text>
              </View>
            );
          case 'number':
            return (
              <View key={i} style={styles.listRow}>
                <Text style={[styles.text, styles.marker]}>{b.n}.</Text>
                <Text style={[styles.text, styles.listText]} selectable>
                  <Runs runs={b.content} />
                </Text>
              </View>
            );
          default:
            return (
              <Text key={i} style={styles.text} selectable>
                <Runs runs={b.content} />
              </Text>
            );
        }
      })}
    </View>
  );
}

function Runs({ runs }: { runs: Inline[] }) {
  return (
    <>
      {runs.map((r, i) => (
        <Text key={i} style={[r.bold && styles.bold, r.italic && styles.italic]}>
          {r.text}
        </Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  text: { fontSize: 16, lineHeight: 23, color: Colors.text, fontFamily: Fonts.sans },
  h1: { fontSize: 20, lineHeight: 27, fontWeight: '700', color: Colors.navy, marginTop: Spacing.one },
  h2: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: Colors.navy, marginTop: Spacing.one },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  blank: { height: Spacing.two },
  listRow: { flexDirection: 'row', paddingLeft: Spacing.one },
  marker: { width: 22, color: Colors.textSecondary },
  listText: { flex: 1 },
});
