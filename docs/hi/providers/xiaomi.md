---
read_when:
    - आप OpenClaw में Xiaomi MiMo मॉडल चाहते हैं
    - आपको Xiaomi MiMo प्रमाणीकरण या Token Plan सेटअप की आवश्यकता है
summary: OpenClaw के साथ Xiaomi MiMo पे-ऐज़-यू-गो और Token Plan मॉडल का उपयोग करें
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-29T00:04:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo **MiMo** मॉडलों के लिए API प्लेटफ़ॉर्म है। OpenClaw में दो टेक्स्ट-प्रदाता प्रीसेट वाला बंडल किया गया Xiaomi Plugin शामिल है:

- पे-ऐज़-यू-गो कुंजियों (`sk-...`) के लिए `xiaomi`
- क्षेत्रीय endpoint प्रीसेट वाली Token Plan कुंजियों (`tp-...`) के लिए `xiaomi-token-plan`

यही Plugin `xiaomi` speech (TTS) प्रदाता भी पंजीकृत करता है।

| गुण              | मान                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| प्रदाता ids      | `xiaomi` (पे-ऐज़-यू-गो), `xiaomi-token-plan` (Token Plan)                                                                                          |
| Plugin           | बंडल किया गया, `enabledByDefault: true`                                                                                                            |
| Auth env vars    | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Onboarding flags | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| प्रत्यक्ष CLI flags | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| अनुबंध           | chat completions + `speechProviders`                                                                                                               |
| API              | OpenAI-संगत (`openai-completions`)                                                                                                                 |
| आधार URLs        | पे-ऐज़-यू-गो: `https://api.xiaomimimo.com/v1`; Token Plan प्रीसेट: `token-plan-{cn,sgp,ams}...`                                                    |
| डिफ़ॉल्ट मॉडल    | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS डिफ़ॉल्ट     | `mimo-v2.5-tts`, voice `mimo_default`; voicedesign मॉडल `mimo-v2.5-tts-voicedesign`                                                                |

## शुरू करना

