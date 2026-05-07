# UI Contracts

These are the externally observable behaviors of the photo viewer's UI surface. They are the test targets for the `contract` and `integration` suites and SHOULD have a failing test written before the corresponding implementation (Constitution III).

## C-UI-1: Folder selection

- **Trigger**: User activates the "Open folder" affordance.
- **Behavior**:
  1. The browser folder picker opens (File System Access API) or the directory file input is invoked (fallback).
  2. On selection, a `Collection` is constructed by sniffing each file's format; unsupported files are excluded silently and counted in `unsupportedCount`.
  3. The gallery view becomes the visible surface within 500 ms of selection.
- **Failure modes**:
  - Permission denied → toast: "Couldn't read that folder. Please choose another or grant permission."
  - Empty supported set → `EmptyState` is shown with action to choose another folder (FR-012, edge cases).

## C-UI-2: Gallery rendering

- **Trigger**: A non-empty `Collection` is active.
- **Behavior**:
  1. A responsive grid of thumbnails renders, with `Photo.filename` as the accessible name on each tile.
  2. Tiles outside the viewport are not painted (`content-visibility: auto`) and their `thumbnailBitmap` may be lazily produced.
  3. Hovering (or long-pressing on touch) a tile reveals the filename caption (FR-002).
  4. Activating a tile (click / `Enter` / `Space`) opens the full-size viewer for that photo and remembers the scroll position.

## C-UI-3: Full-size viewer

- **Trigger**: A `Photo` is selected.
- **Behavior**:
  1. The active photo renders preserving aspect ratio (FR-004), centered and fitted to the viewport.
  2. Controls bar (next, previous, zoom in/out, fit, rotate left/right, info, close) is visible on entry and auto-hides after 2 s of pointer inactivity; any pointer or key event re-shows it (Constitution I).
  3. While decoding is in progress, a low-res preview (downscaled bitmap) is shown first; the full-resolution image swaps in upon decode completion (edge case: very large photos).
  4. On decode failure, an `ErrorPlaceholder` replaces the image area; next/previous remain operable.

## C-UI-4: Navigation between photos

- **Trigger**: User activates next/previous (button or keyboard).
- **Behavior**:
  1. Adjacent photo is shown; `ViewState` resets to defaults.
  2. At collection boundaries, the corresponding control is disabled and announces "first photo" / "last photo" (FR / edge case).
  3. Perceived response is < 200 ms (SC-002) — see `performance-budgets.md`.

## C-UI-5: Zoom / pan / rotate

- **Trigger**: User activates a zoom, pan, or rotate control (button, keyboard, wheel, or drag).
- **Behavior**:
  1. The image transforms accordingly via a single CSS `transform` update; no re-decode occurs.
  2. Zoom level indicator updates and remains visible while controls are visible.
  3. Pan is clamped to image edges at the current scale; out-of-bounds drags don't translate beyond the clamp.
  4. "Fit to screen" returns `scale`, `translateX`, `translateY` to defaults while preserving `rotationDeg`.
  5. Rotation snaps to 90° increments (FR-009) and never writes back to the source file (FR-015).

## C-UI-6: Metadata panel

- **Trigger**: User toggles the info affordance.
- **Behavior**:
  1. Panel shows `filename`, `dimensions` (or `—` if not yet known), `fileSizeBytes` (formatted), and `captureDate` if available (FR-011).
  2. No fields beyond those four are shown in v1.
  3. Closing the panel does not affect `ViewState`.

## C-UI-7: Slideshow

- **Trigger**: User starts the slideshow from the gallery or full-size viewer.
- **Behavior**:
  1. Photos auto-advance at `intervalSeconds` (default 5; range 1–60).
  2. Pause halts auto-advance; resume re-arms with the remaining time of the current interval.
  3. Stop returns to the prior view (gallery or full-size at the photo where the user started).
  4. When `prefers-reduced-motion: reduce` is set, transitions are instant cuts rather than cross-fades (Constitution V).
  5. Corrupt/unsupported photos in the path are skipped without halting the slideshow.

## C-UI-8: Empty / error states

- **Empty collection**: A friendly empty-state message with a "Choose another folder" CTA.
- **Per-photo error**: `ErrorPlaceholder` tile in the gallery and `ErrorPlaceholder` view in the full-size viewer; navigation continues past it (SC-006).
- **Permission error**: Toast describes the cause; the previous view remains intact.

## C-UI-9: Responsive layout

- **Behavior**: At any viewport ≥ 320 px wide, no horizontal scrolling; the gallery reflows to the available width; the viewer chrome collapses sensibly on narrow widths (FR-017).

## C-UI-10: Privacy

- **Behavior**: From folder selection through slideshow exit, the app issues zero network requests for image data, image metadata, or analytics (Constitution IV). This is asserted by an integration test that fails on any unexpected `fetch` / `XHR`.
