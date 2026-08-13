// Capture the Platform-guide screenshots from the local dev app.
//
//   node scripts/screenshots/capture.mjs            # all shots
//   node scripts/screenshots/capture.mjs senders-list connect-modal-cloud
//
// Needs: the dev backend up (id :8021 for the JWT mint, linkedin :8020 for
// data), the frontend dev server on http://localhost:5188, and Playwright
// (`npm i playwright` anywhere on the machine; the script resolves it from
// its own node_modules first, then globally).
//
// Every image is a SPEC below: route, the clicks that reach the state, and
// what to clip. Re-run after UI changes instead of hand-recapturing; specs
// keep captions honest because the same click path always yields the same
// state. Output: images/kb/{name}.png at devicePixelRatio 2.
//
// Data on screen is the dev seed fixture (seeddev identities), never real
// customer data. That is a hard rule for anything committed to public docs.

import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', '..', 'images', 'kb');
const APP = process.env.APP_URL ?? 'http://localhost:5188';
const TEAM = 'ts_tm_seeddev00001';

const require_ = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require_('playwright'));
} catch {
  ({ chromium } = require_(join(process.env.HOME, 'sites/.playwright-shared/node_modules/playwright')));
}

const jwt = execSync('docker exec gtm_id_app_dev php artisan jwt:fake --ttl=7200', {
  encoding: 'utf8',
}).trim().split('\n').pop();

/** @type {Record<string, (page: import('playwright').Page) => Promise<import('playwright').Locator|null>>} */
const SPECS = {
  // The Senders list: statuses, health, the Connect account button.
  'senders-list': async (page) => {
    await page.getByText('Edgar Abgaryan').waitFor();
    return null; // full viewport
  },
  // Connect modal, Cloud browser tab (the default path).
  // AntD v6 markup: the dialog is `.ant-modal`, no `-content` node.
  'connect-modal-cloud': async (page) => {
    await page.getByRole('button', { name: /connect account/i }).click();
    await page.getByText('Anti-detect vendor').first().waitFor();
    return page.locator('.ant-modal').first();
  },
  // Connect modal, BYO tab.
  'connect-modal-byo': async (page) => {
    await page.getByRole('button', { name: /connect account/i }).click();
    await page.getByText('Existing profile ID').click();
    await page.getByText(/GoLogin profile ID/i).first().waitFor();
    return page.locator('.ant-modal').first();
  },
  // Account drawer, Browser tab: browser + proxy blocks, event log.
  // The drawer is the app's own rc-drawer shell, not an AntD drawer. Clip the
  // drawer BODY, not the whole section: the identity header above it carries
  // the seed profile's headline, which has no place in public docs images.
  'account-drawer-browser': async (page) => {
    await page.getByText('Edgar Abgaryan').first().click();
    await page.getByRole('tab', { name: 'Browser' }).click();
    await page.getByText('BROWSER EVENT LOG').waitFor();
    return page.locator('[class*="_drawerBody_"]').first();
  },
  // Account drawer, Smart Limits tab: per-action buckets and statuses.
  'account-drawer-smart-limits': async (page) => {
    await page.getByText('Edgar Abgaryan').first().click();
    await page.getByRole('tab', { name: /smart limits/i }).click();
    await page.waitForTimeout(600);
    return page.locator('[class*="_drawerBody_"]').first();
  },
  // Account drawer, Account Sync tab: sync window and per-kind intervals.
  'account-drawer-sync': async (page) => {
    await page.getByText('Edgar Abgaryan').first().click();
    await page.getByRole('tab', { name: /account sync/i }).click();
    await page.waitForTimeout(600);
    return page.locator('[class*="_drawerBody_"]').first();
  },
  // Data Requests ledger page.
  'data-requests': async (page) => {
    await page.getByText('Data Requests').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    return null;
  },
};

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(SPECS);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let failed = 0;
for (const name of names) {
  const spec = SPECS[name];
  if (!spec) {
    console.error(`unknown spec: ${name}`);
    failed++;
    continue;
  }
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  });
  await context.addInitScript(([token, team]) => {
    localStorage.setItem('gtm:auth-token', token);
    localStorage.setItem('gs-team-id', team);
    localStorage.setItem('gs:theme', 'light');
  }, [jwt, TEAM]);
  const page = await context.newPage();
  try {
    await page.goto(`${APP}/`, { waitUntil: 'networkidle' });
    const clip = await spec(page);
    await page.waitForTimeout(400); // let AntD transitions settle
    const path = join(OUT, `${name}.png`);
    await (clip ?? page).screenshot({ path });
    console.log(`ok  ${name}.png`);
  } catch (err) {
    console.error(`FAIL ${name}: ${String(err).split('\n')[0]}`);
    failed++;
  } finally {
    await context.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
