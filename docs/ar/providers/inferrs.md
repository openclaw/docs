---
read_when:
    - تريد تشغيل OpenClaw مع خادم inferrs محلي
    - أنت تقدّم Gemma أو نموذجًا آخر عبر inferrs
    - تحتاج إلى علامات توافق OpenClaw الدقيقة لـ inferrs
summary: تشغيل OpenClaw عبر inferrs (خادم محلي متوافق مع OpenAI)
title: يستنتج
x-i18n:
    generated_at: "2026-05-06T08:10:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) يمكنه تشغيل النماذج المحلية خلف واجهة API متوافقة مع OpenAI على المسار `/v1`. يعمل OpenClaw مع `inferrs` عبر مسار `openai-completions` العام.

| الخاصية           | القيمة                                                              |
| ------------------ | ------------------------------------------------------------------ |
| معرّف المزوّد        | `inferrs` (مخصص؛ اضبطه ضمن `models.providers.inferrs`)     |
| Plugin             | لا شيء — `inferrs` ليس Plugin مزوّدًا مضمنًا في OpenClaw         |
| متغير بيئة المصادقة       | اختياري. تعمل أي قيمة إذا لم يكن خادم inferrs لديك يتطلب مصادقة       |
| API                | متوافق مع OpenAI (`openai-completions`)                           |
| عنوان URL الأساسي المقترح | `http://127.0.0.1:8080/v1` (أو أينما كان خادم inferrs لديك) |

<Note>
  يُفضّل حاليًا التعامل مع `inferrs` كخلفية مخصصة مستضافة ذاتيًا ومتوافقة مع OpenAI، وليس كـ Plugin مزوّد مخصص في OpenClaw. تضبطه عبر `models.providers.inferrs` بدلًا من علم اختيار الإعداد الأولي. إذا كنت تحتاج إلى Plugin مضمن حقيقي مع اكتشاف تلقائي، فراجع [SGLang](/ar/providers/sglang) أو [vLLM](/ar/providers/vllm).
</Note>

## البدء

<Steps>
  <Step title="ابدأ inferrs باستخدام نموذج">
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
    أضف إدخال مزوّد صريحًا ووجّه نموذجك الافتراضي إليه. راجع مثال التكوين الكامل أدناه.
  </Step>
</Steps>

## مثال تكوين كامل

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

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="لماذا requiresStringContent مهم">
    تقبل بعض مسارات Chat Completions في `inferrs` قيمة
    `messages[].content` النصية فقط، وليس مصفوفات أجزاء المحتوى المنظمة.

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
    `/v1/chat/completions` المباشرة الصغيرة لكنها لا تزال تفشل عند دورات وقت تشغيل وكيل OpenClaw
    الكاملة.

    إذا حدث ذلك، جرّب هذا أولًا:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    يؤدي ذلك إلى تعطيل سطح مخطط أدوات OpenClaw للنموذج ويمكن أن يقلل ضغط المحث
    على الخلفيات المحلية الأكثر صرامة.

    إذا ظلت الطلبات المباشرة الصغيرة تعمل لكن دورات وكيل OpenClaw العادية تواصل
    الانهيار داخل `inferrs`، فغالبًا ما تكون المشكلة المتبقية في سلوك النموذج/الخادم
    upstream بدلًا من طبقة النقل في OpenClaw.

  </Accordion>

  <Accordion title="اختبار smoke يدوي">
    بعد التكوين، اختبر كلتا الطبقتين:

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

  <Accordion title="سلوك بأسلوب الوكيل">
    يُعامل `inferrs` كخلفية `/v1` بأسلوب الوكيل ومتوافقة مع OpenAI، وليس كنقطة نهاية
    OpenAI أصلية.

    - لا ينطبق تشكيل الطلبات الخاصة بـ OpenAI الأصلي فقط هنا
    - لا يوجد `service_tier`، ولا `store` في Responses، ولا تلميحات prompt-cache، ولا
      تشكيل حمولة توافق الاستدلال في OpenAI
    - لا تُحقن ترويسات إسناد OpenClaw المخفية (`originator`، `version`، `User-Agent`)
      في عناوين URL الأساسية المخصصة لـ `inferrs`

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="فشل curl /v1/models">
    `inferrs` لا يعمل، أو لا يمكن الوصول إليه، أو ليس مربوطًا بالمضيف/المنفذ المتوقعين.
    تأكد من بدء تشغيل الخادم وأنه يستمع على العنوان الذي
    ضبطته.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    اضبط `compat.requiresStringContent: true` في إدخال النموذج. راجع قسم
    `requiresStringContent` أعلاه للحصول على التفاصيل.
  </Accordion>

  <Accordion title="تنجح استدعاءات /v1/chat/completions المباشرة لكن يفشل openclaw infer model run">
    جرّب ضبط `compat.supportsTools: false` لتعطيل سطح مخطط الأدوات.
    راجع تنبيه مخطط أدوات Gemma أعلاه.
  </Accordion>

  <Accordion title="لا يزال inferrs ينهار في دورات الوكيل الأكبر">
    إذا لم يعد OpenClaw يتلقى أخطاء مخطط لكن `inferrs` لا يزال ينهار في دورات
    الوكيل الأكبر، فتعامل مع ذلك كقيد في `inferrs` أو النموذج upstream. قلل
    ضغط المحث أو انتقل إلى خلفية أو نموذج محلي مختلف.
  </Accordion>
</AccordionGroup>

<Tip>
للمساعدة العامة، راجع [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Tip>

## ذات صلة

<CardGroup cols={2}>
  <Card title="النماذج المحلية" href="/ar/gateway/local-models" icon="server">
    تشغيل OpenClaw مقابل خوادم النماذج المحلية.
  </Card>
  <Card title="استكشاف أخطاء Gateway وإصلاحها" href="/ar/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    تصحيح أخطاء الخلفيات المحلية المتوافقة مع OpenAI التي تجتاز المجسات لكنها تفشل في تشغيلات الوكيل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
</CardGroup>
