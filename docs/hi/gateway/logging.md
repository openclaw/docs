---
read_when:
    - लॉगिंग आउटपुट या फ़ॉर्मैट बदलना
    - CLI या Gateway आउटपुट की डीबगिंग
summary: लॉगिंग सतहें, फ़ाइल लॉग, WS लॉग शैलियाँ, और कंसोल फ़ॉर्मैटिंग
title: Gateway लॉगिंग
x-i18n:
    generated_at: "2026-06-28T23:10:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# लॉगिंग

उपयोगकर्ता-उन्मुख अवलोकन (CLI + Control UI + कॉन्फ़िग) के लिए, [/logging](/hi/logging) देखें।

OpenClaw में दो लॉग "सतहें" हैं:

- **कंसोल आउटपुट** (जो आप टर्मिनल / Debug UI में देखते हैं)।
- Gateway लॉगर द्वारा लिखे गए **फ़ाइल लॉग** (JSON lines)।

स्टार्टअप पर, Gateway हल किए गए डिफ़ॉल्ट एजेंट मॉडल को उन
मोड डिफ़ॉल्ट के साथ लॉग करता है जो नए सेशन को प्रभावित करते हैं, उदाहरण के लिए:

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` डिफ़ॉल्ट एजेंट, मॉडल पैरामीटर, या ग्लोबल एजेंट डिफ़ॉल्ट से आता है;
जब यह सेट नहीं होता, तो स्टार्टअप सारांश `medium` दिखाता है। `fast` डिफ़ॉल्ट
एजेंट या मॉडल `fastMode` पैरामीटर से आता है।

## फ़ाइल-आधारित लॉगर

- डिफ़ॉल्ट रोलिंग लॉग फ़ाइल `/tmp/openclaw/` के अंतर्गत होती है (प्रति दिन एक फ़ाइल): `openclaw-YYYY-MM-DD.log`
  - तारीख Gateway होस्ट के स्थानीय टाइमज़ोन का उपयोग करती है।
- सक्रिय लॉग फ़ाइलें `logging.maxFileBytes` (डिफ़ॉल्ट: 100 MB) पर रोटेट होती हैं, पाँच तक
  क्रमांकित आर्काइव रखती हैं और नई सक्रिय फ़ाइल में लिखना जारी रखती हैं।
- लॉग फ़ाइल पथ और स्तर को `~/.openclaw/openclaw.json` के माध्यम से कॉन्फ़िगर किया जा सकता है:
  - `logging.file`
  - `logging.level`

फ़ाइल फ़ॉर्मैट प्रति पंक्ति एक JSON ऑब्जेक्ट है।

Talk, रीयलटाइम वॉइस, और managed-room कोड पाथ सीमित lifecycle रिकॉर्ड के लिए साझा फ़ाइल लॉगर का उपयोग करते हैं। ये रिकॉर्ड ऑपरेशनल डिबगिंग और OTLP लॉग एक्सपोर्ट के लिए हैं; ट्रांसक्रिप्ट टेक्स्ट, ऑडियो पेलोड, turn ids, call ids, और provider item ids को लॉग रिकॉर्ड में कॉपी नहीं किया जाता।

Control UI Logs टैब इस फ़ाइल को Gateway (`logs.tail`) के माध्यम से tail करता है।
CLI भी यही कर सकता है:

```bash
openclaw logs --follow
```

**वर्बोज़ बनाम लॉग स्तर**

- **फ़ाइल लॉग** केवल `logging.level` द्वारा नियंत्रित होते हैं।
- `--verbose` केवल **कंसोल verbosity** (और WS लॉग शैली) को प्रभावित करता है; यह फ़ाइल लॉग स्तर को
  नहीं बढ़ाता।
- फ़ाइल लॉग में केवल-वर्बोज़ विवरण कैप्चर करने के लिए, `logging.level` को `debug` या
  `trace` पर सेट करें।
- Trace logging में चुने हुए hot paths के लिए डायग्नॉस्टिक timing summaries भी शामिल होती हैं,
  जैसे plugin tool factory preparation। देखें
  [/tools/plugin#slow-plugin-tool-setup](/hi/tools/plugin#slow-plugin-tool-setup).

## कंसोल कैप्चर

CLI `console.log/info/warn/error/debug/trace` को कैप्चर करता है और उन्हें फ़ाइल लॉग में लिखता है,
साथ ही stdout/stderr पर प्रिंट करना जारी रखता है।

आप कंसोल verbosity को अलग से ट्यून कर सकते हैं:

- `logging.consoleLevel` (डिफ़ॉल्ट `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## रिडैक्शन

