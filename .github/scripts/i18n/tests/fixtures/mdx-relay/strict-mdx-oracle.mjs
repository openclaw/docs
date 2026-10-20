import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { compile } from "@mdx-js/mdx";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node strict-mdx-oracle.mjs <fixture> [...fixture]");
  process.exit(2);
}

const result = [];
for (const file of files) {
  const bytes = readFileSync(file);
  const source = bytes.toString("utf8");
  const item = {
    file,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
    lines: source.split("\n").length - (source.endsWith("\n") ? 1 : 0),
    parser: "@mdx-js/mdx@3.1.1 compile({jsx:true})",
  };
  try {
    await compile(source, { jsx: true });
    item.outcome = "compile_success";
  } catch (error) {
    item.outcome = "compile_failure";
    item.error = {
      source: error.source ?? null,
      reason: error.reason ?? String(error.message ?? error).split("\n")[0],
      line: error.line ?? error.place?.start?.line ?? null,
      column: error.column ?? error.place?.start?.column ?? null,
      end_line: error.place?.end?.line ?? null,
      end_column: error.place?.end?.column ?? null,
      offset: error.place?.start?.offset ?? error.place?.offset ?? null,
    };
  }
  result.push(item);
}
console.log(JSON.stringify(result, null, 2));
// A fixture replay is a failing command when any input fails strict parsing;
// callers can still inspect the complete JSON on stdout.
process.exitCode = result.some((item) => item.outcome === "compile_failure") ? 1 : 0;
