---
read_when:
    - تريد تشغيل OpenClaw باستخدام خادم SGLang محلي
    - تريد نقاط نهاية ‎/v1‎ المتوافقة مع OpenAI باستخدام نماذجك الخاصة
summary: شغّل OpenClaw باستخدام SGLang (خادم مستضاف ذاتيًا ومتوافق مع OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T06:24:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

تتيح SGLang نماذج ذات أوزان مفتوحة عبر واجهة HTTP API متوافقة مع OpenAI. يتصل OpenClaw بـ SGLang باستخدام عائلة المزوّد `openai-completions` مع الاكتشاف التلقائي للنماذج المتاحة.

| الخاصية                  | القيمة                                                        |
| ------------------------- | ------------------------------------------------------------ |
| معرّف المزوّد               | `sglang`                                                     |
| Plugin                    | مضمّن، `enabledByDefault: true`                            |
| متغير بيئة المصادقة              | `SGLANG_API_KEY` (أي قيمة غير فارغة إذا كان الخادم بلا مصادقة) |
| خيار الإعداد الأولي           | `--auth-choice sglang`                                       |
| API                       | متوافقة مع OpenAI ‏(`openai-completions`)                     |
| عنوان URL الأساسي الافتراضي          | `http://127.0.0.1:30000/v1`                                  |
| العنصر النائب للنموذج الافتراضي | `sglang/Qwen/Qwen3-8B`                                       |
| استخدام البث التدفقي           | نعم (`supportsStreamingUsage: true`)                         |
| التسعير                   | معلّم بوصفه خارجيًا مجانيًا (`modelPricing.external: false`)        |

يكتشف OpenClaw أيضًا النماذج المتاحة من SGLang **تلقائيًا** عند الاشتراك باستخدام `SGLANG_API_KEY`. استخدم `sglang/*` في `agents.defaults.models` لإبقاء الاكتشاف ديناميكيًا عند تهيئة عنوان URL أساسي مخصص لـ SGLang أيضًا. راجع [اكتشاف النماذج (المزوّد الضمني)](#model-discovery-implicit-provider) أدناه.

## بدء الاستخدام

<Steps>
  <Step title="تشغيل SGLang">
    شغّل SGLang مع خادم متوافق مع OpenAI. يجب أن يوفّر عنوان URL الأساسي
    نقاط نهاية `/v1` (مثل `/v1/models` و`/v1/chat/completions`). تعمل SGLang
    عادةً على:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="تعيين مفتاح API">
    تصلح أي قيمة إذا لم تُهيّأ المصادقة على خادمك:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="تشغيل الإعداد الأولي أو تعيين نموذج مباشرةً">
    ```bash
    openclaw onboard
    ```

    أو هيّئ النموذج يدويًا:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## اكتشاف النماذج (المزوّد الضمني)

عند تعيين `SGLANG_API_KEY` (أو وجود ملف تعريف للمصادقة) و**عدم**
تعريف `models.providers.sglang`، يستعلم OpenClaw عن:

- `GET http://127.0.0.1:30000/v1/models`

ويحوّل المعرّفات المُعادة إلى إدخالات نماذج.

<Note>
إذا عيّنت `models.providers.sglang` صراحةً، فسيستخدم OpenClaw نماذجك المعلنة
افتراضيًا. أضف `"sglang/*": {}` إلى `agents.defaults.models` عندما تريد
من OpenClaw الاستعلام عن نقطة النهاية `/models` لذلك المزوّد المُهيّأ وتضمين
جميع نماذج SGLang المُعلن عنها.
</Note>

## التهيئة الصريحة (النماذج اليدوية)

استخدم التهيئة الصريحة عندما:

- تعمل SGLang على مضيف أو منفذ مختلف.
- تريد تثبيت قيم `contextWindow`/`maxTokens`.
- يتطلب خادمك مفتاح API حقيقيًا (أو تريد التحكم في الترويسات).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="السلوك على نمط الوكيل">
    تُعامل SGLang كواجهة خلفية `/v1` على نمط الوكيل ومتوافقة مع OpenAI، وليست
    نقطة نهاية أصلية لـ OpenAI.

    | السلوك | SGLang |
    |----------|--------|
    | تشكيل الطلبات الخاص بـ OpenAI فقط | غير مطبّق |
    | `service_tier`، و`store` في Responses، وتلميحات ذاكرة التخزين المؤقت للموجّهات | لا تُرسل |
    | تشكيل الحمولة المتوافق مع الاستدلال | غير مطبّق |
    | ترويسات الإسناد المخفية (`originator` و`version` و`User-Agent`) | لا تُحقن في عناوين URL الأساسية المخصصة لـ SGLang |

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    **يتعذر الوصول إلى الخادم**

    تحقّق من أن الخادم يعمل ويستجيب:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **أخطاء المصادقة**

    إذا فشلت الطلبات بسبب أخطاء المصادقة، فعيّن قيمة حقيقية لـ `SGLANG_API_KEY` تطابق
    تهيئة خادمك، أو هيّئ المزوّد صراحةً ضمن
    `models.providers.sglang`.

    <Tip>
    إذا شغّلت SGLang من دون مصادقة، فتكفي أي قيمة غير فارغة لـ
    `SGLANG_API_KEY` للاشتراك في اكتشاف النماذج.
    </Tip>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التهيئة الكامل، بما في ذلك إدخالات المزوّدين.
  </Card>
</CardGroup>
