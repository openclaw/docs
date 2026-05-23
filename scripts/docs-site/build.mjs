#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
import matter from "gray-matter";

import { ignoredDocDirs, ignoredDocFiles, localeLabels, mintlifyLocaleToDir, rtlLocales } from "./config.mjs";
import { siteCss, siteJs } from "./assets.mjs";
import { createMarkdownRenderer, renderMdxish } from "./mdx-ish.mjs";
import { elementsFixture } from "./elements-fixture.mjs";
import { renderPageOgSvg } from "./og-card-template.mjs";

const root = process.cwd();
const docsDir = path.join(root, "docs");
const siteAssetsDir = path.join(root, "scripts", "docs-site");
const outDir = path.join(root, "dist", "docs-site");
const config = JSON.parse(fs.readFileSync(path.join(docsDir, "docs.json"), "utf8"));
const md = createMarkdownRenderer();
const basePath = normalizeBasePath(process.env.DOCS_SITE_BASE_PATH ?? "");
const legacyBasePath = normalizeBasePath(process.env.DOCS_SITE_LEGACY_BASE_PATH ?? "/docs");
const canonicalOrigin = (process.env.DOCS_SITE_CANONICAL_ORIGIN
  ?? (process.env.DOCS_SITE_CNAME ? `https://${process.env.DOCS_SITE_CNAME}` : "https://docs.openclaw.ai"))
  .replace(/\/$/, "");
const llmsFullAvailable = process.env.DOCS_SITE_LLMS_FULL_AVAILABLE === "1";
const ogImagePath = "/og-card.png";
const renderedPageOgCards = new Set();
const rsvgAvailable = checkRsvg();
const chatApiUrl = process.env.DOCS_SITE_CHAT_API_URL ?? "/ask-molty/api/chat";
const shellCss = siteCss();
const shellJs = siteJs();
const defaultShellAssetVersion = createHash("sha256")
  .update(shellCss)
  .update("\0")
  .update(shellJs)
  .digest("hex")
  .slice(0, 12);
const shellAssetVersion = process.env.DOCS_SITE_SHELL_ASSET_VERSION ?? defaultShellAssetVersion;
const artifactMode = process.env.DOCS_SITE_ARTIFACT_MODE ?? "full";
const shellOnly = artifactMode === "shell";
if (!["full", "shell"].includes(artifactMode)) {
  throw new Error(`DOCS_SITE_ARTIFACT_MODE must be full or shell, got ${artifactMode}`);
}
fs.rmSync(outDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
fs.mkdirSync(outDir, { recursive: true });

const locales = buildLocales(config);
const pages = [...collectPages(locales), elementsFixturePage()];
const pageByKey = new Map(pages.map((page) => [pageKey(page.locale, page.slug), page]));
const navByLocale = new Map(locales.map((locale) => [locale.code, buildNav(locale)]));
const localeFlags = {
  en: "🇺🇸",
  "zh-CN": "🇨🇳",
  "zh-TW": "🇨🇳",
  "ja-JP": "🇯🇵",
  es: "🇪🇸",
  "pt-BR": "🇧🇷",
  ko: "🇰🇷",
  de: "🇩🇪",
  fr: "🇫🇷",
  ar: "🇸🇦",
  it: "🇮🇹",
  vi: "🇻🇳",
  nl: "🇳🇱",
  tr: "🇹🇷",
  uk: "🇺🇦",
  id: "🇮🇩",
  pl: "🇵🇱",
  fa: "🇮🇷",
  th: "🇹🇭"
};
const localePickerLabels = {
  "pt-BR": "Português (BR)"
};

copyPublicFiles();
await renderPageOgCards();
for (const page of pages) writePage(page);
if (!shellOnly) {
  writeLlmsIndex();
  writeRobotsTxt();
  writeSitemap();
}
writeRedirects();
writeStaticAssets();
console.log(`built ${pages.length} pages in ${path.relative(root, outDir)} (${artifactMode})`);

function buildLocales(docsConfig) {
  const ordered = [];
  for (const entry of docsConfig.navigation?.languages ?? []) {
    const code = mintlifyLocaleToDir[entry.language] ?? entry.language;
    ordered.push({ code, source: entry, root: code === "en" });
  }
  for (const dirent of fs.readdirSync(docsDir, { withFileTypes: true })) {
    if (!dirent.isDirectory() || ignoredDocDirs.has(dirent.name)) continue;
    if (localeLabels[dirent.name] && !ordered.some((locale) => locale.code === dirent.name)) {
      ordered.push({ code: dirent.name, source: ordered[0]?.source, root: false });
    }
  }
  return ordered.filter((locale) => locale.root || fs.existsSync(path.join(docsDir, locale.code)));
}

function collectPages(localeList) {
  const result = [];
  for (const locale of localeList) {
    const base = locale.root ? docsDir : path.join(docsDir, locale.code);
    for (const file of walkDocs(base)) {
      const rel = path.relative(base, file).replaceAll(path.sep, "/");
      if (ignoredDocFiles.has(rel) || rel.endsWith("/AGENTS.md")) continue;
      const raw = fs.readFileSync(file, "utf8");
      const parsed = matter(raw);
      const slug = fileSlug(rel);
      const title = parsed.data.title || firstHeading(parsed.content) || titleize(path.basename(slug));
      result.push({
        locale: locale.code,
        dir: locale.root ? "" : locale.code,
        slug,
        file,
        rel,
        raw,
        title,
        summary: parsed.data.summary ?? "",
        readWhen: parsed.data.read_when ?? [],
        body: parsed.content,
        meta: {
          status: parsed.data.status ?? firstStatusLine(parsed.content),
          appliesTo: parsed.data.applies_to ?? parsed.data.appliesTo,
          since: parsed.data.since,
          updated: parsed.data.updated ?? parsed.data.last_updated,
          deprecated: parsed.data.deprecated,
          beta: parsed.data.beta,
        }
      });
    }
  }
  return result;
}

function elementsFixturePage() {
  const parsed = matter(elementsFixture);
  return {
    locale: "en",
    dir: "",
    slug: "__elements",
    file: path.join(siteAssetsDir, "elements-fixture.mjs"),
    rel: "__elements.md",
    raw: elementsFixture,
    title: parsed.data.title || "Docs elements",
    summary: parsed.data.summary ?? "",
    readWhen: [],
    body: parsed.content,
    meta: {
      status: parsed.data.status,
      appliesTo: parsed.data.applies_to ?? parsed.data.appliesTo,
      since: parsed.data.since,
      updated: parsed.data.updated ?? parsed.data.last_updated,
      deprecated: parsed.data.deprecated,
      beta: parsed.data.beta,
    },
    hidden: true
  };
}

function walkDocs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return ignoredDocDirs.has(entry.name) ? [] : walkDocs(full);
    return /\.(md|mdx)$/.test(entry.name) ? [full] : [];
  });
}

