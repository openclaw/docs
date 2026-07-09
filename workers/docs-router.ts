interface Env {
  DOCS_BUCKET?: R2Bucket;
}

type SearchEntry = {
  title: string;
  url: string;
  snippet?: string;
  search: string;
};

type SearchIndex = {
  entries: SearchEntry[];
  expiresAt: number;
};

type SearchResult = {
  title: string;
  link: string;
  snippet?: string;
  score: number;
};

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
};

const markdownAcceptTypes = new Set(["text/markdown", "text/x-markdown", "application/markdown"]);
const canonicalHost = "docs.openclaw.ai";
const legacyHosts = new Set(["documentation.openclaw.ai"]);
const mintlifyRedirectHosts = new Set(["mintlify.openclaw.ai"]);
const mintlifyBackupHost = "docs2.openclaw.ai";
const searchIndexKey = "docs-search.json";
const searchIndexTtlMs = 60_000;
const maxSearchQueryLength = 180;
const maxSearchResults = 12;
let searchIndexCache: SearchIndex | undefined;

// -- Devex reverse-proxy -----------------------------------------------------
// Pilot config: agent traffic (matched by UA + allowlisted IPs) on
// non-API/non-asset routes is served from the Devex origin, which exposes
// docs as fragments via /q/ + /a/. Human traffic, API routes (/mcp,
// /api/search, /llms.txt, etc.) and non-agent traffic continue to hit R2
// unchanged. To disable, comment out the devexShouldRoute check inside
// the fetch handler.

const DEVEX_ORIGIN = "https://sink.trydevex.com/prod/openclaw";

// Only these client IPs get their agent traffic routed. Reads
// `CF-Connecting-IP`, so this is the true source IP from Cloudflare's edge.
const DEVEX_ALLOWLISTED_IPS = new Set([
  "98.42.87.116",
]);

const DEVEX_AGENT_UA =
  /claude-code|cursor|cline|codex|chatgpt-user|gptbot|anthropic-ai|continue\.dev|^python-requests|^curl\/|^go-http-client|node-fetch|undici/i;

// API surfaces that already carry query intent through their own protocol
// (or are consumed one-off as manifests). Never intercept these.
const DEVEX_API_ROUTES = new Set([
  "/mcp",
  "/api/search",
  "/mcp.search_open_claw",
  "/llms.txt",
  "/.well-known/llms.txt",
  "/llms-full.txt",
  "/.well-known/llms-full.txt",
]);

// Site metadata files: consumed by crawlers/tooling, not docs content.
// Intercepting these would break crawler behaviour.
const DEVEX_METADATA_PATHS = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/humans.txt",
  "/favicon.ico",
]);

// Static asset extensions: agents fetch these as part of rendering pages,
// not as content to consume. Extension matched against the last segment.
const DEVEX_STATIC_EXTENSIONS = new Set([
  ".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".ico",
  ".woff", ".woff2", ".ttf", ".otf", ".map", ".webp", ".mp4", ".webm",
]);

const DEVEX_SKIP_RESPONSE_HEADERS = new Set([
  "content-length",
  "content-encoding",
  "transfer-encoding",
]);

// Upstream timeout budget. If Devex takes longer than this we abort and
// fall through to R2 — better a normal docs page than a hung request.
const DEVEX_UPSTREAM_TIMEOUT_MS = 2500;

