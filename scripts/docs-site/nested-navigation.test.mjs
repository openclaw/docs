import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

// Exact docs.json subtree mirrored at 60887fb76 from openclaw/openclaw@e3e2953f.
const protocolGroup = JSON.parse(fs.readFileSync(new URL("./fixtures/nested-navigation.json", import.meta.url), "utf8"));
const reportedPages = ["auth-credential-semantics", "gateway/1password", "gateway/audit"];
function leaves(entries) {
  return entries.flatMap((entry) => typeof entry === "string" ? [entry] : leaves(entry.pages));
}

for (const base of ["", "/manual"]) {
  test(`nested upstream navigation renders only page links with base ${base || "(root)"}`, (t) => {
    const slugs = [...reportedPages, ...leaves(protocolGroup.pages)];
    const sources = Object.fromEntries(slugs.flatMap((slug) => [
      [`${slug}.md`, `# Page ${slug}\n\nNavigation fixture.\n`],
      [`fr/${slug}.md`, `# Page française ${slug}\n`],
    ]));
    const f = fixture(t, [], sources, base);
    write(f.root, "docs/docs.json", JSON.stringify({
      name: "Nested navigation fixture",
      navigation: { languages: ["en", "fr"].map((language) => ({ language, tabs: [{
        tab: "Gateway & Ops",
        groups: [{ group: "Gateway", pages: [protocolGroup, ...reportedPages] }],
      }] })) },
    }));
    const built = f.build();
    assert.equal(built.status, 0, built.stderr);
    for (const locale of ["", "fr/"]) {
      for (const slug of reportedPages) {
        const html = fs.readFileSync(path.join(f.root, "dist/docs-site", locale, slug, "index.html"), "utf8");
        assert.ok(!html.includes("undefined/undefined"), `${locale}${slug} must not link a group as a page`);
        const sidebar = html.match(/<aside class="sidebar">([\s\S]*?)<\/aside>/)[1];
        assert.ok(sidebar.includes('<h2>Protocols and APIs</h2>'));
        assert.ok(sidebar.includes('<h2>Gateway protocol</h2>'));
        for (const target of leaves(protocolGroup.pages)) {
          assert.ok(sidebar.includes(`href="${base}/${locale}${target}"`), `${locale}${slug} → ${target}`);
        }
        for (const match of html.matchAll(/href="(\/[^"?#]*)"/g)) {
          const route = match[1].slice(base.length).replace(/^\//, "");
          const site = path.join(f.root, "dist/docs-site");
          assert.ok(fs.existsSync(path.join(site, route)) || fs.existsSync(path.join(site, route, "index.html")), match[1]);
        }
      }
    }
  });
}

test("deep first pages and section metadata use descendant pages in normal and preview builds", (t) => {
  const f = fixture(t, [], { "guide/first.md": "# First\n", "guide/second.md": "# Second\n" });
  write(f.root, "docs/docs.json", JSON.stringify({
    name: "Deep navigation fixture",
    navigation: { languages: [{ language: "en", tabs: [{ tab: "Deep docs", groups: [{
      group: "Reference", pages: ["missing", { group: "Empty", pages: ["also-missing"] }, { group: "Outer", pages: [{ group: "Inner", pages: ["guide/first", "guide/second"] }] }],
    }] }] }] },
  }));
  for (const options of [{}, { DOCS_SITE_PREVIEW_LOCALE: "en", DOCS_SITE_PREVIEW_PAGES_PER_GROUP: "1" }]) {
    const built = f.build(options);
    assert.equal(built.status, 0, built.stderr);
    const html = fs.readFileSync(path.join(f.root, "dist/docs-site/guide/first/index.html"), "utf8");
    assert.ok(!html.includes("undefined/undefined"));
    assert.match(html, /class="tab-link active" href="\/guide\/first"/);
    assert.match(html, /class="mobile-tab-link active" href="\/guide\/first"/);
    assert.match(html, /class="breadcrumb-part breadcrumb-tab"><a href="\/guide\/first">Deep docs<\/a>/);
    assert.match(html, /data-pagefind-meta="section">Reference<\/span>/);
    assert.match(html, /class="nav-link active" href="\/guide\/first">First<\/a>/);
  }
});
