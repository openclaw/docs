---
read_when:
    - تريد استخدام Synthetic كموفّر للنماذج
    - تحتاج إلى مفتاح Synthetic API أو إعداد عنوان URL أساسي
summary: استخدام واجهة API المتوافقة مع Anthropic من Synthetic في OpenClaw
title: اصطناعي
x-i18n:
    generated_at: "2026-07-12T06:29:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) يوفّر نقاط نهاية متوافقة مع Anthropic.
يدمجه OpenClaw بصفته المزوّد `synthetic` ويستخدم واجهة Anthropic
Messages API.

| الخاصية | القيمة                                 |
| -------- | ------------------------------------- |
| المزوّد | `synthetic`                           |
| المصادقة | `SYNTHETIC_API_KEY`                   |
| واجهة API | Anthropic Messages                    |
| عنوان URL الأساسي | `https://api.synthetic.new/anthropic` |

## البدء

<Steps>
  <Step title="الحصول على مفتاح API">
    احصل على `SYNTHETIC_API_KEY` من حسابك في Synthetic، أو دع عملية الإعداد
    تطلبه منك.
  </Step>
  <Step title="تشغيل الإعداد">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="التحقق من النموذج الافتراضي">
    تضبط عملية الإعداد النموذج الافتراضي على:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
يضيف عميل Anthropic في OpenClaw المسار `/v1` إلى عنوان URL الأساسي تلقائيًا، لذا استخدم
`https://api.synthetic.new/anthropic` (وليس `/anthropic/v1`). إذا غيّرت Synthetic
عنوان URL الأساسي، فتجاوز `models.providers.synthetic.baseUrl`.
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

تستخدم جميع نماذج Synthetic تكلفة `0` (للإدخال/الإخراج/ذاكرة التخزين المؤقت).

| معرّف النموذج                                               | نافذة السياق | الحد الأقصى للرموز | الاستدلال | الإدخال        |
| ------------------------------------------------------ | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536     | لا        | نص         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192      | نعم       | نص         |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000    | لا        | نص         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192      | لا        | نص         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192      | لا        | نص         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192      | لا        | نص         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192      | لا        | نص         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192      | لا        | نص         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192      | لا        | نص         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192      | لا        | نص         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192      | لا        | نص         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192      | نعم       | نص + صورة |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192      | لا        | نص         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192      | لا        | نص         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192      | لا        | نص         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192      | لا        | نص + صورة |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000    | لا        | نص         |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000    | لا        | نص         |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000    | نعم       | نص + صورة |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192      | لا        | نص         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192      | نعم       | نص         |

<Tip>
تستخدم مراجع النماذج الصيغة `synthetic/<modelId>`. استخدم
`openclaw models list --provider synthetic` للاطلاع على جميع النماذج المتاحة في
حسابك.
</Tip>

<AccordionGroup>
  <Accordion title="قائمة النماذج المسموح بها">
    إذا فعّلت قائمة نماذج مسموحًا بها (`agents.defaults.models`)، فأضف كل
    نموذج من Synthetic تخطط لاستخدامه. تُخفى النماذج غير المدرجة في قائمة السماح
    عن الوكيل.
  </Accordion>

  <Accordion title="تجاوز عنوان URL الأساسي">
    إذا غيّرت Synthetic نقطة نهاية API الخاصة بها، فتجاوز عنوان URL الأساسي:

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

    يظل OpenClaw يضيف `/v1` تلقائيًا.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    قواعد المزوّدين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعداد الكامل، بما في ذلك إعدادات المزوّدين.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    لوحة تحكم Synthetic ووثائق API.
  </Card>
</CardGroup>
