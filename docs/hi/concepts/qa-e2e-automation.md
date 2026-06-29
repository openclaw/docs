---
read_when:
    - यह समझना कि QA स्टैक कैसे एक साथ फिट बैठता है
    - qa-lab, qa-channel, या परिवहन अडैप्टर का विस्तार करना
    - रिपो-समर्थित QA परिदृश्य जोड़ना
    - Gateway डैशबोर्ड के आसपास उच्च-यथार्थ QA स्वचालन बनाना
summary: 'QA स्टैक का अवलोकन: qa-lab, qa-channel, repo-backed परिदृश्य, लाइव ट्रांसपोर्ट लेन, ट्रांसपोर्ट एडाप्टर, और रिपोर्टिंग।'
title: QA अवलोकन
x-i18n:
    generated_at: "2026-06-28T23:02:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

निजी QA स्टैक का उद्देश्य OpenClaw को एकल यूनिट टेस्ट की तुलना में अधिक यथार्थवादी,
चैनल-आकार वाले तरीके से अभ्यास कराना है।

वर्तमान घटक:

- `extensions/qa-channel`: DM, चैनल, थ्रेड,
  रिएक्शन, एडिट, और डिलीट सतहों वाला सिंथेटिक संदेश चैनल।
- `extensions/qa-lab`: ट्रांसक्रिप्ट देखने,
  इनबाउंड संदेश इंजेक्ट करने, और Markdown रिपोर्ट निर्यात करने के लिए डीबगर UI और QA बस।
- `extensions/qa-matrix`, भावी रनर Plugin: लाइव-ट्रांसपोर्ट अडैप्टर जो
  चाइल्ड QA Gateway के अंदर वास्तविक चैनल चलाते हैं।
- `qa/`: kickoff टास्क और बेसलाइन QA
  परिदृश्यों के लिए रेपो-समर्थित सीड एसेट।
- [Mantis](/hi/concepts/mantis): उन बगों के लिए पहले और बाद का लाइव सत्यापन
  जिन्हें वास्तविक ट्रांसपोर्ट, ब्राउज़र स्क्रीनशॉट, VM स्थिति, और PR प्रमाण चाहिए।

## Command सतह

हर QA फ्लो `pnpm openclaw qa <subcommand>` के अंतर्गत चलता है। कई के पास `pnpm qa:*`
स्क्रिप्ट alias हैं; दोनों रूप समर्थित हैं।

| Command                                             | उद्देश्य                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` के बिना बंडल किया गया QA स्व-जांच; `--qa-profile smoke-ci`, `--qa-profile release`, या `--qa-profile all` के साथ टैक्सोनॉमी-समर्थित maturity प्रोफ़ाइल रनर।                                                                                                      |
| `qa suite`                                          | QA Gateway lane के विरुद्ध रेपो-समर्थित परिदृश्य चलाएं। Alias: disposable Linux VM के लिए `pnpm openclaw qa suite --runner multipass`।                                                                                                                                  |
| `qa coverage`                                       | YAML परिदृश्य-कवरेज इन्वेंटरी प्रिंट करें (मशीन आउटपुट के लिए `--json`)।                                                                                                                                                                                               |
| `qa parity-report`                                  | दो `qa-suite-summary.json` फ़ाइलों की तुलना करें और agentic parity रिपोर्ट लिखें, या एक runtime-pair summary से Codex-vs-OpenClaw runtime parity और token-efficiency रिपोर्ट लिखने के लिए `--runtime-axis --token-efficiency` का उपयोग करें।                                         |
| `qa character-eval`                                 | judged रिपोर्ट के साथ कई लाइव मॉडल पर character QA परिदृश्य चलाएं। [रिपोर्टिंग](#reporting) देखें।                                                                                                                                                            |
| `qa manual`                                         | चुने गए provider/model lane के विरुद्ध one-off prompt चलाएं।                                                                                                                                                                                                          |
| `qa ui`                                             | QA डीबगर UI और स्थानीय QA bus शुरू करें (alias: `pnpm qa:lab:ui`)।                                                                                                                                                                                                    |
| `qa docker-build-image`                             | prebaked QA Docker image बनाएं।                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | QA dashboard + Gateway lane के लिए docker-compose scaffold लिखें।                                                                                                                                                                                                    |
| `qa up`                                             | QA site बनाएं, Docker-समर्थित stack शुरू करें, URL प्रिंट करें (alias: `pnpm qa:lab:up`; `:fast` variant `--use-prebuilt-image --bind-ui-dist --skip-ui-build` जोड़ता है)।                                                                                                  |
| `qa aimock`                                         | केवल AIMock provider server शुरू करें।                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | केवल scenario-aware `mock-openai` provider server शुरू करें।                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | साझा Convex credential pool प्रबंधित करें।                                                                                                                                                                                                                               |
| `qa matrix`                                         | disposable Tuwunel homeserver के विरुद्ध लाइव transport lane। [Matrix QA](/hi/concepts/qa-matrix) देखें।                                                                                                                                                                      |
| `qa telegram`                                       | वास्तविक निजी Telegram group के विरुद्ध लाइव transport lane।                                                                                                                                                                                                              |
| `qa discord`                                        | वास्तविक निजी Discord guild channel के विरुद्ध लाइव transport lane।                                                                                                                                                                                                       |
| `qa slack`                                          | वास्तविक निजी Slack channel के विरुद्ध लाइव transport lane।                                                                                                                                                                                                               |
| `qa whatsapp`                                       | वास्तविक WhatsApp Web accounts के विरुद्ध लाइव transport lane।                                                                                                                                                                                                                 |
| `qa mantis`                                         | लाइव transport bugs के लिए पहले और बाद का verification runner, Discord status-reactions evidence, Crabbox desktop/browser smoke, और Slack-in-VNC smoke के साथ। [Mantis](/hi/concepts/mantis) और [Mantis Slack Desktop Runbook](/hi/concepts/mantis-slack-desktop-runbook) देखें। |

Profile-backed `qa run` `taxonomy.yaml` से membership पढ़ता है, फिर resolved scenarios को `qa suite` के माध्यम से dispatch करता है। `--surface` और
`--category` अलग lanes परिभाषित करने के बजाय चुनी गई profile को filter करते हैं।
परिणामी `qa-evidence.json` में selected-category counts और missing coverage IDs के साथ profile scorecard summary शामिल होती है; individual evidence
entries tests, coverage roles, और results के लिए source of truth बनी रहती हैं।
Taxonomy feature coverage IDs exact proof targets हैं, aliases नहीं। Primary
scenario coverage matching IDs पूरा करता है; secondary coverage advisory रहती है।
Coverage IDs lowercase alphanumeric/dash segments के साथ dotted `namespace.behavior` form का उपयोग करते हैं; profile, surface, और category IDs अभी भी
existing dashed या dotted taxonomy IDs का उपयोग कर सकते हैं।
Slim evidence per-entry `execution` छोड़ देता है और `evidenceMode: "slim"` सेट करता है;
`smoke-ci` slim पर default होता है, और `--evidence-mode full` full entries बहाल करता है:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

mock model providers और Crabline fake provider servers के साथ deterministic profile proof के लिए `smoke-ci` का उपयोग करें। live
channels के विरुद्ध Stable/LTS proof के लिए `release` का उपयोग करें। explicit full-taxonomy evidence runs के लिए ही `all` का उपयोग करें; यह
हर active maturity category चुनता है और `qa_profile=all` के साथ `QA Profile
Evidence` workflow के माध्यम से dispatch किया जा सकता है। जब किसी command को OpenClaw
root profile भी चाहिए, तो root profile को QA command से पहले रखें:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operator flow

वर्तमान QA operator flow दो-pane QA site है:

- बायां: agent के साथ Gateway dashboard (Control UI)।
- दायां: QA Lab, Slack-जैसा transcript और scenario plan दिखाते हुए।

इसे इसके साथ चलाएं:

```bash
pnpm qa:lab:up
```

यह QA site बनाता है, Docker-समर्थित Gateway lane शुरू करता है, और
QA Lab page expose करता है जहां operator या automation loop agent को QA
mission दे सकता है, वास्तविक channel behavior देख सकता है, और रिकॉर्ड कर सकता है कि क्या काम किया, विफल हुआ, या
blocked रहा।

हर बार Docker image rebuild किए बिना तेज QA Lab UI iteration के लिए,
bind-mounted QA Lab bundle के साथ stack शुरू करें:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` Docker services को prebuilt image पर रखता है और
`extensions/qa-lab/web/dist` को `qa-lab` container में bind-mount करता है। `qa:lab:watch`
change पर उस bundle को rebuild करता है, और QA Lab
asset hash बदलने पर browser auto-reload होता है।

