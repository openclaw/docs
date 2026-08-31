import assert from "node:assert/strict";
import test from "node:test";
import router from "./docs-router.ts";

const markdownTypes = ["text/markdown", "text/x-markdown", "application/markdown"];
const htmlType = "text/html; charset=utf-8";
const markdownType = "text/markdown; charset=utf-8";
const immutable = "public, max-age=31536000, immutable";
const htmlBrowser = "public, max-age=60, stale-while-revalidate=60";
const htmlEdge = "public, s-maxage=60, stale-while-revalidate=60";
const mutableBrowser = "public, max-age=300, stale-while-revalidate=300";
const mutableEdge = "public, s-maxage=3600, stale-while-revalidate=86400";
const source = "---\ntitle: Release\n---\n# Release\n\n## Part\nFirst\n\n## After\nWhole document\n";
const object = (body, type, target) => ({
  body,
  headers: { ...(type ? { "Content-Type": type } : {}), Vary: "Accept-Encoding" },
  customMetadata: target ? { "openclaw-markdown-target": target } : {},
});

function harness(t, initial) {
  const entries = new Map(Object.entries(initial));
  const cache = new Map();
  const calls = [];
  const puts = [];
  const pending = [];
  const original = Object.getOwnPropertyDescriptor(globalThis, "caches");
  Object.defineProperty(globalThis, "caches", { configurable: true, value: { default: {
    match: async (request) => cache.get(request.url)?.clone(),
    put: async (request, response) => {
      puts.push(request.url);
      cache.set(request.url, response.clone());
    },
  } } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "caches", original);
    else delete globalThis.caches;
  });
  const read = (method, key) => {
    calls.push(`${method} ${key}`);
    const entry = entries.get(key);
    if (entry instanceof Error) throw entry;
    if (!entry) return null;
    return {
      ...(method === "GET" ? { body: entry.body } : {}),
      size: Buffer.byteLength(entry.body), httpEtag: '"fixture"',
      httpMetadata: { contentType: entry.headers["Content-Type"] },
      customMetadata: entry.customMetadata,
      writeHttpMetadata(headers) {
        for (const [name, value] of Object.entries(entry.headers)) headers.set(name, value);
      },
    };
  };
  const env = { DOCS_BUCKET: {
    get: async (key) => read("GET", key), head: async (key) => read("HEAD", key),
  } };
  return {
    entries, cache, calls, puts, env,
    async request(route, method = "GET", accept = "text/html") {
      const response = await router.fetch(new Request(`https://docs.openclaw.ai${route}`, {
        method, headers: { Accept: accept },
      }), env, { waitUntil(promise) { pending.push(promise); } });
      await Promise.all(pending.splice(0));
      return response;
    },
    reset() { cache.clear(); calls.length = 0; puts.length = 0; },
  };
}

function policy(response, browser, edge) {
  assert.equal(response.headers.get("Cache-Control"), browser);
  assert.equal(response.headers.get("CDN-Cache-Control"), edge);
  assert.equal(response.headers.get("Cloudflare-CDN-Cache-Control"), edge);
}

async function representation(response, method, type, body, alternate = null) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), type);
  assert.equal(response.headers.get("Location"), null);
  assert.equal(response.headers.get("Vary"), "Accept-Encoding, Accept");
  assert.equal(response.headers.get("Link"), alternate && `<${alternate}>; rel="alternate"; type="text/markdown"`);
  policy(response, type === htmlType ? htmlBrowser : mutableBrowser, type === htmlType ? htmlEdge : mutableEdge);
  assert.equal(await response.text(), method === "HEAD" ? "" : body);
}

