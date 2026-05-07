/**
 * Pure helpers for view-state transform math.
 * Extracted so they can be unit-tested independently of React.
 */

/** Lower bound on `scale`. The actual fit-scale is computed per-photo by the viewer
 *  (image dimensions / viewport), but we still clamp to this absolute floor. */
export const MIN_SCALE = 0.1;

/** Upper bound on `scale`. Anything beyond is visually meaningless and risks GPU
 *  texture limits on very large images. */
export const MAX_SCALE = 8;

export function clampScale(scale: number, fitScale = MIN_SCALE): number {
  if (!Number.isFinite(scale)) return fitScale;
  return Math.min(MAX_SCALE, Math.max(fitScale, scale));
}

/** Coerce arbitrary degrees into the canonical 0/90/180/270 set. */
export function normalizeRotation(deg: number): 0 | 90 | 180 | 270 {
  if (!Number.isFinite(deg)) return 0;
  const positive = ((deg % 360) + 360) % 360;
  const snapped = Math.round(positive / 90) * 90;
  const final = snapped % 360;
  return (final === 0 || final === 90 || final === 180 || final === 270 ? final : 0) as
    | 0
    | 90
    | 180
    | 270;
}

/**
 * Clamp pan offsets so the (scaled) image always covers the viewport.
 * When the scaled image is smaller than the viewport on an axis, that axis
 * is locked to 0.
 */
export function clampPan(args: {
  translateX: number;
  translateY: number;
  scaledImageWidth: number;
  scaledImageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}): { translateX: number; translateY: number } {
  const dx = Math.max(0, (args.scaledImageWidth - args.viewportWidth) / 2);
  const dy = Math.max(0, (args.scaledImageHeight - args.viewportHeight) / 2);
  return {
    translateX:
      args.scaledImageWidth <= args.viewportWidth
        ? 0
        : Math.min(dx, Math.max(-dx, args.translateX)),
    translateY:
      args.scaledImageHeight <= args.viewportHeight
        ? 0
        : Math.min(dy, Math.max(-dy, args.translateY)),
  };
}

/** Compose a CSS transform string in a stable order (rotate → scale → translate). */
export function composeTransform(opts: {
  scale: number;
  translateX: number;
  translateY: number;
  rotationDeg: number;
}): string {
  return `translate(${opts.translateX.toFixed(2)}px, ${opts.translateY.toFixed(2)}px) rotate(${opts.rotationDeg}deg) scale(${opts.scale.toFixed(4)})`;
}
