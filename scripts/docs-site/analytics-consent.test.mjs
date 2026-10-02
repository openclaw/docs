import assert from "node:assert/strict";
import fs from "node:fs";
import { before, after, test } from "node:test";
import { chromium } from "playwright";
import { analyticsConsentHtml } from "./analytics-consent.mjs";
import { siteJs } from "./site-js.mjs";
import { siteCss } from "./site-css.mjs";
import { webVitalsAssetName, webVitalsRuntime } from "./web-vitals-runtime.mjs";

const origin = "https://docs.openclaw.ai";
const sdk = process.env.DOCS_GA4_SDK_PATH ? fs.readFileSync(process.env.DOCS_GA4_SDK_PATH, "utf8") : "";
const key = "openclaw.analytics.consent";
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

function saved(analytics, overrides = {}) {
  const now = Date.now();
  return { schema_version: 1, policy_version: "2026-10-02.v2", analytics, updated_at: new Date(now).toISOString(), expires_at: new Date(now + 180 * 86400000).toISOString(), ...overrides };
}
async function openConsent(t, options = {}) {
  const context = await browser.newContext({ serviceWorkers: "block", viewport: options.viewport || { width: 1280, height: 800 } });
  context.setDefaultTimeout(10000);
  t.after(async () => { releaseRegion?.(); await context.close(); });
  const events = [], controls = [], sdkRequests = [], outbound = [];
  let releaseRegion;
  const regionWait = new Promise(resolve => { releaseRegion = resolve; });
  t.after(() => releaseRegion());
  await context.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.hostname === "www.googletagmanager.com" && url.pathname === "/gtag/js") {
      sdkRequests.push(url.href);
      return route.fulfill({ contentType: "text/javascript", body: sdk });
    }
    if (/\/(?:g\/)?collect$/.test(url.pathname)) {
      for (const line of (request.postData() || "").split("\n")) {
        const fields = Object.fromEntries(new URLSearchParams([url.search.slice(1), line].filter(Boolean).join("&")));
        (fields.en ? events : controls).push({ ...fields, receivedAt: Date.now() });
      }
      return route.fulfill({ status: 204 });
    }
    if (url.origin !== origin) { outbound.push(url.href); return route.abort(); }
    if (url.pathname === "/api/analytics-consent") {
      if (options.delayRegion) await regionWait;
      if (options.regionError) return route.fulfill({ status: 503 });
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ schema_version: 1, policy_version: options.policyVersion || "2026-10-02.v2", region_class: options.region || "unknown" }) });
    }
    if (url.pathname === "/assets/" + webVitalsAssetName) return route.fulfill({ contentType: "text/javascript", body: webVitalsRuntime });
    if (url.pathname === "/form-complete") return route.fulfill({ contentType: "text/plain", body: "Accepted fixture submission" });
    if (url.pathname === "/assets/example.pdf") return route.fulfill({ contentType: "application/pdf", headers: { "Content-Disposition": "attachment; filename=example.pdf" }, body: "%PDF-1.4\n%%EOF\n" });
    if (url.pathname !== "/" && url.pathname !== "/second") return route.fulfill({ status: 404 });
    return route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><title>Public ${url.pathname}</title><style>${siteCss()}</style></head><body class="docs-layout"><div class="main" data-analytics-path="${url.pathname}" data-analytics-title="Public ${url.pathname}" data-analytics-release="fixture"><article class="doc" style="margin:40px"><h1>Public documentation</h1><a href="/second">Next page</a><a href="https://clawhub.ai/catalog/public" target="_blank">Catalog</a><a href="https://external.example/public-reference" target="_blank">Public reference</a><a href="/assets/example.pdf" download>Download</a><form id="public-form" action="/form-complete" method="post" target="form-result"><input name="topic" aria-label="Topic"><button>Submit</button></form><iframe name="form-result" title="Form result" hidden></iframe><div style="height:5000px"></div></article></div><footer class="site-footer"><button data-analytics-choices>Google Analytics choices</button></footer>${analyticsConsentHtml()}<script>window.OPENCLAW_DOCS_BASE="";${siteJs()}</script></body></html>` });
  });
  await context.addInitScript(({ key, choice, privacy, storageFailure, theme }) => {
    // Seed once: same-origin form iframes/new tabs must never overwrite a later
    // user denial with this fixture's starting preference.
    if (choice !== undefined && localStorage.getItem(key) === null) localStorage.setItem(key, typeof choice === "string" ? choice : JSON.stringify(choice));
    localStorage.setItem("theme", theme || "dark");
    document.cookie = "baseline=keep; path=/";
    window.__gpc = privacy === "gpc";
    Object.defineProperty(navigator, "globalPrivacyControl", { get: () => window.__gpc });
    if (privacy === "dnt") Object.defineProperty(navigator, "doNotTrack", { value: "1" });
    if (storageFailure) {
      const original = Storage.prototype[storageFailure];
      Storage.prototype[storageFailure] = function(name, ...args) {
        if (name.startsWith(key)) throw new Error("Storage unavailable");
        return original.call(this, name, ...args);
      };
    }
  }, { key, choice: options.choice, privacy: options.privacy, storageFailure: options.storageFailure, theme: options.theme });
  const page = await context.newPage();
  if (options.clock) await page.clock.install();
  await page.goto(origin);
  await page.waitForFunction(() => document.querySelector("[data-analytics-consent-status]").textContent.length > 0);
  const queue = () => page.evaluate(() => (window.dataLayer || []).filter(entry => entry[0] === "event").map(entry => ({ name: entry[1], ...entry[2] })));
  return { page, context, queue, events, controls, sdkRequests, outbound, releaseRegion };
}

for (const region of ["opt_in", "unknown"]) test(`${region} waits for explicit choice and sends only the current page`, async t => {
  const f = await openConsent(t, { region });
  await f.page.getByRole("heading", { name: "Optional Google Analytics", exact: true }).waitFor();
  assert.equal(f.sdkRequests.length, 0);
  assert.equal(f.events.length + f.controls.length, 0);
  assert.equal((await f.context.cookies()).filter(cookie => cookie.name.startsWith("_ga")).length, 0);
  await f.page.getByRole("link", { name: "Next page" }).click();
  await f.page.waitForURL("**/second");
  assert.equal(f.sdkRequests.length, 0);
  await f.page.getByRole("button", { name: "Allow Google Analytics", exact: true }).click();
  await f.page.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
  assert.deepEqual((await f.queue()).filter(event => event.name === "page_view").map(event => event.page_location), [origin + "/second"]);
  const commands = await f.page.evaluate(() => window.dataLayer.filter(entry => ["consent", "config"].includes(entry[0])).map(entry => Array.from(entry)));
  assert.deepEqual(commands[0], ["consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
  assert.deepEqual(commands[1], ["consent", "update", { analytics_storage: "granted" }]);
  assert.equal(commands[2][0], "config");
});

test("notice/opt-out begins only after the trusted response and never fabricates explicit consent", async t => {
  const f = await openConsent(t, { region: "notice_opt_out", delayRegion: true });
  assert.equal(f.sdkRequests.length, 0);
  f.releaseRegion();
  await f.page.getByRole("heading", { name: "Google Analytics on this site", exact: true }).waitFor();
  await f.page.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
  assert.equal(await f.page.evaluate(key => localStorage.getItem(key), key), null);
  assert.equal((await f.queue()).filter(event => event.name === "page_view").length, 1);
});

test("synthetic pageshow notifications never invent restored navigation views", async t => {
  const f = await openConsent(t, { choice: saved("granted") });
  await f.page.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
  await f.page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  assert.equal((await f.queue()).filter(event => event.name === "page_view").length, 1);
});

test("a late regional default cannot override an explicit decline", async t => {
  const f = await openConsent(t, { region: "notice_opt_out", delayRegion: true });
  await f.page.getByRole("button", { name: "Google Analytics choices", exact: true }).click();
  await f.page.getByRole("button", { name: "Decline Google Analytics", exact: true }).click();
  f.releaseRegion();
  await f.page.waitForTimeout(150);
  assert.equal(f.sdkRequests.length, 0);
  assert.equal((await f.queue()).length, 0);
  assert.equal(JSON.parse(await f.page.evaluate(key => localStorage.getItem(key), key)).analytics, "denied");
});

test("a notice dismissed before region resolution is shown before regional enablement", async t => {
  const f = await openConsent(t, { region: "notice_opt_out", delayRegion: true });
  await f.page.getByRole("button", { name: "Google Analytics choices", exact: true }).click();
  await f.page.getByRole("button", { name: "Close Google Analytics choices", exact: true }).click();
  assert.equal(f.sdkRequests.length, 0);
  f.releaseRegion();
  await f.page.getByRole("heading", { name: "Google Analytics on this site", exact: true }).waitFor();
  await f.page.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
});

test("region timeout leaves analytics off until an explicit choice", async t => {
  const f = await openConsent(t, { region: "notice_opt_out", delayRegion: true });
  await f.page.getByRole("heading", { name: "Optional Google Analytics", exact: true }).waitFor();
  assert.equal(f.sdkRequests.length, 0);
  f.releaseRegion();
  await f.page.waitForTimeout(100);
  assert.equal(f.sdkRequests.length, 0);
});

for (const [name, options] of [
  ["stored denial", { choice: saved("denied"), region: "notice_opt_out" }],
  ["expired choice", { choice: saved("granted", { updated_at: "2020-01-01T00:00:00.000Z", expires_at: "2020-02-01T00:00:00.000Z" }) }],
  ["future choice", { choice: saved("granted", { updated_at: "2099-01-01T00:00:00.000Z", expires_at: "2099-02-01T00:00:00.000Z" }) }],
  ["old-v1 choice", { choice: saved("granted", { policy_version: "2026-10-02.v1" }), region: "notice_opt_out" }],
  ["old-v1 denial", { choice: saved("denied", { policy_version: "2026-10-02.v1" }), region: "notice_opt_out" }],
  ["wrong-version choice", { choice: saved("granted", { policy_version: "old" }), region: "notice_opt_out" }],
  ["malformed choice", { choice: "malformed" }],
  ["wrong-version region", { region: "notice_opt_out", policyVersion: "old" }],
  ["failed region", { regionError: true }],
  ["blocked reads", { region: "notice_opt_out", storageFailure: "getItem" }],
  ["blocked writes", { region: "notice_opt_out", storageFailure: "setItem" }],
  ["GPC", { choice: saved("granted"), privacy: "gpc", region: "notice_opt_out" }],
  ["DNT", { choice: saved("granted"), privacy: "dnt", region: "notice_opt_out" }],
]) test(`${name} leaves the Google gate closed`, async t => {
  const f = await openConsent(t, options);
  await f.page.waitForTimeout(150);
  assert.equal(f.sdkRequests.length, 0);
  assert.equal((await f.queue()).length, 0);
  assert.equal(f.events.length + f.controls.length, 0);
});

test("revocation stops native events and retains unrelated baseline cookies", async t => {
  const f = await openConsent(t, { choice: saved("granted") });
  await f.page.evaluate(() => {
    window.__noReload = true;
    window.__eventCaptures = [];
    const gtag = window.gtag;
    // Observe entry timing without changing arguments, SDK, or transport.
    window.gtag = function(...args) {
      if (args[0] === "event") window.__eventCaptures.push({ event: args[1], content_id: args[2]?.content_id, at: Date.now(), denied: window["ga-disable-G-3SK7X2YLSJ"] === true });
      return gtag.apply(this, args);
    };
  });
  await f.page.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
  if (sdk) await f.page.waitForTimeout(1600);
  const before = f.events.length;
  const cookies = (await f.context.cookies()).map(({ name, domain, path }) => ({ name, domain, path }));
  if (sdk) t.diagnostic(`Observed cookie scopes: ${JSON.stringify(cookies)}`);
  await f.page.getByRole("button", { name: "Google Analytics choices", exact: true }).click();
  const allowedCaptureAt = await f.page.evaluate(() => { window.gtag("event", "select_content", { content_type: "public_fixture", content_id: "allowed_pending" }); return Date.now(); });
  await f.page.getByRole("button", { name: "Decline Google Analytics", exact: true }).click();
  assert.equal(await f.page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true);
  const revokedAt = await f.page.evaluate(() => Date.now());
  const afterDecline = f.events.length;
  const deniedAttemptAt = await f.page.evaluate(() => Date.now());
  await f.page.evaluate(() => { document.querySelector("#public-form").id = "DENIED_FORM_MARKER"; });
  await f.page.getByRole("textbox", { name: "Topic" }).fill("PRIVATE_REVOKED_VALUE");
  await f.page.getByRole("button", { name: "Submit", exact: true }).click();
  await f.page.evaluate(() => {
    const link = document.createElement("a");
    link.href = "https://private.example/DENIED_URL_MARKER?q=PRIVATE_REVOKED_VALUE";
    link.target = "_blank";
    link.textContent = "Denied reference";
    document.querySelector(".doc").append(link);
  });
  const deniedPopup = f.context.waitForEvent("page");
  await f.page.getByRole("link", { name: "Denied reference", exact: true }).click();
  await (await deniedPopup).close();
  await f.page.evaluate(() => { window.gtag("event", "select_content", { content_id: "DENIED_EVENT_MARKER" }); window.scrollTo(0, document.documentElement.scrollHeight); });
  await f.page.waitForTimeout(2100);
  if (sdk) {
    t.diagnostic(`Capture/denial chronology (ms relative to applied denial): allowed_pending=${allowedCaptureAt - revokedAt}, denied_actions=${deniedAttemptAt - revokedAt}; transport=${JSON.stringify(f.events.slice(before).map(event => ({ event: event.en, content_id: event["ep.content_id"], relative_ms: event.receivedAt - revokedAt })))}`);
    const captures = await f.page.evaluate(() => window.__eventCaptures);
    assert.ok(captures.filter(capture => capture.content_id !== "DENIED_EVENT_MARKER").every(capture => !capture.denied), "the app generates no new optional event while denied");
    t.diagnostic(`Custom capture chronology: ${JSON.stringify(captures.map(capture => ({ ...capture, at: capture.at - revokedAt })))}`);
    assert.equal((await f.context.cookies()).filter(cookie => ["_ga", "_ga_3SK7X2YLSJ"].includes(cookie.name)).length, 0);
  }
  assert.ok((await f.context.cookies()).some(cookie => cookie.name === "baseline"));
  assert.equal(await f.page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true, "denied native actions cannot grant analytics");
  await f.page.getByRole("link", { name: "Next page" }).click();
  await f.page.waitForURL("**/second");
  await f.page.getByRole("button", { name: "Google Analytics choices", exact: true }).click();
  await f.page.getByRole("button", { name: "Allow Google Analytics", exact: true }).click();
  await f.page.waitForTimeout(2100);
  assert.doesNotMatch(JSON.stringify([...f.events, ...f.controls]), /PRIVATE_REVOKED_VALUE|DENIED_FORM_MARKER|DENIED_EVENT_MARKER|DENIED_URL_MARKER/);
  assert.equal(await f.page.evaluate(() => window.__noReload), true, "consent changes preserve the document and its drafts");
  assert.deepEqual((await f.queue()).filter(event => event.name === "page_view").map(event => event.page_location), [origin + "/", origin + "/second"]);
  t.diagnostic(`Google control requests observed separately: ${f.controls.length}`);
});

test("a successful denial propagates to other same-origin tabs", async t => {
  const f = await openConsent(t, { choice: saved("granted") });
  const peer = await f.context.newPage();
  await peer.goto(origin);
  await peer.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
  await f.page.getByRole("button", { name: "Google Analytics choices", exact: true }).click();
  await f.page.getByRole("button", { name: "Decline Google Analytics", exact: true }).click();
  await peer.waitForFunction(() => window["ga-disable-G-3SK7X2YLSJ"] === true);
  await peer.evaluate(() => window.gtag("event", "select_content", { content_id: "DENIED_PEER_MARKER" }));
  await f.page.getByRole("button", { name: "Google Analytics choices", exact: true }).click();
  await f.page.getByRole("button", { name: "Allow Google Analytics", exact: true }).click();
  await peer.waitForFunction(() => window["ga-disable-G-3SK7X2YLSJ"] === false);
  await peer.waitForTimeout(2100);
  assert.doesNotMatch(JSON.stringify([...f.events, ...f.controls]), /DENIED_PEER_MARKER/);
});

test("failed denial persistence remains denied without reloading or claiming a saved choice", async t => {
  const f = await openConsent(t, { choice: saved("granted") });
  await f.page.getByRole("textbox", { name: "Topic" }).fill("UNSAVED_DRAFT_VALUE");
  await f.page.evaluate(key => {
    window.__noReload = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(name, ...values) { if (name === key) throw new Error("Storage unavailable"); return original.call(this, name, ...values); };
  }, key);
  await f.page.getByRole("button", { name: "Google Analytics choices", exact: true }).click();
  await f.page.getByRole("button", { name: "Decline Google Analytics", exact: true }).click();
  assert.equal(await f.page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true);
  assert.equal(await f.page.getByRole("textbox", { name: "Topic" }).inputValue(), "UNSAVED_DRAFT_VALUE");
  assert.equal(await f.page.evaluate(() => window.__noReload), true);
  assert.equal(JSON.parse(await f.page.evaluate(key => localStorage.getItem(key), key)).analytics, "granted", "the old record was not overwritten");
  await f.page.getByText("Google Analytics is off in this tab, but your choice could not be saved. It may not carry over to another tab or visit.").waitFor();
});

test("a newly enabled browser privacy signal overrides a stored allow", async t => {
  const f = await openConsent(t, { choice: saved("granted") });
  await f.page.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
  await f.page.evaluate(() => { window.__gpc = true; window.dispatchEvent(new Event("focus")); });
  assert.equal(await f.page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true);
  await f.page.getByRole("button", { name: "Google Analytics choices", exact: true }).click();
  assert.equal(await f.page.getByRole("button", { name: "Allow Google Analytics", exact: true }).isEnabled(), false);
  await f.page.getByText("Google Analytics is off because your browser sends a privacy signal.").waitFor();
});

test("an active opt-in tab expires its grant without reload or focus changes", async t => {
  const f = await openConsent(t, { choice: saved("granted", { expires_at: new Date(Date.now() + 10000).toISOString() }), region: "opt_in", clock: true });
  await f.page.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
  await f.page.evaluate(() => { window.__noReload = true; });
  await f.page.clock.runFor(10500);
  assert.equal(await f.page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true);
  assert.equal(await f.page.evaluate(() => window.__noReload), true);
  await f.page.getByRole("heading", { name: "Optional Google Analytics", exact: true }).waitFor();
  const commands = await f.page.evaluate(() => window.dataLayer.filter(entry => entry[0] === "consent").map(entry => Array.from(entry)));
  assert.deepEqual(commands.at(-1), ["consent", "update", { analytics_storage: "denied" }]);
});

test("180-day choice expiry reschedules safely past the browser timeout maximum", async t => {
  const f = await openConsent(t, { choice: saved("granted"), region: "opt_in", clock: true });
  await f.page.waitForFunction(() => window.dataLayer?.some(entry => entry[1] === "page_view"));
  let remaining = await f.page.evaluate(key => Date.parse(JSON.parse(localStorage.getItem(key)).expires_at) - Date.now(), key);
  // Playwright's own fast-forward call also has a signed-32-bit bound.
  while (remaining > 2000) {
    await f.page.clock.fastForward(Math.min(2000000000, remaining - 1000));
    assert.equal(await f.page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), false, "rescheduling does not expire a still-valid choice");
    remaining = await f.page.evaluate(key => Date.parse(JSON.parse(localStorage.getItem(key)).expires_at) - Date.now(), key);
  }
  await f.page.clock.runFor(1500);
  assert.equal(await f.page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true, "expiry fires in the active tab at its deadline");
});

test("the real SDK retains native enhanced events and native cross-domain identity", { skip: !sdk && "needs the coordinator-approved SDK" }, async t => {
  const f = await openConsent(t, { choice: saved("granted") });
  for (let i = 0; i < 40 && !f.events.some(event => event.en === "page_view"); i++) await f.page.waitForTimeout(100);
  await f.page.getByRole("textbox", { name: "Topic" }).fill("PRIVATE_PUBLIC_FORM_VALUE");
  await f.page.getByRole("button", { name: "Submit", exact: true }).click();
  await f.page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await f.page.waitForTimeout(1200);
  let popup = f.context.waitForEvent("page");
  await f.page.getByRole("link", { name: "Public reference", exact: true }).click();
  await (await popup).close();
  const download = f.page.waitForEvent("download");
  await f.page.getByRole("link", { name: "Download", exact: true }).click();
  await download;
  popup = f.context.waitForEvent("page");
  await f.page.getByRole("link", { name: "Catalog", exact: true }).click();
  await (await popup).close();
  await f.page.waitForTimeout(2200);
  const names = new Set(f.events.map(event => event.en));
  for (const name of ["page_view", "scroll", "click", "file_download", "form_start", "form_submit"]) assert.ok(names.has(name), `native ${name}`);
  const decorated = f.outbound.find(url => url.startsWith("https://clawhub.ai/"));
  assert.ok(new URL(decorated).searchParams.get("_gl"), "native linker decorates the cross-domain catalog journey");
  const docsCookie = (await f.context.cookies(origin)).find(cookie => cookie.name === "_ga");
  const aiCookie = (await f.context.cookies("https://openclaw.ai/")).find(cookie => cookie.name === "_ga");
  assert.ok(docsCookie && aiCookie && docsCookie.value === aiCookie.value, "native parent-domain identity reaches ai/docs/community");
  assert.doesNotMatch(JSON.stringify([...f.events, ...f.controls]), /PRIVATE_PUBLIC_FORM_VALUE/);
  await f.page.getByRole("button", { name: "Google Analytics choices", exact: true }).click();
  await f.page.getByRole("button", { name: "Decline Google Analytics", exact: true }).click();
  await f.page.getByRole("link", { name: "Catalog", exact: true }).evaluate(link => { link.href = "https://clawhub.ai/catalog/public-after-denial"; });
  popup = f.context.waitForEvent("page");
  await f.page.getByRole("link", { name: "Catalog", exact: true }).click();
  await (await popup).close();
  const deniedJourney = f.outbound.find(url => url.startsWith("https://clawhub.ai/catalog/public-after-denial"));
  assert.equal(new URL(deniedJourney).searchParams.has("_gl"), false, "a new denied journey does not forward analytics identity");
  t.diagnostic(`Native SDK event families: ${[...names].sort().join(", ")}; control requests: ${f.controls.length}`);
});
