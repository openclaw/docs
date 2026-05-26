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
