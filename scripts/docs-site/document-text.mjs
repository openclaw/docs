export function stripMdxForLlms(input) {
  return input
    .replace(/^import\s+.+?;?\s*$/gm, "")
    .replace(/<([A-Z][A-Za-z0-9_.-]*)([^>]*)\/>/g, (_, name, attrs) => componentLabel(name, attrs))
    .replace(/<([A-Z][A-Za-z0-9_.-]*)([^>]*)>/g, (_, name, attrs) => componentLabel(name, attrs))
    .replace(/<\/[A-Z][A-Za-z0-9_.-]*>/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

function componentLabel(name, attrs) {
  const parsed = Object.fromEntries([...String(attrs).matchAll(/([A-Za-z0-9_-]+)=(?:"([^"]*)"|'([^']*)')/g)].map((match) => [match[1], match[2] ?? match[3] ?? ""]));
  const label = parsed.title ?? parsed.name ?? parsed.href ?? "";
  return label ? `\n${label}\n` : `\n${name}\n`;
}

export function firstHeading(markdown) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1];
  return heading === undefined ? undefined : textFromHtml(heading).trim();
}

export function titleize(value) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function textFromHtml(value) {
  let text = "";
  let inTag = false;
  for (const char of String(value)) {
    if (char === "<") {
      inTag = true;
      continue;
    }
    if (char === ">") {
      inTag = false;
      continue;
    }
    if (!inTag) text += char;
  }
  return text;
}

export function fileSlug(rel) {
  return normalizeSlug(rel.replace(/\.(md|mdx)$/, ""));
}

export function normalizeSlug(value) {
  return value.replace(/\/index$/, "") || "index";
}
