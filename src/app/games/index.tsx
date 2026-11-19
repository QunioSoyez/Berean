import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from '@/components/ad-banner';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';

type Game = { title: string; description: string; href?: Href };

/** Games list. Games without an href show as "Coming soon". */
const GAMES: Game[] = [
  {
    title: 'Bible Story Quiz',
    description: 'Ten questions on the people and stories of the Bible, each linked to its verse.',
    href: '/games/quiz',
  },
  { title: 'Word Search', description: 'Find hidden names and places from a Bible story.' },
  { title: 'Word Scramble', description: 'Unscramble the letters to spell a Bible word.' },
  { title: 'Story Scramble', description: 'Put the events of a Bible story back in order.' },
];

export default function GamesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Games" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <Text style={styles.title}>Play & learn</Text>
          <Text style={styles.lead}>Test what you know and discover something new in the Scriptures.</Text>

          {GAMES.map((g) => {
            const ready = !!g.href;
            return (
              <Pressable
                key={g.title}
                onPress={() => g.href && router.push(g.href)}
                disabled={!ready}
                accessibilityRole="button"
                accessibilityState={{ disabled: !ready }}
                style={({ pressed, hovered }) => [
                  styles.card,
                  ready && (pressed || hovered) && styles.cardActive,
                  !ready && styles.cardSoon,
                ]}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{g.title}</Text>
                  {ready ? (
                    <Text style={styles.play}>Play ›</Text>
                  ) : (
                    <Text style={styles.soon}>Coming soon</Text>
                  )}
                </View>
                <Text style={styles.cardText}>{g.description}</Text>
              </Pressable>
            );
          })}
        </View>
        {/* Website only; renders nothing in the phone apps or until AdSense is set up. */}
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.six },
  column: { width: '100%', maxWidth: MaxReadingWidth, alignSelf: 'center', padding: Spacing.three },
  title: {
    fontFamily: Fonts.script,
    fontSize: 40,
    color: Colors.navy,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  lead: {
    fontSize: 17,
    lineHeight: 25,
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    fontFamily: Fonts.sans,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.two,
  },
  cardActive: { backgroundColor: Colors.surface, borderColor: Colors.navy },
  cardSoon: { opacity: 0.55 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  cardText: { fontSize: 15, lineHeight: 22, color: Colors.textSecondary, marginTop: 4, fontFamily: Fonts.sans },
  play: { fontSize: 15, fontWeight: '700', color: Colors.gold, fontFamily: Fonts.sans },
  soon: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, fontFamily: Fonts.sans },
});
