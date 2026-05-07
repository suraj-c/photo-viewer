/**
 * folderReader — pick a local folder and return a list of `File`s filtered to
 * supported image formats, plus a count of unsupported files seen.
 *
 * Strategy:
 *  1. Prefer the File System Access API (`window.showDirectoryPicker`) where
 *     available — Chromium-family browsers.
 *  2. Fall back to a hidden `<input type="file" webkitdirectory>` for Firefox
 *     and Safari, which still gives us a `FileList` of every file in the
 *     chosen directory tree.
 *
 * Privacy: this service never logs, persists, or transmits paths or file
 * contents (Constitution IV). It simply hands `File` objects to in-memory
 * consumers.
 */

import { detectFormat, isSupported } from '../lib/formatSupport';

export interface ReadFolderResult {
  folderName: string;
  files: File[];
  unsupportedCount: number;
}

export class FolderPickError extends Error {
  constructor(
    public readonly reason: 'cancelled' | 'permission-denied' | 'unsupported-browser' | 'unknown',
    message: string,
  ) {
    super(message);
    this.name = 'FolderPickError';
  }
}

/** Test seam: components/tests can substitute a mock picker. */
export interface FolderReader {
  pick(): Promise<ReadFolderResult>;
}

export const realFolderReader: FolderReader = { pick: pickFolder };

export async function pickFolder(): Promise<ReadFolderResult> {
  // Path 1: File System Access API
  const showDirectoryPicker = (window as unknown as {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }).showDirectoryPicker;

  if (typeof showDirectoryPicker === 'function') {
    try {
      const handle = await showDirectoryPicker();
      return readFromDirectoryHandle(handle);
    } catch (err) {
      throw mapPickError(err);
    }
  }

  // Path 2: webkitdirectory fallback
  return pickViaInputFallback();
}

async function readFromDirectoryHandle(
  handle: FileSystemDirectoryHandle,
): Promise<ReadFolderResult> {
  const files: File[] = [];
  let unsupported = 0;

  // Note: we walk only the top level by default — the spec scopes "the chosen
  // folder" to a single directory. Sub-folder support can be added later
  // without breaking this contract.
  // @ts-expect-error -- `entries()` is async-iterable in supporting browsers.
  for await (const [, entry] of handle.entries()) {
    if (entry.kind !== 'file') continue;
    try {
      const file: File = await (entry as FileSystemFileHandle).getFile();
      const fmt = await detectFormat(file);
      if (isSupported(fmt)) {
        files.push(file);
      } else {
        unsupported += 1;
      }
    } catch {
      unsupported += 1;
    }
  }

  files.sort(byFilename);
  return { folderName: handle.name, files, unsupportedCount: unsupported };
}

function pickViaInputFallback(): Promise<ReadFolderResult> {
  return new Promise<ReadFolderResult>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    // `webkitdirectory` works in Chromium, Firefox, and Safari today.
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.multiple = true;
    input.style.display = 'none';

    let settled = false;
    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    input.addEventListener(
      'change',
      async () => {
        settled = true;
        try {
          const fileList = input.files ? Array.from(input.files) : [];
          const supported: File[] = [];
          let unsupported = 0;
          for (const file of fileList) {
            const fmt = await detectFormat(file);
            if (isSupported(fmt)) supported.push(file);
            else unsupported += 1;
          }
          supported.sort(byFilename);
          const folderName = inferFolderName(fileList);
          resolve({ folderName, files: supported, unsupportedCount: unsupported });
        } catch (err) {
          reject(mapPickError(err));
        } finally {
          cleanup();
        }
      },
      { once: true },
    );

    // Detect a cancelled picker via focus-without-change. Cancellation in
    // browsers is silent so we use a defer + checking files after focus.
    const onFocus = () => {
      // Give the change event a chance to fire first.
      setTimeout(() => {
        if (!settled) {
          cleanup();
          reject(new FolderPickError('cancelled', 'Folder selection was cancelled.'));
        }
        window.removeEventListener('focus', onFocus);
      }, 250);
    };
    window.addEventListener('focus', onFocus);

    document.body.appendChild(input);
    input.click();
  });
}

function inferFolderName(files: File[]): string {
  const first = files[0] as (File & { webkitRelativePath?: string }) | undefined;
  const rel = first?.webkitRelativePath ?? '';
  const top = rel.split('/')[0];
  return top || 'Selected folder';
}

function byFilename(a: File, b: File): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
}

function mapPickError(err: unknown): FolderPickError {
  if (err instanceof FolderPickError) return err;
  if (err && typeof err === 'object' && 'name' in err) {
    const name = (err as { name: string }).name;
    if (name === 'AbortError') {
      return new FolderPickError('cancelled', 'Folder selection was cancelled.');
    }
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return new FolderPickError(
        'permission-denied',
        "Couldn't read that folder. Please choose another or grant permission.",
      );
    }
  }
  return new FolderPickError('unknown', 'Unable to open folder picker.');
}
