import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { resolvePreviewPaths } from "./preview-paths.mjs";
import { fixture, run, write } from "./test-helpers/redirect-fixture.mjs";

function previewFixture(t) {
  const slugs = Array.from({ length: 35 }, (_, i) => `guide/page-${i}`);
  const f = fixture(t, [], {
    ...Object.fromEntries(slugs.map((slug) => [`${slug}.md`, `# ${slug}\n`])),
    "target.mdx": "# Requested page\n\n[Omitted page](/guide/page-34)\n",
    "fr/target.md": "# Cible\n",
    "guide/de/topic.md": "# Nested locale name\n",
  });
  write(f.root, "docs/docs.json", JSON.stringify({
    navigation: { languages: ["en", "fr"].map((language) => ({ language, tabs: [{
      tab: "Docs", groups: slugs.map((slug) => ({ group: slug, pages: [slug] })),
    }] })) },
  }));
  const build = (args = [], env = {}, imports = []) => run(f.root, "build.mjs", env, imports, { args });
  const site = path.join(f.root, "dist/docs-site");
  const htmlPages = () => fs.readdirSync(site, { recursive: true }).filter((file) => file.endsWith("index.html"));
  return { ...f, build, site, htmlPages };
}

test("requested pages outside navigation fit inside the 30-page preview, including the fixture", (t) => {
  const f = previewFixture(t);
  const built = f.build(["--page", "/target/", "--page", "guide/de/topic", "--page", "target"], {
    DOCS_SITE_PREVIEW_MAX_PAGES: "100",
    DOCS_SITE_PREVIEW_INCLUDE_FIXTURE: "1",
  });
  assert.equal(built.status, 0, built.stderr);
  assert.equal(f.htmlPages().length, 30);
  for (const route of ["target", "guide/de/topic", "__elements"]) {
    assert.ok(fs.existsSync(path.join(f.site, route, "index.html")), route);
  }
  const html = fs.readFileSync(path.join(f.site, "target/index.html"), "utf8");
  assert.match(html, /Requested page/);
  const sidebar = html.match(/<aside class="sidebar">([\s\S]*?)<\/aside>/)[1];
  assert.equal([...sidebar.matchAll(/class="nav-link/g)].length, 35);
  assert.match(sidebar, /href="\/guide\/page-0"/);
  assert.match(sidebar, /href="https:\/\/docs\.openclaw\.ai\/guide\/page-34" data-preview-live/);
  assert.match(html, /Full navigation shown; 30 pages built locally/);
  assert.match(html, /href="https:\/\/docs\.openclaw\.ai\/guide\/page-34"/);
  for (const file of ["fr", "sitemap.xml", "llms.txt", "robots.txt", "og"]) {
    assert.equal(fs.existsSync(path.join(f.site, file)), false, file);
  }
  assert.equal(fs.existsSync(path.join(f.root, "dist/docs-markdown-redirects.json")), false);
});

test("English preview skips translated sources and assets before traversing them", (t) => {
  const f = previewFixture(t);
  write(f.root, "docs/fr/image.svg", "<svg/>");
  write(f.root, "docs/images/shared.svg", "<svg/>");
  const guard = path.join(f.root, "guard.mjs");
  write(f.root, "guard.mjs", `import fs from "node:fs";
const original = fs.readdirSync;
fs.readdirSync = (dir, ...args) => {
  if (String(dir).startsWith(${JSON.stringify(path.join(f.root, "docs/fr"))})) {
    throw new Error("Preview traversed a translated tree");
  }
  return original(dir, ...args);
};
`);
  const built = f.build([], { DOCS_SITE_PREVIEW_PAGES_PER_GROUP: "1" }, [guard]);
  assert.equal(built.status, 0, built.stderr);
  assert.equal(f.htmlPages().length, 30);
  assert.equal(fs.existsSync(path.join(f.site, "fr")), false);
  assert.ok(fs.existsSync(path.join(f.site, "images/shared.svg")));
});

test("a one-page preview includes only the requested page", (t) => {
  const f = previewFixture(t);
  const built = f.build(["--page", "target"], { DOCS_SITE_PREVIEW_MAX_PAGES: "1" });
  assert.equal(built.status, 0, built.stderr);
  assert.deepEqual(f.htmlPages(), ["target/index.html"]);
});

test("preview rejects missing pages and requests larger than its page budget", (t) => {
  const f = previewFixture(t);
  for (const [args, env, message] of [
    [["--page", "missing"], {}, /Preview page not found/],
    [["--page", "fr/target"], {}, /Preview page not found/],
    [["--page", "target"], { DOCS_SITE_PREVIEW_MAX_PAGES: "1", DOCS_SITE_PREVIEW_INCLUDE_FIXTURE: "1" }, /exceed.*limit/i],
  ]) {
    const built = f.build(args, env);
    assert.notEqual(built.status, 0);
    assert.match(built.stderr, message);
  }
});

test("external source preview renders unsynced content, snippets, navigation and assets without changing either input", (t) => {
  const publisher = previewFixture(t);
  const source = previewFixture(t);
  write(source.root, "docs/target.mdx", '# Unsynced title\n\n<Snippet file="./part.md" />\n\n![Source image](/images/source.svg)\n');
  write(source.root, "docs/part.md", "## Source snippet\n\nUnsynced snippet content\n");
  write(source.root, "docs/images/source.svg", '<svg xmlns="http://www.w3.org/2000/svg"><title>Unsynced asset</title></svg>');
  const config = JSON.parse(fs.readFileSync(path.join(source.root, "docs/docs.json"), "utf8"));
  config.navigation.languages[0].tabs[0].tab = "Unsynced navigation";
  write(source.root, "docs/docs.json", JSON.stringify(config));
  write(publisher.root, "dist/docs-markdown-redirects.json", "preserve publishing metadata");
  const snapshot = (root) => Object.fromEntries(fs.readdirSync(path.join(root, "docs"), { recursive: true })
    .filter((file) => fs.statSync(path.join(root, "docs", file)).isFile())
    .map((file) => [file, fs.readFileSync(path.join(root, "docs", file), "utf8")]));
  const before = [snapshot(source.root), snapshot(publisher.root)];
  const output = path.join(source.root, ".cache/docs-preview");
  const args = ["--source-root", source.root, "--output-dir", output, "--page", "target"];
  let built = publisher.build(args);
  assert.equal(built.status, 0, built.stderr);
  const html = fs.readFileSync(path.join(output, "target/index.html"), "utf8");
  for (const content of ["Unsynced title", "Unsynced snippet content", "Unsynced navigation", 'id="source-snippet"']) assert.ok(html.includes(content), content);
  assert.equal(fs.readFileSync(path.join(output, "images/source.svg"), "utf8"), fs.readFileSync(path.join(source.root, "docs/images/source.svg"), "utf8"));
  assert.ok(fs.statSync(path.join(output, "assets/docs-site.css")).size > 0);
  assert.equal(fs.readdirSync(output, { recursive: true }).filter((file) => file.endsWith("index.html")).length, 30);
  assert.equal(fs.existsSync(path.join(output, "fr")), false);
  assert.equal(fs.existsSync(path.join(output, "sitemap.xml")), false);
  assert.equal(fs.readFileSync(path.join(publisher.root, "dist/docs-markdown-redirects.json"), "utf8"), "preserve publishing metadata");
  assert.deepEqual([snapshot(source.root), snapshot(publisher.root)], before);
  write(source.root, "docs/part.md", "Updated unsynced snippet\n");
  built = publisher.build(args);
  assert.equal(built.status, 0, built.stderr);
  assert.match(fs.readFileSync(path.join(output, "target/index.html"), "utf8"), /Updated unsynced snippet/);
});

test("preview validates source and output before touching existing files", (t) => {
  const f = previewFixture(t);
  const output = path.join(f.root, ".cache/output");
  write(f.root, ".cache/output/keep.txt", "Keep me");
  for (const args of [
    ["--source-root", path.join(f.root, "missing"), "--output-dir", output],
    ["--source-root", "relative", "--output-dir", output],
    ["--source-root", f.root],
    ["--output-dir", "relative"],
    ["--output-dir", output],
    ["--output-dir", f.root],
    ["--output-dir", path.dirname(f.root)],
    ["--output-dir", path.join(f.root, "docs/new-directory")],
    ["--output-dir", path.join(f.root, "scripts/new-directory")],
  ]) {
    const built = f.build(args);
    assert.notEqual(built.status, 0, JSON.stringify(args));
    assert.equal(fs.readFileSync(path.join(output, "keep.txt"), "utf8"), "Keep me");
    assert.ok(fs.existsSync(path.join(f.root, "docs/target.mdx")));
  }
});

test("preview output cannot erase tracked files or escape through symlinked ancestors", (t) => {
  const f = previewFixture(t);
  const args = (output) => ({ "source-root": f.root, "output-dir": output });
  fs.mkdirSync(path.join(f.root, ".cache"));
  fs.symlinkSync(path.join(f.root, "docs"), path.join(f.root, ".cache/link"));
  assert.throws(() => resolvePreviewPaths(f.root, args(path.join(f.root, ".cache/link/new"))), /outside source/);
  write(f.root, ".cache/tracked/.openclaw-docs-preview", "marker");
  write(f.root, ".cache/tracked/keep.txt", "Tracked file");
  execFileSync("git", ["init", "--quiet", f.root]);
  execFileSync("git", ["-C", f.root, "add", ".cache/tracked/keep.txt"]);
  assert.throws(() => resolvePreviewPaths(f.root, args(path.join(f.root, ".cache/tracked"))), /tracked files/);
  assert.equal(fs.readFileSync(path.join(f.root, ".cache/tracked/keep.txt"), "utf8"), "Tracked file");
});
