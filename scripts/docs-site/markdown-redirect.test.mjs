import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fixture, servesMarkdown, pipeline, repo, run } from "./test-helpers/redirect-fixture.mjs";

test("central aliases serve exact canonical Markdown in the first response after source retirement", async (t) => {
  const config = JSON.parse(fs.readFileSync(path.join(repo, "docs/docs.json"), "utf8"));
  const aliases = ["/refactor/database-first", "/plan/runners", "/automation/auth-monitoring", "/platforms/digitalocean"];
  const redirects = config.redirects.filter((redirect) => aliases.includes(redirect.source));
  assert.equal(redirects.length, aliases.length);
  const sources = Object.fromEntries([
    "index.md", "reference/database-schemas.md", "gateway/cloud-sessions.md",
    "automation/auth-monitoring.md", "gateway/authentication.md",
    "platforms/digitalocean.md", "install/digitalocean.md",
  ].map((name) => [name, fs.readFileSync(path.join(repo, "docs", name), "utf8")]));
  const p = pipeline(fixture(t, redirects, sources));
  for (const [source, target] of [
    ["/refactor/database-first", "/reference/database-schemas.md"],
    ["/plan/runners", "/gateway/cloud-sessions.md"],
  ]) {
    for (const prefix of ["", "/docs"]) {
      for (const method of ["GET", "HEAD"]) {
        await servesMarkdown(p, `${prefix}${source}.md`, target, { method });
        for (const accept of ["text/markdown", "text/x-markdown", "application/markdown"]) {
          await servesMarkdown(p, `${prefix}${source}`, target, { method, accept });
        }
      }
      const html = await p.request(`${prefix}${source}`);
      assert.equal(html.status, 200);
      assert.match(html.headers.get("Content-Type"), /^text\/html/);
      assert.ok((await html.text()).includes(`location.replace(${JSON.stringify(target.slice(0, -3))})`));
      const alternate = html.headers.get("Link").match(/<([^>]+)>; rel="alternate"/)[1];
      await servesMarkdown(p, alternate, target);
      await servesMarkdown(p, alternate, target);
    }
  }
  for (const route of ["/automation/auth-monitoring.md", "/reference/database-schemas.md"]) {
    await servesMarkdown(p, route, route);
  }
  const legacyHtml = await p.request("/docs/platforms/digitalocean");
  assert.match(await legacyHtml.text(), /url=\/install\/digitalocean/);
  await servesMarkdown(p, "/docs/platforms/digitalocean.md", "/install/digitalocean.md");
  await servesMarkdown(p, "/platforms/digitalocean.md", "/platforms/digitalocean.md");
});

const rules = (pairs) => pairs.map(([source, destination]) => ({ source, destination }));
const sources = {
  "target.md": "---\ntitle: Target\n---\n# Target\n\nIntroduction\n\n## Part\nCanonical\n\n## After\nWhole document\n", "other.md": "# Other\n",
  "collision.md": "# Existing source wins\n", "section/index.md": "# Nested index\n",
  "de/index.md": "# Deutsch\n", "de/target.md": "# Ziel\n", "fr/index.md": "# Français\n",
  "reference/AGENTS.default.md": "# Default agent\n\n## Part\nInstructions\n",
};

