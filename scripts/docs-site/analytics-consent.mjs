// Serialized into the browser shell. Public measurement follows browser privacy
// signals and the runtime's public-page gate; it has no saved-choice or geography
// dependency. Advertising consent remains denied in createDocsAnalytics.
export function initDocsAnalyticsConsent(analytics, onChange = () => {}) {
  if (location.origin !== "https://docs.openclaw.ai") return;
  let initialDecision = true;
  let pageHidden = false;
  const privacySignal = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || window.doNotTrack === "1";
  function update() {
    const allowed = !privacySignal();
    const eligibleFrom = initialDecision && allowed ? 0 : performance.now();
    // A cached/departing document must not initialize the SDK before its restore
    // owner is ready. Ordinary background tabs have no pagehide boundary.
    if (!allowed || !pageHidden) analytics.setConsent(allowed, eligibleFrom);
    initialDecision = false;
    onChange();
  }
  addEventListener("focus", update);
  addEventListener("pagehide", event => { if (event.isTrusted) pageHidden = true; }, true);
  // Register before SDK startup: privacy signals are refreshed before native
  // restore callbacks, and the existing pageview owner dedupes later popstate.
  addEventListener("pageshow", event => {
    if (event.isTrusted) pageHidden = false;
    const restored = event.persisted && event.isTrusted;
    if (restored) analytics.prepareRestore();
    update();
    if (restored) { analytics.pageView(); onChange(); }
  }, true);
  document.addEventListener("visibilitychange", update);
  update();
}
