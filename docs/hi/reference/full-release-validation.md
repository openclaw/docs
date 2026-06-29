---
read_when:
    - पूर्ण रिलीज़ सत्यापन चलाना या फिर से चलाना
    - स्थिर और पूर्ण रिलीज़ सत्यापन प्रोफ़ाइलों की तुलना
    - रिलीज़ सत्यापन चरण की विफलताओं को डीबग करना
summary: पूर्ण रिलीज़ सत्यापन चरण, चाइल्ड वर्कफ़्लो, रिलीज़ प्रोफ़ाइल, फिर से चलाने के हैंडल, और साक्ष्य
title: पूर्ण रिलीज़ सत्यापन
x-i18n:
    generated_at: "2026-06-29T00:07:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` रिलीज़ umbrella है। यह प्री-रिलीज़ प्रमाण के लिए एकमात्र मैन्युअल
entrypoint है, लेकिन अधिकांश काम चाइल्ड workflows में होता है ताकि किसी
विफल बॉक्स को पूरी रिलीज़ फिर से शुरू किए बिना दोबारा चलाया जा सके।

इसे किसी विश्वसनीय workflow ref से चलाएँ, सामान्यतः `main`, और रिलीज़ branch,
tag, या पूरा commit SHA `ref` के रूप में पास करें:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

चाइल्ड workflows harness के लिए विश्वसनीय workflow ref और परीक्षणाधीन
candidate के लिए इनपुट `ref` का उपयोग करते हैं। इससे पुराने रिलीज़ branch या tag
को validate करते समय नई validation logic उपलब्ध रहती है।

`release_profile=stable` और `release_profile=full` हमेशा exhaustive
live/Docker soak चलाते हैं। beta profile के साथ वही soak lanes शामिल करने के लिए
`run_release_soak=true` पास करें। Stable publication इस soak और blocking
product-performance evidence के बिना validation manifest को अस्वीकार कर देता है।

Package Acceptance सामान्यतः resolved `ref` से candidate tarball बनाता है,
जिसमें `pnpm ci:full-release` से dispatch किए गए full-SHA runs शामिल हैं। beta
publish के बाद, release checks, Package Acceptance, cross-OS, release-path Docker,
और package Telegram में shipped npm package का दोबारा उपयोग करने के लिए
`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` पास करें। केवल तब
`package_acceptance_package_spec` उपयोग करें जब Package Acceptance को जानबूझकर
किसी अलग package को prove करना हो। Codex Plugin live package lane भी उसी state
का पालन करता है: published `release_package_spec` values
`codex_plugin_spec=npm:@openclaw/codex@<version>` derive करती हैं; SHA/artifact
runs selected ref से `extensions/codex` pack करते हैं; और operators `npm:`,
`npm-pack:`, या `git:` Plugin sources के लिए सीधे `codex_plugin_spec` set कर
सकते हैं। यह lane उस Plugin के लिए आवश्यक explicit Codex CLI install approval
देता है, फिर Codex CLI preflight और same-session OpenAI agent turns चलाता है।

## शीर्ष-स्तरीय stages

| Stage                | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Target resolution    | **Job:** `Resolve target ref`<br />**Child workflow:** none<br />**Proves:** release branch, tag, या full commit SHA resolve करता है और selected inputs record करता है।<br />**Rerun:** यदि यह विफल हो, तो umbrella दोबारा चलाएँ।                                                                                                                                                                                                                                             |
| Vitest and normal CI | **Job:** `Run normal full CI`<br />**Child workflow:** `CI`<br />**Proves:** target ref के विरुद्ध manual full CI graph, जिसमें Linux Node lanes, bundled Plugin shards, Plugin और channel contract shards, Node 22 compatibility, `check-*`, `check-additional-*`, built-artifact smoke checks, docs checks, Python skills, Windows, macOS, Control UI i18n, और umbrella के माध्यम से Android शामिल हैं।<br />**Rerun:** `rerun_group=ci`।                           |
| Plugin prerelease    | **Job:** `Run plugin prerelease validation`<br />**Child workflow:** `Plugin Prerelease`<br />**Proves:** release-only Plugin static checks, agentic Plugin coverage, full extension batch shards, Plugin prerelease Docker lanes, और compatibility triage के लिए non-blocking `plugin-inspector-advisory` artifact।<br />**Rerun:** `rerun_group=plugin-prerelease`।                                                                                        |
| Release checks       | **Job:** `Run release/live/Docker/QA validation`<br />**Child workflow:** `OpenClaw Release Checks`<br />**Proves:** install smoke, cross-OS package checks, Package Acceptance, QA Lab parity, live Matrix, और live Telegram। Stable और full profiles exhaustive live/E2E suites और Docker release-path chunks भी चलाते हैं; beta `run_release_soak=true` के साथ opt in कर सकता है।<br />**Rerun:** `rerun_group=release-checks` या कोई संकरा release-checks handle। |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Child workflow:** `NPM Telegram Beta E2E`<br />**Proves:** जब `release_package_spec` या `npm_telegram_package_spec` set हो, तब focused published-package Telegram E2E। Full candidate validation इसके बजाय canonical Package Acceptance Telegram E2E का उपयोग करता है।<br />**Rerun:** `release_package_spec` या `npm_telegram_package_spec` के साथ `rerun_group=npm-telegram`।                                               |
| Umbrella verifier    | **Job:** `Verify full validation`<br />**Child workflow:** none<br />**Proves:** recorded child run conclusions दोबारा check करता है और child workflows से slowest-job tables append करता है।<br />**Rerun:** किसी failed child को green करने के लिए rerun करने के बाद केवल यह job दोबारा चलाएँ।                                                                                                                                                                                                  |

