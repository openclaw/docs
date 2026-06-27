---
read_when:
    - تريد استخدام النماذج المفتوحة في OpenClaw مجانًا
    - تحتاج إلى إعداد NVIDIA_API_KEY
    - تريد استخدام Nemotron 3 Ultra عبر NVIDIA
summary: استخدم واجهة برمجة التطبيقات المتوافقة مع OpenAI من NVIDIA في OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:26:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

توفر NVIDIA واجهة API متوافقة مع OpenAI على `https://integrate.api.nvidia.com/v1` للنماذج
المفتوحة مجانًا. صادق باستخدام مفتاح API من
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). يضبط OpenClaw
موفر NVIDIA افتراضيًا على Nemotron 3 Ultra، وهو نموذج الاستدلال النشط من NVIDIA
بإجمالي 550B / و55B نشطًا لعمل الوكلاء ذي السياق الطويل.

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
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
إذا مررت `--nvidia-api-key` بدلًا من متغير البيئة، فستصل القيمة إلى سجل shell
ومخرجات `ps`. يفضل استخدام متغير البيئة `NVIDIA_API_KEY` عندما يكون ذلك
ممكنًا.
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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## الكتالوج المميز

عند تكوين مفتاح NVIDIA API، تحاول مسارات إعداد OpenClaw واختيار النماذج
استخدام كتالوج النماذج العامة المميزة من NVIDIA من
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json`
وتخزن النتيجة المرتبة مؤقتًا لمدة 24 ساعة. لذلك تظهر النماذج المميزة الجديدة من build.nvidia.com
في واجهات الإعداد واختيار النماذج دون انتظار إصدار
OpenClaw. عندما تكون التغذية الحية متاحة، يكون أول نموذج مُعاد هو
الخيار الافتراضي المعروض أثناء إعداد NVIDIA.

يستخدم الجلب سياسة مضيف HTTPS ثابتة لـ `assets.ngc.nvidia.com`. إذا لم يكن
هناك مفتاح NVIDIA API مكوّن، أو إذا كان ذلك الكتالوج العام غير متاح أو
مشوهًا، يعود OpenClaw إلى الكتالوج المضمن والافتراضي المضمن أدناه.

## Nemotron 3 Ultra

Nemotron 3 Ultra هو نموذج NVIDIA الافتراضي في OpenClaw. تعرض صفحة البناء من NVIDIA
لـ
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
أنه نقطة نهاية مجانية متاحة بمواصفة سياق تبلغ 1M رمزًا.
يسجل الكتالوج المضمن حد إخراج أقصى يبلغ 16,384 رمزًا لمطابقة طلب العينة الحالي المتوافق مع OpenAI من NVIDIA
لنقطة النهاية المستضافة.

استخدم Ultra للحصول على أعلى افتراضي NVIDIA من حيث القدرات. أبقِ Super محددًا عندما
تريد خيار Nemotron 3 الأصغر، أو اختر أحد نماذج الجهات الخارجية
المستضافة في كتالوج NVIDIA عندما يكون سياقها أو زمن استجابتها أو سلوكها أنسب.
يرسل صف Ultra المضمن `chat_template_kwargs.enable_thinking: false` و
`force_nonempty_content: true` افتراضيًا حتى يبقى خرج الدردشة العادي في
الإجابة المرئية بدلًا من كشف نص الاستدلال.

## كتالوج الرجوع المضمن

| مرجع النموذج                                  | الاسم                         | السياق   | الحد الأقصى للإخراج | ملاحظات                             |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | الافتراضي                           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192      | رجوع مميز                 |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | رجوع مميز                 |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | رجوع مميز                 |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | رجوع مميز                 |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | مهمل، توافقية الترقية |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | مهمل، توافقية الترقية |

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="سلوك التفعيل التلقائي">
    يتفعل الموفر تلقائيًا عند تعيين متغير البيئة `NVIDIA_API_KEY`.
    لا يلزم تكوين موفر صريح سوى المفتاح.
  </Accordion>

  <Accordion title="الكتالوج والتسعير">
    يفضل OpenClaw كتالوج النماذج العامة المميزة من NVIDIA عند تكوين مصادقة NVIDIA
    ويخزنه مؤقتًا لمدة 24 ساعة. كتالوج الرجوع المضمن ثابت
    ويحافظ على المراجع المشحونة المهملة لتوافقية الترقية. تكون التكاليف افتراضيًا
    `0` في المصدر لأن NVIDIA توفر حاليًا وصول API مجانيًا إلى
    النماذج المدرجة.
  </Accordion>

  <Accordion title="نقطة نهاية متوافقة مع OpenAI">
    تستخدم NVIDIA نقطة نهاية الإكمال القياسية `/v1`. يجب أن تعمل أي أدوات متوافقة مع OpenAI
    مباشرةً مع عنوان URL الأساسي لـ NVIDIA.
  </Accordion>

  <Accordion title="معلمات استدلال Nemotron 3 Ultra">
    يستخدم طلب عينة Ultra من NVIDIA `chat_template_kwargs.enable_thinking`
    و`reasoning_budget` لخرج الاستدلال. يعطل صف Ultra المضمن في OpenClaw
    تفكير القالب افتراضيًا لاستخدام الدردشة العادي. إذا كنت تحتاج إلى
    تفعيل خرج الاستدلال من NVIDIA أو فرض حقول طلب أخرى خاصة بـ NVIDIA،
    فعيّن معلمات لكل نموذج وأبقِ التجاوزات الخاصة بالموفر محصورة
    بنموذج NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` هو تجاوز جسم الطلب النهائي المتوافق مع OpenAI، لذا
    استخدمه فقط للحقول التي توثقها NVIDIA لنقطة النهاية المحددة.

  </Accordion>

  <Accordion title="استجابات الموفر المخصص البطيئة">
    قد تستغرق بعض النماذج المخصصة المستضافة لدى NVIDIA وقتًا أطول من مراقب خمول النموذج الافتراضي
    قبل أن تطلق أول جزء من الاستجابة. لإدخالات موفر NVIDIA المخصصة،
    ارفع مهلة الموفر بدلًا من رفع مهلة تشغيل الوكيل
    بالكامل:

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
[build.nvidia.com](https://build.nvidia.com/) لمعرفة أحدث تفاصيل التوفر وحدود المعدل.
</Tip>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع التكوين الكامل للوكلاء والنماذج والموفرين.
  </Card>
</CardGroup>
