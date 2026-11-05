import { Image } from 'expo-image';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bookName, getBook } from '@/bible/books';
import { getVersion, VERSIONS } from '@/bible/versions';
import { AppMenu } from '@/components/app-menu';
import { BookPicker } from '@/components/book-picker';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { chapterHref } from '@/navigation';
import {
  getLastPosition,
  hasSavedPosition,
  saveLastPosition,
  type Position,
} from '@/state/last-position';

/** Landing screen: logo, Bible version choice, continue reading, quick links. */
export default function Home() {
  const [pos, setPos] = useState<Position | null>(null);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);

  // Re-read the saved position every time this screen comes into view. The landing screen
  // stays open underneath the reader, so reading only once (on first open) left the button
  // stuck on whatever chapter was saved back then.
  useFocusEffect(
    useCallback(() => {
      getLastPosition().then(setPos);
      hasSavedPosition().then((saved) => setIsFirstRun(!saved));
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

  const chooseVersion = (id: string) => {
    const next = { ...pos, version: id };
    setPos(next);
    saveLastPosition(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topBar}>
        <AppMenu />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <Image
            source={require('@/assets/images/logo-full.png')}
            style={styles.logo}
            accessibilityLabel="Berean"
          />

          <Text style={styles.label} accessibilityRole="header">
            Choose a Bible
          </Text>
          <View style={styles.versions} accessibilityRole="radiogroup">
            {VERSIONS.map((v) => {
              const selected = v.id === version.id;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => chooseVersion(v.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={v.name}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{v.abbr}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.versionName}>{version.name}</Text>

          <Pressable
            onPress={() => router.push(chapterHref(version.id, book.id, pos.chapter))}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryLabel}>{isFirstRun ? 'Start reading' : 'Continue reading'}</Text>
            <Text style={styles.primaryTarget}>
              {bookName(book.id, version.id)} {pos.chapter}
            </Text>
          </Pressable>

          <View style={styles.links}>
            <LinkButton label="Browse books" onPress={() => setBookPickerOpen(true)} />
            <LinkButton label="Bookmarks" href="/bookmarks" />
            <LinkButton label="Search" href="/search" />
          </View>
        </View>
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

function LinkButton({ label, href, onPress }: { label: string; href?: Href; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress ?? (() => href && router.push(href))}
      accessibilityRole="button"
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: Spacing.five },
  column: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  logo: { width: 200, height: 200, marginBottom: Spacing.four },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginBottom: Spacing.two,
    fontFamily: Fonts.sans,
  },
  versions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.two },
  chip: {
    minWidth: 64,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  chipSelected: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  chipText: { fontSize: 15, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  chipTextSelected: { color: '#FFFFFF' },
  versionName: {
    marginTop: Spacing.two,
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  primary: {
    marginTop: Spacing.four,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    backgroundColor: Colors.navy,
  },
  primaryLabel: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', fontFamily: Fonts.sans },
  primaryTarget: { fontSize: 14, color: Colors.goldLight, marginTop: 2, fontFamily: Fonts.sans },
  links: {
    marginTop: Spacing.three,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  link: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.two },
  linkText: { fontSize: 15, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  pressed: { opacity: 0.6 },
});
