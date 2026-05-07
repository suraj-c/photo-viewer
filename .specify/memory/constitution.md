<!--
SYNC IMPACT REPORT
==================
Version change: (initial template) → 1.0.0
Bump rationale: First ratified version of the photo-viewer constitution. MAJOR=1
because this is the inaugural governing document; MINOR/PATCH reset to 0.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. User-First Visual Experience
  - [PRINCIPLE_2_NAME] → II. Performance & Responsiveness
  - [PRINCIPLE_3_NAME] → III. Test-First (NON-NEGOTIABLE)
  - [PRINCIPLE_4_NAME] → IV. Privacy & Data Stewardship
  - [PRINCIPLE_5_NAME] → V. Simplicity & Accessibility

Added sections:
  - Additional Constraints (technology, formats, platform support)
  - Development Workflow (review process, quality gates)
  - Governance (amendment & versioning policy)

Removed sections: none (template placeholders fully resolved)

Templates requiring updates:
  - ✅ .specify/memory/constitution.md (this file)
  - ⚠ .specify/templates/plan-template.md (verify Constitution Check references new principles)
  - ⚠ .specify/templates/spec-template.md (ensure user-experience and accessibility sections present)
  - ⚠ .specify/templates/tasks-template.md (ensure tasks include performance + a11y verification)
  - ⚠ .specify/templates/commands/*.md (no agent-specific name leakage detected at ratification)

Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Confirm the official adoption date with the project owner;
    currently set to today's date as the inaugural ratification.
-->

# photo-viewer Constitution

## Core Principles

### I. User-First Visual Experience
The product MUST prioritize a clear, distraction-free experience for viewing photos.
Every screen MUST present images at the highest fidelity the device and source allow,
with predictable navigation (next/previous, zoom, pan) and stable layout under load.
UI affordances SHOULD remain minimal during viewing; chrome MUST be dismissible.
Rationale: A photo viewer’s primary value is the photo itself; UI must never compete
with content.

### II. Performance & Responsiveness
Image decode, thumbnail generation, and gallery scrolling MUST feel instantaneous on
target devices. Concrete budgets:
- First image visible from cold start: < 1.5s on reference hardware.
- Thumbnail grid scroll: sustained 60 FPS with no dropped frames > 50ms.
- Full-resolution decode for the active image: < 250ms after selection.
Heavy work (decode, EXIF parsing, transforms) MUST run off the UI thread.
Rationale: Perceived speed is the dominant quality signal in a viewer app; budgets
make performance testable rather than aspirational.

### III. Test-First (NON-NEGOTIABLE)
TDD is mandatory: failing tests MUST be written and reviewed before implementation.
Every feature MUST include automated tests covering: rendering correctness for
supported formats, navigation/state transitions, and at least one performance budget
assertion where applicable. Red-Green-Refactor MUST be visible in the commit history
(test commit precedes or accompanies the implementation commit).
Rationale: Visual regressions and perf regressions are easy to ship and hard to
detect manually; tests are the only durable safeguard.

### IV. Privacy & Data Stewardship
User photos and metadata are sensitive by default. The application MUST:
- Read photos only from locations the user explicitly granted.
- Never upload, transmit, or share image data or metadata without an explicit, in-session user action.
- Strip or redact location/EXIF data on export when the user opts in (opt-in MUST be visible, not buried).
- Persist no analytics that contain image content, file paths, or personally identifying metadata.
Rationale: Trust is foundational; a viewer that leaks user content has no recoverable reputation.

### V. Simplicity & Accessibility
Features MUST justify their cost against the YAGNI principle; speculative options are
rejected. The viewer MUST be usable via keyboard alone, MUST meet WCAG 2.1 AA contrast
for all chrome, and MUST expose accessible names/roles for every interactive element.
Animations MUST respect the platform "reduce motion" setting.
Rationale: Simplicity preserves performance and reviewability; accessibility expands
the audience and is a non-negotiable quality bar.

## Additional Constraints

- Supported image formats at v1.0: JPEG, PNG, WebP, HEIC, GIF (static + animated).
- Color management: images with embedded ICC profiles MUST be rendered color-managed
  to sRGB (or display profile where the platform permits).
- Platform targets MUST be declared per release; performance budgets are measured on
  the lowest declared target.
- Third-party dependencies MUST be reviewed for license compatibility and surface
  area; image decoders SHOULD be platform-native unless a clear gap is documented.
- All features MUST degrade gracefully when files are corrupt, unreadable, or in an
  unsupported format — the app MUST NOT crash.

## Development Workflow

- Every change MUST land via pull request with at least one reviewer who is not the
  author.
- PRs MUST include: linked spec/issue, test evidence (logs or screenshots), and a
  Constitution Check confirming alignment with each principle or an explicit waiver.
- Performance-sensitive changes MUST include a benchmark comparison (before/after).
- Accessibility-affecting changes MUST include keyboard-navigation verification and a
  screen-reader smoke test note.
- CI MUST run unit tests, integration tests, lint, and a performance smoke suite on
  every PR; failures block merge.

## Governance

This constitution supersedes other process documents in the repository. Amendments
require:
1. A pull request modifying this file with a clear rationale and Sync Impact Report.
2. Approval from the project owner (or designated maintainers) and a second reviewer.
3. A migration plan for any in-flight work that would be made non-compliant.

Versioning policy (semantic):
- MAJOR: Backward-incompatible removal or redefinition of a principle or governance rule.
- MINOR: New principle or section added, or material expansion of existing guidance.
- PATCH: Clarifications, wording, typo, or non-semantic refinements.

Compliance reviews:
- Every PR description MUST include a Constitution Check section.
- A quarterly review MUST audit recent merges against these principles and record
  findings; recurring violations MUST trigger either a process fix or a constitutional
  amendment.

Runtime development guidance lives in `CLAUDE.md` and the `.specify/templates/`
artifacts; those documents MUST remain consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-05-07 | **Last Amended**: 2026-05-07
