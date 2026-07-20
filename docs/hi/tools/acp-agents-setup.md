---
read_when:
    - Claude Code / Codex / Gemini CLI के लिए acpx हार्नेस इंस्टॉल या कॉन्फ़िगर करना
    - Plugin-tools या OpenClaw-tools MCP ब्रिज को सक्षम करना
    - ACP अनुमति मोड कॉन्फ़िगर करना
summary: 'ACP एजेंट सेट अप करना: acpx हार्नेस कॉन्फ़िगरेशन, Plugin सेटअप, अनुमतियाँ'
title: ACP एजेंट — सेटअप
x-i18n:
    generated_at: "2026-07-20T07:45:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a1742373d9e65733a2f969422253c3b2c0aa33e0b4caa4d5ab769dc2cc5d97
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

अवलोकन, ऑपरेटर रनबुक और अवधारणाओं के लिए, [ACP एजेंट](/hi/tools/acp-agents) देखें।

यह पृष्ठ acpx हार्नेस कॉन्फ़िगरेशन, MCP ब्रिजों के लिए Plugin सेटअप और अनुमति कॉन्फ़िगरेशन को कवर करता है।

इस पृष्ठ का उपयोग केवल ACP/acpx रूट सेट अप करते समय करें। नेटिव Codex
app-server रनटाइम कॉन्फ़िगरेशन के लिए, [Codex हार्नेस](/hi/plugins/codex-harness) का उपयोग करें। OpenAI API कुंजियों या Codex OAuth मॉडल-प्रदाता कॉन्फ़िगरेशन के लिए,
[OpenAI](/hi/providers/openai) का उपयोग करें।

Codex के दो OpenClaw रूट हैं:

| रूट                        | कॉन्फ़िगरेशन/कमांड                                      | सेटअप पृष्ठ                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| नेटिव Codex app-server     | `/codex ...`, `openai/gpt-*` एजेंट संदर्भ                | [Codex हार्नेस](/hi/plugins/codex-harness) |
| स्पष्ट Codex ACP अडैप्टर | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | यह पृष्ठ                               |

जब तक आपको स्पष्ट रूप से ACP/acpx व्यवहार की आवश्यकता न हो, नेटिव रूट को प्राथमिकता दें।

## acpx हार्नेस समर्थन (वर्तमान)

अंतर्निहित acpx हार्नेस उपनाम (पिन की गई `acpx` निर्भरता से):

| उपनाम        | रैप करता है                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP ब्रिज (नेटिव `openclaw acp`)                                                                     |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` और `factorydroid` भी अंतर्निहित `droid` अडैप्टर में रिज़ॉल्व होते हैं।

जब OpenClaw acpx बैकएंड का उपयोग करता है, तो `agentId` के लिए इन मानों को प्राथमिकता दें, जब तक कि आपका acpx कॉन्फ़िगरेशन कस्टम एजेंट उपनाम परिभाषित न करता हो।
यदि आपका स्थानीय Cursor इंस्टॉलेशन अभी भी ACP को `agent acp` के रूप में उजागर करता है, तो अंतर्निहित डिफ़ॉल्ट बदलने के बजाय अपने acpx कॉन्फ़िगरेशन में `cursor` एजेंट कमांड को ओवरराइड करें।

प्रत्यक्ष acpx CLI उपयोग `--agent <command>` के माध्यम से मनमाने अडैप्टरों को भी लक्षित कर सकता है, लेकिन वह अपरिष्कृत एस्केप हैच acpx CLI की सुविधा है (सामान्य OpenClaw `agentId` पथ नहीं)।

मॉडल नियंत्रण अडैप्टर की क्षमता पर निर्भर है। Codex ACP मॉडल संदर्भों को
स्टार्टअप से पहले OpenClaw द्वारा सामान्यीकृत किया जाता है। अन्य हार्नेसों को ACP `models` के साथ
`session/set_model` समर्थन की आवश्यकता होती है; यदि कोई हार्नेस न तो वह ACP क्षमता
और न ही अपना स्टार्टअप मॉडल फ़्लैग उजागर करता है, तो OpenClaw/acpx मॉडल चयन को बाध्य नहीं कर सकता।

## आवश्यक कॉन्फ़िगरेशन

कोर ACP आधाररेखा:

```json5
{
  acp: {
    enabled: true,
    // वैकल्पिक। डिफ़ॉल्ट true है; /acp नियंत्रण बनाए रखते हुए ACP डिस्पैच रोकने के लिए false सेट करें।
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
      "qwen",
    ],
    stream: {
      deliveryMode: "live",
    },
  },
}
```

थ्रेड बाइंडिंग कॉन्फ़िगरेशन चैनल-अडैप्टर विशिष्ट है। Discord के लिए उदाहरण:

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
        // डिफ़ॉल्ट पहले से true है; यहाँ स्पष्ट रूप से दिखाया गया है।
        spawnSessions: true,
      },
    },
  },
}
```

