#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { ignoredDocDirs, ignoredDocFiles, localeLabels, mintlifyLocaleToDir, rtlLocales } from "./config.mjs";
import { siteCss, siteJs } from "./assets.mjs";
import { createMarkdownRenderer, renderMdxish } from "./mdx-ish.mjs";

const root = process.cwd();
const docsDir = path.join(root, "docs");
const outDir = path.join(root, "dist", "docs-site");
const config = JSON.parse(fs.readFileSync(path.join(docsDir, "docs.json"), "utf8"));
const md = createMarkdownRenderer();
const basePath = normalizeBasePath(process.env.DOCS_SITE_BASE_PATH ?? "");

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const locales = buildLocales(config);
const pages = collectPages(locales);
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
for (const page of pages) writePage(page);
writeRedirects();
writeStaticAssets();
console.log(`built ${pages.length} pages in ${path.relative(root, outDir)}`);

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
        title,
        summary: parsed.data.summary ?? "",
        readWhen: parsed.data.read_when ?? [],
        body: parsed.content
      });
    }
  }
  return result;
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
  const html = rewriteInternalUrls(renderMdxish(page.body, md), page.locale);
  const toc = tableOfContents(html);
  const outPath = path.join(outDir, pageRoute(page).replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, layout({ page, nav, activeTab, html, toc, prev, next }), "utf8");
}

function layout({ page, nav, activeTab, html, toc, prev, next }) {
  const lang = htmlLang(page.locale);
  const dir = rtlLocales.has(page.locale) ? "rtl" : "ltr";
  const title = `${page.title} - ${config.name}`;
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escapeAttr(page.summary || config.description || "")}">
<title>${escapeHtml(title)}</title>
<link rel="icon" href="${publicPath("/assets/pixel-lobster.svg")}">
<link rel="stylesheet" href="${publicPath("/assets/docs-site.css")}">
<script>window.OPENCLAW_DOCS_BASE=${JSON.stringify(basePath)};document.documentElement.dataset.theme=localStorage.getItem("theme")||"dark"</script>
</head>
<body>
${siteHeader(page, nav, activeTab)}
<div class="doc-shell">
${sidebar(page, nav, activeTab)}
<main class="main" id="main">
<article class="article">
<header class="article-header">
<p class="article-kicker">${escapeHtml(groupForPage(nav, page.slug) ?? activeTab)}</p>
<h1>${escapeHtml(page.title)}</h1>
</header>
<div class="doc" data-pagefind-body>${html}</div>
${pager(prev, next)}
</article>
${tocHtml(toc)}
</main>
</div>
${searchModal()}
<script type="module" src="${publicPath("/assets/docs-site.js")}"></script>
</body>
</html>`;
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
<button class="search-button" type="button" data-search-open>Search... <span>⌘K</span></button>
<nav class="header-links">${topLink("GitHub", "https://github.com/openclaw/openclaw")}${topLink("Releases", "https://github.com/openclaw/openclaw/releases")}${topLink("Discord", "https://discord.com/invite/clawd")}<button type="button" data-theme-toggle aria-label="Toggle theme">◐</button></nav>
<button class="nav-toggle" type="button" data-nav-toggle>Menu</button>
</div>
<nav class="tabs">${tabs}</nav>
</header>`;
}

function sidebar(page, nav, activeTab) {
  const groups = (nav.find((tab) => tab.title === activeTab) ?? nav[0])?.groups ?? [];
  return `<aside class="sidebar">
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
  return `<div class="language-picker" data-language-picker><button class="language-trigger" type="button" data-language-trigger aria-haspopup="listbox" aria-expanded="false"><span class="locale-flag" aria-hidden="true">${escapeHtml(currentFlag)}</span><span class="language-current">${escapeHtml(currentLabel)}</span><span class="language-chevron" aria-hidden="true">⌃</span></button><div class="language-menu" role="listbox" aria-label="Language">${options}</div></div>`;
}

function localeFlag(code) {
  return localeFlags[code] ?? "🌐";
}

function localeDisplayName(code) {
  return localePickerLabels[code] ?? localeLabels[code] ?? code;
}

function topLink(label, href) {
  return `<a href="${escapeAttr(href)}">${escapeHtml(label)}</a>`;
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

function searchModal() {
  return `<div class="search-modal"><div class="search-panel"><div class="search-head"><input data-search-input placeholder="Search docs"><button data-search-close>Close</button></div><div class="search-results" data-search-results></div></div></div>`;
}

function writeRedirects() {
  for (const redirect of config.redirects ?? []) {
    const source = cleanPath(redirect.source);
    const dest = cleanPath(redirect.destination);
    writeRedirectFile(source, publicPath(dest));
    if (basePath) writeRedirectFile(`${basePath}${source}`, publicPath(dest));
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

function writeStaticAssets() {
  const assetsDir = path.join(outDir, "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.writeFileSync(path.join(assetsDir, "docs-site.css"), siteCss(), "utf8");
  fs.writeFileSync(path.join(assetsDir, "docs-site.js"), siteJs(), "utf8");
  fs.writeFileSync(path.join(outDir, ".nojekyll"), "", "utf8");
  if (process.env.DOCS_SITE_CNAME) {
    fs.writeFileSync(path.join(outDir, "CNAME"), process.env.DOCS_SITE_CNAME, "utf8");
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

function copyDir(source, dest) {
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, dest, { recursive: true });
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
  return page.slug === "index" ? (prefix ? `${prefix}/` : "/") : `${prefix}/${page.slug}/`;
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
