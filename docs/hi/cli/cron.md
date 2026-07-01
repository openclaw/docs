---
read_when:
    - आप निर्धारित जॉब और वेकअप चाहते हैं
    - आप Cron निष्पादन और लॉग डीबग कर रहे हैं
summary: '`openclaw cron` के लिए CLI संदर्भ (पृष्ठभूमि जॉब्स शेड्यूल और चलाने के लिए)'
title: Cron
x-i18n:
    generated_at: "2026-07-01T08:03:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway scheduler के लिए Cron jobs प्रबंधित करें।

<Tip>
पूरे command surface के लिए `openclaw cron --help` चलाएँ। वैचारिक मार्गदर्शिका के लिए [Cron jobs](/hi/automation/cron-jobs) देखें।
</Tip>

## जल्दी jobs बनाएँ

`openclaw cron create`, `openclaw cron add` का alias है। नए jobs के लिए, schedule पहले और prompt दूसरे रखें:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

जब job को chat target पर पहुँचाने के बजाय finished payload POST करना हो, तो `--webhook <url>` का उपयोग करें:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

OpenClaw cron के अंदर isolated agent/model run शुरू किए बिना चलने वाले deterministic shell-style jobs के लिए `--command` का उपयोग करें:

<Note>
Command cron jobs admin-authored Gateway automation हैं। उन्हें बनाना, संपादित करना,
हटाना, या manually चलाना `operator.admin` मांगता है; scheduled run
बाद में Gateway process में execute होता है, agent `tools.exec` tool call के रूप में नहीं।
`tools.exec.*` और exec approvals अभी भी model-visible exec tools को govern करते हैं।
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` `argv: ["sh", "-lc", <shell>]` store करता है। exact argv execution के लिए `--command-argv '["node","scripts/report.mjs"]'` का उपयोग करें। Command jobs stdout/stderr capture करते हैं, सामान्य cron history record करते हैं, और isolated jobs जैसे ही `announce`, `webhook`, या `none` delivery modes के माध्यम से output route करते हैं। केवल `NO_REPLY` print करने वाला command suppress कर दिया जाता है।

## Sessions

`--session` `main`, `isolated`, `current`, या `session:<id>` स्वीकार करता है।

<AccordionGroup>
  <Accordion title="Session keys">
    - `main` agent के main session से bind करता है।
    - `isolated` हर run के लिए fresh transcript और session id बनाता है।
    - `current` creation time पर active session से bind करता है।
    - `session:<id>` किसी explicit persistent session key पर pin करता है।

  </Accordion>
  <Accordion title="Isolated session semantics">
    Isolated runs ambient conversation context reset करते हैं। नए run के लिए channel और group routing, send/queue policy, elevation, origin, और ACP runtime binding reset होते हैं। Safe preferences और explicit user-selected model या auth overrides runs के बीच carry across हो सकते हैं।
  </Accordion>
</AccordionGroup>

## Delivery

`openclaw cron list` और `openclaw cron show <job-id>` resolved delivery route का preview करते हैं। `channel: "last"` के लिए, preview दिखाता है कि route main या current session से resolve हुआ है, या fail closed होगा।

Provider-prefixed targets unresolved announce channels को disambiguate कर सकते हैं। उदाहरण के लिए, `to: "telegram:123"` Telegram चुनता है जब `delivery.channel` omitted हो या `last` हो। केवल loaded plugin द्वारा advertised prefixes provider selectors होते हैं। यदि `delivery.channel` explicit है, तो prefix को उस channel से match करना चाहिए; `channel: "whatsapp"` के साथ `to: "telegram:123"` rejected है। `imessage:` और `sms:` जैसे service prefixes channel-owned target syntax बने रहते हैं।

<Note>
Isolated `cron add` jobs default रूप से `--announce` delivery का उपयोग करते हैं। output internal रखने के लिए `--no-deliver` का उपयोग करें। `--deliver`, `--announce` का deprecated alias बना रहता है।
</Note>

### Delivery ownership

Isolated cron chat delivery agent और runner के बीच shared है:

- chat route उपलब्ध होने पर agent `message` tool का उपयोग करके सीधे भेज सकता है।
- `announce` final reply को केवल तब fallback-deliver करता है जब agent ने resolved target पर सीधे नहीं भेजा।
- `webhook` finished payload को URL पर post करता है।
- `none` runner fallback delivery disable करता है।

webhook delivery set करने के लिए `cron add|create --webhook <url>` या `cron edit <job-id> --webhook <url>` का उपयोग करें। `--webhook` को `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, या `--account` जैसे chat delivery flags के साथ combine न करें।