for (const base of ["", "/manual"]) {
  test(`generated aliases serve whole published Markdown with base ${base || "(root)"}`, async (t) => {
    const p = pipeline(fixture(t, rules([
      ["/old", "/target"], ["/anchor", "/target#part"], ["/query", "/target?lang=en#part"],
      ["/empty-query", "/target?#part"], ["/root-old", "/"], ["/index-old", "/index"],
      ["/nested", "/section/index"], ["/old/index", "/target"],
      ["/dotted-target", "/reference/AGENTS.default#part"],
      ["/de/explicit", "/de/target#part"], ["/to-explicit", "/de/target#part"],
      ["/de/english-fallback", "/de/other#part"],
      ["/collision", "/target"], ["/via-collision", "/collision"],
      ["/index", "/target"], ["/section", "/target"],
    ]), sources, base));
    for (const prefix of [...new Set(["", "/docs", base])]) {
      for (const [alias, canonicalPath, htmlDestination] of [
        ["/old", "/target.md", "/target"], ["/anchor", "/target.md", "/target#part"],
        ["/query", "/target.md", "/target?lang=en#part"], ["/empty-query", "/target.md", "/target?#part"],
        ["/root-old", "/index.md", "/"], ["/index-old", "/index.md", "/"],
        ["/nested", "/section.md", "/section"], ["/old/index", "/target.md", "/target"],
        ["/dotted-target", "/reference/AGENTS.default.md", "/reference/AGENTS.default#part"],
        ["/de/old", "/de/target.md", "/de/target"], ["/fr/old", "/target.md", "/target"],
        ["/de/anchor", "/de/target.md", "/de/target#part"], ["/de/query", "/de/target.md", "/de/target?lang=en#part"],
        ["/de/root-old", "/de/index.md", "/de"], ["/de/nested", "/section.md", "/section"],
        ["/de/explicit", "/de/target.md", "/de/target#part"], ["/fr/to-explicit", "/de/target.md", "/de/target#part"],
        ["/de/english-fallback", "/other.md", "/other#part"], ["/via-collision", "/collision.md", "/collision"],
      ]) {
        for (const method of ["GET", "HEAD"]) {
          await servesMarkdown(p, `${prefix}${alias}.md`, canonicalPath, { method });
          await servesMarkdown(p, `${prefix}${alias}`, canonicalPath, { accept: "text/markdown", method });
        }
        const html = await p.request(`${prefix}${alias}?incoming=1`);
        assert.equal(html.status, 200);
        assert.match(html.headers.get("Content-Type"), /^text\/html/);
        assert.ok((await html.text()).includes(`location.replace(${JSON.stringify(base + htmlDestination)})`), alias);
      }
      for (const alias of ["anchor", "query", "empty-query"]) {
        for (const method of ["GET", "HEAD"]) {
          await servesMarkdown(p, `${prefix}/${alias}.md?incoming=1`, "/target.md", { method });
          await servesMarkdown(p, `${prefix}/${alias}?incoming=1`, "/target.md", { method, accept: "text/markdown" });
        }
      }
      await servesMarkdown(p, `${prefix}/old/?incoming=1`, "/target.md", { accept: "text/x-markdown" });
      const html = await p.request(`${prefix}/old/index.html`);
      assert.equal(html.status, 200);
      await servesMarkdown(p, html.headers.get("Link").match(/<([^>]+)>/)[1], "/target.md");
      if (prefix) {
        await servesMarkdown(p, `${prefix}/collision.md`, "/target.md");
        const collisionHtml = await p.request(`${prefix}/collision`);
        assert.ok((await collisionHtml.text()).includes(`url=${base}/target`));
        await servesMarkdown(p, `${prefix}/index.md`, "/target.md");
        await servesMarkdown(p, `${prefix}/section.md`, "/target.md");
      }
    }
    assert.equal(p.entries.has("de/de/explicit"), false);
    for (const route of ["/index.md", "/collision.md", "/section.md"]) {
      for (const method of ["GET", "HEAD"]) await servesMarkdown(p, route, route, { method });
    }
    for (const key of ["old", "old/index.html", "docs/old", "docs/old/index.html"]) {
      assert.equal(p.entries.get(key).customMetadata["openclaw-markdown-target"], "/target.md");
    }
    assert.equal(p.entries.get("collision/index.html").customMetadata, undefined);
    assert.equal(p.entries.has("docs-markdown-redirects.json"), false);
    assert.equal(p.entries.has("old.md"), false);
  });
}

test("root redirect works without a root page, and direct Markdown retains precedence", async (t) => {
  for (const source of ["/", "/index"]) {
    const f = fixture(t, rules([[source, "/target"]]), {
      "target.md": "# Target\n", "other.md": "# Restored root source\n",
    });
    fs.unlinkSync(path.join(f.root, "docs/index.md"));
    const p = pipeline(f);
    await servesMarkdown(p, "/index.md", "/target.md");
    await servesMarkdown(p, source, "/target.md", { accept: "application/markdown" });
    const html = await p.request(source);
    await servesMarkdown(p, html.headers.get("Link").match(/<([^>]+)>/)[1], "/target.md");
    p.entries.set("index.md", p.entries.get("other.md"));
    await servesMarkdown(p, "/index.md", "/other.md");
  }
});

