import '@/global.css';

import { Platform } from 'react-native';

/**
 * Berean palette. Reading surfaces are plain black on white; the logo's navy and
 * gold are used sparingly for chrome and accents.
 */
export const Colors = {
  text: '#000000',
  textSecondary: '#5B6170',
  background: '#FFFFFF',
  surface: '#F5F6F8',
  border: '#E3E5EA',
  navy: '#0B2A66',
  gold: '#C98A1B', // darker than the logo gold so it stays readable on white
  goldLight: '#F3C969',
  danger: '#B42318',
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif' },
  web: { sans: 'var(--font-sans)', serif: 'var(--font-serif)' },
  default: { sans: 'normal', serif: 'serif' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Reading column width on wide screens (web/tablet). */
export const MaxReadingWidth = 720;