`cron edit <job-id>` individual delivery routing fields को `--clear-channel`, `--clear-to`, `--clear-thread-id`, और `--clear-account` से unset कर सकता है (हर एक अपने matching set flag के साथ combine होने पर rejected होता है)। `--no-deliver` से अलग, जो केवल runner fallback delivery disable करता है, ये stored field हटाते हैं ताकि job route के उस हिस्से को फिर से defaults से resolve करे।

`--announce` final reply के लिए runner fallback delivery है। `--no-deliver` उस fallback को disable करता है लेकिन chat route उपलब्ध होने पर agent का `message` tool नहीं हटाता।

active chat से बनाए गए reminders fallback announce delivery के लिए live chat delivery target preserve करते हैं। Internal session keys lowercase हो सकती हैं; उन्हें Matrix room IDs जैसे case-sensitive provider IDs के लिए source of truth के रूप में उपयोग न करें।

### Failure delivery

Failure notifications इस क्रम में resolve होते हैं:

1. job पर `delivery.failureDestination`।
2. Global `cron.failureDestination`।
3. job का primary announce target (जब कोई explicit failure destination set न हो)।

<Note>
Main-session jobs केवल तब `delivery.failureDestination` का उपयोग कर सकते हैं जब primary delivery mode `webhook` हो। Isolated jobs इसे सभी modes में स्वीकार करते हैं।
</Note>

Note: isolated cron runs run-level agent failures को job errors मानते हैं, तब भी जब
कोई reply payload produce नहीं होता, इसलिए model/provider failures फिर भी error
counters increment करते हैं और failure notifications trigger करते हैं।

Command cron jobs isolated agent turn शुरू नहीं करते। zero exit code
`ok` record करता है; non-zero exit, signal, timeout, या no-output timeout `error` record करता है और
वही failure notification path trigger कर सकता है।

यदि isolated run पहले model request से पहले time out होता है, तो `openclaw cron show`
और `openclaw cron runs` phase-specific error include करते हैं जैसे
`setup timed out before runner start` या
`stalled before first model call (last phase: context-engine)`।
CLI-backed providers के लिए, pre-model watchdog external
CLI turn शुरू होने तक active रहता है, इसलिए session lookup, hook, auth, prompt, और CLI setup stalls
pre-model cron failures के रूप में reported होते हैं।

## Scheduling

### One-shot jobs

`--at <datetime>` one-shot run schedule करता है। Offset-less datetimes को UTC माना जाता है जब तक कि आप `--tz <iana>` भी pass न करें, जो दी गई timezone में wall-clock time interpret करता है।

<Note>
One-shot jobs success के बाद default रूप से delete हो जाते हैं। उन्हें preserve करने के लिए `--keep-after-run` का उपयोग करें।
</Note>

### Recurring jobs

Recurring jobs consecutive errors के बाद exponential retry backoff उपयोग करते हैं: 30s, 1m, 5m, 15m, 60m। अगले successful run के बाद schedule normal हो जाता है।

Skipped runs execution errors से अलग track किए जाते हैं। वे retry backoff को affect नहीं करते, लेकिन `openclaw cron edit <job-id> --failure-alert-include-skipped` failure alerts को repeated skipped-run notifications में opt कर सकता है।

local configured model provider को target करने वाले isolated jobs के लिए, cron agent turn शुरू करने से पहले lightweight provider preflight चलाता है। Loopback, private-network, और `.local` `api: "ollama"` providers को `/api/tags` पर probe किया जाता है; vLLM, SGLang, और LM Studio जैसे local OpenAI-compatible providers को `/models` पर probe किया जाता है। यदि endpoint unreachable है, तो run `skipped` के रूप में record होता है और बाद के schedule पर retry किया जाता है; matching dead endpoints 5 minutes के लिए cached रहते हैं ताकि कई jobs उसी local server पर hammer न करें।

Note: cron jobs, pending runtime state, और run history shared SQLite state database में रहते हैं। Legacy `jobs.json`, `jobs-state.json`, और `runs/*.jsonl` files एक बार import की जाती हैं और `.migrated` suffix के साथ renamed होती हैं। import के बाद, JSON files edit करने के बजाय `openclaw cron add|edit|remove` से schedules edit करें।

### Manual runs

`openclaw cron run <job-id>` default रूप से force-runs करता है और manual run queue होते ही return करता है। Successful responses में `{ ok: true, enqueued: true, runId }` शामिल होता है। बाद का result inspect करने के लिए returned `runId` का उपयोग करें:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

