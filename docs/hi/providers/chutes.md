---
read_when:
    - आप OpenClaw के साथ Chutes का उपयोग करना चाहते हैं
    - आपको OAuth या API कुंजी सेटअप पथ की आवश्यकता है
    - आप डिफ़ॉल्ट मॉडल, उपनाम या खोज व्यवहार चाहते हैं
summary: Chutes सेटअप (OAuth या API कुंजी, मॉडल खोज, उपनाम)
title: Chutes
x-i18n:
    generated_at: "2026-07-19T09:12:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 57ea5112105f19028c1a348b4d7fec4cf7ef12de00b1b2de9c152057bf5033a9
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) एक
OpenAI-संगत API के माध्यम से ओपन-सोर्स मॉडल कैटलॉग उपलब्ध कराता है। OpenClaw ब्राउज़र OAuth और API-कुंजी प्रमाणीकरण, दोनों का समर्थन करता है।

| गुण               | मान                                                     |
| ----------------- | ------------------------------------------------------- |
| प्रदाता            | `chutes`                                      |
| Plugin            | आधिकारिक बाहरी पैकेज (`@openclaw/chutes-provider`)              |
| API               | OpenAI-संगत                                             |
| आधार URL          | `https://llm.chutes.ai/v1`                                      |
| प्रमाणीकरण         | OAuth या API कुंजी (नीचे देखें)                         |
| रनटाइम env vars   | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` पहले से प्राप्त OAuth एक्सेस टोकन को सीधे प्रदान करता है
(उदाहरण के लिए, CI में), जिससे नीचे दिए गए इंटरैक्टिव ब्राउज़र प्रवाह को छोड़ दिया जाता है।

## Plugin इंस्टॉल करें

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## आरंभ करना

दोनों तरीके डिफ़ॉल्ट मॉडल को `chutes/zai-org/GLM-5-TEE` पर सेट करते हैं और
Chutes कैटलॉग को पंजीकृत करते हैं।

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth ऑनबोर्डिंग प्रवाह चलाएँ">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw ब्राउज़र प्रवाह को स्थानीय रूप से लॉन्च करता है, या रिमोट/हेडलेस
        होस्ट पर URL + रीडायरेक्ट-पेस्ट प्रवाह दिखाता है। OAuth टोकन OpenClaw
        प्रमाणीकरण प्रोफ़ाइल के माध्यम से स्वतः रीफ़्रेश होते हैं।
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

जब Chutes प्रमाणीकरण उपलब्ध होता है, तो OpenClaw उस क्रेडेंशियल के साथ
`GET /v1/models` से क्वेरी करता है और खोजे गए मॉडलों का उपयोग करता है, जिन्हें
प्रति क्रेडेंशियल 5 मिनट के लिए कैश किया जाता है। समय-सीमा समाप्त/अनधिकृत कुंजी
(HTTP 401) मिलने पर, OpenClaw क्रेडेंशियल के बिना एक बार पुनः प्रयास करता है।
यदि खोज फिर भी कोई पंक्ति नहीं लौटाती, विफल होती है, या कोई अन्य non-2xx
स्थिति लौटाती है, तो यह बंडल किए गए स्थिर कैटलॉग पर वापस चला जाता है (API-कुंजी
और OAuth खोज दोनों इसी पथ का उपयोग करते हैं)। यदि स्टार्टअप पर खोज विफल होती है,
तो स्थिर कैटलॉग का उपयोग स्वचालित रूप से किया जाता है।

## डिफ़ॉल्ट उपनाम

OpenClaw, Chutes कैटलॉग के लिए दो सुविधाजनक उपनाम पंजीकृत करता है:

| उपनाम               | लक्ष्य मॉडल                            |
| ------------------- | -------------------------------------- |
| `chutes-pro`  | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                     |
| `chutes-vision`  | `chutes/moonshotai/Kimi-K2.5-TEE`                     |

## अंतर्निर्मित प्रारंभिक कैटलॉग

बंडल किए गए फ़ॉलबैक कैटलॉग में वर्तमान में उपलब्ध ये पाँच मॉडल शामिल हैं:

| मॉडल संदर्भ                              |
| ---------------------------------------- |
| `chutes/zai-org/GLM-5-TEE`                       |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                       |
| `chutes/moonshotai/Kimi-K2.5-TEE`                       |
| `chutes/MiniMaxAI/MiniMax-M2.5-TEE`                       |
| `chutes/Qwen/Qwen3.5-397B-A17B-TEE`                       |

पूरी सूची के लिए `openclaw models list --all --provider chutes` चलाएँ।

## कॉन्फ़िगरेशन उदाहरण

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-5-TEE" },
      models: {
        "chutes/zai-org/GLM-5-TEE": { alias: "Chutes GLM 5" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth ओवरराइड">
    वैकल्पिक पर्यावरण वेरिएबल के साथ OAuth प्रवाह को अनुकूलित करें:

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
    - Chutes मॉडल `chutes/<model-id>` के रूप में पंजीकृत होते हैं।
    - Chutes स्ट्रीमिंग के दौरान टोकन उपयोग की रिपोर्ट नहीं करता (`supportsUsageInStreaming: false`); स्ट्रीम पूरी होने के बाद भी उपयोग के कुल आँकड़े दिखाई देते हैं।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता नियम, मॉडल संदर्भ और फ़ेलओवर व्यवहार।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाता सेटिंग सहित पूर्ण कॉन्फ़िगरेशन स्कीमा।
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes डैशबोर्ड और API दस्तावेज़।
  </Card>
  <Card title="Chutes API कुंजियाँ" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API कुंजियाँ बनाएँ और प्रबंधित करें।
  </Card>
</CardGroup>
