import React from 'react';
import { MAX_INTERVAL_SECONDS, MIN_INTERVAL_SECONDS, clampInterval } from '../../models/SlideshowSession';

export interface SlideshowSettingsProps {
  intervalSeconds: number;
  onIntervalChange: (seconds: number) => void;
  disabled?: boolean;
}

export function SlideshowSettings({ intervalSeconds, onIntervalChange, disabled }: SlideshowSettingsProps) {
  return (
    <label>
      Interval
      <input
        type="number"
        min={MIN_INTERVAL_SECONDS}
        max={MAX_INTERVAL_SECONDS}
        step={1}
        value={intervalSeconds}
        disabled={disabled}
        onChange={(e) => onIntervalChange(clampInterval(Number(e.target.value)))}
        aria-label="Slideshow interval in seconds"
        data-testid="slideshow-interval"
      />
      <span aria-hidden="true">s</span>
    </label>
  );
}
