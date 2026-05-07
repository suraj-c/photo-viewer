/**
 * E2E accessibility audit using axe-core (Constitution V).
 *
 * We inject `axe-core` from `node_modules` at runtime and assert no violations
 * on the picker surface. Gallery/viewer audits run via the integration suite
 * with a mock folder reader; an end-to-end run with a real folder requires
 * OS-level interaction beyond Playwright's reach.
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

test('folder picker surface has no axe violations', async ({ page }) => {
  await page.goto('/');

  const axePath = path.resolve('node_modules/axe-core/axe.min.js');
  if (fs.existsSync(axePath)) {
    await page.addScriptTag({ path: axePath });
  } else {
    test.skip(true, 'axe-core not installed; run `npm install` first');
  }

  const results = await page.evaluate(async () => {
    // @ts-expect-error -- injected via addScriptTag
    return await window.axe.run(document, { resultTypes: ['violations'] });
  });

  expect(
    results.violations,
    `axe violations:\n${JSON.stringify(results.violations, null, 2)}`,
  ).toEqual([]);
});
