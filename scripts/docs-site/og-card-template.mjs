const TITLE_SIZES = [96, 82, 70, 60, 52];
const TITLE_MAX_LINES = 2;
const TITLE_MAX_WIDTH = 1044;
const SUMMARY_SIZE = 26;
const SUMMARY_MAX_LINES = 2;
const SUMMARY_MAX_WIDTH = 1044;
const GLYPH_RATIO_TITLE = 0.55;
const GLYPH_RATIO_SUMMARY = 0.52;
const ASCENT_RATIO = 0.78;
const LINE_HEIGHT_RATIO = 1.06;

const PAD_X = 78;
const KICKER_BASELINE_Y = 192;
const TITLE_BLOCK_TOP = 218;
const FOOTER_TOP = 524;

export function renderPageOgSvg({ title, kicker, summary }) {
  const safeTitle = (title || "Documentation").trim();
  const safeKicker = (kicker || "OpenClaw").trim();
  const safeSummary = (summary || "").trim();

  const titleFit = fitText(safeTitle, TITLE_SIZES, TITLE_MAX_WIDTH, TITLE_MAX_LINES, GLYPH_RATIO_TITLE);
  const titleLetterSpacing = titleFit.size >= 88 ? -2.5 : titleFit.size >= 70 ? -2 : -1.4;
  const titleBlockBottom = TITLE_BLOCK_TOP + titleFit.lines.length * titleFit.size * LINE_HEIGHT_RATIO;

  const summaryAvailable = FOOTER_TOP - 18 - (titleBlockBottom + 22);
  const summaryMaxLines = Math.max(0, Math.min(SUMMARY_MAX_LINES, Math.floor(summaryAvailable / (SUMMARY_SIZE * 1.4))));
  const summaryFit = safeSummary && summaryMaxLines > 0
    ? fitText(safeSummary, [SUMMARY_SIZE], SUMMARY_MAX_WIDTH, summaryMaxLines, GLYPH_RATIO_SUMMARY)
    : { lines: [], size: SUMMARY_SIZE };
  const summaryBlockTop = titleBlockBottom + 22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(`${safeTitle} — OpenClaw documentation`)}">
${defs()}
  <rect width="1200" height="630" fill="#101012"/>
  <rect x="0" y="0" width="1200" height="4" fill="#f5654a"/>
  <line x1="78" y1="498" x2="1122" y2="498" stroke="#2f2f34" stroke-width="1"/>

  <g transform="translate(${PAD_X} 78)">
    <rect width="22" height="22" fill="#f5654a"/>
    <text x="36" y="17" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="700" fill="#9a9aa2" letter-spacing="0.18em">DOCS.OPENCLAW.AI</text>
  </g>

  <g transform="translate(940 56)">
    <use href="#lobster" width="200" height="200"/>
  </g>

  <text x="${PAD_X}" y="${KICKER_BASELINE_Y}" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="700" fill="#ff8f78" letter-spacing="0.18em">${escapeXml(safeKicker.toUpperCase())}</text>

  ${titleFit.lines.map((line, i) => `<text x="${PAD_X}" y="${baselineY(TITLE_BLOCK_TOP, titleFit.size, i)}" font-family="Switzer, sans-serif" font-size="${titleFit.size}" font-weight="700" fill="#ededed" letter-spacing="${titleLetterSpacing}">${escapeXml(line)}</text>`).join("\n  ")}

  ${summaryFit.lines.map((line, i) => `<text x="${PAD_X}" y="${baselineY(summaryBlockTop, SUMMARY_SIZE, i)}" font-family="Switzer, sans-serif" font-size="${SUMMARY_SIZE}" font-weight="400" fill="#bcbcc4" letter-spacing="-0.2">${escapeXml(line)}</text>`).join("\n  ")}

  <g transform="translate(${PAD_X} ${FOOTER_TOP})">
    <rect width="10" height="10" fill="#f5654a"/>
    <text x="22" y="9" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="700" fill="#ededed">docs.openclaw.ai</text>
    <text x="22" y="40" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="400" fill="#9a9aa2">Self-hosted gateway · AI coding agents from any chat</text>
  </g>

  <g transform="translate(1122 ${FOOTER_TOP})" opacity="0.85" text-anchor="end">
    <text font-family="'JetBrains Mono', monospace" font-size="14" font-weight="700" fill="#4fc8ae" letter-spacing="0.18em">v1 · MIT</text>
    <text y="28" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="400" fill="#9a9aa2">github.com/openclaw/openclaw</text>
  </g>
</svg>`;
}

function baselineY(blockTop, size, lineIndex) {
  return Math.round(blockTop + size * ASCENT_RATIO + lineIndex * size * LINE_HEIGHT_RATIO);
}

function defs() {
  return `<defs>
    <linearGradient id="lobster-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff4d4d"/>
      <stop offset="1" stop-color="#991b1b"/>
    </linearGradient>
    <symbol id="lobster" viewBox="0 0 120 120" overflow="visible">
      <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#lobster-grad)"/>
      <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#lobster-grad)"/>
      <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#lobster-grad)"/>
      <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <circle cx="45" cy="35" r="6" fill="#101012"/>
      <circle cx="75" cy="35" r="6" fill="#101012"/>
      <circle cx="46" cy="34" r="2.5" fill="#00e5cc"/>
      <circle cx="76" cy="34" r="2.5" fill="#00e5cc"/>
    </symbol>
  </defs>`;
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
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > maxChars - 1
      ? last.slice(0, maxChars - 1).replace(/\s+\S*$/, "") + "…"
      : last + "…";
  }
  return { lines, size };
}

function wrapWords(text, maxChars) {
  const words = text.split(/\s+/).filter(Boolean);
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
