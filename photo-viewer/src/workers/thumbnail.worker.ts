/**
 * thumbnail.worker — generate a downscaled `ImageBitmap` for a `File`.
 *
 * Runs off the main thread (Constitution II) using `createImageBitmap` +
 * OffscreenCanvas. Returns the bitmap as a transferable so we don't copy
 * pixels back into the renderer.
 */

/// <reference lib="webworker" />
declare const self: DedicatedWorkerGlobalScope;

export interface ThumbnailRequest {
  type: 'thumbnail';
  id: string;
  file: File;
  /** Target longest edge in CSS pixels. */
  size: number;
}

export interface ThumbnailResponse {
  type: 'thumbnail';
  id: string;
  ok: boolean;
  bitmap?: ImageBitmap;
  error?: string;
}

self.onmessage = async (event: MessageEvent<ThumbnailRequest>) => {
  const req = event.data;
  if (!req || req.type !== 'thumbnail') return;

  try {
    const source = await createImageBitmap(req.file);
    try {
      const { width, height } = fit(source.width, source.height, req.size);
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, width, height);
      const bitmap = canvas.transferToImageBitmap();
      const response: ThumbnailResponse = {
        type: 'thumbnail',
        id: req.id,
        ok: true,
        bitmap,
      };
      self.postMessage(response, [bitmap]);
    } finally {
      source.close?.();
    }
  } catch (err) {
    const response: ThumbnailResponse = {
      type: 'thumbnail',
      id: req.id,
      ok: false,
      error: err instanceof Error ? err.message : 'Thumbnail decode failed',
    };
    self.postMessage(response);
  }
};

function fit(srcW: number, srcH: number, maxEdge: number) {
  if (srcW <= maxEdge && srcH <= maxEdge) return { width: srcW, height: srcH };
  if (srcW >= srcH) {
    const ratio = maxEdge / srcW;
    return { width: maxEdge, height: Math.max(1, Math.round(srcH * ratio)) };
  }
  const ratio = maxEdge / srcH;
  return { width: Math.max(1, Math.round(srcW * ratio)), height: maxEdge };
}

export {};