जब script को उस exact queued run के terminal status record करने तक block करना हो, तो `--wait` जोड़ें:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait` के साथ, CLI पहले भी `cron.run` call करता है, फिर returned `runId` के लिए `cron.runs` poll करता है। command केवल तब `0` exit करता है जब run status `ok` के साथ finish होता है। run `error` या `skipped` के साथ finish होने पर, Gateway response में `runId` शामिल न होने पर, या `--wait-timeout` expire होने पर यह non-zero exit करता है। `--poll-interval` शून्य से अधिक होना चाहिए।

<Note>
जब आप चाहते हैं कि manual command केवल तभी run करे जब job currently due हो, तो `--due` का उपयोग करें। यदि `--due --wait` run enqueue नहीं करता, तो command polling के बजाय normal non-run response return करता है।
</Note>

## Models

`cron add|edit --model <ref>` job के लिए allowed model चुनता है। `cron add|edit --fallbacks <list>` per-job fallback models set करता है, उदाहरण के लिए `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; no fallbacks वाले strict run के लिए `--fallbacks ""` pass करें। `cron edit <job-id> --clear-fallbacks` per-job fallback override हटाता है। `cron edit <job-id> --clear-model` per-job model override हटाता है ताकि job normal cron model-selection precedence follow करे (stored cron-session override यदि present हो, अन्यथा agent/default model); इसे `--model` के साथ combine नहीं किया जा सकता। `cron add|edit --thinking <level>` per-job thinking override set करता है; `cron edit <job-id> --clear-thinking` इसे हटाता है ताकि job normal cron thinking precedence follow करे, और इसे `--thinking` के साथ combine नहीं किया जा सकता।

<Warning>
यदि model allowed नहीं है या resolve नहीं हो सकता, तो cron job के agent या default model selection पर fallback करने के बजाय explicit validation error के साथ run fail करता है।
</Warning>

Cron `--model` **job primary** है, chat-session `/model` override नहीं। इसका मतलब है:

- selected job model fail होने पर भी configured model fallbacks apply होते हैं।
- per-job payload `fallbacks` present होने पर configured fallback list को replace करता है।
- empty per-job fallback list (`--fallbacks ""` या job payload/API में `fallbacks: []`) cron run को strict बनाती है।
- जब job में `--model` हो लेकिन कोई fallback list configured न हो, OpenClaw explicit empty fallback override pass करता है ताकि agent primary hidden retry target के रूप में append न हो।
- Local-provider preflight checks cron run को `skipped` mark करने से पहले configured fallbacks walk करते हैं।

`openclaw doctor` उन jobs की report करता है जिनमें पहले से `payload.model` set है, जिसमें provider namespace counts और `agents.defaults.model` के विरुद्ध mismatches शामिल हैं। इस check का उपयोग तब करें जब auth, provider, या billing behavior live chat और scheduled jobs के बीच अलग दिखता हो।

### Isolated cron model precedence

Isolated cron active model को इस क्रम में resolve करता है:

1. Gmail-hook override।
2. Per-job `--model`।
3. Stored cron-session model override (जब user ने एक selected किया हो)।
4. Agent या default model selection।

### Fast mode

Isolated cron fast mode resolved live model selection follow करता है। Model config `params.fastMode` default रूप से apply होता है, लेकिन stored session `fastMode` override अभी भी config पर जीतता है। जब resolved mode `auto` होता है, cutoff selected model के `params.fastAutoOnSeconds` value का उपयोग करता है, default 60 seconds।

### Live model switch retries

यदि isolated run `LiveSessionModelSwitchError` throw करता है, तो cron retry करने से पहले active run के लिए switched provider और model (और present होने पर switched auth profile override) persist करता है। outer retry loop initial attempt के बाद two switch retries तक bounded है, फिर forever loop करने के बजाय abort करता है।

## Run output और denials

### Stale acknowledgement suppression

Isolated cron turns stale acknowledgement-only replies suppress करते हैं। यदि first result सिर्फ interim status update है और eventual answer के लिए कोई descendant subagent run responsible नहीं है, तो cron delivery से पहले real result के लिए एक बार re-prompt करता है।

### Silent token suppression

यदि कोई पृथक Cron रन केवल मौन टोकन (`NO_REPLY` या `no_reply`) लौटाता है, तो Cron सीधे आउटबाउंड डिलीवरी और वैकल्पिक कतारबद्ध सारांश पथ, दोनों को दबा देता है, इसलिए चैट में कुछ भी वापस पोस्ट नहीं होता।