function buildNav(locale) {
  const source = locale.source ?? locales[0]?.source;
  const tabs = (source?.tabs ?? []).map((tab) => ({
    title: tab.tab,
    groups: (tab.groups ?? []).map((group) => navGroup(locale.code, group)).filter(Boolean)
  }));
  return tabs.filter((tab) => tab.groups.length);
}

function navGroup(locale, group) {
  const pages = flattenPages(locale, group.pages ?? []);
  return pages.length ? { title: group.group ?? "Docs", pages } : null;
}

function flattenPages(locale, entries) {
  const output = [];
  for (const entry of entries) {
    if (typeof entry === "string") {
      const page = pageByKey.get(pageKey(locale, navEntrySlug(locale, entry)));
      if (page) output.push(page);
    } else if (entry?.pages) {
      const nested = flattenPages(locale, entry.pages);
      if (nested.length) output.push({ group: entry.group ?? "More", pages: nested });
    }
  }
  return output;
}

function navEntrySlug(locale, entry) {
  const slug = normalizeSlug(entry);
  return slug.startsWith(`${locale}/`) ? normalizeSlug(slug.slice(locale.length + 1)) : slug;
}

function writePage(page) {
  const nav = navByLocale.get(page.locale) ?? [];
  const flat = flattenNav(nav);
  const activeIndex = flat.findIndex((item) => item.slug === page.slug);
  const activeTab = activeTabTitle(nav, page.slug);
  const prev = activeIndex > 0 ? flat[activeIndex - 1] : null;
  const next = activeIndex >= 0 && activeIndex < flat.length - 1 ? flat[activeIndex + 1] : null;
  const html = rewriteInternalUrls(renderMdxish(expandSnippets(page.body, page.file), md), page.locale);
  const toc = tableOfContents(html);
  const outPath = path.join(outDir, pageRoute(page).replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, layout({ page, nav, activeTab, html, toc, prev, next }), "utf8");
  if (shellOnly) return;
  const mdPath = path.join(outDir, pageMarkdownRoute(page).replace(/^\//, ""));
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, page.raw, "utf8");
}

function layout({ page, nav, activeTab, html, toc, prev, next }) {
  const lang = htmlLang(page.locale);
  const dir = rtlLocales.has(page.locale) ? "rtl" : "ltr";
  const title = `${page.title} - ${config.name}`;
  const description = page.summary || config.description || "";
  const ogTitle = page.slug === "index" ? config.name : `${page.title} · ${config.name}`;
  const canonicalUrl = canonicalOrigin ? `${canonicalOrigin}${pageRoute(page)}` : "";
  const pageOgPath = page.locale === "en" && renderedPageOgCards.has(page.slug)
    ? `/og/${page.slug}.png`
    : ogImagePath;
  const ogImageUrl = canonicalOrigin ? `${canonicalOrigin}${pageOgPath}` : publicPath(pageOgPath);
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escapeAttr(description)}">
<title>${escapeHtml(title)}</title>
${canonicalUrl ? `<link rel="canonical" href="${escapeAttr(canonicalUrl)}">` : ""}
${page.hidden ? '<meta name="robots" content="noindex,nofollow">' : ""}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeAttr(config.name)}">
<meta property="og:title" content="${escapeAttr(ogTitle)}">
<meta property="og:description" content="${escapeAttr(description)}">
${canonicalUrl ? `<meta property="og:url" content="${escapeAttr(canonicalUrl)}">` : ""}
<meta property="og:image" content="${escapeAttr(ogImageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeAttr(`${config.name} — ${description}`)}">
<meta property="og:locale" content="${escapeAttr(htmlLang(page.locale).replace("-", "_"))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(ogTitle)}">
<meta name="twitter:description" content="${escapeAttr(description)}">
<meta name="twitter:image" content="${escapeAttr(ogImageUrl)}">
<meta name="twitter:image:alt" content="${escapeAttr(`${config.name} — ${description}`)}">
<meta name="theme-color" content="#FF5A36">
<link rel="icon" href="${publicPath("/assets/pixel-lobster.svg")}">
<link rel="stylesheet" href="${assetUrl("/assets/docs-site.css")}">
<script>window.OPENCLAW_DOCS_BASE=${JSON.stringify(basePath)};window.OPENCLAW_DOCS_CHAT_API=${JSON.stringify(chatApiUrl)};document.documentElement.dataset.theme=localStorage.getItem("theme")||"dark"</script>
</head>
<body>
${siteHeader(page, nav, activeTab)}
<div class="doc-shell">
${sidebar(page, nav, activeTab)}
<main class="main" id="main">
<article class="article">
<header class="article-header">
${breadcrumbs(page, nav)}
<p class="article-kicker">${escapeHtml(groupForPage(nav, page.slug) ?? activeTab)}</p>
<h1>${escapeHtml(page.title)}</h1>
${pageStatus(page)}
${page.hidden ? "" : pageTools(page)}
</header>
<div class="doc"${page.hidden ? ' data-pagefind-ignore' : ' data-pagefind-body'}>${html}</div>
${page.hidden ? "" : pageFeedback()}
${pager(prev, next)}
</article>
${tocHtml(toc)}
</main>
</div>
${searchModal()}
${page.hidden ? "" : chatWidget()}
<script type="module" src="${assetUrl("/assets/docs-site.js")}"></script>
</body>
</html>`;
}

function assetUrl(file) {
  return `${publicPath(file)}?v=${encodeURIComponent(shellAssetVersion)}`;
}

function siteHeader(page, nav, activeTab) {
  const tabs = nav.map((tab) => {
    const href = pageUrl(firstPage(tab));
    const active = tab.title === activeTab ? " active" : "";
    return `<a class="tab-link${active}" href="${href}">${escapeHtml(tab.title)}</a>`;
  }).join("");
  return `<header class="site-header">
