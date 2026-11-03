import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBook, nextChapter, prevChapter, type ChapterRef } from '@/bible/books';
import { formatPassageForSharing, formatReference } from '@/bible/reference';
import { useChapter } from '@/bible/use-chapter';
import { getVersion } from '@/bible/versions';
import { AppMenu } from '@/components/app-menu';
import { BookmarkDialog } from '@/components/bookmark-dialog';
import { BookPicker } from '@/components/book-picker';
import { ChapterText } from '@/components/chapter-text';
import { CommentaryView } from '@/components/commentary-view';
import { NotesPanel, type PanelTab } from '@/components/notes-panel';
import { SelectionBar } from '@/components/selection-bar';
import { VersionPicker } from '@/components/version-picker';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { chapterHref, goHome } from '@/navigation';
import { shareText } from '@/share-text';
import { saveLastPosition } from '@/state/last-position';
import { bookmarkTitle, defaultBookmarkLabel } from '@/userdata/bookmark-types';
import { noteCovers } from '@/userdata/note-types';
import { useChapterBookmarks } from '@/userdata/use-chapter-bookmarks';
import { listAllTags, useChapterNotes } from '@/userdata/use-chapter-notes';
import { useHighlights } from '@/userdata/use-highlights';

type Params = { version: string; book: string; chapter: string; v?: string; notes?: string };

/** Screens at least this wide show the notes panel as a column beside the text. */
const WIDE_LAYOUT = 960;

