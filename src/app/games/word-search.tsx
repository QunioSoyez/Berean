import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { SEARCH_THEMES, type SearchTheme } from '@/games/word-search-puzzles';
import { chapterHref } from '@/navigation';
import { getLastPosition } from '@/state/last-position';

const SIZE = 10;
/** Puzzles completed per round type (no timer — it added pressure). */
const DONE_KEY = 'berean.games.wordSearch.completed.v1';
/** The puzzle in progress, so leaving the screen (or the app) doesn't lose it. */
const SAVE_KEY = 'berean.games.wordSearch.inProgress.v1';
/** Back-button label in the reader; must match SIDE_TRIP_FROM in the reader. */
const BACK_LABEL = 'Word Search';
/** Across, down, diagonal down-right, diagonal up-right — all read left to right / top to bottom. */
const DIRECTIONS: readonly [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
];
/** Soft highlight colours for found words (dark text stays readable on all of them). */
const FOUND_COLORS = ['#F3C969', '#9FD3A8', '#A9C7F0', '#F2A7A7', '#D3B5EE', '#F7C59F', '#A8E0DC', '#E6E39A'];

type Mode = 'ALL' | 'OT' | 'NT';
const MODES: { id: Mode; label: string; note: string }[] = [
  { id: 'ALL', label: 'Whole Bible', note: 'A story from either testament' },
  { id: 'OT', label: 'Old Testament', note: 'Creation to Esther' },
  { id: 'NT', label: 'New Testament', note: 'The Gospels to the epistles' },
];

type Cell = { r: number; c: number };
type Placement = { word: string; cells: Cell[] };
type Game = { theme: SearchTheme; grid: string[][]; placements: Placement[] };
type Completed = Partial<Record<Mode, number>>;
type Saved = { mode: Mode; game: Game; found: string[] };

const key = (p: Cell) => p.r * SIZE + p.c;

