import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const script = fileURLToPath(new URL("./cloudflare-docs-hosts.mjs", import.meta.url));

function hostingRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "docs-host reconciliation-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function runHosting(root, env = {}, extra = {}) {
  return spawnSync(process.execPath, [
    "--import", pathToFileURL(path.join(root, "mock-fetch.mjs")).href,
    script,
    "--dry-run",
  ], {
    cwd: root,
    env: {
      PATH: process.env.PATH,
      CLOUDFLARE_API_TOKEN: "test-token-placeholder",
      ...env,
    },
    encoding: "utf8",
    ...extra,
  });
}

for (const value of ["30s", "1.5", "0", "-1", "Infinity", "2147483648"]) {
  test(`host reconciliation rejects invalid timeout ${value} before making a request`, (t) => {
    const root = hostingRoot(t);
    fs.writeFileSync(path.join(root, "mock-fetch.mjs"), 'globalThis.fetch = () => { throw new Error("Unexpected network request"); };\n');
    const result = runHosting(root, { CLOUDFLARE_API_TIMEOUT_MS: value });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /CLOUDFLARE_API_TIMEOUT_MS must be an integer between/);
    assert.doesNotMatch(result.stderr, /Unexpected network request/);
  });
}

test("Cloudflare API fetch attaches an AbortSignal so a stalled host reconciliation call can time out", (t) => {
  const root = hostingRoot(t);
  fs.writeFileSync(path.join(root, "mock-fetch.mjs"), `
import fs from "node:fs";
const calls = [];
globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  calls.push({
    url,
    method: init.method ?? "GET",
    hasSignal: Boolean(init.signal),
    signalAborted: Boolean(init.signal?.aborted),
    signalName: init.signal?.constructor?.name ?? null,
  });
  fs.writeFileSync("calls.json", JSON.stringify(calls));
  if (url.includes("/zones?") && !url.includes("/dns_records") && !url.includes("/workers")) {
    return Response.json({ success: true, result: [{ id: "zone1", name: "openclaw.ai" }] });
  }
  if (url.includes("/workers/routes")) {
    return Response.json({ success: true, result: [
      { id: "docs", pattern: "docs.openclaw.ai/*", script: "openclaw-docs-router" },
      { id: "documentation", pattern: "documentation.openclaw.ai/*", script: "openclaw-docs-router" },
    ] });
  }
  return Response.json({ success: true, result: [] });
};
`);
  const result = runHosting(root);
  assert.equal(result.status, 0, result.stderr);
  const calls = JSON.parse(fs.readFileSync(path.join(root, "calls.json"), "utf8"));
  assert.ok(calls.length > 0, "host reconciliation must call fetch at least once");
  for (const call of calls) {
    assert.match(call.url, /^https:\/\/api\.cloudflare\.com\/client\/v4\//);
    assert.equal(call.hasSignal, true, `${call.method} ${call.url} missing AbortSignal`);
    assert.equal(call.signalName, "AbortSignal", `${call.method} ${call.url}`);
    assert.equal(call.signalAborted, false, `${call.method} ${call.url} started already aborted`);
  }
});

test("Cloudflare API fetch aborts a hung socket so host reconciliation is not stuck", (t) => {
  const root = hostingRoot(t);
  fs.writeFileSync(path.join(root, "mock-fetch.mjs"), `
globalThis.fetch = (_input, init = {}) => new Promise((_resolve, reject) => {
  const signal = init.signal;
  const keepAlive = setTimeout(() => {}, 60_000);
  const abort = () => {
    clearTimeout(keepAlive);
    const error = new Error("The operation was aborted");
    error.name = "AbortError";
    reject(error);
  };
  if (!signal) return;
  if (signal.aborted) {
    abort();
    return;
  }
  signal.addEventListener("abort", abort, { once: true });
});
`);
  const started = Date.now();
  const result = runHosting(root, { CLOUDFLARE_API_TIMEOUT_MS: "80" }, { timeout: 4000 });
  const elapsed = Date.now() - started;
  assert.notEqual(result.status, null, `hung fetch was killed after ${elapsed}ms instead of aborting`);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(`${result.stderr}\n${result.stdout}`, /abort|timeout/i);
  assert.ok(elapsed < 2000, `hung fetch ran ${elapsed}ms without aborting`);
});

const { reconcileDocsHosts } = await import("./cloudflare-docs-hosts.mjs");
const hosts = ["docs.openclaw.ai", "documentation.openclaw.ai", "docs2.openclaw.ai", "mintlify.openclaw.ai"];

function cloudflareMock(t, { records = [], routes = [], pageSize = 100, failMutation = false } = {}) {
  const root = hostingRoot(t);
  const snapshotPath = path.join(root, "recovery", "private.json");
  const publicSnapshotPath = path.join(root, "recovery", "public.json");
  const activeRoutes = [
    { id: "active-docs", pattern: "docs.openclaw.ai/*", script: "openclaw-docs-router" },
    { id: "active-documentation", pattern: "documentation.openclaw.ai/*", script: "openclaw-docs-router" },
  ];
  const state = { records: structuredClone(records), routes: structuredClone([
    ...activeRoutes.filter((active) => !routes.some((route) => route.pattern === active.pattern)), ...routes,
  ]), writes: [], reads: [] };
  let nextId = 0;
  const fetchImpl = async (input, init) => {
    const url = new URL(input);
    const pathname = url.pathname.replace("/client/v4", "");
    const method = init.method ?? "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    assert.equal(init.signal.constructor.name, "AbortSignal");
    if (method === "GET") {
      state.reads.push(url.toString());
      let result;
      if (pathname === "/zones") {
        // Cloudflare's zones API accepts only 5-50 results per page.
        const perPage = Number(url.searchParams.get("per_page"));
        if (!Number.isInteger(perPage) || perPage < 5 || perPage > 50) {
          return Response.json({ success: false, errors: [{ code: 1000, message: "zones per_page must be between 5 and 50" }] }, { status: 400 });
        }
        result = [{ id: "private-zone-id", name: "openclaw.ai", private: "zone metadata" }];
      }
      else if (pathname.endsWith("/dns_records")) result = state.records.filter((record) => record.name === url.searchParams.get("name"));
      else if (pathname.endsWith("/workers/routes")) result = state.routes;
      else if (pathname.endsWith("/deployments")) return Response.json({ success: true, result: { deployments: [{ id: "prior-deployment", versions: [{ version_id: "prior-version" }] }] } });
      else throw new Error(`Unexpected read ${pathname}`);
      const page = Number(url.searchParams.get("page"));
      const totalPages = Math.max(1, Math.ceil(result.length / pageSize));
      return Response.json({ success: true, result: result.slice((page - 1) * pageSize, page * pageSize), result_info: { total_pages: totalPages } });
    }
    assert.ok(fs.existsSync(snapshotPath), "snapshot must precede every mutation");
    assert.ok(fs.existsSync(publicSnapshotPath), "portable recovery must precede every mutation");
    state.writes.push({ pathname, method, body });
    if (failMutation) return Response.json({ success: false, errors: [{ code: 1, message: "mutation failed" }] }, { status: 500 });
    const key = pathname.includes("dns_records") ? "records" : "routes";
    const id = pathname.split("/").at(-1);
    if (method === "DELETE") state[key] = state[key].filter((record) => record.id !== id);
    else if (method === "POST") state[key].push({ id: `new-${++nextId}`, ...body });
    else {
      const record = state[key].find((record) => record.id === id);
      assert.ok(record, `missing update target ${id}`);
      Object.assign(record, body);
    }
    return Response.json({ success: true, result: {} });
  };
  const options = { apiToken: "test-token-placeholder", accountId: "private-account-id", snapshotPath, publicSnapshotPath, fetchImpl, log() {} };
  return { root, state, options };
}

function oldRecords() {
  return [
    { id: "backup", name: "docs2.openclaw.ai", type: "CNAME", content: "cname.mintlify.builders", ttl: 1, proxied: false },
    { id: "docs-v6", name: "docs.openclaw.ai", type: "AAAA", content: "2001:db8::1", ttl: 1, proxied: true },
    { id: "verification", name: "_cf-custom-hostname.docs2.openclaw.ai", type: "TXT", content: '"8fe00d8a-316a-4a67-bfc4-b91dcc1ddc6f"', ttl: 1 },
    { id: "other-txt", name: "_cf-custom-hostname.docs2.openclaw.ai", type: "TXT", content: "unrelated-private-verification", ttl: 60 },
    { id: "mail", name: "docs2.openclaw.ai", type: "MX", content: "mail.example.com", ttl: 60 },
    { id: "policy", name: "docs.openclaw.ai", type: "TXT", content: "unrelated-private-policy", ttl: 60 },
    { id: "origin", name: "mintlify-origin.openclaw.ai", type: "CNAME", content: "cname.mintlify.builders", ttl: 1 },
    { id: "origin-txt", name: "mintlify-origin.openclaw.ai", type: "TXT", content: "keep", ttl: 60 },
    { id: "unrelated", name: "www.openclaw.ai", type: "A", content: "192.0.2.2", ttl: 60 },
  ];
}

const unrelatedRoutes = [
  { id: "ask", pattern: "docs.openclaw.ai/ask-molty/*", script: "openclaw-docs-chat-proxy" },
  { id: "other", pattern: "www.openclaw.ai/*", script: "unrelated-worker" },
];

test("reconciliation replaces only task-owned addresses and verification, preserves other DNS and Ask Molty, and is idempotent", async (t) => {
  const { state, options } = cloudflareMock(t, { records: oldRecords(), routes: unrelatedRoutes });
  await reconcileDocsHosts(options);
  for (const host of hosts.slice(2)) {
    const addresses = state.records.filter((record) => record.name === host && ["A", "AAAA", "CNAME"].includes(record.type));
    assert.equal(addresses.length, 1);
    assert.equal(addresses[0].content, "192.0.2.1");
    assert.equal(addresses[0].proxied, true);
    assert.ok(state.routes.some((route) => route.pattern === `${host}/*` && route.script === "openclaw-docs-router"));
  }
  for (const id of ["docs-v6", "other-txt", "mail", "policy", "origin-txt", "unrelated"]) {
    assert.deepEqual(state.records.find((record) => record.id === id), oldRecords().find((record) => record.id === id));
  }
  for (const route of unrelatedRoutes) assert.deepEqual(state.routes.find((item) => item.id === route.id), route);
  assert.ok(!state.records.some((record) => ["verification", "origin"].includes(record.id)));
  const writes = state.writes.length;
  const result = await reconcileDocsHosts({ ...options, snapshotPath: `${options.snapshotPath}.second`, publicSnapshotPath: `${options.publicSnapshotPath}.second` });
  assert.deepEqual(result.operations, []);
  assert.equal(state.writes.length, writes);
});

test("recovery files precede mutations, stay private locally, and public artifact excludes private and unrelated fields", async (t) => {
  const { state, options } = cloudflareMock(t, { records: oldRecords(), routes: unrelatedRoutes, failMutation: true });
  await assert.rejects(reconcileDocsHosts(options), /mutation failed/);
  assert.equal(state.writes.length, 1);
  const privateText = fs.readFileSync(options.snapshotPath, "utf8");
  assert.match(privateText, /private-zone-id/);
  assert.match(privateText, /prior-version/);
  assert.doesNotMatch(privateText, /test-token-placeholder/);
  assert.equal(fs.statSync(options.snapshotPath).mode & 0o777, 0o600);
  const publicText = fs.readFileSync(options.publicSnapshotPath, "utf8");
  assert.doesNotMatch(publicText, /private-|unrelated|test-token-placeholder|record_id|account|zone|"id"/);
  assert.match(publicText, /cname.mintlify.builders/);
  assert.match(publicText, /prior-version/);
  assert.match(publicText, /openclaw-docs-chat-proxy/);
  await assert.rejects(reconcileDocsHosts(options), /EEXIST/);
  assert.equal(state.writes.length, 1, "rerun must not overwrite recovery before writes");
});

test("dry-run inventories changes without writes or snapshots", async (t) => {
  const { state, options } = cloudflareMock(t, { records: oldRecords(), routes: unrelatedRoutes });
  const messages = [];
  const result = await reconcileDocsHosts({ ...options, dryRun: true, log: (line) => messages.push(line) });
  assert.ok(result.operations.some((item) => item.description === "dns:remove:docs2.openclaw.ai:CNAME"));
  assert.ok(messages.some((line) => line.startsWith("dry-run:route:set:docs2.openclaw.ai/*")));
  assert.equal(state.writes.length, 0);
  assert.equal(fs.existsSync(options.snapshotPath), false);
});

test("snapshot-only captures before-state without mutation and pagination retains later records and routes", async (t) => {
  const records = [
    { id: "first", name: "docs.openclaw.ai", type: "TXT", content: "keep", ttl: 1 },
    { id: "second", name: "docs.openclaw.ai", type: "A", content: "192.0.2.1", ttl: 1, proxied: true },
  ];
  const routes = [...unrelatedRoutes, { id: "later", pattern: "docs.openclaw.ai/*", script: "openclaw-docs-router" }];
  const { state, options } = cloudflareMock(t, { records, routes, pageSize: 1 });
  const result = await reconcileDocsHosts({ ...options, snapshotOnly: true });
  assert.equal(state.writes.length, 0);
  const snapshot = JSON.parse(fs.readFileSync(options.snapshotPath));
  assert.equal(snapshot.records.length, 2);
  assert.ok(snapshot.routes.some((route) => route.id === "later"));
  assert.ok(!result.operations.some((item) => item.body?.name === "docs.openclaw.ai" || item.body?.pattern === "docs.openclaw.ai/*"));
});

test("missing or unwritable recovery snapshot fails before mutations", async (t) => {
  const { state, options } = cloudflareMock(t);
  await assert.rejects(reconcileDocsHosts({ ...options, snapshotPath: undefined }), /--snapshot is required/);
  await assert.rejects(reconcileDocsHosts({ ...options, snapshotPath: path.dirname(options.snapshotPath) }), /EEXIST|EISDIR/);
  assert.equal(state.writes.length, 0);
});

test("more-specific routes on retired hosts stop reconciliation without touching another service", async (t) => {
  const { state, options } = cloudflareMock(t, { routes: [{ id: "other", pattern: "docs2.openclaw.ai/api/*", script: "another-service" }] });
  await assert.rejects(reconcileDocsHosts(options), /Conflicting retired-host route requires review/);
  assert.equal(state.writes.length, 0);
});

test("CLI rejects misspelled dry-run before network access", (t) => {
  const root = hostingRoot(t);
  fs.writeFileSync(path.join(root, "mock-fetch.mjs"), 'globalThis.fetch = () => { throw new Error("Unexpected network request"); };\n');
  const result = spawnSync(process.execPath, ["--import", pathToFileURL(path.join(root, "mock-fetch.mjs")).href, script, "--dryrun", "--snapshot", path.join(root, "snapshot.json")], {
    env: { PATH: process.env.PATH, CLOUDFLARE_API_TOKEN: "test-token-placeholder" }, encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown argument: --dryrun/);
  assert.equal(fs.existsSync(path.join(root, "snapshot.json")), false);
});

test("different active docs addresses and Ask Molty route configuration remain unchanged", async (t) => {
  const records = [
    { id: "canonical", name: "docs.openclaw.ai", type: "CNAME", content: "active-origin.example.com", ttl: 300, proxied: true },
    { id: "legacy", name: "documentation.openclaw.ai", type: "A", content: "192.0.2.42", ttl: 120, proxied: true },
    { id: "txt", name: "docs.openclaw.ai", type: "TXT", content: "keep", ttl: 60 },
  ];
  const routes = [{ id: "ask", pattern: "docs.openclaw.ai/ask-molty/*", script: "existing-chat-worker" }];
  const { state, options } = cloudflareMock(t, { records, routes });
  await reconcileDocsHosts(options);
  for (const record of records) assert.deepEqual(state.records.find((item) => item.id === record.id), record);
  assert.deepEqual(state.routes.find((route) => route.id === "ask"), routes[0]);
  assert.doesNotMatch(fs.readFileSync(options.publicSnapshotPath, "utf8"), /active-origin\.example\.com|192\.0\.2\.42/);
});

test("unexpected active docs routing blocks retirement before any mutation", async (t) => {
  const { state, options } = cloudflareMock(t, { routes: [{ id: "canonical", pattern: "docs.openclaw.ai/*", script: "different-router" }] });
  await assert.rejects(reconcileDocsHosts(options), /Active docs route must already target/);
  assert.equal(state.writes.length, 0);
});
