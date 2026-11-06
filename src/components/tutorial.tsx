import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { HIGHLIGHT_COLORS } from '@/userdata/highlight-colors';

type Props = {
  visible: boolean;
  /** Called on Skip, Done, or closing the dialog. */
  onClose: () => void;
};

/** `picture` is a function so the styles below are defined before it runs. */
type Card = { title: string; body: string; picture: () => ReactNode };

/** A short, skippable introduction to the reader — shown once, and again from Settings. */
export function Tutorial({ visible, onClose }: Props) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (visible) setStep(0);
  }, [visible]);

  const card = CARDS[step];
  const last = step === CARDS.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={styles.card}
          accessibilityViewIsModal
          accessibilityLabel={`Welcome to Berean, step ${step + 1} of ${CARDS.length}`}>
          <View style={styles.picture} accessible={false} importantForAccessibility="no-hide-descendants">
            {card.picture()}
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {card.title}
          </Text>
          <Text style={styles.body}>{card.body}</Text>

          <View style={styles.dots} accessible={false}>
            {CARDS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.buttons}>
            {last ? (
              <View />
            ) : (
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Skip the tutorial"
                hitSlop={8}
                style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            )}
            <View style={styles.right}>
              {step > 0 && (
                <Pressable
                  onPress={() => setStep(step - 1)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                  <Text style={styles.secondaryText}>Back</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => (last ? onClose() : setStep(step + 1))}
                accessibilityRole="button"
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>{last ? 'Start reading' : 'Next'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- Small pictures that look like the real reader ---------- */

function VerseRow({
  n,
  text,
  selected,
  color,
  bookmark,
  notes,
}: {
  n: number;
  text: string;
  selected?: boolean;
  color?: string;
  bookmark?: boolean;
  notes?: number;
}) {
  return (
    <View style={[pic.row, selected && pic.rowSelected]}>
      <View style={pic.gutter}>
        <Text style={[pic.number, selected && pic.numberSelected]}>{n}</Text>
        {bookmark && <View style={pic.bookmark} />}
      </View>
      <Text
        style={[pic.text, selected && pic.textSelected, color ? { backgroundColor: color } : null]}
        numberOfLines={2}>
        {text}
      </Text>
      {notes ? (
        <View style={pic.noteMark}>
          <Text style={pic.noteMarkText}>{notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Pill({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <View style={[pic.pill, dark && pic.pillDark]}>
      <Text style={[pic.pillText, dark && pic.pillTextDark]}>{label}</Text>
    </View>
  );
}

const V16 = 'For God so loved the world, that he gave his only begotten Son…';
const V17 = 'For God sent not his Son into the world to condemn the world…';

const CARDS: Card[] = [
  {
    title: 'Tap a verse to select it',
    body: 'Tap any verse to select it, and tap more verses to select several. Tap again to unselect. A bar appears at the bottom with everything you can do.',
    picture: () => (
      <>
        <VerseRow n={16} text={V16} selected />
        <VerseRow n={17} text={V17} />
      </>
    ),
  },
  {
    title: 'Highlight in five colors',
    body: 'With verses selected, tap a color to highlight them. Highlights stay on the verse, so you’ll see them in every Bible version.',
    picture: () => (
      <>
        <VerseRow n={16} text={V16} color={HIGHLIGHT_COLORS[0].swatch} />
        <View style={pic.swatches}>
          {HIGHLIGHT_COLORS.map((c) => (
            <View key={c.id} style={[pic.swatch, { backgroundColor: c.swatch }]} />
          ))}
        </View>
      </>
    ),
  },
  {
    title: 'Bookmark verses',
    body: 'Tap Bookmark to save verses to come back to, with an optional name. A small gold marker shows them in the text. Find them all under Bookmarks in the menu.',
    picture: () => (
      <>
        <VerseRow n={16} text={V16} bookmark />
        <View style={pic.pills}>
          <Pill label="Bookmark" dark />
          <Pill label="Note" />
          <Pill label="Copy" />
          <Pill label="Share" />
        </View>
      </>
    ),
  },
  {
    title: 'Notes and commentary',
    body: 'Tap Note to write your own notes on a verse; a number beside the verse opens them. Tap Commentary to read Matthew Henry’s notes (or Estudio NTBT in Spanish) right beside the text.',
    picture: () => (
      <>
        <VerseRow n={16} text={V16} notes={2} />
        <View style={pic.pills}>
          <Pill label="Note" dark />
          <Pill label="Commentary" />
        </View>
      </>
    ),
  },
];

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 42, 102, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: Colors.background,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  picture: {
    borderRadius: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.two,
    minHeight: 120,
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.serif },
  body: { fontSize: 16, lineHeight: 23, color: Colors.text, fontFamily: Fonts.sans },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.two },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.navy, width: 18 },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  right: { flexDirection: 'row', gap: Spacing.two },
  skip: { paddingVertical: Spacing.two, paddingRight: Spacing.two },
  skipText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600', fontFamily: Fonts.sans },
  secondary: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryText: { fontSize: 15, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  primary: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
    borderRadius: 10,
    backgroundColor: Colors.navy,
  },
  primaryText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', fontFamily: Fonts.sans },
  pressed: { opacity: 0.6 },
});

const pic = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    backgroundColor: Colors.background,
    borderRadius: 6,
    paddingVertical: 6,
    paddingRight: 6,
  },
  rowSelected: { borderLeftColor: Colors.navy },
  gutter: { width: 26, alignItems: 'flex-end', paddingRight: 6 },
  number: { fontSize: 11, fontWeight: '600', color: Colors.gold, paddingTop: 3, fontFamily: Fonts.sans },
  numberSelected: { color: Colors.navy, fontWeight: '800' },
  bookmark: { marginTop: 3, width: 6, height: 10, borderRadius: 1, backgroundColor: Colors.gold },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    fontFamily: Fonts.serif,
    borderRadius: 4,
    paddingHorizontal: 3,
  },
  textSelected: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: Colors.navy,
  },
  noteMark: {
    marginLeft: 6,
    marginTop: 2,
    minWidth: 20,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 5,
    borderBottomRightRadius: 1,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteMarkText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', fontFamily: Fonts.sans },
  swatches: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  pillDark: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  pillTextDark: { color: '#FFFFFF' },
});
