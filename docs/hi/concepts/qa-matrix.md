---
read_when:
    - स्थानीय रूप से `pnpm openclaw qa matrix` चलाना
    - Matrix QA परिदृश्यों को जोड़ना या चुनना
    - Matrix QA विफलताओं, टाइमआउट, या अटकी हुई क्लीनअप की ट्रायजिंग
summary: 'Docker-समर्थित Matrix लाइव QA लेन के लिए मेंटेनर संदर्भ: CLI, प्रोफ़ाइल, env vars, परिदृश्य, और आउटपुट आर्टिफैक्ट।'
title: मैट्रिक्स गुणवत्ता आश्वासन
x-i18n:
    generated_at: "2026-06-28T23:02:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA लेन bundled `@openclaw/matrix` Plugin को Docker में disposable Tuwunel homeserver के विरुद्ध चलाती है, जिसमें अस्थायी driver, SUT, और observer खाते तथा seeded rooms शामिल होते हैं। यह Matrix के लिए live transport-real coverage है।

यह maintainer-only tooling है। Packaged OpenClaw releases जानबूझकर `qa-lab` को छोड़ते हैं, इसलिए `openclaw qa` केवल source checkout से उपलब्ध है। Source checkouts bundled runner को सीधे load करते हैं - किसी Plugin install step की ज़रूरत नहीं होती।

व्यापक QA framework संदर्भ के लिए, [QA overview](/hi/concepts/qa-e2e-automation) देखें।

## त्वरित शुरुआत

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

सादा `pnpm openclaw qa matrix` `--profile all` चलाता है और पहली failure पर नहीं रुकता। Release gate के लिए `--profile fast --fail-fast` का उपयोग करें; full inventory को parallel में चलाते समय catalog को `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` के साथ shard करें।

## लेन क्या करती है

1. Docker में disposable Tuwunel homeserver provision करती है (default image `ghcr.io/matrix-construct/tuwunel:v1.5.1`, server name `matrix-qa.test`, port `28008`)।
2. तीन अस्थायी users register करती है - `driver` (inbound traffic भेजता है), `sut` (test के अंतर्गत OpenClaw Matrix account), `observer` (third-party traffic capture)।
3. चुने गए scenarios के लिए ज़रूरी rooms seed करती है (main, threading, media, restart, secondary, allowlist, E2EE, verification DM, आदि)।
4. SUT account तक scoped real Matrix Plugin के साथ child OpenClaw Gateway शुरू करती है; child में `qa-channel` load नहीं होता।
5. Scenarios को sequence में चलाती है, driver/observer Matrix clients के ज़रिए events observe करती है।
6. Homeserver को tear down करती है, report और summary artifacts लिखती है, फिर exit करती है।

## CLI

```text
pnpm openclaw qa matrix [options]
```

### सामान्य flags

