# Browser support

| Browser | Min version | Notes |
| --- | --- | --- |
| Chrome / Edge / Brave (Chromium) | 120 | Full File System Access API. |
| Firefox | 121 | Uses the `<input webkitdirectory>` fallback. |
| Safari | 17 | Uses the `<input webkitdirectory>` fallback. |

## Known platform-specific notes

- **Safari**: the picker fallback opens a file dialog rather than a folder
  dialog. Users can ⌘-click multiple files; a real folder requires Chromium
  for now.
- **Firefox**: `OffscreenCanvas` and `createImageBitmap` are both available;
  the worker pipeline runs as on Chromium. The `prefers-reduced-motion`
  media query is fully supported.
- **iOS / Android**: the responsive layout works, but folder selection on
  iOS is restricted to the system Photos provider; the gallery experience
  there is a nice-to-have rather than a target.

Run the quickstart in `README.md` on each browser and update this doc when
a regression is found.
