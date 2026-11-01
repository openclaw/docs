import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { chromium, webkit } from "playwright";
import { fixture } from "./test-helpers/redirect-fixture.mjs";

const runtimeUrl = "/assets/pele-" + createHash("sha256").update(fs.readFileSync(fileURLToPath(import.meta.resolve("pele")))).digest("hex").slice(0, 12) + ".js";

const source = 'flowchart LR\n accTitle: Public diagram\n accDescr: Ready becomes rendered\n A["Ready<br>state"] --> B[Rendered]';
const hostile = 'flowchart LR\n A["<img src=https://diagram.example/pixel onerror=alert(1)>"] --> B[Safe]\n click B "javascript:alert(1)"';
const markdown = '# Diagrams\n\n' + [source, source, hostile, 'flowchart LR\n Broken -->'].map(text => '\x60\x60\x60mermaid\n' + text + '\n\x60\x60\x60').join('\n\n');

for (const [name, engine] of [["Chromium", chromium], ["WebKit", webkit]]) {
  test(name + " uses loaded fonts, unique accessible SVG and strict diagram isolation", async t => {
    const f = fixture(t, [], { "guide.md": markdown });
    fs.symlinkSync(path.resolve("node_modules"), path.join(f.root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
    const built = f.build();
    assert.equal(built.status, 0, built.stderr);
    const site = path.join(f.root, "dist/docs-site");
    const browser = await engine.launch({ headless: true });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(10000);
    const diagramRequests = [];
    let releaseFonts;
    const fontsHeld = new Promise(resolve => { releaseFonts = resolve; });
    t.after(() => releaseFonts());
    let fontRequested;
    const fontStarted = new Promise(resolve => { fontRequested = resolve; });
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.hostname === "diagram.example") diagramRequests.push(url.href);
      if (url.origin !== "https://docs.example") return route.abort();
      let file = path.join(site, url.pathname);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.existsSync(file)) return route.fulfill({ status: 404 });
      if (path.extname(file) === ".woff2") { fontRequested(); await fontsHeld; }
      const contentType = ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml" })[path.extname(file)] || "application/octet-stream";
      return route.fulfill({ contentType, body: fs.readFileSync(file) });
    });
    await page.goto("https://docs.example/guide", { waitUntil: "domcontentloaded" });
    await fontStarted;
    // Settle the renderer import without releasing the intentionally cold webfonts.
    await page.evaluate(async url => { await import(url); await new Promise(requestAnimationFrame); }, runtimeUrl);
    assert.equal(await page.locator(".oc-mermaid.is-rendered").count(), 0, "diagram layout must wait for the label font");
    releaseFonts();
    await page.waitForFunction(() => document.querySelectorAll(".oc-mermaid.is-rendered").length === 3);
    assert.match(await page.locator(".oc-mermaid > svg").first().getAttribute("class"), /pele/);
    assert.equal(await page.locator(".oc-mermaid > svg text").first().evaluate(text => getComputedStyle(text).fontSize), "16px");
    assert.ok(await page.locator(".oc-mermaid > svg").first().evaluate(async (svg, url) => {
      const pele = await import(url);
      const fontFamily = getComputedStyle(svg).fontFamily;
      const loaded = pele.render(svg.parentElement.dataset.mermaid, { fontFamily, fontSize: 16, links: false, images: false });
      return svg.viewBox.baseVal.width === loaded.width && svg.viewBox.baseVal.height === loaded.height;
    }, runtimeUrl), "cold-load geometry must match the loaded font");
    const titleIds = await page.locator(".oc-mermaid > svg[aria-labelledby]").evaluateAll(svgs => svgs.map(svg => {
      const title = document.getElementById(svg.getAttribute("aria-labelledby"));
      const desc = document.getElementById(svg.getAttribute("aria-describedby"));
      return { id: title.id, title: title.textContent, desc: desc.textContent, owned: svg.contains(title) && svg.contains(desc) };
    }));
    assert.equal(titleIds.length, 2);
    assert.equal(new Set(titleIds.map(entry => entry.id)).size, 2);
    for (const entry of titleIds) assert.deepEqual({ title: entry.title, desc: entry.desc, owned: entry.owned }, { title: "Public diagram", desc: "Ready becomes rendered", owned: true });
    assert.equal(await page.locator(".oc-mermaid svg a,.oc-mermaid svg image,.oc-mermaid svg foreignObject,.oc-mermaid svg script,.oc-mermaid svg [onerror]").count(), 0);
    assert.deepEqual(diagramRequests, []);
    await page.locator("[data-mermaid-expand]").first().click();
    const expanded = page.locator("[data-mermaid-overlay-canvas] > svg");
    await expanded.waitFor({ state: "visible" });
    const expandedTitle = await expanded.getAttribute("aria-labelledby");
    assert.ok(!titleIds.some(entry => entry.id === expandedTitle));
    assert.equal(await expanded.locator("title").textContent(), "Public diagram");
    await page.keyboard.press("Escape");
    assert.deepEqual(diagramRequests, []);
  });
}

for (const [name, engine] of [["Chromium", chromium], ["WebKit", webkit]]) {
  test(name + " loads the installed renderer after an immutable legacy asset was cached", async t => {
    const f = fixture(t, [], { "guide.md": "# Diagram\n\n" + "\x60\x60\x60mermaid\nflowchart LR\n A --> B\n\x60\x60\x60" });
    fs.symlinkSync(path.resolve("node_modules"), path.join(f.root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
    const built = f.build();
    assert.equal(built.status, 0, built.stderr);
    const site = path.join(f.root, "dist/docs-site");
    const runtime = fs.readFileSync(fileURLToPath(import.meta.resolve("pele")), "utf8");
    const shell = fs.readFileSync(path.join(site, "assets/docs-site.js"), "utf8");
    const runtimeUrl = shell.match(/\/assets\/pele-[\w.]+\.js/)[0];
    const server = http.createServer((req, res) => {
      if (req.url === "/warm") return res.setHeader("content-type", "text/html").end("<!doctype html><title>Previous docs visit</title>");
      if (req.url === "/assets/pele-1.6.0.js") {
        res.setHeader("content-type", "text/javascript");
        res.setHeader("cache-control", "public, max-age=31536000, immutable");
        return res.end(runtime + "\nexport const docsCachedRenderer = true;\n");
      }
      let file = path.join(site, new URL(req.url, "http://localhost").pathname);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.existsSync(file)) return res.writeHead(404).end();
      res.setHeader("content-type", ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml" })[path.extname(file)] || "application/octet-stream");
      res.end(fs.readFileSync(file));
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const browser = await engine.launch({ headless: true });
    t.after(() => browser.close());
    const page = await browser.newPage();
    const base = "http://127.0.0.1:" + server.address().port;
    await page.goto(base + "/warm");
    await page.evaluate(() => import("/assets/pele-1.6.0.js"));
    await page.goto(base + "/guide");
    await page.locator(".oc-mermaid.is-rendered > svg").waitFor();
    assert.equal(await page.evaluate(url => import(url).then(pele => Boolean(pele.docsCachedRenderer)), runtimeUrl), false,
      "a current page must not execute the previous immutable renderer");
    assert.equal(runtimeUrl, "/assets/pele-" + createHash("sha256").update(runtime).digest("hex").slice(0, 12) + ".js");
    assert.equal(fs.readFileSync(path.join(site, runtimeUrl), "utf8"), runtime);
  });
}
