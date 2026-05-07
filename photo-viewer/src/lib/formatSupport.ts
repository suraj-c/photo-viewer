/**
 * Format detection by magic bytes (header sniff).
 *
 * Used by `services/folderReader.ts` to filter incoming `File` objects so the
 * gallery only contains images we can actually decode in the browser.
 *
 * Falls back to MIME-type inspection if magic-byte sniffing is not feasible
 * (e.g. very large files in a synchronous context). Never trusts the file
 * extension alone — that would let unsupported types slip past the gate.
 */

export type Format = 'jpeg' | 'png' | 'gif' | 'webp' | 'bmp' | 'unknown';

export const SUPPORTED_FORMATS: ReadonlyArray<Exclude<Format, 'unknown'>> = [
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
];

const SUPPORTED_MIME: Record<string, Exclude<Format, 'unknown'>> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/x-bmp': 'bmp',
};

const HEADER_BYTES = 16;

/**
 * Detect the format of a `File` by reading the first few bytes.
 *
 * Returns `'unknown'` if the magic bytes do not match a supported format
 * (or, in the synchronous fallback path, if the MIME type is also unknown).
 */
export async function detectFormat(file: File): Promise<Format> {
  // Fast path: trustworthy MIME first, but still verify with magic bytes
  // when available so a mis-typed file is still gated correctly.
  try {
    const slice = file.slice(0, HEADER_BYTES);
    const buf = new Uint8Array(await slice.arrayBuffer());
    const sniffed = sniffMagicBytes(buf);
    if (sniffed !== 'unknown') return sniffed;
  } catch {
    // fall through to MIME sniff
  }
  return detectFormatFromMime(file.type);
}

/** Synchronous MIME-only fallback (used in test harnesses and edge cases). */
export function detectFormatFromMime(mime: string | undefined | null): Format {
  if (!mime) return 'unknown';
  return SUPPORTED_MIME[mime.toLowerCase()] ?? 'unknown';
}

/** Pure helper: classify a header byte buffer. Exported for unit tests. */
export function sniffMagicBytes(bytes: Uint8Array): Format {
  if (bytes.length < 4) return 'unknown';

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }

  // GIF: "GIF87a" or "GIF89a"
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return 'gif';
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }

  // BMP: "BM"
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return 'bmp';

  return 'unknown';
}

export function isSupported(format: Format): format is Exclude<Format, 'unknown'> {
  return format !== 'unknown';
}
