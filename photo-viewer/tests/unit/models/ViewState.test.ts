import { describe, expect, it } from 'vitest';
import {
  createViewState,
  fitToScreen,
  rotateBy,
  setRotation,
  setScale,
} from '../../../src/models/ViewState';
import { MAX_SCALE, clampPan, normalizeRotation } from '../../../src/lib/transforms';

describe('ViewState model', () => {
  it('createViewState initializes to fit + identity', () => {
    const v = createViewState('p1', 0.5);
    expect(v.photoId).toBe('p1');
    expect(v.scale).toBe(0.5);
    expect(v.fitScale).toBe(0.5);
    expect(v.translateX).toBe(0);
    expect(v.translateY).toBe(0);
    expect(v.rotationDeg).toBe(0);
    expect(v.controlsVisible).toBe(true);
  });

  it('setScale clamps to [fitScale, MAX_SCALE]', () => {
    const v = createViewState('p1', 0.5);
    expect(setScale(v, 0.1).scale).toBe(0.5);
    expect(setScale(v, 100).scale).toBe(MAX_SCALE);
    expect(setScale(v, 1).scale).toBe(1);
  });

  it('fitToScreen resets scale and pan but preserves rotation', () => {
    let v = createViewState('p1', 0.5);
    v = setRotation(v, 90);
    v = { ...v, scale: 2, translateX: 50, translateY: 50 };
    const fit = fitToScreen(v);
    expect(fit.scale).toBe(0.5);
    expect(fit.translateX).toBe(0);
    expect(fit.translateY).toBe(0);
    expect(fit.rotationDeg).toBe(90);
  });

  it('rotateBy and normalizeRotation snap to 0/90/180/270', () => {
    expect(normalizeRotation(95)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(NaN)).toBe(0);

    let v = createViewState('p1');
    v = rotateBy(v, 90);
    expect(v.rotationDeg).toBe(90);
    v = rotateBy(v, 90);
    expect(v.rotationDeg).toBe(180);
    v = rotateBy(v, -90);
    expect(v.rotationDeg).toBe(90);
    v = rotateBy(v, -180);
    expect(v.rotationDeg).toBe(270);
  });

  it('clampPan keeps the image edge from receding past the viewport edge', () => {
    const result = clampPan({
      translateX: 1000,
      translateY: -1000,
      scaledImageWidth: 800,
      scaledImageHeight: 800,
      viewportWidth: 400,
      viewportHeight: 400,
    });
    expect(result.translateX).toBeLessThanOrEqual(200);
    expect(result.translateY).toBeGreaterThanOrEqual(-200);

    // When image is smaller than viewport, axes are locked to 0.
    const small = clampPan({
      translateX: 50,
      translateY: 50,
      scaledImageWidth: 100,
      scaledImageHeight: 100,
      viewportWidth: 400,
      viewportHeight: 400,
    });
    expect(small.translateX).toBe(0);
    expect(small.translateY).toBe(0);
  });
});
