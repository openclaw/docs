
import { chromium } from 'playwright';
const out = process.argv[2] || 'before';
const base = 'http://127.0.0.1:4799';
const browser = await chromium.launch();
async function shot(name, url, vp, theme, fn) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, colorScheme: theme });
  const page = await ctx.newPage();
  await page.addInitScript(t => { try { localStorage.setItem('theme', t); localStorage.setItem('openclaw-docs-theme', t);} catch {} }, theme);
  await page.goto(base + url, { waitUntil: 'networkidle' });
  await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  if (fn) await fn(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `.openclaw/tmp/${out}-${name}.png` });
  await ctx.close();
}
for (const theme of ['dark','light']) {
  await shot('desk-home-'+theme, '/', {width:1440,height:900}, theme);
  await shot('desk-config-'+theme, '/gateway/configuration', {width:1440,height:900}, theme, async p => { await p.mouse.wheel(0, 1600); await p.waitForTimeout(600); });
}
await shot('mobile-nav-dark', '/gateway/configuration', {width:390,height:844}, 'dark', async p => { await p.click('.nav-toggle'); await p.waitForTimeout(500); });
await shot('mobile-toc-dark', '/gateway/configuration', {width:390,height:844}, 'dark', async p => { await p.mouse.wheel(0, 1600); await p.waitForTimeout(600); const s = await p.$('.toc summary'); if (s) await s.click(); await p.waitForTimeout(400); });
await shot('mobile-nav-home-light', '/', {width:390,height:844}, 'light', async p => { await p.click('.nav-toggle'); await p.waitForTimeout(500); });
await browser.close();
