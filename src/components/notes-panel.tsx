import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type HostInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatReference } from '@/bible/reference';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import type { Note, NoteInput } from '@/userdata/note-types';

import { NoteEditor } from './note-editor';
import { NoteText } from './note-text';
import { TagChip } from './tag-chip';

export const NOTES_PANEL_WIDTH = 360;
const MIN_PANEL_WIDTH = 300;
/** Always leave at least this much room for the Bible text when dragging the panel wider. */
const MIN_TEXT_WIDTH = 380;
const WIDTH_KEY = 'berean.panelWidth.v1';

/**
 * Width of the docked panel, adjustable by dragging its left edge. Remembered between
 * visits (per device). Dragging left makes it wider, right makes it narrower.
 */
function useResizableWidth(enabled: boolean) {
  const { width: screenWidth } = useWindowDimensions();
  const maxWidth = Math.max(MIN_PANEL_WIDTH, screenWidth - MIN_TEXT_WIDTH);
  const [width, setWidth] = useState(NOTES_PANEL_WIDTH);
  const startWidth = useRef(width);
  const lastTap = useRef(0);
  const current = useRef(width);
  current.current = width;

  useEffect(() => {
    AsyncStorage.getItem(WIDTH_KEY)
      .then((v) => v && setWidth(Number(v) || NOTES_PANEL_WIDTH))
      .catch(() => {});
  }, []);

  const clamp = (w: number) => Math.round(Math.min(maxWidth, Math.max(MIN_PANEL_WIDTH, w)));
  const clampRef = useRef(clamp);
  clampRef.current = clamp;

  const start = () => {
    startWidth.current = clampRef.current(current.current);
  };
  const move = (dx: number) => setWidth(clampRef.current(startWidth.current - dx));
  const end = (dx: number) => {
    // Double-tap / double-click the handle (without dragging) to reset the width.
    const now = Date.now();
    if (Math.abs(dx) < 3 && now - lastTap.current < 400) {
      lastTap.current = 0;
      setWidth(NOTES_PANEL_WIDTH);
      AsyncStorage.setItem(WIDTH_KEY, String(NOTES_PANEL_WIDTH)).catch(() => {});
      return;
    }
    lastTap.current = Math.abs(dx) < 3 ? now : 0;
    AsyncStorage.setItem(WIDTH_KEY, String(clampRef.current(current.current))).catch(() => {});
  };
  const fns = useRef({ start, move, end });
  fns.current = { start, move, end };

  // Phones/tablets: React Native's gesture responder.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => fns.current.start(),
        onPanResponderMove: (_, g) => fns.current.move(g.dx),
        onPanResponderRelease: (_, g) => fns.current.end(g.dx),
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );

  // Web: pointer events with pointer capture, so fast mouse drags don't "lose" the handle.
  const handleRef = useRef<HostInstance>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;
    const el = handleRef.current as unknown as HTMLElement | null;
    if (!el) return;
    let startX = 0;
    let dragging = false;
    const down = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX;
      el.setPointerCapture(e.pointerId);
      fns.current.start();
      e.preventDefault();
    };
    const moveEv = (e: PointerEvent) => dragging && fns.current.move(e.clientX - startX);
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.releasePointerCapture(e.pointerId);
      fns.current.end(e.clientX - startX);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', moveEv);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', moveEv);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [enabled]); // attach once per handle (re-attaching mid-drag would drop the drag)

  return {
    width: clamp(width),
    handleRef,
    handlers: Platform.OS === 'web' ? {} : responder.panHandlers,
  };
}

export type PanelTab = 'notes' | 'commentary';

type Props = {
  /** 'docked': a column beside the text (wide screens). 'overlay': slides over the text (phones). */
  mode: 'docked' | 'overlay';
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  /** Contents of the Commentary tab (has its own scrolling). */
  commentary: ReactNode;
  /** Label for that tab ("Commentary", or "Estudio NTBT" for the NTBT). */
  studyLabel?: string;
  /** Bible version being read — book names follow its language. */
  version?: string;
  book: string;
  chapter: number;
  /** The verse(s) the panel is about. Empty = the whole chapter (no verse picked). */
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

/** Side panel with two tabs: My notes (add / edit / delete) and Commentary. */
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

  const reference = formatReference(props.book, props.chapter, props.verses, props.version);
  const resize = useResizableWidth(props.mode === 'docked');

  const panel = (
    <View
      style={[
        styles.panel,
        props.mode === 'docked' ? [styles.docked, { width: resize.width }] : styles.overlay,
        props.mode === 'overlay' && { paddingBottom: insets.bottom },
      ]}
      accessibilityLabel={`Study panel for ${reference}`}>
      {props.mode === 'docked' && (
        // Drag handle on the left edge: drag left to widen, right to narrow; double-tap resets.
        <View
          ref={resize.handleRef}
          {...resize.handlers}
          style={[styles.handle, Platform.OS === 'web' && ({ cursor: 'col-resize' } as object)]}
          accessibilityLabel="Resize panel"
          accessibilityHint="Drag left to make the panel wider, right to make it narrower. Double-tap to reset.">
          <View style={styles.grip} />
        </View>
      )}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.tabs} accessibilityRole="tablist">
            {(
              [
                ['notes', 'My notes'],
                ['commentary', props.studyLabel ?? 'Commentary'],
              ] as const
            ).map(([id, label]) => {
              const active = props.tab === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => props.onTabChange(id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.tab, active && styles.tabActive]}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
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

      {props.tab === 'commentary' ? (
        <View style={styles.flex}>{props.commentary}</View>
      ) : (
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {props.verses.length === 0 ? (
          <Text style={styles.hint}>Tap a verse, then Note, to add a note. Notes in this chapter:</Text>
        ) : composing ? (
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
                Editing · {formatReference(note.book, note.chapter, note.verses, props.version)}
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
                {formatReference(note.book, note.chapter, note.verses, props.version)} ·{' '}
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
      )}
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
    position: 'relative',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: Colors.border,
  },
  handle: {
    position: 'absolute',
    left: -6,
    top: 0,
    bottom: 0,
    width: 12,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grip: { width: 4, height: 40, borderRadius: 2, backgroundColor: Colors.border },
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
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', gap: Spacing.one, marginBottom: Spacing.one },
  tab: { paddingHorizontal: Spacing.two + 2, paddingVertical: 6, borderRadius: 8 },
  tabActive: { backgroundColor: Colors.navy },
  tabText: { fontSize: 15, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  tabTextActive: { color: '#FFFFFF' },
  hint: { color: Colors.textSecondary, fontFamily: Fonts.sans },
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
