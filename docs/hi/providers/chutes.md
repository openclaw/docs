---
read_when:
    - आप OpenClaw के साथ Chutes का उपयोग करना चाहते हैं
    - आपको OAuth या API कुंजी सेटअप पथ की आवश्यकता है
    - आप डिफ़ॉल्ट मॉडल, उपनाम या खोज व्यवहार चाहते हैं
summary: Chutes सेटअप (OAuth या API कुंजी, मॉडल खोज, उपनाम)
title: Chutes
x-i18n:
    generated_at: "2026-07-16T16:37:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) एक OpenAI-संगत API के माध्यम से ओपन-सोर्स मॉडल कैटलॉग उपलब्ध कराता है। OpenClaw ब्राउज़र OAuth और API-कुंजी प्रमाणीकरण, दोनों का समर्थन करता है।

| गुण               | मान                                                     |
| ---------------- | ------------------------------------------------------- |
| प्रदाता           | `chutes`                                      |
| Plugin           | आधिकारिक बाहरी पैकेज (`@openclaw/chutes-provider`)              |
| API              | OpenAI-संगत                                             |
| बेस URL          | `https://llm.chutes.ai/v1`                                      |
| प्रमाणीकरण        | OAuth या API कुंजी (नीचे देखें)                         |
| रनटाइम env vars  | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` पहले से प्राप्त OAuth एक्सेस टोकन को सीधे उपलब्ध कराता है
(उदाहरण के लिए CI में), जिससे नीचे दिए गए इंटरैक्टिव ब्राउज़र प्रवाह को बायपास किया जाता है।

## Plugin इंस्टॉल करें

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## शुरुआत करना

दोनों तरीके डिफ़ॉल्ट मॉडल को `chutes/zai-org/GLM-4.7-TEE` पर सेट करते हैं और
Chutes कैटलॉग पंजीकृत करते हैं।

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth ऑनबोर्डिंग प्रवाह चलाएँ">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw ब्राउज़र प्रवाह को स्थानीय रूप से शुरू करता है, या रिमोट/हेडलेस होस्ट पर
        URL + रीडायरेक्ट-पेस्ट प्रवाह दिखाता है। OAuth टोकन OpenClaw प्रमाणीकरण
        प्रोफ़ाइल के माध्यम से स्वतः रीफ़्रेश होते हैं।
      </Step>
    </Steps>
  </Tab>
  <Tab title="API कुंजी">
    <Steps>
      <Step title="API कुंजी प्राप्त करें">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) पर
        एक कुंजी बनाएँ।
      </Step>
      <Step title="API कुंजी ऑनबोर्डिंग प्रवाह चलाएँ">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## खोज व्यवहार

Chutes प्रमाणीकरण उपलब्ध होने पर, OpenClaw उस क्रेडेंशियल के साथ `GET /v1/models`
से क्वेरी करता है और खोजे गए मॉडलों का उपयोग करता है, जिन्हें प्रत्येक क्रेडेंशियल के लिए
5 मिनट तक कैश किया जाता है। समय-सीमा समाप्त या अनधिकृत कुंजी (HTTP 401) मिलने पर,
OpenClaw क्रेडेंशियल के बिना एक बार फिर प्रयास करता है। यदि खोज फिर भी कोई पंक्ति नहीं
लौटाती, विफल होती है या कोई अन्य गैर-2xx स्थिति लौटाती है, तो यह बंडल किए गए स्थिर
कैटलॉग पर वापस चली जाती है (API-कुंजी और OAuth खोज, दोनों इसी पथ का उपयोग करती हैं)।
यदि स्टार्टअप के समय खोज विफल हो जाती है, तो स्थिर कैटलॉग का उपयोग स्वतः किया जाता है।

## डिफ़ॉल्ट उपनाम

OpenClaw, Chutes कैटलॉग के लिए तीन सुविधाजनक उपनाम पंजीकृत करता है:

| उपनाम           | लक्षित मॉडल                                           |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## अंतर्निहित शुरुआती कैटलॉग

बंडल किए गए फ़ॉलबैक कैटलॉग में 47 मॉडल हैं। वर्तमान रेफ़रेंस का एक प्रतिनिधि नमूना:

| मॉडल रेफ़रेंस                                         |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

पूरी सूची के लिए `openclaw models list --all --provider chutes` चलाएँ।

## कॉन्फ़िगरेशन उदाहरण

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth ओवरराइड">
    वैकल्पिक एनवायरनमेंट वेरिएबल के साथ OAuth प्रवाह को अनुकूलित करें:

    | वेरिएबल | उद्देश्य |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth क्लाइंट आईडी (सेट न होने पर पूछा जाता है) |
    | `CHUTES_CLIENT_SECRET` | OAuth क्लाइंट सीक्रेट |
    | `CHUTES_OAUTH_REDIRECT_URI` | रीडायरेक्ट URI (डिफ़ॉल्ट `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | स्पेस से अलग किए गए स्कोप (डिफ़ॉल्ट `openid profile chutes:invoke`) |

    रीडायरेक्ट ऐप की आवश्यकताओं और सहायता के लिए
    [Chutes OAuth दस्तावेज़](https://chutes.ai/docs/sign-in-with-chutes/overview) देखें।

  </Accordion>

  <Accordion title="टिप्पणियाँ">
    - Chutes मॉडल `chutes/<model-id>` के रूप में पंजीकृत किए जाते हैं।
    - स्ट्रीमिंग के दौरान Chutes टोकन उपयोग की रिपोर्ट नहीं करता (`supportsUsageInStreaming: false`); स्ट्रीम पूरी होने पर भी उपयोग का कुल योग दिखता है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता के नियम, मॉडल रेफ़रेंस और फ़ेलओवर व्यवहार।
  </Card>
  <Card title="कॉन्फ़िगरेशन रेफ़रेंस" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाता सेटिंग सहित पूरा कॉन्फ़िगरेशन स्कीमा।
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes डैशबोर्ड और API दस्तावेज़।
  </Card>
  <Card title="Chutes API कुंजियाँ" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API कुंजियाँ बनाएँ और प्रबंधित करें।
  </Card>
</CardGroup>
