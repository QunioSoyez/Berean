import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { ContinueCard, loadProgress, saveProgress } from '@/games/progress';
import { STORIES, type Story } from '@/games/story-scramble-stories';
import { chapterHref } from '@/navigation';
import { getLastPosition } from '@/state/last-position';

/** Stories per round. */
const ROUND_SIZE = 5;
const BEST_KEY = 'berean.games.storyScramble.best.v1';
/** The round in progress (see games/progress.tsx). */
const SAVE_KEY = 'berean.games.storyScramble.inProgress.v1';
/** Back-button label in the reader; must match SIDE_TRIP_FROM in the reader. */
const BACK_LABEL = 'Story Scramble';

type Mode = 'ALL' | 'OT' | 'NT';
const MODES: { id: Mode; label: string; note: string }[] = [
  { id: 'ALL', label: 'Whole Bible', note: 'Stories from Genesis to Acts' },
  { id: 'OT', label: 'Old Testament', note: 'Creation to Esther' },
  { id: 'NT', label: 'New Testament', note: 'The Gospels and Acts' },
];

type Puzzle = { story: Story; pool: string[] };
type Best = Partial<Record<Mode, number>>;
type Saved = {
  mode: Mode;
  round: Puzzle[];
  index: number;
  placed: string[];
  checked: boolean;
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

/** Shuffles a story's events, making sure they don't come out already in order. */
function scrambled(events: readonly string[]): string[] {
  let s = shuffle(events);
  while (s.every((e, i) => e === events[i])) s = shuffle(events);
  return s;
}

function newRound(mode: Mode): Puzzle[] {
  const pool = mode === 'ALL' ? STORIES : STORIES.filter((s) => s.testament === mode);
  return shuffle(pool)
    .slice(0, ROUND_SIZE)
    .map((story) => ({ story, pool: scrambled(story.events) }));
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

/** Story Scramble: tap a story's events in order, first to last. */
export default function StoryScrambleScreen() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [round, setRound] = useState<Puzzle[]>([]);
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
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
    const s: Saved | null = finished ? null : { mode, round, index, placed, checked, solved };
    setSaved(s);
    saveProgress(SAVE_KEY, s);
  }, [mode, round, index, placed, checked, solved, finished]);

  const resume = (s: Saved) => {
    setMode(s.mode);
    setRound(s.round);
    setIndex(s.index);
    setPlaced(s.placed);
    setChecked(s.checked);
    setSolved(s.solved);
    setFinished(false);
    setNewBest(false);
  };

  const start = (m: Mode) => {
    setMode(m);
    setRound(newRound(m));
    setIndex(0);
    setPlaced([]);
    setChecked(false);
    setSolved(0);
    setFinished(false);
    setNewBest(false);
  };

  // Look the puzzle up when the handler runs (see the note in word-scramble.tsx about the
  // React Compiler caching handlers by what they read).
  const check = () => {
    const { story } = round[index];
    setChecked(true);
    if (placed.every((e, i) => e === story.events[i])) setSolved((s) => s + 1);
  };

  const next = () => {
    if (index + 1 < round.length) {
      setIndex(index + 1);
      setPlaced([]);
      setChecked(false);
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

  const readStory = (s: Story) =>
    router.push(chapterHref(version, s.book, s.chapter, undefined, false, BACK_LABEL));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Story Scramble" />
      <ScrollView contentContainerStyle={styles.scroll}>
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
              checked={checked}
              onPlace={(e) => setPlaced((p) => [...p, e])}
              onRemove={(e) => setPlaced((p) => p.filter((x) => x !== e))}
              onClear={() => setPlaced([])}
              onCheck={check}
              onNext={next}
              onRead={readStory}
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
      <Text style={styles.title}>Story Scramble</Text>
      <Text style={styles.lead}>
        The events of {ROUND_SIZE} Bible stories have been mixed up. Tap them in the order they
        happened, first to last.
      </Text>
      {saved && (
        <ContinueCard
          detail={`${saved.round[saved.index].story.title} · story ${saved.index + 1} of ${saved.round.length} · solved ${saved.solved}`}
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
  checked,
  onPlace,
  onRemove,
  onClear,
  onCheck,
  onNext,
  onRead,
  isLast,
}: {
  puzzle: Puzzle;
  number: number;
  total: number;
  solved: number;
  placed: string[];
  checked: boolean;
  onPlace: (e: string) => void;
  onRemove: (e: string) => void;
  onClear: () => void;
  onCheck: () => void;
  onNext: () => void;
  onRead: (s: Story) => void;
  isLast: boolean;
}) {
  const { story, pool } = puzzle;
  const remaining = pool.filter((e) => !placed.includes(e));
  const allPlaced = remaining.length === 0;
  const rightCount = placed.filter((e, i) => e === story.events[i]).length;
  const perfect = checked && rightCount === story.events.length;

  return (
    <>
      <View style={styles.progressRow}>
        <Text style={styles.progress}>
          Story {number} of {total}
        </Text>
        <Text style={styles.progress}>Solved {solved}</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${((number - 1) / total) * 100}%` }]} />
      </View>

      <Text style={styles.storyTitle} accessibilityRole="header">
        {story.title}
      </Text>
      <Text style={styles.range}>{story.range}</Text>

      {/* Events still to place — on top, so the next tap is always near the title. */}
      {!checked && remaining.length > 0 && (
        <>
          <Text style={styles.label}>Tap the events in order, first to last</Text>
          {remaining.map((e) => (
            <Pressable
              key={e}
              onPress={() => onPlace(e)}
              accessibilityRole="button"
              style={({ pressed, hovered }) => [styles.event, (pressed || hovered) && styles.eventActive]}>
              <Text style={styles.eventText}>{e}</Text>
            </Pressable>
          ))}
        </>
      )}

      {/* Your order */}
      <Text style={[styles.label, !checked && remaining.length > 0 && styles.poolLabel]}>
        {checked ? 'Your order' : 'Your order (tap one to send it back)'}
      </Text>
      {story.events.map((_, i) => {
        const e = placed[i];
        const right = checked && e === story.events[i];
        const wrong = checked && !right;
        return (
          <Pressable
            key={i}
            onPress={() => e && !checked && onRemove(e)}
            disabled={!e || checked}
            accessibilityRole="button"
            accessibilityLabel={e ? `Step ${i + 1}: ${e}. Tap to remove` : `Step ${i + 1}: empty`}
            style={[
              styles.slot,
              e ? styles.slotFilled : styles.slotEmpty,
              right && styles.slotRight,
              wrong && styles.slotWrong,
            ]}>
            <Text style={[styles.slotNum, (right || wrong) && styles.onColor]}>{i + 1}</Text>
            <Text style={[styles.slotText, !e && styles.slotPlaceholder, (right || wrong) && styles.onColor]}>
              {e ?? '—'}
            </Text>
            {checked && <Text style={[styles.mark, styles.onColor]}>{right ? '✓' : '✗'}</Text>}
          </Pressable>
        );
      })}

      {!checked && (
        <>
          <View style={styles.actions}>
            {placed.length > 0 && (
              <Pressable
                onPress={onClear}
                accessibilityRole="button"
                style={({ pressed }) => [styles.secondary, styles.actionHalf, pressed && styles.pressed]}>
                <Text style={styles.secondaryText}>Start over</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onCheck}
              disabled={!allPlaced}
              accessibilityRole="button"
              accessibilityState={{ disabled: !allPlaced }}
              style={({ pressed }) => [
                styles.primary,
                styles.actionHalf,
                !allPlaced && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.primaryText}>Check order</Text>
            </Pressable>
          </View>
        </>
      )}

      {checked && (
        <View accessibilityLiveRegion="polite">
          <Text style={[styles.verdict, perfect ? styles.verdictRight : styles.verdictWrong]}>
            {perfect
              ? 'Perfect order!'
              : `${rightCount} of ${story.events.length} in the right place.`}
          </Text>

          {!perfect && (
            <>
              <Text style={[styles.label, styles.poolLabel]}>Correct order</Text>
              {story.events.map((e, i) => (
                <View key={e} style={styles.answerRow}>
                  <Text style={styles.answerNum}>{i + 1}</Text>
                  <Text style={styles.answerText}>{e}</Text>
                </View>
              ))}
            </>
          )}

          <Pressable onPress={() => onRead(story)} accessibilityRole="link" style={styles.readLink}>
            <Text style={styles.refLink}>Read the story in {story.range} ›</Text>
          </Pressable>

          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{isLast ? 'See results' : 'Next story'}</Text>
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
      ? 'Every story in perfect order. Well done!'
      : solved >= total * 0.6
        ? 'Great job! You know these stories well.'
        : 'Each story is worth reading again. Keep at it!';
  return (
    <>
      <Text style={styles.title}>
        {solved} / {total}
      </Text>
      <Text style={styles.lead}>
        {solved === 1 ? '1 story' : `${solved} stories`} in perfect order. {message}
      </Text>
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

  storyTitle: {
    fontFamily: Fonts.script,
    fontSize: 34,
    color: Colors.navy,
    marginTop: Spacing.three,
  },
  range: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.three, fontFamily: Fonts.sans },

  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.two,
  },
  slotEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.border },
  slotFilled: { borderWidth: 1, borderColor: Colors.navy, backgroundColor: Colors.surface },
  slotRight: { backgroundColor: GREEN, borderColor: GREEN },
  slotWrong: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  slotNum: { width: 22, fontSize: 16, fontWeight: '700', color: Colors.gold, fontFamily: Fonts.sans },
  slotText: { flex: 1, fontSize: 16, lineHeight: 22, color: Colors.text, fontFamily: Fonts.sans },
  slotPlaceholder: { color: Colors.textSecondary },
  mark: { fontSize: 18, fontWeight: '700' },
  onColor: { color: '#FFFFFF' },

  poolLabel: { marginTop: Spacing.three },
  event: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.two,
  },
  eventActive: { backgroundColor: Colors.surface, borderColor: Colors.navy },
  eventText: { fontSize: 16, lineHeight: 22, color: Colors.text, fontFamily: Fonts.sans },

  actions: { flexDirection: 'row', gap: Spacing.two },
  actionHalf: { flex: 1, marginTop: Spacing.four },

  verdict: { fontSize: 18, fontWeight: '700', marginTop: Spacing.two, fontFamily: Fonts.sans },
  verdictRight: { color: GREEN },
  verdictWrong: { color: Colors.danger },
  answerRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.one },
  answerNum: { width: 22, fontSize: 16, fontWeight: '700', color: Colors.gold, fontFamily: Fonts.sans },
  answerText: { flex: 1, fontSize: 16, lineHeight: 22, color: Colors.text, fontFamily: Fonts.sans },
  readLink: { marginTop: Spacing.three },
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
  disabled: { opacity: 0.4 },
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
