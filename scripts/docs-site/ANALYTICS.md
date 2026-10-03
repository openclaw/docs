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
| `content_engagement` | 30/60 visible seconds on public documentation, excluding open search/chat panels | `engagement_seconds=30/60`, `content_type=documentation`, `content_id`. |
| `select_content` | Public docs/site links, curated references, search results, code tabs, feedback choices | `content_type`, `content_id`, `ui_location`; code tabs may add `method`, `install_platform`. Public editorial/resource handles are allowed; visitor identifiers are not. |
| `popup_view`, `popup_dismiss` | Search dialog, community invitation, diagram expansion, assistant shell | `popup_id`, `ui_location`, `dismiss_method` on dismissal. Layout occlusion is not a user dismissal. |
| `form_attempt` | Accessible feedback issue-launch button | `form_id=docs_feedback`, `ui_location=page_feedback`; no published-issue or lead claim. |
| `copy_action` | Clipboard API or fallback has resolved | `content_type`, stable `content_id`, `action_result=success/error`, `ui_location`; optional `method`, `install_platform`. Never copied text. |
| `search` | A custom Pagefind result set is visibly stable for 1.2 seconds, selected, or closed | `search_context=docs`, `search_filter=none`, `search_status=complete/partial/error`, actual rendered `result_count` on complete/partial results (top 12 of N is 12/partial); error omits count; `search_term` only when every word is in public navigation/heading/result-title vocabulary and passes sensitive-value checks. No input-event emission. |
| `web_vital` | Official `web-vitals` LCP/INP/CLS reporting | `metric_name`, exactly one of `lcp_ms`, `inp_ms`, `cls_score` (first two milliseconds; CLS unitless), `metric_rating`, `navigation_type`, `release`. One report per metric instance. Only a public document allowed by browser privacy signals from its start permits document metrics. Any private/unclassified/denied interval permanently invalidates remaining metrics, including pending imports; a later allowed interval does not read buffered metrics. Public-only PJAX keeps initial document context. |
| `client_error` | Runtime/resource/rejection categories and owned search failures | Fixed `error_type`, fixed `error_code`, `release`; at most five distinct categories per view. No exception strings, stacks, filenames, or input values. |

All custom events carry safe public page context. `release` is the executing JavaScript identity
`js-<12 hex>`, derived from emitted runtime content before its identity is prepended.
Full build provenance is separate in the R2 publication catalog. Public static
content IDs can be high-cardinality: register them only when a report needs the
dimension. `result_count`, `lcp_ms`, `inp_ms`, and `cls_score` are metrics, not identifier dimensions. Zero results are derived only from `search_status=complete` with `result_count=0`.
Do not combine native outbound events with content selections as one interaction
total or sum distinct users across hosts. No docs event proves installation.

## Privacy and consent

Preview builds, other origins, the hidden component fixture, unknown/error/API
routes, and unclassified history transitions cannot emit. Back/forward navigation
suspends measurement before its asynchronous fetch. A trusted BFCache restore
refreshes browser privacy signals in a capture-phase `pageshow` handler before the
native SDK, then uses the same owner/dedupe for one allowed restored view. Ordinary
initial `pageshow` adds none. An unmeasured A→B→A journey starts one current view on browser-signal recovery; query-only DOM replacements rebind observers without another pageview or fresh event budgets. Document metrics stay invalid after a restore boundary. The tag keeps native
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
ad-personalization signals are disabled locally. Eligible public production pages
start analytics automatically unless the browser sends a recognized DNT/GPC
signal. No saved analytics-choice record is read, written, migrated or consulted;
missing, granted, denied, expired, malformed and inaccessible old records all
have the same eligibility. No regional response is requested or awaited. The
existing geography endpoint is unused by analytics startup.

No analytics notice, banner, dialog or footer toggle is rendered. The minimal
shared Privacy policy and footer link remain unchanged. Basic Consent Mode keeps
all advertising consent denied; only analytics storage becomes granted on an
eligible public page. Browser privacy signals and private/unclassified boundaries
close the native measurement gate. Async outcomes and deferred callbacks from a
blocked interval cannot replay on recovery. Already-allowed queued/in-flight
public batches may finish sending; they are distinct from newly blocked activity.
Observed GA cookies are cleared when a browser privacy signal blocks an active
runtime; unrelated cookies and user drafts remain. Server traffic counts are
separate. This is a global public-page default, not a regional default.

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
state, and tests ignored old-record changes plus browser GPC across restore. Positive activation is deferred only between trusted pagehide/pageshow; ordinary background tabs still activate. Run with
`DOCS_GA4_REQUIRE_BFCACHE=1` and the approved SDK file to require actual cache
restoration; ordinary CI also checks correct behavior if Chromium chooses reload.
No browser network request to Google is forwarded. No synthetic pageshow is used
as native lifecycle proof.

## Deployment controls

`DOCS_SITE_GA4_ENABLED` must equal `1` at build time to produce analytics page
metadata. The existing R2 workflow reads this repository variable with a default
of `0`; CI builds an enabled artifact. The current correction leaves the verified
production flag enabled. No Actions permission, required check, queue, upload
scope or hosting infrastructure is changed.

Land a reviewed exact head through normal checks and the existing publication.
Record first observed new JavaScript separately from complete HTML publication:
R2 uploads shared assets first, and cached/previously open documents may retain
an older runtime. Preserve the content-derived runtime ID and the independent
catalog build commit. Coordinate the effective collection scope with the source
and reader owners; reporting metadata holds must not be mislabeled as site gates.
All acceptance browser collection is intercepted, never forwarded as synthetic
QA. Provider settings, historical observations and unrecorded past visits are not
changed or reconstructed by this correction.
