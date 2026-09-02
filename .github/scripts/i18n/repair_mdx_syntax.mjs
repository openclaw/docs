#!/usr/bin/env node

// Syntax-level rescue for translated MDX that no longer parses. Translations
// are expensive, so instead of discarding a shard we patch only the markup
// tokens the MDX parser itself reports as broken, keeping translated prose
// intact. Acceptance mirrors the downstream repair chain (the checker's
// tolerant parseMdx), and diagnosis reuses the same tolerant masking with an
// offset map, so valid Markdown constructs (HTML comments, prose less-than)
// never produce diagnostics here and never get touched. Anything that cannot
// be repaired deterministically (broken JS expressions, budget exhaustion)
// hard-fails the shard like before. Note: check-docs-mdx compiles pages by
// file extension, so .md damage with JSX-looking text passes that gate and
// first surfaces here.

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
// Flow-level variant: "Expected the closing tag `</div>` either after the end
// of `paragraph` (2:32) or another opening tag after the start of `paragraph`
// (2:3)". The first pair is where the closer is expected; the second pair is
// the start of the paragraph that sits inside the unclosed element.
const UNCLOSED_FLOW_TAG_RE = /^Expected the closing tag `<\/([^`<>]+)>` either after the end of `paragraph` \((\d+):(\d+)\) or another opening tag after the start of `paragraph` \((\d+):(\d+)\)/;
// "Unexpected closing tag `</span>`, expected corresponding closing tag for
// `<div>` (1:1-1:6)". Here error.place already points at the stray token.
const STRAY_CLOSING_TAG_RE = /^Unexpected closing tag `<([^`<>]+)>`/;

class SyntaxRepairExhausted extends Error {}

function blankPreservingNewlines(value) {
  // No `u` flag: matching per UTF-16 code unit (surrogate pairs become two
  // spaces) keeps the masked string length-equal so parser offsets map back
  // onto the original document. With `u`, an astral character would collapse
  // to one space and shift every later diagnostic offset.
  return value.replace(/[^\n]/g, " ");
}

// Length-preserving so parser offsets taken from the masked copy stay valid
// against the original document. Terminated comments are accepted downstream
// (the repair chain masks them), so they must not produce diagnostics here;
// unterminated ones stay visible for the repair rules to close.
function maskTerminatedHtmlComments(value) {
  let result = "";
  let cursor = 0;
  for (;;) {
    const start = value.indexOf("<!--", cursor);
    if (start < 0) return result + value.slice(cursor);
    const end = value.indexOf("-->", start + 4);
    if (end < 0) return result + value.slice(cursor);
    result += value.slice(cursor, start) + blankPreservingNewlines(value.slice(start, end + 3));
    cursor = end + 3;
  }
}

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
    const flow = UNCLOSED_FLOW_TAG_RE.exec(normalized.message);
    if (flow) {
      normalized.closerLine = Number(flow[2]);
      normalized.paragraphStartOffset = mapped(offsetForLineCol(starts, Number(flow[4]), Number(flow[5])));
    }
    return { accepted: false, diagnostic: normalized };
  }
  void parsed;
  return { accepted: true, diagnostic: null };
}

// Ranges the MDX parser treats as literal text (code fences, inline code,
// autolink-style links), so opener searches can skip them.
function literalMarkdownRanges(markdownProcessor, value) {
  const ranges = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if ((node.type === "code" || node.type === "inlineCode") && Number.isInteger(node.position?.start?.offset)) {
      ranges.push([node.position.start.offset, node.position.end.offset]);
    }
    if (node.type === "link" && Number.isInteger(node.position?.start?.offset)) {
      const raw = value.slice(node.position.start.offset, node.position.end.offset);
      if (raw.startsWith("<") && raw.endsWith(">")) ranges.push([node.position.start.offset, node.position.end.offset]);
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) visit(child);
    }
  }
  visit(markdownProcessor.parse(value));
  return ranges;
}

function inRanges(offset, ranges) {
  return ranges.some(([start, end]) => offset >= start && offset < end);
}

// End offset of the tag opening at tokenStart, honoring quoted attributes so
// a `>` inside an attribute value does not end the scan early.
function tagEndOffset(maskedValue, tokenStart) {
  let quote = null;
  for (let index = tokenStart; index < maskedValue.length; index += 1) {
    const ch = maskedValue[index];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ">") {
      return index;
    }
  }
  return -1;
}

