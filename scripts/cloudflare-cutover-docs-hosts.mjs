#!/usr/bin/env node
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const zoneName = process.env.CLOUDFLARE_ZONE_NAME ?? "openclaw.ai";
const dryRun = process.argv.includes("--dry-run");

if (!apiToken) {
  throw new Error("CLOUDFLARE_API_TOKEN is required");
}

const docsHost = `docs.${zoneName}`;
const legacyHost = `documentation.${zoneName}`;
const mintlifyHost = `mintlify.${zoneName}`;
const mintlifyOriginHost = `mintlify-origin.${zoneName}`;
const docsRouterScript = "openclaw-docs-router";
const chatProxyScript = "openclaw-docs-chat-proxy";

const zone = await findZone(zoneName);
console.log(`zone:${zone.name}`);

await upsertDns(zone.id, {
  name: docsHost,
  type: "A",
  content: "192.0.2.1",
  proxied: true,
  ttl: 1,
  comment: "OpenClaw generated docs router",
});
await upsertDns(zone.id, {
  name: mintlifyHost,
  type: "A",
  content: "192.0.2.1",
  proxied: true,
  ttl: 1,
  comment: "OpenClaw Mintlify backup docs proxy",
});
await upsertDns(zone.id, {
  name: mintlifyOriginHost,
  type: "CNAME",
  content: "cname.mintlify.builders",
  proxied: false,
  ttl: 1,
  comment: "OpenClaw Mintlify backup origin",
});

await upsertRoute(zone.id, `${docsHost}/ask-molty/*`, chatProxyScript);
await upsertRoute(zone.id, `${legacyHost}/ask-molty/*`, chatProxyScript);
await upsertRoute(zone.id, `${docsHost}/*`, docsRouterScript);
await upsertRoute(zone.id, `${legacyHost}/*`, docsRouterScript);
await upsertRoute(zone.id, `${mintlifyHost}/*`, docsRouterScript);

console.log(dryRun ? "dry-run complete" : "cutover complete");

async function findZone(name) {
  const data = await cloudflare(`/zones?name=${encodeURIComponent(name)}&status=active`);
  const zone = data.result?.find((entry) => entry.name === name);
  if (!zone) throw new Error(`active zone not found: ${name}`);
  return zone;
}

async function upsertDns(zoneId, desired) {
  const existing = await cloudflare(`/zones/${zoneId}/dns_records?name=${encodeURIComponent(desired.name)}&per_page=100`);
  const records = existing.result ?? [];
  const matching = records.find((record) =>
    record.type === desired.type
    && record.content === desired.content
    && record.proxied === desired.proxied
  );
  for (const record of records) {
    if (matching && record.id === matching.id) continue;
    await mutate(`/zones/${zoneId}/dns_records/${record.id}`, { method: "DELETE" });
    console.log(`dns:deleted:${record.name}:${record.type}`);
  }
  if (matching) {
    await mutate(`/zones/${zoneId}/dns_records/${matching.id}`, {
      method: "PATCH",
      body: desired,
    });
    console.log(`dns:ok:${desired.name}:${desired.type}`);
    return;
  }
  await mutate(`/zones/${zoneId}/dns_records`, {
    method: "POST",
    body: desired,
  });
  console.log(`dns:created:${desired.name}:${desired.type}`);
}

async function upsertRoute(zoneId, pattern, script) {
  const existing = await cloudflare(`/zones/${zoneId}/workers/routes?per_page=100`);
  const routes = existing.result ?? [];
  const match = routes.find((route) => route.pattern === pattern);
  if (match?.script === script) {
    console.log(`route:ok:${pattern}`);
    return;
  }
  const body = { pattern, script };
  if (match) {
    await mutate(`/zones/${zoneId}/workers/routes/${match.id}`, {
      method: "PUT",
      body,
    });
    console.log(`route:updated:${pattern}`);
    return;
  }
  await mutate(`/zones/${zoneId}/workers/routes`, {
    method: "POST",
    body,
  });
  console.log(`route:created:${pattern}`);
}

async function mutate(path, init) {
  if (dryRun) {
    console.log(`${init.method}:dry-run:${path}`);
    return {};
  }
  return cloudflare(path, init);
}

async function cloudflare(path, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok || data.success === false) {
    const message = data.errors?.map((error) => `${error.code}: ${error.message}`).join("; ") || response.statusText;
    throw new Error(`${init.method ?? "GET"} ${path}: ${message}`);
  }
  return data;
}
