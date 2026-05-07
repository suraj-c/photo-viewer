import { describe, expect, it } from 'vitest';
import { MAX_SCALE, clampScale, composeTransform, normalizeRotation } from '../../../src/lib/transforms';

describe('transforms helpers', () => {
  it('clampScale handles non-finite, low, high', () => {
    expect(clampScale(NaN, 0.5)).toBe(0.5);
    expect(clampScale(Infinity, 0.5)).toBe(MAX_SCALE);
    expect(clampScale(0.1, 0.5)).toBe(0.5);
    expect(clampScale(2, 0.5)).toBe(2);
  });

  it('normalizeRotation snaps to nearest multiple of 90', () => {
    expect(normalizeRotation(44)).toBe(0);
    expect(normalizeRotation(46)).toBe(90);
    expect(normalizeRotation(720)).toBe(0);
    expect(normalizeRotation(-90)).toBe(270);
  });

  it('composeTransform produces a deterministic CSS string', () => {
    const t = composeTransform({ scale: 1, translateX: 0, translateY: 0, rotationDeg: 90 });
    expect(t).toMatch(/translate\(0\.00px, 0\.00px\) rotate\(90deg\) scale\(1\.0000\)/);
  });
});
