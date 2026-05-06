---
read_when:
    - تريد تشغيل OpenClaw مع خادم SGLang محلي
    - تريد نقاط نهاية /v1 متوافقة مع OpenAI باستخدام نماذجك الخاصة
summary: تشغيل OpenClaw باستخدام SGLang (خادم مستضاف ذاتيًا متوافق مع OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-06T08:11:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

يقدّم SGLang نماذج مفتوحة الأوزان عبر واجهة HTTP API متوافقة مع OpenAI. يتصل OpenClaw بـ SGLang باستخدام عائلة المزوّد `openai-completions` مع الاكتشاف التلقائي للنماذج المتاحة.

| الخاصية                  | القيمة                                                        |
| ------------------------- | ------------------------------------------------------------ |
| معرّف المزوّد               | `sglang`                                                     |
| Plugin                    | مضمّن، `enabledByDefault: true`                            |
| متغيّر بيئة المصادقة              | `SGLANG_API_KEY` (أي قيمة غير فارغة إذا لم تكن لدى الخادم مصادقة) |
| علم التهيئة           | `--auth-choice sglang`                                       |
| API                       | متوافق مع OpenAI (`openai-completions`)                     |
| عنوان URL الأساسي الافتراضي          | `http://127.0.0.1:30000/v1`                                  |
| عنصر نائب للنموذج الافتراضي | `sglang/Qwen/Qwen3-8B`                                       |
| استخدام البث           | نعم (`supportsStreamingUsage: true`)                         |
| التسعير                   | معلّم كخارجي مجاني (`modelPricing.external: false`)        |

يقوم OpenClaw أيضًا **باكتشاف** النماذج المتاحة تلقائيًا من SGLang عند الاشتراك باستخدام `SGLANG_API_KEY` وعدم تعريف إدخال `models.providers.sglang` صريح — راجع [اكتشاف النموذج (مزوّد ضمني)](#model-discovery-implicit-provider) أدناه.

## البدء

<Steps>
  <Step title="بدء SGLang">
    شغّل SGLang باستخدام خادم متوافق مع OpenAI. يجب أن يكشف عنوان URL الأساسي
    نقاط نهاية `/v1` (على سبيل المثال `/v1/models` و`/v1/chat/completions`). يعمل SGLang
    غالبًا على:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="تعيين مفتاح API">
    تعمل أي قيمة إذا لم تتم تهيئة المصادقة على الخادم لديك:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="تشغيل التهيئة أو تعيين نموذج مباشرة">
    ```bash
    openclaw onboard
    ```

    أو قم بتهيئة النموذج يدويًا:

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

## اكتشاف النموذج (مزوّد ضمني)

عند تعيين `SGLANG_API_KEY` (أو وجود ملف مصادقة) و**عدم**
تعريف `models.providers.sglang`، سيستعلم OpenClaw عن:

- `GET http://127.0.0.1:30000/v1/models`

ويحوّل المعرّفات المُعادة إلى إدخالات نماذج.

<Note>
إذا عيّنت `models.providers.sglang` صراحةً، فسيتم تخطي الاكتشاف التلقائي و
يجب عليك تعريف النماذج يدويًا.
</Note>

## التهيئة الصريحة (النماذج اليدوية)

استخدم التهيئة الصريحة عندما:

- يعمل SGLang على مضيف/منفذ مختلف.
- تريد تثبيت قيم `contextWindow`/`maxTokens`.
- يتطلب خادمك مفتاح API حقيقيًا (أو تريد التحكم في الرؤوس).

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
  <Accordion title="سلوك نمط الوكيل">
    يُعامل SGLang كواجهة خلفية `/v1` متوافقة مع OpenAI وبنمط الوكيل، وليس كنقطة نهاية
    OpenAI أصلية.

    | السلوك | SGLang |
    |----------|--------|
    | تشكيل طلبات OpenAI فقط | لا يُطبّق |
    | تلميحات `service_tier` و`store` في Responses وذاكرة التخزين المؤقت للمطالبة | لا تُرسل |
    | تشكيل الحمولة المتوافق مع الاستدلال | لا يُطبّق |
    | رؤوس الإسناد المخفية (`originator` و`version` و`User-Agent`) | لا تُحقن في عناوين URL أساسية مخصصة لـ SGLang |

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    **الخادم غير قابل للوصول**

    تحقّق من أن الخادم يعمل ويستجيب:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **أخطاء المصادقة**

    إذا فشلت الطلبات بسبب أخطاء مصادقة، فعيّن `SGLANG_API_KEY` حقيقيًا يطابق
    تهيئة خادمك، أو قم بتهيئة المزوّد صراحةً ضمن
    `models.providers.sglang`.

    <Tip>
    إذا كنت تشغّل SGLang من دون مصادقة، فإن أي قيمة غير فارغة لـ
    `SGLANG_API_KEY` تكفي للاشتراك في اكتشاف النماذج.
    </Tip>

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التهيئة الكامل بما في ذلك إدخالات المزوّدين.
  </Card>
</CardGroup>
