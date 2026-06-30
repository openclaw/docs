---
read_when:
    - आप OpenClaw मॉडल उपयोग, संदेश प्रवाह, या सत्र मेट्रिक्स को OpenTelemetry कलेक्टर पर भेजना चाहते हैं
    - आप ट्रेस, मेट्रिक्स, या लॉग को Grafana, Datadog, Honeycomb, New Relic, Tempo, या किसी अन्य OTLP बैकएंड से जोड़ रहे हैं
    - डैशबोर्ड या अलर्ट बनाने के लिए आपको सटीक मेट्रिक नाम, स्पैन नाम, या एट्रिब्यूट संरचनाएँ चाहिए
summary: diagnostics-otel Plugin के ज़रिए OpenClaw diagnostics को OpenTelemetry collectors या stdout JSONL में निर्यात करें
title: OpenTelemetry निर्यात
x-i18n:
    generated_at: "2026-06-30T14:06:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw आधिकारिक `diagnostics-otel` plugin के माध्यम से **OTLP/HTTP (protobuf)** का उपयोग करके diagnostics निर्यात करता है। Logs को container और sandbox log pipelines के लिए stdout JSONL के रूप में भी लिखा जा सकता है। OTLP/HTTP स्वीकार करने वाला कोई भी collector या backend बिना code बदलावों के काम करता है। स्थानीय file logs और उन्हें पढ़ने के तरीके के लिए, [Logging](/hi/logging) देखें।

## यह एक साथ कैसे काम करता है

- **Diagnostics events** संरचित, in-process records हैं जिन्हें Gateway और bundled plugins model runs, message flow, sessions, queues, और exec के लिए emit करते हैं।
- **`diagnostics-otel` plugin** उन events को subscribe करता है और उन्हें OTLP/HTTP पर OpenTelemetry **metrics**, **traces**, और **logs** के रूप में export करता है। यह diagnostic log records को stdout JSONL में mirror भी कर सकता है।
- **Provider calls** को OpenClaw के trusted model-call span context से W3C `traceparent` header मिलता है, जब provider transport custom headers स्वीकार करता है। Plugin-emitted trace context propagate नहीं किया जाता।
- Exporters केवल तब attach होते हैं जब diagnostics surface और plugin दोनों enabled हों, इसलिए default रूप से in-process cost लगभग शून्य रहती है।

## त्वरित शुरुआत

Packaged installs के लिए, पहले plugin install करें:

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

