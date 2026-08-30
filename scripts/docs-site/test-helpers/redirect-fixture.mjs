import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../../../workers/docs-router.ts";

export const repo = fileURLToPath(new URL("../../../", import.meta.url));

export function write(root, name, content) {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

export function run(root, script, env = {}, imports = []) {
  return spawnSync(process.execPath, [
    "--import", path.join(root, "no-network.mjs"),
    ...imports.flatMap((file) => ["--import", file]),
    path.join(repo, "scripts/docs-site", script),
  ], {
    cwd: root,
    env: { PATH: process.env.PATH, ...env },
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
}

export function fixture(t, redirects = [], sources = {}, basePath = "") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-markdown-redirect-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(root, "no-network.mjs", 'globalThis.fetch = () => { throw new Error("Unexpected outbound fetch"); };\n');
  fs.mkdirSync(path.join(root, "scripts"));
  fs.symlinkSync(path.join(repo, "scripts/docs-site"), path.join(root, "scripts/docs-site"), "dir");
  write(root, "docs/docs.json", JSON.stringify({
    name: "Redirect fixture",
    navigation: { languages: ["en", "de", "fr"].map((language) => ({ language, tabs: [] })) },
    redirects,
  }));
  for (const [name, content] of Object.entries({ "index.md": "# Root\n", ...sources })) {
    write(root, `docs/${name}`, content);
  }
  const env = { DOCS_SITE_ARTIFACT_MODE: "shell", DOCS_SITE_BASE_PATH: basePath };
  const build = (extra = {}) => run(root, "build.mjs", { ...env, ...extra });
  const prepare = () => {
    const result = run(root, "r2-prepare.mjs");
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(fs.readFileSync(path.join(root, "dist/docs-r2-manifest.json"), "utf8"));
  };
  return { root, build, prepare };
}

export function pipeline(f) {
  const built = f.build();
  assert.equal(built.status, 0, built.stderr);
  const manifest = f.prepare();
  const entries = new Map(manifest.entries.map((entry) => [entry.key, entry]));
  const cache = new Map();
  const calls = [];
  const pending = [];
  const object = (key, method) => {
    calls.push(`${method} ${key}`);
    const entry = entries.get(key);
    if (!entry) return null;
    const bytes = fs.readFileSync(path.join(f.root, entry.file));
    return {
      body: bytes, size: bytes.length, httpEtag: `"${entry.md5}"`,
      customMetadata: { "openclaw-sha256": entry.sha256, ...entry.customMetadata },
      writeHttpMetadata(headers) {
        headers.set("Content-Type", entry.contentType);
        headers.set("Cache-Control", entry.cacheControl);
      },
    };
  };
  const env = { DOCS_BUCKET: {
    get: async (key) => object(key, "GET"), head: async (key) => object(key, "HEAD"),
  } };
  return {
    ...f, manifest, entries, calls, cache,
    async request(route, { method = "GET", accept = "text/html" } = {}) {
      const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");
      globalThis.caches = { default: {
        match: async (request) => cache.get(request.url)?.clone(),
        put: async (request, response) => { cache.set(request.url, response.clone()); },
      } };
      try {
        const response = await worker.fetch(new Request(new URL(route, "https://docs.openclaw.ai"), {
          method, headers: { Accept: accept },
        }), env, { waitUntil(promise) { pending.push(promise); } });
        await Promise.all(pending.splice(0));
        return response;
      } finally {
        if (originalCaches) Object.defineProperty(globalThis, "caches", originalCaches);
        else delete globalThis.caches;
      }
    },
  };
}

export async function servesMarkdown(p, route, canonicalPath, options = {}) {
  const response = await p.request(route, options);
  assert.equal(response.status, 200, `${route} must serve Markdown in the first response`);
  assert.equal(response.headers.get("Content-Type"), "text/markdown; charset=utf-8", route);
  assert.equal(response.headers.get("Location"), null, route);
  assert.match(response.headers.get("Vary"), /(?:^|,\s*)Accept(?:,|$)/, route);
  const canonical = p.entries.get(canonicalPath.slice(1));
  assert.ok(canonical, `published canonical object ${canonicalPath}`);
  assert.equal(await response.text(), options.method === "HEAD" ? ""
    : fs.readFileSync(path.join(p.root, canonical.file), "utf8"), route);
  return response;
}
