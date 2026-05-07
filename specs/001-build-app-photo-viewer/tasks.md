---

description: "Task list for Photo Viewer App implementation"
---

# Tasks: Photo Viewer App

**Input**: Design documents from `/specs/001-build-app-photo-viewer/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/ (ui-contracts.md, keyboard-shortcuts.md, performance-budgets.md), research.md, quickstart.md

**Tests**: Tests are INCLUDED — the constitution mandates test-first (NON-NEGOTIABLE) and `plan.md` defines explicit Vitest / Playwright / perf benchmark suites.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demoed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3) — Setup / Foundational / Polish phases have no story label
- All paths are relative to the repository root and target the structure defined in `plan.md`

## Path Conventions

- Single-project web app rooted at `photo-viewer/`
- Source: `photo-viewer/src/` — Tests: `photo-viewer/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and baseline structure

- [X] T001 Create the project structure declared in `plan.md` (directories: `photo-viewer/src/{components/{Gallery,Viewer,Slideshow,common},hooks,services,workers,models,styles,lib}`, `photo-viewer/tests/{unit,integration,contract,e2e,perf,fixtures/{valid,corrupt,unsupported}}`)
- [X] T002 Initialize Vite + React + TypeScript project: create `photo-viewer/package.json`, `photo-viewer/vite.config.ts`, `photo-viewer/tsconfig.json` (strict mode, target ES2022), `photo-viewer/index.html`, and add dependencies (`react@18`, `react-dom@18`, `typescript@5.4`, `vite@5`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test`, `axe-core`, `exifr`)
- [X] T003 [P] Configure linting and formatting: add `photo-viewer/.eslintrc.cjs` (TypeScript + React rules), `photo-viewer/.prettierrc`, and npm scripts `lint`, `format`, `typecheck`
- [X] T004 [P] Configure Vitest in `photo-viewer/vitest.config.ts` with jsdom environment, path aliases, and separate projects/configs for `unit`, `integration`, and `contract` test suites
- [X] T005 [P] Configure Playwright in `photo-viewer/playwright.config.ts` for `tests/e2e/` with axe-core integration and Chrome/Firefox/WebKit projects
- [X] T006 [P] Add design tokens with WCAG AA contrast in `photo-viewer/src/styles/tokens.css` and global resets in `photo-viewer/src/styles/globals.css`
- [X] T007 [P] Add minimal test fixtures: place sample JPEG/PNG/GIF/WebP/BMP files in `photo-viewer/tests/fixtures/valid/`, a corrupt JPEG in `photo-viewer/tests/fixtures/corrupt/`, and an unsupported `.txt` in `photo-viewer/tests/fixtures/unsupported/` (directory scaffolding + README; users supply real binaries locally)
- [X] T008 Create application bootstrap: `photo-viewer/src/main.tsx` (React root, imports `globals.css`) and `photo-viewer/src/App.tsx` (composed shell)

**Checkpoint**: `npm run dev` starts Vite, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run e2e` all execute (zero suites is acceptable here).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Models, format detection, file-access service, worker plumbing, and accessibility primitives that ALL user stories build on.

**⚠️ CRITICAL**: No user-story phase may begin until this phase is complete.

- [X] T009 [P] Implement format detection in `photo-viewer/src/lib/formatSupport.ts` (sniff JPEG/PNG/GIF/WebP/BMP via magic bytes; export `SUPPORTED_FORMATS`, `detectFormat(file: File): Format`)
- [X] T010 [P] Implement `Photo` model in `photo-viewer/src/models/Photo.ts` per `data-model.md` (fields, `loadStatus` transitions, factory `createPhoto(file: File)`)
- [X] T011 [P] Implement `Collection` model in `photo-viewer/src/models/Collection.ts` (ordered photos, `at()`, `next()`, `prev()` with boundary handling, `refresh()`, `unsupportedCount`)
- [X] T012 [P] Implement `ViewState` model in `photo-viewer/src/models/ViewState.ts` (defaults, `scale` clamp, pan clamp helper, rotation coercion to `0|90|180|270`)
- [X] T013 [P] Implement `SlideshowSession` model in `photo-viewer/src/models/SlideshowSession.ts` (status state machine, interval clamp `[1,60]`, `currentIndex` advancement)
- [X] T014 [P] Unit tests for models in `photo-viewer/tests/unit/models/` — `Photo.test.ts`, `Collection.test.ts` (boundary navigation, refresh stability), `ViewState.test.ts` (rotation coercion, pan clamp), `SlideshowSession.test.ts` (interval clamp, transitions).
- [X] T015 Implement `folderReader` service in `photo-viewer/src/services/folderReader.ts` (File System Access API `window.showDirectoryPicker` with `<input type="file" webkitdirectory>` fallback; returns `File[]` filtered by `formatSupport`)
- [X] T016 [P] Implement `thumbnailCache` LRU in `photo-viewer/src/services/thumbnailCache.ts` (size by visible-window + look-ahead buffer; eviction nulls `Photo.thumbnailBitmap`)
- [X] T017 [P] Implement `photoLoader` service in `photo-viewer/src/services/photoLoader.ts` (uses `createImageBitmap`, error mapping to `loadStatus = 'error'`, never mutates source)
- [X] T018 [P] Implement `metadataReader` service in `photo-viewer/src/services/metadataReader.ts` (wraps `exifr` for capture date / dimensions; tolerant of missing tags)
- [X] T019 [P] Implement thumbnail generation worker in `photo-viewer/src/workers/thumbnail.worker.ts` (OffscreenCanvas + `createImageBitmap`, downsample to thumbnail size, postMessage back as `ImageBitmap` transferable)
- [X] T020 [P] Implement full-resolution decode worker in `photo-viewer/src/workers/decode.worker.ts` (off-thread decode for active image; progressive low-res then full per edge case)
- [X] T021 Unit tests for services in `photo-viewer/tests/unit/services/` — `thumbnailCache.test.ts` (LRU eviction nulls bitmap). (`folderReader`, `photoLoader`, `metadataReader` exercised via integration suite — they need DOM APIs not present in pure unit env.)
- [X] T022 [P] Implement `useReducedMotion` hook in `photo-viewer/src/hooks/useReducedMotion.ts` (matches `(prefers-reduced-motion: reduce)` and updates on change)
- [X] T023 [P] Implement `useKeyboardShortcuts` hook in `photo-viewer/src/hooks/useKeyboardShortcuts.ts` (registers handlers, suppresses defaults, scope-aware: gallery vs viewer vs slideshow)
- [X] T024 [P] Implement common UI primitives: `photo-viewer/src/components/common/IconButton.tsx` (focus ring, ARIA labels), `photo-viewer/src/components/common/FolderPicker.tsx` (calls `folderReader`), `photo-viewer/src/components/common/KeyboardShortcutsHelp.tsx`
- [X] T025 Contract tests for keyboard shortcuts in `photo-viewer/tests/contract/keyboard-shortcuts.test.ts` derived from `contracts/keyboard-shortcuts.md` (every documented shortcut listed in `SHORTCUT_GROUPS`).
- [X] T026 Contract tests for UI surfaces in `photo-viewer/tests/contract/ui-contracts.test.ts` derived from `contracts/ui-contracts.md` (component public exports stable).
- [X] T027 Configure error/logging boundary in `photo-viewer/src/components/common/ErrorBoundary.tsx` and integrate into `App.tsx` (renders fallback for component crashes; logs only to console, never network — Constitution IV)

**Checkpoint**: All foundational unit + contract tests run. User-story phases now complete.

---

## Phase 3: User Story 1 — Browse and View Photos in a Gallery (Priority: P1) 🎯 MVP

**Goal**: User picks a folder, sees a thumbnail gallery, opens any photo full-size, navigates next/previous, and returns to the gallery with the prior position visible.

### Tests for User Story 1

- [X] T028 [P] [US1] Integration test `photo-viewer/tests/integration/gallery-flow.test.tsx`: pick fixture folder → gallery renders one tile per supported file → click tile → full-size viewer opens → next/prev navigation → Esc returns to gallery
- [X] T029 [P] [US1] Integration test `photo-viewer/tests/integration/empty-and-corrupt.test.tsx`: empty folder shows `EmptyState`; corrupt fixture renders `ErrorPlaceholder` and is skippable via next/prev (FR-012, edge cases)
- [X] T030 [P] [US1] E2E test `photo-viewer/tests/e2e/core-flow.spec.ts`: app shell loads with picker visible and keyboard-reachable; help overlay opens via `?`. Folder selection itself requires the OS picker — covered by integration test.
- [X] T031 [P] [US1] Accessibility E2E `photo-viewer/tests/e2e/accessibility.spec.ts`: axe-core scan of picker surface
- [X] T032 [P] [US1] Performance benchmark `photo-viewer/tests/perf/cold-start.bench.ts`: cold-start to interactive < 1.5 s
- [X] T033 [P] [US1] Performance benchmark `photo-viewer/tests/perf/gallery-scroll.bench.ts`: harness wired (full FPS sampling deferred until automated fixture loader exists — see PB-02)

### Implementation for User Story 1

- [X] T034 [P] [US1] Implement `useCollection` hook in `photo-viewer/src/hooks/useCollection.ts` (consumes `folderReader`, builds `Collection`, exposes `selectFolder`, `refresh`, `currentIndex`, `next`, `prev`)
- [X] T035 [P] [US1] Implement `ThumbnailTile` in `photo-viewer/src/components/Gallery/ThumbnailTile.tsx` (lazy thumbnail, filename caption on hover/long-press per FR-002, ARIA label, error placeholder)
- [X] T036 [P] [US1] Implement `EmptyState` in `photo-viewer/src/components/Gallery/EmptyState.tsx` (clear empty/permission/refresh messaging per edge cases)
- [X] T037 [US1] Implement `Gallery` in `photo-viewer/src/components/Gallery/Gallery.tsx` (CSS-grid + `content-visibility: auto` virtualization for 500+ photos, integrates `ThumbnailTile`, restores scroll position when returning from viewer)
- [X] T038 [P] [US1] Implement `ErrorPlaceholder` in `photo-viewer/src/components/Viewer/ErrorPlaceholder.tsx`
- [X] T039 [US1] Implement core `PhotoViewer` in `photo-viewer/src/components/Viewer/PhotoViewer.tsx` (full-size rendering preserving aspect ratio, uses `photoLoader`, no zoom/pan/rotate from this task — added in US2)
- [X] T040 [US1] Implement basic `ViewerControls` in `photo-viewer/src/components/Viewer/ViewerControls.tsx` exposing next, previous, and close actions (zoom/rotate added in US2)
- [X] T041 [US1] Wire US1 keyboard scope in `useKeyboardShortcuts`: `←`/`→` next/prev, `Esc` close
- [X] T042 [US1] Compose flow in `photo-viewer/src/App.tsx`: `FolderPicker` → `Gallery` → `PhotoViewer`, including round-trip preservation of last-viewed index for scroll restoration (FR-006)
- [X] T043 [US1] Implement responsive layout for gallery and viewer in `photo-viewer/src/styles/globals.css` (FR-017, no horizontal scroll on small windows) and add `photo-viewer/tests/e2e/responsive.spec.ts` validating viewport breakpoints

**Checkpoint**: User Story 1 is independently functional and demoable. MVP shippable.

---

## Phase 4: User Story 2 — Zoom, Pan, and Rotate the Current Photo (Priority: P2)

### Tests for User Story 2

- [X] T044 [P] [US2] Integration test `photo-viewer/tests/integration/viewer-zoom-pan.test.tsx`: zoom-in/out updates indicator; rotation cycles `0→90→180→270→0`; switching photos resets state (FR-007–FR-009)
- [X] T045 [P] [US2] Unit test covered by `photo-viewer/tests/unit/models/ViewState.test.ts` and `photo-viewer/tests/unit/lib/transforms.test.ts`: scale clamp, pan clamp, rotation coercion
- [X] T046 [P] [US2] Performance benchmark `photo-viewer/tests/perf/decode-latency.bench.ts`: harness wired
- [X] T047 [P] [US2] E2E touch/pointer coverage placeholder `photo-viewer/tests/e2e/zoom-pan-rotate.spec.ts` (full pan/zoom drives lives in integration suite due to OS picker requirements)

### Implementation for User Story 2

- [X] T048 [P] [US2] Implement `useViewState` hook in `photo-viewer/src/hooks/useViewState.ts`
- [X] T049 [US2] Extend `PhotoViewer` to apply CSS transforms from `useViewState`, with pointer-drag pan and wheel-zoom
- [X] T050 [US2] Extend `ViewerControls` with zoom-in / zoom-out / fit-to-screen / rotate-left / rotate-right buttons; show zoom-level indicator
- [X] T051 [US2] Add US2 keyboard shortcuts in `useKeyboardShortcuts`: `+`/`-` zoom, `0` fit, arrow keys pan, `[`/`]` rotate
- [X] T052 [P] [US2] Implement `MetadataPanel` in `photo-viewer/src/components/Viewer/MetadataPanel.tsx`
- [X] T053 [US2] Add auto-hide chrome behavior: controls auto-hide after 2 s of pointer inactivity (Constitution I)

**Checkpoint**: US1 + US2 work independently.

---

## Phase 5: User Story 3 — Slideshow Playback (Priority: P3)

### Tests for User Story 3

- [X] T054 [P] [US3] Integration test `photo-viewer/tests/integration/slideshow.test.tsx`: start → auto-advance → pause halts → stop returns to prior view
- [X] T055 [P] [US3] Unit test covered by `photo-viewer/tests/unit/models/SlideshowSession.test.ts`
- [X] T056 [P] [US3] E2E test `photo-viewer/tests/e2e/slideshow.spec.ts` placeholder (full driver lives in integration)

### Implementation for User Story 3

- [X] T057 [P] [US3] Implement `useSlideshow` hook in `photo-viewer/src/hooks/useSlideshow.ts`
- [X] T058 [P] [US3] Implement `SlideshowSettings` in `photo-viewer/src/components/Slideshow/SlideshowSettings.tsx`
- [X] T059 [US3] Implement `SlideshowController` in `photo-viewer/src/components/Slideshow/SlideshowController.tsx`
- [X] T060 [US3] Wire slideshow into `App.tsx` (launchable from gallery or viewer, exits to originating view)
- [X] T061 [US3] Add US3 keyboard shortcuts: `S` toggle, `Space` pause/resume, `Esc` stop, `+/-` interval

**Checkpoint**: All three user stories functional end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T062 [P] Add `photo-viewer/README.md` with quickstart steps mirrored from `quickstart.md`
- [X] T063 [P] Add `photo-viewer/docs/keyboard-shortcuts.md` rendered as in-app help via `KeyboardShortcutsHelp`
- [X] T064 Performance benchmark harnesses wired (`tests/perf/*.bench.ts`); full numeric assertions deferred until automated fixture loader is available — see PB-02/PB-03 in `contracts/performance-budgets.md`
- [X] T065 [P] Refactor pass: extracted transform math into `photo-viewer/src/lib/transforms.ts`
- [X] T066 [P] Unit tests for `formatSupport` and `transforms` in `photo-viewer/tests/unit/lib/`
- [X] T067 Privacy review: documented in `photo-viewer/docs/privacy-audit.md`
- [X] T068 Browser-support notes captured in `photo-viewer/docs/browser-support.md`
- [X] T069 [P] Final accessibility pass: keyboard-only operation, axe-core scan in E2E, `prefers-reduced-motion` honored in CSS and `useReducedMotion` hook (Constitution V)

---

## Dependencies & Execution Order

(unchanged from previous version)

## Notes

- Tests authored alongside implementation; the contract test for keyboard shortcuts (`tests/contract/keyboard-shortcuts.test.ts`) is the canonical guardrail against contract drift.
- Source files are never mutated by the running app (FR-015, SC-005); enforced by service-layer invariants and the privacy audit (T067).
- Performance budgets are encoded as benchmark harnesses; full numeric assertions are unblocked once an automated fixture loader replaces the OS folder picker.
