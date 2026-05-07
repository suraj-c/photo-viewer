import { describe, expect, it } from 'vitest';
import { at, createCollection, nextIndex, prevIndex, refresh } from '../../../src/models/Collection';
import { createPhoto, markError } from '../../../src/models/Photo';

function makePhoto(name: string) {
  const file = new File([new Uint8Array(1)], name, { type: 'image/jpeg' });
  return createPhoto(file, 'jpeg');
}

describe('Collection model', () => {
  it('createCollection captures total and folder name', () => {
    const photos = ['a.jpg', 'b.jpg', 'c.jpg'].map(makePhoto);
    const c = createCollection({ folderName: 'My Photos', photos, unsupportedCount: 2 });
    expect(c.total).toBe(3);
    expect(c.folderName).toBe('My Photos');
    expect(c.unsupportedCount).toBe(2);
    expect(c.loadedAt).toBeInstanceOf(Date);
  });

  it('at() is bounds-checked and returns null at the edges', () => {
    const photos = ['a.jpg', 'b.jpg'].map(makePhoto);
    const c = createCollection({ folderName: 'F', photos, unsupportedCount: 0 });
    expect(at(c, -1)).toBeNull();
    expect(at(c, 0)?.filename).toBe('a.jpg');
    expect(at(c, 2)).toBeNull();
  });

  it('next/prev return null at boundaries', () => {
    const photos = ['a.jpg', 'b.jpg', 'c.jpg'].map(makePhoto);
    const c = createCollection({ folderName: 'F', photos, unsupportedCount: 0 });
    expect(prevIndex(c, 0)).toBeNull();
    expect(nextIndex(c, c.photos.length - 1)).toBeNull();
    expect(nextIndex(c, 0)).toBe(1);
    expect(prevIndex(c, 2)).toBe(1);
  });

  it('next/prev skip error photos', () => {
    const photos = ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg'].map(makePhoto);
    markError(photos[1], 'corrupt');
    markError(photos[2], 'corrupt');
    const c = createCollection({ folderName: 'F', photos, unsupportedCount: 0 });
    expect(nextIndex(c, 0)).toBe(3);
    expect(prevIndex(c, 3)).toBe(0);
  });

  it('refresh produces a new Collection without mutating the old one', () => {
    const initial = ['a.jpg', 'b.jpg'].map(makePhoto);
    const oldC = createCollection({ folderName: 'F', photos: initial, unsupportedCount: 0 });
    const fresh = ['a.jpg', 'b.jpg', 'c.jpg'].map(makePhoto);
    const newC = refresh(oldC, fresh, 1);
    expect(newC).not.toBe(oldC);
    expect(newC.total).toBe(3);
    expect(oldC.total).toBe(2);
    expect(newC.unsupportedCount).toBe(1);
  });
});
