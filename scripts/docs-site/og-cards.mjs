import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { Worker } from "node:worker_threads";
import { renderPageOgSvg } from "./og-card-template.mjs";
import { createOgCache } from "./og-cache.mjs";
import { activeTabTitle, groupForPage, flattenNav } from "./navigation.mjs";

export async function renderPageOgCards({ pages, enNav, outDir, cacheDir, siteName }) {
  const pageOgVersions = new Map();
  const navSlugs = new Set(flattenNav(enNav).map((page) => page.slug));
  const ogDir = path.join(outDir, "og");
  const targets = pages.filter((page) =>
    page.locale === "en" && page.slug !== "index" && navSlugs.has(page.slug)
  );
  const start = Date.now();
  const cache = process.env.DOCS_SITE_RENDER_CACHE !== "0"
    ? createOgCache(cacheDir, renderOgPng)
    : null;
  const concurrency = Math.max(2, Math.min(8, Number(process.env.DOCS_SITE_OG_CONCURRENCY) || 6));
  let cursor = 0;
  let count = 0;
  const failures = [];
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < targets.length) {
      const page = targets[cursor++];
      const kicker = groupForPage(enNav, page.slug) ?? activeTabTitle(enNav, page.slug) ?? siteName;
      const svg = renderPageOgSvg({ title: page.title, kicker, summary: page.summary });
      const outFile = path.join(ogDir, `${page.slug}.png`);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      try {
        const png = await (cache ? cache.render(page.slug, svg) : renderOgPng(svg));
        fs.writeFileSync(outFile, png);
        pageOgVersions.set(page.slug, createHash("sha256").update(png).digest("hex").slice(0, 12));
        count++;
      } catch (err) {
        failures.push(`${page.slug}: ${err.message}`);
      }
    }
  }));
  if (failures.length) {
    const details = failures.slice(0, 5).join("; ");
    throw new Error(`failed to render ${failures.length}/${targets.length} per-page og cards: ${details}`);
  }
  if (cache) {
    cache.prune();
    console.log(`og cache: ${cache.stats.hits} reused, ${cache.stats.misses} rendered`);
  } else {
    console.log(`og cache: disabled, ${count} rendered`);
  }
  console.log(`prepared ${count}/${targets.length} per-page og cards in ${Date.now() - start}ms`);
  return pageOgVersions;
}

function renderOgPng(svg) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./og-render-worker.mjs", import.meta.url), {
      workerData: { svg },
    });
    let settled = false;
    worker.on("message", (message) => {
      if (settled) return;
      settled = true;
      if (message?.error) reject(new Error(message.error));
      else resolve(Buffer.from(message.png));
    });
    worker.on("error", (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
    worker.on("exit", (code) => {
      if (settled || code === 0) return;
      settled = true;
      reject(new Error(`og render worker exit ${code}`));
    });
  });
}
