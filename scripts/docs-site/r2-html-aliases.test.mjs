import assert from "node:assert/strict";
import test from "node:test";
import { omitDuplicateHtmlIndexes } from "./r2-html-aliases.mjs";

const nested = {
  key: "de/guide.v2/index.html", sourceKey: "de/guide.v2/index.html",
  file: "dist/docs-site/de/guide.v2/index.html", size: 42,
  sha256: "a".repeat(64), md5: "b".repeat(32),
  contentType: "text/html; charset=utf-8", cacheControl: "public, max-age=60",
  customMetadata: { "openclaw-markdown-target": "/de/guide.v2.md" },
};
const alias = { ...nested, key: "de/guide.v2" };

test("only a unique identical nested HTML copy retires; root and assets remain", () => {
  const root = { ...nested, key: "index.html" };
  const asset = { ...nested, key: "assets/script.js", contentType: "text/javascript" };
  const result = omitDuplicateHtmlIndexes([nested, alias, root, asset]);
  assert.deepEqual(result.omitted, [nested.key]);
  assert.deepEqual(result.entries, [alias, root, asset]);
  assert.equal(alias.file, nested.file, "the physical upload/preview file is preserved");
});

test("missing or ambiguous aliases and incomplete byte proof retain both objects", () => {
  for (const entries of [[nested], [nested, alias, alias], [
    { ...nested, sha256: undefined }, { ...alias, sha256: undefined },
  ]]) {
    assert.deepEqual(omitDuplicateHtmlIndexes(entries), { entries, omitted: [] });
  }
});

for (const [field, value] of Object.entries({
  size: 43, sha256: "c".repeat(64), md5: "d".repeat(32), file: "another/index.html",
  sourceKey: "another/index.html", contentType: "application/json", cacheControl: "no-store",
  customMetadata: { "openclaw-markdown-target": "/another.md" }, contentEncoding: "gzip",
})) test(`different ${field} prevents nested object retirement`, () => {
  const entries = [nested, { ...alias, [field]: value }];
  assert.deepEqual(omitDuplicateHtmlIndexes(entries), { entries, omitted: [] });
});
