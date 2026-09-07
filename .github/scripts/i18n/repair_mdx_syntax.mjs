#!/usr/bin/env node

// Rescue parser-diagnosed markup damage before the existing translation check.
// Unresolvable documents remain unchanged for the normal repair path.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseMdx } from "./check_mdx_protected_attributes.mjs";
import { parseMdxForOffsets } from "./repair_mdx_protected_attributes.mjs";

const MAX_PATCHES_PER_FILE = 64;

// Void HTML elements cannot take a closing tag; MDX requires self-closing.
const VOID_HTML_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr",
]);

// "Expected a closing tag for `<id>` before the end of `paragraph`". The
// message's range is the opening token; error.place only spans the enclosing
// block. Offsets are recovered from the masked document and mapped back.
const UNCLOSED_TAG_RE = /^Expected a closing tag for `<([^`<>]+)>` \((\d+):(\d+)-(\d+):(\d+)\)/;
// "Unexpected closing tag `</span>`, expected corresponding closing tag for
// `<div>` (1:1-1:6)". Here error.place already points at the stray token.
const STRAY_CLOSING_TAG_RE = /^Unexpected closing tag `<([^`<>]+)>`/;

class SyntaxRepairExhausted extends Error {}

function lineStarts(value) {
  const starts = [0];
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "\n") starts.push(index + 1);
  }
  return starts;
}

function offsetForLineCol(starts, line, column) {
  const start = starts[line - 1];
  if (start === undefined) return undefined;
  return start + column - 1;
}

function placeRange(place) {
  if (!place || !place.start || !place.end) return undefined;
  if (!Number.isInteger(place.start.offset) || !Number.isInteger(place.end.offset)) return undefined;
  return [place.start.offset, place.end.offset];
}

function collectElementNames(tree) {
  const names = new Set();
  function visitEstree(node) {
    if (Array.isArray(node)) {
      for (const item of node) visitEstree(item);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXElement") {
      const name = node.openingElement?.name;
      if (name?.type === "JSXIdentifier") names.add(name.name);
    }
    for (const [key, value] of Object.entries(node)) {
      if (["comments", "loc", "position", "range", "tokens"].includes(key)) continue;
      visitEstree(value);
    }
  }
  function visitMdast(node) {
    if (!node || typeof node !== "object") return;
    if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && typeof node.name === "string") {
      names.add(node.name);
    }
    if (node.data?.estree) visitEstree(node.data.estree);
    if (Array.isArray(node.children)) {
      for (const child of node.children) visitMdast(child);
    }
  }
  visitMdast(tree);
  return names;
}

function elementStructure(node) {
  const children = (node.children || []).flatMap(elementStructure);
  const attributes = (node.attributes || []).map((attribute) => attribute.type === "mdxJsxExpressionAttribute"
    ? ["..."] : [attribute.name, attribute.value == null ? "boolean" : typeof attribute.value === "string" ? "literal" : "expression"]);
  return ["mdxJsxFlowElement", "mdxJsxTextElement"].includes(node.type) && node.name
    ? [[node.name, attributes, children]] : children;
}

function hasExpressionJsx(node) {
  if (Array.isArray(node)) return node.some(hasExpressionJsx);
  if (!node || typeof node !== "object") return false;
  if (node.type === "JSXElement" || node.type === "JSXFragment") return true;
  return Object.values(node).some(hasExpressionJsx);
}

function collectLiteralTagNames(tree) {
  const names = new Set();
  function visit(node) {
    if (["text", "code", "inlineCode"].includes(node.type)) {
      for (const match of node.value.matchAll(/<\/?([A-Za-z_$][\w.$:-]*)(?=[\s/>])/g)) names.add(match[1]);
    }
    for (const child of node.children || []) visit(child);
  }
  visit(tree);
  return names;
}

// Diagnose with the same tolerant masking the downstream chain applies, then
// map every offset back to the untouched document. Masking never moves line
// boundaries, so line numbers are shared; only columns and raw offsets need
// the map.
function diagnoseWithDownstreamMasking(processor, markdownProcessor, value) {
  let parsed;
  try {
    parsed = parseMdxForOffsets(processor, markdownProcessor, value);
  } catch (error) {
    const offsets = error.maskOffsets;
    const maskedSource = error.maskedSource;
    if (!Array.isArray(offsets) || typeof maskedSource !== "string") {
      throw new SyntaxRepairExhausted("diagnostic has no offset map for the masked document");
    }
    const starts = lineStarts(maskedSource);
    const mapped = (preparedOffset) =>
      Number.isInteger(preparedOffset) && preparedOffset >= 0 && preparedOffset < offsets.length
        ? offsets[preparedOffset]
        : undefined;
    const place = {
      start: { offset: mapped(error.place?.start?.offset ?? error.place?.offset) },
    };
    const endOffset = mapped(error.place?.end?.offset);
    if (Number.isInteger(endOffset)) place.end = { offset: endOffset };

    const normalized = { message: error.message || String(error), ruleId: error.ruleId, place };

    const unclosed = UNCLOSED_TAG_RE.exec(normalized.message);
    if (unclosed) {
      const tokenStart = mapped(offsetForLineCol(starts, Number(unclosed[2]), Number(unclosed[3])));
      const tokenEnd = mapped(offsetForLineCol(starts, Number(unclosed[4]), Number(unclosed[5])));
      if (Number.isInteger(tokenStart) && Number.isInteger(tokenEnd)) normalized.tokenRange = [tokenStart, tokenEnd];
    }
    return { accepted: false, diagnostic: normalized };
  }
  void parsed;
  return { accepted: true, diagnostic: null };
}

