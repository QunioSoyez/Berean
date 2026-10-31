import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Spacing } from '@/constants/theme';

type Props = {
  /** When provided, the menu shows a "Bible version" item that calls this. */
  onChangeVersion?: () => void;
};

type Item = { label: string; onPress: () => void };

/** Hamburger button (top right) that opens a small dropdown menu. */
export function AppMenu({ onChangeVersion }: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const nav = (href: Href) => () => {
    setOpen(false);
    router.push(href);
  };

  const items: Item[] = [
    ...(onChangeVersion
      ? [
          {
            label: 'Bible version',
            onPress: () => {
              setOpen(false);
              onChangeVersion();
            },
          },
        ]
      : []),
    { label: 'Search', onPress: nav('/search') },
    { label: 'Bookmarks', onPress: nav('/bookmarks') },
    { label: 'Settings', onPress: nav('/settings') },
    { label: 'About & credits', onPress: nav('/about') },
    { label: 'License', onPress: nav('/license') },
  ];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Menu"
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close menu">
          <View style={[styles.menu, { marginTop: insets.top + 52, marginRight: insets.right + Spacing.three }]}>
            {items.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                accessibilityRole="menuitem"
                style={({ pressed }) => [
                  styles.item,
                  i > 0 && styles.itemBorder,
                  pressed && styles.itemPressed,
                ]}>
                <Text style={styles.itemText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
  },
  bar: { width: 20, height: 2, borderRadius: 1, backgroundColor: Colors.navy },
  pressed: { opacity: 0.6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'flex-end' },
  menu: {
    minWidth: 220,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  item: { paddingHorizontal: Spacing.three, paddingVertical: 14 },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  itemPressed: { backgroundColor: Colors.surface },
  itemText: { fontSize: 16, color: Colors.text, fontFamily: Fonts.sans },
});
