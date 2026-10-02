export function analyticsConsentHtml() {
  return `<aside class="docs-analytics-consent" data-analytics-consent hidden role="region" aria-labelledby="analytics-consent-title" tabindex="-1">
<div class="docs-analytics-consent__head"><h2 id="analytics-consent-title" data-analytics-consent-title>Optional Google Analytics</h2><button type="button" class="oc-action oc-action-ghost" data-analytics-consent-close aria-label="Close Google Analytics choices">Close</button></div>
<p data-analytics-consent-body>With your permission, we use Google Analytics to understand page visits, interactions, and performance on this site. We do not use it for advertising. You can change your choice anytime.</p>
<p>This choice controls Google Analytics only. Basic server traffic counts continue separately.</p>
<p data-analytics-consent-status role="status"></p>
<div class="docs-analytics-consent__actions"><button type="button" class="oc-action oc-action-secondary" data-analytics-allow>Allow Google Analytics</button><button type="button" class="oc-action oc-action-secondary" data-analytics-deny>Decline Google Analytics</button></div>
<details><summary>Privacy details</summary><p>When enabled, Google Analytics receives information about page visits, public content and link metadata, selected interactions, supported public searches, and performance. Public search terms are filtered before collection. Other typed form contents, private messages, and visitor account identity are not sent. Analytics cookies may recognize return visits. We do not use this setup for advertising. Your browser privacy signal and saved choice control Google Analytics collection. Turning Google Analytics off stops new Google Analytics collection on this site. Events already collected while it was allowed may finish sending, and information already sent is not recalled. A saved change also applies to other open tabs on this same site. Your choice is saved separately on each site for up to 180 days.</p><p>Google Analytics is configured to retain event-level data used for explorations for 14 months. User-associated data is configured for 14 months, with its retention timer reset by new activity. Most standard aggregate reports follow separate retention rules. These settings do not change how long this site saves your Google Analytics choice, which is up to 180 days.</p></details>
</aside>`;
}

