import { describe, expect, it, vi } from 'vitest';
import { createThumbnailCache } from '../../../src/services/thumbnailCache';
import { createPhoto } from '../../../src/models/Photo';

function makeBitmap(): ImageBitmap {
  // jsdom doesn't have ImageBitmap; use a minimal stand-in with a `close()`.
  return { close: vi.fn(), width: 1, height: 1 } as unknown as ImageBitmap;
}

function makePhoto(name: string) {
  return createPhoto(new File([new Uint8Array(1)], name, { type: 'image/jpeg' }), 'jpeg');
}

describe('thumbnailCache LRU', () => {
  it('puts and gets bitmaps by Photo.id', () => {
    const cache = createThumbnailCache(4);
    const p = makePhoto('a.jpg');
    const b = makeBitmap();
    cache.put(p, b);
    expect(cache.get(p.id)).toBe(b);
    expect(p.thumbnailBitmap).toBe(b);
  });

  it('evicts the oldest entry when capacity is exceeded and nulls Photo.thumbnailBitmap', () => {
    const cache = createThumbnailCache(8); // floor is 8
    const photos = Array.from({ length: 9 }, (_, i) => makePhoto(`p${i}.jpg`));
    const bitmaps = photos.map(() => makeBitmap());
    photos.forEach((p, i) => cache.put(p, bitmaps[i]));

    expect(cache.size).toBe(8);
    expect(cache.get(photos[0].id)).toBeNull();
    expect(photos[0].thumbnailBitmap).toBeNull();
    // Most recent is still present
    expect(cache.get(photos[8].id)).toBe(bitmaps[8]);
  });

  it('clear() empties and closes all entries', () => {
    const cache = createThumbnailCache(8);
    const p = makePhoto('x.jpg');
    const bitmap = makeBitmap();
    cache.put(p, bitmap);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(p.thumbnailBitmap).toBeNull();
    expect((bitmap.close as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  });
});
