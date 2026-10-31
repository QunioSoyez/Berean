import { router, type Href } from 'expo-router';

/** Return to the landing screen, popping anything stacked on top of it. */
export function goHome() {
  if (router.canDismiss()) router.dismissAll();
  else router.replace('/');
}

/**
 * Link to a chapter. `verses` (optional) scrolls to and briefly marks those verses;
 * `openNotes` also opens the notes panel for them.
 */
export function chapterHref(
  version: string,
  book: string,
  chapter: number,
  verses?: number[],
  openNotes?: boolean,
): Href {
  return {
    pathname: '/read/[version]/[book]/[chapter]',
    params: {
      version,
      book,
      chapter: String(chapter),
      ...(verses?.length ? { v: verses.join(',') } : {}),
      ...(verses?.length && openNotes ? { notes: '1' } : {}),
    },
  };
}

/** Back if there is somewhere to go back to (e.g. opened from a menu), otherwise home. */
export function goBackOrHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
