import fs from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const webVitalsEntry = fileURLToPath(import.meta.resolve("web-vitals"));
export const webVitalsRuntime = fs.readFileSync(webVitalsEntry, "utf8");
export const webVitalsAssetName = `web-vitals-${createHash("sha256").update(webVitalsRuntime).digest("hex").slice(0, 12)}.js`;
