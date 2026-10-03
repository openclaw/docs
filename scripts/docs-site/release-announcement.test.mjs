import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { before, after, test } from "node:test";
import { chromium } from "playwright";
import { parseDocument, DomUtils } from "htmlparser2";
import { latestReleaseAnnouncement } from "./release-announcement.mjs";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

const version = "2099.9.8";
const releaseRoute = `releases/${version}`;
const base = "/manual";
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

function releaseFixture(t, includeRelease = true, includeNavigation = true, includeTranslatedRelease = false) {
  const sources = {
    "guide.md": "# Guide\n\n[Home](/)\n",
    "fr/index.md": "# Accueil\n",
    ...(includeTranslatedRelease ? { [`fr/${releaseRoute}.md`]: `# Version ${version}\n\nNotes de version.\n` } : {}),
    ...(includeRelease ? { [`${releaseRoute}.md`]: `# v${version}\n\nRelease details.\n\n[Home](/)\n` } : {}),
  };
  const f = fixture(t, [], sources, base);
  write(f.root, "docs/docs.json", JSON.stringify({ navigation: { languages: [
    { language: "en", tabs: [
      { tab: "Get started", groups: [{ group: "Docs", pages: ["index", "guide"] }] },
      ...(includeNavigation ? [{ tab: "Releases", groups: [{ group: "Release notes", pages: [releaseRoute] }] }] : []),
    ] },
    { language: "fr", tabs: [{ tab: "Docs", groups: [{ group: "Docs", pages: ["index", ...(includeTranslatedRelease ? [releaseRoute] : [])] }] }] },
  ] } }));
  const built = f.build();
  assert.equal(built.status, 0, built.stderr);
  return { ...f, site: path.join(f.root, "dist/docs-site") };
}

const all = (html, predicate) => DomUtils.findAll(predicate, parseDocument(html).children);

test("translated release pages get the same latest indicators with localized labels", (t) => {
  const f = releaseFixture(t, true, true, true);
  const html = fs.readFileSync(path.join(f.site, "fr/index.html"), "utf8");
  const versions = all(html, node => node.attribs.class === "release-nav-version");
  const badges = all(html, node => node.attribs.class === "release-entry-badge");
  assert.equal(versions.length, 1);
  assert.equal(badges.length, 1);
  assert.match(DomUtils.textContent(versions[0]), /Dernière version/);
  assert.match(DomUtils.textContent(badges[0]), /Plus récente/);
});

test("announcements respect the site base, localize their labels, and require an existing release", (t) => {
  const f = releaseFixture(t);
  const home = fs.readFileSync(path.join(f.site, "index.html"), "utf8");
  const strip = all(home, node => node.name === "a" && node.attribs.class === "release-strip");
  assert.equal(strip.length, 1);
  assert.equal(strip[0].attribs.href, `${base}/${releaseRoute}`);
  const translated = fs.readFileSync(path.join(f.site, "fr/index.html"), "utf8");
  const translatedStrip = all(translated, node => node.attribs.class === "release-strip");
  assert.equal(translatedStrip.length, 1);
  assert.equal(translatedStrip[0].attribs.href, `${base}/${releaseRoute}`);
  assert.match(DomUtils.textContent(translatedStrip[0]), /Nouvelle version/);
  assert.equal(all(translated, node => /^(release-nav-version|release-entry-badge)$/.test(node.attribs.class || "")).length, 0);
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

test("release announcements stay unchanged after visits and reloads without reading or writing view state", async t => {
  const f = releaseFixture(t);
  const page = await openFixture(t, f);
  await page.getByRole("link", { name: /New release.*Read release notes/ }).waitFor();
  await page.getByRole("button", { name: /Releases Latest release:/ }).click();
  await page.getByRole("link", { name: `v${version} Latest`, exact: true }).waitFor();
  assert.equal(await page.locator(".release-entry-badge i").isVisible(), true);
  for (const theme of ["dark", "light"]) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    const colors = await page.locator(".release-nav-version,.release-entry-badge").evaluateAll(nodes => nodes.flatMap(node => [
      getComputedStyle(node).color,
      getComputedStyle(node.querySelector("i")).backgroundColor,
    ]));
    assert.ok(colors.length >= 4, "both release indicators must be present");
    for (const color of colors) {
      const [red, green, blue] = color.match(/[\d.]+/g).map(Number);
      assert.ok(green > red && green > blue, `${theme} release indicator must be green: ${color}`);
    }
  }
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

test("the latest stable English page drives the version and approved summary", () => {
  const page = (version, extras = {}) => ({ locale: "en", slug: `releases/${version}`, summary: `Summary ${version}`, ...extras });
  const latest = page("2099.10.1");
  const pages = [page("2099.9.9"), page("2100.1.1-beta.1"), latest,
    page("2101.1.1", { hidden: true }), page("2102.1.1", { locale: "fr" }),
    page("2103.1.1", { meta: { status: "draft" } }), page("2104.1.1", { meta: { beta: true } }),
    page("2099.9.20"), page("index")];
  assert.deepEqual(latestReleaseAnnouncement(pages), { page: latest, version: "2099.10.1", summary: latest.summary });
  assert.equal(latestReleaseAnnouncement([page("2100.1.1-beta.1")]), null);
});

test("syncing a newer release updates the home strip and sidebar without a code edit", t => {
  const f = releaseFixture(t);
  const newerVersion = "2099.10.1";
  const newerRoute = `releases/${newerVersion}`;
  write(f.root, `docs/${newerRoute}.md`, `---\nsummary: The approved newer summary.\n---\n# v${newerVersion}\n`);
  write(f.root, "docs/releases/2100.1.1.md", "---\nhidden: true\n---\n# Hidden release\n");
  write(f.root, "docs/releases/2101.1.1.md", "---\nstatus: draft\n---\n# Draft release\n");
  write(f.root, "docs/releases/2102.1.1.md", "---\nbeta: true\n---\n# Beta release\n");
  const config = JSON.parse(fs.readFileSync(path.join(f.root, "docs/docs.json"), "utf8"));
  config.navigation.languages[0].tabs[1].groups[0].pages.unshift(newerRoute);
  write(f.root, "docs/docs.json", JSON.stringify(config));
  const rebuilt = f.build();
  assert.equal(rebuilt.status, 0, rebuilt.stderr);
  const html = fs.readFileSync(path.join(f.site, "index.html"), "utf8");
  const strip = all(html, node => node.attribs.class === "release-strip")[0];
  assert.equal(strip.attribs.href, `${base}/${newerRoute}`);
  assert.match(DomUtils.textContent(strip), /v2099\.10\.1.*The approved newer summary\./);
  const badge = all(html, node => node.attribs.class === "release-nav-version")[0];
  assert.match(DomUtils.textContent(badge), /v2099\.10\.1/);
  const latestLinks = all(html, node => node.name === "a" && node.attribs.class?.startsWith("nav-link")
    && DomUtils.textContent(node).includes("Latest"));
  assert.deepEqual(latestLinks.map(node => node.attribs.href), [`${base}/${newerRoute}`]);
});