export default function ReaderScreen() {
  const params = useLocalSearchParams<Params>();
  const version = getVersion(params.version);
  const book = getBook(params.book);
  const chapter = Number(params.chapter);

  // Bad or hand-typed URL (web) → fall back to the default chapter.
  if (!version || !book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    return <Redirect href="/" />;
  }

  const focus = (params.v ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

  return (
    <Reader
      version={version.id}
      book={book.id}
      chapter={chapter}
      focus={focus}
      openNotes={params.notes === '1'}
    />
  );
}

function Reader({
  version,
  book,
  chapter,
  focus,
  openNotes,
}: {
  version: string;
  book: string;
  chapter: number;
  /** Verses to scroll to and briefly mark (from a bookmark or note). */
  focus: number[];
  /** Open the notes panel for the focus verses (from the Notes page). */
  openNotes: boolean;
}) {
  const bookInfo = getBook(book)!;
  const versionInfo = getVersion(version)!;
  const state = useChapter(version, book, chapter);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [versionPickerOpen, setVersionPickerOpen] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hl = useHighlights(book, chapter);
  const bm = useChapterBookmarks(book, chapter);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const nt = useChapterNotes(book, chapter);
  const [notesPanel, setNotesPanel] = useState<{
    verses: number[];
    compose: boolean;
    tab: PanelTab;
  } | null>(openNotes && focus.length ? { verses: focus, compose: false, tab: 'notes' } : null);
  const [knownTags, setKnownTags] = useState<string[]>([]);
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_LAYOUT;

  // Scrolling to a bookmarked verse: remember where the text and each verse row sit.
  const scrollRef = useRef<ScrollViewInstance>(null);
  const textTop = useRef(0);
  const rowY = useRef(new Map<number, number>());
  const focusKey = focus.join(',');
  const [focused, setFocused] = useState<ReadonlySet<number>>(new Set(focus));
  const pendingScroll = useRef<number | null>(null);
  const pendingUntil = useRef(0);

  // Reset scroll bookkeeping during render (not in an effect) whenever the chapter or the
  // target verse changes, so layout events that arrive early aren't thrown away.
  const scrollKey = `${version}/${book}/${chapter}?${focusKey}`;
  const lastScrollKey = useRef<string | null>(null);
  if (lastScrollKey.current !== scrollKey) {
    lastScrollKey.current = scrollKey;
    rowY.current = new Map();
    textTop.current = 0;
    pendingScroll.current = focus[0] ?? null;
    pendingUntil.current = 0;
  }

  const prev = prevChapter({ book, chapter });
  const next = nextChapter({ book, chapter });

  useEffect(() => {
    saveLastPosition({ version, book, chapter });
    setSelected(new Set()); // new chapter or version → start with nothing selected
  }, [version, book, chapter]);

  // Opened from a bookmark: mark those verses for a few seconds and scroll to the first.
  useEffect(() => {
    const verses = focusKey ? focusKey.split(',').map(Number) : [];
    setFocused(new Set(verses));
    if (!verses.length) return;
    const t = setTimeout(() => setFocused(new Set()), 4000);
    return () => clearTimeout(t);
  }, [focusKey, book, chapter]);

  /**
   * Scroll to the bookmarked verse once its position is known. The first attempts can land
   * before the page has its full height (the scroll gets clamped to the top), so keep
   * re-applying it on every layout/size change for a short window, then stop so the
   * reader can scroll freely.
   */
  const tryScroll = useCallback(() => {
    const target = pendingScroll.current;
    if (target == null) return;
    const y = rowY.current.get(target);
    if (y == null || !textTop.current) return;
    const now = Date.now();
    if (!pendingUntil.current) pendingUntil.current = now + 1500;
    if (now > pendingUntil.current) {
      pendingScroll.current = null;
      return;
    }
    const top = Math.max(0, textTop.current + y - Spacing.four);
    scrollRef.current?.scrollTo({ y: top, animated: false });
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: top, animated: false }));
  }, []);
  const stopAutoScroll = useCallback(() => {
    pendingScroll.current = null;
  }, []);

  const onVerseLayout = useCallback(
    (verse: number, y: number) => {
      rowY.current.set(verse, y);
      if (pendingScroll.current != null) tryScroll();
    },
    [tryScroll],
  );

  // Short status line in the selection bar ("Copied", errors), cleared after a moment.
  const flash = useCallback((text: string) => {
    setMessage(text);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 2500);
  }, []);
  useEffect(() => {
    if (hl.error) flash(hl.error);
  }, [hl.error, flash]);
  useEffect(() => {
    if (bm.error) flash(bm.error);
  }, [bm.error, flash]);
  useEffect(() => {
    if (nt.error) flash(nt.error);
  }, [nt.error, flash]);

  // Notes panel: close it when the chapter changes; load tag suggestions when it opens.
  const chapterKey = `${book}/${chapter}`;
  const openedChapter = useRef(chapterKey);
  useEffect(() => {
    if (openedChapter.current !== chapterKey) {
      openedChapter.current = chapterKey;
      setNotesPanel(null);
    }
  }, [chapterKey]);
  const panelOpen = notesPanel !== null;
  useEffect(() => {
    if (panelOpen) listAllTags().then(setKnownTags).catch(() => {});
  }, [panelOpen]);
  const panelNotes = notesPanel
    ? notesPanel.verses.length
      ? nt.notes.filter((n) => noteCovers(n, notesPanel.verses))
      : nt.notes // no verse picked → every note in the chapter
    : [];
  const openCommentary = () => {
    setNotesPanel({ verses: selectedVerses, compose: false, tab: 'commentary' });
    clearSelection();
  };
  const afterNoteChange = async (ok: boolean) => {
    if (ok) listAllTags().then(setKnownTags).catch(() => {});
    return ok;
  };

  const toggleVerse = useCallback((verse: number) => {
    // With the commentary open beside the text (wide screens), tapping a verse also moves
    // the commentary to that verse's section.
    setNotesPanel((p) => (p && p.tab === 'commentary' ? { ...p, verses: [verse] } : p));
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
  const existingBookmark = selectedVerses.length ? bm.find(selectedVerses) : undefined;

  const onSaveBookmark = async (label: string | null) => {
    setBookmarkDialogOpen(false);
    const ok = await bm.save(selectedVerses, label);
    if (ok) {
      const title = label ?? defaultBookmarkLabel(book, chapter, selectedVerses);
      clearSelection();
      flash(existingBookmark ? 'Bookmark updated' : `Bookmarked: ${title}`);
    }
  };
  const onRemoveBookmark = async () => {
    setBookmarkDialogOpen(false);
    if (!existingBookmark) return;
    const ok = await bm.remove(existingBookmark.id);
    if (ok) {
      clearSelection();
      flash(`Removed bookmark: ${bookmarkTitle(existingBookmark)}`);
    }
  };

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
  const onNote = () => {
    setNotesPanel({ verses: selectedVerses, compose: true, tab: 'notes' });
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
      if (bookPickerOpen || versionPickerOpen || bookmarkDialogOpen) return;
      if (e.key === 'Escape') {
        clearSelection();
        setNotesPanel(null);
      }
      if (e.key === 'ArrowLeft' && prev) go(prev);
      if (e.key === 'ArrowRight' && next) go(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, prev, next, bookPickerOpen, versionPickerOpen, bookmarkDialogOpen, clearSelection]);

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

      <View style={styles.content}>
      {/* Chapter */}
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={tryScroll}
        onScrollBeginDrag={stopAutoScroll}
        key={`${version}/${book}/${chapter}`}
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, selected.size > 0 && styles.scrollWithBar]}>
        <View style={styles.column}>
          <View style={styles.headingRow}>
            <Text style={styles.chapterHeading} accessibilityRole="header">
              {title}
            </Text>
            <Pressable
              onPress={openCommentary}
              accessibilityRole="button"
              accessibilityLabel={
                selectedVerses.length
                  ? `Commentary on ${formatReference(book, chapter, selectedVerses)}`
                  : `Commentary on ${title}`
              }
              style={({ pressed }) => [styles.commentaryButton, pressed && styles.pressed]}>
              <Text style={styles.commentaryButtonText}>Commentary</Text>
            </Pressable>
          </View>

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
            <View
              onLayout={(e) => {
                textTop.current = e.nativeEvent.layout.y;
                tryScroll();
              }}>
              <ChapterText
                verses={state.verses}
                highlights={hl.highlights}
                selected={selected}
                bookmarked={bm.bookmarkedVerses}
                focused={focused}
                noteCounts={nt.counts}
                onToggleVerse={toggleVerse}
                onOpenNotes={(v) => setNotesPanel({ verses: [v], compose: false, tab: 'notes' })}
                onVerseLayout={onVerseLayout}
              />
            </View>
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

      {notesPanel && (
        <NotesPanel
          mode={wide ? 'docked' : 'overlay'}
          book={book}
          chapter={chapter}
          verses={notesPanel.verses}
          tab={notesPanel.tab}
          onTabChange={(tab) => setNotesPanel({ ...notesPanel, tab, compose: false })}
          commentary={
            <CommentaryView
              book={book}
              chapter={chapter}
              verse={notesPanel.verses[0]}
              onOpenRef={(b, c, v) => router.push(chapterHref(version, b, c, v))}
            />
          }
          notes={panelNotes}
          knownTags={knownTags}
          startComposing={notesPanel.compose}
          onClose={() => setNotesPanel(null)}
          onAdd={async (input) => afterNoteChange(await nt.add(notesPanel.verses, input))}
          onEdit={async (id, input) => afterNoteChange(await nt.edit(id, input))}
          onDelete={async (id) => afterNoteChange(await nt.remove(id))}
        />
      )}
      </View>

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
          bookmarked={!!existingBookmark}
          onBookmark={() => setBookmarkDialogOpen(true)}
          onNote={onNote}
          onCommentary={openCommentary}
          message={message}
          onHighlight={onHighlight}
          onRemoveHighlight={onRemoveHighlight}
          onCopy={onCopy}
          onShare={onShare}
          onClear={clearSelection}
        />
      )}

      <BookmarkDialog
        visible={bookmarkDialogOpen}
        editing={!!existingBookmark}
        reference={`${formatReference(book, chapter, selectedVerses)} (${versionInfo.abbr})`}
        defaultLabel={defaultBookmarkLabel(book, chapter, selectedVerses)}
        initialLabel={existingBookmark?.label ?? null}
        onCancel={() => setBookmarkDialogOpen(false)}
        onSave={onSaveBookmark}
        onRemove={existingBookmark ? onRemoveBookmark : undefined}
      />

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
  content: { flex: 1, flexDirection: 'row' },
  scrollView: { flex: 1 },
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
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    marginLeft: 30,
  },
  chapterHeading: {
    flexShrink: 1,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.serif,
  },
  commentaryButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  commentaryButtonText: { fontSize: 14, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
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
