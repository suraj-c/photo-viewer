/**
 * thumbnailCache — bounded LRU keyed by `Photo.id`.
 *
 * Owns every `ImageBitmap` produced by the thumbnail worker. When evicting,
 * we close the bitmap (where supported) and null it out on the `Photo` so the
 * gallery can re-request it lazily.
 */

import type { Photo } from '../models/Photo';

interface Entry {
  bitmap: ImageBitmap;
  /** Reference back to the owning Photo so eviction can null its field. */
  photo: Photo;
}

export interface ThumbnailCache {
  get(photoId: string): ImageBitmap | null;
  put(photo: Photo, bitmap: ImageBitmap): void;
  evict(photoId: string): void;
  resize(maxEntries: number): void;
  clear(): void;
  readonly size: number;
}

export function createThumbnailCache(initialCapacity = 200): ThumbnailCache {
  let capacity = Math.max(8, initialCapacity);
  const map = new Map<string, Entry>();

  function touch(id: string, entry: Entry): void {
    map.delete(id);
    map.set(id, entry);
  }

  function evictOldest(): void {
    const oldest = map.keys().next();
    if (oldest.done) return;
    const id = oldest.value;
    const entry = map.get(id);
    if (entry) closeEntry(entry);
    map.delete(id);
  }

  function closeEntry(entry: Entry): void {
    try {
      entry.bitmap.close();
    } catch {
      /* ImageBitmap.close may be unavailable in jsdom; tolerate it. */
    }
    if (entry.photo.thumbnailBitmap === entry.bitmap) {
      entry.photo.thumbnailBitmap = null;
    }
  }

  return {
    get(id: string): ImageBitmap | null {
      const entry = map.get(id);
      if (!entry) return null;
      touch(id, entry);
      return entry.bitmap;
    },

    put(photo: Photo, bitmap: ImageBitmap): void {
      const existing = map.get(photo.id);
      if (existing) closeEntry(existing);

      map.set(photo.id, { bitmap, photo });
      photo.thumbnailBitmap = bitmap;

      while (map.size > capacity) evictOldest();
    },

    evict(id: string): void {
      const entry = map.get(id);
      if (!entry) return;
      closeEntry(entry);
      map.delete(id);
    },

    resize(maxEntries: number): void {
      capacity = Math.max(8, maxEntries);
      while (map.size > capacity) evictOldest();
    },

    clear(): void {
      for (const entry of map.values()) closeEntry(entry);
      map.clear();
    },

    get size() {
      return map.size;
    },
  };
}

/** Shared default cache for the running app session. */
export const thumbnailCache = createThumbnailCache();