<div class="header-row">
<div class="header-left"><a class="brand" href="${pageUrl(pageByKey.get(pageKey(page.locale, "index")) ?? page)}"><img src="${publicPath("/assets/pixel-lobster.svg")}" alt=""></a>${languagePicker(page)}</div>
<button class="search-button" type="button" data-search-open>${icon("search")}<span class="search-label">Search...</span><span class="search-shortcut">⌘K</span></button>
<nav class="header-links">${topLink("GitHub", "https://github.com/openclaw/openclaw", "github")}${topLink("Releases", "https://github.com/openclaw/openclaw/releases", "package")}${topLink("Discord", "https://discord.com/invite/clawd", "discord")}<button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle theme">${icon("moon")}</button></nav>
<button class="nav-toggle" type="button" data-nav-toggle>Menu</button>
</div>
<nav class="tabs">${tabs}<span class="tab-underline" aria-hidden="true"></span></nav>
</header>`;
}

function sidebar(page, nav, activeTab) {
  const groups = (nav.find((tab) => tab.title === activeTab) ?? nav[0])?.groups ?? [];
  return `<aside class="sidebar">
<button class="sidebar-close" type="button" data-nav-close aria-label="Close menu">Close</button>
<nav>${groups.map((group) => navGroupHtml(page, group)).join("")}</nav>
</aside>`;
}

function languagePicker(page) {
  const current = locales.find((locale) => locale.code === page.locale) ?? locales[0];
  const currentLabel = localeDisplayName(current.code);
  const currentFlag = localeFlag(current.code);
  const options = locales.map((locale) => {
    const active = locale.code === page.locale;
    return `<a class="language-option${active ? " active" : ""}" role="option" aria-selected="${active ? "true" : "false"}" href="${escapeAttr(localeUrlForSlug(locale.code, page.slug))}" data-locale-option><span class="locale-flag" aria-hidden="true">${escapeHtml(localeFlag(locale.code))}</span><span class="language-name">${escapeHtml(localeDisplayName(locale.code))}</span><span class="language-check" aria-hidden="true">✓</span></a>`;
  }).join("");
  return `<div class="language-picker" data-language-picker><button class="language-trigger" type="button" data-language-trigger aria-haspopup="listbox" aria-expanded="false"><span class="locale-flag" aria-hidden="true">${escapeHtml(currentFlag)}</span><span class="language-current">${escapeHtml(currentLabel)}</span><span class="language-chevron" aria-hidden="true">${icon("chevron-down")}</span></button><div class="language-menu" role="listbox" aria-label="Language">${options}</div></div>`;
}

function localeFlag(code) {
  return localeFlags[code] ?? "🌐";
}

function localeDisplayName(code) {
  return localePickerLabels[code] ?? localeLabels[code] ?? code;
}

function topLink(label, href, iconName) {
  return `<a href="${escapeAttr(href)}">${icon(iconName)}<span>${escapeHtml(label)}</span></a>`;
}

function firstStatusLine(content) {
  const match = String(content).match(/^(?:\*\*)?Status(?:\*\*)?:\s*(.+)$/im);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function breadcrumbs(page, nav) {
  if (page.hidden) return "";
  const activeTab = activeTabTitle(nav, page.slug);
  const group = groupForPage(nav, page.slug);
  const parts = [activeTab, group, page.title].filter(Boolean);
  return parts.length > 1
    ? `<nav class="breadcrumbs" aria-label="Breadcrumb">${parts.map((part, index) => {
      const last = index === parts.length - 1;
      return last ? `<span aria-current="page">${escapeHtml(part)}</span>` : `<span>${escapeHtml(part)}</span>`;
    }).join("<span aria-hidden=\"true\">/</span>")}</nav>`
    : "";
}

function pageTools(page) {
  const canonicalUrl = `${docsOrigin()}${pageRoute(page)}`;
  const editUrl = `https://github.com/openclaw/openclaw/edit/main/docs/${page.rel}`;
  return `<div class="page-tools" data-page-tools data-page-url="${escapeAttr(canonicalUrl)}"><button type="button" data-copy-page>Copy page</button><a href="${escapeAttr(editUrl)}">Edit source</a></div>`;
}

