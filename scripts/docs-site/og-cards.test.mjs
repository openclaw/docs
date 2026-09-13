import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

test("preview image URLs follow PNG changes without churning for body-only edits", (t) => {
  const f = fixture(t, [], { "guide.md": "# Guide\n", "fr/guide.md": "# Guide français\n" });
  write(f.root, "docs/docs.json", JSON.stringify({
    name: "OpenClaw", navigation: { languages: ["en", "fr"].map((language) => ({
      language, tabs: [{ tab: "Docs", groups: [{ group: "Guides", pages: ["guide"] }] }],
    })) },
  }));
  const build = (title, body) => {
    write(f.root, "docs/guide.md", `---\ntitle: ${title}\n---\n# Guide\n\n${body}\n`);
    const result = f.build();
    assert.equal(result.status, 0, result.stderr);
    const site = path.join(f.root, "dist/docs-site");
    const imageUrl = (locale = "") => fs.readFileSync(path.join(site, locale, "guide/index.html"), "utf8")
      .match(/property="og:image" content="([^"]+)"/)[1];
    return { url: imageUrl(), fallback: imageUrl("fr"), png: fs.readFileSync(path.join(site, "og/guide.png")) };
  };
  const before = build("Original guide", "Original body.");
  const changed = build("Updated guide", "Original body.");
  assert.notDeepEqual(changed.png, before.png, "the title update changes the rendered image");
  assert.notEqual(changed.url, before.url, "clients must receive a new cache key for the new image");
  assert.equal(new URL(changed.url).pathname, new URL(before.url).pathname, "the public image path stays stable");
  assert.equal(changed.fallback, before.fallback, "the unchanged locale fallback keeps its own image version");
  const bodyOnly = build("Updated guide", "A different article body.");
  assert.deepEqual(bodyOnly.png, changed.png);
  assert.equal(bodyOnly.url, changed.url, "unchanged image bytes retain their cache key");
});
