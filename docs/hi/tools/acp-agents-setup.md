---
read_when:
    - Claude Code / Codex / Gemini CLI के लिए acpx harness इंस्टॉल या कॉन्फ़िगर करना
    - plugin-tools या OpenClaw-tools MCP ब्रिज सक्षम करना
    - ACP अनुमति मोड कॉन्फ़िगर करना
summary: 'ACP एजेंट सेट अप करना: acpx हार्नेस कॉन्फ़िग, plugin सेटअप, अनुमतियाँ'
title: ACP एजेंट — सेटअप
x-i18n:
    generated_at: "2026-06-29T00:15:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

ओवरव्यू, ऑपरेटर रनबुक, और अवधारणाओं के लिए, [ACP एजेंट](/hi/tools/acp-agents) देखें।

नीचे दिए गए अनुभाग acpx हार्नेस कॉन्फ़िग, MCP ब्रिज के लिए Plugin सेटअप, और अनुमति कॉन्फ़िगरेशन को कवर करते हैं।

इस पृष्ठ का उपयोग केवल तब करें जब आप ACP/acpx रूट सेट कर रहे हों। नेटिव Codex
app-server रनटाइम कॉन्फ़िग के लिए, [Codex हार्नेस](/hi/plugins/codex-harness) का उपयोग करें। OpenAI API कुंजियों या Codex OAuth मॉडल-प्रोवाइडर कॉन्फ़िग के लिए,
[OpenAI](/hi/providers/openai) का उपयोग करें।

Codex के पास दो OpenClaw रूट हैं:

| रूट                        | कॉन्फ़िग/कमांड                                       | सेटअप पृष्ठ                             |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| नेटिव Codex app-server     | `/codex ...`, `openai/gpt-*` एजेंट refs               | [Codex हार्नेस](/hi/plugins/codex-harness) |
| स्पष्ट Codex ACP adapter   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | यह पृष्ठ                                |

जब तक आपको स्पष्ट रूप से ACP/acpx व्यवहार की आवश्यकता न हो, नेटिव रूट को प्राथमिकता दें।

## acpx हार्नेस समर्थन (वर्तमान)

वर्तमान acpx बिल्ट-इन हार्नेस उपनाम:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `qwen`

जब OpenClaw acpx बैकएंड का उपयोग करता है, तो `agentId` के लिए इन मानों को प्राथमिकता दें, जब तक आपका acpx कॉन्फ़िग कस्टम एजेंट उपनाम परिभाषित न करे।
यदि आपका स्थानीय Cursor इंस्टॉल अब भी ACP को `agent acp` के रूप में प्रदर्शित करता है, तो बिल्ट-इन डिफ़ॉल्ट बदलने के बजाय अपने acpx कॉन्फ़िग में `cursor` एजेंट कमांड ओवरराइड करें।

सीधा acpx CLI उपयोग `--agent <command>` के माध्यम से मनमाने adapters को भी लक्षित कर सकता है, लेकिन वह कच्चा escape hatch एक acpx CLI सुविधा है (सामान्य OpenClaw `agentId` पथ नहीं)।

मॉडल नियंत्रण adapter-क्षमता पर निर्भर है। Codex ACP मॉडल refs को
स्टार्टअप से पहले OpenClaw द्वारा सामान्यीकृत किया जाता है। अन्य हार्नेस को ACP `models` के साथ
`session/set_model` समर्थन चाहिए; यदि कोई हार्नेस न तो वह ACP क्षमता
और न ही अपना स्टार्टअप मॉडल फ्लैग प्रदर्शित करता है, तो OpenClaw/acpx मॉडल चयन बाध्य नहीं कर सकता।

## आवश्यक कॉन्फ़िग

कोर ACP बेसलाइन:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "openclaw",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

