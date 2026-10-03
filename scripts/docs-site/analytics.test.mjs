import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import { parseDocument, DomUtils } from "htmlparser2";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

const origin = "https://docs.openclaw.ai";
const sdkPath = process.env.DOCS_GA4_SDK_PATH;
const sdk = sdkPath ? fs.readFileSync(sdkPath, "utf8") : "";

function analyticsFixture(t, env = {}) {
  const f = fixture(t, [], {
    "index.md": "# Home\n\n[Guide](/guide)\n",
    "guide.md": '# Guide\n\n[Home](/)\n\n[Section](#section)\n\n[Query](/guide?q=QUERY_SECRET)\n\n[German](/de/guide)\n\n## Section\n',
    "de/guide.md": "# Leitfaden\n\n[Home](/)\n",
  });
  write(f.root, "docs/docs.json", JSON.stringify({
    name: "Docs fixture",
    navigation: { languages: ["en", "de"].map(language => ({
      language, tabs: [{ tab: "Docs", groups: [{ group: "Guide", pages: ["index", "guide"] }] }],
    })) },
  }));
  const built = f.build({ DOCS_SITE_GA4_ENABLED: "1", ...env });
  assert.equal(built.status, 0, built.stderr);
  return { ...f, site: path.join(f.root, "dist/docs-site") };
}

test("only public production docs receive analytics metadata", t => {
  const f = analyticsFixture(t);
  for (const route of ["index.html", "guide/index.html", "de/guide/index.html"]) {
    assert.match(fs.readFileSync(path.join(f.site, route), "utf8"), /data-analytics-path=/);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(f.site, "__elements/index.html"), "utf8"), /data-analytics-path=/);
  for (const env of [
    { DOCS_SITE_PREVIEW_MAX_PAGES: "3" },
    { DOCS_SITE_CANONICAL_ORIGIN: "https://preview.example" },
    { DOCS_SITE_BASE_PATH: "/preview" },
    { DOCS_SITE_GA4_ENABLED: "0" },
  ]) {
    const preview = analyticsFixture(t, env);
    const pages = fs.readdirSync(preview.site, { recursive: true }).filter(file => file.endsWith(".html"));
    assert.ok(pages.length > 0);
    for (const file of pages) assert.doesNotMatch(fs.readFileSync(path.join(preview.site, file), "utf8"), /data-analytics-path=/);
  }
});

test("long documents expose no more than 24 public section measurement IDs", t => {
  const f = fixture(t, [], { "long.md": "# Long\n\n" + Array.from({ length: 40 }, (_, i) => `## Section ${i + 1}\n\nPublic text.\n`).join("\n") });
  const built = f.build({ DOCS_SITE_GA4_ENABLED: "1" });
  assert.equal(built.status, 0, built.stderr);
  const dom = parseDocument(fs.readFileSync(path.join(f.root, "dist/docs-site/long/index.html"), "utf8"));
  const main = DomUtils.findOne(node => node.attribs?.["data-analytics-sections"], dom.children, true);
  const sections = JSON.parse(main.attribs["data-analytics-sections"]);
  assert.equal(sections.length, 24);
  assert.equal(sections.at(-1), "section-24");
});

