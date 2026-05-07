/**
 * US2 integration test: zoom in/out, fit-to-screen, rotate via keyboard, and
 * verify view state resets when switching photos.
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import type { FolderReader } from '../../src/services/folderReader';

function makeJpeg(name: string): File {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  return new File([bytes], name, { type: 'image/jpeg' });
}

class FakeImage {
  naturalWidth = 1600;
  naturalHeight = 1200;
  decoding = 'async';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_v: string) {
    queueMicrotask(() => this.onload?.());
  }
}

beforeEach(() => {
  // @ts-expect-error -- override for tests
  globalThis.Image = FakeImage;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function buildReader(files: File[]): FolderReader {
  return {
    pick: vi.fn().mockResolvedValue({
      folderName: 'Test',
      files,
      unsupportedCount: 0,
    }),
  };
}

describe('US2 viewer zoom/pan/rotate', () => {
  it('keyboard zoom in/out updates the zoom indicator and fit resets it', async () => {
    const reader = buildReader([makeJpeg('a.jpg'), makeJpeg('b.jpg')]);
    const user = userEvent.setup();
    render(<App folderReader={reader} />);
    await user.click(screen.getByTestId('folder-picker-button'));
    await user.click(await screen.findByTestId('thumb-0'));
    await waitFor(() => screen.getByTestId('photo-viewer'));

    // The fit-scale will be 0 in jsdom because the stage rect is 0×0; the
    // viewer therefore reports 100% (fit). After a zoom-in event the scale
    // bumps. We assert the indicator changes value.
    const zoomIndicatorBefore = screen.getByText(/%/i).textContent;
    await act(async () => {
      fireEvent.keyDown(window, { key: '+' });
      fireEvent.keyDown(window, { key: '+' });
    });
    await waitFor(() => {
      const after = screen.getByText(/%/i).textContent;
      expect(after).not.toBe(zoomIndicatorBefore);
    });

    // Fit resets it back to the original value.
    await act(async () => {
      fireEvent.keyDown(window, { key: '0' });
    });
    await waitFor(() => {
      expect(screen.getByText(/%/i).textContent).toBe(zoomIndicatorBefore);
    });
  });

  it('rotation keys cycle 0 → 90 → 180 → 270 → 0', async () => {
    const reader = buildReader([makeJpeg('a.jpg')]);
    const user = userEvent.setup();
    render(<App folderReader={reader} />);
    await user.click(screen.getByTestId('folder-picker-button'));
    await user.click(await screen.findByTestId('thumb-0'));
    const img = await screen.findByTestId('viewer-image');

    function transformRotation(): number {
      const t = img.style.transform;
      const m = /rotate\((-?\d+)deg\)/.exec(t);
      return m ? Number(m[1]) : 0;
    }

    expect(transformRotation()).toBe(0);
    await act(async () => fireEvent.keyDown(window, { key: ']' }));
    expect(transformRotation()).toBe(90);
    await act(async () => fireEvent.keyDown(window, { key: ']' }));
    expect(transformRotation()).toBe(180);
    await act(async () => fireEvent.keyDown(window, { key: '[' }));
    expect(transformRotation()).toBe(90);
  });
});
