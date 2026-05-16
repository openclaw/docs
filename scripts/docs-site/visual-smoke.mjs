#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const site = path.join(root, "dist", "docs-site");
const artifacts = process.env.DOCS_VISUAL_ARTIFACT_DIR || path.join(root, ".cache", "docs-visual");

if (!fs.existsSync(path.join(site, "__elements", "index.html"))) {
  throw new Error("visual smoke requires a built dist/docs-site");
}

fs.mkdirSync(artifacts, { recursive: true });
const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  const candidates = [
    path.join(site, pathname),
    path.join(site, pathname, "index.html"),
  ];
  const file = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!file || !file.startsWith(site)) {
    res.writeHead(404).end("not found");
    return;
  }
  res.setHeader("content-type", contentType(file));
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });

try {
  await checkDesktop();
  await checkMobile();
  await checkLightMode();
  console.log(`docs visual smoke ok: screenshots in ${path.relative(root, artifacts)}`);
} finally {
  await browser.close();
  server.close();
}

async function checkDesktop() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${base}/__elements`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(artifacts, "elements-desktop-dark.png"), fullPage: true });
  await page.evaluate(() => scrollTo(0, 760));
  await page.screenshot({ path: path.join(artifacts, "elements-desktop-scrolled.png"), fullPage: false });

  const overlap = await page.evaluate(() => {
    const header = document.querySelector(".site-header")?.getBoundingClientRect();
    const sidebar = document.querySelector(".sidebar")?.getBoundingClientRect();
    const toc = document.querySelector(".toc")?.getBoundingClientRect();
    return {
      headerTop: header?.top,
      sidebarClear: header && sidebar ? sidebar.top >= header.bottom - 1 : false,
      tocClear: header && toc ? toc.top >= header.bottom - 1 : false,
    };
  });
  if (overlap.headerTop !== 0 || !overlap.sidebarClear || !overlap.tocClear) {
    throw new Error(`desktop sticky shell overlap: ${JSON.stringify(overlap)}`);
  }

  await expectVisible(page, ".oc-code [data-code-copy]", "code copy button");
  await expectVisible(page, ".page-status .page-status-beta", "page status badge");
  await expectVisible(page, ".oc-code.has-line-numbers .code-line.is-highlighted", "line-highlighted code");
  await expectVisible(page, ".oc-badge.oc-badge-orange", "badge");
  await expectVisible(page, ".oc-panel", "panel");
  await expectVisible(page, ".oc-prompt [data-prompt-copy]", "prompt copy");
  await expectVisible(page, ".oc-tile-group .oc-tile", "tiles");
  await expectVisible(page, ".oc-mermaid", "mermaid block");
  await page.locator(".oc-mermaid.is-rendered svg").first().waitFor({ state: "visible", timeout: 10000 });
  const componentSkin = await page.evaluate(() => {
    const code = getComputedStyle(document.querySelector(".oc-code"));
    const pre = getComputedStyle(document.querySelector(".oc-code pre"));
    const step = getComputedStyle(document.querySelector(".oc-step:last-child"));
    const paramType = getComputedStyle(document.querySelector(".oc-param-type"));
    const lineRects = [...document.querySelectorAll(".oc-code.has-line-numbers .code-line")]
      .slice(0, 3)
      .map((line) => line.getBoundingClientRect());
    return {
      codeBg: code.backgroundColor,
      codePadding: pre.paddingTop,
      stepBorderImage: step.borderImageSource,
      paramTypeColor: paramType.color,
      codeLineGap: lineRects.length > 1 ? lineRects[1].top - lineRects[0].bottom : 0,
    };
  });
  if (componentSkin.codeBg !== "rgb(16, 16, 16)"
    || parseFloat(componentSkin.codePadding) > 14
    || !componentSkin.stepBorderImage.includes("linear-gradient")
    || componentSkin.paramTypeColor === "rgb(129, 122, 118)"
    || componentSkin.codeLineGap > 3) {
    throw new Error(`desktop component skin failed: ${JSON.stringify(componentSkin)}`);
  }
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await expectVisible(page, ".page-tools [data-copy-page]", "copy page tool");
  await expectVisible(page, ".page-feedback [data-feedback-value='yes']", "page feedback");
  await page.close();
}

async function checkMobile() {
  const page = await browser.newPage({ viewport: { width: 390, height: 980 }, isMobile: true });
  await page.goto(`${base}/__elements`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(artifacts, "elements-mobile-dark.png"), fullPage: true });

  const geometry = await page.evaluate(() => {
    const header = document.querySelector(".site-header")?.getBoundingClientRect();
    const menu = document.querySelector("[data-nav-toggle]")?.getBoundingClientRect();
    const theme = document.querySelector("[data-theme-toggle]")?.getBoundingClientRect();
    const search = document.querySelector("[data-search-open]")?.getBoundingClientRect();
    const code = document.querySelector(".oc-code")?.getBoundingClientRect();
    const step = document.querySelector(".oc-step")?.getBoundingClientRect();
    const overlap = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    return {
      headerWidth: header?.width,
      menuThemeOverlap: overlap(menu, theme),
      searchInViewport: search ? search.left >= 0 && search.right <= innerWidth : false,
      codeInViewport: code ? code.left >= 0 && code.right <= innerWidth + 1 : false,
      stepInset: step?.left,
    };
  });
  if (geometry.menuThemeOverlap || !geometry.searchInViewport || !geometry.codeInViewport || geometry.stepInset < 0) {
    throw new Error(`mobile visual geometry failed: ${JSON.stringify(geometry)}`);
  }
  await page.click("[data-nav-toggle]");
  await page.locator(".sidebar.open").waitFor({ state: "visible" });
  await page.waitForFunction(() => Math.abs(document.querySelector(".sidebar")?.getBoundingClientRect().left ?? -999) < 1);
  await page.screenshot({ path: path.join(artifacts, "elements-mobile-menu.png"), fullPage: false });
  const menu = await page.evaluate(() => {
    const sidebar = document.querySelector(".sidebar")?.getBoundingClientRect();
    const close = document.querySelector("[data-nav-close]")?.getBoundingClientRect();
    const toggle = document.querySelector("[data-nav-toggle]");
    const closeStyle = getComputedStyle(document.querySelector("[data-nav-close]"));
    return {
      bodyOpen: document.body.classList.contains("nav-open"),
      ariaExpanded: toggle?.getAttribute("aria-expanded"),
      sidebarLeft: sidebar?.left,
      sidebarRight: sidebar?.right,
      sidebarWidth: sidebar?.width,
      closeVisible: closeStyle.display !== "none" && close && close.height >= 36,
      viewport: innerWidth,
    };
  });
  if (!menu.bodyOpen || menu.ariaExpanded !== "true" || menu.sidebarLeft !== 0 || menu.sidebarRight > menu.viewport - 8 || menu.sidebarWidth > 380 || !menu.closeVisible) {
    throw new Error(`mobile menu drawer failed: ${JSON.stringify(menu)}`);
  }
  await page.keyboard.press("Escape");
  const closed = await page.evaluate(() => ({
    bodyOpen: document.body.classList.contains("nav-open"),
    sidebarOpen: document.querySelector(".sidebar")?.classList.contains("open"),
    ariaExpanded: document.querySelector("[data-nav-toggle]")?.getAttribute("aria-expanded"),
  }));
  if (closed.bodyOpen || closed.sidebarOpen || closed.ariaExpanded !== "false") {
    throw new Error(`mobile menu did not close on Escape: ${JSON.stringify(closed)}`);
  }
  await page.close();
}

async function checkLightMode() {
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto(`${base}/__elements`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(artifacts, "elements-desktop-light.png"), fullPage: true });
  const skin = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const code = getComputedStyle(document.querySelector(".oc-code"));
    const badge = getComputedStyle(document.querySelector(".oc-badge"));
    const cardWidths = [...document.querySelectorAll(".oc-card")].map((card) => card.getBoundingClientRect().width);
    return {
      theme: document.documentElement.dataset.theme,
      codeBg: code.backgroundColor,
      badgeRadius: badge.borderRadius,
      codeText: root.getPropertyValue("--code-text").trim(),
      minCardWidth: Math.min(...cardWidths),
    };
  });
  if (skin.theme !== "light" || skin.codeText !== "#2d2926" || skin.badgeRadius === "0px" || skin.minCardWidth < 190) {
    throw new Error(`light visual skin failed: ${JSON.stringify(skin)}`);
  }
  await page.close();
}

async function expectVisible(page, selector, label) {
  const visible = await page.locator(selector).first().isVisible();
  if (!visible) throw new Error(`missing visible ${label}: ${selector}`);
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js") || file.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".json")) return "application/json";
  return "text/plain; charset=utf-8";
}
