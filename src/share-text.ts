import { Share } from 'react-native';

/** Phones: open the system share sheet. Returns 'shared' (or 'dismissed'). */
export async function shareText(text: string): Promise<'shared' | 'copied' | 'dismissed'> {
  const result = await Share.share({ message: text });
  return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
}
