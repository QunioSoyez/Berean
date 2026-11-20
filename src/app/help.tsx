import { router, useLocalSearchParams } from 'expo-router';
import { useRef, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Heading, Para } from '@/components/info-page';
import { ScreenHeader } from '@/components/screen-header';
import { WebDataNotice } from '@/components/web-data-notice';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';

const isWeb = Platform.OS === 'web';

/** Topics in page order. `id` is also the ?section= value (e.g. /help?section=bookmarks). */
const TOPICS = [
  { id: 'reading', title: 'Reading' },
  { id: 'selecting', title: 'Selecting verses' },
  { id: 'highlighting', title: 'Highlighting' },
  { id: 'bookmarks', title: 'Bookmarks' },
  { id: 'notes', title: 'Notes' },
  { id: 'commentary', title: 'Commentary' },
  { id: 'search', title: 'Search' },
  { id: 'games', title: 'Games' },
  { id: 'your-data', title: 'Where your data is saved' },
] as const;

type TopicId = (typeof TOPICS)[number]['id'];

/** "How to use Berean": one scrolling page with jump links at the top. */
export default function HelpScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const scrollRef = useRef<ScrollViewInstance>(null);
  /** y position of each section, filled in by onLayout. */
  const offsets = useRef<Record<string, number>>({});
  const jumped = useRef(false);

  const jumpTo = (id: string) => {
    const y = offsets.current[id];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - Spacing.two), animated: true });
  };

  const onSectionLayout = (id: TopicId, y: number) => {
    offsets.current[id] = y;
    // Opened as /help?section=…: scroll there once, as soon as that section is laid out.
    if (!jumped.current && section === id) {
      jumped.current = true;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - Spacing.two), animated: false });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="How to use Berean" />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <WebDataNotice helpLink={false} backupLink={false} inline />
          <Para>
            A quick guide to everything in Berean. Tap a topic to jump to it.
          </Para>

          <View style={styles.toc}>
            {TOPICS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => jumpTo(t.id)}
                accessibilityRole="link"
                hitSlop={4}
                style={({ pressed }) => [styles.tocItem, pressed && styles.pressed]}>
                <Text style={styles.tocText}>{t.title}</Text>
              </Pressable>
            ))}
          </View>

          <Section onLayoutY={onSectionLayout} id="reading">
            <Para>
              On the homepage, pick a Bible version and tap <B>Start reading</B> (or <B>Continue
              reading</B> to go back to where you left off). <B>Browse Books</B> lets you jump to any
              book and chapter.
            </Para>
            <Para>
              In the reader, tap <B>‹ Previous</B> or <B>Next ›</B> at the end of the chapter to
              move between chapters, and use the menu (☰, top right) to switch versions. Switching versions keeps your place.
              {isWeb ? ' On a computer, the left and right arrow keys also change chapter.' : ''}
            </Para>
            <Para>
              To make the text bigger or smaller, open the menu and choose <B>Settings</B> →{' '}
              <B>Text size</B>.
            </Para>
          </Section>

          <Section onLayoutY={onSectionLayout} id="selecting">
            <Para>
              Tap any verse to select it. Tap more verses to select several, and tap a verse again to
              unselect it. While verses are selected, a bar appears at the bottom of the screen with
              everything you can do: highlight, <B>Bookmark</B>, <B>Note</B>, <B>Commentary</B>,{' '}
              <B>Copy</B> and <B>Share</B>.
            </Para>
            <Para>
              <B>Copy</B> and <B>Share</B> include the reference (for example, John 3:16) with the
              verse text. Tap ✕ on the bar to clear your selection
              {isWeb ? ', or press Esc' : ''}.
            </Para>
          </Section>

          <Section onLayoutY={onSectionLayout} id="highlighting">
            <Para>
              Select one or more verses, then tap one of the five colors in the bar (yellow, green,
              blue, pink or orange). To remove a highlight, select the verse again and tap the
              crossed-out circle after the colors.
            </Para>
            <Para>
              Highlights belong to the verse, not the version, so you’ll see them in every Bible
              version.
            </Para>
          </Section>

          <Section onLayoutY={onSectionLayout} id="bookmarks">
            <Para>
              <B>Add a bookmark:</B> select a verse (or several), then tap <B>Bookmark</B>. You can
              give it a name, or leave the name blank to use the reference (for example,
              “John-3:16”). Tap <B>Save</B>. A small gold marker shows bookmarked verses in the text.
            </Para>
            <Para>
              <B>Find your bookmarks:</B> open the menu and choose <B>Bookmarks</B> (it’s on the
              homepage too). They’re listed newest first. Tap one to open it in the version you’re
              reading, right at that verse.
            </Para>
            <Para>
              <B>Rename or remove:</B> on the Bookmarks page, tap <B>Rename</B>, or tap{' '}
              <B>Delete</B> and then <B>Tap to confirm</B>. In the reader, selecting the same verses
              shows <B>Bookmark ✓</B>. Tap it to rename the bookmark or <B>Remove</B> it.
            </Para>
          </Section>

          <Section onLayoutY={onSectionLayout} id="notes">
            <Para>
              <B>Write a note:</B> select a verse (or several) and tap <B>Note</B>. The notes panel
              opens beside the text on wide screens, or over it on phones. Tap{' '}
              <B>+ Add a note</B> if the editor isn’t already open, write your note, and tap{' '}
              <B>Save note</B>. A verse can have as many notes as you like.
            </Para>
            <Para>
              <B>Formatting:</B> the toolbar above the note adds bold, italic, headings, and
              bulleted or numbered lists. Switch between <B>Write</B> and <B>Preview</B> to see how
              it will look. You can also type the marks yourself: **bold**, *italic*, # Heading,
              - bullet, 1. numbered.
            </Para>
            <Para>
              <B>Tags:</B> add up to 5 tags to a note (type a tag, then press Enter). Tags you’ve
              used before are suggested, so it’s easy to group notes by topic, like “prayer” or
              “promises”.
            </Para>
            <Para>
              <B>Finding notes in the text:</B> a small number beside a verse shows how many notes it
              has. Tap it to open them. Each note has <B>Edit</B> and <B>Delete</B> (tap{' '}
              <B>Tap to confirm</B> to delete).
            </Para>
            <Para>
              <B>The Notes page:</B> open the menu and choose <B>Notes</B> to see all your notes,
              newest first. Search them, or filter by tag or book. Tap a note to open its verse with
              the notes panel showing.
            </Para>
            <Para>
              Like highlights, notes belong to the verse, so they show in every version. On wide
              screens, drag the panel’s left edge to make it wider or narrower; double-tap the edge
              to reset it.
            </Para>
          </Section>

          <Section onLayoutY={onSectionLayout} id="commentary">
            <Para>
              Tap <B>Commentary</B> next to the chapter title, or select a verse and tap{' '}
              <B>Commentary</B> in the bar. Matthew Henry’s Concise Commentary opens in the panel,
              at the section that covers that verse. It works offline.
            </Para>
            <Para>
              Use the chapter outline to jump between sections, and tap any Bible reference in the
              commentary to open that passage. Chapter 1 of each book starts with an introduction to
              the book.
            </Para>
            <Para>
              When you’re reading the Spanish NTBT, the panel shows <B>Estudio NTBT</B> (the
              translation’s own study notes) instead.
            </Para>
          </Section>

          <Section onLayoutY={onSectionLayout} id="search">
            <Para>
              Open <B>Search</B> from the menu or the homepage. It searches the version you’re
              reading.
            </Para>
            <Para>
              Every word you type must appear in the verse, in any order. Put words in “quotes” to
              find an exact phrase. Searching for “love” also finds “loved” and “loveth”, and accents
              don’t matter (“jesus” finds “Jesús”). Tap a result to open that verse.
            </Para>
          </Section>

          <Section onLayoutY={onSectionLayout} id="games">
            <Para>
              Open <B>Games</B> from the menu or the homepage. There are four: <B>Bible Story
              Quiz</B>, <B>Story Scramble</B>, <B>Word Scramble</B> and <B>Word Search</B>. Each one
              lets you play the Old Testament, the New Testament or the whole Bible.
            </Para>
            <Para>
              Every answer links to its verse. Tap <B>Read it</B> to look it up, then use the back
              button to return to your game. Your best scores and any round in progress are saved
              on this device. When a round is waiting, you’ll see a <B>Continue</B> card on the
              game’s start screen.
            </Para>
          </Section>

          <Section onLayoutY={onSectionLayout} id="your-data">
            {isWeb ? (
              <>
                <Para>
                  Berean has no accounts. On the website, your highlights, bookmarks, notes,
                  settings and game progress are saved in this browser’s storage, on this device
                  only.
                </Para>
                <Para>
                  That means clearing your browser’s history or browsing data (cookies and site
                  data) will erase them, and so will using a private or incognito window. They also
                  don’t move between browsers or devices.
                </Para>
                <Para>
                  <B>Keep a backup.</B> In <B>Settings → Your data</B>, tap <B>Download a backup</B>{' '}
                  to save a small file with your highlights, bookmarks, notes and text size (game
                  progress isn’t included). Keep it somewhere safe, like your Documents folder or
                  cloud storage, and download a new one now and then.{' '}
                  <Text style={styles.link} onPress={() => router.push('/settings')} accessibilityRole="link">
                    Go to Settings
                  </Text>
                </Para>
                <Para>
                  To get them back (after clearing your browser, or in another browser), tap{' '}
                  <B>Restore from a backup</B> and choose the file. Berean shows what’s in it before
                  anything is saved. Restoring only adds what’s missing: nothing already in this
                  browser is deleted or changed, so it’s safe to restore the same file twice.
                </Para>
              </>
            ) : (
              <Para>
                Berean has no accounts. Your highlights, bookmarks, notes, settings and game progress
                are saved in the app on this device. They stay there until you delete them or
                uninstall the app, and they don’t sync between devices.
              </Para>
            )}
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  id,
  onLayoutY,
  children,
}: {
  id: TopicId;
  onLayoutY: (id: TopicId, y: number) => void;
  children: ReactNode;
}) {
  return (
    <View onLayout={(e) => onLayoutY(id, e.nativeEvent.layout.y)}>
      <Heading>{TOPICS.find((t) => t.id === id)?.title ?? ''}</Heading>
      {children}
    </View>
  );
}

/** Bold run inside a paragraph (button and page names). */
function B({ children }: { children: ReactNode }) {
  return <Text style={styles.bold}>{children}</Text>;
}

const styles = StyleSheet.create({
  link: { fontWeight: '600', color: Colors.navy, textDecorationLine: 'underline' },
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.six },
  column: {
    width: '100%',
    maxWidth: MaxReadingWidth,
    alignSelf: 'center',
    padding: Spacing.three,
  },
  toc: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  tocItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tocText: { fontSize: 14, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  bold: { fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
