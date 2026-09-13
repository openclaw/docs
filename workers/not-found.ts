export function docsNotFoundHtml(pathname: string): string {
  const missingPath = escapeHtml(pathname);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Page not found - OpenClaw Docs</title>
<style>
:root {
  color-scheme: dark;
  --oc-bg-page: #101012;
  --oc-bg-surface: #19191c;
  --oc-bg-elevated: #202024;
  --oc-text-primary: #ededed;
  --oc-text-secondary: #bcbcc4;
  --oc-text-muted: #9a9aa2;
  --oc-text-on-accent: #101012;
  --oc-accent-primary: #f5654a;
  --oc-accent-primary-hover: #e05540;
  --oc-accent-secondary: #4fc8ae;
  --oc-border-subtle: rgb(154 154 162 / .18);
  --oc-surface-card: rgb(25 25 28 / .72);
  --oc-surface-card-strong: rgb(25 25 28 / .9);
  --oc-surface-interactive-hover: rgb(237 237 237 / .16);
  --oc-focus-ring: rgb(79 200 174 / .72);
  --oc-space-2: .5rem;
  --oc-space-3: .75rem;
  --oc-space-4: 1rem;
  --oc-space-5: 1.5rem;
  --oc-space-6: 2rem;
  --oc-space-7: 3rem;
  --oc-space-8: 4rem;
  --oc-font-size-sm: .8125rem;
  --oc-font-size-lg: 1.0625rem;
  --oc-radius-surface: 0;
  --oc-radius-control: 0;
  --oc-shadow-lg: 0 24px 48px -12px rgb(0 0 0 / .42);
  --oc-duration-fast: 160ms;
  --oc-ease-out: cubic-bezier(.23, 1, .32, 1);
  --oc-font-display: "Switzer", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --oc-font-body: "Switzer", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --oc-font-mono: ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: light) {
  :root {
    color-scheme: light;
    --oc-bg-page: #f6f5f3;
    --oc-bg-surface: #eceae6;
    --oc-bg-elevated: #fff;
    --oc-text-primary: #17171a;
    --oc-text-secondary: #46464e;
    --oc-text-muted: #63636c;
    --oc-text-on-accent: #fff;
    --oc-accent-primary: #d84a31;
    --oc-accent-primary-hover: #c24028;
    --oc-accent-secondary: #14806e;
    --oc-border-subtle: rgb(23 23 26 / .14);
    --oc-surface-card: rgb(255 255 255 / .8);
    --oc-surface-card-strong: rgb(255 255 255 / .95);
    --oc-surface-interactive-hover: rgb(23 23 26 / .14);
    --oc-focus-ring: rgb(20 128 110 / .58);
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--oc-space-5) 0;
  background: var(--oc-bg-page);
  color: var(--oc-text-primary);
  font: 16px/1.55 var(--oc-font-body);
}
main {
  width: min(960px, calc(100vw - 32px));
  display: grid;
  gap: var(--oc-space-5);
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, .8fr);
  align-items: stretch;
}
.hero, .panel {
  border: 1px solid var(--oc-border-subtle);
  border-radius: var(--oc-radius-surface);
  background: var(--oc-surface-card);
  box-shadow: var(--oc-shadow-lg);
}
.hero {
  padding: clamp(var(--oc-space-6), 5vw, var(--oc-space-8, 4rem));
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: linear-gradient(90deg, var(--oc-accent-primary), var(--oc-accent-secondary));
}
.brand {
  display: inline-flex;
  gap: var(--oc-space-3);
  align-items: center;
  color: var(--oc-text-muted);
  font-size: var(--oc-font-size-sm);
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}
.brand img { width: 32px; height: 32px; }
h1 {
  margin: 42px 0 12px;
  max-width: 12ch;
  font-size: 7rem;
  line-height: .86;
  letter-spacing: 0;
}
p { margin: 0; color: var(--oc-text-muted); max-width: 56ch; }
.path {
  margin-top: var(--oc-space-5);
  display: inline-flex;
  max-width: 100%;
  padding: var(--oc-space-2) var(--oc-space-3);
  border: 1px solid var(--oc-border-subtle);
  background: var(--oc-bg-page);
  color: var(--oc-text-secondary);
  font: var(--oc-font-size-sm)/1.4 var(--oc-font-mono);
  overflow-wrap: anywhere;
}
.actions {
  margin-top: var(--oc-space-5);
  display: flex;
  flex-wrap: wrap;
  gap: var(--oc-space-2);
}
a {
  color: inherit;
  text-decoration: none;
}
.button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--oc-space-2);
  padding: 0 var(--oc-space-4);
  border: 1px solid var(--oc-border-subtle);
  border-radius: var(--oc-radius-control);
  background: var(--oc-surface-card-strong);
  font-weight: 700;
  transition:
    background var(--oc-duration-fast) var(--oc-ease-out),
    border-color var(--oc-duration-fast) var(--oc-ease-out),
    color var(--oc-duration-fast) var(--oc-ease-out);
}
.button.primary {
  border-color: var(--oc-accent-primary);
  background: var(--oc-accent-primary);
  color: var(--oc-text-on-accent);
}
.button:hover {
  border-color: var(--oc-accent-primary);
  background: var(--oc-surface-interactive-hover);
}
.button.primary:hover {
  border-color: var(--oc-accent-primary-hover);
  background: var(--oc-accent-primary-hover);
}
.button:focus-visible {
  outline: 2px solid var(--oc-focus-ring);
  outline-offset: 3px;
}
.panel {
  padding: var(--oc-space-5);
  display: grid;
  align-content: center;
  gap: var(--oc-space-3);
}
.status {
  display: grid;
  gap: var(--oc-space-2);
  padding: var(--oc-space-4);
  border: 1px solid var(--oc-border-subtle);
  background: var(--oc-bg-page);
  font: var(--oc-font-size-sm)/1.6 var(--oc-font-mono);
}
.status div {
  display: flex;
  justify-content: space-between;
  gap: var(--oc-space-4);
}
.status span:first-child { color: var(--oc-text-muted); }
.status span:last-child { color: var(--oc-accent-secondary); }
.links {
  display: grid;
  gap: var(--oc-space-2);
}
.links a {
  display: flex;
  justify-content: space-between;
  gap: var(--oc-space-4);
  padding: var(--oc-space-3) 0;
  border-bottom: 1px solid var(--oc-border-subtle);
  color: var(--oc-text-primary);
}
.links a:hover { color: var(--oc-accent-secondary); }
@media (max-width: 760px) {
  body { place-items: start center; padding: var(--oc-space-4) 0; }
  main { grid-template-columns: 1fr; }
  h1 { max-width: none; font-size: 4rem; }
}
</style>
</head>
<body>
<main>
  <section class="hero" aria-labelledby="missing-title">
    <a class="brand" href="/"><img src="/assets/pixel-lobster.svg" alt="">OpenClaw Docs</a>
    <h1 id="missing-title">Page lost in transit.</h1>
    <p>The docs router is online, but this exact page is not in the current published bundle.</p>
    <div class="path">${missingPath}</div>
    <div class="actions">
      <a class="button primary" href="/">Open docs home</a>
      <a class="button" href="/providers">Browse providers</a>
      <a class="button" href="/help/faq">Get help</a>
    </div>
  </section>
  <aside class="panel" aria-label="Useful routes">
    <div class="status">
      <div><span>status</span><span>404</span></div>
      <div><span>origin</span><span>cloudflare-r2</span></div>
      <div><span>next</span><span>pick a route</span></div>
    </div>
    <nav class="links" aria-label="Popular docs sections">
      <a href="/install"><span>Install</span><span>/install</span></a>
      <a href="/concepts/model-providers"><span>Model providers</span><span>/concepts/model-providers</span></a>
      <a href="/plugins"><span>Plugins</span><span>/plugins</span></a>
      <a href="/tools"><span>Tools</span><span>/tools</span></a>
    </nav>
  </aside>
</main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