test("explicit locale rules work before that locale is published and English prefixes stay explicit", async (t) => {
  const p = pipeline(fixture(t, rules([
    ["/de/old", "/de/target#part"], ["/old", "/de/target#part"],
    ["/en/old", "/old"], ["/en/direct", "/en/target"],
  ]), { "target.md": "# Target\n" }));
  for (const [alias, htmlDestination] of [
    ["/de/old", "/target#part"], ["/old", "/target#part"],
    ["/en/old", "/target#part"], ["/en/direct", "/target"],
  ]) {
    await servesMarkdown(p, `${alias}.md`, "/target.md");
    const html = await p.request(alias);
    assert.ok((await html.text()).includes(`location.replace(${JSON.stringify(htmlDestination)})`));
  }
  assert.equal(p.entries.has("de/de/old"), false);
});

test("Markdown aliases serve current R2 targets despite warm HTML and Markdown caches; absent metadata preserves behavior", async (t) => {
  const p = pipeline(fixture(t, rules([["/old", "/target"]]), sources));
  const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");
  const htmlBody = await (await p.request("/old")).text();
  assert.equal((await p.request("/old")).headers.get("X-OpenClaw-Docs-Cache"), "HIT");
  const first = await servesMarkdown(p, "/old.md", "/target.md");
  assert.equal(first.headers.get("X-OpenClaw-Docs-Cache"), "MISS");
  const warm = await servesMarkdown(p, "/old", "/target.md", { accept: "text/markdown" });
  assert.equal(warm.headers.get("X-OpenClaw-Docs-Cache"), "HIT");
  const canonical = await servesMarkdown(p, "/target.md", "/target.md");
  assert.equal(canonical.headers.get("X-OpenClaw-Docs-Cache"), "HIT");
  assert.equal(p.calls.filter((call) => call === "GET target.md").length, 1);
  const canonicalHtml = await p.request("/target");
  assert.match(canonicalHtml.headers.get("Content-Type"), /^text\/html/);
  assert.match(await canonicalHtml.text(), /<!doctype html>/i);
  await servesMarkdown(p, "/other.md", "/other.md");
  p.entries.get("old").customMetadata["openclaw-markdown-target"] = "/other.md";
  for (const method of ["GET", "HEAD"]) {
    const start = p.calls.length;
    const alias = await servesMarkdown(p, "/old", "/other.md", { method, accept: "text/markdown" });
    await servesMarkdown(p, "/old.md", "/other.md", { method });
    assert.equal(p.calls.slice(start).filter((call) => call === "HEAD old").length, 2);
    if (method === "GET") assert.equal(alias.headers.get("X-OpenClaw-Docs-Cache"), "HIT");
  }
  const served = await servesMarkdown(p, "/old.md", "/other.md");
  for (const header of ["Cache-Control", "CDN-Cache-Control", "Cloudflare-CDN-Cache-Control"]) {
    assert.equal(served.headers.get(header), canonical.headers.get(header));
  }
  const cachedHtml = await p.request("/old");
  assert.equal(cachedHtml.headers.get("X-OpenClaw-Docs-Cache"), "HIT");
  assert.match(cachedHtml.headers.get("Content-Type"), /^text\/html/);
  assert.equal(await cachedHtml.text(), htmlBody);
  assert.equal(p.cache.has("https://docs.openclaw.ai/old.md"), false);
  assert.equal(await p.cache.get("https://docs.openclaw.ai/target.md").clone().text(), sources["target.md"]);
  assert.equal(await p.cache.get("https://docs.openclaw.ai/other.md").clone().text(), sources["other.md"]);
  delete p.entries.get("old").customMetadata;
  assert.equal((await p.request("/old.md")).status, 404);
  const negotiated = await p.request("/old", { accept: "text/markdown" });
  assert.equal(negotiated.status, 200);
  assert.match(negotiated.headers.get("Content-Type"), /^text\/html/);
  assert.equal((await p.request("/unknown.md")).status, 404);
  assert.equal((await p.request("/unknown", { accept: "text/markdown" })).status, 404);
  assert.deepEqual(Object.getOwnPropertyDescriptor(globalThis, "caches"), originalCaches);
});

test("chains resolve at build time without a small hop limit and terminal pages win", async (t) => {
  const redirects = Array.from({ length: 80 }, (_, index) => ({
    source: `/chain-${index}`, destination: index === 79 ? "/target?final=1#part" : `/chain-${index + 1}`,
  }));
  redirects.push(...rules([
    ["/query-chain", "/chain-0?initial=1#initial"], ["/carry", "/plain?initial=1#part"],
    ["/plain", "/target"], ["/target", "/chain-0"],
    ["/same", "/target"], ["/same", "/target"],
  ]));
  const p = pipeline(fixture(t, redirects, sources));
  for (const [alias, canonicalPath, htmlDestination] of [
    ["/chain-0", "/target.md", "/target?final=1#part"],
    ["/de/chain-0", "/de/target.md", "/de/target?final=1#part"],
    ["/query-chain", "/target.md", "/target?final=1#part"],
    ["/carry", "/target.md", "/target?initial=1#part"],
  ]) {
    await servesMarkdown(p, `${alias}.md?incoming=1`, canonicalPath);
    const html = await p.request(`${alias}?incoming=1`);
    assert.ok((await html.text()).includes(`location.replace(${JSON.stringify(htmlDestination)})`));
  }
  await servesMarkdown(p, "/target.md", "/target.md");
});