for (const name of ["release.v2", "guide.config", "page.svg"]) {
  for (const encoded of [false, true]) {
    test(`current HTML owns dotted negotiation: ${name}, encoded=${encoded}`, async (t) => {
      const p = harness(t, { [name]: object("<html>Current</html>", htmlType), [`${name}.md`]: object(source, markdownType) });
      const route = `/${encoded ? name.replaceAll(".", "%2E") : name}?incoming=1`;
      const pathname = new URL(route, "https://docs.openclaw.ai").pathname;
      for (const method of ["GET", "HEAD"]) {
        for (const accept of markdownTypes) {
          for (const order of [[accept, "text/html"], ["text/html", accept]]) {
            p.reset();
            for (const nextAccept of [...order, ...order]) {
              const markdown = nextAccept !== "text/html";
              const start = p.calls.length;
              await representation(await p.request(route, method, nextAccept), method,
                markdown ? markdownType : htmlType, markdown ? source : "<html>Current</html>", markdown ? null : `${pathname}.md`);
              const reads = p.calls.slice(start);
              assert.equal(reads.filter((call) => call === `HEAD ${name}`).length, markdown || method === "HEAD" ? 1 : 0);
              if (method === "HEAD") assert.ok(reads.every((call) => call.startsWith("HEAD ")));
            }
            assert.ok(p.puts.every((url) => url === `https://docs.openclaw.ai${pathname}.md?incoming=1`));
            assert.equal(p.puts.length, method === "GET" ? 1 : 0);
          }
        }
      }
    });
  }
}

const assets = [
  ["assets/icon.svg", "image/svg+xml", "<svg>asset</svg>", immutable, immutable],
  ["assets/theme.css", "text/css; charset=utf-8", "body{}", immutable, immutable],
  ["assets/app.js", "text/javascript; charset=utf-8", "export {};", immutable, immutable],
  ["data.json", "application/json; charset=utf-8", '{"asset":true}', mutableBrowser, mutableEdge],
  ["pagefind/index.pf_meta", "application/octet-stream", Buffer.from([0, 255, 128, 1]), immutable, immutable],
  ["assets/font.bin", "application/octet-stream", Buffer.from([0, 255, 13, 10]), immutable, immutable],
  ["assets/docs-site.css", "text/css; charset=utf-8", "body{}", "public, max-age=60, stale-while-revalidate=300", mutableEdge],
  ["assets/docs-site.js", "text/javascript; charset=utf-8", "export {};", "public, max-age=60, stale-while-revalidate=300", mutableEdge],
];
for (const [key, type, body, browser, edge] of assets) {
  for (const encoded of [false, true]) {
    test(`static companion cannot negotiate: ${key}, encoded=${encoded}`, async (t) => {
      const p = harness(t, {
        [key]: object(body, type, "/unrelated.md"),
        [`${key}.md`]: object("Wrong companion", markdownType),
        "unrelated.md": object("Wrong alias target", markdownType),
      });
      const route = `/${encoded ? key.replaceAll(".", "%2E") : key}?version=1`;
      for (const accept of markdownTypes) {
        for (const order of [["text/html", accept], [accept, "text/html"]]) {
          p.reset();
          for (const method of ["GET", "HEAD"]) {
            for (const nextAccept of [...order, ...order]) {
              const warm = p.cache.size > 0;
              const start = p.calls.length;
              const response = await p.request(route, method, nextAccept);
              assert.equal(response.status, 200);
              assert.equal(response.headers.get("Content-Type"), type);
              assert.equal(response.headers.get("Location"), null);
              assert.equal(response.headers.get("Link"), null);
              assert.equal(response.headers.get("Vary"), "Accept-Encoding");
              policy(response, browser, edge);
              assert.deepEqual(Buffer.from(await response.arrayBuffer()), method === "HEAD" ? Buffer.alloc(0) : Buffer.from(body));
              const reads = p.calls.slice(start);
              assert.ok(reads.every((call) => call.endsWith(` ${key}`)), "no companion or target reads for assets");
              if (method === "HEAD") assert.deepEqual(reads, [`HEAD ${key}`]);
              else {
                assert.equal(response.headers.get("X-OpenClaw-Docs-Cache"), warm ? "HIT" : "MISS");
                assert.deepEqual(reads, [
                  ...(nextAccept === "text/html" ? [] : [`HEAD ${key}`]),
                  ...(warm ? [] : [`GET ${key}`]),
                ]);
              }
            }
          }
          assert.deepEqual(p.puts, [`https://docs.openclaw.ai${route}`]);
        }
      }
    });
  }
}

