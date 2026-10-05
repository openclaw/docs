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

async function openSite(t, { privacy, clock = false, diagram = false, articleLinks = "", theme = "dark", viewport = { width: 1440, height: 900 } } = {}) {
  const f = fixture(t, [], {
    "guide.md": '# Guide\n\n## Install\n\n```sh title="npm"\nnpm install EXAMPLE_PUBLIC_CODE\n```\n\n[Home](/)\n\n[Contributor](https://github.com/public-contributor)\n\n## Configure\n\nConfiguration guidance.\n\n## Password\n\nPublic password documentation.\n',
  });
  if (articleLinks) fs.appendFileSync(path.join(f.root, "docs/guide.md"), articleLinks);
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
  await context.addInitScript(({ privacy, theme }) => {
    window.__gpc = privacy === "gpc";
    window.__dnt = privacy === "dnt";
    Object.defineProperty(navigator, "globalPrivacyControl", { get: () => window.__gpc });
    Object.defineProperty(navigator, "doNotTrack", { get: () => window.__dnt ? "1" : "0" });
    localStorage.setItem("theme", theme);
    window.__copyFails = false;
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => { if (window.__copyFails) throw new Error("Unavailable"); } } });
    document.execCommand = () => false;
    window.__opened = [];
    window.open = (...args) => { window.__opened.push(args); return null; };
  }, { privacy, theme });
  const page = await context.newPage();
  if (clock) await page.clock.install();
  await page.goto(`${origin}/guide?utm_source=chatgpt&utm_medium=referral&utm_campaign=docs_launch#intro`, { referer: "https://chatgpt.com/c/PRIVATE_REFERRER_VALUE?key=example" });
  await page.waitForFunction(() => document.querySelector(".page-feedback")?.dataset.feedbackReady === "true");
  const events = name => page.evaluate(name => (window.dataLayer || []).filter(entry => entry[0] === "event" && (!name || entry[1] === name)).map(entry => ({ name: entry[1], ...entry[2] })), name);
  const runtimeRelease = /const docsRuntimeRelease="(js-[a-f0-9]{12})";/.exec(fs.readFileSync(path.join(site, "assets/docs-site.js"), "utf8"))?.[1];
  assert.ok(runtimeRelease);
  return { page, context, events, collected, googleRequests, runtimeRelease };
}

async function setBrowserPrivacy(page, blocked) {
  await page.evaluate(blocked => {
    window.__dnt = blocked;
    dispatchEvent(new Event("focus"));
  }, blocked);
}

function wireEvents(collected) {
  return collected.flatMap(request => (request.body || "").split(/\r?\n/).map(line =>
    Object.fromEntries(new URLSearchParams([new URL(request.url).search.slice(1), line].filter(Boolean).join("&")))));
}

