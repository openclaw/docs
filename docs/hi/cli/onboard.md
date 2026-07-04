---
read_when:
    - आप gateway, workspace, auth, channels, और skills के लिए मार्गदर्शित सेटअप चाहते हैं
summary: '`openclaw onboard` के लिए CLI संदर्भ (इंटरैक्टिव ऑनबोर्डिंग)'
title: ऑनबोर्ड
x-i18n:
    generated_at: "2026-07-04T20:33:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

स्थानीय या रिमोट Gateway सेटअप के लिए पूरा निर्देशित ऑनबोर्डिंग। इसका उपयोग तब करें जब आप चाहते हों कि OpenClaw एक ही फ़्लो में मॉडल auth, workspace, gateway, channels, skills, और health से होकर गुज़रे।

## संबंधित गाइड

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/hi/start/wizard" icon="rocket">
    इंटरैक्टिव CLI फ़्लो का वॉकथ्रू।
  </Card>
  <Card title="Onboarding overview" href="/hi/start/onboarding-overview" icon="map">
    OpenClaw ऑनबोर्डिंग कैसे साथ मिलकर काम करता है।
  </Card>
  <Card title="CLI setup reference" href="/hi/start/wizard-cli-reference" icon="book">
    आउटपुट, आंतरिक विवरण, और प्रति-चरण व्यवहार।
  </Card>
  <Card title="CLI automation" href="/hi/start/wizard-cli-automation" icon="terminal">
    नॉन-इंटरैक्टिव flags और scripted setups।
  </Card>
  <Card title="macOS app onboarding" href="/hi/start/onboarding" icon="apple">
    macOS मेनू बार ऐप के लिए ऑनबोर्डिंग फ़्लो।
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

`--flow import` Hermes जैसे Plugin-स्वामित्व वाले migration providers का उपयोग करता है। यह केवल नए OpenClaw setup पर चलता है; यदि मौजूदा config, credentials, sessions, या workspace memory/identity files मौजूद हैं, तो import करने से पहले reset करें या नया setup चुनें।

`--modern` Crestodian conversational onboarding preview शुरू करता है। `--modern` के बिना, `openclaw onboard` classic onboarding flow बनाए रखता है।

इंटरैक्टिव terminal में, bare `openclaw` (कोई subcommand नहीं) config state के आधार पर route करता है:

- यदि active config file गुम है या उसमें authored settings नहीं हैं (empty या metadata-only), तो यह classic onboarding flow शुरू करता है।
- यदि config file मौजूद है लेकिन validation में fail होती है, तो यह repair के लिए [Crestodian](/hi/cli/crestodian) शुरू करता है।
- यदि config file valid है, तो यह सामान्य agent TUI खोलता है, या तो locally या reachable configured Gateway से connected। configured install पर, TUI के भीतर `/crestodian` या `openclaw crestodian` से Crestodian तक पहुँचें।

Plaintext `ws://` loopback, private IP literals, `.local`, और Tailnet `*.ts.net` gateway URLs के लिए स्वीकार किया जाता है। अन्य trusted private-DNS names के लिए, onboarding process environment में `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` set करें।

## Locale

Interactive onboarding fixed setup copy के लिए CLI wizard locale का उपयोग करता है। Resolve order है:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. English fallback

Supported wizard locales `en`, `zh-CN`, और `zh-TW` हैं। Locale values underscore या POSIX suffix forms जैसे `zh_CN.UTF-8` का उपयोग कर सकती हैं। Product names, command names, config keys, URLs, provider IDs, model IDs, और plugin/channel labels literal रहते हैं।

Example:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Non-interactive custom provider:

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

`--custom-api-key` non-interactive mode में वैकल्पिक है। यदि omitted है, onboarding `CUSTOM_API_KEY` जाँचता है।
OpenClaw common vision model IDs को image-capable के रूप में automatic mark करता है। Unknown custom vision IDs के लिए `--custom-image-input` pass करें, या text-only metadata force करने के लिए `--custom-text-input`।
OpenAI-compatible endpoints जो `/v1/responses` support करते हैं लेकिन `/v1/chat/completions` नहीं, उनके लिए `--custom-compatibility openai-responses` उपयोग करें।

