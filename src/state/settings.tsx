import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * App settings, saved on this device (phones: app storage, web: this browser).
 * They don't sync between devices.
 */
export type TextSize = 'small' | 'medium' | 'large' | 'xlarge';

export const TEXT_SIZES: { id: TextSize; label: string; scale: number }[] = [
  { id: 'small', label: 'Small', scale: 0.88 },
  { id: 'medium', label: 'Medium', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.15 },
  { id: 'xlarge', label: 'Extra large', scale: 1.32 },
];

type Settings = { textSize: TextSize; tutorialSeen: boolean };

const KEY = 'berean.settings.v1';
const DEFAULTS: Settings = { textSize: 'medium', tutorialSeen: false };

type ContextValue = Settings & {
  /** False until saved settings have been read (avoids flashing the tutorial). */
  loaded: boolean;
  /** Set when the last change couldn't be saved; it still applies until the app closes. */
  saveFailed: boolean;
  setTextSize: (size: TextSize) => void;
  setTutorialSeen: (seen: boolean) => void;
};

const SettingsContext = createContext<ContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Settings>;
        setSettings({
          textSize: TEXT_SIZES.some((s) => s.id === saved.textSize) ? saved.textSize! : DEFAULTS.textSize,
          tutorialSeen: saved.tutorialSeen === true,
        });
      })
      .catch(() => {}) // unreadable → defaults
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next))
        .then(() => setSaveFailed(false))
        .catch(() => setSaveFailed(true));
      return next;
    });
  }, []);

  const value = useMemo<ContextValue>(
    () => ({
      ...settings,
      loaded,
      saveFailed,
      setTextSize: (textSize) => update({ textSize }),
      setTutorialSeen: (tutorialSeen) => update({ tutorialSeen }),
    }),
    [settings, loaded, saveFailed, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): ContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}

/**
 * Text-size helper for reading text (Bible, notes, commentary):
 *   const fs = useFontScale();  <Text style={[styles.text, fs(19, 30)]} />
 * returns { fontSize, lineHeight } scaled to the chosen text size.
 */
export function useFontScale() {
  const { textSize } = useSettings();
  const scale = TEXT_SIZES.find((s) => s.id === textSize)?.scale ?? 1;
  return useCallback(
    (fontSize: number, lineHeight?: number) =>
      lineHeight == null
        ? { fontSize: Math.round(fontSize * scale) }
        : { fontSize: Math.round(fontSize * scale), lineHeight: Math.round(lineHeight * scale) },
    [scale],
  );
}

/** The raw multiplier, for sizes that aren't fonts (e.g. the verse-number column). */
export function useTextScale(): number {
  const { textSize } = useSettings();
  return TEXT_SIZES.find((s) => s.id === textSize)?.scale ?? 1;
}
