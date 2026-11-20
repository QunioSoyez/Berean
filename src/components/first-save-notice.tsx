import { router } from 'expo-router';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  /** Called on "Got it", "Learn more" or closing the dialog. */
  onClose: () => void;
};

/**
 * Website only: shown once, the first time someone saves a bookmark or note, to explain
 * that it's kept in this browser and clearing browsing data erases it.
 */
export function FirstSaveNotice({ visible, onClose }: Props) {
  if (Platform.OS !== 'web') return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          <View style={styles.accent} />
          <Text style={styles.title} accessibilityRole="header">
            Saved in this browser
          </Text>
          <Text style={styles.body}>
            Your highlights, bookmarks and notes are kept in this browser, on this device only.
            Clearing your browsing data, or using a private or incognito window, will erase them.
            There’s no backup yet, so keep that in mind before clearing your browser.
          </Text>
          <View style={styles.buttons}>
            <Pressable
              onPress={() => {
                onClose();
                router.push({ pathname: '/help', params: { section: 'your-data' } });
              }}
              accessibilityRole="link"
              hitSlop={8}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
              <Text style={styles.secondaryText}>Learn more</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
              <Text style={styles.primaryText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.four,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.gold,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: Spacing.two,
    fontFamily: Fonts.serif,
  },
  body: { fontSize: 16, lineHeight: 24, color: Colors.text, fontFamily: Fonts.sans },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  secondary: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 999 },
  secondaryText: { fontSize: 15, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  primary: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    backgroundColor: Colors.navy,
  },
  primaryText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', fontFamily: Fonts.sans },
  pressed: { opacity: 0.6 },
});