// Serialized into the browser shell. The public renderer supplies no controls;
// keep persisted-choice validation and lifecycle handling without new grants.
export function initDocsAnalyticsConsent(analytics, onChange = () => {}) {
  if (location.origin !== "https://docs.openclaw.ai" || !document.querySelector(".main[data-analytics-path]")) return;
  const policyVersion = "2026-10-02.v2";
  const storageKey = "openclaw.analytics.consent";
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const panel = document.querySelector("[data-analytics-consent]");
  const launcher = document.querySelector("[data-analytics-choices]");
  const allow = panel?.querySelector("[data-analytics-allow]");
  const deny = panel?.querySelector("[data-analytics-deny]");
  let region = "unknown";
  let regionReady = false;
  let storageFailure = false;
  let explicit = null;
  let incompatiblePolicy = false;
  let dismissed = false;
  let preferences = false;
  let noticeShown = false;
  let returnFocus = null;
  let expiryTimer;
  let initialDecision = true;
  let pageHidden = false;
  const privacySignal = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || window.doNotTrack === "1";
  function parseChoice(raw) {
    if (!raw) return null;
    try {
      const value = JSON.parse(raw);
      const updated = Date.parse(value.updated_at);
      const expires = Date.parse(value.expires_at);
      const now = Date.now();
      if (value.schema_version !== 1 || value.policy_version !== policyVersion || !["granted", "denied"].includes(value.analytics)
        || typeof value.updated_at !== "string" || typeof value.expires_at !== "string"
        || !Number.isFinite(updated) || !Number.isFinite(expires) || updated > now || expires <= now || expires <= updated || expires - updated > lifetime
        || new Date(updated).toISOString() !== value.updated_at || new Date(expires).toISOString() !== value.expires_at) return null;
      return value;
    } catch { return null; }
  }
  function readChoice() {
    try {
      const raw = localStorage.getItem(storageKey);
      explicit = parseChoice(raw);
      incompatiblePolicy = false;
      if (raw) {
        try { incompatiblePolicy = JSON.parse(raw)?.policy_version !== policyVersion; }
        catch { incompatiblePolicy = true; }
      }
    }
    catch { storageFailure = true; explicit = null; }
  }
  function scheduleExpiry() {
    clearTimeout(expiryTimer);
    if (!explicit) return;
    // Browser delays are signed 32-bit milliseconds. Re-read and reschedule
    // long-lived choices rather than overflowing a 180-day timeout.
    const delay = Math.min(2147483647, Math.max(0, Date.parse(explicit.expires_at) - Date.now()));
    expiryTimer = setTimeout(() => { readChoice(); update(); }, delay);
  }
  function canStore() {
    try {
      const probe = storageKey + ".probe";
      localStorage.setItem(probe, "1");
      const ok = localStorage.getItem(probe) === "1";
      localStorage.removeItem(probe);
      return ok;
    } catch { return false; }
  }
  function granted() {
    if (privacySignal() || storageFailure) return false;
    // No public notice or choice controls are rendered. Only an existing valid
    // explicit grant permits collection; geography can never grant it.
    return explicit?.analytics === "granted";
  }
  function update() {
    if (panel && launcher) {
    const signal = privacySignal();
    const autoDefault = !signal && !storageFailure && !incompatiblePolicy && !explicit && region === "notice_opt_out";
    const notice = !preferences && autoDefault;
    panel.hidden = !(preferences || (autoDefault && !noticeShown) || (!dismissed && !explicit && (regionReady || signal || storageFailure)));
    if (autoDefault && !panel.hidden && !pageHidden) noticeShown = true;
    panel.querySelector("[data-analytics-consent-title]").textContent = notice ? "Google Analytics on this site" : "Optional Google Analytics";
    panel.querySelector("[data-analytics-consent-body]").textContent = autoDefault
      ? "Google Analytics is on to help us understand page visits, interactions, and performance. We do not use it for advertising. You can turn it off or change your choice anytime."
      : "With your permission, we use Google Analytics to understand page visits, interactions, and performance on this site. We do not use it for advertising. You can change your choice anytime.";
    panel.querySelector("[data-analytics-consent-status]").textContent = storageFailure
      ? "Google Analytics is off in this tab, but your choice could not be saved. It may not carry over to another tab or visit."
      : signal ? "Google Analytics is off because your browser sends a privacy signal."
      : granted() ? "Google Analytics is on." : "Google Analytics is off.";
    allow.textContent = notice ? "Keep Google Analytics on" : "Allow Google Analytics";
    deny.textContent = notice ? "Turn Google Analytics off" : "Decline Google Analytics";
    allow.disabled = signal || storageFailure;
    deny.disabled = storageFailure;
    launcher.setAttribute("aria-expanded", String(!panel.hidden));
    }
    // The public shell permits only a still-valid saved explicit grant.
    const allowed = granted();
    const eligibleFrom = initialDecision && allowed && explicit?.analytics === "granted" && Date.parse(explicit.updated_at) <= performance.timeOrigin ? 0 : performance.now();
    // A cached/departing document can receive a queued storage grant before
    // pageshow. Defer positive activation until the restore owner prepares it.
    // Ordinary background tabs have no pagehide and continue to update normally.
    if (!allowed || !pageHidden) analytics.setConsent(allowed, eligibleFrom);
    initialDecision = false;
    scheduleExpiry();
    onChange();
  }
  function close() {
    dismissed = true; preferences = false;
    update();
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }
  function choose(analyticsChoice) {
    if (privacySignal() && analyticsChoice === "granted") return;
    // Close the runtime gate even if saving the requested denial fails.
    if (analyticsChoice === "denied") analytics.setConsent(false);
    const now = Date.now();
    const value = { schema_version: 1, policy_version: policyVersion, analytics: analyticsChoice, updated_at: new Date(now).toISOString(), expires_at: new Date(now + lifetime).toISOString() };
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(storageKey, serialized);
      if (localStorage.getItem(storageKey) !== serialized) throw new Error("Preference unavailable");
      explicit = value; storageFailure = false; incompatiblePolicy = false;
      close();
    } catch {
      storageFailure = true;
      update();
    }
  }
  if (panel && launcher) {
  launcher.addEventListener("click", () => {
    returnFocus = document.activeElement;
    preferences = true;
    update();
    (allow.disabled ? panel.querySelector("[data-analytics-consent-close]") : allow).focus();
  });
  allow.addEventListener("click", () => choose("granted"));
  deny.addEventListener("click", () => choose("denied"));
  panel.querySelector("[data-analytics-consent-close]").addEventListener("click", close);
  panel.addEventListener("keydown", event => { if (event.key === "Escape") { event.stopPropagation(); close(); } });
  }
  addEventListener("storage", event => { if (event.key === storageKey || event.key === null) { readChoice(); update(); } });
  addEventListener("focus", () => { readChoice(); update(); });
  addEventListener("pagehide", event => { if (event.isTrusted) pageHidden = true; }, true);
  // Installed before the native SDK: cached tabs must refresh a changed/expired
  // choice before any native restore callback. The same pageview owner dedupes
  // a following popstate; ordinary initial pageshow never forces another view.
  addEventListener("pageshow", event => {
    if (event.isTrusted) pageHidden = false;
    const restored = event.persisted && event.isTrusted;
    if (restored) analytics.prepareRestore();
    readChoice(); update();
    if (restored) { analytics.pageView(); onChange(); }
  }, true);
  document.addEventListener("visibilitychange", () => { readChoice(); update(); });
  readChoice();
  storageFailure ||= !canStore();
  update();
  if (!panel || !launcher) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  fetch("/api/analytics-consent", { credentials: "omit", cache: "no-store", signal: controller.signal })
    .then(async response => {
      if (!response.ok) return;
      const value = await response.json();
      if (value?.schema_version === 1 && value.policy_version === policyVersion && ["opt_in", "notice_opt_out", "unknown"].includes(value.region_class)) region = value.region_class;
    })
    .catch(() => {})
    .finally(() => { clearTimeout(timeout); regionReady = true; update(); });
}
