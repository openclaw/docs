// Serialized into the browser shell. All page identity comes from the renderer.
export function createDocsAnalytics(loadVitals, runtimeRelease = "local") {
  const origin = "https://docs.openclaw.ai";
  const measurementId = "G-3SK7X2YLSJ";
  const listeners = [];
  const privateSurfaces = new Set();
  let previousLocation = "";
  let currentLocation = "";
  let currentPage = null;
  let currentMain = null;
  let lastCommittedPath = location.origin + (location.pathname.replace(/\/+$/, "") || "/");
  let unmeasuredNavigation = false;
  let started = false;
  let consentAllowed = false;
  let metricsEligibleFrom = 0;
  let documentMetricsInvalid = false;
  let droppedHeldView = false;
  let reportError;
  let collectionEpoch = 0;

  function optedOut() {
    return navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || window.doNotTrack === "1";
  }
  function publicPage() {
    if (location.origin !== origin || !consentAllowed || optedOut()) return null;
    const main = document.querySelector(".main[data-analytics-path]");
    const path = main?.dataset.analyticsPath;
    if (!path || !main.dataset.analyticsTitle || path !== (location.pathname.replace(/\/+$/, "") || "/")) return null;
    return { main, path, title: main.dataset.analyticsTitle, release: runtimeRelease };
  }
  function suspend() {
    collectionEpoch++;
    window["ga-disable-" + measurementId] = true;
    // Document aggregates cannot separate a later private/denied interval.
    // Never resume these metrics in this document, even after consent returns.
    documentMetricsInvalid = true;
  }
  function context() { return !privateSurfaces.size && publicPage() && !window["ga-disable-" + measurementId] ? currentPage : null; }
  // Async outcomes remain eligible only within the same continuously allowed
  // interval. A later grant must not replay denied or pre-withdrawal work.
  function capture() { return { page: context(), epoch: collectionEpoch }; }
  function isCurrentCapture(value) { return Boolean(value?.page && value.epoch === collectionEpoch && context()); }
  function hold(reason, active) {
    if (active) { privateSurfaces.add(reason); suspend(); }
    else if (privateSurfaces.delete(reason) && !privateSurfaces.size) {
      const sendView = !droppedHeldView;
      droppedHeldView = false;
      pageView(sendView);
    }
  }
  function prepareRestore() { suspend(); currentLocation = ""; }
  function setConsent(allowed, eligibleFrom = performance.now()) {
    const next = allowed === true && !optedOut();
    if (next === consentAllowed) return;
    consentAllowed = next;
    if (consentAllowed && !started) metricsEligibleFrom = eligibleFrom;
    if (!consentAllowed) suspend();
    if (!consentAllowed && started) {
      // These exact names, parent domain, and root path were observed with
      // this native tag. Preserve other properties and unrelated cookies.
      const present = new Set(document.cookie.split(";").map(cookie => cookie.trim().split("=")[0]));
      for (const name of ["_ga", "_ga_3SK7X2YLSJ"]) {
        if (!present.has(name)) continue;
        document.cookie = name + "=; Max-Age=0; Path=/; SameSite=Lax";
        document.cookie = name + "=; Max-Age=0; Path=/; Domain=.openclaw.ai; SameSite=Lax";
      }
    }
    if (started) window.gtag("consent", "update", { analytics_storage: consentAllowed ? "granted" : "denied" });
    if (consentAllowed) pageView();
  }
  function event(name, parameters = {}, page = context()) {
    if (!page || !context() || !started) return false;
    window.gtag("event", name, { ...parameters, ...page, send_to: measurementId });
    return true;
  }
  function safeCampaign(value) {
    const text = String(value || "").trim();
    if (!text || text.length > 80 || !/^[\p{L}\p{N} _.-]+$/u.test(text) || /\d{7}|[a-f\d]{20}|token|password|secret/i.test(text)) return "";
    return text;
  }
  function externalReferrer() {
    try {
      const url = new URL(document.referrer);
      if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".") || /^(?:\d+\.){3}\d+$/.test(url.hostname)) return "";
      // Retain referral attribution without paths, credentials, or query data.
      return url.origin + "/";
    } catch { return ""; }
  }
  function startVitals(page) {
    // Buffered/document aggregates cannot be reconstructed for a partial
    // permission interval. A late grant starts traffic, but not document vitals.
    if (!loadVitals || documentMetricsInvalid || metricsEligibleFrom > 0) return;
    const sent = new Set();
    const metricPage = { ...page };
    loadVitals().then(vitals => {
      if (documentMetricsInvalid) return;
      const report = metric => {
        if (documentMetricsInvalid) return;
        if (!["LCP", "INP", "CLS"].includes(metric.name) || !Number.isFinite(metric.value) || metric.value < 0) return;
        const key = metric.name + ":" + metric.id;
        if (sent.has(key)) return;
        if (event("web_vital", {
          metric_name: metric.name,
          [{ LCP: "lcp_ms", INP: "inp_ms", CLS: "cls_score" }[metric.name]]: Math.round(metric.value * 1000) / 1000,
          metric_rating: metric.rating,
          navigation_type: metric.navigationType,
          release: page.release,
        }, metricPage)) sent.add(key);
      };
      // Document metrics belong to the initial document, not a later PJAX page.
      vitals.onLCP(report); vitals.onINP(report); vitals.onCLS(report);
    }).catch(() => {
      if (!documentMetricsInvalid) reportError?.("resource", "vitals_unavailable", page);
    });
  }
  function pageView(sendView = true) {
    const committedPath = location.origin + (location.pathname.replace(/\/+$/, "") || "/");
    if (committedPath !== lastCommittedPath && (!consentAllowed || privateSurfaces.size || optedOut())) unmeasuredNavigation = true;
    lastCommittedPath = committedPath;
    if (privateSurfaces.size) {
      if (started && location.origin + (location.pathname.replace(/\/+$/, "") || "/") !== currentLocation) droppedHeldView = true;
      suspend(); return;
    }
    if (!consentAllowed || optedOut()) { if (started) suspend(); return; }
    const page = publicPage();
    if (!page) {
      suspend();
      currentLocation = "";
      currentPage = null;
      currentMain = null;
      return;
    }
    // Docs search is the Pagefind dialog, not a URL-query route. Google's
    // native search module reads these otherwise-unused values directly from
    // location even when page_location is overridden. Keep campaign/linker and
    // functional parameters intact; never disable search for the shared stream.
    const publicUrl = new URL(location.href);
    let cleaned = false;
    for (const key of ["q", "s", "search", "query", "keyword"]) {
      if (publicUrl.searchParams.has(key)) { publicUrl.searchParams.delete(key); cleaned = true; }
    }
    if (cleaned) history.replaceState(history.state, "", publicUrl.href);
    window["ga-disable-" + measurementId] = false;
    const canonical = origin + page.path;
    const sameView = canonical === currentLocation && !unmeasuredNavigation;
    if (sameView && page.main === currentMain) return;
    const locationUrl = new URL(canonical);
    const query = new URLSearchParams(location.search);
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_content", "utm_term"]) {
      const value = safeCampaign(query.get(key));
      if (value) locationUrl.searchParams.set(key, value);
    }
    const fields = {
      page_location: locationUrl.href,
      page_title: page.title,
      page_referrer: sameView ? currentPage.page_referrer : previousLocation || externalReferrer(),
      release: page.release,
    };
    // A query-only render refreshes DOM bindings without resetting a view's
    // event budgets; a denied A->B->A journey starts one current view on grant.
    if (sameView) Object.assign(currentPage, fields); else currentPage = fields;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (!started) {
      window.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      window.gtag("consent", "update", { analytics_storage: "granted" });
    }
    window.gtag("set", currentPage);
    if (!started) {
      started = true;
      window.gtag("js", new Date());
      // Suppress automatic history pageviews at the shared Google stream;
      // retain its other native Enhanced Measurement capabilities.
      window.gtag("config", measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
      script.referrerPolicy = "no-referrer";
      document.head.append(script);
      startVitals(currentPage);
    }
    if (sendView && !sameView) event("page_view");
    previousLocation = canonical;
    currentLocation = canonical;
    currentMain = page.main;
    unmeasuredNavigation = false;
    for (const listener of listeners) listener({ ...page, preserveView: sameView });
  }
  return { pageView, suspend, hold, prepareRestore, setConsent, event, context, capture, isCurrentCapture, publicPage, onPage: listener => listeners.push(listener), onError: listener => { reportError = listener; } };
}
