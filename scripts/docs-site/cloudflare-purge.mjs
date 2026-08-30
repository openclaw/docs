#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

const cloudflareApi = "https://api.cloudflare.com/client/v4";

export function parsePurgePrefixes(raw, zoneName) {
  let values;
  try {
    values = JSON.parse(raw);
  } catch (error) {
    throw new Error(`CLOUDFLARE_PURGE_PREFIXES must be a JSON array: ${error.message}`);
  }
  if (!Array.isArray(values) || values.length === 0 || values.length > 30) {
    throw new Error("CLOUDFLARE_PURGE_PREFIXES must contain 1 to 30 URLs");
  }
  const prefixes = [];
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== "string") throw new Error("Every purge prefix must be a URL string");
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
      throw new Error(
        `Purge prefix must be a credential-free HTTPS URL without a query or fragment: ${value}`,
      );
    }
    if (url.hostname !== zoneName && !url.hostname.endsWith(`.${zoneName}`)) {
      throw new Error(`Purge target must belong to ${zoneName}: ${value}`);
    }
    if (url.pathname === "/") {
      throw new Error("Purge prefix must include a path and cannot target the whole hostname");
    }
    const normalized = `${url.hostname}${url.pathname}`;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      prefixes.push(normalized);
    }
  }
  return prefixes;
}

export async function purgeCloudflarePrefixes({ fetchImpl = fetch, prefixes, token, zoneName }) {
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN is required");
  if (!zoneName) throw new Error("CLOUDFLARE_ZONE_NAME is required");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const zones = await cloudflare(fetchImpl, `/zones?name=${encodeURIComponent(zoneName)}&status=active`, {
    headers,
  });
  if (!Array.isArray(zones.result) || zones.result.length !== 1 || !zones.result[0]?.id) {
    throw new Error(`Expected exactly one active Cloudflare zone for ${zoneName}`);
  }
  await cloudflare(fetchImpl, `/zones/${zones.result[0].id}/purge_cache`, {
    body: JSON.stringify({ prefixes }),
    headers,
    method: "POST",
  });
  return { count: prefixes.length, zoneId: zones.result[0].id };
}

async function cloudflare(fetchImpl, apiPath, init) {
  const response = await fetchImpl(`${cloudflareApi}${apiPath}`, init);
  const data = await response.json().catch(() => undefined);
  if (!response.ok || !data?.success) {
    const errors = Array.isArray(data?.errors)
      ? data.errors.map((error) => error?.message).filter(Boolean).join("; ")
      : "";
    throw new Error(`Cloudflare API ${response.status}${errors ? `: ${errors}` : ""}`);
  }
  return data;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const zoneName = process.env.CLOUDFLARE_ZONE_NAME || "openclaw.ai";
  const prefixes = parsePurgePrefixes(
    process.env.CLOUDFLARE_PURGE_PREFIXES || "",
    zoneName,
  );
  const result = await purgeCloudflarePrefixes({
    prefixes,
    token: process.env.CLOUDFLARE_API_TOKEN,
    zoneName,
  });
  console.log(`purged ${result.count} URL prefix(es) from ${zoneName}`);
}
