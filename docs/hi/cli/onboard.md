---
read_when:
    - आप Gateway, वर्कस्पेस, प्रमाणीकरण, चैनलों, और Skills के लिए निर्देशित सेटअप चाहते हैं
summary: '`openclaw onboard` के लिए CLI संदर्भ (इंटरैक्टिव ऑनबोर्डिंग)'
title: ऑनबोर्ड करें
x-i18n:
    generated_at: "2026-07-01T13:02:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

स्थानीय या दूरस्थ Gateway सेटअप के लिए पूर्ण मार्गदर्शित ऑनबोर्डिंग। इसका उपयोग तब करें जब आप चाहते हैं कि OpenClaw एक ही प्रवाह में मॉडल प्रमाणीकरण, वर्कस्पेस, Gateway, चैनल, Skills, और स्वास्थ्य जांच से गुजारे।

## संबंधित गाइड

<CardGroup cols={2}>
  <Card title="CLI ऑनबोर्डिंग हब" href="/hi/start/wizard" icon="rocket">
    इंटरैक्टिव CLI प्रवाह का चरण-दर-चरण विवरण।
  </Card>
  <Card title="ऑनबोर्डिंग अवलोकन" href="/hi/start/onboarding-overview" icon="map">
    OpenClaw ऑनबोर्डिंग कैसे एक साथ काम करती है।
  </Card>
  <Card title="CLI सेटअप संदर्भ" href="/hi/start/wizard-cli-reference" icon="book">
    आउटपुट, आंतरिक विवरण, और प्रति-चरण व्यवहार।
  </Card>
  <Card title="CLI स्वचालन" href="/hi/start/wizard-cli-automation" icon="terminal">
    नॉन-इंटरैक्टिव फ्लैग और स्क्रिप्टेड सेटअप।
  </Card>
  <Card title="macOS ऐप ऑनबोर्डिंग" href="/hi/start/onboarding" icon="apple">
    macOS मेनू बार ऐप के लिए ऑनबोर्डिंग प्रवाह।
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

`--flow import` Hermes जैसे Plugin-स्वामित्व वाले माइग्रेशन प्रदाताओं का उपयोग करता है। यह केवल नए OpenClaw सेटअप पर चलता है; यदि मौजूदा कॉन्फिग, क्रेडेंशियल, सत्र, या वर्कस्पेस मेमोरी/पहचान फ़ाइलें मौजूद हैं, तो इंपोर्ट करने से पहले रीसेट करें या नया सेटअप चुनें।

`--modern` Crestodian संवादात्मक ऑनबोर्डिंग प्रीव्यू शुरू करता है। `--modern` के बिना, `openclaw onboard` क्लासिक ऑनबोर्डिंग प्रवाह बनाए रखता है।

नए इंस्टॉल पर, जहां सक्रिय कॉन्फिग फ़ाइल गायब है या उसमें कोई लिखी गई सेटिंग नहीं है (खाली या केवल मेटाडेटा), अकेला `openclaw` भी क्लासिक ऑनबोर्डिंग प्रवाह शुरू करता है। एक बार कॉन्फिग फ़ाइल में लिखी गई सेटिंग्स आ जाएं, तो अकेला `openclaw` इसके बजाय Crestodian खोलता है।

Plaintext `ws://` को loopback, निजी IP literals, `.local`, और Tailnet `*.ts.net` Gateway URL के लिए स्वीकार किया जाता है। अन्य विश्वसनीय निजी-DNS नामों के लिए, ऑनबोर्डिंग प्रक्रिया परिवेश में `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` सेट करें।

## लोकेल

इंटरैक्टिव ऑनबोर्डिंग स्थिर सेटअप कॉपी के लिए CLI विज़ार्ड लोकेल का उपयोग करती है। समाधान क्रम है:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. अंग्रेज़ी फ़ॉलबैक

समर्थित विज़ार्ड लोकेल `en`, `zh-CN`, और `zh-TW` हैं। लोकेल मान `zh_CN.UTF-8` जैसे अंडरस्कोर या POSIX suffix forms का उपयोग कर सकते हैं। उत्पाद नाम, कमांड नाम, कॉन्फिग कुंजियां, URL, प्रदाता ID, मॉडल ID, और Plugin/चैनल लेबल literal रहते हैं।

उदाहरण:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

नॉन-इंटरैक्टिव कस्टम प्रदाता:

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

`--custom-api-key` नॉन-इंटरैक्टिव मोड में वैकल्पिक है। यदि छोड़ा गया, तो ऑनबोर्डिंग `CUSTOM_API_KEY` जांचती है।
OpenClaw सामान्य vision मॉडल ID को अपने-आप image-capable के रूप में चिह्नित करता है। अज्ञात कस्टम vision ID के लिए `--custom-image-input` पास करें, या केवल-पाठ मेटाडेटा बाध्य करने के लिए `--custom-text-input`।
OpenAI-संगत endpoints के लिए `--custom-compatibility openai-responses` उपयोग करें जो `/v1/responses` का समर्थन करते हैं लेकिन `/v1/chat/completions` का नहीं।

