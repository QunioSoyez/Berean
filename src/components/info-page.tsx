import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';

import { ScreenHeader } from './screen-header';

/** Scrollable text page with a back header (About, License). */
export function InfoPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={title} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.heading} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Para({ children, small }: { children: ReactNode; small?: boolean }) {
  return <Text style={[styles.para, small && styles.small]}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.six },
  column: {
    width: '100%',
    maxWidth: MaxReadingWidth,
    alignSelf: 'center',
    padding: Spacing.three,
  },
  heading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    fontFamily: Fonts.sans,
  },
  para: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    marginBottom: Spacing.two,
    fontFamily: Fonts.sans,
  },
  small: { fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
});
