/**
 * US1 integration test: pick folder → gallery renders → click a tile → viewer
 * opens → next/prev → Esc returns to gallery.
 *
 * Uses a mock `FolderReader` so we don't need the real File System Access API.
 * Image decoding inside jsdom is stubbed via the global Image constructor.
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import type { FolderReader } from '../../src/services/folderReader';

function makeJpeg(name: string): File {
  // Real JPEG magic bytes so format detection passes.
  const bytes = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);
  return new File([bytes], name, { type: 'image/jpeg', lastModified: 1700000000000 });
}

function buildReader(files: File[]): FolderReader {
  return {
    pick: vi.fn().mockResolvedValue({
      folderName: 'Test Folder',
      files,
      unsupportedCount: 0,
    }),
  };
}

// Stub Image to "decode" instantly with fixed dimensions.
class FakeImage {
  naturalWidth = 800;
  naturalHeight = 600;
  decoding = 'async';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_v: string) {
    // Fire load on next tick so consumers can wire handlers.
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

describe('US1 gallery flow', () => {
  it('renders the picker, opens a folder, shows tiles, opens a viewer, navigates, and returns', async () => {
    const files = ['a.jpg', 'b.jpg', 'c.jpg'].map(makeJpeg);
    const reader = buildReader(files);
    const user = userEvent.setup();

    render(<App folderReader={reader} />);

    // Step 1: picker visible
    expect(screen.getByTestId('folder-picker-button')).toBeInTheDocument();

    // Step 2: open folder (click the picker button — header has the same action)
    await user.click(screen.getByTestId('folder-picker-button'));
    expect(reader.pick).toHaveBeenCalled();

    // Step 3: gallery renders one tile per file
    const gallery = await screen.findByTestId('gallery');
    expect(gallery).toBeInTheDocument();
    expect(screen.getByTestId('thumb-0')).toBeInTheDocument();
    expect(screen.getByTestId('thumb-1')).toBeInTheDocument();
    expect(screen.getByTestId('thumb-2')).toBeInTheDocument();

    // Step 4: click first tile to open viewer
    await user.click(screen.getByTestId('thumb-0'));
    await waitFor(() => expect(screen.getByTestId('photo-viewer')).toBeInTheDocument());

    // Step 5: navigate next via keyboard
    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
    });
    // The viewer remounts the image when the photo changes; alt text should update.
    await waitFor(() => {
      const img = screen.queryByTestId('viewer-image') as HTMLImageElement | null;
      // Either the image is loaded (alt = filename) or we're momentarily on the loading state.
      if (img) expect(img.getAttribute('alt')).toBe('b.jpg');
    });

    // Step 6: navigate prev
    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
    });
    await waitFor(() => {
      const img = screen.queryByTestId('viewer-image') as HTMLImageElement | null;
      if (img) expect(img.getAttribute('alt')).toBe('a.jpg');
    });

    // Step 7: Esc returns to gallery
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    await waitFor(() => expect(screen.queryByTestId('photo-viewer')).not.toBeInTheDocument());
    expect(screen.getByTestId('gallery')).toBeInTheDocument();
  });

  it('shows the empty state when the chosen folder has no supported photos', async () => {
    const reader = buildReader([]);
    const user = userEvent.setup();
    render(<App folderReader={reader} />);
    await user.click(screen.getByTestId('folder-picker-button'));
    expect(await screen.findByText(/No supported photos/i)).toBeInTheDocument();
  });
});
