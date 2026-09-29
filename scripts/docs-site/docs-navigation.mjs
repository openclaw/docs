export function docsQuickNav(slug, icon) {
  const links = [["Overview", "index", "book-open"], ["Quickstart", "start/getting-started", "terminal"], ["Installation", "install", "download"], ["Onboarding", "start/wizard", "list-checks"], ["Configuration", "gateway/configuration", "settings"]];
  return `<nav class="docs-quick-nav" aria-label="Start here"><h2>Get started</h2>${links.map(([label, path, glyph]) => `<a class="nav-link${slug === path ? " active" : ""}" href="/${path}"${slug === path ? ' aria-current="page"' : ""}>${icon(glyph)}<span>${label}</span></a>`).join("")}</nav><p class="docs-nav-label">Documentation</p>`;
}
