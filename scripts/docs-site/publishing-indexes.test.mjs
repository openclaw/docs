import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { DomUtils, parseDocument } from "htmlparser2";
import { fixture, run, write } from "./test-helpers/redirect-fixture.mjs";

function generate(f, script) {
  const result = run(f.root, script);
  assert.equal(result.status, 0, result.stderr);
  return result;
}

test("search and corpus use the same YAML titles and summaries as pages", (t) => {
  const f = fixture(t, [], {
    "folded.md": '---\ntitle: >-\n  Friendly guide\nsummary: >-\n  A useful\n  summary.\n---\n# Fallback\n\nReadable body.\n',
    "quoted.mdx": '\uFEFF---\r\ntitle: "Quoted \\"title\\""\r\nsummary: "Reader\'s guide"\r\n---\r\n# Fallback\r\n\r\nQuoted body.\r\n',
    "numeric.md": '---\ntitle: 2026\nsummary: 123\n---\n# Fallback\n\nNumeric body.\n',
    "zero.md": '---\ntitle: 0\nsummary: 0\n---\n# Fallback\n\nZero body.\n',
  });
  const built = f.build();
  assert.equal(built.status, 0, built.stderr);
  generate(f, "search-index.mjs");
  generate(f, "llms-full.mjs");
  const site = path.join(f.root, "dist/docs-site");
  const entries = JSON.parse(fs.readFileSync(path.join(site, "docs-search.json"), "utf8")).entries;
  const corpus = fs.readFileSync(path.join(f.root, "dist/docs-llms-full/llms-full.txt"), "utf8");
  for (const [route, title, summary] of [
    ["folded", "Friendly guide", "A useful summary."],
    ["quoted", 'Quoted "title"', "Reader's guide"],
    ["numeric", "2026", "123"],
    ["zero", "0", "0"],
  ]) {
    const entry = entries.find((item) => item.url === `/${route}`);
    assert.equal(entry?.title, title, route);
    assert.equal(entry.snippet, summary, route);
    assert.ok(corpus.includes(`# ${title}\nSource: https://docs.openclaw.ai/${route}\n`), route);
    const html = fs.readFileSync(path.join(site, route, "index.html"), "utf8");
    const document = parseDocument(html);
    const heading = DomUtils.findOne((node) => node.name === "h1", document.children);
    const description = DomUtils.findOne((node) => node.name === "meta" && node.attribs.name === "description", document.children);
    assert.equal(DomUtils.textContent(heading), title, route);
    assert.equal(description.attribs.content, summary, route);
  }
  assert.doesNotMatch(corpus, /title: >-|summary: >-/);
});

test("the English corpus includes nested locale names and excludes locale roots", (t) => {
  const f = fixture(t, [], {
    "guide/fr/topic.md": "# Nested French-named directory\n\nEnglish content.\n",
    "guide/de/other.mdx": "# Another nested directory\n",
    "fr/translated.md": "# Translated locale root\n",
  });
  const built = f.build();
  assert.equal(built.status, 0, built.stderr);
  generate(f, "llms-full.mjs");
  const corpus = fs.readFileSync(path.join(f.root, "dist/docs-llms-full/llms-full.txt"), "utf8");
  for (const route of ["guide/fr/topic", "guide/de/other"]) {
    assert.ok(fs.existsSync(path.join(f.root, "dist/docs-site", route, "index.html")));
    assert.ok(corpus.includes(`Source: https://docs.openclaw.ai/${route}\n`), route);
  }
  assert.doesNotMatch(corpus, /Translated locale root/);
});

test("deep navigation pages receive a rendered page-specific preview image", (t) => {
  const f = fixture(t, [], { "guide/deep.md": "---\ntitle: Deep Navigation Guide\nsummary: A synthetic documentation example.\n---\n# Deep Navigation Guide\n" });
  write(f.root, "docs/docs.json", JSON.stringify({
    name: "OpenClaw",
    navigation: { languages: [{ language: "en", tabs: [{ tab: "Docs", groups: [{
      group: "Guides", pages: [{ group: "Outer", pages: [{ group: "Inner", pages: ["guide/deep"] }] }],
    }] }] }] },
  }));
  const built = f.build();
  assert.equal(built.status, 0, built.stderr);
  const site = path.join(f.root, "dist/docs-site");
  const png = fs.readFileSync(path.join(site, "og/guide/deep.png"));
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  const html = fs.readFileSync(path.join(site, "guide/deep/index.html"), "utf8");
  assert.match(html, /property="og:image" content="https:\/\/docs\.openclaw\.ai\/og\/guide\/deep\.png\?v=/);
});
