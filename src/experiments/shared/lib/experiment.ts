import type { Href } from 'expo-router';
import type { ReactNode } from 'react';

/**
 * The surface every experiment presents to the host app.
 *
 * The home feed and Expo route files only know this object. Screens, hooks,
 * and components stay inside the experiment folder.
 */
export interface Experiment {
  /** Matches the Expo file name: `stub` → `/stub`. */
  slug: string;
  /** Typed path used by the home feed. */
  href: Href;
  /** Small label above the title, e.g. "Stub". */
  brand: string;
  /** Optional accent tag, e.g. "template". */
  badge?: string;
  /** Card headline. */
  title: string;
  /** Live icon for the card header. */
  icon: ReactNode;
  /** Live preview mounted inside the phone mockup on the home feed. */
  preview: ReactNode;
}
