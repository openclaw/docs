---
read_when:
    - आप OpenClaw मॉडल उपयोग, संदेश प्रवाह या सत्र मेट्रिक्स को OpenTelemetry कलेक्टर को भेजना चाहते हैं
    - आप Grafana, Datadog, Honeycomb, New Relic, Tempo, या किसी अन्य OTLP backend में traces, metrics, या logs जोड़ रहे हैं
    - डैशबोर्ड या अलर्ट बनाने के लिए आपको सटीक मीट्रिक नाम, स्पैन नाम, या एट्रिब्यूट संरचनाएँ चाहिए
summary: diagnostics-otel Plugin के माध्यम से OpenClaw निदान को OpenTelemetry कलेक्टरों या stdout JSONL में निर्यात करें
title: OpenTelemetry निर्यात
x-i18n:
    generated_at: "2026-06-28T23:11:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw आधिकारिक `diagnostics-otel` Plugin के माध्यम से डायग्नॉस्टिक्स निर्यात करता है,
**OTLP/HTTP (protobuf)** का उपयोग करके। कंटेनर और सैंडबॉक्स लॉग पाइपलाइनों के लिए
लॉग stdout JSONL के रूप में भी लिखे जा सकते हैं। OTLP/HTTP स्वीकार करने वाला कोई भी
कलेक्टर या बैकएंड बिना कोड बदलावों के काम करता है। स्थानीय फ़ाइल लॉग और उन्हें पढ़ने के तरीके के लिए,
[लॉगिंग](/hi/logging) देखें।

## यह साथ में कैसे फिट होता है

- **डायग्नॉस्टिक्स इवेंट** संरचित, इन-प्रोसेस रिकॉर्ड होते हैं जिन्हें
  Gateway और bundled Plugins मॉडल रन, संदेश प्रवाह, सत्रों, कतारों,
  और exec के लिए उत्सर्जित करते हैं।
- **`diagnostics-otel` Plugin** उन इवेंट की सदस्यता लेता है और उन्हें
  OTLP/HTTP पर OpenTelemetry **मेट्रिक्स**, **ट्रेस**, और **लॉग** के रूप में निर्यात करता है। यह
  डायग्नॉस्टिक लॉग रिकॉर्ड को stdout JSONL में मिरर भी कर सकता है।
- **प्रोवाइडर कॉल** को OpenClaw के विश्वसनीय मॉडल-कॉल स्पैन संदर्भ से
  W3C `traceparent` हेडर मिलता है, जब प्रोवाइडर ट्रांसपोर्ट कस्टम
  हेडर स्वीकार करता है। Plugin द्वारा उत्सर्जित ट्रेस संदर्भ आगे नहीं भेजा जाता।
- एक्सपोर्टर केवल तब अटैच होते हैं जब डायग्नॉस्टिक्स सतह और Plugin दोनों
  सक्षम हों, इसलिए डिफ़ॉल्ट रूप से इन-प्रोसेस लागत लगभग शून्य रहती है।

## त्वरित शुरुआत

पैकेज्ड इंस्टॉल के लिए, पहले Plugin इंस्टॉल करें:

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