function applyUnclosedPatch(value, diagnostic, sourceNames) {
  const name = UNCLOSED_TAG_RE.exec(diagnostic.message)[1];
  const range = diagnostic.tokenRange;
  const token = range ? value.slice(...range) : "";
  if (!sourceNames.has(name) || !VOID_HTML_ELEMENTS.has(name) || !token.startsWith("<") || !token.endsWith(">")) {
    throw new SyntaxRepairExhausted("cannot infer a missing closing tag from a paragraph boundary");
  }
  return value.slice(0, range[0]) + token.replace(/\/?>$/u, " />") + value.slice(range[1]);
}

function applyStrayCloserPatch(value, diagnostic, sourceNames) {
  const match = /^Unexpected closing tag `<\/([^`<>]+)>`, expected corresponding closing tag for `<([^`<>]+)>`/.exec(diagnostic.message);
  const range = placeRange(diagnostic.place);
  if (!match || !sourceNames.has(match[2]) || !range || value.slice(...range) !== `</${match[1]}>`) {
    throw new SyntaxRepairExhausted("stray closing tag may be literal prose; refusing to remove it");
  }
  return value.slice(0, range[0]) + `</${match[2]}>` + value.slice(range[1]);
}

function applyUnexpectedCharacterPatch(value, diagnostic, applied) {
  const offset = diagnostic.place?.start?.offset;
  if (!Number.isInteger(offset) || offset >= value.length) {
    throw new SyntaxRepairExhausted("unexpected-character diagnostic has no in-range offset");
  }
  if (/attribute value/.test(diagnostic.message)) {
    // Unquoted attribute value (`title=Domande`): MDX requires quotes, so wrap
    // the run up to the value terminator instead of shredding it char by char.
    const key = `quote-value:${offset}`;
    if (applied.has(key)) throw new SyntaxRepairExhausted(`attribute value at ${offset} already quoted`);
    applied.add(key);
    let end = offset;
    while (end < value.length) {
      const ch = value[end];
      // The slash may belong to a URL rather than the self-closing delimiter.
      if (ch === "/" && value[end + 1] === ">") {
        throw new SyntaxRepairExhausted("unquoted value touches a self-closing delimiter; refusing to infer its end");
      }
      if (" \t\n\r>".includes(ch)) break;
      end += 1;
    }
    return `${value.slice(0, offset)}"${value.slice(offset, end)}"${value.slice(end)}`;
  }
  throw new SyntaxRepairExhausted("unexpected character outside an unquoted attribute value");
}

export function repairMdxSyntax(processor, markdownProcessor, source, translated) {
  let sourceTree;
  try {
    sourceTree = parseMdx(processor, markdownProcessor, source);
  } catch (error) {
    throw new Error(`source document does not parse, refusing to repair: ${error.message || error}`, { cause: error });
  }
  const sourceNames = collectElementNames(sourceTree);
  const sourceStructure = JSON.stringify(elementStructure(sourceTree));
  const sourceHasExpressionJsx = hasExpressionJsx(sourceTree);
  const literalNames = collectLiteralTagNames(markdownProcessor.parse(source));

  let value = translated;
  let lastError = "MDX failed to parse";
  const applied = new Set();
  for (let iteration = 0; iteration < MAX_PATCHES_PER_FILE; iteration += 1) {
    // Acceptance equals the downstream chain's own tolerance, so valid
    // Markdown constructs (HTML comments, prose less-than) pass untouched.
    let tree;
    try { tree = parseMdx(processor, markdownProcessor, value); } catch { /* Diagnose below. */ }
    if (tree) {
      if (value !== translated && (sourceHasExpressionJsx || hasExpressionJsx(tree))) {
        throw new Error("MDX syntax repair cannot establish expression JSX structure; refusing to write");
      }
      if (value !== translated && JSON.stringify(elementStructure(tree)) !== sourceStructure) {
        throw new Error("MDX syntax repair would change source element or attribute structure; refusing to write");
      }
      return { changed: value !== translated, value };
    }

    // Diagnose under the same tolerant masking; diagnostics arrive with
    // offsets already mapped onto the untouched document.
    const { accepted, diagnostic } = diagnoseWithDownstreamMasking(processor, markdownProcessor, value);
    if (accepted) {
      throw new SyntaxRepairExhausted("document damage is outside this repair's diagnostic classes");
    }
    lastError = diagnostic.message;

    try {
      const offset = diagnostic.place?.start?.offset;
      const name = UNCLOSED_TAG_RE.exec(diagnostic.message)?.[1]
        || STRAY_CLOSING_TAG_RE.exec(diagnostic.message)?.[1].replace(/^\//, "")
        || (Number.isInteger(offset) && /^<\/?([A-Za-z_$][\w.$:-]*)/.exec(value.slice(value.lastIndexOf("<", offset)))?.[1]);
      if (literalNames.has(name)) {
        throw new SyntaxRepairExhausted(`source uses <${name}> as literal text; refusing to reinterpret it as markup`);
      }
      if (UNCLOSED_TAG_RE.test(diagnostic.message)) {
        value = applyUnclosedPatch(value, diagnostic, sourceNames);

      } else if (STRAY_CLOSING_TAG_RE.test(diagnostic.message)) {
        value = applyStrayCloserPatch(value, diagnostic, sourceNames);
      } else if (diagnostic.ruleId === "unexpected-character") {
        if (!name || (!sourceNames.has(name) && !VOID_HTML_ELEMENTS.has(name))) {
          throw new SyntaxRepairExhausted("attribute repair requires a source-backed or void element");
        }
        value = applyUnexpectedCharacterPatch(value, diagnostic, applied);
      } else {
        throw new SyntaxRepairExhausted("unsupported parser diagnostic");
      }
    } catch (error) {
      if (error instanceof SyntaxRepairExhausted) {
        throw new Error(`MDX syntax repair exhausted: ${error.message}; last parser error: ${lastError}`);
      }
      throw error;
    }
  }
  throw new Error(`MDX syntax repair gave up after ${MAX_PATCHES_PER_FILE} patches; last parser error: ${lastError}`);
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new Error("invalid arguments");
    values[key.slice(2)] = value;
  }
  if (!values.workspace || !values.locale || !values.manifest) throw new Error("workspace, locale, and manifest are required");
  return values;
}

// The locale is joined into a writable path before any repository-relative
// validation runs, so a value like ".." would let a repair write outside
// docs/<locale>. Reject anything that is not one plain path segment.
function assertSafeLocale(locale) {
  if (!locale || locale === "." || locale === ".." || /[/\\\0]/u.test(locale)) {
    throw new Error(`locale must be a single safe path segment: ${JSON.stringify(locale)}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  assertSafeLocale(args.locale);
  const workspace = fs.realpathSync(path.resolve(args.workspace));
  const docsRoot = fs.realpathSync(path.join(workspace, "docs"));
  const localeRoot = path.join(docsRoot, args.locale);
  const manifest = path.resolve(workspace, args.manifest);
  const moduleRoot = path.resolve(args["module-root"] || workspace);
  const require = createRequire(path.join(moduleRoot, "package.json"));
  const { createProcessor } = await import(pathToFileURL(require.resolve("@mdx-js/mdx")).href);
  const processor = createProcessor({ format: "mdx" });
  const markdownProcessor = createProcessor({ format: "md" });
  const repairs = [];

  for (const line of fs.readFileSync(manifest, "utf8").split(/\r?\n/u).filter(Boolean)) {
    const sourcePath = fs.realpathSync(path.resolve(workspace, line));
    const relative = path.relative(docsRoot, sourcePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`source path escapes docs root: ${line}`);
    if (!relative.endsWith(".md") && !relative.endsWith(".mdx")) continue;
    const translatedPath = path.join(docsRoot, args.locale, relative);
    if (!fs.existsSync(translatedPath)) continue;
    if (fs.realpathSync(translatedPath) !== translatedPath || fs.realpathSync(localeRoot) !== localeRoot) {
      throw new Error(`translated path must not follow symlinks: ${translatedPath}`);
    }
    const translated = fs.readFileSync(translatedPath, "utf8");
    let result;
    try {
      result = repairMdxSyntax(
        processor,
        markdownProcessor,
        fs.readFileSync(sourcePath, "utf8"),
        translated,
      );
    } catch (error) {
      if (process.env.OPENCLAW_DOCS_I18N_LOG_REJECTED_BODY === "1") {
        process.stderr.write(`docs-i18n: rejected syntax body docs/${args.locale}/${relative} ${JSON.stringify(translated)}\n`);
      }
      throw new Error(`docs/${args.locale}/${relative}: ${error.message || error}`, { cause: error });
    }
    if (result.changed) {
      repairs.push({ translatedPath, value: result.value });
    }
  }
  // Do not leave tentative repairs behind when a later page fails validation.
  for (const { translatedPath, value } of repairs) fs.writeFileSync(translatedPath, value);
  process.stdout.write(`${JSON.stringify({ repaired: repairs.map(({ translatedPath }) => path.relative(workspace, translatedPath)) })}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message || error}\n`);
    process.exitCode = 1;
  });
}
