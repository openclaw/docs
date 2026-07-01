---
read_when:
    - تريد استخدام النماذج المفتوحة في OpenClaw مجانًا
    - تحتاج إلى إعداد NVIDIA_API_KEY
    - تريد استخدام Nemotron 3 Ultra عبر NVIDIA
summary: استخدم واجهة API المتوافقة مع OpenAI من NVIDIA في OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:22:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

توفّر NVIDIA واجهة API متوافقة مع OpenAI على `https://integrate.api.nvidia.com/v1` للنماذج المفتوحة مجانًا. صادِق باستخدام مفتاح API من [build.nvidia.com](https://build.nvidia.com/settings/api-keys). يضبط OpenClaw موفّر NVIDIA افتراضيًا على Nemotron 3 Ultra، وهو نموذج الاستدلال النشط من NVIDIA بإجمالي 550B / نشط 55B لأعمال الوكلاء ذات السياق الطويل.

## البدء

<Steps>
  <Step title="احصل على مفتاح API">
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
إذا مرّرت `--nvidia-api-key` بدلًا من متغير البيئة، فستظهر القيمة في سجل الصَدَفة ومخرجات `ps`. فضّل استخدام متغير البيئة `NVIDIA_API_KEY` عندما يكون ذلك ممكنًا.
</Warning>

للإعداد غير التفاعلي، يمكنك أيضًا تمرير المفتاح مباشرةً:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## مثال على الإعدادات

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

## الكتالوج المميّز

عند إعداد مفتاح API من NVIDIA، تحاول مسارات إعداد OpenClaw واختيار النماذج استخدام كتالوج النماذج المميّزة العام من NVIDIA من `https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` وتخزّن النتيجة المرتبة مؤقتًا لمدة 24 ساعة. لذلك تظهر النماذج المميّزة الجديدة من build.nvidia.com في أسطح الإعداد واختيار النماذج دون انتظار إصدار OpenClaw. عندما تكون التغذية المباشرة متاحة، يكون أول نموذج مُعاد هو الخيار الافتراضي المعروض أثناء إعداد NVIDIA.

يستخدم الجلب سياسة مضيف HTTPS ثابتة لـ `assets.ngc.nvidia.com`. إذا لم يكن مفتاح API من NVIDIA مُعدًا، أو إذا كان ذلك الكتالوج العام غير متاح أو سيئ التكوين، يعود OpenClaw إلى الكتالوج المضمّن والافتراضي المضمّن أدناه.

## Nemotron 3 Ultra

Nemotron 3 Ultra هو نموذج NVIDIA الافتراضي في OpenClaw. تدرج صفحة البناء الخاصة بـ NVIDIA لـ [`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b) أنه نقطة نهاية مجانية متاحة بمواصفة سياق قدرها 1M رمز مميّز. يسجّل الكتالوج المضمّن حدًا أقصى للمخرجات يبلغ 16,384 رمزًا مميّزًا لمطابقة طلب العينة الحالي المتوافق مع OpenAI من NVIDIA لنقطة النهاية المستضافة.

استخدم Ultra للحصول على افتراضي NVIDIA الأعلى قدرة. أبقِ Super محددًا عندما تريد خيار Nemotron 3 الأصغر، أو اختر أحد نماذج الجهات الخارجية المستضافة في كتالوج NVIDIA عندما يكون سياقه أو زمن استجابته أو سلوكه أنسب. يرسل صف Ultra المضمّن `chat_template_kwargs.enable_thinking: false` و`force_nonempty_content: true` افتراضيًا بحيث تبقى مخرجات الدردشة العادية في الإجابة المرئية بدلًا من كشف نص الاستدلال.

## كتالوج الرجوع المضمّن

| مرجع النموذج                                | الاسم                        | السياق    | الحد الأقصى للمخرجات | ملاحظات                          |
| ------------------------------------------ | ---------------------------- | --------- | -------------------- | -------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384               | الافتراضي                        |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192                | رجوع مميّز                       |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192                | رجوع مميّز                       |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192                | رجوع مميّز                       |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192                | رجوع مميّز                       |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192                | مهمل، توافق الترقية              |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192                | مهمل، توافق الترقية              |

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="سلوك التفعيل التلقائي">
    يتفعّل الموفّر تلقائيًا عند تعيين متغير البيئة `NVIDIA_API_KEY`. لا يلزم إعداد موفّر صريح بخلاف المفتاح.
  </Accordion>

  <Accordion title="الكتالوج والتسعير">
    يفضّل OpenClaw كتالوج النماذج المميّزة العام من NVIDIA عندما تكون مصادقة NVIDIA مُعدّة، ويخزّنه مؤقتًا لمدة 24 ساعة. كتالوج الرجوع المضمّن ثابت ويحتفظ بالمراجع المشحونة المهملة لتوافق الترقية. تكون التكاليف افتراضيًا `0` في المصدر لأن NVIDIA توفّر حاليًا وصول API مجانيًا للنماذج المدرجة.
  </Accordion>

  <Accordion title="نقطة نهاية متوافقة مع OpenAI">
    تستخدم NVIDIA نقطة نهاية الإكمال القياسية `/v1`. يجب أن تعمل أي أدوات متوافقة مع OpenAI مباشرةً باستخدام عنوان URL الأساسي من NVIDIA.
  </Accordion>

  <Accordion title="معاملات استدلال Nemotron 3 Ultra">
    يستخدم طلب عينة Ultra من NVIDIA `chat_template_kwargs.enable_thinking` و`reasoning_budget` لمخرجات الاستدلال. يعطّل صف Ultra المضمّن في OpenClaw التفكير عبر القالب افتراضيًا لاستخدام الدردشة العادي. إذا احتجت إلى الاشتراك في مخرجات الاستدلال من NVIDIA أو فرض حقول طلب أخرى خاصة بـ NVIDIA، فعيّن معاملات لكل نموذج وأبقِ التجاوزات الخاصة بالموفّر محصورة في نموذج NVIDIA:

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

    `params.extra_body` هو تجاوز جسم الطلب النهائي المتوافق مع OpenAI، لذا استخدمه فقط للحقول التي توثقها NVIDIA لنقطة النهاية المحددة.

  </Accordion>

  <Accordion title="استجابات موفّر مخصص بطيئة">
    قد تستغرق بعض النماذج المخصصة المستضافة لدى NVIDIA وقتًا أطول من مراقب خمول النموذج الافتراضي قبل أن تُصدر أول جزء من الاستجابة. لإدخالات موفّر NVIDIA المخصص، ارفع مهلة الموفّر بدلًا من رفع مهلة تشغيل الوكيل بالكامل:

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
نماذج NVIDIA مجانية الاستخدام حاليًا. راجع [build.nvidia.com](https://build.nvidia.com/) للحصول على أحدث تفاصيل التوفر وحدود المعدلات.
</Tip>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعدادات الكامل للوكلاء والنماذج والموفّرين.
  </Card>
</CardGroup>