test("obsolete immutable HTML never hides current dotted ownership or warm canonical Markdown", async (t) => {
  const p = harness(t, {
    "old.v2": object("<html>Fresh</html>", htmlType, "/release.v2.md?dest=1#part"),
    "release.v2.md": object(source, markdownType),
  });
  for (const method of ["GET", "HEAD"]) {
    for (const accept of markdownTypes) {
      for (const order of [["text/html", accept], [accept, "text/html"]]) {
        p.reset();
        await p.request("/release.v2.md?incoming=1");
        p.cache.set("https://docs.openclaw.ai/old.v2?incoming=1", new Response("obsolete", { headers: {
          "Content-Type": htmlType, "Cache-Control": immutable, "CDN-Cache-Control": immutable,
          "Cloudflare-CDN-Cache-Control": immutable, "x-amz-meta-openclaw-markdown-target": "/wrong.md",
        } }));
        p.puts.length = 0;
        for (const nextAccept of [...order, ...order]) {
          const start = p.calls.length;
          const markdown = nextAccept !== "text/html";
          const response = await p.request("/old.v2?incoming=1", method, nextAccept);
          assert.equal(response.headers.get("X-OpenClaw-Docs-Cache"), markdown && method === "GET" ? "HIT" : "MISS");
          await representation(response, method, markdown ? markdownType : htmlType,
            markdown ? source : "<html>Fresh</html>", markdown ? null : "/old.v2.md");
          assert.deepEqual(p.calls.slice(start), markdown
            ? ["HEAD old.v2", `${method} old.v2.md`, ...(method === "HEAD" ? ["HEAD release.v2.md"] : [])]
            : [`${method} old.v2`]);
        }
        assert.deepEqual(p.puts, []);
        assert.equal(await p.cache.get("https://docs.openclaw.ai/old.v2?incoming=1").clone().text(), "obsolete");
        const start = p.calls.length;
        assert.equal((await p.request("/release.v2.md?incoming=1")).headers.get("X-OpenClaw-Docs-Cache"), "HIT");
        assert.deepEqual(p.calls.slice(start), []);
        assert.equal(p.cache.has("https://docs.openclaw.ai/old.v2.md?incoming=1"), false);
      }
    }
  }
});

test("missing, untyped and failed dotted ownership cannot authorize a companion", async (t) => {
  const p = harness(t, {
    "untyped.v2": object("Untyped", undefined, "/wrong.md"),
    "untyped.v2.md": object("Wrong", markdownType),
    "missing.v2.md": object("Wrong", markdownType),
    "failed.v2": new Error("synthetic R2 failure"),
    "failed.v2.md": object("Wrong", markdownType),
  });
  for (const method of ["GET", "HEAD"]) {
    for (const accept of markdownTypes) {
      p.calls.length = 0;
      assert.equal((await p.request("/missing.v2", method, accept)).status, 404);
      const untyped = await p.request("/untyped.v2", method, accept);
      assert.equal(await untyped.text(), method === "HEAD" ? "" : "Untyped");
      assert.equal(untyped.headers.get("Link"), null);
      assert.equal(untyped.headers.get("Vary"), "Accept-Encoding");
      policy(untyped, immutable, immutable);
      await assert.rejects(p.request("/failed.v2", method, accept), /synthetic R2 failure/);
      assert.ok(p.calls.every((call) => !call.endsWith(".md")));
    }
  }
  delete p.env.DOCS_BUCKET;
  assert.equal((await p.request("/missing.v2", "GET", "text/markdown")).status, 500);
});

test("ordinary cached non-HTML stays a zero-read hit; dotted negotiation checks current ownership", async (t) => {
  const p = harness(t, { "guide.config": object("<html>Current</html>", htmlType) });
  for (const method of ["GET", "HEAD"]) {
    p.reset();
    p.cache.set("https://docs.openclaw.ai/guide.config", new Response("old static bytes", { headers: {
      "Content-Type": "application/octet-stream", "Cache-Control": immutable,
    } }));
    const ordinary = await p.request("/guide.config");
    assert.equal(await ordinary.text(), "old static bytes");
    assert.equal(ordinary.headers.get("X-OpenClaw-Docs-Cache"), "HIT");
    assert.deepEqual(p.calls, []);
    // No Markdown exists, so the current HTML must also own the fallback.
    await representation(await p.request("/guide.config", method, "text/markdown"), method, htmlType, "<html>Current</html>", "/guide.config.md");
    assert.deepEqual(p.calls, ["HEAD guide.config", `${method} guide.config.md`, ...(method === "GET" ? ["GET guide.config"] : [])]);
    assert.deepEqual(p.puts, []);
  }
});

