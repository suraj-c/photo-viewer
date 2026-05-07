/**
 * Cold-start performance benchmark (PB-01, Constitution II).
 *
 * Runs the dev server through Playwright, navigates to the root, and asserts
 * the picker affordance is paint-ready under the budget. The "first image
 * visible" portion of SC-001 is asserted in the integration suite — a real
 * cold-start with a real folder requires the OS picker.
 */

import { test, expect } from '@playwright/test';

const COLD_START_BUDGET_MS = 1500;

test('cold start to first interactive render under budget', async ({ page }) => {
  const t0 = Date.now();
  await page.goto('/', { waitUntil: 'load' });
  await page.getByTestId('folder-picker-button').waitFor();
  const elapsed = Date.now() - t0;
  expect(elapsed, `cold-start was ${elapsed}ms`).toBeLessThan(COLD_START_BUDGET_MS);
});
