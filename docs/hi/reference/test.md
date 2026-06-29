---
read_when:
    - परीक्षण चलाना या ठीक करना
summary: स्थानीय रूप से टेस्ट कैसे चलाएँ (vitest) और force/coverage मोड कब इस्तेमाल करें
title: परीक्षण
x-i18n:
    generated_at: "2026-06-29T00:11:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- पूर्ण परीक्षण किट (सुइट्स, लाइव, Docker): [परीक्षण](/hi/help/testing)
- अपडेट और Plugin पैकेज सत्यापन: [अपडेट और Plugin का परीक्षण](/hi/help/testing-updates-plugins)

- नियमित स्थानीय परीक्षण क्रम:
  1. बदले हुए दायरे के Vitest प्रमाण के लिए `pnpm test:changed`।
  2. एक फ़ाइल, डायरेक्टरी, या स्पष्ट लक्ष्य के लिए `pnpm test <path-or-filter>`।
  3. `pnpm test` केवल तब जब आपको जानबूझकर पूरी स्थानीय Vitest suite चाहिए।
- `pnpm test:force`: डिफ़ॉल्ट control port को पकड़े हुए किसी भी बचे हुए gateway process को बंद करता है, फिर अलग-थलग gateway port के साथ पूरी Vitest suite चलाता है ताकि server tests किसी चल रहे instance से न टकराएँ। इसका उपयोग तब करें जब पहले के gateway run ने port 18789 को व्यस्त छोड़ दिया हो।
- `pnpm test:coverage`: V8 coverage के साथ unit suite चलाता है (`vitest.unit.config.ts` के माध्यम से)। यह default-unit-lane coverage gate है, पूरे repo की all-file coverage नहीं। Thresholds 70% lines/functions/statements और 55% branches हैं। क्योंकि `coverage.all` false है और default lane coverage includes को sibling source files वाले non-fast unit tests तक सीमित करता है, gate हर transitive import जिसे वह संयोग से load करता है, उसके बजाय इस lane के स्वामित्व वाले source को मापता है।
- `pnpm test:coverage:changed`: केवल `origin/main` के बाद बदली गई फ़ाइलों के लिए unit coverage चलाता है।
- `pnpm test:changed`: सस्ता smart changed test run। यह direct test edits, sibling `*.test.ts` files, explicit source mappings, और local import graph से precise targets चलाता है। Broad/config/package changes छोड़े जाते हैं जब तक वे precise tests पर map न हों।
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: explicit broad changed test run। इसका उपयोग तब करें जब test harness/config/package edit को Vitest के broader changed-test behavior पर fall back करना चाहिए।
- `pnpm changed:lanes`: `origin/main` के विरुद्ध diff से triggered architectural lanes दिखाता है।
- `pnpm check:changed`: CI के बाहर default रूप से Crabbox/Testbox को delegate करता है, फिर remote child के अंदर `origin/main` के विरुद्ध diff के लिए smart changed check gate चलाता है। यह प्रभावित architectural lanes के लिए typecheck, lint, और guard commands चलाता है, लेकिन Vitest tests नहीं चलाता। test proof के लिए `pnpm test:changed` या explicit `pnpm test <target>` का उपयोग करें।
- Codex worktrees और linked/sparse checkouts: direct local `pnpm test*`, `pnpm check*`, और `pnpm crabbox:run` से बचें जब तक आपने verify न कर लिया हो कि pnpm dependencies reconcile नहीं करेगा। छोटे explicit-file proof के लिए `node scripts/run-vitest.mjs <path-or-filter>` का उपयोग करें; changed gates या broad proof के लिए `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` का उपयोग करें ताकि pnpm Testbox के अंदर चले।
- Testbox-through-Crabbox proof: wrapper के अंतिम `exitCode` और timing JSON को command result के रूप में उपयोग करें। delegated Blacksmith GitHub Actions run सफल SSH command के बाद `cancelled` दिखा सकता है क्योंकि Testbox को keepalive action के बाहर से रोक दिया जाता है; इसे test failure मानने से पहले wrapper summary और command output verify करें।
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: `pnpm check:changed` और targeted `pnpm test ...` जैसे commands के लिए heavy-check serialization को Git common dir के बजाय current worktree के अंदर रखता है। इसका उपयोग केवल high-capacity local hosts पर तब करें जब आप linked worktrees में independent checks जानबूझकर चला रहे हों।
- `pnpm test`: explicit file/directory targets को scoped Vitest lanes के माध्यम से route करता है। Untargeted runs full-suite proof हैं: वे fixed shard groups का उपयोग करते हैं, local parallel execution के लिए leaf configs तक expand करते हैं, और शुरू करने से पहले expected local shard fanout print करते हैं। extension group हमेशा एक विशाल root-project process के बजाय per-extension shard configs तक expand करता है।
- Test wrapper runs एक छोटे `[test] passed|failed|skipped ... in ...` summary के साथ समाप्त होते हैं। Vitest की अपनी duration line per-shard detail रहती है।
- Shared OpenClaw test state: जब किसी test को isolated `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir, या auth-profile store चाहिए, तो Vitest से `src/test-utils/openclaw-test-state.ts` का उपयोग करें।
- `pnpm test:env-mutations:report`: उन tests और harnesses की non-blocking report जो `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR`, या संबंधित OpenClaw env keys को सीधे mutate करते हैं। shared test-state helper पर migration के candidates खोजने के लिए इसका उपयोग करें।
- Control UI mocked E2E: उस Vitest + Playwright lane के लिए `pnpm test:ui:e2e` का उपयोग करें जो Vite Control UI शुरू करता है और mocked Gateway WebSocket के विरुद्ध real Chromium page चलाता है। Tests `ui/src/**/*.e2e.test.ts` में रहते हैं; shared mocks और controls `ui/src/test-helpers/control-ui-e2e.ts` में रहते हैं। `pnpm test:e2e` में यह lane शामिल है। Codex worktrees में, dependencies install होने के बाद छोटे targeted proof के लिए `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` को प्राथमिकता दें, या broader GUI proof के लिए Testbox/Crabbox का उपयोग करें।
- Process E2E helpers: जब Vitest process-level E2E test को एक ही जगह running Gateway, CLI env, log capture, और cleanup चाहिए, तो `test/helpers/openclaw-test-instance.ts` का उपयोग करें।
- TUI PTY tests: fast fake-backend PTY lane के लिए `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` का उपयोग करें। धीमे `tui --local` smoke के लिए `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` या `pnpm tui:pty:test:watch --mode local` का उपयोग करें, जो केवल external model endpoint को mock करता है। raw ANSI snapshots नहीं, बल्कि stable visible text या fixture calls assert करें।
- Docker/Bash E2E helpers: जो lanes `scripts/lib/docker-e2e-image.sh` source करते हैं, वे container में `docker_e2e_test_state_shell_b64 <label> <scenario>` pass कर सकते हैं और उसे `scripts/lib/openclaw-e2e-instance.sh` से decode कर सकते हैं; multi-home scripts `docker_e2e_test_state_function_b64` pass कर सकते हैं और प्रत्येक flow में `openclaw_test_state_create <label> <scenario>` call कर सकते हैं। Lower-level callers in-container shell snippet के लिए `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` का उपयोग कर सकते हैं, या sourceable host env file के लिए `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` का उपयोग कर सकते हैं। `create` से पहले का `--` नए Node runtimes को `--env-file` को Node flag मानने से रोकता है। Gateway launch करने वाले Docker/Bash lanes entrypoint resolution, mock OpenAI startup, Gateway foreground/background launch, readiness probes, state env export, log dumps, और process cleanup के लिए container के अंदर `scripts/lib/openclaw-e2e-instance.sh` source कर सकते हैं।
- Full, extension, और include-pattern shard runs local timing data को `.artifacts/vitest-shard-timings.json` में update करते हैं; बाद के whole-config runs slow और fast shards को balance करने के लिए उन timings का उपयोग करते हैं। Include-pattern CI shards timing key में shard name append करते हैं, जिससे filtered shard timings whole-config timing data को replace किए बिना visible रहते हैं। local timing artifact ignore करने के लिए `OPENCLAW_TEST_PROJECTS_TIMINGS=0` set करें।
- चुनी हुई `plugin-sdk` और `commands` test files अब dedicated light lanes से route होती हैं जो केवल `test/setup.ts` रखती हैं, जबकि runtime-heavy cases अपनी existing lanes पर रहते हैं।
- sibling tests वाली source files wider directory globs पर fall back करने से पहले उस sibling पर map होती हैं। `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, और `src/plugins/contracts` के अंतर्गत helper edits precise dependency path होने पर हर shard को broad-run करने के बजाय importing tests चलाने के लिए local import graph का उपयोग करते हैं।
- `auto-reply` अब तीन dedicated configs (`core`, `top-level`, `reply`) में भी split होता है ताकि reply harness हल्के top-level status/token/helper tests पर dominate न करे।
- Base Vitest config अब repo configs में enabled shared non-isolated runner के साथ `pool: "threads"` और `isolate: false` पर default करता है।
- `pnpm test:channels` `vitest.channels.config.ts` चलाता है।
- `pnpm test:extensions` और `pnpm test extensions` सभी extension/plugin shards चलाते हैं। Heavy channel plugins, browser plugin, और OpenAI dedicated shards के रूप में चलते हैं; अन्य plugin groups batched रहते हैं। एक bundled plugin lane के लिए `pnpm test extensions/<id>` का उपयोग करें।
- `pnpm test:perf:imports`: explicit file/directory targets के लिए scoped lane routing का उपयोग जारी रखते हुए Vitest import-duration + import-breakdown reporting enable करता है।
- `pnpm test:perf:imports:changed`: वही import profiling, लेकिन केवल `origin/main` के बाद बदली गई फ़ाइलों के लिए।
- `pnpm test:perf:changed:bench -- --ref <git-ref>` उसी committed git diff के लिए native root-project run के विरुद्ध routed changed-mode path को benchmark करता है।
- `pnpm test:perf:changed:bench -- --worktree` पहले commit किए बिना current worktree change set को benchmark करता है।
- `pnpm test:perf:profile:main`: Vitest main thread (`.artifacts/vitest-main-profile`) के लिए CPU profile लिखता है।
- `pnpm test:perf:profile:runner`: unit runner (`.artifacts/vitest-runner-profile`) के लिए CPU + heap profiles लिखता है।
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: हर full-suite Vitest leaf config को serially चलाता है और grouped duration data के साथ per-config JSON/log artifacts लिखता है। Test Performance Agent slow-test fixes की कोशिश करने से पहले इसे अपने baseline के रूप में उपयोग करता है।
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: performance-focused change के बाद grouped reports की तुलना करता है।
- `pnpm test:docker:timings <summary.json>` Docker all run के बाद slow Docker lanes inspect करता है; उन्हीं artifacts से सस्ते targeted rerun commands print करने के लिए `pnpm test:docker:rerun <run-id|summary.json|failures.json>` का उपयोग करें।
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` या `pnpm test:gateway` के माध्यम से opt-in।
- `pnpm test:e2e`: repo E2E aggregate चलाता है: gateway end-to-end smoke tests और Control UI mocked browser E2E lane।
- `pnpm test:e2e:gateway`: gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing) चलाता है। `vitest.e2e.config.ts` में adaptive workers के साथ `threads` + `isolate: false` पर default करता है; `OPENCLAW_E2E_WORKERS=<n>` से tune करें और verbose logs के लिए `OPENCLAW_E2E_VERBOSE=1` set करें।
- `pnpm test:live`: provider live tests (minimax/zai) चलाता है। unskip करने के लिए API keys और `LIVE=1` (या provider-specific `*_LIVE_TEST=1`) चाहिए।
- `pnpm test:docker:all`: साझा लाइव-टेस्ट इमेज बनाता है, OpenClaw को npm tarball के रूप में एक बार पैक करता है, एक bare Node/Git runner image और एक functional image बनाता/फिर से उपयोग करता है जो उस tarball को `/app` में इंस्टॉल करती है, फिर weighted scheduler के माध्यम से `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ Docker smoke lanes चलाता है। bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) installer/update/plugin-dependency lanes के लिए उपयोग होती है; वे lanes कॉपी किए गए repo sources का उपयोग करने के बजाय prebuilt tarball mount करती हैं। functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) सामान्य built-app functionality lanes के लिए उपयोग होती है। `scripts/package-openclaw-for-docker.mjs` एकमात्र local/CI package packer है और Docker द्वारा उपयोग से पहले tarball और `dist/postinstall-inventory.json` को validate करता है। Docker lane definitions `scripts/lib/docker-e2e-scenarios.mjs` में रहती हैं; planner logic `scripts/lib/docker-e2e-plan.mjs` में रहती है; `scripts/test-docker-all.mjs` चुने गए plan को execute करता है। `node scripts/test-docker-all.mjs --plan-json` selected lanes, image kinds, package/live-image needs, state scenarios, और credential checks के लिए scheduler-owned CI plan emit करता है, बिना Docker build या run किए। `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` process slots नियंत्रित करता है और default 10 है; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` provider-sensitive tail pool नियंत्रित करता है और default 10 है। Heavy lane caps default रूप से `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, और `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` हैं; provider caps default रूप से `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, और `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` के माध्यम से प्रति provider एक heavy lane हैं। बड़े hosts के लिए `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` या `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` उपयोग करें। यदि low-parallelism host पर कोई lane effective weight या resource cap से अधिक है, तो वह फिर भी empty pool से शुरू हो सकती है और capacity release होने तक अकेले चलेगी। local Docker daemon create storms से बचने के लिए lane starts default रूप से 2 seconds stagger किए जाते हैं; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` से override करें। runner default रूप से Docker preflight करता है, stale OpenClaw E2E containers साफ करता है, हर 30 seconds में active-lane status emit करता है, compatible lanes के बीच provider CLI tool caches share करता है, transient live-provider failures को default रूप से एक बार retry करता है (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), और बाद के runs पर longest-first ordering के लिए lane timings को `.artifacts/docker-tests/lane-timings.json` में store करता है। Docker चलाए बिना lane manifest print करने के लिए `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, status output tune करने के लिए `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, या timing reuse disable करने के लिए `OPENCLAW_DOCKER_ALL_TIMINGS=0` उपयोग करें। केवल deterministic/local lanes के लिए `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` या केवल live-provider lanes के लिए `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` उपयोग करें; package aliases `pnpm test:docker:local:all` और `pnpm test:docker:live:all` हैं। Live-only mode main और tail live lanes को एक longest-first pool में merge करता है ताकि provider buckets Claude, Codex, और Gemini काम को साथ pack कर सकें। runner पहली failure के बाद नए pooled lanes schedule करना बंद कर देता है, जब तक `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` set न हो, और हर lane के पास 120-minute fallback timeout है जिसे `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` से override किया जा सकता है; selected live/tail lanes tighter per-lane caps उपयोग करती हैं। CLI backend Docker setup commands का अपना timeout `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180) के माध्यम से होता है। Per-lane logs, `summary.json`, `failures.json`, और phase timings `.artifacts/docker-tests/<run-id>/` के तहत लिखे जाते हैं; slow lanes inspect करने के लिए `pnpm test:docker:timings <summary.json>` और cheap targeted rerun commands print करने के लिए `pnpm test:docker:rerun <run-id|summary.json|failures.json>` उपयोग करें।
- `pnpm test:docker:browser-cdp-snapshot`: Chromium-backed source E2E container बनाता है, raw CDP और isolated Gateway start करता है, `browser doctor --deep` चलाता है, और verify करता है कि CDP role snapshots में link URLs, cursor-promoted clickables, iframe refs, और frame metadata शामिल हैं।
- `pnpm test:docker:skill-install`: packed OpenClaw tarball को bare Docker runner में install करता है, `skills.install.allowUploadedArchives` disable करता है, live ClawHub search से current skill slug resolve करता है, उसे `openclaw skills install` के माध्यम से install करता है, और `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, और `skills info --json` verify करता है।
- CLI backend live Docker probes को focused lanes के रूप में चलाया जा सकता है, उदाहरण के लिए `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume`, या `pnpm test:docker:live-cli-backend:claude:mcp`। Gemini के matching `:resume` और `:mcp` aliases हैं।
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI start करता है, Open WebUI के माध्यम से sign in करता है, `/api/models` check करता है, फिर `/api/chat/completions` के माध्यम से real proxied chat चलाता है। usable live model key चाहिए, external Open WebUI image pull करता है, और normal unit/e2e suites की तरह CI-stable होने की अपेक्षा नहीं है।
- `pnpm test:docker:mcp-channels`: seeded Gateway container और दूसरा client container start करता है जो `openclaw mcp serve` spawn करता है, फिर routed conversation discovery, transcript reads, attachment metadata, live event queue behavior, outbound send routing, और real stdio bridge पर Claude-style channel + permission notifications verify करता है। Claude notification assertion raw stdio MCP frames को सीधे read करता है ताकि smoke वही दिखाए जो bridge वास्तव में emit करता है।
- `pnpm test:docker:upgrade-survivor`: packed OpenClaw tarball को dirty old-user fixture के ऊपर install करता है, live provider या channel keys के बिना package update और non-interactive doctor चलाता है, फिर loopback Gateway start करता है और check करता है कि agents, channel config, plugin allowlists, workspace/session files, stale legacy plugin dependency state, startup, और RPC status survive करते हैं।
- `pnpm test:docker:published-upgrade-survivor`: default रूप से `openclaw@latest` install करता है, live provider या channel keys के बिना realistic existing-user files seed करता है, उस baseline को baked `openclaw config set` command recipe से configure करता है, उस published install को packed OpenClaw tarball पर update करता है, non-interactive doctor चलाता है, `.artifacts/upgrade-survivor/summary.json` लिखता है, फिर loopback Gateway start करता है और check करता है कि configured intents, workspace/session files, stale plugin config और legacy dependency state, startup, `/healthz`, `/readyz`, और RPC status survive या cleanly repair करते हैं। एक baseline override करने के लिए `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, exact local matrix expand करने के लिए `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` जैसे `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, या scenario fixtures add करने के लिए `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` उपयोग करें; reported-issues set में upgrade के दौरान configured external OpenClaw plugins अपने आप install होते हैं यह verify करने के लिए `configured-plugin-installs` और source-only plugin shadows को startup तोड़ने से रोकने के लिए `stale-source-plugin-shadow` शामिल हैं। Package Acceptance इन्हें `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, और `published_upgrade_survivor_scenarios` के रूप में expose करता है, और Docker lanes को exact package specs सौंपने से पहले `last-stable-4` या `all-since-2026.4.23` जैसे meta baseline tokens resolve करता है।
- `pnpm test:docker:update-migration`: cleanup-heavy `plugin-deps-cleanup` scenario में published-upgrade survivor harness चलाता है, default रूप से `openclaw@2026.4.23` से शुरू करता है। अलग `Update Migration` workflow इस lane को `baselines=all-since-2026.4.23` के साथ expand करता है ताकि `.23` के बाद से हर stable published package candidate पर update हो और Full Release CI के बाहर configured-plugin dependency cleanup prove करे।
- `pnpm test:docker:plugins`: local path, `file:`, hoisted dependencies वाले npm registry packages, git moving refs, ClawHub fixtures, marketplace updates, और Claude-bundle enable/inspect के लिए install/update smoke चलाता है।

## स्थानीय PR गेट

स्थानीय PR लैंड/गेट जांचों के लिए, चलाएं:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

यदि `pnpm test` लोडेड होस्ट पर फ्लेक होता है, तो इसे regression मानने से पहले एक बार फिर चलाएं, फिर `pnpm test <path/to/test>` से अलग करें। memory-constrained होस्ट के लिए, उपयोग करें:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## मॉडल latency bench (स्थानीय keys)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

उपयोग:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- वैकल्पिक env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- default prompt: "एक ही शब्द में उत्तर दें: ok. कोई विराम चिह्न या अतिरिक्त text नहीं."

पिछला रन (2025-12-31, 20 रन):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## CLI startup bench

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

उपयोग:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: दोनों presets

Output में प्रत्येक command के लिए `sampleCount`, avg, p50, p95, min/max, exit-code/signal distribution, और max RSS summaries शामिल हैं। वैकल्पिक `--cpu-prof-dir` / `--heap-prof-dir` प्रत्येक run के लिए V8 profiles लिखता है ताकि timing और profile capture एक ही harness का उपयोग करें।

Saved output conventions:

- `pnpm test:startup:bench:smoke` targeted smoke artifact को `.artifacts/cli-startup-bench-smoke.json` पर लिखता है
- `pnpm test:startup:bench:save` `runs=5` और `warmup=1` का उपयोग करके full-suite artifact को `.artifacts/cli-startup-bench-all.json` पर लिखता है
- `pnpm test:startup:bench:update` `runs=5` और `warmup=1` का उपयोग करके checked-in baseline fixture को `test/fixtures/cli-startup-bench.json` पर refresh करता है

Checked-in fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` से refresh करें
- fixture के विरुद्ध current results की तुलना `pnpm test:startup:bench:check` से करें