थ्रेड बाइंडिंग कॉन्फ़िग चैनल-adapter विशिष्ट है। Discord के लिए उदाहरण:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnSessions: true,
      },
    },
  },
}
```

यदि थ्रेड-बाउंड ACP spawn काम नहीं करता, तो पहले adapter फीचर फ्लैग सत्यापित करें:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

वर्तमान-वार्तालाप binds को child-thread निर्माण की आवश्यकता नहीं होती। उन्हें एक सक्रिय वार्तालाप संदर्भ और ACP वार्तालाप बाइंडिंग प्रदर्शित करने वाला चैनल adapter चाहिए।

[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## acpx बैकएंड के लिए Plugin सेटअप

पैकेज्ड इंस्टॉल ACP के लिए आधिकारिक `@openclaw/acpx` रनटाइम Plugin का उपयोग करते हैं।
ACP हार्नेस सेशन का उपयोग करने से पहले इसे इंस्टॉल और सक्षम करें:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source checkouts `pnpm install` के बाद स्थानीय workspace Plugin का भी उपयोग कर सकते हैं।

इसके साथ शुरू करें:

```text
/acp doctor
```

यदि आपने `acpx` अक्षम किया है, उसे `plugins.allow` / `plugins.deny` के माध्यम से अस्वीकार किया है, या
पैकेज्ड Plugin पर वापस स्विच करना चाहते हैं, तो स्पष्ट पैकेज पथ का उपयोग करें:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

विकास के दौरान स्थानीय workspace इंस्टॉल:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

फिर बैकएंड स्वास्थ्य सत्यापित करें:

```text
/acp doctor
```

### acpx कमांड और संस्करण कॉन्फ़िगरेशन

डिफ़ॉल्ट रूप से, `acpx` Plugin Gateway
स्टार्टअप के दौरान embedded ACP बैकएंड पंजीकृत करता है और gateway
`ready` संकेत से पहले embedded रनटाइम स्टार्टअप probe की प्रतीक्षा करता है। `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` या
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` केवल उन scripts या environments के लिए सेट करें जो
जानबूझकर स्टार्टअप probe को अक्षम रखते हैं। स्पष्ट
on-demand probe के लिए `/acp doctor` चलाएँ।

Plugin कॉन्फ़िग में कमांड या संस्करण ओवरराइड करें:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` एक absolute path, relative path (OpenClaw workspace से resolved), या command name स्वीकार करता है।
- `expectedVersion: "any"` सख्त version matching अक्षम करता है।
- कस्टम `command` पथ plugin-local auto-install अक्षम करते हैं।

जब किसी path या flag value को एक argv token ही रहना चाहिए, तो structured arguments के साथ किसी एक ACP एजेंट कमांड को ओवरराइड करें:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` उस ACP एजेंट के लिए executable या मौजूदा command string है।
- `agents.<id>.args` वैकल्पिक है। OpenClaw द्वारा उसे वर्तमान acpx command-string registry से गुजारने से पहले हर array item को shell-quoted किया जाता है।

[Plugins](/hi/tools/plugin) देखें।

### स्वचालित dependency इंस्टॉल

जब आप `npm install -g openclaw` के साथ OpenClaw globally इंस्टॉल करते हैं, तो acpx
रनटाइम dependencies (platform-specific binaries) postinstall hook के माध्यम से स्वचालित रूप से इंस्टॉल होती हैं। यदि स्वचालित इंस्टॉल विफल होता है, तो gateway फिर भी सामान्य रूप से शुरू होता है
और `openclaw acp doctor` के माध्यम से missing dependency रिपोर्ट करता है।

### Plugin tools MCP ब्रिज

डिफ़ॉल्ट रूप से, ACPX सेशन OpenClaw Plugin-registered tools को
ACP हार्नेस के सामने expose **नहीं** करते।

यदि आप चाहते हैं कि Codex या Claude Code जैसे ACP एजेंट installed
OpenClaw Plugin tools जैसे memory recall/store को कॉल करें, तो समर्पित bridge सक्षम करें:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

यह क्या करता है:

- ACPX सेशन bootstrap में `openclaw-plugin-tools` नाम का बिल्ट-इन MCP सर्वर inject करता है।
- installed और enabled OpenClaw
  plugins द्वारा पहले से registered plugin tools expose करता है।
- सुविधा को explicit और default-off रखता है।

सुरक्षा और trust notes:

- यह ACP हार्नेस tool surface का विस्तार करता है।
- ACP एजेंट को केवल gateway में पहले से active plugin tools तक पहुंच मिलती है।
- इसे वैसी ही trust boundary मानें जैसी उन plugins को
  OpenClaw में ही execute करने देने की होती है।
- इसे सक्षम करने से पहले installed plugins की समीक्षा करें।

कस्टम `mcpServers` पहले की तरह काम करते रहते हैं। बिल्ट-इन plugin-tools bridge एक
अतिरिक्त opt-in सुविधा है, generic MCP server config का replacement नहीं।

### OpenClaw tools MCP ब्रिज

