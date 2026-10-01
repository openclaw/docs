import fs from "node:fs";

// Resolved dark-theme roles from docs-layout.css for the SVG rasterizer (which
// has no CSS custom-property cascade). Artwork and mark stay renderer-owned.
const color = {
  page: "#0c0d0d",       // --bg
  text: "#f0f1f2",       // --ink
  secondary: "#c4c7cb",  // --text
  accent: "#ef674c",     // --brand
};
const hero = fs.readFileSync(new URL("./assets/home-hero-diagonal-dark.svg", import.meta.url), "utf8");
const mark = fs.readFileSync(new URL("./assets/openclaw.svg", import.meta.url), "utf8");
const really = fs.readFileSync(new URL("./assets/og-really.svg", import.meta.url), "utf8");
const PAD_X = 64;
const CONTENT_WIDTH = 1072;
const TITLE_SIZES = [80, 72, 64, 56, 48];
const TITLE_BLOCK_TOP = 226;
const SUMMARY_SIZE = 28;
const ASCENT_RATIO = 0.8;
const LINE_HEIGHT_RATIO = 1.12;
const CONTENT_BOTTOM = 528;

export function renderDefaultOgSvg() {
  return frame("OpenClaw documentation — The AI that really does things.", `
  <g font-size="104" font-weight="600" letter-spacing="-2.7" fill="${color.text}">
    <text x="210" y="282">The AI that</text>
    ${really.replace("<svg ", '<svg x="718" y="162.8333" width="277.3333" height="151.6667" ')}
    <text x="600" y="405" text-anchor="middle">does things.</text>
  </g>
  <g font-size="28" fill="${color.secondary}" text-anchor="middle">
    <text x="600" y="495"><tspan font-weight="600" fill="${color.text}">Open source.</tspan> Run it on your machine or in the cloud,</text>
    <text x="600" y="534">with your own models or your choice of AI provider.</text>
  </g>`);
}

export function renderPageOgSvg({ title, kicker, summary }) {
  const safeTitle = (title || "Documentation").trim();
  const safeKicker = (kicker || "Documentation").trim();
  const safeSummary = (summary || "").trim();
  const titleFit = fitText(safeTitle, TITLE_SIZES, CONTENT_WIDTH, 2, 0.58);
  const titleBlockBottom = TITLE_BLOCK_TOP + titleFit.lines.length * titleFit.size * LINE_HEIGHT_RATIO;
  const summaryBlockTop = titleBlockBottom + 22;
  const summaryMaxLines = Math.max(0, Math.min(2, Math.floor((CONTENT_BOTTOM - 26 - summaryBlockTop) / (SUMMARY_SIZE * LINE_HEIGHT_RATIO))));
  const summaryFit = safeSummary && summaryMaxLines > 0
    ? fitText(safeSummary, [SUMMARY_SIZE], CONTENT_WIDTH, summaryMaxLines, 0.55)
    : { lines: [], size: SUMMARY_SIZE };
  const kickerFit = fitText(safeKicker, [22], CONTENT_WIDTH, 1, 0.58);

  return frame(`${safeTitle} — OpenClaw documentation`, `
  <text x="${PAD_X}" y="190" font-size="22" fill="${color.accent}">${escapeXml(kickerFit.lines[0])}</text>
  ${textLines(titleFit, TITLE_BLOCK_TOP, { weight: 600, spacing: -1.8, fill: color.text })}
  ${textLines(summaryFit, summaryBlockTop, { fill: color.secondary })}`);
}

function frame(label, content) {
  // Reuse Vyctor's actual homepage artwork, not a separate approximation. Inline
  // the SVG so card bytes (and their cache keys) include every artwork change.
  const artwork = hero.replace("<svg ", '<svg x="0" y="0" width="1200" height="360" ');
  const logo = mark.replace("<svg ", '<svg x="64" y="54" width="44" height="44" ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(label)}">
  <rect width="1200" height="630" fill="${color.page}"/>
  <g opacity="0.6">${artwork}</g>
  ${logo}
  <g font-family="Switzer, sans-serif">
    <text x="122" y="88" font-size="34" font-weight="600" letter-spacing="-0.8" fill="${color.text}">OpenClaw</text>
    <text x="1136" y="86" text-anchor="end" font-size="24" fill="${color.secondary}">Documentation</text>
    ${content}
  </g>
</svg>`;
}

function textLines(fit, top, { weight = 400, spacing = 0, fill }) {
  return fit.lines.map((line, i) => `<text x="${PAD_X}" y="${Math.round(top + fit.size * ASCENT_RATIO + i * fit.size * LINE_HEIGHT_RATIO)}" font-size="${fit.size}" font-weight="${weight}" letter-spacing="${spacing}" fill="${fill}">${escapeXml(line)}</text>`).join("\n  ");
}

function fitText(text, sizes, maxWidth, maxLines, glyphRatio) {
  for (const size of sizes) {
    const maxChars = Math.max(8, Math.floor(maxWidth / (size * glyphRatio)));
    const lines = wrapWords(text, maxChars);
    if (lines.length <= maxLines) return { lines, size };
  }
  const size = sizes[sizes.length - 1];
  const maxChars = Math.max(8, Math.floor(maxWidth / (size * glyphRatio)));
  const lines = wrapWords(text, maxChars).slice(0, maxLines);
  const last = lines[maxLines - 1];
  lines[maxLines - 1] = last.length > maxChars - 1
    ? last.slice(0, maxChars - 1).replace(/\s+\S*$/, "") + "…"
    : last + "…";
  return { lines, size };
}

function wrapWords(text, maxChars) {
  // Long command names/paths must wrap too, not escape the image bounds.
  const words = text.split(/\s+/).filter(Boolean).flatMap((word) => {
    const chunks = [];
    const letters = Array.from(word);
    for (let i = 0; i < letters.length; i += maxChars) chunks.push(letters.slice(i, i + maxChars).join(""));
    return chunks;
  });
  const lines = [];
  let current = "";
  for (const word of words) {
    if (!current) { current = word; continue; }
    if (current.length + 1 + word.length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
