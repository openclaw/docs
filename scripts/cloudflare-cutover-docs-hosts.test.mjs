import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const script = fileURLToPath(new URL("./cloudflare-cutover-docs-hosts.mjs", import.meta.url));

function cutoverRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "docs-cutover-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function runCutover(root, env = {}, extra = {}) {
  return spawnSync(process.execPath, [
    "--import", pathToFileURL(path.join(root, "mock-fetch.mjs")).href,
    script,
    "--dry-run",
  ], {
    cwd: root,
    env: {
      PATH: process.env.PATH,
      CLOUDFLARE_API_TOKEN: "test-token",
      ...env,
    },
    encoding: "utf8",
    ...extra,
  });
}

test("Cloudflare API fetch attaches an AbortSignal so a stalled cutover call can time out", (t) => {
  const root = cutoverRoot(t);
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
  return Response.json({ success: true, result: [] });
};
`);
  const result = runCutover(root);
  assert.equal(result.status, 0, result.stderr);
  const calls = JSON.parse(fs.readFileSync(path.join(root, "calls.json"), "utf8"));
  assert.ok(calls.length > 0, "cutover must call fetch at least once");
  for (const call of calls) {
    assert.match(call.url, /^https:\/\/api\.cloudflare\.com\/client\/v4\//);
    assert.equal(call.hasSignal, true, `${call.method} ${call.url} missing AbortSignal`);
    assert.equal(call.signalName, "AbortSignal", `${call.method} ${call.url}`);
    assert.equal(call.signalAborted, false, `${call.method} ${call.url} started already aborted`);
  }
});

test("Cloudflare API fetch aborts a hung socket so cutover is not stuck", (t) => {
  const root = cutoverRoot(t);
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
  const result = runCutover(root, { CLOUDFLARE_API_TIMEOUT_MS: "80" }, { timeout: 4000 });
  const elapsed = Date.now() - started;
  assert.notEqual(result.status, null, `hung fetch was killed after ${elapsed}ms instead of aborting`);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(`${result.stderr}\n${result.stdout}`, /abort|timeout/i);
  assert.ok(elapsed < 2000, `hung fetch ran ${elapsed}ms without aborting`);
});
