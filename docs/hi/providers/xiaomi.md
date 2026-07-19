---
read_when:
    - आप OpenClaw में Xiaomi MiMo मॉडल चाहते हैं
    - आपको Xiaomi MiMo प्रमाणीकरण या Token Plan सेटअप की आवश्यकता है
summary: OpenClaw के साथ Xiaomi MiMo के पे-एज़-यू-गो और Token Plan मॉडल का उपयोग करें
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-19T09:47:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 072e3772f5b6d49837a0909e982cb5a03bd532c4804b4eb2e94dc501e6aab58c
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo **MiMo** मॉडल के लिए API प्लेटफ़ॉर्म है। बंडल किया गया `xiaomi`
Plugin (`enabledByDefault: true`, इंस्टॉल करने का कोई चरण नहीं) दो टेक्स्ट
प्रोवाइडर और एक स्पीच (TTS) प्रोवाइडर पंजीकृत करता है:

- `xiaomi` - उपयोग के अनुसार भुगतान वाली कुंजियाँ (`sk-...`)
- `xiaomi-token-plan` - क्षेत्रीय एंडपॉइंट प्रीसेट वाली Token Plan कुंजियाँ (`tp-...`)

| गुण         | मान                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| प्रोवाइडर आईडी     | `xiaomi` (उपयोग के अनुसार भुगतान), `xiaomi-token-plan` (Token Plan)                                                                                         |
| प्रमाणीकरण एनवायरनमेंट वेरिएबल    | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| प्रत्यक्ष CLI फ़्लैग | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API              | OpenAI-संगत चैट कम्प्लीशन (`openai-completions`)                                                                                          |
| स्पीच अनुबंध  | `speechProviders: ["xiaomi"]`                                                                                                                      |
| बेस URL        | उपयोग के अनुसार भुगतान: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                            |
| डिफ़ॉल्ट मॉडल   | `xiaomi/mimo-v2.5`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                              |
| TTS डिफ़ॉल्ट      | `mimo-v2.5-tts`, वॉइस `mimo_default`; वॉइसडिज़ाइन मॉडल `mimo-v2.5-tts-voicedesign`                                                               |

## शुरुआत करना

