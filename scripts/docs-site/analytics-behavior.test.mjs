import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { before, after, test } from "node:test";
import { chromium } from "playwright";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

const origin = "https://docs.openclaw.ai";
const sdk = process.env.DOCS_GA4_SDK_PATH ? fs.readFileSync(process.env.DOCS_GA4_SDK_PATH, "utf8") : "";
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

async function openSite(t, { privacy, clock = false, diagram = false, showConsent = false, theme = "dark", viewport = { width: 1440, height: 900 } } = {}) {
  const f = fixture(t, [], {
    "guide.md": '# Guide\n\n## Install\n\n```sh title="npm"\nnpm install EXAMPLE_PUBLIC_CODE\n```\n\n[Home](/)\n\n[Contributor](https://github.com/public-contributor)\n\n## Configure\n\nConfiguration guidance.\n\n## Password\n\nPublic password documentation.\n',
  });
  if (diagram) {
    fs.appendFileSync(path.join(f.root, "docs/guide.md"), "\n```mermaid\nflowchart LR\n A --> B\n```\n");
    fs.symlinkSync(path.resolve("node_modules"), path.join(f.root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  }
  write(f.root, "docs/docs.json", JSON.stringify({ name: "Docs fixture", navigation: { languages: [{ language: "en", tabs: [{ tab: "Docs", groups: [{ group: "Guide", pages: ["index", "guide"] }] }] }] } }));
  const built = f.build({ DOCS_SITE_GA4_ENABLED: "1", GITHUB_SHA: "1234567890abcdef1234567890abcdef12345678" });
  assert.equal(built.status, 0, built.stderr);
  const site = path.join(f.root, "dist/docs-site");
  const context = await browser.newContext({ serviceWorkers: "block", viewport, reducedMotion: "reduce" });
  t.after(() => context.close());
  const collected = [];
  const googleRequests = [];
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === "www.googletagmanager.com" && url.pathname === "/gtag/js") {
      googleRequests.push(url.href);
      return route.fulfill({ contentType: "text/javascript", body: sdk });
    }
    if (/\/(?:g\/)?collect$/.test(url.pathname)) {
      collected.push({ url: request.url(), body: request.postData() || "", headers: request.headers() });
      return route.fulfill({ status: 204 });
    }
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/ask-molty/api/chat") return route.fulfill(request.method() === "GET"
      ? { contentType: "application/json", body: "{}" }
      : { contentType: "text/plain", body: "[Private reference](https://private.example/PRIVATE_CHAT_VALUE?q=PRIVATE_CHAT_QUERY)" });
    if (url.pathname === "/pagefind/pagefind.js") return route.fulfill({ contentType: "text/javascript", body: `
      export async function init() {}
      export async function search(q) { if(q.includes("delay")) await window.__searchWait; if(q.includes("error")) throw new Error("Fixture search error"); return {results: Array.from({length:q.includes("missing")?0:q.includes("many")?20:1},(_,i)=>({data: async () => ({url:"/guide#result-"+i,meta:{title:"Guide"},excerpt:"Public guidance"})}))}; }
    ` });
    let file = path.join(site, url.pathname);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: "Missing" });
    const contentType = ({ ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2" })[path.extname(file)] || "application/octet-stream";
    return route.fulfill({ contentType, body: fs.readFileSync(file) });
  });
  await context.addInitScript(({ privacy, showConsent, theme }) => {
    if (privacy === "gpc") Object.defineProperty(navigator, "globalPrivacyControl", { value: true });
    if (privacy === "dnt") Object.defineProperty(navigator, "doNotTrack", { value: "1" });
    const now = Date.now();
    if (!showConsent) localStorage.setItem("openclaw.analytics.consent", JSON.stringify({ schema_version: 1, policy_version: "2026-10-02.v2", analytics: privacy === "optout" ? "denied" : "granted", updated_at: new Date(now).toISOString(), expires_at: new Date(now + 180 * 86400000).toISOString() }));
    localStorage.setItem("theme", theme);
    window.__copyFails = false;
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => { if (window.__copyFails) throw new Error("Unavailable"); } } });
    document.execCommand = () => false;
    window.__opened = [];
    window.open = (...args) => { window.__opened.push(args); return null; };
  }, { privacy, showConsent, theme });
  const page = await context.newPage();
  if (clock) await page.clock.install();
  await page.goto(`${origin}/guide?utm_source=chatgpt&utm_medium=referral&utm_campaign=docs_launch#intro`, { referer: "https://chatgpt.com/c/PRIVATE_REFERRER_VALUE?key=example" });
  await page.waitForFunction(() => document.querySelector(".page-feedback")?.dataset.feedbackReady === "true");
  const events = name => page.evaluate(name => (window.dataLayer || []).filter(entry => entry[0] === "event" && (!name || entry[1] === name)).map(entry => ({ name: entry[1], ...entry[2] })), name);
  const runtimeRelease = /const docsRuntimeRelease="(js-[a-f0-9]{12})";/.exec(fs.readFileSync(path.join(site, "assets/docs-site.js"), "utf8"))?.[1];
  assert.ok(runtimeRelease);
  return { page, context, events, collected, googleRequests, runtimeRelease };
}

