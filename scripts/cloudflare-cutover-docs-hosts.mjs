#!/usr/bin/env node
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const zoneName = process.env.CLOUDFLARE_ZONE_NAME ?? "openclaw.ai";
const dryRun = process.argv.includes("--dry-run");

if (!apiToken) {
  throw new Error("CLOUDFLARE_API_TOKEN is required");
}

const docsHost = `docs.${zoneName}`;
const mintlifyHost = `docs2.${zoneName}`;
const legacyHost = `documentation.${zoneName}`;
const mintlifyRedirectHost = `mintlify.${zoneName}`;
const docsRouterScript = "openclaw-docs-router";
const chatProxyScript = "openclaw-docs-chat-proxy";
const mintlifyVerificationTxt = "8fe00d8a-316a-4a67-bfc4-b91dcc1ddc6f";
const docsBucket = "openclaw-docs";

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
  name: `_cf-custom-hostname.${mintlifyHost}`,
  type: "TXT",
  content: mintlifyVerificationTxt,
  proxied: false,
  ttl: 1,
  comment: "OpenClaw Mintlify custom hostname verification",
});
await deleteR2CustomDomain(mintlifyHost);
await upsertDns(zone.id, {
  name: mintlifyHost,
  type: "CNAME",
  content: "cname.mintlify.builders",
  proxied: false,
  ttl: 1,
  comment: "OpenClaw Mintlify backup docs",
});

await upsertRoute(zone.id, `${docsHost}/ask-molty/*`, chatProxyScript);
await upsertRoute(zone.id, `${legacyHost}/ask-molty/*`, chatProxyScript);
await upsertRoute(zone.id, `${docsHost}/*`, docsRouterScript);
await upsertRoute(zone.id, `${legacyHost}/*`, docsRouterScript);
await upsertRoute(zone.id, `${mintlifyRedirectHost}/*`, docsRouterScript);

console.log(dryRun ? "dry-run complete" : "cutover complete");

async function findZone(name) {
  const data = await cloudflare(`/zones?name=${encodeURIComponent(name)}&status=active`);
  const zone = data.result?.find((entry) => entry.name === name);
  if (!zone) throw new Error(`active zone not found: ${name}`);
  return zone;
}

async function deleteR2CustomDomain(domain) {
  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID is required to detach the old docs2 R2 custom domain");
  const path = `/accounts/${accountId}/r2/buckets/${encodeURIComponent(docsBucket)}/domains/custom/${encodeURIComponent(domain)}`;
  try {
    await mutate(path, { method: "DELETE" });
    console.log(`r2-custom-domain:deleted:${domain}`);
  } catch (error) {
    if (error instanceof Error && /10007|not found/i.test(error.message)) {
      console.log(`r2-custom-domain:absent:${domain}`);
      return;
    }
    throw error;
  }
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
