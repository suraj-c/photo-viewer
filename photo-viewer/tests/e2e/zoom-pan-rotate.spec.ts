/**
 * E2E placeholder for zoom/pan/rotate. The full assertions require a real
 * folder selection (OS picker) which Playwright cannot drive, so the
 * authoritative test of these interactions lives in the integration suite
 * (`tests/integration/viewer-zoom-pan.test.tsx`). This spec asserts the
 * help overlay surfaces every relevant shortcut so users discover them.
 */

import { test, expect } from '@playwright/test';

test('help overlay lists zoom, fit, and rotate shortcuts', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('?');
  const overlay = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('Zoom in');
  await expect(overlay).toContainText('Zoom out');
  await expect(overlay).toContainText('Fit to screen');
  await expect(overlay).toContainText('Rotate left');
  await expect(overlay).toContainText('Rotate right');
});
