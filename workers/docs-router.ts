interface Env {
  CLOUDFLARE_R2_BUCKET?: string;
  OPENCLAW_R2_ACCOUNT_ID?: string;
  OPENCLAW_R2_ACCESS_KEY_ID?: string;
  OPENCLAW_R2_REGION?: string;
  OPENCLAW_R2_SECRET_ACCESS_KEY?: string;
}

const markdownAcceptTypes = new Set(["text/markdown", "text/x-markdown", "application/markdown"]);
const defaultR2Bucket = "openclaw-docs";
const defaultR2Region = "auto";

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
    applyMarkdownAlternateHeader(headers, pathname);
    return new Response(request.method === "HEAD" ? null : cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers,
    });
  }

  const key = r2ObjectKey(pathname);
  const response = await signedR2Fetch(env, request.method, key);
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

async function signedR2Fetch(env: Env, method: string, key: string): Promise<Response> {
  const accountId = requiredEnv(env.OPENCLAW_R2_ACCOUNT_ID, "OPENCLAW_R2_ACCOUNT_ID");
  const accessKeyId = requiredEnv(env.OPENCLAW_R2_ACCESS_KEY_ID, "OPENCLAW_R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv(env.OPENCLAW_R2_SECRET_ACCESS_KEY, "OPENCLAW_R2_SECRET_ACCESS_KEY");
  const bucket = env.CLOUDFLARE_R2_BUCKET || defaultR2Bucket;
  const region = env.OPENCLAW_R2_REGION || defaultR2Region;
  const service = "s3";
  const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeS3Key(key)}`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
    "x-amz-date": amzDate,
  };
  const signedHeaders = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaders.map((name) => `${name}:${normalizeHeader(headers[name] ?? "")}\n`).join("");
  const canonicalRequest = [
    method,
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaders.join(";"),
    headers["x-amz-content-sha256"],
  ].join("\n");
  const scope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = await hmac(await hmac(await hmac(await hmac(`AWS4${secretAccessKey}`, date), region), service), "aws4_request");
  const signature = hex(await hmac(signingKey, stringToSign));
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`;
  return fetch(url.toString(), {
    headers: {
      ...headers,
      authorization,
    },
    method,
  });
}

function requiredEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function encodeS3Key(key: string): string {
  return key.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

async function sha256Hex(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function hmac(key: string | ArrayBuffer, value: string): Promise<ArrayBuffer> {
  const rawKey = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey("raw", rawKey, { hash: "SHA-256", name: "HMAC" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value));
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
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
