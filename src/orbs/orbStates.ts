/**
 * Per-state visual config for the thinking orbs.
 * Inspired by Jakub Antalik's "Thinking Orbs" (orbs.jakubantalik.com).
 */
export type OrbState =
  | 'working'
  | 'searching'
  | 'solving'
  | 'listening'
  | 'composing'
  | 'shaping';

export type OrbConfig = {
  label: string;
  colors: [string, string]; // gradient stops for the particles
  particleCount: number;
  spin: number; // base angular speed (rad/s)
  wobble: number; // radial breathing amount (0..1 of radius)
  jitter: number; // per-particle chaos
};

export const ORB_STATES: Record<OrbState, OrbConfig> = {
  working: {
    label: 'Working…',
    colors: ['#7CE0FF', '#3D8BFF'],
    particleCount: 26,
    spin: 1.1,
    wobble: 0.14,
    jitter: 0.1,
  },
  searching: {
    label: 'Searching…',
    colors: ['#A98BFF', '#5B6BFF'],
    particleCount: 22,
    spin: 0.7,
    wobble: 0.32,
    jitter: 0.18,
  },
  solving: {
    label: 'Solving…',
    colors: ['#FFE08A', '#FF9F45'],
    particleCount: 30,
    spin: 1.6,
    wobble: 0.1,
    jitter: 0.06,
  },
  listening: {
    label: 'Agent listening…',
    colors: ['#8BFFD1', '#31C48D'],
    particleCount: 20,
    spin: 0.5,
    wobble: 0.4,
    jitter: 0.05,
  },
  composing: {
    label: 'Composing…',
    colors: ['#FFA9D6', '#FF5DA2'],
    particleCount: 24,
    spin: 0.9,
    wobble: 0.22,
    jitter: 0.14,
  },
  shaping: {
    label: 'Agent shaping…',
    colors: ['#C4B5FD', '#8B5CF6'],
    particleCount: 28,
    spin: 1.2,
    wobble: 0.26,
    jitter: 0.22,
  },
};

export const ORB_ORDER: OrbState[] = [
  'working',
  'searching',
  'solving',
  'listening',
  'composing',
  'shaping',
];
