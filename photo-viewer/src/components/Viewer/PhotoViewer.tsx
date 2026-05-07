import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Photo } from '../../models/Photo';
import { useViewState } from '../../hooks/useViewState';
import { composeTransform } from '../../lib/transforms';
import { ViewerControls } from './ViewerControls';
import { MetadataPanel } from './MetadataPanel';
import { ErrorPlaceholder } from './ErrorPlaceholder';
import { IconButton } from '../common/IconButton';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { loadPhoto, releaseLoadedPhoto, type LoadedPhoto } from '../../services/photoLoader';

export interface PhotoViewerProps {
  photo: Photo;
  canPrev: boolean;
  canNext: boolean;
  metadataOpen: boolean;
  slideshowRunning: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onToggleMetadata: () => void;
  onToggleSlideshow: () => void;
}

const CONTROLS_AUTO_HIDE_MS = 2000;
const WHEEL_ZOOM_FACTOR = 1.1;
const KEYBOARD_PAN_STEP = 40;

export function PhotoViewer(props: PhotoViewerProps) {
  const { photo } = props;
  const reducedMotion = useReducedMotion();

  const [loaded, setLoaded] = useState<LoadedPhoto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });
  const [grabbing, setGrabbing] = useState(false);
  const dragStateRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  // Compute fit-scale relative to current stage / image dims so the zoom
  // indicator percentage is meaningful. The viewer renders the image at its
  // natural pixel size and uses CSS `transform: scale(...)` to fit.
  const fitScale = useMemo(() => {
    if (!loaded || stageSize.width <= 0 || stageSize.height <= 0) return 1;
    const sx = stageSize.width / loaded.width;
    const sy = stageSize.height / loaded.height;
    return Math.min(1, Math.min(sx, sy));
  }, [loaded, stageSize]);

  const vs = useViewState(photo.id, fitScale);
  const { view, zoomIn, zoomOut, zoomTo, fit, panBy, rotateLeft, rotateRight, setControlsVisible, setFitScale } = vs;

  // Keep ViewState's fitScale in sync with viewport/image dimensions.
  useEffect(() => {
    setFitScale(fitScale);
  }, [fitScale, setFitScale]);

  // Subscribe to App-level keyboard commands (decoupled via CustomEvent).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      switch (detail) {
        case 'zoom-in': zoomIn(); break;
        case 'zoom-out': zoomOut(); break;
        case 'fit': fit(); break;
        case 'rotate-left': rotateLeft(); break;
        case 'rotate-right': rotateRight(); break;
        case 'pan-up':
          if (loaded) panBy(0, KEYBOARD_PAN_STEP, viewportSpec(stageSize, loaded));
          break;
        case 'pan-down':
          if (loaded) panBy(0, -KEYBOARD_PAN_STEP, viewportSpec(stageSize, loaded));
          break;
        case 'pan-left':
          if (loaded) panBy(KEYBOARD_PAN_STEP, 0, viewportSpec(stageSize, loaded));
          break;
        case 'pan-right':
          if (loaded) panBy(-KEYBOARD_PAN_STEP, 0, viewportSpec(stageSize, loaded));
          break;
        default:
          break;
      }
    };
    window.addEventListener('pv-viewer-cmd', handler);
    return () => window.removeEventListener('pv-viewer-cmd', handler);
  }, [zoomIn, zoomOut, fit, rotateLeft, rotateRight, panBy, loaded, stageSize]);

  // Load the photo whenever it changes.
  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    setLoadError(null);
    if (photo.loadStatus === 'error') {
      setLoadError(photo.errorMessage ?? 'Photo failed to load');
      return;
    }
    loadPhoto(photo)
      .then((res) => {
        if (cancelled) {
          releaseLoadedPhoto(res);
          return;
        }
        setLoaded(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load photo');
      });
    return () => {
      cancelled = true;
    };
  }, [photo]);

  // Release Object URL on unmount/photo-change.
  useEffect(() => {
    return () => releaseLoadedPhoto(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Track stage size (responsive layout — FR-017).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setStageSize({ width: rect.width || 1, height: rect.height || 1 });
    };
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Auto-hide controls after pointer inactivity (Constitution I).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const showThenSchedule = () => {
      setControlsVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setControlsVisible(false), CONTROLS_AUTO_HIDE_MS);
    };
    showThenSchedule();
    const events: Array<keyof WindowEventMap> = ['pointermove', 'pointerdown', 'keydown'];
    events.forEach((e) => window.addEventListener(e, showThenSchedule));
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, showThenSchedule));
    };
  }, [setControlsVisible]);

  // Pointer drag → pan.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (view.scale <= view.fitScale) return; // nothing to pan when fully fitted
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStateRef.current = { x: e.clientX, y: e.clientY, tx: view.translateX, ty: view.translateY };
    setGrabbing(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds) return;
    if (!loaded) return;
    const dx = e.clientX - ds.x;
    const dy = e.clientY - ds.y;
    panBy(
      ds.tx + dx - view.translateX,
      ds.ty + dy - view.translateY,
      viewportSpec(stageSize, loaded),
    );
  };
  const onPointerUp = () => {
    dragStateRef.current = null;
    setGrabbing(false);
  };

  // Wheel zoom.
  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.deltaY < 0) zoomTo(view.scale * WHEEL_ZOOM_FACTOR);
      else zoomTo(view.scale / WHEEL_ZOOM_FACTOR);
    },
    [view.scale, zoomTo],
  );

  const transform = composeTransform({
    scale: view.scale,
    translateX: view.translateX,
    translateY: view.translateY,
    rotationDeg: view.rotationDeg,
  });

  return (
    <div className="pv-viewer" data-testid="photo-viewer" role="region" aria-label="Photo viewer">
      <div className="pv-viewer__close">
        <IconButton label="Close viewer" iconChar="✕" onClick={props.onClose} />
      </div>

      <div
        ref={stageRef}
        className={`pv-viewer__stage${grabbing ? ' pv-viewer__stage--grabbing' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {loadError ? (
          <ErrorPlaceholder filename={photo.filename} message={loadError} />
        ) : loaded ? (
          <img
            ref={imgRef}
            className={`pv-viewer__img${reducedMotion ? ' pv-viewer__img--no-transition' : ''}`}
            src={loaded.objectUrl}
            alt={photo.filename}
            style={{
              transform,
              maxWidth: 'none',
              maxHeight: 'none',
              width: loaded.width,
              height: loaded.height,
            }}
            draggable={false}
            data-testid="viewer-image"
          />
        ) : (
          <div style={{ color: 'var(--pv-text-secondary)' }} data-testid="viewer-loading">
            Loading…
          </div>
        )}
      </div>

      <MetadataPanel photo={photo} visible={props.metadataOpen} />

      <ViewerControls
        hidden={!view.controlsVisible}
        scale={view.scale}
        fitScale={view.fitScale}
        canPrev={props.canPrev}
        canNext={props.canNext}
        metadataOpen={props.metadataOpen}
        slideshowRunning={props.slideshowRunning}
        onPrev={props.onPrev}
        onNext={props.onNext}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFit={fit}
        onRotateLeft={rotateLeft}
        onRotateRight={rotateRight}
        onToggleMetadata={props.onToggleMetadata}
        onToggleSlideshow={props.onToggleSlideshow}
      />
    </div>
  );
}

function viewportSpec(stage: { width: number; height: number }, loaded: LoadedPhoto) {
  return {
    width: stage.width,
    height: stage.height,
    imageWidth: loaded.width,
    imageHeight: loaded.height,
  };
}

/** Exported for tests / keyboard wiring. */
export const PHOTO_VIEWER_API = {
  CONTROLS_AUTO_HIDE_MS,
  WHEEL_ZOOM_FACTOR,
  KEYBOARD_PAN_STEP,
};
