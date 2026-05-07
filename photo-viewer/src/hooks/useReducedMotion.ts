/**
 * useReducedMotion — react to the `prefers-reduced-motion` media query.
 *
 * Constitution V mandates we honor this preference (slideshow uses instant
 * cuts, viewer skips zoom/pan transitions, etc.).
 */

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const get = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(QUERY).matches;

  const [reduced, setReduced] = useState<boolean>(get);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);

    if ('addEventListener' in mql) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    // Legacy Safari fallback
    // @ts-expect-error -- old API
    mql.addListener(handler);
    return () => {
      // @ts-expect-error -- old API
      mql.removeListener(handler);
    };
  }, []);

  return reduced;
}
