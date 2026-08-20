// Mode key → geometry builder. (Vendored + trimmed: upstream also builds a
// canvas `MODE_DRAWS` map; this app only needs the pure-geometry frames,
// which it renders with react-native-svg.)

import type { ModeKey } from './presets';
import type { ModeFrame } from './types';
import { frameBraid } from './braid';
import { frameGlobe, frameRubik, frameWave } from './lattice';
import { frameMorph } from './morph';
import { frameOrbits } from './orbits';
import { frameRibbon } from './ribbon';
import { frameWeb } from './web';

/**
 * The portable surface: pure geometry, no canvas. Identical to the geometry
 * the upstream web + React Native components use.
 */
export const MODE_FRAMES: Record<ModeKey, ModeFrame> = {
  orbits: frameOrbits,
  globe: frameGlobe,
  rubik: frameRubik,
  wave: frameWave,
  web: frameWeb,
  braid: frameBraid,
  ribbon: frameRibbon,
  // ring shares ribbon's geometry — the `faceOn` profile flag switches it
  ring: frameRibbon,
  morph: frameMorph,
};
