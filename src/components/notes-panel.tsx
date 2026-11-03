import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatReference } from '@/bible/reference';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import type { Note, NoteInput } from '@/userdata/note-types';

import { NoteEditor } from './note-editor';
import { NoteText } from './note-text';
import { TagChip } from './tag-chip';

export const NOTES_PANEL_WIDTH = 360;

type Props = {
  /** 'docked': a column beside the text (wide screens). 'overlay': slides over the text (phones). */
  mode: 'docked' | 'overlay';
  book: string;
  chapter: number;
  /** The verse(s) the panel is about. */
  verses: number[];
  /** Notes attached to any of those verses. */
  notes: Note[];
  knownTags: string[];
  /** Open straight into "new note" (e.g. from the selection bar). */
  startComposing: boolean;
  onClose: () => void;
  onAdd: (input: NoteInput) => Promise<boolean>;
  onEdit: (id: string, input: NoteInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
};

/** Side panel listing a verse's notes, with add / edit / delete. */
export function NotesPanel(props: Props) {
  const insets = useSafeAreaInsets();
  const [composing, setComposing] = useState(props.startComposing);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const versesKey = props.verses.join(',');
  useEffect(() => {
    setComposing(props.startComposing);
    setEditingId(null);
    setConfirmId(null);
  }, [versesKey, props.startComposing]);

  useEffect(() => {
    if (!confirmId) return;
    const t = setTimeout(() => setConfirmId(null), 4000);
    return () => clearTimeout(t);
  }, [confirmId]);

  const reference = formatReference(props.book, props.chapter, props.verses);

  const panel = (
    <View
      style={[
        styles.panel,
        props.mode === 'docked' ? styles.docked : styles.overlay,
        props.mode === 'overlay' && { paddingBottom: insets.bottom },
      ]}
      accessibilityLabel={`Notes for ${reference}`}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            Notes
          </Text>
          <Text style={styles.reference}>{reference}</Text>
        </View>
        <Pressable
          onPress={props.onClose}
          accessibilityRole="button"
          accessibilityLabel="Close notes"
          hitSlop={10}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {composing ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>New note · {reference}</Text>
            <NoteEditor
              knownTags={props.knownTags}
              onCancel={() => setComposing(false)}
              onSave={async (input) => {
                if (await props.onAdd(input)) setComposing(false);
              }}
            />
          </View>
        ) : (
          <Pressable
            onPress={() => {
              setEditingId(null);
              setComposing(true);
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addText}>+ Add a note</Text>
          </Pressable>
        )}

        {props.notes.length === 0 && !composing && (
          <Text style={styles.empty}>No notes on {reference} yet.</Text>
        )}

        {props.notes.map((note) =>
          editingId === note.id ? (
            <View key={note.id} style={styles.card}>
              <Text style={styles.cardLabel}>
                Editing · {formatReference(note.book, note.chapter, note.verses)}
              </Text>
              <NoteEditor
                initial={{ body: note.body, tags: note.tags }}
                knownTags={props.knownTags}
                onCancel={() => setEditingId(null)}
                onSave={async (input) => {
                  if (await props.onEdit(note.id, input)) setEditingId(null);
                }}
              />
            </View>
          ) : (
            <View key={note.id} style={styles.card}>
              <Text style={styles.cardLabel}>
                {formatReference(note.book, note.chapter, note.verses)} ·{' '}
                {new Date(note.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <NoteText body={note.body} format={note.format} />
              {note.tags.length > 0 && (
                <View style={styles.chips}>
                  {note.tags.map((t) => (
                    <TagChip key={t} tag={t} small />
                  ))}
                </View>
              )}
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => {
                    setComposing(false);
                    setEditingId(note.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Edit note"
                  hitSlop={6}
                  style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => (confirmId === note.id ? props.onDelete(note.id) : setConfirmId(note.id))}
                  accessibilityRole="button"
                  accessibilityLabel={confirmId === note.id ? 'Confirm delete note' : 'Delete note'}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    confirmId === note.id && styles.confirmBtn,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.actionText,
                      styles.deleteText,
                      confirmId === note.id && styles.confirmText,
                    ]}>
                    {confirmId === note.id ? 'Tap to confirm' : 'Delete'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ),
        )}
      </ScrollView>
    </View>
  );

  if (props.mode === 'docked') return panel;

  // Phones: dim the text behind; tapping the dimmed area closes the panel.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        style={[StyleSheet.absoluteFill, styles.backdrop]}
        onPress={props.onClose}
        accessibilityLabel="Close notes"
      />
      {panel}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: Colors.background },
  docked: {
    width: NOTES_PANEL_WIDTH,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: Colors.border,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '92%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: -4, height: 0 },
    elevation: 16,
  },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.25)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  reference: { fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.sans, marginTop: 2 },
  close: { paddingHorizontal: Spacing.two },
  closeText: { fontSize: 18, color: Colors.textSecondary },
  body: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  addButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.navy,
    alignItems: 'center',
  },
  addText: { fontSize: 15, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  empty: { color: Colors.textSecondary, textAlign: 'center', fontFamily: Fonts.sans },
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: Spacing.two,
  },
  cardLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, fontFamily: Fonts.sans },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
  actionBtn: { paddingHorizontal: Spacing.two, paddingVertical: 6, borderRadius: 8 },
  actionText: { fontSize: 14, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  deleteText: { color: Colors.danger },
  confirmBtn: { backgroundColor: Colors.danger },
  confirmText: { color: '#FFFFFF' },
  pressed: { opacity: 0.6 },
});
