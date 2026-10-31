import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { VERSIONS } from '@/bible/versions';
import { Heading, InfoPage, Para } from '@/components/info-page';
import { Spacing } from '@/constants/theme';

export default function AboutScreen() {
  const appVersion = Constants.expoConfig?.version ?? '';

  return (
    <InfoPage title="About & credits">
      <View style={styles.logoWrap}>
        <Image
          source={require('@/assets/images/logo-full.png')}
          style={styles.logo}
          accessibilityLabel="Berean logo"
        />
      </View>
      <Para>
        Berean is a Bible study app for reading and comparing translations, with your own
        highlights, bookmarks and notes.
      </Para>
      <Para small>
        “Now these were more noble than those in Thessalonica, in that they received the word with
        all readiness of mind, and searched the scriptures daily, whether those things were so.” —
        Acts 17:11 (KJV)
      </Para>
      {appVersion ? <Para small>Version {appVersion}</Para> : null}

      <Heading>Your privacy</Heading>
      <Para>
        No account, no tracking, no analytics. Everything you save stays on this device.
      </Para>

      <Heading>Bible texts</Heading>
      {VERSIONS.map((v) => (
        <Para key={v.id}>
          {v.name} ({v.abbr}
          {v.year ? `, ${v.year}` : ''}) — {v.copyright} Source: {v.source}.
        </Para>
      ))}
      <Para small>
        The King James Version is public domain everywhere except the United Kingdom, where it is
        under Crown patent.
      </Para>

      <Heading>Built with</Heading>
      <Para>Expo, React Native and Expo Router — open-source software under the MIT License.</Para>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: 'center', marginVertical: Spacing.three },
  logo: { width: 140, height: 140 },
});
