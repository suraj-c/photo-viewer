/**
 * Contract test for `contracts/keyboard-shortcuts.md`.
 *
 * Asserts that every documented shortcut row appears in `SHORTCUT_GROUPS`
 * (the in-app help overlay's source of truth). If you add a row to the
 * contract markdown, you MUST add it here and to `SHORTCUT_GROUPS`.
 */

import { describe, expect, it } from 'vitest';
import { SHORTCUT_GROUPS } from '../../src/components/common/KeyboardShortcutsHelp';

interface Row {
  group: string;
  keys: string[];
  description: string;
}

const CONTRACT_ROWS: Row[] = [
  // Global
  { group: 'Global', keys: ['?'], description: 'Toggle this shortcuts overlay.' },
  { group: 'Global', keys: ['O'], description: 'Open the folder picker.' },
  { group: 'Global', keys: ['Esc'], description: 'Close the help overlay.' },

  // Gallery
  { group: 'Gallery', keys: ['↑', '↓', '←', '→'], description: 'Move focus between thumbnails.' },
  { group: 'Gallery', keys: ['Home'], description: 'Focus first tile.' },
  { group: 'Gallery', keys: ['End'], description: 'Focus last tile.' },
  { group: 'Gallery', keys: ['Enter', 'Space'], description: 'Open the focused photo.' },
  { group: 'Gallery', keys: ['S'], description: 'Start slideshow from focused photo.' },

  // Viewer
  { group: 'Full-size viewer', keys: ['→', 'PageDown'], description: 'Next photo.' },
  { group: 'Full-size viewer', keys: ['←', 'PageUp'], description: 'Previous photo.' },
  { group: 'Full-size viewer', keys: ['Home'], description: 'First photo.' },
  { group: 'Full-size viewer', keys: ['End'], description: 'Last photo.' },
  { group: 'Full-size viewer', keys: ['+', '='], description: 'Zoom in.' },
  { group: 'Full-size viewer', keys: ['-'], description: 'Zoom out.' },
  { group: 'Full-size viewer', keys: ['0'], description: 'Fit to screen.' },
  { group: 'Full-size viewer', keys: ['['], description: 'Rotate left 90°.' },
  { group: 'Full-size viewer', keys: [']'], description: 'Rotate right 90°.' },
  { group: 'Full-size viewer', keys: ['I'], description: 'Toggle metadata panel.' },
  { group: 'Full-size viewer', keys: ['S'], description: 'Start / stop slideshow.' },
  { group: 'Full-size viewer', keys: ['Esc', 'Backspace'], description: 'Return to gallery.' },

  // Slideshow
  { group: 'Slideshow', keys: ['Space'], description: 'Pause / resume.' },
  { group: 'Slideshow', keys: ['Esc'], description: 'Stop and return to prior view.' },
  { group: 'Slideshow', keys: ['→'], description: 'Skip to next photo.' },
  { group: 'Slideshow', keys: ['←'], description: 'Skip to previous photo.' },
  { group: 'Slideshow', keys: ['+', '-'], description: 'Adjust interval (1–60 s).' },
];

describe('keyboard-shortcuts contract', () => {
  it.each(CONTRACT_ROWS)('exposes %s row in SHORTCUT_GROUPS', (row) => {
    const group = SHORTCUT_GROUPS.find((g) => g.title === row.group);
    expect(group, `Group "${row.group}" is missing from SHORTCUT_GROUPS`).toBeTruthy();
    const match = group!.rows.find(
      (r) =>
        r.description === row.description &&
        r.keys.length === row.keys.length &&
        r.keys.every((k, i) => k === row.keys[i]),
    );
    expect(match, `Row not found: ${row.description} (${row.keys.join(', ')})`).toBeTruthy();
  });

  it('every row has at least one key and a description', () => {
    for (const group of SHORTCUT_GROUPS) {
      for (const row of group.rows) {
        expect(row.keys.length).toBeGreaterThan(0);
        expect(row.description.length).toBeGreaterThan(0);
      }
    }
  });
});