test("native GA4 owns one sanitized view per committed docs navigation", { timeout: 60000 }, async t => {
  const f = analyticsFixture(t);
  const browser = await chromium.launch({ headless: true });
  t.after(async () => { releasePrivate?.(); await browser.close(); });
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.addInitScript(() => {
  });
  context.setDefaultTimeout(10_000);
  const requests = [];
  const sdkRequests = [];
  let holdPrivate = false;
  let releasePrivate;
  let privateRequestStarted;
  const privateRequest = new Promise(resolve => { privateRequestStarted = resolve; });
  t.after(() => releasePrivate?.());
  // Fail closed: even when testing the actual downloaded Google SDK, every
  // browser request is fulfilled locally or aborted. No collection leaves CI.
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === "www.googletagmanager.com" && url.pathname === "/gtag/js") {
      sdkRequests.push(request.url());
      return route.fulfill({ contentType: "text/javascript", body: sdk });
    }
    if (/\/(?:g\/)?collect$/.test(url.pathname)) {
      const lines = (request.postData() || "").split("\n");
      for (const line of lines) {
        requests.push(Object.fromEntries(new URLSearchParams([url.search.slice(1), line].filter(Boolean).join("&"))));
      }
      return route.fulfill({ status: 204 });
    }
    if (["docs.openclaw.ai", "documentation.openclaw.ai", "preview.example", "localhost"].includes(url.hostname)) {
      if (url.pathname === "/private/PRIVATE_URL_SECRET") {
        if (holdPrivate) {
          privateRequestStarted();
          await new Promise(resolve => { releasePrivate = resolve; });
          return route.fulfill({ status: 503, body: "Unavailable" });
        }
        return route.fulfill({
          contentType: "text/html",
          body: '<!doctype html><title>PRIVATE_TITLE_SECRET</title><div class="main"><a href="/de/guide">Public</a></div>',
        });
      }
      let file = path.join(f.site, url.pathname);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        const contentType = ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2" })[path.extname(file)] || "application/octet-stream";
        return route.fulfill({ contentType, body: fs.readFileSync(file) });
      }
      return route.fulfill({ status: 404, body: "Not found" });
    }
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const queuedViews = () => page.evaluate(() => (window.dataLayer || []).filter(entry => entry[0] === "event" && entry[1] === "page_view").map(entry => entry[2]));
  const waitForNativeViews = async count => {
    if (!sdkPath) return;
    for (let attempt = 0; attempt < 60 && requests.filter(request => request.en === "page_view").length < count; attempt++) await page.waitForTimeout(100);
    assert.equal(requests.filter(request => request.en === "page_view").length, count, `settled public navigation ${count}`);
  };
  const entry = new URL(`${origin}/?q=QUERY_SECRET&utm_campaign=CAMPAIGN_SECRET#HASH_SECRET`);
  entry.searchParams.set("token", "example");
  await page.goto(entry.href, { referer: "https://example.com/private/REFERRER_SECRET?q=REFERRER_QUERY_SECRET" });
  await page.waitForFunction(() => window.dataLayer?.some(entry => entry[0] === "event"));
  await waitForNativeViews(1);
  await page.locator('.doc a[href="/guide"]').click();
  await page.waitForURL(`${origin}/guide`);
  await waitForNativeViews(2);
  await page.locator('.doc a[href="#section"]').click();
  await page.locator('.doc a[href*="QUERY_SECRET"]').click();
  await page.waitForURL(`${origin}/guide`);
  assert.equal((await queuedViews()).length, 2, "hash and query changes are not pageviews");
  await page.locator('.doc a[href="/"]').click();
  await page.waitForURL(`${origin}/`);
  await waitForNativeViews(3);
  await page.goBack();
  await page.waitForURL(`${origin}/guide`);
  await page.waitForFunction(() => document.querySelector('.doc a[href="/de/guide"]'));
  await waitForNativeViews(4);
  await page.goForward();
  await page.waitForURL(`${origin}/`);
  await page.waitForFunction(() => document.querySelector('.doc a[href="/guide"]'));
  await waitForNativeViews(5);
  await page.locator('.doc a[href="/guide"]').click();
  await page.waitForURL(`${origin}/guide`);
  await waitForNativeViews(6);
  await page.locator('.doc a[href="/de/guide"]').click();
  await page.waitForURL(`${origin}/de/guide`);
  await waitForNativeViews(7);
  await page.evaluate(() => {
    const link = document.createElement("a");
    link.href = "/private/PRIVATE_URL_SECRET";
    link.textContent = "Private";
    document.querySelector(".main").append(link);
  });
  await page.getByRole("link", { name: "Private", exact: true }).click();
  await page.waitForURL("**/private/PRIVATE_URL_SECRET");
  assert.equal(await page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true);
  await page.evaluate(() => {
    // Exercise the native SDK's opt-out, including its engagement path.
    window.gtag("event", "user_engagement");
  });
  await page.waitForTimeout(500);
  await page.getByRole("link", { name: "Public", exact: true }).click();
  await page.waitForURL(`${origin}/de/guide`);
  assert.equal(await page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), false);
  // Let the public request leave the SDK before deliberately suspending a
  // subsequent history transition. Disabled transport is intentionally lost.
  await waitForNativeViews(8);
  // History changes the URL before PJAX can classify the destination. A slow
  // or failed private response must not leave measurement enabled meanwhile.
  holdPrivate = true;
  const back = page.goBack();
  await page.waitForURL("**/private/PRIVATE_URL_SECRET");
  await Promise.race([privateRequest, page.waitForTimeout(5000).then(() => { throw new Error("Private history fetch did not start"); })]);
  assert.equal(await page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true);
  await page.evaluate(() => window.gtag("event", "user_engagement"));
  releasePrivate();
  await back;
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true, "failed history fetch remains suspended");
  await page.goForward();
  await page.waitForURL(`${origin}/de/guide`);
  assert.equal(await page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), false, "restored public document resumes measurement");
  const views = await queuedViews();
  const paths = ["/", "/guide", "/", "/guide", "/", "/guide", "/de/guide", "/de/guide"];
  assert.deepEqual(views.map(view => view.page_location), paths.map(route => origin + route));
  assert.deepEqual(views.map(view => view.page_referrer), ["https://example.com/", ...paths.slice(0, -1).map(route => origin + route)]);
  assert.match(views.at(-1).page_title, /Leitfaden/);
  assert.equal(sdkRequests.length, 1, "PJAX never reloads the Google tag");
  await page.evaluate(() => {
    const form = document.createElement("form");
    form.innerHTML = '<input name="email" value="FORM_SECRET@example.com"><button>Submit</button>';
    form.addEventListener("submit", event => event.preventDefault());
    document.body.append(form);
    form.requestSubmit();
    history.replaceState({}, "", "?q=SEARCH_SECRET#HASH_SECRET");
  });
  if (sdkPath) {
    // Google may batch transport; the ordinary CI run checks the native queue,
    // and an opt-in SDK run additionally checks its real serialized requests.
    for (let attempt = 0; attempt < 40 && requests.filter(request => request.en === "page_view").length < paths.length; attempt++) {
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1500);
    assert.deepEqual(requests.filter(request => request.en === "page_view").map(request => request.dl), paths.map(route => origin + route));
    assert.ok(requests.every(request => request.tid === "G-3SK7X2YLSJ"));
    const privateValues = /QUERY_SECRET|CAMPAIGN_SECRET|HASH_SECRET|REFERRER_SECRET|REFERRER_QUERY_SECRET|FORM_SECRET|SEARCH_SECRET|PRIVATE_URL_SECRET|PRIVATE_TITLE_SECRET/;
    const violations = requests.flatMap(request => Object.entries(request).filter(([, value]) => privateValues.test(value)).map(([field, value]) => ({ event: request.en, field, value })));
    assert.deepEqual(violations, [], "no private value in any native/custom serialized field");
    t.diagnostic(`Actual Google SDK: ${requests.length} intercepted events, ${paths.length} pageviews; zero collection requests forwarded.`);
  }
  assert.equal((await queuedViews()).length, paths.length);
  assert.deepEqual(errors, []);
  for (const url of ["https://documentation.openclaw.ai/", "https://preview.example/", "http://localhost/", `${origin}/__elements/`, `${origin}/missing`, `${origin}/ask-molty/api/session`]) {
    await page.goto(url);
    assert.equal(await page.evaluate(() => (window.dataLayer || []).length), 0, url);
    assert.equal(sdkRequests.length, 1, `no tag on ${url}`);
  }
});
