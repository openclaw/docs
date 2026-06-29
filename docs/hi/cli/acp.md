---
read_when:
    - ACP-आधारित IDE इंटीग्रेशन सेट अप करना
    - Gateway तक ACP सत्र रूटिंग की डीबगिंग
summary: IDE एकीकरणों के लिए ACP bridge चलाएँ
title: ACP
x-i18n:
    generated_at: "2026-06-28T22:46:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

[एजेंट क्लाइंट प्रोटोकॉल (ACP)](https://agentclientprotocol.com/) bridge चलाएँ, जो OpenClaw Gateway से बात करता है.

यह कमांड IDEs के लिए stdio पर ACP बोलता है और prompts को WebSocket पर Gateway
को forward करता है. यह ACP sessions को Gateway session keys से mapped रखता है.

`openclaw acp` एक Gateway-backed ACP bridge है, पूरा ACP-native editor
runtime नहीं. यह session routing, prompt delivery, और basic streaming
updates पर केंद्रित है.

अगर आप चाहते हैं कि कोई external MCP client, ACP harness session host करने के
बजाय सीधे OpenClaw channel conversations से बात करे, तो इसके बजाय
[`openclaw mcp serve`](/hi/cli/mcp) उपयोग करें.

## यह क्या नहीं है

यह पेज अक्सर ACP harness sessions के साथ भ्रमित किया जाता है.

`openclaw acp` का अर्थ है:

- OpenClaw ACP server की तरह काम करता है
- कोई IDE या ACP client OpenClaw से connect करता है
- OpenClaw उस work को Gateway session में forward करता है

यह [ACP Agents](/hi/tools/acp-agents) से अलग है, जहाँ OpenClaw `acpx` के माध्यम से
Codex या Claude Code जैसे external harness को चलाता है.

त्वरित नियम:

- editor/client OpenClaw से ACP में बात करना चाहता है: `openclaw acp` उपयोग करें
- OpenClaw को Codex/Claude/Gemini को ACP harness के रूप में launch करना चाहिए: `/acp spawn` और [ACP Agents](/hi/tools/acp-agents) उपयोग करें

## Compatibility Matrix

| ACP area                                                              | Status      | Notes                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | लागू | stdio से Gateway chat/send + abort तक core bridge flow.                                                                                                                                                                                        |
| `listSessions`, slash commands                                        | लागू | Session list bounded cursor pagination और `cwd` filtering के साथ Gateway session state के विरुद्ध काम करती है, जहाँ Gateway session rows workspace metadata रखते हैं; commands `available_commands_update` के माध्यम से advertised किए जाते हैं.                                |
| Session lineage metadata                                              | लागू | Session listings और session info snapshots `_meta` में OpenClaw parent और child lineage शामिल करते हैं, ताकि ACP clients private Gateway side channels के बिना subagent graphs render कर सकें.                                                                |
| `resumeSession`, `closeSession`                                       | लागू | Resume history replay किए बिना ACP session को existing Gateway session से फिर bind करता है. Close active bridge work cancel करता है, pending prompts को cancelled के रूप में resolve करता है, और bridge session state release करता है.                                              |
| `loadSession`                                                         | आंशिक     | ACP session को Gateway session key से फिर bind करता है और bridge-created sessions के लिए ACP event-ledger history replay करता है. पुराने/no-ledger sessions stored user/assistant text पर fallback करते हैं.                                                             |
| Prompt content (`text`, embedded `resource`, images)                  | आंशिक     | Text/resources को chat input में flatten किया जाता है; images Gateway attachments बनती हैं.                                                                                                                                                                 |
| Session modes                                                         | आंशिक     | `session/set_mode` supported है और bridge thought level, tool verbosity, reasoning, usage detail, और elevated actions के लिए शुरुआती Gateway-backed session controls expose करता है. व्यापक ACP-native mode/config surfaces अभी भी scope से बाहर हैं. |
| Session info और usage updates                                        | आंशिक     | Bridge cached Gateway session snapshots से `session_info_update` और best-effort `usage_update` notifications emit करता है. Usage approximate है और केवल तब भेजा जाता है जब Gateway token totals fresh marked हों.                                        |
| Tool streaming                                                        | आंशिक     | `tool_call` / `tool_call_update` events में raw I/O, text content, और best-effort file locations शामिल होते हैं जब Gateway tool args/results उन्हें expose करते हैं. Embedded terminals और अधिक समृद्ध diff-native output अभी expose नहीं होते.                        |
| Exec approvals                                                        | आंशिक     | Active ACP prompt turns के दौरान Gateway exec approval prompts को `session/request_permission` के साथ ACP client तक relay किया जाता है.                                                                                                                    |
| Per-session MCP servers (`mcpServers`)                                | असमर्थित | Bridge mode per-session MCP server requests को reject करता है. इसके बजाय OpenClaw gateway या agent पर MCP configure करें.                                                                                                                                     |
| Client filesystem methods (`fs/read_text_file`, `fs/write_text_file`) | असमर्थित | Bridge ACP client filesystem methods को call नहीं करता.                                                                                                                                                                                          |
| Client terminal methods (`terminal/*`)                                | असमर्थित | Bridge ACP client terminals create नहीं करता या terminal ids को tool calls के माध्यम से stream नहीं करता.                                                                                                                                                       |
| Session plans / thought streaming                                     | असमर्थित | Bridge currently output text और tool status emit करता है, ACP plan या thought updates नहीं.                                                                                                                                                         |

## ज्ञात सीमाएँ

- `loadSession` केवल bridge-created sessions के लिए complete ACP event-ledger history
  replay कर सकता है. पुराने/no-ledger sessions अभी भी transcript fallback उपयोग करते हैं
  और historic tool calls या system notices reconstruct नहीं करते.
- यदि कई ACP clients समान Gateway session key share करते हैं, तो event और cancel
  routing प्रति client strictly isolated होने के बजाय best-effort होती है. जब आपको clean editor-local
  turns चाहिए हों, तो default isolated `acp-bridge:<uuid>` sessions को prefer करें.
- Gateway stop states ACP stop reasons में translate किए जाते हैं, लेकिन वह mapping
  पूरी तरह ACP-native runtime से कम expressive है.
- शुरुआती session controls अभी Gateway knobs का focused subset surface करते हैं:
  thought level, tool verbosity, reasoning, usage detail, और elevated
  actions. Model selection और exec-host controls अभी ACP config options के रूप में expose नहीं हुए हैं.
- `session_info_update` और `usage_update` Gateway session
  snapshots से derived हैं, live ACP-native runtime accounting से नहीं. Usage approximate है,
  उसमें cost data नहीं होता, और केवल तब emit होता है जब Gateway total token
  data को fresh mark करता है.
- Tool follow-along data best-effort है. Bridge known tool args/results में दिखने वाले
  file paths surface कर सकता है, लेकिन अभी ACP terminals या
  structured file diffs emit नहीं करता.
- Exec approval relay active ACP prompt turn तक scoped है; अन्य
  Gateway sessions से approvals ignore किए जाते हैं.

## उपयोग

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP client (debug)

IDE के बिना bridge की sanity-check करने के लिए built-in ACP client उपयोग करें.
यह ACP bridge spawn करता है और आपको interactively prompts type करने देता है.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Permission model (client debug mode):

- Auto-approval allowlist-based है और केवल trusted core tool IDs पर लागू होता है.
- `read` auto-approval current working directory (`--cwd` set होने पर) तक scoped है.
- ACP केवल narrow readonly classes को auto-approve करता है: active cwd के अंतर्गत scoped `read` calls और readonly search tools (`search`, `web_search`, `memory_search`). Unknown/non-core tools, out-of-scope reads, exec-capable tools, control-plane tools, mutating tools, और interactive flows को हमेशा explicit prompt approval चाहिए.
- Server-provided `toolCall.kind` को untrusted metadata माना जाता है (authorization source नहीं).
- यह ACP bridge policy ACPX harness permissions से अलग है. यदि आप OpenClaw को `acpx` backend के माध्यम से run करते हैं, तो `plugins.entries.acpx.config.permissionMode=approve-all` उस harness session के लिए break-glass "yolo" switch है.

## Protocol smoke testing

Protocol-level debugging के लिए, isolated state के साथ Gateway start करें और
ACP JSON-RPC client के साथ stdio पर `openclaw acp` drive करें. `initialize`,
`session/new`, absolute `cwd` के साथ `session/list`, `session/resume`,
`session/close`, duplicate close, और missing resume cover करें.

Proof में advertised lifecycle capabilities, Gateway-backed
session row, update notifications, और Gateway `sessions.list` log शामिल होना चाहिए:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

केवल ACP proof के रूप में `openclaw gateway call sessions.list` का उपयोग करने से बचें. वह
CLI path fresh-token operator scope upgrade request कर सकता है; ACP bridge
correctness ACP stdio frames और Gateway `sessions.list` log से proven होती है.

## इसका उपयोग कैसे करें

ACP का उपयोग करें जब कोई IDE (या अन्य client) Agent Client Protocol बोलता हो और आप
चाहते हों कि वह OpenClaw Gateway session drive करे.

1. सुनिश्चित करें कि Gateway चल रहा है (local या remote).
2. Gateway target configure करें (config या flags).
3. अपने IDE को stdio पर `openclaw acp` run करने के लिए point करें.

Example config (persisted):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Example direct run (no config write):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agents चुनना

ACP agents को directly pick नहीं करता. यह Gateway session key द्वारा route करता है.

किसी specific agent को target करने के लिए agent-scoped session keys उपयोग करें:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

हर ACP सेशन एक ही Gateway सेशन कुंजी से मैप होता है। एक एजेंट के कई
सेशन हो सकते हैं; ACP डिफ़ॉल्ट रूप से एक अलग-थलग `acp-bridge:<uuid>` सेशन का उपयोग करता है, जब तक आप
कुंजी या लेबल को ओवरराइड नहीं करते।

ब्रिज मोड में प्रति-सेशन `mcpServers` समर्थित नहीं हैं। यदि कोई ACP क्लाइंट
उन्हें `newSession` या `loadSession` के दौरान भेजता है, तो ब्रिज उन्हें चुपचाप अनदेखा करने के बजाय
एक स्पष्ट त्रुटि लौटाता है।

यदि आप चाहते हैं कि ACPX-समर्थित सेशन OpenClaw Plugin टूल्स या चुने हुए
बिल्ट-इन टूल्स जैसे `cron` देखें, तो प्रति-सेशन `mcpServers` पास करने की कोशिश करने के बजाय
Gateway-साइड ACPX MCP ब्रिज सक्षम करें। देखें
[ACP एजेंट](/hi/tools/acp-agents-setup#plugin-tools-mcp-bridge) और
[OpenClaw टूल्स MCP ब्रिज](/hi/tools/acp-agents-setup#openclaw-tools-mcp-bridge)।

## `acpx` से उपयोग करें (Codex, Claude, अन्य ACP क्लाइंट)

यदि आप चाहते हैं कि Codex या Claude Code जैसा कोई कोडिंग एजेंट ACP पर आपके
OpenClaw बॉट से बात करे, तो इसके बिल्ट-इन `openclaw` लक्ष्य के साथ `acpx` का उपयोग करें।

सामान्य प्रवाह:

1. Gateway चलाएँ और सुनिश्चित करें कि ACP ब्रिज उस तक पहुँच सकता है।
2. `acpx openclaw` को `openclaw acp` पर पॉइंट करें।
3. उस OpenClaw सेशन कुंजी को लक्ष्य बनाएँ जिसे आप कोडिंग एजेंट से उपयोग कराना चाहते हैं।

उदाहरण:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

यदि आप चाहते हैं कि `acpx openclaw` हर बार किसी विशिष्ट Gateway और सेशन कुंजी को
लक्ष्य बनाए, तो `~/.acpx/config.json` में `openclaw` एजेंट कमांड को ओवरराइड करें:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

रेपो-लोकल OpenClaw चेकआउट के लिए, dev रनर के बजाय सीधे CLI एंट्रीपॉइंट का उपयोग करें
ताकि ACP स्ट्रीम साफ रहे। उदाहरण के लिए:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

यह Codex, Claude Code, या किसी अन्य ACP-सक्षम क्लाइंट को टर्मिनल स्क्रैप किए बिना
OpenClaw एजेंट से संदर्भात्मक जानकारी खींचने देने का सबसे आसान तरीका है।

## Zed एडिटर सेटअप

`~/.config/zed/settings.json` में एक कस्टम ACP एजेंट जोड़ें (या Zed का Settings UI उपयोग करें):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

किसी विशिष्ट Gateway या एजेंट को लक्ष्य बनाने के लिए:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed में, Agent पैनल खोलें और थ्रेड शुरू करने के लिए "OpenClaw ACP" चुनें।

## सेशन मैपिंग

डिफ़ॉल्ट रूप से, ACP ब्रिज सेशन को `acp-bridge:` प्रीफ़िक्स वाली एक अलग-थलग
Gateway सेशन कुंजी मिलती है। ये सामान्य-मॉडल ब्रिज सेशन सिंथेटिक हैं और
पुरानी प्रविष्टि छँटाई तथा प्रविष्टि-संख्या सीमाओं के अधीन हैं। किसी ज्ञात सेशन को पुनः उपयोग करने के लिए,
सेशन कुंजी या लेबल पास करें:

- `--session <key>`: किसी विशिष्ट Gateway सेशन कुंजी का उपयोग करें।
- `--session-label <label>`: लेबल के आधार पर मौजूदा सेशन हल करें।
- `--reset-session`: उस कुंजी के लिए नया सेशन id बनाएँ (वही कुंजी, नया ट्रांसक्रिप्ट)।

यदि आपका ACP क्लाइंट मेटाडेटा का समर्थन करता है, तो आप प्रति सेशन ओवरराइड कर सकते हैं:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

सेशन कुंजियों के बारे में अधिक जानें [/concepts/session](/hi/concepts/session) पर।

## विकल्प

- `--url <url>`: Gateway WebSocket URL (कॉन्फ़िगर होने पर डिफ़ॉल्ट gateway.remote.url होता है)।
- `--token <token>`: Gateway प्रमाणीकरण टोकन।
- `--token-file <path>`: फ़ाइल से Gateway प्रमाणीकरण टोकन पढ़ें।
- `--password <password>`: Gateway प्रमाणीकरण पासवर्ड।
- `--password-file <path>`: फ़ाइल से Gateway प्रमाणीकरण पासवर्ड पढ़ें।
- `--session <key>`: डिफ़ॉल्ट सेशन कुंजी।
- `--session-label <label>`: हल करने के लिए डिफ़ॉल्ट सेशन लेबल।
- `--require-existing`: यदि सेशन कुंजी/लेबल मौजूद नहीं है तो विफल हों।
- `--reset-session`: पहले उपयोग से पहले सेशन कुंजी रीसेट करें।
- `--no-prefix-cwd`: प्रॉम्प्ट में कार्यशील डायरेक्टरी को प्रीफ़िक्स न करें।
- `--provenance <off|meta|meta+receipt>`: ACP उद्गम मेटाडेटा या रसीदें शामिल करें।
- `--verbose, -v`: stderr पर विस्तृत लॉगिंग।

सुरक्षा नोट:

- कुछ सिस्टम पर `--token` और `--password` स्थानीय प्रोसेस सूचियों में दिखाई दे सकते हैं।
- `--token-file`/`--password-file` या एनवायरनमेंट वैरिएबल (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) को प्राथमिकता दें।
- Gateway प्रमाणीकरण समाधान वही साझा अनुबंध अनुसरण करता है जिसे अन्य Gateway क्लाइंट उपयोग करते हैं:
  - लोकल मोड: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*` फ़ॉलबैक केवल तब जब `gateway.auth.*` सेट न हो (कॉन्फ़िगर-लेकिन-अनसुलझे स्थानीय SecretRefs बंद होकर विफल होते हैं)
  - रिमोट मोड: रिमोट प्राथमिकता नियमों के अनुसार env/config फ़ॉलबैक के साथ `gateway.remote.*`
  - `--url` ओवरराइड-सुरक्षित है और अप्रत्यक्ष config/env क्रेडेंशियल्स का पुनः उपयोग नहीं करता; स्पष्ट `--token`/`--password` (या फ़ाइल वैरिएंट) पास करें
- ACP रनटाइम बैकएंड चाइल्ड प्रोसेस को `OPENCLAW_SHELL=acp` मिलता है, जिसका उपयोग संदर्भ-विशिष्ट शेल/प्रोफ़ाइल नियमों के लिए किया जा सकता है।
- `openclaw acp client` शुरू किए गए ब्रिज प्रोसेस पर `OPENCLAW_SHELL=acp-client` सेट करता है।

### `acp client` विकल्प

- `--cwd <dir>`: ACP सेशन के लिए कार्यशील डायरेक्टरी।
- `--server <command>`: ACP सर्वर कमांड (डिफ़ॉल्ट: `openclaw`)।
- `--server-args <args...>`: ACP सर्वर को पास किए गए अतिरिक्त आर्ग्युमेंट।
- `--server-verbose`: ACP सर्वर पर विस्तृत लॉगिंग सक्षम करें।
- `--verbose, -v`: विस्तृत क्लाइंट लॉगिंग।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [ACP एजेंट](/hi/tools/acp-agents)
