#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseMdx, protectedAttributeSignatures } from "./check_mdx_protected_attributes.mjs";

const PROTECTED_ATTRIBUTES = new Set(["className", "id", "path", "type", "default", "aria-hidden", "target", "rel"]);
const JSX_TAG_START_RE = /[A-Za-z_$\p{ID_Start}/!?>]/u;

function jsxName(node) {
  if (!node || typeof node !== "object") return "";
  if (node.type === "JSXIdentifier" || node.type === "Identifier") return node.name;
  if (node.type === "JSXMemberExpression") return `${jsxName(node.object)}.${jsxName(node.property)}`;
  if (node.type === "JSXNamespacedName") return `${jsxName(node.namespace)}:${jsxName(node.name)}`;
  return "";
}

function closingStart(value, openingEnd) {
  if (value[openingEnd - 1] !== ">") throw new Error("parsed JSX opening element does not end with >");
  return value[openingEnd - 2] === "/" ? openingEnd - 2 : openingEnd - 1;
}

function literalMarkdownRanges(markdownProcessor, source) {
  const ranges = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if ((node.type === "code" || node.type === "inlineCode") && Number.isInteger(node.position?.start?.offset)) {
      ranges.push([node.position.start.offset, node.position.end.offset]);
    }
    if (node.type === "link" && Number.isInteger(node.position?.start?.offset)) {
      const raw = source.slice(node.position.start.offset, node.position.end.offset);
      if (raw.startsWith("<") && raw.endsWith(">")) ranges.push([node.position.start.offset, node.position.end.offset]);
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) visit(child);
    }
  }
  visit(markdownProcessor.parse(source));
  return ranges;
}

function blankPreservingNewlines(value) {
  // No `u` flag: matching per UTF-16 code unit (surrogate pairs become two
  // spaces) keeps the masked string length-equal so parser offsets map back
  // onto the original document. With `u`, an astral character would collapse
  // to one space and shift every later diagnostic offset.
  return value.replace(/[^\n]/g, " ");
}

function replaceWithOffsetMap(prepared, offsets, start, end, replacement) {
  const originalStart = offsets[start];
  const originalEnd = offsets[end];
  const replacementOffsets = [originalStart];
  for (let index = 1; index < replacement.length; index += 1) {
    replacementOffsets.push(originalStart);
  }
  replacementOffsets.push(originalEnd);
  return {
    prepared: prepared.slice(0, start) + replacement + prepared.slice(end),
    offsets: [...offsets.slice(0, start), ...replacementOffsets, ...offsets.slice(end + 1)],
  };
}

function parseMdxForOffsets(processor, markdownProcessor, value) {
  // Exported for repair_mdx_syntax.mjs: diagnostics come back with maskOffsets
  // (prepared→original offset map) and maskedSource so callers can map error
  // positions back onto the untouched document.
  let prepared = value;
  let offsets = Array.from({ length: value.length + 1 }, (_, index) => index);
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    try {
      return { tree: processor.parse(prepared), offsets };
    } catch (error) {
      // mdast-level diagnostics carry a Position (place.start/end) rather
      // than a micromark Point; accept both so their offsets reach the
      // masking logic below.
      const offset = error.place?.start?.offset ?? error.place?.offset;
      if (!Number.isInteger(offset)) {
        // Every escape from this loop must carry the current mask state so
        // callers can map diagnostic offsets back onto the real document.
        error.maskOffsets = offsets;
        error.maskedSource = prepared;
        throw error;
      }
      const opening = prepared.lastIndexOf("<", offset);
      if (opening < 0 || prepared.slice(opening, offset).includes(">")) {
        error.maskOffsets = offsets;
        error.maskedSource = prepared;
        throw error;
      }
      if (prepared.startsWith("<!--", opening)) {
        const closing = prepared.indexOf("-->", opening + 4);
        if (closing < 0) {
          error.maskOffsets = offsets;
          error.maskedSource = prepared;
          throw error;
        }
        ({ prepared, offsets } = replaceWithOffsetMap(
          prepared,
          offsets,
          opening,
          closing + 3,
          blankPreservingNewlines(prepared.slice(opening, closing + 3)),
        ));
        continue;
      }

      const literal = literalMarkdownRanges(markdownProcessor, prepared).some(
        ([start, end]) => opening >= start && opening < end,
      );
      if (!literal && JSX_TAG_START_RE.test(prepared[opening + 1] || "")) {
        error.maskOffsets = offsets;
        error.maskedSource = prepared;
        throw error;
      }
      ({ prepared, offsets } = replaceWithOffsetMap(prepared, offsets, opening, opening + 1, "&lt;"));
    }
  }
  throw new Error("too many rejected non-MDX less-than tokens");
}

