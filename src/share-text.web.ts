import * as Clipboard from 'expo-clipboard';

/**
 * Web: use the browser's share sheet where it exists (iPhone/Android browsers),
 * otherwise (most desktop browsers) copy to the clipboard instead.
 */
export async function shareText(text: string): Promise<'shared' | 'copied' | 'dismissed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'dismissed';
      // Fall through to copying.
    }
  }
  await Clipboard.setStringAsync(text);
  return 'copied';
}
