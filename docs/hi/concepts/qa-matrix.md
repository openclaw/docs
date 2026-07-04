---
read_when:
    - स्थानीय रूप से pnpm openclaw qa matrix चलाना
    - Matrix QA परिदृश्य जोड़ना या चुनना
    - Matrix QA विफलताओं, टाइमआउट, या अटकी हुई सफ़ाई का ट्रायाज करना
summary: 'मेंटेनर संदर्भ, Docker-समर्थित Matrix लाइव QA लेन के लिए: CLI, प्रोफ़ाइल, env vars, परिदृश्य, और आउटपुट आर्टिफैक्ट।'
title: मैट्रिक्स गुणवत्ता आश्वासन
x-i18n:
    generated_at: "2026-07-04T20:33:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA लेन bundled `@openclaw/matrix` Plugin को Docker में disposable Tuwunel homeserver के विरुद्ध चलाती है, जिसमें temporary driver, SUT, और observer खाते तथा seeded rooms होते हैं। यह Matrix के लिए live transport-real coverage है।

यह केवल maintainer tooling है। Packaged OpenClaw releases जानबूझकर `qa-lab` को शामिल नहीं करते, इसलिए `openclaw qa` केवल source checkout से उपलब्ध है। Source checkouts bundled runner को सीधे load करते हैं - किसी Plugin install step की आवश्यकता नहीं है।

व्यापक QA framework context के लिए, [QA overview](/hi/concepts/qa-e2e-automation) देखें।

## त्वरित शुरुआत

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Plain `pnpm openclaw qa matrix` `--profile all` चलाता है और पहली विफलता पर रुकता नहीं है। Release gate के लिए `--profile fast --fail-fast` उपयोग करें; full inventory को parallel में चलाते समय catalog को `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` से shard करें।

## लेन क्या करती है