`ref=main` और `rerun_group=all` के लिए, नया umbrella पुराने को supersede करता है।
जब parent cancel होता है, तो उसका monitor पहले से dispatched किसी भी child
workflow को cancel कर देता है। Release branch और tag validation runs default रूप
से एक-दूसरे को cancel नहीं करते।

## Release checks stages

`OpenClaw Release Checks` सबसे बड़ा child workflow है। यह target को एक बार
resolve करता है और package या Docker-facing stages को आवश्यकता होने पर shared
`release-package-under-test` artifact तैयार करता है।

| चरण                | विवरण                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| रिलीज़ लक्ष्य       | **Job:** `Resolve target ref`<br />**Backing workflow:** कोई नहीं<br />**Tests:** चयनित ref, वैकल्पिक अपेक्षित SHA, प्रोफ़ाइल, rerun group, और केंद्रित लाइव suite filter.<br />**Rerun:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                          |
| पैकेज आर्टिफ़ैक्ट   | **Job:** `Prepare release package artifact`<br />**Backing workflow:** कोई नहीं<br />**Tests:** एक उम्मीदवार tarball को पैक या resolve करता है और downstream पैकेज-केंद्रित checks के लिए `release-package-under-test` अपलोड करता है.<br />**Rerun:** प्रभावित पैकेज, cross-OS, या live/E2E group.                                                                                                                                                                                               |
| इंस्टॉल स्मोक        | **Job:** `Run install smoke`<br />**Backing workflow:** `Install Smoke`<br />**Tests:** root Dockerfile smoke image reuse, QR package install, root और gateway Docker smokes, installer Docker tests, Bun global install image-provider smoke, और fast bundled-plugin install/uninstall E2E के साथ पूरा install path.<br />**Rerun:** `rerun_group=install-smoke`.                                                                                                                                 |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Backing workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** चयनित provider और mode के लिए Linux, Windows, और macOS पर fresh और upgrade lanes, candidate tarball और baseline package का उपयोग करते हुए.<br />**Rerun:** `rerun_group=cross-os`.                                                                                                                                                                                    |
| Repo और live E2E    | **Job:** `Run repo/live E2E validation`<br />**Backing workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** repository E2E, live cache, OpenAI websocket streaming, native live provider और plugin shards, और `release_profile` द्वारा चुने गए Docker-backed live model/backend/gateway harnesses.<br />**Runs:** `run_release_soak=true`, `release_profile=full`, या केंद्रित `rerun_group=live-e2e`.<br />**Rerun:** `rerun_group=live-e2e`, वैकल्पिक रूप से `live_suite_filter` के साथ. |
| Docker रिलीज़ पथ    | **Job:** `Run Docker release-path validation`<br />**Backing workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** साझा package artifact के विरुद्ध release-path Docker chunks.<br />**Runs:** `run_release_soak=true`, `release_profile=full`, या केंद्रित `rerun_group=live-e2e`.<br />**Rerun:** `rerun_group=live-e2e`.                                                                                                                                                    |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Backing workflow:** `Package Acceptance`<br />**Tests:** offline plugin package fixtures, plugin update, canonical mock-OpenAI Telegram package E2E, और उसी tarball के विरुद्ध published-upgrade survivor checks. Blocking release checks default latest published baseline का उपयोग करते हैं; soak checks `2026.4.23` पर या उसके बाद की हर stable npm release और reported-issue fixtures तक विस्तृत होते हैं.<br />**Rerun:** `rerun_group=package`.        |
| QA parity           | **Job:** `Run QA Lab parity lane` और `Run QA Lab parity report`<br />**Backing workflow:** direct jobs<br />**Tests:** candidate और baseline agentic parity packs, फिर parity report.<br />**Rerun:** `rerun_group=qa-parity` या `rerun_group=qa`.                                                                                                                                                                                                                                                 |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Backing workflow:** direct job<br />**Tests:** `qa-live-shared` environment में fast live Matrix QA profile.<br />**Rerun:** `rerun_group=qa-live` या `rerun_group=qa`.                                                                                                                                                                                                                                                                                |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Backing workflow:** direct job<br />**Tests:** Convex CI credential leases के साथ live Telegram QA.<br />**Rerun:** `rerun_group=qa-live` या `rerun_group=qa`.                                                                                                                                                                                                                                                                                      |
| रिलीज़ verifier     | **Job:** `Verify release checks`<br />**Backing workflow:** कोई नहीं<br />**Tests:** चयनित rerun group के लिए आवश्यक release-check jobs.<br />**Rerun:** केंद्रित child jobs pass होने के बाद rerun करें.                                                                                                                                                                                                                                                                                         |

