/**
 * useCollection — owns the active `Collection` and current navigation index.
 *
 * Wraps `folderReader` (with an injectable seam for tests) and exposes a
 * minimal navigation API for the gallery / viewer surfaces.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  type Collection,
  createCollection,
  nextIndex as nextIdx,
  prevIndex as prevIdx,
  refresh as refreshCollection,
} from '../models/Collection';
import { createPhoto } from '../models/Photo';
import { detectFormat, isSupported } from '../lib/formatSupport';
import {
  FolderPickError,
  realFolderReader,
  type FolderReader,
  type ReadFolderResult,
} from '../services/folderReader';

export interface UseCollectionOptions {
  reader?: FolderReader;
}

export interface UseCollectionResult {
  collection: Collection | null;
  currentIndex: number;
  loading: boolean;
  error: string | null;
  selectFolder: () => Promise<void>;
  refresh: () => Promise<void>;
  openAt: (index: number) => void;
  next: () => void;
  prev: () => void;
  closeViewer: () => void;
  viewerOpen: boolean;
}

export function useCollection(options: UseCollectionOptions = {}): UseCollectionResult {
  const reader = options.reader ?? realFolderReader;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);

  // Last known result (kept so refresh() can re-run picker logic on the same handle).
  const lastResultRef = useRef<ReadFolderResult | null>(null);

  const buildCollection = useCallback(async (result: ReadFolderResult): Promise<Collection> => {
    const photos = [];
    let unsupported = result.unsupportedCount;
    for (const file of result.files) {
      // `folderReader` already filtered; sniff again defensively.
      const fmt = await detectFormat(file);
      if (!isSupported(fmt)) {
        unsupported += 1;
        continue;
      }
      photos.push(createPhoto(file, fmt));
    }
    return createCollection({
      folderName: result.folderName,
      photos,
      unsupportedCount: unsupported,
    });
  }, []);

  const selectFolder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reader.pick();
      lastResultRef.current = result;
      const next = await buildCollection(result);
      setCollection(next);
      setCurrentIndex(-1);
      setViewerOpen(false);
    } catch (err) {
      if (err instanceof FolderPickError && err.reason === 'cancelled') {
        // Silent — user just dismissed the picker.
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown folder error';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [reader, buildCollection]);

  const refresh = useCallback(async () => {
    if (!lastResultRef.current || !collection) return;
    setLoading(true);
    setError(null);
    try {
      const next = await buildCollection(lastResultRef.current);
      setCollection((current) =>
        current
          ? refreshCollection(current, next.photos, next.unsupportedCount)
          : next,
      );
      setCurrentIndex((i) => Math.min(i, next.photos.length - 1));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown refresh error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [collection, buildCollection]);

  const openAt = useCallback((index: number) => {
    setCurrentIndex(index);
    setViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => {
      if (!collection) return i;
      const n = nextIdx(collection, i);
      return n ?? i;
    });
  }, [collection]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => {
      if (!collection) return i;
      const p = prevIdx(collection, i);
      return p ?? i;
    });
  }, [collection]);

  return useMemo(
    () => ({
      collection,
      currentIndex,
      loading,
      error,
      selectFolder,
      refresh,
      openAt,
      next,
      prev,
      closeViewer,
      viewerOpen,
    }),
    [collection, currentIndex, loading, error, selectFolder, refresh, openAt, next, prev, closeViewer, viewerOpen],
  );
}