test("fallback classifies the returned representation when ownership changes after HEAD", async (t) => {
  const p = harness(t, { "guide.v2": object("<html>Before</html>", htmlType) });
  p.env.DOCS_BUCKET.get = async (key) => {
    p.calls.push(`GET ${key}`);
    if (key !== "guide.v2") return null;
    return { body: "now static", customMetadata: {}, writeHttpMetadata(headers) {
      headers.set("Content-Type", "application/octet-stream");
    } };
  };
  const response = await p.request("/guide.v2", "GET", "text/markdown");
  assert.equal(await response.text(), "now static");
  assert.equal(response.headers.get("Content-Type"), "application/octet-stream");
  assert.equal(response.headers.get("Link"), null);
  assert.equal(response.headers.get("Vary"), null);
  policy(response, immutable, immutable);
  assert.deepEqual(p.calls, ["HEAD guide.v2", "GET guide.v2.md", "GET guide.v2"]);
});

test("explicit HTML, not-found, trailing slash, methods and hosts keep their routing contracts", async (t) => {
  const p = harness(t, {
    "release.v2": object("<html>Page</html>", htmlType),
    "release.v2.md": object(source, markdownType),
    "release.v2/index.html": object("<html>Page</html>", htmlType),
    "page.html": object("<html>File</html>", htmlType),
    "page.html.md": object("Wrong", markdownType),
    "de": object("<html>Deutsch</html>", htmlType),
    "de/index.md": object("# Deutsch\n", markdownType),
  });
  for (const method of ["GET", "HEAD"]) {
    await representation(await p.request("/de", method, "text/markdown"), method, htmlType, "<html>Deutsch</html>", "/de.md");
    for (const route of ["/page.html", "/page%2Ehtml", "/release.v2/index.html"]) {
      const response = await p.request(route, method, "text/markdown");
      assert.equal(response.headers.get("Content-Type"), htmlType);
      assert.equal(response.headers.get("Vary"), "Accept-Encoding");
      policy(response, htmlBrowser, htmlEdge);
      assert.equal(await response.text(), method === "HEAD" ? "" : route.includes("index") ? "<html>Page</html>" : "<html>File</html>");
    }
    const missing = await p.request("/unknown", method);
    assert.equal(missing.status, 404);
    assert.equal(missing.headers.get("Content-Type"), htmlType);
    const dotted = await p.request("/unknown.v2", method);
    assert.equal(dotted.status, 404);
    assert.equal(dotted.headers.get("Content-Type"), "text/plain; charset=utf-8");
    const redirect = await p.request("/release.v2/?incoming=1", method);
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get("Location"), "https://docs.openclaw.ai/release.v2?incoming=1");
    await representation(await p.request("/release.v2/?incoming=1", method, "text/markdown"), method, markdownType, source);
  }
  const start = p.calls.length;
  const disallowed = await p.request("/release.v2", "POST", "text/markdown");
  assert.equal(disallowed.status, 405);
  assert.equal(disallowed.headers.get("Allow"), "GET, HEAD");
  for (const [origin, target] of [
    ["http://docs.openclaw.ai", "https://docs.openclaw.ai"],
    ["https://documentation.openclaw.ai", "https://docs.openclaw.ai"],
    ["https://mintlify.openclaw.ai", "https://docs2.openclaw.ai"],
  ]) {
    const response = await router.fetch(new Request(`${origin}/release.v2?incoming=1`), p.env, {});
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("Location"), `${target}/release.v2?incoming=1`);
  }
  assert.deepEqual(p.calls.slice(start), []);
});

test("negotiable root HTML preserves existing Vary and Link values", async (t) => {
  const root = object("<html>Root</html>", htmlType);
  root.headers.Link = '</assets/theme.css>; rel="preload"';
  const p = harness(t, { "index.html": root, "index.md": object(source, markdownType) });
  for (const method of ["GET", "HEAD"]) {
    const response = await p.request("/", method);
    assert.equal(response.headers.get("Vary"), "Accept-Encoding, Accept");
    assert.equal(response.headers.get("Link"), '</assets/theme.css>; rel="preload", </index.md>; rel="alternate"; type="text/markdown"');
    assert.equal(await response.text(), method === "HEAD" ? "" : "<html>Root</html>");
    policy(response, htmlBrowser, htmlEdge);
    await representation(await p.request("/", method, "text/markdown"), method, markdownType, source);
  }
  assert.ok(p.puts.every((url) => url.endsWith("/index.md")));
});
