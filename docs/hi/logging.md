---
read_when:
    - आपको OpenClaw लॉगिंग का शुरुआती-अनुकूल अवलोकन चाहिए
    - आप लॉग स्तरों, फ़ॉर्मैट या रिडैक्शन को कॉन्फ़िगर करना चाहते हैं
    - आप समस्या निवारण कर रहे हैं और आपको लॉग जल्दी ढूँढने हैं
summary: फ़ाइल लॉग, कंसोल आउटपुट, CLI टेलिंग, और Control UI लॉग टैब
title: लॉगिंग
x-i18n:
    generated_at: "2026-06-28T23:24:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw में दो मुख्य लॉग सतहें हैं:

- Gateway द्वारा लिखे गए **फ़ाइल लॉग** (JSON लाइनें)।
- टर्मिनलों और Gateway Debug UI में दिखाया गया **कंसोल आउटपुट**।

Control UI का **Logs** टैब gateway फ़ाइल लॉग को tail करता है। यह पेज बताता है कि
लॉग कहाँ रहते हैं, उन्हें कैसे पढ़ना है, और लॉग स्तरों और फ़ॉर्मैट को कैसे कॉन्फ़िगर करना है।

## लॉग कहाँ रहते हैं

डिफ़ॉल्ट रूप से, Gateway यहाँ एक रोलिंग लॉग फ़ाइल लिखता है:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

तारीख gateway होस्ट के स्थानीय टाइमज़ोन का उपयोग करती है।

हर फ़ाइल `logging.maxFileBytes` (डिफ़ॉल्ट: 100 MB) तक पहुँचने पर rotate होती है।
OpenClaw सक्रिय फ़ाइल के बगल में पाँच तक numbered archives रखता है, जैसे
`openclaw-YYYY-MM-DD.1.log`, और diagnostics को suppress करने के बजाय
एक नई सक्रिय लॉग फ़ाइल में लिखना जारी रखता है।

आप इसे `~/.openclaw/openclaw.json` में override कर सकते हैं:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## लॉग कैसे पढ़ें

### CLI: लाइव tail (अनुशंसित)

RPC के ज़रिए gateway लॉग फ़ाइल tail करने के लिए CLI का उपयोग करें:

```bash
openclaw logs --follow
```

उपयोगी मौजूदा विकल्प:

- `--local-time`: timestamps को आपके स्थानीय टाइमज़ोन में render करें
- `--url <url>` / `--token <token>` / `--timeout <ms>`: मानक Gateway RPC flags
- `--expect-final`: agent-backed RPC final-response wait flag (shared client layer के ज़रिए यहाँ स्वीकार किया जाता है)

आउटपुट मोड:

- **TTY sessions**: सुंदर, colorized, structured लॉग लाइनें।
- **Non-TTY sessions**: plain text।
- `--json`: line-delimited JSON (प्रति लाइन एक लॉग event)।
- `--plain`: TTY sessions में plain text force करें।
- `--no-color`: ANSI colors अक्षम करें।

जब आप explicit `--url` पास करते हैं, CLI config या
environment credentials को auto-apply नहीं करता; अगर target Gateway को auth
चाहिए तो `--token` खुद शामिल करें।

JSON मोड में, CLI `type`-tagged objects emit करता है:

- `meta`: stream metadata (file, cursor, size)
- `log`: parsed log entry
- `notice`: truncation / rotation hints
- `raw`: unparsed log line

अगर implicit local loopback Gateway pairing माँगता है, connect के दौरान बंद हो जाता है,
या `logs.tail` के उत्तर देने से पहले timeout हो जाता है, तो `openclaw logs` अपने-आप
configured Gateway file log पर fallback करता है। Explicit `--url` targets इस
fallback का उपयोग नहीं करते। `openclaw logs --follow` अधिक strict है: Linux पर यह उपलब्ध होने पर PID के अनुसार सक्रिय
user-systemd Gateway journal का उपयोग करता है, और अन्यथा संभावित रूप से stale side-by-side फ़ाइल follow करने के बजाय
live Gateway को retry करता रहता है।

