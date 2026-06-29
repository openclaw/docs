---
read_when:
    - आप Synthetic को मॉडल प्रदाता के रूप में उपयोग करना चाहते हैं
    - आपको एक Synthetic API कुंजी या बेस URL सेटअप की आवश्यकता है
summary: OpenClaw में Synthetic के Anthropic-संगत API का उपयोग करें
title: कृत्रिम
x-i18n:
    generated_at: "2026-06-29T00:03:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) Anthropic-संगत एंडपॉइंट्स उपलब्ध कराता है।
OpenClaw इसे `synthetic` provider के रूप में पंजीकृत करता है और Anthropic
Messages API का उपयोग करता है।

| गुण | मान                                   |
| -------- | ------------------------------------- |
| Provider | `synthetic`                           |
| Auth     | `SYNTHETIC_API_KEY`                   |
| API      | Anthropic Messages                    |
| बेस URL | `https://api.synthetic.new/anthropic` |

## शुरू करना

<Steps>
  <Step title="API कुंजी प्राप्त करें">
    अपने Synthetic खाते से `SYNTHETIC_API_KEY` प्राप्त करें, या ऑनबोर्डिंग
    विज़ार्ड को आपसे एक कुंजी मांगने दें।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएं">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="डिफ़ॉल्ट मॉडल सत्यापित करें">
    ऑनबोर्डिंग के बाद डिफ़ॉल्ट मॉडल इस पर सेट होता है:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw का Anthropic क्लाइंट बेस URL में अपने आप `/v1` जोड़ता है, इसलिए
`https://api.synthetic.new/anthropic` का उपयोग करें (`/anthropic/v1` नहीं)। अगर Synthetic
अपना बेस URL बदलता है, तो `models.providers.synthetic.baseUrl` ओवरराइड करें।
</Warning>

## कॉन्फ़िग उदाहरण

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

| मॉडल ID                                               | संदर्भ विंडो | अधिकतम टोकन | रीजनिंग | इनपुट        |
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
मॉडल refs `synthetic/<modelId>` रूप का उपयोग करते हैं। अपने खाते पर उपलब्ध सभी
मॉडल देखने के लिए `openclaw models list --provider synthetic` का उपयोग करें।
</Tip>

<AccordionGroup>
  <Accordion title="मॉडल allowlist">
    अगर आप मॉडल allowlist (`agents.defaults.models`) सक्षम करते हैं, तो वह हर
    Synthetic मॉडल जोड़ें जिसे आप उपयोग करने की योजना बनाते हैं। allowlist में नहीं मौजूद मॉडल
    agent से छिपा दिए जाएंगे।
  </Accordion>

  <Accordion title="बेस URL ओवरराइड">
    अगर Synthetic अपना API एंडपॉइंट बदलता है, तो अपने कॉन्फ़िग में बेस URL ओवरराइड करें:

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

    याद रखें कि OpenClaw अपने आप `/v1` जोड़ता है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    Provider नियम, मॉडल refs, और failover व्यवहार।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    provider सेटिंग्स सहित पूरा कॉन्फ़िग schema।
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic डैशबोर्ड और API दस्तावेज़।
  </Card>
</CardGroup>
