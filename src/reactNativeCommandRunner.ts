import { execFile } from 'child_process';
import * as vscode from 'vscode';

/**
 * Port of ReactNativeCommandRunner.kt. The IntelliJ sibling plugin
 * exists to fix a real, reproducible complaint against the leading
 * paid alternative (React Native Console, JetBrains Marketplace,
 * 2026-04 ★1 review): "severely impacting IDE performance...
 * frequently becomes unresponsive... thread dumps are required" --
 * caused by running the CLI process synchronously on the UI thread.
 *
 * VS Code's `vscode.window.createTerminal` + `sendText` runs the
 * command in its own pty/process, off the extension host's event
 * loop, by construction -- the same category of fix as
 * `OSProcessHandler` on the IntelliJ side. There is no blocking
 * equivalent to avoid here; using the integrated terminal instead of
 * `child_process.exec` + waiting on its result on the extension host
 * is the fix, not an optimization.
 */

const TERMINAL_NAME = 'React Native Device Companion';

let sharedTerminal: vscode.Terminal | undefined;

function getOrCreateTerminal(workDirectory: string): vscode.Terminal {
  if (sharedTerminal && sharedTerminal.exitStatus === undefined) {
    return sharedTerminal;
  }
  sharedTerminal = vscode.window.createTerminal({
    name: TERMINAL_NAME,
    cwd: workDirectory,
  });
  return sharedTerminal;
}

vscode.window.onDidCloseTerminal((closed) => {
  if (closed === sharedTerminal) {
    sharedTerminal = undefined;
  }
});

// `sendText` runs inside the terminal's own shell (cmd/PowerShell on
// Windows, sh-family elsewhere), which already resolves `npx` via
// PATH the same way a typed command would -- unlike GeneralCommandLine
// on the IntelliJ side, which spawns a process directly and therefore
// needs the `.cmd` shim spelled out explicitly on Windows.
const npxExecutable = 'npx';

/**
 * [envFile], when provided, is set as the ENVFILE environment variable
 * before running -- the real mechanism react-native-config reads to
 * pick a `.env.<profile>` file, not an extension-invented one. Since
 * `sendText` runs in a shell, ENVFILE is set as a one-off prefix on
 * the same command line rather than mutating the terminal's persistent
 * environment (which VS Code does not expose for an already-created
 * terminal).
 */
export function run(workDirectory: string, args: string[], envFile?: string): vscode.Terminal {
  const terminal = getOrCreateTerminal(workDirectory);
  const command = [npxExecutable, 'react-native', ...args].join(' ');
  const prefixedCommand =
    envFile !== undefined
      ? process.platform === 'win32'
        ? `set "ENVFILE=${envFile}" && ${command}`
        : `ENVFILE=${envFile} ${command}`
      : command;
  terminal.show();
  terminal.sendText(prefixedCommand);
  return terminal;
}

const EXEC_TIMEOUT_MS = 5_000;

/**
 * Equivalent of CapturingProcessHandler on the IntelliJ side: runs a
 * short-lived command to completion and returns its stdout, capped by
 * a timeout so a missing `adb`/`xcrun` install can't hang the device
 * list. Rejects on any failure (not found, non-zero exit, timeout) --
 * callers treat that the same way the Kotlin side treats its `catch
 * (e: Exception) { emptyList() }`.
 */
function execCapture(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: EXEC_TIMEOUT_MS }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

export function runAdbDevices(): Promise<string> {
  return execCapture('adb', ['devices']);
}

export function runSimctlListDevices(): Promise<string> {
  return execCapture('xcrun', ['simctl', 'list', 'devices']);
}
