# Docs analytics contract

Scope: `https://docs.openclaw.ai`, public generated documentation in every locale.
Property `557069374`, stream `15954198155`, measurement ID `G-3SK7X2YLSJ`.
The site uses native `gtag.js`; existing hosting and analytics integrations remain intact.

| Event | Owner and trigger | Additional fields / limits |
| --- | --- | --- |
| `page_view` | Shell: initial public page and completed PJAX navigation | Build-owned `page_location`, `page_title`; safe UTM values only; referrer origin on entry, prior canonical page thereafter. Hash/query-only changes do not add a view. Unsupported native-search URL parameters (`q/s/search/query/keyword`) are removed before tag startup/navigation; actual Pagefind search uses the filtered custom event. |
| `session_start`, `first_visit`, `user_engagement` | Native Google tag | No custom identity, cookie-domain override, or engagement-time inflation. |
| `scroll`, `click`, `file_download`, `video_start/progress/complete`, `view_search_results`, `form_start/submit` | Native Enhanced Measurement, when supported | Preserve the capabilities; shared automatic **history pageviews** must be off. Native form submission is an attempt, not verified success. Native video needs a supported embedded player; the current docs sources contain only a video code example, not a live supported player, so no watched-video outcome is claimed. |
| `scroll_depth` | Actual scrolling: once per 25/50/75% threshold per view | `percent_scrolled`; native 90% remains separate. |
| `section_view` | A build-allowlisted heading stays at least half visible for one second | `section_id`, once per view; first 24 TOC headings. |
| `content_engagement` | 30/60 visible seconds on public documentation, excluding open search/chat/consent panels | `engagement_seconds=30/60`, `content_type=documentation`, `content_id`. |
| `select_content` | Public docs/site links, curated references, search results, code tabs, feedback choices | `content_type`, `content_id`, `ui_location`; code tabs may add `method`, `install_platform`. Public editorial/resource handles are allowed; visitor identifiers are not. |
| `popup_view`, `popup_dismiss` | Search dialog, community invitation, diagram expansion, assistant shell | `popup_id`, `ui_location`, `dismiss_method` on dismissal. Layout occlusion is not a user dismissal. |
| `form_attempt` | Accessible feedback issue-launch button | `form_id=docs_feedback`, `ui_location=page_feedback`; no published-issue or lead claim. |
| `copy_action` | Clipboard API or fallback has resolved | `content_type`, stable `content_id`, `action_result=success/error`, `ui_location`; optional `method`, `install_platform`. Never copied text. |
| `search` | A custom Pagefind result set is visibly stable for 1.2 seconds, selected, or closed | `search_context=docs`, `search_filter=none`, `search_status=complete/partial/error`, actual rendered `result_count` on complete/partial results (top 12 of N is 12/partial); error omits count; `search_term` only when every word is in public navigation/heading/result-title vocabulary and passes sensitive-value checks. No input-event emission. |
| `web_vital` | Official `web-vitals` LCP/INP/CLS reporting | `metric_name`, exactly one of `lcp_ms`, `inp_ms`, `cls_score` (first two milliseconds; CLS unitless), `metric_rating`, `navigation_type`, `release`. One report per metric instance. Only a valid saved grant covering the document from its start permits document metrics. Any private/unclassified/denied interval permanently invalidates remaining metrics, including pending imports; a late grant does not read buffered metrics. Public-only PJAX keeps initial document context. |
| `client_error` | Runtime/resource/rejection categories and owned search failures | Fixed `error_type`, fixed `error_code`, `release`; at most five distinct categories per view. No exception strings, stacks, filenames, or input values. |

All custom events carry safe public page context. `release` is the publishing
workflow's 12-character commit SHA, or `local` in local builds. Public static
content IDs can be high-cardinality: register them only when a report needs the
dimension. `result_count`, `lcp_ms`, `inp_ms`, and `cls_score` are metrics, not identifier dimensions. Zero results are derived only from `search_status=complete` with `result_count=0`.
Do not combine native outbound events with content selections as one interaction
total or sum distinct users across hosts. No docs event proves installation.

## Privacy and consent

Preview builds, other origins, the hidden component fixture, unknown/error/API
routes, and unclassified history transitions cannot emit. Back/forward navigation
suspends measurement before its asynchronous fetch. A trusted BFCache restore
refreshes the persisted choice in a capture-phase `pageshow` handler before the
native SDK, then uses the same owner/dedupe for one allowed restored view. Ordinary
initial `pageshow` adds none. An unmeasured A→B→A journey starts one current view on regrant; query-only DOM replacements rebind observers without another pageview or fresh event budgets. Document metrics stay invalid after a restore boundary. The tag keeps native
cross-domain/cookie behavior; configured Google linker behavior still requires
shared-SDK verification.

The feedback issue launcher is a keyboard-accessible button. It constructs the
GitHub issue URL only for the actual launch, so private feedback never appears in
an analytics-observed `href`. This records an issue-launch attempt only; the docs
site cannot verify that an issue was published.

Opening the private Ask Molty panel pauses the tag with its native measurement
opt-out flag. Closing it resumes only a classified public page. A navigation performed while the private panel was open is dropped rather than replayed at close; subsequent safe events use the current public context. Events while
paused are dropped, never replayed by a custom queue. Private conversations,
their form activity, copied transcripts, and arbitrary private outbound references
are therefore a deliberate measurement gap. Public documentation remains measured
for signed-in visitors. A session check is not a new login or signup.

