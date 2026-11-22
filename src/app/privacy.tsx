import { Linking, StyleSheet, Text } from 'react-native';

import { Heading, InfoPage, Para } from '@/components/info-page';
import { Colors } from '@/constants/theme';
import { CONTACT_EMAIL, PRIVACY_UPDATED, PUBLISHER, SITE_URL } from '@/constants/site';

function Link({ url, children }: { url: string; children: string }) {
  return (
    <Text style={styles.link} onPress={() => Linking.openURL(url)} accessibilityRole="link">
      {children}
    </Text>
  );
}

/** Privacy policy (expected by ad networks for the website, and good practice for the apps). */
export default function PrivacyScreen() {
  return (
    <InfoPage title="Privacy policy">
      <Para small>Last updated: {PRIVACY_UPDATED}</Para>
      <Para>
        Berean is a Bible study app and website ({SITE_URL.replace('https://', '')}) run by{' '}
        {PUBLISHER}. This policy explains what happens to information when you use it. In short: we
        don’t have accounts, we don’t collect your personal study data, and the website shows
        ads to help cover its costs.
      </Para>

      <Heading>Your highlights, bookmarks and notes</Heading>
      <Para>
        Everything you create in Berean — highlights, bookmarks, notes and tags, your last reading
        position and display settings — is stored only on your device (in the app, or in your web
        browser’s storage on the website). It is never sent to us or anyone else. We can’t see it,
        and we can’t recover it for you. Uninstalling the app or clearing your browser’s site data
        deletes it.
      </Para>

      <Heading>No accounts and no analytics</Heading>
      <Para>
        Berean has no sign-in and no user accounts. We don’t use analytics or tracking tools to
        follow how you use the app.
      </Para>

      <Heading>Content downloaded from our website</Heading>
      <Para>
        Bible text and Matthew Henry’s commentary are built into the app. When you open the NTBT
        study notes, the app downloads that chapter’s notes from {SITE_URL.replace('https://', '')}.
        Like any website, our hosting provider (Cloudflare) processes standard technical information
        such as your IP address and browser type to deliver pages and protect the site from abuse.
        We don’t use this information to identify you.
      </Para>

      <Heading>Advertising (website only)</Heading>
      <Para>
        The Berean website shows ads provided by Christian Ad Network, which reviews the ads it
        serves so they are appropriate for a Christian audience. The phone apps do not show ads. Ads
        appear only on pages such as Home, Search, Bookmarks, Notes and Games — never alongside the
        Bible text or study notes — and are labeled “Advertisement”.
      </Para>
      <Para>
        The ad network and its advertising partners may use cookies or similar technologies to show
        ads, limit how often you see the same ad, measure ads and prevent fraud. We don’t share your
        highlights, bookmarks, notes or other study data with them — that data never leaves your
        device. You can block or clear cookies in your browser settings.
      </Para>

      <Heading>Guestbook (website only)</Heading>
      <Para>
        If you sign the guestbook, we store the name, city and note you enter, plus the time you
        signed. Entries are reviewed before they appear, and approved entries are shown publicly on
        the guestbook page. Please don’t include anything you wouldn’t want to be public. To have
        your entry removed, email us.
      </Para>
      <Para>
        To block spam, the form uses Cloudflare Turnstile, a bot check that doesn’t use tracking or
        advertising cookies (see{' '}
        <Link url="https://www.cloudflare.com/turnstile-privacy-policy/">
          Cloudflare’s Turnstile privacy addendum
        </Link>
        ). We also limit how many times a day someone can sign by keeping a scrambled (hashed) form of
        your IP address. We never store the actual address, and the scrambled record is deleted
        after one day.
      </Para>

      <Heading>Donations</Heading>
      <Para>
        If you choose to support Berean through Ko-fi or Buy Me a Coffee, that happens on their
        websites and is covered by their privacy policies. We receive only what those services share
        with creators (such as your name and message, if you include them).
      </Para>

      <Heading>Links to other websites</Heading>
      <Para>
        Berean links to other sites, such as the NTBT publisher (BibliaTodo). Their privacy practices
        are their own.
      </Para>

      <Heading>Children</Heading>
      <Para>
        Apart from what someone chooses to write in the guestbook, Berean doesn’t collect personal
        information from anyone. The guestbook is not meant for children under 13. If we learn that a
        child under 13 has signed it, we’ll delete the entry.
      </Para>

      <Heading>Changes</Heading>
      <Para>
        If this policy changes, we’ll update this page and the date at the top.
      </Para>

      <Heading>Contact</Heading>
      <Para>
        Questions about privacy? Email{' '}
        <Link url={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
      </Para>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  link: { color: Colors.navy, textDecorationLine: 'underline' },
});
