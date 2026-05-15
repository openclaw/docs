#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bucket = process.env.CLOUDFLARE_R2_BUCKET || "openclaw-docs";
const manifestPath = path.join(root, "dist", "docs-r2-manifest.json");
const remoteManifestKey = ".openclaw-docs-r2-manifest.json";
const concurrency = Number.parseInt(process.env.R2_UPLOAD_CONCURRENCY || "8", 10);
const refreshConcurrency = Number.parseInt(process.env.R2_REFRESH_CONCURRENCY || String(Math.min(concurrency, 16)), 10);
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.OPENCLAW_CLOUDFLARE_ACCOUNT_ID || process.env.OPENCLAW_R2_ACCOUNT_ID;
const endpoint = process.env.OPENCLAW_R2_S3_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
const accessKeyId = process.env.OPENCLAW_R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.OPENCLAW_R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.OPENCLAW_R2_REGION || "auto";
const service = "s3";
const retryAttempts = Number.parseInt(process.env.R2_UPLOAD_RETRIES || "5", 10);
const deleteOrphans = process.env.R2_DELETE_ORPHANS !== "0";
const fullRefresh = process.env.R2_UPLOAD_FORCE === "1" || process.env.R2_UPLOAD_FULL_REFRESH === "1";
const putAll = process.env.R2_UPLOAD_PUT_ALL === "1";
const dryRun = process.env.R2_UPLOAD_DRY_RUN === "1";
const remoteManifestPath = process.env.R2_UPLOAD_REMOTE_MANIFEST_PATH || "";

if (!Number.isFinite(concurrency) || concurrency < 1) throw new Error("R2_UPLOAD_CONCURRENCY must be a positive integer");
if (!Number.isFinite(refreshConcurrency) || refreshConcurrency < 1) throw new Error("R2_REFRESH_CONCURRENCY must be a positive integer");
if (!fs.existsSync(manifestPath)) throw new Error("dist/docs-r2-manifest.json does not exist; run docs:build:r2 first");
if (!dryRun && !endpoint) throw new Error("OPENCLAW_R2_S3_ENDPOINT or CLOUDFLARE_ACCOUNT_ID is required");
if (!dryRun && !accessKeyId) throw new Error("OPENCLAW_R2_ACCESS_KEY_ID or AWS_ACCESS_KEY_ID is required");
if (!dryRun && !secretAccessKey) throw new Error("OPENCLAW_R2_SECRET_ACCESS_KEY or AWS_SECRET_ACCESS_KEY is required");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!Array.isArray(manifest.entries)) throw new Error("dist/docs-r2-manifest.json must contain an entries array");
const remoteManifest = await getRemoteManifest();
const remoteEntries = new Map((remoteManifest?.entries || []).map((entry) => [entry.key, entry]));
const localKeys = new Set(manifest.entries.map((entry) => entry.key));
localKeys.add(remoteManifestKey);
const plan = await createUploadPlan(manifest.entries, remoteEntries);
const changed = plan.changed;
const manifestDeletedKeys = Array.from(remoteEntries.keys()).filter((key) => !localKeys.has(key));
const orphanedKeys = deleteOrphans && !dryRun ? (await listBucketKeys()).filter((key) => !localKeys.has(key)) : [];
const deleted = Array.from(new Set([...manifestDeletedKeys, ...orphanedKeys])).sort().map((key) => ({ key }));

console.log(formatRemoteManifestStatus(remoteManifest));
console.log(formatCacheStats(plan.stats));
console.log(
  `r2 upload plan: ${changed.length}/${manifest.entries.length} changed objects, ${deleted.length} deleted objects (${manifestDeletedKeys.length} from manifest, ${orphanedKeys.length} orphaned, fullRefresh=${fullRefresh}, putAll=${putAll}, dryRun=${dryRun}) for ${bucket}`,
);
await uploadEntries(changed);
await deleteEntries(deleted);
const manifestSha256 = sha256Hex(fs.readFileSync(manifestPath));
await putObject({
  key: remoteManifestKey,
  file: manifestPath,
  sha256: manifestSha256,
  contentType: "application/json; charset=utf-8",
  cacheControl: "private, max-age=0, no-store",
});
writeGithubSummary(plan.stats, deleted);
console.log(`r2 upload ok: ${changed.length} changed objects, ${deleted.length} deleted objects plus ${remoteManifestKey}`);