Google automatic user-provided-data collection is off. Google signals and
ad-personalization signals are also disabled locally. The approved regional
policy is `2026-10-02.v2`: EEA + GB + CH and AX/GF/GP/MQ/RE/YT/MF (39 codes) require opt-in; other validated countries
use notice/opt-out; unknown geography remains off without explicit permission.
The public shell now uses the narrower existing-grant-only rule described below;
these region classes cannot enable collection. The existing Worker classifies trusted `request.cf.country` and returns only the
region class from uncached `/api/analytics-consent`. It never uses client-supplied
country headers or exposes country/IP in the response.

Frozen policy SHA-256: `96bb4b0abc931d856ce14aff0131320e2c8f520d0bb2632037f864fe79bd5e93`. Both client and endpoint require the v2 version. An old-version record is not absence: it stays off until a fresh explicit v2 choice, even in a notice/opt-out region. Visits without a valid stored grant remain off in every region.

The public shell no longer renders automatic analytics notices or footer on/off
controls. Collection now requires an existing, valid explicit grant in
`openclaw.analytics.consent`; no region can create a new grant. Existing choices
retain their 180-day expiry and the same validation/lifecycle handling. New visitors
and expired choices remain off, including notice/opt-out regions. No replacement
popup or new grant flow is provided. This reduces measurement coverage. DNT/GPC and explicit denial override
an allow; failed storage, failed/invalid region responses, expired records, and
unknown regions fail closed. No automatic regional default is enabled.

Basic Consent Mode holds the SDK until allowed. Global analytics/advertising
consent starts denied; only analytics storage is granted when allowed. Denial
closes the application gate and sets Google's measurement opt-out before the
consent update. Pre-choice/private actions are never replayed. Async copy/search outcomes and deferred visibility callbacks carry the original eligible interval; withdrawal or a private boundary invalidates them permanently. Already-consented queued/in-flight public batches may finish sending after denial; this is distinct from new denied-state collection. Persisted denial propagates to same-origin tabs. Failed persistence keeps this runtime denied and preserves drafts without claiming durable storage. Only the observed `_ga` and `_ga_3SK7X2YLSJ` cookies at the installation's host/parent root scope are removed; unrelated cookies remain. These controls
apply to Google Analytics only; existing server traffic counts remain separate.
No global legal-compliance claim is made.

## Verification and limits

`node --test scripts/docs-site/analytics*.test.mjs` covers generated public page
classification and isolated browser behavior. Set `DOCS_GA4_SDK_PATH` to an ignored
download of the **coordinator-approved fresh SDK** for actual SDK transport checks.
All browser requests in these fixtures are intercepted locally; collection is
never forwarded. Do not rerun against a known-bad SDK while Google settings change.

Before activation, verify native event payloads, cross-domain links, acquisition,
private-panel suspension including delayed flush after closing, and one pageview
per intended navigation with that actual SDK. Browser transport is not provider
ingestion. Native provider reports may lag; cohort, percentile, and exploration
availability must be reported honestly. Heatmaps, replay, raw pointer/keystroke
recording, BigQuery export, advertising audiences, and User-ID are outside scope.

## Frozen Google/lifecycle proof

The coordinated public SDK captured at 2026-10-02 19:15:03 UTC has SHA-256
`01593a3bbcaed6a588925395731d5ec98b3304af3c220aa2a01db00cb51119e7`.
Admin/API and that SDK verified history measurement off while useful native
Enhanced Measurement stays on. Intercepted tests verify eight settled public
navigations produce eight pageviews; this is an external activation prerequisite,
not an assumption that `send_page_view: false` disables history measurement.

`analytics-bfcache.test.mjs` uses full managed Chromium headless (`channel:
"chromium"`) without Playwright's `--disable-back-forward-cache` default. The
headless-shell delegate cannot prove this lifecycle. The fixture traverses real
history using CDP, checks trusted `pageshow.persisted` plus retained document
state, and tests other-tab denial plus first-ever grant while cached (both no-choice and saved-deny starts). Positive activation is deferred only between trusted pagehide/pageshow; ordinary background tabs still activate. Run with
`DOCS_GA4_REQUIRE_BFCACHE=1` and the approved SDK file to require actual cache
restoration; ordinary CI also checks correct behavior if Chromium chooses reload.
No browser network request to Google is forwarded. No synthetic pageshow is used
as native lifecycle proof.

## Two-stage deployment gate

`DOCS_SITE_GA4_ENABLED` must equal `1` at build time to produce analytics page
metadata. The existing R2 workflow reads this repository
variable with a default of `0`; CI explicitly builds an enabled artifact. No
Actions permission, required check, deployment queue, upload scope, or router
infrastructure changes are part of this gate.

1. After closed-gate publishing authorization, verify/initialize the resolved
   repository/environment setting to `0`, land the reviewed head through normal
   checks, and let the existing R2/router workflow publish it. Verify the served
   router/asset commit, `/api/analytics-consent` decision and no-store headers,
   spoofed-country-header immunity, absent analytics page metadata, and no SDK
   loading in a bounded browser check.
2. After separate activation authorization, set `DOCS_SITE_GA4_ENABLED=1` and
   dispatch the existing R2 workflow with `artifact_scope=shell` at the reviewed
   current main. Verify the actual served metadata/assets and repeat bounded
   consent/SDK request checks. Coordinate provider ingestion with the Google
   collector owner; transport alone is not ingestion proof.

The removed UI previously displayed the approved withdrawal and configured
14-month retention addenda; retention configuration is unchanged. Retention configuration is not a claim that the
provider's 24-hour change window has elapsed or that historical data was restored.