## Docker release-path chunks

जब `live_suite_filter` खाली होता है, Docker release-path चरण ये chunks चलाता है:

| Chunk                                                           | कवरेज                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Core Docker release-path smoke lanes.                                                                                      |
| `package-update-openai`                                         | OpenAI package install/update behavior, Codex on-demand install, Codex plugin live turns, और Chat Completions tool calls. |
| `package-update-anthropic`                                      | Anthropic package install और update behavior.                                                                             |
| `package-update-core`                                           | Provider-neutral package और update behavior.                                                                              |
| `plugins-runtime-plugins`                                       | Plugin runtime lanes जो plugin behavior को exercise करते हैं.                                                                        |
| `plugins-runtime-services`                                      | Service-backed और live plugin runtime lanes; अनुरोध किए जाने पर OpenWebUI शामिल है.                                           |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | समानांतर release validation के लिए विभाजित Plugin install/runtime batches.                                                      |

जब केवल एक Docker lane विफल हुआ हो, reusable live/E2E workflow पर लक्षित `docker_lanes=<lane[,lane]>` का उपयोग करें. उपलब्ध होने पर release artifacts में package artifact और image reuse inputs के साथ per-lane rerun commands शामिल होते हैं.

## रिलीज़ प्रोफ़ाइलें

`release_profile` मुख्य रूप से release checks के भीतर live/provider विस्तार को नियंत्रित करता है.
यह सामान्य full CI, Plugin Prerelease, install smoke, package
acceptance, या QA Lab को नहीं हटाता. Stable और full profiles हमेशा exhaustive repo/live
E2E और Docker release-path soak coverage चलाते हैं. beta profile
`run_release_soak=true` के साथ opt in कर सकता है. Package Acceptance हर full candidate के लिए canonical package
Telegram E2E प्रदान करता है, इसलिए umbrella उस
live poller को duplicate नहीं करता.

| Profile   | Intended use                      | Included live/provider coverage                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | सबसे तेज़ release-critical smoke.   | OpenAI/core live path, OpenAI के लिए Docker live models, native gateway core, native OpenAI gateway profile, native OpenAI plugin, और Docker live gateway OpenAI.                     |
| `stable`  | Default release approval profile. | `minimum` के साथ Anthropic smoke, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness, और OpenCode Go smoke shard. |
| `full`    | व्यापक advisory sweep.             | `stable` के साथ advisory providers, plugin live shards, और media live shards.                                                                                                        |

## केवल full में जोड़े गए

ये suites `stable` द्वारा छोड़े जाते हैं और `full` में शामिल होते हैं:

| Area                             | Full-only coverage                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live models               | OpenCode Go, OpenRouter, xAI, Z.ai, और Fireworks.                                                                          |
| Docker live gateway              | Advisory providers DeepSeek/Fireworks, OpenCode Go/OpenRouter, और xAI/Z.ai shards में विभाजित.                              |
| Native gateway provider profiles | Full Anthropic Opus और Sonnet/Haiku shards, Fireworks, DeepSeek, full OpenCode Go model shards, OpenRouter, xAI, और Z.ai. |
| Native plugin live shards        | Plugins A-K, L-N, O-Z other, Moonshot, और xAI.                                                                             |
| Native media live shards         | Audio, Google music, MiniMax music, और video groups A-D.                                                                   |

`stable` में `native-live-src-gateway-profiles-anthropic-smoke` और
`native-live-src-gateway-profiles-opencode-go-smoke` शामिल हैं; `full` इसके बजाय व्यापक
Anthropic और OpenCode Go model shards का उपयोग करता है. Focused reruns फिर भी
aggregate `native-live-src-gateway-profiles-anthropic` या
`native-live-src-gateway-profiles-opencode-go` handles का उपयोग कर सकते हैं.

