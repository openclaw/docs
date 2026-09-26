import assert from "node:assert/strict";
import test from "node:test";
import { homeContentHtml } from "./home-content.mjs";

test("landing composition preserves source prose, links and anchors while promoting quick links", () => {
  const intro = '<h1 id="source-title">Title</h1><blockquote>Quote</blockquote><p align="center">Centered source <a href="/source">link</a>.</p>';
  const cards = '<div class="oc-card-grid"><a href="/start"><strong>Start</strong><p>Instructions.</p></a></div>';
  const remainder = '<h2 id="details">Details</h2><p>More source prose.</p>';
  const result = homeContentHtml(intro + cards + remainder);
  assert.equal(result, cards + `<div class="home-intro">${intro}</div>` + remainder);
});

test("only the initial known brand pair is replaced; substantive and later images survive", () => {
  const pair = '<p><img src="/assets/openclaw-hero-light.png"><img src="/assets/openclaw-hero-dark.png"></p>';
  const title = '<h1 id="brand">Brand</h1>';
  assert.equal(homeContentHtml(title + pair + '<p>Source.</p>'), title + '<p>Source.</p>');
  for (const html of [
    title + pair.replace('</p>', 'Source caption.</p>'),
    title + '<p>Introduction.</p>' + pair,
    title + '<p><img src="/assets/example.png"></p>',
  ]) assert.equal(homeContentHtml(html), html);
});