<Steps>
  <Step title="सही कुंजी प्राप्त करें">
    [Xiaomi MiMo कंसोल](https://platform.xiaomimimo.com/#/console/api-keys) में उपयोग के अनुसार भुगतान वाली कुंजी बनाएँ, या अपना Token Plan सदस्यता पेज खोलें और क्षेत्रीय OpenAI-संगत बेस URL के साथ मेल खाने वाली `tp-...` कुंजी कॉपी करें।
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

    या कुंजियाँ सीधे पास करें:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="पुष्टि करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
ऑनबोर्डिंग कुंजी के प्रारूप को सत्यापित करता है और उपयोग के अनुसार भुगतान वाले पथ में `tp-...` कुंजी दर्ज होने पर, या Token Plan पथ में `sk-...` कुंजी दर्ज होने पर चेतावनी देता है।
</Tip>

## उपयोग के अनुसार भुगतान वाला कैटलॉग

| मॉडल रेफ़रेंस              | इनपुट       | कॉन्टेक्स्ट   | अधिकतम आउटपुट | रीजनिंग | टिप्पणियाँ         |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2.5`     | टेक्स्ट, इमेज | 1,048,576 | 131,072    | हाँ       | डिफ़ॉल्ट मॉडल |
| `xiaomi/mimo-v2.5-pro` | टेक्स्ट        | 1,048,576 | 131,072    | हाँ       | फ़्लैगशिप      |

## Token Plan कैटलॉग

वह Token Plan प्रमाणीकरण विकल्प चुनें, जो Xiaomi के सदस्यता UI में दिखाए गए क्षेत्रीय बेस URL से मेल खाता हो:

| प्रमाणीकरण विकल्प             | बेस URL                                   |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| मॉडल रेफ़रेंस                         | इनपुट       | कॉन्टेक्स्ट   | अधिकतम आउटपुट | रीजनिंग | टिप्पणियाँ         |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | टेक्स्ट        | 1,048,576 | 131,072    | हाँ       | डिफ़ॉल्ट मॉडल |
| `xiaomi-token-plan/mimo-v2.5`     | टेक्स्ट, इमेज | 1,048,576 | 131,072    | हाँ       | मल्टीमोडल    |

`xiaomi-token-plan` को रिज़ॉल्व करने के लिए क्षेत्रीय बेस URL चाहिए। समर्थित पथ
बंडल किया गया Token Plan ऑनबोर्डिंग विकल्प या स्पष्ट
`models.providers.xiaomi-token-plan` कॉन्फ़िग ब्लॉक है, जिसमें `baseUrl` सेट हो; इनमें
से किसी एक के बिना प्रोवाइडर उपलब्ध नहीं कराया जाता।

## रीजनिंग मॉडल

`mimo-v2.5` और `mimo-v2.5-pro`
OpenClaw के [`/think` डायरेक्टिव](/hi/tools/thinking) का समर्थन करते हैं, जिसके स्तर `off`,
`minimal`, `low`, `medium`, `high`, `xhigh`, और `max` (डिफ़ॉल्ट `high`) हैं।

## टेक्स्ट-टू-स्पीच

बंडल किया गया `xiaomi` Plugin, `messages.tts` के लिए
Xiaomi MiMo को स्पीच प्रोवाइडर के रूप में भी पंजीकृत करता है। यह टेक्स्ट को `assistant` संदेश
और वैकल्पिक शैली मार्गदर्शन को `user` संदेश बनाकर Xiaomi के चैट-कम्प्लीशन TTS अनुबंध को कॉल करता है।

| गुण | मान                                    |
| -------- | ---------------------------------------- |
| TTS आईडी   | `xiaomi` (`mimo` उपनाम)                  |
| प्रमाणीकरण     | `XIAOMI_API_KEY`                         |
| API      | `audio` के साथ `POST /v1/chat/completions` |
| डिफ़ॉल्ट  | `mimo-v2.5-tts`, वॉइस `mimo_default`    |
| आउटपुट   | डिफ़ॉल्ट रूप से MP3; कॉन्फ़िगर होने पर WAV      |

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
          style: "उज्ज्वल, स्वाभाविक, संवादात्मक लहजा।",
        },
      },
    },
  },
}
```

अंतर्निर्मित वॉइस: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`। प्रीसेट-वॉइस मॉडल `mimo-v2.5-tts`, `audio.voice` का उपयोग करता है, इसलिए
OpenClaw उस मॉडल के लिए `speakerVoice` भेजता है।

वॉइसडिज़ाइन मॉडल `mimo-v2.5-tts-voicedesign` किसी प्रीसेट वॉइस आईडी के बजाय
प्राकृतिक-भाषा शैली प्रॉम्प्ट से वॉइस जनरेट करता है। `style` को
वांछित वॉइस विवरण पर सेट करें; OpenClaw इसे `user` संदेश के रूप में भेजता है,
बोले जाने वाले टेक्स्ट को `assistant` संदेश के रूप में भेजता है, और इस मॉडल के लिए
`audio.voice` को छोड़ देता है।

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "स्पष्ट उच्चारण वाली गर्मजोशीपूर्ण, स्वाभाविक महिला वॉइस।",
        },
      },
    },
  },
}
```

वॉइस-नोट सिंथेसिस लक्ष्य का अनुरोध करने वाले चैनलों (Discord, Feishu,
Matrix, Telegram, और WhatsApp) के लिए, OpenClaw डिलीवरी से पहले Xiaomi आउटपुट को
`ffmpeg` के साथ 48kHz मोनो Opus में ट्रांसकोड करता है।

## कॉन्फ़िग उदाहरण

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2.5" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

मूल्य निर्धारण और संगतता फ़्लैग बंडल किए गए Plugin मैनिफ़ेस्ट से आते हैं, इसलिए रनटाइम व्यवहार से अंतर से बचने के लिए कॉन्फ़िग उदाहरण में `cost` और `compat` शामिल नहीं हैं।

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

मूल्य निर्धारण बंडल किए गए मैनिफ़ेस्ट से आता है (Token Plan मॉडल में स्तरीय कैश-रीड मूल्य निर्धारण शामिल है), इसलिए कॉन्फ़िग उदाहरण में `cost` शामिल नहीं है।

<AccordionGroup>
  <Accordion title="स्वतः इंजेक्शन व्यवहार">
    जब आपके एनवायरनमेंट में `XIAOMI_API_KEY` सेट हो या कोई प्रमाणीकरण प्रोफ़ाइल मौजूद हो, तो `xiaomi` प्रोवाइडर स्वतः सक्षम हो जाता है। `xiaomi-token-plan` को क्षेत्रीय बेस URL चाहिए, इसलिए समर्थित पथ बंडल किया गया Token Plan ऑनबोर्डिंग विकल्प या स्पष्ट `models.providers.xiaomi-token-plan` कॉन्फ़िग ब्लॉक है।
  </Accordion>

  <Accordion title="मॉडल विवरण">
    - **mimo-v2.5** - उपयोग के अनुसार भुगतान का डिफ़ॉल्ट और Token Plan का मल्टीमोडल V2.5 रूट।
    - **mimo-v2.5-pro** - फ़्लैगशिप रीजनिंग मॉडल और Token Plan डिफ़ॉल्ट।

    <Note>
    उपयोग के अनुसार भुगतान वाले मॉडल `xiaomi/` प्रीफ़िक्स का उपयोग करते हैं। Token Plan मॉडल `xiaomi-token-plan/` प्रीफ़िक्स का उपयोग करते हैं।
    </Note>

  </Accordion>

  <Accordion title="समस्या निवारण">
    - यदि मॉडल दिखाई नहीं देते हैं, तो पुष्टि करें कि संबंधित कुंजी एनवायरनमेंट वेरिएबल या प्रमाणीकरण प्रोफ़ाइल मौजूद और मान्य है।
    - Token Plan के लिए, पुष्टि करें कि चुना गया ऑनबोर्डिंग क्षेत्र सदस्यता पेज के बेस URL से मेल खाता है और कुंजी `tp-` से शुरू होती है।
    - जब Gateway डेमन के रूप में चलता है, तो सुनिश्चित करें कि कुंजी उस प्रोसेस के लिए उपलब्ध है (उदाहरण के लिए `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।

    <Warning>
    केवल आपके इंटरैक्टिव शेल में सेट की गई कुंजियाँ डेमन-प्रबंधित Gateway प्रोसेस को दिखाई नहीं देतीं। स्थायी उपलब्धता के लिए `~/.openclaw/.env` या `env.shellEnv` कॉन्फ़िग का उपयोग करें।
    </Warning>

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रोवाइडर, मॉडल रेफ़रेंस, और फ़ेलओवर व्यवहार चुनना।
  </Card>
  <Card title="थिंकिंग स्तर" href="/hi/tools/thinking" icon="brain">
    `/think` डायरेक्टिव सिंटैक्स और स्तर मैपिंग।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    पूर्ण OpenClaw कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="Xiaomi MiMo कंसोल" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo डैशबोर्ड और API कुंजी प्रबंधन।
  </Card>
</CardGroup>
