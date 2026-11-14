#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pagefindAssetDir } from "./pagefind-assets.mjs";

const site = path.join(process.cwd(), "dist/docs-site");
if (!fs.existsSync(site)) throw new Error("dist/docs-site does not exist; run build.mjs first");

const runner = fileURLToPath(new URL("../../node_modules/pagefind/lib/runner/bin.cjs", import.meta.url));
const result = spawnSync(process.execPath, [runner, "--site", site, "--output-path", path.join(site, pagefindAssetDir)], {
  stdio: "inherit",
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