LM Studio नॉन-इंटरैक्टिव मोड में प्रदाता-विशिष्ट key flag का भी समर्थन करता है:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

नॉन-इंटरैक्टिव Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` डिफ़ॉल्ट रूप से `http://127.0.0.1:11434` होता है। `--custom-model-id` वैकल्पिक है; यदि छोड़ा गया, तो ऑनबोर्डिंग Ollama के सुझाए गए डिफ़ॉल्ट उपयोग करती है। `kimi-k2.5:cloud` जैसे क्लाउड मॉडल ID भी यहां काम करते हैं।

प्रदाता कुंजियों को plaintext के बजाय refs के रूप में संग्रहित करें:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` के साथ, ऑनबोर्डिंग plaintext key values के बजाय env-backed refs लिखती है।
auth-profile backed providers के लिए यह `keyRef` entries लिखती है; custom providers के लिए यह `models.providers.<id>.apiKey` को env ref के रूप में लिखती है (उदाहरण के लिए `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)।

नॉन-इंटरैक्टिव `ref` मोड अनुबंध:

- ऑनबोर्डिंग प्रक्रिया परिवेश में प्रदाता env var सेट करें (उदाहरण के लिए `OPENAI_API_KEY`)।
- inline key flags पास न करें (उदाहरण के लिए `--openai-api-key`) जब तक कि वह env var भी सेट न हो।
- यदि आवश्यक env var के बिना inline key flag पास किया जाता है, तो ऑनबोर्डिंग मार्गदर्शन के साथ तुरंत विफल होती है।

नॉन-इंटरैक्टिव मोड में Gateway token विकल्प:

- `--gateway-auth token --gateway-token <token>` plaintext token संग्रहित करता है।
- `--gateway-auth token --gateway-token-ref-env <name>` `gateway.auth.token` को env SecretRef के रूप में संग्रहित करता है।
- `--gateway-token` और `--gateway-token-ref-env` परस्पर अनन्य हैं।
- `--gateway-token-ref-env` को ऑनबोर्डिंग प्रक्रिया परिवेश में गैर-खाली env var चाहिए।
- `--install-daemon` के साथ, जब token auth के लिए token चाहिए, SecretRef-managed gateway tokens validate किए जाते हैं लेकिन supervisor service environment metadata में resolved plaintext के रूप में persist नहीं किए जाते।
- `--install-daemon` के साथ, यदि token mode के लिए token चाहिए और कॉन्फिगर किया गया token SecretRef unresolved है, तो ऑनबोर्डिंग remediation guidance के साथ fail closed होती है।
- `--install-daemon` के साथ, यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फिगर हैं और `gateway.auth.mode` unset है, तो ऑनबोर्डिंग install को तब तक रोकती है जब तक mode स्पष्ट रूप से सेट न हो।
- स्थानीय ऑनबोर्डिंग कॉन्फिग में `gateway.mode="local"` लिखती है। यदि बाद की कॉन्फिग फ़ाइल में `gateway.mode` गायब है, तो उसे वैध local-mode shortcut के रूप में नहीं, बल्कि config damage या अधूरा manual edit मानें।
- स्थानीय ऑनबोर्डिंग चुने गए setup path के लिए आवश्यक चयनित downloadable plugins इंस्टॉल करती है।
- दूरस्थ ऑनबोर्डिंग केवल दूरस्थ Gateway के लिए connection info लिखती है और स्थानीय plugin packages इंस्टॉल नहीं करती।
- `--allow-unconfigured` एक अलग gateway runtime escape hatch है। इसका मतलब यह नहीं है कि ऑनबोर्डिंग `gateway.mode` छोड़ सकती है।

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

नॉन-इंटरैक्टिव स्थानीय gateway health:

