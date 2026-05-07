/**
 * useSlideshow — runs a `SlideshowSession` against a `Collection`.
 *
 * - Uses `setTimeout` for advance scheduling (sufficient for 1–60 s intervals).
 * - Pause preserves the *remaining* time of the current interval; resume
 *   re-arms with that remainder.
 * - Skips photos whose `loadStatus === 'error'` (spec edge case).
 * - When `prefers-reduced-motion: reduce` is set, transitions are instant
 *   cuts (Constitution V) — the hook itself just emits index changes; the
 *   viewer chooses how to animate.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Collection } from '../models/Collection';
import {
  DEFAULT_INTERVAL_SECONDS,
  type SlideshowSession,
  advance,
  clampInterval,
  createSlideshowSession,
  jumpTo,
  pause as pauseSession,
  resume as resumeSession,
  setInterval as setSessionInterval,
  start as startSession,
  stop as stopSession,
} from '../models/SlideshowSession';

export interface UseSlideshowOptions {
  collection: Collection | null;
  /** Index the user was on when entering slideshow mode. */
  startIndex: number;
  /** Called whenever the session advances; the viewer uses this to switch photos. */
  onIndexChange?: (index: number) => void;
  /** Called when the slideshow stops, with the resume index. */
  onStop?: (resumeIndex: number) => void;
}

export interface UseSlideshowResult {
  session: SlideshowSession | null;
  isRunning: boolean;
  isPaused: boolean;
  start: (atIndex?: number, intervalSeconds?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  toggle: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  setInterval: (seconds: number) => void;
}

export function useSlideshow(options: UseSlideshowOptions): UseSlideshowResult {
  const { collection, startIndex, onIndexChange, onStop } = options;

  const [session, setSession] = useState<SlideshowSession | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Schedule next advance whenever a running session changes its interval/index.
  useEffect(() => {
    clearTimer();
    if (!session || !collection || session.status !== 'running') return;
    const wait = (remainingRef.current ?? session.intervalSeconds * 1000);
    remainingRef.current = null;
    timerRef.current = setTimeout(() => {
      setSession((s) => {
        if (!s || s.status !== 'running' || !collection) return s;
        // Skip past error photos (spec edge case).
        let nextIdx = (s.currentIndex + 1) % collection.photos.length;
        let safety = collection.photos.length;
        while (
          safety > 0 &&
          collection.photos[nextIdx]?.loadStatus === 'error'
        ) {
          nextIdx = (nextIdx + 1) % collection.photos.length;
          safety -= 1;
        }
        const advanced = { ...advance(s, collection.photos.length), currentIndex: nextIdx };
        onIndexChange?.(advanced.currentIndex);
        return advanced;
      });
    }, wait);

    return () => clearTimer();
  }, [session, collection, onIndexChange]);

  // Cleanup on unmount.
  useEffect(() => () => clearTimer(), []);

  const start = useCallback(
    (atIndex?: number, intervalSeconds?: number) => {
      if (!collection || collection.photos.length === 0) return;
      const idx = atIndex ?? startIndex ?? 0;
      const fresh = createSlideshowSession({
        collectionId: collection.id,
        startIndex: idx,
        intervalSeconds: intervalSeconds ?? DEFAULT_INTERVAL_SECONDS,
      });
      remainingRef.current = null;
      setSession(startSession(fresh));
      onIndexChange?.(idx);
    },
    [collection, startIndex, onIndexChange],
  );

  const pause = useCallback(() => {
    setSession((s) => {
      if (!s || s.status !== 'running') return s;
      // Capture remaining time so resume can pick up where pause left off.
      if (s.lastAdvancedAt) {
        const elapsed = Date.now() - s.lastAdvancedAt.getTime();
        const remaining = Math.max(0, s.intervalSeconds * 1000 - elapsed);
        remainingRef.current = remaining;
      }
      clearTimer();
      return pauseSession(s);
    });
  }, []);

  const resume = useCallback(() => {
    setSession((s) => (s && s.status === 'paused' ? resumeSession(s) : s));
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    remainingRef.current = null;
    setSession((s) => {
      if (!s) return s;
      const stopped = stopSession(s);
      onStop?.(stopped.currentIndex);
      return null; // detach session entirely
    });
  }, [onStop]);

  const toggle = useCallback(() => {
    setSession((s) => {
      if (!s) {
        // Start fresh — return null and let the caller invoke start() if they prefer.
        if (collection) {
          const fresh = startSession(
            createSlideshowSession({
              collectionId: collection.id,
              startIndex,
              intervalSeconds: DEFAULT_INTERVAL_SECONDS,
            }),
          );
          onIndexChange?.(fresh.currentIndex);
          return fresh;
        }
        return s;
      }
      if (s.status === 'running') return pauseSession(s);
      if (s.status === 'paused') return resumeSession(s);
      return s;
    });
  }, [collection, startIndex, onIndexChange]);

  const skipNext = useCallback(() => {
    if (!collection) return;
    setSession((s) => {
      if (!s) return s;
      remainingRef.current = null;
      const advanced = jumpTo(s, s.currentIndex + 1, collection.photos.length);
      onIndexChange?.(advanced.currentIndex);
      return advanced;
    });
  }, [collection, onIndexChange]);

  const skipPrev = useCallback(() => {
    if (!collection) return;
    setSession((s) => {
      if (!s) return s;
      remainingRef.current = null;
      const advanced = jumpTo(s, s.currentIndex - 1, collection.photos.length);
      onIndexChange?.(advanced.currentIndex);
      return advanced;
    });
  }, [collection, onIndexChange]);

  const setIntervalSeconds = useCallback((seconds: number) => {
    setSession((s) => (s ? setSessionInterval(s, clampInterval(seconds)) : s));
  }, []);

  return {
    session,
    isRunning: session?.status === 'running',
    isPaused: session?.status === 'paused',
    start,
    pause,
    resume,
    stop,
    toggle,
    skipNext,
    skipPrev,
    setInterval: setIntervalSeconds,
  };
}
