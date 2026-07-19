---
read_when:
    - आप OpenClaw के साथ Volcano Engine या Doubao मॉडल का उपयोग करना चाहते हैं
    - आपको Volcengine API कुंजी सेटअप की आवश्यकता है
    - आप Volcengine Speech टेक्स्ट-टू-स्पीच का उपयोग करना चाहते हैं
summary: Volcano Engine सेटअप (Doubao मॉडल, कोडिंग एंडपॉइंट और Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-19T09:34:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ac0e86b5b94b0c0f08e76878d16e9c5562e0d3f9923697713bef20ebba5bab2
    source_path: providers/volcengine.md
    workflow: 16
---

Volcengine प्रदाता Doubao मॉडल और Volcano Engine पर होस्ट किए गए तृतीय-पक्ष मॉडल तक पहुँच प्रदान करता है, जिसमें सामान्य और कोडिंग कार्यभार के लिए अलग-अलग एंडपॉइंट होते हैं। यही बंडल किया गया plugin Volcengine Speech को TTS प्रदाता के रूप में भी पंजीकृत करता है।

| विवरण     | मान                                                      |
| ---------- | ---------------------------------------------------------- |
| प्रदाता  | `volcengine` (सामान्य + TTS), `volcengine-plan` (कोडिंग)   |
| मॉडल प्रमाणीकरण | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS प्रमाणीकरण   | `VOLCENGINE_TTS_API_KEY` या `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | OpenAI-संगत मॉडल, BytePlus Seed Speech TTS         |

## आरंभ करना

<Steps>
  <Step title="API कुंजी सेट करें">
    इंटरैक्टिव ऑनबोर्डिंग चलाएँ:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    यह एक ही API कुंजी से सामान्य (`volcengine`) और कोडिंग (`volcengine-plan`) दोनों प्रदाताओं को पंजीकृत करता है।

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
  <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
गैर-इंटरैक्टिव सेटअप (CI, स्क्रिप्टिंग) के लिए कुंजी सीधे पास करें:

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
दोनों प्रदाता एक ही API कुंजी से कॉन्फ़िगर किए जाते हैं। सेटअप दोनों को स्वचालित रूप से पंजीकृत करता है और कोडिंग प्रदाता का मॉडल चयनकर्ता सामान्य प्रदाता के प्रमाणीकरण का भी पुनः उपयोग करता है (`volcengine-plan`, `volcengine` का प्रमाणीकरण उपनाम है)।
</Note>

## अंतर्निहित कैटलॉग

<Tabs>
  <Tab title="सामान्य (volcengine)">
    | मॉडल संदर्भ                                    | नाम                            | इनपुट       | कॉन्टेक्स्ट |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | टेक्स्ट, इमेज | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | टेक्स्ट, इमेज | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | टेक्स्ट, इमेज | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | टेक्स्ट, इमेज | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | टेक्स्ट, इमेज | 256,000 |
  </Tab>
  <Tab title="कोडिंग (volcengine-plan)">
    | मॉडल संदर्भ                                         | नाम                     | इनपुट | कॉन्टेक्स्ट |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | टेक्स्ट  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | टेक्स्ट  | 256,000 |
  </Tab>
</Tabs>

दोनों कैटलॉग स्थिर हैं (कोई `/models` खोज कॉल नहीं) और OpenAI-संगत स्ट्रीम किए गए उपयोग लेखांकन का समर्थन करते हैं। दोनों प्रदाताओं के टूल स्कीमा स्वचालित रूप से `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains`, और `maxContains` कीवर्ड हटा देते हैं, क्योंकि Volcengine टूल-कॉल API उन्हें अस्वीकार करता है।

## टेक्स्ट-टू-स्पीच

Volcengine TTS, BytePlus Seed Speech HTTP API (`voice.ap-southeast-1.bytepluses.com`) का उपयोग करता है और इसे OpenAI-संगत Doubao मॉडल API कुंजी से अलग कॉन्फ़िगर किया जाता है। BytePlus कंसोल में Seed Speech > Settings > API Keys खोलें, API कुंजी कॉपी करें, फिर यह सेट करें:

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

`messages.tts.providers.volcengine` के अंतर्गत उपलब्ध फ़ील्ड: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey`, और `baseUrl`। जब वॉइस-सेटिंग ओवरराइड की अनुमति होती है, तब `!emotion=<value>` इनलाइन वॉइस निर्देश के रूप में भी काम करता है।

वॉइस-नोट लक्ष्यों के लिए OpenClaw प्रदाता-नेटिव `ogg_opus` का अनुरोध करता है। सामान्य ऑडियो अटैचमेंट के लिए यह `mp3` का अनुरोध करता है। प्रदाता उपनाम `bytedance` और `doubao` भी इसी स्पीच प्रदाता पर रिज़ॉल्व होते हैं।

डिफ़ॉल्ट संसाधन आईडी `seed-tts-1.0` है, जो वह एंटाइटलमेंट है जिसे BytePlus नई बनाई गई Seed Speech API कुंजियों को डिफ़ॉल्ट रूप से देता है। यदि आपके प्रोजेक्ट के पास TTS 2.0 एंटाइटलमेंट है, तो `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` सेट करें।

<Warning>
`VOLCANO_ENGINE_API_KEY`, ModelArk/Doubao मॉडल एंडपॉइंट के लिए है और Seed Speech API कुंजी नहीं है। TTS को BytePlus Speech Console की Seed Speech API कुंजी या लीगेसी Speech Console AppID/टोकन जोड़ी की आवश्यकता होती है।
</Warning>

पुराने Speech Console एप्लिकेशन के लिए लीगेसी AppID/टोकन प्रमाणीकरण का समर्थन जारी है:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

अन्य वैकल्पिक TTS एनवायरनमेंट वेरिएबल: सेट होने पर `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY`, और `VOLCENGINE_TTS_BASE_URL` संबंधित `messages.tts.providers.volcengine` कॉन्फ़िगरेशन फ़ील्ड को ओवरराइड करते हैं।

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="ऑनबोर्डिंग के बाद डिफ़ॉल्ट मॉडल">
    `openclaw onboard --auth-choice volcengine-api-key`, सामान्य `volcengine` कैटलॉग को पंजीकृत करने के साथ-साथ `volcengine-plan/ark-code-latest` को डिफ़ॉल्ट मॉडल के रूप में सेट करता है।
  </Accordion>

  <Accordion title="मॉडल चयनकर्ता का फ़ॉलबैक व्यवहार">
    ऑनबोर्डिंग/कॉन्फ़िगरेशन के दौरान मॉडल चयन में, Volcengine प्रमाणीकरण विकल्प `volcengine/*` और `volcengine-plan/*` दोनों पंक्तियों को प्राथमिकता देता है। यदि वे मॉडल अभी तक लोड नहीं हुए हैं, तो OpenClaw खाली प्रदाता-स्कोप वाला चयनकर्ता दिखाने के बजाय बिना फ़िल्टर किए गए कैटलॉग पर फ़ॉलबैक करता है।
  </Accordion>

  <Accordion title="डेमन प्रक्रियाओं के लिए एनवायरनमेंट वेरिएबल">
    यदि Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID`, और `VOLCENGINE_TTS_TOKEN` जैसे मॉडल और TTS एनवायरनमेंट वेरिएबल उस प्रक्रिया के लिए उपलब्ध हों (उदाहरण के लिए, `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw को बैकग्राउंड सेवा के रूप में चलाते समय, आपके इंटरैक्टिव शेल में सेट किए गए एनवायरनमेंट वेरिएबल स्वचालित रूप से इनहेरिट नहीं होते। ऊपर दिया गया डेमन नोट देखें।
</Warning>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन करना।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    एजेंटों, मॉडलों और प्रदाताओं के लिए पूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएँ और डीबगिंग चरण।
  </Card>
  <Card title="अक्सर पूछे जाने वाले प्रश्न" href="/hi/help/faq" icon="circle-question">
    OpenClaw सेटअप के बारे में अक्सर पूछे जाने वाले प्रश्न।
  </Card>
</CardGroup>
