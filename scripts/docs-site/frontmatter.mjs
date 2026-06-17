import { parse } from "yaml";

const openingDelimiter = /^---[ \t]*\r?\n/u;
const closingDelimiter = /\r?\n---[ \t]*(?:\r?\n|$)/u;

export function parseFrontmatter(source) {
  const input = String(source).replace(/^\uFEFF/u, "");
  const opening = input.match(openingDelimiter);
  if (!opening) return { data: {}, content: input };

  const frontmatterStart = opening[0].length;
  const closing = closingDelimiter.exec(input.slice(frontmatterStart));
  if (!closing || closing.index === undefined) return { data: {}, content: input };

  const data = parse(input.slice(frontmatterStart, frontmatterStart + closing.index)) ?? {};
  const contentStart = frontmatterStart + closing.index + closing[0].length;
  return { data, content: input.slice(contentStart) };
}
