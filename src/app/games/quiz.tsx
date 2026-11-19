import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bookName } from '@/bible/books';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { ContinueCard, loadProgress, saveProgress } from '@/games/progress';
import { QUIZ_QUESTIONS, type QuizQuestion } from '@/games/quiz-questions';
import { chapterHref } from '@/navigation';
import { getLastPosition } from '@/state/last-position';

/** Questions per round. */
const ROUND_SIZE = 10;
const BEST_KEY = 'berean.games.quiz.best.v1';
/** The round in progress (see games/progress.tsx). */
const SAVE_KEY = 'berean.games.quiz.inProgress.v1';

type Mode = 'ALL' | 'OT' | 'NT';
const MODES: { id: Mode; label: string; note: string }[] = [
  { id: 'ALL', label: 'Whole Bible', note: 'Genesis to Revelation' },
  { id: 'OT', label: 'Old Testament', note: 'Creation to the prophets' },
  { id: 'NT', label: 'New Testament', note: 'The Gospels to Revelation' },
];

type Asked = { q: QuizQuestion; options: string[] };
type Best = Partial<Record<Mode, number>>;
type Saved = {
  mode: Mode;
  round: Asked[];
  index: number;
  picked: string | null;
  score: number;
  missed: QuizQuestion[];
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

function newRound(mode: Mode): Asked[] {
  const pool = mode === 'ALL' ? QUIZ_QUESTIONS : QUIZ_QUESTIONS.filter((q) => q.testament === mode);
  return shuffle(pool)
    .slice(0, ROUND_SIZE)
    .map((q) => ({ q, options: shuffle([q.answer, ...q.wrong]) }));
}

function refText(q: QuizQuestion) {
  return `${bookName(q.book)} ${q.chapter}:${q.verse}`;
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
    // A best score that can't be saved isn't worth interrupting the game for.
  }
}

