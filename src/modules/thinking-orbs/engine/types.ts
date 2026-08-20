// Engine-level contracts shared by every mode implementation.
// (Vendored + trimmed: the canvas `ModeDraw` painter type from upstream is
// dropped — this app renders frames with react-native-svg, not a 2D canvas.)

import type { ModeOpts } from './profiles';

export type { Dot, Line, OrbFrame } from './core';

import type { OrbFrame } from './core';

/**
 * Geometry for one instant: pure math over (size, t, opts), no rendering
 * surface and no theme — `dark` only affects ink at paint time.
 */
export type ModeFrame = (size: number, t: number, opts: ModeOpts) => OrbFrame;
