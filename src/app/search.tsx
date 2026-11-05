import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatReference } from '@/bible/reference';
import { MAX_RESULTS, searchBible, splitForHighlight, type SearchResult } from '@/bible/search';
import { getVersion } from '@/bible/versions';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { chapterHref } from '@/navigation';
import { getLastPosition } from '@/state/last-position';

/** Keyword search across every book of the version currently being read. */
export default function SearchScreen() {
  const [version, setVersion] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searchedFor, setSearchedFor] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);
  const versionRef = useRef<string | null>(null);

  // Pick up the reader's current version each time the screen is shown.
  useFocusEffect(
    useCallback(() => {
      getLastPosition().then((p) => {
        if (versionRef.current && versionRef.current !== p.version) {
          // Version changed since the last search → old results no longer apply.
          setResult(null);
          setSearchedFor('');
        }
        versionRef.current = p.version;
        setVersion(p.version);
      });
    }, []),
  );

  const run = async () => {
    const q = query.trim();
    if (!version || !q) return;
    const id = ++runId.current;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const r = await searchBible(version, q, (done, total) => {
        if (id === runId.current) setProgress(done / total);
      });
      if (id !== runId.current) return;
      setResult(r);
      setSearchedFor(q);
    } catch {
      if (id === runId.current) setError('Search failed. Please try again.');
    } finally {
      if (id === runId.current) setBusy(false);
    }
  };

  const versionInfo = getVersion(version ?? undefined);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Search" />
      <View style={styles.column}>
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={run}
            placeholder={versionInfo ? `Search the ${versionInfo.abbr}` : 'Search'}
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
            autoFocus
            clearButtonMode="while-editing"
            accessibilityLabel="Search words"
          />
          <Pressable
            onPress={run}
            disabled={!query.trim() || busy}
            accessibilityRole="button"
            accessibilityLabel="Search"
            style={({ pressed }) => [
              styles.button,
              (!query.trim() || busy) && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.buttonText}>Search</Text>
          </Pressable>
        </View>
        {versionInfo && (
          <Text style={styles.hint}>
            Searching the {versionInfo.name}. Use quotes for an exact phrase, e.g. “born again”.
          </Text>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
        {busy && (
          <View style={styles.busy}>
            <ActivityIndicator color={Colors.navy} />
            <Text style={styles.busyText}>Searching… {Math.round(progress * 100)}%</Text>
          </View>
        )}
        {!busy && result && (
          <Text style={styles.count} accessibilityLiveRegion="polite">
            {result.total === 0
              ? `No verses found for “${searchedFor}”.`
              : `${result.total.toLocaleString()} ${result.total === 1 ? 'verse' : 'verses'} found` +
                (result.total > MAX_RESULTS ? ` — showing the first ${MAX_RESULTS.toLocaleString()}` : '')}
          </Text>
        )}
      </View>

      {!busy && result && result.hits.length > 0 && (
        <FlatList
          data={result.hits}
          keyExtractor={(h) => `${h.book}.${h.chapter}.${h.verse}`}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                version && router.push(chapterHref(version, item.book, item.chapter, [item.verse]))
              }
              accessibilityRole="button"
              accessibilityLabel={`${formatReference(item.book, item.chapter, [item.verse], version ?? undefined)}. ${item.text}`}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Text style={styles.reference}>{formatReference(item.book, item.chapter, [item.verse], version ?? undefined)}</Text>
              <Text style={styles.text}>
                {splitForHighlight(item.text, result.terms).map((p, i) => (
                  <Text key={i} style={p.match ? styles.match : undefined}>
                    {p.text}
                  </Text>
                ))}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  column: {
    width: '100%',
    maxWidth: MaxReadingWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  searchRow: { flexDirection: 'row', gap: Spacing.two },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.surface,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  button: {
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    backgroundColor: Colors.navy,
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: Fonts.sans },
  disabled: { opacity: 0.4 },
  hint: { fontSize: 13, color: Colors.textSecondary, fontFamily: Fonts.sans },
  error: { color: Colors.danger, fontFamily: Fonts.sans },
  busy: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  busyText: { color: Colors.textSecondary, fontFamily: Fonts.sans },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    paddingVertical: Spacing.two,
    fontFamily: Fonts.sans,
  },
  list: { width: '100%', maxWidth: MaxReadingWidth, alignSelf: 'center', paddingBottom: Spacing.six },
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    gap: Spacing.one,
  },
  reference: { fontSize: 14, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  text: { fontSize: 17, lineHeight: 26, color: Colors.text, fontFamily: Fonts.serif },
  match: { backgroundColor: '#FFF1A0', fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
