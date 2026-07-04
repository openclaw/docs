---
read_when:
    - सार्वजनिक रिलीज़ चैनल परिभाषाएँ खोजी जा रही हैं
    - रिलीज़ सत्यापन या पैकेज स्वीकृति चलाना
    - संस्करण नामकरण और क्रमिक आवृत्ति की तलाश
summary: रिलीज़ लेन, ऑपरेटर चेकलिस्ट, सत्यापन बॉक्स, संस्करण नामकरण, और आवृत्ति
title: रिलीज़ नीति
x-i18n:
    generated_at: "2026-07-04T18:05:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw वर्तमान में तीन उपयोगकर्ता-सामने update channels उपलब्ध कराता है:

- stable: मौजूदा promoted release channel, जो अलग CLI/channel milestone आने तक अभी भी
  npm `latest` के माध्यम से resolve होता है
- beta: prerelease tags जो npm `beta` पर publish होते हैं
- dev: `main` का moving head

अलग से, release operators पिछले पूर्ण महीने का core package npm
`extended-stable` पर publish कर सकते हैं, patch `33` से शुरू करते हुए। current-month regular
final line npm `latest` पर जारी रहती है; यह operator-side publication split
अपने-आप CLI update-channel resolution नहीं बदलता।

## संस्करण नामकरण

- मासिक npm extended-stable release version: `YYYY.M.PATCH`, जहाँ `PATCH >= 33`
  - Git tag: `vYYYY.M.PATCH`
- दैनिक/regular final release version: `YYYY.M.PATCH`, जहाँ `PATCH < 33`
  - Git tag: `vYYYY.M.PATCH`
- Regular fallback correction release version: `YYYY.M.PATCH-N`
  - Git tag: `vYYYY.M.PATCH-N`
- Beta prerelease version: `YYYY.M.PATCH-beta.N`
  - Git tag: `vYYYY.M.PATCH-beta.N`
- month या patch को zero-pad न करें
- June 2026 release process update से शुरू करके, तीसरा component
  sequential monthly release-train number है, calendar day नहीं। Stable और beta
  releases current train तय करते हैं; alpha-only tags beta/stable patch number को
  consume या advance नहीं करते। Pre-update tags और npm versions अपने
  मौजूदा नाम बनाए रखते हैं और valid रहते हैं; release automation उन्हें
  year, month, patch, channel, और prerelease या correction
  number के आधार पर compare करना जारी रखता है।
- Alpha/nightly builds next unreleased patch train का उपयोग करते हैं और repeated builds के लिए केवल
  `alpha.N` increment करते हैं। जब उस patch का beta आ जाता है, तो new alpha builds
  अगले patch पर चले जाते हैं। beta या stable train चुनते समय higher patch
  numbers वाले legacy alpha-only tags को ignore करें।
- npm versions immutable होते हैं। यदि कोई beta tag पहले ही publish हो चुका है, तो उसे
  delete, republish, या reuse न करें; अगला beta number या अगला monthly
  patch cut करें। क्योंकि transition के दौरान `2026.6.5-beta.1` पहले ही publish हो चुका था,
  June 2026 release trains को patch `5` या उससे ऊपर का उपयोग करना होगा। नए
  June 2026 stable या beta trains को `2026.6.2`, `2026.6.3`, या
  `2026.6.4` के रूप में publish न करें।
- regular final `2026.6.5` के बाद, अगला नया beta train
  `2026.6.6-beta.1` है, भले ही
  higher patch numbers वाले automated alpha-only tags पहले से मौजूद हों।
- `latest` current regular/daily npm line को follow करना जारी रखता है
- `beta` का अर्थ current beta install target है
- `extended-stable` का अर्थ supported trailing-month npm package है, patch
  `33` से शुरू; patch `34` और उसके बाद वाले उस monthly line पर maintenance releases हैं
- dedicated monthly extended-stable path केवल core npm package publish करता है। यह
  plugins, macOS या Windows artifacts, GitHub Release,
  private-repository dist-tags, Docker images, mobile artifacts, या website
  downloads publish नहीं करता।

## Release cadence

- Releases beta-first आगे बढ़ते हैं
- Stable केवल latest beta validate होने के बाद follow करता है
- Maintainers सामान्यतः current `main` से बनाई गई `release/YYYY.M.PATCH` branch से releases cut करते हैं,
  ताकि release validation और fixes `main` पर नए
  development को block न करें
- यदि कोई beta tag push या publish हो चुका है और उसमें fix चाहिए, तो maintainers
  पुराने beta tag को delete या recreate करने के बजाय अगला `-beta.N` tag cut करते हैं
- विस्तृत release procedure, approvals, credentials, और recovery notes
  केवल maintainers के लिए हैं

## मासिक npm-only extended-stable publication

यह नीचे दी गई regular release procedure का dedicated exception है। पूर्ण
month `YYYY.M` के लिए, `extended-stable/YYYY.M.33` बनाएं; `vYYYY.M.33` और
बाद के maintenance patches उसी branch से publish करें। release tag, branch tip,
checkout, package version, npm preflight, और Full Release Validation run सभी को
एक ही commit identify करना होगा। Protected `main` में पहले से patch `33` से नीचे वाला
strictly later calendar month's final version होना चाहिए; maintenance patches
`main` के एक month से अधिक advance होने के बाद भी eligible रहते हैं।

