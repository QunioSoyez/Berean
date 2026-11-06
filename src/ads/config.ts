/**
 * Google AdSense settings — WEBSITE ONLY (the phone apps never show ads).
 *
 * Ads stay switched off until ADSENSE_CLIENT is filled in. After AdSense approves
 * bereanbible.live:
 *   1. Put your publisher ID below, e.g. 'ca-pub-1234567890123456'.
 *   2. Create one "Display" ad unit in AdSense and put its slot number in AD_SLOT.
 *   3. Put the ads.txt line AdSense gives you in public/ads.txt.
 *
 * Ads are only placed on pages like Home, Search, Bookmarks and Notes — never in the reader,
 * next to Bible text or study notes.
 */
export const ADSENSE_CLIENT = ''; // e.g. 'ca-pub-1234567890123456'
export const AD_SLOT = ''; // e.g. '1234567890'

/** Non-personalized ads only (no interest-based targeting), as stated in the privacy policy. */
export const NON_PERSONALIZED = true;

export const adsEnabled = () => !!ADSENSE_CLIENT && !!AD_SLOT;
