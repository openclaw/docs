import assert from "node:assert/strict";
import test from "node:test";

import router from "./docs-router.ts";

test("dotted slashless HTML routes bypass stale Worker cache entries", async () => {
  const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");
  let cachePuts = 0;
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      default: {
        match: async () => new Response("stale", {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
        put: async () => {
          cachePuts += 1;
        },
      },
    },
  });

  try {
    const response = await router.fetch(
      new Request("https://docs.openclaw.ai/releases/2026.8.1"),
      {
        DOCS_BUCKET: {
          get: async () => ({
            body: "current",
            customMetadata: {},
            httpEtag: '"current"',
            size: 7,
            writeHttpMetadata(headers) {
              headers.set("Content-Type", "text/html; charset=utf-8");
            },
          }),
        },
      },
      { waitUntil() {} },
    );

    assert.equal(await response.text(), "current");
    assert.equal(response.headers.get("x-openclaw-docs-cache"), "MISS");
    assert.match(response.headers.get("cache-control") ?? "", /max-age=60/);
    assert.doesNotMatch(response.headers.get("cache-control") ?? "", /immutable/);
    assert.equal(cachePuts, 0);
  } finally {
    if (originalCaches) {
      Object.defineProperty(globalThis, "caches", originalCaches);
    } else {
      delete globalThis.caches;
    }
  }
});
