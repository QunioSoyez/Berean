import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';
import { goBackOrHome, goHome } from '@/navigation';

import { AppMenu } from './app-menu';

/** Header for secondary screens: back button, title, the logo (→ home) and the hamburger menu. */
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
        <View style={[styles.back, styles.menu]}>
          <Pressable
            onPress={goHome}
            accessibilityRole="button"
            accessibilityLabel="Home"
            hitSlop={6}
            style={({ pressed }) => pressed && styles.pressed}>
            <Image source={require('@/assets/images/logo-mark.png')} style={styles.logo} />
          </Pressable>
          <AppMenu />
        </View>
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
  // Both sides the same width so the title stays centered.
  back: { width: 96, paddingVertical: Spacing.two },
  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    paddingVertical: 0,
  },
  logo: { width: 28, height: 28, borderRadius: 6 },
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
