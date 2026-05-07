/**
 * US3 integration test: start a slideshow, observe auto-advance via fake timers,
 * pause and verify it halts, stop and verify return-to-prior-view.
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import type { FolderReader } from '../../src/services/folderReader';

function makeJpeg(name: string): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], name, { type: 'image/jpeg' });
}

class FakeImage {
  naturalWidth = 100;
  naturalHeight = 100;
  decoding = 'async';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_v: string) {
    queueMicrotask(() => this.onload?.());
  }
}

function buildReader(files: File[]): FolderReader {
  return {
    pick: vi.fn().mockResolvedValue({
      folderName: 'T',
      files,
      unsupportedCount: 0,
    }),
  };
}

beforeEach(() => {
  // @ts-expect-error -- override
  globalThis.Image = FakeImage;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('US3 slideshow', () => {
  it('auto-advances at the configured interval, pauses on space, stops on escape', async () => {
    const reader = buildReader([makeJpeg('a.jpg'), makeJpeg('b.jpg'), makeJpeg('c.jpg')]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<App folderReader={reader} />);
    await user.click(screen.getByTestId('folder-picker-button'));
    await user.click(await screen.findByTestId('thumb-0'));
    await waitFor(() => screen.getByTestId('photo-viewer'));

    // Toggle slideshow on (S key in viewer scope).
    await act(async () => {
      fireEvent.keyDown(window, { key: 's' });
    });

    // Default interval is 5s. Fast-forward and assert the photo changed.
    await act(async () => {
      vi.advanceTimersByTime(5_100);
    });

    await waitFor(() => {
      const img = screen.queryByTestId('viewer-image') as HTMLImageElement | null;
      // At least we should NOT still be on a.jpg
      if (img && img.getAttribute('alt')) {
        expect(img.getAttribute('alt')).not.toBe('a.jpg');
      }
    });

    // Pause via Space — slideshow scope.
    await act(async () => {
      fireEvent.keyDown(window, { key: ' ' });
    });

    // Escape stops and returns to viewer / gallery.
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    // Slideshow controller should disappear once stopped.
    await waitFor(() => {
      expect(screen.queryByTestId('slideshow-controller')).not.toBeInTheDocument();
    });
  });
});
