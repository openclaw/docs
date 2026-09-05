import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const workflowPath = fileURLToPath(
  new URL("../../.github/workflows/docs-live-smoke.yml", import.meta.url),
);

function loadWorkflow() {
  return fs.readFileSync(workflowPath, "utf8");
}

function jobBlocks(source) {
  const jobsIdx = source.search(/^jobs:\s*$/m);
  assert.ok(jobsIdx >= 0, "workflow must declare jobs");
  const jobsSection = source.slice(jobsIdx);
  const matches = [...jobsSection.matchAll(/^  ([A-Za-z][\w-]*)\s*:\s*$/gm)];
  assert.ok(matches.length > 0, "workflow must declare at least one job");
  return matches.map((match, index) => {
    const start = match.index;
    const end = index + 1 < matches.length ? matches[index + 1].index : jobsSection.length;
    return { name: match[1], body: jobsSection.slice(start, end) };
  });
}

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

test("every docs-live-smoke job has timeout-minutes", () => {
  const jobs = jobBlocks(loadWorkflow());
  assert.ok(
    jobs.length >= 2,
    `expected smoke and sample jobs, got ${jobs.map((job) => job.name).join(",")}`,
  );
  for (const job of jobs) {
    const timeout = job.body.match(/^\s+timeout-minutes:\s+(\d+)\s*$/m);
    assert.ok(timeout, `${job.name} is missing timeout-minutes`);
    assert.ok(Number(timeout[1]) > 0, `${job.name} timeout-minutes must be positive`);
  }
});

test("every inline live fetch uses AbortSignal.timeout", () => {
  const fetches = extractFetchCalls(loadWorkflow());
  assert.ok(fetches.length >= 6, `expected at least 6 live fetches, found ${fetches.length}`);
  for (const call of fetches) {
    assert.match(
      call,
      /signal:\s*AbortSignal\.timeout\(\s*\d[\d_]*\s*\)/,
      `fetch is missing AbortSignal.timeout:\n${call}`,
    );
  }
});