OpenClaw संवेदनशील टोकन को लॉग या ट्रांसक्रिप्ट आउटपुट के process से बाहर जाने से पहले mask कर सकता है। यह logging redaction policy कंसोल, file-log, OTLP log-record, और session transcript text sinks पर लागू होती है, ताकि मेल खाने वाली secret values को JSONL lines या messages के डिस्क पर लिखे जाने से पहले mask किया जा सके।

- `logging.redactSensitive`: `off` | `tools` (डिफ़ॉल्ट: `tools`)
- `logging.redactPatterns`: regex strings की array (डिफ़ॉल्ट को override करती है)
  - Raw regex strings (auto `gi`) का उपयोग करें, या custom flags चाहिए हों तो `/pattern/flags` का।
  - Matches को पहले 6 + अंतिम 4 chars (length >= 18) रखकर mask किया जाता है, अन्यथा `***`।
  - डिफ़ॉल्ट सामान्य key assignments, CLI flags, JSON fields, bearer headers, PEM blocks, लोकप्रिय token prefixes, और payment credential field names जैसे card number, CVC/CVV, shared payment token, और payment credential को cover करते हैं।

कुछ safety boundaries `logging.redactSensitive` की परवाह किए बिना हमेशा redact करती हैं।
इसमें Control UI tool-call events, `sessions_history` tool output,
diagnostics support exports, provider error observations, exec approval command
display, और Gateway WebSocket protocol logs शामिल हैं। ये surfaces फिर भी अतिरिक्त patterns के रूप में
`logging.redactPatterns` का उपयोग कर सकती हैं, लेकिन `redactSensitive: "off"`
उन्हें raw secrets emit नहीं करने देता।

## Gateway WebSocket लॉग

Gateway WebSocket protocol logs को दो modes में print करता है:

- **सामान्य मोड (कोई `--verbose` नहीं)**: केवल "दिलचस्प" RPC results print होते हैं:
  - errors (`ok=false`)
  - धीमी calls (डिफ़ॉल्ट threshold: `>= 50ms`)
  - parse errors
- **वर्बोज़ मोड (`--verbose`)**: सभी WS request/response traffic print करता है।

### WS लॉग शैली

`openclaw gateway` प्रति-Gateway style switch को support करता है:

- `--ws-log auto` (डिफ़ॉल्ट): सामान्य मोड optimized है; verbose mode compact output का उपयोग करता है
- `--ws-log compact`: verbose होने पर compact output (paired request/response)
- `--ws-log full`: verbose होने पर full per-frame output
- `--compact`: `--ws-log compact` के लिए alias

उदाहरण:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## कंसोल फ़ॉर्मैटिंग (subsystem logging)

कंसोल formatter **TTY-aware** है और सुसंगत, prefixed lines print करता है।
Subsystem loggers output को grouped और scannable रखते हैं।

व्यवहार:

- हर line पर **Subsystem prefixes** (जैसे `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem colors** (प्रति subsystem स्थिर) और level coloring
- **जब output TTY हो या environment rich terminal जैसा दिखे तब color** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` का सम्मान करता है
- **छोटे किए गए subsystem prefixes**: leading `gateway/` + `channels/` हटाता है, अंतिम 2 segments रखता है (जैसे `whatsapp/outbound`)
- **Subsystem के अनुसार sub-loggers** (auto prefix + structured field `{ subsystem }`)
- QR/UX output के लिए **`logRaw()`** (कोई prefix नहीं, कोई formatting नहीं)
- **कंसोल styles** (जैसे `pretty | compact | json`)
- **कंसोल log level** file log level से अलग (जब `logging.level` को `debug`/`trace` पर सेट किया जाता है, तो file पूरा detail रखती है)
- **WhatsApp message bodies** `debug` पर log होते हैं (उन्हें देखने के लिए `--verbose` का उपयोग करें)

यह मौजूदा file logs को स्थिर रखता है और interactive output को scannable बनाता है।

## संबंधित

- [Logging](/hi/logging)
- [OpenTelemetry export](/hi/gateway/opentelemetry)
- [Diagnostics export](/hi/gateway/diagnostics)
