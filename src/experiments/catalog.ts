import type { Experiment } from '@/experiments/shared/lib/experiment';

import { experiment as stub } from './stub/route';
import { experiment as thinkingOrbs } from './thinking-orbs/route';

/**
 * Finished experiments, newest first. The home feed renders this list.
 *
 * To add an experiment: create `src/experiments/<slug>/`, add a one-line
 * re-export in `src/app/(experiments)/<slug>.tsx`, and prepend it here.
 */
export const EXPERIMENTS: readonly Experiment[] = [thinkingOrbs, stub];
