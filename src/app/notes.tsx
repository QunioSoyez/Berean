import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bookIndex, bookName } from '@/bible/books';
import { formatReference } from '@/bible/reference';
import { AdBanner } from '@/components/ad-banner';
import { ScreenHeader } from '@/components/screen-header';
import { TagChip } from '@/components/tag-chip';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { chapterHref } from '@/navigation';
import { getLastPosition } from '@/state/last-position';
import { useFontScale } from '@/state/settings';
import { stripMarkdown } from '@/notes-format/markdown';
import type { Note } from '@/userdata/note-types';
import { listNotes } from '@/userdata/notes';

/** All personal notes: search, filter by tag or book, newest first. Tap to open in the reader. */
export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [book, setBook] = useState<string | null>(null);
  const fs = useFontScale(); // Settings → Text size

  useFocusEffect(
    useCallback(() => {
      Promise.all([listNotes(), getLastPosition()])
        .then(([list, pos]) => {
          setNotes(list);
          setVersion(pos.version);
          setError(null);
        })
        .catch(() => {
          setError('Couldn’t load your notes.');
          setNotes([]);
        });
    }, []),
  );

  const all = useMemo(() => notes ?? [], [notes]);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of all) for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  }, [all]);

  const books = useMemo(
    () => [...new Set(all.map((n) => n.book))].sort((a, b) => bookIndex(a) - bookIndex(b)),
    [all],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((n) => {
      if (tag && !n.tags.includes(tag)) return false;
      if (book && n.book !== book) return false;
      if (!q) return true;
      const ref = formatReference(n.book, n.chapter, n.verses, version ?? undefined).toLowerCase();
      return (
        plainBody(n).toLowerCase().includes(q) || ref.includes(q) || n.tags.some((t) => t.includes(q))
      );
    });
  }, [all, query, tag, book]);

  const open = (n: Note) => {
    if (version) router.push(chapterHref(version, n.book, n.chapter, n.verses, true));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Notes" />
      {error && <Text style={styles.error}>{error}</Text>}

      {notes === null ? (
        <ActivityIndicator style={styles.loading} color={Colors.navy} />
      ) : all.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No notes yet</Text>
          <Text style={styles.emptyText}>
            While reading, tap a verse (or several), then tap Note in the bar at the bottom.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          ListFooterComponent={<AdBanner />}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.filters}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search your notes"
                placeholderTextColor={Colors.textSecondary}
                style={styles.search}
                autoCorrect={false}
                clearButtonMode="while-editing"
                accessibilityLabel="Search your notes"
              />
              {tags.length > 0 && (
                <FilterRow label="Tags">
                  {tags.map((t) => (
                    <TagChip key={t} tag={t} active={tag === t} onPress={() => setTag(tag === t ? null : t)} />
                  ))}
                </FilterRow>
              )}
              {books.length > 1 && (
                <FilterRow label="Books">
                  {books.map((b) => (
                    <Pressable
                      key={b}
                      onPress={() => setBook(book === b ? null : b)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: book === b }}
                      style={({ pressed }) => [
                        styles.bookChip,
                        book === b && styles.bookChipActive,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.bookChipText, book === b && styles.bookChipTextActive]}>
                        {bookName(b, version ?? undefined)}
                      </Text>
                    </Pressable>
                  ))}
                </FilterRow>
              )}
              <Text style={styles.count}>
                {filtered.length} of {all.length} {all.length === 1 ? 'note' : 'notes'}
              </Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.noMatch}>No notes match.</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              accessibilityRole="button"
              accessibilityLabel={`Note on ${formatReference(item.book, item.chapter, item.verses, version ?? undefined)}. Open`}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Text style={styles.reference}>
                {formatReference(item.book, item.chapter, item.verses, version ?? undefined)}
                <Text style={styles.date}>
                  {'  ·  '}
                  {new Date(item.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </Text>
              <Text style={[styles.body, fs(16, 23)]} numberOfLines={4}>
                {plainBody(item)}
              </Text>
              {item.tags.length > 0 && (
                <View style={styles.chips}>
                  {item.tags.map((t) => (
                    <TagChip key={t} tag={t} small />
                  ))}
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

/** Note text without formatting marks, for previews and searching. */
function plainBody(n: Note): string {
  return n.format === 'markdown' ? stripMarkdown(n.body) : n.body;
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loading: { marginTop: Spacing.six },
  error: { color: Colors.danger, textAlign: 'center', padding: Spacing.three, fontFamily: Fonts.sans },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: Spacing.two,
    fontFamily: Fonts.serif,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 420,
    fontFamily: Fonts.sans,
  },
  list: { width: '100%', maxWidth: MaxReadingWidth, alignSelf: 'center', paddingBottom: Spacing.six },
  filters: { padding: Spacing.three, gap: Spacing.three },
  search: {
    height: 42,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.surface,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginBottom: Spacing.one + 2,
    fontFamily: Fonts.sans,
  },
  filterRow: { gap: Spacing.two },
  bookChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookChipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  bookChipText: { fontSize: 14, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  bookChipTextActive: { color: '#FFFFFF' },
  count: { fontSize: 13, color: Colors.textSecondary, fontFamily: Fonts.sans },
  noMatch: { textAlign: 'center', color: Colors.textSecondary, padding: Spacing.four, fontFamily: Fonts.sans },
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    gap: Spacing.two,
  },
  reference: { fontSize: 15, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  date: { fontWeight: '400', color: Colors.textSecondary },
  body: { fontSize: 16, lineHeight: 23, color: Colors.text, fontFamily: Fonts.sans },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  pressed: { opacity: 0.6 },
});