function devexShouldRoute(request: Request, url: URL): boolean {
  const ua = request.headers.get("User-Agent") ?? "";
  const isAgent = DEVEX_AGENT_UA.test(ua) && !/mozilla\//i.test(ua);
  if (!isAgent) return false;

  if (DEVEX_API_ROUTES.has(url.pathname)) return false;
  if (DEVEX_METADATA_PATHS.has(url.pathname)) return false;

  // Static asset extension check — cheap tail-index lookup.
  const dot = url.pathname.lastIndexOf(".");
  if (dot >= 0) {
    const ext = url.pathname.slice(dot).toLowerCase();
    if (DEVEX_STATIC_EXTENSIONS.has(ext)) return false;
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  return DEVEX_ALLOWLISTED_IPS.has(ip);
}

async function devexReverseProxy(
  request: Request,
  url: URL,
): Promise<Response> {
  const target = `${DEVEX_ORIGIN}${url.pathname}${url.search}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEVEX_UPSTREAM_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: {
        "User-Agent": request.headers.get("User-Agent") ?? "",
        "Accept": request.headers.get("Accept") ?? "*/*",
      },
      signal: controller.signal,
    });
  } catch {
    // Timeout, network error, or upstream refusal — all fall through to R2.
    return new Response("__DEVEX_FALLBACK__", { status: 599 });
  } finally {
    clearTimeout(timer);
  }

  const headers = new Headers();
  for (const [k, v] of upstream.headers) {
    if (!DEVEX_SKIP_RESPONSE_HEADERS.has(k.toLowerCase())) {
      headers.set(k, v);
    }
  }
  headers.set("X-OpenClaw-Docs-Origin", "devex-proxy");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }

    if (legacyHosts.has(url.hostname)) {
      url.hostname = canonicalHost;
      return Response.redirect(url.toString(), 308);
    }

    if (mintlifyRedirectHosts.has(url.hostname)) {
      url.hostname = mintlifyBackupHost;
      return Response.redirect(url.toString(), 308);
    }

    if (devexShouldRoute(request, url)) {
      const proxied = await devexReverseProxy(request, url);
      if (proxied.status !== 599) return proxied;
      // 599 = Devex unreachable → fall through to existing R2 routing
    }

    if (url.pathname === "/api/search") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "GET, HEAD" },
        });
      }
      return searchResponse(env, request, url);
    }
    if (url.pathname === "/mcp" && request.method !== "GET" && request.method !== "HEAD") {
      return mcpResponse(env, request);
    }
    if (url.pathname === "/mcp.search_open_claw") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "GET, HEAD" },
        });
      }
      return legacyMcpToolResponse(env, request, url);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    if (url.pathname.endsWith(".md")) {
      return markdownResponse(env, ctx, request, url.pathname);
    }

    if (prefersMarkdown(request)) {
      const markdownPath = markdownPathFor(url.pathname);
      if (markdownPath) {
        const response = await markdownResponse(env, ctx, request, markdownPath);
        if (response.status !== 404) return response;
      }
    }

    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
      return Response.redirect(url.toString(), 308);
    }

    return assetResponse(env, ctx, request, r2AssetPath(url.pathname));
  },
};

async function mcpResponse(env: Env, request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed\n", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  const payload = await request.json().catch(() => undefined);
  const requests = Array.isArray(payload) ? payload : [payload];
  const responses = [];
  for (const item of requests) {
    const response = await handleMcpRequest(env, item);
    if (response) responses.push(response);
  }
  if (responses.length === 0) {
    return new Response(null, { status: 202 });
  }
  return mcpJsonResponse(Array.isArray(payload) ? responses : responses[0]);
}

async function handleMcpRequest(env: Env, value: unknown): Promise<unknown | undefined> {
  if (!value || typeof value !== "object") {
    return mcpError(null, -32600, "Invalid Request");
  }
  const request = value as JsonRpcRequest;
  if (request.id === undefined) {
    return undefined;
  }
  switch (request.method) {
    case "initialize":
      return mcpResult(request.id, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "openclaw-docs",
          version: "1.0.0",
        },
      });
    case "ping":
      return mcpResult(request.id, {});
    case "tools/list":
      return mcpResult(request.id, {
        tools: [
          {
            name: "search_open_claw",
            description: "Search the OpenClaw documentation.",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query.",
                },
              },
              required: ["query"],
            },
          },
        ],
      });
    case "tools/call":
      return handleMcpToolCall(env, request);
    default:
      return mcpError(request.id, -32601, "Method not found");
  }
}

async function handleMcpToolCall(env: Env, request: JsonRpcRequest): Promise<unknown> {
  const params = request.params && typeof request.params === "object" ? request.params as Record<string, unknown> : {};
  const name = params.name;
  if (name !== "search_open_claw" && name !== "SearchOpenClaw") {
    return mcpError(request.id ?? null, -32602, "Tool not found");
  }
  const args = params.arguments && typeof params.arguments === "object" ? params.arguments as Record<string, unknown> : {};
  const query = typeof args.query === "string" ? args.query.trim().slice(0, maxSearchQueryLength) : "";
  if (!query) {
    return mcpError(request.id ?? null, -32602, "Missing query");
  }
  const results = await searchDocs(env, query);
  return mcpResult(request.id ?? null, {
    content: [
      {
        type: "text",
        text: legacySearchText(results),
      },
    ],
  });
}

async function searchResponse(env: Env, request: Request, url: URL): Promise<Response> {
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, maxSearchQueryLength);
  if (!query) {
    return jsonResponse({ query, results: [] }, request);
  }

  const results = await searchDocs(env, query);
  return jsonResponse({ query, results }, request);
}

async function legacyMcpToolResponse(env: Env, request: Request, url: URL): Promise<Response> {
  const query = (url.searchParams.get("q") ?? url.searchParams.get("query") ?? "").trim().slice(0, maxSearchQueryLength);
  const results = query ? await searchDocs(env, query) : [];
  return new Response(request.method === "HEAD" ? null : legacySearchText(results), {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=60",
      "Content-Type": "text/plain; charset=utf-8",
      "X-OpenClaw-Docs-Origin": "cloudflare-r2",
    },
  });
}

async function searchDocs(env: Env, query: string): Promise<Omit<SearchResult, "score">[]> {
  const entries = await loadSearchEntries(env);
  const terms = tokenize(query);
  return entries
    .map((entry) => scoreSearchEntry(entry, terms))
    .filter((result): result is SearchResult => result !== undefined)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, maxSearchResults)
    .map(({ score: _score, ...result }) => result);
}

async function loadSearchEntries(env: Env): Promise<SearchEntry[]> {
  const now = Date.now();
  if (searchIndexCache && searchIndexCache.expiresAt > now) {
    return searchIndexCache.entries;
  }

  const response = await r2Fetch(env, "GET", searchIndexKey);
  if (!response.ok) {
    throw new Error(`docs search index unavailable: ${response.status}`);
  }
  const payload = await response.json() as { entries?: SearchEntry[] };
  const entries = Array.isArray(payload.entries) ? payload.entries.filter(isSearchEntry) : [];
  searchIndexCache = {
    entries,
    expiresAt: now + searchIndexTtlMs,
  };
  return entries;
}

function isSearchEntry(value: unknown): value is SearchEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.title === "string" && typeof entry.url === "string" && typeof entry.search === "string";
}

function scoreSearchEntry(entry: SearchEntry, terms: string[]): SearchResult | undefined {
  const title = entry.title.toLowerCase();
  const path = entry.url.toLowerCase();
  const search = entry.search.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (title === term) score += 40;
    if (title.includes(term)) score += 16;
    if (path.includes(term)) score += 10;
    const occurrences = countOccurrences(search, term);
    if (occurrences === 0 && !title.includes(term) && !path.includes(term)) {
      return undefined;
    }
    score += Math.min(occurrences, 8);
  }
  if (score === 0) return undefined;
  return {
    title: entry.title,
    link: `https://${canonicalHost}${entry.url}`,
    snippet: snippetFor(entry, terms),
    score,
  };
}

