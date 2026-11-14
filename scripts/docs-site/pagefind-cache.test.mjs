import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { test } from "node:test";
import { chromium } from "playwright";
import { fixture, repo, run, write } from "./test-helpers/redirect-fixture.mjs";
import { pagefindAssetDir, pagefindVersion } from "./pagefind-assets.mjs";

test("Pagefind search uses the current build after immutable entry and worker assets were cached", async (t) => {
  const f = fixture(t, [], {
    "cron.md": "# Cron scheduler\n\nUse the cron scheduler to run recurring jobs.\n",
  });
  write(f.root, "docs/docs.json", JSON.stringify({
    name: "Search fixture",
    navigation: { languages: [{ language: "en", tabs: [{ tab: "Docs", groups: [{ group: "Guide", pages: ["index", "cron"] }] }] }] },
  }));
  fs.symlinkSync(path.join(repo, "node_modules"), path.join(f.root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const built = f.build();
  assert.equal(built.status, 0, built.stderr);
  const site = path.join(f.root, "dist/docs-site");
  const pagefind = run(f.root, "pagefind-build.mjs");
  assert.equal(pagefind.status, 0, pagefind.stderr);
  const normalized = run(f.root, "pagefind-normalize.mjs");
  assert.equal(normalized.status, 0, normalized.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(site, pagefindAssetDir, "pagefind-entry.json"), "utf8")).version, pagefindVersion);
  assert.ok(fs.readFileSync(path.join(site, "assets/docs-site.js"), "utf8").includes(`/${pagefindAssetDir}/pagefind.js`));
  for (const name of ["pagefind.js", "pagefind-worker.js"]) {
    assert.ok(fs.readFileSync(path.join(site, pagefindAssetDir, name), "utf8").includes(`pagefind_version="${pagefindVersion}"`),
      `${name} must match the generated index version`);
  }

  // Model the reported failure boundary: the old entry imports and initializes,
  // then its search rejects after reading the newer index, so import retry does
  // not run. The worker is the real 1.5.2 output from a one-page index build.
  const legacyEntry = 'export async function init() {}\nexport async function search() { throw new Error("Pagefind WASM Error (No pointer): 1.5.2 runtime, 1.6.0 index"); }\n';
  const legacyWorker = fs.readFileSync(new URL("./test-fixtures/pagefind-1.5.2/pagefind-worker.js", import.meta.url));
  let currentBuild = true;
  const legacyCached = new Set();
  const currentRequests = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/warm") return res.setHeader("Content-Type", "text/html").end("<!doctype html><title>Previous visit</title>");
    const legacyPath = url.pathname === "/pagefind/pagefind.js" || url.pathname === "/pagefind/pagefind-worker.js";
    const cacheKey = url.pathname + url.search;
    if (legacyPath && (!currentBuild || legacyCached.has(cacheKey))) {
      if (!currentBuild) legacyCached.add(cacheKey);
      res.setHeader("Content-Type", "text/javascript");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.end(url.pathname.endsWith("-worker.js") ? legacyWorker : legacyEntry);
    }
    if (currentBuild) currentRequests.push(url.pathname);
    const file = path.join(site, decodeURIComponent(url.pathname).replace(/^\/+/, ""));
    if (!fs.existsSync(file)) return res.writeHead(404).end();
    const resolved = fs.statSync(file).isDirectory() ? path.join(file, "index.html") : file;
    if (!fs.existsSync(resolved)) return res.writeHead(404).end();
    const contentType = ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".wasm": "application/wasm" })[path.extname(resolved)] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(fs.readFileSync(resolved));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  async function search(page) {
    await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    await page.locator("[data-search-open]").first().click();
    await page.locator("[data-search-input]").fill("cron scheduler");
    await page.locator(".search-result, .search-unavailable").first().waitFor({ timeout: 10000 });
    assert.match(await page.locator("[data-search-results]").innerText(), /Cron scheduler/i);
  }

  const cold = await browser.newContext();
  t.after(() => cold.close());
  await search(await cold.newPage());
  currentRequests.length = 0;
  currentBuild = false;

  const warm = await browser.newContext();
  t.after(() => warm.close());
  const warmPage = await warm.newPage();
  await warmPage.goto(base + "/warm");
  const workerStarted = warmPage.waitForEvent("worker");
  await warmPage.evaluate(async () => {
    await import("/pagefind/pagefind.js");
    window.__legacyWorker = new Worker("/pagefind/pagefind-worker.js", { type: "module" });
  });
  await workerStarted;
  await warmPage.evaluate(() => window.__legacyWorker.terminate());
  assert.deepEqual([...legacyCached].sort(), ["/pagefind/pagefind-worker.js", "/pagefind/pagefind.js"]);
  currentBuild = true;
  await search(warmPage);
  assert.ok(currentRequests.some(url => /pagefind-worker\.js$/.test(url)),
    "the upgraded search must request a worker outside the old immutable cache key");
});
