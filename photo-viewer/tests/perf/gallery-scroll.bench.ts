/**
 * Gallery scroll performance benchmark (PB-02, Constitution II).
 *
 * Real measurement requires a populated gallery, which depends on a folder
 * being selected through the OS picker — out of Playwright's reach. We
 * therefore record this benchmark as a TODO that's wired up via the harness;
 * it currently asserts the suite runs and the dev server is up so CI fails
 * loudly if either regresses.
 */

import { test, expect } from '@playwright/test';

test('gallery scroll perf harness is wired', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('folder-picker-button')).toBeVisible();
  // Real scroll-FPS sampling is added once an automated fixture loader is in
  // place (T064). See `specs/.../contracts/performance-budgets.md` PB-02.
});
