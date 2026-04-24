---
read_when:
    - تريد تشغيل OpenClaw مقابل خادم vLLM محلي
    - تريد نقاط نهاية `/v1` متوافقة مع OpenAI مع نماذجك الخاصة
summary: شغّل OpenClaw مع vLLM (خادم محلي متوافق مع OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-24T08:01:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

يمكن لـ vLLM تقديم نماذج مفتوحة المصدر (وبعض النماذج المخصصة) عبر واجهة HTTP
**متوافقة مع OpenAI**. ويتصل OpenClaw بـ vLLM باستخدام API ‏`openai-completions`.

يمكن لـ OpenClaw أيضًا **اكتشاف النماذج المتاحة تلقائيًا** من vLLM عندما تشترك في ذلك عبر `VLLM_API_KEY` (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة) ولا تعرّف إدخال `models.providers.vllm` صريحًا.

يتعامل OpenClaw مع `vllm` بوصفه مزوّدًا محليًا متوافقًا مع OpenAI يدعم
محاسبة الاستخدام المتدفقة، بحيث يمكن أن تتحدّث أعداد رموز الحالة/السياق من
استجابات `stream_options.include_usage`.

| الخاصية          | القيمة                                   |
| ---------------- | ---------------------------------------- |
| معرّف المزوّد    | `vllm`                                   |
| API              | `openai-completions` ‏(متوافق مع OpenAI) |
| المصادقة         | متغير البيئة `VLLM_API_KEY`              |
| عنوان URL الأساسي الافتراضي | `http://127.0.0.1:8000/v1`               |

## البدء

<Steps>
  <Step title="ابدأ vLLM مع خادم متوافق مع OpenAI">
    يجب أن يكشف عنوان URL الأساسي لديك نقاط نهاية `/v1` ‏(مثل `/v1/models`, `/v1/chat/completions`). وغالبًا ما يعمل vLLM على:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="اضبط متغير البيئة الخاص بمفتاح API">
    تعمل أي قيمة إذا كان خادمك لا يفرض المصادقة:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="اختر نموذجًا">
    استبدله بأحد معرّفات نماذج vLLM لديك:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="تحقق من أن النموذج متاح">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## اكتشاف النماذج (المزوّد الضمني)

عندما يكون `VLLM_API_KEY` مضبوطًا (أو يوجد ملف تعريف مصادقة) و**لا** تعرّف `models.providers.vllm`, يستعلم OpenClaw عن:

```
GET http://127.0.0.1:8000/v1/models
```

ثم يحول المعرّفات المعادة إلى إدخالات نماذج.

<Note>
إذا ضبطت `models.providers.vllm` صراحةً، فسيتم تخطي الاكتشاف التلقائي ويجب عليك تعريف النماذج يدويًا.
</Note>

## الإعداد الصريح (نماذج يدوية)

استخدم الإعداد الصريح عندما:

- يعمل vLLM على مضيف أو منفذ مختلف
- تريد تثبيت قيم `contextWindow` أو `maxTokens`
- يتطلب خادمك مفتاح API حقيقيًا (أو تريد التحكم في الرؤوس)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="سلوك على نمط الوكيل">
    يُعامل vLLM كواجهة خلفية على نمط الوكيل ومتوافقة مع OpenAI `/v1`، وليس كنقطة
    نهاية OpenAI أصلية. وهذا يعني:

    | السلوك | هل يُطبّق؟ |
    |--------|------------|
    | تشكيل طلبات OpenAI الأصلية | لا |
    | `service_tier` | لا يُرسل |
    | `store` في Responses | لا يُرسل |
    | تلميحات Prompt-cache | لا تُرسل |
    | تشكيل الحمولة المتوافق مع استدلال OpenAI | لا يُطبَّق |
    | رؤوس الإسناد المخفية الخاصة بـ OpenClaw | لا تُحقن على عناوين URL الأساسية المخصصة |

  </Accordion>

  <Accordion title="عنوان URL أساسي مخصص">
    إذا كان خادم vLLM لديك يعمل على مضيف أو منفذ غير افتراضي، فاضبط `baseUrl` في إعداد المزوّد الصريح:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الخادم غير قابل للوصول">
    تحقق من أن خادم vLLM يعمل ويمكن الوصول إليه:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    إذا رأيت خطأ اتصال، فتحقق من المضيف والمنفذ، ومن أن vLLM قد بدأ في وضع الخادم المتوافق مع OpenAI.

  </Accordion>

  <Accordion title="أخطاء مصادقة على الطلبات">
    إذا فشلت الطلبات بسبب أخطاء مصادقة، فاضبط قيمة `VLLM_API_KEY` حقيقية تطابق إعداد خادمك، أو اضبط المزوّد صراحةً تحت `models.providers.vllm`.

    <Tip>
    إذا كان خادم vLLM لديك لا يفرض المصادقة، فإن أي قيمة غير فارغة لـ `VLLM_API_KEY` تعمل كإشارة اشتراك بالنسبة إلى OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="لم يتم اكتشاف أي نماذج">
    يتطلب الاكتشاف التلقائي ضبط `VLLM_API_KEY` **مع** عدم وجود إدخال إعداد صريح لـ `models.providers.vllm`. وإذا كنت قد عرّفت المزوّد يدويًا، فإن OpenClaw يتخطى الاكتشاف ويستخدم فقط النماذج التي أعلنتها.
  </Accordion>
</AccordionGroup>

<Warning>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع عند الفشل.
  </Card>
  <Card title="OpenAI" href="/ar/providers/openai" icon="bolt">
    مزوّد OpenAI الأصلي وسلوك المسارات المتوافقة مع OpenAI.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وكيفية حلها.
  </Card>
</CardGroup>
