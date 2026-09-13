import fs from "node:fs";
import path from "node:path";
import { ignoredDocDirs } from "./config.mjs";

export function walkDocs(dir, excludedRoots = new Set()) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return ignoredDocDirs.has(entry.name) || excludedRoots.has(entry.name) ? [] : walkDocs(full);
    return /\.(md|mdx)$/.test(entry.name) ? [full] : [];
  });
}
