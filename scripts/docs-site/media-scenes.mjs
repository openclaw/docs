import { createHash } from "node:crypto";
import { parseDocument } from "htmlparser2";

const imageTextures = [
  "mesh-coral-rise",
  "mesh-split-coral",
  "mesh-vermilion-margin",
  "mesh-ember-night",
  "mesh-silver-coral",
];

function mediaSource(node) {
  if (["img", "video", "iframe", "source"].includes(node.name)) {
    const src = node.attribs.src || node.attribs.srcset || node.attribs.poster;
    if (src) return src;
  }
  for (const child of node.children ?? []) {
    const src = mediaSource(child);
    if (src) return src;
  }
  return "";
}

function imageTexture(node) {
  // Key the artwork to the media, not page order, translated copy, or a build.
  const hash = createHash("sha256").update(mediaSource(node)).digest().readUInt32BE(0);
  return imageTextures[hash % imageTextures.length];
}

export function mediaSceneHtml(content, { texture = "mesh-silver-coral", className = "" } = {}) {
  const [width, height] = [1536, 1024];
  return `<div class="docs-media-scene${className ? ` ${className}` : ""}"><img class="docs-media-background" src="/assets/guide-bg-${texture}.webp" alt="" aria-hidden="true" width="${width}" height="${height}" loading="lazy" decoding="async"><div class="docs-media-content">${content}</div></div>`;
}

// Keep authored markup intact, including captions, links, theme variants and
// playback controls. Only standalone media gets a presentation frame.
export function frameArticleMedia(html) {
  const document = parseDocument(html, { withStartIndices: true, withEndIndices: true });
  const ranges = [];
  const children = (node) => (node.children ?? []).filter((child) => child.type !== "text" || child.data.trim());
  const media = (node) => {
    if (!node) return false;
    if (["picture", "video", "iframe"].includes(node.name)) return true;
    if (node.name === "a") {
      const nested = children(node);
      return nested.length === 1 && media(nested[0]);
    }
    if (node.name !== "img") return false;
    const src = node.attribs.src ?? "";
    const width = Number.parseFloat(node.attribs.width);
    return !/\/openclaw-hero-(?:light|dark)\.png(?:[?#]|$)/i.test(src)
      && !(width > 0 && width <= 96);
  };
  const visit = (node) => {
    if (["pre", "code"].includes(node.name)) return;
    const classes = node.attribs?.class?.split(/\s+/) ?? [];
    if (classes.includes("docs-media-scene")) return;
    const nested = children(node);
    const isFrame = classes.includes("oc-mermaid") || classes.includes("oc-frame");
    const isMediaParagraph = node.name === "p" && nested.length > 0 && nested.every(media);
    const isStandaloneMedia = media(node)
      && (!node.parent?.name || ["div", "section", "article", "figure", "li"].includes(node.parent.name));
    if (isFrame || isMediaParagraph || isStandaloneMedia) {
      ranges.push([node.startIndex, node.endIndex + 1, classes.includes("oc-mermaid") ? "mesh-ember-night" : imageTexture(node)]);
      return;
    }
    for (const child of nested) visit(child);
  };
  visit(document);
  for (const [start, end, texture] of ranges.reverse()) {
    html = html.slice(0, start) + mediaSceneHtml(html.slice(start, end), { texture }) + html.slice(end);
  }
  return html;
}
