import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
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
