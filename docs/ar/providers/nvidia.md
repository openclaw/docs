---
read_when:
    - تريد استخدام النماذج المفتوحة في OpenClaw مجانًا
    - تحتاج إلى إعداد NVIDIA_API_KEY
summary: استخدم واجهة برمجة التطبيقات المتوافقة مع OpenAI الخاصة بـ NVIDIA في OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:28:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

توفر NVIDIA واجهة API متوافقة مع OpenAI على `https://integrate.api.nvidia.com/v1` للنماذج المفتوحة مجانًا. صادِق باستخدام مفتاح API من [build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## البدء

<Steps>
  <Step title="Get your API key">
    أنشئ مفتاح API في [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
إذا مررت `--nvidia-api-key` بدلًا من متغير البيئة، فستظهر القيمة في سجل الصدفة ومخرجات `ps`. فضّل متغير البيئة `NVIDIA_API_KEY` عندما يكون ذلك ممكنًا.
</Warning>

للإعداد غير التفاعلي، يمكنك أيضًا تمرير المفتاح مباشرةً:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## مثال على التكوين

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## الكتالوج المضمّن

| مرجع النموذج                               | الاسم                        | السياق | أقصى مخرجات |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    يتم تفعيل المزوّد تلقائيًا عند ضبط متغير البيئة `NVIDIA_API_KEY`.
    لا يلزم أي تكوين صريح للمزوّد سوى المفتاح.
  </Accordion>

  <Accordion title="Catalog and pricing">
    الكتالوج المجمّع ثابت. تُضبط التكاليف افتراضيًا على `0` في المصدر لأن NVIDIA
    توفر حاليًا وصولًا مجانيًا إلى API للنماذج المدرجة.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    تستخدم NVIDIA نقطة نهاية الإكمال القياسية `/v1`. يجب أن تعمل أي أدوات متوافقة مع OpenAI
    مباشرةً مع عنوان URL الأساسي من NVIDIA.
  </Accordion>

  <Accordion title="Slow custom provider responses">
    قد تستغرق بعض النماذج المخصصة المستضافة لدى NVIDIA وقتًا أطول من مراقب خمول النموذج الافتراضي
    قبل أن تصدر أول جزء من الاستجابة. بالنسبة إلى إدخالات مزوّد NVIDIA المخصصة،
    ارفع مهلة المزوّد بدلًا من رفع مهلة تشغيل الوكيل بالكامل:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
نماذج NVIDIA مجانية الاستخدام حاليًا. راجع
[build.nvidia.com](https://build.nvidia.com/) للحصول على أحدث تفاصيل التوفر وحدود المعدّل.
</Tip>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع التكوين الكامل للوكلاء، والنماذج، والمزوّدين.
  </Card>
</CardGroup>
