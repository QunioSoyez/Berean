import { router } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { DownloadBackupLink } from '@/components/backup-controls';
import { Colors, Fonts, MaxReadingWidth, Spacing } from '@/constants/theme';

type Props = {
  /** Show a "Learn more" link to the help page's data section (off on the help page itself). */
  helpLink?: boolean;
  /** Already inside a padded column (e.g. the help page): skip the outer width/padding. */
  inline?: boolean;
  /** Show a "Download a backup" link (off in Settings, which has the backup buttons). */
  backupLink?: boolean;
};

/**
 * Website only: user data lives in this browser's storage, so clearing browsing data
 * (or a private/incognito window) erases it. Renders nothing in the phone apps.
 */
export function WebDataNotice({ helpLink = true, inline = false, backupLink = true }: Props) {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={inline ? styles.inline : styles.outer}>
      <View style={styles.box} accessibilityRole="summary">
        <Text style={styles.text}>
          <Text style={styles.bold}>Saved in this browser only. </Text>
          Clearing your browsing data, or using a private or incognito window, erases your
          highlights, bookmarks and notes. Download a backup now and then to keep them safe.
          {backupLink ? (
            <>
              {' '}
              <DownloadBackupLink style={styles.link} />
            </>
          ) : null}
          {backupLink && helpLink ? ' · ' : null}
          {helpLink && !backupLink ? ' ' : null}
          {helpLink ? (
            <>
              <Text
                style={styles.link}
                onPress={() => router.push({ pathname: '/help', params: { section: 'your-data' } })}
                accessibilityRole="link">
                Learn more
              </Text>
            </>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    maxWidth: MaxReadingWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  inline: { marginBottom: Spacing.three },
  box: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  text: { fontSize: 14, lineHeight: 21, color: Colors.text, fontFamily: Fonts.sans },
  bold: { fontWeight: '700', color: Colors.navy },
  link: { fontWeight: '600', color: Colors.navy, textDecorationLine: 'underline' },
});