## Gateway startup bench

Script: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

benchmark default रूप से built CLI entry `dist/entry.js` पर होता है; package-script commands का उपयोग करने से पहले
`pnpm build` चलाएं। इसके बजाय source
runner को मापने के लिए, `--entry scripts/run-node.mjs` पास करें और उन results को
built-entry baselines से अलग रखें।

उपयोग:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

Case ids:

- `default`: सामान्य Gateway startup.
- `skipChannels`: channel startup छोड़े जाने के साथ Gateway startup.
- `oneInternalHook`: एक configured internal hook.
- `allInternalHooks`: सभी internal hooks.
- `fiftyPlugins`: 50 manifest plugins.
- `fiftyStartupLazyPlugins`: 50 startup-lazy manifest plugins.

Output में first process output, `/healthz`, `/readyz`, HTTP listen log time,
Gateway ready log time, CPU time, CPU core ratio, max RSS, heap, startup trace
metrics, event-loop delay, और plugin lookup-table detail metrics शामिल हैं। script
child Gateway environment में `OPENCLAW_GATEWAY_STARTUP_TRACE=1` सक्षम करता है।

`/healthz` को liveness के रूप में पढ़ें: HTTP server उत्तर दे सकता है। `/readyz` को
usable readiness के रूप में पढ़ें: startup plugin sidecars, channels, और ready-critical
post-attach work settle हो चुके हैं। Gateway startup hooks asynchronously dispatch होते हैं
और readiness guarantee का हिस्सा नहीं हैं। Ready log time
Gateway का internal ready log timestamp है; यह process-side
attribution के लिए उपयोगी है लेकिन external `/readyz` probe का substitute नहीं है।

