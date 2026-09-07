import assert from "node:assert/strict";
import test from "node:test";

import router from "./docs-router.ts";

const searchIndex = JSON.stringify({
  entries: [{
    title: "Install",
    url: "/install",
    snippet: "Install OpenClaw",
    search: "install openclaw gateway",
  }],
});

function mcpEnv() {
  const reads = [];
  return {
    reads,
    env: {
      DOCS_BUCKET: {
        get: async (key) => {
          reads.push(`GET ${key}`);
          if (key !== "docs-search.json") return null;
          return {
            body: searchIndex,
            customMetadata: {},
            httpEtag: '"index"',
            size: searchIndex.length,
            writeHttpMetadata(headers) {
              headers.set("Content-Type", "application/json; charset=utf-8");
            },
          };
        },
        head: async (key) => {
          reads.push(`HEAD ${key}`);
          return null;
        },
      },
    },
  };
}

function toolCall(id) {
  return {
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: {
      name: "search_open_claw",
      arguments: { query: "install" },
    },
  };
}

function ping(id) {
  return { jsonrpc: "2.0", id, method: "ping" };
}

async function postMcp(env, payload) {
  return router.fetch(
    new Request("https://docs.openclaw.ai/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    env,
    { waitUntil() {} },
  );
}

test("POST /mcp rejects a 40-item tools/call batch before search work", async () => {
  const { env, reads } = mcpEnv();
  const response = await postMcp(env, Array.from({ length: 40 }, (_, i) => toolCall(i + 1)));
  const body = await response.json();
  assert.equal(Array.isArray(body), false);
  assert.equal(body.error?.code, -32600);
  assert.match(String(body.error?.message ?? ""), /batch too large/i);
  assert.deepEqual(reads, []);
});

test("POST /mcp accepts a single tools/call and searches once", async () => {
  const { env, reads } = mcpEnv();
  const response = await postMcp(env, toolCall(1));
  const body = await response.json();
  assert.equal(body.id, 1);
  assert.ok(body.result);
  assert.equal(body.error, undefined);
  assert.deepEqual(reads, ["GET docs-search.json"]);
});

test("POST /mcp accepts a 32-item ping batch", async () => {
  const { env, reads } = mcpEnv();
  const response = await postMcp(env, Array.from({ length: 32 }, (_, i) => ping(i + 1)));
  const body = await response.json();
  assert.ok(Array.isArray(body));
  assert.equal(body.length, 32);
  assert.deepEqual(reads, []);
});

test("POST /mcp rejects a 33-item ping batch before handling items", async () => {
  const { env, reads } = mcpEnv();
  const response = await postMcp(env, Array.from({ length: 33 }, (_, i) => ping(i + 1)));
  const body = await response.json();
  assert.equal(Array.isArray(body), false);
  assert.equal(body.error?.code, -32600);
  assert.deepEqual(reads, []);
});
