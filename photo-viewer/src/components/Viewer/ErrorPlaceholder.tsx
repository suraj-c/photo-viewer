import React from 'react';

export interface ErrorPlaceholderProps {
  filename: string;
  message?: string | null;
}

export function ErrorPlaceholder({ filename, message }: ErrorPlaceholderProps) {
  return (
    <div className="pv-viewer__error" role="alert" data-testid="error-placeholder">
      <h2>Couldn’t open this photo</h2>
      <p style={{ color: 'var(--pv-text-secondary)' }}>{filename}</p>
      {message ? <p style={{ color: 'var(--pv-text-muted)' }}>{message}</p> : null}
      <p style={{ color: 'var(--pv-text-muted)', fontSize: 12 }}>
        Use ← / → to skip past it.
      </p>
    </div>
  );
}
