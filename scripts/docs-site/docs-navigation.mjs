import { homeStringsForLocale, escapeUiText } from "./home-strings.mjs";

export function docsQuickNav(slug, icon, locale = "en") {
  const [heading, overview, quickstart, installation, onboarding, configuration, documentation] = homeStringsForLocale(locale).navigation;
  const links = [[overview, "index", "book-open"], [quickstart, "start/getting-started", "terminal"], [installation, "install", "download"], [onboarding, "start/wizard", "list-checks"], [configuration, "gateway/configuration", "settings"]];
  return `<nav class="docs-quick-nav" aria-label="${escapeUiText(heading)}"><h2>${escapeUiText(heading)}</h2>${links.map(([label, path, glyph]) => `<a class="nav-link${slug === path ? " active" : ""}" href="/${path}"${slug === path ? ' aria-current="page"' : ""}>${icon(glyph)}<span>${escapeUiText(label)}</span></a>`).join("")}</nav><p class="docs-nav-label">${escapeUiText(documentation)}</p>`;
}
