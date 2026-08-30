import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { parse } from "yaml";
import { parsePurgeUrls, purgeCloudflareUrls } from "./cloudflare-purge.mjs";

test("accepts exact HTTPS URLs inside the configured zone", () => {
  assert.deepEqual(
    parsePurgeUrls(
      JSON.stringify([
        "https://docs.openclaw.ai/releases/2026.8.1",
        "https://docs.openclaw.ai/releases/2026.8.1/",
        "https://docs.openclaw.ai/releases/2026.8.1",
      ]),
      "openclaw.ai",
    ),
    [
      "https://docs.openclaw.ai/releases/2026.8.1",
      "https://docs.openclaw.ai/releases/2026.8.1/",
    ],
  );
});

for (const value of [
  "http://docs.openclaw.ai/releases/2026.8.1",
  "https://example.com/releases/2026.8.1",
  "https://user@example.openclaw.ai/release",
  "https://docs.openclaw.ai/release#fragment",
]) {
  test(`rejects unsafe purge target ${value}`, () => {
    assert.throws(() => parsePurgeUrls(JSON.stringify([value]), "openclaw.ai"));
  });
}

test("resolves the zone and purges only the supplied URLs", async () => {
  const requests = [];
  const urls = ["https://docs.openclaw.ai/releases/2026.8.1"];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init });
    if (url.includes("/zones?")) {
      return jsonResponse({ success: true, result: [{ id: "zone-id" }] });
    }
    return jsonResponse({ success: true, result: { id: "purge-id" } });
  };

  assert.deepEqual(
    await purgeCloudflareUrls({ fetchImpl, token: "secret", urls, zoneName: "openclaw.ai" }),
    { count: 1, zoneId: "zone-id" },
  );
  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /\/zones\?name=openclaw\.ai&status=active$/u);
  assert.match(requests[1].url, /\/zones\/zone-id\/purge_cache$/u);
  assert.equal(requests[1].init.method, "POST");
  assert.deepEqual(JSON.parse(requests[1].init.body), { files: urls });
});

test("Pages workflow exposes the protected exact-URL purge", () => {
  const workflow = parse(
    fs.readFileSync(new URL("../../.github/workflows/pages.yml", import.meta.url), "utf8"),
  );
  const dispatch = (workflow.on ?? workflow[true]).workflow_dispatch;
  assert.equal(dispatch.inputs.purge_urls.type, "string");
  const purge = workflow.jobs.worker.steps.find((step) => step.name === "Purge exact docs URLs");
  assert.equal(purge.env.CLOUDFLARE_API_TOKEN, "${{ secrets.CLOUDFLARE_API_TOKEN }}");
  assert.equal(purge.run, "node scripts/docs-site/cloudflare-purge.mjs");
});

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}