changes की तुलना करते समय JSON output या `--output` का उपयोग करें। `--cpu-prof-dir` का उपयोग केवल
तब करें जब trace output import, compile, या CPU-bound work की ओर इशारा करे जिसे
सिर्फ phase timings से समझाया नहीं जा सकता। source-runner results की तुलना
built `dist/entry.js` results से same baseline के रूप में न करें।

## Gateway restart bench

Script: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

restart benchmark केवल macOS और Linux पर supported है। यह
in-process restarts के लिए SIGUSR1 का उपयोग करता है और Windows पर तुरंत fail हो जाता है।

benchmark default रूप से built CLI entry `dist/entry.js` पर होता है; package-script commands का उपयोग करने से पहले
`pnpm build` चलाएं। इसके बजाय source
runner को मापने के लिए, `--entry scripts/run-node.mjs` पास करें और उन results को
built-entry baselines से अलग रखें।

उपयोग:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

Case ids:

- `skipChannels`: channels skipped के साथ restart.
- `skipChannelsAcpxProbe`: channels skipped और ACPX startup probe on के साथ restart.
- `skipChannelsNoAcpxProbe`: channels skipped और ACPX startup probe off के साथ restart.
- `default`: सामान्य restart.
- `fiftyPlugins`: 50 manifest plugins के साथ restart.

