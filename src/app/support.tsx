import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Heading, InfoPage, Para } from '@/components/info-page';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { CONTACT_EMAIL, DONATE_LINKS, PUBLISHER } from '@/constants/site';

/** "Support Berean": donation links. */
export default function SupportScreen() {
  return (
    <InfoPage title="Support Berean">
      <Para>
        Berean is free, with no accounts and nothing to unlock. It’s made by {PUBLISHER} to help
        people search the Scriptures daily (Acts 17:11). If it has blessed you, a gift helps cover
        hosting and keeps new features coming.
      </Para>

      <View style={styles.buttons}>
        {DONATE_LINKS.map((d) => (
          <Pressable
            key={d.url}
            onPress={() => Linking.openURL(d.url)}
            accessibilityRole="link"
            accessibilityLabel={`Support Berean on ${d.label}`}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>Give with {d.label}</Text>
          </Pressable>
        ))}
      </View>

      <Para small>Gifts are handled by Ko-fi or Buy Me a Coffee on their own websites.</Para>

      <Heading>Other ways to help</Heading>
      <Para>
        Pray for the project, tell a friend, or send ideas and bug reports to{' '}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
          accessibilityRole="link">
          {CONTACT_EMAIL}
        </Text>
        .
      </Para>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: Spacing.two, marginVertical: Spacing.three },
  button: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    backgroundColor: Colors.navy,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: Fonts.sans },
  link: { color: Colors.navy, textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
});
