---
read_when:
    - تريد تشغيل OpenClaw مقابل خادم vLLM محلي
    - تريد نقاط نهاية `/v1` متوافقة مع OpenAI باستخدام نماذجك الخاصة
summary: شغّل OpenClaw باستخدام vLLM ‏(خادم محلي متوافق مع OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:39:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

يمكن لـ vLLM تقديم نماذج مفتوحة المصدر (وبعض النماذج المخصصة) عبر واجهة HTTP ‏**متوافقة مع OpenAI**. يتصل OpenClaw بـ vLLM باستخدام واجهة `openai-completions` API.

يمكن لـ OpenClaw أيضًا **اكتشاف** النماذج المتاحة من vLLM تلقائيًا عندما تشترك في ذلك باستخدام `VLLM_API_KEY` (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة) ولا تعرّف إدخال `models.providers.vllm` صريحًا.

يعامل OpenClaw ‏`vllm` على أنه موفّر محلي متوافق مع OpenAI ويدعم
محاسبة الاستخدام المتدفقة، لذلك يمكن لتعدادات رموز الحالة/السياق أن تتحدث من
استجابات `stream_options.include_usage`.

| الخاصية         | القيمة                                   |
| ---------------- | ---------------------------------------- |
| معرّف الموفّر    | `vllm`                                   |
| API              | `openai-completions` ‏(متوافق مع OpenAI) |
| المصادقة         | متغير البيئة `VLLM_API_KEY`              |
| عنوان URL الأساسي الافتراضي | `http://127.0.0.1:8000/v1`               |

## البدء

<Steps>
  <Step title="ابدأ vLLM باستخدام خادم متوافق مع OpenAI">
    يجب أن يعرّض عنوان URL الأساسي لديك نقاط نهاية `/v1` (مثل `/v1/models` و`/v1/chat/completions`). يعمل vLLM عادةً على:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="اضبط متغير البيئة لمفتاح API">
    تعمل أي قيمة إذا كان خادمك لا يفرض المصادقة:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="اختر نموذجًا">
    استبدل هذا بأحد معرّفات نماذج vLLM لديك:

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

## اكتشاف النموذج (موفّر ضمني)

عندما يكون `VLLM_API_KEY` مضبوطًا (أو يوجد ملف تعريف مصادقة) وأنت **لا** تعرّف `models.providers.vllm`، يستعلم OpenClaw عن:

```
GET http://127.0.0.1:8000/v1/models
```

ويحوّل المعرّفات المعادة إلى إدخالات نماذج.

<Note>
إذا ضبطت `models.providers.vllm` صراحةً، فسيُتخطى الاكتشاف التلقائي ويجب أن تعرّف النماذج يدويًا.
</Note>

## الإعداد الصريح (نماذج يدوية)

استخدم الإعداد الصريح عندما:

- يعمل vLLM على مضيف أو منفذ مختلف
- تريد تثبيت قيم `contextWindow` أو `maxTokens`
- يتطلب خادمك مفتاح API حقيقيًا (أو تريد التحكم في الرؤوس)
- تتصل بنقطة نهاية vLLM موثوق بها عبر loopback أو LAN أو Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "نموذج vLLM محلي",
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
  <Accordion title="سلوك بأسلوب الوكيل">
    يُعامل vLLM على أنه خلفية `/v1` متوافقة مع OpenAI بأسلوب الوكيل، وليس
    نقطة نهاية أصلية لـ OpenAI. وهذا يعني:

    | السلوك | هل يُطبّق؟ |
    |----------|----------|
    | تشكيل طلب OpenAI الأصلي | لا |
    | `service_tier` | لا يُرسل |
    | `store` في الاستجابات | لا يُرسل |
    | تلميحات ذاكرة التخزين المؤقت للمطالبة | لا تُرسل |
    | تشكيل الحمولة المتوافق مع reasoning في OpenAI | لا يُطبّق |
    | رؤوس الإسناد المخفية الخاصة بـ OpenClaw | لا تُحقن في عناوين URL الأساسية المخصصة |

  </Accordion>

  <Accordion title="عناصر تحكم التفكير في Nemotron 3">
    يمكن أن يستخدم vLLM/Nemotron 3 معاملات chat-template kwargs للتحكم في ما إذا كانت reasoning
    تُعاد على أنها reasoning مخفية أو كنص إجابة مرئي. عندما تستخدم جلسة OpenClaw
    النموذج `vllm/nemotron-3-*` مع تعطيل التفكير، يرسل OpenClaw:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    لتخصيص هذه القيم، اضبط `chat_template_kwargs` تحت معاملات النموذج.
    وإذا ضبطت أيضًا `params.extra_body.chat_template_kwargs`، فستكون لتلك القيمة
    الأولوية النهائية لأن `extra_body` هو آخر تجاوز لجسم الطلب.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="عنوان URL أساسي مخصص">
    إذا كان خادم vLLM يعمل على مضيف أو منفذ غير افتراضي، فاضبط `baseUrl` في إعدادات الموفّر الصريحة:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            models: [
              {
                id: "my-custom-model",
                name: "نموذج vLLM بعيد",
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
  <Accordion title="يتعذر الوصول إلى الخادم">
    تحقق من أن خادم vLLM يعمل ويمكن الوصول إليه:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    إذا رأيت خطأ اتصال، فتحقق من المضيف والمنفذ وأن vLLM بدأ في وضع الخادم المتوافق مع OpenAI.
    وبالنسبة إلى نقاط النهاية الصريحة عبر loopback أو LAN أو Tailscale، اضبط أيضًا
    `models.providers.vllm.request.allowPrivateNetwork: true`؛ إذ إن طلبات
    الموفّر تحظر عناوين URL الخاصة بالشبكات الخاصة افتراضيًا ما لم يكن الموفّر
    موثوقًا به صراحةً.

  </Accordion>

  <Accordion title="أخطاء مصادقة في الطلبات">
    إذا فشلت الطلبات بسبب أخطاء مصادقة، فاضبط `VLLM_API_KEY` حقيقيًا يطابق إعدادات خادمك، أو اضبط الموفّر صراحةً تحت `models.providers.vllm`.

    <Tip>
    إذا كان خادم vLLM لديك لا يفرض المصادقة، فإن أي قيمة غير فارغة لـ `VLLM_API_KEY` تعمل كإشارة اشتراك لـ OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="لم يُكتشف أي نموذج">
    يتطلب الاكتشاف التلقائي أن يكون `VLLM_API_KEY` مضبوطًا **وألا** يوجد إدخال إعداد صريح لـ `models.providers.vllm`. وإذا كنت قد عرّفت الموفّر يدويًا، فسيتخطى OpenClaw الاكتشاف ويستخدم فقط النماذج التي أعلنتها.
  </Accordion>
</AccordionGroup>

<Warning>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="OpenAI" href="/ar/providers/openai" icon="bolt">
    موفّر OpenAI الأصلي وسلوك المسارات المتوافقة مع OpenAI.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وكيفية حلها.
  </Card>
</CardGroup>
