#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bucket = process.env.CLOUDFLARE_R2_BUCKET || "openclaw-docs";
const manifestPath = path.join(root, "dist", "docs-r2-manifest.json");
const remoteManifestKey = ".openclaw-docs-r2-manifest.json";
const concurrency = Number.parseInt(process.env.R2_UPLOAD_CONCURRENCY || "8", 10);
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.OPENCLAW_CLOUDFLARE_ACCOUNT_ID || process.env.OPENCLAW_R2_ACCOUNT_ID;
const endpoint = process.env.OPENCLAW_R2_S3_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
const accessKeyId = process.env.OPENCLAW_R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.OPENCLAW_R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.OPENCLAW_R2_REGION || "auto";
const service = "s3";
const retryAttempts = Number.parseInt(process.env.R2_UPLOAD_RETRIES || "5", 10);
const deleteOrphans = process.env.R2_DELETE_ORPHANS !== "0";

if (!Number.isFinite(concurrency) || concurrency < 1) throw new Error("R2_UPLOAD_CONCURRENCY must be a positive integer");
if (!fs.existsSync(manifestPath)) throw new Error("dist/docs-r2-manifest.json does not exist; run docs:build:r2 first");
if (!endpoint) throw new Error("OPENCLAW_R2_S3_ENDPOINT or CLOUDFLARE_ACCOUNT_ID is required");
if (!accessKeyId) throw new Error("OPENCLAW_R2_ACCESS_KEY_ID or AWS_ACCESS_KEY_ID is required");
if (!secretAccessKey) throw new Error("OPENCLAW_R2_SECRET_ACCESS_KEY or AWS_SECRET_ACCESS_KEY is required");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const remoteManifest = await getRemoteManifest();
const remoteEntries = new Map((remoteManifest?.entries || []).map((entry) => [entry.key, entry]));
const localKeys = new Set(manifest.entries.map((entry) => entry.key));
localKeys.add(remoteManifestKey);
const changed = manifest.entries.filter((entry) => {
  const remote = remoteEntries.get(entry.key);
  return !remote
    || remote.sha256 !== entry.sha256
    || remote.contentType !== entry.contentType
    || remote.cacheControl !== entry.cacheControl;
});
const manifestDeletedKeys = Array.from(remoteEntries.keys()).filter((key) => !localKeys.has(key));
const orphanedKeys = deleteOrphans ? (await listBucketKeys()).filter((key) => !localKeys.has(key)) : [];
const deleted = Array.from(new Set([...manifestDeletedKeys, ...orphanedKeys])).sort().map((key) => ({ key }));

console.log(
  `r2 upload plan: ${changed.length}/${manifest.entries.length} changed objects, ${deleted.length} deleted objects (${manifestDeletedKeys.length} from manifest, ${orphanedKeys.length} orphaned) for ${bucket}`,
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
console.log(`r2 upload ok: ${changed.length} changed objects, ${deleted.length} deleted objects plus ${remoteManifestKey}`);

async function getRemoteManifest() {
  try {
    const response = await signedFetchWithRetry("GET", remoteManifestKey);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GET manifest failed: ${response.status} ${await response.text()}`);
    return await response.json();
  } catch {
    return null;
  }
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
  const response = await signedFetchWithRetry("PUT", entry.key, body, {
    "cache-control": entry.cacheControl,
    "content-length": String(body.length),
    "content-type": entry.contentType,
    "x-amz-content-sha256": entry.sha256 || sha256Hex(body),
  });
  if (!response.ok) throw new Error(`R2 upload failed for ${entry.key}: ${response.status} ${await response.text()}`);
}

async function deleteObject(entry) {
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

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
