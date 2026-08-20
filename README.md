# react-native-experiments

A showcase app for small React Native / Expo UI experiments — a feed of cards,
each rendering its component **live** inside a phone mockup.

## Architecture

The showcase is the main app; every experiment is a self-contained module.

```
src/
  app/                       # Expo Router routes only
    _layout.tsx              #   stack: feed + detail
    index.tsx                #   renders <Home />
    module/[id].tsx          #   per-module detail screen
  screens/home.tsx           # the feed
  components/
    showcase-card.tsx        # card: icon + brand + title + preview panel
    phone-frame.tsx          # cropped iPhone mockup
  modules/
    types.ts                 # the ShowcaseModule contract
    registry.ts              # every finished module, newest first
    thinking-orbs/           # module 1 (self-contained)
      engine/                #   vendored thinking-orbs engine (MIT)
      ParticleOrb.tsx
      DynamicIsland.tsx
      orbStates.ts
      showcase.tsx           #   exports its ShowcaseModule
```

### Adding an experiment

1. Build it under `src/modules/<name>/`.
2. Export a `ShowcaseModule` from its `showcase.tsx` (icon, preview, optional
   full-screen `detail`).
3. Prepend it to `MODULES` in `src/modules/registry.ts`.

The feed and detail routes pick it up automatically.

## Modules

### 1. Thinking orbs — Dynamic Island bottom sheet

A bottom status pill that springs up into a sheet, with nine dotted
particle-orb states. Recreated from [Jakub Antalik's Thinking Orbs](https://orbs.jakubantalik.com/);
the orb geometry is his real engine, vendored under
`src/modules/thinking-orbs/engine/` (MIT — attribution there).

## Run

```bash
bun install
bunx expo start            # press i / a, or scan
bunx expo run:ios          # native dev-client build
bunx expo export --platform web   # RN Web build (headless preview)
```

## Stack

Expo SDK 57 · Expo Router · React Native 0.86 · Reanimated 4 ·
react-native-svg · TypeScript · bun.
