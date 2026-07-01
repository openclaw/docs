---
read_when:
    - आप OpenClaw मॉडल उपयोग, संदेश प्रवाह, या सत्र मेट्रिक्स को OpenTelemetry collector पर भेजना चाहते हैं
    - आप ट्रेस, मेट्रिक्स, या लॉग को Grafana, Datadog, Honeycomb, New Relic, Tempo, या किसी अन्य OTLP बैकएंड में जोड़ रहे हैं
    - डैशबोर्ड या अलर्ट बनाने के लिए आपको सटीक मेट्रिक नाम, स्पैन नाम या एट्रिब्यूट संरचनाएँ चाहिए
summary: OpenClaw डायग्नॉस्टिक्स को diagnostics-otel Plugin के जरिए OpenTelemetry collectors या stdout JSONL में निर्यात करें
title: OpenTelemetry निर्यात
x-i18n:
    generated_at: "2026-07-01T05:44:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw आधिकारिक `diagnostics-otel` Plugin के माध्यम से **OTLP/HTTP (protobuf)** का उपयोग करके diagnostics निर्यात करता है। कंटेनर और sandbox log pipelines के लिए logs को stdout JSONL के रूप में भी लिखा जा सकता है। OTLP/HTTP स्वीकार करने वाला कोई भी collector या backend बिना code changes के काम करता है। स्थानीय file logs और उन्हें पढ़ने के तरीके के लिए, [Logging](/hi/logging) देखें।

## यह साथ में कैसे काम करता है

- **Diagnostics events** संरचित, in-process records हैं जिन्हें Gateway और bundled plugins model runs, message flow, sessions, queues, और exec के लिए emit करते हैं।
- **`diagnostics-otel` plugin** उन events को subscribe करता है और उन्हें OTLP/HTTP पर OpenTelemetry **metrics**, **traces**, और **logs** के रूप में export करता है। यह diagnostic log records को stdout JSONL पर mirror भी कर सकता है।
- **Provider calls** को OpenClaw के trusted model-call span context से W3C `traceparent` header मिलता है, जब provider transport custom headers स्वीकार करता है। Plugin-emitted trace context propagate नहीं किया जाता।
- Exporters केवल तब attach होते हैं जब diagnostics surface और plugin दोनों enabled हों, इसलिए in-process cost default रूप से लगभग zero रहती है।

## Quick start

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
`protocol` अभी केवल `http/protobuf` support करता है। `grpc` को ignore किया जाता है।
</Note>

## Export किए गए signals

| Signal      | इसमें क्या जाता है                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | token usage, cost, run duration, failover, skill usage, message flow, Talk events, queue lanes, session state/recovery, tool execution, oversized payloads, exec, और memory pressure के लिए counters और histograms. |
| **Traces**  | model usage, model calls, harness lifecycle, skill usage, tool execution, exec, webhook/message processing, context assembly, और tool loops के लिए spans.                                                            |
| **Logs**    | `diagnostics.otel.logs` enabled होने पर OTLP या stdout JSONL पर export किए गए structured `logging.file` records; log bodies तब तक रोकी जाती हैं जब तक content capture स्पष्ट रूप से enabled न हो।                                |

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

| Variable                                                                                                          | Purpose                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` को override करें। यदि value में पहले से `/v1/traces`, `/v1/metrics`, या `/v1/logs` है, तो उसे वैसे ही use किया जाता है।                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Matching `diagnostics.otel.*Endpoint` config key unset होने पर उपयोग किए जाने वाले signal-specific endpoint overrides। Signal-specific config, signal-specific env पर प्राथमिकता पाता है, और वह shared endpoint पर प्राथमिकता पाता है।                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` को override करें।                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | wire protocol को override करें (आज केवल `http/protobuf` honored है)।                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | latest experimental GenAI inference span shape emit करने के लिए `gen_ai_latest_experimental` पर set करें, जिसमें `{gen_ai.operation.name} {gen_ai.request.model}` span names, `CLIENT` span kind, और legacy `gen_ai.system` के बजाय `gen_ai.provider.name` शामिल हैं। GenAI metrics हमेशा bounded, low-cardinality semantic attributes use करते हैं। |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | जब किसी अन्य preload या host process ने global OpenTelemetry SDK पहले से register कर दिया हो, तो `1` पर set करें। Plugin तब अपना NodeSDK lifecycle skip करता है लेकिन फिर भी diagnostic listeners wire करता है और `traces`/`metrics`/`logs` का सम्मान करता है।                                                                                                                    |

