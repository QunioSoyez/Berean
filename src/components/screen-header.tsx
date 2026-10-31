import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { goBackOrHome } from '@/navigation';

/** Simple header with a back button for secondary screens. */
export function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.inner}>
        <Pressable
          onPress={goBackOrHome}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.back} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    width: '100%',
    maxWidth: MaxReadingWidth,
    alignSelf: 'center',
    minHeight: 56,
  },
  back: { width: 72, paddingVertical: Spacing.two },
  backText: { fontSize: 16, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
    fontFamily: Fonts.sans,
  },
  pressed: { opacity: 0.6 },
});
