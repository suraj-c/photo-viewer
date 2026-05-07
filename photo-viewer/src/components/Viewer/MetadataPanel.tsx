import React, { useEffect, useState } from 'react';
import type { Photo } from '../../models/Photo';
import { readMetadata } from '../../services/metadataReader';

export interface MetadataPanelProps {
  photo: Photo;
  visible: boolean;
}

/**
 * Renders the four allowed metadata fields (FR-011): filename, dimensions,
 * file size, capture date. Missing fields render as "—".
 */
export function MetadataPanel({ photo, visible }: MetadataPanelProps) {
  const [captureDate, setCaptureDate] = useState<Date | null>(photo.captureDate);

  useEffect(() => {
    let cancelled = false;
    if (photo.captureDate) {
      setCaptureDate(photo.captureDate);
      return;
    }
    readMetadata(photo)
      .then((m) => {
        if (!cancelled) setCaptureDate(m.captureDate);
      })
      .catch(() => {
        /* Tolerate missing tags — the panel will show "—". */
      });
    return () => {
      cancelled = true;
    };
  }, [photo]);

  if (!visible) return null;

  return (
    <aside className="pv-metadata" aria-label="Photo metadata" data-testid="metadata-panel">
      <dl>
        <dt>Filename</dt>
        <dd>{photo.filename}</dd>
        <dt>Dimensions</dt>
        <dd>
          {photo.dimensions
            ? `${photo.dimensions.width} × ${photo.dimensions.height}`
            : '—'}
        </dd>
        <dt>File size</dt>
        <dd>{formatBytes(photo.fileSizeBytes)}</dd>
        <dt>Capture date</dt>
        <dd>{captureDate ? captureDate.toLocaleString() : '—'}</dd>
      </dl>
    </aside>
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}
