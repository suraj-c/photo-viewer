import { describe, expect, it } from 'vitest';
import {
  advance,
  clampInterval,
  createSlideshowSession,
  jumpTo,
  pause,
  resume,
  setInterval as setSessionInterval,
  start,
  stop,
} from '../../../src/models/SlideshowSession';

describe('SlideshowSession model', () => {
  it('clampInterval enforces [1, 60] and rounds', () => {
    expect(clampInterval(0)).toBe(1);
    expect(clampInterval(0.4)).toBe(1);
    expect(clampInterval(60)).toBe(60);
    expect(clampInterval(61)).toBe(60);
    expect(clampInterval(7.6)).toBe(8);
    expect(clampInterval(NaN)).toBe(5);
  });

  it('starts in stopped state with the requested interval', () => {
    const s = createSlideshowSession({ collectionId: 'c', startIndex: 3, intervalSeconds: 10 });
    expect(s.status).toBe('stopped');
    expect(s.intervalSeconds).toBe(10);
    expect(s.currentIndex).toBe(3);
    expect(s.resumeIndex).toBe(3);
  });

  it('start → pause → resume → stop transitions', () => {
    const s0 = createSlideshowSession({ collectionId: 'c', startIndex: 0 });
    const s1 = start(s0);
    expect(s1.status).toBe('running');
    expect(s1.startedAt).toBeInstanceOf(Date);

    const s2 = pause(s1);
    expect(s2.status).toBe('paused');

    const s3 = resume(s2);
    expect(s3.status).toBe('running');

    const s4 = stop(s3);
    expect(s4.status).toBe('stopped');
    expect(s4.startedAt).toBeNull();
  });

  it('advance wraps to 0 at the end of the collection', () => {
    let s = start(createSlideshowSession({ collectionId: 'c', startIndex: 0 }));
    s = advance(s, 3);
    expect(s.currentIndex).toBe(1);
    s = advance(s, 3);
    expect(s.currentIndex).toBe(2);
    s = advance(s, 3);
    expect(s.currentIndex).toBe(0);
  });

  it('stop returns currentIndex to resumeIndex', () => {
    let s = start(createSlideshowSession({ collectionId: 'c', startIndex: 5 }));
    s = advance(s, 10);
    s = advance(s, 10);
    s = stop(s);
    expect(s.currentIndex).toBe(5);
  });

  it('jumpTo wraps negative indices and respects total', () => {
    const s = createSlideshowSession({ collectionId: 'c', startIndex: 0 });
    expect(jumpTo(s, -1, 4).currentIndex).toBe(3);
    expect(jumpTo(s, 10, 4).currentIndex).toBe(2);
  });

  it('setInterval clamps', () => {
    const s = createSlideshowSession({ collectionId: 'c', startIndex: 0 });
    expect(setSessionInterval(s, 999).intervalSeconds).toBe(60);
    expect(setSessionInterval(s, -3).intervalSeconds).toBe(1);
  });
});
