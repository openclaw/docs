---
read_when:
    - تريد تقديم النماذج من جهاز GPU الخاص بك
    - أنت تقوم بإعداد LM Studio أو وكيل متوافق مع OpenAI
    - تحتاج إلى أكثر إرشادات النماذج المحلية أمانًا
summary: شغّل OpenClaw على نماذج LLM المحلية (LM Studio، vLLM، LiteLLM، ونقاط نهاية OpenAI المخصّصة)
title: النماذج المحلية
x-i18n:
    generated_at: "2026-04-15T07:17:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8778cc1c623a356ff3cf306c494c046887f9417a70ec71e659e4a8aae912a780
    source_path: gateway/local-models.md
    workflow: 15
---

# النماذج المحلية

التشغيل المحلي ممكن، لكن OpenClaw يتوقع سياقًا كبيرًا + دفاعات قوية ضد حقن المطالبات. البطاقات الصغيرة تقطع السياق وتُضعف الأمان. استهدف مستوى مرتفعًا: **استوديوهَي Mac Studio على الأقل بكامل المواصفات أو منصة GPU مكافئة (~30 ألف دولار فأكثر)**. تعمل بطاقة GPU واحدة بسعة **24 GB** فقط مع المطالبات الأخف وزمن استجابة أعلى. استخدم **أكبر / النسخة كاملة الحجم من النموذج التي يمكنك تشغيلها**؛ فالإصدارات المضغوطة بشدة أو نقاط التحقق “الصغيرة” تزيد من مخاطر حقن المطالبات (راجع [الأمان](/ar/gateway/security)).

إذا كنت تريد إعدادًا محليًا بأقل قدر من التعقيد، فابدأ بـ [LM Studio](/ar/providers/lmstudio) أو [Ollama](/ar/providers/ollama) واستخدم `openclaw onboard`. هذه الصفحة هي الدليل العملي الموجّه للبنى المحلية الأعلى مستوى وخوادم OpenAI المحلية المخصّصة المتوافقة.

## الموصى به: LM Studio + نموذج محلي كبير (Responses API)

أفضل بنية محلية حاليًا. حمّل نموذجًا كبيرًا في LM Studio (على سبيل المثال، إصدارًا كامل الحجم من Qwen أو DeepSeek أو Llama)، وفعّل الخادم المحلي (الافتراضي `http://127.0.0.1:1234`)، واستخدم Responses API للحفاظ على فصل الاستدلال عن النص النهائي.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**قائمة إعداد سريعة**

- ثبّت LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- في LM Studio، نزّل **أكبر إصدار متاح من النموذج** (تجنّب الإصدارات “الصغيرة”/المضغوطة بشدة)، ثم شغّل الخادم، وتأكد من أن `http://127.0.0.1:1234/v1/models` يعرضه.
- استبدل `my-local-model` بمعرّف النموذج الفعلي الظاهر في LM Studio.
- أبقِ النموذج محمّلًا؛ فالتحميل البارد يضيف زمن بدء.
- اضبط `contextWindow` و`maxTokens` إذا كان إصدار LM Studio لديك مختلفًا.
- بالنسبة إلى WhatsApp، التزم باستخدام Responses API بحيث لا يُرسل سوى النص النهائي.

أبقِ النماذج المستضافة مهيأة حتى عند التشغيل المحلي؛ استخدم `models.mode: "merge"` حتى تظل بدائل التراجع متاحة.

### إعداد هجين: نموذج مستضاف أساسي، وتراجع محلي

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### محلي أولًا مع شبكة أمان مستضافة

بدّل ترتيب النموذج الأساسي وبدائل التراجع؛ وأبقِ كتلة providers نفسها و`models.mode: "merge"` حتى تتمكن من التراجع إلى Sonnet أو Opus عندما يتعطل الجهاز المحلي.

### الاستضافة الإقليمية / توجيه البيانات

- تتوفر أيضًا إصدارات MiniMax/Kimi/GLM المستضافة على OpenRouter مع نقاط نهاية مثبتة على مناطق محددة (مثل الاستضافة داخل الولايات المتحدة). اختر الإصدار الإقليمي هناك لإبقاء الحركة ضمن النطاق القضائي الذي تختاره، مع الاستمرار في استخدام `models.mode: "merge"` لبدائل التراجع من Anthropic/OpenAI.
- يظل التشغيل المحلي فقط هو المسار الأقوى من ناحية الخصوصية؛ أما التوجيه الإقليمي للاستضافة فهو الحل الوسط عندما تحتاج إلى ميزات المزوّد لكنك تريد التحكم في تدفق البيانات.

