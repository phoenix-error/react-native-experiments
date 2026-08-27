# Vendored: thinking-orbs engine

The files in this directory are vendored **verbatim** (with only the canvas
painters removed, since this app renders with `react-native-svg`) from Jakub
Antalik's [`thinking-orbs`](https://github.com/Jakubantalik/thinking-orbs)
(`src/engine/*` + `src/presets.ts`), MIT-licensed — see
`LICENSE.thinking-orbs`.

Using the real engine (rather than re-implementing the geometry) is what makes
the orbs faithful to the reference by construction. `ParticleOrb.tsx` (one
level up) is the only original code here: it drives `MODE_FRAMES` from a single
`requestAnimationFrame` loop and paints each frame's dot/line list with SVG,
mirroring the threading model of the upstream React Native port (Skia, not SVG).

Local changes:

- `core.ts` — removed the `paint` / `paintLines` / `paintFrame` canvas
  functions (2D-canvas only); kept all pure geometry.
- `types.ts` — dropped the `ModeDraw` canvas painter type.
- `registry.ts` — kept only `MODE_FRAMES` (no canvas `MODE_DRAWS`).
- `orbTypes.ts` — new; the `OrbState` / `OrbSize` enums, split out from the
  upstream `src/types.ts` which also carried React/DOM prop types.
- import paths flattened (`../presets` → `./presets`, etc.).
