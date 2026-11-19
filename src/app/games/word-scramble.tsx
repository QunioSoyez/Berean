import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bookName } from '@/bible/books';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { ContinueCard, loadProgress, saveProgress } from '@/games/progress';
import { SCRAMBLE_WORDS, type ScrambleWord } from '@/games/word-scramble-words';
import { chapterHref } from '@/navigation';
import { getLastPosition } from '@/state/last-position';

/** Words per round. */
const ROUND_SIZE = 10;
/** Wrong tries before "Show answer" appears. */
const TRIES_BEFORE_REVEAL = 3;
const BEST_KEY = 'berean.games.wordScramble.best.v1';
/** The round in progress (see games/progress.tsx). */
const SAVE_KEY = 'berean.games.wordScramble.inProgress.v1';
/** Back-button label in the reader; must match SIDE_TRIP_FROM in the reader. */
const BACK_LABEL = 'Word Scramble';
const TILE_GAP = 6;

type Mode = 'ALL' | 'OT' | 'NT';
const MODES: { id: Mode; label: string; note: string }[] = [
  { id: 'ALL', label: 'Whole Bible', note: 'Names, places and words from both testaments' },
  { id: 'OT', label: 'Old Testament', note: 'Genesis to Jonah' },
  { id: 'NT', label: 'New Testament', note: 'The Gospels to Revelation' },
];

/** A letter tile; `id` keeps repeated letters (the two Ns in MANNA) apart. */
type Tile = { id: number; letter: string };
type Puzzle = { w: ScrambleWord; tiles: Tile[] };
type Status = 'playing' | 'wrong' | 'solved' | 'revealed';
type Best = Partial<Record<Mode, number>>;
type Saved = {
  mode: Mode;
  round: Puzzle[];
  index: number;
  placed: number[];
  status: Status;
  tries: number;
  solved: number;
};

function validSaved(s: Saved | null): Saved | null {
  return s && Array.isArray(s.round) && s.index >= 0 && s.index < s.round.length ? s : null;
}

function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Mixes the letters, making sure they don't spell the word as dealt. */
function scramble(word: string): Tile[] {
  const tiles = word.split('').map((letter, id) => ({ id, letter }));
  let s = shuffle(tiles);
  for (let i = 0; i < 20 && s.map((t) => t.letter).join('') === word; i++) s = shuffle(tiles);
  return s;
}

function newRound(mode: Mode): Puzzle[] {
  const pool = mode === 'ALL' ? SCRAMBLE_WORDS : SCRAMBLE_WORDS.filter((w) => w.testament === mode);
  return shuffle(pool)
    .slice(0, ROUND_SIZE)
    .map((w) => ({ w, tiles: scramble(w.word) }));
}

function refText(w: ScrambleWord) {
  return `${bookName(w.book)} ${w.chapter}:${w.verse}`;
}

async function loadBest(): Promise<Best> {
  try {
    return JSON.parse((await AsyncStorage.getItem(BEST_KEY)) ?? '{}') as Best;
  } catch {
    return {};
  }
}