LM Studio non-interactive mode में provider-specific key flag भी support करता है:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Non-interactive Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` default रूप से `http://127.0.0.1:11434` होता है। `--custom-model-id` वैकल्पिक है; यदि omitted है, onboarding Ollama के suggested defaults का उपयोग करता है। `kimi-k2.5:cloud` जैसे Cloud model IDs भी यहाँ काम करते हैं।

Provider keys को plaintext के बजाय refs के रूप में store करें:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` के साथ, onboarding plaintext key values के बजाय env-backed refs लिखता है।
auth-profile backed providers के लिए यह `keyRef` entries लिखता है; custom providers के लिए यह `models.providers.<id>.apiKey` को env ref के रूप में लिखता है (उदाहरण के लिए `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)।

Non-interactive `ref` mode contract:

- Onboarding process environment में provider env var set करें (उदाहरण के लिए `OPENAI_API_KEY`)।
- Inline key flags pass न करें (उदाहरण के लिए `--openai-api-key`) जब तक वह env var भी set न हो।
- यदि required env var के बिना inline key flag pass किया जाता है, तो onboarding guidance के साथ fast fail होता है।

Non-interactive mode में Gateway token options:

- `--gateway-auth token --gateway-token <token>` plaintext token store करता है।
- `--gateway-auth token --gateway-token-ref-env <name>` `gateway.auth.token` को env SecretRef के रूप में store करता है।
- `--gateway-token` और `--gateway-token-ref-env` mutually exclusive हैं।
- `--gateway-token-ref-env` को onboarding process environment में non-empty env var चाहिए।
- `--install-daemon` के साथ, जब token auth को token चाहिए, SecretRef-managed gateway tokens validate किए जाते हैं लेकिन supervisor service environment metadata में resolved plaintext के रूप में persist नहीं किए जाते।
- `--install-daemon` के साथ, यदि token mode को token चाहिए और configured token SecretRef unresolved है, तो onboarding remediation guidance के साथ fail closed होता है।
- `--install-daemon` के साथ, यदि `gateway.auth.token` और `gateway.auth.password` दोनों configured हैं और `gateway.auth.mode` unset है, तो onboarding install को तब तक block करता है जब तक mode explicitly set न हो।
- Local onboarding config में `gateway.mode="local"` लिखता है। यदि बाद की config file में `gateway.mode` गुम है, तो इसे config damage या अधूरा manual edit मानें, valid local-mode shortcut नहीं।
- Local onboarding selected downloadable plugins install करता है जब chosen setup path को उनकी आवश्यकता होती है।
- Remote onboarding केवल remote Gateway के लिए connection info लिखता है और local plugin packages install नहीं करता।
- `--allow-unconfigured` एक अलग gateway runtime escape hatch है। इसका मतलब यह नहीं है कि onboarding `gateway.mode` omit कर सकता है।

Example:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Non-interactive local gateway health:

