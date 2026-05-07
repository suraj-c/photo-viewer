/**
 * useViewState — manages a `ViewState` for the active photo.
 *
 * Resets to defaults whenever the `photoId` changes (FR / spec: "switching to
 * another photo resets view state to defaults"). Exposes imperative helpers
 * for zoom, pan, fit, and rotate, all of which clamp to the model rules.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ViewState,
  createViewState,
  fitToScreen,
  rotateBy,
  setPan,
  setScale,
} from '../models/ViewState';
import { MAX_SCALE, clampPan, clampScale } from '../lib/transforms';

export interface UseViewStateResult {
  view: ViewState;
  zoomIn: (factor?: number) => void;
  zoomOut: (factor?: number) => void;
  zoomTo: (scale: number) => void;
  fit: () => void;
  panBy: (dx: number, dy: number, viewport?: { width: number; height: number; imageWidth: number; imageHeight: number }) => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  setControlsVisible: (visible: boolean) => void;
  setFitScale: (scale: number) => void;
}

const ZOOM_STEP = 1.25;

export function useViewState(photoId: string, initialFitScale = 1): UseViewStateResult {
  const [view, setView] = useState<ViewState>(() => createViewState(photoId, initialFitScale));

  // Reset on photo change.
  useEffect(() => {
    setView(createViewState(photoId, initialFitScale));
  }, [photoId, initialFitScale]);

  const setFitScale = useCallback((scale: number) => {
    setView((v) => {
      const fit = clampScale(scale, 0.01);
      return {
        ...v,
        fitScale: fit,
        scale: clampScale(v.scale, fit),
      };
    });
  }, []);

  const zoomIn = useCallback((factor = ZOOM_STEP) => {
    setView((v) => setScale(v, v.scale * factor));
  }, []);

  const zoomOut = useCallback((factor = ZOOM_STEP) => {
    setView((v) => setScale(v, v.scale / factor));
  }, []);

  const zoomTo = useCallback((scale: number) => {
    setView((v) => setScale(v, Math.min(MAX_SCALE, Math.max(v.fitScale, scale))));
  }, []);

  const fit = useCallback(() => {
    setView((v) => fitToScreen(v));
  }, []);

  const panBy = useCallback<UseViewStateResult['panBy']>((dx, dy, viewport) => {
    setView((v) => {
      const tx = v.translateX + dx;
      const ty = v.translateY + dy;
      if (!viewport) return setPan(v, tx, ty);
      const clamped = clampPan({
        translateX: tx,
        translateY: ty,
        scaledImageWidth: viewport.imageWidth * v.scale,
        scaledImageHeight: viewport.imageHeight * v.scale,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
      });
      return setPan(v, clamped.translateX, clamped.translateY);
    });
  }, []);

  const rotateLeft = useCallback(() => setView((v) => rotateBy(v, -90)), []);
  const rotateRight = useCallback(() => setView((v) => rotateBy(v, 90)), []);
  const setControlsVisible = useCallback((visible: boolean) => {
    setView((v) => (v.controlsVisible === visible ? v : { ...v, controlsVisible: visible }));
  }, []);

  return useMemo(
    () => ({
      view,
      zoomIn,
      zoomOut,
      zoomTo,
      fit,
      panBy,
      rotateLeft,
      rotateRight,
      setControlsVisible,
      setFitScale,
    }),
    [view, zoomIn, zoomOut, zoomTo, fit, panBy, rotateLeft, rotateRight, setControlsVisible, setFitScale],
  );
}
