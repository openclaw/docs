interface Env {
  ASSETS: Fetcher;
}

const markdownAcceptTypes = new Set(["text/markdown", "text/x-markdown", "application/markdown"]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
      return markdownResponse(env, request, url.pathname);
    }

    if (prefersMarkdown(request)) {
      const markdownPath = markdownPathFor(url.pathname);
      if (markdownPath) {
        const response = await markdownResponse(env, request, markdownPath);
        if (response.status !== 404) return response;
      }
    }

    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
      return Response.redirect(url.toString(), 308);
    }

    return assetResponse(env, request, htmlAssetPath(url.pathname));
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

function htmlAssetPath(pathname: string): string {
  if (pathname === "/") return "/index.html";
  if (/\.[^/]+$/.test(pathname)) return pathname;
  return `${pathname}/index.html`;
}

async function markdownResponse(env: Env, request: Request, pathname: string): Promise<Response> {
  const response = await assetResponse(env, request, pathname);
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

async function assetResponse(env: Env, request: Request, pathname: string): Promise<Response> {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = pathname;
  const headers = new Headers(request.headers);
  headers.delete("If-None-Match");
  const response = await env.ASSETS.fetch(new Request(assetUrl, {
    method: request.method,
    headers,
    redirect: "manual",
  }));
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("X-OpenClaw-Docs-Origin", "cloudflare-static-assets");
  if (response.ok) responseHeaders.set("Cache-Control", cacheControlFor(pathname));
  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

function cacheControlFor(pathname: string): string {
  if (pathname.endsWith(".html")) {
    return "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800";
  }
  if (pathname.endsWith(".md") || pathname.endsWith(".txt") || pathname.endsWith(".json") || pathname.endsWith(".jsonl")) {
    return "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
  }
  return "public, max-age=31536000, immutable";
}

function appendVary(current: string | null, value: string): string {
  const parts = new Set((current ?? "").split(",").map((part) => part.trim()).filter(Boolean));
  parts.add(value);
  return [...parts].join(", ");
}
