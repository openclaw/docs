import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./source-index.mjs", import.meta.url));

test("indexes a repository whose tracked-file list exceeds Node's default buffer", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-source-index-"));
  const source = path.join(root, "source");
  fs.mkdirSync(source);

  try {
    git(source, ["init"]);
    const blob = execFileSync("git", ["-C", source, "hash-object", "-w", "--stdin"], {
      encoding: "utf8",
      input: "",
    }).trim();
    const entries = Array.from({ length: 14_000 }, (_, index) => {
      const rel = `src/buffer-test/${String(index).padStart(5, "0")}-${"x".repeat(64)}.js`;
      return `100644 ${blob}\t${rel}\n`;
    }).join("");
    git(source, ["update-index", "--add", "--index-info"], { input: entries });

    const tracked = git(source, ["ls-files"], { maxBuffer: 8 * 1024 * 1024 });
    assert.ok(Buffer.byteLength(tracked) > 1024 * 1024);

    execFileSync(process.execPath, [script], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        DOCS_SOURCE_REPO_DIR: source,
        DOCS_SOURCE_SHA: "test-sha",
      },
    });

    const meta = JSON.parse(fs.readFileSync(path.join(root, "dist", "docs-site", "source-index-meta.json"), "utf8"));
    assert.equal(meta.filesConsidered, 14_000);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function git(dir, args, options = {}) {
  return execFileSync("git", ["-C", dir, ...args], {
    encoding: "utf8",
    ...options,
  });
}
