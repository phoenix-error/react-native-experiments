# react-native-experiments

Small Expo / React Native UI experiments.

## 1. Dynamic Island — Thinking Orbs

A recreation of the iPhone **Dynamic Island** with animated particle "thinking
orbs", inspired by [Jakub Antalik's Thinking Orbs](https://orbs.jakubantalik.com/)
([tweet](https://x.com/Jakubantalik/status/2089385766715605172)).

- A black pill that springs between **compact** and **expanded** layouts.
- Particle orbs rendered with `react-native-svg`, animated on a single
  Reanimated frame clock (fake-3D depth → per-particle size & opacity).
- Six states, each with its own palette / motion: `working`, `searching`,
  `solving`, `listening`, `composing`, `shaping`.
- Playground controls: switch state, scrub speed (0.5× / 1× / 2×), toggle
  expand/collapse, auto-cycle, plus a big standalone orb.

### Run it

```bash
npm install
npx expo start          # then press i (iOS) / a (Android), or scan in Expo Go
```

### Structure

```
App.tsx                     # GestureHandlerRootView + demo
src/orbs/
  orbStates.ts              # per-state config (colors, particle count, motion)
  ParticleOrb.tsx           # SVG particle system on a Reanimated frame clock
  DynamicIsland.tsx         # springy compact <-> expanded black pill
  OrbIslandDemo.tsx         # playground screen with controls
```

### Stack

Expo SDK 57 · React Native 0.86 · react-native-reanimated 4 ·
react-native-svg · TypeScript.
