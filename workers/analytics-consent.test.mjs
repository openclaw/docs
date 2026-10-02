import assert from "node:assert/strict";
import test from "node:test";
import { analyticsRegion } from "./analytics-consent.ts";
import router from "./docs-router.ts";

test("consent geography requires a validated platform ISO country", () => {
  for (const country of "AT BE BG HR CY CZ DK EE FI FR DE GR HU IS IE IT LV LI LT LU MT NL NO PL PT RO SK SI ES SE GB CH AX GF GP MQ RE YT MF".split(" ")) assert.equal(analyticsRegion(country), "opt_in", country);
  for (const country of ["US", "CA", "AU", "JP", "BR", "ZA", "NZ"]) assert.equal(analyticsRegion(country), "notice_opt_out", country);
  for (const country of [undefined, null, "", "XX", "T1", "A1", "ZZ", "EU", "UK", "us", " US", {}, 1]) assert.equal(analyticsRegion(country), "unknown", String(country));
});

test("existing Worker serves an uncached minimal consent decision without trusting spoofable headers", async () => {
  const request = new Request("https://docs.openclaw.ai/api/analytics-consent", { headers: { "cf-ipcountry": "US", "x-vercel-ip-country": "US", "x-country": "US" } });
  let response = await router.fetch(request, {}, {});
  assert.deepEqual(await response.json(), { schema_version: 1, policy_version: "2026-10-02.v2", region_class: "unknown" });
  for (const country of ["DE", "US", "ZZ"]) {
    const trusted = new Request(request);
    Object.defineProperty(trusted, "cf", { value: { country } });
    response = await router.fetch(trusted, {}, {});
    assert.deepEqual(await response.json(), { schema_version: 1, policy_version: "2026-10-02.v2", region_class: analyticsRegion(country) });
    for (const header of ["Cache-Control", "CDN-Cache-Control", "Cloudflare-CDN-Cache-Control"]) assert.match(response.headers.get(header), /no-store/);
    assert.equal(response.headers.get("Set-Cookie"), null);
  }
  response = await router.fetch(new Request(request, { method: "POST" }), {}, {});
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});
