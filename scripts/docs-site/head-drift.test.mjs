import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { parse } from "yaml";
import { classifyHeadDrift, pushTriggerPaths } from "./head-drift.mjs";

const script = fileURLToPath(new URL("./head-drift.mjs", import.meta.url));
const workflow = parse(fs.readFileSync(new URL("../../.github/workflows/r2-pages.yml", import.meta.url), "utf8"));
const steps = workflow.jobs.deploy.steps;

function step(name) {
  const found = steps.find((entry) => entry.name === name);
  assert.ok(found, `missing workflow step: ${name}`);
  return found;
}

function conditionMatches(name, scope, stale, deployWorker = "0", event = "push", { upload = "success", worker = "skipped", cancelled = false } = {}) {
  const expression = step(name).if
    .replace(/^\$\{\{(.*)\}\}$/s, "$1")
    .replaceAll("steps.artifact-scope.outputs.scope", JSON.stringify(scope))
    .replaceAll("steps.artifact-scope.outputs.deploy_worker", JSON.stringify(deployWorker))
    .replaceAll("steps.current-main.outputs.stale", JSON.stringify(stale))
    .replaceAll("steps.upload-r2.outcome", JSON.stringify(upload))
    .replaceAll("steps.deploy-worker.outcome", JSON.stringify(worker))
    .replaceAll("cancelled()", String(cancelled))
    .replaceAll("github.event_name", JSON.stringify(event));
  return runInNewContext(expression);
}

function gitFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "docs-head-drift-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const remote = path.join(root, "remote.git");
  const writer = path.join(root, "writer");
  const checkout = path.join(root, "checkout");
  const bin = path.join(root, "bin");
  fs.mkdirSync(bin);
  const env = {
    PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_AUTHOR_NAME: "Fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
    GIT_COMMITTER_NAME: "Fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid",
    GITHUB_REPOSITORY: "fixture/docs", GITHUB_RUN_ID: "123", EVENT_NAME: "push",
  };
  const git = (cwd, ...args) => execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(root, "init", "--bare", "--initial-branch=main", remote);
  git(root, "init", "--initial-branch=main", writer);
  git(writer, "remote", "add", "origin", remote);
  fs.mkdirSync(path.join(writer, ".openclaw-sync"));
  fs.writeFileSync(path.join(writer, ".openclaw-sync/source.json"), JSON.stringify({ repository: "fixture/source", sha: "source-a" }));
  const statePath = path.join(root, "gh-state.json");
  const callsPath = path.join(root, "gh-calls.jsonl");
  const state = { latest: "", count: "0", apiFailure: false, dispatchFailure: false };
  const saveState = () => fs.writeFileSync(statePath, JSON.stringify(state));
  fs.writeFileSync(callsPath, "");
  fs.writeFileSync(path.join(bin, "gh"), `#!${process.execPath}
const assert = require("node:assert/strict");
const fs = require("node:fs");
const state = JSON.parse(fs.readFileSync(${JSON.stringify(statePath)}, "utf8"));
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(callsPath)}, JSON.stringify(args) + "\\n");
if (args[0] === "api") {
  assert.deepEqual(args, ["api", "repos/fixture/docs/actions/workflows/r2-pages.yml/runs?head_sha=" + state.latest + "&per_page=1", "--jq", ".total_count"]);
  if (state.apiFailure) { console.error("synthetic API failure"); process.exit(1); }
  console.log(state.count);
} else {
  assert.deepEqual(args.slice(0, 7), ["workflow", "run", "r2-pages.yml", "--ref", "main", "-f", "artifact_scope=full"]);
  if (state.dispatchFailure) { console.error("synthetic dispatch failure"); process.exit(1); }
}
`, { mode: 0o755 });
  function advance(file = "docs/page.md", body = "B") {
    fs.mkdirSync(path.dirname(path.join(writer, file)), { recursive: true });
    fs.writeFileSync(path.join(writer, file), body);
    git(writer, "add", ".");
    git(writer, "commit", "-m", "fixture update [skip ci]");
    git(writer, "push", "origin", "main");
    state.latest = git(writer, "rev-parse", "HEAD");
    saveState();
    return state.latest;
  }
  const initial = advance("docs/page.md", "A");
  git(root, "clone", "--quiet", remote, checkout);
  fs.mkdirSync(path.join(checkout, "scripts/docs-site"), { recursive: true });
  fs.copyFileSync(script, path.join(checkout, "scripts/docs-site/head-drift.mjs"));
  let invocation = 0;
  function runStep(name, overrides = {}) {
    const output = path.join(root, `output-${invocation++}`);
    fs.writeFileSync(output, "");
    const result = spawnSync("bash", ["-e", "-o", "pipefail", "-c", step(name).run], {
      cwd: checkout, encoding: "utf8", input: "",
      env: { ...env, GITHUB_SHA: initial, BEFORE_SHA: initial, GITHUB_OUTPUT: output, ...overrides },
    });
    return { ...result, output: fs.readFileSync(output, "utf8") };
  }
  const calls = () => fs.readFileSync(callsPath, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  return { initial, checkout, advance, runStep, calls, state, saveState, git };
}

