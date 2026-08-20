# react-native-experiments

Small Expo / React Native UI experiments.

## 1. Dynamic Island — Thinking Orbs

A recreation of the bottom "Dynamic Island" interaction from
[Jakub Antalik's Thinking Orbs](https://orbs.jakubantalik.com/)
([tweet](https://x.com/Jakubantalik/status/2089385766715605172)): a compact
status pill anchored at the **bottom** of the screen that springs **upward
into a bottom sheet** — a rounded card with a grabber, a large animated orb, a
title, and a line of body copy.

The orbs themselves are rendered by Jakub's **actual `thinking-orbs` engine**,
vendored into `src/orbs/engine/` (MIT — see the attribution there) and painted
with `react-native-svg` instead of a 2D canvas. Using the real geometry means
the nine states match the reference by construction:

| State | Engine mode | Look |
| --- | --- | --- |
| working | orbits | particles on tilted orbits |
| searching | globe | a scan meridian sweeps a dotted globe |
| solving | rubik | bands scramble in quarter turns, then click back |
| listening | wave | a waveform rolls through latitude rings |
| connecting | web | a constellation wires itself (dots + line segments) |
| weaving | braid | three strands plait around the sphere |
| composing | ribbon | an undulating multi-band sash |
| breathing | ring | a face-on ring slowly morphing |
| shaping | morph | a dotted outline: circle → triangle → square |

### Run it

```bash
npm install
npx expo start          # press i (iOS) / a (Android), or scan in Expo Go
# or render in a browser via React Native Web:
npx expo export --platform web && (cd dist && python3 -m http.server 8091)
```

### Structure

```
App.tsx                     # GestureHandlerRootView + demo
src/orbs/
  engine/                   # vendored thinking-orbs geometry (MIT, Jakub Antalik)
  ParticleOrb.tsx           # drives the engine from one rAF loop, paints via SVG
  DynamicIsland.tsx         # bottom pill <-> bottom-sheet spring
  OrbIslandDemo.tsx         # playground: state / speed / open / auto-cycle
  orbStates.ts              # labels, sheet body copy, ordering
```

### Rendering model

`ParticleOrb` runs a single `requestAnimationFrame` loop on the JS thread that
builds one engine frame per tick, flattens it into a shared buffer, and lets
each SVG node read only its own slot in a worklet — O(N) per frame, mirroring
the threading of the upstream RN port (the engine geometry is intentionally
not worklet-ized).

### Stack

Expo SDK 57 · React Native 0.86 · react-native-reanimated 4 ·
react-native-svg · TypeScript. Verified via React Native Web in a headless
browser; device-true motion/feel still wants a real simulator.