ठीक extended-stable branch से npm preflight और Full Release Validation run करें,
फिर दोनों run IDs save करें:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` मौजूदा validation-depth profile है; यह
npm `extended-stable` dist-tag से अलग है और जानबूझकर unchanged है।

दोनों runs सफल होने और npm release environment ready होने के बाद,
ठीक preflight tarball को promote करें। Patch `P` `33` या उससे greater होना चाहिए:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

ऐसे fork या non-production rehearsal के लिए जो जानबूझकर monthly `.33` या protected-`main`
month policy satisfy नहीं कर सकता, npm preflight और publish dispatches दोनों में
`-f bypass_extended_stable_guard=true` जोड़ें। default `false` है। bypass केवल
`npm_dist_tag=extended-stable` के साथ accept होता है और workflow summary में
record किया जाता है। यह canonical `extended-stable/YYYY.M.33` workflow ref,
branch-tip/tag/checkout equality, final-tag syntax, package/tag version equality,
referenced run और manifest identity, tarball provenance, environment approval,
registry readback, या selector repair evidence को bypass नहीं करता।

publish workflow referenced run identities, prepared tarball digest,
और दोनों npm registry selectors verify करता है। workflow सफल होने के बाद
result को स्वतंत्र रूप से confirm करें:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

दोनों commands को `YYYY.M.P` return करना होगा। यदि publish सफल होता है लेकिन selector
readback fail होता है, तो immutable package version को republish न करें। failed workflow की
always-run summary में print किए गए single
`npm dist-tag add openclaw@YYYY.M.P extended-stable` repair command का उपयोग करें,
फिर दोनों independent readbacks repeat करें। prior selector पर rollback एक अलग
operator decision है, readback repair path नहीं।

नीचे दी गई regular checklist beta, `latest`, GitHub Release,
plugins, macOS, Windows, और अन्य platform publication को own करना जारी रखती है। इस npm-only
extended-stable path के लिए वे steps run न करें।

## Regular release operator checklist

यह checklist release flow का public shape है। Private credentials,
signing, notarization, dist-tag recovery, और emergency rollback details
maintainer-only release runbook में रहते हैं।

1. वर्तमान `main` से शुरू करें: नवीनतम खींचें, पुष्टि करें कि लक्ष्य commit push हो चुका है,
   और पुष्टि करें कि वर्तमान `main` CI इतना हरा है कि उससे branch बनाई जा सके।
2. अंतिम reachable release tag के बाद से merged PRs और सभी direct
   commits से शीर्ष `CHANGELOG.md` section जनरेट करें। Entries को user-facing रखें,
   overlapping PR/direct-commit entries को dedupe करें, rewrite commit करें, उसे push करें,
   और branching से पहले एक बार फिर rebase/pull करें।
3. Release compatibility records की समीक्षा
   `src/plugins/compat/registry.ts` और
   `src/commands/doctor/shared/deprecation-compat.ts` में करें। Expired
   compatibility केवल तब हटाएं जब upgrade path covered रहे, या दर्ज करें कि इसे
   जानबूझकर क्यों रखा जा रहा है।
4. वर्तमान `main` से `release/YYYY.M.PATCH` बनाएं; सामान्य release work
   सीधे `main` पर न करें।
5. Intended tag के लिए हर required version location bump करें, फिर
   `pnpm release:prep` चलाएं। यह plugin versions, plugin inventory, config
   schema, bundled channel config metadata, config docs baseline, plugin SDK
   exports, और plugin SDK API baseline को सही क्रम में refresh करता है। Tagging से पहले कोई भी generated
   drift commit करें। फिर local deterministic preflight चलाएं:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, और `pnpm release:check`।
6. `OpenClaw NPM Release` को `preflight_only=true` के साथ चलाएं। Tag मौजूद होने से पहले,
   validation-only preflight के लिए पूरा 40-character release-branch SHA allowed है।
   Preflight exact checked-out dependency graph के लिए dependency release evidence जनरेट करता है
   और उसे npm preflight artifact में store करता है। सफल `preflight_run_id` save करें।
7. Release branch, tag, या full commit SHA के लिए `Full Release Validation` के साथ
   सभी pre-release tests kick off करें। यह चार बड़े release test boxes के लिए एक manual entrypoint है:
   Vitest, Docker, QA Lab, और Package।
8. अगर validation fail होता है, release branch पर fix करें और सबसे छोटी failed
   file, lane, workflow job, package profile, provider, या model allowlist rerun करें जो
   fix को prove करे। Full umbrella केवल तब rerun करें जब changed surface
   prior evidence को stale बना दे।
9. Tagged beta candidate के लिए, matching
   `release/YYYY.M.PATCH` branch से
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` चलाएं। Stable के लिए, required Windows source
   release भी pass करें:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`।
   Helper local generated-release checks चलाता है, full release validation और npm preflight evidence
   dispatch या verify करता है, exact prepared tarball के विरुद्ध Parallels
   fresh/update proof plus Telegram package proof चलाता है, plugin npm और ClawHub plans record करता है,
   और evidence bundle green होने के बाद ही exact
   `OpenClaw Release Publish` command print करता है।
   `OpenClaw Release Publish` selected या सभी publishable plugin
   packages को npm और उसी set को ClawHub पर parallel में dispatch करता है, और फिर plugin npm publish
   सफल होते ही matching dist-tag के साथ prepared OpenClaw npm preflight artifact promote करता है।
   OpenClaw npm publish child सफल होने के बाद, यह complete matching
   `CHANGELOG.md` section से matching GitHub release/prerelease page create या update करता है।
   npm `latest` पर प्रकाशित stable releases GitHub latest release बनते हैं; npm `beta` पर रखे गए
   stable maintenance releases GitHub `latest=false` के साथ create होते हैं। Workflow preflight
   dependency evidence, full-validation manifest, और postpublish registry
   verification evidence को post-release incident response के लिए GitHub release पर upload भी करता है।
   Publish workflow तुरंत child run IDs print करता है, workflow token द्वारा approve किए जा सकने वाले
   release environment gates auto-approve करता है, failed child jobs को log tails के साथ summarize करता है,
   OpenClaw npm publish सफल होते ही GitHub release और dependency
   evidence close out करता है, OpenClaw npm publish हो रहा हो तो ClawHub का wait करता है,
   फिर `pnpm release:verify-beta` चलाता है और GitHub release, npm package, selected
   plugin npm packages, selected ClawHub packages, child workflow run IDs, और
   optional NPM Telegram run ID के लिए postpublish evidence upload करता है। ClawHub path transient CLI
   dependency install failures retry करता है, एक preview cell flake होने पर भी preview-passing plugins publish करता है,
   और हर expected plugin version के लिए registry verification के साथ समाप्त होता है ताकि partial publishes
   visible और retryable रहें। फिर published
   `openclaw@YYYY.M.PATCH-beta.N` या
   `openclaw@beta` package के विरुद्ध post-publish
   package acceptance चलाएं। अगर pushed या published prerelease को fix चाहिए,
   अगला matching prerelease number काटें; पुराने
   prerelease को delete या rewrite न करें।
10. Stable के लिए, केवल तब continue करें जब vetted beta या release candidate के पास
    required validation evidence हो। Stable npm publish भी
    `OpenClaw Release Publish` से होकर जाता है, successful preflight artifact को
    `preflight_run_id` के जरिए reuse करते हुए; stable macOS release readiness के लिए
    packaged `.zip`, `.dmg`, `.dSYM.zip`, और updated `appcast.xml` भी `main` पर required हैं।
    macOS publish workflow release assets verify होने के बाद signed appcast को public `main` पर
    automatically publish करता है; अगर branch protection direct push block करता है,
    तो यह appcast PR खोलता या update करता है। Stable Windows Hub
    readiness के लिए OpenClaw GitHub release पर signed `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe`, और
    `OpenClawCompanion-SHA256SUMS.txt` assets required हैं।
    Exact signed `openclaw/openclaw-windows-node` release tag को
    `windows_node_tag` के रूप में और उसके candidate-approved installer digest map को
    `windows_node_installer_digests` के रूप में pass करें; `OpenClaw Release Publish`
    release draft रखता है, `Windows Node Release` dispatch करता है, और publication से पहले सभी तीन
    assets verify करता है।
11. Publish के बाद, npm post-publish verifier, optional standalone
    published-npm Telegram E2E जब post-publish channel proof चाहिए,
    dist-tag promotion जब जरूरत हो, generated GitHub release page verify करें,
    release announcement steps चलाएं, फिर stable release finished कहने से पहले [Stable main
    closeout](#stable-main-closeout) complete करें।

## Stable main closeout

Stable publication तब तक complete नहीं है जब तक `main` में actual shipped
release state न हो।

1. Fresh latest `main` से शुरू करें। इसके विरुद्ध `release/YYYY.M.PATCH` audit करें और
   `main` से absent real fixes forward-port करें। Release-only compatibility,
   test, या validation adapters को newer `main` में blindly merge न करें।
2. `main` को shipped stable version पर set करें, speculative next train पर नहीं। Root version change के बाद
   `pnpm release:prep` चलाएं, फिर
   `pnpm deps:shrinkwrap:generate`।
3. `main` पर `CHANGELOG.md` का `## YYYY.M.PATCH` section tagged release branch से exactly match कराएं।
   जब mac release ने stable `appcast.xml` update publish किया हो तो उसे include करें।
4. Operator द्वारा explicitly उस release train को start किए जाने तक `main` में
   `YYYY.M.PATCH+1`, beta version, या empty future changelog
   section add न करें।
