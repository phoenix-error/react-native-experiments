import type { ShowcaseModule } from './types';
import { thinkingOrbsModule } from './thinking-orbs/showcase';

/**
 * Every finished showcase module, newest first.
 *
 * To add an experiment: build it under `src/modules/<name>/`, export a
 * `ShowcaseModule` from its `showcase.tsx`, and prepend it here. The home
 * feed and the detail routes pick it up automatically.
 */
export const MODULES: ShowcaseModule[] = [thinkingOrbsModule];

export function getModule(id: string): ShowcaseModule | undefined {
  return MODULES.find((m) => m.id === id);
}

export type { ShowcaseModule } from './types';