for (const [name, redirects, diagnostic] of [
  ["cycle", [["/a", "/b"], ["/b", "/a"]], /Redirect cycle: .*a.*b.*a/],
  ["self cycle", [["/self", "/self"]], /Redirect cycle: \/self -> \/self/],
  ["duplicate", [["/same", "/target"], ["/same", "/other"]], /Conflicting redirect rules for \/same/],
  ["missing terminal", [["/old", "/missing"]], /no terminal Markdown page: \/old -> \/missing/],
  ["wildcard source", [["/wild/*", "/target"]], /Unsafe redirect path/],
  ["wildcard destination", [["/old", "/target/*"]], /Unsupported redirect destination/],
  ["unsafe scheme", [["/old", "javascript:alert(1)"]], /Unsupported redirect destination/],
  ["traversal", [["/../../escaped", "/target"]], /Unsafe redirect path/],
  ["encoded traversal", [["/%2e%2e/escaped", "/target"]], /Unsafe redirect path/],
  ["backslash", [["/..\\escaped", "/target"]], /Unsafe redirect path/],
  ["generated prefix conflict", [["/old", "/target"], ["/docs/old", "/other"]], /Conflicting generated redirects for \/docs\/old/],
]) {
  test(`rejects ${name} with a useful diagnostic`, (t) => {
    const f = fixture(t, rules(redirects), sources);
    const result = f.build();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, diagnostic);
    assert.equal(fs.existsSync(path.join(f.root, "escaped/index.html")), false);
    assert.equal(fs.existsSync(path.join(f.root, "dist/docs-markdown-redirects.json")), false);
  });
}

test("external and non-page destinations retain HTML behavior without Markdown metadata", async (t) => {
  const p = pipeline(fixture(t, rules([
    ["/external", "https://example.org/new?x=1#part"], ["/network", "//example.org/new"],
    ["/asset", "/assets/image.png"], ["/external-chain", "/external"],
  ]), sources, "/manual"));
  for (const [alias, target] of [
    ["/external", "https://example.org/new?x=1#part"], ["/network", "//example.org/new"],
    ["/asset", "/manual/assets/image.png"], ["/external-chain", "https://example.org/new?x=1#part"],
  ]) {
    const response = await p.request(alias);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes(`location.replace(${JSON.stringify(target)})`));
    assert.equal(p.entries.get(alias.slice(1)).customMetadata, undefined);
    assert.equal((await p.request(`${alias}.md`)).status, 404);
    assert.match((await p.request(alias, { accept: "text/markdown" })).headers.get("Content-Type"), /^text\/html/);
  }
});

test("redirect sidecar is deterministic, reset for preview, and never served", (t) => {
  const f = fixture(t, rules([["/old", "/target"]]), sources);
  const p = pipeline(f);
  const sidecar = path.join(f.root, "dist/docs-markdown-redirects.json");
  const first = fs.readFileSync(sidecar, "utf8");
  assert.equal(f.build().status, 0);
  assert.equal(fs.readFileSync(sidecar, "utf8"), first);
  assert.equal(f.build({ DOCS_SITE_PREVIEW_LOCALE: "en" }).status, 0);
  assert.equal(fs.existsSync(sidecar), false);
  assert.ok(f.prepare().entries.every((entry) => !entry.customMetadata));
  assert.ok(p.manifest.entries.every((entry) => !entry.key.includes("markdown-redirects")));
});

test("preparation refuses redirects whose canonical Markdown was removed from the artifact", (t) => {
  const f = fixture(t, rules([["/old", "/target"]]), sources);
  assert.equal(f.build().status, 0);
  fs.unlinkSync(path.join(f.root, "dist/docs-site/target.md"));
  const result = run(f.root, "r2-prepare.mjs");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Markdown redirect .* has no published target: \/target.md/);
});
