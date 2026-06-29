---
read_when:
    - बग रिपोर्ट या सहायता अनुरोध तैयार करना
    - Gateway क्रैश, रीस्टार्ट, मेमोरी प्रेशर या बहुत बड़े पेलोड की डीबगिंग
    - यह समीक्षा करना कि कौन-सा डायग्नोस्टिक्स डेटा रिकॉर्ड या संशोधित किया जाता है
summary: बग रिपोर्टों के लिए साझा किए जा सकने वाले Gateway निदान बंडल बनाएँ
title: डायग्नोस्टिक्स निर्यात
x-i18n:
    generated_at: "2026-06-28T23:06:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw बग रिपोर्टों के लिए स्थानीय डायग्नोस्टिक्स zip बना सकता है। यह
साफ किए गए Gateway स्टेटस, हेल्थ, लॉग, कॉन्फिग आकार, और हाल की payload-मुक्त
स्थिरता घटनाओं को जोड़ता है।

डायग्नोस्टिक्स बंडलों को तब तक secrets की तरह संभालें जब तक आपने उनकी समीक्षा न कर ली हो। इन्हें
payloads और credentials हटाने या redaction करने के लिए डिजाइन किया गया है, लेकिन ये फिर भी
स्थानीय Gateway लॉग और host-level runtime state का सारांश देते हैं।

## त्वरित शुरुआत

```bash
openclaw gateway diagnostics export
```

कमांड लिखे गए zip path को प्रिंट करता है। path चुनने के लिए:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

ऑटोमेशन के लिए:

```bash
openclaw gateway diagnostics export --json
```

## चैट कमांड

Owners चैट में स्थानीय Gateway export का अनुरोध करने के लिए `/diagnostics [note]` का उपयोग कर सकते हैं।
इसे तब उपयोग करें जब बग किसी वास्तविक बातचीत में हुआ हो और आप support के लिए एक
copy-pasteable रिपोर्ट चाहते हों:

1. जिस conversation में आपने समस्या देखी, उसमें `/diagnostics` भेजें। यदि मदद मिले तो
   एक छोटा note जोड़ें, उदाहरण के लिए `/diagnostics bad tool choice`।
2. OpenClaw diagnostics preamble भेजता है और एक explicit exec
   approval मांगता है। approval `openclaw gateway diagnostics export --json` चलाता है।
   allow-all rule के माध्यम से diagnostics approve न करें।
3. approval के बाद, OpenClaw स्थानीय
   bundle path, manifest summary, privacy notes, और संबंधित session ids वाली pasteable report के साथ reply करता है।

Group chats में, owner फिर भी `/diagnostics` चला सकता है, लेकिन OpenClaw
diagnostic details को shared chat में वापस post नहीं करता। यह preamble,
approval prompts, Gateway export result, और Codex session/thread breakdown को
private approval route के माध्यम से owner को भेजता है। group को केवल एक छोटा notice मिलता है
कि diagnostics flow privately भेजा गया था। यदि OpenClaw private
owner route नहीं ढूंढ पाता, तो command fail closed होता है और owner से इसे DM से चलाने के लिए कहता है।

जब active OpenClaw session native OpenAI Codex harness का उपयोग कर रहा हो,
तो वही exec approval उन Codex
runtime threads के लिए OpenAI feedback upload को भी cover करता है जिनके बारे में OpenClaw जानता है। वह upload स्थानीय
Gateway zip से अलग है और केवल Codex harness sessions के लिए दिखाई देता है। approval से पहले,
prompt समझाता है कि diagnostics approve करने से Codex feedback भी भेजा जाएगा, लेकिन यह
Codex session या thread ids सूचीबद्ध नहीं करता। approval के बाद, chat reply
channels, OpenClaw session ids, Codex thread ids, और OpenAI servers को भेजे गए
threads के लिए local resume commands सूचीबद्ध करता है। यदि आप
approval deny या ignore करते हैं, तो OpenClaw export नहीं चलाता, Codex feedback नहीं भेजता, और
Codex ids प्रिंट नहीं करता।

