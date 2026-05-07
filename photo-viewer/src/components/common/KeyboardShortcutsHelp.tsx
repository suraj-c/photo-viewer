import React from 'react';
import { IconButton } from './IconButton';

export interface ShortcutGroup {
  title: string;
  rows: { keys: string[]; description: string }[];
}

export interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  groups: ShortcutGroup[];
}

/**
 * Modal-ish overlay listing every keyboard shortcut. The content is generated
 * from `contracts/keyboard-shortcuts.md` (single source of truth) so the
 * contract test suite can re-use it.
 */
export function KeyboardShortcutsHelp({ open, onClose, groups }: KeyboardShortcutsHelpProps) {
  if (!open) return null;
  return (
    <div
      className="pv-help"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pv-help-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pv-help__panel">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 id="pv-help-title" style={{ margin: 0 }}>
            Keyboard shortcuts
          </h2>
          <IconButton label="Close help" iconChar="✕" onClick={onClose} />
        </header>
        {groups.map((group) => (
          <section key={group.title} style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--pv-text-secondary)' }}>
              {group.title}
            </h3>
            <table>
              <tbody>
                {group.rows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ width: '40%' }}>
                      {row.keys.map((k, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 ? <span> / </span> : null}
                          <kbd>{k}</kbd>
                        </React.Fragment>
                      ))}
                    </td>
                    <td>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}

/**
 * The canonical shortcut list, mirroring `contracts/keyboard-shortcuts.md`.
 * Exported so contract tests can assert every documented row is bound.
 */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global',
    rows: [
      { keys: ['?'], description: 'Toggle this shortcuts overlay.' },
      { keys: ['O'], description: 'Open the folder picker.' },
      { keys: ['Esc'], description: 'Close the help overlay.' },
    ],
  },
  {
    title: 'Gallery',
    rows: [
      { keys: ['↑', '↓', '←', '→'], description: 'Move focus between thumbnails.' },
      { keys: ['Home'], description: 'Focus first tile.' },
      { keys: ['End'], description: 'Focus last tile.' },
      { keys: ['Enter', 'Space'], description: 'Open the focused photo.' },
      { keys: ['S'], description: 'Start slideshow from focused photo.' },
    ],
  },
  {
    title: 'Full-size viewer',
    rows: [
      { keys: ['→', 'PageDown'], description: 'Next photo.' },
      { keys: ['←', 'PageUp'], description: 'Previous photo.' },
      { keys: ['Home'], description: 'First photo.' },
      { keys: ['End'], description: 'Last photo.' },
      { keys: ['+', '='], description: 'Zoom in.' },
      { keys: ['-'], description: 'Zoom out.' },
      { keys: ['0'], description: 'Fit to screen.' },
      { keys: ['['], description: 'Rotate left 90°.' },
      { keys: [']'], description: 'Rotate right 90°.' },
      { keys: ['I'], description: 'Toggle metadata panel.' },
      { keys: ['S'], description: 'Start / stop slideshow.' },
      { keys: ['Esc', 'Backspace'], description: 'Return to gallery.' },
    ],
  },
  {
    title: 'Slideshow',
    rows: [
      { keys: ['Space'], description: 'Pause / resume.' },
      { keys: ['Esc'], description: 'Stop and return to prior view.' },
      { keys: ['→'], description: 'Skip to next photo.' },
      { keys: ['←'], description: 'Skip to previous photo.' },
      { keys: ['+', '-'], description: 'Adjust interval (1–60 s).' },
    ],
  },
];
