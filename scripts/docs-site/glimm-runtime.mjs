import fs from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const glimmEntry = fileURLToPath(import.meta.resolve("glimm"));
let source = fs.readFileSync(glimmEntry, "utf8");

// Glimm 0.3.1 exposes cardinal directions only. Project the flat shader
// from top-left to bottom-right at 45 degrees (mirrored for RTL).
// Normalize the full diagonal to 0..1 so both corners stay inside the sweep,
// keeping the viewport-sized render target at every aspect ratio.
// Fail on upstream shader changes instead of silently losing the adaptation.
for (const [before, after] of [
  [
    "float cross = mix(uv.y, uv.x, uDirection);",
    `float cross = mix(uv.y, uv.x, uDirection);
  float diagonal = mix(uRes.y / uRes.x, uRes.x / uRes.y, uDirection);
  float travelSign = sign(uPosEnd - uPosStart);
  float crossStart = travelSign > 0.0 ? 1.0 - cross : cross;
  float axisScale = 1.0 / (1.0 + diagonal);
  float tilt = -travelSign * diagonal;
  axis = (axis + crossStart * diagonal) * axisScale;`,
  ],
  [
    "slope.x = mix(dhDaxis, 0.0, uDirection);\n  slope.y = mix(0.0, dhDaxis, uDirection);",
    "slope.x = mix(dhDaxis, dhDaxis * tilt, uDirection) * axisScale;\n  slope.y = mix(dhDaxis * tilt, dhDaxis, uDirection) * axisScale;",
  ],
]) {
  if (source.split(before).length !== 2) throw new Error("Glimm shader changed; review the docs angle adaptation.");
  source = source.replace(before, after);
}

export const glimmRuntime = source;
export const glimmAssetName = `glimm-${createHash("sha256").update(source).digest("hex").slice(0, 12)}.js`;