अगर Gateway unreachable है, तो CLI यह चलाने के लिए एक छोटा hint print करता है:

```bash
openclaw doctor
```

### Control UI (web)

Control UI का **Logs** टैब `logs.tail` का उपयोग करके वही फ़ाइल tail करता है।
इसे खोलने के तरीके के लिए [Control UI](/hi/web/control-ui) देखें।

### केवल-channel लॉग

channel activity (WhatsApp/Telegram/etc) को filter करने के लिए, उपयोग करें:

```bash
openclaw channels logs --channel whatsapp
```

## लॉग फ़ॉर्मैट

### फ़ाइल लॉग (JSONL)

लॉग फ़ाइल की हर लाइन एक JSON object होती है। CLI और Control UI इन
entries को parse करके structured output (time, level, subsystem, message) render करते हैं।

File-log JSONL records में उपलब्ध होने पर machine-filterable top-level fields भी शामिल होते हैं:

- `hostname`: gateway host name।
- `message`: full-text search के लिए flattened log message text।
- `agent_id`: जब log call agent context रखता है, तब सक्रिय agent id।
- `session_id`: जब log call session context रखता है, तब सक्रिय session id/key।
- `channel`: जब log call channel context रखता है, तब सक्रिय channel।

OpenClaw इन fields के साथ मूल structured log arguments को preserve करता है
ताकि numbered tslog argument keys पढ़ने वाले मौजूदा parsers काम करते रहें।

Talk, realtime voice, और managed-room activity इसी file-log pipeline के ज़रिए bounded lifecycle log
records emit करती है। इन records में उपलब्ध होने पर event type,
mode, transport, provider, और size/timing measurements शामिल होते हैं, लेकिन
transcript text, audio payloads, turn ids, call ids, और provider item ids छोड़े जाते हैं।

### कंसोल आउटपुट

कंसोल लॉग **TTY-aware** हैं और readability के लिए formatted हैं:

- Subsystem prefixes (जैसे `gateway/channels/whatsapp`)
- Level coloring (info/warn/error)
- Optional compact या JSON mode

कंसोल formatting `logging.consoleStyle` द्वारा नियंत्रित होती है।

### Gateway WebSocket लॉग

`openclaw gateway` में RPC traffic के लिए WebSocket protocol logging भी है:

- normal mode: केवल interesting results (errors, parse errors, slow calls)
- `--verbose`: सभी request/response traffic
- `--ws-log auto|compact|full`: verbose rendering style चुनें
- `--compact`: `--ws-log compact` के लिए alias

उदाहरण:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## logging कॉन्फ़िगर करना

सारी logging configuration `~/.openclaw/openclaw.json` में `logging` के अंतर्गत रहती है।

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### लॉग स्तर

- `logging.level`: **file logs** (JSONL) level।
- `logging.consoleLevel`: **console** verbosity level।

आप **`OPENCLAW_LOG_LEVEL`** environment variable (जैसे `OPENCLAW_LOG_LEVEL=debug`) के ज़रिए दोनों को override कर सकते हैं। env var config file पर precedence लेता है, इसलिए आप `openclaw.json` edit किए बिना single run के लिए verbosity बढ़ा सकते हैं। आप global CLI option **`--log-level <level>`** (उदाहरण के लिए, `openclaw --log-level debug gateway run`) भी पास कर सकते हैं, जो उस command के लिए environment variable को override करता है।

`--verbose` केवल console output और WS log verbosity को प्रभावित करता है; यह
file log levels नहीं बदलता।

### Targeted model transport diagnostics

Provider calls debug करते समय, सभी logs को `debug` पर raise करने के बजाय targeted environment flags का उपयोग करें:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

