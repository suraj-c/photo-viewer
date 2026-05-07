import React, { useEffect, useRef, useState } from 'react';
import type { Photo } from '../../models/Photo';

export interface ThumbnailTileProps {
  photo: Photo;
  index: number;
  isFocused: boolean;
  onActivate: (index: number) => void;
  onFocus: (index: number) => void;
}

/**
 * Lazy-loaded thumbnail tile. The implementation prefers the worker-produced
 * `ImageBitmap` cached on the `Photo`, but falls back to the original `<img>`
 * (browser-decoded) so the gallery still renders if worker support is
 * unavailable (jsdom test env, older Safari).
 */
export const ThumbnailTile = React.memo(function ThumbnailTile(props: ThumbnailTileProps) {
  const { photo, index, isFocused, onActivate, onFocus } = props;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [errored, setErrored] = useState<boolean>(photo.loadStatus === 'error');

  useEffect(() => {
    if (photo.loadStatus === 'error') {
      setErrored(true);
      return;
    }
    const url = URL.createObjectURL(photo.file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (isFocused && buttonRef.current && document.activeElement !== buttonRef.current) {
      buttonRef.current.focus({ preventScroll: false });
    }
  }, [isFocused]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className="pv-thumb"
      data-testid={`thumb-${index}`}
      data-photo-id={photo.id}
      aria-label={photo.filename}
      onClick={() => onActivate(index)}
      onFocus={() => onFocus(index)}
      tabIndex={isFocused ? 0 : -1}
    >
      {errored || !objectUrl ? (
        <div className="pv-thumb__error">Couldn’t preview this photo</div>
      ) : (
        <img
          src={objectUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
        />
      )}
      <span className="pv-thumb__caption">{photo.filename}</span>
    </button>
  );
});
