import * as assert from 'assert';
import { test } from 'node:test';
import {
  isAndroidDeviceUsable,
  isIosSimulatorBooted,
  parseAdbDevices,
  parseSimctlDevices,
} from '../deviceOutputParser';

test('parses multiple adb devices', () => {
  const output = ['List of devices attached', 'emulator-5554\tdevice', 'R58M12ABCDE\tunauthorized'].join('\n');

  const devices = parseAdbDevices(output);

  assert.strictEqual(devices.length, 2);
  assert.deepStrictEqual(devices[0], { serial: 'emulator-5554', state: 'device' });
  assert.deepStrictEqual(devices[1], { serial: 'R58M12ABCDE', state: 'unauthorized' });
  assert.strictEqual(isAndroidDeviceUsable(devices[0]), true);
  assert.strictEqual(isAndroidDeviceUsable(devices[1]), false);
});

test('empty adb output yields no devices', () => {
  const devices = parseAdbDevices('List of devices attached\n');
  assert.strictEqual(devices.length, 0);
});

test('adb output with only header yields no devices', () => {
  const devices = parseAdbDevices('List of devices attached');
  assert.strictEqual(devices.length, 0);
});

test('parses multiple simctl devices across sections', () => {
  const output = [
    '== Devices ==',
    '-- iOS 17.0 --',
    '    iPhone 15 (12345678-1234-1234-1234-123456789012) (Shutdown)',
    '    iPhone 15 Pro (87654321-4321-4321-4321-210987654321) (Booted)',
    '-- tvOS 17.0 --',
    '    Apple TV (ABCDEF12-3456-7890-ABCD-EF1234567890) (Shutdown)',
  ].join('\n');

  const devices = parseSimctlDevices(output);

  assert.strictEqual(devices.length, 3);
  assert.deepStrictEqual(devices[0], {
    udid: '12345678-1234-1234-1234-123456789012',
    name: 'iPhone 15',
    state: 'Shutdown',
  });
  assert.deepStrictEqual(devices[1], {
    udid: '87654321-4321-4321-4321-210987654321',
    name: 'iPhone 15 Pro',
    state: 'Booted',
  });
  assert.strictEqual(isIosSimulatorBooted(devices[0]), false);
  assert.strictEqual(isIosSimulatorBooted(devices[1]), true);
  assert.strictEqual(devices[2].name, 'Apple TV');
});

test('simctl section headers are not mistaken for devices', () => {
  const devices = parseSimctlDevices('== Devices ==\n-- iOS 17.0 --\n-- tvOS 17.0 --');
  assert.strictEqual(devices.length, 0);
});

test('simctl output with no devices yields empty list', () => {
  const devices = parseSimctlDevices('');
  assert.strictEqual(devices.length, 0);
});

test('device names with spaces and internal parens are parsed correctly', () => {
  const output =
    '-- iOS 17.0 --\n    iPad Pro (12.9-inch) (5th generation) (12345678-1234-1234-1234-123456789012) (Booted)';
  const devices = parseSimctlDevices(output);

  assert.strictEqual(devices.length, 1);
  assert.strictEqual(devices[0].name, 'iPad Pro (12.9-inch) (5th generation)');
});