/** Bible Story Quiz: 10 multiple-choice questions, each linked to the verse that answers it. */
export default function QuizScreen() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [round, setRound] = useState<Asked[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<QuizQuestion[]>([]);
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
    const s: Saved | null = finished ? null : { mode, round, index, picked, score, missed };
    setSaved(s);
    saveProgress(SAVE_KEY, s);
  }, [mode, round, index, picked, score, missed, finished]);

  const resume = (s: Saved) => {
    setMode(s.mode);
    setRound(s.round);
    setIndex(s.index);
    setPicked(s.picked);
    setScore(s.score);
    setMissed(s.missed);
    setFinished(false);
    setNewBest(false);
  };

  const start = (m: Mode) => {
    setMode(m);
    setRound(newRound(m));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setMissed([]);
    setFinished(false);
    setNewBest(false);
  };

  const pick = (option: string) => {
    if (picked) return;
    const { q } = round[index];
    setPicked(option);
    if (option === q.answer) setScore((s) => s + 1);
    else setMissed((m) => [...m, q]);
  };

  const next = () => {
    if (index + 1 < round.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    setFinished(true);
    if (mode && score > (best[mode] ?? -1)) {
      const updated = { ...best, [mode]: score };
      setBest(updated);
      setNewBest(true);
      saveBest(updated);
    }
  };

  const readIt = (q: QuizQuestion) => router.push(chapterHref(version, q.book, q.chapter, [q.verse], false, 'Quiz'));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Bible Story Quiz" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          {!mode ? (
            <StartView best={best} saved={saved} onStart={start} onResume={resume} />
          ) : finished ? (
            <ResultsView
              score={score}
              total={round.length}
              best={best[mode] ?? score}
              newBest={newBest}
              missed={missed}
              onReadIt={readIt}
              onAgain={() => start(mode)}
              onChangeMode={() => setMode(null)}
            />
          ) : (
            <QuestionView
              asked={round[index]}
              number={index + 1}
              total={round.length}
              score={score}
              picked={picked}
              onPick={pick}
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
      <Text style={styles.title}>Bible Story Quiz</Text>
      <Text style={styles.lead}>
        {ROUND_SIZE} questions on the people and stories of the Bible. After each answer you’ll see
        where to find it, so you can read the whole story.
      </Text>
      {saved && (
        <ContinueCard
          detail={`${MODES.find((m) => m.id === saved.mode)?.label} · question ${saved.index + 1} of ${saved.round.length} · score ${saved.score}`}
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

function QuestionView({
  asked,
  number,
  total,
  score,
  picked,
  onPick,
  onNext,
  onReadIt,
  isLast,
}: {
  asked: Asked;
  number: number;
  total: number;
  score: number;
  picked: string | null;
  onPick: (o: string) => void;
  onNext: () => void;
  onReadIt: (q: QuizQuestion) => void;
  isLast: boolean;
}) {
  const { q, options } = asked;
  const right = picked === q.answer;
  return (
    <>
      <View style={styles.progressRow}>
        <Text style={styles.progress}>
          Question {number} of {total}
        </Text>
        <Text style={styles.progress}>Score {score}</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${((number - 1) / total) * 100}%` }]} />
      </View>

      <Text style={styles.question} accessibilityRole="header">
        {q.question}
      </Text>

      {options.map((o) => {
        const isAnswer = o === q.answer;
        const isPicked = o === picked;
        return (
          <Pressable
            key={o}
            onPress={() => onPick(o)}
            disabled={!!picked}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!picked, selected: isPicked }}
            style={({ pressed, hovered }) => [
              styles.option,
              !picked && (pressed || hovered) && styles.optionActive,
              picked && isAnswer && styles.optionRight,
              picked && isPicked && !isAnswer && styles.optionWrong,
              picked && !isAnswer && !isPicked && styles.optionDim,
            ]}>
            <Text style={[styles.optionText, picked && (isAnswer || isPicked) && styles.optionTextOn]}>
              {picked && isAnswer ? '✓  ' : picked && isPicked ? '✗  ' : ''}
              {o}
            </Text>
          </Pressable>
        );
      })}

      {picked && (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          <Text style={[styles.verdict, right ? styles.verdictRight : styles.verdictWrong]}>
            {right ? 'Correct!' : `The answer is ${q.answer}.`}
          </Text>
          <View style={styles.refRow}>
            <Text style={styles.refText}>{refText(q)}</Text>
            <Pressable onPress={() => onReadIt(q)} accessibilityRole="link" hitSlop={6}>
              <Text style={styles.refLink}>Read it ›</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{isLast ? 'See results' : 'Next question'}</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

function ResultsView({
  score,
  total,
  best,
  newBest,
  missed,
  onReadIt,
  onAgain,
  onChangeMode,
}: {
  score: number;
  total: number;
  best: number;
  newBest: boolean;
  missed: QuizQuestion[];
  onReadIt: (q: QuizQuestion) => void;
  onAgain: () => void;
  onChangeMode: () => void;
}) {
  const message =
    score === total
      ? 'A perfect round. Well done!'
      : score >= total * 0.7
        ? 'Great job! You know your Bible.'
        : score >= total * 0.4
          ? 'Good effort. Keep searching the Scriptures!'
          : 'Every round is a chance to learn something new.';
  return (
    <>
      <Text style={styles.title}>
        {score} / {total}
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

      {missed.length > 0 && (
        <>
          <Text style={[styles.label, styles.reviewLabel]}>Review what you missed</Text>
          {missed.map((q) => (
            <View key={q.id} style={styles.review}>
              <Text style={styles.reviewQ}>{q.question}</Text>
              <Text style={styles.reviewA}>{q.answer}</Text>
              <View style={styles.refRow}>
                <Text style={styles.refText}>{refText(q)}</Text>
                <Pressable onPress={() => onReadIt(q)} accessibilityRole="link" hitSlop={6}>
                  <Text style={styles.refLink}>Read it ›</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}
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
  question: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
    fontFamily: Fonts.sans,
  },

  option: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.two,
  },
  optionActive: { backgroundColor: Colors.surface, borderColor: Colors.navy },
  optionRight: { backgroundColor: GREEN, borderColor: GREEN },
  optionWrong: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  optionDim: { opacity: 0.5 },
  optionText: { fontSize: 17, color: Colors.text, fontFamily: Fonts.sans },
  optionTextOn: { color: '#FFFFFF', fontWeight: '700' },

  feedback: { marginTop: Spacing.two },
  verdict: { fontSize: 18, fontWeight: '700', fontFamily: Fonts.sans },
  verdictRight: { color: GREEN },
  verdictWrong: { color: Colors.danger },
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

  reviewLabel: { marginTop: Spacing.five },
  review: {
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  reviewQ: { fontSize: 16, color: Colors.text, fontFamily: Fonts.sans },
  reviewA: { fontSize: 16, fontWeight: '700', color: GREEN, marginTop: 2, fontFamily: Fonts.sans },

  pressed: { opacity: 0.6 },
});
