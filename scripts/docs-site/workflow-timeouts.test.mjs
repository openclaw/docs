import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const workflowsDir = fileURLToPath(new URL("../../.github/workflows/", import.meta.url));

const TARGETS = {
  "update-skills.yml": ["update"],
  "translate-incremental.yml": [
    "validate-workflow-shell",
    "prepare",
    "plan",
    "translate",
    "provider-preflight",
    "finalize",
  ],
  "stale.yml": ["stale"],
  "codeql.yml": ["analyze"],
};

// prepare sleeps the default 3600s cooldown. GitHub rejects timeout-minutes on
// jobs that only `uses:` a reusable workflow; those jobs are bounded in the callee.
const MIN_TIMEOUT = {
  "translate-incremental.yml": {
    prepare: 61,
  },
};

function loadWorkflow(name) {
  return fs.readFileSync(path.join(workflowsDir, name), "utf8");
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

function jobTimeout(body) {
  const timeout = body.match(/^\s+timeout-minutes:\s+(\d+)\s*$/m);
  return timeout ? Number(timeout[1]) : null;
}

test("every job in the four remaining workflows has timeout-minutes", () => {
  for (const [name, expected] of Object.entries(TARGETS)) {
    const jobs = jobBlocks(loadWorkflow(name));
    assert.deepEqual(
      jobs.map((job) => job.name),
      expected,
      `${name} job list drifted`,
    );
    for (const job of jobs) {
      const minutes = jobTimeout(job.body);
      // Caller jobs have `uses:` and no `runs-on`. Step-level `uses:` on local jobs
      // must not be treated as a reusable-workflow call.
      const isReusableCall = /^\s{4}uses:\s/m.test(job.body) && !/^\s{4}runs-on:/m.test(job.body);
      if (isReusableCall) {
        assert.equal(
          minutes,
          null,
          `${name} job ${job.name} is a reusable call; timeout-minutes belongs in the callee`,
        );
        continue;
      }
      assert.ok(minutes, `${name} job ${job.name} is missing timeout-minutes`);
      assert.ok(minutes > 0, `${name} job ${job.name} timeout-minutes must be positive`);
      const min = MIN_TIMEOUT[name]?.[job.name];
      if (min) {
        assert.ok(
          minutes >= min,
          `${name} job ${job.name} timeout-minutes must be >= ${min}, got ${minutes}`,
        );
      }
    }
  }
});

test("rg -L style: none of the four files lack timeout-minutes", () => {
  const missing = Object.keys(TARGETS).filter((name) => !loadWorkflow(name).includes("timeout-minutes"));
  assert.deepEqual(missing, [], `workflows still missing timeout-minutes: ${missing.join(",")}`);
});

test("incremental reusable callees bound their local jobs", () => {
  const callees = {
    "translate-shell-check-reusable.yml": { check: 15 },
    "translate-finalize-reusable.yml": { finalize: 60 },
  };
  for (const [name, expected] of Object.entries(callees)) {
    const jobs = jobBlocks(loadWorkflow(name));
    for (const [jobName, min] of Object.entries(expected)) {
      const job = jobs.find((entry) => entry.name === jobName);
      assert.ok(job, `${name} is missing job ${jobName}`);
      const minutes = jobTimeout(job.body);
      assert.ok(minutes >= min, `${name} job ${jobName} timeout-minutes must be >= ${min}, got ${minutes}`);
    }
  }
});
