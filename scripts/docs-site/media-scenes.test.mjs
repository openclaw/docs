import assert from "node:assert/strict";
import test from "node:test";
import { parseDocument, DomUtils } from "htmlparser2";
import { createMarkdownRenderer, renderMdxish } from "./mdx-ish.mjs";

const render = (source) => parseDocument(renderMdxish(source, createMarkdownRenderer()));
const find = (document, predicate) => DomUtils.findAll(predicate, document.children);
const hasClass = (node, name) => node.attribs?.class?.split(/\s+/).includes(name);
const scenes = (document) => find(document, (node) => hasClass(node, "docs-media-scene"));

test("standalone HTML images and SVG illustrations receive backgrounds inside steps", () => {
  const document = render(`
<Steps>
  <Step title="Install OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        <img
          src="/assets/install-script.svg"
          alt="Install Script Process"
          className="rounded-lg"
        />
      </Tab>
    </Tabs>
  </Step>
</Steps>

![Group message flow](/images/groups-flow.svg)

<a href="/dashboard"><picture><source srcset="/dashboard.webp" type="image/webp"><img src="/dashboard.png" alt="Dashboard"></picture></a>
`);
  assert.equal(scenes(document).length, 3);
  for (const src of ["/assets/install-script.svg", "/images/groups-flow.svg", "/dashboard.png"]) {
    const scene = scenes(document).find((node) => find(node, (child) => child.attribs.src === src).length);
    assert.ok(scene, `${src} must have a presentation background`);
    assert.equal(scenes(scene).length, 0);
  }
  assert.equal(find(document, (node) => node.attribs.src === "/assets/install-script.svg")[0].attribs.alt, "Install Script Process");
  assert.equal(find(document, (node) => node.name === "source")[0].attribs.srcset, "/dashboard.webp");
  assert.equal(find(document, (node) => node.name === "a")[0].attribs.href, "/dashboard");
});

test("backgrounds vary by image and remain stable across page order, captions, and markup", () => {
  const sources = ["/dashboard.webp", "/settings.png", "/assets/install-script.svg", "/images/groups-flow.svg", "/onboarding.png", "/channels.png"];
  const backgrounds = (document) => new Map(scenes(document).map((scene) => [
    find(scene, (node) => node.name === "img" && !hasClass(node, "docs-media-background"))[0].attribs.src,
    find(scene, (node) => hasClass(node, "docs-media-background"))[0].attribs.src,
  ]));
  const original = backgrounds(render(sources.map((src) => `![Screenshot](${src})`).join("\n\n")));
  const reordered = backgrounds(render(sources.toReversed().map((src) => `<Frame caption="Outra legenda"><img src="${src}" alt="Captura"></Frame>`).join("\n\n")));
  assert.equal(original.size, sources.length);
  assert.ok(new Set(original.values()).size > 1, "different images should use different approved backgrounds");
  for (const src of sources) assert.equal(reordered.get(src), original.get(src), src);
});

test("article diagrams and demos share a single decorative frame without losing content or controls", () => {
  const document = render(`
\`\`\`mermaid
flowchart LR
  A[Chat] --> B[Gateway]
\`\`\`

<Frame caption="Connected channel">
[![Settings screenshot](/settings.png)](/channels)
</Frame>

![Dashboard screenshot](/dashboard.webp)

<video controls poster="/demo.webp"><source src="/demo.mp4" type="video/mp4"></video>

<iframe title="Product walkthrough" src="https://www.youtube-nocookie.com/embed/example" allowfullscreen></iframe>
`);
  assert.equal(scenes(document).length, 5);
  for (const scene of scenes(document)) {
    assert.equal(scenes(scene).length, 0, "explicit Frames must not receive nested frames");
    const backgrounds = find(scene, (node) => hasClass(node, "docs-media-background"));
    assert.equal(backgrounds.length, 1);
    assert.equal(backgrounds[0].attribs.alt, "");
    assert.equal(backgrounds[0].attribs.loading, "lazy");
  }
  assert.equal(find(document, (node) => node.attribs["data-mermaid"])[0].attribs["data-mermaid"], "flowchart LR\n  A[Chat] --> B[Gateway]");
  assert.equal(DomUtils.textContent(find(document, (node) => node.name === "figcaption")[0]), "Connected channel");
  assert.equal(find(document, (node) => node.name === "a")[0].attribs.href, "/channels");
  assert.equal(find(document, (node) => node.name === "video")[0].attribs.controls, "");
  assert.equal(find(document, (node) => node.name === "source")[0].attribs.src, "/demo.mp4");
  assert.equal(find(document, (node) => node.name === "iframe")[0].attribs.title, "Product walkthrough");
});

test("inline icons, brand illustrations, and source code are not turned into demos", () => {
  const document = render(`
Use ![Status](/status.png) next to the label.

<p><img src="/badge.png" width="24" alt="Status"></p>

<img src="/status.svg" width="24" alt="Status">

<p>See <a href="/status"><img src="/status.svg" alt="Status"></a> for details.</p>

<p><img src="/assets/openclaw-hero-light.png"><img src="/assets/openclaw-hero-dark.png"></p>

\`\`\`html
<video controls src="/example.mp4"></video>
\`\`\`
`);
  assert.equal(scenes(document).length, 0);
  assert.equal(find(document, (node) => node.name === "img").length, 6);
  assert.match(DomUtils.textContent(document), /Use\s+next to the label/);
  assert.equal(find(document, (node) => node.name === "img")[0].attribs.alt, "Status");
  assert.match(DomUtils.textContent(document), /<video controls src="\/example.mp4"><\/video>/);
});
