import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { routesFromAddedDocsPaths } from "./added-routes.mjs";

const script = fileURLToPath(new URL("./added-routes.mjs", import.meta.url));

const cases = [
  ["docs/start/why-openclaw.md", "/start/why-openclaw"],
  ["docs/tools/browser.mdx", "/tools/browser"],
  ["docs/tools/browser/setup.md", "/tools/browser/setup"],
  ["docs/index.md", "/"],
  ["docs/de/index.md", "/de"],
  ["docs/tools/index.md", "/tools"],
  ["docs/tools/index.mdx", "/tools"],
  ["docs/de/tools/foo.md", "/de/tools/foo"],
  ["docs/reference/AGENTS.default.md", "/reference/AGENTS.default"],
];

for (const [path, route] of cases) {
  test(`maps ${path} to ${route}`, () => {
    assert.deepEqual(routesFromAddedDocsPaths([path]), [route]);
  });
}

test("excludes paths that are not docs pages", () => {
  assert.deepEqual(routesFromAddedDocsPaths([
    "README.md",
    "docs-extra/page.md",
    "other/docs/page.md",
    "docs/assets/page.md",
    "docs/de/assets/page.md",
    "docs/.i18n/page.md",
    "docs/.generated/page.md",
    "docs/.hidden/page.md",
    "docs/tools/.hidden/page.mdx",
    "docs/tools/.hidden.md",
    "docs/AGENTS.md",
    "docs/CLAUDE.md",
    "docs/de/AGENTS.md",
    "docs/de/tools/CLAUDE.md",
    "docs/docs.json",
    "docs/nav-tabs-underline.js",
    "docs/style.css",
    "docs/tools/image.png",
    "docs/tools/page.md.bak",
    "docs/tools/page.MD",
    "",
  ]), []);
});

test("deduplicates and sorts routes without changing the input", () => {
  const paths = ["docs/z.md", "docs/tools/index.md", "docs/a.mdx", "docs/z.mdx", "docs/tools.md", "docs/index.md"];
  const original = [...paths];
  assert.deepEqual(routesFromAddedDocsPaths(paths), ["/", "/a", "/tools", "/z"]);
  assert.deepEqual(paths, original);
});

test("CLI reads newline-separated stdin and prints routes with trailing newlines", () => {
  assert.equal(execFileSync(process.execPath, [script], {
    encoding: "utf8",
    env: { ...process.env, MAX_ROUTES: "100" },
    input: "docs/z.md\r\ndocs/index.md\r\ndocs/z.mdx\r\nREADME.md\r\n",
  }), "/\n/z\n");
});

const sampleInput = Array.from({ length: 11 }, (_, index) =>
  `docs/page-${String(index).padStart(2, "0")}.md`
).join("\n");

function runCli(input, cap) {
  const env = { ...process.env };
  if (cap === undefined) delete env.MAX_ROUTES;
  else env.MAX_ROUTES = cap;
  return spawnSync(process.execPath, [script], { encoding: "utf8", input, env });
}

test("CLI samples evenly and deterministically, including the first and last routes", () => {
  const first = runCli(sampleInput, "4");
  const second = runCli(sampleInput, "4");
  assert.equal(first.status, 0);
  assert.equal(second.status, 0);
  assert.equal(first.stdout, "/page-00\n/page-03\n/page-07\n/page-10\n");
  assert.equal(first.stderr, "Sampled 4 routes out of 11.\n");
  assert.equal(second.stdout, first.stdout);
  assert.equal(second.stderr, first.stderr);
});

test("CLI MAX_ROUTES=1 keeps only the first route", () => {
  const result = runCli(sampleInput, "1");
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "/page-00\n");
  assert.equal(result.stderr, "Sampled 1 routes out of 11.\n");
});

test("CLI defaults to 100 routes", () => {
  const input = Array.from({ length: 101 }, (_, index) => `docs/page-${String(index).padStart(3, "0")}.md`).join("\n");
  const result = runCli(input);
  assert.equal(result.status, 0);
  const routes = result.stdout.trim().split("\n");
  assert.equal(routes.length, 100);
  assert.equal(new Set(routes).size, 100);
  assert.equal(routes[0], "/page-000");
  assert.equal(routes.at(-1), "/page-100");
  assert.equal(result.stderr, "Sampled 100 routes out of 101.\n");
});

for (const cap of ["0", "11", "100"]) {
  test(`CLI keeps all routes without a sampling notice for MAX_ROUTES=${cap}`, () => {
    const result = runCli(sampleInput, cap);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, `${routesFromAddedDocsPaths(sampleInput.split("\n")).join("\n")}\n`);
    assert.equal(result.stderr, "");
  });
}

test("CLI emits nothing when there are no added docs pages", () => {
  const result = runCli("README.md\n", "1");
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});

for (const cap of ["-1", "1.5", "nope", "", "9007199254740992"]) {
  test(`CLI rejects invalid MAX_ROUTES=${JSON.stringify(cap)}`, () => {
    const result = runCli(sampleInput, cap);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /MAX_ROUTES must be a non-negative safe integer/);
  });
}
