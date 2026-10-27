import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { chromium, webkit } from "playwright";
import { fixture } from "./test-helpers/redirect-fixture.mjs";

const source = "flowchart LR\n A[\"Chat apps + plugins\"] --> B[Gateway]\n B --> C[\"OpenClaw agent\"]\n B --> D[CLI]\n B --> E[\"Web Control UI\"]\n B --> F[\"macOS app\"]\n B --> G[\"iOS and Android nodes\"]";
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
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
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
    const canvas = page.locator("[data-mermaid-overlay-canvas]");
    async function assertFits() {
      assert.ok(await expanded.evaluate(svg => {
        const box = svg.getBoundingClientRect();
        const viewport = svg.parentElement.getBoundingClientRect();
        return box.left >= viewport.left && box.top >= viewport.top
          && box.right <= viewport.right + 1 && box.bottom <= viewport.bottom + 1;
      }), "the complete expanded diagram must fit the viewport before zooming");
    }
    await assertFits();
    const fittedViewBox = await expanded.getAttribute("viewBox");
    await canvas.getByRole("button", { name: "Zoom in", exact: true }).tap();
    await canvas.getByRole("button", { name: "Zoom in", exact: true }).tap();
    assert.notEqual(await expanded.getAttribute("viewBox"), fittedViewBox, "zoom must reveal readable detail");
    assert.ok(await canvas.evaluate(element => element.scrollWidth <= element.clientWidth + 1
      && element.scrollHeight <= element.clientHeight + 1), "zoom must not replace pan with clipped outer scrolling");
    const beforePan = await expanded.getAttribute("viewBox");
    const viewport = await canvas.boundingBox();
    await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
    await page.mouse.down();
    await page.mouse.move(viewport.x + viewport.width / 2 - 60, viewport.y + viewport.height / 2, { steps: 5 });
    await page.mouse.up();
    assert.notEqual(await expanded.getAttribute("viewBox"), beforePan, "zoomed diagram must pan with real pointer input");
    await canvas.getByRole("button", { name: "Fit diagram", exact: true }).click();
    assert.equal(await expanded.getAttribute("viewBox"), fittedViewBox);
    await canvas.getByRole("button", { name: "Zoom in", exact: true }).tap();
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForFunction(() => {
      const svg = document.querySelector("[data-mermaid-overlay-canvas] > svg");
      return svg.viewBox.baseVal.width === Number(svg.getAttribute("width"));
    });
    await assertFits();
    await page.keyboard.press("Tab");
    assert.ok(await page.locator("[data-mermaid-overlay]").evaluate(overlay => overlay.contains(document.activeElement)));
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("[data-mermaid-overlay].open").count(), 0);
    assert.ok(await page.locator("[data-mermaid-expand]").evaluate(button => button === document.activeElement));
    assert.ok(await page.evaluate(() => !document.body.classList.contains("has-mermaid-overlay")));
    await page.locator("[data-mermaid-expand]").click();
    await expanded.waitFor({ state: "visible" });
    assert.equal(await canvas.locator(".pele-zoom").count(), 1, "reopening must not retain old viewer controls");
    await page.keyboard.press("Tab");
    assert.ok(await expanded.evaluate(svg => svg === document.activeElement));
    const keyboardFit = await expanded.getAttribute("viewBox");
    await page.keyboard.press("+");
    assert.notEqual(await expanded.getAttribute("viewBox"), keyboardFit);
    await page.keyboard.press("0");
    assert.equal(await expanded.getAttribute("viewBox"), keyboardFit);
    await page.keyboard.press("Escape");
  });
}
