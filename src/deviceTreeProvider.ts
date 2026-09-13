import * as vscode from 'vscode';
import {
  isAndroidDeviceUsable,
  isIosSimulatorBooted,
  parseAdbDevices,
  parseSimctlDevices,
} from './deviceOutputParser';
import { runAdbDevices, runSimctlListDevices } from './reactNativeCommandRunner';

/**
 * Tree view equivalent of the IntelliJ sibling plugin's device combo
 * box + "Refresh Devices" button. Lists real, currently-usable Android
 * devices/emulators (`adb devices`, filtered to state "device", same
 * filter as `AndroidDevice.isUsable`) and iOS simulators (`xcrun
 * simctl list devices`) side by side. A failed/missing `adb` or
 * `xcrun` yields an empty section rather than an error, matching the
 * Kotlin side's `catch (e: Exception) { emptyList() }`.
 */
export class DeviceItem extends vscode.TreeItem {
  constructor(label: string, description?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
  }
}

export class DeviceTreeProvider implements vscode.TreeDataProvider<DeviceItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private items: DeviceItem[] = [];

  getTreeItem(element: DeviceItem): vscode.TreeItem {
    return element;
  }

  getChildren(): DeviceItem[] {
    if (this.items.length === 0) {
      return [new DeviceItem('No devices found', 'run Refresh Devices')];
    }
    return this.items;
  }

  async refresh(): Promise<void> {
    const androidItems = await runAdbDevices()
      .then((output) =>
        parseAdbDevices(output)
          .filter(isAndroidDeviceUsable)
          .map((device) => new DeviceItem(`Android: ${device.serial}`)),
      )
      .catch(() => [] as DeviceItem[]);

    const iosItems = await runSimctlListDevices()
      .then((output) =>
        parseSimctlDevices(output).map(
          (simulator) =>
            new DeviceItem(`iOS: ${simulator.name}`, isIosSimulatorBooted(simulator) ? 'Booted' : undefined),
        ),
      )
      .catch(() => [] as DeviceItem[]);

    this.items = [...androidItems, ...iosItems];
    this.onDidChangeTreeDataEmitter.fire();
  }
}