function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Places the theme's words in a fresh grid (longest first), then fills the gaps with random letters. */
function buildGame(theme: SearchTheme): Game {
  const words = [...theme.words].sort((a, b) => b.length - a.length);
  for (let attempt = 0; attempt < 200; attempt++) {
    const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
    const placements: Placement[] = [];
    let ok = true;
    for (const word of words) {
      let placed = false;
      for (let tries = 0; tries < 300 && !placed; tries++) {
        const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const r0 = Math.floor(Math.random() * SIZE);
        const c0 = Math.floor(Math.random() * SIZE);
        const cells: Cell[] = [];
        for (let i = 0; i < word.length; i++) {
          const r = r0 + dr * i;
          const c = c0 + dc * i;
          if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break;
          if (grid[r][c] !== '' && grid[r][c] !== word[i]) break;
          cells.push({ r, c });
        }
        if (cells.length !== word.length) continue;
        cells.forEach((p, i) => (grid[p.r][p.c] = word[i]));
        placements.push({ word, cells });
        placed = true;
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const letters = 'ABCDEFGHIJKLMNOPRSTUVWY'; // skips Q, X, Z so filler doesn't look odd
    for (const row of grid) {
      for (let c = 0; c < SIZE; c++) {
        if (row[c] === '') row[c] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
    return { theme, grid, placements };
  }
  throw new Error(`Couldn't build a grid for ${theme.title}`);
}

/** Cells on the straight line from a to b, or null if a→b isn't across, down or diagonal. */
function lineBetween(a: Cell, b: Cell): Cell[] | null {
  const dr = b.r - a.r;
  const dc = b.c - a.c;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const n = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  return Array.from({ length: n + 1 }, (_, i) => ({ r: a.r + sr * i, c: a.c + sc * i }));
}

function sameCells(a: Cell[], b: Cell[]) {
  return a.length === b.length && a.every((p, i) => key(p) === key(b[i]));
}

async function loadJSON<T>(k: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function saveJSON(k: string, value: unknown) {
  try {
    if (value == null) await AsyncStorage.removeItem(k);
    else await AsyncStorage.setItem(k, JSON.stringify(value));
  } catch {
    // Not worth interrupting the game for.
  }
}

/** A saved puzzle is only used if its story still exists (content can change between versions). */
function validSaved(s: Saved | null): Saved | null {
  if (!s?.game?.theme?.id || !SEARCH_THEMES.some((t) => t.id === s.game.theme.id)) return null;
  return s;
}

/** Word Search: find 8 words from a Bible story in a 10×10 grid by dragging or tapping first and last letters. */
export default function WordSearchScreen() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<Cell | null>(null); // where the current drag started
  const [selection, setSelection] = useState<Cell[]>([]);
  const [pendingTap, setPendingTap] = useState<Cell | null>(null); // first tap of tap-tap mode
  const [dragging, setDragging] = useState(false);
  const [completed, setCompleted] = useState<Completed>({});
  const [saved, setSaved] = useState<Saved | null>(null);
  const [version, setVersion] = useState('KJV');
  const { width } = useWindowDimensions();

  useEffect(() => {
    loadJSON<Completed>(DONE_KEY, {}).then(setCompleted);
    loadJSON<Saved | null>(SAVE_KEY, null).then((s) => setSaved(validSaved(s)));
    getLastPosition().then((p) => setVersion(p.version));
  }, []);

  const total = game?.placements.length ?? 0;
  const solved = total > 0 && found.length === total;

  // Keep the puzzle in progress saved; clear it once it's finished.
  useEffect(() => {
    if (!game || !mode) return;
    const s: Saved | null = solved ? null : { mode, game, found };
    setSaved(s);
    saveJSON(SAVE_KEY, s);
  }, [game, mode, found, solved]);

  const resume = (s: Saved) => {
    setMode(s.mode);
    setGame(s.game);
    setFound(s.found);
    setSelection([]);
    setAnchor(null);
    setPendingTap(null);
  };

  const start = (m: Mode) => {
    const pool = m === 'ALL' ? SEARCH_THEMES : SEARCH_THEMES.filter((t) => t.testament === m);
    // Avoid repeating the story just played, when there's a choice.
    const choices = pool.length > 1 && game ? pool.filter((t) => t.id !== game.theme.id) : pool;
    setMode(m);
    setGame(buildGame(shuffle(choices)[0]));
    setFound([]);
    setSelection([]);
    setAnchor(null);
    setPendingTap(null);
  };

  // Grid geometry: 10 cells across, sized to fit the screen.
  const gridWidth = Math.min(width, MaxReadingWidth) - Spacing.three * 2;
  const cell = Math.max(28, Math.min(46, Math.floor(gridWidth / SIZE)));

  const cellAt = (e: GestureResponderEvent): Cell => {
    const { locationX, locationY } = e.nativeEvent;
    const clamp = (n: number) => Math.max(0, Math.min(SIZE - 1, n));
    return { r: clamp(Math.floor(locationY / cell)), c: clamp(Math.floor(locationX / cell)) };
  };

  /** Checks a finished selection against the words not yet found. */
  const tryWord = (cells: Cell[]) => {
    const g = game;
    if (!g || cells.length < 2) return false;
    const reversed = [...cells].reverse();
    const hit = g.placements.find(
      (p) => !found.includes(p.word) && (sameCells(p.cells, cells) || sameCells(p.cells, reversed)),
    );
    if (!hit) return false;
    const nowFound = [...found, hit.word];
    setFound(nowFound);
    if (nowFound.length === g.placements.length && mode) {
      const updated = { ...completed, [mode]: (completed[mode] ?? 0) + 1 };
      setCompleted(updated);
      saveJSON(DONE_KEY, updated);
    }
    return true;
  };

  const onGrant = (e: GestureResponderEvent) => {
    if (solved) return;
    const p = cellAt(e);
    setDragging(true);
    setAnchor(p);
    setSelection([p]);
  };

  const onMove = (e: GestureResponderEvent) => {
    if (!anchor) return;
    const line = lineBetween(anchor, cellAt(e));
    if (line) setSelection(line); // off-angle moves keep the last straight line
  };

  const onRelease = () => {
    setDragging(false);
    const a = anchor;
    setAnchor(null);
    if (!a) return;
    if (selection.length > 1) {
      // Dragged across a word.
      tryWord(selection);
      setPendingTap(null);
      setSelection([]);
      return;
    }
    // A tap: first tap marks the start, second tap the end.
    if (pendingTap && key(pendingTap) !== key(a)) {
      const line = lineBetween(pendingTap, a);
      if (line) tryWord(line);
      setPendingTap(null);
    } else {
      setPendingTap(pendingTap && key(pendingTap) === key(a) ? null : a);
    }
    setSelection([]);
  };

  const readStory = (t: SearchTheme) =>
    router.push(chapterHref(version, t.book, t.chapter, undefined, false, BACK_LABEL));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Word Search" />
      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={!dragging}>
        <View style={styles.column}>
          {!mode || !game ? (
            <StartView completed={completed} saved={saved} onStart={start} onResume={resume} />
          ) : (
            <>
              <Text style={styles.storyTitle} accessibilityRole="header">
                {game.theme.title}
              </Text>
              <View style={styles.statusRow}>
                <Text style={styles.status}>{game.theme.range}</Text>
                <Text style={styles.status}>
                  Found {found.length} of {total}
                </Text>
              </View>

              {/* Grid. The cells ignore touches so every position is measured from the grid itself. */}
              <View
                style={[styles.grid, { width: cell * SIZE, height: cell * SIZE }, webNoSelect]}
                onStartShouldSetResponder={() => !solved}
                onMoveShouldSetResponder={() => !solved}
                onResponderTerminationRequest={() => false}
                onResponderGrant={onGrant}
                onResponderMove={onMove}
                onResponderRelease={onRelease}
                onResponderTerminate={onRelease}
                accessibilityLabel={`Letter grid. Words to find: ${game.theme.words.join(', ')}`}>
                <View style={styles.noTouch}>
                  {game.grid.map((row, r) => (
                    <View key={r} style={styles.gridRow}>
                      {row.map((letter, c) => {
                        const k = r * SIZE + c;
                        const foundIdx = game.placements.findIndex(
                          (p) => found.includes(p.word) && p.cells.some((q) => key(q) === k),
                        );
                        const selected = selection.some((q) => key(q) === k);
                        const isPending = pendingTap && key(pendingTap) === k;
                        return (
                          <View
                            key={c}
                            style={[
                              styles.cell,
                              { width: cell, height: cell },
                              foundIdx >= 0 && {
                                backgroundColor: FOUND_COLORS[foundIdx % FOUND_COLORS.length],
                              },
                              (selected || isPending) && styles.cellSelected,
                            ]}>
                            <Text
                              style={[
                                styles.letter,
                                { fontSize: Math.round(cell * 0.5) },
                                (selected || isPending) && styles.letterSelected,
                              ]}>
                              {letter}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
              {!solved && (
                <Text style={styles.hint}>
                  Drag across a word, or tap its first and last letters. Your progress is saved if you leave.
                </Text>
              )}

              {/* Words to find */}
              <View style={styles.words}>
                {game.theme.words.map((w) => {
                  const idx = game.placements.findIndex((p) => p.word === w);
                  const isFound = found.includes(w);
                  return (
                    <View
                      key={w}
                      style={[
                        styles.wordChip,
                        isFound && { backgroundColor: FOUND_COLORS[idx % FOUND_COLORS.length] },
                      ]}>
                      <Text style={[styles.wordText, isFound && styles.wordFound]}>{w}</Text>
                    </View>
                  );
                })}
              </View>

              {solved ? (
                <View accessibilityLiveRegion="polite">
                  <Text style={styles.done}>All {total} words found. Well done!</Text>
                  <Text style={styles.bestLine}>
                    {completed[mode] === 1 ? 'Your first puzzle complete!' : `Puzzles completed: ${completed[mode] ?? 1}`}
                  </Text>
                  <Pressable onPress={() => readStory(game.theme)} accessibilityRole="link" style={styles.readLink}>
                    <Text style={styles.refLink}>Read the story in {game.theme.range} ›</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => start(mode)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                    <Text style={styles.primaryText}>New puzzle</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setMode(null)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                    <Text style={styles.secondaryText}>Choose another round</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => readStory(game.theme)}
                    accessibilityRole="link"
                    style={({ pressed }) => [styles.secondary, styles.actionHalf, pressed && styles.pressed]}>
                    <Text style={styles.secondaryText}>Read the story</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => start(mode)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.secondary, styles.actionHalf, pressed && styles.pressed]}>
                    <Text style={styles.secondaryText}>New puzzle</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StartView({
  completed,
  saved,
  onStart,
  onResume,
}: {
  completed: Completed;
  saved: Saved | null;
  onStart: (m: Mode) => void;
  onResume: (s: Saved) => void;
}) {
  return (
    <>
      <Text style={styles.title}>Word Search</Text>
      <Text style={styles.lead}>
        Find 8 names, places and words from a Bible story. Words run across, down or diagonally.
      </Text>
      {saved && (
        <Pressable
          onPress={() => onResume(saved)}
          accessibilityRole="button"
          style={({ pressed, hovered }) => [
            styles.card,
            styles.resumeCard,
            (pressed || hovered) && styles.cardActive,
          ]}>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Continue your puzzle</Text>
            <Text style={styles.cardNote}>
              {saved.game.theme.title} · found {saved.found.length} of {saved.game.placements.length}
            </Text>
          </View>
          <Text style={styles.cardBest}>Resume ›</Text>
        </Pressable>
      )}
      <Text style={styles.label}>{saved ? 'Or start a new puzzle' : 'Choose a round'}</Text>
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
          {!!completed[m.id] && <Text style={styles.cardBest}>Completed {completed[m.id]}</Text>}
        </Pressable>
      ))}
    </>
  );
}

/** Web: stop the browser from selecting text or scrolling the page while dragging on the grid. */
const webNoSelect = (
  Platform.OS === 'web' ? { userSelect: 'none', touchAction: 'none', cursor: 'pointer' } : {}
) as unknown as ViewStyle;

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
  resumeCard: { borderColor: Colors.gold, borderWidth: 2, marginBottom: Spacing.four },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  cardNote: { fontSize: 14, color: Colors.textSecondary, marginTop: 2, fontFamily: Fonts.sans },
  cardBest: { fontSize: 14, fontWeight: '700', color: Colors.gold, fontFamily: Fonts.sans },

  storyTitle: { fontFamily: Fonts.script, fontSize: 34, color: Colors.navy, textAlign: 'center' },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  status: { fontSize: 15, color: Colors.textSecondary, fontFamily: Fonts.sans },

  grid: {
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  noTouch: { pointerEvents: 'none' },
  gridRow: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center' },
  cellSelected: { backgroundColor: Colors.navy },
  letter: { fontWeight: '700', color: Colors.text, fontFamily: Fonts.sans },
  letterSelected: { color: '#FFFFFF' },
  hint: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.two,
    fontFamily: Fonts.sans,
  },

  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  wordChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wordText: { fontSize: 15, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  wordFound: { color: Colors.text, textDecorationLine: 'line-through' },

  done: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1E7B3A',
    marginTop: Spacing.four,
    fontFamily: Fonts.sans,
  },
  bestLine: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
    marginTop: Spacing.one,
    fontFamily: Fonts.sans,
  },
  readLink: { marginTop: Spacing.three, alignItems: 'center' },
  refLink: { fontSize: 15, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },

  actions: { flexDirection: 'row', gap: Spacing.two },
  actionHalf: { flex: 1, marginTop: Spacing.four },
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

  pressed: { opacity: 0.6 },
});
