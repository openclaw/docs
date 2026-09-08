import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createMarkdownRenderer, renderMdxish } from "./mdx-ish.mjs";
import { createRenderCache } from "./render-cache.mjs";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

test("article cache reuses exact input, invalidates changes and recovers interrupted writes", (t) => {
  const f = fixture(t);
  const directory = path.join(f.root, ".cache/docs-render");
  const md = createMarkdownRenderer();
  let calls = 0;
  const render = (source, options) => { calls++; return renderMdxish(source, md, options); };
  const options = { root: f.root, sourceFile: path.join(f.root, "docs/guide.md"), pageRoute: "/guide" };
  const source = "## Heading\n\n[Next](./next.md)\n\n```js\nconst value = 1;\n```\n";
  const cache = createRenderCache(directory, render, "renderer-1");
  assert.equal(cache.render(source, options), renderMdxish(source, md, options));
  const restored = createRenderCache(directory, render, "renderer-1");
  assert.equal(restored.render(source, options), renderMdxish(source, md, options));
  assert.equal(calls, 1, "a new cache instance reuses the on-disk entry");
  const changed = source.replace("value = 1", "value = 2");
  assert.equal(restored.render(changed, options), renderMdxish(changed, md, options));
  assert.equal(calls, 2);
  for (const altered of [{ ...options, pageRoute: "/nested/guide" }, { ...options, sourceFile: path.join(f.root, "docs/moved.md") }]) {
    assert.equal(restored.render(changed, altered), renderMdxish(changed, md, altered));
  }
  assert.equal(calls, 4, "route and source path are part of cache identity");
  const upgraded = createRenderCache(directory, render, "renderer-2");
  upgraded.render(changed, options);
  assert.equal(calls, 5, "renderer changes invalidate old entries");
  upgraded.prune();
  assert.equal(fs.readdirSync(directory).length, 1, "obsolete identities are pruned");
  fs.writeFileSync(path.join(directory, fs.readdirSync(directory)[0]), '{"input":');
  assert.equal(upgraded.render(changed, options), renderMdxish(changed, md, options));
  assert.equal(calls, 6, "truncated entries are rendered again");
});

test("snippet owners always observe nested edits and newly created dependencies", (t) => {
  const f = fixture(t);
  const md = createMarkdownRenderer();
  const cache = createRenderCache(path.join(f.root, ".cache/docs-render"), (source, options) => renderMdxish(source, md, options));
  const options = { root: f.root, sourceFile: path.join(f.root, "docs/guide.md"), pageRoute: "/guide" };
  const source = '<Snippet file="outer.md" />';
  write(f.root, "docs/outer.md", '<Snippet file="inner.md" />');
  assert.doesNotMatch(cache.render(source, options), /Current|Updated/);
  write(f.root, "docs/inner.md", "Current snippet");
  assert.match(cache.render(source, options), /Current snippet/);
  write(f.root, "docs/inner.md", "Updated snippet");
  assert.match(cache.render(source, options), /Updated snippet/);
  assert.deepEqual(cache.stats, { hits: 0, misses: 0, bypassed: 3 });
});

test("warm builds refresh navigation, locale links and deletions outside cached articles", (t) => {
  const f = fixture(t, [], { "guide.md": "# Guide\n\n[Target](/target)\n", "target.md": "# Target\n", "de/guide.md": "# Anleitung\n\n[Target](/target)\n" });
  const config = (title, slugs) => ({ name: "Cache fixture", navigation: { languages: ["en", "de"].map((language) => ({ language, tabs: [{ tab: title, groups: [{ group: "Guides", pages: slugs }] }] })) } });
  write(f.root, "docs/docs.json", JSON.stringify(config("Before", ["guide", "target"])));
  let built = f.build();
  assert.equal(built.status, 0, built.stderr);
  const html = (rel) => fs.readFileSync(path.join(f.root, "dist/docs-site", rel, "index.html"), "utf8");
  assert.match(html("de/guide"), /href="\/target">Target/);
  write(f.root, "docs/de/target.md", "# Ziel\n");
  write(f.root, "docs/docs.json", JSON.stringify(config("After", ["guide", "target"])));
  built = f.build();
  assert.equal(built.status, 0, built.stderr);
  assert.match(built.stdout, /article cache: [1-9]\d* reused/);
  assert.match(html("de/guide"), /href="\/de\/target">Target/);
  assert.match(html("guide"), /After/);
  assert.doesNotMatch(html("guide"), />Before</);
  fs.rmSync(path.join(f.root, "docs/de/target.md"));
  built = f.build();
  assert.equal(built.status, 0, built.stderr);
  assert.equal(fs.existsSync(path.join(f.root, "dist/docs-site/de/target/index.html")), false);
  assert.match(html("de/guide"), /href="\/target">Target/);
});
