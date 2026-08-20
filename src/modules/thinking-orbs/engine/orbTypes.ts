// Orb state + size types, decoupled from React/DOM so the vendored engine
// runs under React Native. (Upstream these live in src/types.ts alongside
// the web component's React props; we only need the two enums.)

export type OrbState =
  | 'working'
  | 'searching'
  | 'solving'
  | 'listening'
  | 'connecting'
  | 'weaving'
  | 'composing'
  | 'breathing'
  | 'shaping';

/** The two tuned size presets the engine ships. */
export type OrbSize = 64 | 20;