async function setSavedChoice(page, analytics) {
  await page.evaluate(analytics => {
    const key = "openclaw.analytics.consent", now = Date.now();
    const value = JSON.stringify({ schema_version: 1, policy_version: "2026-10-02.v2", analytics, updated_at: new Date(now).toISOString(), expires_at: new Date(now + 180 * 86400000).toISOString() });
    localStorage.setItem(key, value);
    dispatchEvent(new StorageEvent("storage", { key, newValue: value }));
  }, analytics);
}

test("acquisition, actual copy outcomes, public identifiers and feedback launch stay useful and safe", async t => {
  const { page, context, events, collected, runtimeRelease } = await openSite(t);
  const view = (await events("page_view"))[0];
  assert.equal(view.page_location, `${origin}/guide?utm_source=chatgpt&utm_medium=referral&utm_campaign=docs_launch`);
  assert.equal(view.page_referrer, "https://chatgpt.com/");
  assert.equal(view.release, runtimeRelease);
  await page.locator("[data-code-copy]").click();
  await page.waitForFunction(() => window.dataLayer.some(entry => entry[1] === "copy_action"));
  await page.evaluate(() => { window.__copyFails = true; });
  await page.locator("[data-code-copy]").click();
  await page.waitForFunction(() => window.dataLayer.filter(entry => entry[1] === "copy_action").length === 2);
  assert.deepEqual((await events("copy_action")).map(event => event.action_result), ["success", "error"]);
  assert.ok((await events("copy_action")).every(event => event.method === "npm" && event.content_id === "/guide#code-1"));
  const contributor = page.locator('.doc a[href="https://github.com/public-contributor"]');
  await contributor.evaluate(link => { link.target = "_blank"; });
  const popupPromise = context.waitForEvent("page");
  await contributor.click();
  await (await popupPromise).close();
  assert.ok((await events("select_content")).some(event => event.content_id === "https://github.com/public-contributor"));
  await page.locator('[data-feedback-value="no"]').click();
  await page.locator("[data-feedback-detail]").fill("PRIVATE_FEEDBACK_VALUE");
  const launcher = page.getByRole("button", { name: "Open issue", exact: true });
  assert.equal(await launcher.getAttribute("href"), null);
  assert.equal(await page.locator('a[href*="PRIVATE_FEEDBACK_VALUE"]').count(), 0);
  await launcher.focus();
  await page.keyboard.press("Enter");
  const opened = await page.evaluate(() => window.__opened);
  assert.equal(opened.length, 1);
  assert.match(new URL(opened[0][0]).searchParams.get("body"), /PRIVATE_FEEDBACK_VALUE/);
  assert.equal((await events("form_attempt"))[0].form_id, "docs_feedback");
  assert.equal((await events("generate_lead")).length, 0, "opening an issue is not confirmed issue creation");
  assert.doesNotMatch(JSON.stringify(await events()), /EXAMPLE_PUBLIC_CODE|PRIVATE_FEEDBACK_VALUE|PRIVATE_REFERRER_VALUE/);
  if (sdk) {
    await page.waitForTimeout(2000);
    assert.doesNotMatch(JSON.stringify(collected), /PRIVATE_FEEDBACK_VALUE|PRIVATE_REFERRER_VALUE/);
  }
});

