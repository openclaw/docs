import { DomUtils, parseDocument } from "htmlparser2";

// Component indentation normalization can split a compact disclosure from its
// Markdown bullet inside a topic accordion. Repair only that exact sibling
// shape, at render time, without changing authored Markdown or link content.
export function attachReleasePointToggles(html) {
  if (!html.includes('release-source-inline')) return html;
  const tree = parseDocument(html, { withStartIndices: true, withEndIndices: true });
  const edits = [];
  const hasClass = (node, name) => node?.attribs?.class?.split(/\s+/).includes(name);
  const nonblank = n => n.type !== 'text' || n.data.trim();
  for (const details of DomUtils.findAll(n => n.name === 'details' && hasClass(n, 'release-source-inline'), tree.children)) {
    if (!hasClass(details.parent, 'oc-accordion-content')) continue;
    let list = details.prev;
    while (list && !nonblank(list)) list = list.prev;
    if (list?.name !== 'ul') continue;
    const item = list.children.findLast(nonblank);
    if (item?.name !== 'li') continue;
    const content = item.children.filter(nonblank);
    if (!content.length || content.some(n => ['ul', 'ol', 'details', 'div', 'pre', 'table'].includes(n.name))) continue;
    const start = item.startIndex + html.slice(item.startIndex, content[0].startIndex).indexOf('>') + 1;
    const end = item.endIndex + 1 - '</li>'.length;
    const body = html.slice(start, end);
    const paragraph = content.some(n => n.name === 'p') ? body : `<p>${body}</p>`;
    edits.push([start, details.endIndex + 1, paragraph + '\n' + html.slice(details.startIndex, details.endIndex + 1) + '\n</li>\n</ul>']);
  }
  const result = []; let pos = 0;
  for (const [start,end,markup] of edits) { result.push(html.slice(pos,start),markup); pos=end; }
  const attached = result.join('') + html.slice(pos);
  // A plain space between an inline paragraph and its control is a legal line
  // break. Bind the last word to the control even near a narrow right edge.
  // Adjacent unlabeled source records for one point share one disclosure;
  // never collapse anchors, custom summaries or author-specified attributes.
  const nodes = parseDocument(attached, { withStartIndices: true, withEndIndices: true });
  const standard = n => n?.name === 'details' && Object.keys(n.attribs).length === 1 &&
    hasClass(n, 'release-source-toggle') && hasClass(n, 'release-source-inline') &&
    n.children.find(nonblank)?.name === 'summary' &&
    attached.slice(n.children.find(nonblank).startIndex, n.children.find(nonblank).endIndex + 1) === '<summary>More details</summary>';
  const replacements = [];
  for (const d of DomUtils.findAll(standard, nodes.children)) {
    let prev = d.prev;
    while (prev && !nonblank(prev)) prev = prev.prev;
    if (!prev) continue;
    if (prev.name === 'p') {
      const end = prev.endIndex + 1 - '</p>'.length;
      if (attached.slice(end, prev.endIndex + 1) === '</p>') replacements.push([end, d.startIndex, '&#8288;</p>']);
    } else if (standard(prev) && hasClass(d.parent, 'oc-accordion-content')) {
      const end = prev.endIndex + 1 - '</details>'.length;
      if (attached.slice(end, prev.endIndex + 1) === '</details>') replacements.push([end, d.children.find(nonblank).endIndex + 1, '\n']);
    }
  }
  const joined = []; let cursor = 0;
  for (const [start,end,markup] of replacements) { joined.push(attached.slice(cursor,start), markup); cursor=end; }
  return joined.join('') + attached.slice(cursor);
}
