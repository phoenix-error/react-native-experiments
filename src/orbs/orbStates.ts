/**
 * Per-state config for the thinking orbs.
 * Faithful recreation of Jakub Antalik's "Thinking Orbs"
 * (orbs.jakubantalik.com): monochrome white particles on black,
 * each state a distinct *structured* form — not a random point cloud.
 */
export type OrbStructure =
  | 'globe' // dotted sphere built from latitude rings
  | 'bands' // vertical meridian lines sweeping around
  | 'constellation' // sparse drifting points
  | 'orbital' // tilted dashed rings
  | 'square'; // geometric outline (the "shaping" oddball)

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

export type OrbConfig = {
  label: string;
  structure: OrbStructure;
  density: number; // relative particle count (tuned per structure)
  spin: number; // base angular speed (rad/s)
  wobble: number; // radial breathing amount (0..1 of radius)
  jitter: number; // per-particle chaos
};

export const ORB_STATES: Record<OrbState, OrbConfig> = {
  working: {
    label: 'Working…',
    structure: 'constellation',
    density: 0.7,
    spin: 0.35,
    wobble: 0.18,
    jitter: 0.28,
  },
  searching: {
    label: 'Searching…',
    structure: 'globe',
    density: 1,
    spin: 0.6,
    wobble: 0.06,
    jitter: 0.02,
  },
  solving: {
    label: 'Solving…',
    structure: 'orbital',
    density: 0.9,
    spin: 1.5,
    wobble: 0.05,
    jitter: 0.03,
  },
  listening: {
    label: 'Agent listening…',
    structure: 'globe',
    density: 0.75,
    spin: 0.4,
    wobble: 0.28,
    jitter: 0.05,
  },
  connecting: {
    label: 'Connecting…',
    structure: 'bands',
    density: 0.85,
    spin: 0.7,
    wobble: 0.08,
    jitter: 0.04,
  },
  weaving: {
    label: 'Agent weaving…',
    structure: 'bands',
    density: 1.1,
    spin: 1,
    wobble: 0.12,
    jitter: 0.06,
  },
  composing: {
    label: 'Composing…',
    structure: 'bands',
    density: 0.9,
    spin: 0.55,
    wobble: 0.2,
    jitter: 0.05,
  },
  breathing: {
    label: 'Breathing…',
    structure: 'globe',
    density: 1,
    spin: 0.3,
    wobble: 0.42,
    jitter: 0.03,
  },
  shaping: {
    label: 'Agent shaping…',
    structure: 'square',
    density: 1,
    spin: 0.45,
    wobble: 0.1,
    jitter: 0.03,
  },
};

export const ORB_ORDER: OrbState[] = [
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping',
];