function pageStatus(page) {
  const meta = page.meta ?? {};
  const badges = [];
  if (truthy(meta.beta)) badges.push(["Beta", "beta"]);
  if (truthy(meta.deprecated)) badges.push(["Deprecated", "deprecated"]);
  if (meta.status) badges.push([`Status: ${meta.status}`, "status"]);
  if (meta.appliesTo) badges.push([`Applies to: ${meta.appliesTo}`, "applies"]);
  if (meta.since) badges.push([`Since ${meta.since}`, "since"]);
  if (meta.updated) badges.push([`Updated ${meta.updated}`, "updated"]);
  return badges.length
    ? `<div class="page-status">${badges.map(([label, kind]) => `<span class="page-status-badge page-status-${kind}">${escapeHtml(label)}</span>`).join("")}</div>`
    : "";
}

function truthy(value) {
  return value === true || value === "true" || value === "yes" || value === 1 || value === "1";
}

function icon(name) {
  const attrs = `class="icon icon-${escapeAttr(name)}" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"`;
  if (name === "github") return `<svg ${attrs} fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.08 1.84 2.82 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z"/></svg>`;
  if (name === "discord") return `<svg ${attrs} fill="currentColor"><path d="M20.32 4.37A19.8 19.8 0 0 0 15.37 2.84a13.77 13.77 0 0 0-.63 1.31 18.4 18.4 0 0 0-5.48 0 13.7 13.7 0 0 0-.64-1.31 19.72 19.72 0 0 0-4.95 1.54C.55 9.07-.32 13.64.1 18.15a19.9 19.9 0 0 0 6.07 3.07 14.6 14.6 0 0 0 1.3-2.11 12.9 12.9 0 0 1-2.05-.98c.17-.13.34-.26.5-.39a14.2 14.2 0 0 0 12.16 0c.17.14.33.27.5.39-.65.38-1.33.7-2.05.98.38.74.82 1.45 1.3 2.11a19.86 19.86 0 0 0 6.08-3.07c.5-5.23-.84-9.76-3.59-13.78ZM8.02 15.38c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.2 0 2.18 1.1 2.15 2.42 0 1.33-.95 2.41-2.15 2.41Zm7.96 0c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.2 0 2.17 1.1 2.15 2.42 0 1.33-.95 2.41-2.15 2.41Z"/></svg>`;
  const paths = {
    "search": '<path d="m21 21-4.35-4.35"/><circle cx="11" cy="11" r="7"/>',
    "package": '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M12 22V13"/><path d="m3 8v8l9 6 9-6V8"/>',
    "moon": '<path d="M20.9 13.5a8.5 8.5 0 0 1-10.4-10.4 8.5 8.5 0 1 0 10.4 10.4Z"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "copy": '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    "maximize-2": '<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="M9 21H3v-6"/><path d="m3 21 7-7"/>',
    "refresh-cw": '<path d="M21 12a9 9 0 0 1-15.1 6.64"/><path d="M3 12A9 9 0 0 1 18.1 5.36"/><path d="M21 3v6h-6"/><path d="M3 21v-6h6"/>',
    "send": '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    "trash": '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/>',
    };
  return `<svg ${attrs} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? ""}</svg>`;
}