export { parseMdxForOffsets };

function collectElements(parsed, value) {
  const { tree, offsets } = parsed;
  const elements = [];
  let sequence = 0;

  function originalOffset(offset) {
    if (!Number.isInteger(offset) || offset < 0 || offset >= offsets.length) return undefined;
    return offsets[offset];
  }

  function addElement(name, attributes, offset, nameEnd, openingEnd) {
    if (!name || !Number.isInteger(offset) || !Number.isInteger(nameEnd) || !Number.isInteger(openingEnd)) return;
    elements.push({ name, attributes, offset, nameEnd, openingEnd, sequence: sequence++ });
  }

  function visitEstree(node) {
    if (Array.isArray(node)) {
      for (const item of node) visitEstree(item);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXElement") {
      const opening = node.openingElement;
      addElement(
        jsxName(opening.name),
        opening.attributes.map((attribute) => ({
          name: attribute.type === "JSXAttribute" ? jsxName(attribute.name) : "...",
          protected: attribute.type === "JSXSpreadAttribute" || PROTECTED_ATTRIBUTES.has(jsxName(attribute.name)),
          raw: value.slice(originalOffset(attribute.start), originalOffset(attribute.end)),
        })),
        originalOffset(node.start),
        originalOffset(opening.name.end),
        originalOffset(opening.end),
      );
    }
    for (const [key, child] of Object.entries(node)) {
      if (["comments", "loc", "position", "range", "tokens"].includes(key)) continue;
      visitEstree(child);
    }
  }

  function visitMdast(node) {
    if (!node || typeof node !== "object") return;
    if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && typeof node.name === "string") {
      const start = originalOffset(node.position?.start?.offset);
      const nameEnd = Number.isInteger(start) ? start + 1 + node.name.length : undefined;
      const lastAttributeEnd = originalOffset(node.attributes.at(-1)?.position?.end?.offset);
      const searchFrom = Number.isInteger(lastAttributeEnd) ? lastAttributeEnd : nameEnd;
      const close = Number.isInteger(searchFrom) ? value.indexOf(">", searchFrom) : -1;
      addElement(
        node.name,
        node.attributes.map((attribute) => ({
          name: attribute.type === "mdxJsxAttribute" ? attribute.name : "...",
          protected:
            attribute.type === "mdxJsxExpressionAttribute" ||
            (attribute.type === "mdxJsxAttribute" && PROTECTED_ATTRIBUTES.has(attribute.name)),
          raw: value.slice(
            originalOffset(attribute.position.start.offset),
            originalOffset(attribute.position.end.offset),
          ),
        })),
        start,
        nameEnd,
        close >= 0 ? close + 1 : undefined,
      );
      for (const attribute of node.attributes) {
        if (attribute?.value?.data?.estree) visitEstree(attribute.value.data.estree);
      }
    }
    if (node.data?.estree) visitEstree(node.data.estree);
    if (Array.isArray(node.children)) {
      for (const child of node.children) visitMdast(child);
    }
  }

  visitMdast(tree);
  elements.sort((left, right) => left.offset - right.offset || left.sequence - right.sequence);
  const occurrences = new Map();
  for (const element of elements) {
    element.occurrence = occurrences.get(element.name) || 0;
    occurrences.set(element.name, element.occurrence + 1);
  }
  return elements;
}

