#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const routerScript = "openclaw-docs-router";
// Public TXT record value previously used to verify the retired docs2 hostname.
const retiredDnsVerificationValue = "8fe00d8a-316a-4a67-bfc4-b91dcc1ddc6f";
const addressTypes = new Set(["A", "AAAA", "CNAME"]);

export async function reconcileDocsHosts({
  apiToken,
  accountId,
  zoneName = "openclaw.ai",
  dryRun = false,
  snapshotOnly = false,
  snapshotPath,
  publicSnapshotPath,
  fetchTimeoutMs = 30_000,
  fetchImpl = fetch,
  log = console.log,
}) {
  if (!apiToken) throw new Error("CLOUDFLARE_API_TOKEN is required");
  if (!Number.isInteger(fetchTimeoutMs) || fetchTimeoutMs < 1 || fetchTimeoutMs > 2_147_483_647) {
    throw new Error("CLOUDFLARE_API_TIMEOUT_MS must be an integer between 1 and 2147483647 milliseconds");
  }
  if (!dryRun && !snapshotPath) throw new Error("--snapshot is required before live changes");
  if (dryRun && snapshotOnly) throw new Error("--dry-run and --snapshot-only cannot be combined");

  async function api(apiPath, init = {}) {
    const response = await fetchImpl(`https://api.cloudflare.com/client/v4${apiPath}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(fetchTimeoutMs),
    });
    const data = await response.json();
    if (!response.ok || data.success === false) {
      const message = data.errors?.map((error) => `${error.code}: ${error.message}`).join("; ") || response.statusText;
      throw new Error(`${init.method ?? "GET"} ${apiPath}: ${message}`);
    }
    return data;
  }

  async function list(apiPath) {
    const entries = [];
    for (let page = 1; ; page += 1) {
      const data = await api(`${apiPath}${apiPath.includes("?") ? "&" : "?"}per_page=50&page=${page}`);
      if (!Array.isArray(data.result)) throw new Error(`Invalid list response: ${apiPath}`);
      entries.push(...data.result);
      const totalPages = data.result_info?.total_pages;
      if (totalPages === undefined || page >= totalPages) return entries;
      if (!Number.isInteger(totalPages) || totalPages < 1 || data.result.length === 0) {
        throw new Error(`Invalid pagination: ${apiPath}`);
      }
    }
  }

  const zones = await list(`/zones?name=${encodeURIComponent(zoneName)}&status=active`);
  const zone = zones.find((entry) => entry.name === zoneName);
  if (!zone) throw new Error(`active zone not found: ${zoneName}`);
  const base = `/zones/${zone.id}`;
  const docsHost = `docs.${zoneName}`;
  const aliases = [`documentation.${zoneName}`, `docs2.${zoneName}`, `mintlify.${zoneName}`];
  const hosts = [docsHost, ...aliases];
  const obsoleteOrigin = `mintlify-origin.${zoneName}`;
  const verificationHost = `_cf-custom-hostname.docs2.${zoneName}`;
  const records = [];
  for (const name of [...hosts, obsoleteOrigin, verificationHost]) {
    // Filter exact names defensively even though the API query already scopes them.
    records.push(...(await list(`${base}/dns_records?name=${encodeURIComponent(name)}`)).filter((record) => record.name === name));
  }
  const retiredHosts = aliases.slice(1);
  const desiredRoutes = retiredHosts.map((host) => ({ pattern: `${host}/*`, script: routerScript }));
  const activePatterns = [`${docsHost}/*`, `documentation.${zoneName}/*`];
  const patterns = new Set([
    ...desiredRoutes.map((route) => route.pattern), ...activePatterns,
    `${docsHost}/ask-molty/*`, `documentation.${zoneName}/ask-molty/*`,
  ]);
  const allRoutes = await list(`${base}/workers/routes`);
  for (const pattern of activePatterns) {
    const matching = allRoutes.filter((route) => route.pattern === pattern);
    if (matching.length !== 1 || matching[0].script !== routerScript) {
      throw new Error(`Active docs route must already target ${routerScript}: ${pattern}; inspect existing hosting before retirement`);
    }
  }
  // A more-specific route would bypass the redirect Worker. Stop rather than
  // silently overwrite a route owned by another service.
  for (const route of allRoutes) {
    const hostPattern = route.pattern.replace(/^https?:\/\//, "");
    if (aliases.slice(1).some((host) => hostPattern.startsWith(`${host}/`)) && !patterns.has(route.pattern)) {
      throw new Error(`Conflicting retired-host route requires review: ${route.pattern}`);
    }
  }
  const routes = allRoutes.filter((route) => patterns.has(route.pattern));
  const operations = [];
  const mutate = (method, apiPath, body, description) => operations.push({ method, path: apiPath, ...(body ? { body } : {}), description });
  for (const host of retiredHosts) {
    const desired = { name: host, type: "A", content: "192.0.2.1", proxied: true, ttl: 1 };
    const addresses = records.filter((record) => record.name === host && addressTypes.has(record.type));
    const matching = addresses.find((record) => record.type === desired.type && record.content === desired.content);
    for (const record of addresses) {
      if (record === matching) continue;
      mutate("DELETE", `${base}/dns_records/${record.id}`, undefined, `dns:remove:${record.name}:${record.type}`);
    }
    if (!matching) {
      mutate("POST", `${base}/dns_records`, desired, `dns:create:${host}:A`);
    } else if (matching.proxied !== true || matching.ttl !== 1) {
      mutate("PATCH", `${base}/dns_records/${matching.id}`, desired, `dns:update:${host}:A`);
    }
  }
  const obsolete = records.filter((record) =>
    (record.name === obsoleteOrigin && addressTypes.has(record.type))
    || (record.name === verificationHost && record.type === "TXT" && record.content.replace(/^"(.*)"$/s, "$1") === retiredDnsVerificationValue));
  for (const record of obsolete) {
    mutate("DELETE", `${base}/dns_records/${record.id}`, undefined, `dns:remove:${record.name}:${record.type}`);
  }
  for (const desired of desiredRoutes) {
    const matching = routes.filter((route) => route.pattern === desired.pattern);
    if (matching.length > 1) throw new Error(`Ambiguous duplicate Worker route: ${desired.pattern}`);
    if (matching[0]?.script === desired.script) continue;
    mutate(matching[0] ? "PUT" : "POST", `${base}/workers/routes${matching[0] ? `/${matching[0].id}` : ""}`, desired, `route:set:${desired.pattern}:${desired.script}`);
  }

  log(`zone:${zoneName}; planned operations:${operations.length}`);
  for (const operation of operations) log(`${dryRun ? "dry-run:" : "planned:"}${operation.description}`);
  if (dryRun) return { operations };

  // Capture the scoped before-state before the first write; a snapshot failure stops all mutations.
  const deployments = accountId
    ? (await api(`/accounts/${encodeURIComponent(accountId)}/workers/scripts/${routerScript}/deployments`)).result
    : undefined;
  const snapshot = { createdAt: new Date().toISOString(), zone, records, routes, deployments, operations };
  await writePrivateSnapshot(snapshotPath, snapshot);
  if (publicSnapshotPath) {
    // Public repository artifacts must contain only known, task-owned hosting data.
    // Preserve the full scoped API responses exclusively in the runner's private file.
    const recoverableRecords = records.filter((record) =>
      (retiredHosts.includes(record.name) && addressTypes.has(record.type)) || obsolete.includes(record));
    await writePrivateSnapshot(publicSnapshotPath, {
      createdAt: snapshot.createdAt,
      dns: recoverableRecords.map(({ name, type, content, proxied, ttl }) => ({ name, type, content, proxied, ttl })),
      routes: routes.map(({ pattern, script }) => ({ pattern, script })),
      previousWorkerVersions: [...new Set((deployments?.deployments ?? []).flatMap((deployment) =>
        (deployment.versions ?? []).map((version) => version.version_id)).filter((id) => typeof id === "string"))],
    });
  }
  log("recovery snapshot saved");
  if (snapshotOnly) return { operations };
  for (const operation of operations) {
    await api(operation.path, operation);
    log(operation.description);
  }
  log("host reconciliation complete");
  return { operations };
}

async function writePrivateSnapshot(file, value) {
  await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true, mode: 0o700 });
  // Exclusive creation prevents a rerun from destroying the original recovery data.
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx", mode: 0o600 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const flags = new Set(["--dry-run", "--snapshot-only"]);
  const pathFlags = new Set(["--snapshot", "--public-snapshot"]);
  for (let index = 0; index < args.length; index += 1) {
    if (flags.has(args[index])) continue;
    if (pathFlags.has(args[index])) {
      if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`${args[index]} requires a path`);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${args[index]}`);
  }
  const value = (name) => {
    const index = args.indexOf(name);
    if (index < 0) return undefined;
    if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`${name} requires a path`);
    return args[index + 1];
  };
  await reconcileDocsHosts({
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    zoneName: process.env.CLOUDFLARE_ZONE_NAME ?? "openclaw.ai",
    dryRun: args.includes("--dry-run"),
    snapshotOnly: args.includes("--snapshot-only"),
    snapshotPath: value("--snapshot"),
    publicSnapshotPath: value("--public-snapshot"),
    fetchTimeoutMs: Number(process.env.CLOUDFLARE_API_TIMEOUT_MS || "30000"),
  });
}
