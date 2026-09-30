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
  const released = fs.readFileSync(path.join(f.site, releaseRoute, "index.html"), "utf8");
  assert.equal(all(released, node => node.attribs["data-release-page"] === version).length, releaseAnnouncement ? 1 : 0);
  const translated = fs.readFileSync(path.join(f.site, "fr/index.html"), "utf8");
  assert.equal(all(translated, node => node.attribs["data-release-version"]).length, 0);
  const missing = releaseFixture(t, false);
  const withoutRelease = fs.readFileSync(path.join(missing.site, "index.html"), "utf8");
  assert.equal(all(withoutRelease, node => node.attribs["data-release-version"]).length, 0);
});

async function openFixture(t, f, blockedStorage = false) {
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
  await context.addInitScript(({ blockedStorage }) => {
    if (blockedStorage) {
      const get = Storage.prototype.getItem;
      Storage.prototype.getItem = function(key) { if (key === "openclaw.docs.release-seen") throw new Error("Denied"); return get.call(this, key); };
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) { if (key === "openclaw.docs.release-seen") throw new Error("Denied"); return set.call(this, key, value); };
    } else if (!localStorage.getItem("openclaw.docs.release-seen")) {
      localStorage.setItem("openclaw.docs.release-seen", "an-earlier-release");
    }
  }, { blockedStorage });
  const page = await context.newPage();
  await page.goto(`http://docs.test${base}/`);
  return page;
}

for (const blockedStorage of [false, true]) {
  test(`release remains new until its notes are opened, including PJAX return${blockedStorage ? " without storage" : " and reload"}`, { skip: !releaseAnnouncement && "Announcement disabled" }, async t => {
    const f = releaseFixture(t);
    const page = await openFixture(t, f, blockedStorage);
    await page.getByRole("link", { name: /New release.*Read release notes/ }).waitFor();
    // Opening the menu does not acknowledge the release.
    await page.getByRole("button", { name: /Releases New release:/ }).click();
    assert.equal(await page.getByRole("link", { name: `v${version} New`, exact: true }).count(), 1);
    await page.getByRole("button", { name: "Back to all documentation", exact: true }).click();
    await page.locator(".release-strip").click();
    await page.waitForURL(`**/${releaseRoute}`);
    await page.getByRole("button", { name: /Releases Latest release:/ }).click();
    await page.getByRole("link", { name: `v${version} Latest`, exact: true }).waitFor();
    assert.equal(await page.locator(".release-entry-badge i").isVisible(), true, "Latest keeps its status dot after reading");
    await page.getByRole("button", { name: "Back to all documentation", exact: true }).click();
    await page.locator(".docs-section-trigger .release-nav-version i").waitFor({ state: "visible" });
    await page.getByRole("link", { name: "Home", exact: true }).click();
    await page.getByRole("link", { name: /Latest release.*Read release notes/ }).waitFor();
    if (!blockedStorage) {
      await page.reload();
      await page.getByRole("link", { name: /Latest release.*Read release notes/ }).waitFor();
    }
    assert.equal(await page.locator(".release-strip [data-release-new]").isVisible(), false);
  });
}


test("release opened from the home strip is acknowledged before it appears in navigation", { skip: !releaseAnnouncement }, async t => {
  const f = releaseFixture(t, true, false);
  const page = await openFixture(t, f);
  await page.getByRole("link", { name: /New release.*Read release notes/ }).click();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page.getByRole("link", { name: /Latest release.*Read release notes/ }).waitFor();
});

test("open release tabs across deployments do not repeatedly overwrite read state", { skip: !releaseAnnouncement }, async t => {
  const f = releaseFixture(t);
  const oldPage = await openFixture(t, f);
  const context = oldPage.context();
  await context.addInitScript(() => {
    window.releaseWrites = 0;
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === "openclaw.docs.release-seen") window.releaseWrites += 1;
      return set.call(this, key, value);
    };
  });
  await oldPage.goto(`http://docs.test${base}/${releaseRoute}`);
  const nextVersion = `${version}-next`;
  const nextPage = await context.newPage();
  // Serve a later deployment to the second tab while the first retains its old document.
  const nextUrl = `http://docs.test${base}/releases/${nextVersion}`;
  await nextPage.route(nextUrl, route => route.fulfill({
    contentType: "text/html",
    body: fs.readFileSync(path.join(f.site, releaseRoute, "index.html"), "utf8").replaceAll(version, nextVersion),
  }));
  const oldTabSynced = oldPage.evaluate(() => new Promise(resolve => {
    window.addEventListener("storage", resolve, { once: true });
  }));
  await nextPage.goto(nextUrl);
  await oldTabSynced;
  assert.equal(await oldPage.evaluate(() => window.releaseWrites), 1);
  assert.equal(await nextPage.evaluate(() => window.releaseWrites), 1);
  assert.equal(await nextPage.evaluate(() => localStorage.getItem("openclaw.docs.release-seen")), nextVersion);
});
