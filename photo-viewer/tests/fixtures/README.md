# Test fixtures

Drop sample image files here for the integration / E2E / perf suites. The
following layout is expected:

```text
fixtures/
├── valid/         # JPEG / PNG / GIF / WebP / BMP samples that decode cleanly
├── corrupt/       # Files with valid magic bytes but truncated bodies
├── unsupported/   # Non-image files (e.g. .txt) used to verify filtering
└── perf-500/      # 500 deterministic photos used by the perf benchmarks
```

The repo intentionally ships no binary fixtures — populate this directory
locally before running E2E or perf tests. The integration suite synthesizes
files on the fly so it can run without anything here.
