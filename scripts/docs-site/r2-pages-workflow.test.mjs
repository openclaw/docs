import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const workflowPath = fileURLToPath(
  new URL("../../.github/workflows/r2-pages.yml", import.meta.url),
);

function extractFetchCalls(source) {
  const calls = [];
  const needle = "await fetch(";
  let from = 0;
  while (from < source.length) {
    const start = source.indexOf(needle, from);
    if (start === -1) {
      break;
    }
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
        if (ch === quote) {
          quote = null;
        }
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

test("r2-pages credential mint curl uses --max-time", () => {
  const source = fs.readFileSync(workflowPath, "utf8");
  const curls = [...source.matchAll(/curl\s+[^\n]+/g)].map((match) => match[0]);
  const verify = curls.filter((line) => line.includes("/tokens/verify"));
  assert.ok(verify.length >= 2, `expected token verify curls, found ${verify.length}`);
  for (const line of verify) {
    assert.match(line, /--max-time\s+\d+/, `curl is missing --max-time:\n${line}`);
  }
});

test("r2-pages credential mint fetch uses AbortSignal.timeout", () => {
  const source = fs.readFileSync(workflowPath, "utf8");
  const fetches = extractFetchCalls(source).filter((call) =>
    call.includes("temp-access-credentials"),
  );
  assert.equal(fetches.length, 1);
  assert.match(fetches[0], /signal:\s*AbortSignal\.timeout\(\s*\d[\d_]*\s*\)/);
});
