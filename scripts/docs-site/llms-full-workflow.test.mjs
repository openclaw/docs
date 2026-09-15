import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const workflowPath = fileURLToPath(
  new URL("../../.github/workflows/llms-full.yml", import.meta.url),
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

test("every inline llms-full live fetch uses AbortSignal.timeout", () => {
  const source = fs.readFileSync(workflowPath, "utf8");
  const fetches = extractFetchCalls(source);
  assert.ok(fetches.length >= 2, `expected at least 2 live fetches, found ${fetches.length}`);
  for (const call of fetches) {
    assert.match(
      call,
      /signal:\s*AbortSignal\.timeout\(\s*\d[\d_]*\s*\)/,
      `fetch is missing AbortSignal.timeout:\n${call}`,
    );
  }
});
