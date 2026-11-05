import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadChapter } from '@/bible/load';
import { formatReference } from '@/bible/reference';
import { getVersion } from '@/bible/versions';
import { BookmarkDialog } from '@/components/bookmark-dialog';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { chapterHref } from '@/navigation';
import { getLastPosition } from '@/state/last-position';
import {
  bookmarkTitle,
  defaultBookmarkLabel,
  type Bookmark,
} from '@/userdata/bookmark-types';
import { deleteBookmark, listBookmarks, renameBookmark } from '@/userdata/bookmarks';

export default function BookmarksScreen() {
  const [items, setItems] = useState<Bookmark[] | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Bookmark | null>(null);

  const reload = useCallback(async () => {
    try {
      const [list, pos] = await Promise.all([listBookmarks(), getLastPosition()]);
      setItems(list);
      setVersion(pos.version);
      setError(null);
    } catch {
      setError('Couldn’t load your bookmarks.');
      setItems([]);
    }
  }, []);

  // Refresh every time this screen comes into view (e.g. after adding one in the reader).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const open = (b: Bookmark) => {
    if (!version) return;
    router.push(chapterHref(version, b.book, b.chapter, b.verses));
  };

  const onDelete = async (b: Bookmark) => {
    try {
      await deleteBookmark(b.id);
      await reload();
    } catch {
      setError('Couldn’t delete that bookmark. Please try again.');
    }
  };

  const onRename = async (label: string | null) => {
    const b = editing;
    setEditing(null);
    if (!b) return;
    try {
      await renameBookmark(b.id, label);
      await reload();
    } catch {
      setError('Couldn’t rename that bookmark. Please try again.');
    }
  };

  const versionAbbr = getVersion(version ?? undefined)?.abbr ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Bookmarks" />
      {error && <Text style={styles.error}>{error}</Text>}

      {items === null ? (
        <ActivityIndicator style={styles.loading} color={Colors.navy} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptyText}>
            While reading, tap a verse (or several), then tap Bookmark in the bar at the bottom.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BookmarkRow
              bookmark={item}
              version={version}
              versionAbbr={versionAbbr}
              onOpen={() => open(item)}
              onRename={() => setEditing(item)}
              onDelete={() => onDelete(item)}
            />
          )}
        />
      )}

      <BookmarkDialog
        visible={!!editing}
        editing
        reference={editing ? formatReference(editing.book, editing.chapter, editing.verses, version ?? undefined) : ''}
        defaultLabel={
          editing ? defaultBookmarkLabel(editing.book, editing.chapter, editing.verses, version ?? undefined) : ''
        }
        initialLabel={editing?.label ?? null}
        onCancel={() => setEditing(null)}
        onSave={onRename}
        onRemove={
          editing
            ? () => {
                const b = editing;
                setEditing(null);
                onDelete(b);
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

function BookmarkRow({
  bookmark,
  version,
  versionAbbr,
  onOpen,
  onRename,
  onDelete,
}: {
  bookmark: Bookmark;
  version: string | null;
  versionAbbr: string;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [preview, setPreview] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Show the first verse's text in the version currently being read.
  useEffect(() => {
    if (!version) return;
    let cancelled = false;
    loadChapter(version, bookmark.book, bookmark.chapter)
      .then(({ verses }) => {
        if (cancelled) return;
        const text = bookmark.verses.map((v) => verses[v - 1]).filter(Boolean).join(' ');
        setPreview(text);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [version, bookmark]);

  // "Delete" asks once more; the confirm button goes away after a few seconds.
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  const reference = formatReference(bookmark.book, bookmark.chapter, bookmark.verses, version ?? undefined);
  const date = new Date(bookmark.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${bookmarkTitle(bookmark, version ?? undefined)}, ${reference}. Open`}
        style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
        <View style={styles.rowMark} />
        <View style={styles.rowBody}>
          <Text style={styles.title} numberOfLines={1}>
            {bookmarkTitle(bookmark, version ?? undefined)}
          </Text>
          <Text style={styles.meta}>
            {reference}
            {versionAbbr ? ` · ${versionAbbr}` : ''} · {date}
          </Text>
          {preview ? (
            <Text style={styles.preview} numberOfLines={2}>
              {preview}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.rowActions}>
        <Pressable
          onPress={onRename}
          accessibilityRole="button"
          accessibilityLabel={`Rename ${bookmarkTitle(bookmark, version ?? undefined)}`}
          hitSlop={6}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
          <Text style={styles.actionText}>Rename</Text>
        </Pressable>
        <Pressable
          onPress={() => (confirming ? onDelete() : setConfirming(true))}
          accessibilityRole="button"
          accessibilityLabel={
            confirming ? `Confirm delete ${bookmarkTitle(bookmark, version ?? undefined)}` : `Delete ${bookmarkTitle(bookmark, version ?? undefined)}`
          }
          hitSlop={6}
          style={({ pressed }) => [
            styles.actionBtn,
            confirming && styles.confirmBtn,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.actionText, styles.deleteText, confirming && styles.confirmText]}>
            {confirming ? 'Tap to confirm' : 'Delete'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loading: { marginTop: Spacing.six },
  error: {
    color: Colors.danger,
    textAlign: 'center',
    padding: Spacing.three,
    fontFamily: Fonts.sans,
  },
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
  list: {
    width: '100%',
    maxWidth: MaxReadingWidth,
    alignSelf: 'center',
    paddingBottom: Spacing.six,
  },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  rowMain: { flexDirection: 'row', gap: Spacing.three },
  rowMark: {
    marginTop: 4,
    width: 8,
    height: 14,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    backgroundColor: Colors.gold,
  },
  rowBody: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text, fontFamily: Fonts.sans },
  meta: { marginTop: 2, fontSize: 13, color: Colors.textSecondary, fontFamily: Fonts.sans },
  preview: {
    marginTop: Spacing.two,
    fontSize: 16,
    lineHeight: 23,
    color: Colors.text,
    fontFamily: Fonts.serif,
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionBtn: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 8 },
  actionText: { fontSize: 14, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  deleteText: { color: Colors.danger },
  confirmBtn: { backgroundColor: Colors.danger },
  confirmText: { color: '#FFFFFF' },
  pressed: { opacity: 0.6 },
});