test("custom search counts stable rendered results and selection, never keystrokes or unsafe terms", async t => {
  const { page, events, collected } = await openSite(t);
  await page.locator("[data-search-open]").first().click();
  await page.locator("[data-search-input]").fill("gui");
  await page.waitForTimeout(350);
  await page.locator("[data-search-input]").fill("guide");
  await page.locator(".search-result").first().waitFor();
  assert.equal((await events("search")).length, 0);
  await page.locator(".search-result").first().click();
  const search = (await events("search"))[0];
  assert.equal(search.search_term, "guide");
  assert.equal(search.result_count, 1);
  assert.equal(search.search_status, "complete");
  assert.ok((await events("select_content")).some(event => event.content_type === "search_result"));
  await page.locator("[data-search-open]").first().click();
  await page.locator("[data-search-input]").fill("missing PRIVATE_SEARCH_VALUE@example.com");
  await page.locator(".search-empty").waitFor();
  await page.waitForTimeout(1350);
  const empty = (await events("search")).at(-1);
  assert.equal(empty.result_count, 0);
  assert.equal(empty.search_status, "complete");
  assert.equal(empty.search_term, undefined);
  await page.locator("[data-search-input]").fill("many guide");
  await page.waitForFunction(() => document.querySelectorAll(".search-result").length === 12);
  await page.waitForTimeout(1300);
  const capped = (await events("search")).at(-1);
  assert.equal(capped.result_count, 12);
  assert.equal(capped.search_status, "partial");
  await page.locator("[data-search-input]").fill("error guide");
  await page.locator(".search-unavailable").waitFor();
  await page.waitForTimeout(1300);
  const failed = (await events("search")).at(-1);
  assert.equal(failed.search_status, "error");
  assert.equal(failed.result_count, undefined);
  await page.locator("[data-search-input]").fill("my password is guide");
  await page.locator(".search-result").first().waitFor();
  await page.keyboard.press("Escape");
  assert.equal((await events("search")).at(-1).search_term, undefined, "a personal credential phrase is redacted even when every word is public vocabulary");
  assert.equal((await events("popup_dismiss")).at(-1).dismiss_method, "escape");
  assert.doesNotMatch(JSON.stringify(await events()), /PRIVATE_SEARCH_VALUE/);
  if (sdk) { await page.waitForTimeout(2000); assert.doesNotMatch(JSON.stringify(collected), /PRIVATE_SEARCH_VALUE/); }
});

test("async copy and search cannot cross a withdrawn collection interval", async t => {
  const { page, events, collected } = await openSite(t);
  const choose = async allow => {
    await setSavedChoice(page, allow ? "granted" : "denied");
  };
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => new Promise(resolve => { window.__finishCopy = resolve; });
  });
  await page.locator("[data-code-copy]").click();
  await page.waitForFunction(() => typeof window.__finishCopy === "function");
  await choose(false); await choose(true);
  await page.evaluate(() => window.__finishCopy());
  await page.waitForTimeout(150);
  assert.equal((await events("copy_action")).length, 0, "a completion from the previous allowed interval is not replayed");
  for (const startsDenied of [false, true]) {
    if (startsDenied) await choose(false);
    await page.evaluate(() => { window.__searchWait = new Promise(resolve => { window.__finishSearch = resolve; }); });
    await page.locator("[data-search-open]").first().click();
    await page.locator("[data-search-input]").fill("delay guide");
    await page.waitForTimeout(350);
    // Save preference through another same-origin tab while the search dialog
    // stays open, then let the real storage listener update this runtime.
    const peer = await page.context().newPage();
    await peer.goto(origin + "/");
    for (const analytics of startsDenied ? ["granted"] : ["denied", "granted"]) {
      await peer.evaluate(analytics => {
        const key = "openclaw.analytics.consent";
        localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)), analytics }));
      }, analytics);
      await page.waitForFunction(denied => window["ga-disable-G-3SK7X2YLSJ"] === denied, analytics === "denied");
    }
    await peer.close();
    await page.evaluate(() => window.__finishSearch());
    await page.locator(".search-result").first().waitFor();
    await page.keyboard.press("Escape");
    assert.equal((await events("search")).length, 0, "denied or earlier-interval searches are not collected after grant");
  }
  if (sdk) {
    await page.waitForTimeout(2200);
    assert.ok(collected.every(request => !/(?:^|[&\n])en=(?:copy_action|search)(?:&|$)/.test(new URL(request.url).search.slice(1) + "&" + request.body)));
  }
});

