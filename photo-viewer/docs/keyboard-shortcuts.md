# Keyboard shortcuts

Single source of truth: this document is mirrored by
[`specs/001-build-app-photo-viewer/contracts/keyboard-shortcuts.md`](../../specs/001-build-app-photo-viewer/contracts/keyboard-shortcuts.md)
and by `src/components/common/KeyboardShortcutsHelp.tsx` (the in-app overlay).
The contract test suite (`tests/contract/keyboard-shortcuts.test.ts`) ensures
they stay aligned.

## Global

| Key | Action |
| --- | --- |
| `?` | Toggle the keyboard shortcuts overlay. |
| `O` | Open the folder picker. |
| `Esc` | Close the help overlay. |

## Gallery

| Key | Action |
| --- | --- |
| Arrow keys | Move focus between thumbnails. |
| `Home` / `End` | Focus first / last tile. |
| `Enter` / `Space` | Open the focused photo. |
| `S` | Start the slideshow from the focused tile. |

## Full-size viewer

| Key | Action |
| --- | --- |
| `→` / `PageDown` | Next photo. |
| `←` / `PageUp` | Previous photo. |
| `Home` / `End` | First / last photo. |
| `+` / `=` | Zoom in. |
| `-` | Zoom out. |
| `0` | Fit to screen. |
| `[` / `]` | Rotate left / right 90°. |
| `↑` / `↓` | Pan when zoomed. |
| `I` | Toggle metadata panel. |
| `S` | Toggle slideshow. |
| `Esc` / `Backspace` | Return to gallery. |

## Slideshow

| Key | Action |
| --- | --- |
| `Space` | Pause / resume. |
| `Esc` | Stop and return to prior view. |
| `→` / `←` | Skip to next / previous photo. |
| `+` / `-` | Adjust interval (1–60 s). |
