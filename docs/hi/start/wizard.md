---
read_when:
    - CLI ऑनबोर्डिंग चलाना या कॉन्फ़िगर करना
    - नई मशीन सेट अप करना
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI ऑनबोर्डिंग: Gateway, कार्यक्षेत्र, चैनल और Skills के लिए निर्देशित सेटअप'
title: ऑनबोर्डिंग (CLI)
x-i18n:
    generated_at: "2026-06-29T00:15:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

CLI ऑनबोर्डिंग macOS, Linux, या Windows पर OpenClaw के लिए **अनुशंसित** टर्मिनल सेटअप पथ है। Windows डेस्कटॉप उपयोगकर्ता
[Windows Hub](/hi/platforms/windows) से भी शुरू कर सकते हैं।
यह एक निर्देशित फ़्लो में local Gateway या रिमोट Gateway कनेक्शन, साथ में चैनल, Skills,
और वर्कस्पेस डिफ़ॉल्ट कॉन्फ़िगर करता है।

```bash
openclaw onboard
```

QuickStart में आम तौर पर केवल कुछ मिनट लगते हैं, लेकिन पूर्ण ऑनबोर्डिंग में अधिक समय लग सकता है
जब प्रोवाइडर साइन-इन, चैनल पेयरिंग, daemon इंस्टॉल, नेटवर्क डाउनलोड,
Skills, या वैकल्पिक Plugin को अतिरिक्त सेटअप की ज़रूरत हो। विज़र्ड यह समयरेखा पहले ही दिखा देता है,
और वैकल्पिक चरण छोड़े जा सकते हैं और बाद में
`openclaw configure` के साथ फिर देखे जा सकते हैं।

## लोकेल

CLI विज़र्ड स्थिर ऑनबोर्डिंग कॉपी को स्थानीयकृत करता है। यह लोकेल को
`OPENCLAW_LOCALE`, फिर `LC_ALL`, फिर `LC_MESSAGES`, फिर `LANG` से हल करता है, और
English पर फ़ॉलबैक करता है। समर्थित विज़र्ड लोकेल `en`, `zh-CN`, और `zh-TW` हैं।

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

नाम और स्थिर पहचानकर्ता शाब्दिक रहते हैं: `OpenClaw`, `Gateway`, `Tailscale`,
कमांड, config keys, URLs, provider IDs, model IDs, और plugin/channel labels
अनुवादित नहीं होते।

<Info>
सबसे तेज़ पहली चैट: Control UI खोलें (चैनल सेटअप की ज़रूरत नहीं)। चलाएँ
`openclaw dashboard` और ब्राउज़र में चैट करें। Docs: [Dashboard](/hi/web/dashboard).
</Info>

