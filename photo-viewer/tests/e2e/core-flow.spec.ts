/**
 * E2E core flow — picker → gallery → viewer → return.
 *
 * Note: real folder selection requires user interaction with the OS picker,
 * which Playwright cannot drive. This spec verifies the app shell loads and
 * the picker affordance is present and keyboard-reachable. Folder selection
 * is exercised via the integration suite using a mock `FolderReader`.
 */

import { test, expect } from '@playwright/test';

test.describe('core flow', () => {
  test('app loads with the folder picker visible and keyboard-reachable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('folder-picker-button')).toBeVisible();

    // Keyboard reachability: Tab should land on a focusable affordance.
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe('BUTTON');
  });

  test('keyboard shortcut "?" opens the help overlay', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('?');
    await expect(page.getByText('Keyboard shortcuts')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Keyboard shortcuts')).toBeHidden();
  });
});
