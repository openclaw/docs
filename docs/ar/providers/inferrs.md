---
read_when:
    - تريد تشغيل OpenClaw مع خادم inferrs محلي
    - أنت تُشغّل Gemma أو نموذجًا آخر عبر inferrs
    - تحتاج إلى أعلام التوافق الدقيقة لـ OpenClaw من أجل inferrs
summary: تشغيل OpenClaw عبر inferrs (خادم محلي متوافق مع OpenAI)
title: يستنتج
x-i18n:
    generated_at: "2026-05-10T19:58:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
---

يمكن لـ [inferrs](https://github.com/ericcurtin/inferrs) تشغيل النماذج المحلية خلف API متوافق مع OpenAI عبر `/v1`. يعمل OpenClaw مع `inferrs` عبر مسار `openai-completions` العام.

| الخاصية           | القيمة                                                              |
| ------------------ | ------------------------------------------------------------------ |
| معرّف المزوّد        | `inferrs` (مخصص؛ اضبطه ضمن `models.providers.inferrs`)     |
| Plugin             | لا يوجد — `inferrs` ليس Plugin مزوّدًا مضمّنًا في OpenClaw         |
| متغير بيئة المصادقة       | اختياري. تعمل أي قيمة إذا لم تكن لدى خادم inferrs لديك مصادقة       |
| API                | متوافق مع OpenAI (`openai-completions`)                           |
| عنوان URL الأساسي المقترح | `http://127.0.0.1:8080/v1` (أو أينما كان خادم inferrs لديك) |

<Note>
  يُفضّل حاليًا التعامل مع `inferrs` كواجهة خلفية مخصصة ذاتية الاستضافة ومتوافقة مع OpenAI، وليس كـ Plugin مزوّد مخصص في OpenClaw. تضبطه عبر `models.providers.inferrs` بدلًا من علم اختيار أثناء الإعداد. إذا كنت تحتاج إلى Plugin مضمّن حقيقي مع اكتشاف تلقائي، فراجع [SGLang](/ar/providers/sglang) أو [vLLM](/ar/providers/vllm).
</Note>

## البدء

<Steps>
  <Step title="ابدأ inferrs مع نموذج">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="تحقق من إمكانية الوصول إلى الخادم">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="أضف إدخال مزوّد OpenClaw">
    أضف إدخال مزوّد صريحًا ووجّه نموذجك الافتراضي إليه. راجع مثال الإعداد الكامل أدناه.
  </Step>
</Steps>

## مثال إعداد كامل

يستخدم هذا المثال Gemma 4 على خادم `inferrs` محلي.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## بدء التشغيل عند الطلب

يمكن أيضًا تشغيل Inferrs بواسطة OpenClaw فقط عند اختيار نموذج `inferrs/...`.
أضف `localService` إلى إدخال المزوّد نفسه:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

يجب أن يكون `command` مطلقًا. استخدم `which inferrs` على مضيف Gateway وضع ذلك
المسار في الإعداد. لمرجع الحقول الكامل، راجع
[خدمات النماذج المحلية](/ar/gateway/local-model-services).

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="لماذا يكون requiresStringContent مهمًا">
    تقبل بعض مسارات Chat Completions في `inferrs` فقط
    `messages[].content` كسلسلة نصية، وليس مصفوفات أجزاء محتوى منظمة.

    <Warning>
    إذا فشلت عمليات تشغيل OpenClaw مع خطأ مثل:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    فاضبط `compat.requiresStringContent: true` في إدخال نموذجك.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    سيحوّل OpenClaw أجزاء المحتوى النصي الصرف إلى سلاسل نصية عادية قبل إرسال
    الطلب.

  </Accordion>

  <Accordion title="تنبيه حول Gemma ومخطط الأدوات">
    تقبل بعض تركيبات `inferrs` + Gemma الحالية طلبات
    `/v1/chat/completions` المباشرة الصغيرة، لكنها تظل تفشل في دورات وقت تشغيل وكيل OpenClaw الكاملة.

    إذا حدث ذلك، فجرّب هذا أولًا:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    يعطل ذلك سطح مخطط أدوات OpenClaw للنموذج ويمكن أن يقلل ضغط الموجه
    على الواجهات الخلفية المحلية الأكثر صرامة.

    إذا كانت الطلبات المباشرة الصغيرة لا تزال تعمل، لكن دورات وكيل OpenClaw العادية تواصل
    الانهيار داخل `inferrs`، فغالبًا ما تكون المشكلة المتبقية في سلوك النموذج/الخادم
    الصادر من المنبع بدلًا من طبقة النقل في OpenClaw.

  </Accordion>

  <Accordion title="اختبار smoke يدوي">
    بعد الإعداد، اختبر الطبقتين:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    إذا نجح الأمر الأول وفشل الثاني، فتحقق من قسم استكشاف الأخطاء وإصلاحها أدناه.

  </Accordion>

  <Accordion title="سلوك على نمط الوكيل">
    يُعامل `inferrs` كواجهة خلفية `/v1` متوافقة مع OpenAI على نمط الوكيل، وليس كنقطة نهاية
    OpenAI أصلية.

    - لا ينطبق تشكيل الطلبات الخاص بـ OpenAI الأصلي فقط هنا
    - لا يوجد `service_tier`، ولا Responses `store`، ولا تلميحات ذاكرة تخزين مؤقت للموجه، ولا
      تشكيل حمولة توافق الاستدلال في OpenAI
    - لا تُحقن ترويسات إسناد OpenClaw المخفية (`originator`، `version`، `User-Agent`)
      في عناوين URL الأساسية المخصصة لـ `inferrs`

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="فشل curl /v1/models">
    `inferrs` لا يعمل، أو لا يمكن الوصول إليه، أو ليس مربوطًا بالمضيف/المنفذ المتوقعين.
    تأكد من بدء تشغيل الخادم وأنه يستمع على العنوان الذي ضبطته.
  </Accordion>

  <Accordion title="messages[].content توقع سلسلة نصية">
    اضبط `compat.requiresStringContent: true` في إدخال النموذج. راجع قسم
    `requiresStringContent` أعلاه لمزيد من التفاصيل.
  </Accordion>

  <Accordion title="تنجح استدعاءات /v1/chat/completions المباشرة لكن يفشل openclaw infer model run">
    جرّب ضبط `compat.supportsTools: false` لتعطيل سطح مخطط الأدوات.
    راجع تنبيه مخطط أدوات Gemma أعلاه.
  </Accordion>

  <Accordion title="لا يزال inferrs ينهار في دورات الوكيل الأكبر">
    إذا لم يعد OpenClaw يتلقى أخطاء في المخطط، لكن `inferrs` لا يزال ينهار في دورات
    الوكيل الأكبر، فتعامل مع ذلك على أنه قيد منبع في `inferrs` أو في النموذج. قلل
    ضغط الموجه أو بدّل إلى واجهة خلفية محلية أو نموذج مختلف.
  </Accordion>
</AccordionGroup>

<Tip>
للمساعدة العامة، راجع [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Tip>

## ذات صلة

<CardGroup cols={2}>
  <Card title="النماذج المحلية" href="/ar/gateway/local-models" icon="server">
    تشغيل OpenClaw مقابل خوادم نماذج محلية.
  </Card>
  <Card title="خدمات النماذج المحلية" href="/ar/gateway/local-model-services" icon="play">
    بدء تشغيل خوادم النماذج المحلية عند الطلب للمزوّدين المضبوطين.
  </Card>
  <Card title="استكشاف أخطاء Gateway وإصلاحها" href="/ar/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    تصحيح الواجهات الخلفية المحلية المتوافقة مع OpenAI التي تجتاز الفحوصات لكنها تفشل في تشغيلات الوكيل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
</CardGroup>
