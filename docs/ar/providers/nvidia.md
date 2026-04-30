---
read_when:
    - تريد استخدام النماذج المفتوحة في OpenClaw مجانًا
    - تحتاج إلى إعداد NVIDIA_API_KEY
summary: استخدم واجهة برمجة تطبيقات NVIDIA المتوافقة مع OpenAI في OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T08:21:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

توفر NVIDIA واجهة API متوافقة مع OpenAI على `https://integrate.api.nvidia.com/v1` للنماذج المفتوحة مجانًا. صادِق باستخدام مفتاح API من [build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API في [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="صدّر المفتاح وشغّل الإعداد الأولي">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="عيّن نموذج NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
إذا مررت `--nvidia-api-key` بدلًا من متغير البيئة، فستظهر القيمة في سجل الصدفة ومخرجات `ps`. يُفضّل استخدام متغير البيئة `NVIDIA_API_KEY` عند الإمكان.
</Warning>

للإعداد غير التفاعلي، يمكنك أيضًا تمرير المفتاح مباشرةً:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## مثال إعداد

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

## الكتالوج المدمج

| مرجع النموذج                               | الاسم                        | السياق | الحد الأقصى للمخرجات |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="سلوك التفعيل التلقائي">
    يتفعّل المزوّد تلقائيًا عند تعيين متغير البيئة `NVIDIA_API_KEY`.
    لا يلزم إعداد صريح للمزوّد غير المفتاح.
  </Accordion>

  <Accordion title="الكتالوج والتسعير">
    الكتالوج المضمّن ثابت. تُعيّن التكاليف افتراضيًا إلى `0` في المصدر لأن NVIDIA
    توفر حاليًا وصول API مجانيًا للنماذج المدرجة.
  </Accordion>

  <Accordion title="نقطة نهاية متوافقة مع OpenAI">
    تستخدم NVIDIA نقطة نهاية الإكمالات القياسية `/v1`. ينبغي أن تعمل أي أدوات متوافقة مع OpenAI
    مباشرةً باستخدام عنوان URL الأساسي الخاص بـ NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
نماذج NVIDIA مجانية الاستخدام حاليًا. راجع
[build.nvidia.com](https://build.nvidia.com/) لمعرفة أحدث تفاصيل التوفر وحدود المعدل.
</Tip>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعداد الكامل للوكلاء والنماذج والمزوّدين.
  </Card>
</CardGroup>
