import assert from "node:assert/strict";
import test from "node:test";

import { createMarkdownRenderer, renderMdxish } from "./mdx-ish.mjs";

const md = createMarkdownRenderer();
const source = '{\n  "note": "validate=false",\n  "enabled": true\n}\n';
const render = (info) => renderMdxish(`\`\`\`${info}\n${source}\`\`\``, md);

for (const lang of ["json", "json5", "jsonc"]) {
  test(`${lang} validation opt-out leaves the language label and code intact`, () => {
    assert.equal(render(`${lang} validate=false`), render(lang));
    assert.equal(render(`${lang} VALIDATE=FALSE`), render(lang));
  });
}

test("validation metadata preserves explicit labels and visual controls in either order", () => {
  for (const label of ['"Partial config"', "title=example.json", "filename=example.json", "label=Example"]) {
    const info = `json5 ${label} lines wrap expandable highlight=2 focus=3`;
    assert.equal(render(`${info} validate=false`), render(info));
    assert.equal(render(`json5 validate=false ${info.slice(6)}`), render(info));
  }
});

test("intentional labels containing validation text remain visible", () => {
  for (const label of ['"validate=false"', "'validate=false'", "title=validate=false", "label=validate=false"]) {
    assert.match(render(`text ${label}`), /<span class="oc-code-label">validate=false<\/span>/);
  }
  assert.match(render('text "About validate=false"'), /<span class="oc-code-label">About validate=false<\/span>/);
});