बाद में फिर से कॉन्फ़िगर करने के लिए:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` का मतलब non-interactive मोड नहीं है। स्क्रिप्ट के लिए, `--non-interactive` का उपयोग करें।
</Note>

<Tip>
CLI ऑनबोर्डिंग में एक वेब खोज चरण शामिल है जहाँ आप Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG, या Tavily जैसे प्रोवाइडर चुन सकते हैं। कुछ प्रोवाइडर को
API key की आवश्यकता होती है, जबकि अन्य बिना key के काम करते हैं। आप इसे बाद में
`openclaw configure --section web` से भी कॉन्फ़िगर कर सकते हैं। Docs: [Web tools](/hi/tools/web).
</Tip>

## QuickStart बनाम Advanced

ऑनबोर्डिंग **QuickStart** (डिफ़ॉल्ट) बनाम **Advanced** (पूर्ण नियंत्रण) से शुरू होती है।

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Local gateway (loopback)
    - वर्कस्पेस डिफ़ॉल्ट (या मौजूदा वर्कस्पेस)
    - Gateway पोर्ट **18789**
    - Gateway auth **Token** (स्वतः जनरेटेड, loopback पर भी)
    - नए local सेटअप के लिए टूल नीति डिफ़ॉल्ट: `tools.profile: "coding"` (मौजूदा स्पष्ट प्रोफ़ाइल सुरक्षित रहती है)
    - DM isolation डिफ़ॉल्ट: local ऑनबोर्डिंग unset होने पर `session.dmScope: "per-channel-peer"` लिखती है। विवरण: [CLI Setup Reference](/hi/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale exposure **Off**
    - Telegram + WhatsApp DMs का डिफ़ॉल्ट **allowlist** है (आपसे आपका फ़ोन नंबर पूछा जाएगा)

  </Tab>
  <Tab title="Advanced (full control)">
    - हर चरण दिखाता है (मोड, वर्कस्पेस, Gateway, चैनल, daemon, Skills).

  </Tab>
</Tabs>

## ऑनबोर्डिंग क्या कॉन्फ़िगर करती है

**Local मोड (डिफ़ॉल्ट)** आपको इन चरणों से गुज़ारता है:

1. **Model/Auth** — कोई भी समर्थित प्रोवाइडर/auth फ़्लो चुनें (API key, OAuth, या provider-specific manual auth), जिसमें Custom Provider
   (OpenAI-compatible, Anthropic-compatible, या Unknown auto-detect) शामिल है। एक डिफ़ॉल्ट मॉडल चुनें।
   सुरक्षा नोट: यदि यह एजेंट टूल चलाएगा या webhook/hooks सामग्री प्रोसेस करेगा, तो उपलब्ध सबसे मज़बूत latest-generation मॉडल को प्राथमिकता दें और टूल नीति को सख्त रखें। कमजोर/पुराने tiers prompt-inject करना आसान होते हैं।
   non-interactive रन के लिए, `--secret-input-mode ref` plaintext API key values के बजाय auth profiles में env-backed refs स्टोर करता है।
   non-interactive `ref` मोड में, provider env var सेट होना चाहिए; उस env var के बिना inline key flags पास करने पर तुरंत विफलता होती है।
   interactive रन में, secret reference mode चुनने से आप environment variable या configured provider ref (`file` या `exec`) की ओर संकेत कर सकते हैं, सेव करने से पहले तेज़ preflight validation के साथ।
   Anthropic के लिए, interactive onboarding/configure पसंदीदा local path के रूप में **Anthropic Claude CLI** और अनुशंसित production path के रूप में **Anthropic API key** प्रदान करता है। Anthropic setup-token भी समर्थित token-auth path के रूप में उपलब्ध रहता है।
2. **वर्कस्पेस** — एजेंट फ़ाइलों का स्थान (डिफ़ॉल्ट `~/.openclaw/workspace`)। bootstrap फ़ाइलें seed करता है।
3. **Gateway** — पोर्ट, bind address, auth mode, Tailscale exposure।
   interactive token मोड में, डिफ़ॉल्ट plaintext token storage चुनें या SecretRef में opt in करें।
   Non-interactive token SecretRef path: `--gateway-token-ref-env <ENV_VAR>`.
4. **चैनल** — built-in और official Plugin चैट चैनल जैसे iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, और अधिक।
5. **Daemon** — LaunchAgent (macOS), systemd user unit (Linux/WSL2), या per-user Startup-folder fallback के साथ native Windows Scheduled Task इंस्टॉल करता है।
   यदि token auth को token की आवश्यकता है और `gateway.auth.token` SecretRef-managed है, तो daemon install इसे validate करता है लेकिन resolved token को supervisor service environment metadata में persist नहीं करता।
   यदि token auth को token की आवश्यकता है और configured token SecretRef unresolved है, तो daemon install actionable guidance के साथ block होता है।
   यदि `gateway.auth.token` और `gateway.auth.password` दोनों configured हैं और `gateway.auth.mode` unset है, तो daemon install तब तक block होता है जब तक mode स्पष्ट रूप से set न हो।
6. **Health check** — Gateway शुरू करता है और सत्यापित करता है कि यह चल रहा है।
7. **Skills** — अनुशंसित Skills और वैकल्पिक dependencies इंस्टॉल करता है।

<Note>
ऑनबोर्डिंग दोबारा चलाने से कुछ भी wipe **नहीं** होता, जब तक आप स्पष्ट रूप से **Reset** न चुनें (या `--reset` पास न करें)।
CLI `--reset` का डिफ़ॉल्ट config, credentials, और sessions है; workspace शामिल करने के लिए `--reset-scope full` का उपयोग करें।
यदि config invalid है या legacy keys शामिल हैं, तो ऑनबोर्डिंग पहले आपसे `openclaw doctor` चलाने को कहती है।
</Note>

**Remote मोड** केवल local client को कहीं और मौजूद Gateway से कनेक्ट करने के लिए कॉन्फ़िगर करता है।
यह remote host पर कुछ भी install या change **नहीं** करता।

## दूसरा एजेंट जोड़ें

अपने स्वयं के वर्कस्पेस,
sessions, और auth profiles के साथ एक अलग एजेंट बनाने के लिए `openclaw agents add <name>` का उपयोग करें। `--workspace` के बिना चलाने पर ऑनबोर्डिंग शुरू होती है।

यह क्या सेट करता है:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

नोट्स:

- डिफ़ॉल्ट वर्कस्पेस `~/.openclaw/workspace-<agentId>` का अनुसरण करते हैं।
- inbound messages route करने के लिए `bindings` जोड़ें (ऑनबोर्डिंग यह कर सकती है)।
- Non-interactive flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## पूर्ण संदर्भ

विस्तृत step-by-step breakdowns और config outputs के लिए, देखें
[CLI Setup Reference](/hi/start/wizard-cli-reference).
non-interactive उदाहरणों के लिए, देखें [CLI Automation](/hi/start/wizard-cli-automation).
गहरे तकनीकी संदर्भ के लिए, जिसमें RPC details शामिल हैं, देखें
[Onboarding Reference](/hi/reference/wizard).

## संबंधित docs

- CLI command reference: [`openclaw onboard`](/hi/cli/onboard)
- Onboarding overview: [Onboarding Overview](/hi/start/onboarding-overview)
- macOS app onboarding: [Onboarding](/hi/start/onboarding)
- Agent first-run ritual: [Agent Bootstrapping](/hi/start/bootstrapping)
