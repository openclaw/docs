---
read_when:
    - आप Synthetic को मॉडल प्रदाता के रूप में उपयोग करना चाहते हैं
    - आपको Synthetic API कुंजी या बेस URL सेटअप की आवश्यकता है
summary: OpenClaw में Synthetic के Anthropic-संगत API का उपयोग करें
title: Synthetic
x-i18n:
    generated_at: "2026-07-19T09:46:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f6cc89a7b837f57555d176ce78e62a39095d4ef0765c96b6b7b93ffebd7388
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) Anthropic-संगत एंडपॉइंट उपलब्ध कराता है।
OpenClaw इसे `synthetic` प्रदाता के रूप में बंडल करता है और Anthropic
Messages API का उपयोग करता है।

| गुण      | मान                                   |
| -------- | ------------------------------------- |
| प्रदाता  | `synthetic`                    |
| प्रमाणीकरण | `SYNTHETIC_API_KEY`                  |
| API      | Anthropic Messages                    |
| बेस URL  | `https://api.synthetic.new/anthropic`                    |

## आरंभ करना

<Steps>
  <Step title="API कुंजी प्राप्त करें">
    अपने Synthetic खाते से `SYNTHETIC_API_KEY` प्राप्त करें, या ऑनबोर्डिंग को
    इसके लिए संकेत देने दें।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="डिफ़ॉल्ट मॉडल सत्यापित करें">
    ऑनबोर्डिंग डिफ़ॉल्ट मॉडल को इस पर सेट करती है:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M3
    ```
  </Step>
</Steps>

<Warning>
OpenClaw का Anthropic क्लाइंट बेस URL में `/v1` स्वचालित रूप से जोड़ता है, इसलिए
`https://api.synthetic.new/anthropic` का उपयोग करें (`/anthropic/v1` का नहीं)। यदि Synthetic
अपना बेस URL बदलता है, तो `models.providers.synthetic.baseUrl` को ओवरराइड करें।
</Warning>

## कॉन्फ़िगरेशन उदाहरण

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M3",
            name: "MiniMax M3",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## अंतर्निहित कैटलॉग

सभी Synthetic मॉडल लागत `0` (इनपुट/आउटपुट/कैश) का उपयोग करते हैं। सेवा की उपलब्धता के लिए Synthetic की
[वर्तमान मॉडल सूची](https://dev.synthetic.new/docs/api/models) देखें।

| मॉडल ID                                            | कॉन्टेक्स्ट विंडो | अधिकतम टोकन | रीजनिंग | इनपुट       |
| --------------------------------------------------- | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M3`                           | 262,144        | 65,536     | हाँ       | टेक्स्ट + इमेज |
| `hf:moonshotai/Kimi-K2.7-Code`                      | 262,144        | 8,192      | हाँ       | टेक्स्ट + इमेज |
| `hf:nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4` | 262,144        | 8,192      | हाँ       | टेक्स्ट       |
| `hf:openai/gpt-oss-120b`                            | 131,072        | 8,192      | हाँ       | टेक्स्ट       |
| `hf:Qwen/Qwen3.6-27B`                               | 262,144        | 81,920     | हाँ       | टेक्स्ट + इमेज |
| `hf:zai-org/GLM-4.7-Flash`                          | 196,608        | 131,072    | हाँ       | टेक्स्ट       |
| `hf:zai-org/GLM-5.2`                                | 524,288        | 131,072    | हाँ       | टेक्स्ट       |

<Tip>
मॉडल रेफ़रेंस `synthetic/<modelId>` प्रारूप का उपयोग करते हैं। आपके
खाते पर उपलब्ध सभी मॉडल देखने के लिए `openclaw models list --provider synthetic` का उपयोग करें।
</Tip>

<AccordionGroup>
  <Accordion title="मॉडल अनुमति-सूची">
    यदि आप मॉडल अनुमति-सूची (`agents.defaults.modelPolicy.allow`) सक्षम करते हैं, तो उपयोग करने की योजना वाले प्रत्येक
    Synthetic मॉडल को जोड़ें। अनुमति-सूची में शामिल न होने वाले मॉडल एजेंट
    से छिपे रहते हैं।
  </Accordion>

  <Accordion title="बेस URL ओवरराइड">
    यदि Synthetic अपना API एंडपॉइंट बदलता है, तो बेस URL को ओवरराइड करें:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    OpenClaw फिर भी `/v1` स्वचालित रूप से जोड़ता है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता नियम, मॉडल रेफ़रेंस और फ़ेलओवर व्यवहार।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाता सेटिंग सहित पूर्ण कॉन्फ़िगरेशन स्कीमा।
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic डैशबोर्ड और API दस्तावेज़।
  </Card>
</CardGroup>