उपलब्ध flags:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: request start, fetch response, SDK
  headers, पहला streaming event, stream completion, और transport errors को
  `info` level पर emit करें।
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: model request logs में bounded request payload
  summary शामिल करें।
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: payload summary में सभी model-facing tool names शामिल करें।
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: redacted, capped JSON
  payload snapshot शामिल करें। केवल debugging के दौरान उपयोग करें; secrets redact किए जाते हैं लेकिन prompts
  और message text फिर भी मौजूद हो सकते हैं।
- `OPENCLAW_DEBUG_SSE=events`: first-event और stream-completion timing emit करें।
- `OPENCLAW_DEBUG_SSE=peek`: पहले पाँच redacted SSE event
  payloads भी emit करें, प्रति event capped।
- `OPENCLAW_DEBUG_CODE_MODE=1`: code-mode model-surface diagnostics emit करें,
  जिसमें यह भी शामिल है कि native provider tools कब hidden होते हैं क्योंकि code mode
  tool surface own करता है।

ये flags सामान्य OpenClaw logging के ज़रिए log करते हैं, इसलिए `openclaw logs --follow`
और Control UI Logs tab इन्हें दिखाते हैं। flags के बिना, वही diagnostics
`debug` level पर उपलब्ध रहते हैं।

`[model-fetch]` start और response metadata (provider, API, model, status,
latency, और request fields जैसे method, URL, timeout, proxy, और policy)
`OPENCLAW_DEBUG_MODEL_TRANSPORT` से स्वतंत्र रूप से हमेशा `info` level पर emit होता है,
इसलिए basic model transport hygiene debug flags के बिना भी visible रहती है।

### Trace correlation

File logs JSONL हैं। जब कोई log call valid diagnostic trace context रखता है,
OpenClaw trace fields को top-level JSON keys (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) के रूप में लिखता है ताकि external log processors उस line को
OTEL spans और provider `traceparent` propagation से correlate कर सकें।

Gateway HTTP requests और Gateway WebSocket frames एक internal request
trace scope establish करते हैं। उस async scope के अंदर emit किए गए logs और diagnostic events,
जब वे explicit trace context पास नहीं करते, request trace inherit करते हैं। Agent run और
model-call traces active request trace के children बनते हैं, इसलिए local logs,
diagnostic snapshots, OTEL spans, और trusted provider `traceparent` headers को
raw request या model content log किए बिना `traceId` से join किया जा सकता है।

Talk lifecycle log records भी diagnostics-otel log export में flow करते हैं जब
OpenTelemetry log export enabled होता है, file logs जैसे ही bounded attributes का उपयोग करते हुए।
OTLP, stdout JSONL, या दोनों sinks चुनने के लिए `diagnostics.otel.logsExporter` configure करें।

### Model call size और timing

Model-call diagnostics raw prompt या response content capture किए बिना bounded request/response measurements record करते हैं:

- `requestPayloadBytes`: final model request payload का UTF-8 byte size
- `responseStreamBytes`: streamed model response chunk
  payloads का UTF-8 byte size। High-frequency text, thinking, और tool-call delta events
  full `partial` snapshots के बजाय केवल incremental `delta` bytes गिनते हैं।
- `timeToFirstByteMs`: पहले streamed response event से पहले elapsed time
- `durationMs`: कुल model-call duration

Diagnostics export enabled होने पर ये fields diagnostic snapshots, model-call plugin hooks, और
OTEL model-call spans/metrics के लिए उपलब्ध होते हैं।

### Console styles

`logging.consoleStyle`:

- `pretty`: human-friendly, colored, timestamps के साथ।
- `compact`: अधिक tight output (long sessions के लिए सर्वोत्तम)।
- `json`: प्रति line JSON (log processors के लिए)।

### Redaction

OpenClaw sensitive tokens को console output, file logs,
OTLP log records, persisted session transcript text, या Control UI tool
event payloads (tool start args, partial/final result payloads, derived
exec output, और patch summaries) तक पहुँचने से पहले redact कर सकता है:

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: default set को override करने के लिए regex strings की list। Custom patterns Control UI tool payloads के built-in defaults के ऊपर apply होते हैं, इसलिए pattern जोड़ने से defaults द्वारा पहले से पकड़े गए values की redaction कभी कमजोर नहीं होती।

