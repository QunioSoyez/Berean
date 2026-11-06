import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';

import { getBook } from '@/bible/books';
import {
  COMMENTARY_NAME,
  loadCommentary,
  parseRef,
  sectionForVerse,
  type BookCommentary,
  type Para,
} from '@/commentary/commentary';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useFontScale } from '@/state/settings';

type Props = {
  book: string;
  chapter: number;
  /** Scroll to (and mark) the section covering this verse. */
  verse?: number;
  /** Tap on a cross-reference like "Nu 21:6-9". */
  onOpenRef: (book: string, chapter: number, verses: number[]) => void;
};

/** Matthew Henry's commentary for one chapter: outline, then each "Verses a-b" section. */
export function CommentaryView({ book, chapter, verse, onOpenRef }: Props) {
  const [data, setData] = useState<BookCommentary | null>(null);
  const [error, setError] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const sectionY = useRef(new Map<number, number>());
  const listTop = useRef(0);
  const fs = useFontScale(); // Settings → Text size

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(false);
    setShowIntro(false);
    loadCommentary(book)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [book]);

  const ch = data?.chapters[chapter - 1];
  const focusIndex = ch && verse ? sectionForVerse(ch.sections, verse) : -1;

  const scrollToSection = (i: number) => {
    const y = sectionY.current.get(i);
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, listTop.current + y - Spacing.two), animated: true });
  };

  // Jump to the verse's section once it has been laid out. Reset during render (not in an
  // effect) so early layout events aren't thrown away.
  const pending = useRef<number>(-1);
  const layoutKey = `${book}/${chapter}/${focusIndex}/${data ? 1 : 0}`;
  const lastKey = useRef('');
  if (lastKey.current !== layoutKey) {
    lastKey.current = layoutKey;
    sectionY.current = new Map();
    pending.current = focusIndex;
  }

  if (error) return <Text style={styles.message}>Couldn’t load the commentary.</Text>;
  if (!data || !ch) return <ActivityIndicator style={styles.loading} color={Colors.navy} />;

  const bookName = getBook(book)?.name ?? book;

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.body}>
      <Text style={styles.source}>{COMMENTARY_NAME}</Text>

      {chapter === 1 && data.intro.length > 0 && (
        <View style={styles.introBox}>
          <Pressable
            onPress={() => setShowIntro(!showIntro)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showIntro }}
            style={({ pressed }) => pressed && styles.pressed}>
            <Text style={[styles.introToggle, fs(15)]}>
              {showIntro ? '▾' : '▸'} About {bookName}
            </Text>
          </Pressable>
          {showIntro && data.intro.map((p, i) => <Paragraph key={i} para={p} onOpenRef={onOpenRef} />)}
        </View>
      )}

      {ch.outline.length > 0 && (
        <View style={styles.outline}>
          <Text style={styles.outlineTitle}>Chapter outline</Text>
          {ch.outline.map((o, i) => {
            const start = Number(o.verses.match(/\d+/)?.[0] ?? 1);
            return (
              <Pressable
                key={i}
                onPress={() => scrollToSection(sectionForVerse(ch.sections, start))}
                accessibilityRole="button"
                style={({ pressed }) => [styles.outlineRow, pressed && styles.pressed]}>
                <Text style={[styles.outlineText, fs(14, 20)]}>{o.text}</Text>
                <Text style={styles.outlineVerses}>{o.verses}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {ch.sections.length === 0 && (
        <Text style={styles.message}>
          Matthew Henry covers this chapter together with a neighboring chapter.
        </Text>
      )}

      <View onLayout={(e) => (listTop.current = e.nativeEvent.layout.y)}>
        {ch.sections.map((s, i) => (
          <View
            key={i}
            onLayout={(e) => {
              sectionY.current.set(i, e.nativeEvent.layout.y);
              if (pending.current === i) {
                pending.current = -1;
                requestAnimationFrame(() => scrollToSection(i));
              }
            }}
            style={[styles.section, i === focusIndex && styles.sectionFocused]}>
            <Text style={[styles.sectionTitle, fs(15)]} accessibilityRole="header">
              {s.title}
            </Text>
            {s.paras.map((p, pi) => (
              <Paragraph key={pi} para={p} onOpenRef={onOpenRef} />
            ))}
          </View>
        ))}
      </View>

      <Text style={styles.credit}>{COMMENTARY_NAME} — public domain.</Text>
    </ScrollView>
  );
}

function Paragraph({ para, onOpenRef }: { para: Para; onOpenRef: Props['onOpenRef'] }) {
  const fs = useFontScale();
  return (
    <Text style={[styles.para, fs(16, 25)]} selectable>
      {para.map((r, i) => {
        if (typeof r === 'string') return r;
        const target = parseRef(r.ref);
        if (!target || !getBook(target.book)) return r.t;
        return (
          <Text
            key={i}
            style={styles.ref}
            onPress={() => onOpenRef(target.book, target.chapter, target.verses)}
            accessibilityRole="link">
            {r.t}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  loading: { marginTop: Spacing.five },
  message: { color: Colors.textSecondary, fontFamily: Fonts.sans, padding: Spacing.three },
  source: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.gold,
    fontFamily: Fonts.sans,
  },
  introBox: { gap: Spacing.two },
  introToggle: { fontSize: 15, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  outline: {
    borderRadius: 10,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  outlineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.one,
    fontFamily: Fonts.sans,
  },
  outlineRow: { flexDirection: 'row', gap: Spacing.two, paddingVertical: 3 },
  outlineText: { flex: 1, fontSize: 14, lineHeight: 20, color: Colors.navy, fontFamily: Fonts.sans },
  outlineVerses: { fontSize: 13, color: Colors.textSecondary, fontFamily: Fonts.sans },
  section: {
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.one,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  sectionFocused: { borderLeftColor: Colors.gold },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  para: { fontSize: 16, lineHeight: 25, color: Colors.text, fontFamily: Fonts.serif },
  ref: { color: Colors.navy, textDecorationLine: 'underline' },
  credit: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', fontFamily: Fonts.sans },
  pressed: { opacity: 0.6 },
});