## केंद्रित reruns

असंबंधित रिलीज़ बॉक्स दोहराने से बचने के लिए `rerun_group` का उपयोग करें:

| Handle              | Scope                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | सभी पूर्ण रिलीज़ वैलिडेशन चरण।                                                             |
| `ci`                | केवल मैन्युअल पूर्ण CI चाइल्ड।                                                                      |
| `plugin-prerelease` | केवल Plugin प्री-रिलीज़ चाइल्ड।                                                                   |
| `release-checks`    | सभी OpenClaw रिलीज़ जांच चरण।                                                             |
| `install-smoke`     | रिलीज़ जांचों तक इंस्टॉल स्मोक।                                                           |
| `cross-os`          | क्रॉस-OS रिलीज़ जांचें।                                                                        |
| `live-e2e`          | रेपो/लाइव E2E और Docker रिलीज़-पाथ वैलिडेशन।                                               |
| `package`           | पैकेज स्वीकृति।                                                                             |
| `qa`                | QA समानता और QA लाइव लेन।                                                                   |
| `qa-parity`         | केवल QA समानता लेन और रिपोर्ट।                                                                |
| `qa-live`           | सक्षम होने पर QA लाइव Matrix/Telegram और गेटेड Discord, WhatsApp, और Slack लेन।             |
| `npm-telegram`      | प्रकाशित-पैकेज Telegram E2E; `release_package_spec` या `npm_telegram_package_spec` आवश्यक है। |

जब कोई एक लाइव सूट विफल हो, तो `rerun_group=live-e2e` के साथ `live_suite_filter` का उपयोग करें।
मान्य फ़िल्टर ids पुन: प्रयोज्य लाइव/E2E वर्कफ़्लो में परिभाषित हैं, जिनमें
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, और
`live-codex-harness-docker` शामिल हैं।

`live-gateway-advisory-docker` handle अपने तीन प्रदाता शार्ड के लिए एक समेकित
रीरन handle है, इसलिए यह अब भी सभी advisory Docker Gateway jobs में फैलता है।

जब कोई एक क्रॉस-OS लेन विफल हो, तो `rerun_group=cross-os` के साथ
`cross_os_suite_filter` का उपयोग करें। फ़िल्टर OS id, suite id, या OS/suite
जोड़ी स्वीकार करता है, उदाहरण के लिए `windows/packaged-upgrade`, `windows`, या
`packaged-fresh`। क्रॉस-OS सारांशों में पैकेज्ड अपग्रेड लेन के लिए प्रति-चरण
समय शामिल होते हैं, और लंबे समय तक चलने वाले कमांड Heartbeat पंक्तियाँ प्रिंट
करते हैं ताकि अटका हुआ Windows अपडेट job timeout से पहले दिखाई दे।

QA रिलीज़-जांच विफलताएँ सामान्य रिलीज़ वैलिडेशन को ब्लॉक करती हैं। मानक tier में
आवश्यक OpenClaw डायनामिक टूल drift भी रिलीज़-जांच verifier को ब्लॉक करता है।
Tideclaw alpha runs अब भी गैर-पैकेज-सुरक्षा रिलीज़-जांच लेन को advisory मान सकते
हैं। जब `live_suite_filter` स्पष्ट रूप से Discord, WhatsApp, या Slack जैसी
गेटेड QA लाइव लेन का अनुरोध करता है, तो मिलते-जुलते
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo variable को सक्षम होना चाहिए; अन्यथा
इनपुट कैप्चर लेन को चुपचाप छोड़ने के बजाय विफल हो जाता है। जब आपको ताज़ा QA
साक्ष्य चाहिए, तो `rerun_group=qa`, `qa-parity`, या `qa-live` को फिर से चलाएँ।

## रखने योग्य साक्ष्य

रिलीज़-स्तरीय इंडेक्स के रूप में `Full Release Validation` सारांश रखें। यह
चाइल्ड रन ids से लिंक करता है और इसमें सबसे धीमे jobs की तालिकाएँ शामिल होती
हैं। विफलताओं के लिए, पहले चाइल्ड वर्कफ़्लो देखें, फिर ऊपर दिए गए सबसे छोटे
मिलते-जुलते handle को फिर से चलाएँ।

उपयोगी artifacts:

- `OpenClaw Release Checks` से `release-package-under-test`
- `.artifacts/docker-tests/` के अंतर्गत Docker रिलीज़-पाथ artifacts
- पैकेज स्वीकृति `package-under-test` और Docker acceptance artifacts
- प्रत्येक OS और suite के लिए क्रॉस-OS रिलीज़-जांच artifacts
- QA समानता, Matrix, और Telegram artifacts

## वर्कफ़्लो फ़ाइलें

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