async function saveBest(best: Best) {
  try {
    await AsyncStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch {
    // Not worth interrupting the game for.
  }
}

/** Word Scramble: tap the letter tiles in order to spell a Bible word, with a clue and verse. */
export default function WordScrambleScreen() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [round, setRound] = useState<Puzzle[]>([]);
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]); // tile ids, in answer order
  const [status, setStatus] = useState<Status>('playing');
  const [tries, setTries] = useState(0);
  const [solved, setSolved] = useState(0);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState<Best>({});
  const [newBest, setNewBest] = useState(false);
  const [version, setVersion] = useState('KJV');
  const [saved, setSaved] = useState<Saved | null>(null);

  useEffect(() => {
    loadBest().then(setBest);
    loadProgress<Saved>(SAVE_KEY).then((s) => setSaved(validSaved(s)));
    getLastPosition().then((p) => setVersion(p.version));
  }, []);

  // Keep the round in progress saved; clear it once the round is finished.
  useEffect(() => {
    if (!mode) return;
    const s: Saved | null = finished ? null : { mode, round, index, placed, status, tries, solved };
    setSaved(s);
    saveProgress(SAVE_KEY, s);
  }, [mode, round, index, placed, status, tries, solved, finished]);

  const resume = (s: Saved) => {
    setMode(s.mode);
    setRound(s.round);
    setIndex(s.index);
    setPlaced(s.placed);
    setStatus(s.status);
    setTries(s.tries);
    setSolved(s.solved);
    setFinished(false);
    setNewBest(false);
  };

  const start = (m: Mode) => {
    setMode(m);
    setRound(newRound(m));
    setIndex(0);
    setPlaced([]);
    setStatus('playing');
    setTries(0);
    setSolved(0);
    setFinished(false);
    setNewBest(false);
  };

  // Handlers look the puzzle up when they run (not from a variable set during render):
  // the React Compiler caches handlers by what they read, and on the start screen there's
  // no puzzle yet, so reading `puzzle.tiles` up front crashed the page.
  const current = (): Puzzle => round[index];

  const place = (tileId: number) => {
    if (status === 'solved' || status === 'revealed') return;
    const puzzle = current();
    const next = [...placed, tileId];
    setPlaced(next);
    if (next.length < puzzle.w.word.length) {
      setStatus('playing');
      return;
    }
    // Every letter is down: check it.
    const spelled = next.map((id) => puzzle.tiles.find((t) => t.id === id)!.letter).join('');
    if (spelled === puzzle.w.word) {
      setStatus('solved');
      setSolved((s) => s + 1);
    } else {
      setStatus('wrong');
      setTries((t) => t + 1);
    }
  };

  const unplace = (tileId: number) => {
    if (status === 'solved' || status === 'revealed') return;
    setPlaced((p) => p.filter((id) => id !== tileId));
    setStatus('playing');
  };

  const clear = () => {
    setPlaced([]);
    setStatus('playing');
  };

  const reveal = () => {
    const puzzle = current();
    // Lay the tiles out in the right order (matching repeated letters left to right).
    const left = [...puzzle.tiles];
    const order = puzzle.w.word.split('').map((ch) => {
      const i = left.findIndex((t) => t.letter === ch);
      return left.splice(i, 1)[0].id;
    });
    setPlaced(order);
    setStatus('revealed');
  };

  const next = () => {
    if (index + 1 < round.length) {
      setIndex(index + 1);
      setPlaced([]);
      setStatus('playing');
      setTries(0);
      return;
    }
    setFinished(true);
    if (mode && solved > (best[mode] ?? -1)) {
      const updated = { ...best, [mode]: solved };
      setBest(updated);
      setNewBest(true);
      saveBest(updated);
    }
  };

  const readIt = (w: ScrambleWord) =>
    router.push(chapterHref(version, w.book, w.chapter, [w.verse], false, BACK_LABEL));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Word Scramble" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          {!mode ? (
            <StartView best={best} saved={saved} onStart={start} onResume={resume} />
          ) : finished ? (
            <ResultsView
              solved={solved}
              total={round.length}
              best={best[mode] ?? solved}
              newBest={newBest}
              onAgain={() => start(mode)}
              onChangeMode={() => setMode(null)}
            />
          ) : (
            <PuzzleView
              puzzle={round[index]}
              number={index + 1}
              total={round.length}
              solved={solved}
              placed={placed}
              status={status}
              canReveal={tries >= TRIES_BEFORE_REVEAL}
              onPlace={place}
              onUnplace={unplace}
              onClear={clear}
              onReveal={reveal}
              onNext={next}
              onReadIt={readIt}
              isLast={index + 1 === round.length}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StartView({
  best,
  saved,
  onStart,
  onResume,
}: {
  best: Best;
  saved: Saved | null;
  onStart: (m: Mode) => void;
  onResume: (s: Saved) => void;
}) {
  return (
    <>
      <Text style={styles.title}>Word Scramble</Text>
      <Text style={styles.lead}>
        Unscramble {ROUND_SIZE} names, places and words from the Bible. Each one comes with a clue
        and the verse where it’s found.
      </Text>
      {saved && (
        <ContinueCard
          detail={`${MODES.find((m) => m.id === saved.mode)?.label} · word ${saved.index + 1} of ${saved.round.length} · solved ${saved.solved}`}
          onPress={() => onResume(saved)}
        />
      )}
      <Text style={styles.label}>{saved ? 'Or start a new round' : 'Choose a round'}</Text>
      {MODES.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => onStart(m.id)}
          accessibilityRole="button"
          style={({ pressed, hovered }) => [styles.card, (pressed || hovered) && styles.cardActive]}>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{m.label}</Text>
            <Text style={styles.cardNote}>{m.note}</Text>
          </View>
          {best[m.id] != null && (
            <Text style={styles.cardBest}>
              Best {best[m.id]}/{ROUND_SIZE}
            </Text>
          )}
        </Pressable>
      ))}
    </>
  );
}

