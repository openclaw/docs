#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { localeLabels } from "./config.mjs";
import { editSourceUrlForPage, frontmatterSourcePath, readSourceMetadata } from "./edit-source.mjs";

const root = process.cwd();
const site = path.join(root, "dist", "docs-site");
const docsDir = path.join(root, "docs");
const sourceMetadata = readSourceMetadata(root);
const expectedOrigin = (process.env.DOCS_SITE_CANONICAL_ORIGIN
  ?? (process.env.DOCS_SITE_CNAME ? `https://${process.env.DOCS_SITE_CNAME}` : "https://docs.openclaw.ai"))
  .replace(/\/$/, "");
const previewOrigin = (process.env.DOCS_SITE_CNAME ? `https://${process.env.DOCS_SITE_CNAME}` : "https://docs.openclaw.ai")
  .replace(/\/$/, "");
const llmsFullAvailable = process.env.DOCS_SITE_LLMS_FULL_AVAILABLE === "1";
const artifactMode = process.env.DOCS_SITE_ARTIFACT_MODE ?? "full";
const shellOnly = artifactMode === "shell";
if (!["full", "shell"].includes(artifactMode)) {
  throw new Error(`DOCS_SITE_ARTIFACT_MODE must be full or shell, got ${artifactMode}`);
}
const required = [
  "index.html",
  "tools/reactions/index.html",
  "it/channels/index.html",
  "zh-CN/tools/reactions/index.html",
  "de/tools/reactions/index.html",
  "de/gateway/heartbeat/index.html",
  "assets/docs-site.css",
  "assets/docs-site.js",
  "assets/molty-avatar.png",
  "assets/molty-avatar-hover.gif"
];
if (!shellOnly) {
  required.push(
    "concepts/models.md",
    "llm.txt",
    "llms.txt",
    ".well-known/llms.txt",
    "robots.txt",
    "sitemap.xml",
    "pagefind/pagefind.js",
    "docs-search.json",
  );
}
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
if (!shellOnly) {
  for (const rel of ["llms-full.txt", ".well-known/llms-full.txt"]) {
    if (fs.existsSync(path.join(site, rel))) throw new Error(`${rel}: full-site LLM corpus should not be emitted`);
  }
  const llms = fs.readFileSync(path.join(site, "llms.txt"), "utf8");
  if (llmsFullAvailable && !/llms-full\.txt/.test(llms)) throw new Error("llms.txt: should advertise llms-full.txt");
  if (!llmsFullAvailable && /llms-full\.txt/.test(llms)) throw new Error("llms.txt: should not advertise unavailable llms-full.txt");
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
  if (/Disallow: \/(?:\.well-known\/)?llms-full\.txt/.test(robots) || !robots.includes(`LLMS: ${expectedOrigin}/llms.txt`)) {
    throw new Error("robots.txt: LLM directives missing");
  }
  if (llmsFullAvailable && !robots.includes(`LLMS-Full: ${expectedOrigin}/llms-full.txt`)) {
    throw new Error("robots.txt: LLMS-Full directive missing");
  }
  if (!llmsFullAvailable && /LLMS-Full:/u.test(robots)) {
    throw new Error("robots.txt: should not advertise unavailable llms-full.txt");
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
}
if (!shellOnly) {
  const searchIndex = JSON.parse(fs.readFileSync(path.join(site, "docs-search.json"), "utf8"));
  if (!Array.isArray(searchIndex.entries) || searchIndex.entries.length < 100) {
    throw new Error("docs-search.json: search index is missing entries");
  }
  if (!searchIndex.entries.some((entry) => entry.title === "Getting started" && entry.url === "/start/getting-started")) {
    throw new Error("docs-search.json: expected getting started entry missing");
  }
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
const gettingStarted = fs.readFileSync(path.join(site, "start/getting-started/index.html"), "utf8");
const gettingStartedOgImage = `${expectedOrigin}/og/start/getting-started.png`;
if (!fs.existsSync(path.join(site, "og/start/getting-started.png"))) {
  throw new Error("start/getting-started: per-page og image was not generated");
}
if (!gettingStarted.includes(`<meta property="og:image" content="${gettingStartedOgImage}">`)) {
  throw new Error("start/getting-started: og:image does not use the per-page card");
}
if (!gettingStarted.includes(`<meta name="twitter:image" content="${gettingStartedOgImage}">`)) {
  throw new Error("start/getting-started: twitter:image does not use the per-page card");
}
if (gettingStarted.includes(`${expectedOrigin}/og-card.png`)) {
  throw new Error("start/getting-started: metadata fell back to the generic og-card.png");
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
if (
  !/data-docs-chat/.test(index) ||
  !/OPENCLAW_DOCS_CHAT_API/.test(index) ||
  !/molty-avatar\.png/.test(index) ||
  !/molty-avatar-hover\.gif/.test(index) ||
  !/<h2 id="docs-chat-title">Molty<\/h2>/.test(index)
) {
  throw new Error("index: docs chat widget was not rendered");
}
const chatCss = fs.readFileSync(path.join(site, "assets/docs-site.css"), "utf8");
if (!/data-chat-copy/.test(index)
  || !/data-chat-retry/.test(index)
  || !/data-chat-maximize/.test(index)
  || !/data-chat-minimize/.test(index)
  || !/docs-chat-empty/.test(index)
  || !/Responses are generated using AI/.test(index)
  || !/data-chat-copy[^>]+hidden/.test(index)
  || !/data-chat-retry[^>]+hidden/.test(index)
  || !/\.docs-chat\.expanded/.test(chatCss)
  || !/\.docs-chat\{[^}]*height:min\(680px/.test(chatCss)
  || !/\.docs-chat-panel\{[^}]*border-radius:16px/.test(chatCss)
  || !/\.docs-chat-panel>\*\{min-width:0;max-width:100%/.test(chatCss)
  || !/\.docs-chat-actions\{[^}]*gap:6px/.test(chatCss)
  || !/\.docs-chat-copy\[data-copy-state\] \.icon\{display:none/.test(chatCss)
  || !/\.docs-chat-copy\[data-copy-state="copied"\]:before\{content:"✓"/.test(chatCss)
  || !/\.docs-chat-log\{[^}]*overflow-x:hidden/.test(chatCss)
  || !/\.docs-chat-message\{[^}]*overflow-wrap:anywhere/.test(chatCss)
  || !/\.docs-chat-form\{[^}]*max-width:100%;overflow:hidden/.test(chatCss)
  || !/\.docs-chat:not\(\[data-chat-auth-state="ready"\]\) \.docs-chat-form\{display:none/.test(chatCss)
  || !/\.docs-chat-form textarea:focus\{[^}]*inset 0 0 0 4px/.test(chatCss)
  || !/\.docs-chat-form button\{position:absolute;right:34px;bottom:34px/.test(chatCss)
  || !/\.docs-chat-auth\{[^}]*grid-row:4;align-self:end/.test(chatCss)
  || !/\.docs-chat-github-icon\{[^}]*fill:currentColor/.test(chatCss)
  || !/\.docs-chat-avatar\{[^}]*border-radius:999px/.test(chatCss)
  || !/\.docs-chat-attach/.test(chatCss)
  || !/translateY\(10px\) scale\(\.985\)/.test(chatCss)) {
  throw new Error("index: floating docs chat controls are missing");
}
if (!/class="hljs-attr">channels<\/span>/.test(index)
  || !/class="hljs-string">&quot;\+15555550123&quot;<\/span>/.test(index)
  || !/class="hljs-literal">true<\/span>/.test(index)) {
  throw new Error("index: json5 config example was not syntax-highlighted");
}
if (!shellOnly) {
  const modelsMarkdown = fs.readFileSync(path.join(site, "concepts/models.md"), "utf8");
  if (!/^---\nsummary: /m.test(modelsMarkdown) || !/title: "Models CLI"/m.test(modelsMarkdown)) {
    throw new Error("concepts/models.md: source markdown was not emitted");
  }
}
if (process.env.DOCS_SITE_BASE_PATH && (/src="\/assets\//.test(index) || /href="\/assets\//.test(index))) {
  throw new Error("index: absolute asset paths were not base-path rewritten");
}
const cssVersion = index.match(/href="[^"]*\/assets\/docs-site\.css\?v=([a-f0-9]{12})"/)?.[1];
const jsVersion = index.match(/src="[^"]*\/assets\/docs-site\.js\?v=([a-f0-9]{12})"/)?.[1];
if (!process.env.DOCS_SITE_BASE_PATH && !cssVersion) {
  throw new Error("index: custom-domain build did not emit root asset paths");
}
if (!jsVersion || cssVersion !== jsVersion) {
  throw new Error("index: docs shell assets do not share a content version");
}
if (process.env.DOCS_SITE_CNAME) {
  const cnamePath = path.join(site, "CNAME");
  if (!fs.existsSync(cnamePath) || fs.readFileSync(cnamePath, "utf8").trim() !== process.env.DOCS_SITE_CNAME) {
    throw new Error("CNAME: custom domain file missing or wrong");
  }
}
const siteJs = fs.readFileSync(path.join(site, "assets/docs-site.js"), "utf8");
const siteCss = fs.readFileSync(path.join(site, "assets/docs-site.css"), "utf8");
if (!/theme-toggle-icon-dark/.test(index)
  || !/theme-toggle-icon-light/.test(index)
  || !/:root\[data-theme="dark"\] \.theme-toggle-icon-dark,:root\[data-theme="light"\] \.theme-toggle-icon-light\{display:grid\}/.test(siteCss)) {
  throw new Error("assets: theme toggle icon must follow the active color theme");
}
if (/\.oc-card:first-child\{border-color:var\(--brand\)/.test(siteCss)) {
  throw new Error("assets: first card is hard-highlighted");
}
if (!/--code:#f7f4f0;--code-inline:#f3efea;--code-block:#fffefa;--code-text:#2d2926;--code-border:#ddd6ce;--code-shadow:none/.test(siteCss)) {
  throw new Error("assets: light code theme is not skinned");
}
if (/\.toc a:first-of-type/.test(siteCss)) {
  throw new Error("assets: first table-of-contents item is hard-highlighted");
}
if (!/\.doc pre \.tok-comment,\.doc pre \.hljs-comment/.test(siteCss)
  || !/\.doc pre \.tok-key,\.doc pre \.hljs-attr/.test(siteCss)) {
  throw new Error("assets: syntax token colors are not theme-variable based");
}
if (!fs.existsSync(path.join(site, "assets/mermaid.esm.min.mjs"))
  || !fs.existsSync(path.join(site, "assets/chunks/mermaid.esm.min"))) {
  throw new Error("assets: Mermaid runtime was not copied");
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
if (!/function setNavOpen/.test(siteJs) || !/body\.nav-open:before/.test(siteCss) || !/data-nav-close/.test(index)) {
  throw new Error("assets: mobile navigation drawer state is missing");
}
if (/data-locale/.test(siteJs)) {
  throw new Error("assets: stale native language select handler is still present");
}
if (!/function initChat/.test(siteJs)
  || !/data-chat-form/.test(siteJs)
  || !/chat\.dataset\.chatAuthState=state/.test(siteJs)
  || !/panel\?\.toggleAttribute\("inert",!open\)/.test(siteJs)
  || !/panel\?\.setAttribute\("aria-hidden",String\(!open\)\)/.test(siteJs)
  || !/form\.inert=!ready/.test(siteJs)
  || !/input\.readOnly=!ready/.test(siteJs)) {
  throw new Error("assets: docs chat behavior is missing");
}
if (/matchMedia\("\(min-width:1121px\)"\)\.matches\)setOpen\(true\)/.test(siteJs)) {
  throw new Error("assets: docs chat must stay closed until Ask Molty is pressed");
}
if (!/function runSearch/.test(siteJs) || !/setTimeout\(\(\)=>runSearch\(expandSearchQuery\(q\),id\),140\)/.test(siteJs)) {
  throw new Error("assets: search input is not debounced");
}
if (!/const searchAliases=/.test(siteJs) || !/data-search-suggestion/.test(index)) {
  throw new Error("assets: search aliases and suggestions are missing");
}
const platformsIndex = fs.readFileSync(path.join(site, "platforms/index.html"), "utf8");
if (/VPS &amp;amp; hosting/.test(platformsIndex)) {
  throw new Error("platforms index: TOC double-escaped ampersand");
}
const toolsIndex = fs.readFileSync(path.join(site, "tools/index.html"), "utf8");
if (/class="anchor"/.test(toolsIndex)) {
  throw new Error("tools index: legacy visible heading permalink anchors should not be rendered");
}
if (!/<h2 id="([^"]*choose-tools[^"]*)"[^>]*>Choose tools, skills, or plugins<button type="button" class="heading-anchor" data-heading-anchor="\1" data-copy-label="Copy link to section" aria-label="Copy link to section">[\s\S]*lucide-link[\s\S]*lucide-check[\s\S]*<\/button><\/h2>/.test(toolsIndex)) {
  throw new Error("tools index: heading ids should render copy-link buttons");
}
if (/<aside class="toc"[\s\S]*Copy link to section/.test(toolsIndex)) {
  throw new Error("tools index: heading copy controls should not pollute the table of contents");
}
if (/\.oc-step:before\{[^}]*background:var\(--brand\)/.test(siteCss)
  || !/\.oc-step:before\{[^}]*background:color-mix\(in srgb,var\(--line-strong\) 78%,var\(--paper\) 22%\)/.test(siteCss)) {
  throw new Error("assets: step badges should use neutral timeline styling");
}
if (!/\.oc-step:last-child\{[^}]*border-image:linear-gradient\(to bottom,var\(--line\)/.test(siteCss)) {
  throw new Error("assets: final step rail should fade out");
}
if (!/\.oc-callout\{[^}]*--callout-accent:var\(--brand\)[^}]*border-left:3px solid var\(--callout-accent\)/.test(siteCss)
  || !/\.oc-callout\{[^}]*background:var\(--callout-surface\);border-color:var\(--line-strong\);border-left-color:var\(--callout-accent\)/.test(siteCss)
  || !/\.oc-callout-warning\{--callout-accent:#d97706\}/.test(siteCss)
  || !/\.oc-callout-check\{--callout-accent:#48b49a\}/.test(siteCss)) {
  throw new Error("assets: callout tones should use reference-aligned component skin");
}
if (!/\.oc-table-wrap\{[^}]*overflow:auto/.test(siteCss)
  || !/:root\{--tooltip-bg:#f4f1ef;--tooltip-text:#171514;--tooltip-border:#f4f1ef\}/.test(siteCss)
  || !/:root\[data-theme="light"\]\{--tooltip-bg:#171514;--tooltip-text:#fffdfa;--tooltip-border:#171514\}/.test(siteCss)
  || !/\.oc-chart\{[^}]*border:1px solid var\(--line-strong\)/.test(siteCss)
  || !/\.oc-chart-mark\[data-tip\]:hover:after/.test(siteCss)
  || !/\.oc-chart-mark\[data-tip\]:hover:after,[^{]+\.oc-chart-donut-key\[data-tip\]:focus:after\{[^}]*background:var\(--tooltip-bg\);color:var\(--tooltip-text\)/.test(siteCss)
  || !/\.oc-chart-donut-segment\{[^}]*stroke-dasharray:var\(--oc-chart-share\)/.test(siteCss)
  || !/:root\[data-theme="light"\] \.oc-callout\{background:var\(--paper\);border-color:var\(--line-strong\);border-left-color:var\(--callout-accent\)\}/.test(siteCss)
  || !/\.oc-cta\{[^}]*grid-template-columns:minmax\(0,1fr\) auto/.test(siteCss)
  || !/\.oc-cta-link\{[^}]*transition:background \.16s ease,border-color \.16s ease,color \.16s ease,filter \.16s ease/.test(siteCss)
  || !/\.oc-cta-link:hover\{filter:brightness\(1\.04\)\}\.oc-cta-link-primary:hover\{background:color-mix\(in srgb,var\(--brand\) 86%,white 14%\);border-color:color-mix\(in srgb,var\(--brand\) 86%,white 14%\);color:#1b0d08\}\.oc-cta-link-secondary:hover\{background:color-mix\(in srgb,var\(--soft\) 62%,var\(--paper\) 38%\);border-color:color-mix\(in srgb,var\(--brand\) 44%,var\(--line-strong\)\);color:var\(--ink\)\}/.test(siteCss)
  || !/\.oc-tooltip\[data-tip\]:hover:after,\.oc-tooltip\[data-tip\]:focus:after\{[^}]*background:var\(--tooltip-bg\);color:var\(--tooltip-text\)/.test(siteCss)
  || !/\.oc-pullquote\{[^}]*border-left:3px solid var\(--brand\)/.test(siteCss)) {
  throw new Error("assets: editorial components should keep the docs publishing skin");
}
if (!/\.doc\{container-type:inline-size\}/.test(siteCss)
  || !/\.oc-card-grid,\.oc-card-group\{--oc-card-columns:2;display:grid;grid-template-columns:repeat\(var\(--oc-card-columns\),minmax\(0,1fr\)\)/.test(siteCss)
  || !/\.oc-card-grid\.oc-card-cols-1,\.oc-card-group\.oc-card-cols-1\{--oc-card-columns:1\}/.test(siteCss)
  || !/\.oc-card-grid\.oc-card-cols-2,\.oc-card-group\.oc-card-cols-2\{--oc-card-columns:2\}/.test(siteCss)
  || !/\.oc-card-grid\.oc-card-cols-3,\.oc-card-group\.oc-card-cols-3\{--oc-card-columns:3\}/.test(siteCss)
  || !/\.oc-card-grid\.oc-card-cols-4,\.oc-card-group\.oc-card-cols-4\{--oc-card-columns:4\}/.test(siteCss)
  || !/@container \(max-width:520px\)\{\.oc-card-grid,\.oc-card-group\{--oc-card-columns:1\}\}/.test(siteCss)) {
  throw new Error("assets: card column classes should use explicit column counts with responsive collapse");
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
  'class="oc-card-grid oc-card-cols-1"',
  'class="oc-card-grid oc-card-cols-2"',
  'class="oc-card-grid oc-card-cols-3"',
  'class="oc-card-grid oc-card-cols-4"',
  'class="oc-card"',
  'class="oc-code"',
  'class="oc-code-group"',
  'scripts/setup-openclaw.sh',
  'openclaw.json5',
  'class="hljs-comment"',
  'class="oc-step"',
  'class="oc-tab"',
  'class="oc-accordion"',
  'class="oc-param"',
  'class="oc-frame"',
  'class="oc-tooltip"',
  'class="oc-param-default"',
  'class="page-status-badge page-status-beta"',
  'Status: visual fixture',
  'Applies to: docs shell',
  'class="oc-badge oc-badge-orange"',
  'class="oc-panel"',
  'class="oc-prompt"',
  'class="oc-tile-group"',
  'class="oc-tile"',
  'class="oc-lead"',
  'class="oc-pullquote"',
  'class="oc-stat-grid"',
  'class="oc-stat"',
  'class="oc-chart oc-chart-bar"',
  'class="oc-chart oc-chart-line"',
  'class="oc-chart oc-chart-area"',
  'class="oc-chart oc-chart-donut"',
  'class="oc-chart-mark"',
  'class="oc-chart-donut-segment"',
  'class="oc-cta oc-cta-default"',
  'class="oc-cta-grid"',
  'class="oc-cta-card oc-cta-card-default"',
  'class="oc-table-wrap"',
  'class="oc-table"',
  'class="oc-mermaid"',
  'Ready&lt;br&gt;state',
  'Broken --&gt;',
  'data-code-copy',
  'class="code-line is-highlighted"',
  'data-prompt-copy',
  'data-heading-anchor',
  'Shared snippet',
  '<kbd>',
]) {
  if (!elementsIndex.includes(marker)) throw new Error(`__elements: missing fixture marker ${marker}`);
}
if (elementsIndex.includes('href="http://SKILL.md"')) {
  throw new Error("__elements: card body should not autolink SKILL.md inside the card anchor");
}
if ((elementsIndex.match(/class="oc-card-grid oc-card-cols-4"/g) ?? []).length < 2) {
  throw new Error("__elements: CardGroup and Columns should both preserve explicit cols attrs");
}
if (!/class="breadcrumbs"/.test(index) || !/data-copy-page/.test(index) || !/class="page-feedback"/.test(index)) {
  throw new Error("index: page reader affordances are missing");
}
assertEditSourceLinks();
if (!/function initCodeGroups/.test(siteJs) || !/className="oc-code-tab"/.test(siteJs) || !/preferredCodeTab/.test(siteJs)) {
  throw new Error("assets: code group tabs are missing");
}
if (!/function handleDocsControlClick/.test(siteJs) || !/async function copyText/.test(siteJs)) {
  throw new Error("assets: copy and feedback controls are missing");
}
if (!/Nothing to copy/.test(siteJs) || !/data-chat-copy/.test(siteJs) || !/data-heading-anchor/.test(siteJs)) {
  throw new Error("assets: chat copy feedback is missing");
}
if (!/function showCopyFeedback/.test(siteJs) || !/data-copy-label="Copy code"/.test(elementsIndex)) {
  throw new Error("assets: code copy controls should use stateful icon feedback");
}
if (!/\.heading-anchor\{[^}]*opacity:0/.test(siteCss)
  || !/\.doc :is\(h1,h2,h3,h4,h5,h6\):hover \.heading-anchor/.test(siteCss)
  || !/\.heading-anchor:focus-visible/.test(siteCss)
  || !/\.heading-anchor \.heading-anchor-icon/.test(siteCss)
  || !/\.heading-anchor\[data-copy-state="copied"\] \.heading-anchor-check/.test(siteCss)) {
  throw new Error("assets: heading copy anchor skin is missing");
}
if (!/\.oc-code figcaption button:before/.test(siteCss)
  || !/\.oc-code figcaption button:after/.test(siteCss)
  || !/\.oc-code figcaption button\[data-copy-state="copied"\]:before/.test(siteCss)
  || !/\.oc-code figcaption button\[data-copy-state="copied"\]:after/.test(siteCss)
  || !/\.oc-code figcaption \.oc-code-label/.test(siteCss)) {
  throw new Error("assets: code copy button icon skin is missing");
}
const ambient = fs.readFileSync(path.join(site, "channels/ambient-room-events/index.html"), "utf8");
if (!/<figure class="oc-code" data-code-label="json5">/.test(ambient)
  || !/class="language-json5"/.test(ambient)
  || !/class="hljs-attr">unmentionedInbound<\/span>/.test(ambient)
  || !/class="hljs-string">&quot;room_event&quot;<\/span>/.test(ambient)
  || !/<span class="code-line" data-line="9">/.test(ambient)
  || !/data-code-copy/.test(ambient)) {
  throw new Error("ambient room events: json5 code block should keep lines, highlight tokens, and copy control");
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
if (!shellOnly) {
  if (/\/__elements/.test(fs.readFileSync(path.join(site, "sitemap.xml"), "utf8"))
    || /\/__elements/.test(fs.readFileSync(path.join(site, "llms.txt"), "utf8"))) {
    throw new Error("__elements: hidden component fixture leaked into public indexes");
  }
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
if (!/href="https:\/\/x\.com\/i\/status\/2010878524543131691"/.test(showcase)) {
  throw new Error("showcase: external card href was not rendered");
}
console.log(`docs site smoke ok: shell, routing, skin, and hidden fixture checks passed (${artifactMode})`);

function assertEditSourceLinks() {
  const htmlFiles = walkHtml(site);
  let checked = 0;
  let missingEdit = 0;
  for (const file of htmlFiles) {
    const rel = path.relative(site, file).replaceAll(path.sep, "/");
    const html = fs.readFileSync(file, "utf8");
    if (rel === "__elements/index.html") {
      if (/data-page-tools|Edit source/.test(html)) {
        throw new Error("__elements: hidden component fixture should not expose page tools");
      }
      continue;
    }

    const tools = html.match(/<div class="page-tools"[\s\S]*?<\/div>/u)?.[0];
    if (!tools) continue;
    checked += 1;

    const page = pageForRenderedHtml(rel);
    if (!page) {
      if (/Edit source/.test(tools)) throw new Error(`${rel}: edit source link has no canonical source page`);
      missingEdit += 1;
      continue;
    }

    const expected = editSourceUrlForPage(page, sourceMetadata);
    const actual = tools.match(/<a href="([^"]+)">Edit source<\/a>/u)?.[1] ?? "";
    if (!expected) {
      if (actual) throw new Error(`${rel}: unexpected edit source link ${actual}`);
      missingEdit += 1;
      continue;
    }
    if (actual !== expected) {
      throw new Error(`${rel}: edit source link ${actual || "(missing)"} should be ${expected}`);
    }
  }

  if (checked < 100) {
    throw new Error(`edit source audit: expected many rendered page tools, checked ${checked}`);
  }

  assertEditSourceSample("clawhub/index.html", "https://github.com/openclaw/clawhub/edit/main/docs/clawhub.md");
  assertEditSourceSample("clawhub/publishing/index.html", "https://github.com/openclaw/clawhub/edit/main/docs/publishing.md");
  assertEditSourceSample("ar/clawhub/publishing/index.html", "https://github.com/openclaw/clawhub/edit/main/docs/publishing.md");
  assertEditSourceSample("de/channels/index.html", "https://github.com/openclaw/openclaw/edit/main/docs/channels/index.md");
  if (missingEdit > 0) {
    console.log(`edit source audit: ${missingEdit} page tool(s) intentionally have no edit source link`);
  }
}

function assertEditSourceSample(rel, expected) {
  const file = path.join(site, rel);
  if (!fs.existsSync(file)) {
    throw new Error(`edit source audit: missing sample ${rel}`);
  }
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes(`href="${expected}"`)) {
    throw new Error(`${rel}: expected edit source link ${expected}`);
  }
}

function pageForRenderedHtml(htmlRel) {
  const segments = htmlRel.split("/");
  if (segments.at(-1) !== "index.html") return null;
  segments.pop();

  const locale = localeLabels[segments[0]] ? segments.shift() : "en";
  const route = segments.join("/");
  const base = locale === "en" ? docsDir : path.join(docsDir, locale);
  const sourceFile = findSourcePageFile(base, route);
  if (!sourceFile) return null;

  const raw = fs.readFileSync(sourceFile, "utf8");
  const parsed = matter(raw);
  return {
    rel: path.relative(base, sourceFile).replaceAll(path.sep, "/"),
    sourcePath: frontmatterSourcePath(parsed.data),
  };
}

function findSourcePageFile(base, route) {
  const candidates = route
    ? [`${route}/index.md`, `${route}/index.mdx`, `${route}.md`, `${route}.mdx`]
    : ["index.md", "index.mdx"];
  for (const candidate of candidates) {
    const file = path.join(base, candidate);
    if (fs.existsSync(file)) return file;
  }
  return "";
}

function walkHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkHtml(full);
    return entry.isFile() && entry.name.endsWith(".html") ? [full] : [];
  });
}