File logs और session transcripts JSONL रहते हैं, लेकिन matching secret values
line या message के disk पर लिखे जाने से पहले masked हो जाते हैं। Redaction best-effort है:
यह text-bearing message content और log strings पर apply होती है, हर
identifier या binary payload field पर नहीं।

Built-in defaults सामान्य API credentials और payment-credential field
names को cover करते हैं, जैसे card number, CVC/CVV, shared payment token, और payment credential,
जब वे JSON fields, URL parameters, CLI flags, या assignments के रूप में दिखाई देते हैं।

`logging.redactSensitive: "off"` केवल इस general log/transcript
policy को disable करता है। OpenClaw फिर भी safety-boundary payloads redact करता है जिन्हें UI
clients, support bundles, diagnostics observers, approval prompts, या agent
tools को दिखाया जा सकता है। उदाहरणों में Control UI tool-call events, `sessions_history` output,
diagnostics support exports, provider error observations, exec approval command
display, और Gateway WebSocket protocol logs शामिल हैं। Custom `logging.redactPatterns`
अब भी उन surfaces पर project-specific patterns जोड़ सकते हैं।

## Diagnostics और OpenTelemetry

Diagnostics model runs और message-flow telemetry (webhooks, queueing, session state) के लिए
structured, machine-readable events हैं। वे logs को replace **नहीं** करते —
वे metrics, traces, और exporters को feed करते हैं। Events in-process emit होते हैं,
चाहे आप उन्हें export करें या नहीं।

दो adjacent surfaces:

- **OpenTelemetry export** — metrics, traces, और logs को OTLP/HTTP पर
  किसी भी OpenTelemetry-compatible collector या backend (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.) को भेजें। Full configuration, signal catalog,
  metric/span names, env vars, और privacy model dedicated page पर रहते हैं:
  [OpenTelemetry export](/hi/gateway/opentelemetry)।
- **Diagnostics flags** — targeted debug-log flags जो extra logs को
  `logging.level` raise किए बिना `logging.file` पर route करते हैं। Flags case-insensitive हैं
  और wildcards (`telegram.*`, `*`) support करते हैं। `diagnostics.flags` के अंतर्गत
  या `OPENCLAW_DIAGNOSTICS=...` env override के ज़रिए configure करें। Full guide:
  [Diagnostics flags](/hi/diagnostics/flags)।

OTLP export के बिना plugins या custom sinks के लिए diagnostics events enable करने के लिए:

```json5
{
  diagnostics: { enabled: true },
}
```

OTLP को कलेक्टर में निर्यात करने के लिए, [OpenTelemetry निर्यात](/hi/gateway/opentelemetry) देखें।

## समस्या निवारण सुझाव

- **Gateway पहुंच योग्य नहीं है?** पहले `openclaw doctor` चलाएं।
- **लॉग खाली हैं?** जांचें कि Gateway चल रहा है और `logging.file` में दिए गए फ़ाइल पथ पर लिख रहा है।
- **अधिक विवरण चाहिए?** `logging.level` को `debug` या `trace` पर सेट करें और फिर से प्रयास करें।

## संबंधित

- [OpenTelemetry निर्यात](/hi/gateway/opentelemetry) — OTLP/HTTP निर्यात, मेट्रिक/span कैटलॉग, गोपनीयता मॉडल
- [निदान flags](/hi/diagnostics/flags) — लक्षित debug-log flags
- [Gateway लॉगिंग आंतरिक विवरण](/hi/gateway/logging) — WS लॉग शैलियाँ, सबसिस्टम प्रीफ़िक्स, और कंसोल कैप्चर
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference#diagnostics) — पूरा `diagnostics.*` फ़ील्ड संदर्भ
