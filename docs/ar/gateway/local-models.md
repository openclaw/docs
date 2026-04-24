---
read_when:
    - تريد تقديم النماذج من جهاز GPU الخاص بك
    - أنت تقوم بتوصيل LM Studio أو وكيل متوافق مع OpenAI
    - تحتاج إلى أكثر الإرشادات أمانًا للنماذج المحلية
summary: تشغيل OpenClaw على LLMs محلية (LM Studio وvLLM وLiteLLM ونقاط نهاية OpenAI مخصصة)
title: النماذج المحلية
x-i18n:
    generated_at: "2026-04-24T07:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

الإعداد المحلي ممكن، لكن OpenClaw يتوقع سياقًا كبيرًا + دفاعات قوية ضد حقن الموجّهات. تؤدي البطاقات الصغيرة إلى اقتطاع السياق وإضعاف الأمان. استهدف مستوى مرتفعًا: **استوديوهين Mac Studio ممتلئين على الأقل أو جهاز GPU مكافئ (~30 ألف دولار فأكثر)**. تعمل بطاقة **24 GB** واحدة فقط مع مطالبات أخف وزمن استجابة أعلى. استخدم **أكبر / إصدار النموذج الكامل الذي يمكنك تشغيله**؛ إذ إن نقاط التحقق المضغوطة بقوة أو "الصغيرة" تزيد من مخاطر حقن الموجّهات (راجع [الأمان](/ar/gateway/security)).

إذا كنت تريد أقل إعداد محلي احتكاكًا، فابدأ بـ [LM Studio](/ar/providers/lmstudio) أو [Ollama](/ar/providers/ollama) و`openclaw onboard`. هذه الصفحة هي الدليل الموجّه للرأي للإعدادات المحلية الأعلى مستوى وخوادم OpenAI المحلية المخصصة المتوافقة.

## الموصى به: LM Studio + نموذج محلي كبير (Responses API)

أفضل إعداد محلي حالي. حمّل نموذجًا كبيرًا في LM Studio (على سبيل المثال، إصدارًا كامل الحجم من Qwen أو DeepSeek أو Llama)، وفعّل الخادم المحلي (الافتراضي `http://127.0.0.1:1234`)، واستخدم Responses API لإبقاء الاستدلال منفصلًا عن النص النهائي.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
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

**قائمة إعداد سريعة**

- ثبّت LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- في LM Studio، نزّل **أكبر إصدار نموذج متاح** (تجنّب الإصدارات "الصغيرة"/المضغوطة بشدة)، وابدأ الخادم، وأكّد أن `http://127.0.0.1:1234/v1/models` يسرده.
- استبدل `my-local-model` بمعرّف النموذج الفعلي الظاهر في LM Studio.
- أبقِ النموذج محمّلًا؛ فالتحميل البارد يضيف زمن بدء.
- اضبط `contextWindow`/`maxTokens` إذا كان إصدار LM Studio لديك مختلفًا.
- بالنسبة إلى WhatsApp، التزم بـ Responses API بحيث يتم إرسال النص النهائي فقط.

أبقِ النماذج المستضافة مهيأة حتى عند التشغيل المحلي؛ استخدم `models.mode: "merge"` بحيث تظل عمليات الرجوع الاحتياطي متاحة.

### إعداد هجين: أساسي مستضاف، ورجوع احتياطي محلي

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

بدّل ترتيب الأساسي والرجوع الاحتياطي؛ واحتفظ بكتلة الموفرين نفسها و`models.mode: "merge"` بحيث يمكنك الرجوع احتياطيًا إلى Sonnet أو Opus عندما يتعطل الجهاز المحلي.

### الاستضافة الإقليمية / توجيه البيانات

- توجد أيضًا إصدارات MiniMax/Kimi/GLM المستضافة على OpenRouter مع نقاط نهاية مثبتة إقليميًا (مثل الاستضافة في الولايات المتحدة). اختر الإصدار الإقليمي هناك للإبقاء على حركة المرور ضمن الاختصاص القضائي الذي تختاره مع الاستمرار في استخدام `models.mode: "merge"` لعمليات الرجوع الاحتياطي الخاصة بـ Anthropic/OpenAI.
- يبقى الوضع المحلي فقط هو أقوى مسار للخصوصية؛ أما التوجيه الإقليمي المستضاف فهو حل وسط عندما تحتاج إلى ميزات الموفّر لكنك تريد التحكم في تدفق البيانات.

