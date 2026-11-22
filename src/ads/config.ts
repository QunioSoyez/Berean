/**
 * Christian Ad Network (CleanMedia) settings — WEBSITE ONLY (the phone apps never show ads).
 *
 * The site tag from Christian Ad Network is one <ins class="CANBMDDisplayAD"> block plus their
 * script. src/components/ad-banner.web.tsx builds that tag inside each ad spot.
 * public/ads.txt holds the ads.txt file they supplied (replace it whole if they send a new one).
 *
 * Ads are only placed on pages like Home, Search, Bookmarks, Notes and Games — never in the
 * reader, next to Bible text or study notes. Set CAN_AD_UNIT to '' to switch all ads off.
 */
export const CAN_AD_UNIT = '1381246620261121T145219347A9640C22BFF446E4AD55A91CE5B349D0';
export const CAN_SCRIPT_SRC = 'https://secureaddisplay.com/au/bmd/';

export const adsEnabled = () => !!CAN_AD_UNIT;
