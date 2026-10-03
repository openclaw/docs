import assert from "node:assert/strict";
import fs from "node:fs";
import { before, after, test } from "node:test";
import { chromium } from "playwright";
import { siteJs } from "./site-js.mjs";
import { webVitalsAssetName, webVitalsRuntime } from "./web-vitals-runtime.mjs";

const origin = "https://docs.openclaw.ai";
const sdk = process.env.DOCS_GA4_SDK_PATH ? fs.readFileSync(process.env.DOCS_GA4_SDK_PATH, "utf8") : "";
const key = "openclaw.analytics.consent";
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });
const saved = analytics => JSON.stringify({ schema_version: 1, policy_version: "2026-10-02.v2", analytics, updated_at: "2026-10-02T00:00:00.000Z", expires_at: "2027-01-01T00:00:00.000Z" });
async function deliveredViews(f, expected) {
  // The native SDK batches transport after the synchronous pageview owner has
  // committed. Observe delivery without synthesizing a flush event.
  const deadline = Date.now() + 7000;
  while (f.events.filter(event => event.en === "page_view").length < expected && Date.now() < deadline) await f.page.waitForTimeout(100);
  assert.equal(f.events.filter(event => event.en === "page_view").length, expected);
}

async function openSite(t, options = {}) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  context.setDefaultTimeout(10000);
  let releaseRegion;
  const regionWait = new Promise(resolve => { releaseRegion = resolve; });
  t.after(async () => { releaseRegion(); await context.close(); });
  const events = [], controls = [], sdkRequests = [], regionRequests = [];
  const siteOrigin = options.origin || origin;
  await context.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.hostname === "www.googletagmanager.com" && url.pathname === "/gtag/js") {
      sdkRequests.push(url.href); return route.fulfill({ contentType: "text/javascript", body: sdk });
    }
    if (/\/(?:g\/)?collect$/.test(url.pathname)) {
      for (const line of (request.postData() || "").split(/\r?\n/)) events.push({ ...Object.fromEntries(new URLSearchParams([url.search.slice(1), line].filter(Boolean).join("&"))), receivedAt: Date.now() });
      return route.fulfill({ status: 204 });
    }
    if (url.origin !== siteOrigin) { controls.push(url.href); return route.abort(); }
    if (url.pathname === "/api/analytics-consent") {
      regionRequests.push(url.href);
      // Neither an unavailable nor arbitrarily late legacy endpoint can gate startup.
      if (options.region === "slow") await regionWait;
      return route.fulfill({ status: 503 });
    }
    if (url.pathname === "/assets/" + webVitalsAssetName) return route.fulfill({ contentType: "text/javascript", body: webVitalsRuntime });
    const eligible = options.eligible !== false && url.pathname !== "/private";
    return route.fulfill({ contentType: "text/html", body: `<!doctype html><title>Public docs</title><div class="main"${eligible ? ` data-analytics-path="${url.pathname}" data-analytics-title="Public docs"` : ""}><article class="doc"><h1>Public docs</h1><a href="/second">Next page</a><a href="/">Home</a><form id="public-form" action="/second"><input aria-label="Topic"><button>Submit</button></form><div style="height:5000px"></div></article></div><nav aria-label="Private application"><a href="/private">Private route</a></nav><script>${siteJs()}</script>` });
  });
  await context.addInitScript(({ key, choice, privacy, failedStorage }) => {
    if (choice !== undefined) localStorage.setItem(key, choice);
    window.__gpc = privacy === "gpc"; window.__dnt = privacy === "dnt";
    if (privacy === "window-dnt") window.doNotTrack = "1";
    Object.defineProperty(navigator, "globalPrivacyControl", { get: () => window.__gpc });
    Object.defineProperty(navigator, "doNotTrack", { get: () => window.__dnt ? "1" : "0" });
    window.__choiceAccess = [];
    for (const method of ["getItem", "setItem", "removeItem"]) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function(name, ...args) {
        if (name.startsWith(key)) { window.__choiceAccess.push(method); if (failedStorage) throw new Error("Old choice storage unavailable"); }
        return original.call(this, name, ...args);
      };
    }
  }, { key, choice: options.choice, privacy: options.privacy, failedStorage: options.failedStorage });
  const page = await context.newPage();
  await page.goto(siteOrigin + (options.path || "/"));
  await page.waitForFunction(() => document.readyState === "complete");
  const views = () => page.evaluate(() => (window.dataLayer || []).filter(entry => entry[1] === "page_view").map(entry => entry[2]));
  return { page, context, events, controls, sdkRequests, regionRequests, views };
}