test("selection placement and sanitized destination share one event without changing native clicks", async t => {
  const destination = "https://discord.com/invite/clawd";
  const { page, context, events, collected } = await openSite(t, {
    articleLinks: `\n[Community](${destination})\n\n[External reference](https://example.org/guide?ref=docs#intro)\n\n[Product](https://openclaw.ai/install?ref=docs#intro)\n`,
  });
  page.setDefaultTimeout(5000);
  // A 204 keeps same-tab external navigation on the fixture. No destination or
  // collection request is forwarded and the actual anchor href is unchanged.
  await context.route("**/*", route => route.request().isNavigationRequest() && new URL(route.request().url()).origin !== origin
    ? route.fulfill({ status: 204 }) : route.fallback());
  context.on("page", popup => popup.close().catch(() => {}));
  const count = (name, url) => wireEvents(collected).filter(event => event.en === name && (!url || event["ep.link_url"] === url));
  async function clickAndObserve(selector, placement, contentType, contentId, url, native = false) {
    const link = page.locator(selector).first();
    const href = await link.getAttribute("href");
    const before = (await events("select_content")).length;
    const nativeBefore = count("click", url).length;
    const selectionBefore = count("select_content", url).length;
    await link.click();
    const selected = await events("select_content");
    assert.equal(selected.length, before + 1);
    assert.equal(selected.at(-1).ui_location, placement);
    assert.equal(selected.at(-1).content_type, contentType);
    assert.equal(selected.at(-1).content_id, contentId);
    assert.equal(selected.at(-1).link_url, url);
    assert.equal(selected.at(-1).link_domain, new URL(url).hostname);
    const observedHref = new URL(await link.getAttribute("href"), origin);
    const expectedHref = new URL(href, origin);
    // Native Google linker decoration remains allowed; the application must
    // preserve the destination's original query and fragment.
    observedHref.searchParams.delete("_gl");
    expectedHref.searchParams.delete("_gl");
    assert.equal(observedHref.href, expectedHref.href);
    if (sdk) {
      const deadline = Date.now() + 8000;
      while ((count("select_content", url).length === selectionBefore || (native && count("click", url).length === nativeBefore)) && Date.now() < deadline) await page.waitForTimeout(100);
      assert.equal(count("select_content", url).length, selectionBefore + 1);
      const selection = count("select_content", url).at(-1);
      assert.equal(selection["ep.ui_location"], placement);
      assert.equal(selection["ep.link_domain"], new URL(url).hostname);
      if (native) {
        assert.equal(count("click", url).length, nativeBefore + 1);
        assert.equal(count("click", url).at(-1)["ep.ui_location"], undefined);
      }
    }
  }
  for (const [selector, placement] of [[".community-invite", "community_invite"], [".site-footer", "footer"], [".doc", "article"]]) {
    await clickAndObserve(`${selector} a[href="${destination}"]`, placement, "social_link", "discord", destination, true);
  }
  await clickAndObserve('.doc a[href^="https://example.org/"]', "article", "public_reference", "https://example.org/guide", "https://example.org/guide");
  await clickAndObserve('.doc a[href^="https://openclaw.ai/"]', "article", "site_link", "openclaw.ai/install", "https://openclaw.ai/install");
  for (const label of ["Edit source", "Raise issue"]) {
    const link = page.getByRole("link", { name: label, exact: true });
    const url = new URL(await link.getAttribute("href"));
    const clean = url.origin + url.pathname;
    await clickAndObserve(`.page-feedback a[href="${await link.getAttribute("href")}"]`, "page_feedback", "public_reference", clean, clean);
  }

  const beforePrivate = (await events("select_content")).length;
  const nativeBeforePrivate = count("click", destination).length;
  await page.locator("[data-chat-toggle]").click();
  await page.locator(`.site-footer a[href="${destination}"]`).click();
  await page.waitForTimeout(1200);
  await page.locator("[data-chat-minimize]").click();
  await page.waitForTimeout(1200);
  assert.equal((await events("select_content")).length, beforePrivate, "private selection is not replayed on close");
  assert.equal(count("click", destination).length, nativeBeforePrivate, "private native click is not replayed on close");
  await clickAndObserve(`.site-footer a[href="${destination}"]`, "footer", "social_link", "discord", destination, true);
});

