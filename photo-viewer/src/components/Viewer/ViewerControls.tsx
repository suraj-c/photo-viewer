import React from 'react';
import { IconButton } from '../common/IconButton';

export interface ViewerControlsProps {
  hidden: boolean;
  scale: number;
  fitScale: number;
  canPrev: boolean;
  canNext: boolean;
  metadataOpen: boolean;
  slideshowRunning: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onToggleMetadata: () => void;
  onToggleSlideshow: () => void;
}

export function ViewerControls(props: ViewerControlsProps) {
  const zoomPercent = Math.round((props.scale / Math.max(props.fitScale, 0.0001)) * 100);
  return (
    <div
      className="pv-viewer__controls"
      data-hidden={props.hidden}
      role="toolbar"
      aria-label="Photo viewer controls"
      data-testid="viewer-controls"
    >
      <IconButton label="Previous photo" iconChar="‹" onClick={props.onPrev} disabled={!props.canPrev} />
      <IconButton label="Next photo" iconChar="›" onClick={props.onNext} disabled={!props.canNext} />
      <span className="pv-viewer__zoom-indicator" aria-live="polite">
        {zoomPercent}%
      </span>
      <IconButton label="Zoom out" iconChar="−" onClick={props.onZoomOut} />
      <IconButton label="Fit to screen" iconChar="⤢" onClick={props.onFit} />
      <IconButton label="Zoom in" iconChar="+" onClick={props.onZoomIn} />
      <IconButton label="Rotate left" iconChar="⟲" onClick={props.onRotateLeft} />
      <IconButton label="Rotate right" iconChar="⟳" onClick={props.onRotateRight} />
      <IconButton
        label={props.metadataOpen ? 'Hide info' : 'Show info'}
        iconChar="ⓘ"
        onClick={props.onToggleMetadata}
        aria-pressed={props.metadataOpen}
      />
      <IconButton
        label={props.slideshowRunning ? 'Stop slideshow' : 'Start slideshow'}
        iconChar={props.slideshowRunning ? '■' : '▶'}
        onClick={props.onToggleSlideshow}
        aria-pressed={props.slideshowRunning}
      />
    </div>
  );
}