for (const [name, options] of [
  ["no record", {}], ["old denial", { choice: saved("denied") }], ["old grant", { choice: saved("granted") }],
  ["malformed record", { choice: "malformed" }], ["expired record", { choice: JSON.stringify({ ...JSON.parse(saved("granted")), updated_at: "2020-01-01T00:00:00.000Z", expires_at: "2020-02-01T00:00:00.000Z" }) }],
  ["blocked old storage", { choice: saved("denied"), failedStorage: true }],
  ["missing region endpoint", { region: "missing" }], ["unresponsive region endpoint", { region: "slow" }],
]) test(`${name}: public startup ignores old choices and region, with one view per committed navigation`, async t => {
  const f = await openSite(t, options);
  assert.equal(f.sdkRequests.length, 1);
  assert.equal((await f.views()).length, 1);
  await f.page.getByRole("link", { name: "Next page", exact: true }).click();
  await f.page.locator('.main[data-analytics-path="/second"]').waitFor();
  assert.deepEqual((await f.views()).map(view => view.page_location), [origin + "/", origin + "/second"]);
  assert.deepEqual(await f.page.evaluate(() => window.__choiceAccess), []);
  assert.deepEqual(f.regionRequests, []);
  assert.equal(await f.page.locator("[data-analytics-consent],[data-analytics-choices]").count(), 0);
  const commands = await f.page.evaluate(() => window.dataLayer.filter(entry => ["consent", "config"].includes(entry[0])).map(entry => Array.from(entry)));
  assert.deepEqual(commands[0], ["consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
  assert.deepEqual(commands[1], ["consent", "update", { analytics_storage: "granted" }]);
  assert.equal(commands.find(entry => entry[0] === "config")[2].allow_google_signals, false);
  assert.equal(commands.find(entry => entry[0] === "config")[2].allow_ad_personalization_signals, false);
  if (sdk) {
    await deliveredViews(f, 2);
    assert.deepEqual(f.events.filter(event => event.en === "page_view").map(event => event.dl), [origin + "/", origin + "/second"]);
    t.diagnostic(JSON.stringify(f.events.filter(event => event.en === "page_view").map(({ dl, receivedAt }) => ({ dl, receivedAt }))));
  }
});

for (const [name, options] of [
  ["GPC", { privacy: "gpc", choice: saved("granted") }], ["DNT", { privacy: "dnt" }],
  ["window DNT", { privacy: "window-dnt" }],
  ["private", { path: "/private" }], ["preview/build-disabled metadata", { eligible: false }],
  ["alias", { origin: "https://documentation.openclaw.ai" }], ["local", { origin: "http://localhost" }],
]) test(`${name} remains off regardless of old records`, async t => {
  const f = await openSite(t, options);
  assert.deepEqual(await f.views(), []); assert.equal(f.sdkRequests.length, 0);
  assert.equal(f.events.length + f.controls.length, 0); assert.equal(f.regionRequests.length, 0);
  assert.deepEqual(await f.page.evaluate(() => window.__choiceAccess), []);
});

test("old choice changes never control collection or duplicate the current view", async t => {
  const f = await openSite(t);
  const peer = await f.context.newPage(); await peer.goto(origin + "/private");
  await peer.evaluate(key => localStorage.setItem(key, "old denial"), key);
  await f.page.bringToFront();
  await f.page.evaluate(() => { dispatchEvent(new Event("focus")); dispatchEvent(new PageTransitionEvent("pageshow")); });
  assert.equal((await f.views()).length, 1);
  assert.equal(await f.page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), false);
  assert.deepEqual(await f.page.evaluate(() => window.__choiceAccess), []);
});

test("public-private-public navigation excludes the private interval without replay", async t => {
  const f = await openSite(t);
  await f.page.getByRole("link", { name: "Private route", exact: true }).click();
  await f.page.waitForURL("**/private");
  assert.equal(await f.page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true);
  assert.equal((await f.views()).length, 1);
  await f.page.getByRole("link", { name: "Next page", exact: true }).click();
  await f.page.locator('.main[data-analytics-path="/second"]').waitFor();
  assert.deepEqual((await f.views()).map(view => view.page_location), [origin + "/", origin + "/second"]);
  if (sdk) { await deliveredViews(f, 2); assert.doesNotMatch(JSON.stringify(f.events), /\/private/); }
});

test("a document starting private can measure its later committed public page", async t => {
  const f = await openSite(t, { path: "/private" });
  assert.equal(f.sdkRequests.length, 0);
  await f.page.getByRole("link", { name: "Next page", exact: true }).click();
  await f.page.locator('.main[data-analytics-path="/second"]').waitFor();
  assert.deepEqual((await f.views()).map(view => view.page_location), [origin + "/second"]);
  assert.equal(f.sdkRequests.length, 1);
  if (sdk) { await deliveredViews(f, 1); assert.equal(f.events.find(event => event.en === "page_view").dl, origin + "/second"); }
});

test("browser privacy changes stop fresh collection without a reload or denied replay", async t => {
  const f = await openSite(t);
  await f.page.evaluate(() => { window.__retained = true; window.__gpc = true; dispatchEvent(new Event("focus")); });
  assert.equal(await f.page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true);
  await f.page.getByRole("link", { name: "Next page", exact: true }).click();
  await f.page.locator('.main[data-analytics-path="/second"]').waitFor();
  assert.equal((await f.views()).length, 1);
  await f.page.evaluate(() => { window.gtag("event", "select_content", { content_id: "DENIED_SENTINEL" }); });
  await f.page.waitForTimeout(150);
  await f.page.evaluate(() => { window.__gpc = false; dispatchEvent(new Event("focus")); });
  assert.equal(await f.page.evaluate(() => window.__retained), true);
  assert.deepEqual((await f.views()).map(view => view.page_location), [origin + "/", origin + "/second"]);
  if (sdk) { await deliveredViews(f, 2); assert.doesNotMatch(JSON.stringify([...f.events, ...f.controls]), /DENIED_SENTINEL/); }
});
