import assert from "node:assert/strict";
import fs from "node:fs";
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