test("a successorless docs push during an admitted build is scheduled after the snapshot publishes", (t) => {
  const f = gitFixture(t);
  const admitted = f.runStep("Check current docs main");
  assert.equal(admitted.status, 0, admitted.stderr);
  assert.match(admitted.output, /^stale=false$/m);
  const latest = f.advance();
  assert.deepEqual(f.calls(), [], "admission at current main must not dispatch");
  assert.equal(conditionMatches("Upload changed R2 objects", "full", "false"), true);
  const published = path.join(f.checkout, "published.txt");
  fs.copyFileSync(path.join(f.checkout, "docs/page.md"), published);
  const caughtUp = f.runStep("Catch up docs main after publication");
  assert.equal(caughtUp.status, 0, caughtUp.stderr);
  assert.equal(fs.readFileSync(published, "utf8"), "A");
  assert.match(admitted.output, /^stale=false$/m);
  assert.doesNotMatch(caughtUp.output, /stale=/);
  assert.deepEqual(f.calls().at(-1), ["workflow", "run", "r2-pages.yml", "--ref", "main", "-f", "artifact_scope=full", "-f", "request_id=head-drift-123", "-f", `smoke_commit_range=${f.initial}..${latest}`]);
});

const sourceSteps = ["Read source metadata", "Check out OpenClaw source"];
const setupSteps = ["Set up Node", "Install"];
const artifactSteps = ["Install librsvg2-bin", "Build R2 artifact", "Smoke generated site", "Resolve R2 credentials", "Upload changed R2 objects"];

test("push trigger paths stay in sync with the R2 Pages workflow", () => {
  assert.deepEqual(pushTriggerPaths, workflow.on.push.paths);
});

test("obsolete queued snapshots yield or fail before source checkout, setup, and build", () => {
  const admission = ["Classify artifact scope", "Refresh scoped docs content from main", "Check current docs main", "Fail stale scoped translation deploy"];
  for (const [index, name] of admission.entries()) {
    if (index > 0) assert.ok(steps.indexOf(step(admission[index - 1])) < steps.indexOf(step(name)), `${admission[index - 1]} must precede ${name}`);
  }
  for (const name of [...sourceSteps, ...setupSteps, ...artifactSteps]) {
    assert.ok(steps.indexOf(step(admission.at(-1))) < steps.indexOf(step(name)), `admission must finish before ${name}; stale queued snapshots must not consume build time`);
  }
});

test("only admitted snapshots do expensive work or publish, including worker-only and skipped scopes", () => {
  for (const scope of ["full", "shell", "locale", "page", "none"]) {
    for (const stale of ["false", "true", ""]) {
      for (const deployWorker of ["0", "1"]) {
        const admitted = stale === "false";
        for (const name of [...sourceSteps, ...setupSteps, ...artifactSteps, "Deploy Worker before live smoke"]) {
          const ownsWork = sourceSteps.includes(name) ? ["full", "locale", "page"].includes(scope)
            : setupSteps.includes(name) ? scope !== "none" || deployWorker === "1"
            : name === "Deploy Worker before live smoke" ? deployWorker === "1" : scope !== "none";
          assert.equal(conditionMatches(name, scope, stale, deployWorker), admitted && ownsWork, `${name}: scope=${scope}, stale=${JSON.stringify(stale)}, worker=${deployWorker}`);
        }
      }
    }
    for (const deployWorker of ["0", "1"]) {
      assert.equal(conditionMatches("Check current docs main", scope, "", deployWorker), scope !== "none" || deployWorker === "1");
    }
  }
});

