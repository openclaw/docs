#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const site = path.join(root, "dist", "docs-site");
const expectedOrigin = (process.env.DOCS_SITE_CANONICAL_ORIGIN
  ?? (process.env.DOCS_SITE_CNAME ? `https://${process.env.DOCS_SITE_CNAME}` : "https://documentation.openclaw.ai"))
  .replace(/\/$/, "");
const previewOrigin = (process.env.DOCS_SITE_CNAME ? `https://${process.env.DOCS_SITE_CNAME}` : "https://documentation.openclaw.ai")
  .replace(/\/$/, "");
const required = [
  "index.html",
  "tools/reactions/index.html",
  "it/channels/index.html",
  "zh-CN/tools/reactions/index.html",
  "concepts/models.md",
  "llm.txt",
  "llms.txt",
  ".well-known/llms.txt",
  "robots.txt",
  "sitemap.xml",
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
  /OPENCLAW_DOCS_MARKER/u,
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
for (const rel of ["llms-full.txt", ".well-known/llms-full.txt"]) {
  if (fs.existsSync(path.join(site, rel))) throw new Error(`${rel}: full-site LLM corpus should not be emitted`);
}
const llms = fs.readFileSync(path.join(site, "llms.txt"), "utf8");
if (/llms-full\.txt/.test(llms)) throw new Error("llms.txt: should not advertise llms-full.txt");
if (!/Accept: text\/markdown|\.md/.test(llms)) throw new Error("llms.txt: should advertise page-level Markdown");
if (!llms.includes(`${expectedOrigin}/start/getting-started.md`) || !llms.includes(`${expectedOrigin}/sitemap.xml`)) {
  throw new Error(`llms.txt: expected canonical origin ${expectedOrigin}`);
}
if (previewOrigin !== expectedOrigin && llms.includes(previewOrigin)) {
  throw new Error(`llms.txt: preview origin ${previewOrigin} should not be advertised`);
}
const wellKnownLlms = fs.readFileSync(path.join(site, ".well-known/llms.txt"), "utf8");
if (wellKnownLlms !== llms) throw new Error(".well-known/llms.txt: does not match root llms.txt");
const robots = fs.readFileSync(path.join(site, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${expectedOrigin}/sitemap.xml`)) {
  throw new Error(`robots.txt: sitemap directive missing canonical origin ${expectedOrigin}`);
}
if (!/Disallow: \/llms-full\.txt/.test(robots) || !robots.includes(`LLMS: ${expectedOrigin}/llms.txt`)) {
  throw new Error("robots.txt: LLM directives missing");
}
if (previewOrigin !== expectedOrigin && robots.includes(previewOrigin)) {
  throw new Error(`robots.txt: preview origin ${previewOrigin} should not be advertised`);
}
const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
if (!sitemap.includes(`<loc>${expectedOrigin}/`)) {
  throw new Error(`sitemap.xml: expected canonical origin ${expectedOrigin}`);
}
if (previewOrigin !== expectedOrigin && sitemap.includes(previewOrigin)) {
  throw new Error(`sitemap.xml: preview origin ${previewOrigin} should not be advertised`);
}
const zhReactions = fs.readFileSync(path.join(site, "zh-CN/tools/reactions/index.html"), "utf8");
if (!/href="(?:\/docs)?\/zh-CN\/tools\/reactions"/.test(zhReactions)) {
  throw new Error("zh-CN reactions: language picker does not preserve current page");
}
if (!/href="(?:\/docs)?\/zh-CN\/tools\/agent-send/.test(zhReactions)) {
  throw new Error("zh-CN reactions: article links do not stay in locale");
}
const itChannels = fs.readFileSync(path.join(site, "it/channels/index.html"), "utf8");
if (!/class="tab-link active" href="(?:\/docs)?\/it\/channels"/.test(itChannels)) {
  throw new Error("it channels: localized tabs are missing active Channels tab");
}
if (!/<section class="nav-section"><h2>Overview<\/h2>/.test(itChannels)) {
  throw new Error("it channels: localized sidebar is missing");
}
const index = fs.readFileSync(path.join(site, "index.html"), "utf8");
if (!index.includes(`<link rel="canonical" href="${expectedOrigin}/">`)) {
  throw new Error(`index: canonical link should use ${expectedOrigin}`);
}
if (!index.includes(`<meta property="og:url" content="${expectedOrigin}/">`)) {
  throw new Error(`index: og:url should use ${expectedOrigin}`);
}
if (previewOrigin !== expectedOrigin && /<link rel="canonical"[^>]+documentation\.openclaw\.ai/.test(index)) {
  throw new Error(`index: canonical link should not use preview origin ${previewOrigin}`);
}
if (!/data-language-picker/.test(index) || !/class="language-option active"[^>]*aria-selected="true"/.test(index)) {
  throw new Error("index: custom language picker is missing active state");
}
if (!/Português \(BR\)/.test(index)) {
  throw new Error("index: language picker labels were not rendered");
}
if (!/data-docs-chat/.test(index) || !/OPENCLAW_DOCS_CHAT_API/.test(index)) {
  throw new Error("index: docs chat widget was not rendered");
}
if (!/class="tok-key">channels<\/span>/.test(index)
  || !/class="tok-string">&quot;\+15555550123&quot;<\/span>/.test(index)
  || !/class="tok-literal">true<\/span>/.test(index)) {
  throw new Error("index: json5 config example was not syntax-highlighted");
}
const modelsMarkdown = fs.readFileSync(path.join(site, "concepts/models.md"), "utf8");
if (!/^---\nsummary: /m.test(modelsMarkdown) || !/title: "Models CLI"/m.test(modelsMarkdown)) {
  throw new Error("concepts/models.md: source markdown was not emitted");
}
if (process.env.DOCS_SITE_BASE_PATH && (/src="\/assets\//.test(index) || /href="\/assets\//.test(index))) {
  throw new Error("index: absolute asset paths were not base-path rewritten");
}
if (!process.env.DOCS_SITE_BASE_PATH && !/href="\/assets\/docs-site\.css\?v=9e2fc4e1b67b"/.test(index)) {
  throw new Error("index: custom-domain build did not emit root asset paths");
}
if (!/src="\/assets\/docs-site\.js\?v=9e2fc4e1b67b"/.test(index)) {
  throw new Error("index: docs shell asset version is not stable");
}
if (process.env.DOCS_SITE_CNAME) {
  const cnamePath = path.join(site, "CNAME");
  if (!fs.existsSync(cnamePath) || fs.readFileSync(cnamePath, "utf8").trim() !== process.env.DOCS_SITE_CNAME) {
    throw new Error("CNAME: custom domain file missing or wrong");
  }
}
const siteJs = fs.readFileSync(path.join(site, "assets/docs-site.js"), "utf8");
const siteCss = fs.readFileSync(path.join(site, "assets/docs-site.css"), "utf8");
if (/\.oc-card:first-child\{border-color:var\(--brand\)/.test(siteCss)) {
  throw new Error("assets: first card is hard-highlighted");
}
if (!/--code:#f7f4f0;--code-inline:#f3efea;--code-block:#fffefa;--code-text:#2d2926;--code-border:#ddd6ce;--code-shadow:none/.test(siteCss)) {
  throw new Error("assets: light code theme is not skinned");
}
if (/\.toc a:first-of-type/.test(siteCss)) {
  throw new Error("assets: first table-of-contents item is hard-highlighted");
}
if (!/\.doc pre \.tok-comment\{color:var\(--tok-comment\)\}/.test(siteCss)) {
  throw new Error("assets: syntax token colors are not theme-variable based");
}
if (!/\.sidebar\{[^}]*padding:0 6px 36px 0;[^}]*scrollbar-gutter:stable/.test(siteCss)) {
  throw new Error("assets: sidebar scroll-end padding is missing");
}
if (!/\.header-row,\.tabs\{max-width:1780px;margin:0 auto\}/.test(siteCss)
  || !/\.doc-shell\{max-width:1780px;margin:0 auto\}/.test(siteCss)
  || !/\.doc-shell\{display:grid;grid-template-columns:340px minmax\(0,1fr\);gap:72px;padding:38px 56px 90px\}/.test(siteCss)) {
  throw new Error("assets: docs shell geometry does not match the wide reference layout");
}
if (!/body\{[^}]*font:14px\/1\.72/.test(siteCss)
  || !/\.tab-link\{[^}]*font-size:14px/.test(siteCss)
  || !/\.article h1\{font:740 28px\/1\.12/.test(siteCss)
  || !/\.doc\{font-size:14px\}/.test(siteCss)) {
  throw new Error("assets: docs type scale drifted from the reference skin");
}
if (!/--bg:#0d0b0b;--paper:#111010;--paper-2:#151211;[^}]*--soft:#241915/.test(siteCss)
  || !/\.nav-link\.active\{background:var\(--soft\);color:var\(--brand\);font-weight:730\}/.test(siteCss)) {
  throw new Error("assets: dark sidebar surface is not reference-aligned");
}
if (!/function syncSidebar/.test(siteJs) || !/async function navigateTo/.test(siteJs)) {
  throw new Error("assets: docs PJAX navigation is missing");
}
if (/data-locale/.test(siteJs)) {
  throw new Error("assets: stale native language select handler is still present");
}
if (!/function initChat/.test(siteJs) || !/data-chat-form/.test(siteJs)) {
  throw new Error("assets: docs chat behavior is missing");
}
if (!/function runSearch/.test(siteJs) || !/setTimeout\(\(\)=>runSearch\(q,id\),140\)/.test(siteJs)) {
  throw new Error("assets: search input is not debounced");
}
const platformsIndex = fs.readFileSync(path.join(site, "platforms/index.html"), "utf8");
if (/VPS &amp;amp; hosting/.test(platformsIndex)) {
  throw new Error("platforms index: TOC double-escaped ampersand");
}
const toolsIndex = fs.readFileSync(path.join(site, "tools/index.html"), "utf8");
if (/class="anchor"/.test(toolsIndex)) {
  throw new Error("tools index: visible heading permalink anchors should not be rendered");
}
if (!/<h2 id="[^"]*choose-tools[^"]*"[^>]*>Choose tools, skills, or plugins<\/h2>/.test(toolsIndex)) {
  throw new Error("tools index: heading ids should remain without visible # anchors");
}
if (/\.oc-step:before\{[^}]*background:var\(--brand\)/.test(siteCss)
  || !/\.oc-step:before\{[^}]*background:color-mix\(in srgb,var\(--line-strong\) 78%,var\(--paper\) 22%\)/.test(siteCss)) {
  throw new Error("assets: step badges should use neutral timeline styling");
}
if (!/\.oc-callout\{[^}]*--callout-accent:var\(--brand\)[^}]*border-left:3px solid var\(--callout-accent\)/.test(siteCss)
  || !/\.oc-callout-warning\{--callout-accent:#d97706\}/.test(siteCss)
  || !/\.oc-callout-check\{--callout-accent:#48b49a\}/.test(siteCss)) {
  throw new Error("assets: callout tones should use reference-aligned component skin");
}
const elementsIndexPath = path.join(site, "__elements/index.html");
if (!fs.existsSync(elementsIndexPath)) {
  throw new Error("__elements: hidden component fixture page is missing");
}
const elementsIndex = fs.readFileSync(elementsIndexPath, "utf8");
for (const marker of [
  'class="oc-callout oc-callout-tip"',
  'class="oc-callout oc-callout-info"',
  'class="oc-callout oc-callout-warning"',
  'class="oc-card"',
  'class="oc-code-group"',
  'class="oc-step"',
  'class="oc-tab"',
  'class="oc-accordion"',
  'class="oc-param"',
  'class="oc-frame"',
]) {
  if (!elementsIndex.includes(marker)) throw new Error(`__elements: missing fixture marker ${marker}`);
}
if (!/<meta name="robots" content="noindex,nofollow">/.test(elementsIndex)) {
  throw new Error("__elements: hidden component fixture should be noindex");
}
if (/data-pagefind-body/.test(elementsIndex) || !/data-pagefind-ignore/.test(elementsIndex)) {
  throw new Error("__elements: hidden component fixture should be excluded from Pagefind");
}
if (/data-docs-chat/.test(elementsIndex)) {
  throw new Error("__elements: hidden component fixture should not be obscured by docs chat");
}
if (/\/__elements/.test(fs.readFileSync(path.join(site, "sitemap.xml"), "utf8"))
  || /\/__elements/.test(fs.readFileSync(path.join(site, "llms.txt"), "utf8"))) {
  throw new Error("__elements: hidden component fixture leaked into public indexes");
}
const dateTime = fs.readFileSync(path.join(site, "date-time/index.html"), "utf8");
if (/Current Date &amp;amp; Time/.test(dateTime)) {
  throw new Error("date-time: TOC double-escaped ampersand");
}
const legacyDigitalOcean = path.join(site, "docs/platforms/digitalocean/index.html");
if (!fs.existsSync(legacyDigitalOcean)) {
  throw new Error("legacy DigitalOcean redirect: missing /docs/platforms/digitalocean compatibility file");
}
if (!/url=\/(?:docs\/)?install\/digitalocean/.test(fs.readFileSync(legacyDigitalOcean, "utf8"))) {
  throw new Error("legacy DigitalOcean redirect: wrong destination");
}
const showcase = fs.readFileSync(path.join(site, "start/showcase/index.html"), "utf8");
if (!/href="https:\/\/www\.youtube\.com\/watch\?v=SaWSPZoPX34"/.test(showcase)) {
  throw new Error("showcase: external card href was not rendered");
}
console.log("docs site smoke ok: shell, routing, skin, and hidden fixture checks passed");