- जब तक आप `--skip-health` pass नहीं करते, onboarding successful exit से पहले reachable local gateway की प्रतीक्षा करता है।
- `--install-daemon` पहले managed gateway install path शुरू करता है। इसके बिना, आपके पास पहले से local gateway चल रहा होना चाहिए, उदाहरण के लिए `openclaw gateway run`।
- यदि automation में आपको केवल config/workspace/bootstrap writes चाहिए, तो `--skip-health` उपयोग करें।
- यदि आप workspace files खुद manage करते हैं, तो `agents.defaults.skipBootstrap: true` set करने और `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, और `BOOTSTRAP.md` बनाना skip करने के लिए `--skip-bootstrap` pass करें।
- Native Windows पर, `--install-daemon` पहले Scheduled Tasks try करता है और task creation denied होने पर per-user Startup-folder login item पर fallback करता है।

Reference mode के साथ interactive onboarding behavior:

- Prompt होने पर **Use secret reference** चुनें।
- फिर इनमें से एक चुनें:
  - Environment variable
  - Configured secret provider (`file` या `exec`)
- Onboarding ref save करने से पहले fast preflight validation करता है।
  - यदि validation fail होता है, onboarding error दिखाता है और retry करने देता है।

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

Non-interactive Mistral example:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## अतिरिक्त non-interactive flags

Token-based model auth (non-interactive; `--auth-choice token` के साथ उपयोग):

- `--token-provider <id>` — Token provider id। पहचानता है कि कौन सा provider token issue करता है।
- `--token <token>` — Model authentication के लिए token value।
- `--token-profile-id <id>` — Auth profile id। Generic token storage default रूप से `<provider>:manual` होता है; provider-owned setup flows अपने default का उपयोग कर सकते हैं, जैसे `anthropic:default`।
- `--token-expires-in <duration>` — वैकल्पिक token expiry duration (जैसे `365d`, `12h`)।

Cloudflare AI Gateway (non-interactive):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare AI Gateway के माध्यम से routing के लिए Cloudflare Account ID।
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID।

Daemon install control:

- `--no-install-daemon` — Gateway service installation explicit रूप से skip करें।
- `--skip-daemon` — `--no-install-daemon` का alias।

UI और hook setup control:

- `--skip-ui` — Onboarding के दौरान Control UI / TUI prompts skip करें।
- `--skip-hooks` — Onboarding के दौरान Webhook / hook setup prompts skip करें।

Output suppression:

- `--suppress-gateway-token-output` — Token-bearing Gateway/UI output suppress करें (token hints, embedded token वाला auto-login URL, और automatic Control UI launch)। Shared terminal और CI environments में उपयोगी।

## Flow notes

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: minimal prompts, gateway token auto-generates करता है।
    - `manual`: port, bind, और auth के लिए full prompts (`advanced` का alias)।
    - `import`: detected migration provider चलाता है, plan preview करता है, फिर confirmation के बाद apply करता है।

  </Accordion>
  <Accordion title="Provider prefiltering">
    जब auth choice preferred provider imply करता है, onboarding default-model और allowlist pickers को उस provider तक prefilter करता है। Volcengine और BytePlus के लिए, यह coding-plan variants (`volcengine-plan/*`, `byteplus-plan/*`) से भी match करता है।

    यदि preferred-provider filter से अभी तक कोई loaded models नहीं मिलते, onboarding picker को खाली छोड़ने के बजाय unfiltered catalog पर fallback करता है।

  </Accordion>
  <Accordion title="Web-search follow-ups">
    कुछ web-search providers provider-specific follow-up prompts trigger करते हैं:

    - **Grok** same xAI OAuth profile या API key और `x_search` model choice के साथ optional `x_search` setup offer कर सकता है।
    - **Kimi** Moonshot API region (`api.moonshot.ai` बनाम `api.moonshot.cn`) और default Kimi web-search model के लिए पूछ सकता है।

  </Accordion>
  <Accordion title="Other behaviors">
    - Local onboarding DM scope behavior: [CLI setup reference](/hi/start/wizard-cli-reference#outputs-and-internals)।
    - Fastest first chat: `openclaw dashboard` (Control UI, कोई channel setup नहीं)।
    - Custom provider: listed नहीं किए गए hosted providers सहित किसी भी OpenAI या Anthropic compatible endpoint से connect करें। Auto-detect के लिए Unknown उपयोग करें।
    - यदि Hermes state detect होती है, onboarding migration flow offer करता है। dry-run plans, overwrite mode, reports, और exact mappings के लिए [Migrate](/hi/cli/migrate) उपयोग करें।

  </Accordion>
</AccordionGroup>

## सामान्य follow-up commands

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

उसी निर्देशित ऑनबोर्डिंग प्रवेश बिंदु के रूप में `openclaw setup` का उपयोग करें। जब आपको केवल आधारभूत कॉन्फ़िगरेशन/वर्कस्पेस चाहिए, तो `openclaw setup --baseline` का उपयोग करें, लक्षित बदलावों के लिए बाद में `openclaw configure`, और केवल-चैनल सेटअप के लिए `openclaw channels add` का उपयोग करें।

<Note>
`--json` का अर्थ गैर-इंटरैक्टिव मोड नहीं है। स्क्रिप्ट के लिए `--non-interactive` का उपयोग करें।
</Note>
