---
read_when:
    - आप Gateway, कार्यक्षेत्र, प्रमाणीकरण, चैनल और Skills के लिए मार्गदर्शित सेटअप चाहते हैं
summary: '`openclaw onboard` के लिए CLI संदर्भ (इंटरैक्टिव ऑनबोर्डिंग)'
title: ऑनबोर्ड
x-i18n:
    generated_at: "2026-06-30T22:15:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

स्थानीय या दूरस्थ Gateway सेटअप के लिए पूर्ण निर्देशित ऑनबोर्डिंग। इसका उपयोग तब करें जब आप चाहते हैं कि OpenClaw एक ही प्रवाह में मॉडल प्रमाणीकरण, workspace, gateway, channels, skills, और health से होकर चलाए।

## संबंधित मार्गदर्शिकाएँ

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/hi/start/wizard" icon="rocket">
    इंटरैक्टिव CLI प्रवाह का वॉकथ्रू।
  </Card>
  <Card title="Onboarding overview" href="/hi/start/onboarding-overview" icon="map">
    OpenClaw ऑनबोर्डिंग कैसे एक साथ काम करती है।
  </Card>
  <Card title="CLI setup reference" href="/hi/start/wizard-cli-reference" icon="book">
    आउटपुट, आंतरिक विवरण, और प्रत्येक चरण का व्यवहार।
  </Card>
  <Card title="CLI automation" href="/hi/start/wizard-cli-automation" icon="terminal">
    गैर-इंटरैक्टिव flags और scripted setups।
  </Card>
  <Card title="macOS app onboarding" href="/hi/start/onboarding" icon="apple">
    macOS menu bar app के लिए ऑनबोर्डिंग प्रवाह।
  </Card>
</CardGroup>

## उदाहरण

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` Hermes जैसे plugin-स्वामित्व वाले migration providers का उपयोग करता है। यह केवल नए OpenClaw सेटअप पर चलता है; यदि मौजूदा config, credentials, sessions, या workspace memory/identity files मौजूद हैं, तो import करने से पहले reset करें या नया setup चुनें।

`--modern` Crestodian conversational onboarding preview शुरू करता है। `--modern` के बिना, `openclaw onboard` classic onboarding flow बनाए रखता है।

किसी नए install पर जहाँ active config file अनुपस्थित है या उसमें authored settings नहीं हैं (खाली या metadata-only), bare `openclaw` भी classic onboarding flow शुरू करता है। एक बार config file में authored settings हो जाएँ, bare `openclaw` इसके बजाय Crestodian खोलता है।

Plaintext `ws://` loopback, private IP literals, `.local`, और Tailnet `*.ts.net` gateway URLs के लिए स्वीकार किया जाता है। अन्य trusted private-DNS names के लिए, onboarding process environment में `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` सेट करें।

## Locale

Interactive onboarding fixed setup copy के लिए CLI wizard locale का उपयोग करता है। Resolve क्रम है:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. English fallback

समर्थित wizard locales `en`, `zh-CN`, और `zh-TW` हैं। Locale values underscore या POSIX suffix forms जैसे `zh_CN.UTF-8` का उपयोग कर सकती हैं। Product names, command names, config keys, URLs, provider IDs, model IDs, और plugin/channel labels literal रहते हैं।

उदाहरण:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

गैर-इंटरैक्टिव custom provider:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` non-interactive mode में वैकल्पिक है। यदि छोड़ा गया हो, तो onboarding `CUSTOM_API_KEY` जाँचता है।
OpenClaw सामान्य vision model IDs को अपने-आप image-capable के रूप में चिह्नित करता है। अज्ञात custom vision IDs के लिए `--custom-image-input` pass करें, या text-only metadata force करने के लिए `--custom-text-input`।
ऐसे OpenAI-compatible endpoints के लिए `--custom-compatibility openai-responses` उपयोग करें जो `/v1/responses` support करते हैं लेकिन `/v1/chat/completions` नहीं।

LM Studio non-interactive mode में provider-specific key flag भी support करता है:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

गैर-इंटरैक्टिव Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` default रूप से `http://127.0.0.1:11434` होता है। `--custom-model-id` वैकल्पिक है; यदि छोड़ा गया हो, तो onboarding Ollama के suggested defaults का उपयोग करता है। `kimi-k2.5:cloud` जैसे cloud model IDs भी यहाँ काम करते हैं।

Provider keys को plaintext के बजाय refs के रूप में store करें:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` के साथ, onboarding plaintext key values के बजाय env-backed refs लिखता है।
Auth-profile backed providers के लिए यह `keyRef` entries लिखता है; custom providers के लिए यह `models.providers.<id>.apiKey` को env ref के रूप में लिखता है (उदाहरण के लिए `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)।

Non-interactive `ref` mode contract:

- Onboarding process environment में provider env var सेट करें (उदाहरण के लिए `OPENAI_API_KEY`)।
- Inline key flags (उदाहरण के लिए `--openai-api-key`) pass न करें, जब तक कि वह env var भी सेट न हो।
- यदि required env var के बिना inline key flag pass किया जाता है, तो onboarding guidance के साथ तेजी से fail हो जाता है।

Non-interactive mode में Gateway token options:

