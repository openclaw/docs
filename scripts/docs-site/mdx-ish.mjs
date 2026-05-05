import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";

const markerPrefix = "OPENCLAW_DOCS_MARKER";
const knownBlocks = new Map([
  ["AccordionGroup", ["accordion-group", ""]],
  ["Columns", ["card-grid", ""]],
  ["CardGroup", ["card-grid", ""]],
  ["Steps", ["steps", ""]],
  ["Tabs", ["tabs", ""]],
  ["CodeGroup", ["code-group", ""]],
  ["Frame", ["frame", ""]]
]);
const callouts = new Map([
  ["Note", "Note"],
  ["Warning", "Warning"],
  ["Tip", "Tip"],
  ["Info", "Info"],
  ["Check", "Check"],
  ["Say", "Say"]
]);

export function createMarkdownRenderer() {
  return new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false
  }).use(anchor, {
    permalink: anchor.permalink.linkInsideHeader({
      symbol: "#",
      class: "anchor",
      placement: "before",
      ariaHidden: true
    })
  });
}

export function renderMdxish(markdown, md) {
  const prepared = preprocess(markdown);
  return postprocess(md.render(prepared));
}

function preprocess(input) {
  let out = input.replace(/\r\n/g, "\n");
  out = out.replace(/^import\s+.+?;?\s*$/gm, "");
  out = out.replace(/<br\s*\/?>/gi, "\n");

  out = out.replace(/<Card\b([^>]*)\/>/g, (_, attrs) => `${marker("cardSelf", attrs)}\n`);
  out = out.replace(/<Card\b([^>]*)>/g, (_, attrs) => `\n${marker("cardOpen", attrs)}\n`);
  out = out.replace(/<\/Card>/g, `\n${marker("cardClose")}\n`);

  out = out.replace(/<Step\b([^>]*)>/g, (_, attrs) => `\n${marker("stepOpen", attrs)}\n`);
  out = out.replace(/<\/Step>/g, `\n${marker("stepClose")}\n`);
  out = out.replace(/<Tab\b([^>]*)>/g, (_, attrs) => `\n${marker("tabOpen", attrs)}\n`);
  out = out.replace(/<\/Tab>/g, `\n${marker("tabClose")}\n`);
  out = out.replace(/<Accordion\b([^>]*)>/g, (_, attrs) => `\n${marker("accordionOpen", attrs)}\n`);
  out = out.replace(/<\/Accordion>/g, `\n${marker("accordionClose")}\n`);
  out = out.replace(/<ParamField\b([^>]*)>/g, (_, attrs) => `\n${marker("paramOpen", attrs)}\n`);
  out = out.replace(/<\/ParamField>/g, `\n${marker("paramClose")}\n`);

  for (const [name, [kind]] of knownBlocks) {
    out = out.replace(new RegExp(`<${name}\\b[^>]*>`, "g"), `\n${marker("blockOpen", kind)}\n`);
    out = out.replace(new RegExp(`</${name}>`, "g"), `\n${marker("blockClose", kind)}\n`);
  }
  for (const [name, label] of callouts) {
    out = out.replace(new RegExp(`<${name}\\b[^>]*>`, "g"), `\n${marker("calloutOpen", label)}\n`);
    out = out.replace(new RegExp(`</${name}>`, "g"), `\n${marker("calloutClose")}\n`);
  }

  out = out.replace(/<([A-Z][A-Za-z0-9_.-]*)([^>]*)>/g, (_, name, attrs) => escapeHtml(`<${name}${attrs}>`));
  out = out.replace(/<\/([A-Z][A-Za-z0-9_.-]*)>/g, (_, name) => escapeHtml(`</${name}>`));
  return out;
}

function postprocess(html) {
  return html.replace(new RegExp(`<p>${markerPrefix}:([^<]+)</p>`, "g"), (_, payload) => expandMarker(payload));
}

function marker(kind, payload = "") {
  return `${markerPrefix}:${kind}:${encodeURIComponent(payload)}`;
}

function expandMarker(payload) {
  const [kind, encoded = ""] = payload.split(":");
  const value = decodeURIComponent(encoded);
  if (kind === "blockOpen") return `<div class="oc-${escapeAttr(value)}">`;
  if (kind === "blockClose") return "</div>";
  if (kind === "calloutOpen") return `<aside class="oc-callout oc-callout-${slug(value)}"><strong>${escapeHtml(value)}</strong>`;
  if (kind === "calloutClose") return "</aside>";
  if (kind === "cardSelf") return cardHtml(value, true);
  if (kind === "cardOpen") return cardHtml(value, false);
  if (kind === "cardClose") return "</span></a>";
  if (kind === "stepOpen") return `<li class="oc-step"><h3>${escapeHtml(parseAttrs(value).title ?? "Step")}</h3>`;
  if (kind === "stepClose") return "</li>";
  if (kind === "tabOpen") return `<section class="oc-tab"><h3>${escapeHtml(parseAttrs(value).title ?? "Tab")}</h3>`;
  if (kind === "tabClose") return "</section>";
  if (kind === "accordionOpen") return `<details class="oc-accordion"><summary>${escapeHtml(parseAttrs(value).title ?? "Details")}</summary>`;
  if (kind === "accordionClose") return "</details>";
  if (kind === "paramOpen") {
    const attrs = parseAttrs(value);
    const required = attrs.required !== undefined ? `<span class="oc-param-required">required</span>` : "";
    const type = attrs.type ? `<span class="oc-param-type">${escapeHtml(attrs.type)}</span>` : "";
    return `<section class="oc-param"><header><code>${escapeHtml(attrs.path ?? attrs.name ?? "param")}</code>${type}${required}</header>`;
  }
  if (kind === "paramClose") return "</section>";
  return "";
}

function cardHtml(rawAttrs, selfClosing) {
  const attrs = parseAttrs(rawAttrs);
  const href = attrs.href ?? "#";
  const title = attrs.title ?? attrs.name ?? "Open";
  const icon = attrs.icon ? `<span class="oc-card-icon">${escapeHtml(attrs.icon)}</span>` : "";
  const end = selfClosing ? "</span></a>" : "";
  return `<a class="oc-card" href="${escapeAttr(href)}">${icon}<span><strong>${escapeHtml(title)}</strong>${end}`;
}

function parseAttrs(raw) {
  const attrs = {};
  for (const match of raw.matchAll(/([A-Za-z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}|([^\s>]+)))?/g)) {
    attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? match[5] ?? "";
  }
  return attrs;
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
