#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROTECTED_ATTRIBUTES = new Set(["className", "id", "path", "type", "default", "aria-hidden", "target", "rel"]);
const JSX_TAG_START_RE = /[A-Za-z_$\p{ID_Start}/!?>]/u;

function attributeSignature(attribute) {
  if (attribute.type === "mdxJsxExpressionAttribute") {
    return ["...", "expression", canonicalAst(attribute.data?.estree || attribute.value)];
  }
  if (attribute.type !== "mdxJsxAttribute" || !PROTECTED_ATTRIBUTES.has(attribute.name)) return undefined;
  if (attribute.value === null || attribute.value === undefined) return [attribute.name, "boolean", true];
  if (typeof attribute.value === "string") return [attribute.name, "string", attribute.value];
  return [attribute.name, "expression", canonicalAst(attribute.value.data?.estree || attribute.value.value)];
}

function jsxName(node) {
  if (!node || typeof node !== "object") return "";
  if (node.type === "JSXIdentifier" || node.type === "Identifier") return node.name;
  if (node.type === "JSXMemberExpression") return `${jsxName(node.object)}.${jsxName(node.property)}`;
  if (node.type === "JSXNamespacedName") return `${jsxName(node.namespace)}:${jsxName(node.name)}`;
  return "";
}

function canonicalAst(value) {
  if (typeof value === "bigint") return { $bigint: value.toString() };
  if (Array.isArray(value)) return value.map(canonicalAst);
  if (!value || typeof value !== "object") return value;
  const result = {};
  const templateValue = Object.hasOwn(value, "cooked") && Object.hasOwn(value, "raw");
  for (const key of Object.keys(value).sort()) {
    if (["comments", "end", "loc", "position", "range", "start", "tokens"].includes(key)) continue;
    if (key === "raw" && !templateValue) continue;
    result[key] = canonicalAst(value[key]);
  }
  return result;
}

function estreeAttributeSignature(attribute) {
  if (attribute.type === "JSXSpreadAttribute") return ["...", "expression", canonicalAst(attribute.argument)];
  if (attribute.type !== "JSXAttribute") return undefined;
  const name = jsxName(attribute.name);
  if (!PROTECTED_ATTRIBUTES.has(name)) return undefined;
  if (attribute.value === null || attribute.value === undefined) return [name, "boolean", true];
  if (attribute.value.type === "Literal") return [name, "string", attribute.value.value];
  if (attribute.value.type === "JSXExpressionContainer") {
    return [name, "expression", canonicalAst(attribute.value.expression)];
  }
  return [name, "unknown", canonicalAst(attribute.value)];
}

function literalMarkdownRanges(tree, source) {
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
  visit(tree);
  return ranges;
}

function parseMdx(processor, markdownProcessor, value) {
  let prepared = value;
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    try {
      return processor.parse(prepared);
    } catch (error) {
      const offset = error.place?.offset;
      if (!Number.isInteger(offset)) throw error;
      const opening = prepared.lastIndexOf("<", offset);
      if (opening < 0 || prepared.slice(opening, offset).includes(">")) throw error;
      if (prepared.startsWith("<!--", opening)) {
        const closing = prepared.indexOf("-->", opening + 4);
        if (closing < 0) throw error;
        const comment = prepared.slice(opening, closing + 3).replace(/[^\n]/gu, " ");
        prepared = prepared.slice(0, opening) + comment + prepared.slice(closing + 3);
      } else {
        const literal = literalMarkdownRanges(markdownProcessor.parse(prepared), prepared).some(
          ([start, end]) => opening >= start && opening < end,
        );
        if (!literal && JSX_TAG_START_RE.test(prepared[opening + 1] || "")) throw error;
        prepared = prepared.slice(0, opening) + "&lt;" + prepared.slice(opening + 1);
      }
    }
  }
  throw new Error("too many rejected non-MDX less-than tokens");
}

export function protectedAttributeSignatures(tree) {
  const elements = [];
  let sequence = 0;

  function addElement(name, attributes, offset) {
    if (!name) return;
    elements.push({ name, attributes, offset: Number.isInteger(offset) ? offset : Number.MAX_SAFE_INTEGER, sequence: sequence++ });
  }

  function visitEstree(node) {
    if (Array.isArray(node)) {
      for (const item of node) visitEstree(item);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXElement") {
      const opening = node.openingElement;
      addElement(jsxName(opening.name), opening.attributes.map(estreeAttributeSignature).filter(Boolean), node.start);
    }
    for (const [key, value] of Object.entries(node)) {
      if (["comments", "loc", "position", "range", "tokens"].includes(key)) continue;
      visitEstree(value);
    }
  }

  function visitMdast(node) {
    if (!node || typeof node !== "object") return;
    if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && typeof node.name === "string") {
      addElement(node.name, node.attributes.map(attributeSignature).filter(Boolean), node.position?.start?.offset);
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
  const signatures = [];

  function normalizeAttributeOrder(attributes) {
    const normalized = [];
    let segment = [];
    function flush() {
      if (segment.length === 0) return;
      const names = segment.map((attribute) => attribute[0]);
      if (new Set(names).size === names.length) {
        const literals = segment.filter((attribute) => attribute[1] === "boolean" || attribute[1] === "string");
        const expressions = segment.filter((attribute) => attribute[1] !== "boolean" && attribute[1] !== "string");
        literals.sort((left, right) => {
          const leftText = JSON.stringify(left);
          const rightText = JSON.stringify(right);
          return leftText < rightText ? -1 : leftText > rightText ? 1 : 0;
        });
        segment = [...literals, ...expressions];
      }
      normalized.push(...segment);
      segment = [];
    }
    for (const attribute of attributes) {
      if (attribute[0] === "...") {
        flush();
        normalized.push(attribute);
      } else {
        segment.push(attribute);
      }
    }
    flush();
    return normalized;
  }

  for (const element of elements) {
    const occurrence = occurrences.get(element.name) || 0;
    occurrences.set(element.name, occurrence + 1);
    const attributes = normalizeAttributeOrder(element.attributes);
    if (attributes.length > 0) signatures.push([element.name, occurrence, attributes]);
  }
  return signatures;
}

async function readInput() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return JSON.parse(input);
}

async function main() {
  const input = await readInput();
  if (typeof input.moduleRoot !== "string" || !Array.isArray(input.documents)) throw new Error("invalid input");
  const require = createRequire(path.join(input.moduleRoot, "package.json"));
  const modulePath = require.resolve("@mdx-js/mdx");
  const { createProcessor } = await import(pathToFileURL(modulePath).href);
  const processor = createProcessor({ format: "mdx" });
  const markdownProcessor = createProcessor({ format: "md" });
  const drifted = [];

  for (const document of input.documents) {
    if (typeof document.path !== "string" || typeof document.source !== "string" || typeof document.translated !== "string") {
      throw new Error("invalid document input");
    }
    try {
      const source = protectedAttributeSignatures(parseMdx(processor, markdownProcessor, document.source));
      const translated = protectedAttributeSignatures(parseMdx(processor, markdownProcessor, document.translated));
      if (JSON.stringify(source) !== JSON.stringify(translated)) drifted.push(document.path);
    } catch (error) {
      const location = error.line ? `:${error.line}:${error.column || 1}` : "";
      throw new Error(`${document.path}${location}: ${error.message || error}`, { cause: error });
    }
  }

  process.stdout.write(`${JSON.stringify({ drifted })}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message || error}\n`);
    process.exitCode = 1;
  });
}