5. `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, और
   `OPENCLAW_TESTBOX=1 pnpm check:changed` चलाएं। Push करें, फिर stable release
   done कहने से पहले verify करें कि `origin/main` में shipped version और changelog हैं।
6. हर private rollback drill के बाद repository variables `RELEASE_ROLLBACK_DRILL_ID` और
   `RELEASE_ROLLBACK_DRILL_DATE` current रखें।
   `OpenClaw Stable Main Closeout` stable publication के बाद shipped version, changelog, और appcast ले जाने वाले
   `main` push से start करता है। यह shipped tag को उसके Full Release
   Validation और Publish runs से bind करने के लिए immutable postpublish evidence पढ़ता है,
   फिर stable main state, release, mandatory stable soak, और blocking performance evidence verify करता है।
   यह GitHub release में immutable closeout manifest और checksum attach करता है। Automatic
   push trigger उन legacy releases को skip करता है जो immutable postpublish
   evidence से पहले के हैं; यह उस skip को कभी completed closeout नहीं मानता। Complete
   closeout के लिए दोनों assets और matching checksum required हैं। Partial manifest
   identical bytes regenerate करने के लिए अपना recorded `main` SHA और rollback drill replay करता है,
   फिर missing checksum attach करता है; invalid pair, या manifest के बिना checksum,
   blocking रहता है। Rollback drill repository variables के बिना push-triggered run closeout complete किए बिना skip करता है;
   missing या 90-day से अधिक पुराना drill record अभी भी manual evidence-backed
   closeout को block करता है। Private recovery commands maintainer-only runbook में रहती हैं।
   Evidence-backed stable closeout को repair या replay करने के लिए ही manual dispatch use करें।
   Legacy fallback correction tag base-package evidence केवल तब reuse कर सकता है जब
   correction tag उसी source commit पर resolve हो जिस पर base stable tag है।
   Different source वाली correction को अपना package
   evidence publish और verify करना होगा।

## Release preflight

- रिलीज़ प्रीफ्लाइट से पहले `pnpm check:test-types` चलाएँ ताकि टेस्ट TypeScript तेज़ स्थानीय `pnpm check` गेट के बाहर भी
  कवर रहे
- रिलीज़ प्रीफ्लाइट से पहले `pnpm check:architecture` चलाएँ ताकि व्यापक import
  cycle और architecture boundary जाँचें तेज़ स्थानीय गेट के बाहर हरी रहें
- `pnpm release:check` से पहले `pnpm build && pnpm ui:build` चलाएँ ताकि अपेक्षित
  `dist/*` रिलीज़ artifacts और Control UI bundle pack
  validation step के लिए मौजूद हों
- root version bump के बाद और tagging से पहले `pnpm release:prep` चलाएँ। यह
  हर deterministic release generator चलाता है जो आम तौर पर
  version/config/API बदलाव के बाद drift करता है: plugin versions, plugin inventory, base config
  schema, bundled channel config metadata, config docs baseline, plugin SDK
  exports, और plugin SDK API baseline. `pnpm release:check` उन
  guards को check mode में फिर से चलाता है और package release checks चलाने से पहले एक
  pass में मिले हर generated drift failure की रिपोर्ट करता है।
- Plugin version sync official plugin package versions और मौजूदा
  `openclaw.compat.pluginApi` floors को default रूप से OpenClaw release version पर अपडेट करता है।
  उस field को plugin SDK/runtime API floor मानें, सिर्फ package version की copy नहीं:
  plugin-only releases के लिए जो जानबूझकर पुराने OpenClaw hosts के साथ
  compatible रहते हैं, floor को सबसे पुराने supported
  host API पर रखें और उस choice को plugin release proof में document करें।
- release approval से पहले manual `Full Release Validation` workflow चलाएँ ताकि
  सभी pre-release test boxes एक entrypoint से शुरू हों। यह branch,
  tag, या full commit SHA स्वीकार करता है, manual `CI` dispatch करता है, और install smoke, package acceptance, cross-OS
  package checks, QA Lab parity, Matrix, और Telegram lanes के लिए
  `OpenClaw Release Checks` dispatch करता है। Stable और full
  runs में हमेशा exhaustive live/E2E और Docker release-path soak शामिल होते हैं;
  `run_release_soak=true` explicit beta soak के लिए रखा गया है। Package
  Acceptance candidate validation के दौरान canonical package Telegram E2E देता है,
  जिससे दूसरा concurrent live poller बचता है।
  beta publish करने के बाद `release_package_spec` दें ताकि shipped
  npm package को release checks, Package Acceptance, और package Telegram
  E2E में release tarball rebuild किए बिना reuse किया जा सके। `npm_telegram_package_spec`
  केवल तब दें जब Telegram को बाकी release validation से अलग
  published package इस्तेमाल करना हो। `package_acceptance_package_spec` तब दें जब Package Acceptance को
  release package spec से अलग published package इस्तेमाल करना हो। `evidence_package_spec`
  तब दें जब release evidence report को यह साबित करना हो कि
  validation published npm package से मेल खाता है, बिना Telegram E2E को force किए।
  उदाहरण:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- manual `Package Acceptance` workflow तब चलाएँ जब release work जारी रहते हुए package candidate के लिए side-channel proof चाहिए। `source=npm` का उपयोग
  `openclaw@beta`, `openclaw@latest`, या exact release version के लिए करें; `source=ref`
  का उपयोग current `workflow_ref` harness के साथ trusted `package_ref` branch/tag/SHA pack करने के लिए करें; `source=url` का उपयोग public HTTPS tarball के लिए करें जिसमें
  required SHA-256 और strict public URL policy हो; `source=trusted-url` का उपयोग
  required `trusted_source_id` और SHA-256 वाली named trusted-source policy के लिए करें; या
  `source=artifact` का उपयोग किसी अन्य GitHub Actions run द्वारा uploaded tarball के लिए करें। यह
  workflow candidate को
  `package-under-test` में resolve करता है, उस tarball के विरुद्ध Docker E2E release scheduler reuse करता है,
  और उसी tarball के विरुद्ध
  `telegram_mode=mock-openai` या `telegram_mode=live-frontier` के साथ Telegram QA चला सकता है। जब
  selected Docker lanes में `published-upgrade-survivor` शामिल हो, package
  artifact candidate होता है और `published_upgrade_survivor_baseline` published baseline चुनता है।
  `update-restart-auth` candidate package को installed CLI और package-under-test दोनों के रूप में इस्तेमाल करता है ताकि यह
  candidate update command के managed restart path को exercise करे।
  उदाहरण: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  सामान्य profiles:
  - `smoke`: install/channel/agent, gateway network, और config reload lanes
  - `package`: OpenWebUI या live ClawHub के बिना artifact-native package/update/restart/plugin lanes
  - `product`: package profile के साथ MCP channels, cron/subagent cleanup,
    OpenAI web search, और OpenWebUI
  - `full`: OpenWebUI के साथ Docker release-path chunks
  - `custom`: focused rerun के लिए exact `docker_lanes` selection
- manual `CI` workflow सीधे तब चलाएँ जब आपको release candidate के लिए केवल deterministic normal
  CI coverage चाहिए। Manual CI dispatches changed
  scoping को bypass करते हैं और Linux Node shards, bundled-plugin shards, plugin और
  channel contract shards, Node 22 compatibility, `check-*`, `check-additional-*`,
  built-artifact smoke checks, docs checks, Python skills, Windows, macOS, और
  Control UI i18n lanes को force करते हैं। Standalone manual CI Android केवल तब चलाता है जब
  `include_android=true` के साथ dispatch किया गया हो; `Full Release Validation` अपने CI child के लिए
  वह input pass करता है।
  Android के साथ उदाहरण: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- release telemetry validate करते समय `pnpm qa:otel:smoke` चलाएँ। यह
  QA-lab को local OTLP/HTTP receiver के माध्यम से exercise करता है और trace, metric, और log
  export के साथ bounded trace attributes और content/identifier redaction verify करता है,
  बिना Opik, Langfuse, या किसी अन्य external collector की आवश्यकता के।
- collector compatibility validate करते समय `pnpm qa:otel:collector-smoke` चलाएँ।
  यह local receiver assertions से पहले उसी QA-lab OTLP export को real OpenTelemetry Collector
  Docker container के माध्यम से route करता है।
- protected Prometheus scraping validate करते समय `pnpm qa:prometheus:smoke` चलाएँ।
  यह QA-lab को exercise करता है, unauthenticated scrapes को reject करता है, और verify करता है कि
  release-critical metric families prompt content, raw identifiers,
  auth tokens, और local paths से मुक्त रहें।
- जब आप source-checkout OpenTelemetry और Prometheus smoke lanes को back to back चलाना चाहते हों, `pnpm qa:observability:smoke` चलाएँ।
- हर tagged release से पहले `pnpm release:check` चलाएँ
- `OpenClaw NPM Release` preflight npm tarball pack करने से पहले
  dependency release evidence generate करता है। npm advisory vulnerability gate
  release-blocking है। transitive manifest risk, dependency ownership/install
  surface, और dependency change reports केवल release evidence हैं। dependency change report
  release candidate की तुलना पिछले reachable release tag से करती है।
- preflight dependency evidence को
  `openclaw-release-dependency-evidence-<tag>` के रूप में upload करता है और prepared npm preflight artifact के अंदर
  `dependency-evidence/` के तहत embed भी करता है। real
  publish path उस preflight artifact को reuse करता है, फिर वही evidence
  GitHub release में `openclaw-<version>-dependency-evidence.zip` के रूप में attach करता है।
- tag मौजूद होने के बाद mutating publish sequence के लिए `OpenClaw Release Publish` चलाएँ।
  इसे `release/YYYY.M.PATCH` से dispatch करें (या main-reachable tag publish करते समय `main` से),
  release tag, successful OpenClaw npm
  `preflight_run_id`, और successful `full_release_validation_run_id` pass करें, और default plugin publish scope
  `all-publishable` रखें जब तक आप जानबूझकर focused repair न चला रहे हों। workflow plugin npm publish, plugin
  ClawHub publish, और OpenClaw npm publish को serialize करता है ताकि core package अपने externalized plugins से पहले publish न हो।
- Stable `OpenClaw Release Publish` को matching non-prerelease
  `openclaw/openclaw-windows-node` release मौजूद होने के बाद exact `windows_node_tag` चाहिए।
  इसे candidate-approved `windows_node_installer_digests` map भी चाहिए।
  किसी भी publish child को dispatch करने से पहले, यह verify करता है कि source release
  published है, non-prerelease है, required x64/ARM64 installers रखता है, और
  अब भी उस approved map से match करता है। फिर यह OpenClaw release के अभी draft रहते
  `Windows Node Release` dispatch करता है, pinned installer
  digest map को unchanged carry करते हुए। child
  workflow उस exact tag से signed Windows Hub installers download करता है,
  उन्हें pinned digests से match करता है, verify करता है कि उनके Authenticode
  signatures Windows runner पर expected OpenClaw Foundation signer का उपयोग करते हैं,
  SHA-256 manifest लिखता है, और installers plus manifest को
  canonical OpenClaw GitHub release पर upload करता है, फिर promoted assets को re-download करता है और
  manifest membership और hashes verify करता है। parent publication से पहले current
  x64, ARM64, और checksum asset contract verify करता है। Direct recovery
  unexpected `OpenClawCompanion-*` asset names को reject करता है, उसके बाद expected contract assets को
  pinned source bytes से replace करता है। `Windows Node Release` को केवल recovery के लिए manually dispatch करें,
  और हमेशा exact tag pass करें, कभी `latest` नहीं, साथ में approved source release से explicit
  `expected_installer_digests` JSON map। Website download links को current stable release के exact OpenClaw
  release asset URLs पर target करना चाहिए, या
  `releases/latest/download/...` पर केवल GitHub का latest redirect verify करने के बाद कि
  वह उसी release की ओर point करता है; केवल companion repo release
  page से link न करें।
- Release checks अब separate manual workflow में चलते हैं:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` release approval से पहले QA Lab mock parity lane के साथ fast
  live Matrix profile और Telegram QA lane भी चलाता है। live
  lanes `qa-live-shared` environment का उपयोग करते हैं; Telegram Convex CI
  credential leases भी उपयोग करता है। जब आपको full Matrix
  transport, media, और E2EE inventory parallel में चाहिए, manual `QA-Lab - All Lanes` workflow
  `matrix_profile=all` और `matrix_shards=true` के साथ चलाएँ।
- Cross-OS install और upgrade runtime validation public
  `OpenClaw Release Checks` और `Full Release Validation` का हिस्सा है, जो
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` को directly call करते हैं
- यह split intentional है: real npm release path को short,
  deterministic, और artifact-focused रखें, जबकि slower live checks अपनी lane में रहें ताकि वे publish को stall या block न करें
- secret-bearing release checks को `Full Release
Validation` के माध्यम से या `main`/release workflow ref से dispatch करना चाहिए ताकि workflow logic और
  secrets controlled रहें
- `OpenClaw Release Checks` branch, tag, या full commit SHA स्वीकार करता है, जब तक
  resolved commit किसी OpenClaw branch या release tag से reachable हो
- `OpenClaw NPM Release` validation-only preflight भी current
  full 40-character workflow-branch commit SHA स्वीकार करता है, pushed tag की आवश्यकता के बिना
- वह SHA path validation-only है और उसे real publish में promote नहीं किया जा सकता
- SHA mode में workflow केवल package metadata check के लिए `v<package.json version>` synthesize करता है; real publish के लिए अब भी real release tag चाहिए
- दोनों workflows real publish और promotion path को GitHub-hosted
  runners पर रखते हैं, जबकि non-mutating validation path बड़े
  Blacksmith Linux runners का उपयोग कर सकता है
- वह workflow
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  को `OPENAI_API_KEY` और `ANTHROPIC_API_KEY` workflow secrets दोनों का उपयोग करके चलाता है
- npm release preflight अब separate release checks lane का इंतज़ार नहीं करता
- release candidate को locally tag करने से पहले,
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` चलाएँ। helper
  fast release guardrails, plugin npm/ClawHub release checks, build,
  UI build, और `release:openclaw:npm:check` को उस order में चलाता है जो GitHub publish workflow शुरू होने से पहले common
  approval-blocking mistakes पकड़ता है।
- approval से पहले `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (या matching beta/correction tag) चलाएँ
- npm publish के बाद, चलाएँ
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (या मेल खाने वाला बीटा/सुधार संस्करण) ताकि प्रकाशित रजिस्ट्री
  इंस्टॉल पथ को एक नए अस्थायी प्रीफ़िक्स में सत्यापित किया जा सके
- बीटा प्रकाशित होने के बाद, `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` चलाएँ
  ताकि साझा लीज़ किए गए Telegram क्रेडेंशियल पूल का उपयोग करके प्रकाशित npm पैकेज के विरुद्ध
  इंस्टॉल किए गए पैकेज की ऑनबोर्डिंग, Telegram सेटअप, और वास्तविक Telegram E2E
  सत्यापित किए जा सकें। स्थानीय मेंटेनर के एकबारगी रन Convex vars छोड़ सकते हैं और तीनों
  `OPENCLAW_QA_TELEGRAM_*` env क्रेडेंशियल सीधे पास कर सकते हैं।
- मेंटेनर मशीन से पूरा पोस्ट-पब्लिश बीटा स्मोक चलाने के लिए, `pnpm release:beta-smoke -- --beta betaN` उपयोग करें। सहायक Parallels npm अपडेट/फ्रेश-टारगेट सत्यापन चलाता है, `NPM Telegram Beta E2E` डिस्पैच करता है, सटीक workflow run को पोल करता है, artifact डाउनलोड करता है, और Telegram रिपोर्ट प्रिंट करता है।
- मेंटेनर GitHub Actions से भी वही पोस्ट-पब्लिश जाँच
  मैनुअल `NPM Telegram Beta E2E` workflow के ज़रिए चला सकते हैं। यह जानबूझकर केवल मैनुअल है और
  हर merge पर नहीं चलता।
- मेंटेनर रिलीज़ ऑटोमेशन अब preflight-then-promote उपयोग करता है:
  - वास्तविक npm publish के लिए सफल npm `preflight_run_id` पास होना आवश्यक है
  - वास्तविक npm publish उसी `main` या
    `release/YYYY.M.PATCH` branch से डिस्पैच होना चाहिए जिससे सफल preflight run हुआ था
  - स्थिर npm releases का डिफ़ॉल्ट `beta` होता है
  - स्थिर npm publish workflow input के ज़रिए स्पष्ट रूप से `latest` को target कर सकता है
  - token-आधारित npm dist-tag mutation अब
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` में रहती है क्योंकि
    `npm dist-tag add` को अभी भी `NPM_TOKEN` चाहिए, जबकि source repo
    OIDC-only publish रखता है
  - सार्वजनिक `macOS Release` केवल validation-only है; जब कोई tag केवल
    release branch पर हो लेकिन workflow `main` से dispatch किया गया हो, तो
    `public_release_branch=release/YYYY.M.PATCH` सेट करें
  - वास्तविक macOS publish के लिए सफल macOS `preflight_run_id` और
    `validate_run_id` पास होना आवश्यक है
  - वास्तविक publish paths artifacts को फिर से rebuild करने के बजाय तैयार artifacts को promote करते हैं
- `YYYY.M.PATCH-N` जैसे स्थिर correction releases के लिए, post-publish verifier
  `YYYY.M.PATCH` से `YYYY.M.PATCH-N` तक उसी temp-prefix upgrade path की भी जाँच करता है
  ताकि release corrections चुपचाप पुराने global installs को
  base stable payload पर न छोड़ सकें
- npm release preflight तब तक fail closed होता है जब तक tarball में
  `dist/control-ui/index.html` और non-empty `dist/control-ui/assets/` payload दोनों शामिल न हों
  ताकि हम फिर से खाली browser dashboard ship न करें
- Post-publish verification यह भी जाँचता है कि प्रकाशित Plugin entrypoints और
  package metadata installed registry layout में मौजूद हैं। ऐसी release जो
  Plugin runtime payloads के बिना ship होती है, postpublish verifier में fail होती है और
  `latest` पर promote नहीं की जा सकती।
- `pnpm test:install:smoke` candidate update tarball पर npm pack `unpackedSize` budget भी enforce करता है,
  ताकि installer e2e release publish path से पहले accidental pack bloat पकड़ सके
- अगर release work ने CI planning, extension timing manifests, या
  extension test matrices को छुआ है, तो approval से पहले
  `.github/workflows/plugin-prerelease.yml` से planner-owned
  `plugin-prerelease-extension-shard` matrix outputs फिर से generate और review करें
  ताकि release notes stale CI layout का वर्णन न करें
- स्थिर macOS release readiness में updater surfaces भी शामिल हैं:
  - GitHub release में अंततः packaged `.zip`, `.dmg`, और `.dSYM.zip` होने चाहिए
  - publish के बाद `main` पर `appcast.xml` नए stable zip की ओर point करना चाहिए; macOS publish workflow
    इसे automatically commit करता है, या direct push blocked होने पर appcast
    PR खोलता है
  - packaged app को non-debug bundle id, non-empty Sparkle feed
    URL, और उस release version के canonical Sparkle build floor पर या उससे ऊपर का `CFBundleVersion`
    बनाए रखना चाहिए

## रिलीज़ परीक्षण बॉक्स

`Full Release Validation` वह तरीका है जिससे ऑपरेटर सभी प्री-रिलीज़ परीक्षणों को
एक ही प्रवेश बिंदु से शुरू करते हैं। तेज़ी से बदलती शाखा पर पिन किए गए कमिट प्रमाण के लिए,
हेल्पर का उपयोग करें ताकि हर चाइल्ड कार्यप्रवाह लक्ष्य
SHA पर तय अस्थायी शाखा से चले:

```bash
pnpm ci:full-release --sha <full-sha>
```

हेल्पर `release-ci/<sha>-...` पुश करता है, उस शाखा से `Full Release Validation`
को `ref=<sha>` के साथ डिस्पैच करता है, सत्यापित करता है कि हर चाइल्ड कार्यप्रवाह `headSha`
लक्ष्य से मेल खाता है, फिर अस्थायी शाखा हटा देता है। इससे गलती से किसी
नए `main` चाइल्ड रन को प्रमाणित करने से बचाव होता है।

रिलीज़ शाखा या टैग सत्यापन के लिए, इसे भरोसेमंद `main` कार्यप्रवाह
रेफ से चलाएँ और रिलीज़ शाखा या टैग को `ref` के रूप में पास करें:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

कार्यप्रवाह लक्ष्य रेफ का समाधान करता है, मैनुअल `CI` को
`target_ref=<release-ref>` के साथ डिस्पैच करता है, फिर `OpenClaw Release Checks` डिस्पैच करता है।
`OpenClaw Release Checks` इंस्टॉल स्मोक, क्रॉस-ओएस रिलीज़ जाँच,
सोक सक्षम होने पर लाइव/E2E Docker रिलीज़-पाथ कवरेज, कैनोनिकल Telegram पैकेज E2E के साथ Package Acceptance,
QA Lab समानता, लाइव Matrix, और लाइव
Telegram को फैलाकर चलाता है। फुल/ऑल रन केवल तब स्वीकार्य है जब `Full Release Validation`
सारांश में `normal_ci`, `plugin_prerelease`, और `release_checks`
सफल दिखें, जब तक कि किसी केंद्रित री-रन ने अलग `Plugin
Prerelease` चाइल्ड को जानबूझकर न छोड़ा हो। स्टैंडअलोन `npm-telegram` चाइल्ड का उपयोग केवल
`release_package_spec` या `npm_telegram_package_spec` के साथ केंद्रित
प्रकाशित-पैकेज री-रन के लिए करें। अंतिम सत्यापक सारांश में हर चाइल्ड रन के लिए
सबसे धीमी जॉब तालिकाएँ शामिल होती हैं, ताकि रिलीज़ प्रबंधक लॉग डाउनलोड किए बिना
मौजूदा महत्वपूर्ण पथ देख सके।
पूर्ण चरण मैट्रिक्स, सटीक कार्यप्रवाह जॉब नाम, स्थिर बनाम पूर्ण प्रोफ़ाइल
अंतर, आर्टिफैक्ट, और केंद्रित री-रन हैंडल के लिए [पूर्ण रिलीज़ सत्यापन](/hi/reference/full-release-validation) देखें।
चाइल्ड कार्यप्रवाह उस भरोसेमंद रेफ से डिस्पैच होते हैं जो `Full Release
Validation` चलाता है, सामान्यतः `--ref main`, भले ही लक्ष्य `ref` किसी
पुरानी रिलीज़ शाखा या टैग की ओर इशारा करता हो। अलग Full Release Validation
कार्यप्रवाह-रेफ इनपुट नहीं है; कार्यप्रवाह रन रेफ चुनकर भरोसेमंद हार्नेस चुनें।
चलते हुए `main` पर सटीक कमिट प्रमाण के लिए `--ref main -f ref=<sha>` का उपयोग न करें;
कच्चे कमिट SHA कार्यप्रवाह डिस्पैच रेफ नहीं हो सकते, इसलिए
पिन की गई अस्थायी शाखा बनाने के लिए `pnpm ci:full-release --sha <sha>` का उपयोग करें।

लाइव/प्रदाता विस्तार चुनने के लिए `release_profile` का उपयोग करें:

- `minimum`: सबसे तेज़ रिलीज़-महत्वपूर्ण OpenAI/core लाइव और Docker पाथ
- `stable`: रिलीज़ स्वीकृति के लिए न्यूनतम के साथ स्थिर प्रदाता/बैकएंड कवरेज
- `full`: स्थिर के साथ व्यापक सलाहकारी प्रदाता/मीडिया कवरेज

स्थिर और पूर्ण सत्यापन हमेशा प्रमोशन से पहले विस्तृत लाइव/E2E, Docker
रिलीज़-पाथ, और सीमित प्रकाशित अपग्रेड-सर्वाइवर स्वीप चलाते हैं।
बीटा के लिए वही स्वीप माँगने के लिए `run_release_soak=true` का उपयोग करें। वह स्वीप
नवीनतम चार स्थिर पैकेजों के साथ पिन किए गए `2026.4.23` और `2026.5.2`
बेसलाइन तथा पुराने `2026.4.15` कवरेज को कवर करता है, डुप्लिकेट बेसलाइन हटाता है और
हर बेसलाइन को उसके अपने Docker रनर जॉब में शार्ड करता है।

`OpenClaw Release Checks` लक्ष्य रेफ को एक बार `release-package-under-test` के रूप में
समाधान करने के लिए भरोसेमंद कार्यप्रवाह रेफ का उपयोग करता है और सोक चलने पर उस आर्टिफैक्ट को
क्रॉस-ओएस, Package Acceptance, और रिलीज़-पाथ Docker जाँचों में फिर से उपयोग करता है। इससे
सभी पैकेज-फेसिंग बॉक्स समान बाइट्स पर रहते हैं और बार-बार पैकेज बिल्ड से बचते हैं।
बीटा npm पर पहले से मौजूद होने के बाद, `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` सेट करें
ताकि रिलीज़ जाँचें शिप किए गए पैकेज को एक बार डाउनलोड करें, `dist/build-info.json` से उसका बिल्ड स्रोत
SHA निकालें, और उस आर्टिफैक्ट को क्रॉस-ओएस,
Package Acceptance, रिलीज़-पाथ Docker, और पैकेज Telegram लेनों के लिए फिर से उपयोग करें।
क्रॉस-ओएस OpenAI इंस्टॉल स्मोक `OPENCLAW_CROSS_OS_OPENAI_MODEL` का उपयोग करता है जब
रेपो/संगठन वेरिएबल सेट हो, अन्यथा `openai/gpt-5.4`, क्योंकि यह लेन
सबसे धीमे डिफ़ॉल्ट मॉडल की बेंचमार्किंग के बजाय पैकेज इंस्टॉल, ऑनबोर्डिंग,
Gateway स्टार्टअप, और एक लाइव एजेंट टर्न प्रमाणित कर रही है। व्यापक लाइव प्रदाता
मैट्रिक्स मॉडल-विशिष्ट कवरेज के लिए स्थान बना रहता है।

रिलीज़ चरण के आधार पर ये वेरिएंट उपयोग करें:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

केंद्रित फ़िक्स के बाद पहले री-रन के रूप में पूर्ण अम्ब्रेला का उपयोग न करें। यदि एक बॉक्स
विफल होता है, तो अगले प्रमाण के लिए विफल चाइल्ड कार्यप्रवाह, जॉब, Docker लेन,
पैकेज प्रोफ़ाइल, मॉडल प्रदाता, या QA लेन का उपयोग करें। पूर्ण अम्ब्रेला फिर से केवल तब चलाएँ
जब फ़िक्स ने साझा रिलीज़ ऑर्केस्ट्रेशन बदला हो या पहले के ऑल-बॉक्स प्रमाण को
बासी बना दिया हो। अम्ब्रेला का अंतिम सत्यापक दर्ज चाइल्ड कार्यप्रवाह रन
आईडी को फिर से जाँचता है, इसलिए किसी चाइल्ड कार्यप्रवाह के सफलतापूर्वक फिर से चलने के बाद, केवल विफल
`Verify full validation` पैरेंट जॉब को फिर से चलाएँ।

सीमित रिकवरी के लिए, अम्ब्रेला को `rerun_group` पास करें। `all` वास्तविक
रिलीज़-कैंडिडेट रन है, `ci` केवल सामान्य CI चाइल्ड चलाता है, `plugin-prerelease`
केवल रिलीज़-ओनली Plugin चाइल्ड चलाता है, `release-checks` हर रिलीज़
बॉक्स चलाता है, और संकरे रिलीज़ समूह `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, और `npm-telegram` हैं।
केंद्रित `npm-telegram` री-रन के लिए `release_package_spec` या
`npm_telegram_package_spec` आवश्यक है; पूर्ण/ऑल रन Package Acceptance के अंदर कैनोनिकल पैकेज Telegram
E2E का उपयोग करते हैं। केंद्रित
क्रॉस-ओएस री-रन `cross_os_suite_filter=windows/packaged-upgrade` या
दूसरा ओएस/सुइट फ़िल्टर जोड़ सकते हैं। QA रिलीज़-जाँच विफलताएँ सामान्य रिलीज़
सत्यापन को रोकती हैं, जिसमें मानक टियर में आवश्यक OpenClaw डायनेमिक टूल ड्रिफ्ट शामिल है।
Tideclaw अल्फा रन अब भी गैर-पैकेज-सुरक्षा रिलीज़-जाँच लेनों को
सलाहकारी मान सकते हैं। जब `live_suite_filter` स्पष्ट रूप से Discord, WhatsApp, या Slack जैसी
गेटेड QA लाइव लेन माँगता है, तो मेल खाने वाला
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` रेपो वेरिएबल सक्षम होना चाहिए; अन्यथा
इनपुट कैप्चर लेन को चुपचाप छोड़ने के बजाय विफल हो जाता है।

### Vitest

Vitest बॉक्स मैनुअल `CI` चाइल्ड कार्यप्रवाह है। मैनुअल CI जानबूझकर
बदले हुए स्कोपिंग को बायपास करता है और रिलीज़
कैंडिडेट के लिए सामान्य परीक्षण ग्राफ को मजबूर करता है: Linux Node शार्ड, बंडल्ड-Plugin शार्ड,
Plugin और चैनल कॉन्ट्रैक्ट शार्ड, Node 22 संगतता, `check-*`, `check-additional-*`,
बिल्ट-आर्टिफैक्ट स्मोक जाँचें, डॉक्स जाँचें, Python Skills, Windows, macOS,
और Control UI i18n। Android शामिल होता है जब `Full Release Validation` बॉक्स चलाता है
क्योंकि अम्ब्रेला `include_android=true` पास करता है; स्टैंडअलोन मैनुअल CI को
Android कवरेज के लिए `include_android=true` चाहिए।

इस बॉक्स का उपयोग इस प्रश्न का उत्तर देने के लिए करें: "क्या स्रोत ट्री ने पूरा सामान्य परीक्षण सुइट पास किया?"
यह रिलीज़-पाथ उत्पाद सत्यापन जैसा नहीं है। रखने योग्य प्रमाण:

- `Full Release Validation` सारांश जिसमें डिस्पैच किए गए `CI` रन URL दिखे
- सटीक लक्ष्य SHA पर हरा `CI` रन
- रिग्रेशन की जाँच करते समय CI जॉब से विफल या धीमे शार्ड नाम
- जब किसी रन को प्रदर्शन विश्लेषण चाहिए, तब `.artifacts/vitest-shard-timings.json` जैसे Vitest टाइमिंग आर्टिफैक्ट

मैनुअल CI सीधे केवल तब चलाएँ जब रिलीज़ को निर्धार्य सामान्य CI चाहिए लेकिन
Docker, QA Lab, लाइव, क्रॉस-ओएस, या पैकेज बॉक्स नहीं चाहिए। गैर-Android प्रत्यक्ष CI के लिए
पहला कमांड उपयोग करें। जब प्रत्यक्ष
रिलीज़-कैंडिडेट CI को Android कवर करना हो, तो `include_android=true` जोड़ें:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker बॉक्स `OpenClaw Release Checks` में
`openclaw-live-and-e2e-checks-reusable.yml` के माध्यम से रहता है, साथ ही रिलीज़-मोड
`install-smoke` कार्यप्रवाह भी। यह रिलीज़ कैंडिडेट को केवल स्रोत-स्तर परीक्षणों के बजाय
पैकेज्ड Docker वातावरणों के माध्यम से सत्यापित करता है।

रिलीज़ Docker कवरेज में शामिल है:

- धीमे Bun ग्लोबल इंस्टॉल स्मोक के साथ पूर्ण इंस्टॉल स्मोक
- लक्ष्य SHA द्वारा रूट Dockerfile स्मोक इमेज तैयारी/रीयूज़, जहाँ QR,
  root/gateway, और installer/Bun स्मोक जॉब अलग install-smoke
  शार्ड के रूप में चलती हैं
- रिपॉज़िटरी E2E लेन
- रिलीज़-पाथ Docker चंक: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, और `plugins-runtime-install-h`
- माँगे जाने पर `plugins-runtime-services` चंक के अंदर OpenWebUI कवरेज
- विभाजित बंडल्ड Plugin इंस्टॉल/अनइंस्टॉल लेन
  `bundled-plugin-install-uninstall-0` से
  `bundled-plugin-install-uninstall-23` तक
- जब रिलीज़ जाँचों में लाइव सुइट शामिल हों, तब लाइव/E2E प्रदाता सुइट और Docker लाइव मॉडल कवरेज

री-रन से पहले Docker आर्टिफैक्ट का उपयोग करें। रिलीज़-पाथ शेड्यूलर
`.artifacts/docker-tests/` अपलोड करता है जिसमें लेन लॉग, `summary.json`, `failures.json`,
फेज़ टाइमिंग, शेड्यूलर प्लान JSON, और री-रन कमांड शामिल होते हैं। केंद्रित रिकवरी के लिए,
सभी रिलीज़ चंक फिर से चलाने के बजाय रीयूज़ेबल लाइव/E2E कार्यप्रवाह पर
`docker_lanes=<lane[,lane]>` का उपयोग करें। जनरेट किए गए री-रन कमांड उपलब्ध होने पर पहले के
`package_artifact_run_id` और तैयार Docker इमेज इनपुट शामिल करते हैं, ताकि
विफल लेन वही टारबॉल और GHCR इमेज फिर से उपयोग कर सके।

### QA Lab

QA Lab बॉक्स भी `OpenClaw Release Checks` का हिस्सा है। यह एजेंटिक
व्यवहार और चैनल-स्तरीय रिलीज़ गेट है, Vitest और Docker
पैकेज मैकेनिक्स से अलग।

रिलीज़ QA Lab कवरेज में शामिल है:

- एजेंटिक समानता पैक का उपयोग करके OpenAI कैंडिडेट लेन की Opus 4.6
  बेसलाइन से तुलना करने वाली मॉक समानता लेन
- `qa-live-shared` वातावरण का उपयोग करने वाली तेज़ लाइव Matrix QA प्रोफ़ाइल
- Convex CI क्रेडेंशियल लीज़ का उपयोग करने वाली लाइव Telegram QA लेन
- जब रिलीज़ टेलीमेट्री को स्पष्ट स्थानीय प्रमाण चाहिए, तब `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke`, या
  `pnpm qa:observability:smoke`

इस बॉक्स का उपयोग इस प्रश्न का उत्तर देने के लिए करें: "क्या रिलीज़ QA परिदृश्यों और
लाइव चैनल फ्लो में सही व्यवहार करती है?" रिलीज़ स्वीकृत करते समय समानता, Matrix, और Telegram
लेनों के आर्टिफैक्ट URL रखें। पूर्ण Matrix कवरेज डिफ़ॉल्ट रिलीज़-महत्वपूर्ण लेन के बजाय
मैनुअल शार्डेड QA-Lab रन के रूप में उपलब्ध रहता है।

### पैकेज

पैकेज बॉक्स इंस्टॉल करने योग्य-उत्पाद गेट है। यह
`Package Acceptance` और रिज़ॉल्वर
`scripts/resolve-openclaw-package-candidate.mjs` पर आधारित है। रिज़ॉल्वर किसी
कैंडिडेट को Docker E2E द्वारा खाए जाने वाले `package-under-test` टारबॉल में सामान्यीकृत करता है, पैकेज इन्वेंटरी सत्यापित करता है,
पैकेज संस्करण और SHA-256 दर्ज करता है, और
कार्यप्रवाह हार्नेस रेफ को पैकेज स्रोत रेफ से अलग रखता है।

समर्थित कैंडिडेट स्रोत:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, या ठीक-ठीक OpenClaw रिलीज़
  संस्करण
- `source=ref`: चयनित `workflow_ref` हार्नेस के साथ कोई विश्वसनीय `package_ref` शाखा, टैग, या पूर्ण कमिट SHA
  पैक करें
- `source=url`: आवश्यक `package_sha256` के साथ सार्वजनिक HTTPS `.tgz` डाउनलोड करें;
  URL क्रेडेंशियल, गैर-डिफ़ॉल्ट HTTPS पोर्ट, निजी/आंतरिक/विशेष-उपयोग
  होस्टनाम या रिज़ॉल्व किए गए पते, और असुरक्षित रीडायरेक्ट अस्वीकार किए जाते हैं
- `source=trusted-url`: `.github/package-trusted-sources.json` में
  नामित नीति से आवश्यक `package_sha256` और `trusted_source_id` के साथ HTTPS `.tgz`
  डाउनलोड करें; `source=url` में इनपुट-स्तर निजी-नेटवर्क बाइपास जोड़ने के बजाय
  मेंटेनर-स्वामित्व वाले एंटरप्राइज़ मिरर या निजी पैकेज रिपॉज़िटरी के लिए इसका उपयोग करें
- `source=artifact`: किसी अन्य GitHub Actions रन द्वारा अपलोड किए गए `.tgz` का फिर से उपयोग करें

`OpenClaw Release Checks` `source=artifact`, तैयार रिलीज़ पैकेज आर्टिफ़ैक्ट,
`suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` के साथ पैकेज स्वीकृति चलाता है। पैकेज स्वीकृति उसी रिज़ॉल्व किए गए
टारबॉल के विरुद्ध माइग्रेशन, अपडेट, कॉन्फ़िगर किए गए-ऑथ अपडेट रीस्टार्ट, लाइव ClawHub skill इंस्टॉल,
पुरानी Plugin निर्भरता क्लीनअप, ऑफ़लाइन Plugin फ़िक्स्चर, Plugin अपडेट, और Telegram पैकेज QA बनाए रखती है।
ब्लॉकिंग रिलीज़ जाँचें डिफ़ॉल्ट नवीनतम प्रकाशित पैकेज बेसलाइन का उपयोग करती हैं; `run_release_soak=true`,
`release_profile=stable`, या `release_profile=full` वाला बीटा प्रोफ़ाइल `2026.4.23` से `latest`
तक हर स्थिर npm-प्रकाशित बेसलाइन और रिपोर्ट किए गए-इश्यू फ़िक्स्चर तक विस्तृत हो जाता है।
पहले से शिप किए गए उम्मीदवार के लिए `source=npm` के साथ, प्रकाशित करने से पहले SHA-समर्थित स्थानीय npm
टारबॉल के लिए `source=ref` के साथ, मेंटेनर-स्वामित्व वाले एंटरप्राइज़/निजी मिरर के लिए
`source=trusted-url` के साथ, या किसी अन्य GitHub Actions रन द्वारा अपलोड किए गए तैयार टारबॉल के लिए
`source=artifact` के साथ पैकेज स्वीकृति का उपयोग करें। यह अधिकांश पैकेज/अपडेट कवरेज का GitHub-नेटिव
प्रतिस्थापन है, जिसके लिए पहले Parallels की आवश्यकता होती थी। OS-विशिष्ट ऑनबोर्डिंग, इंस्टॉलर, और
प्लेटफ़ॉर्म व्यवहार के लिए क्रॉस-OS रिलीज़ जाँचें अब भी मायने रखती हैं, लेकिन पैकेज/अपडेट उत्पाद
मान्यता में पैकेज स्वीकृति को प्राथमिकता देनी चाहिए।

अपडेट और Plugin मान्यता के लिए कैनोनिकल चेकलिस्ट
[अपडेट और Plugin का परीक्षण](/hi/help/testing-updates-plugins) है। जब यह तय करना हो कि कौन-सी
स्थानीय, Docker, पैकेज स्वीकृति, या रिलीज़-जाँच लेन किसी Plugin इंस्टॉल/अपडेट, डॉक्टर क्लीनअप,
या प्रकाशित-पैकेज माइग्रेशन बदलाव को साबित करती है, तो इसका उपयोग करें। हर स्थिर `2026.4.23+`
पैकेज से विस्तृत प्रकाशित अपडेट माइग्रेशन एक अलग मैनुअल `Update Migration` वर्कफ़्लो है, Full Release CI
का हिस्सा नहीं।

लेगेसी पैकेज-स्वीकृति ढील जानबूझकर समय-सीमित है। `2026.4.25` तक के पैकेज npm पर पहले से प्रकाशित
मेटाडेटा गैप के लिए संगतता पथ का उपयोग कर सकते हैं: टारबॉल से गायब निजी QA इन्वेंट्री प्रविष्टियाँ,
गायब `gateway install --wrapper`, टारबॉल-व्युत्पन्न git फ़िक्स्चर में गायब पैच फ़ाइलें, गायब persisted
`update.channel`, लेगेसी Plugin इंस्टॉल-रिकॉर्ड स्थान, गायब मार्केटप्लेस इंस्टॉल-रिकॉर्ड persistence,
और `plugins update` के दौरान कॉन्फ़िग मेटाडेटा माइग्रेशन। प्रकाशित `2026.4.26` पैकेज स्थानीय बिल्ड
मेटाडेटा स्टैम्प फ़ाइलों के लिए चेतावनी दे सकता है जो पहले ही शिप की जा चुकी थीं। बाद के पैकेजों को
आधुनिक पैकेज अनुबंधों को पूरा करना होगा; वही गैप रिलीज़ मान्यता को विफल करते हैं।

जब रिलीज़ प्रश्न वास्तविक इंस्टॉल किए जा सकने वाले पैकेज के बारे में हो, तो व्यापक पैकेज स्वीकृति
प्रोफ़ाइल का उपयोग करें:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

सामान्य पैकेज प्रोफ़ाइल:

- `smoke`: त्वरित पैकेज इंस्टॉल/चैनल/एजेंट, Gateway नेटवर्क, और कॉन्फ़िग
  रीलोड लेन
- `package`: इंस्टॉल/अपडेट/रीस्टार्ट/Plugin पैकेज अनुबंध और लाइव ClawHub
  skill इंस्टॉल प्रमाण; यह रिलीज़-जाँच डिफ़ॉल्ट है
- `product`: `package` के साथ MCP चैनल, cron/सबएजेंट क्लीनअप, OpenAI वेब
  खोज, और OpenWebUI
- `full`: OpenWebUI के साथ Docker रिलीज़-पथ चंक
- `custom`: केंद्रित दोबारा रन के लिए ठीक-ठीक `docker_lanes` सूची

पैकेज-उम्मीदवार Telegram प्रमाण के लिए, पैकेज स्वीकृति पर `telegram_mode=mock-openai` या
`telegram_mode=live-frontier` सक्षम करें। वर्कफ़्लो रिज़ॉल्व किए गए `package-under-test` टारबॉल को
Telegram लेन में पास करता है; स्टैंडअलोन Telegram वर्कफ़्लो पोस्ट-पब्लिश जाँचों के लिए अब भी प्रकाशित
npm स्पेक स्वीकार करता है।

## नियमित रिलीज़ प्रकाशन ऑटोमेशन

बीटा, `latest`, Plugin, GitHub Release, और प्लेटफ़ॉर्म प्रकाशन के लिए,
`OpenClaw Release Publish` सामान्य म्यूटेटिंग एंट्रीपॉइंट है। मासिक
`.33+` npm-केवल विस्तारित-स्थिर पथ इस orchestrator का उपयोग नहीं करता। नियमित वर्कफ़्लो
रिलीज़ की आवश्यकता के क्रम में विश्वसनीय-प्रकाशक वर्कफ़्लो orchestrate करता है:

1. रिलीज़ टैग चेक आउट करें और उसका कमिट SHA रिज़ॉल्व करें।
2. सत्यापित करें कि टैग `main` या `release/*` से reachable है।
3. `pnpm plugins:sync:check` चलाएँ।
4. `publish_scope=all-publishable` और `ref=<release-sha>` के साथ `Plugin NPM Release` dispatch करें।
5. समान scope और SHA के साथ `Plugin ClawHub Release` dispatch करें।
6. सहेजे गए `full_release_validation_run_id` को सत्यापित करने के बाद रिलीज़ टैग, npm dist-tag,
   और सहेजे गए `preflight_run_id` के साथ `OpenClaw NPM Release` dispatch करें।
7. स्थिर रिलीज़ के लिए, GitHub रिलीज़ को ड्राफ़्ट के रूप में बनाएँ या अपडेट करें, स्पष्ट
   `windows_node_tag` और उम्मीदवार-स्वीकृत `windows_node_installer_digests` के साथ
   `Windows Node Release` dispatch करें, और ड्राफ़्ट प्रकाशित करने से पहले कैनोनिकल
   इंस्टॉलर/चेकसम assets सत्यापित करें।

बीटा प्रकाशन उदाहरण:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

डिफ़ॉल्ट बीटा dist-tag पर स्थिर प्रकाशन:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

सीधे `latest` पर स्थिर promotion स्पष्ट है:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

केवल केंद्रित मरम्मत या दोबारा प्रकाशन कार्य के लिए निचले-स्तर के `Plugin NPM Release` और
`Plugin ClawHub Release` वर्कफ़्लो का उपयोग करें। `OpenClaw Release Publish`
`publish_openclaw_npm=true` होने पर `plugin_publish_scope=selected` को अस्वीकार करता है, ताकि
core पैकेज हर publishable आधिकारिक Plugin, जिसमें `@openclaw/diffs-language-pack` शामिल है, के बिना
शिप न हो सके। चयनित Plugin मरम्मत के लिए, `plugin_publish_scope=selected` और `plugins=@openclaw/name`
के साथ `publish_openclaw_npm=false` सेट करें, या child वर्कफ़्लो को सीधे dispatch करें।

## NPM वर्कफ़्लो इनपुट

`OpenClaw NPM Release` ये operator-नियंत्रित इनपुट स्वीकार करता है:

- `tag`: आवश्यक रिलीज़ टैग, जैसे `v2026.4.2`, `v2026.4.2-1`, या
  `v2026.4.2-beta.1`; जब `preflight_only=true` हो, तो यह validation-only preflight के लिए वर्तमान
  पूर्ण 40-वर्ण workflow-branch commit SHA भी हो सकता है
- `preflight_only`: validation/build/package-only के लिए `true`, वास्तविक publish path के लिए `false`
- `preflight_run_id`: वास्तविक publish path पर आवश्यक, ताकि वर्कफ़्लो सफल preflight run से तैयार
  tarball का फिर से उपयोग करे
- `full_release_validation_run_id`: वास्तविक मासिक extended-stable और नियमित
  non-beta प्रकाशन के लिए आवश्यक, ताकि वर्कफ़्लो ठीक-ठीक validation run को authenticate करे
- `npm_dist_tag`: publish path के लिए npm target tag; `alpha`, `beta`,
  `latest`, या `extended-stable` स्वीकार करता है और डिफ़ॉल्ट `beta` है। अंतिम patch `33` और बाद वाले को
  `extended-stable` का उपयोग करना होगा; डिफ़ॉल्ट रूप से, `extended-stable` पहले के patch को अस्वीकार करता है,
  और यह हमेशा non-final tags को अस्वीकार करता है।
- `bypass_extended_stable_guard`: केवल-परीक्षण boolean, डिफ़ॉल्ट `false`; `npm_dist_tag=extended-stable`
  के साथ, release identity, artifact, approval, और readback जाँचों को बनाए रखते हुए मासिक extended-stable
  eligibility को bypass करता है।

`OpenClaw Release Publish` ये operator-नियंत्रित इनपुट स्वीकार करता है:

- `tag`: आवश्यक रिलीज़ टैग; पहले से मौजूद होना चाहिए
- `preflight_run_id`: सफल `OpenClaw NPM Release` preflight run id;
  `publish_openclaw_npm=true` होने पर आवश्यक
- `full_release_validation_run_id`: सफल `Full Release Validation` run
  id; `publish_openclaw_npm=true` होने पर आवश्यक
- `windows_node_tag`: ठीक-ठीक non-prerelease `openclaw/openclaw-windows-node`
  रिलीज़ टैग; स्थिर OpenClaw publish के लिए आवश्यक
- `windows_node_installer_digests`: वर्तमान Windows installer नामों से उनके pinned `sha256:` digests तक का
  उम्मीदवार-स्वीकृत compact JSON map; स्थिर OpenClaw publish के लिए आवश्यक
- `npm_dist_tag`: OpenClaw पैकेज के लिए npm target tag
- `plugin_publish_scope`: डिफ़ॉल्ट `all-publishable`; `publish_openclaw_npm=false` के साथ केवल
  केंद्रित plugin-only repair work के लिए `selected` का उपयोग करें
- `plugins`: जब `plugin_publish_scope=selected` हो, तो comma-separated `@openclaw/*` package names
- `publish_openclaw_npm`: डिफ़ॉल्ट `true`; केवल workflow को plugin-only repair orchestrator के रूप में
  उपयोग करते समय `false` सेट करें
- `wait_for_clawhub`: डिफ़ॉल्ट `false`, ताकि npm availability ClawHub sidecar से blocked न हो;
  `true` केवल तब सेट करें जब workflow completion में ClawHub completion शामिल होना ज़रूरी हो

`OpenClaw Release Checks` ये operator-नियंत्रित इनपुट स्वीकार करता है:

- `ref`: validate करने के लिए branch, tag, या full commit SHA। secret-bearing checks के लिए resolved commit
  का OpenClaw branch या release tag से reachable होना आवश्यक है।
- `run_release_soak`: beta release checks के लिए exhaustive live/E2E, Docker release-path, और
  all-since upgrade-survivor soak में opt in करें। यह `release_profile=stable` और
  `release_profile=full` द्वारा forced on होता है।

नियम:

- patch `33` से नीचे की regular final और correction versions या तो `beta` या `latest` पर publish हो सकती हैं।
  patch `33` या उससे ऊपर की final versions को `extended-stable` पर publish करना होगा, और उस boundary पर
  correction-suffix versions अस्वीकार की जाती हैं।
- Beta prerelease tags केवल `beta` पर publish हो सकते हैं
- `OpenClaw NPM Release` के लिए, full commit SHA input केवल `preflight_only=true` होने पर allowed है
- `OpenClaw Release Checks` और `Full Release Validation` हमेशा validation-only हैं
- वास्तविक publish path को वही `npm_dist_tag` उपयोग करना होगा जो preflight के दौरान उपयोग हुआ था;
  workflow verify करता है कि publish से पहले metadata जारी रहे

## नियमित beta/latest स्थिर रिलीज़ क्रम

यह legacy sequence उस नियमित orchestrated release के लिए है जो plugins, GitHub Release, Windows, और अन्य
platform work का भी स्वामी है। यह इस पेज के शीर्ष पर दस्तावेज़ित मासिक `.33+` npm-only extended-stable
path नहीं है।

जब नियमित orchestrated stable release काट रहे हों:

1. `preflight_only=true` के साथ `OpenClaw NPM Release` चलाएँ
   - टैग मौजूद होने से पहले, आप प्रीफ्लाइट वर्कफ़्लो के केवल-सत्यापन ड्राई रन के लिए मौजूदा पूर्ण वर्कफ़्लो-शाखा कमिट
     SHA का उपयोग कर सकते हैं
2. सामान्य beta-first प्रवाह के लिए `npm_dist_tag=beta` चुनें, या `latest` केवल तब
   जब आप जानबूझकर सीधा स्थिर प्रकाशन चाहते हों
3. जब आप एक मैनुअल वर्कफ़्लो से सामान्य CI के साथ live prompt cache, Docker, QA Lab,
   Matrix, और Telegram कवरेज चाहते हों, तो रिलीज़ शाखा, रिलीज़ टैग, या पूर्ण
   कमिट SHA पर `Full Release Validation` चलाएँ
4. यदि आपको जानबूझकर केवल नियतात्मक सामान्य टेस्ट ग्राफ़ चाहिए, तो इसके बजाय रिलीज़ ref पर
   मैनुअल `CI` वर्कफ़्लो चलाएँ
5. सटीक non-prerelease `openclaw/openclaw-windows-node` रिलीज़ टैग चुनें
   जिसके signed x64 और ARM64 इंस्टॉलर शिप होने चाहिए। उसे
   `windows_node_tag` के रूप में सहेजें, और उनके validated digest map को
   `windows_node_installer_digests` के रूप में सहेजें। release-candidate helper दोनों को रिकॉर्ड करता है
   और उन्हें अपनी जनरेट की गई publish command में शामिल करता है।
6. सफल `preflight_run_id` और `full_release_validation_run_id` सहेजें
7. उसी `tag`, उसी `npm_dist_tag`,
   चुने गए `windows_node_tag`, उसके सहेजे गए `windows_node_installer_digests`,
   सहेजे गए `preflight_run_id`, और सहेजे गए `full_release_validation_run_id` के साथ `OpenClaw Release Publish` चलाएँ;
   यह OpenClaw npm पैकेज को promote करने से पहले externalized plugins को npm और ClawHub पर प्रकाशित करता है
8. यदि रिलीज़ `beta` पर लैंड हुई है, तो उस स्थिर संस्करण को `beta` से `latest` पर promote करने के लिए
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   वर्कफ़्लो का उपयोग करें
9. यदि रिलीज़ जानबूझकर सीधे `latest` पर प्रकाशित की गई है और `beta`
   को तुरंत उसी स्थिर build का अनुसरण करना चाहिए, तो दोनों dist-tags को स्थिर संस्करण पर इंगित करने के लिए वही रिलीज़
   वर्कफ़्लो उपयोग करें, या उसके scheduled
   self-healing sync को बाद में `beta` स्थानांतरित करने दें

dist-tag mutation रिलीज़ ledger repo में रहता है क्योंकि उसे अभी भी
`NPM_TOKEN` की आवश्यकता होती है, जबकि source repo OIDC-only publish रखता है।

यह direct publish path और beta-first promotion path दोनों को
दस्तावेजीकृत और operator-visible बनाए रखता है।

यदि किसी maintainer को local npm authentication पर fallback करना पड़े, तो कोई भी 1Password
CLI (`op`) command केवल dedicated tmux session के अंदर चलाएँ। मुख्य agent shell से सीधे `op`
कॉल न करें; इसे tmux के अंदर रखने से prompts,
alerts, और OTP handling observable रहते हैं और repeated host alerts से बचाव होता है।

## सार्वजनिक संदर्भ

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers वास्तविक runbook के लिए निजी रिलीज़ docs
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
का उपयोग करते हैं।

## संबंधित

- [रिलीज़ चैनल](/hi/install/development-channels)