function snippetFor(entry: SearchEntry, terms: string[]): string | undefined {
  if (entry.snippet && terms.some((term) => entry.snippet?.toLowerCase().includes(term))) {
    return entry.snippet;
  }
  const haystack = entry.search;
  const lower = haystack.toLowerCase();
  const firstHit = terms.map((term) => lower.indexOf(term)).filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, firstHit - 80);
  const snippet = haystack.slice(start, start + 220).replace(/\s+/g, " ").trim();
  return snippet || undefined;
}

function tokenize(value: string): string[] {
  return [...new Set(value.toLowerCase().split(/[^a-z0-9]+/u).filter((part) => part.length >= 2))].slice(0, 8);
}

function countOccurrences(value: string, needle: string): number {
  let count = 0;
  let index = value.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = value.indexOf(needle, index + needle.length);
  }
  return count;
}

function jsonResponse(value: unknown, request: Request, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=60");
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-OpenClaw-Docs-Origin", "cloudflare-r2");
  return new Response(request.method === "HEAD" ? null : `${JSON.stringify(value)}\n`, {
    ...init,
    headers,
  });
}

function mcpJsonResponse(value: unknown): Response {
  return new Response(`${JSON.stringify(value)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-OpenClaw-Docs-Origin": "cloudflare-r2",
    },
  });
}

function mcpResult(id: string | number | null, result: unknown): unknown {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function mcpError(id: string | number | null, code: number, message: string): unknown {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
    },
  };
}

function legacySearchText(results: Omit<SearchResult, "score">[]): string {
  if (results.length === 0) {
    return "No results.";
  }
  return results
    .map((result) => {
      const lines = [`Title: ${result.title}`, `Link: ${result.link}`];
      if (result.snippet) lines.push(`Content: ${result.snippet}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function prefersMarkdown(request: Request): boolean {
  const accept = request.headers.get("Accept") ?? "";
  return accept
    .split(",")
    .map((entry) => entry.split(";")[0]?.trim().toLowerCase())
    .some((type) => markdownAcceptTypes.has(type));
}

function markdownPathFor(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return "/index.md";
  if (/\.[^/]+$/.test(clean)) return null;
  return `${clean}.md`;
}

function r2AssetPath(pathname: string): string {
  if (pathname === "/") return "/index.html";
  return pathname;
}

async function markdownResponse(env: Env, ctx: ExecutionContext, request: Request, pathname: string): Promise<Response> {
  const response = await assetResponse(env, ctx, request, pathname);
  const headers = new Headers(response.headers);
  if (response.ok) {
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    headers.set("Vary", appendVary(headers.get("Vary"), "Accept"));
  }
  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function assetResponse(env: Env, ctx: ExecutionContext, request: Request, pathname: string): Promise<Response> {
  const cache = caches.default;
  const cacheKey = cacheRequest(request, pathname);
  const cached = request.method === "GET" ? await cache.match(cacheKey) : undefined;
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("X-OpenClaw-Docs-Cache", "HIT");
    applyCacheHeaders(headers, pathname);
    applyMarkdownAlternateHeader(headers, pathname);
    return new Response(request.method === "HEAD" ? null : cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers,
    });
  }

  const key = r2ObjectKey(pathname);
  const response = await r2Fetch(env, request.method, key);
  if (response.status === 404) {
    return isHtmlPath(pathname) ? docsNotFoundResponse(request, pathname) : plainNotFoundResponse(request);
  }
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("X-OpenClaw-Docs-Origin", "cloudflare-r2");
  responseHeaders.set("X-OpenClaw-Docs-Cache", "MISS");
  responseHeaders.delete("Content-Length");
  if (response.ok) {
    applyCacheHeaders(responseHeaders, pathname);
    applyMarkdownAlternateHeader(responseHeaders, pathname);
  }
  const finalResponse = new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
  if (request.method === "GET" && finalResponse.ok) {
    const cacheHeaders = new Headers(finalResponse.headers);
    cacheHeaders.delete("Set-Cookie");
    const cacheResponse = new Response(finalResponse.clone().body, {
      status: finalResponse.status,
      statusText: finalResponse.statusText,
      headers: cacheHeaders,
    });
    ctx.waitUntil(cache.put(cacheKey, cacheResponse));
  }
  return finalResponse;
}

function docsNotFoundResponse(request: Request, pathname: string): Response {
  return new Response(request.method === "HEAD" ? null : docsNotFoundHtml(pathname), {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=60",
      "Content-Type": "text/html; charset=utf-8",
      "X-OpenClaw-Docs-Cache": "MISS",
      "X-OpenClaw-Docs-Origin": "cloudflare-r2",
    },
  });
}

