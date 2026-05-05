#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const site = path.join(root, "dist", "docs-site");
const required = [
  "index.html",
  "tools/reactions/index.html",
  "zh-CN/tools/reactions/index.html",
  "de/tools/reactions/index.html",
  "de/gateway/heartbeat/index.html",
  "pagefind/pagefind.js",
  "assets/docs-site.css",
  "assets/docs-site.js"
];
const poison = [
  /\banalysis\s+to=functions\./iu,
  /\b(?:commentary|final)\s+to=functions\./iu,
  /\bfunctions\.(?:read|write|exec|search|run)\b/iu,
  /<\/?openclaw_docs_i18n_input>/iu,
  /\/home\/runner\/work\//u,
  /彩神马争霸/u
];

for (const rel of required) {
  const file = path.join(site, rel);
  if (!fs.existsSync(file)) throw new Error(`missing ${rel}`);
  if (!rel.endsWith(".html")) continue;
  const html = fs.readFileSync(file, "utf8");
  if (!/<title>[^<]+<\/title>/i.test(html)) throw new Error(`${rel}: missing title`);
  for (const pattern of poison) {
    if (pattern.test(html)) throw new Error(`${rel}: poison matched ${pattern}`);
  }
}
const zhReactions = fs.readFileSync(path.join(site, "zh-CN/tools/reactions/index.html"), "utf8");
if (!/data-url="(?:\/docs)?\/zh-CN\/tools\/reactions\/"/.test(zhReactions)) {
  throw new Error("zh-CN reactions: language picker does not preserve current page");
}
if (!/href="(?:\/docs)?\/zh-CN\/tools\/agent-send/.test(zhReactions)) {
  throw new Error("zh-CN reactions: article links do not stay in locale");
}
const index = fs.readFileSync(path.join(site, "index.html"), "utf8");
if (/src="\/assets\//.test(index) || /href="\/assets\//.test(index)) {
  throw new Error("index: absolute asset paths were not base-path rewritten");
}
console.log(`docs site smoke ok: ${required.length} checks`);