test("private assistant pauses native collection through closing, without disabling signed-in public docs", async t => {
  const { page, context, events, collected } = await openSite(t);
  const initialViews = (await events("page_view")).length;
  await page.getByRole("button", { name: "Ask Molty", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("[data-docs-chat]").dataset.chatAuthState === "ready");
  assert.equal(await page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), true);
  await page.locator("[data-chat-input]").fill("PRIVATE_QUESTION_VALUE");
  await page.locator("[data-chat-submit]").click();
  const privateLink = page.getByRole("link", { name: "Private reference", exact: true });
  await privateLink.waitFor();
  const popupPromise = context.waitForEvent("page");
  await privateLink.click();
  await (await popupPromise).close();
  await page.locator("[data-chat-copy]").click();
  assert.equal((await events("copy_action")).length, 0, "private activity is dropped, not queued");
  await page.getByRole("button", { name: "Minimize", exact: true }).click();
  assert.equal(await page.evaluate(() => window["ga-disable-G-3SK7X2YLSJ"]), false);
  assert.equal((await events("page_view")).length, initialViews, "closing a private panel is not a new public page");
  await page.locator("[data-code-copy]").click();
  assert.equal((await events("copy_action")).length, 1, "public actions still work for the authenticated visitor");
  await page.waitForTimeout(2100);
  assert.doesNotMatch(JSON.stringify(await events()), /PRIVATE_CHAT_VALUE|PRIVATE_CHAT_QUERY|PRIVATE_QUESTION_VALUE/);
  if (sdk) assert.doesNotMatch(JSON.stringify(collected), /PRIVATE_CHAT_VALUE|PRIVATE_CHAT_QUERY|PRIVATE_QUESTION_VALUE/);
});

test("diagram popup reports actual opening and Escape dismissal", async t => {
  const { page, events } = await openSite(t, { diagram: true });
  await page.locator("[data-mermaid-expand]").click();
  await page.waitForFunction(() => window.dataLayer.some(entry => entry[1] === "popup_view" && entry[2].popup_id === "docs_diagram"));
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.dataLayer.some(entry => entry[1] === "popup_dismiss" && entry[2].popup_id === "docs_diagram"));
  assert.equal((await events("popup_dismiss")).find(event => event.popup_id === "docs_diagram").dismiss_method, "escape");
  await page.locator('.doc a[href="/"]').click();
  await page.waitForURL(`${origin}/`);
  await page.goBack();
  await page.waitForURL("**/guide**");
  await page.locator("[data-mermaid-expand]").click();
  await page.locator("[data-mermaid-overlay-close]").click();
  await page.waitForFunction(() => window.dataLayer.filter(entry => entry[1] === "popup_dismiss" && entry[2].popup_id === "docs_diagram").length === 2);
  assert.equal((await events("popup_dismiss")).filter(event => event.popup_id === "docs_diagram").at(-1).dismiss_method, "close_button");
});

test("navigation performed under the private assistant hold is not replayed on close", async t => {
  const { page, events } = await openSite(t);
  await page.getByRole("button", { name: "Ask Molty", exact: true }).click();
  await page.locator('.doc a[href="/"]').click();
  await page.waitForURL(`${origin}/`);
  await page.getByRole("button", { name: "Minimize", exact: true }).click();
  assert.equal((await events("page_view")).length, 1);
  assert.equal((await events("popup_dismiss")).find(event => event.popup_id === "docs_assistant").page_location, `${origin}/`, "public event context resumes on the current page without a historical view");
});

