import * as vscode from 'vscode';
import { DeviceTreeProvider } from './deviceTreeProvider';
import { discoverEnvProfiles } from './envProfileDiscovery';
import { run } from './reactNativeCommandRunner';
import { recordHit } from './reviewPrompt';

const NO_ENV_PROFILE = '(none)';

/**
 * Port of react-native-companion (IntelliJ/WebStorm plugin) to VS
 * Code. Same feature set, same rationale (see PRIVACY.md and README):
 * run React Native commands without blocking the editor, with a real
 * device/simulator picker and multi-environment `.env` profile
 * support via `ENVFILE`.
 *
 * State (which `.env` profile is currently selected) lives in
 * `workspaceState`, not `globalState` -- a profile choice is specific
 * to the project it was picked in, unlike the review-prompt hit count
 * in reviewPrompt.ts which is intentionally global.
 */

const KEY_SELECTED_ENV = 'reactNativeCompanion.selectedEnvProfile';

function currentWorkDirectory(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function selectedEnvFile(context: vscode.ExtensionContext): string | undefined {
  const selected = context.workspaceState.get<string>(KEY_SELECTED_ENV);
  return selected && selected !== NO_ENV_PROFILE ? selected : undefined;
}

function runAndRecord(context: vscode.ExtensionContext, args: string[]): void {
  const workDirectory = currentWorkDirectory();
  if (!workDirectory) {
    void vscode.window.showErrorMessage('React Native Companion: open a folder first.');
    return;
  }
  run(workDirectory, args, selectedEnvFile(context));
  // A real command was actually launched -- never fires for "no
  // workspace folder" above, which returns before reaching here.
  recordHit(context);
}

export function activate(context: vscode.ExtensionContext): void {
  const deviceTreeProvider = new DeviceTreeProvider();
  const treeView = vscode.window.createTreeView('reactNativeCompanion.devices', {
    treeDataProvider: deviceTreeProvider,
  });
  void deviceTreeProvider.refresh();

  const runAndroid = vscode.commands.registerCommand('reactNativeCompanion.runAndroid', () => {
    runAndRecord(context, ['run-android']);
  });

  const runIos = vscode.commands.registerCommand('reactNativeCompanion.runIos', () => {
    runAndRecord(context, ['run-ios']);
  });

  const startMetro = vscode.commands.registerCommand('reactNativeCompanion.startMetro', () => {
    runAndRecord(context, ['start']);
  });

  const buildAndroidRelease = vscode.commands.registerCommand(
    'reactNativeCompanion.buildAndroidRelease',
    () => {
      runAndRecord(context, ['build-android', '--mode=release']);
    },
  );

  const buildIosRelease = vscode.commands.registerCommand('reactNativeCompanion.buildIosRelease', () => {
    runAndRecord(context, ['build-ios', '--mode=Release']);
  });

  const refreshDevices = vscode.commands.registerCommand('reactNativeCompanion.refreshDevices', () => {
    void deviceTreeProvider.refresh();
  });

  const selectEnvProfile = vscode.commands.registerCommand(
    'reactNativeCompanion.selectEnvProfile',
    async () => {
      const workDirectory = currentWorkDirectory();
      if (!workDirectory) {
        void vscode.window.showErrorMessage('React Native Companion: open a folder first.');
        return;
      }
      const profiles = [NO_ENV_PROFILE, ...discoverEnvProfiles(workDirectory)];
      const picked = await vscode.window.showQuickPick(profiles, {
        placeHolder: 'Select an environment profile (sets ENVFILE)',
      });
      if (picked) {
        await context.workspaceState.update(KEY_SELECTED_ENV, picked);
      }
    },
  );

  context.subscriptions.push(
    treeView,
    runAndroid,
    runIos,
    startMetro,
    buildAndroidRelease,
    buildIosRelease,
    refreshDevices,
    selectEnvProfile,
  );
}

export function deactivate(): void {}
