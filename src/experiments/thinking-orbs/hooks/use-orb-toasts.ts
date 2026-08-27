import { useCallback, useState } from 'react';

import type { OrbState, OrbToast } from '../lib/orb-states';

const MAX_TOASTS = 4;

let seq = 0;
const nextId = () => `t${++seq}`;

export function useOrbToasts() {
  const [toasts, setToasts] = useState<OrbToast[]>(() => [
    { id: nextId(), state: 'composing' },
  ]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const push = useCallback((state: OrbState) => {
    setToasts(prev => [{ id: nextId(), state }, ...prev].slice(0, MAX_TOASTS));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
    setExpandedId(null);
  }, []);

  const collapse = useCallback(() => {
    setExpandedId(null);
  }, []);

  return {
    collapse,
    clear,
    expand: setExpandedId,
    expandedId,
    push,
    toasts,
  };
}
