import assert from "node:assert/strict";
import test from "node:test";

import { parseFrontmatter } from "./frontmatter.mjs";

test("parses YAML frontmatter and strips its delimiters", () => {
  assert.deepEqual(
    parseFrontmatter("---\ntitle: Docs\nread_when:\n  - testing\n---\n# Body\n"),
    {
      data: { title: "Docs", read_when: ["testing"] },
      content: "# Body\n",
    },
  );
});

test("returns unprefixed content without frontmatter", () => {
  assert.deepEqual(parseFrontmatter("# Body\n"), { data: {}, content: "# Body\n" });
});

test("accepts a UTF-8 byte-order mark", () => {
  assert.deepEqual(parseFrontmatter("\uFEFF---\ntitle: Docs\n---\n# Body\n"), {
    data: { title: "Docs" },
    content: "# Body\n",
  });
});
