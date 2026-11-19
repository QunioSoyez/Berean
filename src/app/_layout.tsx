import { Caveat_700Bold, useFonts } from '@expo-google-fonts/caveat';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { SettingsProvider } from '@/state/settings';

export default function RootLayout() {
  // Script heading font (Fonts.script). Not awaited: screens render right away with the
  // system font and switch to Caveat once it has loaded.
  useFonts({ Caveat_700Bold });

  return (
    <SettingsProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
    </SettingsProvider>
  );
}
