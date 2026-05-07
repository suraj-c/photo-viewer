# Phase 1 Data Model: Photo Viewer App

The viewer is read-only, fully client-side, and persists nothing to disk. All entities below live in memory for the duration of a session. They map directly to the "Key Entities" section of the spec and are referenced by the source modules in `src/models/`.

## Entity: Photo

Represents a single image item in the current collection.

| Field | Type | Source | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | generated | Stable identifier for keys/refs; not persisted. |
| `filename` | `string` | from File / handle | e.g., `IMG_0123.jpg`. |
| `sourcePath` | `string` | webkitRelativePath or directory handle path | Display only; never sent off-device. |
| `format` | `'jpeg' \| 'png' \| 'gif' \| 'webp' \| 'bmp' \| 'unknown'` | sniffed via `lib/formatSupport.ts` | `unknown` photos are filtered out before reaching the gallery (FR-012). |
| `fileSizeBytes` | `number` | `File.size` | Surfaced in metadata panel (FR-011). |
| `lastModified` | `number` (epoch ms) | `File.lastModified` | Used as fallback when EXIF capture date absent. |
| `dimensions` | `{ width: number; height: number } \| null` | populated after first decode | `null` until probed; metadata panel shows `—` while null. |
| `captureDate` | `Date \| null` | `exifr` parse | Optional (FR-011 — show when available). |
| `thumbnailBitmap` | `ImageBitmap \| null` | `thumbnail.worker.ts` | Cleared by LRU cache when evicted. |
| `loadStatus` | `'pending' \| 'ready' \| 'error'` | derived | Drives `ErrorPlaceholder` and skip-on-navigate behavior. |
| `errorMessage` | `string \| null` | when `loadStatus === 'error'` | User-facing reason for the placeholder. |

**Validation rules**
- `format` MUST be one of the supported values for the photo to enter the collection (FR-003, FR-012).
- `dimensions.width` and `dimensions.height` MUST be positive integers when set.
- `loadStatus` transitions are one-way: `pending → ready` or `pending → error`. Re-load attempts produce a fresh `Photo` instance.

**Read-only invariants** (Constitution IV, FR-015, SC-005)
- The app never writes to or deletes the underlying file represented by a `Photo`.
- `sourcePath` is never logged, transmitted, or persisted to storage.

## Entity: Collection

An ordered list of `Photo` objects derived from a chosen source folder.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (UUID) | Identifies a folder selection session. |
| `folderName` | `string` | Display label for the picker / breadcrumb. |
| `photos` | `Photo[]` | Ordered; default order is filename ascending (case-insensitive, locale-aware). |
| `total` | `number` | `photos.length`; cached for cheap reads. |
| `loadedAt` | `Date` | Used by "refresh" affordance (edge case: folder changed since open). |
| `unsupportedCount` | `number` | Files seen but excluded by format check (informational only). |

**Validation rules**
- A `Collection` MUST contain at least zero `Photo` objects; an empty collection triggers `EmptyState` (FR-012, edge cases).
- `photos` ordering is stable for the lifetime of a `Collection` — view-state navigation depends on stable indices.

**Operations**
- `at(index)`: bounds-checked accessor.
- `next(currentIndex)` / `prev(currentIndex)`: returns the next non-error photo, or `null` if at boundary (FR-005, edge case "navigate past first/last").
- `refresh()`: produces a new `Collection` from the same handle/file list; the old one is discarded.

## Entity: ViewState

Transient per-session state for the photo currently open in the full-size viewer.

| Field | Type | Default | Notes |
|---|---|---|---|
| `photoId` | `string` | required | Foreign key to a `Photo` in the active `Collection`. |
| `scale` | `number` | `1` (fit-to-screen) | Range `[FIT_SCALE, MAX_SCALE]`; FIT_SCALE is computed per photo to fit viewport. |
| `translateX` | `number` (px) | `0` | Clamped so the image edge cannot recede past the viewport edge. |
| `translateY` | `number` (px) | `0` | Same clamp as `translateX`. |
| `rotationDeg` | `0 \| 90 \| 180 \| 270` | `0` | 90° increments only (FR-009). |
| `controlsVisible` | `boolean` | `true` | Auto-hides after 2 s of pointer inactivity (Constitution I — chrome dismissible). |

**State transitions**
- Selecting a different `Photo` resets `ViewState` to defaults (FR / spec: "switching to another photo resets view state to defaults").
- Activating "fit to screen" sets `scale = FIT_SCALE`, `translateX = 0`, `translateY = 0` (rotation preserved).
- Rotation never modifies the source `Photo`; it only updates `rotationDeg`.

**Validation rules**
- `scale > 0` always.
- `rotationDeg` MUST be one of `0 | 90 | 180 | 270`. Other values are coerced via `((deg % 360) + 360) % 360` and rounded to the nearest multiple of 90.
- Pan clamping ensures the image always covers the viewport at scales ≥ FIT_SCALE.

## Entity: SlideshowSession

Transient mode tied to a `Collection`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `collectionId` | `string` | required | Tied to the active collection at start time. |
| `intervalSeconds` | `number` | `5` | Range `[1, 60]` (spec assumptions). |
| `status` | `'running' \| 'paused' \| 'stopped'` | `'stopped'` | Emitted to UI for indicator + control state. |
| `currentIndex` | `number` | `0` | Index into `Collection.photos`; advances by `+1`, wraps back to `0` at the end. |
| `startedAt` | `Date \| null` | `null` | For diagnostics / e2e assertions. |
| `lastAdvancedAt` | `Date \| null` | `null` | Used to derive remaining time after pause/resume. |

**State transitions**
- `stopped → running`: sets `startedAt`, schedules first advance at `intervalSeconds`.
- `running → paused`: cancels the pending advance, retains `currentIndex`.
- `paused → running`: re-arms an advance for the remainder of the interval.
- `running | paused → stopped`: clears scheduled advances, resets `startedAt` and `lastAdvancedAt`, returns control to the prior view (gallery or full-size).

**Validation rules**
- `intervalSeconds` MUST satisfy `1 ≤ intervalSeconds ≤ 60`; values out of range are clamped on input and a hint is shown.
- A slideshow MUST NOT advance past corrupted photos; instead it logs (in-memory only) and skips to the next valid one (Constitution: graceful degradation; spec edge case).

## Cross-cutting rules

1. **No persistence**: none of the entities are serialized to `localStorage`, `IndexedDB`, cookies, or the network. They live for the session only (Constitution IV).
2. **No source mutation**: no entity exposes a method that writes to the underlying `File` / file handle (FR-015, SC-005).
3. **Bounded memory**: `thumbnailBitmap` references are owned by an LRU cache (`thumbnailCache.ts`) sized to the visible window plus a small look-ahead buffer; eviction nulls the field on the `Photo`.
4. **Identity**: `id` fields are session-scoped UUIDs; they are never logged or transmitted.
