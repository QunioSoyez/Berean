import { Linking, StyleSheet, Text } from 'react-native';

import { Para } from '@/components/info-page';
import { Colors } from '@/constants/theme';
import { SITE_URL } from '@/constants/site';

/** In the apps the guestbook just points to the website (the real one is guestbook.web.tsx). */
export function Guestbook() {
  return (
    <Para>
      The guestbook lives on the Berean website:{' '}
      <Text
        style={styles.link}
        onPress={() => Linking.openURL(`${SITE_URL}/guestbook`)}
        accessibilityRole="link">
        {SITE_URL.replace('https://', '')}/guestbook
      </Text>
    </Para>
  );
}

const styles = StyleSheet.create({
  link: { color: Colors.navy, textDecorationLine: 'underline' },
});
