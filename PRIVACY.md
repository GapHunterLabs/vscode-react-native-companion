# Privacy Policy — React Native Companion

**Effective date:** 2026-09-13

React Native Companion is a Gap Hunter Labs extension for Visual Studio Code.

## What this extension collects

**Nothing.** React Native Companion does not collect, store, transmit, or sell any
data — no source code, no file contents, no usage analytics, no
telemetry, no crash reports, no personally identifiable information.

## Local processes this extension runs

Unlike most Gap Hunter Labs companions, this extension's entire purpose
is to launch local command-line tools on your machine, in a regular VS
Code integrated terminal, so you can see and control exactly what runs:

- `npx react-native run-android` / `run-ios` / `start` / `build-android`
  / `build-ios` — only when you click **Run Android**, **Run iOS**,
  **Start Metro**, or a **Build Release** button.
- `adb devices` and `xcrun simctl list devices` — only when you open or
  refresh the Devices & Simulators view, to list what's already
  connected on your machine.

All of these run locally as regular child processes, exactly as if you
had typed the command yourself. The extension does not modify, wrap, or
intercept what these tools do.

## Network access

**None initiated by this extension.** React Native Companion itself
makes zero network calls. The `.env*` file it reads to set `ENVFILE`
(the convention used by `react-native-config`) is read from disk, not
sent anywhere. Whatever network activity `npx`, `react-native`, `adb`,
or `xcrun` themselves perform (e.g. `npx` resolving a package, an
emulator syncing) is those tools' own behavior, not this extension's.

## Third parties

None. React Native Companion has no third-party SDKs, no analytics
libraries, no ad networks, no external dependencies that phone home.
The only runtime dependency is the `vscode` extension API itself.

## Changes to this policy

If this ever changes, this file will be updated and the change will be
noted in the extension's `CHANGELOG.md`.

## Contact

Questions about this policy: **gaphunterlabs@gmail.com**
