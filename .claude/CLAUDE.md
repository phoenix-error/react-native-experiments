@AGENTS.md

## Agent skills

### Issue tracker

Issues live in Linear on the AppZudio team under the React Native Experiments project. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles use matching Linear labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Visual UI testing

Always verify UI/component changes on a booted iOS Simulator before finishing. A screenshot of first paint is not enough — exercise the changed screen.

- **Argent MCP** (`user-argent`): `list-devices` → boot if needed → `launch-app` with `app.lucabecker.react-native-experiments` → `describe` / `screenshot` / tap by label. After JS edits, `debugger-reload-metro`. Skills: `argent-react-native-app-workflow`, `argent-device-interact`.
- **serve-sim**: `.agents/skills/serve-sim/SKILL.md`. `npx serve-sim --detach -q`, then `npx serve-sim tap <x> <y>` (normalized 0..1). Metro mounts the preview at `/.sim` when Expo is running.

When the work touches theme, color, or layout, check **light and dark** via the in-app theme toggle. Full steps: AGENTS.md → UI verification.

### Theming

Import `useColorScheme` from `nativewind` — do not wrap or re-export it. Tokens: `src/lib/theme.ts` + `src/global.css`. Class merge: `cn` from `@/lib/utils`.

### Simulator preview

Stream and drive a booted iOS/iPad/watchOS Simulator with `serve-sim`. Metro mounts the preview at `/.sim` when you run `expo start`. See `.agents/skills/serve-sim/SKILL.md`.