आप CLI से भी Plugin सक्षम कर सकते हैं:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` फ़िलहाल केवल `http/protobuf` का समर्थन करता है। `grpc` को अनदेखा किया जाता है।
</Note>

## निर्यात किए गए सिग्नल

| सिग्नल      | इसमें क्या जाता है                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **मेट्रिक्स** | टोकन उपयोग, लागत, रन अवधि, फेलओवर, skill उपयोग, संदेश प्रवाह, Talk इवेंट, कतार लेन, सत्र स्थिति/रिकवरी, टूल निष्पादन, oversized payloads, exec, और मेमोरी दबाव के लिए काउंटर और हिस्टोग्राम। |
| **ट्रेस**  | मॉडल उपयोग, मॉडल कॉल, harness lifecycle, skill उपयोग, टूल निष्पादन, exec, webhook/संदेश प्रोसेसिंग, context assembly, और टूल लूप के लिए स्पैन।                                                            |
| **लॉग**    | `diagnostics.otel.logs` सक्षम होने पर OTLP या stdout JSONL पर निर्यात किए गए संरचित `logging.file` रिकॉर्ड; लॉग बॉडी तब तक रोकी जाती हैं जब तक content capture स्पष्ट रूप से सक्षम न हो।                                |

`traces`, `metrics`, और `logs` को स्वतंत्र रूप से टॉगल करें। जब
`diagnostics.otel.enabled` true होता है, तब ट्रेस और मेट्रिक्स डिफ़ॉल्ट रूप से चालू होते हैं। लॉग डिफ़ॉल्ट रूप से बंद रहते हैं और
केवल तब निर्यात किए जाते हैं जब `diagnostics.otel.logs` स्पष्ट रूप से `true` हो। लॉग निर्यात
डिफ़ॉल्ट रूप से OTLP पर होता है; stdout पर JSONL के लिए `diagnostics.otel.logsExporter` को `stdout` पर सेट करें,
या प्रत्येक डायग्नॉस्टिक लॉग रिकॉर्ड को OTLP और stdout दोनों पर भेजने के लिए `both` सेट करें।

## कॉन्फ़िगरेशन संदर्भ

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

### एनवायरनमेंट वैरिएबल

| वैरिएबल                                                                                                          | उद्देश्य                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` को ओवरराइड करें। यदि मान में पहले से `/v1/traces`, `/v1/metrics`, या `/v1/logs` शामिल है, तो उसे जस का तस उपयोग किया जाता है।                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | सिग्नल-विशिष्ट endpoint ओवरराइड, जिनका उपयोग तब किया जाता है जब मेल खाती `diagnostics.otel.*Endpoint` कॉन्फ़िग कुंजी सेट न हो। सिग्नल-विशिष्ट कॉन्फ़िग सिग्नल-विशिष्ट env पर प्राथमिकता रखता है, और वह साझा endpoint पर प्राथमिकता रखता है।                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` को ओवरराइड करें।                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | वायर प्रोटोकॉल को ओवरराइड करें (आज केवल `http/protobuf` का सम्मान किया जाता है)।                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | नवीनतम experimental GenAI inference span shape उत्सर्जित करने के लिए `gen_ai_latest_experimental` पर सेट करें, जिसमें `{gen_ai.operation.name} {gen_ai.request.model}` span names, `CLIENT` span kind, और legacy `gen_ai.system` के बजाय `gen_ai.provider.name` शामिल हैं। GenAI मेट्रिक्स हमेशा bounded, low-cardinality semantic attributes का उपयोग करते हैं। |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | जब किसी दूसरे preload या host process ने global OpenTelemetry SDK पहले से register कर दिया हो, तो `1` पर सेट करें। तब Plugin अपना NodeSDK lifecycle छोड़ देता है, लेकिन फिर भी diagnostic listeners wire करता है और `traces`/`metrics`/`logs` का सम्मान करता है।                                                                                                                    |

## गोपनीयता और सामग्री कैप्चर

कच्ची मॉडल/टूल सामग्री डिफ़ॉल्ट रूप से निर्यात **नहीं** की जाती। स्पैन bounded
identifiers (channel, provider, model, error category, hash-only request ids,
tool source, tool owner, और skill name/source) रखते हैं और prompt text,
response text, tool inputs, tool outputs, skill file paths, या session keys कभी शामिल नहीं करते।
OTLP लॉग रिकॉर्ड डिफ़ॉल्ट रूप से severity, logger, code location, trusted trace context,
और sanitized attributes रखते हैं, लेकिन raw log message body केवल
तब निर्यात की जाती है जब `diagnostics.otel.captureContent` boolean `true` पर सेट हो। Granular
`captureContent.*` subkeys log bodies को सक्षम नहीं करते। scoped agent session keys जैसी दिखने वाली
labels को `unknown` से बदल दिया जाता है।
Talk मेट्रिक्स केवल bounded event metadata निर्यात करते हैं, जैसे mode, transport,
provider, और event type। उनमें transcripts, audio payloads,
session ids, turn ids, call ids, room ids, या handoff tokens शामिल नहीं होते।

आउटबाउंड मॉडल अनुरोधों में W3C `traceparent` हेडर शामिल हो सकता है। वह हेडर
केवल सक्रिय मॉडल कॉल के लिए OpenClaw-owned diagnostic trace context से
जनरेट किया जाता है। मौजूदा caller-supplied `traceparent` हेडर बदल दिए जाते हैं, इसलिए Plugins या
custom provider options cross-service trace ancestry को spoof नहीं कर सकते।

`diagnostics.otel.captureContent.*` को `true` पर केवल तब सेट करें जब आपका collector और
retention policy prompt, response, tool, या system-prompt
text के लिए स्वीकृत हों। प्रत्येक subkey स्वतंत्र रूप से opt-in है:

- `inputMessages` - user prompt content.
- `outputMessages` - model response content.
- `toolInputs` - tool argument payloads.
- `toolOutputs` - tool result payloads.
- `systemPrompt` - assembled system/developer prompt.
- `toolDefinitions` - model tool names, descriptions, and schemas.

जब कोई subkey सक्षम होती है, model और tool spans को केवल उसी वर्ग के लिए bounded, redacted
`openclaw.content.*` attributes मिलते हैं। boolean
`captureContent: true` केवल व्यापक diagnostics captures के लिए उपयोग करें, जहाँ OTLP log
message bodies भी export के लिए approved हों।

`toolInputs`/`toolOutputs` content built-in agent runtime के
tool executions के लिए capture किया जाता है (`openclaw.content.tool_input` completed/error spans पर,
`openclaw.content.tool_output` completed spans पर)। External harness tool calls
(Codex, Claude CLI) content payloads के बिना `tool.execution.*` spans emit करते हैं।
Captured content trusted, listener-only channel पर यात्रा करता है और public diagnostic event bus पर
कभी नहीं रखा जाता।

## सैंपलिंग और फ्लशिंग

- **ट्रेस:** `diagnostics.otel.sampleRate` (केवल root-span, `0.0` सभी को drop करता है,
  `1.0` सभी को रखता है)।
- **मेट्रिक्स:** `diagnostics.otel.flushIntervalMs` (न्यूनतम `1000`)।
- **लॉग:** OTLP logs `logging.level` (file log level) का सम्मान करते हैं। वे
  diagnostic log-record redaction path का उपयोग करते हैं, console formatting का नहीं। High-volume
  installs को local sampling के बजाय OTLP collector sampling/filtering को प्राथमिकता देनी चाहिए।
  जब आपका platform पहले से stdout/stderr को log processor तक भेजता हो और आपके पास OTLP logs
  collector न हो, तब `diagnostics.otel.logsExporter: "stdout"` सेट करें।
  Stdout records प्रति line एक JSON object होते हैं, जिनमें `ts`, `signal`,
  `service.name`, severity, body, redacted attributes, और उपलब्ध होने पर trusted trace fields
  शामिल होते हैं।
- **फ़ाइल-लॉग correlation:** JSONL file logs में top-level `traceId`,
  `spanId`, `parentSpanId`, और `traceFlags` शामिल होते हैं, जब log call valid
  diagnostic trace context रखती है, जिससे log processors local log lines को
  exported spans से जोड़ सकते हैं।
- **Request correlation:** Gateway HTTP requests और WebSocket frames एक
  internal request trace scope बनाते हैं। उस scope के अंदर logs और diagnostic events
  डिफ़ॉल्ट रूप से request trace inherit करते हैं, जबकि agent run और model-call spans
  children के रूप में बनाए जाते हैं ताकि provider `traceparent` headers उसी trace पर रहें।

## निर्यात किए गए मेट्रिक्स

### मॉडल उपयोग

- `openclaw.tokens` (काउंटर, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (काउंटर, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (हिस्टोग्राम, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (हिस्टोग्राम, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (हिस्टोग्राम, GenAI semantic-conventions मेट्रिक, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (हिस्टोग्राम, सेकंड, GenAI semantic-conventions मेट्रिक, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, वैकल्पिक `error.type`)
- `openclaw.model_call.duration_ms` (हिस्टोग्राम, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, साथ ही वर्गीकृत त्रुटियों पर `openclaw.errorCategory` और `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (हिस्टोग्राम, अंतिम मॉडल अनुरोध पेलोड का UTF-8 बाइट आकार; कोई कच्ची पेलोड सामग्री नहीं)
- `openclaw.model_call.response_bytes` (हिस्टोग्राम, स्ट्रीम किए गए प्रतिक्रिया चंक पेलोड का UTF-8 बाइट आकार; उच्च-आवृत्ति टेक्स्ट, सोच, और टूल-कॉल डेल्टा केवल वृद्धिशील `delta` बाइट गिनते हैं; कोई कच्ची प्रतिक्रिया सामग्री नहीं)
- `openclaw.model_call.time_to_first_byte_ms` (हिस्टोग्राम, पहले स्ट्रीम किए गए प्रतिक्रिया इवेंट से पहले बीता समय)
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
- `openclaw.talk.event.duration_ms` (हिस्टोग्राम, attrs: `openclaw.talk.event` जैसे ही; जब कोई Talk इवेंट अवधि रिपोर्ट करता है तब उत्सर्जित)
- `openclaw.talk.audio.bytes` (हिस्टोग्राम, attrs: `openclaw.talk.event` जैसे ही; बाइट लंबाई रिपोर्ट करने वाले Talk ऑडियो फ्रेम इवेंट के लिए उत्सर्जित)