async function getRemoteManifest() {
  if (remoteManifestPath) {
    const file = path.isAbsolute(remoteManifestPath) ? remoteManifestPath : path.join(root, remoteManifestPath);
    return {
      source: "file",
      status: "hit",
      ...(JSON.parse(fs.readFileSync(file, "utf8"))),
    };
  }
  if (dryRun) return { entries: [], source: "dry-run", status: "missing" };
  const response = await signedFetchWithRetry("GET", remoteManifestKey);
  if (response.status === 404) return { entries: [], source: "r2", status: "missing" };
  if (!response.ok) throw new Error(`GET manifest failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  try {
    return { source: "r2", status: "hit", ...JSON.parse(text) };
  } catch (error) {
    throw new Error(`GET manifest returned invalid JSON; refusing to reupload the full docs tree: ${error.message}`);
  }
}

async function createUploadPlan(entries, remoteEntriesByKey) {
  if (putAll) return planFromManifest(entries, remoteEntriesByKey, "forced_put");
  if (fullRefresh && !dryRun) return await planWithRemoteHeads(entries, remoteEntriesByKey);
  return planFromManifest(entries, remoteEntriesByKey);
}

function planFromManifest(entries, remoteEntriesByKey, forcedReason) {
  const changed = [];
  const stats = createStats(entries.length);
  for (const entry of entries) {
    const reason = forcedReason || diffManifestEntry(remoteEntriesByKey.get(entry.key), entry);
    if (reason) {
      changed.push(entry);
      recordMiss(stats, reason);
    } else {
      recordHit(stats, "manifest");
    }
  }
  return { changed, stats };
}

async function planWithRemoteHeads(entries, remoteEntriesByKey) {
  const results = new Array(entries.length);
  let next = 0;
  let done = 0;
  const workers = Array.from({ length: Math.min(refreshConcurrency, entries.length) }, async () => {
    while (next < entries.length) {
      const index = next++;
      const entry = entries[index];
      const remote = remoteEntriesByKey.get(entry.key);
      const head = await headObject(entry);
      const reason = diffHeadEntry(head, remote, entry);
      results[index] = { entry, hitSource: reason ? "" : head.source, reason };
      done++;
      if (done % 1000 === 0 || done === entries.length) console.log(`r2 full refresh scan: ${done}/${entries.length}`);
    }
  });
  await Promise.all(workers);

  const stats = createStats(entries.length);
  const changed = [];
  for (const result of results) {
    if (result.reason) {
      changed.push(result.entry);
      recordMiss(stats, result.reason);
    } else {
      recordHit(stats, result.hitSource);
    }
  }
  return { changed, stats };
}

function diffManifestEntry(remote, entry) {
  if (!remote) return "missing";
  if (remote.sha256 !== entry.sha256) return "sha256";
  if (remote.contentType !== entry.contentType) return "content_type";
  if (remote.cacheControl !== entry.cacheControl) return "cache_control";
  return "";
}

function diffHeadEntry(head, remote, entry) {
  if (head.status === "missing") return "missing";
  if (head.status !== "ok") return head.status;
  if (head.size !== undefined && head.size !== entry.size) return "size";
  if (head.contentType && head.contentType !== entry.contentType) return "content_type";
  if (head.cacheControl && head.cacheControl !== entry.cacheControl) return "cache_control";
  if (head.sha256 && head.sha256 !== entry.sha256) return "sha256";
  if (head.md5 && entry.md5 && head.md5 !== entry.md5) return "md5";
  if (head.etagMd5 && entry.md5) return head.etagMd5 === entry.md5 ? "" : "etag";
  return diffManifestEntry(remote, entry) || "";
}

async function headObject(entry) {
  const response = await signedFetchWithRetry("HEAD", entry.key);
  if (response.status === 404) return { source: "head", status: "missing" };
  if (!response.ok) throw new Error(`R2 HEAD failed for ${entry.key}: ${response.status} ${await response.text()}`);
  return {
    cacheControl: response.headers.get("cache-control") || "",
    contentType: response.headers.get("content-type") || "",
    etagMd5: md5FromEtag(response.headers.get("etag") || ""),
    md5: response.headers.get("x-amz-meta-openclaw-md5") || "",
    sha256: response.headers.get("x-amz-meta-openclaw-sha256") || "",
    size: numberHeader(response.headers.get("content-length")),
    source: "head",
    status: "ok",
  };
}

function createStats(total) {
  return {
    hitSources: new Map(),
    hits: 0,
    missReasons: new Map(),
    misses: 0,
    total,
  };
}

function recordHit(stats, source) {
  stats.hits++;
  increment(stats.hitSources, source || "manifest");
}

function recordMiss(stats, reason) {
  stats.misses++;
  increment(stats.missReasons, reason || "changed");
}

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function formatRemoteManifestStatus(remoteManifest) {
  const count = Array.isArray(remoteManifest.entries) ? remoteManifest.entries.length : 0;
  return `r2 remote manifest: ${remoteManifest.status || "unknown"} from ${remoteManifest.source || "unknown"} (${count} entries)`;
}

function formatCacheStats(stats) {
  return [
    `r2 object cache: ${stats.hits}/${stats.total} hits, ${stats.misses} misses`,
    `hit sources: ${formatCounts(stats.hitSources)}`,
    `miss reasons: ${formatCounts(stats.missReasons)}`,
  ].join("; ");
}

function formatCounts(map) {
  if (!map.size) return "none";
  return Array.from(map.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

function writeGithubSummary(stats, deleted) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  const lines = [
    "### R2 object cache",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Hits | ${stats.hits} |`,
    `| Misses | ${stats.misses} |`,
    `| Deleted | ${deleted.length} |`,
    "",
    `Hit sources: ${formatCounts(stats.hitSources)}`,
    "",
    `Miss reasons: ${formatCounts(stats.missReasons)}`,
    "",
  ];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
}

