import { describe, expect, it } from 'vitest';
import {
  detectFormatFromMime,
  isSupported,
  sniffMagicBytes,
  SUPPORTED_FORMATS,
} from '../../../src/lib/formatSupport';

describe('formatSupport', () => {
  it('identifies all supported formats by magic bytes', () => {
    expect(sniffMagicBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(
      sniffMagicBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe('png');
    expect(sniffMagicBytes(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe('gif');
    expect(sniffMagicBytes(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]))).toBe('gif');
    expect(
      sniffMagicBytes(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
        ]),
      ),
    ).toBe('webp');
    expect(sniffMagicBytes(new Uint8Array([0x42, 0x4d, 0x00, 0x00]))).toBe('bmp');
  });

  it('returns "unknown" for non-image byte sequences', () => {
    expect(sniffMagicBytes(new Uint8Array([0x00, 0x01, 0x02, 0x03]))).toBe('unknown');
    expect(sniffMagicBytes(new Uint8Array([0x21, 0x21]))).toBe('unknown');
  });

  it('detectFormatFromMime falls back to MIME types', () => {
    expect(detectFormatFromMime('image/jpeg')).toBe('jpeg');
    expect(detectFormatFromMime('image/PNG')).toBe('png');
    expect(detectFormatFromMime('text/plain')).toBe('unknown');
    expect(detectFormatFromMime(undefined)).toBe('unknown');
  });

  it('isSupported is a type guard for the format set', () => {
    for (const fmt of SUPPORTED_FORMATS) expect(isSupported(fmt)).toBe(true);
    expect(isSupported('unknown')).toBe(false);
  });
});
