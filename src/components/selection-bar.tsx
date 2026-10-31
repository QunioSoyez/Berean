import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { HIGHLIGHT_COLORS } from '@/userdata/highlight-colors';

type Props = {
  reference: string;
  /** Color shared by every selected verse (to mark the active swatch), if any. */
  currentColor: string | null;
  anyHighlighted: boolean;
  message: string | null;
  onHighlight: (color: string) => void;
  onRemoveHighlight: () => void;
  onCopy: () => void;
  onShare: () => void;
  onClear: () => void;
};

/** Bottom bar shown while verses are selected. */
export function SelectionBar(props: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}
      accessibilityRole="toolbar">
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <Text style={styles.reference} numberOfLines={1}>
            {props.message ?? props.reference}
          </Text>
          <Pressable
            onPress={props.onClear}
            accessibilityRole="button"
            accessibilityLabel="Clear selection"
            hitSlop={10}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.swatches}>
          {HIGHLIGHT_COLORS.map((c) => {
            const active = props.currentColor === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => props.onHighlight(c.id)}
                accessibilityRole="button"
                accessibilityLabel={`Highlight ${c.label.toLowerCase()}`}
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.swatch,
                  { backgroundColor: c.swatch },
                  active && styles.swatchActive,
                  pressed && styles.pressed,
                ]}
              />
            );
          })}
          {props.anyHighlighted && (
            <Pressable
              onPress={props.onRemoveHighlight}
              accessibilityRole="button"
              accessibilityLabel="Remove highlight"
              style={({ pressed }) => [styles.swatch, styles.remove, pressed && styles.pressed]}>
              <View style={styles.removeSlash} />
            </Pressable>
          )}
        </View>

        <View style={styles.actions}>
          <ActionButton label="Copy" onPress={props.onCopy} />
          <ActionButton label="Share" onPress={props.onShare} />
        </View>
      </View>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: Spacing.three,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  inner: {
    width: '100%',
    maxWidth: MaxReadingWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reference: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    fontFamily: Fonts.sans,
  },
  close: { paddingHorizontal: Spacing.two },
  closeText: { fontSize: 18, color: Colors.textSecondary },
  swatches: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  swatchActive: { borderWidth: 3, borderColor: Colors.navy },
  remove: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  removeSlash: {
    width: 2,
    height: 40,
    backgroundColor: Colors.danger,
    transform: [{ rotate: '45deg' }],
  },
  actions: { flexDirection: 'row', gap: Spacing.two },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: { fontSize: 15, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  pressed: { opacity: 0.6 },
});
