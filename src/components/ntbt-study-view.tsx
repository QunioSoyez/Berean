import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';

import { bookName } from '@/bible/books';
import { loadNtbtIntro, loadNtbtNotes, type StudyBlock, type StudyNote } from '@/commentary/ntbt-study';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useFontScale } from '@/state/settings';

import { RichRuns, type OpenRef } from './rich-text';

type Props = {
  book: string;
  chapter: number;
  /** Scroll to (and mark) this verse's note. */
  verse?: number;
  onOpenRef: OpenRef;
};

const CREDIT_URL = 'https://www.bibliatodo.com/ntbt/';

/** The NTBT study edition for one chapter: book introduction (chapter 1) and a note per verse. */
export function NtbtStudyView({ book, chapter, verse, onOpenRef }: Props) {
  const [notes, setNotes] = useState<StudyNote[] | null>(null);
  const [intro, setIntro] = useState<StudyBlock[] | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const noteY = useRef(new Map<number, number>());
  const listTop = useRef(0);
  const fs = useFontScale(); // Settings → Text size

  useEffect(() => {
    let cancelled = false;
    setNotes(null);
    setIntro(null);
    setError(false);
    setShowIntro(false);
    loadNtbtNotes(book, chapter)
      .then((n) => !cancelled && setNotes(n))
      .catch(() => !cancelled && setError(true));
    if (chapter === 1) loadNtbtIntro(book).then((b) => !cancelled && setIntro(b)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [book, chapter, attempt]);

  // Scroll to the chosen verse's note once it has been laid out (reset during render so
  // early layout events aren't lost).
  const pending = useRef<number | null>(null);
  const key = `${book}/${chapter}/${verse ?? ''}/${notes ? 1 : 0}`;
  const lastKey = useRef('');
  if (lastKey.current !== key) {
    lastKey.current = key;
    noteY.current = new Map();
    pending.current = verse ?? null;
  }
  const scrollTo = (v: number) => {
    const y = noteY.current.get(v);
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, listTop.current + y - Spacing.two), animated: true });
  };

  const name = bookName(book, 'NTBT');

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Couldn’t load the study notes. They download from bereanbible.live, so check your internet
          connection.
        </Text>
        <Pressable onPress={() => setAttempt((n) => n + 1)} accessibilityRole="button" style={styles.retry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (!notes) return <ActivityIndicator style={styles.loading} color={Colors.navy} />;

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.body}>
      <Text style={styles.source}>Estudio NTBT</Text>

      {intro && intro.length > 0 && (
        <View style={styles.introBox}>
          <Pressable
            onPress={() => setShowIntro(!showIntro)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showIntro }}
            style={({ pressed }) => pressed && styles.pressed}>
            <Text style={[styles.introToggle, fs(15)]}>
              {showIntro ? '▾' : '▸'} Introducción a {name}
            </Text>
          </Pressable>
          {showIntro && <Blocks blocks={intro} onOpenRef={onOpenRef} />}
        </View>
      )}

      <View onLayout={(e) => (listTop.current = e.nativeEvent.layout.y)}>
        {notes.map((n) => (
          <View
            key={n.v}
            onLayout={(e) => {
              noteY.current.set(n.v, e.nativeEvent.layout.y);
              if (pending.current === n.v) {
                pending.current = null;
                requestAnimationFrame(() => scrollTo(n.v));
              }
            }}
            style={[styles.note, n.v === verse && styles.noteFocused]}>
            <Text style={[styles.verseRef, fs(13)]}>
              {name} {chapter}:{n.v}
            </Text>
            <Blocks blocks={n.blocks} onOpenRef={onOpenRef} />
          </View>
        ))}
      </View>

      <Text style={styles.credit}>
        Santa Biblia, Nueva Traducción BibliaTodo (NTBT). Publicada por{' '}
        <Text style={styles.link} onPress={() => Linking.openURL(CREDIT_URL)} accessibilityRole="link">
          BibliaTodo Bible Society
        </Text>
        , sello editorial de BibliaTodo LLC.
      </Text>
    </ScrollView>
  );
}

function Blocks({ blocks, onOpenRef }: { blocks: StudyBlock[]; onOpenRef: OpenRef }) {
  const fs = useFontScale();
  const p = [styles.p, fs(16, 25)];
  return (
    <View style={styles.blocks}>
      {blocks.map((b, i) => {
        if (b.k === 'li') {
          return (
            <View key={i} style={styles.li}>
              <Text style={[...p, styles.marker]}>{b.n != null ? `${b.n}.` : '•'}</Text>
              <Text style={[...p, styles.liText]} selectable>
                <RichRuns runs={b.r} onOpenRef={onOpenRef} />
              </Text>
            </View>
          );
        }
        return (
          <Text
            key={i}
            style={b.k === 'h2' ? [styles.h2, fs(17, 23)] : b.k === 'h3' ? [styles.h3, fs(14, 20)] : p}
            accessibilityRole={b.k === 'p' ? 'text' : 'header'}
            selectable>
            <RichRuns runs={b.r} onOpenRef={onOpenRef} />
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  center: { padding: Spacing.four, alignItems: 'center', gap: Spacing.three },
  loading: { marginTop: Spacing.five },
  message: { color: Colors.textSecondary, textAlign: 'center', fontFamily: Fonts.sans },
  retry: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: 8, backgroundColor: Colors.navy },
  retryText: { color: '#FFFFFF', fontWeight: '600', fontFamily: Fonts.sans },
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
  note: {
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.one,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    marginBottom: Spacing.four,
    gap: Spacing.one,
  },
  noteFocused: { borderLeftColor: Colors.gold },
  verseRef: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, fontFamily: Fonts.sans },
  blocks: { gap: Spacing.two },
  h2: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  h3: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: Colors.gold, fontFamily: Fonts.sans, marginTop: Spacing.one },
  p: { fontSize: 16, lineHeight: 25, color: Colors.text, fontFamily: Fonts.serif },
  li: { flexDirection: 'row', paddingLeft: Spacing.one },
  marker: { width: 22, color: Colors.textSecondary },
  liText: { flex: 1 },
  credit: { fontSize: 12, lineHeight: 18, color: Colors.textSecondary, textAlign: 'center', fontFamily: Fonts.sans },
  link: { color: Colors.navy, textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
});
