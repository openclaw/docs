---
read_when:
    - आप OpenClaw में Xiaomi MiMo मॉडल चाहते हैं
    - आपको Xiaomi MiMo प्रमाणीकरण या Token Plan सेटअप की आवश्यकता है
summary: OpenClaw के साथ Xiaomi MiMo के उपयोग-के-अनुसार-भुगतान और Token Plan मॉडल का उपयोग करें
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-16T17:03:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo, **MiMo** मॉडल के लिए API प्लेटफ़ॉर्म है। बंडल किया गया `xiaomi`
Plugin (`enabledByDefault: true`, इंस्टॉल करने की कोई आवश्यकता नहीं) दो टेक्स्ट
प्रदाताओं के साथ एक स्पीच (TTS) प्रदाता पंजीकृत करता है:

- `xiaomi` - उपयोग के अनुसार भुगतान वाली कुंजियाँ (`sk-...`)
- `xiaomi-token-plan` - क्षेत्रीय एंडपॉइंट प्रीसेट वाली Token Plan कुंजियाँ (`tp-...`)

| गुण         | मान                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| प्रदाता आईडी     | `xiaomi` (उपयोग के अनुसार भुगतान), `xiaomi-token-plan` (Token Plan)                                                                                         |
| प्रमाणीकरण पर्यावरण चर    | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| प्रत्यक्ष CLI फ़्लैग | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API              | OpenAI-संगत चैट पूर्णताएँ (`openai-completions`)                                                                                          |
| स्पीच अनुबंध  | `speechProviders: ["xiaomi"]`                                                                                                                      |
| आधार URL        | उपयोग के अनुसार भुगतान: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                            |
| डिफ़ॉल्ट मॉडल   | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS डिफ़ॉल्ट      | `mimo-v2.5-tts`, वॉइस `mimo_default`; वॉइसडिज़ाइन मॉडल `mimo-v2.5-tts-voicedesign`                                                               |

## आरंभ करना

