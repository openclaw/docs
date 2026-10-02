import assert from "node:assert/strict";
import vm from "node:vm";
import test from "node:test";
import { createDocsAnalytics } from "./analytics.mjs";
import { createDocsAnalyticsEvents } from "./analytics-events.mjs";

const turn = () => new Promise(resolve => setImmediate(resolve));
function harness({ delayed = false, withEvents = false } = {}) {
  const callbacks = {};
  const library = Object.fromEntries(["LCP", "INP", "CLS"].map(name => ["on" + name, callback => { callbacks[name] = callback; }]));
  let resolveLibrary;
  let rejectLibrary;
  const pending = new Promise((resolve, reject) => { resolveLibrary = resolve; rejectLibrary = reject; });
  let loads = 0;
  const main = { dataset: { analyticsPath: "/", analyticsTitle: "Public docs", analyticsRelease: "fixture" } };
  const sandbox = {
    location: new URL("https://docs.openclaw.ai/"), URL, URLSearchParams, Date,
    navigator: {}, performance: { now: () => 1000 },
    document: { querySelector: () => main, querySelectorAll: () => [], addEventListener() {}, referrer: "", cookie: "", createElement: () => ({}), head: { append() {} } },
    history: { replaceState() {} },
    addEventListener() {}, clearTimeout() {}, clearInterval() {}, setInterval: () => 0,
    loadVitals: () => { loads++; return delayed ? pending : Promise.resolve(library); },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(`globalThis.analytics=(${createDocsAnalytics.toString()})(loadVitals);`, sandbox);
  if (withEvents) vm.runInNewContext(`globalThis.telemetry=(${createDocsAnalyticsEvents.toString()})(analytics);`, sandbox);
  const vitals = () => JSON.parse(JSON.stringify((sandbox.dataLayer || []).filter(entry => entry[0] === "event" && entry[1] === "web_vital").map(entry => entry[2])));
  const report = (name, id) => callbacks[name]?.({ name, id, value: name === "CLS" ? 0.04 : 100, rating: "good", navigationType: "navigate", entries: [{ startTime: 1500 }] });
  return { analytics: sandbox.analytics, sandbox, main, callbacks, vitals, report, resolve: () => resolveLibrary(library), reject: () => rejectLibrary(new Error("Unavailable fixture module")), loads: () => loads };
}

test("allowed document vitals keep typed values and their original public document context", async () => {
  const h = harness();
  h.analytics.setConsent(true, 0);
  await turn();
  h.report("LCP", "first"); h.report("LCP", "first");
  h.sandbox.location.pathname = "/next"; h.main.dataset.analyticsPath = "/next";
  h.analytics.pageView();
  h.report("INP", "second"); h.report("CLS", "third");
  assert.equal(h.vitals().length, 3);
  for (const metric of h.vitals()) {
    assert.equal(metric.page_location, "https://docs.openclaw.ai/");
    assert.equal(["lcp_ms", "inp_ms", "cls_score"].filter(key => Object.hasOwn(metric, key)).length, 1);
    assert.equal(metric.metric_value, undefined);
  }
});

for (const boundary of ["private", "history", "denial"]) test(`${boundary} permanently invalidates document metrics after public recovery`, async () => {
  const h = harness();
  h.analytics.setConsent(true, 0);
  await turn();
  h.report("LCP", "allowed");
  if (boundary === "private") h.analytics.hold("docs_assistant", true);
  else if (boundary === "history") h.analytics.suspend();
  else h.analytics.setConsent(false);
  h.report("INP", "during-boundary");
  if (boundary === "private") h.analytics.hold("docs_assistant", false);
  else if (boundary === "history") h.analytics.pageView();
  else h.analytics.setConsent(true);
  h.report("INP", "after-boundary"); h.report("CLS", "after-boundary");
  assert.equal(h.vitals().length, 1, "only the metric captured during the fully allowed interval survives");
});

test("private interruption during the asynchronous import prevents observer registration", async () => {
  const h = harness({ delayed: true });
  h.analytics.setConsent(true, 0);
  assert.equal(h.loads(), 1);
  h.analytics.hold("docs_assistant", true);
  h.analytics.hold("docs_assistant", false);
  h.resolve();
  await turn();
  assert.deepEqual(Object.keys(h.callbacks), []);
  assert.deepEqual(h.vitals(), []);
});

test("late consent never reads buffered document metrics from an earlier denied interval", async () => {
  const h = harness();
  h.analytics.setConsent(true);
  await turn();
  assert.equal(h.loads(), 0);
  assert.deepEqual(h.vitals(), []);
  assert.ok(h.sandbox.dataLayer.some(entry => entry[1] === "page_view"), "current public traffic still works after a late grant");
});

test("a delayed vitals import failure shares the original view's bounded error budget", async () => {
  const h = harness({ delayed: true, withEvents: true });
  h.analytics.setConsent(true, 0);
  for (const code of ["type_error", "reference_error", "range_error", "syntax_error", "unhandled_rejection"]) h.sandbox.telemetry.clientError("runtime", code);
  h.sandbox.location.pathname = "/next"; h.main.dataset.analyticsPath = "/next";
  h.analytics.pageView();
  h.reject();
  await turn();
  h.sandbox.telemetry.clientError("runtime", "type_error");
  const errors = h.sandbox.dataLayer.filter(entry => entry[1] === "client_error").map(entry => entry[2]);
  assert.equal(errors.filter(event => event.page_location === "https://docs.openclaw.ai/").length, 5);
  assert.equal(errors.filter(event => event.page_location === "https://docs.openclaw.ai/next").length, 1);
});