## وكلاء محليون آخرون متوافقون مع OpenAI

يمكن استخدام vLLM أو LiteLLM أو OAI-proxy أو البوابات المخصصة إذا كانت توفّر نقطة نهاية `/v1` بأسلوب OpenAI. استبدل كتلة provider أعلاه بنقطة النهاية ومعرّف النموذج الخاصين بك:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

أبقِ `models.mode: "merge"` حتى تظل النماذج المستضافة متاحة كبدائل تراجع.

ملاحظة سلوكية للخلفيات المحلية/المعتمدة على وكيل `/v1`:

- يتعامل OpenClaw مع هذه المسارات على أنها مسارات وكيل متوافقة مع OpenAI، وليست
  نقاط نهاية OpenAI أصلية
- لا ينطبق هنا تشكيل الطلبات الخاص بـ OpenAI الأصلي فقط: لا يوجد
  `service_tier`، ولا `store` الخاص بـ Responses، ولا تشكيل حمولة
  التوافق مع الاستدلال في OpenAI، ولا تلميحات cache للمطالبة
- لا يتم حقن ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`)
  على عناوين URL الخاصة بهذه الوكلاء المخصصة

ملاحظات التوافق للخلفيات الأكثر صرامة والمتوافقة مع OpenAI:

- تقبل بعض الخوادم فقط `messages[].content` كسلسلة نصية في Chat Completions، وليس
  مصفوفات أجزاء المحتوى المنظمة. اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true` لتلك
  النقاط النهائية.
- تكون بعض الخلفيات المحلية الأصغر أو الأكثر صرامة غير مستقرة مع الشكل الكامل
  لمطالبة بيئة تشغيل الوكيل في OpenClaw، خاصةً عند تضمين مخططات الأدوات. إذا كانت
  الخلفية تعمل مع طلبات `/v1/chat/completions` المباشرة والصغيرة لكنها تفشل في
  دورات الوكيل العادية في OpenClaw، فجرّب أولًا
  `agents.defaults.localModelMode: "lean"` لإسقاط الأدوات الافتراضية الثقيلة
  مثل `browser` و`cron` و`message`؛ وإذا استمر الفشل بعد ذلك، فجرّب
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- إذا كانت الخلفية لا تزال تفشل فقط في تشغيلات OpenClaw الأكبر، فغالبًا تكون
  المشكلة المتبقية سعة النموذج/الخادم من الجهة العليا أو خطأ في الخلفية، وليس
  في طبقة النقل الخاصة بـ OpenClaw.

## استكشاف الأخطاء وإصلاحها

- هل تستطيع Gateway الوصول إلى الوكيل؟ `curl http://127.0.0.1:1234/v1/models`.
- هل تم إلغاء تحميل نموذج LM Studio؟ أعد تحميله؛ فالبدء البارد سبب شائع لـ “التعليق”.
- يحذّر OpenClaw عندما تكون نافذة السياق المكتشفة أقل من **32k** ويمنع التشغيل عندما تكون أقل من **16k**. إذا واجهت هذا الفحص المسبق، فارفع حد السياق في الخادم/النموذج أو اختر نموذجًا أكبر.
- أخطاء السياق؟ خفّض `contextWindow` أو ارفع حد الخادم لديك.
- هل يُرجع الخادم المتوافق مع OpenAI الخطأ `messages[].content ... expected a string`؟
  أضف `compat.requiresStringContent: true` إلى إدخال ذلك النموذج.
- تعمل طلبات `/v1/chat/completions` المباشرة والصغيرة، لكن `openclaw infer model run`
  يفشل مع Gemma أو نموذج محلي آخر؟ عطّل مخططات الأدوات أولًا باستخدام
  `compat.supportsTools: false`، ثم أعد الاختبار. إذا استمر الخادم في الانهيار فقط
  مع مطالبات OpenClaw الأكبر، فاعتبر ذلك قيدًا في الخادم/النموذج من الجهة العليا.
- الأمان: تتخطى النماذج المحلية عوامل التصفية على جهة المزوّد؛ أبقِ الوكلاء محدودي النطاق وفعّل Compaction للحد من نطاق تأثير حقن المطالبات.