function PuzzleView({
  puzzle,
  number,
  total,
  solved,
  placed,
  status,
  canReveal,
  onPlace,
  onUnplace,
  onClear,
  onReveal,
  onNext,
  onReadIt,
  isLast,
}: {
  puzzle: Puzzle;
  number: number;
  total: number;
  solved: number;
  placed: number[];
  status: Status;
  canReveal: boolean;
  onPlace: (id: number) => void;
  onUnplace: (id: number) => void;
  onClear: () => void;
  onReveal: () => void;
  onNext: () => void;
  onReadIt: (w: ScrambleWord) => void;
  isLast: boolean;
}) {
  const { w, tiles } = puzzle;
  const { width } = useWindowDimensions();
  const done = status === 'solved' || status === 'revealed';

  // Size tiles so the whole word fits on one row (up to a comfortable maximum).
  const rowWidth = Math.min(width, MaxReadingWidth) - Spacing.three * 2;
  const n = w.word.length;
  const size = Math.max(30, Math.min(52, Math.floor((rowWidth - TILE_GAP * (n - 1)) / n)));
  const tileBox = { width: size, height: size + 6 };
  const letterSize = { fontSize: Math.round(size * 0.5) };

  const letterOf = (id: number) => tiles.find((t) => t.id === id)!.letter;

  return (
    <>
      <View style={styles.progressRow}>
        <Text style={styles.progress}>
          Word {number} of {total}
        </Text>
        <Text style={styles.progress}>Solved {solved}</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${((number - 1) / total) * 100}%` }]} />
      </View>

      {/* Clue */}
      <View style={styles.clueBox}>
        <Text style={styles.clue}>{w.clue}</Text>
        <Text style={styles.clueRef}>
          {refText(w)} · {n} letters
        </Text>
      </View>

      {/* Answer row */}
      <Text style={styles.label}>Your answer</Text>
      <View style={styles.tileRow}>
        {Array.from({ length: n }, (_, i) => {
          const id = placed[i];
          const filled = id != null;
          return (
            <Pressable
              key={i}
              onPress={() => filled && onUnplace(id)}
              disabled={!filled || done}
              accessibilityRole="button"
              accessibilityLabel={filled ? `${letterOf(id)}, tap to remove` : 'Empty'}
              style={[
                styles.tile,
                tileBox,
                filled ? styles.slotFilled : styles.slotEmpty,
                status === 'wrong' && styles.tileWrong,
                status === 'solved' && styles.tileRight,
                status === 'revealed' && styles.tileRevealed,
              ]}>
              <Text
                style={[
                  styles.tileText,
                  letterSize,
                  (status === 'wrong' || status === 'solved' || status === 'revealed') && styles.onColor,
                ]}>
                {filled ? letterOf(id) : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Letter tiles — used tiles stay as faint placeholders so nothing jumps around. */}
      {!done && (
        <>
          <Text style={[styles.label, styles.gapAbove]}>Tap the letters in order</Text>
          <View style={styles.tileRow}>
            {tiles.map((t) => {
              const used = placed.includes(t.id);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => !used && onPlace(t.id)}
                  disabled={used}
                  accessibilityRole="button"
                  accessibilityLabel={t.letter}
                  style={({ pressed, hovered }) => [
                    styles.tile,
                    tileBox,
                    used ? styles.tileUsed : styles.tileFree,
                    !used && (pressed || hovered) && styles.tileActive,
                  ]}>
                  <Text style={[styles.tileText, letterSize, styles.onColor, used && styles.hidden]}>
                    {t.letter}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {status === 'wrong' && (
        <Text style={[styles.verdict, styles.verdictWrong]} accessibilityLiveRegion="polite">
          Not quite. Tap a letter to send it back, or start over.
        </Text>
      )}

      {!done && (
        <View style={styles.actions}>
          {placed.length > 0 && (
            <Pressable
              onPress={onClear}
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondary, styles.actionHalf, pressed && styles.pressed]}>
              <Text style={styles.secondaryText}>Start over</Text>
            </Pressable>
          )}
          {canReveal && (
            <Pressable
              onPress={onReveal}
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondary, styles.actionHalf, pressed && styles.pressed]}>
              <Text style={styles.secondaryText}>Show answer</Text>
            </Pressable>
          )}
        </View>
      )}

      {done && (
        <View accessibilityLiveRegion="polite">
          <Text style={[styles.verdict, status === 'solved' ? styles.verdictRight : styles.verdictShown]}>
            {status === 'solved' ? 'Correct!' : `The word is ${w.word}.`}
          </Text>
          <View style={styles.refRow}>
            <Text style={styles.refText}>{refText(w)}</Text>
            <Pressable onPress={() => onReadIt(w)} accessibilityRole="link" hitSlop={6}>
              <Text style={styles.refLink}>Read it ›</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{isLast ? 'See results' : 'Next word'}</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

function ResultsView({
  solved,
  total,
  best,
  newBest,
  onAgain,
  onChangeMode,
}: {
  solved: number;
  total: number;
  best: number;
  newBest: boolean;
  onAgain: () => void;
  onChangeMode: () => void;
}) {
  const message =
    solved === total
      ? 'Every word unscrambled. Well done!'
      : solved >= total * 0.7
        ? 'Great job! You know your Bible words.'
        : 'Each round is a chance to learn something new.';
  return (
    <>
      <Text style={styles.title}>
        {solved} / {total}
      </Text>
      <Text style={styles.lead}>{message}</Text>
      <Text style={styles.bestLine}>{newBest ? 'New best score!' : `Your best: ${best}/${total}`}</Text>
      <Pressable
        onPress={onAgain}
        accessibilityRole="button"
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
        <Text style={styles.primaryText}>Play again</Text>
      </Pressable>
      <Pressable
        onPress={onChangeMode}
        accessibilityRole="button"
        style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
        <Text style={styles.secondaryText}>Choose another round</Text>
      </Pressable>
    </>
  );
}

const GREEN = '#1E7B3A';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.six },
  column: { width: '100%', maxWidth: MaxReadingWidth, alignSelf: 'center', padding: Spacing.three },

  title: {
    fontFamily: Fonts.script,
    fontSize: 40,
    color: Colors.navy,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  lead: {
    fontSize: 17,
    lineHeight: 25,
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    fontFamily: Fonts.sans,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginBottom: Spacing.two,
    fontFamily: Fonts.sans,
  },
  gapAbove: { marginTop: Spacing.four },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.two,
  },
  cardActive: { backgroundColor: Colors.surface, borderColor: Colors.navy },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  cardNote: { fontSize: 14, color: Colors.textSecondary, marginTop: 2, fontFamily: Fonts.sans },
  cardBest: { fontSize: 14, fontWeight: '700', color: Colors.gold, fontFamily: Fonts.sans },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progress: { fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.sans },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surface,
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  barFill: { height: 6, backgroundColor: Colors.gold },

  clueBox: {
    marginTop: Spacing.four,
    marginBottom: Spacing.four,
    padding: Spacing.three,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
  clue: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: Colors.text, fontFamily: Fonts.sans },
  clueRef: { fontSize: 15, color: Colors.textSecondary, marginTop: Spacing.one, fontFamily: Fonts.sans },

  tileRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: TILE_GAP },
  tile: { alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  tileText: { fontWeight: '800', color: Colors.navy, fontFamily: Fonts.sans },
  slotEmpty: { borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border },
  slotFilled: { borderWidth: 2, borderColor: Colors.navy, backgroundColor: Colors.surface },
  tileFree: { backgroundColor: Colors.navy },
  tileActive: { backgroundColor: '#1A3F86' },
  tileUsed: { borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border },
  tileRight: { backgroundColor: GREEN, borderColor: GREEN },
  tileWrong: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  tileRevealed: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  hidden: { opacity: 0 },
  onColor: { color: '#FFFFFF' },

  actions: { flexDirection: 'row', gap: Spacing.two },
  actionHalf: { flex: 1, marginTop: Spacing.four },

  verdict: { fontSize: 18, fontWeight: '700', marginTop: Spacing.three, fontFamily: Fonts.sans },
  verdictRight: { color: GREEN },
  verdictWrong: { color: Colors.danger, fontSize: 16 },
  verdictShown: { color: Colors.gold },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.one },
  refText: { fontSize: 15, color: Colors.textSecondary, fontFamily: Fonts.sans },
  refLink: { fontSize: 15, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },

  primary: {
    marginTop: Spacing.four,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    backgroundColor: Colors.navy,
  },
  primaryText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', fontFamily: Fonts.sans },
  secondary: {
    marginTop: Spacing.two,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.navy,
  },
  secondaryText: { fontSize: 17, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  bestLine: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: Spacing.two,
    fontFamily: Fonts.sans,
  },

  pressed: { opacity: 0.6 },
});
