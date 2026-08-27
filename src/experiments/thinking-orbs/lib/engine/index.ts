// The `engine` entry point: pure geometry, zero React, zero DOM.
// Vendored from Jakub Antalik's thinking-orbs (github.com/Jakubantalik/
// thinking-orbs, MIT) — the SAME geometry code the upstream web + React
// Native components run, so the orbs are faithful by construction rather
// than re-implemented by hand.
//
//   const { mode, speed, opts } = resolvePreset('searching', 64);
//   const { dots, lines } = MODE_FRAMES[mode](64, elapsedSeconds * speed, opts);
//
// Ink convention: `white` is the paper-theme ink value in [0,1]; on a dark
// substrate a renderer mirrors it (1 - white) so near dots read bright.

export { MODE_FRAMES } from './registry';
export {
  resolvePreset,
  STATE_TO_MODE,
  type ModeKey,
  type Resolved,
} from './presets';
export type { Dot, Line, OrbFrame, ModeFrame } from './types';
export type { ModeOpts } from './profiles';
export type { OrbState, OrbSize } from './orbTypes';
export { finalizeFrame, radiusScale, makeProj } from './core';
