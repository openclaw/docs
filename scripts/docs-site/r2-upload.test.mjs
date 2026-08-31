import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fixture, servesMarkdown, pipeline, run, write } from "./test-helpers/redirect-fixture.mjs";

const metadata = (target) => target ? { "openclaw-markdown-target": target } : undefined;
const manifest = (entries) => ({ version: 1, entries, objectCount: entries.length });

function uploadFixture(t) {
  const f = fixture(t);
  const body = "<html>Identical redirect bytes</html>";
  write(f.root, "files/redirect.html", body);
  const entry = (key, target) => ({
    key, sourceKey: key, file: "files/redirect.html", size: Buffer.byteLength(body),
    contentType: "text/html; charset=utf-8", cacheControl: "public, max-age=60",
    sha256: crypto.createHash("sha256").update(body).digest("hex"),
    md5: crypto.createHash("md5").update(body).digest("hex"),
    ...(target ? { customMetadata: metadata(target) } : {}),
  });
  const local = [entry("add", "/target.md"), entry("change", "/new.md?lang=de#part"), entry("remove"), entry("same", "/same.md")];
  const old = [entry("add"), entry("change", "/old.md#part"), entry("remove", "/old.md"), entry("same", "/same.md")];
  return { ...f, local, old };
}

function dryUpload(root, local, remote, env = {}) {
  write(root, "dist/local.json", JSON.stringify(manifest(local)));
  write(root, "dist/remote.json", JSON.stringify(manifest(remote)));
  return run(root, "r2-upload.mjs", {
    R2_UPLOAD_DRY_RUN: "1", R2_UPLOAD_MANIFEST_PATH: "dist/local.json",
    R2_UPLOAD_REMOTE_MANIFEST_PATH: "dist/remote.json", ...env,
  });
}

function puts(output) {
  return [...output.matchAll(/^r2 dry-run put: (.+)$/gm)].map((match) => match[1])
    .filter((key) => key !== ".openclaw-docs-r2-manifest.json").sort();
}

test("manifest diff detects metadata additions, changes and removals with identical HTML hashes", (t) => {
  const f = uploadFixture(t);
  const result = dryUpload(f.root, f.local, f.old);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(puts(result.stdout), ["add", "change", "remove"]);
  assert.match(result.stdout, /markdown_target=3/);
  const unchanged = dryUpload(f.root, f.local, f.local);
  assert.equal(unchanged.status, 0, unchanged.stderr);
  assert.deepEqual(puts(unchanged.stdout), []);
});

for (const mode of ["manifest", "head", "head-error"]) {
  test(`${mode} audit uploads metadata add/change/remove despite unchanged ETags using only mocked fetch`, (t) => {
    const f = uploadFixture(t);
    write(f.root, "dist/local.json", JSON.stringify(manifest(f.local)));
    // Matching remote manifest makes HEAD solely responsible for finding drift.
    write(f.root, "dist/remote.json", JSON.stringify(manifest(mode === "head" ? f.local : f.old)));
    write(f.root, "heads.json", JSON.stringify(f.old));
    write(f.root, "mock-fetch.mjs", `
import assert from "node:assert/strict";
import fs from "node:fs";
const heads = new Map(JSON.parse(fs.readFileSync("heads.json", "utf8")).map(entry => [entry.key, entry]));
const calls = [];
globalThis.fetch = async (input, init) => {
  const url = new URL(input);
  assert.equal(url.origin, "https://synthetic-r2.invalid");
  assert.ok(url.pathname.startsWith("/synthetic-bucket/"));
  const key = decodeURIComponent(url.pathname.slice("/synthetic-bucket/".length));
  const headers = new Headers(init.headers);
  calls.push({ method: init.method, key, target: headers.get("x-amz-meta-openclaw-markdown-target") });
  fs.writeFileSync("calls.json", JSON.stringify(calls));
  if (init.method === "HEAD") {
    assert.ok(heads.has(key), key);
    if (${mode === "head-error"}) return new Response(null, { status: 503 });
    const entry = heads.get(key);
    const target = entry.customMetadata?.["openclaw-markdown-target"];
    return new Response(null, { headers: {
      "Content-Type": entry.contentType, "Cache-Control": entry.cacheControl,
      "Content-Length": String(entry.size), ETag: '"' + entry.md5 + '"',
      ...(target ? { "x-amz-meta-openclaw-markdown-target": target } : {}),
    } });
  }
  assert.equal(init.method, "PUT");
  assert.ok(heads.has(key) || key === ".openclaw-docs-r2-manifest.json", key);
  return new Response(null, { status: 200 });
};
`);
    const result = run(f.root, "r2-upload.mjs", {
      R2_UPLOAD_MANIFEST_PATH: "dist/local.json", R2_UPLOAD_REMOTE_MANIFEST_PATH: "dist/remote.json",
      R2_UPLOAD_FULL_REFRESH: mode === "manifest" ? "0" : "1", R2_DELETE_ORPHANS: "0",
      R2_UPLOAD_RETRIES: "0", OPENCLAW_R2_S3_ENDPOINT: "https://synthetic-r2.invalid",
      CLOUDFLARE_R2_BUCKET: "synthetic-bucket", OPENCLAW_R2_ACCESS_KEY_ID: "synthetic-access",
      OPENCLAW_R2_SECRET_ACCESS_KEY: "synthetic-secret",
    }, [path.join(f.root, "mock-fetch.mjs")]);
    assert.equal(result.status, 0, result.stderr);
    const calls = JSON.parse(fs.readFileSync(path.join(f.root, "calls.json"), "utf8"));
    const uploaded = calls.filter((call) => call.method === "PUT" && !call.key.startsWith(".openclaw"));
    assert.deepEqual(uploaded.map((call) => call.key).sort(), ["add", "change", "remove"]);
    for (const call of uploaded) {
      assert.equal(call.target, f.local.find((entry) => entry.key === call.key).customMetadata?.["openclaw-markdown-target"] ?? null);
    }
    assert.equal(calls.filter((call) => call.method === "HEAD").length, mode === "manifest" ? 0 : 4);
    if (mode === "head-error") assert.match(result.stderr, /falling back to manifest comparison/);
  });
}

