import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';

type Props = {
  verses: string[];
};

/**
 * One verse per row: small verse number, then the text.
 * Each verse is its own element so later rounds can make verses tappable/highlightable.
 */
export function ChapterText({ verses }: Props) {
  return (
    <View>
      {verses.map((text, i) =>
        text ? (
          <View key={i} style={styles.row} accessible accessibilityLabel={`Verse ${i + 1}. ${text}`}>
            <Text style={styles.number}>{i + 1}</Text>
            <Text style={styles.text} selectable>
              {text}
            </Text>
          </View>
        ) : null,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: Spacing.one,
  },
  number: {
    width: 30,
    paddingTop: 4,
    paddingRight: Spacing.two,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
    fontFamily: Fonts.sans,
  },
  text: {
    flex: 1,
    fontSize: 19,
    lineHeight: 30,
    color: Colors.text,
    fontFamily: Fonts.serif,
  },
});
