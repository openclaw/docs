import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Cache the rendered article, never the surrounding navigation or locale links.
// Those depend on the complete current page set and are rebuilt on every run.
export function createRenderCache(directory, render, signature = rendererSignature()) {
  fs.mkdirSync(directory, { recursive: true });
  const used = new Set();
  const stats = { hits: 0, misses: 0, bypassed: 0 };
  return {
    stats,
    render(markdown, options) {
      // Snippets can read arbitrary files (including nested snippets). Render
      // their owners afresh instead of maintaining another dependency graph.
      if (markdown.includes("<Snippet")) {
        stats.bypassed++;
        return render(markdown, options);
      }
      const identity = JSON.stringify([path.relative(options.root, options.sourceFile), options.pageRoute]);
      const filename = `${digest(identity)}.json`;
      const file = path.join(directory, filename);
      const input = digest(JSON.stringify([signature, identity, markdown]));
      used.add(filename);
      try {
        const cached = JSON.parse(fs.readFileSync(file, "utf8"));
        if (cached?.input === input && typeof cached.html === "string") {
          stats.hits++;
          return cached.html;
        }
      } catch (error) {
        // A missing or interrupted cache write is a miss, not missing content.
        if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
      }
      stats.misses++;
      const html = render(markdown, options);
      fs.writeFileSync(file, JSON.stringify({ input, html }));
      return html;
    },
    prune() {
      // Keep one entry per current page, not every historical content version.
      for (const entry of fs.readdirSync(directory)) {
        if (/^[a-f0-9]{64}\.json$/.test(entry) && !used.has(entry)) {
          fs.rmSync(path.join(directory, entry));
        }
      }
    },
  };
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function rendererSignature() {
  const hash = createHash("sha256").update(JSON.stringify([process.version, process.platform]));
  // Include the renderer's source closure and locked dependencies, not the
  // source commit or docs tree: unrelated edits must not evict every article.
  for (const file of [
    new URL("./render-cache.mjs", import.meta.url),
    new URL("./mdx-ish.mjs", import.meta.url),
    new URL("../../.openclaw-sync/lib/docs-markdown.mjs", import.meta.url),
    new URL("../../package-lock.json", import.meta.url),
  ]) {
    hash.update(fs.readFileSync(file)).update("\0");
  }
  return hash.digest("hex");
}
