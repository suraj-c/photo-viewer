/**
 * SlideshowSession entity (see specs/.../data-model.md).
 *
 * A transient mode tied to the active Collection. The session model itself is
 * pure data — the actual scheduling lives in `hooks/useSlideshow.ts` so it can
 * use `requestAnimationFrame`/timers without polluting the model.
 */

export type SlideshowStatus = 'running' | 'paused' | 'stopped';

export const MIN_INTERVAL_SECONDS = 1;
export const MAX_INTERVAL_SECONDS = 60;
export const DEFAULT_INTERVAL_SECONDS = 5;

export interface SlideshowSession {
  collectionId: string;
  intervalSeconds: number;
  status: SlideshowStatus;
  currentIndex: number;
  startedAt: Date | null;
  lastAdvancedAt: Date | null;
  /** Index the user was on before the slideshow started — restored on stop. */
  resumeIndex: number;
}

export function clampInterval(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_INTERVAL_SECONDS;
  return Math.min(MAX_INTERVAL_SECONDS, Math.max(MIN_INTERVAL_SECONDS, Math.round(seconds)));
}

export function createSlideshowSession(args: {
  collectionId: string;
  startIndex: number;
  intervalSeconds?: number;
}): SlideshowSession {
  return {
    collectionId: args.collectionId,
    intervalSeconds: clampInterval(args.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS),
    status: 'stopped',
    currentIndex: args.startIndex,
    startedAt: null,
    lastAdvancedAt: null,
    resumeIndex: args.startIndex,
  };
}

export function start(session: SlideshowSession, now: Date = new Date()): SlideshowSession {
  if (session.status === 'running') return session;
  return {
    ...session,
    status: 'running',
    startedAt: session.startedAt ?? now,
    lastAdvancedAt: now,
  };
}

export function pause(session: SlideshowSession): SlideshowSession {
  if (session.status !== 'running') return session;
  return { ...session, status: 'paused' };
}

export function resume(session: SlideshowSession, now: Date = new Date()): SlideshowSession {
  if (session.status !== 'paused') return session;
  return { ...session, status: 'running', lastAdvancedAt: now };
}

export function stop(session: SlideshowSession): SlideshowSession {
  return {
    ...session,
    status: 'stopped',
    startedAt: null,
    lastAdvancedAt: null,
    currentIndex: session.resumeIndex,
  };
}

/** Advance to the next index, wrapping back to 0 at the end (data-model). */
export function advance(
  session: SlideshowSession,
  totalPhotos: number,
  now: Date = new Date(),
): SlideshowSession {
  if (totalPhotos <= 0) return session;
  return {
    ...session,
    currentIndex: (session.currentIndex + 1) % totalPhotos,
    lastAdvancedAt: now,
  };
}

export function setInterval(session: SlideshowSession, seconds: number): SlideshowSession {
  return { ...session, intervalSeconds: clampInterval(seconds) };
}

export function jumpTo(session: SlideshowSession, index: number, totalPhotos: number, now: Date = new Date()): SlideshowSession {
  if (totalPhotos <= 0) return session;
  const wrapped = ((index % totalPhotos) + totalPhotos) % totalPhotos;
  return { ...session, currentIndex: wrapped, lastAdvancedAt: now };
}
