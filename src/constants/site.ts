/** Who runs Berean and how to reach them (privacy policy, About, Support). */
export const PUBLISHER = 'Mission CTRL';
export const CONTACT_EMAIL = 'help@missionctrl.team';
export const SITE_URL = 'https://bereanbible.live';

/** Donation links (Support Berean page, menu, About). */
export const DONATE_LINKS = [
  { label: 'Ko-fi', url: 'https://ko-fi.com/bereanbible' },
  { label: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/bereanbible' },
] as const;

/** Date shown at the top of the privacy policy — update it whenever the policy changes. */
export const PRIVACY_UPDATED = 'November 21, 2026';

/**
 * Guestbook (website only). The Turnstile *site* key is public; the secret lives only in the
 * Worker (TURNSTILE_SECRET). Limits must match worker/index.ts.
 */
export const TURNSTILE_SITE_KEY = '0x4AAAAAAGLMGXzlGxCOUe4_';
export const GUESTBOOK_LIMITS = { name: 40, city: 60, note: 200 } as const;