## Privacy और content capture

Raw model/tool content default रूप से export **नहीं** किया जाता। Spans bounded identifiers (channel, provider, model, error category, hash-only request ids, tool source, tool owner, और skill name/source) carry करते हैं और कभी भी prompt text, response text, tool inputs, tool outputs, skill file paths, या session keys शामिल नहीं करते। OTLP log records default रूप से severity, logger, code location, trusted trace context, और sanitized attributes रखते हैं, लेकिन raw log message body केवल तब export होती है जब `diagnostics.otel.captureContent` boolean `true` पर set हो। Granular `captureContent.*` subkeys log bodies enable नहीं करते। Scoped agent session keys जैसे दिखने वाले labels को `unknown` से बदल दिया जाता है।
Talk metrics केवल bounded event metadata जैसे mode, transport, provider, और event type export करते हैं। उनमें transcripts, audio payloads, session ids, turn ids, call ids, room ids, या handoff tokens शामिल नहीं होते।

Outbound model requests में W3C `traceparent` header शामिल हो सकता है। वह header केवल active model call के लिए OpenClaw-owned diagnostic trace context से generate होता है। Existing caller-supplied `traceparent` headers replace कर दिए जाते हैं, इसलिए plugins या custom provider options cross-service trace ancestry spoof नहीं कर सकते।

`diagnostics.otel.captureContent.*` को `true` पर केवल तब set करें जब आपका collector और retention policy prompt, response, tool, या system-prompt text के लिए approved हों। प्रत्येक subkey स्वतंत्र रूप से opt-in है:

- `inputMessages` - user prompt content.
- `outputMessages` - model response content.
- `toolInputs` - tool argument payloads.
- `toolOutputs` - tool result payloads.
- `systemPrompt` - assembled system/developer prompt.
- `toolDefinitions` - model tool names, descriptions, और schemas.

जब कोई subkey enabled होता है, तो model और tool spans को केवल उस class के लिए bounded, redacted `openclaw.content.*` attributes मिलते हैं। Boolean `captureContent: true` केवल व्यापक diagnostics captures के लिए use करें जहां OTLP log message bodies भी export के लिए approved हों।

`toolInputs`/`toolOutputs` content built-in agent runtime के tool executions के लिए capture होता है (completed/error spans पर `openclaw.content.tool_input`, completed spans पर `openclaw.content.tool_output`)। External harness tool calls (Codex, Claude CLI) content payloads के बिना `tool.execution.*` spans emit करते हैं। Captured content trusted, listener-only channel पर travel करता है और public diagnostic event bus पर कभी placed नहीं किया जाता।

## Sampling और flushing

- **ट्रेस:** `diagnostics.otel.sampleRate` (केवल root-span, `0.0` सब हटाता है,
  `1.0` सब रखता है)।
- **मेट्रिक्स:** `diagnostics.otel.flushIntervalMs` (न्यूनतम `1000`)।
- **लॉग:** OTLP लॉग `logging.level` (फ़ाइल लॉग स्तर) का सम्मान करते हैं। वे
  डायग्नोस्टिक log-record रिडैक्शन पथ का उपयोग करते हैं, कंसोल फ़ॉर्मैटिंग का नहीं। उच्च-वॉल्यूम
  इंस्टॉल को स्थानीय सैंपलिंग के बजाय OTLP कलेक्टर सैंपलिंग/फ़िल्टरिंग को प्राथमिकता देनी चाहिए।
  जब आपका प्लेटफ़ॉर्म पहले से stdout/stderr को लॉग प्रोसेसर तक भेजता है और आपके पास OTLP लॉग
  कलेक्टर नहीं है, तब `diagnostics.otel.logsExporter: "stdout"` सेट करें। Stdout रिकॉर्ड प्रति पंक्ति एक JSON ऑब्जेक्ट होते हैं, जिनमें `ts`, `signal`,
  `service.name`, severity, body, रिडैक्ट किए गए attributes, और उपलब्ध होने पर विश्वसनीय trace fields
  होते हैं।
- **फ़ाइल-लॉग सहसंबंध:** JSONL फ़ाइल लॉग में शीर्ष-स्तरीय `traceId`,
  `spanId`, `parentSpanId`, और `traceFlags` शामिल होते हैं, जब लॉग कॉल में मान्य
  डायग्नोस्टिक trace context होता है, जिससे लॉग प्रोसेसर स्थानीय लॉग पंक्तियों को
  एक्सपोर्ट किए गए spans से जोड़ सकते हैं।
