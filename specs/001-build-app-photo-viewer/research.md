# Phase 0 Research: Photo Viewer App

All `NEEDS CLARIFICATION` markers from the initial Technical Context have been resolved below. Each entry documents the decision, the rationale, and the alternatives considered.

## 1. Language, framework, and build tool

- **Decision**: TypeScript 5.4 (strict) + React 18 + Vite 5.
- **Rationale**:
  - TypeScript with strict mode catches the kind of subtle state-management bugs (zoom math, slideshow indexing) that cause visual regressions, supporting Constitution III (test-first / safety).
  - React's component model maps cleanly onto the three feature surfaces (Gallery, Viewer, Slideshow) and has first-class testing libraries (Vitest + React Testing Library).
  - Vite gives sub-second HMR for tight TDD loops and a small, modern production bundle, supporting performance budget I.
- **Alternatives considered**:
  - *SvelteKit*: smaller runtime, but team familiarity and ecosystem of accessible component testing tooling for React tipped the balance.
  - *Plain TypeScript + lit-html*: lower abstraction, but more boilerplate for state and accessibility patterns we already need.
  - *Next.js*: adds SSR/server features irrelevant to a fully client-side, privacy-first viewer (Constitution IV).

## 2. Folder access strategy

- **Decision**: Primary: File System Access API (`window.showDirectoryPicker`). Fallback: `<input type="file" webkitdirectory multiple>`.
- **Rationale**:
  - File System Access API is available in Chromium-based browsers and provides directory handles without copying file data, satisfying privacy (read-only, in-place) and performance (no upload).
  - `webkitdirectory` input is broadly supported (including Safari/Firefox) and exposes a `FileList` of `File` objects without copying — sufficient for a read-only viewer.
- **Alternatives considered**:
  - *Drag-and-drop only*: insufficient discoverability for SC-001 (under-15s first-photo flow); kept as an additive entry point, not the primary.
  - *Server-side upload*: violates Constitution IV (privacy) and adds infrastructure for no user benefit.

## 3. Image decoding and thumbnailing

- **Decision**: Use `createImageBitmap(file, { resizeWidth, resizeHeight, resizeQuality: 'high' })` inside a dedicated Web Worker (`thumbnail.worker.ts`) for thumbnail generation; for the active full-size photo, decode via `createImageBitmap` in `decode.worker.ts` and transfer the bitmap to the main thread for rendering on a `<canvas>` (or fallback `<img>` element if the bitmap path is unavailable).
- **Rationale**:
  - Browser-native decoders are the fastest, most format-correct option, and avoid bundling a third-party decoder (Constitution: dependency surface area).
  - Workers keep heavy work off the UI thread, directly addressing Constitution II's 60 FPS scroll budget and the 250 ms decode budget.
  - `resizeWidth/Height` enables one-pass downscaling without an intermediate full decode, which is critical for "tens of megapixels" edge case.
- **Alternatives considered**:
  - *`<img>` with `loading="lazy"` only*: simpler, but full decode runs on the main thread and breaks the scroll-FPS budget for very large images.
  - *WASM decoders (e.g., `@jsquash/jpeg`)*: extra bundle size and slower than native decoders for the formats we support.

## 4. Gallery virtualization

- **Decision**: Implement a small custom windowed grid using `IntersectionObserver` + CSS `content-visibility: auto`, sized for a target of 500+ thumbnails.
- **Rationale**:
  - Avoids adding a heavy dependency; the requirement (a single-axis virtual grid) is small.
  - `content-visibility: auto` provides cheap layout/paint skipping for off-screen tiles — directly supports SC-003 (smooth scroll at 500 photos).
- **Alternatives considered**:
  - *react-window / react-virtuoso*: capable, but adds dependency surface area for a feature we can express in <150 LOC.
  - *No virtualization*: fails the 60 FPS budget for collections in the hundreds.

## 5. Zoom, pan, and rotation model

- **Decision**: Represent View State as `{ scale, translateX, translateY, rotationDeg }` and apply a single CSS `transform: translate(...) rotate(...) scale(...)` to the active image container. Pan is clamped to image edges in screen-space at the current scale.
- **Rationale**:
  - GPU-composited transforms keep zoom/pan smooth and preserve full image fidelity (no re-decode per zoom step), satisfying Constitution I and II.
  - A single transform string makes the math testable in isolation (`unit/services/transform.ts`).
