import type { BackupData, BackupFile, BackupSettings, MergePlan } from './backup';

/**
 * Phone apps: backup/restore isn't built yet (website only for now — see backup-store.web.ts).
 * The backup buttons are hidden in the apps, so these are never called.
 */
export const BACKUP_SUPPORTED = false;

export type RestoreResult = { plan: MergePlan; error: string | null };

export async function collectBackupData(_settings: BackupSettings): Promise<BackupData> {
  throw new Error('Backups are only available on the website for now.');
}

export async function restoreBackup(_backup: BackupFile): Promise<RestoreResult> {
  throw new Error('Backups are only available on the website for now.');
}
