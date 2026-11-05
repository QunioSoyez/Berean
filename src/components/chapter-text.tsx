import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Heading } from '@/bible/load';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { highlightSwatch } from '@/userdata/highlight-colors';
import type { ChapterHighlights } from '@/userdata/highlights';

import { RichRuns, type OpenRef } from './rich-text';

type Props = {
  verses: string[];
  /** Section headings shown above verses (NTBT): verse → headings. */
  headings?: Record<string, Heading[]>;
  /** Tap on a link inside a heading (parallel passages). */
  onOpenRef?: OpenRef;
  highlights: ChapterHighlights;
  selected: ReadonlySet<number>;
  /** Verses covered by a bookmark — shown with a small gold marker. */
  bookmarked: ReadonlySet<number>;
  /** Verses briefly emphasized after opening a bookmark. */
  focused: ReadonlySet<number>;
  /** verse → number of personal notes on it. */
  noteCounts: ReadonlyMap<number, number>;
  onToggleVerse: (verse: number) => void;
  /** Tap on a verse's note marker. */
  onOpenNotes: (verse: number) => void;
  /** Reports each verse row's y position (relative to this component) for scrolling. */
  onVerseLayout?: (verse: number, y: number) => void;
};

/**
 * One verse per row: small verse number, then the text.
 * Tap a verse to select/unselect it. Highlighted verses get a soft background color;
 * selected verses get a navy bar on the left and a dotted underline.
 */
export function ChapterText({
  verses,
  headings,
  onOpenRef,
  highlights,
  selected,
  bookmarked,
  focused,
  noteCounts,
  onToggleVerse,
  onOpenNotes,
  onVerseLayout,
}: Props) {
  // Only reserve space for note markers when this chapter has notes, so phones keep
  // the full reading width otherwise.
  const showNoteGutter = noteCounts.size > 0;
  return (
    <View>
      {verses.map((text, i) => {
        if (!text) return null; // verse not present in this version
        const verse = i + 1;
        const color = highlights.get(verse);
        const isSelected = selected.has(verse);
        const isBookmarked = bookmarked.has(verse);
        const isFocused = focused.has(verse);
        const noteCount = noteCounts.get(verse) ?? 0;
        const heads = headings?.[String(verse)];
        return (
          <Fragment key={verse}>
          {heads?.map((h, hi) => (
            <Text
              key={`h${hi}`}
              style={[styles.heading, HEADING_STYLES[h.k]]}
              accessibilityRole={h.k === 'r' ? 'text' : 'header'}>
              <RichRuns runs={h.t} onOpenRef={onOpenRef} />
            </Text>
          ))}
          <Pressable
            onPress={() => onToggleVerse(verse)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Verse ${verse}${color ? ', highlighted' : ''}${isBookmarked ? ', bookmarked' : ''}${noteCount ? `, ${noteCount} ${noteCount === 1 ? 'note' : 'notes'}` : ''}. ${text}`}
            accessibilityHint={isSelected ? 'Tap to unselect' : 'Tap to select'}
            onLayout={onVerseLayout ? (e) => onVerseLayout(verse, e.nativeEvent.layout.y) : undefined}
            style={[styles.row, isFocused && styles.rowFocused, isSelected && styles.rowSelected]}>
            <View style={styles.gutter}>
              <Text style={[styles.number, isSelected && styles.numberSelected]}>{verse}</Text>
              {isBookmarked && <View style={styles.bookmarkMark} />}
            </View>
            <View style={[styles.textWrap, color ? { backgroundColor: highlightSwatch(color) } : null]}>
              <Text style={[styles.text, isSelected && styles.textSelected]}>{text}</Text>
            </View>
            {showNoteGutter && (
            <View style={styles.noteGutter}>
              {noteCount > 0 && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onOpenNotes(verse);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${noteCount} ${noteCount === 1 ? 'note' : 'notes'} on verse ${verse}`}
                  hitSlop={8}
                  style={({ pressed }) => [styles.noteMark, pressed && styles.pressed]}>
                  <Text style={styles.noteMarkText}>{noteCount}</Text>
                </Pressable>
              )}
            </View>
            )}
          </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { marginLeft: 30, fontFamily: Fonts.sans },
  headingMs: {
    marginTop: Spacing.four,
    marginBottom: Spacing.one,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.gold,
  },
  headingS1: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: Colors.navy,
    fontFamily: Fonts.serif,
  },
  headingS2: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
    fontSize: 15,
    lineHeight: 21,
    fontStyle: 'italic',
    color: Colors.navy,
  },
  headingR: { marginBottom: Spacing.one, fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  row: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  rowSelected: { borderLeftColor: Colors.navy },
  rowFocused: { borderLeftColor: Colors.gold },
  gutter: { width: 27, alignItems: 'flex-end', paddingRight: Spacing.two },
  bookmarkMark: {
    marginTop: 3,
    width: 6,
    height: 10,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    backgroundColor: Colors.gold,
  },
  number: {
    paddingTop: 6,
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
    writingDirection: 'ltr',
  },
  noteGutter: { width: 30, alignItems: 'center', paddingTop: 6 },
  noteMark: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 5,
    borderBottomRightRadius: 1,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteMarkText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', fontFamily: Fonts.sans },
  pressed: { opacity: 0.6 },
  textSelected: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: Colors.navy,
  },
});

const HEADING_STYLES = {
  ms: styles.headingMs,
  s1: styles.headingS1,
  s2: styles.headingS2,
  r: styles.headingR,
} as const;
