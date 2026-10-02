import assert from "node:assert/strict";
import fs from "node:fs";
import { before, after, test } from "node:test";
import { chromium } from "playwright";
import { siteJs } from "./site-js.mjs";
import { analyticsConsentHtml } from "./analytics-consent.mjs";
import { webVitalsAssetName, webVitalsRuntime } from "./web-vitals-runtime.mjs";

const origin = "https://docs.openclaw.ai";
const sdk = process.env.DOCS_GA4_SDK_PATH ? fs.readFileSync(process.env.DOCS_GA4_SDK_PATH, "utf8") : "";
const strictCache = process.env.DOCS_GA4_REQUIRE_BFCACHE === "1";
let browser;
before(async () => {
  // Headless-shell's delegate disables BFCache even without the command-line
  // flag. Full managed Chromium's headless mode exercises the real lifecycle.
  browser = await chromium.launch({ channel: "chromium", headless: true, ignoreDefaultArgs: ["--disable-back-forward-cache"] });
});
after(async () => { await browser?.close(); });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fixture(t, initialConsent = "granted") {
  const context = await browser.newContext({ serviceWorkers: "block" });
  context.setDefaultTimeout(10000);
  t.after(() => context.close());
  const events = [], rejected = [];
  let sdkLoads = 0;
  await context.addInitScript(({ initialConsent }) => {
    window.__lifecycle = [];
    addEventListener("pageshow", event => window.__lifecycle.push({ persisted: event.persisted, trusted: event.isTrusted }));
    if (initialConsent && !localStorage.getItem("openclaw.analytics.consent")) {
      const time = Date.now() - 1000;
      localStorage.setItem("openclaw.analytics.consent", JSON.stringify({ schema_version: 1, policy_version: "2026-10-02.v2", analytics: initialConsent, updated_at: new Date(time).toISOString(), expires_at: new Date(time + 180 * 86400000).toISOString() }));
    }
  }, { initialConsent });
  await context.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.hostname === "www.googletagmanager.com" && url.pathname === "/gtag/js") { sdkLoads++; return route.fulfill({ contentType: "text/javascript", body: sdk }); }
    if (/\/(?:g\/)?collect$/.test(url.pathname)) {
      for (const line of (request.postData() || "").split(/\r?\n/)) events.push(Object.fromEntries(new URLSearchParams([url.search.slice(1), line].filter(Boolean).join("&"))));
      return route.fulfill({ status: 204 });
    }
    if (url.origin === "https://away.example" || url.href === origin + "/choice") return route.fulfill({ contentType: "text/html", headers: { "Cache-Control": "public, max-age=600" }, body: "<!doctype html><title>Other document</title><p>Other document</p>" });
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/api/analytics-consent") return route.fulfill({ contentType: "application/json", headers: { "Cache-Control": "private, no-store" }, body: JSON.stringify({ schema_version: 1, policy_version: "2026-10-02.v2", region_class: "opt_in" }) });
    if (url.pathname === "/assets/" + webVitalsAssetName) return route.fulfill({ contentType: "text/javascript", body: webVitalsRuntime });
    if (url.pathname !== "/") return route.fulfill({ status: 404 });
    return route.fulfill({ contentType: "text/html", headers: { "Cache-Control": "public, max-age=600" }, body: `<!doctype html><title>Public cache fixture</title><div class="main" data-analytics-path="/" data-analytics-title="Public cache fixture"><article class="doc"><h1>Public cache fixture</h1></article></div><button data-analytics-choices>Google Analytics choices</button>${analyticsConsentHtml()}<script>${siteJs()}</script>` });
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Page.enable");
  cdp.on("Page.backForwardCacheNotUsed", event => rejected.push(event.notRestoredExplanations));
  await page.goto(origin);
  if (initialConsent === "granted") await page.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
  else await page.waitForFunction(() => document.querySelector("[data-analytics-consent-status]")?.textContent.length > 0);
  if (sdk && initialConsent === "granted") for (let i = 0; i < 70 && events.filter(event => event.en === "page_view").length < 1; i++) await delay(100);
  await page.evaluate(() => {
    window.__retained = true;
    window.__afterSdkRestore = [];
    addEventListener("pageshow", event => {
      if (event.persisted) {
        const disabled = window["ga-disable-G-3SK7X2YLSJ"] === true;
        window.__afterSdkRestore.push({ disabled, trusted: event.isTrusted });
        if (disabled) window.gtag("event", "select_content", { content_id: "DENIED_BFCACHE_MARKER" });
      }
    });
  });
  const state = async () => {
    const response = await cdp.send("Runtime.evaluate", { expression: `JSON.stringify({href:location.href,lifecycle:window.__lifecycle,retained:window.__retained===true,disabled:window['ga-disable-G-3SK7X2YLSJ']===true,afterSdk:window.__afterSdkRestore||[],views:(window.dataLayer||[]).filter(entry=>entry[1]==='page_view').length})`, returnByValue: true });
    return JSON.parse(response.result.value);
  };
  const restore = async () => {
    await page.bringToFront();
    const history = await cdp.send("Page.getNavigationHistory");
    // goBack(waitUntil:load) is the wrong wait for a successful cache restore:
    // it has no new load event. Traverse real history and read the active realm.
    await cdp.send("Page.navigateToHistoryEntry", { entryId: history.entries[history.currentIndex - 1].id });
    for (let i = 0; i < 100; i++) {
      try {
        const current = await state();
        if (current.href === origin + "/" && current.lifecycle?.length && (!current.retained || current.lifecycle.some(event => event.persisted))) return current;
      } catch {}
      await delay(100);
    }
    throw new Error("History traversal did not produce an observable restored or reloaded document");
  };
  return { context, page, events, rejected, state, restore, sdkLoads: () => sdkLoads };
}

