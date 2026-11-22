import { Image, ImageBackground } from 'expo-image';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bookName, getBook } from '@/bible/books';
import { getVersion, VERSIONS } from '@/bible/versions';
import { AdBanner } from '@/components/ad-banner';
import { AppMenu } from '@/components/app-menu';
import { BookPicker } from '@/components/book-picker';
import { CONTACT_EMAIL, DONATE_LINKS, PUBLISHER, SITE_URL } from '@/constants/site';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { chapterHref } from '@/navigation';
import { shareText } from '@/share-text';
import {
  getLastPosition,
  hasSavedPosition,
  saveLastPosition,
  type Position,
} from '@/state/last-position';

/** Screens at least this wide get the text nav bar from the design; narrower ones get buttons. */
const WIDE = 760;
/** Width of the page column on big screens (the clouds show on either side). */
const PAGE_WIDTH = 1100;

/**
 * Landing screen: clouds behind a centered page with a nav bar (version dropdown, browse,
 * search, bookmarks, games), a Bible-pages hero with Continue reading, and an
 * about / features / games / support section underneath.
 */
export default function Home() {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  // The floating dropdown is only used on the website; in the apps the version list opens
  // in place (Android ignores taps on views that hang outside their parent).
  const overlay = wide && Platform.OS === 'web';

  const [pos, setPos] = useState<Position | null>(null);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [pickedThisVisit, setPickedThisVisit] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  // Hover menu (website): closing waits a moment so the mouse can travel from the label down
  // onto the list; hovering the label or the list cancels the pending close.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const hoverOpen = () => {
    cancelClose();
    setVersionsOpen(true);
  };
  const hoverClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setVersionsOpen(false), 250);
  };

  // Re-read the saved position every time this screen comes into view. The landing screen
  // stays open underneath the reader, so reading only once (on first open) left the button
  // stuck on whatever chapter was saved back then.
  useFocusEffect(
    useCallback(() => {
      getLastPosition().then(setPos);
      hasSavedPosition().then((saved) => setIsFirstRun(!saved));
      setPickedThisVisit(false);
    }, []),
  );

  if (!pos) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.navy} />
      </View>
    );
  }

  const version = getVersion(pos.version)!;
  const book = getBook(pos.book)!;
  const needsVersion = isFirstRun && !pickedThisVisit;

  const chooseVersion = (id: string) => {
    const next = { ...pos, version: id };
    setPos(next);
    setPickedThisVisit(true);
    cancelClose();
    setVersionsOpen(false);
    saveLastPosition(next);
  };

  const onReadPress = () => {
    // Brand-new visitors pick a version first; everyone else goes straight to their chapter.
    if (needsVersion) {
      setVersionsOpen(true);
      return;
    }
    router.push(chapterHref(version.id, book.id, pos.chapter));
  };

  const onShare = async () => {
    const result = await shareText(`Berean, a free Bible study app: ${SITE_URL}`);
    if (result === 'copied') {
      setShareNote('Link copied');
      setTimeout(() => setShareNote(null), 2500);
    }
  };

  const versionList = (
    <View
      style={[styles.versionList, overlay && styles.versionListOverlay]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Bible versions">
      {VERSIONS.map((v) => {
        const selected = v.id === version.id && !needsVersion;
        return (
          <Pressable
            key={v.id}
            onPress={() => chooseVersion(v.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={v.name}
            style={({ pressed, hovered }) => [
              styles.versionItem,
              (pressed || hovered) && styles.versionItemActive,
            ]}>
            <Text style={[styles.versionAbbr, selected && styles.versionAbbrSelected]}>
              {selected ? '✓ ' : ''}
              {v.abbr}
            </Text>
            <Text style={styles.versionFull} numberOfLines={1}>
              {v.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const versionTriggerLabel = needsVersion ? 'Select Bible Version' : `Bible: ${version.abbr}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Soft sky background (assets/images/home-clouds.jpg), behind everything on this screen. */}
      <Image
        source={require('@/assets/images/home-clouds.jpg')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessible={false}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.page}>
          {/* ---------- Nav bar ---------- */}
          {wide ? (
            <View style={styles.navWide}>
              <Image
                source={require('@/assets/images/logo-full.png')}
                style={styles.logoWide}
                accessibilityLabel="Berean"
              />
              <View style={styles.navLinks}>
                {/* Hover opens the list on the website. Pointer enter/leave (not Pressable hover)
                    because they treat the dropdown as part of this area, so moving the mouse
                    from the label down onto the list doesn't count as leaving. */}
                <View
                  onPointerEnter={hoverOpen}
                  onPointerLeave={hoverClose}
                  style={styles.versionWrap}>
                  <Pressable
                    onPress={() => {
                      cancelClose();
                      // With a mouse, hovering already opened it, so a click shouldn't close it.
                      setVersionsOpen((o) => (overlay ? true : !o));
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: versionsOpen }}>
                    {({ hovered }) => (
                      <Text style={[styles.navText, hovered && styles.navTextHover]}>
                        {versionTriggerLabel} ▾
                      </Text>
                    )}
                  </Pressable>
                  {versionsOpen && overlay && versionList}
                </View>
                <NavSep />
                <NavLink label="Browse Books" onPress={() => setBookPickerOpen(true)} />
                <NavSep />
                <NavLink label="Search" href="/search" />
                <NavSep />
                <NavLink label="Bookmarks" href="/bookmarks" />
                <NavSep />
                <NavLink label="Games" href="/games" />
              </View>
              <AppMenu />
            </View>
          ) : (
            <View style={styles.navNarrow}>
              <View style={styles.menuCorner}>
                <AppMenu />
              </View>
              <Image
                source={require('@/assets/images/logo-full.png')}
                style={styles.logoNarrow}
                accessibilityLabel="Berean"
              />
              <View style={styles.chips}>
                <Chip
                  label={`${versionTriggerLabel} ${versionsOpen ? '▴' : '▾'}`}
                  onPress={() => setVersionsOpen((o) => !o)}
                  strong
                />
                <Chip label="Browse Books" onPress={() => setBookPickerOpen(true)} />
                <Chip label="Search" href="/search" />
                <Chip label="Bookmarks" href="/bookmarks" />
                <Chip label="Games" href="/games" />
              </View>
            </View>
          )}
          {versionsOpen && !overlay && versionList}

          {/* ---------- Hero ---------- */}
          <ImageBackground
            source={require('@/assets/images/home-bible-pages.jpg')}
            style={[styles.hero, wide ? styles.heroWide : styles.heroNarrow]}
            contentFit="cover"
            accessible={false}>
            <Pressable
              onPress={onReadPress}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
              <Text style={styles.primaryLabel}>
                {isFirstRun ? 'Start reading' : 'Continue reading'}
              </Text>
              <Text style={styles.primaryTarget}>
                {needsVersion
                  ? 'Select a version to start'
                  : `${bookName(book.id, version.id)} ${pos.chapter} · ${version.abbr}`}
              </Text>
            </Pressable>
          </ImageBackground>

          {/* ---------- Info section ---------- */}
          <View style={[styles.info, wide && styles.infoWide]}>
            <Section title="What is a Berean?">
              <Body>
                Being a Berean means combining an open, eager willingness to listen with careful,
                independent verification using the Bible, rather than relying solely on a
                speaker’s authority.
              </Body>
              <Text style={styles.verse}>
                “These were more noble than those in Thessalonica, in that they received the word
                with all readiness of mind, and searched the scriptures daily, whether those things
                were so.”
              </Text>
              <Text style={styles.verseRef}>Acts 17:11 (KJV)</Text>
            </Section>

            <Section title="What you can do here">
              {[
                'Read five versions: KJV, WEB, ASV, YLT and the Spanish NTBT',
                'Highlight verses, add bookmarks and write your own notes',
                'Dig deeper with Matthew Henry’s commentary (NTBT study notes in Spanish)',
                'Search the whole Bible in seconds',
                'Test what you know with Bible games',
              ].map((t) => (
                <Bullet key={t}>{t}</Bullet>
              ))}
              <Body muted>
                Everything stays on your device. No account, no tracking.
              </Body>
              <View style={styles.buttonRow}>
                <OutlineButton label="How to use Berean" onPress={() => router.push('/help')} />
              </View>
            </Section>

            <Section title="Play & learn">
              <Body>
                Test what you know with four Bible games: a story quiz, Story Scramble, Word Scramble
                and Word Search.
              </Body>
              <View style={styles.buttonRow}>
                <OutlineButton label="Play games" onPress={() => router.push('/games')} />
              </View>
            </Section>

            <Section title="How can you help?">
              <Body>Berean is completely self-funded, so any and all donations are welcome.</Body>
              <View style={styles.buttonRow}>
                {DONATE_LINKS.map((d) => (
                  <OutlineButton
                    key={d.url}
                    label={`Give with ${d.label}`}
                    onPress={() => Linking.openURL(d.url)}
                    link
                  />
                ))}
                <OutlineButton label={shareNote ?? 'Share Berean'} onPress={onShare} />
              </View>
              <Body muted>
                Found a problem or have an idea? Email{' '}
                <Text
                  style={styles.inlineLink}
                  onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
                  accessibilityRole="link">
                  {CONTACT_EMAIL}
                </Text>
                .
              </Body>
            </Section>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Published by {PUBLISHER}</Text>
              <Text style={styles.footerText}> · </Text>
              <Text style={styles.footerLink} onPress={() => router.push('/about')}>
                About
              </Text>
              <Text style={styles.footerText}> · </Text>
              <Text style={styles.footerLink} onPress={() => router.push('/help')}>
                Help
              </Text>
              <Text style={styles.footerText}> · </Text>
              <Text style={styles.footerLink} onPress={() => router.push('/privacy')}>
                Privacy
              </Text>
            </View>
          </View>
        </View>

        {/* Website only; renders nothing in the phone apps or if ads are switched off. */}
        <AdBanner />
      </ScrollView>

      <BookPicker
        version={version.id}
        visible={bookPickerOpen}
        currentBook={book.id}
        currentChapter={pos.chapter}
        onClose={() => setBookPickerOpen(false)}
        onSelect={(b, c) => {
          setBookPickerOpen(false);
          router.push(chapterHref(version.id, b, c));
        }}
      />
    </SafeAreaView>
  );
}

function NavSep() {
  return <Text style={styles.navSep}>|</Text>;
}

function NavLink({ label, href, onPress }: { label: string; href?: Href; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress ?? (() => href && router.push(href))} accessibilityRole="link">
      {({ hovered, pressed }) => (
        <Text style={[styles.navText, (hovered || pressed) && styles.navTextHover]}>{label}</Text>
      )}
    </Pressable>
  );
}

function Chip({
  label,
  href,
  onPress,
  strong,
}: {
  label: string;
  href?: Href;
  onPress?: () => void;
  strong?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress ?? (() => href && router.push(href))}
      accessibilityRole="button"
      style={({ pressed }) => [styles.chip, strong && styles.chipStrong, pressed && styles.pressed]}>
      <Text style={[styles.chipText, strong && styles.chipTextStrong]}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Body({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.bodyMuted]}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={[styles.body, styles.bulletText]}>{children}</Text>
    </View>
  );
}

function OutlineButton({ label, onPress, link }: { label: string; onPress: () => void; link?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={link ? 'link' : 'button'}
      style={({ pressed, hovered }) => [
        styles.outline,
        hovered && styles.outlineHover,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.outlineText}>{label}</Text>
    </Pressable>
  );
}

const NAVY_DEEP = '#0A2556'; // info section background, a shade under the logo navy

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1, backgroundColor: '#DCE6F2' }, // shown for a moment before the clouds load
  scroll: { flexGrow: 1 },
  page: { width: '100%', maxWidth: PAGE_WIDTH, alignSelf: 'center' },

  // Nav — wide
  navWide: {
    zIndex: 10, // keeps the logo and version dropdown above the hero image
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 84,
    paddingLeft: 250, // room for the logo, which hangs down over the hero
    paddingRight: Spacing.three,
  },
  logoWide: { position: 'absolute', left: Spacing.four, top: 0, width: 200, height: 200 },
  navLinks: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  navText: { fontSize: 19, color: Colors.navy, fontFamily: Fonts.sans, paddingVertical: Spacing.two },
  navTextHover: { textDecorationLine: 'underline' },
  navSep: { fontSize: 19, color: Colors.navy, marginHorizontal: Spacing.two, fontFamily: Fonts.sans },
  versionWrap: { position: 'relative' },

  // Nav — narrow
  navNarrow: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  menuCorner: { position: 'absolute', top: Spacing.two, right: Spacing.three, zIndex: 1 },
  logoNarrow: { width: 120, height: 120, marginBottom: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.two },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  chipStrong: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  chipText: { fontSize: 15, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  chipTextStrong: { color: '#FFFFFF' },

  // Version list (dropdown on the website, in-place list in the apps / on phones)
  versionList: { backgroundColor: '#FFFFFF', paddingVertical: Spacing.two },
  versionListOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 20,
    minWidth: 280,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  versionItem: { paddingVertical: 10, paddingHorizontal: Spacing.four },
  versionItemActive: { backgroundColor: Colors.surface },
  versionAbbr: { fontSize: 17, fontWeight: '700', color: Colors.text, fontFamily: Fonts.sans },
  versionAbbrSelected: { color: Colors.navy },
  versionFull: { fontSize: 13, color: Colors.textSecondary, fontFamily: Fonts.sans },

  // Hero
  hero: { alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: Spacing.four },
  heroWide: { height: 500, paddingBottom: 64 },
  heroNarrow: { height: 260, justifyContent: 'center' },
  primary: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    paddingVertical: Spacing.four,
    borderRadius: 14,
    backgroundColor: Colors.navy,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryLabel: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', fontFamily: Fonts.sans },
  primaryTarget: { fontSize: 15, color: Colors.goldLight, marginTop: 4, fontFamily: Fonts.sans },

  // Info section
  info: {
    backgroundColor: NAVY_DEEP,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
  },
  infoWide: { paddingHorizontal: 48 },
  section: { marginBottom: Spacing.five },
  sectionTitle: {
    fontFamily: Fonts.script,
    fontSize: 40,
    color: '#FFFFFF',
    marginBottom: Spacing.two,
  },
  body: { fontSize: 18, lineHeight: 27, color: '#FFFFFF', fontFamily: Fonts.sans },
  bodyMuted: { color: '#C9D3E6', fontSize: 16, marginTop: Spacing.two },
  verse: {
    marginTop: Spacing.three,
    fontSize: 18,
    lineHeight: 27,
    fontStyle: 'italic',
    color: Colors.goldLight,
    fontFamily: Fonts.serif,
  },
  verseRef: { marginTop: Spacing.one, fontSize: 15, color: '#C9D3E6', fontFamily: Fonts.sans },
  bullet: { flexDirection: 'row', marginBottom: Spacing.one },
  bulletDot: { width: 20, fontSize: 18, lineHeight: 27, color: Colors.goldLight },
  bulletText: { flex: 1 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
  outline: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.goldLight,
  },
  outlineHover: { backgroundColor: 'rgba(243,201,105,0.15)' },
  outlineText: { fontSize: 16, fontWeight: '700', color: Colors.goldLight, fontFamily: Fonts.sans },
  inlineLink: { color: Colors.goldLight, textDecorationLine: 'underline' },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: Spacing.three,
  },
  footerText: { fontSize: 14, color: '#C9D3E6', fontFamily: Fonts.sans },
  footerLink: { fontSize: 14, color: '#FFFFFF', textDecorationLine: 'underline', fontFamily: Fonts.sans },

  pressed: { opacity: 0.6 },
});
