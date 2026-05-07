/**
 * Decode latency benchmark (PB-03, PB-04). Same story as gallery-scroll.bench.ts:
 * real measurement requires a real folder selection. The unit test of
 * `photoLoader` covers correctness; this harness is reserved for the future
 * automated-fixture run.
 */

import { test, expect } from '@playwright/test';

test('decode-latency harness is wired', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('folder-picker-button')).toBeVisible();
});
