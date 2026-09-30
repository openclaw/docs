import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { before, after, test } from "node:test";
import { chromium } from "playwright";
import { parseDocument, DomUtils } from "htmlparser2";
import { releaseAnnouncement } from "./release-announcement.mjs";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

const version = releaseAnnouncement?.version ?? "2099.1.1";
const releaseRoute = `releases/${version}`;
const base = "/manual";
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

function releaseFixture(t, includeRelease = true, includeNavigation = true) {
  const sources = {
    "guide.md": "# Guide\n\n[Home](/)\n",
    "fr/index.md": "# Accueil\n",
    ...(includeRelease ? { [`${releaseRoute}.md`]: `# v${version}\n\nRelease details.\n\n[Home](/)\n` } : {}),
  };
  const f = fixture(t, [], sources, base);
  write(f.root, "docs/docs.json", JSON.stringify({ navigation: { languages: [
    { language: "en", tabs: [
      { tab: "Get started", groups: [{ group: "Docs", pages: ["index", "guide"] }] },
      ...(includeNavigation ? [{ tab: "Releases", groups: [{ group: "Release notes", pages: [releaseRoute] }] }] : []),
    ] },
    { language: "fr", tabs: [{ tab: "Docs", groups: [{ group: "Docs", pages: ["index"] }] }] },
  ] } }));
  const built = f.build();
  assert.equal(built.status, 0, built.stderr);
  return { ...f, site: path.join(f.root, "dist/docs-site") };
}

const all = (html, predicate) => DomUtils.findAll(predicate, parseDocument(html).children);

test("announcement destinations respect the site base and missing/localized pages stay unadvertised", (t) => {
  const f = releaseFixture(t);
  const home = fs.readFileSync(path.join(f.site, "index.html"), "utf8");
  const strip = all(home, node => node.name === "a" && node.attribs.class === "release-strip");
  assert.equal(strip.length, releaseAnnouncement ? 1 : 0);
  if (releaseAnnouncement) assert.equal(strip[0].attribs.href, `${base}/${releaseRoute}`);
  const translated = fs.readFileSync(path.join(f.site, "fr/index.html"), "utf8");
  assert.equal(all(translated, node => /^(release-strip|release-nav-version|release-entry-badge)$/.test(node.attribs.class || "")).length, 0);
  const missing = releaseFixture(t, false);
  const withoutRelease = fs.readFileSync(path.join(missing.site, "index.html"), "utf8");
  assert.equal(all(withoutRelease, node => /^(release-strip|release-nav-version|release-entry-badge)$/.test(node.attribs.class || "")).length, 0);
});

async function openFixture(t, f) {
  const context = await browser.newContext();
  context.setDefaultTimeout(5000);
  t.after(() => context.close());
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://docs.test" || !url.pathname.startsWith(`${base}/`)) return route.abort();
    const relative = url.pathname.slice(base.length + 1);
    let file = path.join(f.site, relative);
    if (!path.extname(file) || fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: "Not found" });
    const contentType = ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2" })[path.extname(file)] || "application/octet-stream";
    await route.fulfill({ contentType, body: fs.readFileSync(file) });
  });
  await context.addInitScript(({ version }) => {
    // Existing browser data must not change the editorial release announcement.
    localStorage.setItem("openclaw.docs.release-seen", version);
    window.releaseStorageAccesses = [];
    for (const method of ["getItem", "setItem", "removeItem"]) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function(key, ...args) {
        if (key === "openclaw.docs.release-seen") window.releaseStorageAccesses.push(method);
        return original.call(this, key, ...args);
      };
    }
  }, { version });
  const page = await context.newPage();
  await page.goto(`http://docs.test${base}/`);
  return page;
}

test("release announcements stay unchanged after visits and reloads without reading or writing view state", { skip: !releaseAnnouncement && "Announcement disabled" }, async t => {
  const f = releaseFixture(t);
  const page = await openFixture(t, f);
  await page.getByRole("link", { name: /New release.*Read release notes/ }).waitFor();
  await page.getByRole("button", { name: /Releases Latest release:/ }).click();
  await page.getByRole("link", { name: `v${version} Latest`, exact: true }).waitFor();
  assert.equal(await page.locator(".release-entry-badge i").isVisible(), true);
  await page.getByRole("button", { name: "Back to all documentation", exact: true }).click();
  await page.locator(".release-strip").click();
  await page.waitForURL(`**/${releaseRoute}`);
  await page.getByRole("button", { name: /Releases Latest release:/ }).click();
  await page.getByRole("link", { name: `v${version} Latest`, exact: true }).waitFor();
  await page.getByRole("button", { name: "Back to all documentation", exact: true }).click();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page.getByRole("link", { name: /New release.*Read release notes/ }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.releaseStorageAccesses), []);
  await page.reload();
  await page.getByRole("link", { name: /New release.*Read release notes/ }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.releaseStorageAccesses), []);
});
