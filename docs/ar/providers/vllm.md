---
read_when:
    - تريد تشغيل OpenClaw مقابل خادم vLLM محلي
    - تريد نقاط نهاية /v1 متوافقة مع OpenAI باستخدام نماذجك الخاصة
summary: تشغيل OpenClaw باستخدام vLLM (خادم محلي متوافق مع OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:28:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

يمكن لـ vLLM تشغيل نماذج مفتوحة المصدر (وبعض النماذج المخصصة) عبر واجهة HTTP API **متوافقة مع OpenAI**. يتصل OpenClaw بـ vLLM باستخدام واجهة `openai-completions` API.

يمكن لـ OpenClaw أيضًا **اكتشاف** النماذج المتاحة تلقائيًا من vLLM عند تفعيل ذلك باستخدام `VLLM_API_KEY` (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة). استخدم `vllm/*` في `agents.defaults.models` لإبقاء الاكتشاف ديناميكيًا عندما تضبط أيضًا عنوان URL أساسيًا مخصصًا لـ vLLM.

يتعامل OpenClaw مع `vllm` كمزوّد محلي متوافق مع OpenAI يدعم
محاسبة الاستخدام المتدفقة، لذا يمكن تحديث أعداد رموز الحالة/السياق من
استجابات `stream_options.include_usage`.

| الخاصية         | القيمة                                    |
| ---------------- | ---------------------------------------- |
| معرّف المزوّد      | `vllm`                                   |
| API              | `openai-completions` (متوافق مع OpenAI) |
| المصادقة             | متغير البيئة `VLLM_API_KEY`      |
| عنوان URL الأساسي الافتراضي | `http://127.0.0.1:8000/v1`               |

## البدء

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    يجب أن يوفّر عنوان URL الأساسي لديك نقاط نهاية `/v1` (مثل `/v1/models` و`/v1/chat/completions`). يعمل vLLM عادةً على:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    استبدلها بأحد معرّفات نماذج vLLM لديك:

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
  <Step title="Verify the model is available">
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

ويحوّل المعرّفات المُعادة إلى إدخالات نماذج.

<Note>
إذا ضبطت `models.providers.vllm` صراحةً، يستخدم OpenClaw نماذجك المعلنة افتراضيًا. أضف `"vllm/*": {}` إلى `agents.defaults.models` عندما تريد من OpenClaw الاستعلام عن نقطة نهاية `/models` الخاصة بذلك المزوّد المضبوط وتضمين جميع نماذج vLLM المُعلنة.
</Note>

## الضبط الصريح (نماذج يدوية)

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
  <Accordion title="Proxy-style behavior">
    يُعامل vLLM كواجهة خلفية `/v1` متوافقة مع OpenAI بنمط الوكيل، وليس كنقطة نهاية
    OpenAI أصلية. يعني ذلك:

    | السلوك | مُطبّق؟ |
    |----------|----------|
    | تشكيل طلبات OpenAI الأصلية | لا |
    | `service_tier` | لا يُرسل |
    | `store` في Responses | لا يُرسل |
    | تلميحات ذاكرة التخزين المؤقت للموجه | لا تُرسل |
    | تشكيل حمولة توافق الاستدلال مع OpenAI | غير مُطبّق |
    | رؤوس إسناد OpenClaw المخفية | لا تُحقن على عناوين URL الأساسية المخصصة |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    بالنسبة إلى نماذج Qwen المقدّمة عبر vLLM، اضبط
    `compat.thinkingFormat: "qwen-chat-template"` على صف نموذج المزوّد المضبوط
    عندما يتوقع الخادم معاملات Qwen chat-template kwargs. تعرض النماذج
    المضبوطة بهذه الطريقة ملف تعريف `/think` ثنائيًا (`off`، `on`) لأن
    تفكير قالب Qwen هو علم طلب تشغيل/إيقاف، وليس سلّم جهد بنمط OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    يربط OpenClaw الأمر `/think off` بما يلي:

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
    `compat.thinkingFormat: "qwen"` لإرسال `enable_thinking` في جذر
    الطلب.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    يمكن لـ vLLM/Nemotron 3 استخدام chat-template kwargs للتحكم فيما إذا كان الاستدلال
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

  <Accordion title="Qwen tool calls appear as text">
    تأكد أولًا من أن vLLM بدأ بمحلل استدعاءات الأدوات وقالب الدردشة الصحيحين
    للنموذج. على سبيل المثال، توثّق vLLM استخدام `hermes` لنماذج Qwen2.5
    و`qwen3_xml` لنماذج Qwen3-Coder.

    الأعراض:

    - لا تعمل Skills أو الأدوات مطلقًا
    - يطبع المساعد JSON/XML خامًا مثل `{"name":"read","arguments":...}`
    - يعيد vLLM مصفوفة `tool_calls` فارغة عندما يرسل OpenClaw
      `tool_choice: "auto"`

    تعيد بعض تركيبات Qwen/vLLM استدعاءات أدوات مهيكلة فقط عندما يستخدم
    الطلب `tool_choice: "required"`. لهذه إدخالات النماذج، افرض حقل الطلب
    المتوافق مع OpenAI باستخدام `params.extra_body`:

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

    هذا حل توافق اختياري. يجعل كل دورة نموذج تحتوي على
    أدوات تتطلب استدعاء أداة، لذلك استخدمه فقط لإدخال نموذج محلي مخصص
    يكون هذا السلوك مقبولًا فيه. لا تستخدمه كإعداد افتراضي عام لكل
    نماذج vLLM، ولا تستخدم وكيلًا يحوّل نص المساعد الاعتباطي عشوائيًا
    إلى استدعاءات أدوات قابلة للتنفيذ.

  </Accordion>

  <Accordion title="Custom base URL">
    إذا كان خادم vLLM لديك يعمل على مضيف أو منفذ غير افتراضي، فاضبط `baseUrl` في ضبط المزوّد الصريح:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
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
  <Accordion title="Slow first response or remote server timeout">
    بالنسبة إلى النماذج المحلية الكبيرة، أو مضيفي LAN البعيدين، أو روابط tailnet، اضبط
    مهلة طلب على نطاق المزوّد:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    ينطبق `timeoutSeconds` على طلبات HTTP لنماذج vLLM فقط، بما في ذلك
    إعداد الاتصال، ورؤوس الاستجابة، وبث الجسم، والإجهاض الإجمالي
    للجلب المحمي. فضّل هذا قبل زيادة
    `agents.defaults.timeoutSeconds`، الذي يتحكم في تشغيل الوكيل بالكامل.

  </Accordion>

  <Accordion title="Server not reachable">
    تحقق من أن خادم vLLM يعمل ويمكن الوصول إليه:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    إذا رأيت خطأ اتصال، فتحقق من المضيف والمنفذ وأن vLLM بدأ بوضع الخادم المتوافق مع OpenAI.
    بالنسبة إلى نقاط نهاية loopback أو LAN أو Tailscale الصريحة، يثق OpenClaw في
    أصل `models.providers.vllm.baseUrl` المضبوط بدقة لطلبات النماذج
    المحمية. تبقى أصول metadata/link-local محظورة دون
    تفعيل صريح. اضبط `models.providers.vllm.request.allowPrivateNetwork: true` فقط
    عندما يجب أن تصل طلبات vLLM إلى أصل خاص آخر، واضبطه على `false`
    لإلغاء الثقة بالأصل الدقيق.

  </Accordion>

  <Accordion title="Auth errors on requests">
    إذا فشلت الطلبات بسبب أخطاء مصادقة، فاضبط `VLLM_API_KEY` حقيقيًا يطابق ضبط خادمك، أو اضبط المزوّد صراحةً ضمن `models.providers.vllm`.

    <Tip>
    إذا كان خادم vLLM لديك لا يفرض المصادقة، فإن أي قيمة غير فارغة لـ `VLLM_API_KEY` تعمل كإشارة تفعيل لـ OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    يتطلب الاكتشاف التلقائي ضبط `VLLM_API_KEY`. إذا عرّفت `models.providers.vllm`، يستخدم OpenClaw نماذجك المعلنة فقط ما لم يتضمن `agents.defaults.models` القيمة `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Tools render as raw text">
    إذا طبع نموذج Qwen صياغة أدوات JSON/XML بدلًا من تنفيذ Skill،
    فراجع إرشادات Qwen في الضبط المتقدم أعلاه. الإصلاح المعتاد هو:

    - بدء vLLM بالمحلل/القالب الصحيح لذلك النموذج
    - تأكيد معرّف النموذج الدقيق باستخدام `openclaw models list --provider vllm`
    - إضافة تجاوز مخصص لكل نموذج لـ `params.extra_body.tool_choice: "required"`
      فقط إذا كان `tool_choice: "auto"` لا يزال يعيد استدعاءات أدوات فارغة أو
      نصية فقط

  </Accordion>
</AccordionGroup>

<Warning>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Warning>

## ذات صلة

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
    المشكلات الشائعة وكيفية حلّها.
  </Card>
</CardGroup>