- `--gateway-auth token --gateway-token <token>` plaintext token store करता है।
- `--gateway-auth token --gateway-token-ref-env <name>` `gateway.auth.token` को env SecretRef के रूप में store करता है।
- `--gateway-token` और `--gateway-token-ref-env` परस्पर exclusive हैं।
- `--gateway-token-ref-env` के लिए onboarding process environment में non-empty env var आवश्यक है।
- `--install-daemon` के साथ, जब token auth को token की आवश्यकता होती है, SecretRef-managed gateway tokens validate किए जाते हैं लेकिन supervisor service environment metadata में resolved plaintext के रूप में persist नहीं किए जाते।
- `--install-daemon` के साथ, यदि token mode को token की आवश्यकता है और configured token SecretRef unresolved है, तो onboarding remediation guidance के साथ fail closed होता है।
- `--install-daemon` के साथ, यदि `gateway.auth.token` और `gateway.auth.password` दोनों configured हैं और `gateway.auth.mode` unset है, तो onboarding install को तब तक block करता है जब तक mode explicitly set न हो।
- Local onboarding config में `gateway.mode="local"` लिखता है। यदि बाद की config file में `gateway.mode` अनुपस्थित है, तो उसे config damage या incomplete manual edit समझें, valid local-mode shortcut नहीं।
- Local onboarding selected downloadable plugins install करता है जब चुने गए setup path को उनकी आवश्यकता होती है।
- Remote onboarding केवल remote Gateway के लिए connection info लिखता है और local plugin packages install नहीं करता।
- `--allow-unconfigured` एक अलग gateway runtime escape hatch है। इसका मतलब यह नहीं है कि onboarding `gateway.mode` छोड़ सकता है।

उदाहरण:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

गैर-इंटरैक्टिव local gateway health:

- जब तक आप `--skip-health` pass नहीं करते, onboarding सफलतापूर्वक exit करने से पहले reachable local gateway की प्रतीक्षा करता है।
- `--install-daemon` managed gateway install path पहले शुरू करता है। इसके बिना, आपके पास पहले से local gateway running होना चाहिए, उदाहरण के लिए `openclaw gateway run`।
- यदि आप automation में केवल config/workspace/bootstrap writes चाहते हैं, तो `--skip-health` उपयोग करें।
- यदि आप workspace files स्वयं manage करते हैं, तो `agents.defaults.skipBootstrap: true` सेट करने और `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, और `BOOTSTRAP.md` बनाना skip करने के लिए `--skip-bootstrap` pass करें।
- Native Windows पर, `--install-daemon` पहले Scheduled Tasks आज़माता है और task creation denied होने पर per-user Startup-folder login item पर fallback करता है।

Reference mode के साथ interactive onboarding behavior:

- Prompt होने पर **Use secret reference** चुनें।
- फिर इनमें से कोई एक चुनें:
  - Environment variable
  - Configured secret provider (`file` या `exec`)
- Onboarding ref save करने से पहले fast preflight validation करता है।
  - यदि validation fail हो, तो onboarding error दिखाता है और आपको retry करने देता है।

### Non-interactive Z.AI endpoint choices

<Note>
`--auth-choice zai-api-key` आपकी key के लिए best Z.AI endpoint और model auto-detect करता है। Coding Plan endpoints `zai/glm-5.2` prefer करते हैं; general API endpoints `zai/glm-5.1` उपयोग करते हैं। Coding Plan endpoint force करने के लिए, `zai-coding-global` या `zai-coding-cn` चुनें।
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

गैर-इंटरैक्टिव Mistral example:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Flow notes

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: न्यूनतम prompts, gateway token auto-generates करता है।
    - `manual`: port, bind, और auth के लिए पूर्ण prompts (`advanced` का alias)।
    - `import`: detected migration provider चलाता है, plan preview करता है, फिर confirmation के बाद apply करता है।

  </Accordion>
  <Accordion title="Provider prefiltering">
    जब कोई auth choice preferred provider imply करती है, onboarding default-model और allowlist pickers को उस provider पर prefilter करता है। Volcengine और BytePlus के लिए, यह coding-plan variants (`volcengine-plan/*`, `byteplus-plan/*`) से भी match करता है।

    यदि preferred-provider filter से अभी कोई loaded models नहीं मिलते, तो onboarding picker को खाली छोड़ने के बजाय unfiltered catalog पर fallback करता है।

  </Accordion>
  <Accordion title="Web-search follow-ups">
    कुछ web-search providers provider-specific follow-up prompts trigger करते हैं:

    - **Grok** उसी xAI OAuth profile या API key और `x_search` model choice के साथ optional `x_search` setup offer कर सकता है।
    - **Kimi** Moonshot API region (`api.moonshot.ai` बनाम `api.moonshot.cn`) और default Kimi web-search model के लिए पूछ सकता है।

  </Accordion>
  <Accordion title="Other behaviors">
    - Local onboarding DM scope behavior: [CLI setup reference](/hi/start/wizard-cli-reference#outputs-and-internals)।
    - सबसे तेज़ first chat: `openclaw dashboard` (Control UI, कोई channel setup नहीं)।
    - Custom provider: सूचीबद्ध नहीं किए गए hosted providers सहित किसी भी OpenAI या Anthropic compatible endpoint से connect करें। Auto-detect के लिए Unknown उपयोग करें।
    - यदि Hermes state detected है, तो onboarding migration flow offer करता है। Dry-run plans, overwrite mode, reports, और exact mappings के लिए [Migrate](/hi/cli/migrate) उपयोग करें।

  </Accordion>
</AccordionGroup>

## सामान्य follow-up commands

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

उसी guided onboarding entry point के रूप में `openclaw setup` उपयोग करें। जब आपको केवल baseline config/workspace चाहिए हो, तो `openclaw setup --baseline` उपयोग करें, targeted changes के लिए बाद में `openclaw configure`, और channel-only setup के लिए `openclaw channels add`।

<Note>
`--json` non-interactive mode imply नहीं करता। Scripts के लिए `--non-interactive` उपयोग करें।
</Note>
