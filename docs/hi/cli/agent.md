---
read_when:
    - आप scripts से एक agent turn चलाना चाहते हैं (वैकल्पिक रूप से उत्तर डिलीवर करें)
summary: '`openclaw agent` के लिए CLI संदर्भ (Gateway के माध्यम से एक एजेंट टर्न भेजें)'
title: एजेंट
x-i18n:
    generated_at: "2026-06-28T22:46:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway के माध्यम से agent turn चलाएं (embedded के लिए `--local` का उपयोग करें)।
किसी configured agent को सीधे लक्षित करने के लिए `--agent <id>` का उपयोग करें।

कम से कम एक session selector पास करें:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

संबंधित:

- Agent send tool: [Agent send](/hi/tools/agent-send)

## विकल्प

- `-m, --message <text>`: message body
- `--message-file <path>`: UTF-8 फ़ाइल से message body पढ़ें
- `-t, --to <dest>`: session key निकालने के लिए उपयोग किया गया recipient
- `--session-key <key>`: routing के लिए उपयोग की जाने वाली explicit session key
- `--session-id <id>`: explicit session id
- `--agent <id>`: agent id; routing bindings को override करता है
- `--model <id>`: इस run के लिए model override (`provider/model` या model id)
- `--thinking <level>`: agent thinking level (`off`, `minimal`, `low`, `medium`, `high`, साथ ही provider-supported custom levels जैसे `xhigh`, `adaptive`, या `max`)
- `--verbose <on|off>`: session के लिए verbose level persist करें
- `--channel <channel>`: delivery channel; main session channel उपयोग करने के लिए छोड़ दें
- `--reply-to <target>`: delivery target override
- `--reply-channel <channel>`: delivery channel override
- `--reply-account <id>`: delivery account override
- `--local`: embedded agent को सीधे चलाएं (Plugin registry preload के बाद)
- `--deliver`: reply को selected channel/target पर वापस भेजें
- `--timeout <seconds>`: agent timeout override करें (default 600 या config value)
- `--json`: JSON output करें

## उदाहरण

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## टिप्पणियां

- `--message` या `--message-file` में से ठीक एक पास करें। `--message-file` optional UTF-8 BOM हटाने के बाद multiline file content को preserve करता है, और जो files valid UTF-8 नहीं हैं उन्हें reject करता है।
- Gateway mode, Gateway request विफल होने पर embedded agent पर fallback करता है। embedded execution को शुरुआत से force करने के लिए `--local` का उपयोग करें।
- `--local` फिर भी पहले Plugin registry को preload करता है, इसलिए Plugin-provided providers, tools, और channels embedded runs के दौरान उपलब्ध रहते हैं।
- `--local` और embedded fallback runs को one-shot runs माना जाता है। उस local process के लिए खोले गए bundled MCP loopback resources और warm Claude stdio sessions reply के बाद retire कर दिए जाते हैं, इसलिए scripted invocations local child processes को जीवित नहीं रखते।
- Gateway-backed runs, Gateway-owned MCP loopback resources को running Gateway process के तहत छोड़ते हैं; पुराने clients अब भी historical cleanup flag भेज सकते हैं, लेकिन Gateway इसे compatibility no-op के रूप में स्वीकार करता है।
- `--channel`, `--reply-channel`, और `--reply-account` reply delivery को प्रभावित करते हैं, session routing को नहीं।
- `--session-key` एक explicit session key चुनता है। Agent-prefixed keys को `agent:<agent-id>:<session-key>` का उपयोग करना होगा, और जब दोनों प्रदान किए जाएं तो `--agent` को key के agent id से match करना होगा। Bare non-sentinel keys, supplied होने पर `--agent` के scope में होते हैं, या अन्यथा configured default agent के scope में; उदाहरण के लिए, `--agent ops --session-key incident-42` `agent:ops:incident-42` पर route करता है। Literal `global` और `unknown` केवल तब unscoped रहते हैं जब कोई `--agent` supplied नहीं हो; उस case में, embedded fallback और store ownership configured default agent का उपयोग करते हैं।
- `--json` stdout को JSON response के लिए reserved रखता है। Gateway, Plugin, और embedded-fallback diagnostics stderr पर route किए जाते हैं ताकि scripts stdout को सीधे parse कर सकें।
- Embedded fallback JSON में `meta.transport: "embedded"` और `meta.fallbackFrom: "gateway"` शामिल होते हैं ताकि scripts fallback runs को Gateway runs से अलग पहचान सकें।
- यदि Gateway agent run स्वीकार करता है लेकिन CLI final reply की प्रतीक्षा करते हुए timeout हो जाता है, तो embedded fallback एक fresh explicit `gateway-fallback-*` session/run id का उपयोग करता है और `meta.fallbackReason: "gateway_timeout"` के साथ fallback session fields report करता है। इससे Gateway-owned transcript lock से race होने या original routed conversation session को silently replace करने से बचा जाता है।
- Gateway-backed runs के लिए, `SIGTERM` और `SIGINT` waiting CLI request को interrupt करते हैं। यदि Gateway ने run पहले ही स्वीकार कर लिया है, तो CLI exit करने से पहले उस accepted run id के लिए `chat.abort` भी भेजता है। Local `--local` runs और embedded fallback runs को वही abort signal मिलता है, लेकिन वे `chat.abort` नहीं भेजते। यदि duplicate `--run-id` Gateway तक पहुंचता है जबकि original agent run अभी भी active है, तो duplicate response `status: "in_flight"` report करता है और non-JSON CLI empty reply के बजाय stderr diagnostic print करता है। external cron/systemd wrappers के लिए, `timeout -k 60 600 openclaw agent ...` जैसे outer hard-kill backstop को रखें ताकि shutdown drain न हो पाने पर भी supervisor process को reap कर सके।
- जब यह command `models.json` regeneration trigger करती है, तो SecretRef-managed provider credentials non-secret markers के रूप में persist किए जाते हैं (उदाहरण के लिए env var names, `secretref-env:ENV_VAR_NAME`, या `secretref-managed`), resolved secret plaintext के रूप में नहीं।
- Marker writes source-authoritative हैं: OpenClaw active source config snapshot से markers persist करता है, resolved runtime secret values से नहीं।

