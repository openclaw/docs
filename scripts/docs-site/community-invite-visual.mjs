#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium, webkit } from "playwright";

const site = path.resolve("dist/docs-site");
const artifacts = path.resolve(process.env.DOCS_VISUAL_ARTIFACT_DIR || ".cache/docs-community-visual");
const engines = { chromium, webkit };
const selected = (process.env.DOCS_COMMUNITY_VISUAL_BROWSERS || "chromium,webkit").split(",");
for (const name of selected) assert.ok(engines[name], `unknown browser: ${name}`);
assert.ok(fs.existsSync(path.join(site, "index.html")), "build a docs preview before running this check");
fs.mkdirSync(artifacts, { recursive: true });
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
  const target = path.resolve(site, `.${pathname}`);
  const file = [target, path.join(target, "index.html")].find((candidate) => candidate.startsWith(site + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!file) return res.writeHead(404).end();
  res.setHeader("content-type", types[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const expectedLinks = [
  ["Reddit", "https://www.reddit.com/r/openclaw/"],
  ["Discord", "https://discord.com/invite/clawd"],
  ["X", "https://x.com/openclaw"],
];
let checked = 0;
try {
  for (const name of selected) {
    const browser = await engines[name].launch({ headless: true });
    try {
      for (const theme of ["dark", "light"]) {
        for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 800 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 820, height: 600 }]) {
          const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
          const label = `${name}-${theme}-${viewport.width}`;
          // macOS WebKit follows Safari’s default of using Option-Tab for links.
          const tabKey = name === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          try {
            await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
            await page.goto(base, { waitUntil: "networkidle" });
            const mobile = viewport.width <= 820;
            if (mobile) {
              await page.locator("[data-nav-toggle]").click();
              await page.waitForFunction(() => Math.abs(document.querySelector(".sidebar").getBoundingClientRect().left) < 1);
              await page.waitForFunction(() => Math.abs(document.querySelector(".community-invite").getBoundingClientRect().left) < 0.01);
            }
            const invite = page.getByRole("complementary", { name: "Find your people" });
            await invite.waitFor({ state: "visible" });
            await invite.locator("img").evaluate((image) => image.decode());
            const state = await invite.evaluate((card) => {
              const rect = card.getBoundingClientRect();
              const links = [...card.querySelectorAll("a")];
              const css = getComputedStyle(card);
              return {
                links: links.map((link) => [link.textContent.trim(), link.href]),
                safeLinks: links.every((link) => link.target === "_blank" && link.relList.contains("noopener")),
                allLinksFit: links.every((link) => {
                  const button = link.getBoundingClientRect();
                  return button.left >= rect.left && button.right <= rect.right && button.top >= rect.top && button.bottom <= rect.bottom && link.scrollWidth <= link.clientWidth;
                }),
                inViewport: rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1,
                noOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
                sidebarClear: innerWidth > 820 || document.querySelector(".sidebar").getBoundingClientRect().bottom <= rect.top + 1,
                radius: parseFloat(css.borderTopLeftRadius),
                art: card.querySelector("img").getAttribute("src"),
              };
            });
            assert.deepEqual(state.links, expectedLinks, label);
            for (const property of ["safeLinks", "allLinksFit", "inViewport", "noOverflow", "sidebarClear"]) assert.equal(state[property], true, `${label}: ${property}`);
            assert.match(state.art, /\/assets\/community-invite\.webp$/, label);
            assert.ok(mobile ? state.radius === 0 : state.radius > 0, `${label}: corner geometry`);
            await invite.getByRole("link", { name: "Reddit", exact: true }).focus();
            await page.keyboard.press(tabKey);
            assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "Discord", `${label}: keyboard order`);
            await page.keyboard.press(tabKey);
            assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "X", `${label}: keyboard order`);
            if (viewport.width === 1440 || viewport.width === 390) {
              await page.locator(mobile ? ".sidebar [data-nav-close]" : ".site-header .brand").focus();
              await invite.screenshot({ path: path.join(artifacts, `${label}-card.png`) });
              await page.screenshot({ path: path.join(artifacts, `${label}-page.png`) });
            }
            if (!mobile) {
              // Exercise the baseline cascade even on newer WebKit that supports corner-shape.
              await page.evaluate(() => {
                for (const sheet of document.styleSheets) {
                  for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
                    const rule = sheet.cssRules[i];
                    if (rule.constructor.name === "CSSSupportsRule" && rule.conditionText.includes("corner-shape")) sheet.deleteRule(i);
                  }
                }
              });
              assert.ok(await invite.evaluate((card) => parseFloat(getComputedStyle(card).borderTopLeftRadius) > 0), `${label}: rounded fallback without corner-shape`);
              if (viewport.width === 1440) await invite.screenshot({ path: path.join(artifacts, `${label}-fallback-card.png`) });
            }
            if (!mobile) {
              await page.getByRole("button", { name: "Ask Molty", exact: true }).click();
              await invite.waitFor({ state: "hidden" });
              await page.getByRole("button", { name: "Minimize", exact: true }).click();
              await invite.waitFor({ state: "visible" });
            }
            await invite.getByRole("button", { name: "Dismiss and don't show again" }).click();
            await invite.waitFor({ state: "hidden" });
            await page.reload({ waitUntil: "networkidle" });
            if (mobile) await page.locator("[data-nav-toggle]").click();
            await invite.waitFor({ state: "hidden" });
            assert.deepEqual(errors, [], label);
            checked++;
          } catch (error) { throw new Error(`${label}: ${error.message}`, { cause: error }); } finally { await page.close(); }
        }
      }
    } finally { await browser.close(); }
  }
  console.log(`community invitation visual checks passed: ${checked} browser/theme/viewport combinations; screenshots in ${path.relative(process.cwd(), artifacts)}`);
} finally { await new Promise((resolve) => server.close(resolve)); }