async function listBucketKeys() {
  const keys = [];
  let continuationToken;
  do {
    const query = {
      "encoding-type": "url",
      "list-type": "2",
      "max-keys": "1000",
    };
    if (continuationToken) query["continuation-token"] = continuationToken;
    const response = await signedFetchWithRetry("GET", "", undefined, {}, query);
    if (!response.ok) throw new Error(`R2 list failed: ${response.status} ${await response.text()}`);
    const xml = await response.text();
    keys.push(...extractXmlValues(xml, "Key").map(decodeS3ListKey));
    continuationToken = extractXmlValue(xml, "NextContinuationToken");
    const isTruncated = extractXmlValue(xml, "IsTruncated") === "true";
    if (isTruncated && !continuationToken) throw new Error("R2 list was truncated without a continuation token");
  } while (continuationToken);
  return keys;
}

async function uploadEntries(entries) {
  let next = 0;
  let done = 0;
  const workers = Array.from({ length: Math.min(concurrency, entries.length) }, async () => {
    while (next < entries.length) {
      const entry = entries[next++];
      await putObject(entry);
      done++;
      if (done % 500 === 0 || done === entries.length) console.log(`r2 upload progress: ${done}/${entries.length}`);
    }
  });
  await Promise.all(workers);
}

async function deleteEntries(entries) {
  let next = 0;
  let done = 0;
  const workers = Array.from({ length: Math.min(concurrency, entries.length) }, async () => {
    while (next < entries.length) {
      const entry = entries[next++];
      await deleteObject(entry);
      done++;
      if (done % 500 === 0 || done === entries.length) console.log(`r2 delete progress: ${done}/${entries.length}`);
    }
  });
  await Promise.all(workers);
}

