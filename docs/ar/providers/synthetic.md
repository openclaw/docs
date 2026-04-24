---
read_when:
    - تريد استخدام Synthetic بوصفه موفر نماذج
    - تحتاج إلى مفتاح API أو إعداد base URL لـ Synthetic_北京pkanalysis to=functions.read  海南天天中彩票json 21 0 2000 {"path":"/home/runner/work/docs/docs/source/.i18n/glossary.ar.json"}
summary: استخدم API المتوافقة مع Anthropic الخاصة بـ Synthetic في OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-24T08:01:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 15
---

[توفر Synthetic](https://synthetic.new) نقاط نهاية متوافقة مع Anthropic.
يسجلها OpenClaw بوصفها الموفر `synthetic` ويستخدم
Anthropic Messages API.

| الخاصية | القيمة                                |
| ------- | ------------------------------------- |
| الموفّر | `synthetic`                           |
| المصادقة | `SYNTHETIC_API_KEY`                  |
| API     | Anthropic Messages                    |
| Base URL | `https://api.synthetic.new/anthropic` |

## البدء

<Steps>
  <Step title="الحصول على مفتاح API">
    احصل على `SYNTHETIC_API_KEY` من حسابك في Synthetic، أو دع
    معالج onboarding يطلبه منك.
  </Step>
  <Step title="تشغيل onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="التحقق من النموذج الافتراضي">
    بعد onboarding يتم ضبط النموذج الافتراضي على:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
يقوم عميل Anthropic في OpenClaw بإلحاق `/v1` إلى base URL تلقائيًا، لذا استخدم
`https://api.synthetic.new/anthropic` ‏(وليس `/anthropic/v1`). وإذا غيّرت Synthetic
عنوان base URL، فجاوز `models.providers.synthetic.baseUrl`.
</Warning>

## مثال على الإعداد

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

## الكتالوج المضمّن

تستخدم جميع نماذج Synthetic التكلفة `0` ‏(إدخال/إخراج/ذاكرة مؤقتة).

| معرّف النموذج                                          | نافذة السياق | الحد الأقصى للرموز | التفكير | الإدخال       |
| ------------------------------------------------------ | ------------ | ------------------ | ------- | ------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000      | 65,536             | لا      | نص            |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000      | 8,192              | نعم     | نص            |
| `hf:zai-org/GLM-4.7`                                   | 198,000      | 128,000            | لا      | نص            |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000      | 8,192              | لا      | نص            |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000      | 8,192              | لا      | نص            |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000      | 8,192              | لا      | نص            |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000      | 8,192              | لا      | نص            |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000      | 8,192              | لا      | نص            |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000      | 8,192              | لا      | نص            |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000      | 8,192              | لا      | نص            |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000      | 8,192              | لا      | نص            |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000      | 8,192              | نعم     | نص + صورة     |
| `hf:openai/gpt-oss-120b`                               | 128,000      | 8,192              | لا      | نص            |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000      | 8,192              | لا      | نص            |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000      | 8,192              | لا      | نص            |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000      | 8,192              | لا      | نص + صورة     |
| `hf:zai-org/GLM-4.5`                                   | 128,000      | 128,000            | لا      | نص            |
| `hf:zai-org/GLM-4.6`                                   | 198,000      | 128,000            | لا      | نص            |
| `hf:zai-org/GLM-5`                                     | 256,000      | 128,000            | نعم     | نص + صورة     |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000      | 8,192              | لا      | نص            |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000      | 8,192              | نعم     | نص            |

<Tip>
تستخدم مراجع النماذج الصيغة `synthetic/<modelId>`. استخدم
`openclaw models list --provider synthetic` لرؤية جميع النماذج المتاحة في
حسابك.
</Tip>

<AccordionGroup>
  <Accordion title="قائمة سماح النماذج">
    إذا قمت بتمكين قائمة سماح للنماذج (`agents.defaults.models`)، فأضف كل
    نموذج Synthetic تخطط لاستخدامه. سيتم إخفاء النماذج غير الموجودة في قائمة السماح
    عن الوكيل.
  </Accordion>

  <Accordion title="تجاوز Base URL">
    إذا غيّرت Synthetic نقطة نهاية API الخاصة بها، فجاوز base URL في إعداداتك:

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

    تذكّر أن OpenClaw يضيف `/v1` تلقائيًا.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    قواعد الموفّر ومراجع النماذج وسلوك failover.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعدادات الكامل بما في ذلك إعدادات الموفّر.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    لوحة تحكم Synthetic ووثائق API.
  </Card>
</CardGroup>
