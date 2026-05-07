/**
 * Collection entity (see specs/.../data-model.md).
 *
 * An ordered, immutable-ish list of `Photo` objects derived from a chosen
 * source folder. Index-based navigation is stable for the lifetime of the
 * Collection — the viewer relies on this when restoring scroll position or
 * advancing the slideshow.
 */

import type { Photo } from './Photo';

export interface Collection {
  id: string;
  folderName: string;
  photos: Photo[];
  total: number;
  loadedAt: Date;
  unsupportedCount: number;
}

let counter = 0;
function makeCollectionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  counter += 1;
  return `coll-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function createCollection(args: {
  folderName: string;
  photos: Photo[];
  unsupportedCount: number;
}): Collection {
  return {
    id: makeCollectionId(),
    folderName: args.folderName,
    photos: args.photos,
    total: args.photos.length,
    loadedAt: new Date(),
    unsupportedCount: args.unsupportedCount,
  };
}

export function at(collection: Collection, index: number): Photo | null {
  if (index < 0 || index >= collection.photos.length) return null;
  return collection.photos[index];
}

/**
 * Returns the next non-error photo's index after `currentIndex`, or `null` if
 * we're already at the boundary (FR-005, edge case "navigate past first/last").
 * If every subsequent photo is in error state, returns the last error photo's
 * index — the viewer is responsible for rendering the placeholder for it.
 */
export function nextIndex(collection: Collection, currentIndex: number): number | null {
  if (currentIndex >= collection.photos.length - 1) return null;
  for (let i = currentIndex + 1; i < collection.photos.length; i += 1) {
    if (collection.photos[i].loadStatus !== 'error') return i;
  }
  // All subsequent photos errored — still advance one step so the user can
  // see the placeholder rather than feeling stuck.
  return currentIndex + 1;
}

export function prevIndex(collection: Collection, currentIndex: number): number | null {
  if (currentIndex <= 0) return null;
  for (let i = currentIndex - 1; i >= 0; i -= 1) {
    if (collection.photos[i].loadStatus !== 'error') return i;
  }
  return currentIndex - 1;
}

/**
 * Produce a new Collection from the same source list (used by the "refresh"
 * affordance after the user adds/removes files in the source folder).
 * Photos are reconstructed from a caller-supplied factory so the existing
 * Collection's photos are NOT mutated.
 */
export function refresh(
  current: Collection,
  freshPhotos: Photo[],
  unsupportedCount: number,
): Collection {
  return createCollection({
    folderName: current.folderName,
    photos: freshPhotos,
    unsupportedCount,
  });
}