function applyUnclosedPatch(value, diagnostic, sourceNames, applied) {
  const name = UNCLOSED_TAG_RE.exec(diagnostic.message)[1];
  const tokenRange = diagnostic.tokenRange;
  const tokenText = tokenRange ? value.slice(tokenRange[0], tokenRange[1]) : "";
  const located = tokenText.startsWith("<") && tokenText.endsWith(">");
  const candidates = [];
  // A translated void element (<br>, <hr>, ...) must not gain a closing tag;
  // MDX requires the self-closing form, which also preserves the rendering.
  if (located && VOID_HTML_ELEMENTS.has(name)) {
    candidates.push({
      key: `self-close:${tokenRange[0]}`,
      apply: () => value.slice(0, tokenRange[0]) + tokenText.replace(/\/?>$/u, " />") + value.slice(tokenRange[1]),
    });
  }
  // A translated element name the source never uses is fabricated markup
  // (for example `<id>` invented around prose). Remove the token and keep the
  // text; a matching stray closer, if any, is removed by a later iteration.
  // Deletions shrink the document, so they need no repetition guard beyond
  // the patch budget; a mutable offset is not a stable patch identity.
  if (located && !VOID_HTML_ELEMENTS.has(name) && !sourceNames.has(name)) {
    candidates.push({
      apply: () => value.slice(0, tokenRange[0]) + value.slice(tokenRange[1]),
    });
  }
  if (!VOID_HTML_ELEMENTS.has(name) && sourceNames.has(name)) {
    const insertAt = placeRange(diagnostic.place)?.[1];
    if (Number.isInteger(insertAt)) {
      candidates.push({
        key: `insert-closer:${name}:${insertAt}`,
        apply: () => value.slice(0, insertAt) + `</${name}>` + value.slice(insertAt),
      });
    }
    candidates.push({
      key: `insert-closer:${name}:eof`,
      // The closer must sit on its own line: a closer glued to the last line
      // stays a text-level token inside the paragraph and never closes a flow
      // element. Keep the original trailing newline count.
      apply: () => {
        const trimmed = value.replace(/\n+$/u, "");
        return `${trimmed}\n</${name}>${value.slice(trimmed.length)}`;
      },
    });
  }
  for (const candidate of candidates) {
    if (applied.has(candidate.key)) continue;
    applied.add(candidate.key);
    return candidate.apply();
  }
  throw new SyntaxRepairExhausted(`no remaining candidates for unclosed <${name}>`);
}

function applyUnclosedFlowPatch(value, diagnostic, sourceNames, applied, markdownProcessor) {
  const name = UNCLOSED_FLOW_TAG_RE.exec(diagnostic.message)[1];
  const candidates = [];
  if (!VOID_HTML_ELEMENTS.has(name) && !sourceNames.has(name)) {
    // Fabricated flow-level opener (an uppercase name would compile to an
    // undefined component at render time): remove the opening token instead
    // of legitimizing it with a closing tag. Search backwards from the
    // diagnosed paragraph in the comment-masked copy (so comment contents
    // and literal code ranges cannot match) and take the nearest opener;
    // masking is length-preserving, so offsets map back to the real value.
    // Deletions shrink the document, so no repetition key is needed.
    const masked = maskTerminatedHtmlComments(value);
    const literalRanges = literalMarkdownRanges(markdownProcessor, value);
    const paragraphStart = diagnostic.paragraphStartOffset;
    if (Number.isInteger(paragraphStart)) {
      let searchEnd = paragraphStart;
      for (;;) {
        const tokenStart = masked.lastIndexOf(`<${name}`, searchEnd - 1);
        if (tokenStart < 0) break;
        searchEnd = tokenStart;
        const afterName = masked[tokenStart + 1 + name.length];
        if (afterName !== undefined && /[\s/>]/u.test(afterName) && !inRanges(tokenStart, literalRanges)) {
          const tokenEnd = tagEndOffset(masked, tokenStart);
          if (tokenEnd > tokenStart) {
            candidates.push({
              apply: () => value.slice(0, tokenStart) + value.slice(tokenEnd + 1),
            });
            break;
          }
        }
      }
    }
  }
  // The parser reports the line whose end the closer is expected after; a
  // flow closer only takes effect on its own line, so append there.
  const reportedStart = lineStarts(value)[diagnostic.closerLine - 1];
  if (Number.isInteger(reportedStart)) {
    let lineEnd = value.indexOf("\n", reportedStart);
    if (lineEnd < 0) lineEnd = value.length;
    candidates.push({
      key: `insert-closer:${name}:line${diagnostic.closerLine}`,
      apply: () => value.slice(0, lineEnd) + `\n</${name}>` + value.slice(lineEnd),
    });
  }
  candidates.push({
    key: `insert-closer:${name}:eof`,
    apply: () => {
      const trimmed = value.replace(/\n+$/u, "");
      return `${trimmed}\n</${name}>${value.slice(trimmed.length)}`;
    },
  });
  for (const candidate of candidates) {
    if (applied.has(candidate.key)) continue;
    applied.add(candidate.key);
    return candidate.apply();
  }
  throw new SyntaxRepairExhausted(`no remaining candidates for unclosed <${name}>`);
}