डिफ़ॉल्ट रूप से, ACPX सेशन built-in OpenClaw tools को भी MCP के माध्यम से expose **नहीं** करते। जब किसी ACP एजेंट को `cron` जैसे selected
built-in tools चाहिए हों, तो अलग core-tools bridge सक्षम करें:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

यह क्या करता है:

- ACPX सेशन bootstrap में `openclaw-tools` नाम का बिल्ट-इन MCP सर्वर inject करता है।
- selected built-in OpenClaw tools expose करता है। प्रारंभिक server `cron` expose करता है।
- core-tool exposure को explicit और default-off रखता है।

### रनटाइम operation timeout कॉन्फ़िगरेशन

`acpx` Plugin embedded रनटाइम स्टार्टअप और control operations को डिफ़ॉल्ट रूप से 120
सेकंड देता है। इससे Gemini CLI जैसे धीमे हार्नेस को
ACP स्टार्टअप और initialization पूरा करने के लिए पर्याप्त समय मिलता है। यदि आपके host को
अलग operation limit चाहिए, तो इसे ओवरराइड करें:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

रनटाइम turns OpenClaw agent/run timeouts का उपयोग करते हैं, जिसमें `/acp timeout` शामिल है।
`sessions_spawn` per-call timeout overrides स्वीकार नहीं करता। यह मान बदलने के बाद
gateway restart करें।

### Health probe एजेंट कॉन्फ़िगरेशन

जब `/acp doctor` या startup probe बैकएंड जाँचता है, तो bundled `acpx`
Plugin एक हार्नेस एजेंट को probe करता है। यदि `acp.allowedAgents` सेट है, तो यह डिफ़ॉल्ट रूप से
पहले allowed agent पर जाता है; अन्यथा यह डिफ़ॉल्ट रूप से `codex` पर जाता है। यदि आपके deployment
को health checks के लिए अलग ACP एजेंट चाहिए, तो probe agent स्पष्ट रूप से सेट करें:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

यह मान बदलने के बाद gateway restart करें।

## अनुमति कॉन्फ़िगरेशन

ACP सेशन non-interactively चलते हैं — file-write और shell-exec अनुमति prompts को approve या deny करने के लिए कोई TTY नहीं होता। acpx Plugin दो config keys प्रदान करता है जो नियंत्रित करती हैं कि permissions कैसे संभाली जाएँ:

ये ACPX हार्नेस permissions OpenClaw exec approvals से अलग हैं और Claude CLI `--permission-mode bypassPermissions` जैसे CLI-backend vendor bypass flags से भी अलग हैं। ACPX `approve-all` ACP सेशन के लिए harness-level break-glass switch है।

OpenClaw `tools.exec.mode`, Codex Guardian
approvals, और ACPX हार्नेस permissions के व्यापक comparison के लिए,
[अनुमति मोड](/hi/tools/permission-modes) देखें।

### `permissionMode`

नियंत्रित करता है कि हार्नेस एजेंट बिना prompt किए कौन-से operations कर सकता है।

| मान             | व्यवहार                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | सभी file writes और shell commands auto-approve करें।      |
| `approve-reads` | केवल reads auto-approve करें; writes और exec को prompts चाहिए। |
| `deny-all`      | सभी permission prompts deny करें।                         |

### `nonInteractivePermissions`

नियंत्रित करता है कि जब permission prompt दिखाया जाता, लेकिन कोई interactive TTY उपलब्ध नहीं होता, तब क्या होता है (जो ACP सेशन के लिए हमेशा होता है)।

| मान    | व्यवहार                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | `AcpRuntimeError` के साथ session abort करें। **(default)**        |
| `deny` | permission silently deny करें और जारी रखें (graceful degradation)। |

### कॉन्फ़िगरेशन

Plugin config के माध्यम से सेट करें:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

इन मानों को बदलने के बाद gateway restart करें।

<Warning>
OpenClaw डिफ़ॉल्ट रूप से `permissionMode=approve-reads` और `nonInteractivePermissions=fail` उपयोग करता है। non-interactive ACP सेशन में, कोई भी write या exec जो permission prompt trigger करता है, `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` के साथ fail हो सकता है।

यदि आपको permissions restrict करने की आवश्यकता है, तो `nonInteractivePermissions` को `deny` पर सेट करें ताकि sessions crash होने के बजाय gracefully degrade हों।
</Warning>

## संबंधित

- [ACP एजेंट](/hi/tools/acp-agents) — overview, operator runbook, concepts
- [उप-एजेंट](/hi/tools/subagents)
- [बहु-एजेंट routing](/hi/concepts/multi-agent)