test("translation page/locale scopes own affected aliases and compatibility prefixes without publishing unrelated pages", async (t) => {
  const f = fixture(t, [
    { source: "/old", destination: "/target#part" },
    { source: "/other-old", destination: "/other" },
    { source: "/explicit", destination: "/de/target#part" },
    { source: "/nested-old", destination: "/section/index" },
    { source: "/root-old", destination: "/" },
  ], {
    "target.md": "# Target\n", "other.md": "# Other\n", "section/index.md": "# Section\n",
    "de/index.md": "# Deutsch\n", "de/old.md": "# Existing source\n",
    "de/other.md": "# Andere\n", "fr/index.md": "# Français\n",
  }, "/manual");
  const before = pipeline(f);
  assert.equal((await before.request("/de/old.md")).status, 200);
  await servesMarkdown(before, "/manual/de/old.md", "/target.md");
  write(f.root, "docs/de/target.md", "# Ziel\n");
  write(f.root, "docs/de/section/index.md", "# Abschnitt\n");
  const after = pipeline(f);
  const scoped = (scope, page = "target.md") => dryUpload(f.root, after.manifest.entries, before.manifest.entries, {
    R2_UPLOAD_SCOPE: scope, R2_UPLOAD_LOCALE: "de", R2_UPLOAD_PAGE_PATH: page, R2_UPLOAD_PUT_ALL: "1",
  });
  const page = scoped("page");
  assert.equal(page.status, 0, page.stderr);
  const expected = ["de/target", "de/target/index.html", "de/target.md"];
  for (const prefix of ["", "docs/", "manual/"]) {
    for (const alias of ["de/old", "explicit", "de/explicit", "fr/explicit"]) {
      if (prefix === "" && alias === "de/old") continue;
      expected.push(`${prefix}${alias}`, `${prefix}${alias}/index.html`);
    }
  }
  assert.deepEqual(puts(page.stdout), expected.sort());
  const merged = JSON.parse(fs.readFileSync(path.join(f.root, "dist/docs-r2-manifest.page.merged.json"), "utf8"));
  // Serve through the partially published manifest, not the full new build.
  after.entries.clear();
  for (const entry of merged.entries) after.entries.set(entry.key, entry);
  await servesMarkdown(after, "/manual/de/old.md", "/de/target.md");
  await servesMarkdown(after, "/docs/fr/explicit.md", "/de/target.md");
  assert.equal(after.entries.has("de/section.md"), false);

  const locale = scoped("locale");
  assert.equal(locale.status, 0, locale.stderr);
  assert.ok(puts(locale.stdout).includes("docs/de/nested-old"));
  assert.ok(puts(locale.stdout).includes("manual/fr/explicit"));
  assert.ok(!puts(locale.stdout).includes("fr/other-old"));
  assert.ok(!puts(locale.stdout).includes("target.md"));
  assert.ok(!puts(locale.stdout).includes("other.md"));

  for (const [pagePath, markdownKey, alias] of [
    ["section/index.md", "de/section.md", "manual/de/nested-old"],
    ["index.md", "de/index.md", "docs/de/root-old"],
  ]) {
    const result = scoped("page", pagePath);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(puts(result.stdout).includes(markdownKey));
    assert.ok(puts(result.stdout).includes(alias));
    assert.ok(!puts(result.stdout).includes("de/target.md"));
  }

  // Reverting to fallback must also select aliases by their previous target.
  const fallback = dryUpload(f.root, before.manifest.entries, after.manifest.entries, {
    R2_UPLOAD_SCOPE: "page", R2_UPLOAD_LOCALE: "de", R2_UPLOAD_PAGE_PATH: "target",
  });
  assert.equal(fallback.status, 0, fallback.stderr);
  assert.deepEqual(puts(fallback.stdout), expected.filter((key) => !key.startsWith("de/target")));
});

test("shell scope selects both physical and virtual redirect objects for metadata-only changes", (t) => {
  const f = uploadFixture(t);
  const local = [
    { ...f.local[0], key: "old" }, { ...f.local[0], key: "old/index.html" },
    { ...f.local[0], key: "docs/old" }, { ...f.local[0], key: "docs/old/index.html" },
  ];
  const old = local.map(({ customMetadata, ...entry }) => entry);
  const result = dryUpload(f.root, local, old, { R2_UPLOAD_SCOPE: "shell" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(puts(result.stdout), local.map((entry) => entry.key).sort());
});
