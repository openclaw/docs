---
read_when:
    - आपको यह समझना है कि CI जॉब क्यों चला या क्यों नहीं चला
    - आप विफल हो रहे GitHub Actions चेक को डीबग कर रहे हैं
    - आप एक रिलीज़ सत्यापन रन या पुनः रन का समन्वय कर रहे हैं
    - आप ClawSweeper डिस्पैच या GitHub गतिविधि फ़ॉरवर्डिंग बदल रहे हैं
summary: CI जॉब ग्राफ़, स्कोप गेट, रिलीज़ अम्ब्रेला, और स्थानीय कमांड समकक्ष
title: CI पाइपलाइन
x-i18n:
    generated_at: "2026-07-04T06:32:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI `main` पर हर push और हर pull request पर चलता है। Canonical
`main` pushes पहले 90-सेकंड की hosted-runner admission window से गुजरते हैं।
मौजूदा `CI` concurrency group उस waiting run को तब cancel कर देता है जब कोई नया
commit land होता है, इसलिए sequential merges में हर एक पूरा Blacksmith
matrix register नहीं करता। Pull requests और manual dispatches wait को skip करते हैं। फिर `preflight` job
diff को classify करता है और जब केवल unrelated areas बदले हों तो expensive lanes बंद कर देता है।
Manual `workflow_dispatch` runs जानबूझकर smart scoping को bypass करते हैं
और release candidates तथा broad validation के लिए पूरा graph fan out करते हैं। Android lanes
`include_android` के जरिए opt-in रहते हैं। Release-only
Plugin coverage अलग [`Plugin Prerelease`](#plugin-prerelease)
workflow में रहता है और केवल [`Full Release Validation`](#full-release-validation)
या explicit manual dispatch से चलता है।

## Pipeline overview

| Job                                | Purpose                                                                                                   | When it runs                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs-only बदलाव, changed scopes, changed extensions detect करता है, और CI manifest build करता है                   | non-draft pushes और PRs पर हमेशा                  |
| `runner-admission`                 | Blacksmith work register होने से पहले canonical `main` pushes के लिए hosted 90-second debounce                | हर CI run; केवल canonical `main` pushes पर sleep |
| `security-fast`                    | Private key detection, `zizmor` के जरिए changed-workflow audit, और production lockfile audit                 | non-draft pushes और PRs पर हमेशा                  |
| `check-dependencies`               | Production Knip dependency-only pass और unused-file allowlist guard                                 | Node-relevant बदलाव                               |
| `build-artifacts`                  | `dist/`, Control UI, built-CLI smoke checks, embedded built-artifact checks, और reusable artifacts build करता है | Node-relevant बदलाव                               |
| `checks-fast-core`                 | तेज Linux correctness lanes जैसे bundled, protocol, QA Smoke CI, और CI-routing checks                | Node-relevant बदलाव                               |
| `checks-fast-contracts-plugins-*`  | दो sharded Plugin contract checks                                                                        | Node-relevant बदलाव                               |
| `checks-fast-contracts-channels-*` | दो sharded channel contract checks                                                                       | Node-relevant बदलाव                               |
| `checks-node-core-*`               | Core Node test shards, channel, bundled, contract, और extension lanes को छोड़कर                          | Node-relevant बदलाव                               |
| `check-*`                          | Sharded main local gate equivalent: prod types, lint, guards, test types, और strict smoke                | Node-relevant बदलाव                               |
| `check-additional-*`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary, और runtime topology     | Node-relevant बदलाव                               |
| `checks-node-compat-node22`        | Node 22 compatibility build और smoke lane                                                                | releases के लिए manual CI dispatch                     |
| `check-docs`                       | Docs formatting, lint, और broken-link checks                                                             | Docs बदले                                        |
| `skills-python`                    | Python-backed Skills के लिए Ruff + pytest                                                                    | Python-skill-relevant बदलाव                       |
| `checks-windows`                   | Windows-specific process/path tests और shared runtime import specifier regressions                      | Windows-relevant बदलाव                            |
| `macos-node`                       | shared built artifacts का उपयोग करने वाली macOS TypeScript test lane                                               | macOS-relevant बदलाव                              |
| `macos-swift`                      | macOS app के लिए Swift lint, build, और tests                                                            | macOS-relevant बदलाव                              |
| `ios-build`                        | Xcode project generation और iOS app simulator build                                                 | iOS app, shared app kit, या Swabble बदलाव         |
| `android`                          | दोनों flavors के लिए Android unit tests और एक debug APK build                                              | Android-relevant बदलाव                            |
| `test-performance-agent`           | trusted activity के बाद daily Codex slow-test optimization                                                 | Main CI success या manual dispatch                  |
| `openclaw-performance`             | mock-provider, deep-profile, और GPT 5.5 live lanes के साथ daily/on-demand Kova runtime performance reports | Scheduled और manual dispatch                       |

## Fail-fast order

1. `runner-admission` केवल canonical `main` pushes के लिए wait करता है; नया push Blacksmith registration से पहले run cancel कर देता है।
2. `preflight` तय करता है कि कौन-सी lanes अस्तित्व में होंगी। `docs-scope` और `changed-scope` logic इसी job के अंदर steps हैं, standalone jobs नहीं।
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, और `skills-python` भारी artifact और platform matrix jobs का wait किए बिना जल्दी fail होते हैं।
4. `build-artifacts` fast Linux lanes के साथ overlap करता है ताकि downstream consumers shared build ready होते ही start कर सकें।
5. उसके बाद भारी platform और runtime lanes fan out करते हैं: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, और `android`।

जब उसी PR या `main` ref पर नया push land होता है, GitHub superseded jobs को `cancelled` mark कर सकता है। इसे CI noise मानें, जब तक कि उसी ref के लिए सबसे नया run भी fail न हो रहा हो। Matrix jobs `fail-fast: false` का उपयोग करते हैं, और `build-artifacts` छोटे verifier jobs queue करने के बजाय embedded channel, core-support-boundary, और gateway-watch failures सीधे report करता है। Automatic CI concurrency key versioned है (`CI-v7-*`) ताकि पुराने queue group में GitHub-side zombie नए main runs को अनिश्चित काल तक block न कर सके। Manual full-suite runs `CI-manual-v1-*` का उपयोग करते हैं और in-progress runs cancel नहीं करते।

GitHub Actions से wall time, queue time, slowest jobs, failures, और `pnpm-store-warmup` fanout barrier summarize करने के लिए `pnpm ci:timings`, `pnpm ci:timings:recent`, या `node scripts/ci-run-timings.mjs <run-id>` का उपयोग करें। CI वही run summary `ci-timings-summary` artifact के रूप में भी upload करता है। Build timing के लिए, `build-artifacts` job का `Build dist` step देखें: `pnpm build:ci-artifacts` `[build-all] phase timings:` print करता है और `ui:build` शामिल करता है; job `startup-memory` artifact भी upload करता है।

Pull request runs के लिए, terminal timing-summary job `GH_TOKEN` को `gh run view` में pass करने से पहले trusted base revision से helper चलाता है। इससे tokened query branch-controlled code से बाहर रहती है, जबकि pull request के current CI run को फिर भी summarize किया जाता है।

## PR context and evidence

External contributor PRs
`.github/workflows/real-behavior-proof.yml` से PR context और evidence gate चलाते हैं। Workflow trusted
base commit checkout करता है और केवल PR body evaluate करता है; यह
contributor branch से code execute नहीं करता।

Gate उन PR authors पर apply होता है जो repository owners, members,
collaborators, या bots नहीं हैं। यह तब pass होता है जब PR body में authored
`What Problem This Solves` और `Evidence` sections होते हैं। Evidence focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log, या artifact link हो सकता है। Body intent और useful validation देती है;
reviewers correctness assess करने के लिए code, tests, और CI inspect करते हैं।

जब check fail हो, तो दूसरा code commit push करने के बजाय PR body update करें।

## Scope and routing

Scope logic `scripts/ci-changed-scope.mjs` में रहता है और `src/scripts/ci-changed-scope.test.ts` में unit tests से covered है। Manual dispatch changed-scope detection skip करता है और preflight manifest को ऐसे act कराता है जैसे हर scoped area बदला हो।

- **CI workflow edits** Node CI graph और workflow linting validate करते हैं, लेकिन अपने आप Windows, iOS, Android, या macOS native builds force नहीं करते; वे platform lanes platform source changes तक scoped रहते हैं।
- **Workflow Sanity** सभी workflow YAML files पर `actionlint`, `zizmor`, composite-action interpolation guard, और conflict-marker guard चलाता है। PR-scoped `security-fast` job changed workflow files पर भी `zizmor` चलाता है ताकि workflow security findings main CI graph में जल्दी fail हों।
- **Docs on `main` pushes** standalone `Docs` workflow द्वारा उसी ClawHub docs mirror के साथ checked होते हैं जिसका CI उपयोग करता है, इसलिए mixed code+docs pushes CI `check-docs` shard को भी queue नहीं करते। Pull requests और manual CI तब भी CI से `check-docs` चलाते हैं जब docs बदले हों।
- **TUI PTY** TUI changes के लिए `checks-node-core-runtime-tui-pty` Linux Node shard में चलता है। Shard `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` के साथ `test/vitest/vitest.tui-pty.config.ts` चलाता है, इसलिए यह deterministic `TuiBackend` fixture lane और धीमे `tui --local` smoke, जो केवल external model endpoint को mock करता है, दोनों cover करता है।
- **CI routing-only edits, selected cheap core-test fixture edits, and narrow plugin contract helper/test-routing edits** fast Node-only manifest path का उपयोग करते हैं: `preflight`, security, और एक single `checks-fast-core` task। जब change routing या helper surfaces तक limited होता है जिन्हें fast task सीधे exercise करता है, तो वह path build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards, और additional guard matrices skip करता है।
- **Windows Node checks** Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config, और उस lane को execute करने वाली CI workflow surfaces तक scoped हैं; unrelated source, Plugin, install-smoke, और test-only changes Linux Node lanes पर रहते हैं।

सबसे धीमे Node परीक्षण परिवारों को विभाजित या संतुलित किया गया है ताकि प्रत्येक जॉब रनरों को जरूरत से ज्यादा आरक्षित किए बिना छोटा रहे: Plugin कॉन्ट्रैक्ट और चैनल कॉन्ट्रैक्ट, प्रत्येक मानक GitHub रनर फ़ॉलबैक के साथ दो भारित Blacksmith-समर्थित शार्ड के रूप में चलते हैं, core unit fast/support लेन अलग-अलग चलती हैं, core runtime infra को state, process/config, shared, और तीन cron डोमेन शार्ड में विभाजित किया गया है, auto-reply संतुलित वर्करों के रूप में चलता है (reply सबट्री को agent-runner, dispatch, और commands/state-routing शार्ड में विभाजित करके), और agentic Gateway/server कॉन्फिग built artifacts की प्रतीक्षा करने के बजाय chat/auth/model/http-plugin/runtime/startup लेन में विभाजित किए गए हैं। इसके बाद सामान्य CI केवल isolated infra include-pattern शार्ड को अधिकतम 64 परीक्षण फ़ाइलों के नियतात्मक बंडलों में पैक करता है, जिससे non-isolated command/cron, stateful agents-core, या Gateway/server सूट को मिलाए बिना Node मैट्रिक्स घटता है; भारी fixed सूट 8 vCPU पर रहते हैं जबकि bundled और कम-वजन वाली लेन 4 vCPU का उपयोग करती हैं। canonical repository पर पुल अनुरोध एक अतिरिक्त compact admission plan का उपयोग करते हैं: वही per-config समूह मौजूदा 34-जॉब Linux Node योजना के अंदर isolated subprocesses में चलते हैं, ताकि एक अकेला PR पूरा 70-plus-job Node मैट्रिक्स पंजीकृत न करे। `main` पुश, manual dispatches, और release gates पूरा मैट्रिक्स बनाए रखते हैं। व्यापक browser, QA, media, और विविध Plugin परीक्षण shared Plugin catch-all के बजाय अपने समर्पित Vitest कॉन्फिग का उपयोग करते हैं। Include-pattern शार्ड CI shard name का उपयोग करके timing entries रिकॉर्ड करते हैं, इसलिए `.artifacts/vitest-shard-timings.json` पूरे कॉन्फिग और filtered shard के बीच अंतर कर सकता है। `check-additional-*` package-boundary compile/canary काम को साथ रखता है और runtime topology architecture को Gateway watch coverage से अलग करता है; boundary guard list को एक prompt-heavy shard और बाकी guard stripes के लिए एक combined shard में striped किया गया है, जिनमें से प्रत्येक चयनित स्वतंत्र guards को समानांतर चलाता है और per-check timings प्रिंट करता है। महंगा Codex happy-path prompt snapshot drift check manual CI और केवल prompt-affecting बदलावों के लिए अपने अलग additional job के रूप में चलता है, ताकि सामान्य असंबंधित Node बदलाव cold prompt snapshot generation के पीछे प्रतीक्षा न करें और boundary shards संतुलित रहें, जबकि prompt drift अभी भी उसी PR से बंधा रहे जिसने उसे पैदा किया; वही flag built-artifact core support-boundary shard के अंदर prompt snapshot Vitest generation को छोड़ देता है। Gateway watch, channel tests, और core support-boundary shard `build-artifacts` के अंदर समानांतर चलते हैं, जब `dist/` और `dist-runtime/` पहले ही बन चुके होते हैं।

Admission के बाद, canonical Linux CI अधिकतम 24 समवर्ती Node test jobs और
छोटी fast/check lanes के लिए 12 की अनुमति देता है; Windows और Android दो पर रहते हैं क्योंकि
वे runner pools अधिक सीमित हैं।

Compact PR plan मौजूदा suite के लिए 18 Node jobs निकालता है: whole-config
groups isolated subprocesses में 120-minute batch timeout के साथ batch किए जाते हैं,
जबकि include-pattern groups वही bounded job budget साझा करते हैं।

Android CI `testPlayDebugUnitTest` और `testThirdPartyDebugUnitTest` दोनों चलाता है और फिर Play debug APK बनाता है। third-party flavor के पास अलग source set या manifest नहीं है; इसकी unit-test lane फिर भी SMS/call-log BuildConfig flags के साथ flavor compile करती है, जबकि हर Android-relevant push पर duplicate debug APK packaging job से बचती है।

`check-dependencies` shard `pnpm deadcode:dependencies` (latest Knip version पर pinned production Knip dependency-only pass, जिसमें `dlx` install के लिए pnpm की minimum release age disabled है) और `pnpm deadcode:unused-files` चलाता है, जो Knip की production unused-file findings की तुलना `scripts/deadcode-unused-files.allowlist.mjs` से करता है। unused-file guard तब fail होता है जब कोई PR नई unreviewed unused file जोड़ता है या stale allowlist entry छोड़ता है, जबकि intentional dynamic Plugin, generated, build, live-test, और package bridge surfaces को सुरक्षित रखता है जिन्हें Knip statically resolve नहीं कर सकता।

## ClawSweeper गतिविधि forwarding

`.github/workflows/clawsweeper-dispatch.yml` OpenClaw repository activity को ClawSweeper में भेजने वाला target-side bridge है। यह untrusted pull request code को check out या execute नहीं करता। workflow `CLAWSWEEPER_APP_PRIVATE_KEY` से GitHub App token बनाता है, फिर compact `repository_dispatch` payloads को `openclaw/clawsweeper` पर dispatch करता है।

workflow की चार lanes हैं:

- exact issue और pull request review requests के लिए `clawsweeper_item`;
- issue comments में explicit ClawSweeper commands के लिए `clawsweeper_comment`;
- `main` pushes पर commit-level review requests के लिए `clawsweeper_commit_review`;
- general GitHub activity के लिए `github_activity` जिसे ClawSweeper agent inspect कर सकता है।

`github_activity` lane केवल normalized metadata forward करती है: event type, action, actor, repository, item number, URL, title, state, और मौजूद होने पर comments या reviews के short excerpts। यह जानबूझकर full webhook body forward करने से बचती है। `openclaw/clawsweeper` में receiving workflow `.github/workflows/github-activity.yml` है, जो normalized event को ClawSweeper agent के लिए OpenClaw Gateway hook पर post करता है।

General activity observation है, delivery-by-default नहीं। ClawSweeper agent को उसके prompt में Discord target मिलता है और उसे `#clawsweeper` पर केवल तब post करना चाहिए जब event surprising, actionable, risky, या operationally useful हो। Routine opens, edits, bot churn, duplicate Webhook noise, और normal review traffic का परिणाम `NO_REPLY` होना चाहिए।

इस पूरे path में GitHub titles, comments, bodies, review text, branch names, और commit messages को untrusted data मानें। वे summarization और triage के लिए input हैं, workflow या agent runtime के लिए instructions नहीं।

## Manual dispatches

Manual CI dispatches सामान्य CI जैसा ही job graph चलाते हैं लेकिन हर non-Android scoped lane को force on करते हैं: Linux Node shards, bundled-plugin shards, Plugin और channel contract shards, Node 22 compatibility, `check-*`, `check-additional-*`, built-artifact smoke checks, docs checks, Python skills, Windows, macOS, iOS build, और Control UI i18n। Standalone manual CI dispatches Android केवल `include_android=true` के साथ चलाते हैं; full release umbrella Android को `include_android=true` पास करके enable करता है। Plugin prerelease static checks, release-only `agentic-plugins` shard, full extension batch sweep, और Plugin prerelease Docker lanes CI से बाहर हैं। Docker prerelease suite केवल तब चलता है जब `Full Release Validation` release-validation gate enabled के साथ अलग `Plugin Prerelease` workflow dispatch करता है।

Manual runs एक unique concurrency group का उपयोग करते हैं ताकि release-candidate full suite उसी ref पर किसी दूसरे push या PR run से cancel न हो। optional `target_ref` input किसी trusted caller को selected dispatch ref से workflow file का उपयोग करते हुए उस graph को branch, tag, या full commit SHA के विरुद्ध चलाने देता है।

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Manual CI dispatch और non-canonical repository fallbacks, CodeQL JavaScript/actions quality scans, workflow-sanity, labeler, auto-response, CI के बाहर docs workflows, और install-smoke preflight ताकि Blacksmith matrix पहले queue हो सके                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lower-weight extension shards, QA Smoke CI को छोड़कर `checks-fast-core`, Plugin/channel contract shards, अधिकांश bundled/lower-weight Linux Node shards, `check-guards`, `check-prod-types`, `check-test-types`, selected `check-additional-*` shards, और `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | retained heavy Linux Node suites, boundary/extension-heavy `check-additional-*` shards, और `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, CI और Testbox में `build-artifacts`, `check-lint` (CPU-sensitive इतना कि 8 vCPU ने जितना बचाया उससे ज्यादा cost किया); install-smoke Docker builds (32-vCPU queue time ने जितना बचाया उससे ज्यादा cost किया)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` पर `macos-node`; forks `macos-15` पर fall back करते हैं                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` पर `macos-swift` और `ios-build`; forks `macos-26` पर fall back करते हैं                                                                                                                                                                                                                     |

## Runner registration budget

OpenClaw का मौजूदा GitHub runner-registration bucket `ghx api rate_limit` में
प्रति 5 मिनट 10,000 self-hosted runner registrations report करता है। प्रत्येक tuning pass से पहले
`actions_runner_registration` फिर से check करें क्योंकि GitHub इस bucket को बदल सकता है। यह limit
`openclaw` organization में सभी Blacksmith runner registrations द्वारा shared है, इसलिए एक और
Blacksmith installation जोड़ने से नया bucket नहीं जुड़ता।

Burst control के लिए Blacksmith labels को scarce resource मानें। वे jobs जो
केवल route, notify, summarize, select shards, या short CodeQL scans चलाते हैं, उन्हें
GitHub-hosted runners पर रहना चाहिए जब तक उनके पास measured Blacksmith-specific
needs न हों। कोई भी नया Blacksmith matrix, बड़ा `max-parallel`, या high-frequency
workflow अपनी worst-case registration count दिखाए और org-level
target को live bucket के लगभग 60% से कम रखे। मौजूदा 10,000-registration
bucket के साथ इसका मतलब 6,000-registration operating target है, जिससे
concurrent repositories, retries, और burst overlap के लिए headroom बचता है।

Canonical-repo CI normal push और pull-request runs के लिए Blacksmith को default runner path बनाए रखता है। `workflow_dispatch` और non-canonical repository runs GitHub-hosted runners का उपयोग करते हैं, लेकिन normal canonical runs अभी Blacksmith queue health probe नहीं करते या Blacksmith unavailable होने पर automatically GitHub-hosted labels पर fall back नहीं करते।

## स्थानीय समतुल्य

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

मैन्युअल डिस्पैच सामान्यतः वर्कफ़्लो ref को बेंचमार्क करता है। किसी रिलीज़ टैग या मौजूदा वर्कफ़्लो कार्यान्वयन वाली दूसरी ब्रांच को बेंचमार्क करने के लिए `target_ref` सेट करें। प्रकाशित रिपोर्ट पथ और नवीनतम पॉइंटर परीक्षित ref के आधार पर कुंजीबद्ध होते हैं, और हर `index.md` परीक्षित ref/SHA, वर्कफ़्लो ref/SHA, Kova ref, प्रोफ़ाइल, लेन auth मोड, मॉडल, repeat count, और scenario filters रिकॉर्ड करता है।

वर्कफ़्लो OCM को पिन की गई रिलीज़ से और Kova को `openclaw/Kova` से पिन किए गए `kova_ref` इनपुट पर इंस्टॉल करता है, फिर तीन लेन चलाता है:

- `mock-provider`: निर्धारक नकली OpenAI-संगत auth के साथ local-build runtime के विरुद्ध Kova diagnostic scenarios।
- `mock-deep-profile`: startup, gateway, और agent-turn hotspots के लिए CPU/heap/trace profiling।
- `live-openai-candidate`: वास्तविक OpenAI `openai/gpt-5.5` agent turn, जब `OPENAI_API_KEY` उपलब्ध न हो तो छोड़ा जाता है।

mock-provider लेन Kova पास के बाद OpenClaw-native स्रोत probes भी चलाती है: default, hook, और 50-plugin startup मामलों में gateway boot timing और memory; bundled plugin import RSS, बार-बार mock-OpenAI `channel-chat-baseline` hello loops, booted gateway के विरुद्ध CLI startup commands, और SQLite state smoke performance probe। जब परीक्षित ref के लिए पिछली प्रकाशित mock-provider source report उपलब्ध होती है, तो source summary मौजूदा RSS और heap values की तुलना उस baseline से करता है और बड़े RSS बढ़ावों को `watch` के रूप में चिह्नित करता है। source probe Markdown summary report bundle में `source/index.md` पर रहती है, और raw JSON उसके पास होता है।

हर लेन GitHub artifacts अपलोड करती है। जब `CLAWGRIT_REPORTS_TOKEN` कॉन्फ़िगर होता है, तो वर्कफ़्लो `report.json`, `report.md`, bundles, `index.md`, और source-probe artifacts को `openclaw/clawgrit-reports` में `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` के अंतर्गत commit भी करता है। मौजूदा tested-ref pointer `openclaw-performance/<tested-ref>/latest-<lane>.json` के रूप में लिखा जाता है।

## पूर्ण रिलीज़ सत्यापन

`Full Release Validation` "रिलीज़ से पहले सब कुछ चलाएँ" के लिए मैन्युअल umbrella workflow है। यह एक branch, tag, या पूरा commit SHA स्वीकार करता है, उस target के साथ मैन्युअल `CI` workflow डिस्पैच करता है, release-only plugin/package/static/Docker proof के लिए `Plugin Prerelease` डिस्पैच करता है, और install smoke, package acceptance, cross-OS package checks, QA profile evidence से maturity scorecard rendering, QA Lab parity, Matrix, और Telegram lanes के लिए `OpenClaw Release Checks` डिस्पैच करता है। Stable और full profiles हमेशा exhaustive live/E2E और Docker release-path soak coverage शामिल करते हैं; beta profile `run_release_soak=true` के साथ opt in कर सकती है। canonical package Telegram E2E Package Acceptance के अंदर चलता है, इसलिए full candidate duplicate live poller शुरू नहीं करता। प्रकाशित करने के बाद, release checks, Package Acceptance, Docker, cross-OS, और Telegram में shipped npm package को बिना rebuild किए reuse करने के लिए `release_package_spec` पास करें। केंद्रित published-package Telegram rerun के लिए केवल `npm_telegram_package_spec` का उपयोग करें। Codex plugin live package lane default रूप से वही selected state उपयोग करती है: published `release_package_spec=openclaw@<tag>` से `codex_plugin_spec=npm:@openclaw/codex@<tag>` बनता है, जबकि SHA/artifact runs selected ref से `extensions/codex` pack करते हैं। `npm:`, `npm-pack:`, या `git:` specs जैसे custom plugin sources के लिए `codex_plugin_spec` स्पष्ट रूप से सेट करें।

stage matrix, सटीक workflow job names, profile differences, artifacts, और
focused rerun handles के लिए [पूर्ण रिलीज़ सत्यापन](/hi/reference/full-release-validation) देखें।

`OpenClaw Release Publish` मैन्युअल mutating release workflow है। release tag मौजूद होने और OpenClaw npm preflight सफल होने के बाद इसे `release/YYYY.M.PATCH` या `main` से डिस्पैच करें। यह `pnpm plugins:sync:check` सत्यापित करता है, सभी publishable plugin packages के लिए `Plugin NPM Release` डिस्पैच करता है, उसी release SHA के लिए `Plugin ClawHub Release` डिस्पैच करता है, और उसके बाद ही saved `preflight_run_id` के साथ `OpenClaw NPM Release` डिस्पैच करता है। Stable publish के लिए exact `windows_node_tag` भी आवश्यक है; workflow Windows source release सत्यापित करता है और किसी भी publish child से पहले उसके x64/ARM64 installers की तुलना candidate-approved `windows_node_installer_digests` input से करता है, फिर GitHub release draft publish करने से पहले उन्हीं pinned installer digests और exact companion asset तथा checksum contract को promote और verify करता है।

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

तेज़ी से बदलती branch पर pinned commit proof के लिए,
`gh workflow run ... --ref main -f ref=<sha>` के बजाय helper का उपयोग करें:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs branches या tags होने चाहिए, raw commit SHAs नहीं। helper target SHA पर एक temporary `release-ci/<sha>-...` branch push करता है, उस pinned ref से `Full Release Validation` डिस्पैच करता है, सत्यापित करता है कि हर child workflow `headSha` target से मेल खाता है, और run पूरा होने पर temporary branch हटा देता है। umbrella verifier भी तब fail करता है जब कोई child workflow अलग SHA पर चला हो।

`release_profile` release checks में पास की जाने वाली live/provider breadth नियंत्रित करता है। मैन्युअल release workflows default रूप से `stable` होते हैं; `full` केवल तब उपयोग करें जब आप जानबूझकर व्यापक advisory provider/media matrix चाहते हों। Stable और full release checks हमेशा exhaustive live/E2E और Docker release-path soak चलाते हैं; beta profile `run_release_soak=true` के साथ opt in कर सकती है।

- `minimum` सबसे तेज़ OpenAI/core release-critical lanes रखता है।
- `stable` stable provider/backend set जोड़ता है।
- `full` व्यापक advisory provider/media matrix चलाता है।

umbrella dispatched child run ids रिकॉर्ड करता है, और final `Verify full validation` job मौजूदा child run conclusions फिर से check करता है तथा हर child run के लिए slowest-job tables जोड़ता है। यदि कोई child workflow rerun होकर green हो जाता है, तो umbrella result और timing summary refresh करने के लिए केवल parent verifier job फिर से चलाएँ।

Recovery के लिए, `Full Release Validation` और `OpenClaw Release Checks` दोनों `rerun_group` स्वीकार करते हैं। release candidate के लिए `all`, केवल normal full CI child के लिए `ci`, केवल plugin prerelease child के लिए `plugin-prerelease`, हर release child के लिए `release-checks`, या संकरी group उपयोग करें: umbrella पर `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, या `npm-telegram`। इससे focused fix के बाद failed release box rerun सीमित रहता है। एक failed cross-OS lane के लिए, `rerun_group=cross-os` को `cross_os_suite_filter` के साथ मिलाएँ, उदाहरण के लिए `windows/packaged-upgrade`; लंबे cross-OS commands heartbeat lines emit करते हैं और packaged-upgrade summaries per-phase timings शामिल करती हैं। QA release-check lanes advisory हैं, standard runtime tool coverage gate को छोड़कर, जो required OpenClaw dynamic tools के standard tier summary से drift या गायब होने पर block करता है।

`OpenClaw Release Checks` trusted workflow ref का उपयोग करके selected ref को एक बार `release-package-under-test` tarball में resolve करता है, फिर उस artifact को cross-OS checks और Package Acceptance में, साथ ही soak coverage चलने पर live/E2E release-path Docker workflow में पास करता है। इससे release boxes में package bytes consistent रहते हैं और एक ही candidate को multiple child jobs में दोबारा pack करने से बचा जाता है। Codex npm-plugin live lane के लिए, release checks या तो `release_package_spec` से derived matching published plugin spec पास करते हैं, operator-supplied `codex_plugin_spec` पास करते हैं, या input blank छोड़ते हैं ताकि Docker script selected checkout का Codex plugin pack करे।

`ref=main` और `rerun_group=all` के लिए duplicate `Full Release Validation` runs पुराने umbrella को supersede करते हैं। parent monitor parent cancel होने पर पहले से dispatched किसी भी child workflow को cancel कर देता है, इसलिए नई main validation stale two-hour release-check run के पीछे नहीं बैठती। Release branch/tag validation और focused rerun groups `cancel-in-progress: false` रखते हैं।

## Live और E2E shards

release live/E2E child व्यापक native `pnpm test:live` coverage रखता है, लेकिन इसे एक serial job के बजाय `scripts/test-live-shard.mjs` के ज़रिए named shards के रूप में चलाता है:

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

इससे वही file coverage बनी रहती है, साथ ही slow live provider failures को rerun और diagnose करना आसान हो जाता है। aggregate `native-live-extensions-o-z`, `native-live-extensions-media`, और `native-live-extensions-media-music` shard names मैन्युअल one-shot reruns के लिए valid रहते हैं।

native live media shards `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` में चलते हैं, जिसे `Live Media Runner Image` workflow बनाता है। वह image `ffmpeg` और `ffprobe` preinstall करती है; media jobs setup से पहले केवल binaries verify करते हैं। Docker-backed live suites को normal Blacksmith runners पर रखें — container jobs nested Docker tests launch करने के लिए सही जगह नहीं हैं।

Docker-समर्थित लाइव मॉडल/बैकएंड शार्ड प्रत्येक चुने गए कमिट के लिए अलग साझा `ghcr.io/openclaw/openclaw-live-test:<sha>` इमेज का उपयोग करते हैं। लाइव रिलीज़ वर्कफ़्लो उस इमेज को एक बार बनाकर पुश करता है, फिर Docker लाइव मॉडल, प्रोवाइडर-शार्डेड Gateway, CLI बैकएंड, ACP बाइंड, और Codex हार्नेस शार्ड `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ चलते हैं। Gateway Docker शार्ड वर्कफ़्लो जॉब टाइमआउट से कम स्पष्ट स्क्रिप्ट-स्तर `timeout` सीमाएँ रखते हैं, ताकि अटका हुआ कंटेनर या cleanup पथ पूरे रिलीज़-चेक बजट को खर्च करने के बजाय जल्दी विफल हो। यदि ये शार्ड पूर्ण स्रोत Docker लक्ष्य को स्वतंत्र रूप से दोबारा बनाते हैं, तो रिलीज़ रन गलत कॉन्फ़िगर किया गया है और डुप्लिकेट इमेज बिल्ड पर दीवार-घड़ी समय बर्बाद करेगा।

## पैकेज स्वीकृति

जब प्रश्न यह हो कि "क्या यह installable OpenClaw पैकेज उत्पाद के रूप में काम करता है?", तब `Package Acceptance` का उपयोग करें। यह सामान्य CI से अलग है: सामान्य CI स्रोत ट्री को सत्यापित करता है, जबकि पैकेज स्वीकृति उसी Docker E2E हार्नेस के माध्यम से एकल टारबॉल को सत्यापित करती है जिसे उपयोगकर्ता install या update के बाद चलाते हैं।

### जॉब

1. `resolve_package` `workflow_ref` को checkout करता है, एक पैकेज उम्मीदवार resolve करता है, `.artifacts/docker-e2e-package/openclaw-current.tgz` लिखता है, `.artifacts/docker-e2e-package/package-candidate.json` लिखता है, दोनों को `package-under-test` आर्टिफैक्ट के रूप में upload करता है, और GitHub चरण सारांश में स्रोत, वर्कफ़्लो ref, पैकेज ref, संस्करण, SHA-256, और प्रोफ़ाइल प्रिंट करता है।
2. `docker_acceptance` `ref=workflow_ref` और `package_artifact_name=package-under-test` के साथ `openclaw-live-and-e2e-checks-reusable.yml` को कॉल करता है। पुन: प्रयोज्य वर्कफ़्लो उस आर्टिफैक्ट को download करता है, टारबॉल inventory सत्यापित करता है, ज़रूरत पड़ने पर package-digest Docker इमेज तैयार करता है, और workflow checkout को pack करने के बजाय उस पैकेज के विरुद्ध चुनी गई Docker lanes चलाता है। जब कोई प्रोफ़ाइल कई लक्षित `docker_lanes` चुनती है, तो पुन: प्रयोज्य वर्कफ़्लो पैकेज और साझा इमेज एक बार तैयार करता है, फिर उन lanes को अद्वितीय आर्टिफैक्ट वाले समानांतर लक्षित Docker जॉब के रूप में fan out करता है।
3. `package_telegram` वैकल्पिक रूप से `NPM Telegram Beta E2E` को कॉल करता है। यह तब चलता है जब `telegram_mode` `none` नहीं होता और Package Acceptance द्वारा कोई पैकेज resolve किए जाने पर वही `package-under-test` आर्टिफैक्ट install करता है; standalone Telegram dispatch अब भी प्रकाशित npm spec install कर सकता है।
4. `summary` पैकेज resolution, Docker acceptance, या वैकल्पिक Telegram lane विफल होने पर वर्कफ़्लो विफल करता है।

### उम्मीदवार स्रोत

- `source=npm` केवल `openclaw@beta`, `openclaw@latest`, या `openclaw@2026.4.27-beta.2` जैसे सटीक OpenClaw रिलीज़ संस्करण स्वीकार करता है। इसे प्रकाशित prerelease/stable acceptance के लिए उपयोग करें।
- `source=ref` विश्वसनीय `package_ref` branch, tag, या पूर्ण commit SHA को pack करता है। resolver OpenClaw branches/tags fetch करता है, सत्यापित करता है कि चुना गया commit repository branch history या release tag से reachable है, detached worktree में deps install करता है, और उसे `scripts/package-openclaw-for-docker.mjs` के साथ pack करता है।
- `source=url` सार्वजनिक HTTPS `.tgz` download करता है; `package_sha256` आवश्यक है। यह पथ URL credentials, non-default HTTPS ports, private/internal/special-use hostnames या resolved IPs, और उसी सार्वजनिक सुरक्षा नीति से बाहर redirects को अस्वीकार करता है।
- `source=trusted-url` `.github/package-trusted-sources.json` में named trusted-source policy से HTTPS `.tgz` download करता है; `package_sha256` और `trusted_source_id` आवश्यक हैं। इसे केवल maintainer-owned enterprise mirrors या private package repositories के लिए उपयोग करें जिन्हें configured hosts, ports, path prefixes, redirect hosts, या private-network resolution चाहिए। यदि policy bearer auth घोषित करती है, तो workflow fixed `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret का उपयोग करता है; URL-embedded credentials तब भी अस्वीकार किए जाते हैं।
- `source=artifact` `artifact_run_id` और `artifact_name` से एक `.tgz` download करता है; `package_sha256` वैकल्पिक है लेकिन externally shared artifacts के लिए दिया जाना चाहिए।

`workflow_ref` और `package_ref` को अलग रखें। `workflow_ref` विश्वसनीय workflow/harness code है जो test चलाता है। `package_ref` वह source commit है जिसे `source=ref` होने पर pack किया जाता है। इससे वर्तमान test harness पुराने विश्वसनीय source commits को पुराने workflow logic चलाए बिना validate कर सकता है।

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` के साथ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI के साथ पूर्ण Docker release-path chunks
- `custom` — सटीक `docker_lanes`; `suite_profile=custom` होने पर आवश्यक

`package` प्रोफ़ाइल offline plugin coverage का उपयोग करती है, ताकि published-package validation लाइव ClawHub उपलब्धता पर gated न हो। वैकल्पिक Telegram lane `NPM Telegram Beta E2E` में `package-under-test` आर्टिफैक्ट reuse करती है, और standalone dispatches के लिए published npm spec path रखा जाता है।

समर्पित update और Plugin testing policy के लिए, जिसमें local commands,
Docker lanes, Package Acceptance inputs, release defaults, और failure triage शामिल हैं,
[Testing updates and plugins](/hi/help/testing-updates-plugins) देखें।

Release checks `source=artifact`, तैयार release package artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, और `telegram_mode=mock-openai` के साथ Package Acceptance को call करते हैं। इससे package migration, update, live ClawHub skill install, stale-plugin-dependency cleanup, configured-plugin install repair, offline plugin, plugin-update, और Telegram proof उसी resolved package tarball पर रहते हैं। beta publish करने के बाद shipped npm package के विरुद्ध वही matrix बिना rebuild चलाने के लिए Full Release Validation या OpenClaw Release Checks पर `release_package_spec` set करें; `package_acceptance_package_spec` केवल तब set करें जब Package Acceptance को बाकी release validation से अलग package चाहिए। Cross-OS release checks अब भी OS-specific onboarding, installer, और platform behavior cover करते हैं; package/update product validation Package Acceptance से शुरू होना चाहिए। `published-upgrade-survivor` Docker lane blocking release path में प्रति run एक published package baseline validate करता है। Package Acceptance में resolved `package-under-test` tarball हमेशा candidate होता है और `published_upgrade_survivor_baseline` fallback published baseline चुनता है, जो default रूप से `openclaw@latest` होता है; failed-lane rerun commands उस baseline को preserve करते हैं। `run_release_soak=true` या `release_profile=full` वाला Full Release Validation `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` और `published_upgrade_survivor_scenarios=reported-issues` set करता है, ताकि चार नवीनतम stable npm releases के साथ pinned plugin-compatibility boundary releases और Feishu config, preserved bootstrap/persona files, configured OpenClaw plugin installs, tilde log paths, और stale legacy plugin dependency roots के लिए issue-shaped fixtures तक विस्तार हो। Multi-baseline published-upgrade survivor selections baseline के अनुसार अलग targeted Docker runner jobs में sharded होते हैं। अलग `Update Migration` workflow `update-migration` Docker lane को `all-since-2026.4.23` और `plugin-deps-cleanup` के साथ उपयोग करता है, जब प्रश्न exhaustive published update cleanup का हो, सामान्य Full Release CI breadth का नहीं। Local aggregate runs `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` के साथ exact package specs pass कर सकते हैं, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` जैसे `openclaw@2026.4.15` के साथ single lane रख सकते हैं, या scenario matrix के लिए `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` set कर सकते हैं। Published lane baseline को baked `openclaw config set` command recipe के साथ configure करता है, `summary.json` में recipe steps record करता है, और Gateway start के बाद `/healthz`, `/readyz`, साथ ही RPC status probe करता है। Windows packaged और installer fresh lanes यह भी verify करते हैं कि installed package raw absolute Windows path से browser-control override import कर सकता है। OpenAI cross-OS agent-turn smoke default रूप से `OPENCLAW_CROSS_OS_OPENAI_MODEL` set होने पर उसे उपयोग करता है, अन्यथा `openai/gpt-5.5`, ताकि install और gateway proof GPT-4.x defaults से बचते हुए GPT-5 test model पर रहे।

### Legacy compatibility windows

Package Acceptance में पहले से प्रकाशित packages के लिए सीमित legacy-compatibility windows हैं। `2026.4.25` तक के packages, जिनमें `2026.4.25-beta.*` भी शामिल हैं, compatibility path उपयोग कर सकते हैं:

- `dist/postinstall-inventory.json` में ज्ञात private QA entries tarball-omitted files की ओर point कर सकती हैं;
- जब package वह flag expose नहीं करता, तो `doctor-switch` `gateway install --wrapper` persistence subcase skip कर सकता है;
- `update-channel-switch` tarball-derived fake git fixture से missing pnpm `patchedDependencies` prune कर सकता है और missing persisted `update.channel` log कर सकता है;
- plugin smokes legacy install-record locations पढ़ सकते हैं या missing marketplace install-record persistence स्वीकार कर सकते हैं;
- `plugin-update` config metadata migration allow कर सकता है, जबकि install record और no-reinstall behavior का unchanged रहना अब भी required है।

प्रकाशित `2026.4.26` package उन local build metadata stamp files के लिए भी warn कर सकता है जो पहले ही ship हो चुके थे। बाद के packages को modern contracts satisfy करने होंगे; वही conditions warn या skip के बजाय fail होंगी।

### उदाहरण

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

विफल package acceptance run debug करते समय, package source, version, और SHA-256 confirm करने के लिए `resolve_package` summary से शुरू करें। फिर `docker_acceptance` child run और उसके Docker artifacts देखें: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings, और rerun commands। Full release validation दोबारा चलाने के बजाय failed package profile या exact Docker lanes दोबारा चलाना पसंद करें।

## Install smoke

अलग `Install Smoke` workflow अपने `preflight` job के माध्यम से वही scope script reuse करता है। यह smoke coverage को `run_fast_install_smoke` और `run_full_install_smoke` में split करता है।

- **तेज़ पथ** उन pull requests के लिए चलता है जो Docker/package सतहों, bundled plugin package/manifest बदलावों, या उन core plugin/channel/gateway/Plugin SDK सतहों को छूते हैं जिन्हें Docker smoke jobs exercise करते हैं। केवल source वाले bundled plugin बदलाव, केवल test edits, और केवल docs edits Docker workers आरक्षित नहीं करते। तेज़ पथ root Dockerfile image को एक बार build करता है, CLI जांचता है, agents delete shared-workspace CLI smoke चलाता है, container gateway-network e2e चलाता है, bundled extension build arg सत्यापित करता है, और bounded bundled-plugin Docker profile को 240-second aggregate command timeout के तहत चलाता है (हर scenario का Docker run अलग से capped होता है)।
- **पूर्ण पथ** nightly scheduled runs, manual dispatches, workflow-call release checks, और उन pull requests के लिए QR package install और installer Docker/update coverage रखता है जो सच में installer/package/Docker सतहों को छूते हैं। full mode में, install-smoke एक target-SHA GHCR root Dockerfile smoke image तैयार करता है या reuse करता है, फिर QR package install, root Dockerfile/gateway smokes, installer/update smokes, और fast bundled-plugin Docker E2E को अलग jobs के रूप में चलाता है ताकि installer work root image smokes के पीछे प्रतीक्षा न करे।

`main` pushes (merge commits सहित) full path को force नहीं करते; जब changed-scope logic push पर full coverage मांगेगा, workflow fast Docker smoke रखता है और full install smoke को nightly या release validation पर छोड़ देता है।

slow Bun global install image-provider smoke अलग से `run_bun_global_install_smoke` द्वारा gated है। यह nightly schedule और release checks workflow से चलता है, और manual `Install Smoke` dispatches इसमें opt in कर सकते हैं, लेकिन pull requests और `main` pushes नहीं। सामान्य PR CI अब भी Node-relevant changes के लिए fast Bun launcher regression lane चलाता है। QR और installer Docker tests अपने अलग install-focused Dockerfiles रखते हैं।

## स्थानीय Docker E2E

`pnpm test:docker:all` एक shared live-test image को prebuild करता है, OpenClaw को एक बार npm tarball के रूप में pack करता है, और दो shared `scripts/e2e/Dockerfile` images build करता है:

- installer/update/plugin-dependency lanes के लिए bare Node/Git runner;
- normal functionality lanes के लिए functional image जो उसी tarball को `/app` में install करती है।

Docker lane definitions `scripts/lib/docker-e2e-scenarios.mjs` में रहती हैं, planner logic `scripts/lib/docker-e2e-plan.mjs` में रहती है, और runner केवल selected plan execute करता है। scheduler `OPENCLAW_DOCKER_E2E_BARE_IMAGE` और `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` के साथ प्रति lane image चुनता है, फिर `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ lanes चलाता है।

### समायोज्य मान

| Variable                               | Default | उद्देश्य                                                                                      |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | normal lanes के लिए main-pool slot count।                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider-sensitive tail-pool slot count।                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | concurrent live lane cap ताकि providers throttle न करें।                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | concurrent npm install lane cap।                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | concurrent multi-service lane cap।                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon create storms से बचने के लिए lane starts के बीच stagger; no stagger के लिए `0` set करें। |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | per-lane fallback timeout (120 minutes); selected live/tail lanes tighter caps use करते हैं।  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` lanes चलाए बिना scheduler plan print करता है।                                             |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | comma-separated exact lane list; cleanup smoke skip करता है ताकि agents एक failed lane reproduce कर सकें। |

अपने effective cap से भारी lane खाली pool से फिर भी start हो सकती है, फिर capacity release होने तक अकेले चलती है। local aggregate Docker preflight करता है, stale OpenClaw E2E containers हटाता है, active-lane status emit करता है, longest-first ordering के लिए lane timings persist करता है, और default रूप से पहली failure के बाद new pooled lanes schedule करना रोक देता है।

### पुन:प्रयोग योग्य live/E2E workflow

पुन:प्रयोग योग्य live/E2E workflow `scripts/test-docker-all.mjs --plan-json` से पूछता है कि कौन सा package, image kind, live image, lane, और credential coverage required है। फिर `scripts/docker-e2e.mjs` उस plan को GitHub outputs और summaries में convert करता है। यह या तो `scripts/package-openclaw-for-docker.mjs` के माध्यम से OpenClaw pack करता है, current-run package artifact download करता है, या `package_artifact_run_id` से package artifact download करता है; tarball inventory validate करता है; जब plan को package-installed lanes चाहिए तब Blacksmith के Docker layer cache के माध्यम से package-digest-tagged bare/functional GHCR Docker E2E images build और push करता है; और rebuild करने के बजाय provided `docker_e2e_bare_image`/`docker_e2e_functional_image` inputs या existing package-digest images reuse करता है। Docker image pulls को bounded 180-second per-attempt timeout के साथ retry किया जाता है ताकि stuck registry/cache stream CI critical path का अधिकांश हिस्सा consume करने के बजाय जल्दी retry करे।

### Release-path chunks

Release Docker coverage छोटे chunked jobs चलाता है जिनमें `OPENCLAW_SKIP_DOCKER_BUILD=1` होता है, ताकि हर chunk केवल वह image kind pull करे जिसकी उसे जरूरत है और उसी weighted scheduler के माध्यम से multiple lanes execute करे:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Current release Docker chunks `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, और `plugins-runtime-install-a` से `plugins-runtime-install-h` तक हैं। `package-update-openai` में live Codex plugin package lane शामिल है, जो candidate OpenClaw package install करती है, explicit Codex CLI install approval के साथ `codex_plugin_spec` या same-ref tarball से Codex plugin install करती है, Codex CLI preflight चलाती है, फिर OpenAI के विरुद्ध multiple same-session OpenClaw agent turns चलाती है। `plugins-runtime-core`, `plugins-runtime`, और `plugins-integrations` aggregate plugin/runtime aliases बने रहते हैं। `install-e2e` lane alias दोनों provider installer lanes के लिए aggregate manual rerun alias बना रहता है।

Full release-path coverage जब OpenWebUI मांगती है तो OpenWebUI को `plugins-runtime-services` में fold किया जाता है, और OpenWebUI-only dispatches के लिए ही standalone `openwebui` chunk रखा जाता है। Bundled-channel update lanes transient npm network failures के लिए एक बार retry करते हैं।

हर chunk `.artifacts/docker-tests/` upload करता है जिसमें lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables, और per-lane rerun commands होते हैं। workflow `docker_lanes` input chunk jobs के बजाय prepared images के विरुद्ध selected lanes चलाता है, जिससे failed-lane debugging एक targeted Docker job तक bounded रहती है और उस run के लिए package artifact तैयार, download, या reuse किया जाता है; अगर selected lane live Docker lane है, तो targeted job उस rerun के लिए live-test image locally build करता है। Generated per-lane GitHub rerun commands में `package_artifact_run_id`, `package_artifact_name`, और prepared image inputs शामिल होते हैं जब वे values मौजूद हों, ताकि failed lane failed run से exact package और images reuse कर सके।

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

scheduled live/E2E workflow daily full release-path Docker suite चलाता है।

## Plugin पूर्व-रिलीज़

`Plugin Prerelease` अधिक महंगा product/package coverage है, इसलिए यह `Full Release Validation` या explicit operator द्वारा dispatched अलग workflow है। सामान्य pull requests, `main` pushes, और standalone manual CI dispatches उस suite को off रखते हैं। यह bundled plugin tests को आठ extension workers में balance करता है; वे extension shard jobs एक समय में up to two plugin config groups चलाते हैं, प्रति group एक Vitest worker और larger Node heap के साथ, ताकि import-heavy plugin batches extra CI jobs न बनाएं। release-only Docker prerelease path targeted Docker lanes को छोटे groups में batch करता है ताकि one-to-three-minute jobs के लिए dozens of runners reserve करने से बचा जा सके। workflow `@openclaw/plugin-inspector` से informational `plugin-inspector-advisory` artifact भी upload करता है; inspector findings triage input हैं और blocking Plugin Prerelease gate को नहीं बदलते।

## QA लैब

QA Lab में main smart-scoped workflow के बाहर dedicated CI lanes हैं। Agentic parity broad QA और release harnesses के भीतर nested है, standalone PR workflow नहीं। जब parity को broad validation run के साथ चलना चाहिए, तो `rerun_group=qa-parity` के साथ `Full Release Validation` use करें।

- `QA-Lab - All Lanes` workflow nightly `main` पर और manual dispatch पर चलता है; यह mock parity lane, live Matrix lane, और live Telegram तथा Discord lanes को parallel jobs के रूप में fan out करता है। Live jobs `qa-live-shared` environment use करते हैं, और Telegram/Discord Convex leases use करते हैं।

Release checks deterministic mock provider और mock-qualified models (`mock-openai/gpt-5.5` और `mock-openai/gpt-5.5-alt`) के साथ Matrix और Telegram live transport lanes चलाते हैं, ताकि channel contract live model latency और normal provider-plugin startup से isolated रहे। live transport gateway memory search disable करता है क्योंकि QA parity memory behavior को अलग से cover करता है; provider connectivity अलग live model, native provider, और Docker provider suites द्वारा cover होती है।

Matrix scheduled और release gates के लिए `--profile fast` use करता है, और `--fail-fast` केवल तब जोड़ता है जब checked-out CLI उसे support करता है। CLI default और manual workflow input `all` बने रहते हैं; manual `matrix_profile=all` dispatch हमेशा full Matrix coverage को `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, और `e2ee-cli` jobs में shard करता है।

`OpenClaw Release Checks` release approval से पहले release-critical QA Lab lanes भी चलाता है; इसका QA parity gate candidate और baseline packs को parallel lane jobs के रूप में चलाता है, फिर final parity comparison के लिए दोनों artifacts को एक छोटे report job में download करता है।

सामान्य PRs के लिए parity को required status मानने के बजाय scoped CI/check evidence follow करें।

## CodeQL

`CodeQL` workflow जानबूझकर narrow first-pass security scanner है, full repository sweep नहीं। Daily, manual, और non-draft pull request guard runs Actions workflow code के साथ highest-risk JavaScript/TypeScript surfaces scan करते हैं, high-confidence security queries के साथ जो high/critical `security-severity` तक filtered हैं।

pull request guard हल्का रहता है: यह केवल `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, या process-owning bundled plugin runtime paths के तहत changes के लिए start होता है, और scheduled workflow जैसा ही high-confidence security matrix चलाता है। Android और macOS CodeQL PR defaults से बाहर रहते हैं।

### सुरक्षा श्रेणियां

| श्रेणी                                          | सतह                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | प्रमाणीकरण, सीक्रेट, सैंडबॉक्स, cron, और Gateway बेसलाइन                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | कोर चैनल कार्यान्वयन अनुबंध और चैनल Plugin रनटाइम, Gateway, Plugin SDK, सीक्रेट, ऑडिट स्पर्श-बिंदु              |
| `/codeql-security-high/network-ssrf-boundary`     | कोर SSRF, IP पार्सिंग, नेटवर्क गार्ड, वेब-फेच, और Plugin SDK SSRF नीति सतहें                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP सर्वर, प्रोसेस निष्पादन हेल्पर, आउटबाउंड डिलीवरी, और एजेंट टूल-निष्पादन गेट                                           |
| `/codeql-security-high/process-exec-boundary`     | स्थानीय शेल, प्रोसेस स्पॉन हेल्पर, सबप्रोसेस-स्वामित्व वाले बंडल्ड Plugin रनटाइम, और वर्कफ़्लो स्क्रिप्ट ग्लू                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin इंस्टॉल, लोडर, मेनिफेस्ट, रजिस्ट्री, पैकेज-मैनेजर इंस्टॉल, स्रोत-लोडिंग, और Plugin SDK पैकेज अनुबंध भरोसा सतहें |

### प्लेटफ़ॉर्म-विशिष्ट सुरक्षा शार्ड

- `CodeQL Android Critical Security` — शेड्यूल किया गया Android सुरक्षा शार्ड। वर्कफ़्लो सैनिटी द्वारा स्वीकार किए गए सबसे छोटे Blacksmith Linux रनर पर CodeQL के लिए Android ऐप को मैन्युअल रूप से बनाता है। `/codeql-critical-security/android` के अंतर्गत अपलोड करता है।
- `CodeQL macOS Critical Security` — साप्ताहिक/मैन्युअल macOS सुरक्षा शार्ड। Blacksmith macOS पर CodeQL के लिए macOS ऐप को मैन्युअल रूप से बनाता है, अपलोड किए गए SARIF से निर्भरता बिल्ड परिणामों को फ़िल्टर करता है, और `/codeql-critical-security/macos` के अंतर्गत अपलोड करता है। दैनिक डिफ़ॉल्ट से बाहर रखा गया है क्योंकि साफ़ होने पर भी macOS बिल्ड रनटाइम पर हावी रहता है।

### क्रिटिकल क्वालिटी श्रेणियां

`CodeQL Critical Quality` मेल खाता गैर-सुरक्षा शार्ड है। यह GitHub-होस्टेड Linux रनर पर संकीर्ण उच्च-मूल्य सतहों पर केवल त्रुटि-गंभीरता, गैर-सुरक्षा JavaScript/TypeScript गुणवत्ता क्वेरी चलाता है ताकि गुणवत्ता स्कैन Blacksmith रनर-पंजीकरण बजट खर्च न करें। इसका पुल रिक्वेस्ट गार्ड जानबूझकर शेड्यूल किए गए प्रोफ़ाइल से छोटा है: गैर-ड्राफ़्ट PR केवल एजेंट कमांड/मॉडल/टूल निष्पादन और रिप्लाई डिस्पैच कोड, कॉन्फ़िग स्कीमा/माइग्रेशन/IO कोड, प्रमाणीकरण/सीक्रेट/सैंडबॉक्स/सुरक्षा कोड, कोर चैनल और बंडल्ड चैनल Plugin रनटाइम, Gateway प्रोटोकॉल/सर्वर-मेथड, मेमोरी रनटाइम/SDK ग्लू, MCP/प्रोसेस/आउटबाउंड डिलीवरी, प्रोवाइडर रनटाइम/मॉडल कैटलॉग, सेशन डायग्नॉस्टिक्स/डिलीवरी कतारें, Plugin लोडर, Plugin SDK/पैकेज-अनुबंध, या Plugin SDK रिप्लाई रनटाइम बदलावों के लिए मेल खाते `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, और `plugin-sdk-reply-runtime` शार्ड चलाते हैं। CodeQL कॉन्फ़िग और गुणवत्ता वर्कफ़्लो बदलाव सभी बारह PR गुणवत्ता शार्ड चलाते हैं।

मैन्युअल डिस्पैच स्वीकार करता है:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

संकीर्ण प्रोफ़ाइल एक गुणवत्ता शार्ड को अलग से चलाने के लिए शिक्षण/इटरेशन हुक हैं।

| श्रेणी                                                | सतह                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | प्रमाणीकरण, सीक्रेट, सैंडबॉक्स, cron, और Gateway सुरक्षा सीमा कोड                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | कॉन्फ़िग स्कीमा, माइग्रेशन, नॉर्मलाइज़ेशन, और IO अनुबंध                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway प्रोटोकॉल स्कीमा और सर्वर मेथड अनुबंध                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | कोर चैनल और बंडल्ड चैनल Plugin कार्यान्वयन अनुबंध                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | कमांड निष्पादन, मॉडल/प्रोवाइडर डिस्पैच, ऑटो-रिप्लाई डिस्पैच और कतारें, और ACP कंट्रोल-प्लेन रनटाइम अनुबंध                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP सर्वर और टूल ब्रिज, प्रोसेस सुपरविजन हेल्पर, और आउटबाउंड डिलीवरी अनुबंध                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | मेमोरी होस्ट SDK, मेमोरी रनटाइम फसाड, मेमोरी Plugin SDK उपनाम, मेमोरी रनटाइम सक्रियण ग्लू, और मेमोरी डॉक्टर कमांड                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | रिप्लाई कतार आंतरिक भाग, सेशन डिलीवरी कतारें, आउटबाउंड सेशन बाइंडिंग/डिलीवरी हेल्पर, डायग्नॉस्टिक इवेंट/लॉग बंडल सतहें, और सेशन डॉक्टर CLI अनुबंध |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK इनबाउंड रिप्लाई डिस्पैच, रिप्लाई पेलोड/चंकिंग/रनटाइम हेल्पर, चैनल रिप्लाई विकल्प, डिलीवरी कतारें, और सेशन/थ्रेड बाइंडिंग हेल्पर             |
| `/codeql-critical-quality/provider-runtime-boundary`    | मॉडल कैटलॉग नॉर्मलाइज़ेशन, प्रोवाइडर प्रमाणीकरण और डिस्कवरी, प्रोवाइडर रनटाइम पंजीकरण, प्रोवाइडर डिफ़ॉल्ट/कैटलॉग, और वेब/सर्च/फेच/एम्बेडिंग रजिस्ट्री    |
| `/codeql-critical-quality/ui-control-plane`             | कंट्रोल UI बूटस्ट्रैप, स्थानीय पर्सिस्टेंस, Gateway कंट्रोल फ़्लो, और टास्क कंट्रोल-प्लेन रनटाइम अनुबंध                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | कोर वेब फेच/सर्च, मीडिया IO, मीडिया अंडरस्टैंडिंग, इमेज-जेनरेशन, और मीडिया-जेनरेशन रनटाइम अनुबंध                                                    |
| `/codeql-critical-quality/plugin-boundary`              | लोडर, रजिस्ट्री, सार्वजनिक-सतह, और Plugin SDK एंट्रीपॉइंट अनुबंध                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | प्रकाशित पैकेज-साइड Plugin SDK स्रोत और Plugin पैकेज अनुबंध हेल्पर                                                                                      |

गुणवत्ता को सुरक्षा से अलग रखा जाता है ताकि गुणवत्ता निष्कर्षों को सुरक्षा संकेत को अस्पष्ट किए बिना शेड्यूल, मापा, अक्षम, या विस्तारित किया जा सके। Swift, Python, और बंडल्ड-Plugin CodeQL विस्तार को संकीर्ण प्रोफ़ाइलों के स्थिर रनटाइम और संकेत होने के बाद ही स्कोप्ड या शार्डेड फ़ॉलो-अप कार्य के रूप में वापस जोड़ा जाना चाहिए।

## रखरखाव वर्कफ़्लो

### डॉक्स एजेंट

`Docs Agent` वर्कफ़्लो हाल ही में लैंड हुए बदलावों के साथ मौजूदा दस्तावेज़ों को संरेखित रखने के लिए एक इवेंट-चालित Codex रखरखाव लेन है। इसका कोई शुद्ध शेड्यूल नहीं है: `main` पर सफल गैर-बॉट पुश CI रन इसे ट्रिगर कर सकता है, और मैन्युअल डिस्पैच इसे सीधे चला सकता है। जब `main` आगे बढ़ चुका हो या पिछले घंटे में कोई अन्य गैर-स्किप्ड Docs Agent रन बनाया गया हो, तो वर्कफ़्लो-रन आमंत्रण स्किप हो जाते हैं। जब यह चलता है, तो यह पिछले गैर-स्किप्ड Docs Agent स्रोत SHA से वर्तमान `main` तक की कमिट रेंज की समीक्षा करता है, इसलिए एक घंटे वाला रन पिछले डॉक्स पास के बाद जमा हुए सभी main बदलावों को कवर कर सकता है।

### टेस्ट परफ़ॉर्मेंस एजेंट

`Test Performance Agent` वर्कफ़्लो धीमे परीक्षणों के लिए एक इवेंट-चालित Codex रखरखाव लेन है। इसका कोई शुद्ध शेड्यूल नहीं है: `main` पर सफल गैर-बॉट पुश CI रन इसे ट्रिगर कर सकता है, लेकिन यदि उस UTC दिन कोई अन्य वर्कफ़्लो-रन आमंत्रण पहले ही चल चुका है या चल रहा है, तो यह स्किप हो जाता है। मैन्युअल डिस्पैच उस दैनिक गतिविधि गेट को बायपास करता है। यह लेन पूर्ण-सूट समूहित Vitest प्रदर्शन रिपोर्ट बनाती है, Codex को व्यापक रिफ़ैक्टर के बजाय केवल छोटे कवरेज-संरक्षण परीक्षण प्रदर्शन सुधार करने देती है, फिर पूर्ण-सूट रिपोर्ट दोबारा चलाती है और उन बदलावों को अस्वीकार करती है जो पासिंग बेसलाइन टेस्ट गिनती घटाते हैं। समूहित रिपोर्ट Linux और macOS पर प्रति-कॉन्फ़िग वॉल टाइम और अधिकतम RSS रिकॉर्ड करती है, इसलिए पहले/बाद की तुलना अवधि डेल्टा के साथ परीक्षण मेमोरी डेल्टा दिखाती है। यदि बेसलाइन में असफल परीक्षण हैं, तो Codex केवल स्पष्ट विफलताओं को ठीक कर सकता है और कुछ भी कमिट होने से पहले आफ्टर-एजेंट पूर्ण-सूट रिपोर्ट पास होनी चाहिए। जब बॉट पुश लैंड होने से पहले `main` आगे बढ़ता है, तो लेन सत्यापित पैच को रीबेस करती है, `pnpm check:changed` दोबारा चलाती है, और पुश फिर से आज़माती है; विरोधाभासी पुराने पैच स्किप किए जाते हैं। यह GitHub-होस्टेड Ubuntu का उपयोग करता है ताकि Codex एक्शन डॉक्स एजेंट जैसी ही ड्रॉप-सूडो सुरक्षा मुद्रा बनाए रख सके।

### मर्ज के बाद डुप्लिकेट PR

`Duplicate PRs After Merge` वर्कफ़्लो पोस्ट-लैंड डुप्लिकेट सफ़ाई के लिए एक मैन्युअल मेंटेनर वर्कफ़्लो है। यह डिफ़ॉल्ट रूप से ड्राई-रन होता है और केवल `apply=true` होने पर स्पष्ट रूप से सूचीबद्ध PR बंद करता है। GitHub में बदलाव करने से पहले, यह सत्यापित करता है कि लैंड हुआ PR मर्ज हो चुका है और हर डुप्लिकेट में या तो साझा संदर्भित इश्यू है या ओवरलैपिंग बदले हुए हंक हैं।

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## स्थानीय चेक गेट और बदली हुई रूटिंग

स्थानीय बदली-लेन लॉजिक `scripts/changed-lanes.mjs` में रहता है और `scripts/check-changed.mjs` द्वारा निष्पादित होता है। यह स्थानीय चेक गेट व्यापक CI प्लेटफ़ॉर्म स्कोप की तुलना में आर्किटेक्चर सीमाओं के बारे में अधिक सख्त है:

- कोर प्रोडक्शन बदलाव कोर प्रोड और कोर टेस्ट टाइपचेक तथा कोर लिंट/गार्ड चलाते हैं;
- केवल-कोर-टेस्ट बदलाव केवल कोर टेस्ट टाइपचेक तथा कोर लिंट चलाते हैं;
- एक्सटेंशन प्रोडक्शन बदलाव एक्सटेंशन प्रोड और एक्सटेंशन टेस्ट टाइपचेक तथा एक्सटेंशन लिंट चलाते हैं;
- केवल-एक्सटेंशन-टेस्ट बदलाव एक्सटेंशन टेस्ट टाइपचेक तथा एक्सटेंशन लिंट चलाते हैं;
- सार्वजनिक Plugin SDK या Plugin-अनुबंध बदलाव एक्सटेंशन टाइपचेक तक फैलते हैं क्योंकि एक्सटेंशन उन कोर अनुबंधों पर निर्भर करते हैं (Vitest एक्सटेंशन स्वीप स्पष्ट परीक्षण कार्य ही रहते हैं);
- केवल-रिलीज़-मेटाडेटा संस्करण बंप लक्षित संस्करण/कॉन्फ़िग/रूट-निर्भरता चेक चलाते हैं;
- अज्ञात रूट/कॉन्फ़िग बदलाव सुरक्षित रूप से सभी चेक लेन पर विफल होते हैं।

स्थानीय बदली-टेस्ट रूटिंग `scripts/test-projects.test-support.mjs` में रहती है और जानबूझकर `check:changed` से सस्ती है: सीधे टेस्ट संपादन स्वयं चलते हैं, स्रोत संपादन पहले स्पष्ट मैपिंग, फिर सिबलिंग परीक्षण और इंपोर्ट-ग्राफ निर्भरता को प्राथमिकता देते हैं। साझा ग्रुप-रूम डिलीवरी कॉन्फ़िग स्पष्ट मैपिंग में से एक है: ग्रुप दृश्यमान-रिप्लाई कॉन्फ़िग, स्रोत रिप्लाई डिलीवरी मोड, या मैसेज-टूल सिस्टम प्रॉम्प्ट में बदलाव कोर रिप्लाई परीक्षणों तथा Discord और Slack डिलीवरी रिग्रेशन से होकर जाते हैं ताकि साझा डिफ़ॉल्ट बदलाव पहले PR पुश से पहले विफल हो जाए। `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` का उपयोग केवल तब करें जब बदलाव इतना harness-wide हो कि सस्ता मैप्ड सेट भरोसेमंद प्रॉक्सी न हो।

## Testbox सत्यापन

Crabbox रेपो-स्वामित्व वाला remote-box रैपर है, जिसका उपयोग अनुरक्षक Linux प्रमाण के लिए किया जाता है। इसका उपयोग
रेपो रूट से तब करें जब कोई जांच स्थानीय edit loop के लिए बहुत व्यापक हो, जब CI
समानता मायने रखती हो, या जब प्रमाण को secrets, Docker, package lanes,
पुन: उपयोग योग्य boxes, या remote logs की आवश्यकता हो। सामान्य OpenClaw बैकएंड
`blacksmith-testbox` है; स्वामित्व वाली AWS/Hetzner क्षमता Blacksmith
आउटेज, quota समस्याओं, या स्पष्ट स्वामित्व-क्षमता परीक्षण के लिए fallback है।

Crabbox-समर्थित Blacksmith runs एक-बार इस्तेमाल वाले Testboxes को warm, claim,
sync, run, report, और clean up करते हैं। अंतर्निहित sync sanity check तब तेजी से विफल होता है जब आवश्यक
root files जैसे `pnpm-lock.yaml` गायब हो जाते हैं या जब `git status --short`
कम से कम 200 tracked deletions दिखाता है। जानबूझकर बड़े-deletion PRs के लिए,
remote command के लिए `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` सेट करें।

Crabbox ऐसी स्थानीय Blacksmith CLI invocation को भी समाप्त करता है जो
sync phase में post-sync output के बिना पांच मिनट से अधिक रहती है। उस guard को अक्षम करने के लिए
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` सेट करें, या असामान्य रूप से बड़े local diffs के लिए बड़ा
millisecond value उपयोग करें।

पहले run से पहले, रेपो रूट से wrapper जांचें:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

रेपो wrapper stale Crabbox binary को अस्वीकार करता है जो `blacksmith-testbox` का विज्ञापन नहीं करता। Provider को स्पष्ट रूप से pass करें, भले ही `.crabbox.yaml` में owned-cloud defaults हों। Codex worktrees या linked/sparse checkouts में, स्थानीय `pnpm crabbox:run` script से बचें क्योंकि pnpm Crabbox शुरू होने से पहले dependencies को reconcile कर सकता है; इसके बजाय node wrapper को सीधे invoke करें:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith-समर्थित runs के लिए Crabbox 0.22.0 या नया आवश्यक है ताकि wrapper को वर्तमान Testbox sync, queue, और cleanup behavior मिले। Sibling checkout उपयोग करते समय, timing या proof work से पहले ignored local binary को rebuild करें:

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

पूर्ण suite:

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

अंतिम JSON summary पढ़ें। उपयोगी fields `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs`, और `totalMs` हैं। Delegated
Blacksmith Testbox runs के लिए, Crabbox wrapper exit code और JSON summary ही
command result हैं। Linked GitHub Actions run hydration और keepalive का मालिक है; SSH
command पहले ही लौट आने के बाद Testbox को बाहरी रूप से रोक दिए जाने पर यह
`cancelled` के रूप में समाप्त हो सकता है। इसे cleanup/status artifact मानें जब तक
wrapper `exitCode` non-zero न हो या command output failed test न दिखाए।
One-shot Blacksmith-समर्थित Crabbox runs को Testbox को अपने-आप रोकना चाहिए;
यदि कोई run interrupt हो जाए या cleanup अस्पष्ट हो, तो live boxes inspect करें और केवल
वे boxes रोकें जिन्हें आपने बनाया है:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Reuse केवल तब उपयोग करें जब आपको जानबूझकर उसी hydrated box पर कई commands की आवश्यकता हो:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

यदि Crabbox ही टूटी हुई layer है लेकिन Blacksmith स्वयं काम करता है, तो direct
Blacksmith को केवल diagnostics जैसे `list`, `status`, और cleanup के लिए उपयोग करें। Direct Blacksmith run को maintainer proof मानने से पहले
Crabbox path ठीक करें।

यदि `blacksmith testbox list --all` और `blacksmith testbox status` काम करते हैं लेकिन नई
warmups कुछ मिनट बाद भी बिना IP या Actions run URL के `queued` में रहती हैं,
तो इसे Blacksmith provider, queue, billing, या org-limit pressure मानें। आपके बनाए हुए
queued ids रोकें, अधिक Testboxes शुरू करने से बचें, और proof को नीचे दिए गए
owned Crabbox capacity path पर ले जाएं, जबकि कोई Blacksmith dashboard,
billing, और org limits जांचता है।

Owned Crabbox capacity पर केवल तब escalate करें जब Blacksmith down हो, quota-limited हो, आवश्यक environment missing हो, या owned capacity स्पष्ट रूप से लक्ष्य हो:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS pressure के तहत, `class=beast` से बचें जब तक task को सचमुच 48xlarge-class CPU की आवश्यकता न हो। `beast` request 192 vCPUs से शुरू होती है और regional EC2 Spot या On-Demand Standard quota trigger करने का सबसे आसान तरीका है। Repo-owned `.crabbox.yaml` default रूप से `standard`, कई capacity regions, और `capacity.hints: true` उपयोग करता है ताकि brokered AWS leases selected region/market, quota pressure, Spot fallback, और high-pressure class warnings print करें। भारी broad checks के लिए `fast` उपयोग करें, `large` केवल standard/fast पर्याप्त न होने के बाद, और `beast` केवल exceptional CPU-bound lanes जैसे full-suite या all-plugin Docker matrices, explicit release/blocker validation, या high-core performance profiling के लिए। `pnpm check:changed`, focused tests, docs-only work, ordinary lint/typecheck, small E2E repros, या Blacksmith outage triage के लिए `beast` उपयोग न करें। Capacity diagnosis के लिए `--market on-demand` उपयोग करें ताकि Spot market churn signal में mix न हो।

`.crabbox.yaml` owned-cloud lanes के लिए provider, sync, और GitHub Actions hydration defaults का मालिक है। यह local `.git` को exclude करता है ताकि hydrated Actions checkout maintainer-local remotes और object stores sync करने के बजाय अपना remote Git metadata रखे, और यह local runtime/build artifacts को exclude करता है जिन्हें कभी transfer नहीं किया जाना चाहिए। `.github/workflows/crabbox-hydrate.yml` checkout, Node/pnpm setup, `origin/main` fetch, और owned-cloud `crabbox run --id <cbx_id>` commands के लिए non-secret environment handoff का मालिक है।

## संबंधित

- [Install overview](/hi/install)
- [Development channels](/hi/install/development-channels)
