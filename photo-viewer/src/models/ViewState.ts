/**
 * ViewState entity (see specs/.../data-model.md).
 *
 * Transient per-session state for the photo currently open in the viewer.
 * Switching to a different photo resets every field except `controlsVisible`.
 */

import { MIN_SCALE, clampScale, normalizeRotation } from '../lib/transforms';

export type Rotation = 0 | 90 | 180 | 270;

export interface ViewState {
  photoId: string;
  scale: number;
  /** Computed per-photo to fit the current viewport; lower bound for `scale`. */
  fitScale: number;
  translateX: number;
  translateY: number;
  rotationDeg: Rotation;
  controlsVisible: boolean;
}

export function createViewState(photoId: string, fitScale = 1): ViewState {
  const safeFit = clampScale(fitScale, MIN_SCALE);
  return {
    photoId,
    scale: safeFit,
    fitScale: safeFit,
    translateX: 0,
    translateY: 0,
    rotationDeg: 0,
    controlsVisible: true,
  };
}

/** Reset zoom/pan to fit-to-screen; rotation is preserved (FR-007 / data-model). */
export function fitToScreen(view: ViewState): ViewState {
  return {
    ...view,
    scale: view.fitScale,
    translateX: 0,
    translateY: 0,
  };
}

export function setScale(view: ViewState, nextScale: number): ViewState {
  return { ...view, scale: clampScale(nextScale, view.fitScale) };
}

export function setRotation(view: ViewState, deg: number): ViewState {
  return { ...view, rotationDeg: normalizeRotation(deg) };
}

export function rotateBy(view: ViewState, deltaDeg: number): ViewState {
  return setRotation(view, view.rotationDeg + deltaDeg);
}

export function setPan(view: ViewState, x: number, y: number): ViewState {
  return { ...view, translateX: x, translateY: y };
}
