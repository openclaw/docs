#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "dist", "docs-site");
const manifestPath = path.join(root, "dist", "docs-r2-manifest.json");
const redirectMetadataPath = path.join(root, "dist", "docs-markdown-redirects.json");
const markdownRedirects = fs.existsSync(redirectMetadataPath)
  ? JSON.parse(fs.readFileSync(redirectMetadataPath, "utf8")) : {};

if (!fs.existsSync(sourceDir)) throw new Error("dist/docs-site does not exist; run docs:build first");

// The uploader reads entry.file directly. Keep the checked build in place
// through upload instead of copying it into another full artifact tree.
const entries = [];
const aliases = [];
let physicalFiles = 0;
for (const file of walk(sourceDir)) {
  physicalFiles++;
  const key = toKey(path.relative(sourceDir, file));
  if (key === "_headers") continue;
  const entry = entryFor(key, file, key);
  entries.push(entry);
  if (key.endsWith("/index.html")) {
    // Aliases publish the same bytes and metadata under a second object key.
    aliases.push({ ...entry, key: key.slice(0, -"/index.html".length) });
  }
}
entries.push(...aliases);

entries.sort((a, b) => a.key.localeCompare(b.key));

const markdownKeys = new Set(entries.filter((entry) => entry.contentType === "text/markdown; charset=utf-8").map((entry) => entry.key));
for (const entry of entries) {
  const target = entry.customMetadata?.["openclaw-markdown-target"];
  if (target && !markdownKeys.has(target.split(/[?#]/u)[0].slice(1))) {
    throw new Error(`Markdown redirect ${entry.key} has no published target: ${target}`);
  }
}

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  sourceDir: "dist/docs-site",
  outputDir: "dist/docs-site",
  objectCount: entries.length,
  entries,
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const virtualFiles = entries.length - physicalFiles;
console.log(`r2 prepare ok: ${physicalFiles} files, ${virtualFiles} slashless html aliases, ${entries.length} objects`);

function entryFor(key, file, sourceKey) {
  const data = fs.readFileSync(file);
  const metadataKey = sourceKey.endsWith("/index.html") ? sourceKey : key;
  return {
    key,
    sourceKey,
    file: toKey(path.relative(root, file)),
    size: data.byteLength,
    md5: crypto.createHash("md5").update(data).digest("hex"),
    sha256: crypto.createHash("sha256").update(data).digest("hex"),
    contentType: contentTypeFor(metadataKey),
    cacheControl: cacheControlFor(metadataKey),
    ...(markdownRedirects[sourceKey] ? {
      customMetadata: { "openclaw-markdown-target": markdownRedirects[sourceKey] },
    } : {}),
  };
}

function contentTypeFor(key) {
  const ext = path.extname(key).toLowerCase();
  if (!ext || key.endsWith("/index.html")) return "text/html; charset=utf-8";
  switch (ext) {
    case ".avif": return "image/avif";
    case ".css": return "text/css; charset=utf-8";
    case ".gif": return "image/gif";
    case ".html": return "text/html; charset=utf-8";
    case ".ico": return "image/x-icon";
    case ".jpeg":
    case ".jpg": return "image/jpeg";
    case ".js":
    case ".mjs": return "text/javascript; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".jsonl": return "application/x-ndjson; charset=utf-8";
    case ".md": return "text/markdown; charset=utf-8";
    case ".png": return "image/png";
    case ".svg": return "image/svg+xml";
    case ".txt": return "text/plain; charset=utf-8";
    case ".webp": return "image/webp";
    case ".wasm": return "application/wasm";
    case ".xml": return "application/xml; charset=utf-8";
    default: return "application/octet-stream";
  }
}

function cacheControlFor(key) {
  if (key === "CNAME") return "public, max-age=300, s-maxage=300";
  if (key === "assets/docs-site.css" || key === "assets/docs-site.js") {
    return "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400";
  }
  if (key.endsWith(".html") || !path.extname(key)) {
    return "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800";
  }
  if (key.endsWith(".md") || key.endsWith(".txt") || key.endsWith(".json") || key.endsWith(".jsonl")) {
    return "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
  }
  return "public, max-age=31536000, immutable";
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

function toKey(value) {
  return value.split(path.sep).join("/");
}
