import fs from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const peleEntry = fileURLToPath(import.meta.resolve("pele"));
export const peleRuntime = fs.readFileSync(peleEntry, "utf8");
// Runtime assets are immutable: a dependency update must select a new URL.
export const peleAssetName = `pele-${createHash("sha256").update(peleRuntime).digest("hex").slice(0, 12)}.js`;