function navGroupHtml(activePage, group) {
  return `<section class="nav-section"><h2>${escapeHtml(group.title)}</h2>${group.pages.map((entry) => {
    if (entry.group) return `<div class="nav-nested"><h2>${escapeHtml(entry.group)}</h2>${entry.pages.map((page) => navLink(activePage, page)).join("")}</div>`;
    return navLink(activePage, entry);
  }).join("")}</section>`;
}

function navLink(activePage, page) {
  const active = activePage.locale === page.locale && activePage.slug === page.slug ? " active" : "";
  return `<a class="nav-link${active}" href="${pageUrl(page)}">${escapeHtml(page.title)}</a>`;
}

function tableOfContents(html) {
  return [...html.matchAll(/<h([23])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)]
    .map((m) => ({ level: Number(m[1]), id: m[2], title: decodeHtmlEntities(stripTags(m[3]).replace(/^#\s*/, "")) }))
    .slice(0, 24);
}

function tocHtml(items) {
  if (!items.length) return "";
  return `<aside class="toc"><h2>On this page</h2>${items.map((item) => `<a class="toc-l${item.level}" href="#${escapeAttr(item.id)}">${escapeHtml(item.title)}</a>`).join("")}</aside>`;
}

function pager(prev, next) {
  if (!prev && !next) return "";
  return `<nav class="page-nav">${prev ? `<a href="${pageUrl(prev)}"><small>Previous</small>${escapeHtml(prev.title)}</a>` : "<span></span>"}${next ? `<a class="next" href="${pageUrl(next)}"><small>Next</small>${escapeHtml(next.title)}</a>` : ""}</nav>`;
}

function pageFeedback() {
  return `<section class="page-feedback" aria-label="Page feedback"><span>Was this useful?</span><button type="button" data-feedback-value="yes">Yes</button><button type="button" data-feedback-value="no">No</button><output data-feedback-result></output></section>`;
}

function searchModal() {
  return `<div class="search-modal"><div class="search-panel"><div class="search-head"><input data-search-input placeholder="Search commands, channels, config..."><button data-search-close>Close</button></div><div class="search-hints" aria-label="Search shortcuts"><button type="button" data-search-suggestion="install">install</button><button type="button" data-search-suggestion="telegram">telegram</button><button type="button" data-search-suggestion="gateway">gateway</button><button type="button" data-search-suggestion="plugins">plugins</button></div><div class="search-results" data-search-results></div></div></div>`;
}

function writeLlmsIndex() {
  const origin = docsOrigin();
  const lines = [
    `# ${config.name}`,
    "",
    config.description ?? "OpenClaw documentation.",
    "",
    "> Use this file as a lightweight map of the OpenClaw documentation. Fetch individual pages as Markdown with `.md` URLs or `Accept: text/markdown`.",
    "",
    "## Agent Resources",
    "",
    `- [Markdown page export](${origin}/start/getting-started.md): Append \`.md\` to any docs page URL for clean Markdown.`,
    `- [Sitemap](${origin}/sitemap.xml): Search crawler URL index.`,
    `- [Robots policy](${origin}/robots.txt): Bot and crawler policy.`,
    "",
    "## Documentation Index",
    "",
  ];
  if (llmsFullAvailable) {
    lines.splice(8, 0, `- [Full documentation corpus](${origin}/llms-full.txt): Nightly full-site Markdown corpus for LLM context.`);
  }
  for (const page of englishDocsPages()) {
    const summary = page.summary ? `: ${stripMdxForLlms(page.summary).replace(/\s+/g, " ").trim()}` : "";
    lines.push(`- [${page.title}](${origin}${pageRoute(page)})${summary}`);
  }
  const content = `${lines.join("\n")}\n`;
  fs.writeFileSync(path.join(outDir, "llms.txt"), content, "utf8");
  fs.writeFileSync(path.join(outDir, "llm.txt"), content, "utf8");
  const wellKnownDir = path.join(outDir, ".well-known");
  fs.mkdirSync(wellKnownDir, { recursive: true });
  fs.writeFileSync(path.join(wellKnownDir, "llms.txt"), content, "utf8");
}

function writeRobotsTxt() {
  const origin = docsOrigin();
  const botAgents = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-User",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
  ];
  const lines = [
    "# OpenClaw documentation crawler policy",
    "# Human docs are HTML. Agent-optimized docs are available as Markdown via .md URLs or Accept: text/markdown.",
    llmsFullAvailable
      ? "# Agent-optimized docs are available through /llms.txt, page-level Markdown, and the nightly /llms-full.txt corpus."
      : "# Agent-optimized docs are available through /llms.txt and page-level Markdown.",
    "",
    "User-agent: *",
    "Allow: /",
    "Disallow: /__elements",
    "Disallow: /ask-molty/api/",
    "",
  ];
  for (const agent of botAgents) {
    lines.push(`User-agent: ${agent}`);
    lines.push("Allow: /");
    lines.push("Disallow: /__elements");
    lines.push("Disallow: /ask-molty/api/");
    lines.push("");
  }
  lines.push(`Sitemap: ${origin}/sitemap.xml`);
  lines.push(`LLMS: ${origin}/llms.txt`);
  if (llmsFullAvailable) lines.push(`LLMS-Full: ${origin}/llms-full.txt`);
  lines.push("");
  fs.writeFileSync(path.join(outDir, "robots.txt"), lines.join("\n"), "utf8");
}

function writeSitemap() {
  const origin = docsOrigin();
  const urls = [...new Set(pages.filter((page) => !page.hidden).map((page) => `${origin}${pageRoute(page)}`))]
    .sort((a, b) => a.localeCompare(b));
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "sitemap.xml"), xml, "utf8");
}

function englishDocsPages() {
  return pages
    .filter((page) => !page.hidden && page.locale === "en" && !localeLabels[page.rel.split("/")[0]])
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function docsOrigin() {
  return (canonicalOrigin || "https://docs.openclaw.ai").replace(/\/$/, "");
}

function chatWidget() {
  if (!chatApiUrl) return "";
  return `<section class="docs-chat" data-docs-chat aria-label="OpenClaw docs assistant">
<button class="docs-chat-launcher" type="button" data-chat-toggle aria-expanded="false" aria-controls="docs-chat-panel"><span aria-hidden="true">*</span><span>Ask Molty</span></button>
<div class="docs-chat-panel" id="docs-chat-panel" role="dialog" aria-modal="false" aria-labelledby="docs-chat-title">
<header class="docs-chat-head"><div><p>Assistant</p><h2 id="docs-chat-title">Ask OpenClaw</h2></div><div class="docs-chat-actions"><button class="docs-chat-icon docs-chat-maximize" type="button" data-chat-maximize aria-label="Maximize docs assistant" aria-pressed="false">${icon("maximize-2")}</button><button class="docs-chat-icon docs-chat-copy" type="button" data-chat-copy aria-label="Copy conversation">${icon("copy")}</button><button class="docs-chat-icon docs-chat-retry" type="button" data-chat-retry aria-label="Reload last answer" disabled>${icon("refresh-cw")}</button><button class="docs-chat-icon docs-chat-clear" type="button" data-chat-clear aria-label="Clear conversation" hidden>${icon("trash")}</button><button class="docs-chat-icon docs-chat-close" type="button" data-chat-close aria-label="Close docs assistant">x</button></div></header>
<div class="docs-chat-auth" data-chat-auth hidden></div>
<div class="docs-chat-log" data-chat-log aria-live="polite">
<div class="docs-chat-message assistant"><p>Ask about install, channels, gateway config, or plugin APIs.</p></div>
</div>
<form class="docs-chat-form" data-chat-form><textarea data-chat-input rows="2" maxlength="2000" placeholder="Ask a question..."></textarea><button type="submit" data-chat-submit aria-label="Send">${icon("send")}</button></form>
</div>
</section>`;
}

function writeRedirects() {
  for (const redirect of config.redirects ?? []) {
    const source = cleanPath(redirect.source);
    const dest = cleanPath(redirect.destination);
    writeRedirectFile(source, publicPath(dest));
    for (const prefix of new Set([basePath, legacyBasePath].filter(Boolean))) {
      writeRedirectFile(`${prefix}${source}`, publicPath(dest));
    }
  }
}

function writeRedirectFile(source, dest) {
  const target = path.join(outDir, source.replace(/^\//, ""), "index.html");
  if (fs.existsSync(target)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, redirectHtml(dest), "utf8");
}

function redirectHtml(dest) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${escapeAttr(dest)}"><link rel="canonical" href="${escapeAttr(dest)}"><title>Redirecting - ${escapeHtml(config.name)}</title><script>location.replace(${JSON.stringify(dest)})</script></head><body><a href="${escapeAttr(dest)}">Redirecting</a></body></html>`;
}

function stripMdxForLlms(input) {
  return input
    .replace(/^import\s+.+?;?\s*$/gm, "")
    .replace(/<([A-Z][A-Za-z0-9_.-]*)([^>]*)\/>/g, (_, name, attrs) => componentLabel(name, attrs))
    .replace(/<([A-Z][A-Za-z0-9_.-]*)([^>]*)>/g, (_, name, attrs) => componentLabel(name, attrs))
    .replace(/<\/[A-Z][A-Za-z0-9_.-]*>/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

function componentLabel(name, attrs) {
  const parsed = Object.fromEntries([...String(attrs).matchAll(/([A-Za-z0-9_-]+)=(?:"([^"]*)"|'([^']*)')/g)].map((match) => [match[1], match[2] ?? match[3] ?? ""]));
  const label = parsed.title ?? parsed.name ?? parsed.href ?? "";
  return label ? `\n${label}\n` : `\n${name}\n`;
}

function expandSnippets(input, sourceFile, seen = new Set()) {
  return input.replace(/<Snippet\b([^>]*)\/>/g, (_, rawAttrs) => {
    const attrs = parseSimpleAttrs(rawAttrs);
    const ref = attrs.file ?? attrs.src;
    if (!ref) return "";
    const target = path.resolve(path.dirname(sourceFile), ref);
    if (!target.startsWith(root) || seen.has(target) || !fs.existsSync(target)) return "";
    const nextSeen = new Set(seen);
    nextSeen.add(target);
    const parsed = matter(fs.readFileSync(target, "utf8"));
    return `\n${expandSnippets(parsed.content, target, nextSeen).trim()}\n`;
  });
}

function parseSimpleAttrs(rawAttrs) {
  return Object.fromEntries([...String(rawAttrs).matchAll(/([A-Za-z0-9_-]+)=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}|([^\s>]+))/g)]
    .map((match) => [match[1], match[2] ?? match[3] ?? match[4] ?? match[5] ?? ""]));
}

async function renderPageOgCards() {
  if (!rsvgAvailable) {
    console.warn("rsvg-convert unavailable; skipping per-page OG cards (using base og-card.png)");
    return;
  }
  const enNav = navByLocale.get("en") ?? [];
  const navSlugs = collectNavSlugs(enNav);
  const ogDir = path.join(outDir, "og");
  const targets = pages.filter((page) =>
    page.locale === "en" && page.slug !== "index" && navSlugs.has(page.slug)
  );
  const start = Date.now();
  const concurrency = Math.max(2, Math.min(8, Number(process.env.DOCS_SITE_OG_CONCURRENCY) || 6));
  let cursor = 0;
  let count = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < targets.length) {
      const page = targets[cursor++];
      const kicker = groupForPage(enNav, page.slug) ?? activeTabTitle(enNav, page.slug) ?? config.name;
      const svg = renderPageOgSvg({ title: page.title, kicker, summary: page.summary });
      const outFile = path.join(ogDir, `${page.slug}.png`);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      try {
        const child = execFile("rsvg-convert", ["-w", "1200", "-h", "630", "-o", outFile]);
        child.stdin.end(svg);
        await new Promise((resolve, reject) => {
          child.on("error", reject);
          child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`rsvg-convert exit ${code}`)));
        });
        renderedPageOgCards.add(page.slug);
        count++;
      } catch (err) {
        console.warn(`og card render failed for ${page.slug}: ${err.message}`);
      }
    }
  }));
  console.log(`rendered ${count}/${targets.length} per-page og cards in ${Date.now() - start}ms`);
}

