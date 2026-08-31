import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fixture, pipeline, repo, servesMarkdown } from "./test-helpers/redirect-fixture.mjs";

const markdownTypes = ["text/markdown", "text/x-markdown", "application/markdown"];
const targetField = "openclaw-markdown-target";
const sources = {
  "release.v2.md": "---\ntitle: Release\n---\n# Release\n\n## Part\nFirst\n\n## After\nWhole document\n",
  "other.v3.md": "# Other\n",
  "collision.v2.md": "# Surviving source stub\n",
  "de/index.md": "# Deutsch\n", "de/release.v2.md": "# Ausgabe\n",
  "fr/index.md": "# Français\n",
  "reference/AGENTS.default.md": fs.readFileSync(path.join(repo, "docs/reference/AGENTS.default.md"), "utf8"),
  "de/reference/AGENTS.default.md": "# Deutsche Anweisungen\n",
};
const configured = JSON.parse(fs.readFileSync(path.join(repo, "docs/docs.json"), "utf8"))
  .redirects.filter(({ source }) => source === "/AGENTS.default");
assert.equal(configured.length, 1);

function checkPolicy(response, markdown) {
  assert.equal(response.headers.get("Cache-Control"), markdown
    ? "public, max-age=300, stale-while-revalidate=300" : "public, max-age=60, stale-while-revalidate=60");
  for (const header of ["CDN-Cache-Control", "Cloudflare-CDN-Cache-Control"]) {
    assert.equal(response.headers.get(header), markdown
      ? "public, s-maxage=3600, stale-while-revalidate=86400" : "public, s-maxage=60, stale-while-revalidate=60");
  }
}

async function servesHtml(p, route, method = "GET") {
  const response = await p.request(route, { method });
  assert.equal(response.status, 200, route);
  assert.equal(response.headers.get("Content-Type"), "text/html; charset=utf-8", route);
  assert.equal(response.headers.get("Location"), null);
  assert.equal(response.headers.get("Vary"), "Accept");
  assert.equal(response.headers.get("X-OpenClaw-Docs-Cache"), "MISS");
  const pathname = new URL(route, "https://docs.openclaw.ai").pathname;
  assert.equal(response.headers.get("Link"), `<${pathname}.md>; rel="alternate"; type="text/markdown"`);
  checkPolicy(response, false);
  const entry = p.entries.get(decodeURIComponent(pathname.slice(1)));
  assert.equal(await response.text(), method === "HEAD" ? "" : fs.readFileSync(path.join(p.root, entry.file), "utf8"));
}

