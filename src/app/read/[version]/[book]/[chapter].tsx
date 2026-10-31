import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBook, nextChapter, prevChapter, type ChapterRef } from '@/bible/books';
import { formatPassageForSharing, formatReference } from '@/bible/reference';
import { useChapter } from '@/bible/use-chapter';
import { getVersion } from '@/bible/versions';
import { AppMenu } from '@/components/app-menu';
import { BookPicker } from '@/components/book-picker';
import { ChapterText } from '@/components/chapter-text';
import { SelectionBar } from '@/components/selection-bar';
import { VersionPicker } from '@/components/version-picker';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { goHome } from '@/navigation';
import { shareText } from '@/share-text';
import { saveLastPosition } from '@/state/last-position';
import { useHighlights } from '@/userdata/use-highlights';

type Params = { version: string; book: string; chapter: string };

export default function ReaderScreen() {
  const params = useLocalSearchParams<Params>();
  const version = getVersion(params.version);
  const book = getBook(params.book);
  const chapter = Number(params.chapter);

  // Bad or hand-typed URL (web) → fall back to the default chapter.
  if (!version || !book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    return <Redirect href="/" />;
  }

  return <Reader version={version.id} book={book.id} chapter={chapter} />;
}

function Reader({ version, book, chapter }: { version: string; book: string; chapter: number }) {
  const bookInfo = getBook(book)!;
  const versionInfo = getVersion(version)!;
  const state = useChapter(version, book, chapter);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [versionPickerOpen, setVersionPickerOpen] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hl = useHighlights(book, chapter);

  const prev = prevChapter({ book, chapter });
  const next = nextChapter({ book, chapter });

  useEffect(() => {
    saveLastPosition({ version, book, chapter });
    setSelected(new Set()); // new chapter or version → start with nothing selected
  }, [version, book, chapter]);

  // Short status line in the selection bar ("Copied", errors), cleared after a moment.
  const flash = useCallback((text: string) => {
    setMessage(text);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 2500);
  }, []);
  useEffect(() => {
    if (hl.error) flash(hl.error);
  }, [hl.error, flash]);

  const toggleVerse = useCallback((verse: number) => {
    setSelected((prevSel) => {
      const next = new Set(prevSel);
      if (next.has(verse)) next.delete(verse);
      else next.add(verse);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const selectedVerses = useMemo(() => [...selected].sort((a, b) => a - b), [selected]);
  const selectedColors = new Set(selectedVerses.map((v) => hl.highlights.get(v) ?? null));
  const currentColor = selectedColors.size === 1 ? [...selectedColors][0] : null;
  const anyHighlighted = selectedVerses.some((v) => hl.highlights.has(v));

  const passageText = () =>
    state.status === 'ready'
      ? formatPassageForSharing(
          book,
          chapter,
          selectedVerses.map((v) => ({ verse: v, text: state.verses[v - 1] ?? '' })),
          versionInfo.abbr,
        )
      : '';

  const onHighlight = (color: string) => {
    hl.highlight(selectedVerses, color);
    clearSelection();
  };
  const onRemoveHighlight = () => {
    hl.unhighlight(selectedVerses);
    clearSelection();
  };
  const onCopy = async () => {
    try {
      await Clipboard.setStringAsync(passageText());
      flash('Copied');
    } catch {
      flash('Couldn’t copy. Please try again.');
    }
  };
  const onShare = async () => {
    try {
      const result = await shareText(passageText());
      if (result === 'copied') flash('Copied — paste it anywhere to share');
    } catch {
      flash('Couldn’t share. Please try again.');
    }
  };

  const go = useCallback(
    (to: { version?: string } & Partial<ChapterRef>) => {
      router.replace({
        pathname: '/read/[version]/[book]/[chapter]',
        params: {
          version: to.version ?? version,
          book: to.book ?? book,
          chapter: String(to.chapter ?? chapter),
        },
      });
    },
    [version, book, chapter],
  );

  // Web: left/right arrow keys move between chapters.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      if (bookPickerOpen || versionPickerOpen) return;
      if (e.key === 'Escape') clearSelection();
      if (e.key === 'ArrowLeft' && prev) go(prev);
      if (e.key === 'ArrowRight' && next) go(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, prev, next, bookPickerOpen, versionPickerOpen, clearSelection]);

  const title = `${bookInfo.name} ${chapter}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Pressable
            onPress={goHome}
            accessibilityRole="button"
            accessibilityLabel="Home"
            hitSlop={6}
            style={({ pressed }) => pressed && styles.pressed}>
            <Image source={require('@/assets/images/logo-mark.png')} style={styles.logo} />
          </Pressable>
          <Pressable
            onPress={() => setBookPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`${title}. Change book or chapter`}
            style={({ pressed }) => [styles.titleButton, pressed && styles.pressed]}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.caret}>▾</Text>
          </Pressable>
          <Pressable
            onPress={() => setVersionPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`${versionInfo.name}. Change version`}
            style={({ pressed }) => [styles.versionButton, pressed && styles.pressed]}>
            <Text style={styles.versionText}>{versionInfo.abbr}</Text>
            <Text style={[styles.caret, styles.versionCaret]}>▾</Text>
          </Pressable>
          <AppMenu onChangeVersion={() => setVersionPickerOpen(true)} />
        </View>
      </View>

      {/* Chapter */}
      <ScrollView
        key={`${version}/${book}/${chapter}`}
        contentContainerStyle={[styles.scroll, selected.size > 0 && styles.scrollWithBar]}>
        <View style={styles.column}>
          <Text style={styles.chapterHeading} accessibilityRole="header">
            {title}
          </Text>

          {state.status === 'loading' && (
            <ActivityIndicator style={styles.status} color={Colors.navy} />
          )}
          {state.status === 'error' && (
            <View style={styles.status}>
              <Text style={styles.errorText}>Couldn’t load this chapter.</Text>
              <Pressable onPress={state.retry} accessibilityRole="button" style={styles.retry}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          )}
          {state.status === 'ready' && (
            <ChapterText
              verses={state.verses}
              highlights={hl.highlights}
              selected={selected}
              onToggleVerse={toggleVerse}
            />
          )}

          {/* Previous / next */}
          <View style={styles.nav}>
            <NavButton label="‹ Previous" target={prev} onPress={go} align="left" />
            <NavButton label="Next ›" target={next} onPress={go} align="right" />
          </View>

          <Text style={styles.copyright}>
            {versionInfo.name}. {versionInfo.copyright}
          </Text>
        </View>
      </ScrollView>

      {selected.size === 0 && message && (
        <View style={styles.toast} pointerEvents="none" accessibilityLiveRegion="polite">
          <Text style={styles.toastText}>{message}</Text>
        </View>
      )}
      {selected.size > 0 && (
        <SelectionBar
          reference={formatReference(book, chapter, selectedVerses)}
          currentColor={currentColor}
          anyHighlighted={anyHighlighted}
          message={message}
          onHighlight={onHighlight}
          onRemoveHighlight={onRemoveHighlight}
          onCopy={onCopy}
          onShare={onShare}
          onClear={clearSelection}
        />
      )}

      <BookPicker
        visible={bookPickerOpen}
        currentBook={book}
        currentChapter={chapter}
        onClose={() => setBookPickerOpen(false)}
        onSelect={(b, c) => {
          setBookPickerOpen(false);
          go({ book: b, chapter: c });
        }}
      />
      <VersionPicker
        visible={versionPickerOpen}
        current={version}
        onClose={() => setVersionPickerOpen(false)}
        onSelect={(v) => {
          setVersionPickerOpen(false);
          go({ version: v });
        }}
      />
    </SafeAreaView>
  );
}

function NavButton({
  label,
  target,
  onPress,
  align,
}: {
  label: string;
  target: ChapterRef | undefined;
  onPress: (to: ChapterRef) => void;
  align: 'left' | 'right';
}) {
  if (!target) return <View style={styles.navSpacer} />;
  const book = getBook(target.book)!;
  return (
    <Pressable
      onPress={() => onPress(target)}
      accessibilityRole="button"
      accessibilityLabel={`${align === 'left' ? 'Previous' : 'Next'} chapter, ${book.name} ${target.chapter}`}
      style={({ pressed }) => [
        styles.navButton,
        align === 'right' && styles.navButtonRight,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.navLabel}>{label}</Text>
      <Text style={styles.navTarget}>
        {book.abbr} {target.chapter}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    width: '100%',
    maxWidth: MaxReadingWidth,
    alignSelf: 'center',
  },
  logo: { width: 32, height: 32, borderRadius: 7 },
  titleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  title: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
    fontFamily: Fonts.sans,
  },
  caret: { fontSize: 14, color: Colors.gold },
  versionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  versionText: { fontSize: 14, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  versionCaret: { fontSize: 12 },
  pressed: { opacity: 0.6 },
  scroll: { paddingBottom: Spacing.six },
  toast: {
    position: 'absolute',
    bottom: Spacing.five,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: Colors.navy,
  },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', fontFamily: Fonts.sans },
  scrollWithBar: { paddingBottom: 240 }, // room so the last verses can scroll above the selection bar
  column: {
    width: '100%',
    maxWidth: MaxReadingWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  chapterHeading: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.serif,
    marginBottom: Spacing.three,
    marginLeft: 30,
  },
  status: { paddingVertical: Spacing.six, alignItems: 'center' },
  errorText: { fontSize: 16, color: Colors.danger, marginBottom: Spacing.three },
  retry: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    backgroundColor: Colors.navy,
  },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  nav: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.five,
  },
  navSpacer: { flex: 1 },
  navButton: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navButtonRight: { alignItems: 'flex-end' },
  navLabel: { fontSize: 15, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  navTarget: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, fontFamily: Fonts.sans },
  copyright: {
    marginTop: Spacing.four,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: Fonts.sans,
  },
});
