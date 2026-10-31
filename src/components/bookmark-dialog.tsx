import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  /** "Add bookmark" when false, "Edit bookmark" when true (also shows Remove). */
  editing: boolean;
  reference: string;
  defaultLabel: string;
  initialLabel: string | null;
  onCancel: () => void;
  onSave: (label: string | null) => void;
  onRemove?: () => void;
};

/** Small centered dialog to name (or rename/remove) a bookmark. */
export function BookmarkDialog(props: Props) {
  const [label, setLabel] = useState(props.initialLabel ?? '');

  useEffect(() => {
    if (props.visible) setLabel(props.initialLabel ?? '');
  }, [props.visible, props.initialLabel]);

  const save = () => props.onSave(label.trim() || null);

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onCancel} accessibilityLabel="Cancel" />
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {props.editing ? 'Edit bookmark' : 'Add bookmark'}
          </Text>
          <Text style={styles.reference}>{props.reference}</Text>

          <Text style={styles.inputLabel}>Name (optional)</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder={props.defaultLabel}
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={save}
            maxLength={80}
            accessibilityLabel="Bookmark name"
          />

          <View style={styles.buttons}>
            {props.onRemove ? (
              <Pressable
                onPress={props.onRemove}
                accessibilityRole="button"
                style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
                <Text style={[styles.buttonText, styles.removeText]}>Remove</Text>
              </Pressable>
            ) : null}
            <View style={styles.spacer} />
            <Pressable
              onPress={props.onCancel}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}>
              <Text style={[styles.buttonText, styles.primaryText]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: Spacing.four,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  reference: {
    marginTop: Spacing.one,
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  inputLabel: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.surface,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  spacer: { flex: 1 },
  button: { paddingHorizontal: Spacing.three, paddingVertical: 10, borderRadius: 10 },
  buttonText: { fontSize: 16, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  removeText: { color: Colors.danger },
  primary: { backgroundColor: Colors.navy },
  primaryText: { color: '#FFFFFF' },
  pressed: { opacity: 0.6 },
});
