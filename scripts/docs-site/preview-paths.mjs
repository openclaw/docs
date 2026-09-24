import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const marker = ".openclaw-docs-preview";

function inside(parent, child) {
  const rel = path.relative(parent, child);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

// Resolve existing ancestors too: a symlink in an otherwise new output path
// must not bypass the source-directory guard.
function realPath(file) {
  if (fs.existsSync(file)) return fs.realpathSync(file);
  const parent = path.dirname(file);
  return path.join(realPath(parent), path.basename(file));
}

export function resolvePreviewPaths(root, options) {
  for (const name of ["source-root", "output-dir"]) {
    if (options[name] !== undefined && !path.isAbsolute(options[name])) {
      throw new Error(`--${name} must be an absolute path`);
    }
  }
  const sourceRoot = options["source-root"] ?? root;
  if (!fs.existsSync(path.join(sourceRoot, "docs", "docs.json"))) {
    throw new Error(`Docs source must contain docs/docs.json: ${sourceRoot}`);
  }
  if (options["source-root"] && !options["output-dir"]) {
    throw new Error("--source-root requires --output-dir for an isolated preview");
  }
  const customOutput = options["output-dir"] !== undefined;
  const outDir = customOutput ? realPath(path.resolve(options["output-dir"])) : path.join(root, "dist", "docs-site");
  if (customOutput) {
    for (const checkout of new Set([fs.realpathSync(root), fs.realpathSync(sourceRoot)])) {
      const scratch = inside(path.join(checkout, ".cache"), outDir)
        || (checkout === fs.realpathSync(root) && inside(path.join(checkout, "dist"), outDir));
      if (outDir === checkout || inside(outDir, checkout) || (inside(checkout, outDir) && !scratch)) {
        throw new Error("Preview output must be outside source files; use a .cache subdirectory or a temporary directory");
      }
    }
    let existing = outDir;
    while (!fs.existsSync(existing)) existing = path.dirname(existing);
    const gitRoot = spawnSync("git", ["-C", existing, "rev-parse", "--show-toplevel"], { encoding: "utf8" });
    if (gitRoot.status === 0) {
      const tracked = spawnSync("git", ["-C", gitRoot.stdout.trim(), "ls-files", "--", outDir], { encoding: "utf8" });
      if (tracked.status !== 0 || tracked.stdout.trim()) throw new Error("Preview output must not contain tracked files");
    }
    if (fs.existsSync(outDir) && (!fs.statSync(outDir).isDirectory()
      || (fs.readdirSync(outDir).length && !fs.existsSync(path.join(outDir, marker))))) {
      throw new Error("Preview output must be empty or an existing managed docs preview");
    }
  }
  return { sourceRoot, outDir, customOutput };
}

export function preparePreviewOutput(outDir) {
  fs.rmSync(outDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, marker), "Local docs preview; safe to rebuild.\n");
}
