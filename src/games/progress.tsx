import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';

/**
 * Saving a game in progress, so leaving the screen (or the app) doesn't lose it.
 * Each game saves its whole round (the questions/stories/words as dealt, plus where the
 * player is) under its own key, and clears it when the round is finished.
 */

export async function loadProgress<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Saves the round, or clears it when `value` is null. */
export async function saveProgress(key: string, value: unknown): Promise<void> {
  try {
    if (value == null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Not worth interrupting the game for.
  }
}

/** Gold-bordered "Continue your round" card shown at the top of a game's start screen. */
export function ContinueCard({
  title = 'Continue your round',
  detail,
  onPress,
}: {
  title?: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      style={({ pressed, hovered }) => [styles.card, (pressed || hovered) && styles.cardActive]}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <Text style={styles.resume}>Resume ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gold,
    marginBottom: Spacing.four,
  },
  cardActive: { backgroundColor: Colors.surface },
  text: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  detail: { fontSize: 14, color: Colors.textSecondary, marginTop: 2, fontFamily: Fonts.sans },
  resume: { fontSize: 14, fontWeight: '700', color: Colors.gold, fontFamily: Fonts.sans },
});
