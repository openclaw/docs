---
read_when:
    - आपको यह समझना होगा कि CI job क्यों चला या क्यों नहीं चला
    - आप विफल हो रही GitHub Actions जाँच को डीबग कर रहे हैं
    - आप रिलीज़ सत्यापन रन या पुनः रन का समन्वय कर रहे हैं
    - आप ClawSweeper डिस्पैच या GitHub गतिविधि अग्रेषण बदल रहे हैं
summary: CI जॉब ग्राफ़, स्कोप गेट, रिलीज़ अम्ब्रेला, और स्थानीय कमांड समकक्ष
title: CI पाइपलाइन
x-i18n:
    generated_at: "2026-07-04T18:00:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI `main` पर हर push और हर pull request पर चलता है। canonical
`main` pushes पहले 90-सेकंड की hosted-runner admission window से गुजरते हैं।
मौजूदा `CI` concurrency group उस प्रतीक्षा कर रहे run को तब रद्द कर देता है जब कोई नया
commit आता है, इसलिए क्रमिक merges में से हर एक पूरा Blacksmith
matrix register नहीं करता। Pull requests और manual dispatches प्रतीक्षा छोड़ देते हैं। फिर `preflight` job
diff को classify करता है और जब केवल असंबंधित
क्षेत्र बदले हों तो महंगे lanes बंद कर देता है। Manual `workflow_dispatch` runs जानबूझकर smart
scoping को bypass करते हैं और release candidates तथा व्यापक
validation के लिए पूरा graph fan out करते हैं। Android lanes `include_android` के जरिए opt-in रहते हैं। Release-only
Plugin coverage अलग [`Plugin Prerelease`](#plugin-prerelease)
workflow में रहता है और केवल [`Full Release Validation`](#full-release-validation)
या explicit manual dispatch से चलता है।

## Pipeline अवलोकन

| Job                                | उद्देश्य                                                                                                   | कब चलता है                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs-only changes, changed scopes, changed extensions का पता लगाना, और CI manifest बनाना                   | non-draft pushes और PRs पर हमेशा                  |
| `runner-admission`                 | Blacksmith work register होने से पहले canonical `main` pushes के लिए hosted 90-सेकंड debounce                | हर CI run; sleep केवल canonical `main` pushes पर |
| `security-fast`                    | private key detection, `zizmor` के जरिए changed-workflow audit, और production lockfile audit                 | non-draft pushes और PRs पर हमेशा                  |
| `check-dependencies`               | Production Knip dependency-only pass और unused-file allowlist guard                                 | Node-relevant changes                               |
| `build-artifacts`                  | `dist/`, Control UI, built-CLI smoke checks, embedded built-artifact checks, और reusable artifacts build करना | Node-relevant changes                               |
| `checks-fast-core`                 | fast Linux correctness lanes जैसे bundled, protocol, QA Smoke CI, और CI-routing checks                | Node-relevant changes                               |
| `checks-fast-contracts-plugins-*`  | दो sharded Plugin contract checks                                                                        | Node-relevant changes                               |
| `checks-fast-contracts-channels-*` | दो sharded channel contract checks                                                                       | Node-relevant changes                               |
| `checks-node-core-*`               | Core Node test shards, channel, bundled, contract, और extension lanes को छोड़कर                          | Node-relevant changes                               |
| `check-*`                          | Sharded main local gate equivalent: prod types, lint, guards, test types, और strict smoke                | Node-relevant changes                               |
| `check-additional-*`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary, और runtime topology     | Node-relevant changes                               |
| `checks-node-compat-node22`        | Node 22 compatibility build और smoke lane                                                                | releases के लिए manual CI dispatch                     |
| `check-docs`                       | Docs formatting, lint, और broken-link checks                                                             | Docs changed                                        |
| `skills-python`                    | Python-backed skills के लिए Ruff + pytest                                                                    | Python-skill-relevant changes                       |
| `checks-windows`                   | Windows-specific process/path tests और shared runtime import specifier regressions                      | Windows-relevant changes                            |
| `macos-node`                       | shared built artifacts का उपयोग करने वाला macOS TypeScript test lane                                               | macOS-relevant changes                              |
| `macos-swift`                      | macOS app के लिए Swift lint, build, और tests                                                            | macOS-relevant changes                              |
| `ios-build`                        | Xcode project generation और iOS app simulator build                                                 | iOS app, shared app kit, या Swabble changes         |
| `android`                          | दोनों flavors के लिए Android unit tests और एक debug APK build                                              | Android-relevant changes                            |
| `test-performance-agent`           | trusted activity के बाद daily Codex slow-test optimization                                                 | Main CI success या manual dispatch                  |
| `openclaw-performance`             | mock-provider, deep-profile, और GPT 5.5 live lanes के साथ daily/on-demand Kova runtime performance reports | Scheduled और manual dispatch                       |

## Fail-fast क्रम

1. `runner-admission` केवल canonical `main` pushes के लिए प्रतीक्षा करता है; नया push Blacksmith registration से पहले run को रद्द कर देता है।
2. `preflight` तय करता है कि कौन से lanes मौजूद होंगे। `docs-scope` और `changed-scope` logic इस job के अंदर के steps हैं, standalone jobs नहीं।
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, और `skills-python` भारी artifact और platform matrix jobs की प्रतीक्षा किए बिना जल्दी fail होते हैं।
4. `build-artifacts` fast Linux lanes के साथ overlap करता है ताकि downstream consumers shared build ready होते ही शुरू हो सकें।
5. इसके बाद भारी platform और runtime lanes fan out करते हैं: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, और `android`।

जब उसी PR या `main` ref पर नया push आता है तो GitHub superseded jobs को `cancelled` mark कर सकता है। जब तक उसी ref का सबसे नया run भी fail न हो रहा हो, इसे CI noise मानें। Matrix jobs `fail-fast: false` का उपयोग करते हैं, और `build-artifacts` embedded channel, core-support-boundary, और gateway-watch failures को छोटे verifier jobs queue करने के बजाय सीधे report करता है। automatic CI concurrency key versioned (`CI-v7-*`) है ताकि पुराने queue group में GitHub-side zombie नए main runs को अनिश्चित समय तक block न कर सके। Manual full-suite runs `CI-manual-v1-*` का उपयोग करते हैं और in-progress runs को cancel नहीं करते।

GitHub Actions से wall time, queue time, सबसे धीमे jobs, failures, और `pnpm-store-warmup` fanout barrier summarize करने के लिए `pnpm ci:timings`, `pnpm ci:timings:recent`, या `node scripts/ci-run-timings.mjs <run-id>` का उपयोग करें। CI वही run summary `ci-timings-summary` artifact के रूप में भी upload करता है। Build timing के लिए, `build-artifacts` job का `Build dist` step देखें: `pnpm build:ci-artifacts` `[build-all] phase timings:` print करता है और इसमें `ui:build` शामिल होता है; job `startup-memory` artifact भी upload करता है।

Pull request runs के लिए, terminal timing-summary job `GH_TOKEN` को `gh run view` में pass करने से पहले trusted base revision से helper चलाता है। इससे tokened query branch-controlled code से बाहर रहती है, फिर भी pull request के current CI run को summarize करती है।

## PR context और evidence

External contributor PRs
`.github/workflows/real-behavior-proof.yml` से PR context और evidence gate चलाते हैं। Workflow trusted
base commit checkout करता है और केवल PR body evaluate करता है; यह
contributor branch से code execute नहीं करता।

Gate उन PR authors पर लागू होता है जो repository owners, members,
collaborators, या bots नहीं हैं। यह तब pass होता है जब PR body में authored
`What Problem This Solves` और `Evidence` sections हों। Evidence एक focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log, या artifact link हो सकता है। Body intent और उपयोगी validation देती है;
reviewers correctness assess करने के लिए code, tests, और CI inspect करते हैं।

जब check fail हो, तो दूसरा code commit push करने के बजाय PR body update करें।

## Scope और routing

Scope logic `scripts/ci-changed-scope.mjs` में रहता है और `src/scripts/ci-changed-scope.test.ts` में unit tests से covered है। Manual dispatch changed-scope detection छोड़ देता है और preflight manifest को ऐसे act कराता है मानो हर scoped area changed हो।

- **CI workflow edits** Node CI graph और workflow linting validate करते हैं, लेकिन अपने आप Windows, iOS, Android, या macOS native builds force नहीं करते; वे platform lanes platform source changes तक scoped रहते हैं।
- **Workflow Sanity** सभी workflow YAML files पर `actionlint`, `zizmor`, composite-action interpolation guard, और conflict-marker guard चलाता है। PR-scoped `security-fast` job भी changed workflow files पर `zizmor` चलाता है ताकि workflow security findings main CI graph में जल्दी fail हों।
- **Docs on `main` pushes** standalone `Docs` workflow द्वारा उसी ClawHub docs mirror के साथ check किए जाते हैं जिसका CI उपयोग करता है, इसलिए mixed code+docs pushes CI `check-docs` shard भी queue नहीं करते। Pull requests और manual CI में docs changed होने पर CI से `check-docs` अब भी चलता है।
- **TUI PTY** TUI changes के लिए `checks-node-core-runtime-tui-pty` Linux Node shard में चलता है। Shard `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` के साथ `test/vitest/vitest.tui-pty.config.ts` चलाता है, इसलिए यह deterministic `TuiBackend` fixture lane और धीमे `tui --local` smoke, जो केवल external model endpoint mock करता है, दोनों cover करता है।
- **CI routing-only edits, selected cheap core-test fixture edits, और narrow plugin contract helper/test-routing edits** fast Node-only manifest path का उपयोग करते हैं: `preflight`, security, और एक single `checks-fast-core` task। जब change routing या helper surfaces तक limited हो जिन्हें fast task directly exercise करता है, तो वह path build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards, और additional guard matrices skip करता है।
- **Windows Node checks** Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config, और उस lane को execute करने वाले CI workflow surfaces तक scoped हैं; unrelated source, Plugin, install-smoke, और test-only changes Linux Node lanes पर रहते हैं।

सबसे धीमे Node टेस्ट परिवारों को विभाजित या संतुलित किया गया है ताकि प्रत्येक जॉब रनर को ज़रूरत से ज़्यादा आरक्षित किए बिना छोटी रहे: Plugin contracts और channel contracts दोनों मानक GitHub रनर फ़ॉलबैक के साथ दो भारित Blacksmith-समर्थित shards के रूप में चलते हैं, core unit fast/support lanes अलग से चलते हैं, core runtime infra को state, process/config, shared, और तीन cron domain shards के बीच विभाजित किया गया है, auto-reply संतुलित workers के रूप में चलता है (reply subtree को agent-runner, dispatch, और commands/state-routing shards में विभाजित करके), और agentic gateway/server configs निर्मित artifacts की प्रतीक्षा करने के बजाय chat/auth/model/http-plugin/runtime/startup lanes में विभाजित हैं। सामान्य CI फिर केवल isolated infra include-pattern shards को अधिकतम 64 test files के deterministic bundles में पैक करता है, जिससे non-isolated command/cron, stateful agents-core, या gateway/server suites को merge किए बिना Node matrix कम होती है; भारी fixed suites 8 vCPU पर रहते हैं जबकि bundled और कम-भार वाली lanes 4 vCPU का उपयोग करती हैं। canonical repository पर pull requests एक अतिरिक्त compact admission plan का उपयोग करते हैं: वही per-config groups मौजूदा 34-job Linux Node plan के अंदर isolated subprocesses में चलते हैं, इसलिए एक single PR पूरी 70-plus-job Node matrix पंजीकृत नहीं करता। `main` pushes, manual dispatches, और release gates पूरी matrix बनाए रखते हैं। Broad browser, QA, media, और miscellaneous Plugin tests shared plugin catch-all के बजाय अपने dedicated Vitest configs का उपयोग करते हैं। Include-pattern shards CI shard name का उपयोग करके timing entries रिकॉर्ड करते हैं, ताकि `.artifacts/vitest-shard-timings.json` पूरे config को filtered shard से अलग कर सके। `check-additional-*` package-boundary compile/canary work को साथ रखता है और runtime topology architecture को gateway watch coverage से अलग करता है; boundary guard list को एक prompt-heavy shard और बाकी guard stripes के लिए एक combined shard में stripe किया गया है, जिनमें से हर एक चुने गए independent guards को concurrent चलाता है और per-check timings प्रिंट करता है। महंगा Codex happy-path prompt snapshot drift check manual CI और केवल prompt-affecting changes के लिए अपने अलग additional job के रूप में चलता है, इसलिए सामान्य असंबंधित Node changes cold prompt snapshot generation के पीछे प्रतीक्षा नहीं करते और boundary shards संतुलित रहते हैं जबकि prompt drift अभी भी उसे पैदा करने वाले PR से pinned रहता है; वही flag built-artifact core support-boundary shard के अंदर prompt snapshot Vitest generation को skip करता है। Gateway watch, channel tests, और core support-boundary shard `build-artifacts` के अंदर concurrent चलते हैं, जब `dist/` और `dist-runtime/` पहले से built हो चुके होते हैं।

admit होने के बाद, canonical Linux CI अधिकतम 24 concurrent Node test jobs और
छोटी fast/check lanes के लिए 12 की अनुमति देता है; Windows और Android दो पर रहते हैं क्योंकि
वे runner pools अधिक सीमित हैं।

compact PR plan मौजूदा suite के लिए 18 Node jobs emit करता है: whole-config
groups isolated subprocesses में 120-minute batch timeout के साथ batched होते हैं,
जबकि include-pattern groups वही bounded job budget साझा करते हैं।

Android CI `testPlayDebugUnitTest` और `testThirdPartyDebugUnitTest` दोनों चलाता है और फिर Play debug APK बनाता है। third-party flavor का कोई अलग source set या manifest नहीं है; उसकी unit-test lane अभी भी SMS/call-log BuildConfig flags के साथ flavor compile करती है, जबकि हर Android-relevant push पर duplicate debug APK packaging job से बचती है।

`check-dependencies` shard `pnpm deadcode:dependencies` (latest Knip version पर pinned production Knip dependency-only pass, जिसमें `dlx` install के लिए pnpm की minimum release age disabled है) और `pnpm deadcode:unused-files` चलाता है, जो Knip की production unused-file findings की तुलना `scripts/deadcode-unused-files.allowlist.mjs` से करता है। unused-file guard तब fail होता है जब कोई PR नया unreviewed unused file जोड़ता है या stale allowlist entry छोड़ता है, जबकि intentional dynamic Plugin, generated, build, live-test, और package bridge surfaces को सुरक्षित रखता है जिन्हें Knip statically resolve नहीं कर सकता।

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml` OpenClaw repository activity से ClawSweeper में target-side bridge है। यह untrusted pull request code को check out या execute नहीं करता। workflow `CLAWSWEEPER_APP_PRIVATE_KEY` से GitHub App token बनाता है, फिर compact `repository_dispatch` payloads को `openclaw/clawsweeper` पर dispatch करता है।

workflow में चार lanes हैं:

- exact issue और pull request review requests के लिए `clawsweeper_item`;
- issue comments में explicit ClawSweeper commands के लिए `clawsweeper_comment`;
- `main` pushes पर commit-level review requests के लिए `clawsweeper_commit_review`;
- सामान्य GitHub activity के लिए `github_activity` जिसे ClawSweeper agent inspect कर सकता है।

`github_activity` lane केवल normalized metadata forward करती है: event type, action, actor, repository, item number, URL, title, state, और मौजूद होने पर comments या reviews के short excerpts। यह जानबूझकर पूरा webhook body forward करने से बचती है। `openclaw/clawsweeper` में receiving workflow `.github/workflows/github-activity.yml` है, जो normalized event को ClawSweeper agent के लिए OpenClaw Gateway hook पर post करता है।

General activity observation है, delivery-by-default नहीं। ClawSweeper agent अपने prompt में Discord target प्राप्त करता है और उसे `#clawsweeper` पर केवल तब post करना चाहिए जब event surprising, actionable, risky, या operationally useful हो। Routine opens, edits, bot churn, duplicate webhook noise, और normal review traffic का परिणाम `NO_REPLY` होना चाहिए।

इस पूरे path में GitHub titles, comments, bodies, review text, branch names, और commit messages को untrusted data मानें। वे summarization और triage के input हैं, workflow या agent runtime के instructions नहीं।

## Manual dispatches

Manual CI dispatches सामान्य CI जैसा ही job graph चलाते हैं लेकिन हर non-Android scoped lane को force on करते हैं: Linux Node shards, bundled-plugin shards, Plugin और channel contract shards, Node 22 compatibility, `check-*`, `check-additional-*`, built-artifact smoke checks, docs checks, Python skills, Windows, macOS, iOS build, और Control UI i18n। Standalone manual CI dispatches Android को केवल `include_android=true` के साथ चलाते हैं; full release umbrella `include_android=true` pass करके Android enable करता है। Plugin prerelease static checks, release-only `agentic-plugins` shard, full extension batch sweep, और Plugin prerelease Docker lanes CI से excluded हैं। Docker prerelease suite केवल तब चलता है जब `Full Release Validation` release-validation gate enabled करके अलग `Plugin Prerelease` workflow dispatch करता है।

Manual runs एक unique concurrency group का उपयोग करते हैं ताकि release-candidate full suite उसी ref पर किसी दूसरे push या PR run से cancel न हो। optional `target_ref` input trusted caller को selected dispatch ref से workflow file का उपयोग करते हुए branch, tag, या full commit SHA के विरुद्ध वह graph चलाने देता है।

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

monthly npm-only extended-stable path exception है: exact
`extended-stable/YYYY.M.33` branch से `OpenClaw NPM
Release` preflight और `Full Release Validation` दोनों dispatch करें, उनके run IDs सुरक्षित रखें, और दोनों IDs को
direct npm publish run में pass करें। commands, exact identity requirements, registry readback, और selector
repair procedure के लिए [Monthly npm-only extended-stable
publication](/hi/reference/RELEASING#monthly-npm-only-extended-stable-publication) देखें। यह path Plugin, macOS, Windows, GitHub
Release, private dist-tag, या अन्य platform publication dispatch नहीं करता।

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Manual CI dispatch और non-canonical repository fallbacks, CodeQL JavaScript/actions quality scans, workflow-sanity, labeler, auto-response, CI के बाहर docs workflows, और install-smoke preflight ताकि Blacksmith matrix पहले queue हो सके                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lower-weight extension shards, QA Smoke CI को छोड़कर `checks-fast-core`, Plugin/channel contract shards, अधिकांश bundled/lower-weight Linux Node shards, `check-guards`, `check-prod-types`, `check-test-types`, selected `check-additional-*` shards, और `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Retained heavy Linux Node suites, boundary/extension-heavy `check-additional-*` shards, और `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, CI और Testbox में `build-artifacts`, `check-lint` (इतना CPU-sensitive कि 8 vCPU ने जितना बचाया उससे अधिक cost की); install-smoke Docker builds (32-vCPU queue time ने जितना बचाया उससे अधिक cost की)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` पर `macos-node`; forks `macos-15` पर fall back करते हैं                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` पर `macos-swift` और `ios-build`; forks `macos-26` पर fall back करते हैं                                                                                                                                                                                                                     |

## Runner registration budget

OpenClaw का मौजूदा GitHub runner-registration bucket `ghx api rate_limit` में प्रति 5 minutes 10,000 self-hosted
runner registrations report करता है। हर tuning pass से पहले
`actions_runner_registration` फिर से check करें क्योंकि GitHub इस bucket को बदल सकता है। यह limit
`openclaw` organization में सभी Blacksmith runner registrations द्वारा shared है, इसलिए एक और Blacksmith installation जोड़ने से
नया bucket नहीं जुड़ता।

burst control के लिए Blacksmith labels को scarce resource मानें। जो jobs
केवल route, notify, summarize, select shards, या short CodeQL scans चलाते हैं उन्हें
GitHub-hosted runners पर रहना चाहिए, जब तक उनके पास measured Blacksmith-specific
needs न हों। किसी भी new Blacksmith matrix, बड़े `max-parallel`, या high-frequency
workflow को अपना worst-case registration count दिखाना चाहिए और org-level
target को live bucket के लगभग 60% से नीचे रखना चाहिए। मौजूदा 10,000-registration
bucket के साथ, इसका मतलब 6,000-registration operating target है, जिससे
concurrent repositories, retries, और burst overlap के लिए headroom बचती है।

Canonical-repo CI normal push और pull-request runs के लिए Blacksmith को default runner path बनाए रखता है। `workflow_dispatch` और non-canonical repository runs GitHub-hosted runners का उपयोग करते हैं, लेकिन normal canonical runs currently Blacksmith queue health probe नहीं करते या Blacksmith unavailable होने पर automatically GitHub-hosted labels पर fall back नहीं करते।

## स्थानीय समकक्ष

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw प्रदर्शन

`OpenClaw Performance` उत्पाद/रनटाइम प्रदर्शन वर्कफ़्लो है। यह `main` पर प्रतिदिन चलता है और मैन्युअल रूप से डिस्पैच किया जा सकता है:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

मैन्युअल डिस्पैच सामान्यतः वर्कफ़्लो ref को बेंचमार्क करता है। वर्तमान वर्कफ़्लो कार्यान्वयन के साथ किसी रिलीज़ टैग या किसी दूसरी ब्रांच को बेंचमार्क करने के लिए `target_ref` सेट करें। प्रकाशित रिपोर्ट पथ और नवीनतम पॉइंटर परीक्षण किए गए ref के आधार पर कुंजीकृत होते हैं, और हर `index.md` परीक्षण किए गए ref/SHA, वर्कफ़्लो ref/SHA, Kova ref, प्रोफ़ाइल, लेन auth मोड, मॉडल, दोहराव संख्या, और परिदृश्य फ़िल्टर रिकॉर्ड करता है।

वर्कफ़्लो पिन की गई रिलीज़ से OCM और `openclaw/Kova` से पिन किए गए `kova_ref` इनपुट पर Kova इंस्टॉल करता है, फिर तीन लेन चलाता है:

- `mock-provider`: नियतात्मक नकली OpenAI-संगत auth के साथ स्थानीय-बिल्ड रनटाइम के विरुद्ध Kova डायग्नोस्टिक परिदृश्य।
- `mock-deep-profile`: startup, gateway, और agent-turn हॉटस्पॉट के लिए CPU/heap/trace प्रोफ़ाइलिंग।
- `live-openai-candidate`: वास्तविक OpenAI `openai/gpt-5.5` एजेंट टर्न, जब `OPENAI_API_KEY` उपलब्ध न हो तो छोड़ा जाता है।

mock-provider लेन Kova पास के बाद OpenClaw-नेटिव स्रोत probes भी चलाती है: default, hook, और 50-plugin startup मामलों में gateway boot timing और memory; bundled plugin import RSS, repeated mock-OpenAI `channel-chat-baseline` hello loops, booted gateway के विरुद्ध CLI startup commands, और SQLite state smoke performance probe। जब tested ref के लिए पिछली प्रकाशित mock-provider source report उपलब्ध होती है, तो source summary मौजूदा RSS और heap मानों की तुलना उस baseline से करती है और बड़े RSS बढ़ाव को `watch` के रूप में चिह्नित करती है। source probe Markdown summary रिपोर्ट bundle में `source/index.md` पर रहती है, और raw JSON उसके साथ होता है।

हर लेन GitHub artifacts अपलोड करती है। जब `CLAWGRIT_REPORTS_TOKEN` कॉन्फ़िगर होता है, तो वर्कफ़्लो `report.json`, `report.md`, bundles, `index.md`, और source-probe artifacts को `openclaw/clawgrit-reports` में `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` के अंतर्गत commit भी करता है। वर्तमान tested-ref pointer `openclaw-performance/<tested-ref>/latest-<lane>.json` के रूप में लिखा जाता है।

## पूर्ण रिलीज़ सत्यापन

`Full Release Validation` “रिलीज़ से पहले सब कुछ चलाएँ” के लिए मैन्युअल umbrella वर्कफ़्लो है। यह branch, tag, या पूर्ण commit SHA स्वीकार करता है, उस target के साथ manual `CI` workflow dispatch करता है, release-only plugin/package/static/Docker proof के लिए `Plugin Prerelease` dispatch करता है, और install smoke, package acceptance, cross-OS package checks, QA profile evidence से maturity scorecard rendering, QA Lab parity, Matrix, और Telegram lanes के लिए `OpenClaw Release Checks` dispatch करता है। Stable और full profiles हमेशा exhaustive live/E2E और Docker release-path soak coverage शामिल करते हैं; beta profile `run_release_soak=true` के साथ opt in कर सकती है। canonical package Telegram E2E Package Acceptance के अंदर चलता है, इसलिए full candidate duplicate live poller शुरू नहीं करता। publishing के बाद, release checks, Package Acceptance, Docker, cross-OS, और Telegram में shipped npm package को rebuilding के बिना reuse करने के लिए `release_package_spec` पास करें। focused published-package Telegram rerun के लिए ही `npm_telegram_package_spec` का उपयोग करें। Codex plugin live package lane default रूप से वही selected state उपयोग करती है: published `release_package_spec=openclaw@<tag>` से `codex_plugin_spec=npm:@openclaw/codex@<tag>` निकलता है, जबकि SHA/artifact runs selected ref से `extensions/codex` pack करते हैं। custom plugin sources जैसे `npm:`, `npm-pack:`, या `git:` specs के लिए `codex_plugin_spec` स्पष्ट रूप से सेट करें।

stage matrix, exact workflow job names, profile differences, artifacts, और
focused rerun handles के लिए [पूर्ण रिलीज़ सत्यापन](/hi/reference/full-release-validation) देखें।

`OpenClaw Release Publish` manual mutating release workflow है। release tag मौजूद होने और OpenClaw npm preflight सफल होने के बाद इसे `release/YYYY.M.PATCH` या `main` से dispatch करें। यह `pnpm plugins:sync:check` verify करता है, सभी publishable plugin packages के लिए `Plugin NPM Release` dispatch करता है, उसी release SHA के लिए `Plugin ClawHub Release` dispatch करता है, और केवल उसके बाद saved `preflight_run_id` के साथ `OpenClaw NPM Release` dispatch करता है। Stable publish के लिए exact `windows_node_tag` भी आवश्यक है; workflow Windows source release verify करता है और किसी भी publish child से पहले उसके x64/ARM64 installers की candidate-approved `windows_node_installer_digests` input से तुलना करता है, फिर GitHub release draft publish करने से पहले उन्हीं pinned installer digests और exact companion asset तथा checksum contract को promote और verify करता है।

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

तेज़ी से बदलती branch पर pinned commit proof के लिए
`gh workflow run ... --ref main -f ref=<sha>` के बजाय helper उपयोग करें:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs branches या tags होने चाहिए, raw commit SHAs नहीं। helper target SHA पर temporary `release-ci/<sha>-...` branch push करता है, उस pinned ref से `Full Release Validation` dispatch करता है, verify करता है कि हर child workflow `headSha` target से मेल खाता है, और run पूरा होने पर temporary branch delete करता है। umbrella verifier भी fail करता है अगर कोई child workflow अलग SHA पर चला हो।

`release_profile` release checks में पास की गई live/provider breadth नियंत्रित करता है। manual release workflows default रूप से `stable` होते हैं; `full` का उपयोग केवल तब करें जब आप जानबूझकर broad advisory provider/media matrix चाहते हों। Stable और full release checks हमेशा exhaustive live/E2E और Docker release-path soak चलाते हैं; beta profile `run_release_soak=true` के साथ opt in कर सकती है।

- `minimum` सबसे तेज़ OpenAI/core release-critical lanes रखता है।
- `stable` stable provider/backend set जोड़ता है।
- `full` broad advisory provider/media matrix चलाता है।

umbrella dispatched child run ids record करता है, और अंतिम `Verify full validation` job current child run conclusions दोबारा check करता है तथा हर child run के लिए slowest-job tables append करता है। अगर कोई child workflow rerun होकर green हो जाता है, तो umbrella result और timing summary refresh करने के लिए केवल parent verifier job rerun करें।

recovery के लिए, `Full Release Validation` और `OpenClaw Release Checks` दोनों `rerun_group` स्वीकार करते हैं। release candidate के लिए `all`, केवल normal full CI child के लिए `ci`, केवल plugin prerelease child के लिए `plugin-prerelease`, हर release child के लिए `release-checks`, या narrower group उपयोग करें: umbrella पर `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, या `npm-telegram`। इससे focused fix के बाद failed release box rerun सीमित रहता है। एक failed cross-OS lane के लिए, `rerun_group=cross-os` को `cross_os_suite_filter` के साथ मिलाएँ, उदाहरण के लिए `windows/packaged-upgrade`; लंबे cross-OS commands Heartbeat lines emit करते हैं और packaged-upgrade summaries में per-phase timings शामिल होते हैं। QA release-check lanes advisory हैं, standard runtime tool coverage gate को छोड़कर, जो required OpenClaw dynamic tools के standard tier summary से drift या गायब होने पर block करता है।

`OpenClaw Release Checks` trusted workflow ref का उपयोग करके selected ref को एक बार `release-package-under-test` tarball में resolve करता है, फिर उस artifact को cross-OS checks और Package Acceptance, साथ ही soak coverage चलने पर live/E2E release-path Docker workflow को पास करता है। इससे release boxes में package bytes consistent रहते हैं और same candidate को multiple child jobs में repack करने से बचा जाता है। Codex npm-plugin live lane के लिए, release checks या तो `release_package_spec` से निकला matching published plugin spec पास करते हैं, operator-supplied `codex_plugin_spec` पास करते हैं, या input blank छोड़ते हैं ताकि Docker script selected checkout का Codex plugin pack करे।

`ref=main` और `rerun_group=all` के लिए duplicate `Full Release Validation` runs पुराने umbrella को supersede करते हैं। parent monitor parent cancel होने पर पहले से dispatched किसी भी child workflow को cancel कर देता है, इसलिए newer main validation stale two-hour release-check run के पीछे नहीं बैठता। Release branch/tag validation और focused rerun groups `cancel-in-progress: false` रखते हैं।

## Live और E2E shards

release live/E2E child broad native `pnpm test:live` coverage रखता है, लेकिन उसे एक serial job के बजाय `scripts/test-live-shard.mjs` के माध्यम से named shards के रूप में चलाता है:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- split media audio/video shards और provider-filtered music shards

इससे same file coverage बनी रहती है और slow live provider failures को rerun और diagnose करना आसान हो जाता है। aggregate `native-live-extensions-o-z`, `native-live-extensions-media`, और `native-live-extensions-media-music` shard names manual one-shot reruns के लिए मान्य रहते हैं।

native live media shards `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` में चलते हैं, जिसे `Live Media Runner Image` workflow build करता है। वह image `ffmpeg` और `ffprobe` preinstall करती है; media jobs setup से पहले केवल binaries verify करते हैं। Docker-backed live suites को normal Blacksmith runners पर रखें — container jobs nested Docker tests launch करने की सही जगह नहीं हैं।

Docker-समर्थित लाइव मॉडल/बैकएंड shards हर चयनित commit के लिए अलग साझा `ghcr.io/openclaw/openclaw-live-test:<sha>` image का उपयोग करते हैं। लाइव release workflow उस image को एक बार build और push करता है, फिर Docker live model, provider-sharded gateway, CLI backend, ACP bind, और Codex harness shards `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ चलते हैं। Gateway Docker shards workflow job timeout से कम स्पष्ट script-level `timeout` सीमाएं रखते हैं, ताकि कोई अटका हुआ container या cleanup path पूरे release-check budget को खर्च करने के बजाय तेजी से fail हो। यदि वे shards full source Docker target को स्वतंत्र रूप से फिर से build करते हैं, तो release run गलत तरीके से configured है और duplicate image builds पर wall clock बर्बाद करेगा।

## पैकेज स्वीकृति

जब प्रश्न यह हो कि "क्या यह installable OpenClaw package product के रूप में काम करता है?", तब `Package Acceptance` का उपयोग करें। यह सामान्य CI से अलग है: सामान्य CI source tree को validate करता है, जबकि package acceptance उसी Docker E2E harness के जरिए एक single tarball को validate करता है जिसे users install या update के बाद exercise करते हैं।

### Jobs

1. `resolve_package` `workflow_ref` को check out करता है, एक package candidate resolve करता है, `.artifacts/docker-e2e-package/openclaw-current.tgz` लिखता है, `.artifacts/docker-e2e-package/package-candidate.json` लिखता है, दोनों को `package-under-test` artifact के रूप में upload करता है, और GitHub step summary में source, workflow ref, package ref, version, SHA-256, और profile print करता है।
2. `docker_acceptance` `openclaw-live-and-e2e-checks-reusable.yml` को `ref=workflow_ref` और `package_artifact_name=package-under-test` के साथ call करता है। Reusable workflow उस artifact को download करता है, tarball inventory validate करता है, जरूरत पड़ने पर package-digest Docker images तैयार करता है, और workflow checkout को pack करने के बजाय उस package के विरुद्ध चुनी गई Docker lanes चलाता है। जब कोई profile कई targeted `docker_lanes` चुनता है, reusable workflow package और shared images को एक बार तैयार करता है, फिर उन lanes को unique artifacts के साथ parallel targeted Docker jobs के रूप में fan out करता है।
3. `package_telegram` वैकल्पिक रूप से `NPM Telegram Beta E2E` को call करता है। यह तब चलता है जब `telegram_mode` `none` नहीं होता और जब Package Acceptance ने कोई package resolve किया हो तो वही `package-under-test` artifact install करता है; standalone Telegram dispatch फिर भी published npm spec install कर सकता है।
4. `summary` package resolution, Docker acceptance, या optional Telegram lane fail होने पर workflow को fail करता है।

### Candidate sources

- `source=npm` केवल `openclaw@beta`, `openclaw@latest`, या `openclaw@2026.4.27-beta.2` जैसे किसी exact OpenClaw release version को स्वीकार करता है। Published prerelease/stable acceptance के लिए इसका उपयोग करें।
- `source=ref` किसी trusted `package_ref` branch, tag, या full commit SHA को pack करता है। Resolver OpenClaw branches/tags fetch करता है, verify करता है कि selected commit repository branch history या release tag से reachable है, detached worktree में deps install करता है, और उसे `scripts/package-openclaw-for-docker.mjs` के साथ pack करता है।
- `source=url` public HTTPS `.tgz` download करता है; `package_sha256` आवश्यक है। यह path URL credentials, non-default HTTPS ports, private/internal/special-use hostnames या resolved IPs, और समान public safety policy से बाहर redirects को reject करता है।
- `source=trusted-url` `.github/package-trusted-sources.json` में named trusted-source policy से HTTPS `.tgz` download करता है; `package_sha256` और `trusted_source_id` आवश्यक हैं। इसका उपयोग केवल maintainer-owned enterprise mirrors या private package repositories के लिए करें जिन्हें configured hosts, ports, path prefixes, redirect hosts, या private-network resolution चाहिए। यदि policy bearer auth declare करती है, तो workflow fixed `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret का उपयोग करता है; URL-embedded credentials फिर भी reject किए जाते हैं।
- `source=artifact` `artifact_run_id` और `artifact_name` से एक `.tgz` download करता है; `package_sha256` optional है लेकिन externally shared artifacts के लिए दिया जाना चाहिए।

`workflow_ref` और `package_ref` को अलग रखें। `workflow_ref` trusted workflow/harness code है जो test चलाता है। `package_ref` वह source commit है जिसे `source=ref` होने पर pack किया जाता है। इससे current test harness पुराने trusted source commits को old workflow logic चलाए बिना validate कर सकता है।

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI के साथ full Docker release-path chunks
- `custom` — exact `docker_lanes`; `suite_profile=custom` होने पर आवश्यक

`package` profile offline plugin coverage का उपयोग करता है ताकि published-package validation live ClawHub availability पर gated न हो। Optional Telegram lane `NPM Telegram Beta E2E` में `package-under-test` artifact को reuse करती है, और published npm spec path standalone dispatches के लिए रखा जाता है।

Dedicated update और plugin testing policy, जिसमें local commands,
Docker lanes, Package Acceptance inputs, release defaults, और failure triage शामिल हैं,
के लिए [Testing updates and plugins](/hi/help/testing-updates-plugins) देखें।

Release checks Package Acceptance को `source=artifact`, prepared release package artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, और `telegram_mode=mock-openai` के साथ call करते हैं। इससे package migration, update, live ClawHub skill install, stale-plugin-dependency cleanup, configured-plugin install repair, offline plugin, plugin-update, और Telegram proof एक ही resolved package tarball पर रहते हैं। Beta publish करने के बाद Full Release Validation या OpenClaw Release Checks पर `release_package_spec` set करें ताकि rebuilding के बिना shipped npm package के विरुद्ध वही matrix चल सके; `package_acceptance_package_spec` केवल तब set करें जब Package Acceptance को बाकी release validation से अलग package चाहिए। Cross-OS release checks अभी भी OS-specific onboarding, installer, और platform behavior cover करते हैं; package/update product validation Package Acceptance से शुरू होना चाहिए। `published-upgrade-survivor` Docker lane blocking release path में प्रति run एक published package baseline validate करती है। Package Acceptance में, resolved `package-under-test` tarball हमेशा candidate होता है और `published_upgrade_survivor_baseline` fallback published baseline चुनता है, default `openclaw@latest` होता है; failed-lane rerun commands उस baseline को preserve करते हैं। `run_release_soak=true` या `release_profile=full` वाला Full Release Validation `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` और `published_upgrade_survivor_scenarios=reported-issues` set करता है, ताकि चार latest stable npm releases plus pinned plugin-compatibility boundary releases और Feishu config, preserved bootstrap/persona files, configured OpenClaw plugin installs, tilde log paths, और stale legacy plugin dependency roots के लिए issue-shaped fixtures तक विस्तार हो। Multi-baseline published-upgrade survivor selections baseline के अनुसार separate targeted Docker runner jobs में sharded होते हैं। अलग `Update Migration` workflow `update-migration` Docker lane को `all-since-2026.4.23` और `plugin-deps-cleanup` के साथ उपयोग करता है, जब प्रश्न exhaustive published update cleanup का हो, normal Full Release CI breadth का नहीं। Local aggregate runs exact package specs `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` के साथ pass कर सकते हैं, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` जैसे `openclaw@2026.4.15` के साथ single lane रख सकते हैं, या scenario matrix के लिए `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` set कर सकते हैं। Published lane baseline को baked `openclaw config set` command recipe के साथ configure करती है, recipe steps को `summary.json` में record करती है, और Gateway start के बाद `/healthz`, `/readyz`, plus RPC status probe करती है। Windows packaged और installer fresh lanes यह भी verify करती हैं कि installed package raw absolute Windows path से browser-control override import कर सकता है। OpenAI cross-OS agent-turn smoke default रूप से `OPENCLAW_CROSS_OS_OPENAI_MODEL` set होने पर उसका उपयोग करता है, अन्यथा `openai/gpt-5.5`, ताकि install और gateway proof GPT-4.x defaults से बचते हुए GPT-5 test model पर रहे।

### Legacy compatibility windows

Package Acceptance already-published packages के लिए bounded legacy-compatibility windows रखता है। `2026.4.25` तक के packages, जिसमें `2026.4.25-beta.*` शामिल है, compatibility path का उपयोग कर सकते हैं:

- `dist/postinstall-inventory.json` में known private QA entries tarball-omitted files की ओर point कर सकती हैं;
- जब package वह flag expose नहीं करता, तो `doctor-switch` `gateway install --wrapper` persistence subcase skip कर सकता है;
- `update-channel-switch` tarball-derived fake git fixture से missing pnpm `patchedDependencies` prune कर सकता है और missing persisted `update.channel` log कर सकता है;
- plugin smokes legacy install-record locations पढ़ सकते हैं या missing marketplace install-record persistence accept कर सकते हैं;
- `plugin-update` config metadata migration allow कर सकता है, फिर भी install record और no-reinstall behavior को unchanged रहना आवश्यक है।

Published `2026.4.26` package local build metadata stamp files के लिए भी warn कर सकता है जो पहले ही shipped थे। बाद के packages को modern contracts satisfy करने होंगे; वही conditions warn या skip होने के बजाय fail होती हैं।

### Examples

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Failed package acceptance run debug करते समय, package source, version, और SHA-256 confirm करने के लिए `resolve_package` summary से शुरू करें। फिर `docker_acceptance` child run और उसके Docker artifacts inspect करें: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings, और rerun commands। Full release validation rerun करने के बजाय failed package profile या exact Docker lanes rerun करना prefer करें।

## Install smoke

अलग `Install Smoke` workflow अपने `preflight` job के जरिए वही scope script reuse करता है। यह smoke coverage को `run_fast_install_smoke` और `run_full_install_smoke` में split करता है।

- **तेज़ पथ** उन pull requests के लिए चलता है जो Docker/package सतहों, बंडल किए गए plugin package/manifest बदलावों, या core plugin/channel/gateway/Plugin SDK सतहों को छूते हैं जिन्हें Docker smoke jobs exercise करते हैं। केवल source वाले bundled plugin बदलाव, केवल test edits, और केवल docs edits Docker workers आरक्षित नहीं करते। तेज़ पथ root Dockerfile image को एक बार build करता है, CLI जांचता है, agents delete shared-workspace CLI smoke चलाता है, container gateway-network e2e चलाता है, bundled extension build arg सत्यापित करता है, और 240-second aggregate command timeout के तहत bounded bundled-plugin Docker profile चलाता है (हर scenario का Docker run अलग से capped होता है)।
- **पूरा पथ** nightly scheduled runs, manual dispatches, workflow-call release checks, और उन pull requests के लिए QR package install और installer Docker/update coverage रखता है जो सच में installer/package/Docker सतहों को छूते हैं। full mode में, install-smoke एक target-SHA GHCR root Dockerfile smoke image तैयार करता है या reuse करता है, फिर QR package install, root Dockerfile/gateway smokes, installer/update smokes, और fast bundled-plugin Docker E2E को अलग jobs के रूप में चलाता है ताकि installer work root image smokes के पीछे wait न करे।

`main` pushes (merge commits सहित) full path को force नहीं करते; जब changed-scope logic किसी push पर full coverage request करेगा, workflow fast Docker smoke रखता है और full install smoke को nightly या release validation के लिए छोड़ देता है।

slow Bun global install image-provider smoke अलग से `run_bun_global_install_smoke` द्वारा gated है। यह nightly schedule और release checks workflow से चलता है, और manual `Install Smoke` dispatches इसमें opt in कर सकते हैं, लेकिन pull requests और `main` pushes नहीं। Normal PR CI अभी भी Node-relevant बदलावों के लिए fast Bun launcher regression lane चलाता है। QR और installer Docker tests अपने install-focused Dockerfiles रखते हैं।

## Local Docker E2E

`pnpm test:docker:all` एक shared live-test image prebuild करता है, OpenClaw को एक बार npm tarball के रूप में pack करता है, और दो shared `scripts/e2e/Dockerfile` images build करता है:

- installer/update/plugin-dependency lanes के लिए एक bare Node/Git runner;
- एक functional image जो normal functionality lanes के लिए वही tarball `/app` में install करती है।

Docker lane definitions `scripts/lib/docker-e2e-scenarios.mjs` में हैं, planner logic `scripts/lib/docker-e2e-plan.mjs` में है, और runner केवल selected plan execute करता है। scheduler `OPENCLAW_DOCKER_E2E_BARE_IMAGE` और `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` के साथ प्रति lane image चुनता है, फिर `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ lanes चलाता है।

### Tunables

| Variable                               | Default | Purpose                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | normal lanes के लिए main-pool slot count।                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider-sensitive tail-pool slot count।                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | concurrent live lane cap ताकि providers throttle न करें।                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | concurrent npm install lane cap।                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | concurrent multi-service lane cap।                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon create storms से बचने के लिए lane starts के बीच stagger; no stagger के लिए `0` set करें।     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Per-lane fallback timeout (120 minutes); selected live/tail lanes tighter caps इस्तेमाल करते हैं।           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` lanes चलाए बिना scheduler plan print करता है।                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | comma-separated exact lane list; cleanup smoke skip करता है ताकि agents एक failed lane reproduce कर सकें। |

अपने effective cap से भारी lane अभी भी empty pool से start हो सकता है, फिर capacity release होने तक अकेला चलता है। local aggregate Docker preflight करता है, stale OpenClaw E2E containers हटाता है, active-lane status emit करता है, longest-first ordering के लिए lane timings persist करता है, और default रूप से पहली failure के बाद नई pooled lanes schedule करना रोक देता है।

### Reusable live/E2E workflow

reusable live/E2E workflow `scripts/test-docker-all.mjs --plan-json` से पूछता है कि कौन सा package, image kind, live image, lane, और credential coverage required है। फिर `scripts/docker-e2e.mjs` उस plan को GitHub outputs और summaries में convert करता है। यह या तो `scripts/package-openclaw-for-docker.mjs` के through OpenClaw pack करता है, current-run package artifact download करता है, या `package_artifact_run_id` से package artifact download करता है; tarball inventory validate करता है; जब plan को package-installed lanes चाहिए, Blacksmith के Docker layer cache के through package-digest-tagged bare/functional GHCR Docker E2E images build और push करता है; और rebuild करने के बजाय provided `docker_e2e_bare_image`/`docker_e2e_functional_image` inputs या existing package-digest images reuse करता है। Docker image pulls को bounded 180-second per-attempt timeout के साथ retry किया जाता है ताकि stuck registry/cache stream CI critical path का अधिकांश हिस्सा consume करने के बजाय quickly retry करे।

### Release-path chunks

Release Docker coverage `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ छोटे chunked jobs चलाता है ताकि हर chunk केवल अपनी needed image kind pull करे और same weighted scheduler के through multiple lanes execute करे:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Current release Docker chunks `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, और `plugins-runtime-install-a` से `plugins-runtime-install-h` तक हैं। `package-update-openai` live Codex plugin package lane शामिल करता है, जो candidate OpenClaw package install करता है, `codex_plugin_spec` या same-ref tarball से explicit Codex CLI install approval के साथ Codex plugin install करता है, Codex CLI preflight चलाता है, फिर OpenAI के विरुद्ध multiple same-session OpenClaw agent turns चलाता है। `plugins-runtime-core`, `plugins-runtime`, और `plugins-integrations` aggregate plugin/runtime aliases बने रहते हैं। `install-e2e` lane alias दोनों provider installer lanes के लिए aggregate manual rerun alias बना रहता है।

जब full release-path coverage इसे request करता है, OpenWebUI `plugins-runtime-services` में folded होता है, और केवल OpenWebUI-only dispatches के लिए standalone `openwebui` chunk रखता है। Bundled-channel update lanes transient npm network failures के लिए एक बार retry करते हैं।

हर chunk `.artifacts/docker-tests/` upload करता है, जिसमें lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables, और per-lane rerun commands शामिल हैं। workflow `docker_lanes` input chunk jobs के बजाय prepared images के विरुद्ध selected lanes चलाता है, जिससे failed-lane debugging एक targeted Docker job तक bounded रहती है और उस run के लिए package artifact तैयार, download, या reuse करता है; अगर selected lane live Docker lane है, तो targeted job उस rerun के लिए live-test image locally build करता है। Generated per-lane GitHub rerun commands में `package_artifact_run_id`, `package_artifact_name`, और prepared image inputs शामिल होते हैं जब वे values exist करती हैं, ताकि failed lane failed run से exact package और images reuse कर सके।

```bash
pnpm test:docker:rerun <run-id>      # Docker artifacts download करें और combined/per-lane targeted rerun commands print करें
pnpm test:docker:timings <summary>   # slow-lane और phase critical-path summaries
```

scheduled live/E2E workflow daily full release-path Docker suite चलाता है।

## Plugin Prerelease

`Plugin Prerelease` अधिक महंगी product/package coverage है, इसलिए यह `Full Release Validation` या explicit operator द्वारा dispatched अलग workflow है। Normal pull requests, `main` pushes, और standalone manual CI dispatches उस suite को off रखते हैं। यह bundled plugin tests को आठ extension workers में balance करता है; वे extension shard jobs एक समय में दो plugin config groups तक चलाते हैं, प्रति group एक Vitest worker और बड़े Node heap के साथ ताकि import-heavy plugin batches extra CI jobs create न करें। release-only Docker prerelease path targeted Docker lanes को छोटे groups में batch करता है ताकि एक-से-तीन-minute jobs के लिए दर्जनों runners reserve करने से बचा जा सके। workflow `@openclaw/plugin-inspector` से informational `plugin-inspector-advisory` artifact भी upload करता है; inspector findings triage input हैं और blocking Plugin Prerelease gate नहीं बदलते।

## QA Lab

QA Lab के dedicated CI lanes main smart-scoped workflow के बाहर हैं। Agentic parity broad QA और release harnesses के तहत nested है, standalone PR workflow नहीं। जब parity को broad validation run के साथ चलना चाहिए, `rerun_group=qa-parity` के साथ `Full Release Validation` use करें।

- `QA-Lab - All Lanes` workflow nightly `main` पर और manual dispatch पर चलता है; यह mock parity lane, live Matrix lane, और live Telegram और Discord lanes को parallel jobs के रूप में fan out करता है। Live jobs `qa-live-shared` environment use करते हैं, और Telegram/Discord Convex leases use करते हैं।

Release checks deterministic mock provider और mock-qualified models (`mock-openai/gpt-5.5` और `mock-openai/gpt-5.5-alt`) के साथ Matrix और Telegram live transport lanes चलाते हैं ताकि channel contract live model latency और normal provider-plugin startup से isolated रहे। live transport gateway memory search disable करता है क्योंकि QA parity memory behavior को अलग से cover करता है; provider connectivity अलग live model, native provider, और Docker provider suites द्वारा cover होती है।

Matrix scheduled और release gates के लिए `--profile fast` use करता है, और केवल checked-out CLI support करने पर `--fail-fast` जोड़ता है। CLI default और manual workflow input `all` बने रहते हैं; manual `matrix_profile=all` dispatch हमेशा full Matrix coverage को `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, और `e2ee-cli` jobs में shard करता है।

`OpenClaw Release Checks` release approval से पहले release-critical QA Lab lanes भी चलाता है; इसका QA parity gate candidate और baseline packs को parallel lane jobs के रूप में चलाता है, फिर final parity comparison के लिए दोनों artifacts को एक small report job में download करता है।

Normal PRs के लिए, parity को required status मानने के बजाय scoped CI/check evidence follow करें।

## CodeQL

`CodeQL` workflow जानबूझकर narrow first-pass security scanner है, full repository sweep नहीं। Daily, manual, और non-draft pull request guard runs Actions workflow code और highest-risk JavaScript/TypeScript surfaces को high-confidence security queries के साथ scan करते हैं, जिन्हें high/critical `security-severity` तक filtered किया जाता है।

pull request guard हल्का रहता है: यह केवल `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, या process-owning bundled plugin runtime paths के अंतर्गत changes के लिए start होता है, और scheduled workflow जैसा same high-confidence security matrix चलाता है। Android और macOS CodeQL PR defaults से बाहर रहते हैं।

### Security categories

| श्रेणी                                           | सतह                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron, और gateway बेसलाइन                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel implementation contracts और channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                  |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch, और Plugin SDK SSRF policy surfaces                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery, और agent tool-execution gates                                           |
| `/codeql-security-high/process-exec-boundary`     | Local shell, process spawn helpers, subprocess-owning bundled plugin runtimes, और workflow script glue                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading, और Plugin SDK package contract trust surfaces |

### प्लेटफ़ॉर्म-विशिष्ट सुरक्षा शार्ड

- `CodeQL Android Critical Security` — scheduled Android security shard। Workflow sanity द्वारा स्वीकार किए गए सबसे छोटे Blacksmith Linux runner पर CodeQL के लिए Android app को मैन्युअल रूप से बनाता है। `/codeql-critical-security/android` के अंतर्गत अपलोड करता है।
- `CodeQL macOS Critical Security` — weekly/manual macOS security shard। Blacksmith macOS पर CodeQL के लिए macOS app को मैन्युअल रूप से बनाता है, अपलोड किए गए SARIF से dependency build results को फ़िल्टर करता है, और `/codeql-critical-security/macos` के अंतर्गत अपलोड करता है। Daily defaults से बाहर रखा गया है क्योंकि साफ़ होने पर भी macOS build runtime पर हावी रहता है।

### महत्वपूर्ण गुणवत्ता श्रेणियाँ

`CodeQL Critical Quality` मिलता-जुलता non-security shard है। यह GitHub-hosted Linux runners पर संकरे उच्च-मूल्य surfaces पर केवल error-severity, non-security JavaScript/TypeScript quality queries चलाता है ताकि quality scans Blacksmith runner-registration budget खर्च न करें। इसका pull request guard निर्धारित profile की तुलना में जानबूझकर छोटा है: non-draft PRs केवल agent command/model/tool execution और reply dispatch code, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel और bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract, या Plugin SDK reply runtime changes के लिए matching `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, और `plugin-sdk-reply-runtime` shards चलाते हैं। CodeQL config और quality workflow changes सभी बारह PR quality shards चलाते हैं।

Manual dispatch स्वीकार करता है:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

संकरे profiles एक quality shard को अलग से चलाने के लिए teaching/iteration hooks हैं।

| श्रेणी                                                 | सतह                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron, और gateway security boundary code                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalization, और IO contracts                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schemas और server method contracts                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core channel और bundled channel plugin implementation contracts                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution, model/provider dispatch, auto-reply dispatch और queues, और ACP control-plane runtime contracts                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers और tool bridges, process supervision helpers, और outbound delivery contracts                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue, और memory doctor commands                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces, और session doctor CLI contracts |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues, और session/thread binding helpers             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth और discovery, provider runtime registration, provider defaults/catalogs, और web/search/fetch/embedding registries    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, gateway control flows, और task control-plane runtime contracts                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, media understanding, image-generation, और media-generation runtime contracts                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface, और Plugin SDK entrypoint contracts                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Published package-side Plugin SDK source और plugin package contract helpers                                                                                      |

Quality को security से अलग रखा जाता है ताकि quality findings को security signal को अस्पष्ट किए बिना schedule, measure, disable, या expand किया जा सके। Swift, Python, और bundled-plugin CodeQL expansion को scoped या sharded follow-up work के रूप में केवल तब वापस जोड़ा जाना चाहिए जब संकरे profiles के पास स्थिर runtime और signal हों।

## रखरखाव workflows

### Docs Agent

`Docs Agent` workflow हाल ही में landed changes के साथ मौजूदा docs को aligned रखने के लिए event-driven Codex maintenance lane है। इसका कोई pure schedule नहीं है: `main` पर successful non-bot push CI run इसे trigger कर सकता है, और manual dispatch इसे सीधे चला सकता है। Workflow-run invocations तब skip करते हैं जब `main` आगे बढ़ गया हो या पिछले घंटे में कोई दूसरा non-skipped Docs Agent run बनाया गया हो। जब यह चलता है, तो यह पिछले non-skipped Docs Agent source SHA से current `main` तक commit range की समीक्षा करता है, इसलिए एक hourly run पिछले docs pass के बाद जमा हुए सभी main changes को cover कर सकता है।

### Test Performance Agent

`Test Performance Agent` workflow slow tests के लिए event-driven Codex maintenance lane है। इसका कोई pure schedule नहीं है: `main` पर successful non-bot push CI run इसे trigger कर सकता है, लेकिन अगर उस UTC day में कोई दूसरा workflow-run invocation पहले ही चल चुका है या चल रहा है तो यह skip करता है। Manual dispatch उस daily activity gate को bypass करता है। Lane full-suite grouped Vitest performance report बनाता है, Codex को broad refactors के बजाय केवल छोटे coverage-preserving test performance fixes करने देता है, फिर full-suite report दोबारा चलाता है और ऐसे changes को reject करता है जो passing baseline test count कम करते हैं। Grouped report Linux और macOS पर per-config wall time और max RSS record करती है, इसलिए before/after comparison duration deltas के साथ test memory deltas दिखाता है। यदि baseline में failing tests हैं, तो Codex केवल obvious failures ठीक कर सकता है और after-agent full-suite report को कुछ भी commit होने से पहले pass करना होगा। जब bot push land होने से पहले `main` आगे बढ़ता है, lane validated patch को rebase करता है, `pnpm check:changed` दोबारा चलाता है, और push retry करता है; conflicting stale patches skip किए जाते हैं। यह GitHub-hosted Ubuntu का उपयोग करता है ताकि Codex action docs agent जैसी drop-sudo safety posture बनाए रख सके।

### Merge के बाद Duplicate PRs

`Duplicate PRs After Merge` workflow post-land duplicate cleanup के लिए manual maintainer workflow है। यह default रूप से dry-run होता है और `apply=true` होने पर केवल स्पष्ट रूप से listed PRs को close करता है। GitHub में mutation से पहले, यह verify करता है कि landed PR merged है और हर duplicate के पास या तो shared referenced issue है या overlapping changed hunks हैं।

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates और changed routing

Local changed-lane logic `scripts/changed-lanes.mjs` में रहता है और `scripts/check-changed.mjs` द्वारा execute किया जाता है। वह local check gate broad CI platform scope की तुलना में architecture boundaries को लेकर अधिक strict है:

- core production changes core prod और core test typecheck plus core lint/guards चलाते हैं;
- core test-only changes केवल core test typecheck plus core lint चलाते हैं;
- extension production changes extension prod और extension test typecheck plus extension lint चलाते हैं;
- extension test-only changes extension test typecheck plus extension lint चलाते हैं;
- public Plugin SDK या plugin-contract changes extension typecheck तक expand होते हैं क्योंकि extensions उन core contracts पर depend करते हैं (Vitest extension sweeps explicit test work ही रहते हैं);
- release metadata-only version bumps targeted version/config/root-dependency checks चलाते हैं;
- unknown root/config changes all check lanes पर fail safe करते हैं।

Local changed-test routing `scripts/test-projects.test-support.mjs` में रहता है और `check:changed` की तुलना में जानबूझकर सस्ता है: direct test edits स्वयं चलते हैं, source edits explicit mappings को prefer करते हैं, फिर sibling tests और import-graph dependents। Shared group-room delivery config explicit mappings में से एक है: group visible-reply config, source reply delivery mode, या message-tool system prompt में changes core reply tests plus Discord और Slack delivery regressions के ज़रिए route होते हैं ताकि shared default change पहले PR push से पहले fail हो। `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` का उपयोग केवल तब करें जब change इतना harness-wide हो कि cheap mapped set भरोसेमंद proxy न हो।

## Testbox validation

Crabbox, मेंटेनर Linux प्रमाण के लिए repo-स्वामित्व वाला remote-box wrapper है। इसका उपयोग
repo root से तब करें जब कोई check स्थानीय edit loop के लिए बहुत व्यापक हो, जब CI
समानता मायने रखती हो, या जब proof के लिए secrets, Docker, package lanes,
reusable boxes, या remote logs चाहिए हों। सामान्य OpenClaw backend
`blacksmith-testbox` है; स्वामित्व वाली AWS/Hetzner capacity, Blacksmith
outages, quota issues, या स्पष्ट owned-capacity testing के लिए fallback है।

Crabbox-समर्थित Blacksmith runs एक-बार उपयोग वाली Testboxes को warm, claim, sync, run, report, और clean up
करते हैं। built-in sync sanity check तब fast fail करता है जब आवश्यक
root files जैसे `pnpm-lock.yaml` गायब हो जाएं या जब `git status --short`
कम से कम 200 tracked deletions दिखाए। जानबूझकर बड़े-deletion PRs के लिए, remote command के लिए
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` set करें।

Crabbox एक local Blacksmith CLI invocation को भी terminate करता है जो
sync phase में post-sync output के बिना पांच मिनट से अधिक रहता है। उस guard को disable करने के लिए
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` set करें, या असामान्य रूप से बड़े local diffs के लिए बड़ा
millisecond value उपयोग करें।

पहले run से पहले, repo root से wrapper check करें:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo wrapper ऐसे stale Crabbox binary को refuse करता है जो `blacksmith-testbox` advertise नहीं करता। Provider को स्पष्ट रूप से pass करें, भले ही `.crabbox.yaml` में owned-cloud defaults हों। Codex worktrees या linked/sparse checkouts में, local `pnpm crabbox:run` script से बचें क्योंकि Crabbox शुरू होने से पहले pnpm dependencies reconcile कर सकता है; इसके बजाय node wrapper को सीधे invoke करें:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith-समर्थित runs के लिए Crabbox 0.22.0 या नया चाहिए ताकि wrapper को मौजूदा Testbox sync, queue, और cleanup behavior मिले। sibling checkout उपयोग करते समय, timing या proof work से पहले ignored local binary को rebuild करें:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Changed gate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Focused test rerun:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Full suite:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

अंतिम JSON summary पढ़ें। उपयोगी fields हैं `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs`, और `totalMs`। Delegated
Blacksmith Testbox runs के लिए, Crabbox wrapper exit code और JSON summary ही
command result हैं। Linked GitHub Actions run hydration और keepalive का स्वामी है; यह
`cancelled` के रूप में finish हो सकता है जब SSH command पहले ही return हो जाने के बाद Testbox को externally stop किया गया हो। इसे cleanup/status artifact मानें, जब तक
wrapper `exitCode` non-zero न हो या command output failed test न दिखाए।
One-shot Blacksmith-backed Crabbox runs को Testbox automatically stop करनी चाहिए;
अगर कोई run interrupted हो या cleanup अस्पष्ट हो, live boxes inspect करें और केवल
अपने बनाए boxes stop करें:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Reuse केवल तब उपयोग करें जब आपको जानबूझकर उसी hydrated box पर multiple commands चाहिए हों:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

यदि Crabbox broken layer है लेकिन Blacksmith स्वयं काम करता है, तो direct
Blacksmith का उपयोग केवल diagnostics जैसे `list`, `status`, और cleanup के लिए करें। Direct Blacksmith run को maintainer proof मानने से पहले
Crabbox path fix करें।

यदि `blacksmith testbox list --all` और `blacksmith testbox status` काम करते हैं लेकिन नए
warmups कुछ मिनटों के बाद भी बिना IP या Actions run URL के `queued` रहते हैं,
तो इसे Blacksmith provider, queue, billing, या org-limit pressure मानें। अपने बनाए
queued ids stop करें, और Testboxes शुरू करने से बचें, तथा proof को नीचे दिए गए
owned Crabbox capacity path पर move करें जबकि कोई Blacksmith dashboard,
billing, और org limits check करे।

Owned Crabbox capacity पर केवल तब escalate करें जब Blacksmith down हो, quota-limited हो, आवश्यक environment missing हो, या owned capacity स्पष्ट रूप से goal हो:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS pressure के तहत, `class=beast` से बचें जब तक task को सच में 48xlarge-class CPU की आवश्यकता न हो। एक `beast` request 192 vCPUs से शुरू होती है और regional EC2 Spot या On-Demand Standard quota trip करने का सबसे आसान तरीका है। Repo-owned `.crabbox.yaml` defaults `standard`, multiple capacity regions, और `capacity.hints: true` पर हैं ताकि brokered AWS leases selected region/market, quota pressure, Spot fallback, और high-pressure class warnings print करें। भारी broad checks के लिए `fast` उपयोग करें, `large` केवल standard/fast पर्याप्त न होने के बाद, और `beast` केवल exceptional CPU-bound lanes जैसे full-suite या all-plugin Docker matrices, explicit release/blocker validation, या high-core performance profiling के लिए। `pnpm check:changed`, focused tests, docs-only work, ordinary lint/typecheck, छोटे E2E repros, या Blacksmith outage triage के लिए `beast` का उपयोग न करें। Capacity diagnosis के लिए `--market on-demand` उपयोग करें ताकि Spot market churn signal में mix न हो।

`.crabbox.yaml` owned-cloud lanes के लिए provider, sync, और GitHub Actions hydration defaults का स्वामी है। यह local `.git` को exclude करता है ताकि hydrated Actions checkout maintainer-local remotes और object stores sync करने के बजाय अपना remote Git metadata रखे, और यह local runtime/build artifacts को exclude करता है जिन्हें कभी transfer नहीं किया जाना चाहिए। `.github/workflows/crabbox-hydrate.yml` owned-cloud `crabbox run --id <cbx_id>` commands के लिए checkout, Node/pnpm setup, `origin/main` fetch, और non-secret environment handoff का स्वामी है।

## संबंधित

- [Install overview](/hi/install)
- [Development channels](/hi/install/development-channels)
