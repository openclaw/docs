---
read_when:
    - تريد تشغيل OpenClaw مع خادم vLLM محلي
    - تريد نقاط نهاية /v1 متوافقة مع OpenAI لنماذجك الخاصة
summary: تشغيل OpenClaw باستخدام vLLM (خادم محلي متوافق مع OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:34:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

يمكن لـ vLLM تقديم نماذج مفتوحة المصدر (وبعض النماذج المخصصة) عبر واجهة HTTP API **متوافقة مع OpenAI**. يتصل OpenClaw بـ vLLM باستخدام واجهة API `openai-completions`.

يمكن لـ OpenClaw أيضًا **الاكتشاف التلقائي** للنماذج المتاحة من vLLM عند تفعيل ذلك باستخدام `VLLM_API_KEY` (تعمل أي قيمة إذا كان خادمك لا يفرض المصادقة). استخدم `vllm/*` في `agents.defaults.models` لإبقاء الاكتشاف ديناميكيًا عندما تضبط أيضًا عنوان URL أساسيًا مخصصًا لـ vLLM.

يتعامل OpenClaw مع `vllm` كمزوّد محلي متوافق مع OpenAI يدعم
محاسبة الاستخدام المتدفقة، لذلك يمكن تحديث أعداد رموز الحالة/السياق من
استجابات `stream_options.include_usage`.

| الخاصية         | القيمة                                   |
| ---------------- | ---------------------------------------- |
| معرّف المزوّد      | `vllm`                                   |
| API              | `openai-completions` (متوافقة مع OpenAI) |
| المصادقة             | متغير البيئة `VLLM_API_KEY`      |
| عنوان URL الأساسي الافتراضي | `http://127.0.0.1:8000/v1`               |

## البدء

<Steps>
  <Step title="ابدأ vLLM بخادم متوافق مع OpenAI">
    يجب أن يكشف عنوان URL الأساسي لديك نقاط نهاية `/v1` (مثل `/v1/models` و`/v1/chat/completions`). يعمل vLLM عادةً على:

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
  <Step title="تحقق من توفر النموذج">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## اكتشاف النماذج (مزوّد ضمني)

عند ضبط `VLLM_API_KEY` (أو وجود ملف تعريف مصادقة) و**عدم** تعريف `models.providers.vllm`، يستعلم OpenClaw عن:

```
GET http://127.0.0.1:8000/v1/models
```

ويحوّل المعرّفات المرتجعة إلى إدخالات نماذج.

<Note>
إذا ضبطت `models.providers.vllm` صراحةً، يستخدم OpenClaw النماذج التي صرّحت بها افتراضيًا. أضف `"vllm/*": {}` إلى `agents.defaults.models` عندما تريد أن يستعلم OpenClaw عن نقطة نهاية `/models` لذلك المزوّد المضبوط وأن يضمّن كل نماذج vLLM المعلنة.
</Note>

## الضبط الصريح (النماذج اليدوية)

استخدم الضبط الصريح عندما:

- يعمل vLLM على مضيف أو منفذ مختلف
- تريد تثبيت قيم `contextWindow` أو `maxTokens`
- يتطلب خادمك مفتاح API حقيقيًا (أو تريد التحكم في الرؤوس)
- تتصل بنقطة نهاية vLLM موثوقة عبر loopback أو LAN أو Tailscale

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

لإبقاء هذا المزوّد ديناميكيًا دون إدراج كل نموذج يدويًا، أضف حرف بدل للمزوّد
إلى كتالوج النماذج المرئي:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## الضبط المتقدم

<AccordionGroup>
  <Accordion title="سلوك نمط الوكيل">
    يُعامَل vLLM كواجهة خلفية `/v1` متوافقة مع OpenAI بنمط الوكيل، وليس كنقطة نهاية
    OpenAI أصلية. يعني هذا:

    | السلوك | مطبّق؟ |
    |----------|----------|
    | تشكيل طلب OpenAI الأصلي | لا |
    | `service_tier` | لا يُرسل |
    | Responses `store` | لا يُرسل |
    | تلميحات ذاكرة التخزين المؤقت للمطالبات | لا تُرسل |
    | تشكيل حمولة توافق الاستدلال في OpenAI | غير مطبّق |
    | رؤوس إسناد OpenClaw المخفية | لا تُحقن في عناوين URL الأساسية المخصصة |

  </Accordion>

  <Accordion title="عناصر تحكم التفكير في Qwen">
    لنماذج Qwen المقدمة عبر vLLM، اضبط
    `params.qwenThinkingFormat: "chat-template"` على إدخال النموذج عندما يتوقع
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
    الطلب. يُقبل أيضًا `params.qwen_thinking_format` بصيغة snake-case.

  </Accordion>

  <Accordion title="عناصر تحكم التفكير في Nemotron 3">
    يمكن لـ vLLM/Nemotron 3 استخدام kwargs لقالب المحادثة للتحكم فيما إذا كان الاستدلال
    يُعاد كاستدلال مخفي أو كنص إجابة مرئي. عندما تستخدم جلسة OpenClaw
    `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمّن:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    لتخصيص هذه القيم، اضبط `chat_template_kwargs` ضمن معاملات النموذج.
    إذا ضبطت أيضًا `params.extra_body.chat_template_kwargs`، فستكون لتلك القيمة
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
    تأكد أولًا من بدء vLLM باستخدام محلل استدعاءات الأدوات وقالب المحادثة
    المناسبين للنموذج. على سبيل المثال، توثق vLLM استخدام `hermes` لنماذج Qwen2.5
    و`qwen3_xml` لنماذج Qwen3-Coder.

    الأعراض:

    - لا تعمل skills أو الأدوات مطلقًا
    - يطبع المساعد JSON/XML خامًا مثل `{"name":"read","arguments":...}`
    - يعيد vLLM مصفوفة `tool_calls` فارغة عندما يرسل OpenClaw
      `tool_choice: "auto"`

    تُعيد بعض مجموعات Qwen/vLLM استدعاءات أدوات منظمة فقط عندما يستخدم
    الطلب `tool_choice: "required"`. لتلك إدخالات النماذج، افرض حقل
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

    استبدل `Qwen-Qwen2.5-Coder-32B-Instruct` بالمعرّف الدقيق الذي يعيده:

    ```bash
    openclaw models list --provider vllm
    ```

    يمكنك تطبيق التجاوز نفسه من CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    هذا حل توافق اختياري. يجعل كل دورة نموذج مع
    الأدوات تتطلب استدعاء أداة، لذلك استخدمه فقط لإدخال نموذج محلي مخصص
    يكون فيه هذا السلوك مقبولًا. لا تستخدمه كافتراضي عام لكل
    نماذج vLLM، ولا تستخدم وكيلًا يحوّل عشوائيًا أي
    نص مساعد إلى استدعاءات أدوات قابلة للتنفيذ.

  </Accordion>

  <Accordion title="عنوان URL أساسي مخصص">
    إذا كان خادم vLLM يعمل على مضيف أو منفذ غير افتراضي، فاضبط `baseUrl` في ضبط المزوّد الصريح:

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
  <Accordion title="استجابة أولى بطيئة أو انتهاء مهلة الخادم البعيد">
    للنماذج المحلية الكبيرة، أو مضيفي LAN البعيدين، أو روابط tailnet، اضبط
    مهلة طلب على مستوى المزوّد:

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
    إعداد الاتصال، ورؤوس الاستجابة، وتدفق الجسم، وإحباط
    guarded-fetch الإجمالي. فضّل هذا قبل زيادة
    `agents.defaults.timeoutSeconds`، الذي يتحكم في تشغيل الوكيل بالكامل.

  </Accordion>

  <Accordion title="الخادم غير قابل للوصول">
    تحقق من أن خادم vLLM يعمل ويمكن الوصول إليه:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    إذا رأيت خطأ اتصال، فتحقق من المضيف والمنفذ وأن vLLM بدأ بوضع الخادم المتوافق مع OpenAI.
    ولنقاط نهاية loopback أو LAN أو Tailscale الصريحة، اضبط أيضًا
    `models.providers.vllm.request.allowPrivateNetwork: true`؛ تحظر طلبات
    المزوّد عناوين URL للشبكات الخاصة افتراضيًا ما لم يكن المزوّد
    موثوقًا به صراحةً.

  </Accordion>

  <Accordion title="أخطاء المصادقة في الطلبات">
    إذا فشلت الطلبات بسبب أخطاء المصادقة، فاضبط `VLLM_API_KEY` حقيقيًا يطابق ضبط الخادم لديك، أو اضبط المزوّد صراحةً ضمن `models.providers.vllm`.

    <Tip>
    إذا كان خادم vLLM لديك لا يفرض المصادقة، تعمل أي قيمة غير فارغة لـ `VLLM_API_KEY` كإشارة تفعيل اختيارية لـ OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="لم تُكتشف أي نماذج">
    يتطلب الاكتشاف التلقائي ضبط `VLLM_API_KEY`. إذا عرّفت `models.providers.vllm`، يستخدم OpenClaw النماذج التي صرّحت بها فقط ما لم يتضمن `agents.defaults.models` القيمة `"vllm/*": {}`.
  </Accordion>

  <Accordion title="تُعرض الأدوات كنص خام">
    إذا طبع نموذج Qwen صيغة أدوات JSON/XML بدلًا من تنفيذ skill،
    فتحقق من إرشادات Qwen في الضبط المتقدم أعلاه. الإصلاح المعتاد هو:

    - بدء vLLM بالمحلل/القالب الصحيح لذلك النموذج
    - تأكيد معرّف النموذج الدقيق باستخدام `openclaw models list --provider vllm`
    - إضافة تجاوز مخصص لكل نموذج لـ `params.extra_body.tool_choice: "required"`
      فقط إذا ظل `tool_choice: "auto"` يعيد استدعاءات أدوات فارغة أو نصية فقط

  </Accordion>
</AccordionGroup>

<Warning>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
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
