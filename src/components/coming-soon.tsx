import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, Spacing } from '@/constants/theme';

import { ScreenHeader } from './screen-header';

/** Placeholder screen for features scheduled in a later round. */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={title} />
      <View style={styles.body}>
        <Text style={styles.heading}>Coming soon</Text>
        <Text style={styles.text}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: Spacing.two,
    fontFamily: Fonts.serif,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 420,
    fontFamily: Fonts.sans,
  },
});
