/**
 * Photo entity (see specs/.../data-model.md).
 *
 * Represents a single image item in the active collection. Read-only with
 * respect to the underlying file (FR-015, SC-005, Constitution IV): no method
 * on `Photo` writes to or deletes the source file.
 */

import type { Format } from '../lib/formatSupport';

export type LoadStatus = 'pending' | 'ready' | 'error';

export interface Photo {
  /** Session-scoped UUID; never persisted, never transmitted. */
  id: string;
  filename: string;
  /** Display only; never sent off-device. */
  sourcePath: string;
  format: Format;
  fileSizeBytes: number;
  lastModified: number;
  dimensions: { width: number; height: number } | null;
  captureDate: Date | null;
  /** Owned by the LRU thumbnail cache; nulled on eviction. */
  thumbnailBitmap: ImageBitmap | null;
  loadStatus: LoadStatus;
  errorMessage: string | null;
  /** Underlying file handle; never exposed to networking code. */
  readonly file: File;
}

let counter = 0;
function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  counter += 1;
  return `photo-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/**
 * Construct a fresh `Photo` from a `File`. The `format` MUST already have been
 * sniffed by the caller (see `lib/formatSupport.ts`) — passing `'unknown'`
 * is a programming error and will throw, because such files never enter a
 * `Collection` (FR-003, FR-012).
 */
export function createPhoto(file: File, format: Format, sourcePath?: string): Photo {
  if (format === 'unknown') {
    throw new Error(`createPhoto: refusing to construct Photo with unknown format for ${file.name}`);
  }
  return {
    id: makeId(),
    filename: file.name,
    sourcePath: sourcePath ?? (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? file.name,
    format,
    fileSizeBytes: file.size,
    lastModified: file.lastModified,
    dimensions: null,
    captureDate: null,
    thumbnailBitmap: null,
    loadStatus: 'pending',
    errorMessage: null,
    file,
  };
}

/**
 * Mark a photo as `ready` after a successful decode/probe.
 * Mutates in place (the caller already holds the only reference) but enforces
 * the one-way `pending → ready` transition documented in the data model.
 */
export function markReady(
  photo: Photo,
  dimensions: { width: number; height: number },
): void {
  if (photo.loadStatus === 'error') {
    // Re-load attempts produce a fresh Photo per data-model rules; do not flip
    // an error photo back to ready in place.
    return;
  }
  photo.loadStatus = 'ready';
  photo.dimensions = dimensions;
  photo.errorMessage = null;
}

/** Mark a photo as failed; one-way transition. */
export function markError(photo: Photo, message: string): void {
  if (photo.loadStatus === 'ready') {
    // Already ready — keep it ready; transient errors are logged elsewhere.
    return;
  }
  photo.loadStatus = 'error';
  photo.errorMessage = message;
}
