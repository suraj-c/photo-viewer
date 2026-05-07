/**
 * metadataReader — extract user-visible metadata for the panel (FR-011).
 *
 * Currently surfaces:
 *  - capture date (EXIF DateTimeOriginal, with file mtime fallback)
 *  - dimensions (filled in by `photoLoader`; this module just reads them)
 *
 * Tolerant of missing tags: any failure falls back to "unknown" rather than
 * blocking the viewer.
 */

import type { Photo } from '../models/Photo';

export interface ExtractedMetadata {
  captureDate: Date | null;
}

let exifrPromise: Promise<typeof import('exifr')> | null = null;
function loadExifr(): Promise<typeof import('exifr')> {
  if (!exifrPromise) {
    exifrPromise = import('exifr').catch((err) => {
      // If exifr isn't available we still degrade gracefully.
      // eslint-disable-next-line no-console
      console.warn('exifr unavailable; metadata reader will fall back to file mtime', err);
      throw err;
    });
  }
  return exifrPromise;
}

export async function readMetadata(photo: Photo): Promise<ExtractedMetadata> {
  // Only formats with EXIF are worth parsing; for the others, we just use
  // the file's lastModified timestamp.
  if (photo.format !== 'jpeg' && photo.format !== 'webp') {
    return { captureDate: photo.lastModified ? new Date(photo.lastModified) : null };
  }

  try {
    const exifr = await loadExifr();
    const tags = await exifr.parse(photo.file, ['DateTimeOriginal', 'CreateDate']).catch(() => null);
    const exifDate =
      (tags && (tags.DateTimeOriginal || tags.CreateDate)) || null;
    if (exifDate instanceof Date && !Number.isNaN(exifDate.getTime())) {
      photo.captureDate = exifDate;
      return { captureDate: exifDate };
    }
  } catch {
    /* fall through to mtime */
  }

  const fallback = photo.lastModified ? new Date(photo.lastModified) : null;
  photo.captureDate = fallback;
  return { captureDate: fallback };
}
