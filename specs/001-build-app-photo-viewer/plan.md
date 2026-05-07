# Implementation Plan: Photo Viewer App

**Branch**: `001-build-app-photo-viewer` | **Date**: 2026-05-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-build-app-photo-viewer/spec.md`

## Summary

Build a desktop-first web photo viewer that lets a user pick a local folder and browse its photos as a responsive thumbnail gallery, open any photo in a full-size view with zoom / pan / rotate, and run a configurable slideshow — all read-only with respect to source files. Technical approach: a single-page TypeScript + React app served as static assets, using the browser's File System Access API (with an `<input type="file" webkitdirectory>` fallback) to read folders client-side, `createImageBitmap` + an OffscreenCanvas worker for thumbnail generation and decoding off the UI thread, CSS transforms for zoom/pan/rotate, and `requestAnimationFrame` driven slideshow. No server, no uploads, no persistence of image content — aligning with the constitution's privacy and performance principles.

## Technical Context

**Language/Version**: TypeScript 5.4 (strict mode), targeting ES2022
**Primary Dependencies**: React 18, Vite 5 (build/dev server), Vitest (unit/integration tests), Playwright (e2e + a11y), `exifr` (EXIF metadata parsing). No image-decode libraries — rely on browser-native decoders via `createImageBitmap` / `<img>`.
**Storage**: None persisted. Source photos read on-demand from a user-selected local folder via the File System Access API (`window.showDirectoryPicker`) with `<input webkitdirectory>` fallback. Generated thumbnails kept only in an in-memory LRU cache for the session.
**Testing**: Vitest + React Testing Library for unit/component tests; Playwright for end-to-end flows, keyboard navigation, and axe-core accessibility checks; a small benchmark harness (Vitest + `performance.now`) for perf budget assertions.
**Target Platform**: Modern evergreen desktop browsers (Chrome 120+, Edge 120+, Firefox 121+, Safari 17+). Responsive layout supports tablet/mobile viewports as a nice-to-have. Reference hardware for performance budgets: a 4-core / 8 GB consumer laptop.
**Project Type**: Single-project web application (frontend only, no backend).
**Performance Goals**:
- First image visible from cold start: < 1.5 s (constitution II).
- Thumbnail grid scroll: sustained 60 FPS, no frame > 50 ms (constitution II).
- Full-resolution decode for active image: < 250 ms after selection (constitution II).
- Next/previous navigation perceived response: < 200 ms (SC-002).
**Constraints**:
- Must run entirely client-side; no network calls for image data or analytics (constitution IV).
- Must not modify, move, or delete source files (FR-015, SC-005).
- Must remain responsive while decoding very large photos (edge case): progressive low-res preview then full image.
- Must meet WCAG 2.1 AA for chrome, full keyboard operability, and respect `prefers-reduced-motion` (constitution V).
**Scale/Scope**: Designed for collections of up to ~500 photos with smooth scrolling (SC-003); graceful behavior beyond that via virtualized list. Roughly 15–20 React components, ~3 worker modules, ~10 service/hook modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. User-First Visual Experience | Full-size viewer is the central surface; chrome is dismissible (auto-hide controls); navigation primitives are predictable (next/prev, zoom, pan, fit, rotate, close). | PASS |
| II. Performance & Responsiveness | Decode + thumbnail generation moved to a Web Worker (OffscreenCanvas + `createImageBitmap`); virtualized gallery; perf budgets translated into automated assertions in Phase 1 contracts. | PASS |
| III. Test-First (NON-NEGOTIABLE) | Plan mandates Vitest/Playwright with TDD ordering; Phase 1 contracts define test surfaces (rendering correctness, navigation transitions, perf assertions) before implementation. | PASS |
| IV. Privacy & Data Stewardship | No backend, no telemetry containing paths or content, read-only access to user-granted folder, no automatic uploads. EXIF redaction not needed in v1 (no export feature). | PASS |
| V. Simplicity & Accessibility | Stack is intentionally minimal (React + Vite + native browser APIs). All controls keyboard reachable; AA contrast tokens defined; `prefers-reduced-motion` honored for slideshow transitions. | PASS |

**Initial gate**: PASS — no violations; Complexity Tracking section left empty.

**Post-Design re-check (after Phase 1)**: PASS — data model, contracts, and quickstart preserve the same boundaries; no additional dependencies introduced; performance budgets encoded as test contracts.

## Project Structure

### Documentation (this feature)

```text
specs/001-build-app-photo-viewer/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── ui-contracts.md
│   ├── keyboard-shortcuts.md
│   └── performance-budgets.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
photo-viewer/
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Gallery/
│   │   │   ├── Gallery.tsx
│   │   │   ├── ThumbnailTile.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── Viewer/
│   │   │   ├── PhotoViewer.tsx
│   │   │   ├── ViewerControls.tsx
│   │   │   ├── MetadataPanel.tsx
│   │   │   └── ErrorPlaceholder.tsx
│   │   ├── Slideshow/
│   │   │   ├── SlideshowController.tsx
│   │   │   └── SlideshowSettings.tsx
│   │   └── common/
│   │       ├── FolderPicker.tsx
│   │       ├── IconButton.tsx
│   │       └── KeyboardShortcutsHelp.tsx
│   ├── hooks/
│   │   ├── useCollection.ts
│   │   ├── useViewState.ts
│   │   ├── useSlideshow.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useReducedMotion.ts
│   ├── services/
│   │   ├── folderReader.ts        # File System Access API + webkitdirectory fallback
│   │   ├── photoLoader.ts         # createImageBitmap, error handling
│   │   ├── thumbnailCache.ts      # LRU in-memory cache
│   │   └── metadataReader.ts      # exifr wrapper
│   ├── workers/
│   │   ├── thumbnail.worker.ts    # OffscreenCanvas thumbnail generation
│   │   └── decode.worker.ts       # Off-thread full-res decode
│   ├── models/
│   │   ├── Photo.ts
│   │   ├── Collection.ts
│   │   ├── ViewState.ts
│   │   └── SlideshowSession.ts
│   ├── styles/
│   │   ├── tokens.css             # AA-contrast color tokens
│   │   └── globals.css
│   └── lib/
│       └── formatSupport.ts       # JPEG/PNG/GIF/WebP/BMP detection
└── tests/
    ├── unit/
    │   ├── models/
    │   ├── services/
    │   └── hooks/
    ├── integration/
    │   ├── gallery-flow.test.tsx
    │   ├── viewer-zoom-pan.test.tsx
    │   └── slideshow.test.tsx
    ├── contract/
    │   ├── keyboard-shortcuts.test.ts
    │   └── ui-contracts.test.ts
    ├── e2e/
    │   ├── core-flow.spec.ts
    │   ├── accessibility.spec.ts
    │   └── responsive.spec.ts
    ├── perf/
    │   ├── gallery-scroll.bench.ts
    │   ├── cold-start.bench.ts
    │   └── decode-latency.bench.ts
    └── fixtures/
        ├── valid/                 # JPEG/PNG/GIF/WebP/BMP samples
        ├── corrupt/
        └── unsupported/
```

**Structure Decision**: Single-project web app, organized by feature area (`Gallery`, `Viewer`, `Slideshow`) with cross-cutting `services`, `workers`, `hooks`, and `models` directories. Tests mirror source structure but are split by category (`unit`, `integration`, `contract`, `e2e`, `perf`) so the constitution's TDD and perf-budget requirements map onto distinct, individually runnable suites.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
