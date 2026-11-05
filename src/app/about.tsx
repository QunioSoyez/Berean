import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { NTBT_EDITION } from '@/bible/ntbt.generated';
import { VERSIONS } from '@/bible/versions';
import { Heading, InfoPage, Para } from '@/components/info-page';
import { Colors, Spacing } from '@/constants/theme';

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
      {VERSIONS.filter((v) => !v.creditUrl).map((v) => (
        <Para key={v.id}>
          {v.name} ({v.abbr}
          {v.year ? `, ${v.year}` : ''}) — {v.copyright} Source: {v.source}.
        </Para>
      ))}
      <Para small>
        The King James Version is public domain everywhere except the United Kingdom, where it is
        under Crown patent.
      </Para>

      <Heading>Nueva Traducción BibliaTodo (NTBT)</Heading>
      <Para>
        Santa Biblia, Nueva Traducción BibliaTodo (NTBT). Publicada por{' '}
        <Text style={styles.link} onPress={() => Linking.openURL(NTBT_URL)} accessibilityRole="link">
          BibliaTodo Bible Society
        </Text>
        , sello editorial de BibliaTodo LLC.{' '}
        <Text style={styles.link} onPress={() => Linking.openURL(NTBT_URL)} accessibilityRole="link">
          https://www.bibliatodo.com/ntbt/
        </Text>
      </Para>
      <Para small>
        Texto español NTBT © 2026 BibliaTodo LLC, en lo relativo a sus aportaciones propias. Includes
        the NTBT study edition (book introductions and study notes). Used with permission under the
        free NTBT licence. Edition {NTBT_EDITION}.
      </Para>
      <Para small>
        Textual bases consulted by the NTBT: Westminster Leningrad Codex (WLC) with Open Scriptures
        Hebrew Bible (OSHB, CC BY 4.0); SBL Greek New Testament © 2010 Society of Biblical Literature
        and Logos Bible Software (CC BY 4.0). These acknowledgments come from the NTBT credits; they
        do not mean those organizations publish or endorse the translation.
      </Para>

      <Heading>Commentary</Heading>
      <Para>
        Matthew Henry’s Concise Commentary on the Whole Bible — public domain. Source: the CrossWire
        Bible Society’s SWORD module “MHCC” (from the Christian Classics Ethereal Library text).
      </Para>

      <Heading>Built with</Heading>
      <Para>Expo, React Native and Expo Router — open-source software under the MIT License.</Para>
    </InfoPage>
  );
}

const NTBT_URL = 'https://www.bibliatodo.com/ntbt/';

const styles = StyleSheet.create({
  link: { color: Colors.navy, textDecorationLine: 'underline' },
  logoWrap: { alignItems: 'center', marginVertical: Spacing.three },
  logo: { width: 140, height: 140 },
});
