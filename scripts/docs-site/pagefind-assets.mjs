import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.resolve("pagefind"))));
export const pagefindVersion = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8")).version;
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pagefindVersion)) {
  throw new Error(`Invalid installed Pagefind version: ${pagefindVersion}`);
}
export const pagefindAssetDir = `pagefind/v${pagefindVersion}`;
