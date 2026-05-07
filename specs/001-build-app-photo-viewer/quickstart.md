# Quickstart: Photo Viewer App

A 5-minute path from clean checkout to seeing the gallery in your browser.

## Prerequisites

- **Node.js** 20 LTS or newer (`node --version`).
- **npm** 10 or newer (ships with Node 20).
- A modern desktop browser: Chrome / Edge 120+, Firefox 121+, or Safari 17+.
- A folder on disk containing some JPEG / PNG / GIF / WebP / BMP files for testing. A small set is included under `tests/fixtures/valid/` once the repo is set up.

## 1. Install

```bash
npm install
```

## 2. Run the dev server

```bash
npm run dev
```

Open the printed URL (default: `http://localhost:5173`).

## 3. First photo in under 15 seconds (SC-001)

1. Click **Open folder** (or press `O`).
2. Pick a folder containing photos.
3. The gallery renders as a thumbnail grid.
4. Click any thumbnail (or focus it with arrows + `Enter`) to open the full-size viewer.

## 4. Try the core controls

- **Next / Previous**: `→` / `←` (or the on-screen buttons).
- **Zoom**: `+` / `-`, mouse wheel, or pinch on touch.
- **Fit to screen**: `0`.
- **Pan a zoomed image**: drag, or arrow keys when zoomed.
- **Rotate**: `[` / `]`.
- **Metadata panel**: `I`.
- **Slideshow**: `S` to start; `Space` to pause/resume; `Esc` to stop.
- **Close back to gallery**: `Esc` or `Backspace`.
- **Keyboard shortcuts overlay**: `?`.

## 5. Verify the read-only guarantee (SC-005)

- Note the modified time of any source file before viewing.
- Browse, zoom, rotate, run a slideshow.
- Close the app and re-check the file: `mtime`, size, and contents are unchanged.

## 6. Run the test suites

```bash
npm test                # unit + integration (Vitest)
npm run test:contract   # keyboard + UI contract suites
npm run test:e2e        # Playwright end-to-end + axe accessibility checks
npm run test:perf       # performance budget benchmarks
```

All four suites must pass before merging changes (Constitution III).

## 7. Build for production

```bash
npm run build
npm run preview
```

The output in `dist/` is fully static — host it on any static file server. No backend, no API keys, no telemetry (Constitution IV).

## Troubleshooting

- **"Couldn't read that folder"**: the browser denied directory access. Re-pick the folder or check OS-level permissions.
- **A thumbnail shows an error placeholder**: the file is corrupt or in an unsupported format; navigation continues past it (SC-006). Inspect the file outside the app to confirm.
- **Slideshow feels jumpy**: check that `prefers-reduced-motion` isn't forcing instant cuts unintentionally (it's respected on purpose — Constitution V).
- **Performance regression in CI**: see `specs/001-build-app-photo-viewer/contracts/performance-budgets.md` for the exact budget that failed and the test file to reproduce locally.

## Where to look next

- High-level plan: [`plan.md`](./plan.md)
- Resolved unknowns and decisions: [`research.md`](./research.md)
- Entity definitions: [`data-model.md`](./data-model.md)
- UI behavior contracts: [`contracts/ui-contracts.md`](./contracts/ui-contracts.md)
- Keyboard map: [`contracts/keyboard-shortcuts.md`](./contracts/keyboard-shortcuts.md)
- Performance budgets: [`contracts/performance-budgets.md`](./contracts/performance-budgets.md)
- Project constitution: [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md)
