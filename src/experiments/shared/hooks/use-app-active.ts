import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const sub = AppState.addEventListener('change', s =>
      setActive(s !== 'background'),
    );
    return () => sub.remove();
  }, []);
  return active;
}
