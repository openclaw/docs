import { parseDocument } from "htmlparser2";

// Present the source-owned quick links first on the landing page. Keep all prose,
// links and anchors; only the redundant initial brand illustration is replaced by
// the shell's hero. Slice original HTML so this does not become a second renderer.
export function homeContentHtml(html) {
  const parse = (value) => parseDocument(value, { withStartIndices: true, withEndIndices: true });
  const elements = parse(html).children.filter((node) => node.type === "tag");
  const branding = elements[0]?.name === "h1" ? elements[1] : elements[0];
  const children = branding?.children?.filter((node) => node.type !== "text" || node.data.trim()) ?? [];
  const images = children.filter((node) => node.name === "img");
  if (branding?.name === "p" && children.length === 2 && images.length === 2
    && ["light", "dark"].every((mode) => images.some((node) =>
      node.attribs.src?.endsWith(`/assets/openclaw-hero-${mode}.png`)))) {
    html = html.slice(0, branding.startIndex) + html.slice(branding.endIndex + 1);
  }
  const cards = parse(html).children.find((node) => node.name === "div"
    && node.attribs.class?.split(/\s+/).includes("oc-card-grid"));
  if (!cards) return html;
  return html.slice(cards.startIndex, cards.endIndex + 1)
    + `<div class="home-intro">${html.slice(0, cards.startIndex)}</div>`
    + html.slice(cards.endIndex + 1);
}