test("regrant after an unmeasured return to the same route starts one current view and rebinds sections", async t => {
  const { page, events } = await openSite(t);
  await page.waitForFunction(() => window.dataLayer.some(entry => entry[1] === "section_view" && entry[2].section_id === "install"));
  await setSavedChoice(page, "denied");
  await page.locator('.doc a[href="/"]').click(); await page.waitForURL(`${origin}/`);
  await page.goBack(); await page.waitForURL("**/guide**");
  assert.equal((await events("page_view")).length, 1);
  await setSavedChoice(page, "granted");
  assert.equal((await events("page_view")).length, 2);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForFunction(() => window.dataLayer.filter(entry => entry[1] === "section_view" && entry[2].section_id === "install").length === 2);
});

test("scroll and section milestones reset per view; bounded errors expose no raw details", async t => {
  const { page, events } = await openSite(t);
  await page.addStyleTag({ content: ".doc { min-height: 4000px } #configure { margin-top: 2000px }" });
  await page.waitForFunction(() => window.dataLayer.some(entry => entry[1] === "section_view"));
  assert.ok((await events("section_view")).some(event => event.section_id === "install"));
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForFunction(() => window.dataLayer.filter(entry => entry[1] === "scroll_depth").length === 3);
  assert.deepEqual((await events("scroll_depth")).map(event => event.percent_scrolled), [25, 50, 75]);
  await page.evaluate(() => { window.scrollTo({ top: 0, behavior: "instant" }); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }); });
  await page.waitForTimeout(100);
  assert.equal((await events("scroll_depth")).length, 3);
  await page.evaluate(() => {
    for (let i = 0; i < 8; i++) window.dispatchEvent(new ErrorEvent("error", { message: "PRIVATE_ERROR_VALUE", error: new TypeError("PRIVATE_ERROR_VALUE") }));
  });
  assert.equal((await events("client_error")).filter(event => event.error_code === "type_error").length, 1);
  assert.doesNotMatch(JSON.stringify(await events()), /PRIVATE_ERROR_VALUE/);
  await page.locator('.doc a[href="/"]').click();
  await page.waitForURL(`${origin}/`);
  assert.equal((await events("page_view")).length, 2);
  assert.ok((await events("web_vital")).every(event => ["LCP", "INP", "CLS"].includes(event.metric_name) && Number.isFinite(event[{ LCP: "lcp_ms", INP: "inp_ms", CLS: "cls_score" }[event.metric_name]])));
});

test("reading milestones report only bounded visible time without inflating native engagement", async t => {
  const { page, events } = await openSite(t, { clock: true });
  await page.waitForFunction(() => window.dataLayer.some(entry => entry[1] === "page_view"));
  await page.clock.runFor(31000);
  assert.deepEqual((await events("content_engagement")).map(event => event.engagement_seconds), [30]);
  await page.clock.runFor(31000);
  const milestones = await events("content_engagement");
  assert.deepEqual(milestones.map(event => event.engagement_seconds), [30, 60]);
  assert.ok(milestones.every(event => event.engagement_time_msec === undefined));
});

for (const privacy of ["gpc", "dnt", "optout"]) test(`${privacy} prevents Google tag loading and custom collection`, async t => {
  const { page, events, googleRequests } = await openSite(t, { privacy });
  await page.locator("[data-code-copy]").click();
  assert.deepEqual(await events(), []);
  assert.equal(googleRequests.length, 0);
});

test("public pages have no analytics prompts or controls on desktop and mobile", async t => {
  for (const theme of ["light", "dark"]) for (const viewport of [{ width: 1440, height: 900 }, { width: 320, height: 568 }]) {
    const { page, context, googleRequests } = await openSite(t, { showConsent: true, theme, viewport });
    assert.equal(await page.locator("[data-analytics-consent],[data-analytics-choices],[data-analytics-allow],[data-analytics-deny]").count(), 0);
    assert.equal(googleRequests.length, 0);
    assert.equal(await page.locator(".site-footer-legal").getByRole("link", { name: "OpenClaw Foundation", exact: true }).getAttribute("href"), "https://openclaw.org");
    assert.equal((await context.cookies()).filter(cookie => cookie.name.startsWith("_ga")).length, 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (process.env.DOCS_GA4_VISUAL_DIR) {
      fs.mkdirSync(process.env.DOCS_GA4_VISUAL_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.DOCS_GA4_VISUAL_DIR, `${theme}-${viewport.width}.png`) });
    }
  }
});
