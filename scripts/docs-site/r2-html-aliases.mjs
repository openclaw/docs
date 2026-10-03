// Retire only the second storage key for a proven identical HTML alias. The
// physical index file remains the upload source and the local preview target.
export function omitDuplicateHtmlIndexes(entries) {
  const byKey = new Map();
  for (const entry of entries) {
    const values = byKey.get(entry.key) ?? [];
    values.push(entry);
    byKey.set(entry.key, values);
  }
  const omitted = [];
  const retained = entries.filter(entry => {
    if (!entry.key.endsWith("/index.html") || entry.contentType !== "text/html; charset=utf-8") return true;
    const aliases = byKey.get(entry.key.slice(0, -"/index.html".length));
    if (aliases?.length !== 1 || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) return true;
    const alias = aliases[0];
    // Comparing every field except the storage key also fails closed for future
    // metadata additions. Both records must refer to the same hashed source.
    const fields = new Set([...Object.keys(entry), ...Object.keys(alias)]);
    fields.delete("key");
    if ([...fields].some(field => JSON.stringify(entry[field]) !== JSON.stringify(alias[field]))) return true;
    omitted.push(entry.key);
    return false;
  });
  return { entries: retained, omitted };
}
