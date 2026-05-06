#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const bucket = process.env.CLOUDFLARE_R2_BUCKET || "openclaw-docs";
const manifestPath = path.join(root, "dist", "docs-r2-manifest.json");
const remoteManifestKey = ".openclaw-docs-r2-manifest.json";
const concurrency = Number.parseInt(process.env.R2_UPLOAD_CONCURRENCY || "8", 10);

if (!Number.isFinite(concurrency) || concurrency < 1) throw new Error("R2_UPLOAD_CONCURRENCY must be a positive integer");
if (!fs.existsSync(manifestPath)) throw new Error("dist/docs-r2-manifest.json does not exist; run docs:build:r2 first");
if (!process.env.CLOUDFLARE_API_TOKEN) throw new Error("CLOUDFLARE_API_TOKEN is required");
if (!process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error("CLOUDFLARE_ACCOUNT_ID is required");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const remoteManifest = await getRemoteManifest();
const remoteEntries = new Map((remoteManifest?.entries || []).map((entry) => [entry.key, entry]));
const changed = manifest.entries.filter((entry) => {
  const remote = remoteEntries.get(entry.key);
  return !remote
    || remote.sha256 !== entry.sha256
    || remote.contentType !== entry.contentType
    || remote.cacheControl !== entry.cacheControl;
});

console.log(`r2 upload plan: ${changed.length}/${manifest.entries.length} changed objects for ${bucket}`);
await uploadEntries(changed);
await putObject({
  key: remoteManifestKey,
  file: manifestPath,
  contentType: "application/json; charset=utf-8",
  cacheControl: "private, max-age=0, no-store",
});
console.log(`r2 upload ok: ${changed.length} changed objects plus ${remoteManifestKey}`);

async function getRemoteManifest() {
  const tempFile = path.join(os.tmpdir(), `openclaw-docs-r2-manifest-${process.pid}.json`);
  try {
    const result = await runWrangler([
      "r2",
      "object",
      "get",
      `${bucket}/${remoteManifestKey}`,
      "--file",
      tempFile,
      "--remote",
    ], { quiet: true, allowFailure: true });
    if (result.code !== 0 || !fs.existsSync(tempFile)) return null;
    return JSON.parse(fs.readFileSync(tempFile, "utf8"));
  } catch {
    return null;
  } finally {
    fs.rmSync(tempFile, { force: true });
  }
}

async function uploadEntries(entries) {
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, entries.length) }, async () => {
    while (next < entries.length) {
      const entry = entries[next++];
      await putObject(entry);
    }
  });
  await Promise.all(workers);
}

async function putObject(entry) {
  const args = [
    "r2",
    "object",
    "put",
    `${bucket}/${entry.key}`,
    "--file",
    path.isAbsolute(entry.file) ? entry.file : path.join(root, entry.file),
    "--content-type",
    entry.contentType,
    "--cache-control",
    entry.cacheControl,
    "--remote",
    "--force",
  ];
  const result = await runWrangler(args);
  if (result.code !== 0) throw new Error(`wrangler failed uploading ${entry.key}`);
}

function runWrangler(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["wrangler@4.88.0", ...args], {
      cwd: root,
      env: process.env,
      stdio: options.quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let output = "";
    if (options.quiet) {
      child.stdout.on("data", (chunk) => { output += chunk; });
      child.stderr.on("data", (chunk) => { output += chunk; });
    }
    child.on("close", (code) => {
      if (code !== 0 && !options.allowFailure && options.quiet) process.stderr.write(output);
      resolve({ code, output });
    });
  });
}
