import React, { useEffect, useRef, useState } from 'react';
import type { Collection } from '../../models/Collection';
import { ThumbnailTile } from './ThumbnailTile';
import { EmptyState } from './EmptyState';

export interface GalleryProps {
  collection: Collection;
  onOpen: (index: number) => void;
  onPickAnother: () => void;
  /** Index of the most-recently-viewed photo — used to restore scroll/focus on return. */
  restoreIndex?: number;
}

/**
 * Responsive thumbnail grid. Uses native CSS grid + `content-visibility: auto`
 * on each tile (set in globals.css) for cheap virtualization that scales to
 * hundreds of photos. For thousands we'd swap in a windowed list, but the
 * scope here is "smooth at 500" (SC-003).
 */
export function Gallery({ collection, onOpen, onPickAnother, restoreIndex }: GalleryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(restoreIndex ?? 0);

  useEffect(() => {
    if (restoreIndex != null && restoreIndex >= 0) {
      setFocusedIndex(restoreIndex);
      // Allow paint, then scroll the tile into view.
      const id = window.requestAnimationFrame(() => {
        const tile = containerRef.current?.querySelector<HTMLButtonElement>(
          `[data-testid="thumb-${restoreIndex}"]`,
        );
        tile?.scrollIntoView({ block: 'center', behavior: 'auto' });
      });
      return () => cancelAnimationFrame(id);
    }
    return;
  }, [restoreIndex]);

  // Gallery-scope arrow navigation handled here so it works without a hook scope.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!collection.photos.length) return;
    const cols = computeColumns(containerRef.current);
    let next = focusedIndex;
    switch (e.key) {
      case 'ArrowRight': next = Math.min(collection.photos.length - 1, focusedIndex + 1); break;
      case 'ArrowLeft':  next = Math.max(0, focusedIndex - 1); break;
      case 'ArrowDown':  next = Math.min(collection.photos.length - 1, focusedIndex + cols); break;
      case 'ArrowUp':    next = Math.max(0, focusedIndex - cols); break;
      case 'Home':       next = 0; break;
      case 'End':        next = collection.photos.length - 1; break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onOpen(focusedIndex);
        return;
      default:
        return;
    }
    e.preventDefault();
    setFocusedIndex(next);
  };

  if (collection.photos.length === 0) {
    return <EmptyState reason="no-photos" onPickAnother={onPickAnother} />;
  }

  return (
    <div
      ref={containerRef}
      className="pv-gallery"
      role="grid"
      aria-label={`Photos in ${collection.folderName}`}
      data-testid="gallery"
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      <div className="pv-gallery__grid" role="row">
        {collection.photos.map((photo, index) => (
          <ThumbnailTile
            key={photo.id}
            photo={photo}
            index={index}
            isFocused={index === focusedIndex}
            onActivate={onOpen}
            onFocus={setFocusedIndex}
          />
        ))}
      </div>
    </div>
  );
}

function computeColumns(grid: HTMLDivElement | null): number {
  if (!grid) return 1;
  const inner = grid.querySelector<HTMLDivElement>('.pv-gallery__grid');
  if (!inner) return 1;
  const style = window.getComputedStyle(inner);
  const template = style.getPropertyValue('grid-template-columns');
  const tracks = template.split(' ').filter(Boolean);
  return Math.max(1, tracks.length);
}
