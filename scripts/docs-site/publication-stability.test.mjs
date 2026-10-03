import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fixture, repo, run, write } from "./test-helpers/redirect-fixture.mjs";
import { siteJs } from "./site-js.mjs";

test("runtime identity hashes the executed source, including analytics and lazy dependencies", () => {
  const js = siteJs();
  const [header, ...lines] = js.split("\n");
  const source = lines.join("\n");
  const hash = createHash("sha256").update(source).digest("hex").slice(0, 12);
  assert.equal(header, `const docsRuntimeRelease="js-${hash}";`);
  assert.match(source, /function createDocsAnalytics\(/);
  assert.match(source, /function initDocsAnalyticsConsent\(/);
  assert.match(source, /web-vitals-[a-f0-9]{12}\.js/);
  assert.match(source, /G-3SK7X2YLSJ/);
});

test("commit-only builds preserve artifacts; two body edits change only their pages and search", (t) => {
  const f = fixture(t, [], {
    "one.md": "# First\n\nOriginal first body.\n",
    "two.md": "# Second\n\nOriginal second body.\n",
  });
  const site = path.join(f.root, "dist/docs-site");
  function build(sha) {
    const env = { DOCS_SITE_GA4_ENABLED: "1", GITHUB_SHA: sha };
    for (const script of ["build.mjs", "search-index.mjs"]) {
      const result = run(f.root, script, env);
      assert.equal(result.status, 0, result.stderr);
    }
    const pagefind = spawnSync(path.join(repo, "node_modules/.bin/pagefind"), ["--site", site], {
      env: { PATH: process.env.PATH }, encoding: "utf8",
    });
    assert.equal(pagefind.status, 0, pagefind.stderr);
    for (const script of ["pagefind-normalize.mjs", "r2-prepare.mjs"]) {
      const result = run(f.root, script, env);
      assert.equal(result.status, 0, result.stderr);
    }
    return JSON.parse(fs.readFileSync(path.join(f.root, "dist/docs-r2-manifest.json"), "utf8"));
  }
  const first = build("a".repeat(40));
  const second = build("b".repeat(40));
  assert.equal(first.buildCommit, "a".repeat(40));
  assert.equal(second.buildCommit, "b".repeat(40));
  assert.deepEqual(second.entries, first.entries, "all HTML, search, assets and metadata are identical");
  const home = fs.readFileSync(path.join(site, "index.html"), "utf8");
  assert.match(home, /data-analytics-path="\/"/);
  assert.doesNotMatch(home, /data-analytics-release/);

  const dryUpload = (previous, scope = "all") => {
    write(f.root, "dist/previous.json", JSON.stringify(previous));
    const result = run(f.root, "r2-upload.mjs", {
      R2_UPLOAD_DRY_RUN: "1", R2_UPLOAD_REMOTE_MANIFEST_PATH: "dist/previous.json",
      R2_UPLOAD_SCOPE: scope,
    });
    assert.equal(result.status, 0, result.stderr);
    return [...result.stdout.matchAll(/^r2 dry-run put: (\S+)/gm)].map(match => match[1])
      .filter(key => key !== ".openclaw-docs-r2-manifest.json");
  };
  assert.deepEqual(dryUpload(first), [], "commit-only publication updates the catalog alone");
  const olderSearch = { ...first, entries: first.entries.map(entry => entry.key === "docs-search.json"
    ? { ...entry, sha256: "d".repeat(64) } : entry) };
  assert.deepEqual(dryUpload(olderSearch, "shell"), []);
  const merged = JSON.parse(fs.readFileSync(path.join(f.root, "dist/docs-r2-manifest.shell.merged.json"), "utf8"));
  assert.equal(merged.buildCommit, second.buildCommit, "final partial catalog retains incoming build provenance");
  assert.equal(merged.entries.find(entry => entry.key === "docs-search.json").sha256, "d".repeat(64),
    "retained out-of-scope objects keep their actual older identity");
  write(f.root, "docs/one.md", "# First\n\nChanged first body.\n");
  write(f.root, "docs/two.md", "# Second\n\nChanged second body.\n");
  const third = build("c".repeat(40));
  assert.equal(third.buildCommit, "c".repeat(40));
  const changed = dryUpload(second);
  assert.deepEqual(changed.filter(key => !key.startsWith("pagefind/")), [
    "docs-search.json", "one.md", "two.md", "one", "one/index.html", "two", "two/index.html",
  ]);
  assert.ok(changed.some(key => key.startsWith("pagefind/")), "the native search index reflects edited bodies");
  assert.equal(fs.readFileSync(path.join(site, "index.html"), "utf8"), home);
});
