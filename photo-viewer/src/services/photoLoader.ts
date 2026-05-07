/**
 * photoLoader — turn a `Photo`'s underlying `File` into something renderable.
 *
 * Goals:
 *  - Hand back an `ImageBitmap` (preferred) or a same-origin `blob:` URL the
 *    `<img>` element can consume.
 *  - Map all decode failures into a single `loadStatus = 'error'` signal so
 *    the viewer always has something to render.
 *  - Never mutate the source `File` (Constitution IV, FR-015).
 *
 * Off-thread decoding is delegated to `workers/decode.worker.ts`; this module
 * is the main-thread API in front of it.
 */

import type { Photo } from '../models/Photo';
import { markError, markReady } from '../models/Photo';

export interface LoadedPhoto {
  /** Object URL suitable for an `<img src>`. Caller MUST revoke when done. */
  objectUrl: string;
  width: number;
  height: number;
}

export async function loadPhoto(photo: Photo): Promise<LoadedPhoto> {
  if (photo.loadStatus === 'error') {
    throw new Error(photo.errorMessage ?? 'Photo previously failed to load');
  }

  // We use an Object URL rather than a data URL because:
  //  - it doesn't copy bytes into a string
  //  - `<img>` decoding inside the renderer is well-optimised
  //  - revocation is explicit and bounded
  const url = URL.createObjectURL(photo.file);

  try {
    const dimensions = await probeDimensions(url);
    markReady(photo, dimensions);
    return { objectUrl: url, width: dimensions.width, height: dimensions.height };
  } catch (err) {
    URL.revokeObjectURL(url);
    const message = err instanceof Error ? err.message : 'Decode failed';
    markError(photo, message);
    throw err;
  }
}

export function releaseLoadedPhoto(loaded: LoadedPhoto | null): void {
  if (!loaded) return;
  try {
    URL.revokeObjectURL(loaded.objectUrl);
  } catch {
    /* noop */
  }
}

/**
 * Probe an image's intrinsic dimensions by letting the browser decode the
 * Object URL into an `<img>`. This is the simplest cross-browser path and
 * doesn't allocate a full ImageBitmap.
 */
function probeDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('Image decoded with zero dimensions'));
        return;
      }
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error('Image failed to decode'));
    img.src = url;
  });
}
