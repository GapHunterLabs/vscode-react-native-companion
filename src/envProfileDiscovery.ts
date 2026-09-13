import * as fs from 'fs';

/**
 * Port of EnvProfileDiscovery.kt. Finds `.env*` files at the project
 * root -- the real convention `react-native-config` uses for
 * multi-environment profiles (`.env`, `.env.development`,
 * `.env.staging`, `.env.production`, ...), not an invented format.
 * Returns bare file names (not full paths): `ENVFILE` is set relative
 * to the working directory the react-native CLI process already runs
 * in, matching how react-native-config itself expects it
 * (`ENVFILE=.env.staging npx react-native run-android`).
 *
 * Pure and file-IO-only, no VS Code API dependency -- testable against
 * a real temp directory without booting the editor.
 */
export function discoverEnvProfiles(workDirectory: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(workDirectory, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.startsWith('.env'))
    .map((entry) => entry.name)
    .sort();
}
