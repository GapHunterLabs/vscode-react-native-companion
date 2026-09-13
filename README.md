# React Native Companion

Run React Native commands (`run-android`, `run-ios`, Metro) from VS
Code without blocking the editor, plus a real Android/iOS device and
simulator picker and multi-environment `.env` profile support.

## Why it exists

Built from the same real-world evidence as its IntelliJ/WebStorm
sibling plugin: the leading paid React Native tooling in that
ecosystem has recent, severe, reproducible complaints about freezing
the IDE and needing thread dumps to recover, plus older reports of
buggy device/simulator integration. VS Code's integrated terminal
already runs shell commands off the extension host's event loop by
construction — this extension is a thin, reliable layer on top of
that, not a reimplementation of the React Native CLI.

## Usage

Open the **React Native** view in the Activity Bar, or use the Command
Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **React Native: Run Android** / **Run iOS** / **Start Metro** — runs
  the real `npx react-native` command in an integrated terminal.
- **Devices & Simulators** view — lists currently connected Android
  devices/emulators (`adb devices`) and iOS simulators (`xcrun simctl
  list devices`), parsed from their real output. Use the refresh icon
  in the view title to re-scan.
- **React Native: Select Environment Profile** — auto-discovers
  `.env*` files at your workspace root (the convention
  `react-native-config` reads) and sets `ENVFILE` for every command run
  from this extension until changed.
- **React Native: Build Android Release** / **Build iOS Release** —
  runs `react-native build-android --mode=release` /
  `build-ios --mode=Release`, respecting the selected environment
  profile.

## What this extension does not do

It does not wrap, parse, or modify React Native CLI output beyond the
device/simulator list — everything you run appears in a normal
integrated terminal exactly as if you'd typed it yourself. See
`PRIVACY.md` for exactly which local commands this extension runs and
when.

## Enterprise / Team Licensing

Need enterprise features or team licensing? Contact us at
**gaphunterlabs@gmail.com**.

## Development

```
npm install
npm test       # compiles and runs the unit test suite
```

## License

Apache-2.0. See `LICENSE`.