स्थानीय OpenTelemetry signal smoke के लिए, चलाएं:

```bash
pnpm qa:otel:smoke
```

यह script local OTLP/HTTP receiver शुरू करती है, `diagnostics-otel` plugin enabled के साथ `otel-trace-smoke` QA
scenario चलाती है, फिर assert करती है कि traces,
metrics, और logs exported हैं। यह exported protobuf trace spans को decode करती है
और release-critical shape जांचती है:
`openclaw.run`, `openclaw.harness.run`, latest GenAI semantic-convention
model-call span, `openclaw.context.assembled`, और `openclaw.message.delivery`
मौजूद होने चाहिए। smoke
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` force करता है, इसलिए model-call
span को `{gen_ai.operation.name} {gen_ai.request.model}` name उपयोग करना चाहिए;
successful turns पर model calls को `StreamAbandoned` export नहीं करना चाहिए; raw diagnostic IDs और
`openclaw.content.*` attributes trace से बाहर रहने चाहिए। raw OTLP
payloads में prompt sentinel, response sentinel, या QA session
key नहीं होना चाहिए। यह QA suite artifacts के पास `otel-smoke-summary.json` लिखता है।

collector-backed OpenTelemetry smoke के लिए, चलाएं:

```bash
pnpm qa:otel:collector-smoke
```

यह lane उसी local receiver के सामने वास्तविक OpenTelemetry Collector Docker container रखता है। endpoint wiring, collector
compatibility, या OTLP export behavior बदलते समय इसका उपयोग करें जिसे in-process receiver mask कर सकता है।

protected Prometheus scrape smoke के लिए, चलाएं:

```bash
pnpm qa:prometheus:smoke
```

वह alias `diagnostics-prometheus` सक्षम करके `docker-prometheus-smoke` QA scenario चलाता है, पुष्टि करता है कि unauthenticated scrapes अस्वीकार किए जाते हैं, फिर जांचता है कि authenticated scrape में prompt content, response content, raw diagnostic identifiers, auth tokens, या local paths के बिना release-critical metric families शामिल हैं।

दोनों observability smokes को लगातार चलाने के लिए, उपयोग करें:

```bash
pnpm qa:observability:smoke
```

collector-backed OpenTelemetry lane और protected Prometheus scrape smoke के लिए, उपयोग करें:

```bash
pnpm qa:observability:collector-smoke
```

Observability QA केवल source-checkout तक सीमित रहता है। npm tarball जानबूझकर QA Lab को शामिल नहीं करता, इसलिए package Docker release lanes `qa` commands नहीं चलाते। diagnostics instrumentation बदलते समय built source checkout से `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, या `pnpm qa:observability:smoke` उपयोग करें।

एक transport-real Matrix smoke lane के लिए, जिसे model-provider credentials की आवश्यकता नहीं होती, deterministic mock OpenAI provider के साथ fast profile चलाएं:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

live-frontier provider lane के लिए, OpenAI-compatible credentials स्पष्ट रूप से दें:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

इस lane के लिए पूरा CLI reference, profile/scenario catalog, env vars, और artifact layout [Matrix QA](/hi/concepts/qa-matrix) में हैं। संक्षेप में: यह Docker में एक disposable Tuwunel homeserver provision करता है, temporary driver/SUT/observer users register करता है, उस transport तक सीमित child QA gateway के भीतर real Matrix plugin चलाता है (कोई `qa-channel` नहीं), फिर `.artifacts/qa-e2e/matrix-<timestamp>/` के तहत Markdown report, JSON summary, observed-events artifact, और combined output log लिखता है।

