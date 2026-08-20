// Labels + ordering for the nine orb states. State semantics and the
// particle geometry now live in the vendored engine (./engine); this file
// is just the presentation layer (display strings, sheet body copy, order).

import type { OrbState } from './engine';

export type { OrbState } from './engine';

export type OrbMeta = {
  /** Compact-pill / sheet title, e.g. "Composing…". */
  label: string;
  /** One-word engine mode description, for the chip caption. */
  hint: string;
};

// Labels mirror the upstream component (LABELS map in the RN port), with the
// two "Agent …" phrasings shown in Jakub's demo video preserved.
export const ORB_META: Record<OrbState, OrbMeta> = {
  working: { label: 'Working…', hint: 'orbits' },
  searching: { label: 'Searching…', hint: 'globe scan' },
  solving: { label: 'Solving…', hint: 'rubik bands' },
  listening: { label: 'Agent listening…', hint: 'waveform' },
  connecting: { label: 'Connecting…', hint: 'web' },
  weaving: { label: 'Agent weaving…', hint: 'braid' },
  composing: { label: 'Composing…', hint: 'ribbon' },
  breathing: { label: 'Thinking…', hint: 'ring' },
  shaping: { label: 'Agent shaping…', hint: 'morph' },
};

/** Body copy shown in the expanded bottom sheet (from the demo video). */
export const SHEET_BODY = 'Agent is processing your request. Please wait, it might take a few seconds.';

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