async function putObject(entry) {
  const file = path.isAbsolute(entry.file) ? entry.file : path.join(root, entry.file);
  const body = fs.readFileSync(file);
  if (dryRun) {
    console.log(`r2 dry-run put: ${entry.key}`);
    return;
  }
  const response = await signedFetchWithRetry("PUT", entry.key, body, {
    "cache-control": entry.cacheControl,
    "content-length": String(body.length),
    "content-type": entry.contentType,
    "x-amz-meta-openclaw-md5": entry.md5 || md5Hex(body),
    "x-amz-meta-openclaw-sha256": entry.sha256 || sha256Hex(body),
    "x-amz-content-sha256": entry.sha256 || sha256Hex(body),
  });
  if (!response.ok) throw new Error(`R2 upload failed for ${entry.key}: ${response.status} ${await response.text()}`);
}

async function deleteObject(entry) {
  if (dryRun) {
    console.log(`r2 dry-run delete: ${entry.key}`);
    return;
  }
  const response = await signedFetchWithRetry("DELETE", entry.key);
  if (response.status === 404) return;
  if (!response.ok) throw new Error(`R2 delete failed for ${entry.key}: ${response.status} ${await response.text()}`);
}

async function signedFetchWithRetry(method, key, body, headers = {}, query = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      const response = await signedFetch(method, key, body, headers, query);
      if (!isRetryableStatus(response.status) || attempt === retryAttempts) return response;
      lastError = new Error(`HTTP ${response.status}`);
      await response.arrayBuffer().catch(() => {});
    } catch (error) {
      lastError = error;
      if (attempt === retryAttempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt)));
  }
  throw lastError;
}

async function signedFetch(method, key, body, headers = {}, query = {}) {
  const encodedKey = key ? `/${encodeS3Key(key)}` : "";
  const url = new URL(`${endpoint.replace(/\/$/, "")}/${bucket}${encodedKey}`);
  const canonicalQuery = canonicalQueryString(query);
  if (canonicalQuery) url.search = canonicalQuery;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const normalizedHeaders = {
    host: url.host,
    "x-amz-content-sha256": headers["x-amz-content-sha256"] || "UNSIGNED-PAYLOAD",
    "x-amz-date": amzDate,
    ...Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), String(value)])),
  };
  const signedHeaders = Object.keys(normalizedHeaders).sort();
  const canonicalHeaders = signedHeaders.map((name) => `${name}:${normalizeHeader(normalizedHeaders[name])}\n`).join("");
  const canonicalRequest = [
    method,
    url.pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders.join(";"),
    normalizedHeaders["x-amz-content-sha256"],
  ].join("\n");
  const scope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, date), region), service), "aws4_request");
  const signature = hmac(signingKey, stringToSign, "hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`;

  return fetch(url, {
    body,
    headers: { ...normalizedHeaders, authorization },
    method,
  });
}

function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function retryDelay(attempt) {
  return Math.min(10_000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250);
}

function encodeS3Key(key) {
  return key.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function canonicalQueryString(query) {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([name, value]) => [awsEncodeURIComponent(name), awsEncodeURIComponent(String(value))])
    .sort(([leftName, leftValue], [rightName, rightValue]) => leftName.localeCompare(rightName) || leftValue.localeCompare(rightValue))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
}

function awsEncodeURIComponent(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function extractXmlValue(xml, name) {
  return extractXmlValues(xml, name)[0] || "";
}

function extractXmlValues(xml, name) {
  return Array.from(xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "g")), (match) => decodeXml(match[1]));
}

function decodeS3ListKey(value) {
  return decodeURIComponent(value);
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function normalizeHeader(value) {
  return String(value).trim().replace(/\s+/g, " ");
}

function numberHeader(value) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function md5FromEtag(value) {
  const etag = value.trim().replace(/^"|"$/g, "");
  return /^[a-f0-9]{32}$/i.test(etag) ? etag.toLowerCase() : "";
}

function md5Hex(value) {
  return crypto.createHash("md5").update(value).digest("hex");
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