Output में next `/healthz`, next `/readyz`, downtime, restart ready timing,
CPU, RSS, replacement process के लिए startup trace metrics, और signal handling, active-work drain, close phases, next start, ready
timing, और memory snapshots के लिए restart trace
metrics शामिल हैं। script
child Gateway environment में `OPENCLAW_GATEWAY_STARTUP_TRACE=1` और `OPENCLAW_GATEWAY_RESTART_TRACE=1` सक्षम करता है।

इस benchmark का उपयोग तब करें जब कोई change restart signaling, close handlers,
startup-after-restart, sidecar shutdown, service handoff, या restart के बाद readiness को touch करता हो।
Gateway mechanics को channel
startup से अलग करते समय `skipChannels` से शुरू करें। `default` या plugin-heavy cases का उपयोग केवल तब करें जब narrow case
restart path को समझा दे।

Trace metrics attribution hints हैं, verdicts नहीं। restart change को
multiple samples, matching owner span, `/healthz` और `/readyz`
behavior, और user-visible restart contract से judge किया जाना चाहिए।

## Onboarding E2E (Docker)

Docker वैकल्पिक है; यह केवल containerized onboarding smoke tests के लिए आवश्यक है।

clean Linux container में full cold-start flow:

```bash
scripts/e2e/onboard-docker.sh
```

यह script pseudo-tty के माध्यम से interactive wizard चलाता है, config/workspace/session files verify करता है, फिर gateway शुरू करता है और `openclaw health` चलाता है।

## QR import smoke (Docker)

सुनिश्चित करता है कि maintained QR runtime helper supported Docker Node runtimes (Node 24 default, Node 22 compatible) के तहत load होता है:

```bash
pnpm test:docker:qr
```

## संबंधित

- [Testing](/hi/help/testing)
- [Testing live](/hi/help/testing-live)
- [Testing updates and plugins](/hi/help/testing-updates-plugins)
