import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, type HostInstance } from 'react-native';

import { AD_SLOT, ADSENSE_CLIENT, adsEnabled, NON_PERSONALIZED } from '@/ads/config';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';

type AdsQueue = Record<string, unknown>[] & { requestNonPersonalizedAds?: number };
declare global {
  interface Window {
    adsbygoogle?: AdsQueue;
  }
}

let scriptAdded = false;

/** Loads the AdSense script once, the first time an ad is shown. */
function ensureScript() {
  if (scriptAdded || typeof document === 'undefined') return;
  scriptAdded = true;
  const queue: AdsQueue = (window.adsbygoogle = window.adsbygoogle || []);
  if (NON_PERSONALIZED) queue.requestNonPersonalizedAds = 1;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(s);
}

/**
 * A responsive Google ad, labeled "Advertisement" so it's never mistaken for app content.
 * Renders nothing until src/ads/config.ts is filled in.
 */
export function AdBanner() {
  const hostRef = useRef<HostInstance>(null);
  const enabled = adsEnabled();

  useEffect(() => {
    if (!enabled) return;
    const host = hostRef.current as unknown as HTMLElement | null;
    if (!host) return;
    ensureScript();
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', ADSENSE_CLIENT);
    ins.setAttribute('data-ad-slot', AD_SLOT);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    host.appendChild(ins);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers or a failed load: just leave the space empty.
    }
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
