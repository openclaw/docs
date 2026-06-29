---
read_when:
    - आप OpenClaw के साथ Volcano Engine या Doubao मॉडल का उपयोग करना चाहते हैं
    - आपको Volcengine API कुंजी सेट अप करनी होगी
    - आप Volcengine Speech टेक्स्ट-टू-स्पीच का उपयोग करना चाहते हैं
summary: Volcano Engine सेटअप (Doubao मॉडल, कोडिंग एंडपॉइंट, और Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-06-29T00:04:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 16
---

Volcengine प्रदाता Doubao मॉडलों और Volcano Engine पर होस्ट किए गए तृतीय-पक्ष मॉडलों तक पहुंच देता है, जिसमें सामान्य और कोडिंग वर्कलोड के लिए अलग-अलग एंडपॉइंट होते हैं। वही bundled plugin Volcengine Speech को TTS प्रदाता के रूप में भी रजिस्टर कर सकता है।

| विवरण     | मान                                                      |
| ---------- | ---------------------------------------------------------- |
| प्रदाता  | `volcengine` (सामान्य + TTS) + `volcengine-plan` (कोडिंग)  |
| मॉडल auth | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS auth   | `VOLCENGINE_TTS_API_KEY` या `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | OpenAI-संगत मॉडल, BytePlus Seed Speech TTS         |

## शुरू करना

<Steps>
  <Step title="API key सेट करें">
    इंटरैक्टिव ऑनबोर्डिंग चलाएं:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    यह एक ही API key से सामान्य (`volcengine`) और कोडिंग (`volcengine-plan`) दोनों प्रदाताओं को रजिस्टर करता है।

  </Step>
  <Step title="डिफ़ॉल्ट मॉडल सेट करें">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="पुष्टि करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
नॉन-इंटरैक्टिव सेटअप (CI, स्क्रिप्टिंग) के लिए, key सीधे पास करें:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## प्रदाता और एंडपॉइंट

| प्रदाता          | एंडपॉइंट                                  | उपयोग का मामला       |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | सामान्य मॉडल |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | कोडिंग मॉडल  |

<Note>
दोनों प्रदाता एक ही API key से कॉन्फ़िगर किए जाते हैं। सेटअप दोनों को अपने आप रजिस्टर करता है।
</Note>

## बिल्ट-इन कैटलॉग

<Tabs>
  <Tab title="सामान्य (volcengine)">
    | मॉडल ref                                    | नाम                            | इनपुट       | संदर्भ |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | टेक्स्ट, इमेज | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | टेक्स्ट, इमेज | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | टेक्स्ट, इमेज | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | टेक्स्ट, इमेज | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | टेक्स्ट, इमेज | 128,000 |
  </Tab>
  <Tab title="कोडिंग (volcengine-plan)">
    | मॉडल ref                                         | नाम                     | इनपुट | संदर्भ |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | टेक्स्ट  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | टेक्स्ट  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | टेक्स्ट  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | टेक्स्ट  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | टेक्स्ट  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | टेक्स्ट  | 256,000 |
  </Tab>
</Tabs>

## टेक्स्ट-टू-स्पीच

Volcengine TTS BytePlus Seed Speech HTTP API का उपयोग करता है और OpenAI-संगत Doubao मॉडल API key से अलग कॉन्फ़िगर किया जाता है। BytePlus console में, Seed Speech > Settings > API Keys खोलें और API key कॉपी करें, फिर सेट करें:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

फिर इसे `openclaw.json` में सक्षम करें:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

वॉइस-नोट लक्ष्यों के लिए, OpenClaw Volcengine से प्रदाता-नेटिव `ogg_opus` मांगता है। सामान्य ऑडियो अटैचमेंट के लिए, यह `mp3` मांगता है। प्रदाता aliases `bytedance` और `doubao` भी उसी speech प्रदाता पर resolve होते हैं।

डिफ़ॉल्ट resource id `seed-tts-1.0` है क्योंकि डिफ़ॉल्ट प्रोजेक्ट में नए बनाए गए Seed Speech API keys को BytePlus यही देता है। अगर आपके प्रोजेक्ट के पास TTS 2.0 entitlement है, तो `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` सेट करें।

<Warning>
`VOLCANO_ENGINE_API_KEY` ModelArk/Doubao मॉडल एंडपॉइंट के लिए है और Seed Speech API key नहीं है। TTS को BytePlus Speech Console से Seed Speech API key, या legacy Speech Console AppID/token जोड़ी चाहिए।
</Warning>

पुराने Speech Console applications के लिए legacy AppID/token auth समर्थित रहता है:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="ऑनबोर्डिंग के बाद डिफ़ॉल्ट मॉडल">
    `openclaw onboard --auth-choice volcengine-api-key` वर्तमान में
    `volcengine-plan/ark-code-latest` को डिफ़ॉल्ट मॉडल के रूप में सेट करता है, साथ ही सामान्य `volcengine` कैटलॉग भी रजिस्टर करता है।
  </Accordion>

  <Accordion title="मॉडल picker fallback व्यवहार">
    ऑनबोर्डिंग/कॉन्फ़िगर मॉडल चयन के दौरान, Volcengine auth choice
    `volcengine/*` और `volcengine-plan/*` दोनों rows को प्राथमिकता देता है। अगर वे मॉडल अभी तक loaded नहीं हैं, तो OpenClaw खाली provider-scoped picker दिखाने के बजाय unfiltered catalog पर fallback करता है।
  </Accordion>

  <Accordion title="daemon प्रक्रियाओं के लिए environment variables">
    अगर Gateway daemon (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि मॉडल और TTS env vars जैसे `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID`, और
    `VOLCENGINE_TTS_TOKEN` उस प्रक्रिया के लिए उपलब्ध हैं (उदाहरण के लिए,
    `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw को background service के रूप में चलाते समय, आपके interactive shell में सेट environment variables अपने आप inherited नहीं होते। ऊपर daemon note देखें।
</Warning>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल refs, और failover behavior को चुनना।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    agents, मॉडल, और प्रदाताओं के लिए पूरा config reference।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएं और debugging steps।
  </Card>
  <Card title="FAQ" href="/hi/help/faq" icon="circle-question">
    OpenClaw setup के बारे में अक्सर पूछे जाने वाले प्रश्न।
  </Card>
</CardGroup>
