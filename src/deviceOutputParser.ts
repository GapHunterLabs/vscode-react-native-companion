/**
 * Port of DeviceOutputParser.kt from the IntelliJ/WebStorm sibling
 * plugin (react-native-companion). Parses the real, unmodified output
 * of `adb devices` and `xcrun simctl list devices` -- the same
 * commands the incumbent (React Native Console, JetBrains Marketplace)
 * wraps, whose reviews report a device/simulator picker "full of
 * bugs". Kept as pure text parsing (no process execution here) so
 * it's testable without a real adb/Xcode install.
 */

export interface AndroidDevice {
  serial: string;
  state: string;
}

export function isAndroidDeviceUsable(device: AndroidDevice): boolean {
  return device.state === 'device';
}

export interface IosSimulator {
  udid: string;
  name: string;
  state: string;
}

export function isIosSimulatorBooted(simulator: IosSimulator): boolean {
  return simulator.state === 'Booted';
}

/**
 * `adb devices` output looks like:
 * ```
 * List of devices attached
 * emulator-5554	device
 * R58M12ABCDE	unauthorized
 * ```
 */
export function parseAdbDevices(output: string): AndroidDevice[] {
  const lines = output.split(/\r?\n/);
  const devices: AndroidDevice[] = [];
  // drop(1): skip the "List of devices attached" header line.
  for (const rawLine of lines.slice(1)) {
    const parts = rawLine.trim().split(/\s+/);
    if (parts.length < 2 || parts[0] === '') {
      continue;
    }
    devices.push({ serial: parts[0], state: parts[1] });
  }
  return devices;
}

/**
 * `xcrun simctl list devices` output looks like:
 * ```
 * == Devices ==
 * -- iOS 17.0 --
 *     iPhone 15 (12345678-1234-1234-1234-123456789012) (Shutdown)
 *     iPhone 15 Pro (87654321-4321-4321-4321-210987654321) (Booted)
 * -- tvOS 17.0 --
 *     Apple TV (ABCDEF12-3456-7890-ABCD-EF1234567890) (Shutdown)
 * ```
 * Section headers (`== ... ==`, `-- ... --`) don't match the device
 * line shape and are skipped naturally rather than special-cased.
 */
const SIMCTL_DEVICE_LINE = /^\s*(.+?)\s+\(([0-9A-Fa-f-]{36})\)\s+\((\w+)\)\s*$/;

export function parseSimctlDevices(output: string): IosSimulator[] {
  const simulators: IosSimulator[] = [];
  for (const line of output.split(/\r?\n/)) {
    const match = SIMCTL_DEVICE_LINE.exec(line);
    if (match) {
      simulators.push({ name: match[1], udid: match[2], state: match[3] });
    }
  }
  return simulators;
}
