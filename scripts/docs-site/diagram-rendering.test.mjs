import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { chromium, webkit } from "playwright";
import { fixture } from "./test-helpers/redirect-fixture.mjs";

const source = 'flowchart LR\n accTitle: Public diagram\n accDescr: Ready becomes rendered\n A["Ready<br>state"] --> B[Rendered]';
const hostile = 'flowchart LR\n A["<img src=https://diagram.example/pixel onerror=alert(1)>"] --> B[Safe]\n click B "javascript:alert(1)"';
const markdown = '# Diagrams\n\n' + [source, source, hostile, 'flowchart LR\n Broken -->'].map(text => '\x60\x60\x60mermaid\n' + text + '\n\x60\x60\x60').join('\n\n');

for (const [name, engine] of [["Chromium", chromium], ["WebKit", webkit]]) {
  test(name + " keeps fenced source, accessible SVG and strict diagram isolation", async t => {
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
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.hostname === "diagram.example") diagramRequests.push(url.href);
      if (url.origin !== "https://docs.example") return route.abort();
      let file = path.join(site, url.pathname);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.existsSync(file)) return route.fulfill({ status: 404 });
      const contentType = ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml" })[path.extname(file)] || "application/octet-stream";
      return route.fulfill({ contentType, body: fs.readFileSync(file) });
    });
    await page.goto("https://docs.example/guide");
    await page.waitForFunction(() => document.querySelectorAll(".oc-mermaid.is-rendered").length === 3);
    assert.equal(await page.locator(".oc-mermaid").first().getAttribute("data-mermaid"), source);
    assert.ok(fs.readFileSync(path.join(site, "guide.md"), "utf8").includes(source));
    assert.ok(JSON.parse(await page.locator("[data-page-markdown]").textContent()).includes(source));
    assert.match(await page.locator(".oc-mermaid > svg").first().getAttribute("class"), /pele/);
    assert.match(await page.locator(".oc-mermaid.is-error code").textContent(), /Broken -->/);
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
    assert.ok(await page.locator("[data-mermaid-expand]").first().evaluate(button => button === document.activeElement));
    assert.deepEqual(diagramRequests, []);
  });
}
