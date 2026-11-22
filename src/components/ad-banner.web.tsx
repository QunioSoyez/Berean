import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, type HostInstance } from 'react-native';

import { adsEnabled, CAN_AD_UNIT, CAN_SCRIPT_SRC } from '@/ads/config';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';

/**
 * A Christian Ad Network ad, labeled "Advertisement" so it's never mistaken for app content.
 * Builds their site tag (the <ins> block + script) inside this spot. The script is added again
 * each time a spot appears, because the site changes pages without reloading.
 * Renders nothing if CAN_AD_UNIT in src/ads/config.ts is empty.
 */
export function AdBanner() {
  const hostRef = useRef<HostInstance>(null);
  const enabled = adsEnabled();

  useEffect(() => {
    if (!enabled) return;
    const host = hostRef.current as unknown as HTMLElement | null;
    if (!host) return;
    const ins = document.createElement('ins');
    ins.className = 'CANBMDDisplayAD';
    ins.setAttribute('data-bmd-ad-unit', CAN_AD_UNIT);
    ins.style.display = 'block';
    host.appendChild(ins);
    const script = document.createElement('script');
    script.src = CAN_SCRIPT_SRC;
    host.appendChild(script); // ad blockers or a failed load: the space just stays empty
    return () => {
      host.innerHTML = '';
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <View style={styles.wrap} accessibilityLabel="Advertisement">
      <Text style={styles.label}>Advertisement</Text>
      <View ref={hostRef} style={styles.slot} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: MaxReadingWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  slot: { minHeight: 90 },
});
