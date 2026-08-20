import type { ReactNode } from 'react';

/**
 * The contract every showcase module implements.
 *
 * A module is a self-contained experiment: it owns its components, its state
 * and its preview, and exposes them through this one object. The home feed
 * renders whatever the registry lists — adding an experiment means writing a
 * module and appending it to `src/modules/registry.ts`, nothing else.
 */
export type ShowcaseModule = {
  /** Stable id, also used as the detail route param. */
  id: string;
  /** Small label above the title, e.g. "Thinking orbs". */
  brand: string;
  /** Optional accent tag, e.g. "new drop". */
  badge?: string;
  /** Card headline. */
  title: string;
  /** One-liner shown on the detail screen. */
  description?: string;
  /** Live icon for the card header (rendered, not an image asset). */
  icon: ReactNode;
  /** Live preview mounted inside the phone mockup on the home feed. */
  preview: ReactNode;
  /** Full-screen interactive version, shown on the detail route. */
  detail?: ReactNode;
};
