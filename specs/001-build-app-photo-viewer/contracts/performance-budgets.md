# Performance Budgets Contract

Each row is encoded as an automated assertion in the `tests/perf/` suite. Numbers come from the constitution (II) and the spec's success criteria.

| ID | Metric | Budget | Measurement | Test file | Spec / Constitution ref |
|---|---|---|---|---|---|
| PB-01 | Cold start to first image visible | < 1500 ms | Playwright trace from app load to first photo `onload` | `tests/perf/cold-start.bench.ts` | Constitution II; SC-001 (folder of 500 photos in 15 s, of which < 1.5 s is app boot) |
| PB-02 | Thumbnail grid scroll FPS | ≥ 60 FPS sustained; no frame > 50 ms | Playwright + `Performance.now` frame sampling over a 5 s scroll | `tests/perf/gallery-scroll.bench.ts` | Constitution II; SC-003 |
| PB-03 | Full-resolution active-image decode | < 250 ms after selection (typical photos) | Worker post → main render mark | `tests/perf/decode-latency.bench.ts` | Constitution II |
| PB-04 | Next/previous perceived response | < 200 ms from input to next image's first paint | Playwright input → paint trace | `tests/perf/decode-latency.bench.ts` | SC-002 |
| PB-05 | Cold-start CPU work on UI thread | ≤ 100 ms long-task budget over the first 1.5 s | `LongTask` PerformanceObserver | `tests/perf/cold-start.bench.ts` | Constitution II (heavy work off UI thread) |
| PB-06 | Memory ceiling at 500 photos in collection | Peak ≤ 350 MB JS heap | `performance.memory` (Chromium-only sample, recorded in CI) | `tests/perf/gallery-scroll.bench.ts` | SC-003; bounded-memory rule in data model |

## Measurement rules

1. Reference hardware is the lowest declared platform target for the release; budgets are measured on that hardware in CI.
2. Each test fixture set lives under `tests/fixtures/` and includes a `perf-500/` set with deterministic dimensions (avg ~4 MP) so runs are reproducible.
3. Failing any budget MUST block merge (Constitution III & II — perf budgets are testable rather than aspirational).
4. When a budget is intentionally relaxed, the change MUST land with a Constitution amendment PR per the governance section, not a one-off waiver.
