import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import { releaseNavigationEntries, patchReleaseSlugs, patchReleaseBadgeHtml } from "./release-navigation.mjs";
import { homeStrings } from "./home-strings.mjs";
import { flattenNavEntries } from "./navigation.mjs";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

const slugs = ["releases/index", "releases/2026.11.3", "releases/2026.11.2", "releases/2026.10.10", "releases/2026.10.1", "releases/2026.9.9", "releases/2025.11.1", "changelog"];
const entries = slugs.map(slug => ({ slug, locale: "en", title: slug }));

test("release months preserve every source link and order without mutating navigation", () => {
  const original = JSON.stringify(entries);
  const grouped = releaseNavigationEntries(entries, "en", "releases/2026.10.1");
  assert.deepEqual(flattenNavEntries(grouped), entries);
  assert.equal(JSON.stringify(entries), original);
  assert.deepEqual(grouped.filter(entry => entry.releaseMonth).map(entry => [entry.group, entry.defaultOpen]), [
    ["November 2026", false], ["October 2026", true], ["September 2026", false], ["November 2025", false],
  ]);
  assert.equal(grouped[0], entries[0]);
  assert.equal(grouped.at(-1), entries.at(-1));
});

test("overview defaults to the newest source month and labels follow the page locale", () => {
  const grouped = releaseNavigationEntries(entries, "fr", "releases/index");
  assert.equal(grouped[1].group, "novembre 2026");
  assert.deepEqual(grouped.filter(entry => entry.defaultOpen).map(entry => entry.releaseMonth), ["2026-11"]);
});

test("localized month names retain the Gregorian release calendar", () => {
  for (const [locale, expected] of [["fa", "ژوئن ۲۰۲۶"], ["th", "มิถุนายน 2026"]]) {
    const grouped = releaseNavigationEntries([{ slug: "releases/2026.6.11" }], locale, "releases/2026.6.11");
    assert.equal(grouped[0].group, expected);
    assert.equal(grouped[0].releaseMonth, "2026-06");
    assert.equal(grouped[0].defaultOpen, true);
    assert.equal(grouped[0].pages[0].slug, "releases/2026.6.11");
  }
});

test("nested source groups, non-release pages and invalid months are preserved", () => {
  const other = { group: "Reference", pages: [{ slug: "guide/2026.11.1" }, { slug: "releases/2026.13.1" }] };
  const source = [{ group: "Archive", pages: entries }, other];
  const grouped = releaseNavigationEntries(source, "en", "releases/2025.11.1");
  assert.deepEqual(flattenNavEntries(grouped), flattenNavEntries(source));
  assert.equal(grouped[0].group, "Archive");
  assert.equal(grouped[0].pages.at(-2).defaultOpen, true);
  assert.deepEqual(grouped[1], other);
});

test("patch badges require a release-owned introduction rather than version guessing", () => {
  const page = (slug, body, locale = "en") => ({ slug, body, locale });
  assert.deepEqual([...patchReleaseSlugs([
    page("releases/2026.11.3", "This is a patch release with no new features."),
    page("releases/2026.11.1", "This patch release adds no new features."),
    page("releases/2026.10.10", "New features.\n\n## History\nThis is a patch release with no new features."),
    page("guide", "This is a patch release with no new features."),
    page("releases/2026.11.2", "This is a patch release with no new features.", "fr"),
    { ...page("releases/2026.10.2", "Fixes for updates."), description: "OpenClaw v2026.10.2 patch release notes" },
  ])], ["releases/2026.11.3", "releases/2026.11.1", "releases/2026.10.2"]);
  assert.match(patchReleaseBadgeHtml("fr"), />Correctif</);
  for (const locale of Object.keys(homeStrings)) assert.ok(!patchReleaseBadgeHtml(locale).includes("undefined"));
});

