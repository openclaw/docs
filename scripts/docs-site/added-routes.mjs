// Map added docs files to live routes; mapping must mirror build.mjs page collection.
// The CLI caps large additions with a deterministic, evenly spaced sample.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ignoredDocDirs, ignoredDocFiles } from "./config.mjs";

export function routesFromAddedDocsPaths(paths) {
  const routes = new Set();
  for (const path of paths) {
    if (!path.startsWith("docs/")) continue;
    const rel = path.slice("docs/".length);
    if (!/\.(md|mdx)$/.test(rel) || ignoredDocFiles.has(rel)) continue;
    const segments = rel.split("/");
    if (segments.some((segment) => segment.startsWith(".") || ignoredDocDirs.has(segment))) continue;
    if (["AGENTS.md", "CLAUDE.md"].includes(segments.at(-1))) continue;
    const slug = rel.replace(/\.(md|mdx)$/, "").replace(/\/index$/, "");
    routes.add(slug === "index" ? "/" : `/${slug}`);
  }
  return [...routes].sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const value = process.env.MAX_ROUTES ?? "100";
  const cap = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(cap)) {
    throw new Error("MAX_ROUTES must be a non-negative safe integer (0 = unlimited).");
  }
  let routes = routesFromAddedDocsPaths(fs.readFileSync(0, "utf8").split(/\r?\n/));
  if (cap > 0 && routes.length > cap) {
    const total = routes.length;
    routes = Array.from({ length: cap }, (_, index) =>
      routes[cap === 1 ? 0 : Math.round(index * (total - 1) / (cap - 1))]
    );
    console.error(`Sampled ${routes.length} routes out of ${total}.`);
  }
  if (routes.length > 0) process.stdout.write(`${routes.join("\n")}\n`);
}
