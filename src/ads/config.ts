/**
 * Google AdSense settings — WEBSITE ONLY (the phone apps never show ads).
 *
 * Ads stay switched off until ADSENSE_CLIENT and AD_SLOT are both filled in. After AdSense approves
 * bereanbible.live:
 *   1. Publisher ID below — done (site verified with the meta tag in public/index.html).
 *   2. Create one "Display" ad unit in AdSense and put its slot number in AD_SLOT.
 *   3. public/ads.txt — done. Keep AdSense Auto ads OFF (they would place ads in the reader).
 *
 * Ads are only placed on pages like Home, Search, Bookmarks and Notes — never in the reader,
 * next to Bible text or study notes.
 */
export const ADSENSE_CLIENT = 'ca-pub-8809349846108777';
export const AD_SLOT = ''; // e.g. '1234567890' — ads stay off until this is filled in

/** Non-personalized ads only (no interest-based targeting), as stated in the privacy policy. */
export const NON_PERSONALIZED = true;

export const adsEnabled = () => !!ADSENSE_CLIENT && !!AD_SLOT;