इससे सामान्य Codex debugging loop छोटा हो जाता है: Telegram, Discord, या किसी अन्य channel में
गलत behavior देखें, `/diagnostics` चलाएं, एक बार approve करें, report को
support के साथ share करें, फिर यदि आप native Codex thread को खुद inspect करना चाहते हैं तो
printed `codex resume <thread-id>` command locally चलाएं। उस inspection workflow के लिए
[Codex harness](/hi/plugins/codex-harness#inspect-codex-threads-locally) देखें।

## export में क्या शामिल है

zip में शामिल है:

- `summary.md`: support के लिए human-readable overview।
- `diagnostics.json`: config, logs, status, health,
  और stability data का machine-readable summary।
- `manifest.json`: export metadata और file list।
- Sanitized config shape और non-secret config details।
- Sanitized log summaries और हाल की redacted log lines।
- Best-effort Gateway status और health snapshots।
- `stability/latest.json`: उपलब्ध होने पर newest persisted stability bundle।

Gateway unhealthy होने पर भी export उपयोगी है। यदि Gateway
status या health requests का उत्तर नहीं दे सकता, तो उपलब्ध होने पर local logs, config shape, और latest
stability bundle फिर भी collect किए जाते हैं।

## privacy model

Diagnostics shareable होने के लिए design किए गए हैं। export operational data रखता है
जो debugging में मदद करता है, जैसे:

- subsystem names, Plugin ids, provider ids, channel ids, और configured modes
- status codes, durations, byte counts, queue state, और memory readings
- sanitized log metadata और redacted operational messages
- config shape और non-secret feature settings

export हटाता या redact करता है:

- chat text, prompts, instructions, Webhook bodies, और tool outputs
- credentials, API keys, tokens, cookies, और secret values
- raw request या response bodies
- account ids, message ids, raw session ids, hostnames, और local usernames

जब कोई log message user, chat, prompt, या tool payload text जैसा दिखता है, तो
export केवल यह रखता है कि message omitted था और byte count क्या था।

## Stability recorder

Gateway diagnostics enabled होने पर default रूप से bounded, payload-free stability stream record करता है।
यह operational facts के लिए है, content के लिए नहीं।

वही diagnostic Heartbeat liveness samples record करता है जब Gateway चलता रहता है
लेकिन Node.js event loop या CPU saturated दिखता है। इन
`diagnostic.liveness.warning` events में event-loop delay, event-loop
utilization, CPU-core ratio, active/waiting/queued session counts, ज्ञात होने पर current
startup/runtime phase, recent phase spans, और bounded active/queued
work labels शामिल होते हैं। Idle samples telemetry में `info` level पर रहते हैं। Liveness samples
Gateway warnings केवल तब बनते हैं जब work waiting या queued हो, या जब active work
sustained event-loop delay के साथ overlap करे। अन्यथा healthy background work के दौरान transient max-delay spikes
debug logs में रहते हैं। वे अपने आप Gateway को restart नहीं करते।

Startup phases `diagnostic.phase.completed` events भी emit करते हैं जिनमें wall-clock और
CPU timing होती है। Stalled embedded-run diagnostics `terminalProgressStale=true` mark करते हैं
जब last bridge progress terminal दिखा, जैसे raw response item या
response completion event, लेकिन Gateway embedded run को अब भी
active मानता है।

live recorder inspect करें:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

fatal exit, shutdown timeout,
या restart startup failure के बाद newest persisted stability bundle inspect करें:

```bash
openclaw gateway stability --bundle latest
```

newest persisted bundle से diagnostics zip बनाएं:

```bash
openclaw gateway stability --bundle latest --export
```

events मौजूद होने पर persisted bundles `~/.openclaw/logs/stability/` के अंतर्गत रहते हैं।

## उपयोगी options

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: किसी specific zip path पर लिखें।
- `--log-lines <count>`: शामिल करने के लिए maximum sanitized log lines।
- `--log-bytes <bytes>`: inspect करने के लिए maximum log bytes।
- `--url <url>`: status और health snapshots के लिए Gateway WebSocket URL।
- `--token <token>`: status और health snapshots के लिए Gateway token।
- `--password <password>`: status और health snapshots के लिए Gateway password।
- `--timeout <ms>`: status और health snapshot timeout।
- `--no-stability-bundle`: persisted stability bundle lookup skip करें।
- `--json`: machine-readable export metadata प्रिंट करें।

## diagnostics disable करें

Diagnostics default रूप से enabled हैं। stability recorder और
diagnostic event collection disable करने के लिए:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

diagnostics disable करने से bug-report detail कम होती है। यह सामान्य
Gateway logging को प्रभावित नहीं करता।

Critical memory pressure snapshots default रूप से off हैं। diagnostics
events रखने और pre-OOM stability snapshot भी capture करने के लिए:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

इसे केवल उन hosts पर उपयोग करें जो critical memory pressure के दौरान extra file-system scan और snapshot
write tolerate कर सकते हैं। snapshot off होने पर भी सामान्य memory pressure events
RSS, heap, threshold, और growth facts record करते हैं।

## संबंधित

- [Health checks](/hi/gateway/health)
- [Gateway CLI](/hi/cli/gateway#gateway-diagnostics-export)
- [Gateway protocol](/hi/gateway/protocol#system-and-identity)
- [Logging](/hi/logging)
- [OpenTelemetry export](/hi/gateway/opentelemetry) — diagnostics को collector तक stream करने के लिए अलग flow
