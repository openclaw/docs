import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import vm from "node:vm";
import test from "node:test";
import { fileURLToPath } from "node:url";

function loadWorkflow(name) {
  return fs.readFileSync(fileURLToPath(new URL(`../../.github/workflows/${name}`, import.meta.url)), "utf8");
}

function extractFetchCalls(source) {
  const calls = [];
  const needle = "await fetch(";
  let from = 0;
  while (from < source.length) {
    const start = source.indexOf(needle, from);
    if (start === -1) break;
    let i = start + needle.length;
    let depth = 1;
    let quote = null;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (quote) {
        if (ch === "\\") {
          i += 2;
          continue;
        }
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
      } else if (ch === "(") {
        depth += 1;
      } else if (ch === ")") {
        depth -= 1;
      }
      i += 1;
    }
    calls.push(source.slice(start, i));
    from = i;
  }
  return calls;
}

test("llms-full inline fetches abort", () => {
  const fetches = extractFetchCalls(loadWorkflow("llms-full.yml"));
  assert.equal(fetches.length, 2);
  for (const call of fetches) {
    assert.match(call, /signal:\s*AbortSignal\.timeout\(\s*30_000\s*\)/);
  }
});

test("r2-pages credential calls abort", () => {
  const source = loadWorkflow("r2-pages.yml");
  const fetches = extractFetchCalls(source);
  assert.equal(fetches.length, 1);
  assert.match(fetches[0], /signal:\s*AbortSignal\.timeout\(\s*30_000\s*\)/);
  const curls = source.split("\n").filter((line) => line.includes("curl "));
  assert.equal(curls.length, 2);
  for (const line of curls) {
    assert.match(line, /--max-time\s+30(?:\s|$)/);
  }
});

// Execute the workflow calls against a server that accepts connections but never replies.
test("stalled workflow requests abort before retry and credential fallback handling", async () => {
  const server = http.createServer(() => {});
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const workflow of ["llms-full.yml", "r2-pages.yml"]) {
      for (const call of extractFetchCalls(loadWorkflow(workflow))) {
        const cleanup = new AbortController();
        const context = {
          url, accountId: "synthetic-account", bucket: "synthetic-bucket",
          accessKeyId: "synthetic-key", token: "synthetic-token", JSON,
          AbortSignal: { timeout(ms) {
            assert.equal(ms, 30_000);
            return AbortSignal.timeout(30);
          } },
          fetch: (_url, options) => fetch(url, {
            ...options,
            signal: AbortSignal.any([cleanup.signal, ...(options.signal ? [options.signal] : [])]),
          }),
        };
        let watchdog;
        try {
          const outcome = await Promise.race([
            vm.runInNewContext(`(async () => ${call})()`, context).then(
              () => "resolved", (error) => error.name,
            ),
            new Promise((resolve) => { watchdog = setTimeout(() => resolve("stalled"), 1_000); }),
          ]);
          assert.equal(outcome, "TimeoutError", workflow);
        } finally {
          clearTimeout(watchdog);
          cleanup.abort();
        }
      }
    }
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