## وكلاء محليون آخرون متوافقون مع OpenAI

يعمل vLLM أو LiteLLM أو OAI-proxy أو البوابات المخصصة إذا كانت تكشف نقطة نهاية `/v1` بنمط OpenAI. استبدل كتلة الموفّر أعلاه بنقطة النهاية ومعرّف النموذج لديك:

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

أبقِ `models.mode: "merge"` بحيث تظل النماذج المستضافة متاحة كعمليات رجوع احتياطي.

ملاحظة سلوكية للواجهات الخلفية المحلية/الوكيلة `/v1`:

- يتعامل OpenClaw مع هذه المسارات على أنها مسارات متوافقة مع OpenAI بنمط الوكيل، وليست
  نقاط نهاية OpenAI أصلية
- لا يُطبَّق هنا تشكيل الطلبات الخاص بـ OpenAI الأصلي فقط:
  لا `service_tier`، ولا `store` في Responses، ولا تشكيل حمولة
  التوافق الاستدلالي الخاصة بـ OpenAI، ولا تلميحات prompt-cache
- لا يتم حقن ترويسات الإسناد المخفية الخاصة بـ OpenClaw ‏(`originator` و`version` و`User-Agent`)
  على عناوين proxy المخصصة هذه

ملاحظات التوافق مع الواجهات الخلفية الأكثر صرامة والمتوافقة مع OpenAI:

- تقبل بعض الخوادم فقط `messages[].content` كسلاسل نصية في Chat Completions، وليس
  مصفوفات أجزاء المحتوى المنظّمة. اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true` لتلك
  النقاط النهائية.
- بعض الواجهات الخلفية المحلية الأصغر أو الأكثر صرامة تكون غير مستقرة مع شكل موجّه
  وقت تشغيل الوكيل الكامل في OpenClaw، خاصةً عندما تكون مخططات الأدوات مضمنة. إذا كانت
  الواجهة الخلفية تعمل مع استدعاءات `/v1/chat/completions` مباشرة وصغيرة ولكنها تفشل مع
  دورات الوكيل العادية في OpenClaw، فجرّب أولًا
  `agents.defaults.experimental.localModelLean: true` لإسقاط الأدوات
  الافتراضية الثقيلة مثل `browser` و`cron` و`message`؛ وهذه علامة تجريبية وليست إعدادًا افتراضيًا ثابتًا. راجع
  [الميزات التجريبية](/ar/concepts/experimental-features). وإذا استمر الفشل، فجرّب
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- إذا استمرت الواجهة الخلفية في الفشل فقط في تشغيلات OpenClaw الأكبر، فعادةً ما تكون
  المشكلة المتبقية هي سعة النموذج/الخادم في المنبع أو خطأ في الواجهة الخلفية، وليس
  في طبقة النقل الخاصة بـ OpenClaw.

## استكشاف الأخطاء وإصلاحها

- هل يستطيع Gateway الوصول إلى الوكيل؟ `curl http://127.0.0.1:1234/v1/models`.
- هل تم إلغاء تحميل نموذج LM Studio؟ أعد تحميله؛ فالبداية الباردة سبب شائع لـ "التعليق".
- يحذر OpenClaw عندما تكون نافذة السياق المكتشفة أقل من **32k** ويمنع التشغيل تحت **16k**. وإذا واجهت هذا الفحص المسبق، فارفع حد سياق الخادم/النموذج أو اختر نموذجًا أكبر.
- أخطاء السياق؟ خفّض `contextWindow` أو ارفع حد الخادم.
- هل يعيد خادم متوافق مع OpenAI الخطأ `messages[].content ... expected a string`؟
  أضف `compat.requiresStringContent: true` على إدخال ذلك النموذج.
- هل تعمل استدعاءات `/v1/chat/completions` المباشرة والصغيرة، لكن `openclaw infer model run`
  يفشل على Gemma أو نموذج محلي آخر؟ عطّل أولًا مخططات الأدوات عبر
  `compat.supportsTools: false`، ثم أعد الاختبار. وإذا استمر الخادم في التعطل فقط
  مع مطالبات OpenClaw الأكبر، فتعامل مع ذلك على أنه قيد في الخادم/النموذج في المنبع.
- الأمان: تتجاوز النماذج المحلية عوامل التصفية على جانب الموفّر؛ أبقِ الوكلاء محدودين وفعّل Compaction لتقليل نطاق تأثير حقن الموجّهات.

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [Model failover](/ar/concepts/model-failover)
