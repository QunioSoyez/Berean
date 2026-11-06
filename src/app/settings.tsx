import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Heading, InfoPage, Para } from '@/components/info-page';
import { Tutorial } from '@/components/tutorial';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { TEXT_SIZES, useFontScale, useSettings } from '@/state/settings';

/** Settings: text size and the tutorial. Saved on this device only. */
export default function SettingsScreen() {
  const settings = useSettings();
  const fs = useFontScale();
  const [tutorialOpen, setTutorialOpen] = useState(false);

  return (
    <InfoPage title="Settings">
      <Heading>Text size</Heading>
      <Para small>Changes the Bible text, your notes and the commentary.</Para>
      <View style={styles.sizes} accessibilityRole="radiogroup" accessibilityLabel="Text size">
        {TEXT_SIZES.map((s) => {
          const selected = s.id === settings.textSize;
          return (
            <Pressable
              key={s.id}
              onPress={() => settings.setTextSize(s.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={s.label}
              style={({ pressed }) => [styles.size, selected && styles.sizeSelected, pressed && styles.pressed]}>
              <Text
                style={[styles.sizeSample, { fontSize: Math.round(18 * s.scale) }, selected && styles.selectedText]}>
                Aa
              </Text>
              <Text style={[styles.sizeLabel, selected && styles.selectedText]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Live preview at the chosen size, styled like the reader. */}
      <View style={styles.preview} accessibilityLabel="Preview">
        <View style={styles.previewRow}>
          <Text style={[styles.previewNumber, fs(12)]}>16</Text>
          <Text style={[styles.previewText, fs(19, 30)]}>
            For God so loved the world, that he gave his only begotten Son, that whosoever believeth in
            him should not perish, but have everlasting life.
          </Text>
        </View>
        <Text style={styles.previewRef}>John 3:16 (KJV)</Text>
      </View>

      <Heading>Tutorial</Heading>
      <Para small>A quick tour of selecting, highlighting, bookmarks, notes and commentary.</Para>
      <Pressable
        onPress={() => setTutorialOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Show the tutorial again</Text>
      </Pressable>

      {settings.saveFailed && (
        <Text style={styles.warning} accessibilityRole="alert">
          Couldn’t save your settings on this device. They’ll apply until you close Berean.
        </Text>
      )}

      <Para small>Settings are saved on this device only.</Para>

      <Tutorial
        visible={tutorialOpen}
        onClose={() => {
          setTutorialOpen(false);
          settings.setTutorialSeen(true);
        }}
      />
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  size: {
    flexGrow: 1,
    flexBasis: 72,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    minHeight: 72,
    gap: 2,
  },
  sizeSelected: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  sizeSample: { fontWeight: '600', color: Colors.navy, fontFamily: Fonts.serif },
  sizeLabel: { fontSize: 13, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  selectedText: { color: '#FFFFFF' },
  preview: {
    marginTop: Spacing.three,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  previewRow: { flexDirection: 'row', gap: Spacing.two },
  previewNumber: { paddingTop: 6, fontWeight: '600', color: Colors.gold, fontFamily: Fonts.sans },
  previewText: { flex: 1, color: Colors.text, fontFamily: Fonts.serif },
  previewRef: { fontSize: 13, color: Colors.textSecondary, textAlign: 'right', fontFamily: Fonts.sans },
  button: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.navy,
    marginBottom: Spacing.three,
  },
  buttonText: { fontSize: 15, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  warning: {
    color: Colors.danger,
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: Spacing.two,
    marginBottom: Spacing.two,
    fontFamily: Fonts.sans,
  },
  pressed: { opacity: 0.6 },
});
