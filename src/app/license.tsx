import { Linking, StyleSheet, Text } from 'react-native';

import { Heading, InfoPage, Para } from '@/components/info-page';
import { Colors } from '@/constants/theme';

const MISSION_CTRL_URL = 'https://missionctrl.team';

// Keep in sync with the LICENSE file at the repo root.
const MIT = [
  'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
  'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
];

export default function LicenseScreen() {
  return (
    <InfoPage title="License">
      <Heading>Berean app — MIT License</Heading>
      <Para>
        Copyright (c) 2026{' '}
        <Text style={styles.link} onPress={() => Linking.openURL(MISSION_CTRL_URL)} accessibilityRole="link">
          Mission CTRL
        </Text>
      </Para>
      {MIT.map((p, i) => (
        <Para key={i} small={i === MIT.length - 1}>
          {p}
        </Para>
      ))}

      <Heading>Bible texts</Heading>
      <Para>
        The Bible texts are not covered by the license above. KJV, WEB, ASV and YLT are in the public
        domain. The Nueva Traducción BibliaTodo (NTBT) and its study notes are © BibliaTodo LLC and
        are included with permission under the free NTBT licence, which requires their wording to be
        kept exactly and their attribution shown. See About & credits for sources.
      </Para>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  link: { color: Colors.navy, textDecorationLine: 'underline' },
});
