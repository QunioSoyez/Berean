import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Full-height picker sheet used for the book and version pickers. */
export function Sheet({ visible, title, onClose, children }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Text style={styles.closeText}>Done</Text>
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, width: '100%', maxWidth: MaxReadingWidth, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  close: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  closeText: { fontSize: 16, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  pressed: { opacity: 0.6 },
  body: { flex: 1 },
});