### कतारें और सत्र

- `openclaw.queue.lane.enqueue` (काउंटर, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (काउंटर, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (हिस्टोग्राम, attrs: `openclaw.lane` या `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (हिस्टोग्राम, attrs: `openclaw.lane`)
- `openclaw.session.state` (काउंटर, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (काउंटर, attrs: `openclaw.state`; पुनर्प्राप्त किए जा सकने वाले पुराने सत्र बहीखाते के लिए उत्सर्जित)
- `openclaw.session.stuck_age_ms` (हिस्टोग्राम, attrs: `openclaw.state`; पुनर्प्राप्त किए जा सकने वाले पुराने सत्र बहीखाते के लिए उत्सर्जित)
- `openclaw.session.turn.created` (काउंटर, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (काउंटर, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (काउंटर, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (हिस्टोग्राम, attrs: मेल खाने वाले रिकवरी काउंटर जैसे ही)
- `openclaw.run.attempt` (काउंटर, attrs: `openclaw.attempt`)

### सत्र सक्रियता टेलीमेट्री

`diagnostics.stuckSessionWarnMs` सत्र सक्रियता डायग्नॉस्टिक्स के लिए no-progress आयु सीमा है। कोई `processing` सत्र इस सीमा की ओर उम्र नहीं बढ़ाता, जब तक OpenClaw reply, tool, status, block, या ACP runtime प्रगति देखता है। Typing keepalives को प्रगति के रूप में नहीं गिना जाता, इसलिए silent model या harness फिर भी पहचाना जा सकता है।

OpenClaw सत्रों को उस काम के आधार पर वर्गीकृत करता है जिसे वह अब भी देख सकता है:

- `session.long_running`: सक्रिय embedded work, model calls, या tool calls अब भी प्रगति कर रहे हैं। स्वामित्व वाले model calls जो `diagnostics.stuckSessionWarnMs` से आगे silent रहते हैं, वे भी `diagnostics.stuckSessionAbortMs` से पहले long-running के रूप में रिपोर्ट करते हैं ताकि धीमे या non-streaming model providers, abort-observable बने रहने तक, stalled gateway sessions जैसे न दिखें।
- `session.stalled`: सक्रिय काम मौजूद है, लेकिन सक्रिय run ने हाल की प्रगति रिपोर्ट नहीं की है। स्वामित्व वाले model calls `diagnostics.stuckSessionAbortMs` पर या उसके बाद `session.long_running` से `session.stalled` में स्विच करते हैं; ownerless पुराने model/tool activity को harmless long-running work नहीं माना जाता। Stalled embedded runs पहले observe-only रहते हैं, फिर `diagnostics.stuckSessionAbortMs` के बाद कोई प्रगति न होने पर abort-drain करते हैं ताकि lane के पीछे queued turns फिर शुरू हो सकें। unset होने पर, abort threshold कम से कम 5 मिनट और `diagnostics.stuckSessionWarnMs` के 3x की अधिक सुरक्षित विस्तारित window पर डिफॉल्ट होता है।
- `session.stuck`: बिना सक्रिय काम के पुराना सत्र बहीखाता, या पुराने ownerless model/tool activity वाला निष्क्रिय queued session। recovery gates पास होने के तुरंत बाद यह प्रभावित session lane को release करता है।

Recovery संरचित `session.recovery.requested` और `session.recovery.completed` इवेंट उत्सर्जित करती है। Diagnostic session state को केवल mutating recovery outcome (`aborted` या `released`) के बाद और केवल तभी idle चिह्नित किया जाता है जब वही processing generation अब भी current हो।

केवल `session.stuck`, `openclaw.session.stuck` काउंटर, `openclaw.session.stuck_age_ms` हिस्टोग्राम, और `openclaw.session.stuck` span उत्सर्जित करता है। बार-बार आने वाले `session.stuck` diagnostics session के unchanged रहने तक back off करते हैं, इसलिए dashboards को हर heartbeat tick के बजाय sustained increases पर alert करना चाहिए। config knob और defaults के लिए, देखें [Configuration reference](/hi/gateway/configuration-reference#diagnostics).

Liveness warnings भी उत्सर्जित करते हैं:

- `openclaw.liveness.warning` (काउंटर, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (हिस्टोग्राम, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (हिस्टोग्राम, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (हिस्टोग्राम, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (हिस्टोग्राम, attrs: `openclaw.liveness.reason`)

### हार्नेस जीवनचक्र

- `openclaw.harness.duration_ms` (हिस्टोग्राम, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, त्रुटियों पर `openclaw.harness.phase`)

### टूल निष्पादन

- `openclaw.tool.execution.duration_ms` (हिस्टोग्राम, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, साथ ही त्रुटियों पर `openclaw.errorCategory`)
- `openclaw.tool.execution.blocked` (काउंटर, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### निष्पादन

- `openclaw.exec.duration_ms` (हिस्टोग्राम, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### डायग्नॉस्टिक्स आंतरिक भाग (मेमोरी और टूल लूप)

- `openclaw.payload.large` (काउंटर, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (हिस्टोग्राम, attrs: `openclaw.payload.large` जैसे ही)
- `openclaw.memory.heap_used_bytes` (हिस्टोग्राम, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (हिस्टोग्राम)
- `openclaw.memory.pressure` (काउंटर, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (काउंटर, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (हिस्टोग्राम, attrs: `openclaw.toolName`, `openclaw.outcome`)

## निर्यात किए गए स्पैन

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - डिफ़ॉल्ट रूप से `gen_ai.system`, या नवीनतम GenAI अर्थगत परंपराएँ चुने जाने पर `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - डिफ़ॉल्ट रूप से `gen_ai.system`, या नवीनतम GenAI अर्थगत परंपराएँ चुने जाने पर `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - त्रुटियों पर `openclaw.errorCategory` और वैकल्पिक `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (upstream provider request id का सीमित SHA-आधारित हैश; कच्चे ids निर्यात नहीं किए जाते)
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` के साथ, model-call spans `openclaw.model.call` के बजाय नवीनतम GenAI inference span नाम `{gen_ai.operation.name} {gen_ai.request.model}` और `CLIENT` span kind का उपयोग करते हैं।
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (कोई prompt, history, response, या session-key सामग्री नहीं)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (कोई loop messages, params, या tool output नहीं)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

जब content capture स्पष्ट रूप से सक्षम हो, तो model और tool spans में उन विशिष्ट
content classes के लिए सीमित, संशोधित `openclaw.content.*` attributes भी
शामिल हो सकते हैं जिन्हें आपने चुना है।

## Diagnostic event catalog

नीचे दिए गए events ऊपर के metrics और spans को आधार देते हैं। Plugins OTLP export के बिना भी
उन्हें सीधे subscribe कर सकते हैं।

**Model usage**

- `model.usage` - tokens, cost, duration, context, provider/model/channel,
  session ids. `usage` लागत और telemetry के लिए provider/turn accounting है;
  `context.used` वर्तमान prompt/context snapshot है और cached input या tool-loop calls शामिल होने पर
  provider `usage.total` से कम हो सकता है।

**Message flow**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Queue and session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (aggregate counters: webhooks/queue/session)

**Harness lifecycle**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  agent harness के लिए प्रति-run lifecycle। इसमें `harnessId`, वैकल्पिक
  `pluginId`, provider/model/channel, और run id शामिल हैं। Completion
  `durationMs`, `outcome`, वैकल्पिक `resultClassification`, `yieldDetected`,
  और `itemLifecycle` counts जोड़ता है। Errors `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, और
  वैकल्पिक `cleanupFailed` जोड़ते हैं।

**Exec**

- `exec.process.completed` - terminal outcome, duration, target, mode, exit
  code, और failure kind। Command text और working directories शामिल नहीं हैं।

## Without an exporter

आप `diagnostics-otel` चलाए बिना diagnostics events को plugins या custom sinks के लिए उपलब्ध रख सकते हैं:

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

या एक बार के env override के रूप में:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Flag output standard log file (`logging.file`) में जाता है और फिर भी
`logging.redactSensitive` द्वारा redacted रहता है। पूर्ण मार्गदर्शिका:
[Diagnostics flags](/hi/diagnostics/flags).

## Disable

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

आप `diagnostics-otel` को `plugins.allow` से बाहर भी छोड़ सकते हैं, या
`openclaw plugins disable diagnostics-otel` चला सकते हैं।

## Related

- [Logging](/hi/logging) - file logs, console output, CLI tailing, और Control UI Logs tab
- [Gateway logging internals](/hi/gateway/logging) - WS log styles, subsystem prefixes, और console capture
- [Diagnostics flags](/hi/diagnostics/flags) - लक्षित debug-log flags
- [Diagnostics export](/hi/gateway/diagnostics) - operator support-bundle tool (OTEL export से अलग)
- [Configuration reference](/hi/gateway/configuration-reference#diagnostics) - पूर्ण `diagnostics.*` field reference