1. Docker में disposable Tuwunel homeserver provision करती है (default image `ghcr.io/matrix-construct/tuwunel:v1.5.1`, server name `matrix-qa.test`, port `28008`) bounded redacting request/response recorder के पीछे।
2. तीन temporary users register करती है - `driver` (inbound traffic भेजता है), `sut` (test के अंतर्गत OpenClaw Matrix account), `observer` (third-party traffic capture)।
3. selected scenarios के लिए आवश्यक rooms seed करती है (main, threading, media, restart, secondary, allowlist, E2EE, verification DM, आदि)।
4. recorded Tuwunel boundary के विरुद्ध substrate-neutral `matrix-qa-v1` protocol probe चलाती है। Unit tests Matrix protocol fixture के साथ probe contract साबित करते हैं; [#99707](https://github.com/openclaw/openclaw/pull/99707) में canonical QA transport adapter host real Crabline target wiring का मालिक है।
5. SUT account तक scoped real Matrix Plugin के साथ child OpenClaw Gateway शुरू करती है; `qa-channel` child में load नहीं होता।
6. Scenarios को क्रम में चलाती है, driver/observer Matrix clients के माध्यम से events observe करती है और recorded traffic से route/state expectations derive करती है।
7. homeserver tear down करती है, report और evidence artifacts लिखती है, फिर exit करती है।

## CLI

```text
pnpm openclaw qa matrix [options]
```

### सामान्य flags

| Flag                  | Default                                       | विवरण                                                                                                                                      |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Scenario profile. [Profiles](#profiles) देखें।                                                                                              |
| `--fail-fast`         | off                                           | पहले failed check या scenario के बाद रुकें।                                                                                                 |
| `--scenario <id>`     | -                                             | केवल यह scenario चलाएँ। Repeatable. [Scenarios](#scenarios) देखें।                                                                          |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | जहाँ reports, summary, route/state inventory, observed events, और output log लिखे जाते हैं। Relative paths `--repo-root` के विरुद्ध resolve होते हैं। |
| `--repo-root <path>`  | `process.cwd()`                               | neutral working directory से invoke करते समय repository root.                                                                               |
| `--sut-account <id>`  | `sut`                                         | QA Gateway config के अंदर Matrix account id.                                                                                                |

### Provider flags

लेन real Matrix transport का उपयोग करती है लेकिन model provider configurable है:

| Flag                     | Default          | विवरण                                                                                                                                  |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | deterministic mock dispatch के लिए `mock-openai` या live frontier providers के लिए `live-frontier`। Legacy alias `live-openai` अभी भी काम करता है। |
| `--model <ref>`          | provider default | Primary `provider/model` ref.                                                                                                           |
| `--alt-model <ref>`      | provider default | Alternate `provider/model` ref जहाँ scenarios mid-run switch करते हैं।                                                                  |
| `--fast`                 | off              | जहाँ supported हो, provider fast mode enable करें।                                                                                      |

Matrix QA `--credential-source` या `--credential-role` accept नहीं करता। लेन disposable users को locally provision करती है; lease करने के लिए कोई shared credential pool नहीं है।

## Profiles

Selected profile तय करता है कि कौन से scenarios चलेंगे।

| Profile         | इसका उपयोग किसके लिए करें                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (default) | Full catalog. धीमा लेकिन exhaustive.                                                                                                                                                                                                |
| `fast`          | Release-gate subset जो live transport contract exercise करता है: canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation, और exec approval metadata delivery. |
| `transport`     | Transport-level threading, DM, room, autojoin, mention/allowlist, approval, और reaction scenarios.                                                                                                                                  |
| `media`         | Image, audio, video, PDF, EPUB attachment coverage.                                                                                                                                                                                  |
| `e2ee-smoke`    | न्यूनतम E2EE coverage - basic encrypted reply, thread follow-up, bootstrap success.                                                                                                                                                  |
| `e2ee-deep`     | Exhaustive E2EE state-loss, backup, key, और recovery scenarios.                                                                                                                                                                      |
| `e2ee-cli`      | QA harness के माध्यम से चलाए गए `openclaw matrix encryption setup` और `verify *` CLI scenarios.                                                                                                                                     |

Exact mapping `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` में है।

## Scenarios

Full scenario id list `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` में `MatrixQaScenarioId` union है। Categories में शामिल हैं:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming और tool progress - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- approvals - `matrix-approval-*` (exec/plugin metadata, chunked fallback, deny reactions, threads, और `target: "both"` routing)
- restart और replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot, और allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (basic reply, thread follow-up, bootstrap, recovery key lifecycle, state-loss variants, server backup behavior, device hygiene, SAS / QR / DM verification, restart, artifact redaction)
- E2EE CLI - `matrix-e2ee-cli-*` (encryption setup, idempotent setup, bootstrap failure, recovery-key lifecycle, multi-account, gateway-reply round-trip, self-verification)

Hand-picked set चलाने के लिए `--scenario <id>` (repeatable) pass करें; profile gating ignore करने के लिए `--profile all` के साथ combine करें।

## Environment variables

| चर                                     | डिफ़ॉल्ट                                  | प्रभाव                                                                                                                                                                                                            |
| -------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 मिनट)                       | पूरे रन की कठोर ऊपरी सीमा।                                                                                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | शुरुआती कैनरी उत्तर की सीमा। Release CI साझा रनर पर इसे बढ़ा देता है ताकि धीमा पहला Gateway टर्न परिदृश्य कवरेज शुरू होने से पहले विफल न हो।                                                                    |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | नकारात्मक नो-रिप्लाई दावों के लिए शांत विंडो। रन टाइमआउट के `≤` तक सीमित।                                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker टियरडाउन की सीमा। विफलता सतहों में रिकवरी `docker compose ... down --remove-orphans` कमांड शामिल है।                                                                                                     |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | किसी अलग Tuwunel संस्करण के विरुद्ध सत्यापन करते समय होमसर्वर इमेज को ओवरराइड करें।                                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | चालू                                      | `0` stderr पर `[matrix-qa] ...` प्रगति पंक्तियों को शांत करता है। `1` उन्हें चालू करने के लिए बाध्य करता है।                                                                                                      |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | संपादित                                   | `1` संदेश बॉडी और `formatted_body` को `matrix-qa-observed-events.json` में रखता है। डिफ़ॉल्ट CI आर्टिफैक्ट्स को सुरक्षित रखने के लिए संपादित करता है।                                                           |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | बंद                                       | `1` आर्टिफैक्ट लिखने के बाद नियतात्मक `process.exit` को छोड़ देता है। डिफ़ॉल्ट बाहर निकलने के लिए बाध्य करता है क्योंकि matrix-js-sdk के नेटिव क्रिप्टो हैंडल आर्टिफैक्ट पूरा होने के बाद भी इवेंट लूप को जीवित रख सकते हैं। |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | सेट नहीं                                  | जब किसी बाहरी लॉन्चर (जैसे `scripts/run-node.mjs`) द्वारा सेट किया जाता है, तो Matrix QA अपनी tee शुरू करने के बजाय उसी लॉग पथ का पुनः उपयोग करता है।                                                            |

## आउटपुट आर्टिफैक्ट्स

`--output-dir` में लिखे जाते हैं:

- `matrix-qa-report.md` - Markdown प्रोटोकॉल रिपोर्ट (क्या पास हुआ, विफल हुआ, छोड़ा गया, और क्यों)।
- `matrix-qa-summary.json` - CI पार्सिंग और डैशबोर्ड के लिए उपयुक्त संरचित सारांश।
- `matrix-qa-route-state-manifest.json` - परिदृश्य id के आधार पर कुंजीबद्ध डायनामिक `matrix-qa-v1` इन्वेंटरी। यह उस रन के दौरान देखे गए संपादित रूट/बॉडी आकार, अनुरोध क्रम, देखे गए रिट्राई, त्रुटियां, sync-token निरंतरता, और डिवाइस/की/मीडिया/बैकअप स्टेट परिवारों को रिकॉर्ड करता है। यह निष्पादन योग्य साक्ष्य है, चेक-इन किया गया बेसलाइन नहीं।
- `matrix-qa-observed-events.json` - ड्राइवर और ऑब्जर्वर क्लाइंट से देखे गए Matrix इवेंट। जब तक `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` न हो, बॉडी संपादित रहती हैं; approval मेटाडेटा को चयनित सुरक्षित फ़ील्ड और काटे गए कमांड पूर्वावलोकन के साथ सारांशित किया जाता है।
- `matrix-qa-output.log` - रन से संयुक्त stdout/stderr। यदि `OPENCLAW_RUN_NODE_OUTPUT_LOG` सेट है, तो इसके बजाय बाहरी लॉन्चर के लॉग का पुनः उपयोग किया जाता है।

डिफ़ॉल्ट आउटपुट dir `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` है, ताकि लगातार रन एक-दूसरे को ओवरराइट न करें।

## ट्रायाज सुझाव

- **रन अंत के पास अटकता है:** `matrix-js-sdk` नेटिव क्रिप्टो हैंडल हार्नेस से अधिक समय तक जीवित रह सकते हैं। डिफ़ॉल्ट आर्टिफैक्ट लिखने के बाद साफ़ `process.exit` के लिए बाध्य करता है; यदि आपने `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` को अनसेट किया है, तो प्रक्रिया के रुके रहने की अपेक्षा करें।
- **क्लीनअप त्रुटि:** प्रिंट किए गए रिकवरी कमांड (`docker compose ... down --remove-orphans` invocation) को देखें और होमसर्वर पोर्ट रिलीज़ करने के लिए उसे मैन्युअल रूप से चलाएं।
- **CI में अस्थिर नकारात्मक-दावा विंडो:** जब CI तेज़ हो तो `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (डिफ़ॉल्ट 8 s) कम करें; धीमे साझा रनर पर इसे बढ़ाएं।
- **बग रिपोर्ट के लिए संपादित बॉडी चाहिए:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` के साथ फिर से चलाएं और `matrix-qa-observed-events.json` संलग्न करें। परिणामी आर्टिफैक्ट को संवेदनशील मानें।
- **अलग Tuwunel संस्करण:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` को परीक्षणाधीन संस्करण पर इंगित करें। लेन केवल पिन की गई डिफ़ॉल्ट इमेज को चेक करती है।

## लाइव ट्रांसपोर्ट अनुबंध

Matrix उन तीन लाइव ट्रांसपोर्ट लेन (Matrix, Telegram, Discord) में से एक है जो [QA अवलोकन → लाइव ट्रांसपोर्ट कवरेज](/hi/concepts/qa-e2e-automation#live-transport-coverage) में परिभाषित एकल अनुबंध चेकलिस्ट साझा करती हैं। `qa-channel` व्यापक सिंथेटिक सूट बना रहता है और जानबूझकर उस मैट्रिक्स का हिस्सा नहीं है।

## संबंधित

- [QA अवलोकन](/hi/concepts/qa-e2e-automation) - समग्र QA स्टैक और लाइव ट्रांसपोर्ट अनुबंध
- [QA Channel](/hi/channels/qa-channel) - रेपो-समर्थित परिदृश्यों के लिए सिंथेटिक चैनल एडाप्टर
- [परीक्षण](/hi/help/testing) - परीक्षण चलाना और QA कवरेज जोड़ना
- [Matrix](/hi/channels/matrix) - परीक्षणाधीन चैनल Plugin