### संरचित अस्वीकरण

पृथक Cron रन, एम्बेडेड रन से मिले संरचित निष्पादन-अस्वीकरण मेटाडेटा को आधिकारिक अस्वीकरण संकेत के रूप में उपयोग करते हैं। वे node-host `UNAVAILABLE` wrappers का भी सम्मान करते हैं, जब nested structured error message `SYSTEM_RUN_DENIED` या `INVALID_REQUEST` से शुरू होता है।

Cron अंतिम-आउटपुट गद्य या अनुमति-जैसे दिखने वाले refusal phrases को अस्वीकरण के रूप में वर्गीकृत नहीं करता, जब तक कि एम्बेडेड रन संरचित अस्वीकरण मेटाडेटा भी प्रदान न करे, इसलिए सामान्य assistant text को blocked command नहीं माना जाता।

`cron list` और run history, blocked command को `ok` के रूप में रिपोर्ट करने के बजाय अस्वीकरण कारण दिखाते हैं।

## रिटेंशन

रिटेंशन और pruning config में नियंत्रित होते हैं:

- `cron.sessionRetention` (default `24h`) पूर्ण हो चुके पृथक run sessions को prune करता है।
- `cron.runLog.keepLines` हर job के लिए retained SQLite run-history rows को prune करता है। पुराने file-backed run logs के साथ compatibility के लिए `cron.runLog.maxBytes` अभी भी स्वीकार किया जाता है।

## पुराने jobs माइग्रेट करना

<Note>
यदि आपके पास मौजूदा delivery और store format से पहले के cron jobs हैं, तो `openclaw doctor --fix` चलाएं। Doctor legacy cron fields (`jobId`, `schedule.cron`, legacy `threadId` सहित top-level delivery fields, payload `provider` delivery aliases) को normalize करता है और `notify: true` webhook fallback jobs को `cron.webhook` से explicit webhook delivery में migrate करता है। जो jobs पहले से किसी chat में announce करते हैं, वे उस delivery को बनाए रखते हैं और उन्हें completion webhook destination मिलता है। जब `cron.webhook` unset हो, तो जिन jobs के लिए कोई migration target नहीं है उनके लिए inert top-level `notify` marker हटा दिया जाता है (मौजूदा delivery बिना बदले preserved रहती है), इसलिए `doctor --fix` अब उनके बारे में बार-बार warning नहीं देता।
</Note>

## सामान्य edits

message बदले बिना delivery settings update करें:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

पृथक job के लिए delivery disable करें:

```bash
openclaw cron edit <job-id> --no-deliver
```

पृथक job के लिए lightweight bootstrap context enable करें:

```bash
openclaw cron edit <job-id> --light-context
```

किसी विशिष्ट channel में announce करें:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram forum topic में announce करें:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

lightweight bootstrap context के साथ पृथक job बनाएं:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` केवल isolated agent-turn jobs पर लागू होता है। Cron runs के लिए, lightweight mode पूरा workspace bootstrap set inject करने के बजाय bootstrap context खाली रखता है।

exact argv, cwd, env, stdin, और output limits के साथ command job बनाएं:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## सामान्य admin commands

Manual run और inspection:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` default रूप से सभी matching jobs दिखाता है। केवल वे jobs दिखाने के लिए `--agent <id>` pass करें जिनका effective normalized agent id match करता है; stored agent id के बिना jobs configured default agent के रूप में count होते हैं।

`openclaw cron get <job-id>` stored job JSON सीधे लौटाता है। जब आप delivery-route preview के साथ human-readable view चाहते हैं, तो `cron show <job-id>` use करें।

`cron list --json` और `cron show <job-id> --json` हर job पर top-level `status` field शामिल करते हैं, जो `enabled`, `state.runningAtMs`, और `state.lastRunStatus` से computed होता है। Values: `disabled`, `running`, `ok`, `error`, `skipped`, या `idle`। यह human-readable status column को mirror करता है ताकि external tooling job state को फिर से derive किए बिना read कर सके।

`cron runs` entries में intended cron target, resolved target, message-tool sends, fallback use, और delivered state के साथ delivery diagnostics शामिल होते हैं।

Agent और session retargeting:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` agent-turn jobs पर `--agent` omit होने पर warning देता है और default agent (`main`) पर fallback करता है। specific agent pin करने के लिए create time पर `--agent <id>` pass करें।

Delivery tweaks:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Scheduled tasks](/hi/automation/cron-jobs)