<Steps>
  <Step title="Get the right key">
    [Xiaomi MiMo console](https://platform.xiaomimimo.com/#/console/api-keys) में पे-ऐज़-यू-गो कुंजी बनाएं, या अपना Token Plan सदस्यता पृष्ठ खोलें और क्षेत्रीय OpenAI-संगत आधार URL तथा मेल खाने वाली `tp-...` कुंजी कॉपी करें।
  </Step>

  <Step title="Run onboarding">
    पे-ऐज़-यू-गो:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    या कुंजियां सीधे पास करें:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## पे-ऐज़-यू-गो कैटलॉग

| मॉडल ref              | इनपुट      | Context   | अधिकतम आउटपुट | Reasoning | नोट्स          |
| ---------------------- | ----------- | --------- | -------------- | --------- | -------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192          | नहीं      | डिफ़ॉल्ट मॉडल |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000         | हां       | बड़ा context  |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000         | हां       | मल्टीमॉडल     |

<Tip>
डिफ़ॉल्ट मॉडल ref `xiaomi/mimo-v2-flash` है। `XIAOMI_API_KEY` सेट होने या auth profile मौजूद होने पर प्रदाता अपने आप inject हो जाता है।
</Tip>

## Token Plan कैटलॉग

Xiaomi के subscription UI में दिखाए गए क्षेत्रीय आधार URL से मेल खाने वाला Token Plan auth विकल्प चुनें:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| मॉडल ref                         | इनपुट      | Context   | अधिकतम आउटपुट | Reasoning | नोट्स          |
| --------------------------------- | ----------- | --------- | -------------- | --------- | -------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | text        | 1,048,576 | 131,072        | हां       | डिफ़ॉल्ट मॉडल |
| `xiaomi-token-plan/mimo-v2.5`     | text, image | 1,048,576 | 131,072        | हां       | मल्टीमॉडल     |

<Tip>
Token Plan onboarding कुंजी के आकार को सत्यापित करता है और चेतावनी देता है जब कोई `tp-...` कुंजी पे-ऐज़-यू-गो पथ में दर्ज की जाती है, या कोई `sk-...` कुंजी Token Plan पथ में दर्ज की जाती है।
</Tip>

## टेक्स्ट-से-स्पीच

बंडल किया गया `xiaomi` Plugin Xiaomi MiMo को `messages.tts` के लिए speech provider के रूप में भी पंजीकृत करता है। यह Xiaomi के chat-completions TTS अनुबंध को text को `assistant` संदेश के रूप में और वैकल्पिक style guidance को `user` संदेश के रूप में भेजकर कॉल करता है।

| गुण      | मान                                      |
| -------- | ---------------------------------------- |
| TTS id   | `xiaomi` (`mimo` alias)                  |
| Auth     | `XIAOMI_API_KEY`                         |
| API      | `audio` के साथ `POST /v1/chat/completions` |
| डिफ़ॉल्ट | `mimo-v2.5-tts`, voice `mimo_default`    |
| आउटपुट  | डिफ़ॉल्ट रूप से MP3; कॉन्फ़िगर होने पर WAV |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

समर्थित built-in voices में `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`, `Milo`, और `Dean` शामिल हैं। Preset-voice मॉडल `audio.voice` का उपयोग करते हैं, इसलिए OpenClaw `mimo-v2.5-tts` और `mimo-v2-tts` के लिए `speakerVoice` भेजता है।

Xiaomi का voicedesign मॉडल, `mimo-v2.5-tts-voicedesign`, preset voice id के बजाय natural-language style prompt से आवाज़ बनाता है। इच्छित आवाज़ के विवरण के साथ `style` कॉन्फ़िगर करें; OpenClaw इसे `user` संदेश के रूप में भेजता है, बोले जाने वाले text को `assistant` संदेश के रूप में भेजता है, और इस मॉडल के लिए `audio.voice` छोड़ देता है।

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Feishu और Telegram जैसे voice-note लक्ष्यों के लिए, OpenClaw delivery से पहले Xiaomi आउटपुट को `ffmpeg` के साथ 48kHz Opus में transcode करता है।

## Config उदाहरण

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

Pricing और compat flags बंडल किए गए Plugin manifest से आते हैं, इसलिए config उदाहरण runtime व्यवहार से अलगाव से बचने के लिए `cost` और `compat` छोड़ देता है।

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Pricing बंडल किए गए manifest से आती है (Token Plan मॉडल में tiered cache-read pricing शामिल है), इसलिए config उदाहरण `cost` छोड़ देता है।

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    आपके environment में `XIAOMI_API_KEY` सेट होने या auth profile मौजूद होने पर `xiaomi` प्रदाता अपने आप inject हो जाता है। `xiaomi-token-plan` को क्षेत्रीय आधार URL चाहिए, इसलिए समर्थित पथ बंडल किया गया Token Plan onboarding विकल्प या स्पष्ट `models.providers.xiaomi-token-plan` config block है।
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — हल्का और तेज़, सामान्य-उद्देश्य text कार्यों के लिए आदर्श। Reasoning support नहीं है।
    - **mimo-v2-pro** — लंबे-दस्तावेज़ workloads के लिए 1M token context window के साथ reasoning को support करता है।
    - **mimo-v2-omni** — reasoning-enabled मल्टीमॉडल मॉडल जो text और image दोनों inputs स्वीकार करता है।
    - **mimo-v2.5-pro** — Xiaomi के मौजूदा V2.5 reasoning stack के साथ Token Plan डिफ़ॉल्ट।
    - **mimo-v2.5** — Token Plan मल्टीमॉडल V2.5 route।

    <Note>
    पे-ऐज़-यू-गो मॉडल `xiaomi/` prefix का उपयोग करते हैं। Token Plan मॉडल `xiaomi-token-plan/` prefix का उपयोग करते हैं।
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - अगर मॉडल दिखाई नहीं देते, तो पुष्टि करें कि संबंधित key env var या auth profile मौजूद और मान्य है।
    - Token Plan के लिए, पुष्टि करें कि चुना गया onboarding region subscription page base URL से मेल खाता है और कुंजी `tp-` से शुरू होती है।
    - जब Gateway daemon के रूप में चलता है, तो सुनिश्चित करें कि कुंजी उस process के लिए उपलब्ध है (उदाहरण के लिए `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।

    <Warning>
    केवल आपके interactive shell में सेट की गई कुंजियां daemon-managed gateway processes को दिखाई नहीं देतीं। स्थायी उपलब्धता के लिए `~/.openclaw/.env` या `env.shellEnv` config का उपयोग करें।
    </Warning>

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, model refs, और failover व्यवहार चुनना।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/configuration-reference" icon="gear">
    पूर्ण OpenClaw configuration reference।
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo dashboard और API key management।
  </Card>
</CardGroup>
