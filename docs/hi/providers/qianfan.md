---
read_when:
    - आप कई LLM के लिए एक ही API कुंजी चाहते हैं
    - आपको Baidu Qianfan सेटअप संबंधी मार्गदर्शन चाहिए
summary: OpenClaw में कई मॉडल एक्सेस करने के लिए Qianfan के एकीकृत API का उपयोग करें
title: Qianfan
x-i18n:
    generated_at: "2026-07-16T16:49:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan Baidu का MaaS प्लेटफ़ॉर्म है: एक एकीकृत, OpenAI-संगत API, जो एक ही एंडपॉइंट और API कुंजी के पीछे कई मॉडल को अनुरोध भेजता है। OpenClaw इसे आधिकारिक बाहरी Plugin `@openclaw/qianfan-provider` के रूप में उपलब्ध कराता है।

| गुण            | मान                                      |
| -------------- | ---------------------------------------- |
| प्रदाता         | `qianfan`                       |
| प्रमाणीकरण      | `QIANFAN_API_KEY`                       |
| API            | OpenAI-संगत (`openai-completions`)        |
| आधार URL       | `https://qianfan.baidubce.com/v2`                       |
| डिफ़ॉल्ट मॉडल   | `qianfan/deepseek-v3.2`                       |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## आरंभ करना

<Steps>
  <Step title="Baidu Cloud खाता बनाएँ">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) पर साइन अप करें या लॉग इन करें और सुनिश्चित करें कि आपके लिए Qianfan API की पहुँच सक्षम है।
  </Step>
  <Step title="API कुंजी जनरेट करें">
    नया एप्लिकेशन बनाएँ या मौजूदा एप्लिकेशन चुनें, फिर API कुंजी जनरेट करें। Baidu Cloud कुंजियाँ `bce-v3/ALTAK-...` प्रारूप का उपयोग करती हैं।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    गैर-इंटरैक्टिव रन कुंजी को `--qianfan-api-key <key>` या
    `QIANFAN_API_KEY` से पढ़ते हैं। ऑनबोर्डिंग प्रदाता कॉन्फ़िगरेशन लिखती है, डिफ़ॉल्ट मॉडल के लिए
    `QIANFAN` उपनाम जोड़ती है और कोई मॉडल कॉन्फ़िगर न होने पर `qianfan/deepseek-v3.2`
    को डिफ़ॉल्ट मॉडल के रूप में सेट करती है।

  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## अंतर्निहित कैटलॉग

| मॉडल संदर्भ                          | इनपुट      | कॉन्टेक्स्ट | अधिकतम आउटपुट | रीजनिंग | टिप्पणियाँ       |
| ------------------------------------ | ----------- | ----------- | --------------- | -------- | ---------------- |
| `qianfan/deepseek-v3.2`                   | टेक्स्ट     | 98,304      | 32,768          | हाँ      | डिफ़ॉल्ट मॉडल     |
| `qianfan/ernie-5.0-thinking-preview`                   | टेक्स्ट, इमेज | 119,000   | 64,000          | हाँ      | मल्टीमॉडल         |

कैटलॉग स्थिर है; मॉडल की कोई लाइव खोज नहीं होती।

<Tip>
कस्टम आधार URL या मॉडल मेटाडेटा की आवश्यकता होने पर ही आपको `models.providers.qianfan` को ओवरराइड करना होगा।
</Tip>

## कॉन्फ़िगरेशन उदाहरण

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<Note>
मॉडल संदर्भ `qianfan/` प्रीफ़िक्स का उपयोग करते हैं (उदाहरण के लिए `qianfan/deepseek-v3.2`)।
</Note>

<AccordionGroup>
  <Accordion title="ट्रांसपोर्ट और संगतता">
    Qianfan मूल OpenAI अनुरोध संरचना के बजाय OpenAI-संगत ट्रांसपोर्ट पथ के माध्यम से चलता है। OpenAI SDK की मानक सुविधाएँ काम करती हैं, लेकिन प्रदाता-विशिष्ट पैरामीटर अग्रेषित नहीं किए जा सकते।
  </Accordion>

  <Accordion title="समस्या निवारण">
    - सुनिश्चित करें कि आपकी API कुंजी `bce-v3/ALTAK-` से शुरू होती है और Baidu Cloud कंसोल में उसके लिए Qianfan API की पहुँच सक्षम है।
    - यदि मॉडल सूचीबद्ध नहीं हैं, तो पुष्टि करें कि आपके खाते के लिए Qianfan सेवा सक्रिय है।
    - आधार URL केवल तभी बदलें, जब आप कस्टम एंडपॉइंट या प्रॉक्सी का उपयोग करते हों।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, मॉडल संदर्भ और फ़ेलओवर व्यवहार चुनना।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    OpenClaw का संपूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="एजेंट सेटअप" href="/hi/concepts/agent" icon="robot">
    एजेंट के डिफ़ॉल्ट और मॉडल असाइनमेंट कॉन्फ़िगर करना।
  </Card>
  <Card title="Qianfan API दस्तावेज़" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    आधिकारिक Qianfan API दस्तावेज़।
  </Card>
</CardGroup>
