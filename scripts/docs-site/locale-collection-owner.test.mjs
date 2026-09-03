import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

const origin = "https://docs.openclaw.ai";
const english = {
  "index.md": "# English home\n",
  "target.mdx": "# English target\n\n## Part\nTarget body\n",
  "fallback.md": "# English fallback\n",
  "guide/de/topic.mdx": "# Nested German name\n",
  "guide/ja/topic.md": "# Nested Japanese name\n",
  "guide/eo/topic.md": "# Nested custom locale name\n",
  "unknown/topic.md": "# Unknown root\n",
  "ja/topic.md": "# Unmapped root name\n",
};
const translations = {
  "de/index.md": "# Deutsch\n",
  "de/target.mdx": "# Deutsches Ziel\n\n[Translated](/target#part)\n\n[Fallback](/fallback)\n\n[Explicit fallback](/de/fallback)\n",
  "de/guide/de/topic.md": "# Verschachtelt\n",
  "ja-JP/index.mdx": "# 日本語\n",
  "ja-JP/target.md": "# 日本語の対象\n",
  "fr/index.md": "# Français\n",
  "fr/target.mdx": "# Cible française\n",
  "eo/index.md": "# Esperanto\n",
  "eo/target.mdx": "# Celo\n",
};
const englishRoutes = ["/", "/target", "/fallback", "/guide/de/topic", "/guide/ja/topic", "/guide/eo/topic", "/unknown/topic", "/ja/topic"];
const localeRoutes = ["/de", "/de/target", "/de/guide/de/topic", "/ja-JP", "/ja-JP/target", "/fr", "/fr/target", "/eo", "/eo/target"];
const nav = (language, tab, pages) => ({ language, tabs: [{ tab, groups: [{ group: tab, pages }] }] });

