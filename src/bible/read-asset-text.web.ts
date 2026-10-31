/** Web: assets are plain files served next to the app, so fetch them. */
export async function readAssetText(uri: string): Promise<string> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Could not load ${uri} (${res.status})`);
  return res.text();
}
