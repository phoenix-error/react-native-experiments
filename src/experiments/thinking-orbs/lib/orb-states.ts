import type { OrbState } from './engine';

export type { OrbState } from './engine';

export type OrbMeta = {
  /** Compact-pill / sheet title, e.g. "Composing…". */
  label: string;
  /** One-word engine mode description, for the chip caption. */
  hint: string;
};

export type OrbToast = { id: string; state: OrbState };

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

/** Body copy shown in the expanded bottom sheet. */
export const SHEET_BODY =
  'Agent is processing your request. Please wait, it might take a few seconds.';

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

/** Compact grid label: drop the ellipsis and a leading "Agent ". */
export function orbCellLabel(state: OrbState): string {
  return ORB_META[state].label.replace('…', '').replace('Agent ', '');
}
