import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { highlightSwatch } from '@/userdata/highlight-colors';
import type { ChapterHighlights } from '@/userdata/highlights';

type Props = {
  verses: string[];
  highlights: ChapterHighlights;
  selected: ReadonlySet<number>;
  onToggleVerse: (verse: number) => void;
};

/**
 * One verse per row: small verse number, then the text.
 * Tap a verse to select/unselect it. Highlighted verses get a soft background color;
 * selected verses get a navy bar on the left and a dotted underline.
 */
export function ChapterText({ verses, highlights, selected, onToggleVerse }: Props) {
  return (
    <View>
      {verses.map((text, i) => {
        if (!text) return null; // verse not present in this version
        const verse = i + 1;
        const color = highlights.get(verse);
        const isSelected = selected.has(verse);
        return (
          <Pressable
            key={verse}
            onPress={() => onToggleVerse(verse)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Verse ${verse}${color ? ', highlighted' : ''}. ${text}`}
            accessibilityHint={isSelected ? 'Tap to unselect' : 'Tap to select'}
            style={[styles.row, isSelected && styles.rowSelected]}>
            <Text style={[styles.number, isSelected && styles.numberSelected]}>{verse}</Text>
            <View style={[styles.textWrap, color ? { backgroundColor: highlightSwatch(color) } : null]}>
              <Text style={[styles.text, isSelected && styles.textSelected]}>{text}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  rowSelected: { borderLeftColor: Colors.navy },
  number: {
    width: 27,
    paddingTop: 6,
    paddingRight: Spacing.two,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
    fontFamily: Fonts.sans,
  },
  numberSelected: { color: Colors.navy, fontWeight: '800' },
  textWrap: {
    flex: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  text: {
    fontSize: 19,
    lineHeight: 30,
    color: Colors.text,
    fontFamily: Fonts.serif,
  },
  textSelected: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: Colors.navy,
  },
});
