import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { chromium, webkit } from "playwright";
import { fixture } from "./test-helpers/redirect-fixture.mjs";

const source = "flowchart LR\n A[\"Chat apps and plugins\"] --> B[Gateway]\n B --> C[\"OpenClaw agent\"]\n B --> D[\"Web Control UI\"]";
const markdown = "# Diagram interactions\n\n```mermaid\n" + source + "\n```\n\n```mermaid\nflowchart LR\n Broken -->\n```";

for (const [name, engine] of [["Chromium", chromium], ["WebKit", webkit]]) {
  test(name + " preserves diagram source, error fallback and expansion controls", async t => {
    const f = fixture(t, [], { "guide.md": markdown });
    fs.symlinkSync(path.resolve("node_modules"), path.join(f.root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
    const built = f.build();
    assert.equal(built.status, 0, built.stderr);
    const site = path.join(f.root, "dist/docs-site");
    const browser = await engine.launch({ headless: true });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(10000);
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.origin !== "https://docs.example") return route.abort();
      let file = path.join(site, url.pathname);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.existsSync(file)) return route.fulfill({ status: 404 });
      const contentType = ({ ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml" })[path.extname(file)] || "application/octet-stream";
      return route.fulfill({ contentType, body: fs.readFileSync(file) });
    });
    await page.goto("https://docs.example/guide");
    await page.locator(".oc-mermaid.is-rendered > svg").waitFor();
    assert.equal(await page.locator(".oc-mermaid").first().getAttribute("data-mermaid"), source);
    assert.ok(fs.readFileSync(path.join(site, "guide.md"), "utf8").includes(source));
    assert.ok(JSON.parse(await page.locator("[data-page-markdown]").textContent()).includes(source));
    assert.match(await page.locator(".oc-mermaid.is-error code").textContent(), /Broken -->/);
    await page.locator("[data-mermaid-expand]").click();
    const expanded = page.locator("[data-mermaid-overlay-canvas] > svg");
    await expanded.waitFor({ state: "visible" });
    const geometry = await expanded.evaluate(svg => ({ width: svg.getBoundingClientRect().width, naturalWidth: svg.viewBox.baseVal.width }));
    assert.ok(geometry.width >= geometry.naturalWidth - 1, "expansion must not shrink labels to fit a narrow screen");
    const canvas = page.locator("[data-mermaid-overlay-canvas]");
    await canvas.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    assert.ok(await expanded.evaluate(svg => svg.getBoundingClientRect().right <= svg.parentElement.getBoundingClientRect().right + 1), "the expanded diagram end must remain reachable by scrolling");
    await page.keyboard.press("Tab");
    assert.ok(await page.locator("[data-mermaid-overlay]").evaluate(overlay => overlay.contains(document.activeElement)));
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("[data-mermaid-overlay].open").count(), 0);
    assert.ok(await page.locator("[data-mermaid-expand]").evaluate(button => button === document.activeElement));
    assert.ok(await page.evaluate(() => !document.body.classList.contains("has-mermaid-overlay")));
  });
}