scenarios वे transport behavior cover करते हैं जिन्हें unit tests end to end साबित नहीं कर सकते: mention gating, allow-bot policies, allowlists, top-level और threaded replies, DM routing, reaction handling, inbound edit suppression, restart replay dedupe, homeserver interruption recovery, approval metadata delivery, media handling, और Matrix E2EE bootstrap/recovery/verification flows। E2EE CLI profile gateway replies जांचने से पहले उसी disposable homeserver के माध्यम से `openclaw matrix encryption setup` और verification commands भी चलाता है।

Discord में bug reproduction के लिए Mantis-only opt-in scenarios भी हैं। explicit status reaction timeline के लिए `--scenario discord-status-reactions-tool-only` उपयोग करें, या real Discord thread बनाने और यह verify करने के लिए कि `message.thread-reply` एक `filePath` attachment preserve करता है, `--scenario discord-thread-reply-filepath-attachment` उपयोग करें। ये scenarios default live Discord lane से बाहर रहते हैं क्योंकि वे broad smoke coverage के बजाय before/after repro probes हैं। जब QA environment में `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` या `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` configure हो, तब thread-attachment Mantis workflow logged-in Discord Web witness video भी जोड़ सकता है। वह viewer profile केवल visual capture के लिए है; pass/fail decision अब भी Discord REST oracle से आता है।

CI `.github/workflows/qa-live-transports-convex.yml` में वही command surface उपयोग करता है। Scheduled और default manual runs QA-provided live-frontier credentials, `--fast`, और `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` के साथ fast Matrix profile execute करते हैं। Manual `matrix_profile=all` पांच profile shards में fan out करता है।

transport-real Telegram, Discord, Slack, और WhatsApp smoke lanes के लिए:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