function collectNavSlugs(nav) {
  const slugs = new Set();
  for (const tab of nav) {
    for (const group of tab.groups ?? []) {
      for (const entry of group.pages ?? []) {
        if (entry.group) for (const sub of entry.pages ?? []) slugs.add(sub.slug);
        else if (entry.slug) slugs.add(entry.slug);
      }
    }
  }
  return slugs;
}

function checkRsvg() {
  try {
    execFileSync("rsvg-convert", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function writeStaticAssets() {
  const assetsDir = path.join(outDir, "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.writeFileSync(path.join(assetsDir, "docs-site.css"), shellCss, "utf8");
  fs.writeFileSync(path.join(assetsDir, "docs-site.js"), shellJs, "utf8");
  const mermaidDist = path.join(root, "node_modules", "mermaid", "dist");
  const mermaidEntry = path.join(mermaidDist, "mermaid.esm.min.mjs");
  if (fs.existsSync(mermaidEntry)) {
    fs.copyFileSync(mermaidEntry, path.join(assetsDir, "mermaid.esm.min.mjs"));
    copyDir(path.join(mermaidDist, "chunks", "mermaid.esm.min"), path.join(assetsDir, "chunks", "mermaid.esm.min"), {
      filter: (source) => !source.endsWith(".map"),
    });
  }
  fs.writeFileSync(path.join(outDir, ".nojekyll"), "", "utf8");
  for (const file of ["og-card.png", "og-card.svg"]) {
    const source = path.join(siteAssetsDir, file);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(outDir, file));
  }
  if (process.env.DOCS_SITE_CNAME) {
    fs.writeFileSync(path.join(outDir, "CNAME"), `${process.env.DOCS_SITE_CNAME}\n`, "utf8");
  }
}

function copyPublicFiles() {
  copyDir(path.join(docsDir, "assets"), path.join(outDir, "assets"));
  for (const entry of fs.readdirSync(docsDir, { withFileTypes: true })) {
    if (entry.isFile() && !ignoredDocFiles.has(entry.name) && !/\.(md|mdx|json)$/.test(entry.name)) {
      fs.copyFileSync(path.join(docsDir, entry.name), path.join(outDir, entry.name));
    }
  }
}

function copyDir(source, dest, options = {}) {
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, dest, { recursive: true, filter: options.filter });
}

function activeTabTitle(nav, slug) {
  return nav.find((tab) => flattenNav([tab]).some((page) => page.slug === slug))?.title ?? nav[0]?.title ?? "";
}

function groupForPage(nav, slug) {
  for (const tab of nav) {
    for (const group of tab.groups) {
      if (group.pages.some((entry) => entry.group ? entry.pages.some((page) => page.slug === slug) : entry.slug === slug)) {
        return group.title;
      }
    }
  }
}

function flattenNav(nav) {
  return nav.flatMap((tab) => tab.groups.flatMap((group) => group.pages.flatMap((entry) => entry.group ? entry.pages : [entry])));
}

function firstPage(tab) {
  for (const group of tab.groups) {
    for (const entry of group.pages) return entry.group ? entry.pages[0] : entry;
  }
  return pages[0];
}

function localeUrlForSlug(locale, slug) {
  return pageByKey.has(pageKey(locale, slug)) ? pageUrl(pageByKey.get(pageKey(locale, slug))) : publicPath(locale === "en" ? "/" : `/${locale}/`);
}

function pageUrl(page) {
  return publicPath(pageRoute(page));
}

function pageRoute(page) {
  const prefix = page.locale === "en" ? "" : `/${page.locale}`;
  return page.slug === "index" ? (prefix || "/") : `${prefix}/${page.slug}`;
}

function pageMarkdownRoute(page) {
  const prefix = page.locale === "en" ? "" : `/${page.locale}`;
  return page.slug === "index" ? `${prefix || ""}/index.md` : `${prefix}/${page.slug}.md`;
}

function rewriteInternalUrls(html, locale) {
  return html.replace(/\b(href|src)="\/([^"#?]*)([#?][^"]*)?"/g, (match, attr, target, suffix = "") => {
    if (attr === "src") return `${attr}="${publicPath(`/${target}`)}${suffix}"`;
    if (!target || target.startsWith("assets/") || target.startsWith("pagefind/")) {
      return `${attr}="${publicPath(`/${target}`)}${suffix}"`;
    }
    const segments = target.replace(/\/$/, "").split("/");
    const maybeLocale = segments[0];
    if (pageByKey.has(pageKey(maybeLocale, normalizeSlug(segments.slice(1).join("/") || "index")))) {
      return `${attr}="${pageUrl(pageByKey.get(pageKey(maybeLocale, normalizeSlug(segments.slice(1).join("/") || "index"))))}${suffix}"`;
    }
    const slug = normalizeSlug(target.replace(/\/$/, ""));
    const page = pageByKey.get(pageKey(locale, slug)) ?? pageByKey.get(pageKey("en", slug));
    return page ? `${attr}="${pageUrl(page)}${suffix}"` : `${attr}="${publicPath(`/${target}`)}${suffix}"`;
  });
}

function pageKey(locale, slug) {
  return `${locale}:${slug}`;
}

function fileSlug(rel) {
  return normalizeSlug(rel.replace(/\.(md|mdx)$/, ""));
}

function normalizeSlug(value) {
  return value.replace(/\/index$/, "") || "index";
}

function cleanPath(value) {
  const [pathname, hash = ""] = String(value).split("#");
  const cleaned = pathname.replace(/\/$/, "") || "/";
  return hash ? `${cleaned}#${hash}` : cleaned;
}

function publicPath(value) {
  if (!basePath) return value;
  if (value === "/") return `${basePath}/`;
  return `${basePath}${value.startsWith("/") ? value : `/${value}`}`;
}

function normalizeBasePath(value) {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function htmlLang(locale) {
  return locale === "zh-CN" ? "zh-CN" : locale === "zh-TW" ? "zh-TW" : locale;
}

function firstHeading(markdown) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/<[^>]+>/g, "").trim();
}

function titleize(value) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value) {
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (lower === "amp") return "&";
    if (lower === "lt") return "<";
    if (lower === "gt") return ">";
    if (lower === "quot") return "\"";
    if (lower === "apos") return "'";
    const code = lower.startsWith("#x") ? Number.parseInt(lower.slice(2), 16) : Number.parseInt(lower.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : match;
  });
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
