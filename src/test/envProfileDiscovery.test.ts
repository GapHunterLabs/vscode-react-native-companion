import * as assert from 'assert';
import * as fs from 'fs';
import { test } from 'node:test';
import * as os from 'os';
import * as path from 'path';
import { discoverEnvProfiles } from '../envProfileDiscovery';

function withTempDir(run: (dir: string) => void): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'react-native-companion-test-'));
  try {
    run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('finds env files at the project root sorted by name', () => {
  withTempDir((dir) => {
    fs.writeFileSync(path.join(dir, '.env.staging'), 'API_URL=https://staging.acme-corp.com');
    fs.writeFileSync(path.join(dir, '.env'), 'API_URL=https://dev.acme-corp.com');
    fs.writeFileSync(path.join(dir, '.env.production'), 'API_URL=https://api.acme-corp.com');
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');

    const profiles = discoverEnvProfiles(dir);

    assert.deepStrictEqual(profiles, ['.env', '.env.production', '.env.staging']);
  });
});

test('a project with no env files returns an empty list, not a crash', () => {
  withTempDir((dir) => {
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');
    assert.deepStrictEqual(discoverEnvProfiles(dir), []);
  });
});

test('a nonexistent directory returns an empty list, not a crash', () => {
  withTempDir((dir) => {
    assert.deepStrictEqual(discoverEnvProfiles(path.join(dir, 'does-not-exist')), []);
  });
});

test('subdirectories starting with .env are not treated as files', () => {
  withTempDir((dir) => {
    fs.mkdirSync(path.join(dir, '.env.local'));
    assert.deepStrictEqual(discoverEnvProfiles(dir), []);
  });
});
