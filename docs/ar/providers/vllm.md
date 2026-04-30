---
read_when:
    - تريد تشغيل OpenClaw مع خادم vLLM محلي
    - تريد نقاط نهاية /v1 متوافقة مع OpenAI مع نماذجك الخاصة
summary: تشغيل OpenClaw باستخدام vLLM (خادم محلي متوافق مع OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-30T08:23:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

يمكن لـ vLLM تقديم نماذج مفتوحة المصدر (وبعض النماذج المخصصة) عبر API HTTP **متوافقة مع OpenAI**. يتصل OpenClaw بـ vLLM باستخدام API ‏`openai-completions`.

يمكن لـ OpenClaw أيضًا **اكتشاف** النماذج المتاحة من vLLM تلقائيًا عندما تختار ذلك باستخدام `VLLM_API_KEY` (تعمل أي قيمة إذا كان خادمك لا يفرض المصادقة) ولا تعرّف إدخالًا صريحًا باسم `models.providers.vllm`.

يتعامل OpenClaw مع `vllm` كمزوّد محلي متوافق مع OpenAI يدعم
محاسبة الاستخدام المتدفقة، لذلك يمكن أن تتحدث أعداد رموز الحالة/السياق من
استجابات `stream_options.include_usage`.

| الخاصية         | القيمة                                    |
| ---------------- | ---------------------------------------- |
| معرّف المزوّد      | `vllm`                                   |
| API              | `openai-completions` (متوافقة مع OpenAI) |
| المصادقة             | متغير البيئة `VLLM_API_KEY`      |
| عنوان URL الأساسي الافتراضي | `http://127.0.0.1:8000/v1`               |

## البدء

<Steps>
  <Step title="بدء vLLM بخادم متوافق مع OpenAI">
    يجب أن يعرّض عنوان URL الأساسي لديك نقاط نهاية `/v1` (مثل `/v1/models` و`/v1/chat/completions`). يعمل vLLM عادةً على:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="تعيين متغير البيئة لمفتاح API">
    تعمل أي قيمة إذا كان خادمك لا يفرض المصادقة:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="اختيار نموذج">
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
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## اكتشاف النموذج (مزوّد ضمني)

عند تعيين `VLLM_API_KEY` (أو وجود ملف تعريف مصادقة) و**لا** تعرّف `models.providers.vllm`، يستعلم OpenClaw:

```
GET http://127.0.0.1:8000/v1/models
```

ويحوّل المعرّفات المُعادة إلى إدخالات نماذج.

<Note>
إذا عيّنت `models.providers.vllm` صراحةً، يتم تخطي الاكتشاف التلقائي ويجب عليك تعريف النماذج يدويًا.
</Note>

## التكوين الصريح (النماذج اليدوية)

استخدم التكوين الصريح عندما:

- يعمل vLLM على مضيف أو منفذ مختلف
- تريد تثبيت قيم `contextWindow` أو `maxTokens`
- يتطلب خادمك مفتاح API حقيقيًا (أو تريد التحكم في الرؤوس)
- تتصل بنقطة نهاية vLLM موثوقة عبر local loopback أو LAN أو Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
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

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="سلوك نمط الوكيل">
    يُعامل vLLM كواجهة خلفية `/v1` متوافقة مع OpenAI بنمط الوكيل، وليس كنقطة نهاية
    OpenAI أصلية. وهذا يعني:

    | السلوك | مطبّق؟ |
    |----------|----------|
    | تشكيل طلب OpenAI الأصلي | لا |
    | `service_tier` | لا يُرسل |
    | `store` في Responses | لا يُرسل |
    | تلميحات ذاكرة التخزين المؤقت للمطالبات | لا تُرسل |
    | تشكيل الحمولة المتوافق مع استدلال OpenAI | غير مطبّق |
    | رؤوس إسناد OpenClaw المخفية | لا تُحقن على عناوين URL الأساسية المخصصة |

  </Accordion>

  <Accordion title="عناصر التحكم في تفكير Qwen">
    بالنسبة إلى نماذج Qwen المقدمة عبر vLLM، عيّن
    `params.qwenThinkingFormat: "chat-template"` في إدخال النموذج عندما يتوقع
    الخادم kwargs لقالب محادثة Qwen. يربط OpenClaw الأمر `/think off` بـ:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    ترسل مستويات التفكير غير `off` القيمة `enable_thinking: true`. إذا كانت نقطة النهاية لديك
    تتوقع بدلًا من ذلك أعلامًا علوية بنمط DashScope، فاستخدم
    `params.qwenThinkingFormat: "top-level"` لإرسال `enable_thinking` في جذر
    الطلب. كما يُقبل أيضًا `params.qwen_thinking_format` بصيغة snake-case.

  </Accordion>

  <Accordion title="عناصر التحكم في تفكير Nemotron 3">
    يمكن لـ vLLM/Nemotron 3 استخدام kwargs لقالب المحادثة للتحكم في ما إذا كان الاستدلال
    يُعاد كاستدلال مخفي أو كنص إجابة مرئي. عندما تستخدم جلسة OpenClaw
    النموذج `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمّن:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    لتخصيص هذه القيم، عيّن `chat_template_kwargs` ضمن معلمات النموذج.
    إذا عيّنت أيضًا `params.extra_body.chat_template_kwargs`، فستكون لتلك القيمة
    الأسبقية النهائية لأن `extra_body` هو آخر تجاوز لجسم الطلب.

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

  <Accordion title="استدعاءات أدوات Qwen تظهر كنص">
    تأكد أولًا من أن vLLM قد بدأ بمحلل استدعاءات الأدوات وقالب المحادثة الصحيحين
    للنموذج. على سبيل المثال، توثّق vLLM ‏`hermes` لنماذج Qwen2.5
    و`qwen3_xml` لنماذج Qwen3-Coder.

    الأعراض:

    - لا تعمل Skills أو الأدوات أبدًا
    - يطبع المساعد JSON/XML خامًا مثل `{"name":"read","arguments":...}`
    - يعيد vLLM مصفوفة `tool_calls` فارغة عندما يرسل OpenClaw
      `tool_choice: "auto"`

    بعض تركيبات Qwen/vLLM تعيد استدعاءات أدوات منظمة فقط عندما يستخدم
    الطلب `tool_choice: "required"`. بالنسبة إلى إدخالات النماذج هذه، افرض حقل
    الطلب المتوافق مع OpenAI باستخدام `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    استبدل `Qwen-Qwen2.5-Coder-32B-Instruct` بالمعرّف الدقيق المُعاد بواسطة:

    ```bash
    openclaw models list --provider vllm
    ```

    يمكنك تطبيق التجاوز نفسه من CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    هذا حل توافق اختياري. يجعل كل دور نموذج مع
    الأدوات يتطلب استدعاء أداة، لذلك استخدمه فقط لإدخال نموذج محلي مخصص
    يكون فيه هذا السلوك مقبولًا. لا تستخدمه كإعداد افتراضي عام لكل
    نماذج vLLM، ولا تستخدم وكيلًا يحوّل عشوائيًا أي
    نص مساعد إلى استدعاءات أدوات قابلة للتنفيذ.

  </Accordion>

  <Accordion title="عنوان URL أساسي مخصص">
    إذا كان خادم vLLM يعمل على مضيف أو منفذ غير افتراضي، فعيّن `baseUrl` في تكوين المزوّد الصريح:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
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
  <Accordion title="الاستجابة الأولى بطيئة أو انتهت مهلة الخادم البعيد">
    بالنسبة إلى النماذج المحلية الكبيرة أو مضيفي LAN البعيدين أو روابط tailnet، عيّن
    مهلة طلب ضمن نطاق المزوّد:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    ينطبق `timeoutSeconds` على طلبات HTTP لنماذج vLLM فقط، بما في ذلك
    إعداد الاتصال، ورؤوس الاستجابة، وتدفق الجسم، والإيقاف الكلي
    للجلب المحمي. فضّل هذا قبل زيادة
    `agents.defaults.timeoutSeconds`، الذي يتحكم في تشغيل الوكيل بأكمله.

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى الخادم">
    تحقق من أن خادم vLLM قيد التشغيل ويمكن الوصول إليه:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    إذا رأيت خطأ اتصال، فتحقق من المضيف والمنفذ وأن vLLM بدأ بوضع الخادم المتوافق مع OpenAI.
    بالنسبة إلى نقاط نهاية local loopback أو LAN أو Tailscale الصريحة، عيّن أيضًا
    `models.providers.vllm.request.allowPrivateNetwork: true`؛ تحظر طلبات
    المزوّد عناوين URL للشبكات الخاصة افتراضيًا ما لم يكن المزوّد
    موثوقًا به صراحةً.

  </Accordion>

  <Accordion title="أخطاء المصادقة في الطلبات">
    إذا فشلت الطلبات بسبب أخطاء مصادقة، فعيّن `VLLM_API_KEY` حقيقيًا يطابق تكوين خادمك، أو كوّن المزوّد صراحةً ضمن `models.providers.vllm`.

    <Tip>
    إذا كان خادم vLLM لديك لا يفرض المصادقة، فإن أي قيمة غير فارغة لـ `VLLM_API_KEY` تعمل كإشارة اختيارية لـ OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="لم يتم اكتشاف أي نماذج">
    يتطلب الاكتشاف التلقائي تعيين `VLLM_API_KEY` **و** عدم وجود إدخال تكوين صريح `models.providers.vllm`. إذا كنت قد عرّفت المزوّد يدويًا، يتخطى OpenClaw الاكتشاف ويستخدم فقط النماذج التي صرّحت بها.
  </Accordion>

  <Accordion title="تُعرض الأدوات كنص خام">
    إذا كان نموذج Qwen يطبع صيغة أدوات JSON/XML بدلًا من تنفيذ skill،
    فراجع إرشادات Qwen في قسم التكوين المتقدم أعلاه. الإصلاح المعتاد هو:

    - بدء vLLM بالمحلل/القالب الصحيح لذلك النموذج
    - تأكيد معرّف النموذج الدقيق باستخدام `openclaw models list --provider vllm`
    - إضافة تجاوز مخصص لكل نموذج `params.extra_body.tool_choice: "required"`
      فقط إذا كان `tool_choice: "auto"` لا يزال يعيد استدعاءات أدوات فارغة أو نصية فقط

  </Accordion>
</AccordionGroup>

<Warning>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Warning>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="OpenAI" href="/ar/providers/openai" icon="bolt">
    مزوّد OpenAI الأصلي وسلوك المسار المتوافق مع OpenAI.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وكيفية حلها.
  </Card>
</CardGroup>