- **Alternatives considered**:
  - *Canvas-based custom renderer*: more control but adds complexity (custom hit-testing, accessibility loss). Not justified for v1 scope.
  - *Re-decoding at higher zoom*: better fidelity at extreme zoom but breaks the perf budget; v1 caps zoom at a level where perceived quality is acceptable.

## 6. Slideshow timing

- **Decision**: Drive auto-advance with `setTimeout` re-armed on each transition, scheduled via `requestAnimationFrame` to avoid drift while a tab is throttled. Default interval 5 s, configurable 1–60 s (per spec assumptions).
- **Rationale**:
  - `setTimeout` alone drifts under throttling; the rAF fence ensures advances only occur when the page is visible — also respects Constitution V (reduced motion: when `prefers-reduced-motion: reduce` is set, we cross-fade is replaced with an instant cut).
- **Alternatives considered**:
  - *`setInterval`*: drifts and double-fires on resume from background; rejected.
  - *Web Animations API timeline*: overkill for fixed-interval advancement.

## 7. Metadata extraction

- **Decision**: Use `exifr` for JPEG/HEIC/PNG/WebP metadata, called from a worker. Show only filename, dimensions, file size, and capture date (per FR-011); ignore other fields in v1.
- **Rationale**:
  - `exifr` is small, tree-shakeable (we import only the `parse` and `gps` modules — and we omit `gps` to avoid surfacing location, which is privacy-aligned with Constitution IV).
  - Running in a worker keeps parsing off the UI thread.
- **Alternatives considered**:
  - *Hand-rolled EXIF parser*: high maintenance, low payoff.
  - *No metadata in v1*: rejected because FR-011 explicitly requires it.

## 8. Format support and graceful degradation

- **Decision**: Support JPEG, PNG, static-frame GIF, WebP, BMP (FR-003). Detect by MIME + magic-byte sniffing in `lib/formatSupport.ts`. Files that fail decode show an `ErrorPlaceholder` in their gallery slot and skip cleanly during navigation.
- **Rationale**:
  - Magic-byte sniffing avoids relying on misleading filename extensions and matches "ignore unsupported types" (FR-012, edge cases).
  - The placeholder behavior implements the spec's edge-case guarantee without crashing (Constitution: graceful degradation, SC-006).
- **Alternatives considered**:
  - *Extension-only detection*: fragile against renamed files.
  - *Throwing on bad files*: contradicts SC-006 and Constitution V (never crash).

## 9. Testing strategy

- **Decision**: Four-tier suite — `unit` (pure functions, models, hooks), `integration` (component flows with React Testing Library + jsdom + mocked workers), `contract` (keyboard shortcuts, UI contracts), `e2e` (Playwright, including axe-core a11y checks and responsive viewports), and a `perf` benchmark suite that asserts the budgets in `contracts/performance-budgets.md`.
- **Rationale**:
  - Each constitution principle maps onto at least one suite (visual correctness → integration + e2e; perf → perf bench; a11y → e2e+axe; privacy → contract test for "no network calls during viewing").
  - Splitting suites lets CI run fast tiers on every PR and the heavier perf/e2e tiers on a defined cadence.
- **Alternatives considered**:
  - *Single Vitest suite*: simpler, but conflates concerns and makes perf/a11y opt-in rather than gated.

## 10. Accessibility approach

- **Decision**: Single global focus-ring style; every interactive element has an accessible name and role; the viewer chrome is reachable via `Tab`, dismissable via `Esc`; arrow keys do navigation/pan with documented modifiers; `prefers-reduced-motion` swaps slideshow cross-fade for instant cut and disables non-essential transitions.
- **Rationale**:
  - Directly satisfies Constitution V and FR-014/FR-016/FR-017.
  - Keeps the implementation auditable: a single source of truth for keyboard map (`contracts/keyboard-shortcuts.md`).
- **Alternatives considered**:
  - *Defer a11y to "polish phase"*: rejected by Constitution V (non-negotiable).

## Open items

None. All Technical Context unknowns resolved.
