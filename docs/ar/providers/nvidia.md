---
read_when:
    - تريد استخدام النماذج المفتوحة في OpenClaw مجانًا
    - تحتاج إلى إعداد `NVIDIA_API_KEY`
summary: استخدم API المتوافقة مع OpenAI الخاصة بـ NVIDIA في OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T08:00:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

توفر NVIDIA API متوافقة مع OpenAI عند `https://integrate.api.nvidia.com/v1` لـ
النماذج المفتوحة مجانًا. تتم المصادقة باستخدام مفتاح API من
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## البدء

<Steps>
  <Step title="الحصول على مفتاح API">
    أنشئ مفتاح API من [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="تصدير المفتاح وتشغيل onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="ضبط نموذج NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
إذا مررت القيمة باستخدام `--token` بدلًا من متغير البيئة، فستظهر في سجل shell
وفي مخرجات `ps`. فضّل متغير البيئة `NVIDIA_API_KEY` متى أمكن.
</Warning>

## مثال على الإعداد

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

| مرجع النموذج                               | الاسم                         | السياق   | الحد الأقصى للإخراج |
| ------------------------------------------ | ---------------------------- | -------- | ------------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192               |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192               |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192               |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192               |

## إعداد متقدم

<AccordionGroup>
  <Accordion title="سلوك التمكين التلقائي">
    يتم تمكين الموفّر تلقائيًا عند ضبط متغير البيئة `NVIDIA_API_KEY`.
    ولا يلزم أي إعداد صريح إضافي للموفّر غير المفتاح.
  </Accordion>

  <Accordion title="الكتالوج والأسعار">
    الكتالوج المضمّن ثابت. وتكون التكاليف افتراضيًا `0` في المصدر لأن NVIDIA
    تقدم حاليًا وصول API مجانيًا للنماذج المدرجة.
  </Accordion>

  <Accordion title="نقطة النهاية المتوافقة مع OpenAI">
    تستخدم NVIDIA نقطة النهاية القياسية `/v1` الخاصة بـ completions. لذلك ينبغي لأي
    أدوات متوافقة مع OpenAI أن تعمل مباشرة مع عنوان NVIDIA الأساسي.
  </Accordion>
</AccordionGroup>

<Tip>
تُستخدم نماذج NVIDIA حاليًا مجانًا. تحقق من
[build.nvidia.com](https://build.nvidia.com/) لمعرفة أحدث تفاصيل التوفر
وحدود المعدل.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك failover.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعدادات الكامل للوكلاء والنماذج والموفّرين.
  </Card>
</CardGroup>