test("selection destination stays absent for same-origin, non-anchor, unknown and blocked contexts", async t => {
  const { page, events, googleRequests } = await openSite(t);
  page.setDefaultTimeout(5000);
  await page.locator('[data-feedback-value="yes"]').click();
  let selected = (await events("select_content")).at(-1);
  assert.equal(selected.content_type, "feedback_choice");
  assert.equal(selected.link_url, undefined);
  assert.equal(selected.link_domain, undefined);
  await page.locator('.doc a[href="/"]').click();
  await page.locator('.main[data-analytics-path="/"]').waitFor();
  selected = (await events("select_content")).at(-1);
  assert.equal(selected.content_type, "documentation");
  assert.equal(selected.link_url, undefined);
  assert.equal(selected.link_domain, undefined);
  await page.evaluate(() => {
    for (const [id, href, parent] of [["unknown-link", "https://example.org/unknown", document.body], ["credential-link", "https://example.org/guide", document.querySelector(".doc")], ["non-http-link", "mailto:fixture@example.org", document.querySelector(".doc")]]) {
      const link = document.createElement("a"); link.id = id; link.href = href; link.textContent = id;
      if (id === "credential-link") { link.username = "fixture"; link.password = "fixture"; }
      link.addEventListener("click", event => event.preventDefault());
      parent.append(link);
    }
  });
  const before = (await events("select_content")).length;
  // Exercise rejected owner inputs without navigating to credentials or
  // launching a system mail handler from these deliberately invalid fixtures.
  for (const id of ["unknown-link", "credential-link", "non-http-link"]) await page.locator("#" + id).dispatchEvent("click");
  assert.equal((await events("select_content")).length, before);
  await setBrowserPrivacy(page, true);
  const requestsBefore = googleRequests.length;
  await page.locator('.site-footer a[href="https://discord.com/invite/clawd"]').click();
  await page.waitForTimeout(1200);
  await setBrowserPrivacy(page, false);
  assert.equal((await events("select_content")).length, before);
  assert.equal(googleRequests.length, requestsBefore);
});

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
    await setBrowserPrivacy(page, !allow);
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
    // A browser privacy-signal change can interrupt an open search dialog.
    for (const blocked of startsDenied ? [false] : [true, false]) {
      await setBrowserPrivacy(page, blocked);
      await page.waitForFunction(value => window["ga-disable-G-3SK7X2YLSJ"] === value, blocked);
    }
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
  assert.doesNotMatch(JSON.stringify(await events()), /PRIVATE_CHAT_VALUE|PRIVATE_CHAT_QUERY|PRIVATE_QUESTION_VALUE/);
  if (sdk) {
    const copied = () => collected.some(request => /(?:^|[&\n])en=copy_action(?:&|$)/.test(new URL(request.url).search.slice(1) + "&" + request.body));
    const deadline = Date.now() + 7000;
    while (!copied() && Date.now() < deadline) await page.waitForTimeout(100);
    assert.ok(copied(), "the native post-close public batch was actually observed");
    assert.doesNotMatch(JSON.stringify(collected), /PRIVATE_CHAT_VALUE|PRIVATE_CHAT_QUERY|PRIVATE_QUESTION_VALUE/);
  }
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
  await setBrowserPrivacy(page, true);
  await page.locator('.doc a[href="/"]').click(); await page.waitForURL(`${origin}/`);
  await page.locator('.main[data-analytics-path="/"]').waitFor();
  // A history URL change precedes the asynchronous PJAX DOM commit. Hold that
  // response to exercise the boundary instead of racing it on a fast runner.
  let releaseReturn;
  const heldReturn = new Promise(resolve => { releaseReturn = resolve; });
  let returnRequested;
  const requestStarted = new Promise(resolve => { returnRequested = resolve; });
  await page.route(`${origin}/guide**`, async route => {
    returnRequested(); await heldReturn; await route.fallback();
  });
  try {
    await page.goBack(); await page.waitForURL("**/guide**"); await requestStarted;
    assert.equal(await page.locator(".main").getAttribute("data-analytics-path"), "/");
    assert.equal((await events("page_view")).length, 1);
    await setBrowserPrivacy(page, false);
    assert.equal((await events("page_view")).length, 1, "an uncommitted URL cannot start a public view");
  } finally { releaseReturn(); }
  await page.locator('.main[data-analytics-path="/guide"]').waitFor();
  await page.waitForFunction(() => window.dataLayer.filter(entry => entry[1] === "page_view").length === 2);
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

for (const privacy of ["gpc", "dnt"]) test(`${privacy} prevents Google tag loading and custom collection`, async t => {
  const { page, events, googleRequests } = await openSite(t, { privacy });
  await page.locator("[data-code-copy]").click();
  assert.deepEqual(await events(), []);
  assert.equal(googleRequests.length, 0);
});

test("public pages have no analytics prompts or controls on desktop and mobile", async t => {
  for (const theme of ["light", "dark"]) for (const viewport of [{ width: 1440, height: 900 }, { width: 320, height: 568 }]) {
    const { page, context, googleRequests } = await openSite(t, { theme, viewport });
    assert.equal(await page.locator("[data-analytics-consent],[data-analytics-choices],[data-analytics-allow],[data-analytics-deny]").count(), 0);
    assert.equal(googleRequests.length, 1);
    assert.equal(await page.locator(".site-footer-legal").getByRole("link", { name: "OpenClaw Foundation", exact: true }).getAttribute("href"), "https://openclaw.org");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (process.env.DOCS_GA4_VISUAL_DIR) {
      fs.mkdirSync(process.env.DOCS_GA4_VISUAL_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.DOCS_GA4_VISUAL_DIR, `${theme}-${viewport.width}.png`) });
    }
  }
});
