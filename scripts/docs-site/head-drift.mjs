// Own admission and post-publication catch-up for the serialized R2 workflow.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Must mirror r2-pages.yml on.push.paths; head-drift.test.mjs asserts the sync.
export const pushTriggerPaths = [
  "docs/**",
  "scripts/docs-site/**",
  "workers/**",
  "wrangler.toml",
  "package.json",
  "package-lock.json",
  ".github/workflows/r2-pages.yml",
  ".openclaw-sync/source.json",
  ".openclaw-sync/lib/docs-markdown.mjs",
  ".openclaw-sync/lib/docs-redirects.mjs",
];

const artifactIrrelevantPaths = [
  "AGENTS.md",
  "CLAUDE.md",
  "CLOUDFLARE.md",
  "LICENSE",
  "README.md",
  "SECURITY.md",
  "Makefile",
  "skills-lock.json",
  ".agents/**",
  ".github/**",
  ".openclaw-sync/**",
];

function matchesGlob(path, glob) {
  return glob.endsWith("/**") ? path.startsWith(glob.slice(0, -2)) : path === glob;
}

export function classifyHeadDrift(changedPaths) {
  const paths = changedPaths.filter((path) => path !== "");
  if (paths.some((path) => pushTriggerPaths.some((glob) => matchesGlob(path, glob)))) {
    return "artifact-affected";
  }
  if (paths.every((path) => artifactIrrelevantPaths.some((glob) => matchesGlob(path, glob)))) {
    return "artifact-unaffected";
  }
  return "artifact-affected";
}

function command(program, ...args) {
  return execFileSync(program, args, {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 8 * 1024 * 1024,
  });
}

function checkHead(phase) {
  if (!["admit", "catch-up"].includes(phase) || process.argv.length !== 3) {
    throw new Error("Usage: node scripts/docs-site/head-drift.mjs <admit|catch-up>");
  }
  const expected = process.env.SCOPED_CONTENT_SHA || process.env.GITHUB_SHA;
  if (!expected) throw new Error("Missing docs snapshot SHA");
  command("git", "fetch", "--quiet", "origin", "main");
  const latest = command("git", "rev-parse", "refs/remotes/origin/main").trim();
  const stale = expected !== latest && classifyHeadDrift(
    command("git", "diff", "--name-only", "-z", expected, latest).split("\0"),
  ) === "artifact-affected";

  if (stale) {
    // Paths cannot prove a successor exists: skip-ci, GITHUB_TOKEN pushes and
    // truncated push filters can suppress runs. API failure biases to dispatch.
    let count = "";
    try {
      count = command("gh", "api", `repos/${process.env.GITHUB_REPOSITORY}/actions/workflows/r2-pages.yml/runs?head_sha=${latest}&per_page=1`, "--jq", ".total_count").trim();
    } catch {
      console.log("::warning::Could not verify successor runs; attempting a full successor dispatch.");
    }
    if (/^\d+$/.test(count) && Number(count) > 0) {
      console.log(`::notice::Docs main moved to ${latest}; an R2 run already exists for that head.`);
    } else {
      const { EVENT_NAME, BEFORE_SHA = "", SMOKE_COMMIT_RANGE = "" } = process.env;
      const base = EVENT_NAME === "push" && /^[0-9a-f]{7,40}$/.test(BEFORE_SHA) && !/^0+$/.test(BEFORE_SHA)
        ? BEFORE_SHA : SMOKE_COMMIT_RANGE.split("..")[0];
      command("gh", "workflow", "run", "r2-pages.yml", "--ref", "main",
        "-f", "artifact_scope=full", "-f", `request_id=head-drift-${process.env.GITHUB_RUN_ID}`,
        "-f", `smoke_commit_range=${base ? `${base}..${latest}` : ""}`);
      console.log(`::notice::Dispatched a full R2 successor for docs main ${latest}.`);
    }
  } else if (expected !== latest) {
    console.log(`::notice::Docs main moved to ${latest} without artifact-relevant changes from ${expected}.`);
  }

  // Catch-up can fail scheduling, but cannot revoke the published admission.
  if (phase === "admit") fs.appendFileSync(process.env.GITHUB_OUTPUT, `stale=${stale}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    checkHead(process.argv[2]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