<Steps>
  <Step title="सही कुंजी प्राप्त करें">
    [Xiaomi MiMo कंसोल](https://platform.xiaomimimo.com/#/console/api-keys) में उपयोग के अनुसार भुगतान वाली कुंजी बनाएँ, या अपना Token Plan सदस्यता पृष्ठ खोलें और क्षेत्रीय OpenAI-संगत आधार URL के साथ उसकी संगत `tp-...` कुंजी कॉपी करें।
  </Step>

  <Step title="ऑनबोर्डिंग चलाएँ">
    उपयोग के अनुसार भुगतान:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    या कुंजियाँ सीधे प्रदान करें:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
ऑनबोर्डिंग कुंजी के प्रारूप को सत्यापित करती है और तब चेतावनी देती है जब उपयोग के अनुसार भुगतान वाले पथ में `tp-...` कुंजी या Token Plan पथ में `sk-...` कुंजी दर्ज की जाती है।
</Tip>

## उपयोग के अनुसार भुगतान वाला कैटलॉग

| मॉडल संदर्भ              | इनपुट       | कॉन्टेक्स्ट   | अधिकतम आउटपुट | तर्क | टिप्पणियाँ         |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | टेक्स्ट        | 262,144   | 8,192      | नहीं        | डिफ़ॉल्ट मॉडल |
| `xiaomi/mimo-v2-pro`   | टेक्स्ट        | 1,048,576 | 32,000     | हाँ       | बड़ा कॉन्टेक्स्ट |
| `xiaomi/mimo-v2-omni`  | टेक्स्ट, इमेज | 262,144   | 32,000     | हाँ       | मल्टीमॉडल    |

## Token Plan कैटलॉग

वह Token Plan प्रमाणीकरण विकल्प चुनें जो Xiaomi के सदस्यता UI में दिखाए गए क्षेत्रीय आधार URL से मेल खाता हो:

| प्रमाणीकरण विकल्प             | आधार URL                                   |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| मॉडल संदर्भ                         | इनपुट       | कॉन्टेक्स्ट   | अधिकतम आउटपुट | तर्क | टिप्पणियाँ         |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | टेक्स्ट        | 1,048,576 | 131,072    | हाँ       | डिफ़ॉल्ट मॉडल |
| `xiaomi-token-plan/mimo-v2.5`     | टेक्स्ट, इमेज | 1,048,576 | 131,072    | हाँ       | मल्टीमॉडल    |

`xiaomi-token-plan` को रिज़ॉल्व करने के लिए क्षेत्रीय आधार URL की आवश्यकता होती है। समर्थित पथ
बंडल किया गया Token Plan ऑनबोर्डिंग विकल्प या स्पष्ट
`models.providers.xiaomi-token-plan` कॉन्फ़िगरेशन ब्लॉक है जिसमें `baseUrl` सेट हो; इनमें
से किसी के बिना प्रदाता उपलब्ध नहीं कराया जाता।

## तर्क मॉडल

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5`, और `mimo-v2.5-pro`
OpenClaw के [`/think` निर्देश](/hi/tools/thinking) का समर्थन करते हैं, जिसके स्तर `off`,
`minimal`, `low`, `medium`, `high`, `xhigh`, और `max` (डिफ़ॉल्ट `high`) हैं।
`mimo-v2-flash` में तर्क का समर्थन नहीं है।

## टेक्स्ट-टू-स्पीच

बंडल किया गया `xiaomi` Plugin, `messages.tts` के लिए
Xiaomi MiMo को स्पीच प्रदाता के रूप में भी पंजीकृत करता है। यह टेक्स्ट को
`assistant` संदेश के रूप में और वैकल्पिक शैली मार्गदर्शन को `user`
संदेश के रूप में भेजकर Xiaomi के चैट-पूर्णता TTS अनुबंध को कॉल करता है।

| गुण | मान                                    |
| -------- | ---------------------------------------- |
| TTS आईडी   | `xiaomi` (`mimo` उपनाम)                  |
| प्रमाणीकरण     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` के साथ `audio` |
| डिफ़ॉल्ट  | `mimo-v2.5-tts`, वॉइस `mimo_default`    |
| आउटपुट   | डिफ़ॉल्ट रूप से MP3; कॉन्फ़िगर किए जाने पर WAV      |

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

अंतर्निहित वॉइस: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`। प्रीसेट-वॉइस मॉडल (`mimo-v2.5-tts`, `mimo-v2-tts`)
`audio.voice` का उपयोग करते हैं, इसलिए OpenClaw उन मॉडलों के लिए `speakerVoice` भेजता है।

वॉइसडिज़ाइन मॉडल `mimo-v2.5-tts-voicedesign` किसी प्रीसेट वॉइस आईडी के बजाय
स्वाभाविक भाषा के शैली प्रॉम्प्ट से वॉइस उत्पन्न करता है। `style` को
वांछित वॉइस विवरण पर सेट करें; OpenClaw इसे `user` संदेश के रूप में भेजता है,
बोले जाने वाले टेक्स्ट को `assistant` संदेश के रूप में भेजता है और इस
मॉडल के लिए `audio.voice` को छोड़ देता है।

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

वॉइस-नोट संश्लेषण लक्ष्य का अनुरोध करने वाले चैनलों (Discord, Feishu,
Matrix, Telegram और WhatsApp) के लिए, OpenClaw डिलीवरी से पहले Xiaomi के आउटपुट को
`ffmpeg` की सहायता से 48kHz मोनो Opus में ट्रांसकोड करता है।

## कॉन्फ़िगरेशन उदाहरण

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

मूल्य निर्धारण और संगतता फ़्लैग बंडल किए गए Plugin मेनिफ़ेस्ट से आते हैं, इसलिए रनटाइम व्यवहार से अंतर से बचने के लिए कॉन्फ़िगरेशन उदाहरण में `cost` और `compat` शामिल नहीं हैं।

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

मूल्य निर्धारण बंडल किए गए मेनिफ़ेस्ट से आता है (Token Plan मॉडलों में श्रेणीबद्ध कैश-पठन मूल्य निर्धारण शामिल है), इसलिए कॉन्फ़िगरेशन उदाहरण में `cost` शामिल नहीं है।

<AccordionGroup>
  <Accordion title="स्वतः अंतःक्षेपण व्यवहार">
    जब आपके पर्यावरण में `XIAOMI_API_KEY` सेट हो या कोई प्रमाणीकरण प्रोफ़ाइल मौजूद हो, तब `xiaomi` प्रदाता स्वतः सक्षम हो जाता है। `xiaomi-token-plan` को क्षेत्रीय आधार URL की आवश्यकता होती है, इसलिए समर्थित पथ बंडल किया गया Token Plan ऑनबोर्डिंग विकल्प या स्पष्ट `models.providers.xiaomi-token-plan` कॉन्फ़िगरेशन ब्लॉक है।
  </Accordion>

  <Accordion title="मॉडल विवरण">
    - **mimo-v2-flash** - हल्का और तेज़, सामान्य प्रयोजन वाले टेक्स्ट कार्यों के लिए आदर्श। तर्क का समर्थन नहीं है।
    - **mimo-v2-pro** - लंबे दस्तावेज़ों के कार्यभार के लिए 1M टोकन कॉन्टेक्स्ट विंडो के साथ तर्क का समर्थन करता है।
    - **mimo-v2-omni** - तर्क-सक्षम मल्टीमॉडल मॉडल, जो टेक्स्ट और इमेज दोनों इनपुट स्वीकार करता है।
    - **mimo-v2.5-pro** - Xiaomi के वर्तमान V2.5 तर्क स्टैक वाला Token Plan डिफ़ॉल्ट।
    - **mimo-v2.5** - Token Plan का मल्टीमॉडल V2.5 रूट।

    <Note>
    उपयोग के अनुसार भुगतान वाले मॉडल `xiaomi/` उपसर्ग का उपयोग करते हैं। Token Plan मॉडल `xiaomi-token-plan/` उपसर्ग का उपयोग करते हैं।
    </Note>

  </Accordion>

  <Accordion title="समस्या निवारण">
    - यदि मॉडल दिखाई नहीं देते हैं, तो पुष्टि करें कि संबंधित कुंजी पर्यावरण चर या प्रमाणीकरण प्रोफ़ाइल मौजूद और मान्य है।
    - Token Plan के लिए पुष्टि करें कि चुना गया ऑनबोर्डिंग क्षेत्र सदस्यता पृष्ठ के आधार URL से मेल खाता है और कुंजी `tp-` से शुरू होती है।
    - जब Gateway डेमन के रूप में चलता है, तो सुनिश्चित करें कि कुंजी उस प्रक्रिया के लिए उपलब्ध है (उदाहरण के लिए `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।

    <Warning>
    केवल आपके इंटरैक्टिव शेल में सेट की गई कुंजियाँ डेमन-प्रबंधित Gateway प्रक्रियाओं को दिखाई नहीं देतीं। स्थायी उपलब्धता के लिए `~/.openclaw/.env` या `env.shellEnv` कॉन्फ़िगरेशन का उपयोग करें।
    </Warning>

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="चिंतन स्तर" href="/hi/tools/thinking" icon="brain">
    `/think` निर्देश सिंटैक्स और स्तर मैपिंग।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    संपूर्ण OpenClaw कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="Xiaomi MiMo कंसोल" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo डैशबोर्ड और API कुंजी प्रबंधन।
  </Card>
</CardGroup>
