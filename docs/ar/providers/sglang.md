---
read_when:
    - تريد تشغيل OpenClaw مقابل خادم SGLang محلي
    - تريد نقاط نهاية `/v1` المتوافقة مع OpenAI مع نماذجك الخاصة
summary: تشغيل OpenClaw مع SGLang ‏(خادم مستضاف ذاتيًا ومتوافق مع OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-24T08:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

يمكن لـ SGLang خدمة النماذج مفتوحة المصدر عبر واجهة HTTP **متوافقة مع OpenAI**.
ويمكن لـ OpenClaw الاتصال بـ SGLang باستخدام واجهة `openai-completions` API.

يمكن لـ OpenClaw أيضًا **اكتشاف النماذج المتاحة تلقائيًا** من SGLang عندما تشترك
في ذلك باستخدام `SGLANG_API_KEY` ‏(أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة)
ولا تقوم بتعريف إدخال صريح لـ `models.providers.sglang`.

يتعامل OpenClaw مع `sglang` باعتباره provider محليًا ومتوافقًا مع OpenAI
ويدعم محاسبة الاستخدام المتدفق، بحيث يمكن تحديث عدادات الحالة/رموز السياق من
استجابات `stream_options.include_usage`.

## البدء

<Steps>
  <Step title="ابدأ SGLang">
    شغّل SGLang باستخدام خادم متوافق مع OpenAI. يجب أن يكشف base URL لديك عن
    نقاط نهاية `/v1` ‏(مثل `/v1/models` و`/v1/chat/completions`). وغالبًا ما يعمل SGLang على:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="اضبط مفتاح API">
    تعمل أي قيمة إذا لم يتم ضبط المصادقة على خادمك:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="شغّل onboarding أو اضبط نموذجًا مباشرة">
    ```bash
    openclaw onboard
    ```

    أو اضبط النموذج يدويًا:

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

## اكتشاف النماذج (provider ضمني)

عندما يتم ضبط `SGLANG_API_KEY` ‏(أو يوجد ملف تعريف مصادقة) و**لا**
تقوم بتعريف `models.providers.sglang`، سيقوم OpenClaw بالاستعلام عن:

- `GET http://127.0.0.1:30000/v1/models`

ثم يحوّل المعرّفات المعادة إلى إدخالات نماذج.

<Note>
إذا قمت بضبط `models.providers.sglang` صراحةً، فسيتم تجاوز الاكتشاف التلقائي
ويجب عليك تعريف النماذج يدويًا.
</Note>

## إعدادات صريحة (نماذج يدوية)

استخدم الإعدادات الصريحة عندما:

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

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="سلوك على نمط الوكيل">
    يُعامل SGLang على أنه backend متوافق مع OpenAI `/v1` وعلى نمط الوكيل، وليس
    نقطة نهاية OpenAI أصلية.

    | السلوك | SGLang |
    |----------|--------|
    | تشكيل الطلبات الخاص بـ OpenAI فقط | غير مطبق |
    | `service_tier` و`store` الخاصة بـ Responses وتلميحات الذاكرة المؤقتة لـ prompt | لا يتم إرسالها |
    | تشكيل حمولة reasoning-compat | غير مطبق |
    | رؤوس الإسناد المخفية (`originator` و`version` و`User-Agent`) | لا يتم حقنها على base URLs المخصصة لـ SGLang |

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    **الخادم غير قابل للوصول**

    تحقّق من أن الخادم يعمل ويستجيب:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **أخطاء المصادقة**

    إذا فشلت الطلبات بأخطاء مصادقة، فاضبط `SGLANG_API_KEY` حقيقيًا يطابق
    إعدادات خادمك، أو اضبط provider صراحةً تحت
    `models.providers.sglang`.

    <Tip>
    إذا كنت تشغّل SGLang من دون مصادقة، فإن أي قيمة غير فارغة لـ
    `SGLANG_API_KEY` تكفي للاشتراك في اكتشاف النماذج.
    </Tip>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار providers، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعدادات الكامل بما في ذلك إدخالات providers.
  </Card>
</CardGroup>
