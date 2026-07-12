---
read_when:
    - تريد تشغيل OpenClaw باستخدام خادم inferrs محلي
    - أنت تقدّم Gemma أو نموذجًا آخر عبر inferrs
    - تحتاج إلى علامات التوافق الدقيقة الخاصة بـ OpenClaw لـ inferrs
summary: شغّل OpenClaw عبر inferrs (خادم محلي متوافق مع OpenAI)
title: يستنتج
x-i18n:
    generated_at: "2026-07-12T06:29:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) يتيح النماذج المحلية خلف واجهة `/v1` متوافقة مع OpenAI. يتواصل OpenClaw معه عبر المحوّل العام `openai-completions`.

| الخاصية             | القيمة                                                                      |
| ------------------ | -------------------------------------------------------------------- |
| معرّف المزوّد       | `inferrs` (مخصّص؛ اضبطه ضمن `models.providers.inferrs`)                     |
| Plugin             | لا يوجد — ليس Plugin مزوّدًا مضمنًا في OpenClaw                             |
| متغير بيئة المصادقة | غير مطلوب؛ تصلح أي قيمة إذا كان خادم inferrs لديك لا يستخدم المصادقة       |
| API                | متوافقة مع OpenAI ‏(`openai-completions`)                                   |
| عنوان URL الأساسي المقترح | `http://127.0.0.1:8080/v1` (أو أي مكان يستمع فيه خادم inferrs لديك) |

<Note>
  يُعد `inferrs` خلفية مخصّصة ذاتية الاستضافة ومتوافقة مع OpenAI، وليس Plugin مزوّدًا مخصصًا لـ OpenClaw: تضبطه ضمن `models.providers.inferrs` بدلًا من اختيار خيار مصادقة في الإعداد الأولي. للحصول على Plugin مضمن يدعم الاكتشاف التلقائي، راجع [SGLang](/ar/providers/sglang) أو [vLLM](/ar/providers/vllm).
</Note>

## بدء الاستخدام

<Steps>
  <Step title="شغّل inferrs باستخدام نموذج">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="تحقّق من إمكانية الوصول إلى الخادم">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="أضف إدخال مزوّد إلى OpenClaw">
    أضف إدخال مزوّد صريحًا ووجّه نموذجك الافتراضي إليه. راجع مثال الإعداد أدناه.
  </Step>
</Steps>

## مثال كامل للإعداد

Gemma 4 على خادم `inferrs` محلي:

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

## التشغيل عند الطلب

يمكن لـ OpenClaw تشغيل `inferrs` بنفسه فقط عند تحديد نموذج `inferrs/...`. أضف `localService` إلى إدخال المزوّد نفسه:

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

يجب أن يكون `command` مسارًا مطلقًا. شغّل `which inferrs` على مضيف Gateway واستخدم ذلك المسار. مرجع الحقول الكامل: [خدمات النماذج المحلية](/ar/gateway/local-model-services).

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="أهمية requiresStringContent">
    لا تقبل بعض مسارات إكمالات المحادثة في `inferrs` سوى قيمة نصية في `messages[].content`، وليس مصفوفات منظّمة من أجزاء المحتوى.

    <Warning>
    إذا فشلت عمليات تشغيل OpenClaw مع الرسالة:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    فاضبط `compat.requiresStringContent: true` في إدخال النموذج. عندئذٍ يسطّح OpenClaw أجزاء المحتوى النصية البحتة إلى سلاسل نصية عادية قبل إرسال الطلب.
    </Warning>

  </Accordion>

  <Accordion title="تنبيه بشأن Gemma ومخطط الأدوات">
    تقبل بعض تركيبات `inferrs` مع Gemma طلبات `/v1/chat/completions` المباشرة الصغيرة، لكنها تفشل في دورات وقت تشغيل وكيل OpenClaw الكاملة. جرّب أولًا تعطيل سطح مخطط الأدوات:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    يقلّل ذلك ضغط الموجّه على الخلفيات المحلية الأكثر صرامة. إذا استمرت الطلبات المباشرة الصغيرة في العمل، لكن ظلت دورات وكيل OpenClaw العادية تتعطل داخل `inferrs`، فتعامل مع ذلك باعتباره قيدًا في النموذج أو الخادم الأساسي، وليس مشكلة في نقل OpenClaw.

  </Accordion>

  <Accordion title="اختبار تحقق يدوي">
    اختبر كلتا الطبقتين بعد الإعداد:

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

    إذا نجح الأمر الأول وفشل الثاني، فراجع استكشاف الأخطاء وإصلاحها أدناه.

  </Accordion>

  <Accordion title="السلوك الشبيه بالوكيل">
    نظرًا إلى أن `inferrs` يستخدم المحوّل العام `openai-completions` (وليس `openai-responses`)، فلا تُطبّق أبدًا صياغة الطلبات الخاصة بـ OpenAI الأصلي: لا يُرسل `service_tier`، ولا `store` الخاص بـ Responses، ولا تلميحات ذاكرة التخزين المؤقت للموجّه، ولا صياغة حمولة توافق الاستدلال الخاصة بـ OpenAI.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="فشل curl /v1/models">
    إما أن `inferrs` لا يعمل، أو لا يمكن الوصول إليه، أو أنه غير مرتبط بالمضيف أو المنفذ اللذين ضبطتهما. تأكد من تشغيل الخادم واستماعه على ذلك العنوان.
  </Accordion>

  <Accordion title="توقّع messages[].content سلسلة نصية">
    اضبط `compat.requiresStringContent: true` في إدخال النموذج (راجع أعلاه).
  </Accordion>

  <Accordion title="نجاح استدعاءات /v1/chat/completions المباشرة وفشل openclaw infer model run">
    اضبط `compat.supportsTools: false` لتعطيل سطح مخطط الأدوات (راجع تنبيه Gemma أعلاه).
  </Accordion>

  <Accordion title="استمرار تعطل inferrs في دورات الوكيل الأكبر">
    إذا اختفت أخطاء المخطط، لكن استمر تعطل `inferrs` في دورات الوكيل الأكبر، فتعامل مع ذلك باعتباره قيدًا في `inferrs` أو النموذج الأساسي. قلّل ضغط الموجّه أو بدّل الخلفية أو النموذج.
  </Accordion>
</AccordionGroup>

<Tip>
للحصول على مساعدة عامة، راجع [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="النماذج المحلية" href="/ar/gateway/local-models" icon="server">
    تشغيل OpenClaw مع خوادم النماذج المحلية.
  </Card>
  <Card title="خدمات النماذج المحلية" href="/ar/gateway/local-model-services" icon="play">
    تشغيل خوادم النماذج المحلية عند الطلب للمزوّدين المضبوطين.
  </Card>
  <Card title="استكشاف أخطاء Gateway وإصلاحها" href="/ar/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    تصحيح أخطاء الخلفيات المحلية المتوافقة مع OpenAI التي تجتاز الاختبارات الأولية، لكن تفشل في عمليات تشغيل الوكيل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
</CardGroup>