test("responsive release disclosures reveal the selected month on direct and PJAX navigation", async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const f = fixture(t, [], Object.fromEntries(slugs.map(slug => [`${slug}.md`, `---\ntitle: "${slug.startsWith("releases/202") ? `v${slug.slice(9)}` : slug}"\n---\n# Release fixture\n\n${["releases/2026.11.3", "releases/2026.10.1"].includes(slug) ? "This is a patch release with no new features.\n\n" : ""}[Newest](/releases/2026.11.3)\n`])));
  write(f.root, "docs/docs.json", JSON.stringify({ navigation: { languages: [{ language: "en", tabs: [
    { tab: "Get started", groups: [{ group: "Docs", pages: ["index"] }] },
    { tab: "Releases", groups: [{ group: "Release notes", pages: slugs }] },
  ] }] } }));
  const built = f.build();
  assert.equal(built.status, 0, built.stderr);
  const site = path.join(f.root, "dist/docs-site");
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    context.setDefaultTimeout(5000);
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.origin !== "http://docs.test") return route.abort();
      let file = path.join(site, url.pathname);
      if (!path.extname(file) || fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: "Not found" });
      const contentType = ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2" })[path.extname(file)] || "application/octet-stream";
      return route.fulfill({ contentType, body: fs.readFileSync(file) });
    });
    const page = await context.newPage();
    await page.goto("http://docs.test/releases/2026.10.1");
    await page.locator('.docs-sidebar-levels[data-level="section"]').waitFor({ state: "attached" });
    if (width < 821) await page.locator("[data-nav-toggle]").click();
    const months = page.locator(".release-nav-month");
    assert.equal(await months.count(), 4);
    assert.equal(await page.locator('.sidebar a[href="/releases/2026.10.1"] .release-patch-badge').textContent(), "Patch");
    assert.equal(await page.locator('.sidebar a[href="/releases/2026.10.10"] .release-patch-badge').count(), 0);
    assert.equal(await page.locator('.sidebar a[href="/releases/2026.11.3"] .release-entry-badge').count(), 1);
    assert.deepEqual(await months.evaluateAll(nodes => nodes.map(node => node.open)), [false, true, false, false]);
    assert.equal(await page.locator('.nav-link.active[href="/releases/2026.10.1"]').isVisible(), true);
    // A month disclosure remains a keyboard-operable native control.
    const november = months.nth(0).locator(":scope > summary");
    await november.focus();
    await page.keyboard.press("Enter");
    assert.equal(await months.nth(0).evaluate(node => node.open), true);
    await page.locator('.sidebar a[href="/releases/2026.11.3"]').click();
    await page.waitForURL("**/releases/2026.11.3");
    if (width < 821) await page.locator("[data-nav-toggle]").click();
    assert.equal(await page.locator('.nav-link.active[href="/releases/2026.11.3"]').isVisible(), true);
    assert.equal(await months.nth(0).evaluate(node => node.open), true);
    // Navigating to a closed month through article content must reveal it too.
    await page.goto("http://docs.test/releases/2026.9.9");
    await page.locator('.docs-sidebar-levels[data-level="section"]').waitFor({ state: "attached" });
    await page.locator(".doc a", { hasText: "Newest" }).click();
    await page.waitForURL("**/releases/2026.11.3");
    if (width < 821) await page.locator("[data-nav-toggle]").click();
    assert.equal(await page.locator('.nav-link.active[href="/releases/2026.11.3"]').isVisible(), true);
    await page.goto("http://docs.test/releases/2026.11.3");
    await page.locator('.docs-sidebar-levels[data-level="section"]').waitFor({ state: "attached" });
    if (width < 821) await page.locator("[data-nav-toggle]").click();
    assert.deepEqual(await months.evaluateAll(nodes => nodes.map(node => node.open)), [true, false, false, false]);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (process.env.RELEASE_NAV_ARTIFACT_DIR) {
      fs.mkdirSync(process.env.RELEASE_NAV_ARTIFACT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.RELEASE_NAV_ARTIFACT_DIR, `release-months-${width}.png`) });
    }
    await context.close();
  }
});