- जब तक आप `--skip-health` पास नहीं करते, ऑनबोर्डिंग सफलतापूर्वक बाहर निकलने से पहले reachable local gateway की प्रतीक्षा करती है।
- `--install-daemon` पहले managed gateway install path शुरू करता है। इसके बिना, आपके पास पहले से local gateway चल रहा होना चाहिए, उदाहरण के लिए `openclaw gateway run`।
- यदि आप automation में केवल config/workspace/bootstrap writes चाहते हैं, तो `--skip-health` उपयोग करें।
- यदि आप workspace files स्वयं manage करते हैं, तो `agents.defaults.skipBootstrap: true` सेट करने और `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, और `BOOTSTRAP.md` बनाने से बचने के लिए `--skip-bootstrap` पास करें।
- native Windows पर, `--install-daemon` पहले Scheduled Tasks आज़माता है और task creation denied होने पर per-user Startup-folder login item पर fallback करता है।

reference mode के साथ interactive onboarding behavior:

- prompted होने पर **Use secret reference** चुनें।
- फिर इनमें से कोई एक चुनें:
  - Environment variable
  - Configured secret provider (`file` या `exec`)
- ऑनबोर्डिंग ref save करने से पहले fast preflight validation करती है।
  - यदि validation fails, ऑनबोर्डिंग error दिखाती है और आपको retry करने देती है।

### नॉन-इंटरैक्टिव Z.AI endpoint choices

<Note>
`--auth-choice zai-api-key` आपकी key के लिए best Z.AI endpoint और model auto-detect करता है। Coding Plan endpoints `zai/glm-5.2` को प्राथमिकता देते हैं; general API endpoints `zai/glm-5.1` का उपयोग करते हैं। Coding Plan endpoint बाध्य करने के लिए, `zai-coding-global` या `zai-coding-cn` चुनें।
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

नॉन-इंटरैक्टिव Mistral उदाहरण:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## अतिरिक्त नॉन-इंटरैक्टिव फ्लैग

Token-आधारित model auth (नॉन-इंटरैक्टिव; `--auth-choice token` के साथ उपयोग किया जाता है):

- `--token-provider <id>` — Token provider id। पहचानता है कि कौन सा provider token जारी करता है।
- `--token <token>` — मॉडल प्रमाणीकरण के लिए Token value।
- `--token-profile-id <id>` — Auth profile id। Generic token storage डिफ़ॉल्ट रूप से `<provider>:manual` होता है; provider-owned setup flows अपने default का उपयोग कर सकते हैं, जैसे `anthropic:default`।
- `--token-expires-in <duration>` — वैकल्पिक token expiry duration (जैसे `365d`, `12h`)।

Cloudflare AI Gateway (नॉन-इंटरैक्टिव):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare AI Gateway के माध्यम से routing के लिए Cloudflare Account ID।
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID।

Daemon install control:

- `--no-install-daemon` — Gateway service installation को स्पष्ट रूप से छोड़ें।
- `--skip-daemon` — `--no-install-daemon` का alias।

UI और hook setup control:

- `--skip-ui` — ऑनबोर्डिंग के दौरान Control UI / TUI prompts छोड़ें।
- `--skip-hooks` — ऑनबोर्डिंग के दौरान webhook / hook setup prompts छोड़ें।

Output suppression:

- `--suppress-gateway-token-output` — token-bearing Gateway/UI output को suppress करें (token hints, embedded token वाला auto-login URL, और automatic Control UI launch)। shared terminal और CI environments में उपयोगी।

## प्रवाह नोट्स

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: न्यूनतम prompts, gateway token auto-generate करता है।
    - `manual`: port, bind, और auth के लिए full prompts (`advanced` का alias)।
    - `import`: detected migration provider चलाता है, plan preview करता है, फिर confirmation के बाद apply करता है।

  </Accordion>
  <Accordion title="Provider prefiltering">
    जब कोई auth choice preferred provider imply करता है, onboarding default-model और allowlist pickers को उस provider तक prefilter करता है। Volcengine और BytePlus के लिए, यह coding-plan variants (`volcengine-plan/*`, `byteplus-plan/*`) से भी match करता है।

    यदि preferred-provider filter से अभी कोई loaded models नहीं मिलते, onboarding picker empty छोड़ने के बजाय unfiltered catalog पर fallback करता है।

  </Accordion>
  <Accordion title="Web-search follow-ups">
    कुछ web-search providers provider-specific follow-up prompts trigger करते हैं:

    - **Grok** उसी xAI OAuth profile या API key और `x_search` model choice के साथ optional `x_search` setup offer कर सकता है।
    - **Kimi** Moonshot API region (`api.moonshot.ai` बनाम `api.moonshot.cn`) और default Kimi web-search model पूछ सकता है।

  </Accordion>
  <Accordion title="Other behaviors">
    - स्थानीय ऑनबोर्डिंग DM scope behavior: [CLI setup reference](/hi/start/wizard-cli-reference#outputs-and-internals)।
    - सबसे तेज़ first chat: `openclaw dashboard` (Control UI, कोई channel setup नहीं)।
    - Custom provider: listed नहीं किए गए hosted providers सहित किसी भी OpenAI या Anthropic compatible endpoint को connect करें। auto-detect करने के लिए Unknown उपयोग करें।
    - यदि Hermes state detected है, onboarding migration flow offer करता है। dry-run plans, overwrite mode, reports, और exact mappings के लिए [Migrate](/hi/cli/migrate) उपयोग करें।

  </Accordion>
</AccordionGroup>

## सामान्य follow-up commands

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

`openclaw setup` को उसी guided onboarding entry point के रूप में उपयोग करें। जब आपको केवल baseline config/workspace चाहिए तो `openclaw setup --baseline` उपयोग करें, targeted changes के लिए बाद में `openclaw configure`, और केवल channel setup के लिए `openclaw channels add` उपयोग करें।

<Note>
`--json` गैर-इंटरैक्टिव मोड का संकेत नहीं देता। स्क्रिप्ट्स के लिए `--non-interactive` का उपयोग करें।
</Note>
