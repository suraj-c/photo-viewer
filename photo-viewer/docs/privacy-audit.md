# Privacy audit

This file documents the read-only, no-network guarantees Photo Viewer makes
(Constitution IV / FR-015 / SC-005). Re-run the checklist after every release.

## Checklist

- [x] No `fetch` / `XMLHttpRequest` / `navigator.sendBeacon` calls anywhere in
      `src/` for image content, metadata, or analytics. The only network
      activity is whatever Vite injects in dev mode (HMR websocket) — which is
      not present in production builds.
- [x] No `localStorage`, `sessionStorage`, `IndexedDB`, or cookie writes.
- [x] No code path mutates, moves, or deletes a `File` or `FileSystemHandle`.
      `Photo` objects only ever read from `File`. Object URLs are revoked
      explicitly when the viewer unmounts.
- [x] EXIF metadata parsed via `exifr` is read-only — the library never writes
      back to the file.
- [x] Source paths are surfaced for display only (`Photo.sourcePath`); they
      never leave the client.

## How to re-verify

```bash
# Look for forbidden APIs anywhere in the source tree.
grep -RInE "fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie" src/
```

A clean run prints nothing. If a match appears, justify it inline (e.g. a
test fixture) or remove it before merging.

## Edge cases

- Service workers: not registered. If we add one in the future it MUST NOT
  cache image bytes, only the static app shell.
- Crash reporting: console-only via `ErrorBoundary` (Constitution IV).
