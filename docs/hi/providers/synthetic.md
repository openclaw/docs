---
read_when:
    - आप Synthetic को मॉडल प्रदाता के रूप में उपयोग करना चाहते हैं
    - आपको Synthetic API कुंजी या बेस URL सेटअप की आवश्यकता है
summary: OpenClaw में Synthetic के Anthropic-संगत API का उपयोग करें
title: Synthetic
x-i18n:
    generated_at: "2026-07-16T17:02:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) Anthropic-संगत एंडपॉइंट उपलब्ध कराता है।
OpenClaw इसे `synthetic` प्रदाता के रूप में बंडल करता है और Anthropic
Messages API का उपयोग करता है।

| प्रॉपर्टी | मान                                   |
| -------- | ------------------------------------- |
| प्रदाता | `synthetic`                           |
| प्रमाणीकरण | `SYNTHETIC_API_KEY`                   |
| API      | Anthropic Messages                    |
| बेस URL | `https://api.synthetic.new/anthropic` |

## आरंभ करना

<Steps>
  <Step title="API कुंजी प्राप्त करें">
    अपने Synthetic खाते से `SYNTHETIC_API_KEY` प्राप्त करें, या ऑनबोर्डिंग को
    आपसे इसके लिए पूछने दें।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="डिफ़ॉल्ट मॉडल सत्यापित करें">
    ऑनबोर्डिंग डिफ़ॉल्ट मॉडल को इस पर सेट करती है:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw का Anthropic क्लाइंट बेस URL में `/v1` अपने-आप जोड़ता है, इसलिए
`https://api.synthetic.new/anthropic` का उपयोग करें (`/anthropic/v1` का नहीं)। यदि Synthetic
अपना बेस URL बदलता है, तो `models.providers.synthetic.baseUrl` को ओवरराइड करें।
</Warning>

## कॉन्फ़िगरेशन उदाहरण

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
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
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## अंतर्निहित कैटलॉग

सभी Synthetic मॉडल लागत `0` (इनपुट/आउटपुट/कैश) का उपयोग करते हैं।

| मॉडल ID                                               | कॉन्टेक्स्ट विंडो | अधिकतम टोकन | रीजनिंग | इनपुट        |
| ------------------------------------------------------ | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536     | नहीं        | टेक्स्ट         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192      | हाँ       | टेक्स्ट         |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000    | नहीं        | टेक्स्ट         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192      | हाँ       | टेक्स्ट + छवि |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192      | नहीं        | टेक्स्ट + छवि |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000    | नहीं        | टेक्स्ट         |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000    | नहीं        | टेक्स्ट         |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000    | हाँ       | टेक्स्ट + छवि |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192      | नहीं        | टेक्स्ट         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192      | हाँ       | टेक्स्ट         |

<Tip>
मॉडल संदर्भ `synthetic/<modelId>` प्रारूप का उपयोग करते हैं। अपने
खाते पर उपलब्ध सभी मॉडल देखने के लिए `openclaw models list --provider synthetic` का उपयोग करें।
</Tip>

<AccordionGroup>
  <Accordion title="मॉडल अनुमति-सूची">
    यदि आप मॉडल अनुमति-सूची (`agents.defaults.models`) सक्षम करते हैं, तो उपयोग की योजना वाले प्रत्येक
    Synthetic मॉडल को जोड़ें। अनुमति-सूची में शामिल न होने वाले मॉडल एजेंट से छिपे
    रहते हैं।
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

    OpenClaw अब भी `/v1` अपने-आप जोड़ता है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता नियम, मॉडल संदर्भ और फ़ेलओवर व्यवहार।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाता सेटिंग सहित पूर्ण कॉन्फ़िगरेशन स्कीमा।
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic डैशबोर्ड और API दस्तावेज़।
  </Card>
</CardGroup>
