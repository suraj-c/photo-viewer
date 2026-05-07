import { describe, expect, it } from 'vitest';
import { createPhoto, markError, markReady } from '../../../src/models/Photo';

function makeFile(name = 'a.jpg', size = 1024): File {
  return new File([new Uint8Array(size)], name, { type: 'image/jpeg', lastModified: 1700000000000 });
}

describe('Photo model', () => {
  it('createPhoto seeds defaults from a File', () => {
    const photo = createPhoto(makeFile('IMG.jpg', 2048), 'jpeg');
    expect(photo.filename).toBe('IMG.jpg');
    expect(photo.format).toBe('jpeg');
    expect(photo.fileSizeBytes).toBe(2048);
    expect(photo.lastModified).toBe(1700000000000);
    expect(photo.loadStatus).toBe('pending');
    expect(photo.dimensions).toBeNull();
    expect(photo.captureDate).toBeNull();
    expect(photo.thumbnailBitmap).toBeNull();
    expect(typeof photo.id).toBe('string');
    expect(photo.id.length).toBeGreaterThan(0);
  });

  it('refuses unknown format', () => {
    expect(() => createPhoto(makeFile('a.bin'), 'unknown')).toThrow();
  });

  it('markReady transitions pending → ready and records dimensions', () => {
    const photo = createPhoto(makeFile(), 'jpeg');
    markReady(photo, { width: 800, height: 600 });
    expect(photo.loadStatus).toBe('ready');
    expect(photo.dimensions).toEqual({ width: 800, height: 600 });
  });

  it('markReady is a no-op when already in error state (one-way transition)', () => {
    const photo = createPhoto(makeFile(), 'jpeg');
    markError(photo, 'decode failed');
    markReady(photo, { width: 1, height: 1 });
    expect(photo.loadStatus).toBe('error');
    expect(photo.errorMessage).toBe('decode failed');
  });

  it('markError records the message but does not undo a ready state', () => {
    const photo = createPhoto(makeFile(), 'jpeg');
    markReady(photo, { width: 10, height: 10 });
    markError(photo, 'transient');
    expect(photo.loadStatus).toBe('ready'); // protected
  });
});