function applyStrayCloserPatch(value, diagnostic) {
  const match = STRAY_CLOSING_TAG_RE.exec(diagnostic.message);
  const range = placeRange(diagnostic.place);
  if (!range || !value.startsWith("</", range[0])) {
    throw new SyntaxRepairExhausted(`stray closing tag ${match[1]} not located`);
  }
  // Deleting shrinks the document, so a mutable offset needs no repetition
  // guard; consecutive stray closers shift into the same offset and must all
  // be removed. The patch budget bounds the loop.
  return value.slice(0, range[0]) + value.slice(range[1]);
}

// An unterminated `<!--` is rejected by the downstream chain too. If the
// remainder is a single line, closing at its end keeps exactly that text
// commented out under Markdown semantics. A multi-line remainder makes the
// intended end unknowable: closing early would publish formerly hidden text,
// closing at EOF would hide real content, so fail closed instead.
function closeUnterminatedComment(value, offset, applied) {
  const key = `close-comment:${offset}`;
  if (applied.has(key)) throw new SyntaxRepairExhausted("comment already closed");
  const nextNewline = value.indexOf("\n", offset);
  if (nextNewline >= 0 && value.slice(nextNewline + 1).trim().length > 0) {
    throw new SyntaxRepairExhausted("unterminated comment spans multiple lines; refusing to guess its end");
  }
  applied.add(key);
  const insertAt = nextNewline >= 0 ? nextNewline : value.length;
  return `${value.slice(0, insertAt)} -->${value.slice(insertAt)}`;
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
      // A `/>` delimiter ends the value: quoting it would corrupt the value
      // (`src=guide/` must become `src="guide" />`, not `src="guide/"`).
      if (ch === "/" && value[end + 1] === ">") break;
      if (" \t\n\r>".includes(ch)) break;
      end += 1;
    }
    return `${value.slice(0, offset)}"${value.slice(offset, end)}"${value.slice(end)}`;
  }
  // Stray junk where an attribute name was expected (a lone quote, a `<`, ...):
  // drop the single offending character and let the parser re-report. The
  // deletion shrinks the document, so no repetition key is needed; the patch
  // budget bounds the loop.
  return value.slice(0, offset) + value.slice(offset + 1);
}

export function repairMdxSyntax(processor, markdownProcessor, source, translated) {
  let sourceTree;
  try {
    sourceTree = parseMdx(processor, markdownProcessor, source);
  } catch (error) {
    throw new Error(`source document does not parse, refusing to repair: ${error.message || error}`, { cause: error });
  }
  const sourceNames = collectElementNames(sourceTree);

  let value = translated;
  let lastError = "MDX failed to parse";
  const applied = new Set();
  for (let iteration = 0; iteration < MAX_PATCHES_PER_FILE; iteration += 1) {
    // Acceptance equals the downstream chain's own tolerance, so valid
    // Markdown constructs (HTML comments, prose less-than) pass untouched.
    try {
      parseMdx(processor, markdownProcessor, value);
      return { changed: value !== translated, value };
    } catch {
      // fall through to diagnosis
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
      if (Number.isInteger(offset) && value[offset] === "!" && value[offset - 1] === "<") {
        value = closeUnterminatedComment(value, offset, applied);
      } else if (UNCLOSED_TAG_RE.test(diagnostic.message)) {
        value = applyUnclosedPatch(value, diagnostic, sourceNames, applied);
      } else if (UNCLOSED_FLOW_TAG_RE.test(diagnostic.message)) {
        value = applyUnclosedFlowPatch(value, diagnostic, sourceNames, applied, markdownProcessor);
      } else if (STRAY_CLOSING_TAG_RE.test(diagnostic.message)) {
        value = applyStrayCloserPatch(value, diagnostic);
      } else if (diagnostic.ruleId === "unexpected-character") {
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
  const workspace = path.resolve(args.workspace);
  const docsRoot = path.join(workspace, "docs");
  const manifest = path.resolve(workspace, args.manifest);
  const moduleRoot = path.resolve(args["module-root"] || workspace);
  const require = createRequire(path.join(moduleRoot, "package.json"));
  const { createProcessor } = await import(pathToFileURL(require.resolve("@mdx-js/mdx")).href);
  const processor = createProcessor({ format: "mdx" });
  const markdownProcessor = createProcessor({ format: "md" });
  const repaired = [];

  for (const line of fs.readFileSync(manifest, "utf8").split(/\r?\n/u).filter(Boolean)) {
    const sourcePath = path.resolve(line);
    const relative = path.relative(docsRoot, sourcePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`source path escapes docs root: ${line}`);
    if (!relative.endsWith(".md") && !relative.endsWith(".mdx")) continue;
    const translatedPath = path.join(docsRoot, args.locale, relative);
    if (!fs.existsSync(translatedPath)) continue;
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
      fs.writeFileSync(translatedPath, result.value);
      repaired.push(path.relative(workspace, translatedPath));
    }
  }
  process.stdout.write(`${JSON.stringify({ repaired })}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message || error}\n`);
    process.exitCode = 1;
  });
}