function plainNotFoundResponse(request: Request): Response {
  return new Response(request.method === "HEAD" ? null : "Not found\n", {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=60",
      "Content-Type": "text/plain; charset=utf-8",
      "X-OpenClaw-Docs-Cache": "MISS",
      "X-OpenClaw-Docs-Origin": "cloudflare-r2",
    },
  });
}

function docsNotFoundHtml(pathname: string): string {
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
  --bg: #090b0f;
  --panel: #11151d;
  --panel-strong: #171d27;
  --text: #f7f2ea;
  --muted: #a9b2c0;
  --line: #273141;
  --accent: #ff5a36;
  --accent-2: #5fd4c8;
  --shadow: rgba(0, 0, 0, .38);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background:
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(145deg, #090b0f 0%, #10141d 52%, #161216 100%);
  background-size: 56px 56px, 56px 56px, auto;
  color: var(--text);
  font: 16px/1.55 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
main {
  width: min(960px, calc(100vw - 32px));
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, .8fr);
  align-items: stretch;
}
.hero, .panel {
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  box-shadow: 0 24px 80px var(--shadow);
}
.hero {
  padding: clamp(28px, 5vw, 56px);
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
}
.brand {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  color: var(--muted);
  font-size: 13px;
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
p { margin: 0; color: var(--muted); max-width: 56ch; }
.path {
  margin-top: 26px;
  display: inline-flex;
  max-width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  background: #0a0d12;
  color: #d9e0ea;
  font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  overflow-wrap: anywhere;
}
.actions {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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
  gap: 10px;
  padding: 0 16px;
  border: 1px solid var(--line);
  background: var(--panel-strong);
  font-weight: 700;
}
.button.primary {
  border-color: color-mix(in srgb, var(--accent) 60%, var(--line));
  background: var(--accent);
  color: #1d0903;
}
.button:hover { border-color: var(--accent-2); }
.panel {
  padding: 24px;
  display: grid;
  align-content: center;
  gap: 14px;
}
.status {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid var(--line);
  background: #0b0f15;
  font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.status div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}
.status span:first-child { color: var(--muted); }
.status span:last-child { color: var(--accent-2); }
.links {
  display: grid;
  gap: 8px;
}
.links a {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  color: #e9edf3;
}
.links a:hover { color: var(--accent-2); }
@media (max-width: 760px) {
  body { place-items: start center; padding: 18px 0; }
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

function r2ObjectKey(pathname: string): string {
  const key = pathname.replace(/^\/+/, "");
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

async function r2Fetch(env: Env, method: string, key: string): Promise<Response> {
  const bucket = env.DOCS_BUCKET;
  if (!bucket) {
    return new Response("DOCS_BUCKET binding is required\n", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const object = method === "HEAD" ? await bucket.head(key) : await bucket.get(key);
  if (!object) {
    return new Response(method === "HEAD" ? null : "Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (object.httpEtag) headers.set("ETag", object.httpEtag);
  if (object.size !== undefined) headers.set("Content-Length", String(object.size));
  for (const [name, value] of Object.entries(object.customMetadata ?? {})) {
    headers.set(`x-amz-meta-${name}`, value);
  }
  return new Response(method === "HEAD" ? null : (object as R2ObjectBody).body, {
    headers,
    status: 200,
  });
}

function cacheRequest(request: Request, pathname: string): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  if (isHtmlPath(pathname)) {
    url.searchParams.set("__openclaw_docs_cache_minute", String(Math.floor(Date.now() / 60_000)));
  }
  return new Request(url.toString(), {
    headers: request.headers,
    method: "GET",
  });
}

function applyCacheHeaders(headers: Headers, pathname: string): void {
  headers.set("Cache-Control", browserCacheControlFor(pathname));
  const cdnCacheControl = edgeCacheControlFor(pathname);
  headers.set("CDN-Cache-Control", cdnCacheControl);
  headers.set("Cloudflare-CDN-Cache-Control", cdnCacheControl);
}

function applyMarkdownAlternateHeader(headers: Headers, pathname: string): void {
  const markdownPath = markdownAlternatePathFor(pathname);
  if (!markdownPath) return;
  headers.set("Link", appendLink(headers.get("Link"), `<${markdownPath}>; rel="alternate"; type="text/markdown"`));
}

function markdownAlternatePathFor(pathname: string): string | null {
  if (!isHtmlPath(pathname)) return null;
  if (pathname === "/" || pathname === "/index.html") return "/index.md";
  const clean = pathname.replace(/\/+$/, "");
  if (clean.endsWith("/index.html")) return `${clean.slice(0, -"/index.html".length)}.md`;
  if (clean.endsWith(".html")) return `${clean.slice(0, -".html".length)}.md`;
  return `${clean}.md`;
}

function browserCacheControlFor(pathname: string): string {
  if (isHtmlPath(pathname)) {
    return "public, max-age=60, stale-while-revalidate=60";
  }
  if (isShellAssetPath(pathname)) {
    return "public, max-age=60, stale-while-revalidate=300";
  }
  if (isMutableStaticPath(pathname)) {
    return "public, max-age=300, stale-while-revalidate=300";
  }
  return "public, max-age=31536000, immutable";
}

function edgeCacheControlFor(pathname: string): string {
  if (isHtmlPath(pathname)) {
    return "public, s-maxage=60, stale-while-revalidate=60";
  }
  if (isShellAssetPath(pathname)) {
    return "public, s-maxage=3600, stale-while-revalidate=86400";
  }
  if (isMutableStaticPath(pathname)) {
    return "public, s-maxage=3600, stale-while-revalidate=86400";
  }
  return "public, max-age=31536000, immutable";
}

function isMutableStaticPath(pathname: string): boolean {
  return isShellAssetPath(pathname)
    || pathname.endsWith(".md")
    || pathname.endsWith(".txt")
    || pathname.endsWith(".xml")
    || pathname.endsWith(".json")
    || pathname.endsWith(".jsonl");
}

function isShellAssetPath(pathname: string): boolean {
  return pathname === "/assets/docs-site.css" || pathname === "/assets/docs-site.js";
}

function isHtmlPath(pathname: string): boolean {
  return pathname.endsWith(".html") || !/\.[^/]+$/.test(pathname);
}

function appendVary(current: string | null, value: string): string {
  const parts = new Set((current ?? "").split(",").map((part) => part.trim()).filter(Boolean));
  parts.add(value);
  return [...parts].join(", ");
}

function appendLink(current: string | null, value: string): string {
  if (!current) return value;
  if (current.includes(value)) return current;
  return `${current}, ${value}`;
}
