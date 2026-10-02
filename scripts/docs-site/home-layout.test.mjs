import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { parseDocument, DomUtils } from "htmlparser2";
import { createMarkdownRenderer, renderMdxish } from "./mdx-ish.mjs";
import { homeContentHtml } from "./home-content.mjs";
import { homeLayoutHtml } from "./home-layout.mjs";
import { homeStrings } from "./home-strings.mjs";
import { localeLabels } from "./config.mjs";

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

test("every locale supplies the same complete homepage and navigation copy", () => {
  const shape = (value) => Array.isArray(value) ? value.map(shape) : typeof value;
  assert.deepEqual(Object.keys(homeStrings).sort(), Object.keys(localeLabels).sort());
  for (const [locale, copy] of Object.entries(homeStrings)) {
    assert.deepEqual(Object.keys(copy), Object.keys(homeStrings.en), locale);
    for (const key of Object.keys(copy)) {
      assert.deepEqual(shape(copy[key]), shape(homeStrings.en[key]), `${locale}.${key}`);
      assert.ok(copy[key].flat(Infinity).every((text) => typeof text === "string" && text.trim()), `${locale}.${key}`);
    }
  }
});

for (const locale of Object.keys(localeLabels)) {
  test(`${locale} homepage uses the shared section layout and preserves its translated source`, () => {
    const file = new URL(`../../docs/${locale === "en" ? "" : locale + "/"}index.md`, import.meta.url);
    const html = renderMdxish(fs.readFileSync(file, "utf8"), createMarkdownRenderer());
    const before = parseDocument(homeContentHtml(html));
    const after = parseDocument(homeLayoutHtml(html, () => "", null, locale));
    const root = elements(after, (node) => node.attribs.class === "home-layout")[0];
    const classes = root.children.filter((node) => node.type === "tag").map((node) => node.attribs.class);
    const reference = elements(result, (node) => node.attribs.class === "home-layout")[0]
      .children.filter((node) => node.type === "tag").map((node) => node.attribs.class);
    assert.deepEqual(classes, reference, "localized headings must not change section placement");
    const remainingText = elements(after, (node) => ["p", "h1", "h2", "h3", "pre"].includes(node.name)).map(DomUtils.textContent);
    const remainingLinks = elements(after, (node) => node.name === "a").map((node) => node.attribs.href);
    const remainingIds = new Set(elements(after, (node) => node.attribs.id).map((node) => node.attribs.id));
    for (const node of elements(before, (node) => ["p", "h1", "h2", "h3", "pre"].includes(node.name))) {
      const index = remainingText.indexOf(DomUtils.textContent(node));
      assert.notEqual(index, -1, `missing translated content: ${DomUtils.textContent(node)}`);
      remainingText.splice(index, 1);
    }
    for (const node of elements(before, (node) => node.name === "a")) {
      const index = remainingLinks.indexOf(node.attribs.href);
      assert.notEqual(index, -1, `missing source link: ${node.attribs.href}`);
      remainingLinks.splice(index, 1);
    }
    for (const node of elements(before, (node) => node.attribs.id)) assert.ok(remainingIds.has(node.attribs.id), node.attribs.id);
    assert.ok(DomUtils.textContent(after).includes(homeStrings[locale].tagline[0]));
    assert.equal(elements(after, (node) => node.attribs.class === "docs-hero").length, 0);
  });
}
