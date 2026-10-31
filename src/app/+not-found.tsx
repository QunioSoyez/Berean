import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Text style={styles.title}>That page doesn’t exist.</Text>
      <Link href="/" style={styles.link}>
        Back to reading
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  title: { fontSize: 18, color: Colors.text, marginBottom: Spacing.three },
  link: { fontSize: 16, color: Colors.navy, fontWeight: '600' },
});
