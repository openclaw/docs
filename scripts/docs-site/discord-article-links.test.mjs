import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { DomUtils, parseDocument } from "htmlparser2";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

const placements = {
  "help/faq": "docs-help-faq",
  "install/updating": "docs-install-updating",
  "plugins/building-plugins": "docs-plugins-building-plugins",
  "guide": "docs",
  "constructor": "docs",
};
const official = ["https://discord.gg/clawd", "https://discord.com/invite/clawd", "https://discordapp.com/invite/clawd/"];
const preserved = [
  "https://discord.gg/other", "https://discord.com/invite/other", "https://discord.gg/clawd-extra", "https://discord.gg:8443/clawd",
  "https://discord.com/api/v10/invites/clawd", "https://discord.gg/clawd?event=123456789012345678",
  "https://discord.com/invite/clawd#event", "https://discord.gg/clawd?utm_source=legacy",
  "https://discord.gg.example.org/clawd", "https://example.org/?invite=https://discord.gg/clawd",
  "https://openclaw.ai/discord?from=docs-plugins-building-plugins", "https://community.openclaw.ai/",
];

function article(document) {
  return DomUtils.findOne(node => node.attribs?.class?.split(" ").includes("doc"), document.children);
}

test("English and localized rendered article anchors use canonical page placements, including cached articles", t => {
  const body = ["# Community", ...official.map((href, i) => `[Official ${i}](${href})`),
    '<a class="raw-link" data-href="https://example.org/unchanged" href=\'https://discord.gg/clawd\' title="Keep href=example title">Raw HTML</a>',
    ...preserved.map((href, i) => `[Preserve ${i}](${href})`),
    "`https://discord.gg/clawd`", "```html\n<a href=\"https://discord.gg/clawd\">Example</a>\n```",
    '<p class="display-url">https://discord.gg/clawd</p>', '<code><a href="https://discord.gg/clawd">Code anchor</a></code>',
  ].join("\n\n");
  const sources = {};
  for (const locale of ["en", "fr"]) for (const slug of Object.keys(placements)) sources[`${locale === "en" ? "" : locale + "/"}${slug}.md`] = body;
  const f = fixture(t, [], sources);
  write(f.root, "docs/docs.json", JSON.stringify({ name: "Article placement fixture", navigation: { languages: ["en", "fr"].map(language => ({ language, tabs: [] })) } }));
  for (let pass = 0; pass < 2; pass++) {
    const built = f.build();
    assert.equal(built.status, 0, built.stderr);
    if (pass) assert.match(built.stdout, /article cache: \d+ reused, 0 rendered/);
    for (const locale of ["en", "fr"]) for (const [slug, tag] of Object.entries(placements)) {
      const html = fs.readFileSync(path.join(f.root, "dist/docs-site", locale === "en" ? "" : locale, slug, "index.html"), "utf8");
      const doc = article(parseDocument(html));
      assert.ok(doc, `${locale}/${slug}`);
      const anchors = DomUtils.findAll(node => node.name === "a", doc.children);
      for (let i = 0; i < official.length; i++) assert.equal(anchors.find(node => DomUtils.textContent(node) === `Official ${i}`).attribs.href, `https://openclaw.ai/discord?from=${tag}`);
      const raw = anchors.find(node => node.attribs.class === "raw-link");
      assert.equal(raw.attribs.href, `https://openclaw.ai/discord?from=${tag}`);
      assert.equal(raw.attribs["data-href"], "https://example.org/unchanged"); assert.equal(raw.attribs.title, "Keep href=example title");
      for (let i = 0; i < preserved.length; i++) assert.equal(anchors.find(node => DomUtils.textContent(node) === `Preserve ${i}`).attribs.href, preserved[i]);
      const code = DomUtils.findAll(node => node.name === "code", doc.children).map(node => DomUtils.textContent(node));
      assert.ok(code.some(text => text.includes('href="https://discord.gg/clawd"')), "fenced code is unchanged");
      assert.ok(code.some(text => text === "https://discord.gg/clawd"), "inline code is unchanged");
      assert.equal(anchors.find(node => DomUtils.textContent(node) === "Code anchor").attribs.href, "https://discord.gg/clawd");
      const display = DomUtils.findOne(node => node.attribs?.class === "display-url", doc.children);
      assert.equal(DomUtils.textContent(display), "https://discord.gg/clawd", "display text is not rewritten");
      assert.equal(fs.readFileSync(path.join(f.root, "docs", locale === "en" ? "" : locale, slug + ".md"), "utf8"), body);
    }
  }
});
