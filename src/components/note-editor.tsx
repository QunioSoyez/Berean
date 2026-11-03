import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import {
  continueList,
  toggleLines,
  toggleWrap,
  type Edit,
  type Selection,
} from '@/notes-format/markdown';
import { cleanTag, MAX_TAGS, type NoteInput } from '@/userdata/note-types';

import { NoteText } from './note-text';
import { TagChip } from './tag-chip';

type Props = {
  initial?: NoteInput;
  /** Tags used before, most-used first, for suggestions. */
  knownTags: string[];
  onSave: (input: NoteInput) => void;
  onCancel: () => void;
};

/** Write or edit a note: formatted text (toolbar + preview) plus up to 5 tags. */
export function NoteEditor({ initial, knownTags, onSave, onCancel }: Props) {
  const [body, setBody] = useState(initial?.body ?? '');
  const [preview, setPreview] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);
  // Where the cursor/selection is, so toolbar buttons know what to format.
  const sel = useRef<Selection>({ start: body.length, end: body.length });
  // After a toolbar edit we place the cursor once, then hand control back to the user.
  const [forcedSel, setForcedSel] = useState<Selection | undefined>(undefined);

  const applyEdit = (edit: Edit) => {
    setBody(edit.text);
    sel.current = edit.selection;
    setForcedSel(edit.selection);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onBodyChange = (next: string) => {
    // Pressing Enter on a list line continues the list.
    const cursor = sel.current.start + (next.length - body.length);
    const cont = continueList(body, next, cursor);
    if (cont) applyEdit(cont);
    else setBody(next);
  };

  const tools: { label: string; a11y: string; run: () => void; style?: object }[] = [
    { label: 'B', a11y: 'Bold', run: () => applyEdit(toggleWrap(body, sel.current, '**')), style: styles.toolBold },
    { label: 'I', a11y: 'Italic', run: () => applyEdit(toggleWrap(body, sel.current, '*')), style: styles.toolItalic },
    { label: 'H', a11y: 'Heading', run: () => applyEdit(toggleLines(body, sel.current, 'heading')) },
    { label: '•', a11y: 'Bulleted list', run: () => applyEdit(toggleLines(body, sel.current, 'bullet')) },
    { label: '1.', a11y: 'Numbered list', run: () => applyEdit(toggleLines(body, sel.current, 'number')) },
  ];
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagText, setTagText] = useState('');

  const full = tags.length >= MAX_TAGS;

  const suggestions = useMemo(() => {
    const q = cleanTag(tagText);
    return knownTags
      .filter((t) => !tags.includes(t) && (!q || t.startsWith(q)))
      .slice(0, 6);
  }, [knownTags, tags, tagText]);

  const addTag = (raw: string) => {
    const t = cleanTag(raw);
    if (t) setTags((cur) => (cur.includes(t) || cur.length >= MAX_TAGS ? cur : [...cur, t]));
    setTagText('');
  };

  const onTagChange = (text: string) => {
    // Typing a comma finishes the tag.
    if (text.includes(',')) {
      text.split(',').slice(0, -1).forEach(addTag);
      setTagText(text.split(',').pop() ?? '');
    } else {
      setTagText(text);
    }
  };

  const save = () => {
    const pending = cleanTag(tagText);
    const finalTags = pending && !tags.includes(pending) && !full ? [...tags, pending] : tags;
    onSave({ body, tags: finalTags });
  };

  const canSave = body.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar} accessibilityRole="toolbar">
        {tools.map((t) => (
          <Pressable
            key={t.a11y}
            onPress={t.run}
            disabled={preview}
            accessibilityRole="button"
            accessibilityLabel={t.a11y}
            style={({ pressed }) => [styles.tool, preview && styles.disabled, pressed && styles.pressed]}>
            <Text style={[styles.toolText, t.style]}>{t.label}</Text>
          </Pressable>
        ))}
        <View style={styles.toolSpacer} />
        <View style={styles.tabs}>
          {(['Write', 'Preview'] as const).map((label) => {
            const active = (label === 'Preview') === preview;
            return (
              <Pressable
                key={label}
                onPress={() => setPreview(label === 'Preview')}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {preview ? (
        <View style={[styles.body, styles.previewBox]}>
          {body.trim() ? (
            <NoteText body={body} format="markdown" />
          ) : (
            <Text style={styles.previewEmpty}>Nothing to preview yet.</Text>
          )}
        </View>
      ) : (
        <TextInput
          ref={inputRef}
          value={body}
          onChangeText={onBodyChange}
          selection={forcedSel}
          onSelectionChange={(e) => {
            sel.current = e.nativeEvent.selection;
            if (forcedSel) setForcedSel(undefined);
          }}
          placeholder="Write your note…"
          placeholderTextColor={Colors.textSecondary}
          style={styles.body}
          multiline
          autoFocus
          textAlignVertical="top"
          accessibilityLabel="Note text"
        />
      )}

      <Text style={styles.label}>
        Tags <Text style={styles.labelHint}>({tags.length}/{MAX_TAGS})</Text>
      </Text>
      {tags.length > 0 && (
        <View style={styles.chips}>
          {tags.map((t) => (
            <TagChip key={t} tag={t} onRemove={() => setTags(tags.filter((x) => x !== t))} />
          ))}
        </View>
      )}
      {!full && (
        <TextInput
          value={tagText}
          onChangeText={onTagChange}
          onSubmitEditing={() => addTag(tagText)}
          placeholder="Add a tag, then press Enter"
          placeholderTextColor={Colors.textSecondary}
          style={styles.tagInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          submitBehavior="submit"
          maxLength={40}
          accessibilityLabel="Add a tag"
        />
      )}
      {!full && suggestions.length > 0 && (
        <View style={styles.chips}>
          {suggestions.map((t) => (
            <TagChip key={t} tag={t} small onPress={() => addTag(t)} />
          ))}
        </View>
      )}

      <View style={styles.buttons}>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={save}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          style={({ pressed }) => [
            styles.button,
            styles.primary,
            !canSave && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.buttonText, styles.primaryText]}>Save note</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.one },
  tool: {
    minWidth: 34,
    height: 32,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolText: { fontSize: 15, color: Colors.navy, fontWeight: '600', fontFamily: Fonts.sans },
  toolBold: { fontWeight: '800' },
  toolItalic: { fontStyle: 'italic', fontFamily: Fonts.serif },
  toolSpacer: { flex: 1 },
  tabs: { flexDirection: 'row', borderRadius: 8, backgroundColor: Colors.surface, padding: 2 },
  tab: { paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 6 },
  tabActive: { backgroundColor: Colors.background },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, fontFamily: Fonts.sans },
  tabTextActive: { color: Colors.navy },
  previewBox: { minHeight: 120 },
  previewEmpty: { color: Colors.textSecondary, fontFamily: Fonts.sans },
  body: {
    minHeight: 120,
    maxHeight: 260,
    borderRadius: 10,
    padding: Spacing.three,
    backgroundColor: Colors.surface,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  label: {
    marginTop: Spacing.two,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  labelHint: { fontWeight: '400' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tagInput: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.surface,
    fontSize: 15,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  button: { paddingHorizontal: Spacing.three, paddingVertical: 10, borderRadius: 10 },
  buttonText: { fontSize: 15, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  primary: { backgroundColor: Colors.navy },
  primaryText: { color: '#FFFFFF' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
});
