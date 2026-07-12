---
read_when:
    - تريد تشغيل OpenClaw باستخدام خادم vLLM محلي
    - تريد نقاط نهاية ‎/v1‎ متوافقة مع OpenAI وتستخدم نماذجك الخاصة
summary: تشغيل OpenClaw باستخدام vLLM (خادم محلي متوافق مع OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T06:32:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

يقدّم vLLM النماذج مفتوحة المصدر (وبعض النماذج المخصصة) عبر واجهة HTTP API **متوافقة مع OpenAI**. يتصل OpenClaw باستخدام API ‏`openai-completions`، ويمكنه **اكتشاف** النماذج تلقائيًا عند الاشتراك في ذلك باستخدام `VLLM_API_KEY`.

| الخاصية          | القيمة                                      |
| ---------------- | ------------------------------------------ |
| معرّف المزوّد    | `vllm`                                     |
| API              | `openai-completions` (متوافقة مع OpenAI)   |
| المصادقة         | متغير البيئة `VLLM_API_KEY`                |
| عنوان URL الأساسي الافتراضي | `http://127.0.0.1:8000/v1`        |
| استخدام البث     | مدعوم (`stream_options.include_usage`)      |

## بدء الاستخدام

<Steps>
  <Step title="بدء vLLM بخادم متوافق مع OpenAI">
    يجب أن يوفّر عنوان URL الأساسي نقاط نهاية `/v1` (`/v1/models` و`/v1/chat/completions`). يعمل vLLM عادةً على:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="تعيين متغير البيئة لمفتاح API">
    تصلح أي قيمة غير فارغة إذا كان خادمك لا يفرض المصادقة:

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

<Tip>
للإعداد غير التفاعلي (في CI أو البرمجة النصية)، مرّر عنوان URL الأساسي والمفتاح والنموذج مباشرةً:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## اكتشاف النماذج (المزوّد الضمني)

عند تعيين `VLLM_API_KEY` (أو وجود ملف تعريف للمصادقة) وعدم تعريف `models.providers.vllm`، يستعلم OpenClaw من `GET http://127.0.0.1:8000/v1/models` ويحوّل المعرّفات المُعادة إلى إدخالات نماذج.

<Note>
إذا عيّنت `models.providers.vllm` صراحةً، فسيستخدم OpenClaw النماذج التي صرّحت بها فقط. أضف `"vllm/*": {}` إلى `agents.defaults.models` لكي يستعلم OpenClaw أيضًا من نقطة النهاية `/models` لذلك المزوّد المُعدّ، ويضمّن جميع نماذج vLLM المُعلن عنها.
</Note>

## الإعداد الصريح

استخدم الإعداد الصريح عندما يعمل vLLM على مضيف أو منفذ مختلف، أو عندما تريد تثبيت قيمتَي `contextWindow` و`maxTokens`، أو عندما يتطلب خادمك مفتاح API حقيقيًا، أو عندما تتصل بنقطة نهاية موثوقة عبر local loopback أو الشبكة المحلية أو Tailscale:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

لإبقاء المزوّد ديناميكيًا من دون إدراج كل نموذج، أضف حرف بدل إلى كتالوج النماذج المرئي:

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

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="السلوك الشبيه بالوكيل">
    يُعامل vLLM بوصفه واجهة خلفية `/v1` شبيهة بالوكيل ومتوافقة مع OpenAI، وليس نقطة نهاية أصلية لـ OpenAI:

    | السلوك                                 | هل يُطبّق؟                       |
    | -------------------------------------- | -------------------------------- |
    | تشكيل طلبات OpenAI الأصلية             | لا                               |
    | `service_tier`                         | لا يُرسل                         |
    | `store` في الاستجابات                  | لا يُرسل                         |
    | تلميحات ذاكرة التخزين المؤقت للموجّهات | لا تُرسل                         |
    | تشكيل حمولة توافق الاستدلال مع OpenAI  | لا يُطبّق                        |
    | ترويسات الإسناد المخفية لـ OpenClaw    | لا تُدرج في عناوين URL الأساسية المخصصة |

  </Accordion>

  <Accordion title="عناصر التحكم في التفكير لنماذج Qwen">
    بالنسبة إلى نماذج Qwen، عيّن `compat.thinkingFormat: "qwen-chat-template"` في صف النموذج عندما يتوقع الخادم معاملات قالب محادثة Qwen. تعرض هذه النماذج ملف تعريف ثنائيًا لـ `/think` (`off` و`on`)، لأن التفكير في قالب محادثة Qwen عبارة عن علامة تشغيل/إيقاف، وليس سلّمًا لمستويات الجهد على نمط OpenAI.

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

    ترسل مستويات التفكير غير `off` القيمة `enable_thinking: true`. إذا كانت نقطة النهاية لديك تتوقع بدلًا من ذلك علامات في المستوى الأعلى على نمط DashScope، فاستخدم `compat.thinkingFormat: "qwen"` لإرسال `enable_thinking` في جذر الطلب.

  </Accordion>

  <Accordion title="عناصر التحكم في التفكير لنماذج Nemotron 3">
    بالنسبة إلى نماذج `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin المضمّن ما يلي:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    لتخصيص هذه القيم، عيّن `chat_template_kwargs` ضمن معاملات النموذج. إذا عيّنت أيضًا `params.extra_body.chat_template_kwargs`، فستكون لتلك القيمة الأولوية لأن `extra_body` هو آخر تجاوز لنص الطلب.

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

  <Accordion title="ظهور استدعاءات أدوات Qwen كنص">
    تأكد أولًا من بدء vLLM باستخدام محلّل استدعاءات الأدوات وقالب المحادثة الصحيحين للنموذج. توثّق vLLM استخدام `hermes` لنماذج Qwen2.5 و`qwen3_xml` لنماذج Qwen3-Coder.

    الأعراض: لا تعمل Skills أو الأدوات مطلقًا، أو يطبع المساعد JSON/XML خامًا مثل `{"name":"read","arguments":...}`، أو يعيد vLLM مصفوفة `tool_calls` فارغة عندما يرسل OpenClaw ‏`tool_choice: "auto"`.

    لا تعيد بعض تركيبات Qwen وvLLM استدعاءات أدوات منظّمة إلا عندما يستخدم الطلب `tool_choice: "required"`. افرض ذلك لكل نموذج باستخدام `params.extra_body`:

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

    استبدل معرّف النموذج بالمعرّف الدقيق الناتج من `openclaw models list --provider vllm`، أو طبّق التجاوز نفسه من CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    هذا حل بديل يتطلب الاشتراك الصريح: فهو يجبر كل دور يحتوي على أدوات على إجراء استدعاء أداة، لذا لا تستخدمه إلا لإدخال نموذج مخصص يكون فيه ذلك مقبولًا. لا تعيّنه إعدادًا افتراضيًا عامًا لجميع نماذج vLLM، ولا تقرنه بوكيل يحوّل نصوص المساعد العشوائية إلى استدعاءات أدوات قابلة للتنفيذ.

  </Accordion>

  <Accordion title="عنوان URL أساسي مخصص">
    إذا كان خادم vLLM يعمل على مضيف أو منفذ غير افتراضي، فعيّن `baseUrl` في إعداد المزوّد الصريح:

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
  <Accordion title="بطء الاستجابة الأولى أو انتهاء مهلة الخادم البعيد">
    بالنسبة إلى النماذج المحلية الكبيرة، أو مضيفي الشبكة المحلية البعيدين، أو اتصالات شبكة tailnet، عيّن مهلة طلب على مستوى المزوّد:

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

    ينطبق `timeoutSeconds` على طلبات HTTP الخاصة بنماذج vLLM فقط: إعداد الاتصال، وترويسات الاستجابة، وبث النص، والإلغاء الكلي لعملية الجلب المحمية. كما يرفع الحد الأقصى لمراقب خمول LLM أو البث فوق القيمة الافتراضية الضمنية البالغة نحو 120 ثانية لهذا المزوّد. يُفضّل هذا على زيادة `agents.defaults.timeoutSeconds`، التي تتحكم في تشغيل الوكيل بأكمله.

  </Accordion>

  <Accordion title="تعذر الوصول إلى الخادم">
    تحقق من أن خادم vLLM قيد التشغيل ويمكن الوصول إليه:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    إذا ظهر خطأ في الاتصال، فتحقق من المضيف والمنفذ ومن بدء vLLM في وضع الخادم المتوافق مع OpenAI. يثق OpenClaw في الأصل المحدد بدقة في `models.providers.vllm.baseUrl` لطلبات النماذج المحمية عبر نقاط نهاية local loopback والشبكة المحلية وTailscale. تظل أصول بيانات التعريف أو الأصول المحلية للرابط محظورة دون اشتراك صريح. عيّن `models.providers.vllm.request.allowPrivateNetwork: true` فقط عندما يجب أن تصل طلبات vLLM إلى أصل خاص آخر، أو `false` لإلغاء الثقة في الأصل المطابق تمامًا.

  </Accordion>

  <Accordion title="أخطاء المصادقة في الطلبات">
    إذا فشلت الطلبات بسبب أخطاء في المصادقة، فعيّن قيمة حقيقية لـ `VLLM_API_KEY` تطابق إعداد خادمك، أو أعدّ المزوّد صراحةً ضمن `models.providers.vllm`.

    <Tip>
    إذا كان خادم vLLM لا يفرض المصادقة، فستصلح أي قيمة غير فارغة لـ `VLLM_API_KEY` بوصفها إشارة اشتراك صريح لـ OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="لم يُكتشف أي نموذج">
    يتطلب الاكتشاف التلقائي تعيين `VLLM_API_KEY`. إذا عرّفت `models.providers.vllm`، فسيستخدم OpenClaw النماذج التي صرّحت بها فقط، ما لم يتضمن `agents.defaults.models` القيمة `"vllm/*": {}`.
  </Accordion>

  <Accordion title="عرض الأدوات كنص خام">
    إذا طبع نموذج Qwen صيغة أدوات JSON/XML بدلًا من تنفيذ إحدى Skills:

    - ابدأ vLLM باستخدام المحلّل والقالب الصحيحين لذلك النموذج.
    - تأكد من معرّف النموذج الدقيق باستخدام `openclaw models list --provider vllm`.
    - أضف تجاوزًا مخصصًا لكل نموذج بالقيمة `params.extra_body.tool_choice: "required"` فقط إذا ظل `tool_choice: "auto"` يعيد استدعاءات أدوات فارغة أو نصية فقط.

  </Accordion>
</AccordionGroup>

<Warning>
لمزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
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
