import React from 'react';
import { IconButton } from '../common/IconButton';

export interface EmptyStateProps {
  reason: 'no-photos' | 'permission-denied';
  onPickAnother: () => void;
}

export function EmptyState({ reason, onPickAnother }: EmptyStateProps) {
  const message =
    reason === 'permission-denied'
      ? "Couldn't read that folder. Please choose another or grant permission."
      : 'No supported photos were found in that folder.';
  return (
    <div className="pv-empty" role="status" aria-live="polite">
      <h2 style={{ margin: 0 }}>{message}</h2>
      <p>Supported formats: JPEG, PNG, GIF, WebP, BMP.</p>
      <IconButton label="Choose another folder" variant="primary" onClick={onPickAnother}>
        Choose another folder
      </IconButton>
    </div>
  );
}
