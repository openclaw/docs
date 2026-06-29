---
read_when:
    - आप कई LLMs के लिए एक ही API कुंजी चाहते हैं
    - आपको Baidu Qianfan सेटअप मार्गदर्शन चाहिए
summary: OpenClaw में कई मॉडलों तक पहुंचने के लिए Qianfan के एकीकृत API का उपयोग करें
title: Qianfan
x-i18n:
    generated_at: "2026-06-29T00:02:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan Baidu का MaaS प्लेटफ़ॉर्म है, जो एक **एकीकृत API** प्रदान करता है जो अनुरोधों को एक ही
endpoint और API key के पीछे कई मॉडलों तक रूट करता है। यह OpenAI-संगत है, इसलिए अधिकांश OpenAI SDKs केवल base URL बदलकर काम करते हैं।

| गुण | मान                             |
| -------- | --------------------------------- |
| प्रदाता | `qianfan`                         |
| प्रमाणीकरण     | `QIANFAN_API_KEY`                 |
| API      | OpenAI-संगत                 |
| Base URL | `https://qianfan.baidubce.com/v2` |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway रीस्टार्ट करें:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## शुरुआत करना

<Steps>
  <Step title="Baidu Cloud खाता बनाएं">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) पर साइन अप या लॉग इन करें और सुनिश्चित करें कि आपके लिए Qianfan API access सक्षम है।
  </Step>
  <Step title="API key जनरेट करें">
    एक नया application बनाएं या मौजूदा चुनें, फिर API key जनरेट करें। key का format `bce-v3/ALTAK-...` है।
  </Step>
  <Step title="Onboarding चलाएं">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## अंतर्निहित catalog

| Model ref                            | Input       | Context | अधिकतम output | Reasoning | नोट्स         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304  | 32,768     | हां       | डिफ़ॉल्ट मॉडल |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000     | हां       | Multimodal    |

<Tip>
डिफ़ॉल्ट model ref `qianfan/deepseek-v3.2` है। आपको `models.providers.qianfan` को केवल तब override करना होगा जब आपको custom base URL या model metadata चाहिए।
</Tip>

## Config उदाहरण

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

<AccordionGroup>
  <Accordion title="Transport और संगतता">
    Qianfan OpenAI-संगत transport path के माध्यम से चलता है, native OpenAI request shaping के माध्यम से नहीं। इसका मतलब है कि standard OpenAI SDK सुविधाएं काम करती हैं, लेकिन provider-specific parameters forward नहीं किए जा सकते हैं।
  </Accordion>

  <Accordion title="Catalog और overrides">
    static catalog में वर्तमान में `deepseek-v3.2` और `ernie-5.0-thinking-preview` शामिल हैं। `models.providers.qianfan` जोड़ें या override करें केवल जब आपको custom base URL या model metadata चाहिए।

    <Note>
    Model refs `qianfan/` prefix का उपयोग करते हैं (उदाहरण के लिए `qianfan/deepseek-v3.2`)।
    </Note>

  </Accordion>

  <Accordion title="समस्या निवारण">
    - सुनिश्चित करें कि आपकी API key `bce-v3/ALTAK-` से शुरू होती है और Baidu Cloud console में Qianfan API access सक्षम है।
    - यदि models सूचीबद्ध नहीं हैं, तो पुष्टि करें कि आपके account में Qianfan service सक्रिय है।
    - डिफ़ॉल्ट base URL `https://qianfan.baidubce.com/v2` है। इसे केवल तब बदलें जब आप custom endpoint या proxy का उपयोग करें।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    providers, model refs, और failover behavior चुनना।
  </Card>
  <Card title="Configuration संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    पूरा OpenClaw configuration संदर्भ।
  </Card>
  <Card title="Agent setup" href="/hi/concepts/agent" icon="robot">
    agent defaults और model assignments configure करना।
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    आधिकारिक Qianfan API documentation।
  </Card>
</CardGroup>
