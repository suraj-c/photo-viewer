import React from 'react';
import { IconButton } from './IconButton';

export interface FolderPickerProps {
  onPick: () => void;
  loading?: boolean;
  unsupportedCount?: number;
  error?: string | null;
}

/**
 * Empty-shell view shown before a folder has been chosen. After selection the
 * gallery takes over.
 */
export function FolderPicker({ onPick, loading, unsupportedCount, error }: FolderPickerProps) {
  return (
    <section className="pv-folder-picker" aria-labelledby="pv-picker-title">
      <h2 id="pv-picker-title">Pick a folder of photos</h2>
      <p>
        Photo Viewer reads photos directly from a folder on your device. Nothing is uploaded
        and no source files are modified.
      </p>
      <IconButton
        label="Open folder"
        variant="primary"
        onClick={onPick}
        disabled={loading}
        data-testid="folder-picker-button"
        iconChar="📂"
      >
        {loading ? 'Reading…' : 'Open folder'}
      </IconButton>
      {unsupportedCount && unsupportedCount > 0 ? (
        <p style={{ color: 'var(--pv-text-muted)' }}>
          {unsupportedCount} unsupported file{unsupportedCount === 1 ? '' : 's'} were skipped.
        </p>
      ) : null}
      {error ? (
        <p role="alert" style={{ color: 'var(--pv-error)' }}>
          {error}
        </p>
      ) : null}
      <p style={{ color: 'var(--pv-text-muted)', fontSize: 12 }}>
        Tip: press <kbd>?</kbd> at any time for keyboard shortcuts.
      </p>
    </section>
  );
}
