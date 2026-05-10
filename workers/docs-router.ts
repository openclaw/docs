interface Env {
  DOCS_BUCKET: R2Bucket;
}

const markdownAcceptTypes = new Set(["text/markdown", "text/x-markdown", "application/markdown"]);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    if (isFullLlmsPath(url.pathname)) {
      return new Response(request.method === "HEAD" ? null : "OpenClaw does not publish a full-site LLM corpus. Use /llms.txt and page-level Markdown instead.\n", {
        status: 410,
        headers: {
          "Cache-Control": "public, max-age=300",
          "Content-Type": "text/plain; charset=utf-8",
          "X-OpenClaw-Docs-Origin": "worker",
        },
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
    return new Response(request.method === "HEAD" ? null : cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers,
    });
  }

  const key = r2ObjectKey(pathname);
  const object = request.method === "HEAD" ? await env.DOCS_BUCKET.head(key) : await env.DOCS_BUCKET.get(key);
  if (!object) {
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
  const responseHeaders = r2ObjectHeaders(object);
  responseHeaders.set("X-OpenClaw-Docs-Origin", "cloudflare-r2");
  responseHeaders.set("X-OpenClaw-Docs-Cache", "MISS");
  applyCacheHeaders(responseHeaders, pathname);
  const finalResponse = new Response(request.method === "HEAD" ? null : object.body, {
    status: 200,
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

function r2ObjectHeaders(object: R2Object): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Last-Modified", object.uploaded.toUTCString());
  return headers;
}

function r2ObjectKey(pathname: string): string {
  const key = pathname.replace(/^\/+/, "");
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
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

function browserCacheControlFor(pathname: string): string {
  if (isHtmlPath(pathname)) {
    return "public, max-age=60, stale-while-revalidate=60";
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
  if (isMutableStaticPath(pathname)) {
    return "public, s-maxage=3600, stale-while-revalidate=86400";
  }
  return "public, max-age=31536000, immutable";
}

function isMutableStaticPath(pathname: string): boolean {
  return pathname.endsWith(".md")
    || pathname.endsWith(".txt")
    || pathname.endsWith(".xml")
    || pathname.endsWith(".json")
    || pathname.endsWith(".jsonl");
}

function isHtmlPath(pathname: string): boolean {
  return pathname.endsWith(".html") || !/\.[^/]+$/.test(pathname);
}

function isFullLlmsPath(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, "");
  return clean === "/llms-full.txt" || clean === "/.well-known/llms-full.txt";
}

function appendVary(current: string | null, value: string): string {
  const parts = new Set((current ?? "").split(",").map((part) => part.trim()).filter(Boolean));
  parts.add(value);
  return [...parts].join(", ");
}
