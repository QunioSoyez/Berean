import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useSettings } from '@/state/settings';
import {
  backupFileName,
  describeMerge,
  makeBackup,
  parseBackup,
  summarizeBackup,
  type BackupFile,
  type BackupSettings,
  type BackupSummary,
} from '@/userdata/backup';
import { collectBackupData, restoreBackup } from '@/userdata/backup-store';

const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/** "12 bookmarks, 30 notes, 85 highlights" */
export function countsText(s: Pick<BackupSummary, 'bookmarks' | 'notes' | 'highlights'>): string {
  return `${plural(s.bookmarks, 'bookmark', 'bookmarks')}, ${plural(s.notes, 'note', 'notes')}, ${plural(s.highlights, 'highlight', 'highlights')}`;
}

/**
 * Builds the backup file and hands it to the browser as a download (Blob + temporary <a download>).
 * Returns what was saved, e.g. "berean-backup-2026-11-19.json (3 bookmarks, 2 notes, 10 highlights)".
 */
export async function downloadBackupFile(settings: BackupSettings): Promise<string> {
  const backup = makeBackup(await collectBackupData(settings));
  const name = backupFileName();
  const blob = new Blob([JSON.stringify(backup, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before freeing the file.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return `${name} (${countsText(summarizeBackup(backup))})`;
}

/** Opens the browser's file picker (hidden <input type="file">); resolves with the file's text, or null if cancelled. */
function pickBackupFile(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return resolve(null);
      file.text().then(resolve, reject);
    });
    input.addEventListener('cancel', () => {
      input.remove();
      resolve(null);
    });
    input.click();
  });
}

/**
 * Inline "Download a backup" link (for notices). Nest it inside a <Text>.
 * Shows "Backup downloaded ✓" for a few seconds afterwards.
 */
export function DownloadBackupLink({ style }: { style?: StyleProp<TextStyle> }) {
  const settings = useSettings();
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');

  const onPress = async () => {
    if (status === 'busy') return;
    setStatus('busy');
    try {
      await downloadBackupFile({
        textSize: settings.textSize,
        tutorialSeen: settings.tutorialSeen,
        dataNoticeSeen: settings.dataNoticeSeen,
      });
      setStatus('done');
    } catch {
      setStatus('failed');
    }
    setTimeout(() => setStatus('idle'), 4000);
  };

  const label =
    status === 'busy'
      ? 'Downloading…'
      : status === 'done'
        ? 'Backup downloaded ✓'
        : status === 'failed'
          ? 'Couldn’t download — try Settings → Your data'
          : 'Download a backup';
  return (
    <Text style={style} onPress={onPress} accessibilityRole="link">
      {label}
    </Text>
  );
}

type Message = { text: string; error: boolean };

/** Website only: Settings → Your data → "Download a backup" / "Restore from a backup". */
export function BackupControls() {
  const settings = useSettings();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  /** A checked backup waiting for Restore / Cancel. */
  const [pending, setPending] = useState<BackupFile | null>(null);

  const onDownload = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const what = await downloadBackupFile({
        textSize: settings.textSize,
        tutorialSeen: settings.tutorialSeen,
        dataNoticeSeen: settings.dataNoticeSeen,
      });
      setMessage({ text: `Downloaded ${what}. Keep it somewhere safe, like your Documents folder or cloud storage.`, error: false });
    } catch {
      setMessage({ text: 'Couldn’t make the backup file. Please try again.', error: true });
    } finally {
      setBusy(false);
    }
  };

  const onChooseFile = async () => {
    setMessage(null);
    setPending(null);
    try {
      const text = await pickBackupFile();
      if (text == null) return; // cancelled
      const result = parseBackup(text);
      if (result.ok) setPending(result.backup);
      else setMessage({ text: result.error, error: true });
    } catch {
      setMessage({ text: 'Couldn’t read that file. Nothing was restored.', error: true });
    }
  };

  const onRestore = async (backup: BackupFile) => {
    setPending(null);
    setBusy(true);
    try {
      const { plan, error } = await restoreBackup(backup);
      // Settings: text size comes from the backup; "seen" flags are only ever turned on.
      const s = backup.data.settings;
      if (s.textSize) settings.setTextSize(s.textSize);
      if (s.tutorialSeen) settings.setTutorialSeen(true);
      if (s.dataNoticeSeen) settings.setDataNoticeSeen(true);
      setMessage(error ? { text: error, error: true } : { text: `${describeMerge(plan)}.`, error: false });
    } catch {
      setMessage({ text: 'Couldn’t restore that backup. Nothing already here was changed.', error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.buttons}>
        <Pressable
          onPress={onDownload}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, (pressed || busy) && styles.pressed]}>
          <Text style={styles.primaryText}>Download a backup</Text>
        </Pressable>
        <Pressable
          onPress={onChooseFile}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondary, (pressed || busy) && styles.pressed]}>
          <Text style={styles.secondaryText}>Restore from a backup</Text>
        </Pressable>
      </View>

      {pending ? (
        <ConfirmRestore
          backup={pending}
          onRestore={onRestore}
          onCancel={() => setPending(null)}
        />
      ) : null}

      {busy ? <Text style={styles.note}>Working…</Text> : null}

      {message ? (
        <Text style={[styles.message, message.error && styles.error]} accessibilityRole="alert">
          {message.text}
        </Text>
      ) : null}
    </View>
  );
}

/** "This backup has 12 bookmarks, 30 notes, 85 highlights from Nov 19, 2026." + Restore / Cancel */
function ConfirmRestore({
  backup,
  onRestore,
  onCancel,
}: {
  backup: BackupFile;
  onRestore: (backup: BackupFile) => void;
  onCancel: () => void;
}) {
  const summary = summarizeBackup(backup);
  const when = summary.exportedAt
    ? ` from ${summary.exportedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '';
  return (
    <View style={styles.confirm} accessibilityRole="alert">
      <Text style={styles.confirmText}>
        <Text style={styles.bold}>This backup has {countsText(summary)}{when}.</Text> Restoring adds
        anything that isn’t already here. Nothing in this browser is deleted or changed, except the
        text size, which is set to the backup’s.
      </Text>
      <View style={styles.buttons}>
        <Pressable
          onPress={() => onRestore(backup)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Restore</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.three, gap: Spacing.two },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  primary: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
  },
  primaryText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', fontFamily: Fonts.sans },
  secondary: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.navy,
  },
  secondaryText: { fontSize: 15, fontWeight: '600', color: Colors.navy, fontFamily: Fonts.sans },
  confirm: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  confirmText: { fontSize: 14, lineHeight: 21, color: Colors.text, fontFamily: Fonts.sans },
  bold: { fontWeight: '700', color: Colors.navy },
  note: { fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.sans },
  message: { fontSize: 14, lineHeight: 21, color: Colors.navy, fontFamily: Fonts.sans },
  error: {
    color: Colors.danger,
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: Spacing.two,
  },
  pressed: { opacity: 0.6 },
});
