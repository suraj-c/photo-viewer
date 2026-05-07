import React from 'react';
import { IconButton } from '../common/IconButton';
import { SlideshowSettings } from './SlideshowSettings';
import { DEFAULT_INTERVAL_SECONDS } from '../../models/SlideshowSession';

export interface SlideshowControllerProps {
  status: 'running' | 'paused' | 'stopped';
  intervalSeconds: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onIntervalChange: (seconds: number) => void;
}

export function SlideshowController(props: SlideshowControllerProps) {
  return (
    <div className="pv-slideshow-controller" role="group" aria-label="Slideshow controls" data-testid="slideshow-controller">
      <SlideshowSettings
        intervalSeconds={props.intervalSeconds || DEFAULT_INTERVAL_SECONDS}
        onIntervalChange={props.onIntervalChange}
        disabled={props.status === 'stopped'}
      />
      {props.status === 'stopped' ? (
        <IconButton label="Start slideshow" iconChar="▶" variant="primary" onClick={props.onStart} />
      ) : null}
      {props.status === 'running' ? (
        <IconButton label="Pause slideshow" iconChar="⏸" onClick={props.onPause} />
      ) : null}
      {props.status === 'paused' ? (
        <IconButton label="Resume slideshow" iconChar="▶" onClick={props.onResume} />
      ) : null}
      {props.status !== 'stopped' ? (
        <IconButton label="Stop slideshow" iconChar="■" onClick={props.onStop} />
      ) : null}
      <span aria-live="polite" style={{ fontSize: 12, color: 'var(--pv-text-muted)' }}>
        {props.status}
      </span>
    </div>
  );
}