function verifyLifecycle(t, state, rejected) {
  assert.ok(state.lifecycle.every(event => event.trusted), "only actual browser lifecycle events qualify");
  if (strictCache) assert.equal(state.retained, true, JSON.stringify(rejected));
  t.diagnostic(JSON.stringify({ persisted: state.lifecycle.some(event => event.persisted), retained: state.retained, rejected }));
}

test("real restored public navigation has one pageview; ordinary pageshow adds none", { timeout: 45000 }, async t => {
  const f = await fixture(t);
  assert.equal((await f.state()).views, 1);
  await f.page.goto("https://away.example/");
  const state = await f.restore();
  verifyLifecycle(t, state, f.rejected);
  assert.equal(state.views, state.retained ? 2 : 1);
  if (state.retained) assert.deepEqual(state.afterSdk, [{ disabled: false, trusted: true }]);
  if (sdk) {
    for (let i = 0; i < 70 && f.events.filter(event => event.en === "page_view").length < 2; i++) await delay(100);
    assert.equal(f.events.filter(event => event.en === "page_view").length, 2);
    if (state.retained) assert.equal(f.sdkLoads(), 1, "a restored document keeps the same installed SDK");
  }
});

test("a cached tab reads another tab's denial before native restore callbacks", { timeout: 45000 }, async t => {
  const f = await fixture(t);
  await f.page.goto("https://away.example/");
  const peer = await f.context.newPage();
  await peer.goto(origin + "/choice");
  const setChoice = choice => peer.evaluate(choice => {
    const now = Date.now();
    localStorage.setItem("openclaw.analytics.consent", JSON.stringify({ schema_version: 1, policy_version: "2026-10-02.v2", analytics: choice, updated_at: new Date(now).toISOString(), expires_at: new Date(now + 180 * 86400000).toISOString() }));
  }, choice);
  await setChoice("denied");
  const state = await f.restore();
  verifyLifecycle(t, state, f.rejected);
  if (state.retained) {
    assert.equal(state.disabled, true);
    assert.deepEqual(state.afterSdk, [{ disabled: true, trusted: true }]);
    assert.equal(state.views, 1);
  } else assert.equal(state.views, 0);
  await delay(1500);
  if (sdk) assert.equal(f.events.filter(event => event.en === "page_view").length, 1, "the denied return is not measured");
  await setChoice("granted");
  await delay(1800);
  assert.doesNotMatch(JSON.stringify(f.events), /DENIED_BFCACHE_MARKER/, "denied restore work is never replayed on a later grant");
});

for (const initial of [null, "denied"]) test(`first grant while cached (${initial || "no choice"}) creates one activation view`, { timeout: 45000 }, async t => {
  const f = await fixture(t, initial);
  assert.equal(f.sdkLoads(), 0); assert.equal(f.events.length, 0);
  await f.page.goto("https://away.example/");
  const peer = await f.context.newPage(); await peer.goto(origin + "/choice");
  await peer.evaluate(() => {
    const now = Date.now(); localStorage.setItem("openclaw.analytics.consent", JSON.stringify({ schema_version: 1, policy_version: "2026-10-02.v2", analytics: "granted", updated_at: new Date(now).toISOString(), expires_at: new Date(now + 180 * 86400000).toISOString() }));
  });
  assert.equal(f.sdkLoads(), 0, "a frozen document does not start its first SDK");
  const state = await f.restore(); verifyLifecycle(t, state, f.rejected);
  assert.equal(state.views, 1);
  if (sdk) {
    for (let i = 0; i < 70 && f.events.filter(event => event.en === "page_view").length < 1; i++) await delay(100);
    await delay(1200);
    assert.equal(f.events.filter(event => event.en === "page_view").length, 1);
    assert.equal(f.sdkLoads(), 1);
  }
});

test("a first grant in an ordinary background tab is not deferred like a cached document", async t => {
  const f = await fixture(t, null);
  const peer = await f.context.newPage(); await peer.goto(origin + "/choice"); await peer.bringToFront();
  await peer.evaluate(() => {
    const now = Date.now(); localStorage.setItem("openclaw.analytics.consent", JSON.stringify({ schema_version: 1, policy_version: "2026-10-02.v2", analytics: "granted", updated_at: new Date(now).toISOString(), expires_at: new Date(now + 180 * 86400000).toISOString() }));
  });
  await f.page.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
  const state = await f.state();
  assert.equal(state.views, 1);
  assert.equal(state.lifecycle.some(event => event.persisted), false);
  await f.page.bringToFront();
  assert.equal((await f.state()).views, 1);
});
