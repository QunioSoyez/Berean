import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BOOKS, type Book } from '@/bible/books';
import { Colors, Fonts, Spacing } from '@/constants/theme';

import { Sheet } from './sheet';

type Props = {
  visible: boolean;
  currentBook: string;
  currentChapter: number;
  onClose: () => void;
  onSelect: (book: string, chapter: number) => void;
};

export function BookPicker({ visible, currentBook, currentChapter, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(currentBook);

  // Each time the picker opens, start from the book being read.
  useEffect(() => {
    if (visible) {
      setQuery('');
      setExpanded(currentBook);
    }
  }, [visible, currentBook]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BOOKS;
    return BOOKS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().startsWith(q),
    );
  }, [query]);

  const onBookPress = (book: Book) => {
    if (book.chapters === 1) onSelect(book.id, 1);
    else setExpanded(expanded === book.id ? null : book.id);
  };

  const sections: { title: string; books: Book[] }[] = [
    { title: 'Old Testament', books: filtered.filter((b) => b.testament === 'OT') },
    { title: 'New Testament', books: filtered.filter((b) => b.testament === 'NT') },
  ];

  return (
    <Sheet visible={visible} title="Books" onClose={onClose}>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Find a book"
          placeholderTextColor={Colors.textSecondary}
          style={styles.search}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          accessibilityLabel="Find a book"
          onSubmitEditing={() => {
            if (filtered.length === 1) onBookPress(filtered[0]);
          }}
        />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {sections.map((section) =>
          section.books.length ? (
            <View key={section.title}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                {section.title}
              </Text>
              {section.books.map((book) => {
                const open = expanded === book.id || (filtered.length === 1 && book.chapters > 1);
                const isCurrent = book.id === currentBook;
                return (
                  <View key={book.id}>
                    <Pressable
                      onPress={() => onBookPress(book)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      style={({ pressed }) => [styles.bookRow, pressed && styles.pressed]}>
                      <Text style={[styles.bookName, isCurrent && styles.current]}>{book.name}</Text>
                      <Text style={styles.chapterCount}>
                        {book.chapters} {book.chapters === 1 ? 'chapter' : 'chapters'}
                      </Text>
                    </Pressable>
                    {open && (
                      <View style={styles.grid}>
                        {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => {
                          const selected = isCurrent && ch === currentChapter;
                          return (
                            <Pressable
                              key={ch}
                              onPress={() => onSelect(book.id, ch)}
                              accessibilityRole="button"
                              accessibilityLabel={`${book.name} chapter ${ch}`}
                              style={({ pressed }) => [
                                styles.cell,
                                selected && styles.cellSelected,
                                pressed && styles.pressed,
                              ]}>
                              <Text style={[styles.cellText, selected && styles.cellTextSelected]}>
                                {ch}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : null,
        )}
        {filtered.length === 0 && <Text style={styles.empty}>No book matches “{query}”.</Text>}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  searchWrap: { padding: Spacing.three, paddingBottom: Spacing.two },
  search: {
    height: 42,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.surface,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  list: { paddingBottom: Spacing.six },
  sectionTitle: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  bookName: { fontSize: 17, color: Colors.text, fontFamily: Fonts.sans },
  current: { color: Colors.navy, fontWeight: '700' },
  chapterCount: { fontSize: 13, color: Colors.textSecondary, fontFamily: Fonts.sans },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.three,
    backgroundColor: Colors.surface,
  },
  cell: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cellSelected: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  cellText: { fontSize: 16, color: Colors.text, fontFamily: Fonts.sans },
  cellTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  pressed: { opacity: 0.6 },
  empty: {
    padding: Spacing.four,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
});
