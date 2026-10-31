import { File } from 'expo-file-system';

/** Native: read a downloaded asset straight from the device's file system. */
export async function readAssetText(localUri: string): Promise<string> {
  return new File(localUri).text();
}
