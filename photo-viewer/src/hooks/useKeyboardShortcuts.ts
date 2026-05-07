/**
 * useKeyboardShortcuts — scope-aware keyboard binding.
 *
 * Backed by `contracts/keyboard-shortcuts.md` — every documented shortcut is
 * wired through this hook, and the contract test suite asserts the binding
 * exists for each declared key.
 *
 * Scopes:
 *  - 'global'    — always active
 *  - 'gallery'   — when the gallery surface is visible
 *  - 'viewer'    — when the full-size viewer is open
 *  - 'slideshow' — while a slideshow is running or paused
 *
 * The caller declares which scopes are currently active; handlers from the
 * narrowest scope win when keys collide.
 */

import { useEffect, useMemo, useRef } from 'react';

export type ShortcutScope = 'global' | 'gallery' | 'viewer' | 'slideshow';

export interface ShortcutBinding {
  /** A `KeyboardEvent.key` value (case-insensitive) or one of the aliases below. */
  key: string;
  scope: ShortcutScope;
  handler: (event: KeyboardEvent) => void;
  /** When true (default), call `event.preventDefault()` before invoking. */
  preventDefault?: boolean;
  /** Human-readable description for the help overlay (and contract tests). */
  description?: string;
}

export interface UseKeyboardShortcutsOptions {
  bindings: ShortcutBinding[];
  /** Active scopes, ordered narrowest-first (slideshow > viewer > gallery > global). */
  activeScopes: ShortcutScope[];
  /** Disable the hook entirely (e.g. while a modal text input is focused). */
  disabled?: boolean;
}

const KEY_ALIASES: Record<string, string> = {
  ' ': 'space',
  spacebar: 'space',
  esc: 'escape',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  pagedown: 'pagedown',
  pageup: 'pageup',
};

function normalizeKey(raw: string): string {
  const lower = raw.toLowerCase();
  return KEY_ALIASES[lower] ?? lower;
}

/** Exposed for the contract test suite. */
export function matchesBinding(event: KeyboardEvent, binding: ShortcutBinding): boolean {
  return normalizeKey(event.key) === normalizeKey(binding.key);
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const { bindings, activeScopes, disabled = false } = options;

  const ref = useRef({ bindings, activeScopes, disabled });
  ref.current = { bindings, activeScopes, disabled };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { bindings: b, activeScopes: scopes, disabled: d } = ref.current;
      if (d) return;
      if (isEditableTarget(event.target)) return;

      // Narrowest scope wins: walk in caller-supplied order, return on first hit.
      for (const scope of scopes) {
        for (const binding of b) {
          if (binding.scope !== scope) continue;
          if (!matchesBinding(event, binding)) continue;
          if (binding.preventDefault !== false) event.preventDefault();
          binding.handler(event);
          return;
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

/** Helper: build a help-overlay-friendly summary from a binding list. */
export function summarizeBindings(bindings: ShortcutBinding[]) {
  return useMemoSummary(bindings);
}

function useMemoSummary(bindings: ShortcutBinding[]) {
  return useMemo(
    () =>
      bindings
        .filter((b) => b.description)
        .map((b) => ({ key: b.key, scope: b.scope, description: b.description ?? '' })),
    [bindings],
  );
}