function mergeAttributes(source, translated) {
  const translatedPlain = translated.attributes.filter((attribute) => !attribute.protected);
  const used = new Set();
  const merged = [];
  for (const attribute of source.attributes) {
    if (attribute.protected) {
      merged.push(attribute.raw);
      continue;
    }
    const match = translatedPlain.findIndex((candidate, index) => !used.has(index) && candidate.name === attribute.name);
    if (match >= 0) {
      used.add(match);
      merged.push(translatedPlain[match].raw);
    }
  }
  translatedPlain.forEach((attribute, index) => {
    if (!used.has(index)) merged.push(attribute.raw);
  });
  return merged;
}

export function repairProtectedAttributes(processor, markdownProcessor, source, translated) {
  const sourceLooseTree = parseMdx(processor, markdownProcessor, source);
  const translatedLooseTree = parseMdx(processor, markdownProcessor, translated);
  const expected = protectedAttributeSignatures(sourceLooseTree);
  if (JSON.stringify(expected) === JSON.stringify(protectedAttributeSignatures(translatedLooseTree))) {
    return { changed: false, value: translated };
  }

  // A repair needs byte-accurate parser offsets. Do not use the checker's
  // tolerant less-than masking here because it intentionally changes offsets.
  const sourceElements = collectElements(parseMdxForOffsets(processor, markdownProcessor, source), source);
  const sourceByKey = new Map(sourceElements.map((element) => [`${element.name}\0${element.occurrence}`, element]));
  let value = translated;
  const limit = sourceElements.length * 2 + 10;
  for (let attempt = 0; attempt < limit; attempt += 1) {
    const actual = protectedAttributeSignatures(parseMdx(processor, markdownProcessor, value));
    if (JSON.stringify(expected) === JSON.stringify(actual)) return { changed: value !== translated, value };

    const translatedElements = collectElements(parseMdxForOffsets(processor, markdownProcessor, value), value);
    const candidate = translatedElements
      .filter((translatedElement) => {
        const sourceElement = sourceByKey.get(`${translatedElement.name}\0${translatedElement.occurrence}`);
        if (!sourceElement) return false;
        const sourceProtected = sourceElement.attributes
          .filter((attribute) => attribute.protected)
          .map((attribute) => attribute.raw);
        const translatedProtected = translatedElement.attributes
          .filter((attribute) => attribute.protected)
          .map((attribute) => attribute.raw);
        return JSON.stringify(sourceProtected) !== JSON.stringify(translatedProtected);
      })
      .sort(
        (left, right) =>
          left.openingEnd - left.offset - (right.openingEnd - right.offset) || right.offset - left.offset,
      )[0];
    if (!candidate) break;

    const sourceElement = sourceByKey.get(`${candidate.name}\0${candidate.occurrence}`);
    const attributes = mergeAttributes(sourceElement, candidate);
    const closeStart = closingStart(value, candidate.openingEnd);
    const suffix = value.slice(closeStart, candidate.openingEnd);
    const separator = attributes.length > 0 ? ` ${attributes.join(" ")}${suffix === "/>" ? " " : ""}` : "";
    value = value.slice(0, candidate.nameEnd) + `${separator}${suffix}` + value.slice(candidate.openingEnd);
  }
  const repaired = protectedAttributeSignatures(parseMdx(processor, markdownProcessor, value));
  if (JSON.stringify(expected) !== JSON.stringify(repaired)) {
    throw new Error("protected MDX attributes still differ after deterministic repair");
  }
  return { changed: value !== translated, value };
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
      result = repairProtectedAttributes(
        processor,
        markdownProcessor,
        fs.readFileSync(sourcePath, "utf8"),
        translated,
      );
    } catch (error) {
      if (process.env.OPENCLAW_DOCS_I18N_LOG_REJECTED_BODY === "1") {
        process.stderr.write(`docs-i18n: rejected protected-attribute body docs/${args.locale}/${relative} ${JSON.stringify(translated)}\n`);
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