## JSON delivery status

जब `--json --deliver` का उपयोग किया जाता है, तो CLI JSON response में top-level `deliveryStatus` शामिल हो सकता है ताकि scripts delivered, suppressed, partial, और failed sends में अंतर कर सकें:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

`deliveryStatus.status` `sent`, `suppressed`, `partial_failed`, या `failed` में से एक है। `suppressed` का मतलब है delivery जानबूझकर नहीं भेजी गई, उदाहरण के लिए message-sending hook ने इसे cancel कर दिया या कोई visible result नहीं था; यह फिर भी terminal no-retry outcome है। `partial_failed` का मतलब है कि बाद का payload fail होने से पहले कम से कम एक payload भेजा गया। `failed` का मतलब है कि कोई durable send complete नहीं हुआ या delivery preflight fail हुआ।

Gateway-backed CLI responses raw Gateway result shape को भी preserve करते हैं, जहां वही object `result.deliveryStatus` पर उपलब्ध होता है।

सामान्य fields:

- `requested`: object मौजूद होने पर हमेशा `true`।
- `attempted`: durable send path चलने के बाद `true`; preflight failures या no visible payloads के लिए `false`।
- `succeeded`: `true`, `false`, या `"partial"`; `"partial"` `status: "partial_failed"` के साथ pair होता है।
- `reason`: durable delivery या preflight validation से lowercase snake-case reason। ज्ञात reasons में `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target`, और `no_delivery_target` शामिल हैं; failed durable sends failed stage भी report कर सकते हैं। unknown values को opaque मानें क्योंकि set expand हो सकता है।
- `resultCount`: उपलब्ध होने पर channel send results की संख्या।
- `sentBeforeError`: partial failure ने error से पहले कम से कम एक payload भेजा हो तो `true`।
- `error`: failed या partial-failed sends के लिए boolean `true`।
- `errorMessage`: केवल तब शामिल होता है जब underlying delivery error message capture किया जाता है। Preflight failures `error` और `reason` carry करते हैं लेकिन कोई `errorMessage` नहीं।
- `payloadOutcomes`: उपलब्ध होने पर `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError`, या hook metadata के साथ optional per-payload results।

## संबंधित

- [CLI reference](/hi/cli)
- [Agent runtime](/hi/concepts/agent)