| Flag                  | Default                                       | Description                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Scenario profile। [Profiles](#profiles) देखें।                                                                         |
| `--fail-fast`         | off                                           | पहले failed check या scenario के बाद रुकें।                                                                            |
| `--scenario <id>`     | -                                             | केवल यह scenario चलाएं। Repeatable। [Scenarios](#scenarios) देखें।                                                     |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | जहाँ reports, summary, observed events, और output log लिखे जाते हैं। Relative paths `--repo-root` के विरुद्ध resolve होते हैं। |
| `--repo-root <path>`  | `process.cwd()`                               | Neutral working directory से invoke करते समय repository root।                                                         |
| `--sut-account <id>`  | `sut`                                         | QA Gateway config के अंदर Matrix account id।                                                                           |

### Provider flags

लेन real Matrix transport का उपयोग करती है, लेकिन model provider configurable है:

| Flag                     | Default          | Description                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | deterministic mock dispatch के लिए `mock-openai` या live frontier providers के लिए `live-frontier`। Legacy alias `live-openai` अभी भी काम करता है। |
| `--model <ref>`          | provider default | Primary `provider/model` ref।                                                                                                             |
| `--alt-model <ref>`      | provider default | Alternate `provider/model` ref जहाँ scenarios mid-run switch करते हैं।                                                                     |
| `--fast`                 | off              | जहाँ supported हो वहाँ provider fast mode enable करें।                                                                                    |

Matrix QA `--credential-source` या `--credential-role` accept नहीं करता। लेन disposable users को locally provision करती है; lease करने के लिए कोई shared credential pool नहीं है।

## Profiles

चुना गया profile तय करता है कि कौन से scenarios चलेंगे।

| Profile         | Use it for                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (default) | Full catalog। धीमा लेकिन exhaustive।                                                                                                                                                                                                 |
| `fast`          | Release-gate subset जो live transport contract को exercise करता है: canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation, और exec approval metadata delivery। |
| `transport`     | Transport-level threading, DM, room, autojoin, mention/allowlist, approval, और reaction scenarios।                                                                                                                                   |
| `media`         | Image, audio, video, PDF, EPUB attachment coverage।                                                                                                                                                                                  |
| `e2ee-smoke`    | न्यूनतम E2EE coverage - basic encrypted reply, thread follow-up, bootstrap success।                                                                                                                                                  |
| `e2ee-deep`     | Exhaustive E2EE state-loss, backup, key, और recovery scenarios।                                                                                                                                                                      |
| `e2ee-cli`      | QA harness के ज़रिए चलाए गए `openclaw matrix encryption setup` और `verify *` CLI scenarios।                                                                                                                                          |

सटीक mapping `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` में है।

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

Hand-picked set चलाने के लिए `--scenario <id>` (repeatable) pass करें; profile gating को ignore करने के लिए `--profile all` के साथ combine करें।

## Environment variables

| वेरिएबल                                | डिफ़ॉल्ट                                   | प्रभाव                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 मिनट)                        | पूरे रन पर कठोर ऊपरी सीमा।                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | प्रारंभिक कैनरी उत्तर की सीमा। Release CI साझा रनर पर इसे बढ़ा देता है ताकि धीमा पहला gateway टर्न scenario coverage शुरू होने से पहले विफल न हो।                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | नकारात्मक no-reply दावों के लिए शांत विंडो। रन टाइमआउट के `≤` तक सीमित।                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker teardown की सीमा। विफलता सतहों में recovery `docker compose ... down --remove-orphans` कमांड शामिल है।                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | किसी अलग Tuwunel संस्करण के विरुद्ध सत्यापन करते समय homeserver image को ओवरराइड करें।                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | चालू                                        | `0` stderr पर `[matrix-qa] ...` प्रगति पंक्तियों को शांत करता है। `1` उन्हें बलपूर्वक चालू करता है।                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | रेडैक्टेड                                  | `1` message body और `formatted_body` को `matrix-qa-observed-events.json` में रखता है। डिफ़ॉल्ट CI artifacts को सुरक्षित रखने के लिए रेडैक्ट करता है।                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | बंद                                       | `1` artifact लिखे जाने के बाद deterministic `process.exit` को छोड़ देता है। डिफ़ॉल्ट बलपूर्वक exit करता है क्योंकि matrix-js-sdk के native crypto handles artifact completion के बाद भी event loop को जीवित रख सकते हैं। |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | सेट नहीं                                  | जब किसी बाहरी launcher (जैसे `scripts/run-node.mjs`) द्वारा सेट किया जाता है, Matrix QA अपना tee शुरू करने के बजाय उसी log path का दोबारा उपयोग करता है।                                                                   |

## आउटपुट artifacts

`--output-dir` में लिखे जाते हैं:

- `matrix-qa-report.md` - Markdown protocol report (क्या पास हुआ, विफल हुआ, छोड़ा गया, और क्यों)।
- `matrix-qa-summary.json` - CI parsing और dashboards के लिए उपयुक्त structured summary।
- `matrix-qa-observed-events.json` - driver और observer clients से देखे गए Matrix events। Bodies तब तक redacted रहते हैं जब तक `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` न हो; approval metadata को चुने हुए सुरक्षित fields और truncated command preview के साथ संक्षेपित किया जाता है।
- `matrix-qa-output.log` - रन से संयुक्त stdout/stderr। यदि `OPENCLAW_RUN_NODE_OUTPUT_LOG` सेट है, तो इसके बजाय बाहरी launcher का log दोबारा उपयोग किया जाता है।

डिफ़ॉल्ट output dir `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` है ताकि लगातार रन एक-दूसरे को overwrite न करें।

## Triage सुझाव

- **रन अंत के पास अटकता है:** `matrix-js-sdk` native crypto handles harness से अधिक समय तक जीवित रह सकते हैं। डिफ़ॉल्ट artifact लिखने के बाद साफ़ `process.exit` को बाध्य करता है; यदि आपने `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` unset किया है, तो process के कुछ देर बने रहने की अपेक्षा करें।
- **Cleanup error:** printed recovery command (`docker compose ... down --remove-orphans` invocation) देखें और homeserver port रिलीज़ करने के लिए उसे manually चलाएँ।
- **CI में flaky negative-assertion windows:** CI तेज़ होने पर `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (डिफ़ॉल्ट 8 सेकंड) घटाएँ; धीमे shared runners पर इसे बढ़ाएँ।
- **Bug report के लिए redacted bodies चाहिए:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` के साथ दोबारा चलाएँ और `matrix-qa-observed-events.json` attach करें। परिणामी artifact को sensitive मानें।
- **अलग Tuwunel संस्करण:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` को test के अंतर्गत संस्करण पर point करें। lane केवल pinned default image को check करती है।

## Live transport contract

Matrix उन तीन live transport lanes (Matrix, Telegram, Discord) में से एक है जो [QA overview → Live transport coverage](/hi/concepts/qa-e2e-automation#live-transport-coverage) में परिभाषित single contract checklist साझा करते हैं। `qa-channel` broad synthetic suite बना रहता है और जानबूझकर उस matrix का हिस्सा नहीं है।

## संबंधित

- [QA overview](/hi/concepts/qa-e2e-automation) - समग्र QA stack और live transport contract
- [QA Channel](/hi/channels/qa-channel) - repo-backed scenarios के लिए synthetic channel adapter
- [Testing](/hi/help/testing) - tests चलाना और QA coverage जोड़ना
- [Matrix](/hi/channels/matrix) - test के अंतर्गत channel Plugin