वे दो bots या accounts (driver + SUT) वाले पहले से मौजूद real channel को target करते हैं। Required env vars, scenario lists, output artifacts, और Convex credential pool नीचे [Telegram, Discord, Slack, और WhatsApp QA reference](#telegram-discord-slack-and-whatsapp-qa-reference) में documented हैं।

VNC rescue के साथ full Slack desktop VM run के लिए, चलाएं:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

वह command Crabbox desktop/browser machine lease करता है, VM के भीतर Slack live lane चलाता है, VNC browser में Slack Web खोलता है, desktop capture करता है, और video capture उपलब्ध होने पर `slack-qa/`, `slack-desktop-smoke.png`, और `slack-desktop-smoke.mp4` को वापस Mantis artifact directory में copy करता है। Crabbox desktop/browser leases capture tools और browser/native-build helper packages पहले से देते हैं, इसलिए scenario को पुराने leases पर ही fallbacks install करने चाहिए। Mantis `mantis-slack-desktop-smoke-report.md` में total और per-phase timings report करता है, ताकि slow runs दिखा सकें कि समय lease warmup, credential acquisition, remote setup, या artifact copy में गया। VNC के माध्यम से Slack Web में manually log in करने के बाद `--lease-id <cbx_...>` reuse करें; reused leases Crabbox के pnpm store cache को भी warm रखते हैं। default `--hydrate-mode source` source checkout से verify करता है और VM के भीतर install/build चलाता है। `--hydrate-mode prehydrated` केवल तब उपयोग करें जब reused remote workspace में पहले से `node_modules` और built `dist/` हो; वह mode महंगा install/build step skip करता है और workspace ready न होने पर fail closed करता है। `--gateway-setup` के साथ, Mantis VM के भीतर port `38973` पर persistent OpenClaw Slack gateway running छोड़ता है; इसके बिना, command सामान्य bot-to-bot Slack QA lane चलाता है और artifact capture के बाद exit करता है।

desktop evidence के साथ native Slack approval UI साबित करने के लिए, Mantis approval checkpoint mode चलाएं:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

यह mode `--gateway-setup` के साथ mutually exclusive है। यह Slack approval scenarios चलाता है, non-approval scenario ids अस्वीकार करता है, हर pending और resolved approval state पर wait करता है, observed Slack API message को `approval-checkpoints/<scenario>-pending.png` और `approval-checkpoints/<scenario>-resolved.png` में render करता है, फिर कोई checkpoint, message evidence, acknowledgement, या rendered screenshot missing या empty होने पर fail करता है। Cold CI leases अब भी `slack-desktop-smoke.png` में Slack sign-in दिखा सकते हैं; approval checkpoint images इस lane के लिए visual proof हैं।

operator checklist, GitHub workflow dispatch command, evidence-comment contract, hydrate-mode decision table, timing interpretation, और failure handling steps [Mantis Slack Desktop Runbook](/hi/concepts/mantis-slack-desktop-runbook) में हैं।

agent/CV style desktop task के लिए, चलाएं:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` Crabbox desktop/browser machine lease या reuse करता है, `crabbox record --while` start करता है, nested `visual-driver` के माध्यम से visible browser चलाता है, `visual-task.png` capture करता है, `--vision-mode image-describe` selected होने पर screenshot के विरुद्ध `openclaw infer image describe` चलाता है, और `visual-task.mp4`, `mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json`, और `mantis-visual-task-report.md` लिखता है। जब `--expect-text` set हो, vision prompt structured JSON verdict मांगता है और केवल तब pass करता है जब model positive visible evidence report करता है; target text को केवल quote करने वाला negative response assertion fail करता है। image-understanding provider को call किए बिना desktop, browser, screenshot, और video plumbing साबित करने वाले no-model smoke के लिए `--vision-mode metadata` उपयोग करें। `visual-task` के लिए recording required artifact है; अगर Crabbox कोई non-empty `visual-task.mp4` record नहीं करता, तो visual driver pass होने पर भी task fail करता है। failure पर, Mantis VNC के लिए lease रखता है, जब तक task पहले ही pass न हो चुका हो और `--keep-lease` set न हो।

pooled live credentials उपयोग करने से पहले, चलाएं:

```bash
pnpm openclaw qa credentials doctor
```

doctor Convex broker env check करता है, endpoint settings validate करता है, और maintainer secret मौजूद होने पर admin/list reachability verify करता है। यह secrets के लिए केवल set/missing status report करता है।

## Live transport coverage

Live transport lanes हर एक अपना scenario list shape invent करने के बजाय एक contract share करते हैं। `qa-channel` broad synthetic product-behavior suite है और live transport coverage matrix का हिस्सा नहीं है।

Live transport runners को shared scenario ids, baseline coverage helpers, और scenario-selection helper `openclaw/plugin-sdk/qa-live-transport-scenarios` से import करने चाहिए।

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Quote reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

यह `qa-channel` को broad product-behavior suite बनाए रखता है, जबकि Matrix, Telegram, और दूसरे live transports एक explicit transport-contract checklist share करते हैं।

QA path में Docker लाए बिना disposable Linux VM lane के लिए, चलाएं:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

यह fresh Multipass guest boot करता है, dependencies install करता है, guest के भीतर OpenClaw build करता है, `qa suite` चलाता है, फिर normal QA report और summary को host पर `.artifacts/qa-e2e/...` में वापस copy करता है। यह host पर `qa suite` जैसा ही scenario-selection behavior reuse करता है। Host और Multipass suite runs default रूप से isolated gateway workers के साथ कई selected scenarios parallel में execute करते हैं। `qa-channel` default concurrency 4 रखता है, जो selected scenario count से capped है। worker count tune करने के लिए `--concurrency <count>` उपयोग करें, या serial execution के लिए `--concurrency 1` उपयोग करें। personal assistant benchmark pack चलाने के लिए `--pack personal-agent` उपयोग करें। pack selector repeated `--scenario` flags के साथ additive है: explicit scenarios पहले run होते हैं, फिर pack scenarios pack order में duplicates हटाकर run होते हैं। जब custom QA runner पहले से OpenTelemetry collector setup supply करता हो और OpenTelemetry और Prometheus diagnostics smoke scenarios को साथ select करना चाहता हो, तब `--pack observability` उपयोग करें। कोई भी scenario fail होने पर command non-zero exit करता है। जब आप failing exit code के बिना artifacts चाहते हों, तब `--allow-failures` उपयोग करें। Live runs उन supported QA auth inputs को forward करते हैं जो guest के लिए practical हैं: env-based provider keys, QA live provider config path, और मौजूद होने पर `CODEX_HOME`। `--output-dir` को repo root के तहत रखें ताकि guest mounted workspace के माध्यम से वापस write कर सके।

## Telegram, Discord, Slack, और WhatsApp QA संदर्भ

Matrix का एक [समर्पित पृष्ठ](/hi/concepts/qa-matrix) है क्योंकि इसमें परिदृश्यों की संख्या अधिक है और Docker-समर्थित homeserver provisioning है। Telegram, Discord, Slack, और WhatsApp पहले से मौजूद वास्तविक transports के विरुद्ध चलते हैं, इसलिए उनका संदर्भ यहां रहता है।

### साझा CLI flags

ये lanes `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` के माध्यम से register होते हैं और समान flags स्वीकार करते हैं:

| Flag                                  | Default                                            | विवरण                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | केवल यह scenario चलाएं। दोहराने योग्य।                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | जहां reports, summaries, evidence, transport-specific artifacts, और output log लिखे जाते हैं। Relative paths `--repo-root` के सापेक्ष resolve होते हैं। |
| `--repo-root <path>`                  | `process.cwd()`                                    | neutral cwd से invoke करते समय repository root।                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA gateway config के अंदर अस्थायी account id।                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` या `live-frontier` (legacy `live-openai` अभी भी काम करता है)।                                                                            |
| `--model <ref>` / `--alt-model <ref>` | provider default                                   | Primary/alternate model refs।                                                                                                                   |
| `--fast`                              | off                                                | जहां समर्थित हो वहां provider fast mode।                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex credential pool](#convex-credential-pool) देखें।                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI में `ci`, अन्यथा `maintainer`                 | `--credential-source convex` होने पर उपयोग की जाने वाली भूमिका।                                                                                                    |

किसी भी failed scenario पर हर lane non-zero exit करता है। `--allow-failures` failing exit code set किए बिना artifacts लिखता है।

### Telegram QA

```bash
pnpm openclaw qa telegram
```

दो अलग-अलग bots (driver + SUT) वाले एक वास्तविक private Telegram group को target करता है। SUT bot के पास Telegram username होना चाहिए; bot-to-bot observation सबसे अच्छा तब काम करता है जब दोनों bots में `@BotFather` में **Bot-to-Bot Communication Mode** enabled हो।

`--credential-source env` होने पर आवश्यक env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numeric chat id (string)।
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Scenarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

implicit default set हमेशा canary, mention gating, native command replies, command addressing, और bot-to-bot group replies को cover करता है। `mock-openai` defaults में deterministic reply-chain और final-message streaming checks भी शामिल हैं। `telegram-current-session-status-tool` opt-in रहता है क्योंकि यह केवल canary के सीधे बाद threaded होने पर stable है, arbitrary native command replies के बाद नहीं। current default/optional split को regression refs के साथ print करने के लिए `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` का उपयोग करें।

Output artifacts:

- `telegram-qa-report.md`
- `qa-evidence.json` - live transport checks के लिए evidence entries, जिनमें profile, coverage, provider, channel, artifacts, result, और RTT fields शामिल हैं।

Package Telegram runs वही Telegram credential contract उपयोग करते हैं। दोहराया गया RTT
measurement सामान्य package Telegram live lane का हिस्सा है; RTT
distribution selected RTT check के लिए `result.timing` के अंतर्गत `qa-evidence.json` में folded है।

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

जब `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` set होता है, package live wrapper
एक `kind: "telegram"` credential lease करता है, leased group/driver/SUT bot
env को installed-package run में export करता है, lease को heartbeat करता है, और
shutdown पर इसे release करता है। Convex selected होने पर package wrapper CI के बाहर
`telegram-mentioned-message-reply` के 20 RTT checks, 30s RTT timeout, और Convex role
`maintainer` पर default करता है। अलग RTT command या Telegram-specific summary format बनाए बिना
RTT measurement tune करने के लिए
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`,
या `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` override करें।

### Discord QA

```bash
pnpm openclaw qa discord
```

दो bots वाले एक वास्तविक private Discord guild channel को target करता है: harness द्वारा controlled driver bot और bundled Discord plugin के माध्यम से child OpenClaw gateway द्वारा started SUT bot। channel mention handling, यह कि SUT bot ने Discord के साथ native `/help` command register किया है, और opt-in Mantis evidence scenarios verify करता है।

`--credential-source env` होने पर आवश्यक env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord द्वारा लौटाए गए SUT bot user id से match होना चाहिए (अन्यथा lane fast fail होता है)।

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` observed-message artifacts में message bodies रखता है।
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` `discord-voice-autojoin` के लिए voice/stage channel चुनता है; इसके बिना, scenario SUT bot के लिए पहला visible voice/stage channel चुनता है।

Scenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in voice scenario। स्वयं चलता है, `channels.discord.voice.autoJoin` enable करता है, और verify करता है कि SUT bot की current Discord voice state target voice/stage channel है। Convex Discord credentials में optional `voiceChannelId` शामिल हो सकता है; अन्यथा runner guild में पहला visible voice/stage channel discover करता है।
- `discord-status-reactions-tool-only` - opt-in Mantis scenario। स्वयं चलता है क्योंकि यह SUT को `messages.statusReactions.enabled=true` के साथ always-on, tool-only guild replies पर switch करता है, फिर REST reaction timeline plus HTML/PNG visual artifacts capture करता है। Mantis before/after reports scenario-provided MP4 artifacts को `baseline.mp4` और `candidate.mp4` के रूप में भी preserve करते हैं।

Discord voice auto-join scenario को explicitly चलाएं:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Mantis status-reaction scenario को explicitly चलाएं:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Output artifacts:

- `discord-qa-report.md`
- `qa-evidence.json` - live transport checks के लिए evidence entries।
- `discord-qa-observed-messages.json` - bodies redacted हैं जब तक `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` न हो।
- status-reaction scenario चलने पर `discord-qa-reaction-timelines.json` और `discord-status-reactions-tool-only-timeline.png`।

### Slack QA

```bash
pnpm openclaw qa slack
```

दो अलग-अलग bots वाले एक वास्तविक private Slack channel को target करता है: harness द्वारा controlled driver bot और bundled Slack plugin के माध्यम से child OpenClaw gateway द्वारा started SUT bot।

`--credential-source env` होने पर आवश्यक env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` observed-message artifacts में message bodies रखता है।
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` Mantis के लिए visual approval
  checkpoints enable करता है। runner `<scenario>.pending.json` और
  `<scenario>.resolved.json` लिखता है, फिर matching `.ack.json` files का इंतज़ार करता है।
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` checkpoint
  acknowledgement timeout को override करता है। default `120000` है।

Scenarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - opt-in native Slack exec approval scenario।
  Gateway के माध्यम से exec approval request करता है, verify करता है कि Slack message में
  native approval buttons हैं, इसे resolve करता है, और resolved Slack update verify करता है।
- `slack-approval-plugin-native` - opt-in native Slack plugin approval scenario।
  exec और plugin approval forwarding को साथ में enable करता है ताकि plugin events
  exec approval routing द्वारा suppressed न हों, फिर वही pending/resolved
  native Slack UI path verify करता है।

Output artifacts:

- `slack-qa-report.md`
- `qa-evidence.json` - live transport checks के लिए evidence entries।
- `slack-qa-observed-messages.json` - bodies redacted हैं जब तक `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` न हो।
- `approval-checkpoints/` - केवल तब जब Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` set करता है; इसमें checkpoint JSON,
  acknowledgement JSON, और pending/resolved screenshots होते हैं।

#### Slack workspace set up करना

lane को एक workspace में दो अलग-अलग Slack apps चाहिए, साथ ही एक channel जिसमें दोनों bots members हों:

- `channelId` - उस channel की `Cxxxxxxxxxx` id जिसमें दोनों bots को invite किया गया है। dedicated channel का उपयोग करें; lane हर run पर post करता है।
- `driverBotToken` - **Driver** app का bot token (`xoxb-...`)।
- `sutBotToken` - **SUT** app का bot token (`xoxb-...`), जो driver से अलग Slack app होना चाहिए ताकि उसका bot user id distinct हो।
- `sutAppToken` - SUT app का app-level token (`xapp-...`) जिसमें `connections:write` हो, Socket Mode द्वारा उपयोग किया जाता है ताकि SUT app events receive कर सके।

production workspace को reuse करने की जगह QA के लिए dedicated Slack workspace को prefer करें।

नीचे दिया गया SUT manifest जानबूझकर bundled Slack plugin के production install (`extensions/slack/src/setup-shared.ts:10`) को live Slack QA suite द्वारा covered permissions और events तक narrow करता है। users जैसे production-channel setup देखते हैं उसके लिए, [Slack channel quick setup](/hi/channels/slack#quick-setup) देखें; QA Driver/SUT pair जानबूझकर अलग है क्योंकि lane को एक workspace में दो distinct bot user ids चाहिए।

**1. Driver app बनाएं**

[api.slack.com/apps](https://api.slack.com/apps) पर जाएं → _Create New App_ → _From a manifest_ → QA workspace चुनें, निम्न manifest पेस्ट करें, फिर _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

_Bot User OAuth Token_ (`xoxb-...`) कॉपी करें - वही `driverBotToken` बनता है। driver को केवल संदेश पोस्ट करने और अपनी पहचान बताने की जरूरत है; कोई events नहीं, कोई Socket Mode नहीं।

**2. SUT app बनाएं**

उसी workspace में _Create New App → From a manifest_ दोहराएं। यह QA app जानबूझकर bundled Slack plugin के production manifest (`extensions/slack/src/setup-shared.ts:10`) का संकरा संस्करण इस्तेमाल करता है: reaction scopes और events छोड़े गए हैं क्योंकि live Slack QA suite अभी reaction handling को cover नहीं करता।

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Slack द्वारा app बनाने के बाद, उसके settings page पर दो काम करें:

- _Install to Workspace_ → _Bot User OAuth Token_ कॉपी करें → वही `sutBotToken` बनता है।
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → scope `connections:write` जोड़ें → save करें → `xapp-...` value कॉपी करें → वही `sutAppToken` बनता है।

प्रत्येक token पर `auth.test` call करके सत्यापित करें कि दोनों bots के user ids अलग-अलग हैं। runtime driver और SUT में अंतर user id से करता है; दोनों के लिए एक ही app दोबारा इस्तेमाल करने पर mention-gating तुरंत fail हो जाएगी।

**3. channel बनाएं**

QA workspace में, एक channel बनाएं (जैसे `#openclaw-qa`) और channel के अंदर से दोनों bots को invite करें:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_ से `Cxxxxxxxxxx` id कॉपी करें - वही `channelId` बनता है। public channel काम करता है; यदि आप private channel इस्तेमाल करते हैं तो दोनों apps के पास पहले से `groups:history` है, इसलिए harness की history reads फिर भी सफल होंगी।

**4. credentials register करें**

दो विकल्प। single-machine debugging के लिए env vars इस्तेमाल करें (चार `OPENCLAW_QA_SLACK_*` variables set करें और `--credential-source env` pass करें), या shared Convex pool seed करें ताकि CI और दूसरे maintainers उन्हें lease कर सकें।

Convex pool के लिए, चार fields को JSON file में लिखें:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

अपने shell में `OPENCLAW_QA_CONVEX_SITE_URL` और `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` export करके, register और verify करें:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`, `status: "active"`, और कोई `lease` field न होने की अपेक्षा करें।

**5. end to end सत्यापित करें**

यह confirm करने के लिए lane locally चलाएं कि दोनों bots broker के जरिए एक-दूसरे से बात कर सकते हैं:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

green run 30 seconds से काफी कम समय में complete होता है और `slack-qa-report.md` में `slack-canary` और `slack-mention-gating` दोनों status `pass` पर दिखते हैं। यदि lane ~90 seconds तक hang करता है और `Convex credential pool exhausted for kind "slack"` के साथ exit करता है, तो या तो pool खाली है या हर row leased है - `qa credentials list --kind slack --status all --json` आपको बताएगा कि कौन सा मामला है।

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

दो dedicated WhatsApp Web accounts को target करता है: harness द्वारा नियंत्रित driver account और child OpenClaw gateway द्वारा bundled WhatsApp plugin के जरिए शुरू किया गया SUT account।

`--credential-source env` होने पर आवश्यक env:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

वैकल्पिक:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` group scenarios जैसे
  `whatsapp-mention-gating` और `whatsapp-group-allowlist-block` enable करता है।
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` observed-message artifacts में message bodies रखता है।

Scenario catalog (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline और group gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Native commands: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Reply और final-output behavior: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Inbound media और structured messages: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. ये driver के जरिए real WhatsApp image, audio,
  document, location, contact, और sticker events भेजते हैं।
- Outbound Gateway और message action coverage:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Access-control coverage: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Native approvals: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Status reactions: `whatsapp-status-reactions`.

catalog में अभी 36 scenarios हैं। तेज smoke coverage के लिए `live-frontier` default lane को 10 scenarios पर छोटा रखा गया है। `mock-openai` default lane real WhatsApp transport के जरिए 31 deterministic scenarios चलाता है, जबकि केवल model output को mock करता है। Approval scenarios और कुछ भारी/blocking checks scenario id द्वारा explicit रहते हैं।

WhatsApp QA driver structured live events (`text`, `media`,
`location`, `reaction`, और `poll`) observe करता है और सक्रिय रूप से media, polls,
contacts, locations, और stickers भेज सकता है। QA Lab उस driver को private
WhatsApp runtime files में जाने के बजाय `@openclaw/whatsapp/api.js` package surface के जरिए import करता है। Message content default रूप से redacted होता है। Outbound poll और upload-file coverage model-prompt-only tool invocation के बजाय deterministic gateway `poll` और `message.action` calls से run होता है।

Output artifacts:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - live transport checks के लिए evidence entries।
- `whatsapp-qa-observed-messages.json` - bodies redacted रहती हैं जब तक `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` न हो।

### Convex credential pool

Telegram, Discord, Slack, और WhatsApp lanes ऊपर दिए env vars पढ़ने के बजाय shared Convex pool से credentials lease कर सकते हैं। `--credential-source convex` pass करें (या `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` set करें); QA Lab एक exclusive lease acquire करता है, run की अवधि तक उसे heartbeat करता है, और shutdown पर release करता है। Pool kinds `"telegram"`, `"discord"`, `"slack"`, और `"whatsapp"` हैं।

Payload shapes जिन्हें broker `admin/add` पर validate करता है:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` numeric chat-id string होना चाहिए।
- Telegram real user (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - केवल Mantis Telegram Desktop proof। Generic QA Lab lanes को यह kind acquire नहीं करना चाहिए।
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - phone numbers अलग-अलग E.164 strings होने चाहिए।

Mantis Telegram Desktop proof workflow TDLib CLI driver और Telegram Desktop witness दोनों के लिए एक exclusive Convex `telegram-user` lease रखता है, फिर proof publish करने के बाद उसे release करता है।

जब किसी PR को deterministic visual diff चाहिए, Mantis `main` और PR head पर वही mock model reply इस्तेमाल कर सकता है जबकि Telegram formatter या delivery layer बदलता है। Capture defaults PR comments के लिए tuned हैं: standard Crabbox class, 24fps desktop recording, 24fps motion GIF, और 1920px preview width। Before/after comments को ऐसा clean bundle publish करना चाहिए जिसमें केवल intended GIFs हों।

Slack lanes भी pool इस्तेमाल कर सकते हैं। Slack payload shape checks अभी broker के बजाय Slack QA runner में रहते हैं; Slack channel id जैसे `Cxxxxxxxxxx` के साथ `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` इस्तेमाल करें। app और scope provisioning के लिए [Slack workspace set up करना](#setting-up-the-slack-workspace) देखें।

Operational env vars और Convex broker endpoint contract [Testing → Shared Telegram credentials via Convex](/hi/help/testing#shared-telegram-credentials-via-convex-v1) में हैं (section name multi-channel pool से पहले का है; lease semantics सभी kinds में shared हैं)।

## Repo-backed seeds

Seed assets `qa/` में रहते हैं:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

ये जानबूझकर git में हैं ताकि QA plan humans और agent दोनों को visible रहे।

`qa-lab` को generic YAML scenario runner रहना चाहिए। प्रत्येक scenario YAML file एक test run के लिए source of truth है और इसमें define होना चाहिए:

- top-level `title`
- `scenario` metadata
- `scenario` में optional category, capability, lane, और risk metadata
- `scenario` में docs और code refs
- `scenario` में optional plugin requirements
- `scenario` में optional gateway config patch
- flow scenarios के लिए executable top-level `flow`, या Vitest और Playwright scenarios के लिए `scenario.execution.kind` /
  `scenario.execution.path`

`flow` को आधार देने वाली पुन: प्रयोज्य रनटाइम सतह को generic
और cross-cutting रहने की अनुमति है। उदाहरण के लिए, YAML scenarios transport-side
helpers को browser-side helpers के साथ जोड़ सकते हैं, जो किसी special-case runner को जोड़े बिना
Gateway `browser.request` seam के माध्यम से embedded Control UI चलाते हैं।

Scenario files को source tree folder के बजाय product capability के आधार पर समूहित किया जाना चाहिए।
Files स्थानांतरित होने पर scenario IDs स्थिर रखें; implementation traceability के लिए `docsRefs` और `codeRefs`
का उपयोग करें।

Baseline list इतनी व्यापक रहनी चाहिए कि यह इन्हें कवर कर सके:

- DM और channel chat
- thread behavior
- message action lifecycle
- cron callbacks
- memory recall
- model switching
- subagent handoff
- repo-reading और docs-reading
- एक छोटा build task जैसे Lobster Invaders

## Provider mock lanes

`qa suite` में दो local provider mock lanes हैं:

- `mock-openai` scenario-aware OpenClaw mock है। यह repo-backed QA और parity gates के लिए default
  deterministic mock lane रहता है।
- `aimock` experimental protocol,
  fixture, record/replay, और chaos coverage के लिए AIMock-backed provider server शुरू करता है। यह additive है और
  `mock-openai` scenario dispatcher को replace नहीं करता।

Provider-lane implementation `extensions/qa-lab/src/providers/` के अंतर्गत रहता है।
हर provider अपने defaults, local server startup, gateway model config,
auth-profile staging needs, और live/mock capability flags का स्वामी होता है। Shared suite और
gateway code को provider names पर branching करने के बजाय provider registry के माध्यम से route करना चाहिए।

## Transport adapters

`qa-lab` YAML QA scenarios के लिए एक generic transport seam का स्वामी है। `qa-channel`
synthetic default है। `crabline` local provider-shaped servers शुरू करता है और
OpenClaw के normal channel plugins को उनके विरुद्ध चलाता है। `live` real
provider credentials और external channels के लिए आरक्षित है।

Architecture level पर, split यह है:

- `qa-lab` generic scenario execution, worker concurrency, artifact writing, और reporting का स्वामी है।
- Transport adapter gateway config, readiness, inbound और outbound observation, transport actions, और normalized transport state का स्वामी है।
- `qa/scenarios/` के अंतर्गत YAML scenario files test run परिभाषित करती हैं; `qa-lab` उन्हें execute करने वाली reusable runtime surface प्रदान करता है।

### Channel जोड़ना

YAML QA system में channel जोड़ने के लिए channel implementation और
एक scenario pack चाहिए जो channel contract को exercise करे। Smoke CI coverage के लिए,
matching Crabline fake provider server जोड़ें और उसे `crabline`
driver के माध्यम से expose करें।

जब shared `qa-lab` host flow का स्वामी हो सकता है, तो नया top-level QA command root न जोड़ें।

`qa-lab` shared host mechanics का स्वामी है:

- `openclaw qa` command root
- suite startup और teardown
- worker concurrency
- artifact writing
- report generation
- scenario execution
- पुराने `qa-channel` scenarios के लिए compatibility aliases

Runner plugins transport contract के स्वामी हैं:

- shared `qa` root के नीचे `openclaw qa <runner>` कैसे mount होता है
- उस transport के लिए gateway कैसे configure होता है
- readiness कैसे check होती है
- inbound events कैसे inject होते हैं
- outbound messages कैसे observe होते हैं
- transcripts और normalized transport state कैसे expose होते हैं
- transport-backed actions कैसे execute होते हैं
- transport-specific reset या cleanup कैसे handle होता है

नए channel के लिए minimum adoption bar:

1. Shared `qa` root के owner के रूप में `qa-lab` रखें।
2. Shared `qa-lab` host seam पर transport runner implement करें।
3. Transport-specific mechanics को runner plugin या channel harness के भीतर रखें।
4. Competing root command register करने के बजाय runner को `openclaw qa <runner>` के रूप में mount करें। Runner plugins को `openclaw.plugin.json` में `qaRunners` declare करना चाहिए और `runtime-api.ts` से matching `qaRunnerCliRegistrations` array export करना चाहिए। `runtime-api.ts` हल्का रखें; lazy CLI और runner execution अलग entrypoints के पीछे रहनी चाहिए।
5. Themed `qa/scenarios/` directories के अंतर्गत YAML scenarios author या adapt करें।
6. नए scenarios के लिए generic scenario helpers का उपयोग करें।
7. Existing compatibility aliases को working रखें जब तक repo intentional migration न कर रहा हो।

Decision rule strict है:

- यदि behavior को `qa-lab` में एक बार express किया जा सकता है, तो उसे `qa-lab` में रखें।
- यदि behavior किसी एक channel transport पर निर्भर है, तो उसे उस runner plugin या plugin harness में रखें।
- यदि scenario को ऐसी नई capability चाहिए जिसे एक से अधिक channel उपयोग कर सकते हैं, तो `suite.ts` में channel-specific branch के बजाय generic helper जोड़ें।
- यदि behavior केवल एक transport के लिए meaningful है, तो scenario को transport-specific रखें और scenario contract में इसे explicit करें।

### Scenario helper names

नए scenarios के लिए preferred generic helpers:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Compatibility aliases existing scenarios के लिए उपलब्ध रहते हैं - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - लेकिन नए scenario authoring में generic names का उपयोग करना चाहिए। Aliases flag-day migration से बचने के लिए मौजूद हैं, आगे के model के रूप में नहीं।

## Reporting

`qa-lab` observed bus timeline से Markdown protocol report export करता है।
Report को उत्तर देना चाहिए:

- क्या काम किया
- क्या fail हुआ
- क्या blocked रहा
- कौन से follow-up scenarios जोड़ने योग्य हैं

Available scenarios की inventory के लिए - जो follow-up work size करने या नया transport wire करने में उपयोगी है - `pnpm openclaw qa coverage` चलाएँ (machine-readable output के लिए `--json` जोड़ें)।
Touched behavior या file path के लिए focused proof चुनते समय, `pnpm openclaw qa coverage --match <query>` चलाएँ।
Match report scenario metadata, docs refs, code refs, coverage IDs, plugins, और provider requirements खोजती है, फिर matching `qa suite --scenario ...` targets print करती है।
हर `qa suite` run selected
scenario set के लिए top-level `qa-evidence.json`,
`qa-suite-summary.json`, और `qa-suite-report.md` artifacts लिखता है। जो scenarios `execution.kind: vitest` या
`execution.kind: playwright` declare करते हैं, वे matching test path चलाते हैं और
per-scenario logs भी लिखते हैं। जो scenarios `execution.kind: script` declare करते हैं, वे
`execution.path` पर evidence producer को `node --import tsx` के माध्यम से चलाते हैं (जिसमें
`${outputDir}` और `${scenarioId}` `execution.args` में expand होते हैं); producer
अपना `qa-evidence.json` लिखता है, जिसकी entries suite
output में import होती हैं और जिसके artifact paths उस producer
`qa-evidence.json` के relative resolve होते हैं। जब `qa suite`
`qa run --qa-profile` के माध्यम से पहुँचा जाता है, तो वही `qa-evidence.json` selected taxonomy categories के लिए profile
scorecard summary भी शामिल करता है।
इसे discovery aid मानें, gate replacement नहीं; selected scenario को अभी भी test किए जा रहे behavior के लिए सही provider mode, live transport, Multipass, Testbox, या release lane चाहिए।
Scorecard context के लिए, [Maturity scorecard](/hi/maturity/scorecard) देखें।

Character और style checks के लिए, वही scenario कई live model
refs पर चलाएँ और judged Markdown report लिखें:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Command local QA gateway child processes चलाता है, Docker नहीं। Character eval
scenarios को persona `SOUL.md` के माध्यम से set करना चाहिए, फिर chat, workspace help, और small file tasks जैसे ordinary user turns चलाने चाहिए। Candidate model को
यह नहीं बताया जाना चाहिए कि उसका evaluation हो रहा है। Command हर full
transcript preserve करता है, basic run stats record करता है, फिर judge models से fast mode में
`xhigh` reasoning के साथ, जहाँ supported हो, runs को naturalness, vibe, और humor के आधार पर rank करने को कहता है।
Providers की तुलना करते समय `--blind-judge-models` उपयोग करें: judge prompt को अभी भी
हर transcript और run status मिलता है, लेकिन candidate refs neutral
labels जैसे `candidate-01` से replace हो जाते हैं; report parsing के बाद rankings को real refs पर वापस map करती है।
Candidate runs default रूप से `high` thinking पर होते हैं, GPT-5.5 के लिए `medium` और
older OpenAI eval refs के लिए `xhigh`, जहाँ supported हो। किसी specific candidate को inline override करें
`--model provider/model,thinking=<level>` के साथ। `--thinking <level>` अब भी
global fallback set करता है, और पुराना `--model-thinking <provider/model=level>` form
compatibility के लिए रखा गया है।
OpenAI candidate refs default रूप से fast mode पर होते हैं ताकि priority processing का उपयोग हो जहाँ
provider उसे support करता है। जब किसी single candidate या judge को override चाहिए, तो inline
`,fast`, `,no-fast`, या `,fast=false` जोड़ें। `--fast` तभी pass करें जब आप
हर candidate model के लिए fast mode force करना चाहते हों। Candidate और judge durations
benchmark analysis के लिए report में record होते हैं, लेकिन judge prompts स्पष्ट रूप से कहते हैं
कि speed के आधार पर rank न करें।
Candidate और judge model runs दोनों default रूप से concurrency 16 पर होते हैं। जब provider limits या local gateway
pressure किसी run को बहुत noisy बना दे, तो
`--concurrency` या `--judge-concurrency` कम करें।
जब कोई candidate `--model` pass नहीं किया जाता, character eval default रूप से
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, और
`google/gemini-3.1-pro-preview` पर होता है जब कोई `--model` pass नहीं किया जाता।
जब कोई `--judge-model` pass नहीं किया जाता, judges default रूप से
`openai/gpt-5.5,thinking=xhigh,fast` और
`anthropic/claude-opus-4-8,thinking=high` होते हैं।

## संबंधित docs

- [Matrix QA](/hi/concepts/qa-matrix)
- [Maturity scorecard](/hi/maturity/scorecard)
- [Personal agent benchmark pack](/hi/concepts/personal-agent-benchmark-pack)
- [QA Channel](/hi/channels/qa-channel)
- [Testing](/hi/help/testing)
- [Dashboard](/hi/web/dashboard)
