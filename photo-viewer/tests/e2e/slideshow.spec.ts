/**
 * Slideshow E2E placeholder — full driver lives in
 * `tests/integration/slideshow.test.tsx`. This spec verifies the help
 * overlay surfaces the slideshow shortcuts so they are discoverable.
 */

import { test, expect } from '@playwright/test';

test('help overlay lists slideshow shortcuts', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('?');
  const overlay = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('Pause / resume');
  await expect(overlay).toContainText('Skip to next photo');
});
