/**
 * decode.worker — full-resolution decode for the active image.
 *
 * Strategy:
 *  - First emit a low-res preview (≤ 640 px longest edge) so the viewer can
 *    paint something within the perf budget on very large photos
 *    (edge case: tens of megapixels — Constitution II / spec edge cases).
 *  - Then emit the full-resolution bitmap.
 *
 * Both bitmaps are transferred — no pixel copy back to the main thread.
 */

/// <reference lib="webworker" />
declare const self: DedicatedWorkerGlobalScope;

export interface DecodeRequest {
  type: 'decode';
  id: string;
  file: File;
}

export interface DecodeResponse {
  type: 'decode';
  id: string;
  stage: 'preview' | 'full' | 'error';
  bitmap?: ImageBitmap;
  width?: number;
  height?: number;
  error?: string;
}

const PREVIEW_EDGE = 640;

self.onmessage = async (event: MessageEvent<DecodeRequest>) => {
  const req = event.data;
  if (!req || req.type !== 'decode') return;

  let full: ImageBitmap | null = null;
  try {
    full = await createImageBitmap(req.file);
    const { width, height } = full;

    // Preview pass — only when the image is meaningfully large.
    if (width > PREVIEW_EDGE || height > PREVIEW_EDGE) {
      try {
        const previewSize = fit(width, height, PREVIEW_EDGE);
        const previewCanvas = new OffscreenCanvas(previewSize.width, previewSize.height);
        const ctx = previewCanvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingQuality = 'low';
          ctx.drawImage(full, 0, 0, previewSize.width, previewSize.height);
          const previewBitmap = previewCanvas.transferToImageBitmap();
          const previewMsg: DecodeResponse = {
            type: 'decode',
            id: req.id,
            stage: 'preview',
            bitmap: previewBitmap,
            width: previewSize.width,
            height: previewSize.height,
          };
          self.postMessage(previewMsg, [previewBitmap]);
        }
      } catch {
        /* preview is best-effort only */
      }
    }

    const fullMsg: DecodeResponse = {
      type: 'decode',
      id: req.id,
      stage: 'full',
      bitmap: full,
      width,
      height,
    };
    self.postMessage(fullMsg, [full]);
    full = null; // ownership transferred
  } catch (err) {
    if (full) full.close?.();
    const response: DecodeResponse = {
      type: 'decode',
      id: req.id,
      stage: 'error',
      error: err instanceof Error ? err.message : 'Decode failed',
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
