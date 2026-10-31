import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { getLastPosition, type Position } from '@/state/last-position';

/** App entry: reopen the last chapter the reader was on. */
export default function Index() {
  const [pos, setPos] = useState<Position | null>(null);

  useEffect(() => {
    getLastPosition().then(setPos);
  }, []);

  if (!pos) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.navy} />
      </View>
    );
  }

  return (
    <Redirect
      href={{
        pathname: '/read/[version]/[book]/[chapter]',
        params: { version: pos.version, book: pos.book, chapter: String(pos.chapter) },
      }}
    />
  );
}
