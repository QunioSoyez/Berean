import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { VERSIONS } from '@/bible/versions';
import { Colors, Fonts, Spacing } from '@/constants/theme';

import { Sheet } from './sheet';

type Props = {
  visible: boolean;
  current: string;
  onClose: () => void;
  onSelect: (version: string) => void;
};

export function VersionPicker({ visible, current, onClose, onSelect }: Props) {
  return (
    <Sheet visible={visible} title="Versions" onClose={onClose}>
      <ScrollView>
        {VERSIONS.map((v) => {
          const selected = v.id === current;
          return (
            <Pressable
              key={v.id}
              onPress={() => onSelect(v.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${v.name}${selected ? ', selected' : ''}`}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={[styles.badge, selected && styles.badgeSelected]}>
                <Text style={[styles.abbr, selected && styles.abbrSelected]}>{v.abbr}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{v.name}</Text>
                {v.year ? <Text style={styles.year}>{v.year}</Text> : null}
              </View>
              {selected && <Text style={styles.check}>✓</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  badge: {
    minWidth: 52,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  badgeSelected: { backgroundColor: Colors.navy },
  abbr: { fontSize: 14, fontWeight: '700', color: Colors.navy, fontFamily: Fonts.sans },
  abbrSelected: { color: '#FFFFFF' },
  info: { flex: 1 },
  name: { fontSize: 17, color: Colors.text, fontFamily: Fonts.sans },
  year: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, fontFamily: Fonts.sans },
  check: { fontSize: 18, color: Colors.gold, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
