import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { parseDocument, DomUtils } from "htmlparser2";
import { createMarkdownRenderer, renderMdxish } from "./mdx-ish.mjs";
import { homeContentHtml } from "./home-content.mjs";
import { homeLayoutHtml } from "./home-layout.mjs";

const source = fs.readFileSync(new URL("../../docs/index.md", import.meta.url), "utf8");
const rendered = renderMdxish(source, createMarkdownRenderer());
const original = parseDocument(homeContentHtml(rendered));
const result = parseDocument(homeLayoutHtml(rendered, () => ""));
const elements = (document, predicate) => DomUtils.findAll(predicate, document.children);
const ids = new Set(elements(result, (node) => node.attribs.id).map((node) => node.attribs.id));

test("the composed homepage retains source text, links, and anchors without a disclosure gate", () => {
  const remaining = elements(result, (node) => ["p", "h1", "h2", "h3", "pre"].includes(node.name))
    .map((node) => DomUtils.textContent(node));
  for (const node of elements(original, (node) => ["p", "h1", "h2", "h3", "pre"].includes(node.name))) {
    const content = DomUtils.textContent(node);
    const index = remaining.indexOf(content);
    assert.notEqual(index, -1, `Missing source content: ${content}`);
    remaining.splice(index, 1);
  }
  const links = elements(result, (node) => node.name === "a").map((node) => node.attribs.href);
  for (const node of elements(original, (node) => node.name === "a")) {
    const index = links.indexOf(node.attribs.href);
    assert.notEqual(index, -1, `Missing source link: ${node.attribs.href}`);
    links.splice(index, 1);
  }
  for (const node of elements(original, (node) => node.attribs.id)) {
    assert.ok(ids.has(node.attribs.id), `Missing source anchor: ${node.attribs.id}`);
  }
  assert.equal(elements(result, (node) => node.name === "details" && !Object.hasOwn(node.attribs, "open")).length, 0);
});