for (const base of ["", "/manual"]) {
  test(`builder gives each locale its own sources with base ${base || "(root)"}`, (t) => {
    const f = fixture(t, [], { ...english, ...translations }, base);
    write(f.root, "docs/docs.json", JSON.stringify({
      name: "Locale ownership fixture",
      navigation: { languages: [
        nav("en", "English navigation", ["index", "target", "fallback", "guide/de/topic"]),
        nav("de", "Deutsche Navigation", ["de/index", "de/target", "de/fallback", { group: "Nested", pages: ["de/guide/de/topic"] }]),
        nav("ja", "日本語ナビ", ["ja-JP/index", "ja-JP/target"]),
        nav("eo", "Esperanta navigado", ["eo/index", "eo/target"]),
        nav("es", "Absent locale", ["index", "target"]),
        // French is discovered from the tree and inherits the first navigation.
      ] },
      redirects: [
        { source: "/old", destination: "/target#part" },
        { source: "/missing-translation", destination: "/fallback" },
        { source: "/de/explicit", destination: "/de/target#part" },
        { source: "/es/explicit", destination: "/es/target" },
        { source: "/old-root", destination: "/" },
      ],
    }));
    for (const prefix of ["", "de/", "eo/"]) {
      for (const rel of ["AGENTS.md", ".i18n/hidden.md", ".generated/hidden.mdx", "assets/hidden.md", ".hidden/page.md"]) {
        write(f.root, `docs/${prefix}${rel}`, "# Ignored source\n");
      }
    }

    // Full mode exercises collection-derived indexes and redirects, not just the
    // surviving files after duplicate HTML writes have overwritten one another.
    const built = f.build({ DOCS_SITE_ARTIFACT_MODE: "full" });
    assert.equal(built.status, 0, built.stderr);
    assert.equal(Number(built.stdout.match(/built (\d+) pages/)?.[1]), 18, built.stdout);

    const site = path.join(f.root, "dist/docs-site");
    const read = (rel) => fs.readFileSync(path.join(site, rel), "utf8");
    const html = (route) => read(`${route === "/" ? "" : route.slice(1) + "/"}index.html`);
    const sitemapRoutes = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    assert.deepEqual(sitemapRoutes.sort(), [...englishRoutes, ...localeRoutes].sort());
    const llmsRoutes = [...read("llms.txt").split("## Documentation Index\n")[1].matchAll(/\]\(([^)]+)\)/g)].map((m) => new URL(m[1]).pathname);
    assert.deepEqual(llmsRoutes.sort(), [...englishRoutes].sort());
    assert.equal(read("llms.txt"), read(".well-known/llms.txt"));

    for (const [source, content] of Object.entries({ ...english, ...translations })) {
      assert.equal(read(source.replace(/\.mdx$/, ".md")), content, source);
    }
    for (const route of englishRoutes) assert.match(html(route), /<html lang="en"/);
    for (const route of localeRoutes) {
      const locale = route.split("/")[1];
      assert.ok(html(route).includes(`<html lang="${locale}"`), route);
      assert.ok(html(route).includes(`<link rel="canonical" href="${origin}${route}">`), route);
    }
    const german = html("/de/target");
    const sidebar = german.match(/<aside class="sidebar">([\s\S]*?)<\/aside>/)[1];
    assert.ok(sidebar.includes("Deutsche Navigation"));
    assert.ok(sidebar.includes(`class="nav-link active" href="${base}/de/target"`));
    assert.ok(sidebar.includes(`href="${base}/de/guide/de/topic"`));
    assert.ok(!sidebar.includes("English fallback"), "untranslated entries stay out of locale navigation");
    assert.ok(html("/fr/target").includes(`class="nav-link active" href="${base}/fr/target"`));
    assert.ok(html("/eo/target").includes("Esperanta navigado"));
    assert.ok(german.includes(`href="${base}/de/target#part">Translated</a>`));
    assert.ok(german.includes(`href="${base}/fallback">Fallback</a>`));
    assert.ok(german.includes(`href="${base}/fallback">Explicit fallback</a>`));
    assert.ok(html("/fallback").includes(`href="${base}/de/" data-locale-option`), "picker falls back to locale home");
    assert.ok(!german.includes("Español"), "an absent configured tree is not a published locale");
    assert.ok(german.includes(`hreflang="en" href="${origin}/target"`));
    assert.ok(german.includes(`hreflang="ja-JP" href="${origin}/ja-JP/target"`));
    assert.ok(german.includes(`hreflang="eo" href="${origin}/eo/target"`));
    assert.match(html("/__elements"), /noindex,nofollow/);

    for (const rel of ["AGENTS/index.html", "de/AGENTS/index.html", "eo/AGENTS.md", "de.md", "fr.md", "ja-JP.md", "eo.md", "es/index.html", "de/fallback/index.html", "assets/hidden/index.html", "de/.i18n/hidden.md"]) {
      assert.equal(fs.existsSync(path.join(site, rel)), false, rel);
    }
    const redirects = JSON.parse(fs.readFileSync(path.join(f.root, "dist/docs-markdown-redirects.json"), "utf8"));
    for (const prefix of [...new Set(["", "/docs", base])]) {
      for (const [alias, destination, markdown] of [
        ["/old", "/target#part", "/target.md#part"],
        ["/de/old", "/de/target#part", "/de/target.md#part"],
        ["/eo/old", "/eo/target#part", "/eo/target.md#part"],
        ["/de/explicit", "/de/target#part", "/de/target.md#part"],
        ["/es/explicit", "/target", "/target.md"],
        ["/de/missing-translation", "/fallback", "/fallback.md"],
        ["/de/old-root", "/de", "/de/index.md"],
      ]) {
        assert.ok(html(prefix + alias).includes(`location.replace(${JSON.stringify(base + destination)})`), prefix + alias);
        assert.equal(redirects[`${prefix}${alias}/index.html`.slice(1)], markdown);
      }
    }
    for (const target of Object.values(redirects)) {
      assert.ok(fs.existsSync(path.join(site, new URL(target, origin).pathname)), target);
    }
  });
}
