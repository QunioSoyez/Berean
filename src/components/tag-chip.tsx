import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';

type Props = {
  tag: string;
  active?: boolean;
  /** Shows a ✕ and makes the chip removable. */
  onRemove?: () => void;
  onPress?: () => void;
  small?: boolean;
};

export function TagChip({ tag, active, onRemove, onPress, small }: Props) {
  const press = onRemove ?? onPress;
  const content = (
    <Text style={[styles.text, small && styles.textSmall, active && styles.textActive]}>
      #{tag}
      {onRemove ? '  ✕' : ''}
    </Text>
  );
  if (!press) return <View style={[styles.chip, small && styles.chipSmall]}>{content}</View>;
  return (
    <Pressable
      onPress={press}
      accessibilityRole="button"
      accessibilityLabel={onRemove ? `Remove tag ${tag}` : `Tag ${tag}`}
      accessibilityState={{ selected: !!active }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        small && styles.chipSmall,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  chipSmall: { paddingHorizontal: Spacing.two, paddingVertical: 2 },
  chipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  text: { fontSize: 14, color: Colors.navy, fontWeight: '600', fontFamily: Fonts.sans },
  textSmall: { fontSize: 12 },
  textActive: { color: '#FFFFFF' },
  pressed: { opacity: 0.6 },
});
