/**
 * US1 edge-case integration test: corrupt files surface an error placeholder
 * in the gallery and the viewer (FR-012, edge cases, SC-006).
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import type { FolderReader } from '../../src/services/folderReader';

function makeJpeg(name: string, valid = true): File {
  const bytes = valid
    ? new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
    : new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // still has magic bytes; we'll make it fail decode below
  return new File([bytes], name, { type: 'image/jpeg' });
}

class GoodImage {
  naturalWidth = 100;
  naturalHeight = 100;
  decoding = 'async';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_v: string) {
    queueMicrotask(() => this.onload?.());
  }
}
class BadImage {
  naturalWidth = 0;
  naturalHeight = 0;
  decoding = 'async';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_v: string) {
    queueMicrotask(() => this.onerror?.());
  }
}

beforeEach(() => {
  // @ts-expect-error -- override for tests
  globalThis.Image = GoodImage;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function buildReader(files: File[]): FolderReader {
  return {
    pick: vi.fn().mockResolvedValue({
      folderName: 'F',
      files,
      unsupportedCount: 0,
    }),
  };
}

describe('US1 corrupt files', () => {
  it('viewer shows an error placeholder when decode fails', async () => {
    const reader = buildReader([makeJpeg('a.jpg'), makeJpeg('b.jpg')]);
    const user = userEvent.setup();
    render(<App folderReader={reader} />);
    await user.click(screen.getByTestId('folder-picker-button'));

    // Switch to BadImage so the next photo decode fails in the viewer.
    // @ts-expect-error -- override
    globalThis.Image = BadImage;

    await user.click(await screen.findByTestId('thumb-0'));
    await waitFor(() => {
      expect(screen.getByTestId('error-placeholder')).toBeInTheDocument();
    });

    // Navigation continues past it (FR-012).
    // @ts-expect-error -- restore good decoder for next photo
    globalThis.Image = GoodImage;
    await act(async () => fireEvent.keyDown(window, { key: 'ArrowRight' }));
    await waitFor(() => {
      const img = screen.queryByTestId('viewer-image') as HTMLImageElement | null;
      if (img) expect(img.getAttribute('alt')).toBe('b.jpg');
    });
  });
});
