---
read_when:
    - تريد تشغيل OpenClaw مقابل خادم inferrs محلي
    - أنت تقدّم Gemma أو نموذجًا آخر عبر inferrs
    - You need the exact OpenClaw compat flags for inferrs
summary: شغّل OpenClaw عبر inferrs (خادم محلي متوافق مع OpenAI)
title: Inferrs
x-i18n:
    generated_at: "2026-04-24T07:59:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

يمكن لـ [inferrs](https://github.com/ericcurtin/inferrs) تقديم نماذج محلية خلف
واجهة OpenAI-compatible من نوع `/v1` API. ويعمل OpenClaw مع `inferrs` عبر
المسار العام `openai-completions`.

من الأفضل حاليًا التعامل مع `inferrs` كواجهة خلفية مخصصة ذاتية الاستضافة ومتوافقة مع OpenAI،
وليس كمزوّد Plugin مخصص في OpenClaw.

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
  <Step title="تحقق من أن الخادم قابل للوصول">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="أضف إدخال مزوّد في OpenClaw">
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

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="لماذا تهم requiresStringContent">
    تقبل بعض مسارات Chat Completions في `inferrs` حقل
    `messages[].content` كسلسلة فقط، وليس كمصفوفات منظمة لأجزاء المحتوى.

    <Warning>
    إذا فشلت تشغيلات OpenClaw برسالة خطأ مثل:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    فاضبط `compat.requiresStringContent: true` في إدخال النموذج.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    سيقوم OpenClaw بتسطيح أجزاء المحتوى النصية البحتة إلى سلاسل عادية قبل إرسال
    الطلب.

  </Accordion>

  <Accordion title="محاذير Gemma ومخطط الأدوات">
    تقبل بعض التركيبات الحالية بين `inferrs` وGemma طلبات
    `/v1/chat/completions` المباشرة الصغيرة، لكنها ما تزال تفشل على أدوار وقت تشغيل
    الوكيل الكاملة في OpenClaw.

    إذا حدث ذلك، فجرّب هذا أولًا:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    يؤدي هذا إلى تعطيل سطح مخطط أدوات OpenClaw لهذا النموذج، ويمكنه تقليل ضغط المطالبة
    على الواجهات الخلفية المحلية الأكثر صرامة.

    إذا كانت الطلبات المباشرة الصغيرة ما تزال تعمل لكن أدوار الوكيل العادية في OpenClaw
    تواصل التعطل داخل `inferrs`، فغالبًا ما تكون المشكلة المتبقية
    سلوكًا صادرًا من الخادم/النموذج upstream، وليست من طبقة النقل في OpenClaw.

  </Accordion>

  <Accordion title="اختبار smoke يدوي">
    بعد الإعداد، اختبر الطبقتين كلتيهما:

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

    إذا نجح الأمر الأول لكن فشل الثاني، فراجع قسم استكشاف الأخطاء وإصلاحها أدناه.

  </Accordion>

  <Accordion title="سلوك على نمط الوكيل">
    يُعامل `inferrs` كواجهة خلفية على نمط الوكيل ومتوافقة مع OpenAI `/v1`، وليس
    كنقطة نهاية OpenAI أصلية.

    - لا ينطبق هنا تشكيل الطلبات الخاص بـ OpenAI الأصلي فقط
    - لا يوجد `service_tier`، ولا Responses `store`، ولا تلميحات prompt-cache، ولا
      تشكيل للحمولة المتوافقة مع استدلال OpenAI
    - لا يتم حقن رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator`, `version`, `User-Agent`)
      على عناوين `inferrs` المخصصة من نوع base URL

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="فشل curl /v1/models">
    `inferrs` لا يعمل، أو لا يمكن الوصول إليه، أو أنه غير مربوط إلى
    المضيف/المنفذ المتوقعين. تأكد من أن الخادم قد بدأ وأنه يستمع على العنوان الذي
    قمت بإعداده.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    اضبط `compat.requiresStringContent: true` في إدخال النموذج. راجع
    قسم `requiresStringContent` أعلاه للحصول على التفاصيل.
  </Accordion>

  <Accordion title="تنجح الاستدعاءات المباشرة لـ /v1/chat/completions لكن يفشل openclaw infer model run">
    جرّب ضبط `compat.supportsTools: false` لتعطيل سطح مخطط الأدوات.
    راجع محاذير Gemma ومخطط الأدوات أعلاه.
  </Accordion>

  <Accordion title="ما يزال inferrs يتعطل في أدوار الوكيل الأكبر">
    إذا لم يعد OpenClaw يحصل على أخطاء مخطط لكن `inferrs` ما يزال يتعطل في أدوار
    الوكيل الأكبر، فتعامل معه على أنه قيد صادر من `inferrs` أو من النموذج upstream. قلّل
    ضغط المطالبة أو بدّل إلى واجهة خلفية أو نموذج محلي مختلف.
  </Accordion>
</AccordionGroup>

<Tip>
للحصول على مساعدة عامة، راجع [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="النماذج المحلية" href="/ar/gateway/local-models" icon="server">
    تشغيل OpenClaw مقابل خوادم نماذج محلية.
  </Card>
  <Card title="استكشاف أخطاء Gateway وإصلاحها" href="/ar/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    تصحيح الواجهات الخلفية المحلية المتوافقة مع OpenAI التي تنجح في الفحوصات المباشرة لكنها تفشل في تشغيلات الوكيل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين، ومراجع النماذج، وسلوك الرجوع عند الفشل.
  </Card>
</CardGroup>
