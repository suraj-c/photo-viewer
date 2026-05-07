# Photo Viewer

A local-first, read-only photo viewer that runs entirely in the browser. Pick a
folder on disk and Photo Viewer renders a responsive thumbnail gallery, a
full-size view with zoom/pan/rotate, and a configurable slideshow — all without
modifying source files and without making any network calls for image data
(see Constitution IV / FR-015 / SC-005).

## Quickstart

```bash
npm install
npm run dev          # http://localhost:5173
```

1. Click **Open folder** (or press `O`).
2. Pick a folder containing JPEG / PNG / GIF / WebP / BMP photos.
3. Click any thumbnail or focus it with arrows + `Enter` to open the full-size view.
4. Use `→` / `←` to navigate, `+` / `-` to zoom, `0` to fit, `[` / `]` to rotate,
   `S` to start a slideshow, `?` for the full shortcuts list.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server with HMR. |
| `npm run build` | Type-check and produce a static build in `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run typecheck` | Run `tsc --noEmit`. |
| `npm run lint` | ESLint over `src/` and `tests/`. |
| `npm run format` | Prettier write. |
| `npm test` | Vitest — unit + integration + contract suites. |
| `npm run test:contract` | Just the contract suite. |
| `npm run test:e2e` | Playwright + axe-core. |
| `npm run test:perf` | Performance budget benchmarks. |

## Privacy

Photo Viewer never:

- uploads photos or metadata
- writes telemetry or analytics
- mutates, moves, or deletes source files
- persists image data to `localStorage`, `IndexedDB`, cookies, or the network

See `docs/privacy-audit.md` for the audit checklist.

## Project layout

```text
src/
├── components/   # Gallery, Viewer, Slideshow, common UI
├── hooks/        # useCollection, useViewState, useSlideshow, …
├── services/     # folderReader, photoLoader, thumbnailCache, metadataReader
├── workers/      # thumbnail.worker, decode.worker
├── models/       # Photo, Collection, ViewState, SlideshowSession
├── lib/          # formatSupport, transforms (pure helpers)
└── styles/       # tokens.css, globals.css

tests/
├── unit/         # Pure model / lib / service tests
├── integration/  # Component + hook flows (jsdom)
├── contract/     # Keyboard + UI contract tests
├── e2e/          # Playwright + axe
├── perf/         # Performance budget benchmarks
└── fixtures/     # See tests/fixtures/README.md
```

## Documentation

- High-level plan: `../specs/001-build-app-photo-viewer/plan.md`
- Spec & success criteria: `../specs/001-build-app-photo-viewer/spec.md`
- Data model: `../specs/001-build-app-photo-viewer/data-model.md`
- UI contracts: `../specs/001-build-app-photo-viewer/contracts/ui-contracts.md`
- Keyboard shortcuts: `../specs/001-build-app-photo-viewer/contracts/keyboard-shortcuts.md`
- Performance budgets: `../specs/001-build-app-photo-viewer/contracts/performance-budgets.md`
- Constitution: `../.specify/memory/constitution.md`

## Browser support

Chrome / Edge 120+, Firefox 121+, Safari 17+. The File System Access API is
used where available, with a `<input type="file" webkitdirectory>` fallback for
browsers that don't expose `window.showDirectoryPicker`.