for (const base of ["", "/manual"]) {
  test(`real builder/preparer dotted ownership, locales and Accept orders with base ${base || "(root)"}`, async (t) => {
    const p = pipeline(fixture(t, [...configured,
      { source: "/guide.config", destination: "/release.v2?destination=1#part" },
      { source: "/collision.v2", destination: "/release.v2" },
      { source: "/via.config", destination: "/collision.v2" },
    ], sources, base));
    const routes = [
      ["/release.v2", "/release.v2.md"],
      ["/reference/AGENTS.default", "/reference/AGENTS.default.md"],
      ["/de/reference/AGENTS.default", "/de/reference/AGENTS.default.md"],
      ["/collision.v2", "/collision.v2.md"],
    ];
    for (const prefix of [...new Set(["", "/docs", base])]) {
      for (const [locale, targetLocale] of [["", ""], ["/de", "/de"], ["/fr", ""]]) {
        for (const [alias, target] of [
          ["/guide.config", `${targetLocale}/release.v2.md`],
          ["/AGENTS.default", `${targetLocale}/reference/AGENTS.default.md`],
        ]) {
          const route = `${prefix}${locale}${alias}`;
          routes.push([route, target]);
          for (const suffix of ["", "/index.html"]) {
            const entry = p.entries.get(route.slice(1) + suffix);
            assert.equal(entry.contentType, "text/html; charset=utf-8");
            assert.equal(entry.cacheControl, "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800");
            assert.equal(entry.sourceKey, `${route.slice(1)}/index.html`);
            assert.equal(entry.customMetadata[targetField], target + (alias === "/guide.config" ? "?destination=1#part" : ""));
          }
        }
      }
      routes.push([`${prefix}/via.config`, "/collision.v2.md"]);
      if (prefix) routes.push([`${prefix}/collision.v2`, "/release.v2.md"]);
    }
    for (const [route, target] of routes) {
      for (const encoded of [false, true]) {
        const spelling = encoded ? route.replaceAll(".", "%2E") : route;
        for (const method of ["GET", "HEAD"]) {
          for (const accept of markdownTypes) {
            for (const order of [[accept, "text/html"], ["text/html", accept]]) {
              p.cache.clear();
              for (const nextAccept of [...order, ...order]) {
                const start = p.calls.length;
                if (nextAccept === "text/html") await servesHtml(p, `${spelling}?incoming=1`, method);
                else {
                  const response = await servesMarkdown(p, `${spelling}?incoming=1`, target, { method, accept: nextAccept });
                  checkPolicy(response, true);
                  assert.equal(response.headers.get("Link"), null);
                  assert.equal(p.calls.slice(start).filter((call) => call === `HEAD ${route.slice(1)}`).length, 1);
                }
                if (method === "HEAD") assert.ok(p.calls.slice(start).every((call) => call.startsWith("HEAD ")));
              }
              const bodyPath = p.entries.has(`${route.slice(1)}.md`) ? `${spelling}.md` : target;
              assert.deepEqual([...p.cache.keys()], method === "GET" ? [`https://docs.openclaw.ai${bodyPath}?incoming=1`] : []);
            }
          }
        }
      }
      await servesMarkdown(p, `${route}.md?incoming=1`, target);
    }
    const aliasHtml = fs.readFileSync(path.join(p.root, p.entries.get("guide.config").file), "utf8");
    assert.ok(aliasHtml.includes(`location.replace(${JSON.stringify(`${base}/release.v2?destination=1#part`)})`));
    assert.equal(p.entries.get("collision.v2").customMetadata, undefined);
    assert.equal(p.entries.get("release.v2").contentType, "text/html; charset=utf-8");
    assert.equal(p.entries.get("release.v2/index.html").contentType, "text/html; charset=utf-8");
    // The builder's English pass also emits de.md; use that existing source.
    await servesMarkdown(p, "/de", "/de.md", { accept: "text/markdown" });
    if (base) assert.equal((await p.request(`${base}/release.v2`, { accept: "text/markdown" })).status, 404);
  });
}

test("dotted alias uses current metadata after warm canonical requests and preserves real source precedence", async (t) => {
  const p = pipeline(fixture(t, [
    { source: "/guide.config", destination: "/release.v2#part" },
    { source: "/new.config", destination: "/other.v3" },
  ], sources));
  await servesMarkdown(p, "/release.v2.md", "/release.v2.md");
  await servesMarkdown(p, "/other.v3.md", "/other.v3.md");
  await servesHtml(p, "/guide.config");
  await servesMarkdown(p, "/guide.config", "/release.v2.md", { accept: "text/markdown" });
  p.entries.set("guide.config", { ...p.entries.get("new.config"), key: "guide.config" });
  for (const method of ["GET", "HEAD"]) {
    const start = p.calls.length;
    const response = await servesMarkdown(p, "/guide.config", "/other.v3.md", { method, accept: "text/markdown" });
    checkPolicy(response, true);
    assert.deepEqual(p.calls.slice(start), ["HEAD guide.config", `${method} guide.config.md`, ...(method === "HEAD" ? ["HEAD other.v3.md"] : [])]);
  }
  assert.equal(p.cache.has("https://docs.openclaw.ai/guide.config.md"), false);
  p.entries.set("guide.config.md", p.entries.get("collision.v2.md"));
  for (const method of ["GET", "HEAD"]) {
    await servesMarkdown(p, "/guide.config", "/collision.v2.md", { method, accept: "text/markdown" });
  }
  p.entries.delete("guide.config.md");
  p.cache.clear();
  for (const metadata of [undefined, { [targetField]: "/missing.v2.md" }]) {
    p.entries.get("guide.config").customMetadata = metadata;
    for (const method of ["GET", "HEAD"]) {
      const start = p.calls.length;
      const response = await p.request("/guide.config", { method, accept: "text/markdown" });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Content-Type"), "text/html; charset=utf-8");
      assert.equal(response.headers.get("Vary"), "Accept");
      checkPolicy(response, false);
      assert.equal(p.calls.slice(start).filter((call) => call === "HEAD guide.config").length, 1);
      assert.equal(await response.text(), method === "HEAD" ? "" : fs.readFileSync(path.join(p.root, p.entries.get("guide.config").file), "utf8"));
      assert.equal((await p.request("/guide.config.md", { method })).status, 404);
    }
    assert.equal(p.cache.size, 0);
  }
});
