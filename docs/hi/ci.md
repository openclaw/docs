---
read_when:
    - आपको समझना होगा कि CI job क्यों चला या क्यों नहीं चला
    - आप विफल GitHub Actions जाँच को डीबग कर रहे हैं
    - आप रिलीज़ सत्यापन रन या पुनः रन का समन्वय कर रहे हैं
    - आप ClawSweeper dispatch या GitHub गतिविधि forwarding बदल रहे हैं
summary: CI जॉब ग्राफ़, स्कोप गेट्स, रिलीज़ अम्ब्रेला, और स्थानीय कमांड समकक्ष
title: CI पाइपलाइन
x-i18n:
    generated_at: "2026-06-28T22:42:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI `main` पर हर push और हर pull request पर चलती है। Canonical
`main` pushes पहले 90-सेकंड की hosted-runner admission window से गुजरते हैं।
मौजूदा `CI` concurrency group किसी नए commit के आने पर उस प्रतीक्षारत run को
रद्द कर देता है, इसलिए sequential merges में हर merge पूरा Blacksmith matrix
register नहीं करता। Pull requests और manual dispatches प्रतीक्षा छोड़ देते हैं। फिर
`preflight` job diff को वर्गीकृत करता है और जब केवल असंबंधित क्षेत्रों में बदलाव
हुआ हो तो महंगे lanes बंद कर देता है। Manual `workflow_dispatch` runs जानबूझकर smart
scoping को bypass करते हैं और release candidates तथा व्यापक validation के लिए पूरा
graph fan out करते हैं। Android lanes `include_android` के माध्यम से opt-in रहते
हैं। Release-only plugin coverage अलग [`Plugin Prerelease`](#plugin-prerelease)
workflow में रहती है और केवल [`Full Release Validation`](#full-release-validation)
या explicit manual dispatch से चलती है।

## Pipeline overview

| Job                                | उद्देश्य                                                                                                   | कब चलता है                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs-only बदलाव, बदले हुए scopes, बदले हुए extensions का पता लगाता है, और CI manifest बनाता है                   | non-draft pushes और PRs पर हमेशा                  |
| `runner-admission`                 | Blacksmith work register होने से पहले canonical `main` pushes के लिए hosted 90-सेकंड debounce                | हर CI run; sleep केवल canonical `main` pushes पर |
| `security-fast`                    | Private key detection, `zizmor` के माध्यम से changed-workflow audit, और production lockfile audit                 | non-draft pushes और PRs पर हमेशा                  |
| `check-dependencies`               | Production Knip dependency-only pass और unused-file allowlist guard                                 | Node-संबंधित बदलाव                               |
| `build-artifacts`                  | `dist/`, Control UI, built-CLI smoke checks, embedded built-artifact checks, और reusable artifacts build करता है | Node-संबंधित बदलाव                               |
| `checks-fast-core`                 | तेज Linux correctness lanes जैसे bundled, protocol, QA Smoke CI, और CI-routing checks                | Node-संबंधित बदलाव                               |
| `checks-fast-contracts-plugins-*`  | दो sharded plugin contract checks                                                                        | Node-संबंधित बदलाव                               |
| `checks-fast-contracts-channels-*` | दो sharded channel contract checks                                                                       | Node-संबंधित बदलाव                               |
| `checks-node-core-*`               | Core Node test shards, channel, bundled, contract, और extension lanes को छोड़कर                          | Node-संबंधित बदलाव                               |
| `check-*`                          | Sharded main local gate equivalent: prod types, lint, guards, test types, और strict smoke                | Node-संबंधित बदलाव                               |
| `check-additional-*`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary, और runtime topology     | Node-संबंधित बदलाव                               |
| `checks-node-compat-node22`        | Node 22 compatibility build और smoke lane                                                                | releases के लिए manual CI dispatch                     |
| `check-docs`                       | Docs formatting, lint, और broken-link checks                                                             | Docs बदले हों                                        |
| `skills-python`                    | Python-backed skills के लिए Ruff + pytest                                                                    | Python-skill-संबंधित बदलाव                       |
| `checks-windows`                   | Windows-specific process/path tests और shared runtime import specifier regressions                      | Windows-संबंधित बदलाव                            |
| `macos-node`                       | shared built artifacts का उपयोग करने वाला macOS TypeScript test lane                                               | macOS-संबंधित बदलाव                              |
| `macos-swift`                      | macOS app के लिए Swift lint, build, और tests                                                            | macOS-संबंधित बदलाव                              |
| `ios-build`                        | Xcode project generation और iOS app simulator build                                                 | iOS app, shared app kit, या Swabble बदलाव         |
| `android`                          | दोनों flavors के लिए Android unit tests और एक debug APK build                                              | Android-संबंधित बदलाव                            |
| `test-performance-agent`           | trusted activity के बाद daily Codex slow-test optimization                                                 | Main CI success या manual dispatch                  |
| `openclaw-performance`             | mock-provider, deep-profile, और GPT 5.5 live lanes के साथ daily/on-demand Kova runtime performance reports | Scheduled और manual dispatch                       |

## Fail-fast order

1. `runner-admission` केवल canonical `main` pushes के लिए प्रतीक्षा करता है; नया push Blacksmith registration से पहले run को रद्द कर देता है।
2. `preflight` तय करता है कि कौन से lanes मौजूद होंगे। `docs-scope` और `changed-scope` logic इस job के अंदर steps हैं, standalone jobs नहीं।
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, और `skills-python` भारी artifact और platform matrix jobs की प्रतीक्षा किए बिना जल्दी fail करते हैं।
4. `build-artifacts` fast Linux lanes के साथ overlap करता है ताकि downstream consumers shared build तैयार होते ही शुरू कर सकें।
5. उसके बाद भारी platform और runtime lanes fan out होते हैं: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, और `android`।

जब उसी PR या `main` ref पर नया push आता है, तो GitHub superseded jobs को `cancelled` के रूप में mark कर सकता है। जब तक उसी ref का सबसे नया run भी fail नहीं हो रहा, इसे CI noise मानें। Matrix jobs `fail-fast: false` का उपयोग करते हैं, और `build-artifacts` छोटे verifier jobs queue करने के बजाय embedded channel, core-support-boundary, और gateway-watch failures सीधे report करता है। Automatic CI concurrency key versioned (`CI-v7-*`) है ताकि पुराने queue group में कोई GitHub-side zombie नए main runs को अनिश्चित काल तक block न कर सके। Manual full-suite runs `CI-manual-v1-*` का उपयोग करते हैं और in-progress runs को cancel नहीं करते।

GitHub Actions से wall time, queue time, slowest jobs, failures, और `pnpm-store-warmup` fanout barrier को summarize करने के लिए `pnpm ci:timings`, `pnpm ci:timings:recent`, या `node scripts/ci-run-timings.mjs <run-id>` का उपयोग करें। CI वही run summary `ci-timings-summary` artifact के रूप में भी upload करती है। Build timing के लिए, `build-artifacts` job का `Build dist` step देखें: `pnpm build:ci-artifacts` `[build-all] phase timings:` print करता है और `ui:build` शामिल करता है; job `startup-memory` artifact भी upload करता है।

Pull request runs के लिए, terminal timing-summary job `GH_TOKEN` को `gh run view` में pass करने से पहले trusted base revision से helper चलाता है। इससे tokened query branch-controlled code से बाहर रहती है, फिर भी pull request के current CI run का summary मिलता है।

## PR context and evidence

External contributor PRs
`.github/workflows/real-behavior-proof.yml` से PR context और evidence gate चलाते हैं। Workflow trusted
base commit checkout करता है और केवल PR body evaluate करता है; यह contributor branch से code execute नहीं करता।

Gate उन PR authors पर लागू होता है जो repository owners, members,
collaborators, या bots नहीं हैं। यह तब pass होता है जब PR body में authored
`What Problem This Solves` और `Evidence` sections हों। Evidence focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log, या artifact link हो सकता है। Body intent और उपयोगी validation देती है;
reviewers correctness का आकलन करने के लिए code, tests, और CI inspect करते हैं।

जब check fail हो, तो एक और code commit push करने के बजाय PR body update करें।

## Scope and routing

Scope logic `scripts/ci-changed-scope.mjs` में रहती है और `src/scripts/ci-changed-scope.test.ts` में unit tests से covered है। Manual dispatch changed-scope detection छोड़ देता है और preflight manifest को ऐसा behave कराता है जैसे हर scoped area बदला हो।

- **CI workflow edits** Node CI graph और workflow linting validate करते हैं, लेकिन स्वयं Windows, iOS, Android, या macOS native builds force नहीं करते; वे platform lanes platform source changes तक scoped रहते हैं।
- **Workflow Sanity** सभी workflow YAML files पर `actionlint`, `zizmor`, composite-action interpolation guard, और conflict-marker guard चलाता है। PR-scoped `security-fast` job changed workflow files पर भी `zizmor` चलाता है ताकि workflow security findings main CI graph में जल्दी fail हों।
- **Docs on `main` pushes** standalone `Docs` workflow द्वारा उसी ClawHub docs mirror के साथ check किए जाते हैं जिसका उपयोग CI करती है, इसलिए mixed code+docs pushes CI `check-docs` shard को भी queue नहीं करते। Pull requests और manual CI अब भी docs बदलने पर CI से `check-docs` चलाते हैं।
- **TUI PTY** TUI changes के लिए `checks-node-core-runtime-tui-pty` Linux Node shard में चलता है। Shard `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` के साथ `test/vitest/vitest.tui-pty.config.ts` चलाता है, इसलिए यह deterministic `TuiBackend` fixture lane और धीमे `tui --local` smoke दोनों को cover करता है, जो केवल external model endpoint को mock करता है।
- **CI routing-only edits, selected cheap core-test fixture edits, and narrow plugin contract helper/test-routing edits** fast Node-only manifest path का उपयोग करते हैं: `preflight`, security, और एक single `checks-fast-core` task। यह path build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards, और additional guard matrices को skip करता है जब change उन्हीं routing या helper surfaces तक सीमित हो जिन्हें fast task सीधे exercise करता है।
- **Windows Node checks** Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config, और उस lane को execute करने वाली CI workflow surfaces तक scoped हैं; unrelated source, plugin, install-smoke, और test-only changes Linux Node lanes पर रहते हैं।

सबसे धीमे Node परीक्षण परिवारों को विभाजित या संतुलित किया गया है ताकि प्रत्येक जॉब रनरों को अत्यधिक आरक्षित किए बिना छोटा रहे: Plugin कॉन्ट्रैक्ट और चैनल कॉन्ट्रैक्ट प्रत्येक मानक GitHub रनर फ़ॉलबैक के साथ दो भारित Blacksmith-समर्थित शार्ड के रूप में चलते हैं, कोर यूनिट फ़ास्ट/सपोर्ट लेन अलग-अलग चलती हैं, कोर रनटाइम इन्फ्रा को स्टेट, प्रोसेस/कॉन्फ़िग, शेयरड, और तीन cron डोमेन शार्ड में विभाजित किया गया है, ऑटो-रिप्लाई संतुलित वर्करों के रूप में चलता है (रिप्लाई सबट्री को एजेंट-रनर, डिस्पैच, और कमांड/स्टेट-रूटिंग शार्ड में विभाजित करते हुए), और एजेंटिक Gateway/सर्वर कॉन्फ़िग निर्मित आर्टिफैक्ट पर प्रतीक्षा करने के बजाय चैट/ऑथ/मॉडल/http-plugin/रनटाइम/स्टार्टअप लेन में विभाजित हैं। सामान्य CI फिर केवल अलग-थलग इन्फ्रा include-pattern शार्ड को अधिकतम 64 परीक्षण फ़ाइलों के निर्धारक बंडलों में पैक करता है, जिससे गैर-अलग-थलग कमांड/cron, स्टेटफुल agents-core, या Gateway/सर्वर सूट को मिलाए बिना Node मैट्रिक्स घटता है; भारी निश्चित सूट 8 vCPU पर रहते हैं जबकि बंडल किए गए और कम-भार वाली लेन 4 vCPU का उपयोग करती हैं। कैनॉनिकल रिपॉज़िटरी पर पुल अनुरोध एक अतिरिक्त संक्षिप्त प्रवेश योजना का उपयोग करते हैं: वही प्रति-कॉन्फ़िग समूह मौजूदा 34-जॉब Linux Node योजना के भीतर अलग-थलग सबप्रोसेस में चलते हैं, इसलिए एक अकेला PR पूरा 70 से अधिक जॉब वाला Node मैट्रिक्स पंजीकृत नहीं करता। `main` पुश, मैनुअल डिस्पैच, और रिलीज़ गेट पूरा मैट्रिक्स बनाए रखते हैं। व्यापक ब्राउज़र, QA, मीडिया, और विविध Plugin परीक्षण साझा Plugin कैच-ऑल के बजाय अपने समर्पित Vitest कॉन्फ़िग का उपयोग करते हैं। Include-pattern शार्ड CI शार्ड नाम का उपयोग करके टाइमिंग प्रविष्टियां रिकॉर्ड करते हैं, ताकि `.artifacts/vitest-shard-timings.json` पूरे कॉन्फ़िग को फ़िल्टर किए गए शार्ड से अलग पहचान सके। `check-additional-*` पैकेज-बाउंड्री कंपाइल/कैनरी कार्य को साथ रखता है और रनटाइम टोपोलॉजी आर्किटेक्चर को Gateway वॉच कवरेज से अलग करता है; बाउंड्री गार्ड सूची को एक प्रॉम्प्ट-भारी शार्ड और शेष गार्ड स्ट्राइप्स के लिए एक संयुक्त शार्ड में स्ट्राइप किया गया है, प्रत्येक चयनित स्वतंत्र गार्ड को साथ-साथ चलाता है और प्रति-चेक टाइमिंग प्रिंट करता है। महंगा Codex हैप्पी-पाथ प्रॉम्प्ट स्नैपशॉट ड्रिफ्ट चेक केवल मैनुअल CI और केवल प्रॉम्प्ट-प्रभावित बदलावों के लिए अपने अलग अतिरिक्त जॉब के रूप में चलता है, इसलिए सामान्य असंबंधित Node बदलाव ठंडी प्रॉम्प्ट स्नैपशॉट जेनरेशन के पीछे प्रतीक्षा नहीं करते और बाउंड्री शार्ड संतुलित रहते हैं, जबकि प्रॉम्प्ट ड्रिफ्ट अब भी उसे पैदा करने वाले PR से जुड़ा रहता है; वही फ़्लैग निर्मित-आर्टिफैक्ट कोर सपोर्ट-बाउंड्री शार्ड के भीतर प्रॉम्प्ट स्नैपशॉट Vitest जेनरेशन को छोड़ देता है। Gateway वॉच, चैनल परीक्षण, और कोर सपोर्ट-बाउंड्री शार्ड `build-artifacts` के भीतर साथ-साथ चलते हैं, जब `dist/` और `dist-runtime/` पहले से बन चुके होते हैं।

प्रवेश मिलने के बाद, कैनॉनिकल Linux CI अधिकतम 24 साथ-साथ Node परीक्षण जॉब और
छोटी फ़ास्ट/चेक लेन के लिए 12 की अनुमति देता है; Windows और Android दो पर रहते हैं क्योंकि
उनके रनर पूल अधिक संकरे हैं।

संक्षिप्त PR योजना मौजूदा सूट के लिए 18 Node जॉब उत्सर्जित करती है: पूरे-कॉन्फ़िग
समूहों को 120-मिनट बैच टाइमआउट के साथ अलग-थलग सबप्रोसेस में बैच किया जाता है,
जबकि include-pattern समूह वही सीमित जॉब बजट साझा करते हैं।

Android CI `testPlayDebugUnitTest` और `testThirdPartyDebugUnitTest` दोनों चलाता है और फिर Play debug APK बनाता है। थर्ड-पार्टी फ्लेवर का कोई अलग सोर्स सेट या मैनिफ़ेस्ट नहीं है; इसकी यूनिट-परीक्षण लेन अब भी SMS/call-log BuildConfig फ़्लैग के साथ फ्लेवर कंपाइल करती है, जबकि हर Android-संबंधित पुश पर डुप्लिकेट debug APK पैकेजिंग जॉब से बचती है।

`check-dependencies` शार्ड `pnpm deadcode:dependencies` (नवीनतम Knip संस्करण पर पिन किया गया प्रोडक्शन Knip dependency-only पास, जिसमें `dlx` इंस्टॉल के लिए pnpm की न्यूनतम रिलीज़ आयु अक्षम है) और `pnpm deadcode:unused-files` चलाता है, जो Knip की प्रोडक्शन unused-file खोजों की तुलना `scripts/deadcode-unused-files.allowlist.mjs` से करता है। unused-file गार्ड तब विफल होता है जब कोई PR नई बिना-समीक्षित अप्रयुक्त फ़ाइल जोड़ता है या पुरानी allowlist प्रविष्टि छोड़ता है, जबकि ऐसे इरादतन डायनामिक Plugin, जेनरेटेड, बिल्ड, लाइव-परीक्षण, और पैकेज ब्रिज सतहों को संरक्षित रखता है जिन्हें Knip स्थैतिक रूप से हल नहीं कर सकता।

## ClawSweeper गतिविधि फ़ॉरवर्डिंग

`.github/workflows/clawsweeper-dispatch.yml` OpenClaw रिपॉज़िटरी गतिविधि से ClawSweeper में लक्षित-पक्ष ब्रिज है। यह अविश्वसनीय पुल अनुरोध कोड को चेक आउट या निष्पादित नहीं करता। वर्कफ़्लो `CLAWSWEEPER_APP_PRIVATE_KEY` से GitHub App टोकन बनाता है, फिर संक्षिप्त `repository_dispatch` पेलोड को `openclaw/clawsweeper` पर डिस्पैच करता है।

वर्कफ़्लो में चार लेन हैं:

- सटीक इश्यू और पुल अनुरोध समीक्षा अनुरोधों के लिए `clawsweeper_item`;
- इश्यू टिप्पणियों में स्पष्ट ClawSweeper कमांड के लिए `clawsweeper_comment`;
- `main` पुश पर कमिट-स्तरीय समीक्षा अनुरोधों के लिए `clawsweeper_commit_review`;
- सामान्य GitHub गतिविधि के लिए `github_activity`, जिसे ClawSweeper एजेंट निरीक्षण कर सकता है।

`github_activity` लेन केवल सामान्यीकृत मेटाडेटा फ़ॉरवर्ड करती है: इवेंट प्रकार, कार्रवाई, अभिनेता, रिपॉज़िटरी, आइटम नंबर, URL, शीर्षक, स्थिति, और मौजूद होने पर टिप्पणियों या समीक्षाओं के छोटे अंश। यह जानबूझकर पूरा webhook बॉडी फ़ॉरवर्ड नहीं करती। `openclaw/clawsweeper` में प्राप्त करने वाला वर्कफ़्लो `.github/workflows/github-activity.yml` है, जो सामान्यीकृत इवेंट को ClawSweeper एजेंट के लिए OpenClaw Gateway हुक पर पोस्ट करता है।

सामान्य गतिविधि अवलोकन है, डिफ़ॉल्ट रूप से डिलीवरी नहीं। ClawSweeper एजेंट को उसके प्रॉम्प्ट में Discord लक्ष्य मिलता है और उसे `#clawsweeper` पर केवल तब पोस्ट करना चाहिए जब इवेंट आश्चर्यजनक, कार्रवाई योग्य, जोखिमपूर्ण, या परिचालन रूप से उपयोगी हो। नियमित ओपन, एडिट, बॉट हलचल, डुप्लिकेट webhook शोर, और सामान्य समीक्षा ट्रैफ़िक का परिणाम `NO_REPLY` होना चाहिए।

इस पूरे पथ में GitHub शीर्षकों, टिप्पणियों, बॉडी, समीक्षा टेक्स्ट, ब्रांच नामों, और कमिट संदेशों को अविश्वसनीय डेटा मानें। वे सारांश और ट्रायाज के लिए इनपुट हैं, वर्कफ़्लो या एजेंट रनटाइम के लिए निर्देश नहीं।

## मैनुअल डिस्पैच

मैनुअल CI डिस्पैच सामान्य CI जैसा ही जॉब ग्राफ़ चलाते हैं लेकिन हर गैर-Android scoped लेन को चालू करने के लिए बाध्य करते हैं: Linux Node शार्ड, बंडल्ड-Plugin शार्ड, Plugin और चैनल कॉन्ट्रैक्ट शार्ड, Node 22 संगतता, `check-*`, `check-additional-*`, निर्मित-आर्टिफैक्ट स्मोक चेक, डॉक्स चेक, Python Skills, Windows, macOS, iOS बिल्ड, और Control UI i18n। स्टैंडअलोन मैनुअल CI डिस्पैच Android को केवल `include_android=true` के साथ चलाते हैं; पूर्ण रिलीज़ अम्ब्रेला `include_android=true` पास करके Android सक्षम करता है। Plugin प्रीरिलीज़ स्थैतिक चेक, रिलीज़-केवल `agentic-plugins` शार्ड, पूर्ण एक्सटेंशन बैच स्वीप, और Plugin प्रीरिलीज़ Docker लेन CI से बाहर रखी जाती हैं। Docker प्रीरिलीज़ सूट केवल तब चलता है जब `Full Release Validation` रिलीज़-वैलिडेशन गेट सक्षम करके अलग `Plugin Prerelease` वर्कफ़्लो डिस्पैच करता है।

मैनुअल रन एक अद्वितीय concurrency group का उपयोग करते हैं ताकि रिलीज़-कैंडिडेट पूर्ण सूट उसी ref पर किसी अन्य पुश या PR रन से रद्द न हो। वैकल्पिक `target_ref` इनपुट किसी विश्वसनीय कॉलर को चयनित डिस्पैच ref से वर्कफ़्लो फ़ाइल का उपयोग करते हुए उस ग्राफ़ को किसी ब्रांच, टैग, या पूर्ण कमिट SHA के विरुद्ध चलाने देता है।

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## रनर

| रनर                            | जॉब                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | मैनुअल CI डिस्पैच और गैर-कैनॉनिकल रिपॉज़िटरी फ़ॉलबैक, CodeQL JavaScript/actions गुणवत्ता स्कैन, workflow-sanity, labeler, auto-response, CI के बाहर docs वर्कफ़्लो, और install-smoke प्रीफ़्लाइट ताकि Blacksmith मैट्रिक्स पहले कतार में लग सके                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, कम-भार वाले एक्सटेंशन शार्ड, `checks-fast-core`, Plugin/चैनल कॉन्ट्रैक्ट शार्ड, अधिकांश बंडल्ड/कम-भार Linux Node शार्ड, `check-guards`, `check-prod-types`, `check-test-types`, चयनित `check-additional-*` शार्ड, और `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | बनाए रखे गए भारी Linux Node सूट, बाउंड्री/एक्सटेंशन-भारी `check-additional-*` शार्ड, और `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (CPU-संवेदनशील इतना कि 8 vCPU ने जितना बचाया उससे अधिक लागत लगाई); install-smoke Docker बिल्ड (32-vCPU कतार समय ने जितना बचाया उससे अधिक लागत लगाई)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` पर `macos-node`; forks `macos-15` पर वापस जाते हैं                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` पर `macos-swift` और `ios-build`; forks `macos-26` पर वापस जाते हैं                                                                                                                                                                                                  |

## रनर पंजीकरण बजट

OpenClaw की मौजूदा GitHub runner-registration bucket 5 मिनट में 3,000 self-hosted
रनर पंजीकरणों की अनुमति देती है। सीमा `openclaw` संगठन में सभी Blacksmith रनर
पंजीकरणों द्वारा साझा की जाती है, इसलिए एक और Blacksmith
इंस्टॉलेशन जोड़ने से नई bucket नहीं जुड़ती।

बर्स्ट नियंत्रण के लिए Blacksmith लेबल को दुर्लभ संसाधन मानें। वे जॉब जो
केवल रूट, सूचित, सारांशित, शार्ड चयनित करते हैं, या छोटे CodeQL स्कैन चलाते हैं, उन्हें
GitHub-hosted रनरों पर ही रहना चाहिए जब तक उनके पास मापी गई Blacksmith-विशिष्ट
ज़रूरतें न हों। किसी भी नए Blacksmith मैट्रिक्स, बड़े `max-parallel`, या उच्च-आवृत्ति
वर्कफ़्लो को अपनी worst-case पंजीकरण संख्या दिखानी चाहिए और org-स्तरीय
लक्ष्य को 5 मिनट में 2,000 पंजीकरणों से नीचे रखना चाहिए, ताकि साथ-साथ चलने वाली
रिपॉज़िटरी और दोबारा चलाए गए जॉब के लिए हेडरूम बचे।

कैनॉनिकल-रिपॉज़िटरी CI सामान्य push और pull-request रन के लिए Blacksmith को डिफ़ॉल्ट रनर पथ के रूप में रखता है। `workflow_dispatch` और गैर-कैनॉनिकल रिपॉज़िटरी रन GitHub-hosted रनरों का उपयोग करते हैं, लेकिन सामान्य कैनॉनिकल रन फिलहाल Blacksmith कतार स्वास्थ्य की जांच नहीं करते या Blacksmith उपलब्ध न होने पर अपने आप GitHub-hosted लेबल पर वापस नहीं जाते।

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

`OpenClaw Performance` उत्पाद/रनटाइम प्रदर्शन वर्कफ़्लो है। यह `main` पर प्रतिदिन चलता है और इसे मैन्युअल रूप से डिस्पैच किया जा सकता है:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

मैन्युअल डिस्पैच सामान्यतः वर्कफ़्लो ref को बेंचमार्क करता है। किसी रिलीज़ टैग या वर्तमान वर्कफ़्लो कार्यान्वयन वाली दूसरी ब्रांच को बेंचमार्क करने के लिए `target_ref` सेट करें। प्रकाशित रिपोर्ट पाथ और नवीनतम पॉइंटर परीक्षण किए गए ref के आधार पर keyed होते हैं, और प्रत्येक `index.md` परीक्षण किए गए ref/SHA, वर्कफ़्लो ref/SHA, Kova ref, प्रोफ़ाइल, lane auth mode, मॉडल, repeat count, और scenario filters रिकॉर्ड करता है।

वर्कफ़्लो pinned रिलीज़ से OCM और pinned `kova_ref` इनपुट पर `openclaw/Kova` से Kova इंस्टॉल करता है, फिर तीन lanes चलाता है:

- `mock-provider`: deterministic नकली OpenAI-compatible auth के साथ local-build runtime के विरुद्ध Kova diagnostic scenarios।
- `mock-deep-profile`: startup, gateway, और agent-turn hotspots के लिए CPU/heap/trace profiling।
- `live-openai-candidate`: वास्तविक OpenAI `openai/gpt-5.5` agent turn, जिसे `OPENAI_API_KEY` उपलब्ध न होने पर छोड़ा जाता है।

mock-provider lane Kova pass के बाद OpenClaw-native source probes भी चलाती है: default, hook, और 50-plugin startup मामलों में gateway boot timing और memory; bundled Plugin import RSS, repeated mock-OpenAI `channel-chat-baseline` hello loops, booted gateway के विरुद्ध CLI startup commands, और SQLite state smoke performance probe। जब पिछले प्रकाशित mock-provider source report परीक्षण किए गए ref के लिए उपलब्ध होती है, तो source summary वर्तमान RSS और heap values की तुलना उस baseline से करती है और बड़े RSS increases को `watch` के रूप में चिह्नित करती है। source probe Markdown summary report bundle में `source/index.md` पर रहती है, और raw JSON उसके साथ रहता है।

हर lane GitHub artifacts अपलोड करती है। जब `CLAWGRIT_REPORTS_TOKEN` कॉन्फ़िगर होता है, तो वर्कफ़्लो `report.json`, `report.md`, bundles, `index.md`, और source-probe artifacts को `openclaw/clawgrit-reports` में `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` के अंतर्गत commit भी करता है। वर्तमान tested-ref pointer `openclaw-performance/<tested-ref>/latest-<lane>.json` के रूप में लिखा जाता है।

## पूर्ण रिलीज़ सत्यापन

`Full Release Validation` "रिलीज़ से पहले सब कुछ चलाएं" के लिए मैन्युअल umbrella workflow है। यह branch, tag, या full commit SHA स्वीकार करता है, उस target के साथ manual `CI` workflow dispatch करता है, release-only Plugin/package/static/Docker proof के लिए `Plugin Prerelease` dispatch करता है, और install smoke, package acceptance, cross-OS package checks, QA profile evidence से maturity scorecard rendering, QA Lab parity, Matrix, और Telegram lanes के लिए `OpenClaw Release Checks` dispatch करता है। Stable और full profiles में हमेशा exhaustive live/E2E और Docker release-path soak coverage शामिल होती है; beta profile `run_release_soak=true` के साथ opt in कर सकती है। canonical package Telegram E2E Package Acceptance के अंदर चलता है, इसलिए full candidate duplicate live poller शुरू नहीं करता। publishing के बाद, release checks, Package Acceptance, Docker, cross-OS, और Telegram में shipped npm package को बिना rebuild किए reuse करने के लिए `release_package_spec` पास करें। केवल focused published-package Telegram rerun के लिए `npm_telegram_package_spec` का उपयोग करें। Codex Plugin live package lane default रूप से वही selected state उपयोग करती है: published `release_package_spec=openclaw@<tag>` से `codex_plugin_spec=npm:@openclaw/codex@<tag>` derive होता है, जबकि SHA/artifact runs selected ref से `extensions/codex` pack करते हैं। `npm:`, `npm-pack:`, या `git:` specs जैसे custom Plugin sources के लिए `codex_plugin_spec` स्पष्ट रूप से सेट करें।

stage matrix, exact workflow job names, profile differences, artifacts, और focused rerun handles के लिए [पूर्ण रिलीज़ सत्यापन](/hi/reference/full-release-validation) देखें।

`OpenClaw Release Publish` manual mutating release workflow है। इसे release tag मौजूद होने और OpenClaw npm preflight सफल होने के बाद `release/YYYY.M.PATCH` या `main` से dispatch करें। यह `pnpm plugins:sync:check` verify करता है, सभी publishable Plugin packages के लिए `Plugin NPM Release` dispatch करता है, उसी release SHA के लिए `Plugin ClawHub Release` dispatch करता है, और केवल उसके बाद saved `preflight_run_id` के साथ `OpenClaw NPM Release` dispatch करता है। Stable publish को exact `windows_node_tag` भी चाहिए; workflow Windows source release verify करता है और किसी भी publish child से पहले उसके x64/ARM64 installers की तुलना candidate-approved `windows_node_installer_digests` input से करता है, फिर GitHub release draft publish करने से पहले उन्हीं pinned installer digests और exact companion asset और checksum contract को promote और verify करता है।

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

तेज़ी से बदलती branch पर pinned commit proof के लिए, `gh workflow run ... --ref main -f ref=<sha>` के बजाय helper का उपयोग करें:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs branches या tags होने चाहिए, raw commit SHAs नहीं। helper target SHA पर temporary `release-ci/<sha>-...` branch push करता है, उस pinned ref से `Full Release Validation` dispatch करता है, verify करता है कि हर child workflow `headSha` target से मेल खाता है, और run पूरा होने पर temporary branch delete करता है। umbrella verifier भी fail होता है यदि कोई child workflow अलग SHA पर चला हो।

`release_profile` release checks में pass की जाने वाली live/provider breadth नियंत्रित करता है। manual release workflows default रूप से `stable` पर रहते हैं; `full` का उपयोग केवल तब करें जब आप जानबूझकर broad advisory provider/media matrix चाहते हों। Stable और full release checks हमेशा exhaustive live/E2E और Docker release-path soak चलाते हैं; beta profile `run_release_soak=true` के साथ opt in कर सकती है।

- `minimum` सबसे तेज़ OpenAI/core release-critical lanes रखता है।
- `stable` stable provider/backend set जोड़ता है।
- `full` broad advisory provider/media matrix चलाता है।

umbrella dispatched child run ids रिकॉर्ड करता है, और final `Verify full validation` job वर्तमान child run conclusions फिर से check करता है और प्रत्येक child run के लिए slowest-job tables append करता है। यदि कोई child workflow rerun होकर green हो जाता है, तो umbrella result और timing summary refresh करने के लिए केवल parent verifier job rerun करें।

recovery के लिए, `Full Release Validation` और `OpenClaw Release Checks` दोनों `rerun_group` स्वीकार करते हैं। release candidate के लिए `all`, केवल normal full CI child के लिए `ci`, केवल Plugin prerelease child के लिए `plugin-prerelease`, हर release child के लिए `release-checks`, या अधिक संकरा group उपयोग करें: umbrella पर `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, या `npm-telegram`। यह focused fix के बाद failed release box rerun को bounded रखता है। एक failed cross-OS lane के लिए, `rerun_group=cross-os` को `cross_os_suite_filter` के साथ combine करें, उदाहरण के लिए `windows/packaged-upgrade`; लंबे cross-OS commands heartbeat lines emit करते हैं और packaged-upgrade summaries में per-phase timings शामिल होते हैं। QA release-check lanes advisory हैं, standard runtime tool coverage gate को छोड़कर, जो required OpenClaw dynamic tools के standard tier summary से drift या disappear होने पर block करता है।

`OpenClaw Release Checks` trusted workflow ref का उपयोग selected ref को एक बार `release-package-under-test` tarball में resolve करने के लिए करता है, फिर उस artifact को cross-OS checks और Package Acceptance में, साथ ही soak coverage चलने पर live/E2E release-path Docker workflow में pass करता है। इससे package bytes release boxes में consistent रहते हैं और multiple child jobs में उसी candidate को repack करने से बचा जाता है। Codex npm-plugin live lane के लिए, release checks या तो `release_package_spec` से derived matching published Plugin spec pass करते हैं, operator-supplied `codex_plugin_spec` pass करते हैं, या input blank छोड़ते हैं ताकि Docker script selected checkout का Codex Plugin pack करे।

`ref=main` और `rerun_group=all` के लिए duplicate `Full Release Validation` runs पुराने umbrella को supersede करते हैं। parent monitor parent cancel होने पर पहले से dispatched किसी भी child workflow को cancel कर देता है, इसलिए नया main validation stale two-hour release-check run के पीछे नहीं बैठता। release branch/tag validation और focused rerun groups `cancel-in-progress: false` रखते हैं।

## Live और E2E shards

release live/E2E child broad native `pnpm test:live` coverage रखता है, लेकिन इसे एक serial job के बजाय `scripts/test-live-shard.mjs` के माध्यम से named shards के रूप में चलाता है:

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

इससे वही file coverage बनी रहती है, जबकि slow live provider failures को rerun और diagnose करना आसान होता है। aggregate `native-live-extensions-o-z`, `native-live-extensions-media`, और `native-live-extensions-media-music` shard names manual one-shot reruns के लिए valid रहते हैं।

native live media shards `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` में चलते हैं, जिसे `Live Media Runner Image` workflow द्वारा build किया जाता है। उस image में `ffmpeg` और `ffprobe` preinstall होते हैं; media jobs setup से पहले केवल binaries verify करते हैं। Docker-backed live suites को normal Blacksmith runners पर रखें — container jobs nested Docker tests launch करने के लिए गलत जगह हैं।

Docker-समर्थित लाइव model/backend शार्ड प्रत्येक चयनित commit के लिए अलग साझा `ghcr.io/openclaw/openclaw-live-test:<sha>` image का उपयोग करते हैं। लाइव release workflow उस image को एक बार बनाकर push करता है, फिर Docker live model, provider-sharded Gateway, CLI backend, ACP bind, और Codex harness शार्ड `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ चलते हैं। Gateway Docker शार्ड workflow job timeout से नीचे स्पष्ट script-level `timeout` सीमाएं रखते हैं, ताकि अटका हुआ container या cleanup path पूरे release-check budget को खर्च करने के बजाय जल्दी fail हो। यदि वे शार्ड पूर्ण source Docker target को स्वतंत्र रूप से फिर से बनाते हैं, तो release run गलत configure किया गया है और duplicate image builds पर wall clock बर्बाद करेगा।

## पैकेज स्वीकार्यता

जब प्रश्न यह हो कि "क्या यह installable OpenClaw package product के रूप में काम करता है?", तब `Package Acceptance` का उपयोग करें। यह सामान्य CI से अलग है: सामान्य CI source tree को validate करता है, जबकि package acceptance एक single tarball को उसी Docker E2E harness के जरिए validate करता है जिसका उपयोग उपयोगकर्ता install या update के बाद करते हैं।

### Jobs

1. `resolve_package` `workflow_ref` checkout करता है, एक package candidate resolve करता है, `.artifacts/docker-e2e-package/openclaw-current.tgz` लिखता है, `.artifacts/docker-e2e-package/package-candidate.json` लिखता है, दोनों को `package-under-test` artifact के रूप में upload करता है, और GitHub step summary में source, workflow ref, package ref, version, SHA-256, और profile print करता है।
2. `docker_acceptance` `ref=workflow_ref` और `package_artifact_name=package-under-test` के साथ `openclaw-live-and-e2e-checks-reusable.yml` call करता है। Reusable workflow उस artifact को download करता है, tarball inventory validate करता है, जरूरत पड़ने पर package-digest Docker images तैयार करता है, और workflow checkout को pack करने के बजाय उस package के विरुद्ध चयनित Docker lanes चलाता है। जब कोई profile कई targeted `docker_lanes` चुनता है, तो reusable workflow package और shared images को एक बार तैयार करता है, फिर उन lanes को unique artifacts वाले parallel targeted Docker jobs के रूप में fan out करता है।
3. `package_telegram` वैकल्पिक रूप से `NPM Telegram Beta E2E` call करता है। यह तब चलता है जब `telegram_mode` `none` नहीं होता और Package Acceptance ने कोई package resolve किया हो तो वही `package-under-test` artifact install करता है; standalone Telegram dispatch फिर भी published npm spec install कर सकता है।
4. `summary` workflow को fail करता है यदि package resolution, Docker acceptance, या वैकल्पिक Telegram lane fail हुआ हो।

### Candidate sources

- `source=npm` केवल `openclaw@beta`, `openclaw@latest`, या कोई exact OpenClaw release version जैसे `openclaw@2026.4.27-beta.2` स्वीकार करता है। Published prerelease/stable acceptance के लिए इसका उपयोग करें।
- `source=ref` किसी trusted `package_ref` branch, tag, या full commit SHA को pack करता है। Resolver OpenClaw branches/tags fetch करता है, verify करता है कि चयनित commit repository branch history या release tag से reachable है, detached worktree में deps install करता है, और उसे `scripts/package-openclaw-for-docker.mjs` से pack करता है।
- `source=url` public HTTPS `.tgz` download करता है; `package_sha256` आवश्यक है। यह path URL credentials, non-default HTTPS ports, private/internal/special-use hostnames या resolved IPs, और उसी public safety policy से बाहर redirects को reject करता है।
- `source=trusted-url` `.github/package-trusted-sources.json` में named trusted-source policy से HTTPS `.tgz` download करता है; `package_sha256` और `trusted_source_id` आवश्यक हैं। इसका उपयोग केवल maintainer-owned enterprise mirrors या private package repositories के लिए करें जिन्हें configured hosts, ports, path prefixes, redirect hosts, या private-network resolution चाहिए। यदि policy bearer auth declare करती है, तो workflow fixed `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret का उपयोग करता है; URL-embedded credentials फिर भी reject किए जाते हैं।
- `source=artifact` `artifact_run_id` और `artifact_name` से एक `.tgz` download करता है; `package_sha256` वैकल्पिक है लेकिन externally shared artifacts के लिए देना चाहिए।

`workflow_ref` और `package_ref` को अलग रखें। `workflow_ref` trusted workflow/harness code है जो test चलाता है। `package_ref` वह source commit है जिसे `source=ref` होने पर pack किया जाता है। इससे current test harness पुराने trusted source commits को पुराने workflow logic चलाए बिना validate कर सकता है।

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI के साथ पूर्ण Docker release-path chunks
- `custom` — exact `docker_lanes`; जब `suite_profile=custom` हो तो आवश्यक

`package` profile offline plugin coverage का उपयोग करता है ताकि published-package validation live ClawHub availability पर gated न हो। वैकल्पिक Telegram lane `NPM Telegram Beta E2E` में `package-under-test` artifact को reuse करता है, जबकि standalone dispatches के लिए published npm spec path रखा जाता है।

Dedicated update और plugin testing policy, जिसमें local commands,
Docker lanes, Package Acceptance inputs, release defaults, और failure triage शामिल हैं,
के लिए [updates और plugins का परीक्षण](/hi/help/testing-updates-plugins) देखें।

Release checks Package Acceptance को `source=artifact`, तैयार release package artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, और `telegram_mode=mock-openai` के साथ call करते हैं। इससे package migration, update, live ClawHub skill install, stale-plugin-dependency cleanup, configured-plugin install repair, offline plugin, plugin-update, और Telegram proof उसी resolved package tarball पर रहते हैं। Beta publish करने के बाद Full Release Validation या OpenClaw Release Checks पर `release_package_spec` set करें ताकि rebuilding के बिना shipped npm package के विरुद्ध वही matrix चले; `package_acceptance_package_spec` केवल तब set करें जब Package Acceptance को बाकी release validation से अलग package चाहिए। Cross-OS release checks अभी भी OS-specific onboarding, installer, और platform behavior cover करते हैं; package/update product validation Package Acceptance से शुरू होना चाहिए। `published-upgrade-survivor` Docker lane blocking release path में प्रति run एक published package baseline validate करता है। Package Acceptance में, resolved `package-under-test` tarball हमेशा candidate होता है और `published_upgrade_survivor_baseline` fallback published baseline चुनता है, जो default रूप से `openclaw@latest` होता है; failed-lane rerun commands उस baseline को preserve करते हैं। `run_release_soak=true` या `release_profile=full` के साथ Full Release Validation `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` और `published_upgrade_survivor_scenarios=reported-issues` set करता है ताकि चार latest stable npm releases plus pinned plugin-compatibility boundary releases और Feishu config, preserved bootstrap/persona files, configured OpenClaw plugin installs, tilde log paths, और stale legacy plugin dependency roots के लिए issue-shaped fixtures तक विस्तार हो। Multi-baseline published-upgrade survivor selections baseline के अनुसार अलग targeted Docker runner jobs में sharded होते हैं। अलग `Update Migration` workflow `update-migration` Docker lane का उपयोग `all-since-2026.4.23` और `plugin-deps-cleanup` के साथ करता है जब प्रश्न exhaustive published update cleanup का हो, न कि सामान्य Full Release CI breadth का। Local aggregate runs `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` के साथ exact package specs pass कर सकते हैं, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` जैसे `openclaw@2026.4.15` के साथ single lane रख सकते हैं, या scenario matrix के लिए `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` set कर सकते हैं। Published lane baked `openclaw config set` command recipe के साथ baseline configure करता है, recipe steps को `summary.json` में record करता है, और Gateway start के बाद `/healthz`, `/readyz`, plus RPC status probe करता है। Windows packaged और installer fresh lanes यह भी verify करते हैं कि installed package raw absolute Windows path से browser-control override import कर सकता है। OpenAI cross-OS agent-turn smoke set होने पर default रूप से `OPENCLAW_CROSS_OS_OPENAI_MODEL` का उपयोग करता है, अन्यथा `openai/gpt-5.5`, ताकि install और gateway proof GPT-4.x defaults से बचते हुए GPT-5 test model पर रहे।

### Legacy compatibility windows

Package Acceptance में already-published packages के लिए bounded legacy-compatibility windows हैं। `2026.4.25` तक के packages, जिनमें `2026.4.25-beta.*` शामिल हैं, compatibility path का उपयोग कर सकते हैं:

- `dist/postinstall-inventory.json` में known private QA entries tarball-omitted files की ओर point कर सकती हैं;
- जब package वह flag expose नहीं करता, तो `doctor-switch` `gateway install --wrapper` persistence subcase skip कर सकता है;
- `update-channel-switch` tarball-derived fake git fixture से missing pnpm `patchedDependencies` prune कर सकता है और missing persisted `update.channel` log कर सकता है;
- plugin smokes legacy install-record locations पढ़ सकते हैं या missing marketplace install-record persistence स्वीकार कर सकते हैं;
- `plugin-update` config metadata migration allow कर सकता है, जबकि install record और no-reinstall behavior unchanged रहना अभी भी आवश्यक है।

Published `2026.4.26` package पहले से shipped local build metadata stamp files के लिए भी warn कर सकता है। बाद के packages को modern contracts satisfy करने होंगे; वही conditions warn या skip होने के बजाय fail होंगी।

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

अलग `Install Smoke` workflow अपने `preflight` job के माध्यम से वही scope script reuse करता है। यह smoke coverage को `run_fast_install_smoke` और `run_full_install_smoke` में split करता है।

- **तेज़ पथ** उन pull requests के लिए चलता है जो Docker/package surfaces, bundled plugin package/manifest changes, या core plugin/channel/gateway/Plugin SDK surfaces को छूते हैं जिन्हें Docker smoke jobs exercise करते हैं। Source-only bundled plugin changes, test-only edits, और docs-only edits Docker workers आरक्षित नहीं करते। तेज़ पथ root Dockerfile image को एक बार build करता है, CLI जाँचता है, agents delete shared-workspace CLI smoke चलाता है, container gateway-network e2e चलाता है, bundled extension build arg सत्यापित करता है, और 240-second aggregate command timeout के तहत bounded bundled-plugin Docker profile चलाता है (हर scenario का Docker run अलग से capped होता है)।
- **पूर्ण पथ** nightly scheduled runs, manual dispatches, workflow-call release checks, और उन pull requests के लिए QR package install और installer Docker/update coverage रखता है जो सच में installer/package/Docker surfaces को छूते हैं। full mode में, install-smoke एक target-SHA GHCR root Dockerfile smoke image तैयार या reuse करता है, फिर QR package install, root Dockerfile/gateway smokes, installer/update smokes, और fast bundled-plugin Docker E2E को अलग-अलग jobs के रूप में चलाता है ताकि installer work root image smokes के पीछे इंतज़ार न करे।

`main` pushes (merge commits सहित) full path को force नहीं करते; जब changed-scope logic push पर full coverage माँगेगा, workflow fast Docker smoke रखता है और full install smoke को nightly या release validation के लिए छोड़ देता है।

धीमा Bun global install image-provider smoke अलग से `run_bun_global_install_smoke` द्वारा gated है। यह nightly schedule और release checks workflow से चलता है, और manual `Install Smoke` dispatches इसमें opt in कर सकते हैं, लेकिन pull requests और `main` pushes नहीं। सामान्य PR CI अभी भी Node-relevant changes के लिए fast Bun launcher regression lane चलाता है। QR और installer Docker tests अपने install-focused Dockerfiles बनाए रखते हैं।

## स्थानीय Docker E2E

`pnpm test:docker:all` एक shared live-test image पहले से build करता है, OpenClaw को npm tarball के रूप में एक बार pack करता है, और दो shared `scripts/e2e/Dockerfile` images build करता है:

- installer/update/plugin-dependency lanes के लिए bare Node/Git runner;
- एक functional image जो normal functionality lanes के लिए उसी tarball को `/app` में install करती है।

Docker lane definitions `scripts/lib/docker-e2e-scenarios.mjs` में रहती हैं, planner logic `scripts/lib/docker-e2e-plan.mjs` में रहती है, और runner केवल selected plan execute करता है। scheduler lane के अनुसार image को `OPENCLAW_DOCKER_E2E_BARE_IMAGE` और `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` के साथ चुनता है, फिर `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ lanes चलाता है।

### ट्यूनेबल्स

| Variable                               | Default | Purpose                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | normal lanes के लिए main-pool slot count।                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider-sensitive tail-pool slot count।                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | concurrent live lane cap ताकि providers throttle न करें।                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | concurrent npm install lane cap।                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | concurrent multi-service lane cap।                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon create storms से बचने के लिए lane starts के बीच stagger; no stagger के लिए `0` set करें।     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | per-lane fallback timeout (120 minutes); selected live/tail lanes tighter caps use करते हैं।           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` lanes चलाए बिना scheduler plan print करता है।                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | comma-separated exact lane list; cleanup smoke skip करता है ताकि agents एक failed lane reproduce कर सकें। |

अपने effective cap से भारी lane empty pool से फिर भी start हो सकती है, फिर capacity release करने तक अकेले चलती है। local aggregate Docker preflight करता है, stale OpenClaw E2E containers हटाता है, active-lane status emit करता है, longest-first ordering के लिए lane timings persist करता है, और default रूप से पहली failure के बाद नए pooled lanes schedule करना रोक देता है।

### Reusable live/E2E workflow

reusable live/E2E workflow `scripts/test-docker-all.mjs --plan-json` से पूछता है कि कौन सा package, image kind, live image, lane, और credential coverage चाहिए। `scripts/docker-e2e.mjs` फिर उस plan को GitHub outputs और summaries में convert करता है। यह या तो `scripts/package-openclaw-for-docker.mjs` के ज़रिए OpenClaw pack करता है, current-run package artifact download करता है, या `package_artifact_run_id` से package artifact download करता है; tarball inventory validate करता है; जब plan को package-installed lanes चाहिए हों, Blacksmith के Docker layer cache के ज़रिए package-digest-tagged bare/functional GHCR Docker E2E images build और push करता है; और rebuild करने के बजाय दिए गए `docker_e2e_bare_image`/`docker_e2e_functional_image` inputs या existing package-digest images reuse करता है। Docker image pulls को bounded 180-second per-attempt timeout के साथ retry किया जाता है ताकि stuck registry/cache stream CI critical path का अधिकांश हिस्सा consume करने के बजाय जल्दी retry करे।

### Release-path chunks

Release Docker coverage `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ छोटे chunked jobs चलाता है ताकि हर chunk केवल अपनी ज़रूरत वाला image kind pull करे और उसी weighted scheduler के ज़रिए multiple lanes execute करे:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Current release Docker chunks हैं `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, और `plugins-runtime-install-a` से `plugins-runtime-install-h` तक। `package-update-openai` में live Codex plugin package lane शामिल है, जो candidate OpenClaw package install करता है, `codex_plugin_spec` या same-ref tarball से Codex plugin को explicit Codex CLI install approval के साथ install करता है, Codex CLI preflight चलाता है, फिर OpenAI के विरुद्ध multiple same-session OpenClaw agent turns चलाता है। `plugins-runtime-core`, `plugins-runtime`, और `plugins-integrations` aggregate plugin/runtime aliases बने रहते हैं। `install-e2e` lane alias दोनों provider installer lanes के लिए aggregate manual rerun alias बना रहता है।

जब full release-path coverage इसे request करता है, OpenWebUI को `plugins-runtime-services` में fold किया जाता है, और OpenWebUI-only dispatches के लिए ही standalone `openwebui` chunk रखता है। Bundled-channel update lanes transient npm network failures के लिए एक बार retry करते हैं।

हर chunk `.artifacts/docker-tests/` upload करता है, जिसमें lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables, और per-lane rerun commands शामिल होते हैं। workflow `docker_lanes` input chunk jobs के बजाय prepared images के विरुद्ध selected lanes चलाता है, जिससे failed-lane debugging एक targeted Docker job तक bounded रहती है और उस run के लिए package artifact prepare, download, या reuse होता है; अगर selected lane live Docker lane है, तो targeted job उस rerun के लिए live-test image locally build करता है। Generated per-lane GitHub rerun commands में `package_artifact_run_id`, `package_artifact_name`, और prepared image inputs शामिल होते हैं जब वे values मौजूद हों, ताकि failed lane failed run से exact package और images reuse कर सके।

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

scheduled live/E2E workflow daily full release-path Docker suite चलाता है।

## Plugin Prerelease

`Plugin Prerelease` अधिक महंगा product/package coverage है, इसलिए यह `Full Release Validation` या explicit operator द्वारा dispatch किया गया अलग workflow है। Normal pull requests, `main` pushes, और standalone manual CI dispatches उस suite को off रखते हैं। यह bundled plugin tests को आठ extension workers में balance करता है; वे extension shard jobs एक समय में दो plugin config groups तक चलाते हैं, हर group में एक Vitest worker और बड़ा Node heap होता है ताकि import-heavy plugin batches extra CI jobs create न करें। release-only Docker prerelease path targeted Docker lanes को छोटे groups में batch करता है ताकि one-to-three-minute jobs के लिए दर्जनों runners reserve न हों। workflow `@openclaw/plugin-inspector` से informational `plugin-inspector-advisory` artifact भी upload करता है; inspector findings triage input हैं और blocking Plugin Prerelease gate को नहीं बदलते।

## QA Lab

QA Lab के पास main smart-scoped workflow से बाहर dedicated CI lanes हैं। Agentic parity broad QA और release harnesses के अंतर्गत nested है, standalone PR workflow नहीं। जब parity को broad validation run के साथ चलना चाहिए, `rerun_group=qa-parity` के साथ `Full Release Validation` use करें।

- `QA-Lab - All Lanes` workflow nightly `main` पर और manual dispatch पर चलता है; यह mock parity lane, live Matrix lane, और live Telegram और Discord lanes को parallel jobs के रूप में fan out करता है। Live jobs `qa-live-shared` environment use करते हैं, और Telegram/Discord Convex leases use करते हैं।

Release checks deterministic mock provider और mock-qualified models (`mock-openai/gpt-5.5` और `mock-openai/gpt-5.5-alt`) के साथ Matrix और Telegram live transport lanes चलाते हैं ताकि channel contract live model latency और normal provider-plugin startup से isolated रहे। live transport gateway memory search disable करता है क्योंकि QA parity memory behavior को अलग से cover करता है; provider connectivity अलग live model, native provider, और Docker provider suites द्वारा cover होती है।

Matrix scheduled और release gates के लिए `--profile fast` use करता है, और `--fail-fast` तभी add करता है जब checked-out CLI उसे support करता हो। CLI default और manual workflow input `all` बने रहते हैं; manual `matrix_profile=all` dispatch हमेशा full Matrix coverage को `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, और `e2ee-cli` jobs में shard करता है।

`OpenClaw Release Checks` release approval से पहले release-critical QA Lab lanes भी चलाता है; इसका QA parity gate candidate और baseline packs को parallel lane jobs के रूप में चलाता है, फिर final parity comparison के लिए दोनों artifacts को एक छोटे report job में download करता है।

Normal PRs के लिए, parity को required status मानने के बजाय scoped CI/check evidence follow करें।

## CodeQL

`CodeQL` workflow जानबूझकर narrow first-pass security scanner है, full repository sweep नहीं। Daily, manual, और non-draft pull request guard runs Actions workflow code के साथ high-confidence security queries से highest-risk JavaScript/TypeScript surfaces scan करते हैं, जिन्हें high/critical `security-severity` तक filtered किया जाता है।

pull request guard हल्का रहता है: यह केवल `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, या `src` के तहत changes के लिए start होता है, और scheduled workflow जैसी ही high-confidence security matrix चलाता है। Android और macOS CodeQL PR defaults से बाहर रहते हैं।

### Security categories

| श्रेणी                                            | सतह                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | प्रमाणीकरण, secrets, sandbox, Cron, और Gateway आधाररेखा                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel implementation contracts और channel Plugin runtime, Gateway, Plugin SDK, secrets, audit touchpoints                    |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch, और Plugin SDK SSRF नीति सतहें                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery, और agent tool-execution gates                                            |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading, और Plugin SDK package contract trust surfaces |

### प्लेटफ़ॉर्म-विशिष्ट सुरक्षा shards

- `CodeQL Android Critical Security` — निर्धारित Android सुरक्षा shard. Workflow sanity द्वारा स्वीकार किए गए सबसे छोटे Blacksmith Linux runner पर CodeQL के लिए Android app को मैन्युअल रूप से build करता है। `/codeql-critical-security/android` के अंतर्गत upload करता है।
- `CodeQL macOS Critical Security` — साप्ताहिक/मैन्युअल macOS सुरक्षा shard. Blacksmith macOS पर CodeQL के लिए macOS app को मैन्युअल रूप से build करता है, uploaded SARIF से dependency build results को filter करता है, और `/codeql-critical-security/macos` के अंतर्गत upload करता है। इसे daily defaults से बाहर रखा गया है क्योंकि clean होने पर भी macOS build runtime पर हावी रहता है।

### Critical Quality श्रेणियां

`CodeQL Critical Quality` मिलान करने वाला non-security shard है। यह GitHub-hosted Linux runners पर संकरी high-value surfaces पर केवल error-severity, non-security JavaScript/TypeScript quality queries चलाता है ताकि quality scans Blacksmith runner-registration budget खर्च न करें। इसका pull request guard जानबूझकर scheduled profile से छोटा है: non-draft PRs केवल मिलान करने वाले `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, और `plugin-sdk-reply-runtime` shards चलाते हैं, agent command/model/tool execution और reply dispatch code, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel और bundled channel Plugin runtime, Gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, Plugin loader, Plugin SDK/package-contract, या Plugin SDK reply runtime changes के लिए। CodeQL config और quality workflow changes सभी बारह PR quality shards चलाते हैं।

Manual dispatch स्वीकार करता है:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

संकरे profiles एक quality shard को अलग से चलाने के लिए teaching/iteration hooks हैं।

| श्रेणी                                                  | सतह                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | प्रमाणीकरण, secrets, sandbox, Cron, और Gateway security boundary code                                                                                             |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalization, और IO contracts                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schemas और server method contracts                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core channel और bundled channel Plugin implementation contracts                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution, model/provider dispatch, auto-reply dispatch और queues, और ACP control-plane runtime contracts                                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers और tool bridges, process supervision helpers, और outbound delivery contracts                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue, और memory doctor commands                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces, और session doctor CLI contracts   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues, और session/thread binding helpers               |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth और discovery, provider runtime registration, provider defaults/catalogs, और web/search/fetch/embedding registries       |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, Gateway control flows, और task control-plane runtime contracts                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, media understanding, image-generation, और media-generation runtime contracts                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface, और Plugin SDK entrypoint contracts                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Published package-side Plugin SDK source और Plugin package contract helpers                                                                                        |

Quality को security से अलग रखा जाता है ताकि quality findings को security signal को अस्पष्ट किए बिना schedule, measure, disable, या expand किया जा सके। Swift, Python, और bundled-Plugin CodeQL expansion को scoped या sharded follow-up work के रूप में केवल तब वापस जोड़ा जाना चाहिए जब संकरे profiles का runtime और signal स्थिर हो जाए।

## रखरखाव workflows

### Docs Agent

`Docs Agent` workflow मौजूदा docs को हाल में landed changes के साथ aligned रखने के लिए event-driven Codex maintenance lane है। इसका कोई pure schedule नहीं है: `main` पर सफल non-bot push CI run इसे trigger कर सकता है, और manual dispatch इसे सीधे चला सकता है। Workflow-run invocations skip करते हैं जब `main` आगे बढ़ चुका हो या पिछले घंटे में कोई दूसरा non-skipped Docs Agent run बनाया गया हो। जब यह चलता है, तो यह पिछले non-skipped Docs Agent source SHA से वर्तमान `main` तक की commit range की review करता है, ताकि एक hourly run पिछले docs pass के बाद जमा हुए सभी main changes को cover कर सके।

### Test Performance Agent

`Test Performance Agent` workflow slow tests के लिए event-driven Codex maintenance lane है। इसका कोई pure schedule नहीं है: `main` पर सफल non-bot push CI run इसे trigger कर सकता है, लेकिन यदि उस UTC day में कोई दूसरा workflow-run invocation पहले ही चल चुका है या चल रहा है, तो यह skip करता है। Manual dispatch उस daily activity gate को bypass करता है। यह lane full-suite grouped Vitest performance report बनाती है, Codex को broad refactors के बजाय केवल छोटे coverage-preserving test performance fixes करने देती है, फिर full-suite report दोबारा चलाती है और passing baseline test count को घटाने वाले changes को reject करती है। Grouped report Linux और macOS पर per-config wall time और max RSS record करती है, इसलिए before/after comparison duration deltas के साथ test memory deltas भी दिखाता है। यदि baseline में failing tests हैं, तो Codex केवल obvious failures ठीक कर सकता है और कुछ भी commit होने से पहले after-agent full-suite report pass होनी चाहिए। जब bot push land होने से पहले `main` आगे बढ़ता है, तो lane validated patch को rebase करती है, `pnpm check:changed` दोबारा चलाती है, और push retry करती है; conflicting stale patches skip किए जाते हैं। यह GitHub-hosted Ubuntu का उपयोग करता है ताकि Codex action docs agent जैसी drop-sudo safety posture बनाए रख सके।

### Merge के बाद Duplicate PRs

`Duplicate PRs After Merge` workflow post-land duplicate cleanup के लिए manual maintainer workflow है। यह default रूप से dry-run रहता है और `apply=true` होने पर केवल स्पष्ट रूप से listed PRs को close करता है। GitHub को mutate करने से पहले, यह verify करता है कि landed PR merged है और हर duplicate के पास या तो shared referenced issue है या overlapping changed hunks हैं।

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates और changed routing

Local changed-lane logic `scripts/changed-lanes.mjs` में रहता है और `scripts/check-changed.mjs` द्वारा executed होता है। वह local check gate broad CI platform scope की तुलना में architecture boundaries के बारे में अधिक strict है:

- core production changes core prod और core test typecheck plus core lint/guards चलाते हैं;
- core test-only changes केवल core test typecheck plus core lint चलाते हैं;
- extension production changes extension prod और extension test typecheck plus extension lint चलाते हैं;
- extension test-only changes extension test typecheck plus extension lint चलाते हैं;
- public Plugin SDK या plugin-contract changes extension typecheck तक expand होते हैं क्योंकि extensions उन core contracts पर निर्भर करते हैं (Vitest extension sweeps explicit test work रहते हैं);
- release metadata-only version bumps targeted version/config/root-dependency checks चलाते हैं;
- unknown root/config changes सभी check lanes पर fail safe करते हैं।

Local changed-test routing `scripts/test-projects.test-support.mjs` में रहता है और जानबूझकर `check:changed` से सस्ता है: direct test edits खुद को चलाते हैं, source edits explicit mappings को प्राथमिकता देते हैं, फिर sibling tests और import-graph dependents को। Shared group-room delivery config explicit mappings में से एक है: group visible-reply config, source reply delivery mode, या message-tool system prompt में changes core reply tests plus Discord और Slack delivery regressions से होकर route होते हैं, ताकि shared default change पहले PR push से पहले fail हो जाए। `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` का उपयोग केवल तब करें जब change इतना harness-wide हो कि cheap mapped set भरोसेमंद proxy न हो।

## Testbox validation

Crabbox maintainer Linux proof के लिए repo-owned remote-box wrapper है। इसे repo root से उपयोग करें जब कोई check local edit loop के लिए बहुत broad हो, जब CI parity मायने रखती हो, या जब proof को secrets, Docker, package lanes, reusable boxes, या remote logs की जरूरत हो। सामान्य OpenClaw backend `blacksmith-testbox` है; owned AWS/Hetzner capacity Blacksmith outages, quota issues, या explicit owned-capacity testing के लिए fallback है।

Crabbox-समर्थित Blacksmith रन एक-बारगी Testboxes को warm, claim, sync, run, report, और clean up करते हैं। अंतर्निहित sync sanity check तब जल्दी विफल हो जाता है जब आवश्यक root फ़ाइलें जैसे `pnpm-lock.yaml` गायब हो जाती हैं या जब `git status --short` कम से कम 200 tracked deletions दिखाता है। जानबूझकर बड़े-deletion PRs के लिए, remote command के लिए `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` सेट करें।

Crabbox ऐसे local Blacksmith CLI invocation को भी समाप्त कर देता है जो post-sync output के बिना पांच मिनट से अधिक समय तक sync चरण में रहता है। उस guard को disable करने के लिए `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` सेट करें, या असामान्य रूप से बड़े local diffs के लिए बड़ा millisecond मान इस्तेमाल करें।

पहले run से पहले, repo root से wrapper जांचें:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo wrapper उस stale Crabbox binary को अस्वीकार करता है जो `blacksmith-testbox` advertise नहीं करता। provider को स्पष्ट रूप से पास करें, भले ही `.crabbox.yaml` में owned-cloud defaults हों। Codex worktrees या linked/sparse checkouts में, local `pnpm crabbox:run` script से बचें क्योंकि Crabbox शुरू होने से पहले pnpm dependencies reconcile कर सकता है; इसके बजाय node wrapper को सीधे invoke करें:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith-समर्थित runs को Crabbox 0.22.0 या नया चाहिए ताकि wrapper को मौजूदा Testbox sync, queue, और cleanup व्यवहार मिले। sibling checkout का उपयोग करते समय, timing या proof work से पहले ignored local binary को फिर से build करें:

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

अंतिम JSON summary पढ़ें। उपयोगी fields हैं `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, और `totalMs`। delegated Blacksmith Testbox runs के लिए, Crabbox wrapper exit code और JSON summary ही command result हैं। linked GitHub Actions run hydration और keepalive का owner है; जब SSH command पहले ही return कर चुका हो और Testbox को बाहरी रूप से stop किया गया हो, तो यह `cancelled` के रूप में finish हो सकता है। इसे cleanup/status artifact मानें, जब तक wrapper `exitCode` non-zero न हो या command output failed test न दिखाए। एक-बारगी Blacksmith-समर्थित Crabbox runs को Testbox अपने-आप stop करना चाहिए; अगर कोई run interrupted हो या cleanup अस्पष्ट हो, तो live boxes inspect करें और केवल अपने बनाए हुए boxes stop करें:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

reuse केवल तब इस्तेमाल करें जब आपको सचेत रूप से उसी hydrated box पर कई commands की जरूरत हो:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

यदि Crabbox टूटी हुई layer है लेकिन Blacksmith खुद काम करता है, तो direct Blacksmith को केवल diagnostics जैसे `list`, `status`, और cleanup के लिए इस्तेमाल करें। direct Blacksmith run को maintainer proof मानने से पहले Crabbox path ठीक करें।

यदि `blacksmith testbox list --all` और `blacksmith testbox status` काम करते हैं लेकिन नए warmups कुछ मिनटों के बाद भी बिना IP या Actions run URL के `queued` में रहते हैं, तो इसे Blacksmith provider, queue, billing, या org-limit pressure मानें। अपने बनाए queued ids stop करें, और Testboxes शुरू करने से बचें, फिर proof को नीचे दिए owned Crabbox capacity path पर ले जाएं जबकि कोई Blacksmith dashboard, billing, और org limits जांचे।

owned Crabbox capacity पर केवल तब escalate करें जब Blacksmith down हो, quota-limited हो, आवश्यक environment गायब हो, या owned capacity स्पष्ट रूप से लक्ष्य हो:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS pressure के तहत, `class=beast` से बचें जब तक task को सच में 48xlarge-class CPU की जरूरत न हो। `beast` request 192 vCPUs से शुरू होती है और regional EC2 Spot या On-Demand Standard quota trigger करने का सबसे आसान तरीका है। repo-owned `.crabbox.yaml` defaults `standard`, कई capacity regions, और `capacity.hints: true` पर हैं ताकि brokered AWS leases selected region/market, quota pressure, Spot fallback, और high-pressure class warnings print करें। भारी broad checks के लिए `fast` इस्तेमाल करें, `large` केवल तब जब standard/fast पर्याप्त न हों, और `beast` केवल exceptional CPU-bound lanes जैसे full-suite या all-plugin Docker matrices, explicit release/blocker validation, या high-core performance profiling के लिए। `pnpm check:changed`, focused tests, docs-only work, ordinary lint/typecheck, छोटे E2E repros, या Blacksmith outage triage के लिए `beast` का उपयोग न करें। capacity diagnosis के लिए `--market on-demand` इस्तेमाल करें ताकि Spot market churn signal में न मिले।

`.crabbox.yaml` owned-cloud lanes के लिए provider, sync, और GitHub Actions hydration defaults का owner है। यह local `.git` को exclude करता है ताकि hydrated Actions checkout maintainer-local remotes और object stores sync करने के बजाय अपना remote Git metadata रखे, और यह local runtime/build artifacts को exclude करता है जिन्हें कभी transfer नहीं किया जाना चाहिए। `.github/workflows/crabbox-hydrate.yml` owned-cloud `crabbox run --id <cbx_id>` commands के लिए checkout, Node/pnpm setup, `origin/main` fetch, और non-secret environment handoff का owner है।

## संबंधित

- [Install overview](/hi/install)
- [Development channels](/hi/install/development-channels)
