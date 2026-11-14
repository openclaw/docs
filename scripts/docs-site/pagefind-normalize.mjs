#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pagefindAssetDir, pagefindVersion } from "./pagefind-assets.mjs";

const root = process.cwd();
const entryPath = path.join(root, "dist", "docs-site", pagefindAssetDir, "pagefind-entry.json");

if (!fs.existsSync(entryPath)) throw new Error("pagefind-entry.json does not exist; run pagefind first");

const entry = JSON.parse(fs.readFileSync(entryPath, "utf8"));
if (entry.version !== pagefindVersion) {
  throw new Error(`Pagefind index version ${entry.version} does not match installed runtime ${pagefindVersion}`);
}
if (entry.languages && typeof entry.languages === "object" && !Array.isArray(entry.languages)) {
  entry.languages = Object.fromEntries(
    Object.entries(entry.languages).sort(([left], [right]) => left.localeCompare(right)),
  );
}

fs.writeFileSync(entryPath, JSON.stringify(entry), "utf8");
