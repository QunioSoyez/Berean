import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBook, nextChapter, prevChapter, type ChapterRef } from '@/bible/books';
import { useChapter } from '@/bible/use-chapter';
import { getVersion } from '@/bible/versions';
import { AppMenu } from '@/components/app-menu';
import { BookPicker } from '@/components/book-picker';
import { ChapterText } from '@/components/chapter-text';
import { VersionPicker } from '@/components/version-picker';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { goHome } from '@/navigation';
import { saveLastPosition } from '@/state/last-position';

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

  const prev = prevChapter({ book, chapter });
  const next = nextChapter({ book, chapter });

  useEffect(() => {
    saveLastPosition({ version, book, chapter });
  }, [version, book, chapter]);

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
      if (e.key === 'ArrowLeft' && prev) go(prev);
      if (e.key === 'ArrowRight' && next) go(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, prev, next, bookPickerOpen, versionPickerOpen]);

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
      <ScrollView key={`${version}/${book}/${chapter}`} contentContainerStyle={styles.scroll}>
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
          {state.status === 'ready' && <ChapterText verses={state.verses} />}

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