- **अनुरोध सहसंबंध:** Gateway HTTP अनुरोध और WebSocket frames एक
  आंतरिक request trace scope बनाते हैं। उस scope के भीतर लॉग और डायग्नोस्टिक events
  डिफ़ॉल्ट रूप से request trace विरासत में लेते हैं, जबकि agent run और model-call spans
  children के रूप में बनाए जाते हैं ताकि provider `traceparent` headers उसी trace पर रहें।
- **Model-call सहसंबंध:** `openclaw.model.call` spans डिफ़ॉल्ट रूप से सुरक्षित prompt
  component sizes शामिल करते हैं और जब provider result usage उजागर करता है तब per-call token attributes
  शामिल करते हैं। `openclaw.model.usage` aggregate cost, context, और channel dashboards के लिए
  run-level accounting span बना रहता है; जब emitting runtime के पास विश्वसनीय trace
  context होता है, तब यह उसी diagnostic trace पर रहता है।

## एक्सपोर्ट किए गए मेट्रिक्स

### Model usage

- `openclaw.tokens` (काउंटर, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (काउंटर, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (हिस्टोग्राम, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (हिस्टोग्राम, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (हिस्टोग्राम, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (हिस्टोग्राम, सेकंड, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, वैकल्पिक `error.type`)
- `openclaw.model_call.duration_ms` (हिस्टोग्राम, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, साथ में वर्गीकृत त्रुटियों पर `openclaw.errorCategory` और `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (हिस्टोग्राम, अंतिम model request payload का UTF-8 byte size; कोई raw payload content नहीं)
- `openclaw.model_call.response_bytes` (हिस्टोग्राम, streamed response chunk payloads का UTF-8 byte size; high-frequency text, thinking, और tool-call deltas केवल incremental `delta` bytes गिनते हैं; कोई raw response content नहीं)
- `openclaw.model_call.time_to_first_byte_ms` (हिस्टोग्राम, पहले streamed response event से पहले बीता समय)
- `openclaw.model.failover` (काउंटर, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (काउंटर, attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, वैकल्पिक `openclaw.agent`, वैकल्पिक `openclaw.toolName`)

### संदेश प्रवाह

- `openclaw.webhook.received` (काउंटर, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (काउंटर, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (हिस्टोग्राम, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (काउंटर, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (काउंटर, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (काउंटर, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (काउंटर, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (हिस्टोग्राम, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (काउंटर, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (हिस्टोग्राम, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (काउंटर, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (हिस्टोग्राम, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### बातचीत

- `openclaw.talk.event` (काउंटर, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (हिस्टोग्राम, attrs: `openclaw.talk.event` जैसा ही; तब emit होता है जब कोई Talk event अवधि रिपोर्ट करता है)
- `openclaw.talk.audio.bytes` (हिस्टोग्राम, attrs: `openclaw.talk.event` जैसा ही; byte length रिपोर्ट करने वाले Talk audio frame events के लिए emit होता है)

### कतारें और sessions

- `openclaw.queue.lane.enqueue` (काउंटर, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (काउंटर, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (हिस्टोग्राम, attrs: `openclaw.lane` या `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (हिस्टोग्राम, attrs: `openclaw.lane`)
- `openclaw.session.state` (काउंटर, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (काउंटर, attrs: `openclaw.state`; recoverable stale session bookkeeping के लिए emit होता है)
- `openclaw.session.stuck_age_ms` (हिस्टोग्राम, attrs: `openclaw.state`; recoverable stale session bookkeeping के लिए emit होता है)
- `openclaw.session.turn.created` (काउंटर, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (काउंटर, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (काउंटर, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (हिस्टोग्राम, attrs: matching recovery counter जैसा ही)
- `openclaw.run.attempt` (काउंटर, attrs: `openclaw.attempt`)

### Session liveness telemetry

`diagnostics.stuckSessionWarnMs` session
liveness diagnostics के लिए no-progress age threshold है। कोई `processing` session इस threshold की ओर age नहीं करता
जब तक OpenClaw reply, tool, status, block, या ACP runtime progress देखता है।
Typing keepalives को progress के रूप में नहीं गिना जाता, इसलिए silent model या harness को
फिर भी detect किया जा सकता है।

OpenClaw sessions को उस work के आधार पर वर्गीकृत करता है जिसे वह अब भी observe कर सकता है:

- `session.long_running`: active embedded work, model calls, या tool calls
  अब भी progress कर रहे हैं। Owned model calls जो
  `diagnostics.stuckSessionWarnMs` के बाद भी silent रहते हैं, वे
  `diagnostics.stuckSessionAbortMs` से पहले भी long-running के रूप में report होते हैं ताकि slow या non-streaming model providers
  stalled gateway sessions जैसे न दिखें जब तक वे abort-observable रहें।
- `session.stalled`: active work मौजूद है, लेकिन active run ने
  हालिया progress report नहीं किया है। Owned model calls `diagnostics.stuckSessionAbortMs` पर या उसके बाद
  `session.long_running` से `session.stalled` में switch करते हैं; ownerless
  stale model/tool activity को harmless long-running work नहीं माना जाता।
  Stalled embedded runs पहले observe-only रहते हैं, फिर
  `diagnostics.stuckSessionAbortMs` के बाद बिना progress के abort-drain होते हैं ताकि lane के पीछे queued turns resume कर सकें।
  unset होने पर, abort threshold कम-से-कम 5 minutes और
  `diagnostics.stuckSessionWarnMs` के 3x की safer
  extended window पर default होता है।
- `session.stuck`: बिना active work के stale session bookkeeping, या stale ownerless model/tool activity वाला idle
  queued session। Recovery gates pass होने के तुरंत बाद यह प्रभावित
  session lane release करता है।

Recovery structured `session.recovery.requested` और
`session.recovery.completed` events emit करता है। Diagnostic session state को idle
केवल mutating recovery outcome (`aborted` या `released`) के बाद और केवल तब चिह्नित किया जाता है जब
वही processing generation अब भी current हो।

केवल `session.stuck` `openclaw.session.stuck` counter,
`openclaw.session.stuck_age_ms` histogram, और `openclaw.session.stuck`
span emit करता है। Repeated `session.stuck` diagnostics तब तक back off करते हैं जब तक session
unchanged रहता है, इसलिए dashboards को हर
heartbeat tick के बजाय sustained increases पर alert करना चाहिए। Config knob और defaults के लिए,
[Configuration reference](/hi/gateway/configuration-reference#diagnostics) देखें।

Liveness warnings भी emit करते हैं:

- `openclaw.liveness.warning` (काउंटर, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (हिस्टोग्राम, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (हिस्टोग्राम, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (हिस्टोग्राम, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (हिस्टोग्राम, attrs: `openclaw.liveness.reason`)

### Harness lifecycle

- `openclaw.harness.duration_ms` (हिस्टोग्राम, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, त्रुटियों पर `openclaw.harness.phase`)

### Tool execution

- `openclaw.tool.execution.duration_ms` (हिस्टोग्राम, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, साथ में त्रुटियों पर `openclaw.errorCategory`)
- `openclaw.tool.execution.blocked` (काउंटर, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (हिस्टोग्राम, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnostics internals (memory और tool loop)

- `openclaw.payload.large` (काउंटर, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (हिस्टोग्राम, attrs: `openclaw.payload.large` जैसा ही)
- `openclaw.memory.heap_used_bytes` (हिस्टोग्राम, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (हिस्टोग्राम)
- `openclaw.memory.pressure` (काउंटर, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (काउंटर, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (हिस्टोग्राम, attrs: `openclaw.toolName`, `openclaw.outcome`)

## एक्सपोर्ट किए गए spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - डिफ़ॉल्ट रूप से `gen_ai.system`, या जब नवीनतम GenAI सिमैंटिक कन्वेंशन चुने गए हों तब `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - डिफ़ॉल्ट रूप से `gen_ai.system`, या जब नवीनतम GenAI सिमैंटिक कन्वेंशन चुने गए हों तब `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - त्रुटियों पर `openclaw.errorCategory` और वैकल्पिक `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (केवल सुरक्षित घटक आकार, कोई प्रॉम्प्ट टेक्स्ट नहीं)
  - `openclaw.model_call.usage.*` और `gen_ai.usage.*` जब मॉडल-कॉल परिणाम उस अलग कॉल के लिए प्रदाता उपयोग रखता हो
  - `openclaw.provider.request_id_hash` (अपस्ट्रीम प्रदाता अनुरोध आईडी का सीमित SHA-आधारित हैश; कच्ची आईडी निर्यात नहीं की जातीं)
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` के साथ, मॉडल-कॉल स्पैन `openclaw.model.call` के बजाय नवीनतम GenAI inference स्पैन नाम `{gen_ai.operation.name} {gen_ai.request.model}` और `CLIENT` स्पैन प्रकार का उपयोग करते हैं।
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - पूरा होने पर: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (कोई प्रॉम्प्ट, इतिहास, प्रतिक्रिया, या सत्र-कुंजी सामग्री नहीं)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (कोई लूप संदेश, पैरामीटर, या टूल आउटपुट नहीं)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

जब सामग्री कैप्चर स्पष्ट रूप से सक्षम हो, तो मॉडल और टूल स्पैन उन विशिष्ट
सामग्री वर्गों के लिए सीमित, रिडैक्ट किए गए `openclaw.content.*` गुण भी
शामिल कर सकते हैं जिन्हें आपने चुना है।

## निदान इवेंट कैटलॉग

नीचे दिए गए इवेंट ऊपर के मेट्रिक और स्पैन का आधार हैं। Plugins सीधे भी
इनकी सदस्यता ले सकते हैं, OTLP निर्यात के बिना।

**मॉडल उपयोग**

- `model.usage` - टोकन, लागत, अवधि, संदर्भ, प्रदाता/मॉडल/चैनल,
  सत्र आईडी। `usage` लागत और टेलीमेट्री के लिए प्रदाता/टर्न लेखांकन है;
  `context.used` मौजूदा प्रॉम्प्ट/संदर्भ स्नैपशॉट है और कैश किए गए इनपुट या
  टूल-लूप कॉल शामिल होने पर प्रदाता `usage.total` से कम हो सकता है।

**संदेश प्रवाह**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**कतार और सत्र**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (समेकित काउंटर: Webhook/कतार/सत्र)

**हार्नेस जीवनचक्र**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  एजेंट हार्नेस के लिए प्रति-रन जीवनचक्र। इसमें `harnessId`, वैकल्पिक
  `pluginId`, प्रदाता/मॉडल/चैनल, और रन आईडी शामिल हैं। पूर्णता
  `durationMs`, `outcome`, वैकल्पिक `resultClassification`, `yieldDetected`,
  और `itemLifecycle` काउंट जोड़ती है। त्रुटियां `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, और
  वैकल्पिक `cleanupFailed` जोड़ती हैं।

**Exec**

- `exec.process.completed` - टर्मिनल परिणाम, अवधि, लक्ष्य, मोड, निकास
  कोड, और विफलता प्रकार। कमांड टेक्स्ट और कार्यशील निर्देशिकाएं
  शामिल नहीं हैं।
- `exec.approval.followup_suppressed` - सत्र रिबाउंड के बाद पुराना अनुमोदन फ़ॉलो-अप छोड़ा गया।
  इसमें `approvalId`, `reason` (`session_rebound`),
  `phase` (`direct_delivery` या `gateway_preflight`), और डिस्पैचर
  टाइमस्टैम्प शामिल हैं। सत्र कुंजियां, रूट, और कमांड टेक्स्ट शामिल नहीं हैं।

## निर्यातक के बिना

आप `diagnostics-otel` चलाए बिना निदान इवेंट को Plugins या कस्टम सिंक के लिए
उपलब्ध रख सकते हैं:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` बढ़ाए बिना लक्षित डीबग आउटपुट के लिए, निदान
फ़्लैग का उपयोग करें। फ़्लैग केस-असंवेदनशील हैं और वाइल्डकार्ड का समर्थन करते हैं (जैसे `telegram.*` या
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

या एकबारगी env ओवरराइड के रूप में:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

फ़्लैग आउटपुट मानक लॉग फ़ाइल (`logging.file`) में जाता है और फिर भी
`logging.redactSensitive` द्वारा रिडैक्ट किया जाता है। पूरा मार्गदर्शक:
[निदान फ़्लैग](/hi/diagnostics/flags)।

## अक्षम करें

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

आप `diagnostics-otel` को `plugins.allow` से बाहर भी रख सकते हैं, या
`openclaw plugins disable diagnostics-otel` चला सकते हैं।

## संबंधित

- [लॉगिंग](/hi/logging) - फ़ाइल लॉग, कंसोल आउटपुट, CLI tailing, और Control UI Logs टैब
- [Gateway लॉगिंग आंतरिक विवरण](/hi/gateway/logging) - WS लॉग शैलियां, सबसिस्टम उपसर्ग, और कंसोल कैप्चर
- [निदान फ़्लैग](/hi/diagnostics/flags) - लक्षित डीबग-लॉग फ़्लैग
- [निदान निर्यात](/hi/gateway/diagnostics) - ऑपरेटर सपोर्ट-बंडल टूल (OTEL निर्यात से अलग)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference#diagnostics) - पूरा `diagnostics.*` फ़ील्ड संदर्भ