यदि थ्रेड-बाउंड ACP स्पॉन काम नहीं करता है, तो पहले अडैप्टर सुविधा फ़्लैग सत्यापित करें:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

वर्तमान-वार्तालाप बाइंड के लिए चाइल्ड-थ्रेड निर्माण आवश्यक नहीं है। इनके लिए एक सक्रिय वार्तालाप संदर्भ और ACP वार्तालाप बाइंडिंग उजागर करने वाला चैनल अडैप्टर आवश्यक है।

[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## acpx बैकएंड के लिए Plugin सेटअप

पैकेज किए गए इंस्टॉलेशन ACP के लिए आधिकारिक `@openclaw/acpx` रनटाइम Plugin का उपयोग करते हैं।
ACP हार्नेस सत्रों का उपयोग करने से पहले इसे इंस्टॉल और सक्षम करें:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

स्रोत चेकआउट `pnpm install` के बाद स्थानीय वर्कस्पेस Plugin का भी उपयोग कर सकते हैं।

इससे शुरू करें:

```text
/acp doctor
```

यदि आपने `acpx` अक्षम किया है, `plugins.allow` / `plugins.deny` के माध्यम से इसे अस्वीकार किया है, या
पैकेज किए गए Plugin पर वापस जाना चाहते हैं, तो स्पष्ट पैकेज पथ का उपयोग करें:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

विकास के दौरान स्थानीय वर्कस्पेस इंस्टॉलेशन:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

फिर बैकएंड की स्थिति सत्यापित करें:

```text
/acp doctor
```

### acpx रनटाइम स्टार्टअप प्रोब

`acpx` Plugin ACP रनटाइम को सीधे एम्बेड करता है (कॉन्फ़िगर करने के लिए कोई अलग `acpx` बाइनरी या
संस्करण नहीं)। डिफ़ॉल्ट रूप से यह Gateway स्टार्टअप के दौरान एम्बेड किए गए बैकएंड को पंजीकृत करता है और gateway `ready`
संकेत से पहले स्टार्टअप प्रोब की प्रतीक्षा करता है। `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` या
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` केवल उन स्क्रिप्ट या परिवेशों के लिए सेट करें जो
जानबूझकर स्टार्टअप प्रोब को अक्षम रखते हैं। स्पष्ट
ऑन-डिमांड प्रोब के लिए `/acp doctor` चलाएँ।

जब किसी पथ या फ़्लैग मान को एक argv टोकन ही रहना चाहिए, तो संरचित आर्ग्युमेंट के साथ किसी एक ACP एजेंट कमांड को ओवरराइड करें:

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

- `agents.<id>.command` उस ACP एजेंट के लिए निष्पादन योग्य फ़ाइल या मौजूदा कमांड स्ट्रिंग है।
- `agents.<id>.args` वैकल्पिक है। OpenClaw द्वारा इसे वर्तमान acpx कमांड-स्ट्रिंग रजिस्ट्री से गुज़ारने से पहले प्रत्येक ऐरे आइटम को शेल-कोट किया जाता है।

[Plugins](/hi/tools/plugin) देखें।

### स्वचालित अडैप्टर डाउनलोड

`acpx` पहली बार उपयोग पर `npx` के माध्यम से ACP अडैप्टर (उदाहरण के लिए Claude और Codex ACP
ब्रिज) स्वतः डाउनलोड करता है। आपको अडैप्टर पैकेजों को
मैन्युअल रूप से इंस्टॉल करने की आवश्यकता नहीं है और स्वयं OpenClaw के लिए कोई अलग पोस्टइंस्टॉल चरण नहीं है। यदि
अडैप्टर डाउनलोड या स्पॉन विफल होता है, तो `/acp doctor` विफलता की रिपोर्ट करता है।

### Plugin टूल MCP ब्रिज

डिफ़ॉल्ट रूप से ACPX सत्र, OpenClaw Plugin द्वारा पंजीकृत टूल को ACP हार्नेस के सामने
**उजागर नहीं** करते हैं।

यदि आप चाहते हैं कि Codex या Claude Code जैसे ACP एजेंट मेमोरी रिकॉल/स्टोर जैसे इंस्टॉल किए गए
OpenClaw Plugin टूल को कॉल करें, तो समर्पित ब्रिज सक्षम करें:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

यह क्या करता है:

- ACPX सत्र बूटस्ट्रैप में `openclaw-plugin-tools` नामक अंतर्निहित MCP सर्वर
  इंजेक्ट करता है।
- इंस्टॉल और सक्षम OpenClaw Plugins द्वारा पहले से पंजीकृत Plugin टूल
  उजागर करता है।
- सक्रिय ACP सत्र पहचान को Plugin टूल फ़ैक्ट्रियों तक पहुँचाता है, ताकि
  एजेंट-स्कोप वाले टूल उस एजेंट के नेमस्पेस में बने रहें।
- सुविधा को स्पष्ट और डिफ़ॉल्ट रूप से बंद रखता है।

सुरक्षा और विश्वास संबंधी टिप्पणियाँ:

- यह ACP हार्नेस की टूल सतह का विस्तार करता है।
- ACP एजेंटों को केवल उन Plugin टूल तक पहुँच मिलती है जो पहले से Gateway में सक्रिय हैं।
- इसे वही विश्वास सीमा मानें जो उन Plugins को स्वयं OpenClaw में निष्पादित होने देने की है।
- इसे सक्षम करने से पहले इंस्टॉल किए गए Plugins की समीक्षा करें।

कस्टम `mcpServers` पहले की तरह काम करते रहते हैं। अंतर्निहित Plugin-टूल ब्रिज एक
अतिरिक्त वैकल्पिक सुविधा है, सामान्य MCP सर्वर कॉन्फ़िगरेशन का प्रतिस्थापन नहीं।

### OpenClaw टूल MCP ब्रिज

डिफ़ॉल्ट रूप से ACPX सत्र अंतर्निहित OpenClaw टूल को भी MCP के माध्यम से
**उजागर नहीं** करते हैं। जब किसी ACP एजेंट को `cron` जैसे चयनित
अंतर्निहित टूल की आवश्यकता हो, तो अलग कोर-टूल ब्रिज सक्षम करें:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

यह क्या करता है:

- ACPX सत्र बूटस्ट्रैप में `openclaw-tools` नामक अंतर्निहित MCP सर्वर
  इंजेक्ट करता है।
- चयनित अंतर्निहित OpenClaw टूल उजागर करता है। प्रारंभिक सर्वर `cron` उजागर करता है।
- कोर-टूल का प्रदर्शन स्पष्ट और डिफ़ॉल्ट रूप से बंद रखता है।

### रनटाइम ऑपरेशन टाइमआउट कॉन्फ़िगरेशन

`acpx` Plugin एम्बेड किए गए रनटाइम स्टार्टअप और नियंत्रण ऑपरेशनों को डिफ़ॉल्ट रूप से 120
सेकंड देता है। इससे Gemini CLI जैसे धीमे हार्नेसों को ACP स्टार्टअप और आरंभीकरण
पूरा करने के लिए पर्याप्त समय मिलता है। यदि आपके होस्ट को अलग ऑपरेशन सीमा की आवश्यकता हो, तो इसे ओवरराइड करें:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

रनटाइम टर्न `/acp timeout` सहित OpenClaw एजेंट/रन टाइमआउट का उपयोग करते हैं।
`sessions_spawn` प्रति-कॉल टाइमआउट ओवरराइड स्वीकार नहीं करता; ऑपरेटर पथ
`agents.defaults.subagents.runTimeoutSeconds` है। `timeoutSeconds` बदलने के बाद
Gateway पुनः आरंभ करें।

### स्वास्थ्य प्रोब एजेंट कॉन्फ़िगरेशन

जब `/acp doctor` या स्टार्टअप प्रोब बैकएंड की जाँच करता है, तो बंडल किया गया `acpx`
Plugin एक हार्नेस एजेंट की जाँच करता है। यदि `acp.allowedAgents` सेट है, तो यह डिफ़ॉल्ट रूप से
पहले अनुमत एजेंट का उपयोग करता है; अन्यथा इसका डिफ़ॉल्ट `codex` है। यदि आपके डिप्लॉयमेंट को
स्वास्थ्य जाँच के लिए किसी अलग ACP एजेंट की आवश्यकता है, तो प्रोब एजेंट स्पष्ट रूप से सेट करें:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

यह मान बदलने के बाद Gateway पुनः आरंभ करें।

## अनुमति कॉन्फ़िगरेशन

ACP सत्र गैर-अंतःक्रियात्मक रूप से चलते हैं — फ़ाइल-लेखन और शेल-निष्पादन अनुमति संकेतों को स्वीकृत या अस्वीकार करने के लिए कोई TTY नहीं होता। acpx Plugin दो कॉन्फ़िगरेशन कुंजियाँ प्रदान करता है जो नियंत्रित करती हैं कि अनुमतियों को कैसे संभाला जाए:

ये ACPX हार्नेस अनुमतियाँ OpenClaw exec अनुमोदनों और Claude CLI `--permission-mode bypassPermissions` जैसे CLI-बैकएंड विक्रेता बायपास फ़्लैग से अलग हैं। ACPX `approve-all`, ACP सत्रों के लिए हार्नेस-स्तरीय आपातकालीन बायपास स्विच है।

OpenClaw `tools.exec.mode`, Codex Guardian अनुमोदनों और ACPX हार्नेस अनुमतियों के बीच व्यापक तुलना के लिए,
[अनुमति मोड](/hi/tools/permission-modes) देखें।

### `permissionMode`

यह नियंत्रित करता है कि हार्नेस एजेंट बिना संकेत दिए कौन-से ऑपरेशन कर सकता है।

| मान           | व्यवहार                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | सभी फ़ाइल लेखनों और शेल कमांड को स्वतः अनुमोदित करें।          |
| `approve-reads` | केवल पठन को स्वतः अनुमोदित करें; लेखन और exec के लिए संकेत आवश्यक हैं। |
| `deny-all`      | सभी अनुमति संकेतों को अस्वीकार करें।                              |

### `nonInteractivePermissions`

यह नियंत्रित करता है कि जब अनुमति संकेत दिखाया जाना हो, लेकिन कोई इंटरैक्टिव TTY उपलब्ध न हो, तब क्या होता है (ACP सत्रों के लिए हमेशा यही स्थिति होती है)।

| मान  | व्यवहार                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | `PermissionPromptUnavailableError` के साथ सत्र निरस्त करें। **(डिफ़ॉल्ट)** |
| `deny` | अनुमति को चुपचाप अस्वीकार करके जारी रखें (सुचारु कार्यक्षमता ह्रास)।        |

### कॉन्फ़िगरेशन

Plugin कॉन्फ़िगरेशन के माध्यम से सेट करें:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

इन मानों को बदलने के बाद Gateway पुनः आरंभ करें।

<Warning>
OpenClaw में डिफ़ॉल्ट रूप से `permissionMode=approve-reads` और `nonInteractivePermissions=fail` होते हैं। गैर-इंटरैक्टिव ACP सत्रों में, अनुमति संकेत ट्रिगर करने वाला कोई भी लेखन या exec, `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` के साथ विफल हो सकता है।

यदि आपको अनुमतियाँ प्रतिबंधित करनी हों, तो `nonInteractivePermissions` को `deny` पर सेट करें, ताकि सत्र क्रैश होने के बजाय सुचारु रूप से सीमित कार्यक्षमता के साथ चलते रहें।
</Warning>

## संबंधित

- [ACP एजेंट](/hi/tools/acp-agents) — अवलोकन, ऑपरेटर रनबुक, अवधारणाएँ
- [उप-एजेंट](/hi/tools/subagents)
- [बहु-एजेंट रूटिंग](/hi/concepts/multi-agent)
