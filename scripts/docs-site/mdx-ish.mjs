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
    typographer: false,
    highlight: highlightCode
  }).use(anchor, {
    permalink: anchor.permalink.linkInsideHeader({
      symbol: "#",
      class: "anchor",
      placement: "before",
      ariaHidden: true
    })
  });
}

function highlightCode(code, rawLang = "") {
  const lang = normalizeLang(rawLang);
  if (isShell(lang, code)) return highlightWith(code, shellToken, shellTokenClass);
  if (["json", "jsonc"].includes(lang)) return highlightWith(code, jsonToken, jsonTokenClass);
  if (["js", "javascript", "jsx", "mjs", "cjs", "ts", "typescript", "tsx", "json5"].includes(lang)) {
    return highlightWith(code, jsToken, jsTokenClass);
  }
  if (["yaml", "yml"].includes(lang)) return highlightWith(code, yamlToken, yamlTokenClass);
  if (["toml", "ini", "env"].includes(lang)) return highlightWith(code, configToken, configTokenClass);
  return escapeHtml(code);
}

function normalizeLang(rawLang) {
  return String(rawLang).trim().split(/\s+/)[0]?.toLowerCase().replace(/^language-/, "") ?? "";
}

function isShell(lang, code) {
  return ["bash", "sh", "shell", "zsh", "console", "terminal", "text"].includes(lang)
    || (!lang && /(^|\n)\s*(?:[$#]\s*)?(?:npm|pnpm|bun|npx|openclaw|git|curl|brew|docker|node)\b/.test(code));
}

function highlightWith(code, tokenPattern, tokenClass) {
  let out = "";
  let last = 0;
  tokenPattern.lastIndex = 0;
  for (const match of code.matchAll(tokenPattern)) {
    out += escapeHtml(code.slice(last, match.index));
    const className = tokenClass(match[0], match, code);
    out += className
      ? `<span class="${className}">${escapeHtml(match[0])}</span>`
      : escapeHtml(match[0]);
    last = match.index + match[0].length;
  }
  return out + escapeHtml(code.slice(last));
}

const shellToken = /(?<!\S)#[^\n]*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\$[A-Za-z_][A-Za-z0-9_]*|--?[A-Za-z0-9][A-Za-z0-9_-]*(?:=[^\s]+)?|\b(?:bun|brew|cat|cd|cp|curl|docker|export|git|grep|mkdir|mv|node|npm|npx|openclaw|pnpm|rg|rm|sudo)\b/g;
const jsonToken = /"(?:\\.|[^"])*"(?=\s*:)|"(?:\\.|[^"])*"|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?\b|[{}[\],:]/g;
const jsToken = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\b[A-Za-z_$][\w$-]*(?=\s*:)|\b(?:await|break|case|catch|class|const|continue|default|else|export|false|finally|for|from|function|if|import|let|new|null|return|throw|true|try|type|undefined|while)\b|-?\b\d+(?:\.\d+)?\b|[{}[\],:]/g;
const yamlToken = /#[^\n]*|^\s*[-\w".'/]+\s*:|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?\b/gm;
const configToken = /#[^\n]*|^\s*[-\w".'/]+\s*=|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?\b/gm;

function shellTokenClass(token, match, code) {
  const before = code[match.index - 1] ?? "\n";
  const after = code[match.index + token.length] ?? "\n";
  if (token.startsWith("#")) return "tok-comment";
  if (token.startsWith("\"") || token.startsWith("'")) return "tok-string";
  if (token.startsWith("$")) return "tok-var";
  if (token.startsWith("-")) return /\s/.test(before) ? "tok-option" : "";
  if (!/[\s|&;(]/.test(before) || /[@.:/#-]/.test(after)) return "";
  return "tok-command";
}

function jsonTokenClass(token) {
  if (token.startsWith("\"")) return token.endsWith(":") ? "tok-key" : "tok-string";
  if (/^(?:true|false|null)$/.test(token)) return "tok-literal";
  if (/^-?\d/.test(token)) return "tok-number";
  return "tok-punct";
}

function jsTokenClass(token, match, code) {
  if (token.startsWith("//") || token.startsWith("/*")) return "tok-comment";
  if (/^["'`]/.test(token)) return "tok-string";
  if (/^(?:true|false|null|undefined)$/.test(token)) return "tok-literal";
  if (/^[A-Za-z_$][\w$-]*$/.test(token) && /^\s*:/.test(code.slice(match.index + token.length))) return "tok-key";
  if (/^-?\d/.test(token)) return "tok-number";
  if (/^[{}[\],:]$/.test(token)) return "tok-punct";
  return "tok-keyword";
}

function yamlTokenClass(token) {
  if (token.trimStart().startsWith("#")) return "tok-comment";
  if (token.trimEnd().endsWith(":")) return "tok-key";
  if (/^["']/.test(token.trim())) return "tok-string";
  if (/^(?:true|false|null)$/.test(token.trim())) return "tok-literal";
  return "tok-number";
}

function configTokenClass(token) {
  if (token.trimStart().startsWith("#")) return "tok-comment";
  if (token.trimEnd().endsWith("=")) return "tok-key";
  if (/^["']/.test(token.trim())) return "tok-string";
  if (/^(?:true|false|null)$/.test(token.trim())) return "tok-literal";
  return "tok-number";
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
  return dedentComponentChildren(out);
}

function postprocess(html) {
  return html.replace(new RegExp(`<p>${markerPrefix}:([^<]+)</p>`, "g"), (_, payload) => expandMarker(payload));
}

function marker(kind, payload = "") {
  return `${markerPrefix}:${kind}:${Buffer.from(payload, "utf8").toString("base64url")}`;
}

function expandMarker(payload) {
  const [kind, encoded = ""] = payload.split(":");
  const value = Buffer.from(encoded, "base64url").toString("utf8");
  if (kind === "blockOpen") return `<div class="oc-${escapeAttr(value)}">`;
  if (kind === "blockClose") return "</div>";
  if (kind === "calloutOpen") return `<aside class="oc-callout oc-callout-${slug(value)}"><strong>${escapeHtml(value)}</strong>`;
  if (kind === "calloutClose") return "</aside>";
  if (kind === "cardSelf") return cardHtml(value, true);
  if (kind === "cardOpen") return cardHtml(value, false);
  if (kind === "cardClose") return "</div></a>";
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
  const icon = attrs.icon ? iconSvg(attrs.icon) : "";
  const end = selfClosing ? "</div></a>" : "";
  return `<a class="oc-card" href="${escapeAttr(href)}">${icon}<div><strong>${escapeHtml(title)}</strong>${end}`;
}

function iconSvg(name) {
  const paths = {
    rocket: `<path d="M4.5 16.5c-1.1.9-1.7 2-1.9 3.5 1.5-.2 2.7-.8 3.5-1.9"/><path d="M9 15l-4-4 3-3c4-4 8-5 12-5-0 4-1 8-5 12l-3 3-3-3z"/><path d="M14 6l4 4"/><path d="M8 16l-2 4 4-2"/>`,
    sparkles: `<path d="M12 3l1.4 4.2L17.5 9l-4.1 1.8L12 15l-1.4-4.2L6.5 9l4.1-1.8L12 3z"/><path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14z"/><path d="M19 13l.7 1.8L21.5 16l-1.8.7L19 18.5l-.7-1.8-1.8-.7 1.8-.7L19 13z"/>`,
    "layout-dashboard": `<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>`,
    terminal: `<path d="M4 17l5-5-5-5"/><path d="M12 19h8"/>`,
    settings: `<path d="M12 8a4 4 0 100 8 4 4 0 000-8z"/><path d="M4 12h2m12 0h2M12 4v2m0 12v2M6.3 6.3l1.4 1.4m8.6 8.6l1.4 1.4m0-11.4l-1.4 1.4m-8.6 8.6l-1.4 1.4"/>`,
    book: `<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z"/>`,
    globe: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3z"/>`,
    wrench: `<path d="M14.7 6.3a4 4 0 005 5L9.5 21 4 15.5 14.7 6.3z"/><path d="M6 18l-2 2"/>`,
    gear: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21h-4v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H3v-4h.1a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1L7 4.2l.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.6V3h4v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.6 1h.1v4H21a1.7 1.7 0 00-1.6 1z"/>`
  };
  const path = paths[slug(name)] ?? `<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12h8M12 8v8"/>`;
  return `<svg class="oc-card-icon" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
}

function dedentComponentChildren(markdown) {
  let depth = 0;
  return markdown
    .split("\n")
    .map((line) => {
      const markerMatch = line.match(new RegExp(`^${markerPrefix}:([^:]+):`));
      if (markerMatch) {
        if (markerMatch[1].endsWith("Close") || markerMatch[1] === "blockClose" || markerMatch[1] === "calloutClose") {
          depth = Math.max(0, depth - 1);
        }
        const markerLine = line;
        if (markerMatch[1].endsWith("Open") || markerMatch[1] === "blockOpen" || markerMatch[1] === "calloutOpen") {
          depth += 1;
        }
        return markerLine;
      }
      if (depth <= 0 || !line.startsWith(" ")) return line;
      return line.replace(new RegExp(`^ {1,${depth * 2}}`), "");
    })
    .join("\n");
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
