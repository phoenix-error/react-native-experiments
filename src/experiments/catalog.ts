import type { Experiment } from '@/experiments/shared/lib/experiment';

import { experiment as stub } from './stub/route';

/**
 * Finished experiments, newest first. The home feed renders this list.
 *
 * To add an experiment: create `src/experiments/<slug>/`, add a one-line
 * re-export in `src/app/(experiments)/<slug>.tsx`, and prepend it here.
 */
export const EXPERIMENTS: readonly Experiment[] = [stub];
