import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { DomUtils, parseDocument } from "htmlparser2";
import { chromeStrings } from "./chrome-strings.mjs";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

test("community artwork opts out of Pinterest without changing the invitation or other images in any locale", (t) => {
  const locales = Object.keys(chromeStrings);
  const f = fixture(t, [], {
    ...Object.fromEntries(locales.map(locale => [`${locale === "en" ? "" : `${locale}/`}index.md`, "# Home\n"])),
    "guide.md": "# Guide\n\n![Article image](/images/example.png)\n",
  }, "/manual");
  write(f.root, "docs/docs.json", JSON.stringify({
    name: "Community invitation fixture",
    navigation: { languages: locales.map(language => ({ language, tabs: [] })) },
  }));
  const built = f.build();
  assert.equal(built.status, 0, built.stderr);

  for (const [locale, slug] of [...locales.map(locale => [locale, "index"]), ["en", "guide"]]) {
    const file = path.join(f.root, "dist/docs-site", locale === "en" ? "" : locale, slug === "index" ? "" : slug, "index.html");
    const document = parseDocument(fs.readFileSync(file, "utf8"));
    const all = predicate => DomUtils.findAll(predicate, document.children);
    const invites = all(node => node.name === "aside" && node.attribs.class === "community-invite");
    assert.equal(invites.length, 1, `${locale}/${slug}: invitation remains in the shared shell`);
    const invite = invites[0];
    const art = DomUtils.findAll(node => node.name === "img", invite.children);
    assert.equal(art.length, 2);
    for (const [index, theme] of ["dark", "light"].entries()) {
      assert.deepEqual(art[index].attribs, {
        class: `community-invite__art community-invite__art--${theme}`,
        src: `/manual/assets/community-invite-${theme}.webp`,
        alt: "", width: "1024", height: "512", loading: "lazy", decoding: "async",
        nopin: "nopin", "data-pin-nopin": "true",
      }, `${locale}/${slug}: ${theme} artwork retains its presentation and image-level opt-outs`);
    }
    const strings = chromeStrings[locale];
    const title = DomUtils.findOne(node => node.attribs?.id === "community-invite-title", invite.children);
    assert.equal(invite.attribs["aria-labelledby"], title.attribs.id);
    assert.equal(DomUtils.textContent(title), strings.communityTitle);
    const body = DomUtils.findOne(node => node.attribs?.class === "community-invite__text", invite.children);
    assert.equal(DomUtils.textContent(body), strings.communityBody);
    const dismiss = DomUtils.findOne(node => node.name === "button" && "data-community-invite-dismiss" in node.attribs, invite.children);
    assert.equal(dismiss.attribs["aria-label"], strings.communityDismissLabel);
    const links = DomUtils.findAll(node => node.name === "a", invite.children);
    assert.deepEqual(links.map(node => [DomUtils.textContent(node).trim(), node.attribs.href]), [
      [strings.communityJoin, "https://www.reddit.com/r/openclaw/"],
      [strings.communityJoin, "https://discord.com/invite/clawd"],
      [strings.communityFollow, "https://x.com/openclaw"],
    ]);
    const optedOut = all(node => node.attribs && ("nopin" in node.attribs || "data-pin-nopin" in node.attribs));
    assert.deepEqual(optedOut, art, `${locale}/${slug}: only invitation images opt out`);
    assert.equal(all(node => node.name === "meta" && node.attribs.name === "pinterest").length, 0);
    assert.ok(all(node => node.name === "img" && !art.includes(node)).length > 0, "other images remain available");
  }
});
