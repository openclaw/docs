import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDocument, DomUtils } from "htmlparser2";
import { communitySection } from "./home-sections.mjs";
import { localeLabels } from "./config.mjs";

test("every locale uses the registered home Discord placement without a new acquisition campaign", () => {
  for (const locale of Object.keys(localeLabels)) {
    const document = parseDocument(communitySection(() => "", locale));
    const link = DomUtils.findOne(node => node.attribs?.class === "home-discord-button", document.children);
    const url = new URL(link.attribs.href);
    assert.equal(url.origin + url.pathname, "https://openclaw.ai/discord", locale);
    assert.deepEqual([...url.searchParams], [["from", "docs-home-community"]], locale);
    assert.ok(DomUtils.findOne(node => node.name === "a" && node.attribs.href === "https://community.openclaw.ai/", document.children), locale);
  }
});