आप CLI से भी plugin enable कर सकते हैं:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` अभी केवल `http/protobuf` support करता है। `grpc` ignore किया जाता है।
</Note>

## निर्यात किए गए signals

| Signal      | इसमें क्या जाता है                                                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | token usage, cost, run duration, failover, skill usage, message flow, Talk events, queue lanes, session state/recovery, tool execution, oversized payloads, exec, और memory pressure के लिए counters और histograms। |
| **Traces**  | model usage, model calls, harness lifecycle, skill usage, tool execution, exec, webhook/message processing, context assembly, और tool loops के लिए spans।                                                  |
| **Logs**    | `diagnostics.otel.logs` enabled होने पर OTLP या stdout JSONL पर export किए गए structured `logging.file` records; log bodies तब तक रोके जाते हैं जब तक content capture स्पष्ट रूप से enabled न हो।             |

`traces`, `metrics`, और `logs` को स्वतंत्र रूप से toggle करें। `diagnostics.otel.enabled` true होने पर traces और metrics default रूप से on होते हैं। Logs default रूप से off होते हैं और केवल तब export किए जाते हैं जब `diagnostics.otel.logs` स्पष्ट रूप से `true` हो। Log export default रूप से OTLP होता है; stdout पर JSONL के लिए `diagnostics.otel.logsExporter` को `stdout` पर set करें, या प्रत्येक diagnostic log record को OTLP और stdout दोनों पर भेजने के लिए `both` पर set करें।

## Configuration reference

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### Environment variables

| Variable                                                                                                          | उद्देश्य                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` को override करें। यदि value में पहले से `/v1/traces`, `/v1/metrics`, या `/v1/logs` है, तो उसे ज्यों का त्यों उपयोग किया जाता है।                                                                                                                                                                                                     |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Matching `diagnostics.otel.*Endpoint` config key unset होने पर उपयोग किए जाने वाले signal-specific endpoint overrides। Signal-specific config, signal-specific env पर प्राथमिकता पाता है, और वह shared endpoint पर प्राथमिकता पाता है।                                                                                                                        |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` को override करें।                                                                                                                                                                                                                                                                                                                 |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | wire protocol को override करें (आज केवल `http/protobuf` honor किया जाता है)।                                                                                                                                                                                                                                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | latest experimental GenAI inference span shape emit करने के लिए `gen_ai_latest_experimental` पर set करें, जिसमें `{gen_ai.operation.name} {gen_ai.request.model}` span names, `CLIENT` span kind, और legacy `gen_ai.system` के बजाय `gen_ai.provider.name` शामिल हैं। GenAI metrics हमेशा bounded, low-cardinality semantic attributes का उपयोग करते हैं। |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | जब किसी अन्य preload या host process ने global OpenTelemetry SDK पहले से registered किया हो, तो `1` पर set करें। फिर plugin अपनी NodeSDK lifecycle skip करता है, लेकिन diagnostic listeners wire करता रहता है और `traces`/`metrics`/`logs` को honor करता है।                                                                                                    |

## Privacy और content capture

Raw model/tool content default रूप से export **नहीं** किया जाता। Spans bounded identifiers (channel, provider, model, error category, hash-only request ids, tool source, tool owner, और skill name/source) carry करते हैं और कभी भी prompt text, response text, tool inputs, tool outputs, skill file paths, या session keys शामिल नहीं करते। OTLP log records default रूप से severity, logger, code location, trusted trace context, और sanitized attributes रखते हैं, लेकिन raw log message body केवल तब export होती है जब `diagnostics.otel.captureContent` को boolean `true` पर set किया जाए। Granular `captureContent.*` subkeys log bodies enable नहीं करते। Scoped agent session keys जैसे दिखने वाले labels को `unknown` से replace किया जाता है।
Talk metrics केवल mode, transport, provider, और event type जैसी bounded event metadata export करते हैं। वे transcripts, audio payloads, session ids, turn ids, call ids, room ids, या handoff tokens शामिल नहीं करते।

Outbound model requests में W3C `traceparent` header शामिल हो सकता है। वह header active model call के लिए केवल OpenClaw-owned diagnostic trace context से generate किया जाता है। Existing caller-supplied `traceparent` headers replace किए जाते हैं, इसलिए plugins या custom provider options cross-service trace ancestry spoof नहीं कर सकते।

`diagnostics.otel.captureContent.*` को `true` पर केवल तब set करें जब आपका collector और retention policy prompt, response, tool, या system-prompt text के लिए approved हों। प्रत्येक subkey स्वतंत्र रूप से opt-in है:

- `inputMessages` - user prompt content।
- `outputMessages` - model response content।
- `toolInputs` - tool argument payloads।
- `toolOutputs` - tool result payloads।
- `systemPrompt` - assembled system/developer prompt।
- `toolDefinitions` - model tool names, descriptions, और schemas।

जब कोई subkey enabled होता है, तो model और tool spans को केवल उस class के लिए bounded, redacted `openclaw.content.*` attributes मिलते हैं। Boolean `captureContent: true` का उपयोग केवल broad diagnostics captures के लिए करें जहां OTLP log message bodies भी export के लिए approved हों।

`toolInputs`/`toolOutputs` content built-in agent runtime के tool executions के लिए capture किया जाता है (`openclaw.content.tool_input` completed/error spans पर, `openclaw.content.tool_output` completed spans पर)। External harness tool calls (Codex, Claude CLI) content payloads के बिना `tool.execution.*` spans emit करते हैं। Captured content trusted, listener-only channel पर travel करता है और public diagnostic event bus पर कभी नहीं रखा जाता।

## Sampling और flushing

- **ट्रेस:** `diagnostics.otel.sampleRate` (केवल रूट-स्पैन, `0.0` सब छोड़ता है,
  `1.0` सब रखता है).
- **मेट्रिक्स:** `diagnostics.otel.flushIntervalMs` (न्यूनतम `1000`).
- **लॉग:** OTLP लॉग `logging.level` (फाइल लॉग स्तर) का सम्मान करते हैं। वे
  डायग्नोस्टिक लॉग-रिकॉर्ड रिडैक्शन पथ का उपयोग करते हैं, कंसोल फॉर्मैटिंग का नहीं। उच्च-वॉल्यूम
  इंस्टॉल को स्थानीय सैंपलिंग के बजाय OTLP कलेक्टर सैंपलिंग/फिल्टरिंग को प्राथमिकता देनी चाहिए।
  जब आपका प्लेटफॉर्म पहले से stdout/stderr को लॉग प्रोसेसर तक भेजता हो और आपके पास OTLP लॉग
  कलेक्टर न हो, तो `diagnostics.otel.logsExporter: "stdout"` सेट करें। Stdout रिकॉर्ड प्रति लाइन एक JSON ऑब्जेक्ट होते हैं, जिनमें `ts`, `signal`,
  `service.name`, severity, body, रिडैक्ट किए गए attributes, और उपलब्ध होने पर विश्वसनीय trace fields
  शामिल होते हैं।
- **फाइल-लॉग सहसंबंध:** JSONL फाइल लॉग में शीर्ष-स्तरीय `traceId`,
  `spanId`, `parentSpanId`, और `traceFlags` शामिल होते हैं जब लॉग कॉल एक वैध
  डायग्नोस्टिक trace context ले जाता है, जिससे लॉग प्रोसेसर स्थानीय लॉग लाइनों को
  एक्सपोर्ट किए गए spans से जोड़ सकते हैं।
- **अनुरोध सहसंबंध:** Gateway HTTP अनुरोध और WebSocket फ्रेम एक
  आंतरिक अनुरोध trace scope बनाते हैं। उस scope के भीतर लॉग और डायग्नोस्टिक इवेंट
  डिफॉल्ट रूप से अनुरोध trace इनहेरिट करते हैं, जबकि एजेंट रन और मॉडल-कॉल spans
  children के रूप में बनाए जाते हैं ताकि प्रदाता `traceparent` हेडर उसी trace पर बने रहें।
- **मॉडल-कॉल सहसंबंध:** `openclaw.model.call` spans डिफॉल्ट रूप से सुरक्षित prompt
  component sizes शामिल करते हैं और जब प्रदाता परिणाम usage उजागर करता है तो प्रति-कॉल token attributes
  शामिल करते हैं। `openclaw.model.usage` aggregate cost, context, और channel dashboards के लिए run-level
  accounting span बना रहता है; जब emitting runtime के पास विश्वसनीय trace
  context होता है, तो यह उसी डायग्नोस्टिक trace पर रहता है।

## एक्सपोर्ट किए गए मेट्रिक्स

### मॉडल उपयोग

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconds, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, वैकल्पिक `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, साथ ही वर्गीकृत errors पर `openclaw.errorCategory` और `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (histogram, अंतिम मॉडल अनुरोध payload का UTF-8 byte size; कोई raw payload content नहीं)
- `openclaw.model_call.response_bytes` (histogram, streamed response chunk payloads का UTF-8 byte size; उच्च-आवृत्ति text, thinking, और tool-call deltas केवल incremental `delta` bytes गिनते हैं; कोई raw response content नहीं)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, पहले streamed response event से पहले बीता समय)
- `openclaw.model.failover` (counter, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (counter, attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, वैकल्पिक `openclaw.agent`, वैकल्पिक `openclaw.toolName`)

### संदेश प्रवाह

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### बातचीत

- `openclaw.talk.event` (counter, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, attrs: `openclaw.talk.event` जैसा ही; तब emit होता है जब कोई Talk event duration रिपोर्ट करता है)
- `openclaw.talk.audio.bytes` (histogram, attrs: `openclaw.talk.event` जैसा ही; उन Talk audio frame events के लिए emit होता है जो byte length रिपोर्ट करते हैं)

### क्यू और सत्र

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` या `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`; recoverable stale session bookkeeping के लिए emit होता है)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; recoverable stale session bookkeeping के लिए emit होता है)
- `openclaw.session.turn.created` (counter, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (counter, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (counter, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, attrs: मिलते-जुलते recovery counter जैसा ही)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### सत्र liveness टेलीमेट्री

`diagnostics.stuckSessionWarnMs` session
liveness diagnostics के लिए no-progress age threshold है। कोई `processing` session इस threshold
की ओर उम्र नहीं बढ़ाता जबकि OpenClaw reply, tool, status, block, या ACP runtime progress देखता है।
Typing keepalives को progress के रूप में नहीं गिना जाता, इसलिए एक silent model या harness को
फिर भी detect किया जा सकता है।

OpenClaw sessions को उस कार्य के आधार पर वर्गीकृत करता है जिसे वह अभी भी देख सकता है:

- `session.long_running`: active embedded work, model calls, या tool calls अभी भी
  progress कर रहे हैं। Owned model calls जो
  `diagnostics.stuckSessionWarnMs` से आगे silent रहते हैं, वे भी
  `diagnostics.stuckSessionAbortMs` से पहले long-running के रूप में रिपोर्ट होते हैं ताकि slow या non-streaming model providers
  stalled gateway sessions जैसे न दिखें जबकि वे abort-observable बने रहते हैं।
- `session.stalled`: active work मौजूद है, लेकिन active run ने हाल की
  progress रिपोर्ट नहीं की है। Owned model calls `diagnostics.stuckSessionAbortMs` पर या उसके बाद `session.long_running` से
  `session.stalled` पर switch करते हैं; ownerless
  stale model/tool activity को harmless long-running work नहीं माना जाता।
  Stalled embedded runs पहले observe-only रहते हैं, फिर
  `diagnostics.stuckSessionAbortMs` के बाद बिना progress के abort-drain होते हैं ताकि lane के पीछे queued turns
  फिर से शुरू हो सकें। unset होने पर, abort threshold कम से कम 5 मिनट और 3x
  `diagnostics.stuckSessionWarnMs` की अधिक सुरक्षित
  extended window पर default होता है।
- `session.stuck`: बिना active work के stale session bookkeeping, या stale ownerless model/tool activity वाला idle
  queued session। यह recovery gates pass होने के तुरंत बाद प्रभावित
  session lane को release करता है।

Recovery structured `session.recovery.requested` और
`session.recovery.completed` events emit करता है। Diagnostic session state को idle
केवल mutating recovery outcome (`aborted` या `released`) के बाद और केवल तब mark किया जाता है जब
वही processing generation अभी भी current हो।

केवल `session.stuck` ही `openclaw.session.stuck` counter,
`openclaw.session.stuck_age_ms` histogram, और `openclaw.session.stuck`
span emit करता है। दोहराए गए `session.stuck` diagnostics back off करते हैं जबकि session
unchanged रहता है, इसलिए dashboards को हर heartbeat tick के बजाय sustained increases पर alert करना चाहिए। Config knob और defaults के लिए,
[Configuration reference](/hi/gateway/configuration-reference#diagnostics) देखें।

Liveness warnings भी emit करते हैं:

- `openclaw.liveness.warning` (counter, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, attrs: `openclaw.liveness.reason`)

### Harness lifecycle

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, errors पर `openclaw.harness.phase`)

### टूल निष्पादन

- `openclaw.tool.execution.duration_ms` (histogram, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, साथ ही errors पर `openclaw.errorCategory`)
- `openclaw.tool.execution.blocked` (counter, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnostics internals (memory और tool loop)

- `openclaw.payload.large` (counter, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, attrs: `openclaw.payload.large` जैसा ही)
- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## एक्सपोर्ट किए गए spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - डिफ़ॉल्ट रूप से `gen_ai.system`, या जब नवीनतम GenAI सिमेंटिक कन्वेंशन चुने गए हों तब `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - डिफ़ॉल्ट रूप से `gen_ai.system`, या जब नवीनतम GenAI सिमेंटिक कन्वेंशन चुने गए हों तब `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - त्रुटियों पर `openclaw.errorCategory` और वैकल्पिक `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (केवल सुरक्षित घटक आकार, कोई प्रॉम्प्ट टेक्स्ट नहीं)
  - `openclaw.model_call.usage.*` और `gen_ai.usage.*` जब मॉडल-कॉल परिणाम उस व्यक्तिगत कॉल के लिए provider उपयोग रखता हो
  - `openclaw.provider.request_id_hash` (अपस्ट्रीम provider अनुरोध id का सीमित SHA-आधारित हैश; कच्चे id निर्यात नहीं किए जाते)
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` के साथ, मॉडल-कॉल स्पैन `openclaw.model.call` के बजाय नवीनतम GenAI inference स्पैन नाम `{gen_ai.operation.name} {gen_ai.request.model}` और `CLIENT` स्पैन प्रकार का उपयोग करते हैं।
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - पूर्ण होने पर: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - त्रुटि पर: `openclaw.harness.phase`, `openclaw.errorCategory`, वैकल्पिक `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (कोई प्रॉम्प्ट, इतिहास, प्रतिक्रिया, या session-key सामग्री नहीं)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (कोई लूप संदेश, params, या tool आउटपुट नहीं)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

जब सामग्री कैप्चर स्पष्ट रूप से सक्षम हो, तो मॉडल और tool स्पैन उन विशिष्ट सामग्री वर्गों के लिए सीमित, संशोधित `openclaw.content.*` attributes भी शामिल कर सकते हैं जिन्हें आपने चुना है।

## डायग्नोस्टिक इवेंट कैटलॉग

नीचे दिए गए इवेंट ऊपर दिए गए मेट्रिक्स और स्पैन का आधार हैं। Plugins OTLP निर्यात के बिना भी सीधे इन्हें सब्सक्राइब कर सकते हैं।

**मॉडल उपयोग**

- `model.usage` - tokens, लागत, अवधि, संदर्भ, provider/model/channel,
  session ids. `usage` लागत और telemetry के लिए provider/turn accounting है;
  `context.used` मौजूदा prompt/context snapshot है और cached input या tool-loop calls शामिल होने पर
  provider `usage.total` से कम हो सकता है।

**संदेश प्रवाह**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Queue और session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (कुल काउंटर: webhooks/queue/session)

**Harness lifecycle**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  agent harness के लिए प्रति-run lifecycle. इसमें `harnessId`, वैकल्पिक
  `pluginId`, provider/model/channel, और run id शामिल हैं। Completion में
  `durationMs`, `outcome`, वैकल्पिक `resultClassification`, `yieldDetected`,
  और `itemLifecycle` counts जुड़ते हैं। Errors में `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, और
  वैकल्पिक `cleanupFailed` जुड़ते हैं।

**Exec**

- `exec.process.completed` - terminal outcome, duration, target, mode, exit
  code, और failure kind. Command text और working directories शामिल नहीं हैं।

## Exporter के बिना

आप `diagnostics-otel` चलाए बिना diagnostics events को Plugins या custom sinks के लिए उपलब्ध रख सकते हैं:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` बढ़ाए बिना लक्षित debug output के लिए, diagnostics
flags का उपयोग करें। Flags case-insensitive हैं और wildcards का समर्थन करते हैं (जैसे `telegram.*` या
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

या एकबारगी env override के रूप में:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Flag output standard log file (`logging.file`) में जाता है और फिर भी
`logging.redactSensitive` द्वारा redacted रहता है। पूरा मार्गदर्शक:
[Diagnostics flags](/hi/diagnostics/flags).

## अक्षम करें

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

आप `diagnostics-otel` को `plugins.allow` से बाहर भी रख सकते हैं, या
`openclaw plugins disable diagnostics-otel` चला सकते हैं।

## संबंधित

- [Logging](/hi/logging) - file logs, console output, CLI tailing, और Control UI Logs tab
- [Gateway logging internals](/hi/gateway/logging) - WS log styles, subsystem prefixes, और console capture
- [Diagnostics flags](/hi/diagnostics/flags) - लक्षित debug-log flags
- [Diagnostics export](/hi/gateway/diagnostics) - operator support-bundle tool (OTEL export से अलग)
- [Configuration reference](/hi/gateway/configuration-reference#diagnostics) - पूरा `diagnostics.*` field reference