test("scoped dispatches admit refreshed main content and fail stale admission for caller retries", () => {
  assert.equal(step("Check current docs main").env.SCOPED_CONTENT_SHA, "${{ steps.scoped-content.outputs.content_sha || '' }}");
  assert.match(step("Refresh scoped docs content from main").run, /git checkout "\$\{content_sha\}" -- docs \.openclaw-sync\/source\.json/);
  assert.deepEqual(step("Catch up docs main after publication").env, step("Check current docs main").env);
  for (const event of ["push", "workflow_dispatch"]) {
    for (const scope of ["full", "shell", "locale", "page", "none"]) {
      const scopedDispatch = event === "workflow_dispatch" && ["locale", "page"].includes(scope);
      assert.equal(conditionMatches("Refresh scoped docs content from main", scope, "", "0", event), scopedDispatch);
      for (const stale of ["false", "true", ""]) {
        assert.equal(conditionMatches("Fail stale scoped translation deploy", scope, stale, "0", event), scopedDispatch && stale === "true");
      }
    }
  }
});

test("head checks bracket publication, with no late admission veto", () => {
  assert.deepEqual(workflow.concurrency, { group: "r2-pages", queue: "max", "cancel-in-progress": false });
  assert.equal(step("Check current docs main").run, "node scripts/docs-site/head-drift.mjs admit");
  assert.equal(step("Catch up docs main after publication").run, "node scripts/docs-site/head-drift.mjs catch-up");
  const publishing = steps.slice(steps.indexOf(step("Check current docs main")) + 1, steps.indexOf(step("Deploy Worker before live smoke")) + 1);
  for (const entry of publishing) {
    assert.doesNotMatch(entry.run || "", /git fetch[^\n]*\bmain\b|refs\/remotes\/origin\/main|head-drift\.mjs|stale=(?:true|false)/, `${entry.name} must use the admission verdict instead of rechecking main during publication`);
  }
  assert.ok(steps.indexOf(step("Upload changed R2 objects")) < steps.indexOf(step("Deploy Worker before live smoke")));
  assert.ok(steps.indexOf(step("Deploy Worker before live smoke")) < steps.indexOf(step("Dispatch live smoke")));
  assert.ok(steps.indexOf(step("Dispatch live smoke")) < steps.indexOf(step("Catch up docs main after publication")));
});

test("catch-up requires admitted publication, including unchanged uploads and Worker-only deployments", () => {
  for (const scope of ["full", "shell", "locale", "page", "none"]) {
    for (const stale of ["false", "true", ""]) {
      for (const cancelled of [false, true]) {
        for (const [deployWorker, upload, worker, published] of [
          ["0", scope === "none" ? "skipped" : "success", "skipped", scope !== "none"],
          ["1", scope === "none" ? "skipped" : "success", "success", true],
          ["0", "failure", "skipped", false],
          ["1", "success", "failure", false],
          ["1", "skipped", "skipped", false],
        ]) {
          assert.equal(conditionMatches("Catch up docs main after publication", scope, stale, deployWorker, "push", { upload, worker, cancelled }), published && stale === "false" && !cancelled);
        }
      }
    }
  }
  assert.equal(step("Deploy Worker before live smoke").id, "deploy-worker");
  assert.notEqual(step("Catch up docs main after publication")["continue-on-error"], true);
});

const cases = [
  [[".openclaw-sync/source.json"], "artifact-affected"],
  [["docs/start/why-openclaw.md"], "artifact-affected"],
  [["README.md", "docs/a.md"], "artifact-affected"],
  [["README.md"], "artifact-unaffected"],
  [[".github/workflows/translate-all.yml"], "artifact-unaffected"],
  [[".openclaw-sync/check-docs-mdx.mjs"], "artifact-unaffected"],
  [[".github/workflows/r2-pages.yml"], "artifact-affected"],
  [["some-new-root-file.txt"], "artifact-affected"],
  [["README.md", "some-new-root-file.txt"], "artifact-affected"],
  [[], "artifact-unaffected"],
  [[""], "artifact-unaffected"],
  [["", "docs/a.md", ""], "artifact-affected"],
  [["some-new-root-file.txt", "docs/a.md"], "artifact-affected"],
  [["docs-extra/a.md"], "artifact-affected"],
  [[".github-extra/workflow.yml"], "artifact-affected"],
  [["README.md.bak"], "artifact-affected"],
];

