import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { cleanTag, MAX_TAGS, type NoteInput } from '@/userdata/note-types';

import { TagChip } from './tag-chip';

type Props = {
  initial?: NoteInput;
  /** Tags used before, most-used first, for suggestions. */
  knownTags: string[];
  onSave: (input: NoteInput) => void;
  onCancel: () => void;
};

/** Write or edit a note: plain text plus up to 5 tags. */
export function NoteEditor({ initial, knownTags, onSave, onCancel }: Props) {
  const [body, setBody] = useState(initial?.body ?? '');
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
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Write your note…"
        placeholderTextColor={Colors.textSecondary}
        style={styles.body}
        multiline
        autoFocus
        textAlignVertical="top"
        accessibilityLabel="Note text"
      />

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
