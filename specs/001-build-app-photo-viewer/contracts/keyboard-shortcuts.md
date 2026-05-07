# Keyboard Shortcuts Contract

The viewer MUST be operable with keyboard alone (Constitution V, FR-014). The map below is the single source of truth; the `contract/keyboard-shortcuts.test.ts` suite asserts every row.

## Global

| Key | Context | Action |
|---|---|---|
| `?` | Any | Toggle the keyboard shortcuts help overlay. |
| `O` | Any | Open the folder picker (C-UI-1). |
| `Esc` | Help overlay open | Close the help overlay. |

## Gallery

| Key | Action |
|---|---|
| `Arrow Up / Down / Left / Right` | Move focus between thumbnail tiles. |
| `Home` | Focus first tile. |
| `End` | Focus last tile. |
| `Enter` / `Space` | Open the focused tile in the full-size viewer (C-UI-2). |
| `S` | Start the slideshow from the focused (or first) tile (C-UI-7). |

## Full-size Viewer

| Key | Action | Notes |
|---|---|---|
| `Arrow Right` / `PageDown` / `Space` | Next photo | Disabled at the last photo (C-UI-4). |
| `Arrow Left` / `PageUp` | Previous photo | Disabled at the first photo. |
| `Home` | First photo | |
| `End` | Last photo | |
| `+` / `=` | Zoom in | Stops at `MAX_SCALE`. |
| `-` | Zoom out | Stops at `FIT_SCALE`. |
| `0` | Fit to screen | Resets `scale`, `translateX`, `translateY`. |
| `[` | Rotate left 90° | (FR-009) |
| `]` | Rotate right 90° | (FR-009) |
| `Arrow Up/Down/Left/Right` (when zoomed) | Pan | Clamped to image edges. |
| `I` | Toggle metadata panel | (C-UI-6) |
| `S` | Start / stop slideshow | (C-UI-7) |
| `Esc` / `Backspace` | Return to gallery | Restores prior scroll position. |

## Slideshow (running or paused)

| Key | Action |
|---|---|
| `Space` | Pause / resume |
| `Esc` | Stop and return to prior view |
| `Arrow Right` | Skip to next photo immediately |
| `Arrow Left` | Skip to previous photo immediately |
| `+` / `-` | Increase / decrease interval by 1 s (clamped to 1–60) |

## Conformance rules

1. Every shortcut MUST also be reachable via a labeled on-screen control (FR-005, FR-007, FR-016).
2. No shortcut MAY use a single bare letter that conflicts with a browser-native shortcut while a text input has focus.
3. When `prefers-reduced-motion: reduce` is set, the viewer MUST NOT animate transitions triggered by these shortcuts (Constitution V).
4. The shortcuts help overlay MUST list every entry above; the overlay text is generated from this contract to prevent drift.