for (const [paths, verdict] of cases) {
  test(`classifies ${JSON.stringify(paths)} as ${verdict}`, () => {
    assert.equal(classifyHeadDrift(paths), verdict);
  });
}

for (const [count, apiFailure, dispatches] of [["0", false, 1], ["1", false, 0], ["", true, 1], ["invalid", false, 1]]) {
  test(`both head checks preserve successor lookup: count=${JSON.stringify(count)}, API failure=${apiFailure}`, (t) => {
    const f = gitFixture(t);
    f.advance();
    Object.assign(f.state, { count, apiFailure });
    f.saveState();
    for (const name of ["Check current docs main", "Catch up docs main after publication"]) {
      const before = f.calls().length;
      const result = f.runStep(name);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(f.calls().slice(before).filter((call) => call[0] === "workflow").length, dispatches);
      if (name === "Check current docs main") assert.match(result.output, /^stale=true$/m);
      else assert.doesNotMatch(result.output, /stale=/);
      if (apiFailure) assert.match(result.stdout, /Could not verify successor/);
    }
  });
}

test("artifact-unaffected drift and refreshed scoped identity do not schedule unnecessary successors", (t) => {
  const f = gitFixture(t);
  const scoped = f.advance();
  const refreshed = f.runStep("Refresh scoped docs content from main");
  assert.equal(refreshed.status, 0, refreshed.stderr);
  const contentSha = refreshed.output.match(/^content_sha=(.+)$/m)?.[1];
  assert.equal(contentSha, scoped);
  assert.equal(f.git(f.checkout, "rev-parse", "HEAD"), f.initial, "workflow code stays on its selected ref");
  assert.equal(fs.readFileSync(path.join(f.checkout, "docs/page.md"), "utf8"), "B");
  const overrides = { EVENT_NAME: "workflow_dispatch", SCOPED_CONTENT_SHA: contentSha };
  const admitted = f.runStep("Check current docs main", overrides);
  assert.equal(admitted.status, 0, admitted.stderr);
  assert.match(admitted.output, /^stale=false$/m);
  f.advance("README.md", "unrelated update");
  for (const name of ["Check current docs main", "Catch up docs main after publication"]) {
    const result = f.runStep(name, overrides);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /without artifact-relevant changes/);
  }
  assert.deepEqual(f.calls(), []);
});

test("successor dispatch retains manual smoke base and leaves absent or zero push bases empty", (t) => {
  const f = gitFixture(t);
  const latest = f.advance();
  for (const [overrides, base] of [
    [{ EVENT_NAME: "workflow_dispatch", SMOKE_COMMIT_RANGE: `${f.initial}..${f.initial}` }, f.initial],
    [{ EVENT_NAME: "workflow_dispatch" }, ""],
    [{ BEFORE_SHA: "0".repeat(40) }, ""],
  ]) {
    const result = f.runStep("Catch up docs main after publication", overrides);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.calls().at(-1).at(-1), `smoke_commit_range=${base ? `${base}..${latest}` : ""}`);
  }
});

test("dispatch failure fails both phases without changing a completed publication or granting admission", (t) => {
  const f = gitFixture(t);
  const admitted = f.runStep("Check current docs main");
  assert.equal(admitted.status, 0, admitted.stderr);
  assert.match(admitted.output, /^stale=false$/m);
  const published = path.join(f.checkout, "published.txt");
  fs.copyFileSync(path.join(f.checkout, "docs/page.md"), published);
  f.advance();
  f.state.dispatchFailure = true;
  f.saveState();
  for (const name of ["Check current docs main", "Catch up docs main after publication"]) {
    const result = f.runStep(name);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /synthetic dispatch failure/);
    assert.equal(result.output, "");
  }
  assert.equal(fs.readFileSync(published, "utf8"), "A");
});

test("Git failure cannot grant admission or silently succeed at catch-up", (t) => {
  const f = gitFixture(t);
  f.git(f.checkout, "remote", "remove", "origin");
  for (const name of ["Check current docs main", "Catch up docs main after publication"]) {
    const result = f.runStep(name);
    assert.notEqual(result.status, 0);
    assert.equal(result.output, "");
  }
  assert.deepEqual(f.calls(), []);
});
