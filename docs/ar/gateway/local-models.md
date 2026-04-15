---
read_when:
    - تريد تقديم النماذج من جهاز GPU الخاص بك
    - أنت تقوم بإعداد LM Studio أو وكيل متوافق مع OpenAI
    - تحتاج إلى أكثر الإرشادات أمانًا للنماذج المحلية
summary: شغّل OpenClaw على نماذج اللغة الكبيرة المحلية (LM Studio، vLLM، LiteLLM، ونقاط نهاية OpenAI المخصّصة)
title: النماذج المحلية
x-i18n:
    generated_at: "2026-04-15T14:40:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a506ff83e4c2870d3878339f646c906584454a156ecd618c360f592cf3b0011
    source_path: gateway/local-models.md
    workflow: 15
---

# النماذج المحلية

التشغيل المحلي ممكن، لكن OpenClaw يتوقع سياقًا كبيرًا جدًا مع دفاعات قوية ضد حقن التلقين. البطاقات الصغيرة تؤدي إلى اقتطاع السياق وتُضعف الأمان. استهدف مستوى مرتفعًا: **ما لا يقل عن جهازي Mac Studio مضبوطين إلى الحد الأقصى أو جهاز GPU مكافئ (~30 ألف دولار فأكثر)**. تعمل بطاقة **24 GB** واحدة فقط مع التلقينات الأخف وبزمن استجابة أعلى. استخدم **أكبر / النسخة الكاملة من النموذج التي يمكنك تشغيلها**؛ فالنقاط المرجعية المكمّمة بقوة أو “الصغيرة” ترفع مخاطر حقن التلقين (راجع [الأمان](/ar/gateway/security)).

إذا كنت تريد أقل إعداد محلي احتكاكًا، فابدأ بـ [LM Studio](/ar/providers/lmstudio) أو [Ollama](/ar/providers/ollama) واستخدم `openclaw onboard`. هذه الصفحة هي الدليل العملي الموجّه لإعدادات التشغيل المحلية الأعلى فئة وخوادم OpenAI المحلية المخصّصة المتوافقة.

## الموصى به: LM Studio + نموذج محلي كبير (Responses API)

أفضل إعداد محلي حاليًا. حمّل نموذجًا كبيرًا في LM Studio (على سبيل المثال، إصدارًا كامل الحجم من Qwen أو DeepSeek أو Llama)، وفعّل الخادم المحلي (الافتراضي `http://127.0.0.1:1234`)، واستخدم Responses API لإبقاء الاستدلال منفصلًا عن النص النهائي.

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

**قائمة الإعداد**

- ثبّت LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- في LM Studio، نزّل **أكبر إصدار نموذج متاح** (وتجنب الإصدارات “الصغيرة” أو المكمّمة بشدة)، ثم شغّل الخادم، وتأكد من أن `http://127.0.0.1:1234/v1/models` يعرضه.
- استبدل `my-local-model` بمعرّف النموذج الفعلي الظاهر في LM Studio.
- أبقِ النموذج محمّلًا؛ فالتحميل البارد يضيف زمن بدء تشغيل.
- عدّل `contextWindow` و`maxTokens` إذا كان إصدار LM Studio لديك مختلفًا.
- بالنسبة إلى WhatsApp، التزم باستخدام Responses API حتى يتم إرسال النص النهائي فقط.

أبقِ النماذج المستضافة مهيأة حتى عند التشغيل المحلي؛ استخدم `models.mode: "merge"` حتى تظل خيارات الرجوع الاحتياطي متاحة.

### إعداد هجين: نموذج مستضاف أساسي، ورجوع احتياطي محلي

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

### إعداد محلي أولًا مع شبكة أمان مستضافة

بدّل ترتيب النموذج الأساسي وخيارات الرجوع الاحتياطي؛ وأبقِ كتلة providers نفسها مع `models.mode: "merge"` حتى تتمكن من الرجوع إلى Sonnet أو Opus عندما يتوقف الجهاز المحلي.

### الاستضافة الإقليمية / توجيه البيانات

- تتوفر أيضًا إصدارات MiniMax/Kimi/GLM المستضافة على OpenRouter مع نقاط نهاية مثبتة على مناطق محددة (مثل الاستضافة داخل الولايات المتحدة). اختر الإصدار الإقليمي هناك للحفاظ على حركة البيانات داخل النطاق القضائي الذي تريده مع الاستمرار في استخدام `models.mode: "merge"` لخيارات الرجوع الاحتياطي من Anthropic/OpenAI.
- يظل التشغيل المحلي فقط هو أقوى مسار للخصوصية؛ أما التوجيه الإقليمي المستضاف فهو حل وسط عندما تحتاج ميزات المزود ولكنك تريد التحكم في تدفق البيانات.

## خوادم وكيلة محلية أخرى متوافقة مع OpenAI

يمكن استخدام vLLM أو LiteLLM أو OAI-proxy أو بوابات مخصّصة إذا كانت تعرض نقطة نهاية `/v1` بأسلوب OpenAI. استبدل كتلة provider أعلاه بنقطة النهاية ومعرّف النموذج الخاصين بك:

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

أبقِ `models.mode: "merge"` حتى تظل النماذج المستضافة متاحة كخيارات رجوع احتياطي.

ملاحظة سلوكية لخلفيات `/v1` المحلية/الممررة عبر وكيل:

- يتعامل OpenClaw مع هذه المسارات على أنها مسارات وكيل متوافقة مع OpenAI، وليست
  نقاط نهاية OpenAI أصلية
- لا ينطبق هنا تشكيل الطلبات الخاص بـ OpenAI الأصلي فقط: لا
  `service_tier`، ولا `store` الخاص بـ Responses، ولا تشكيل حمولة
  التوافق مع الاستدلال في OpenAI، ولا تلميحات لذاكرة التخزين المؤقت للتلقين
- لا يتم حقن رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator`، `version`، `User-Agent`)
  في عناوين URL الخاصة بهذه الوكلاء المخصّصة

ملاحظات التوافق للخلفيات الأكثر صرامة والمتوافقة مع OpenAI:

- تقبل بعض الخوادم فقط `messages[].content` كسلسلة نصية في Chat Completions، وليس
  مصفوفات أجزاء محتوى منظّمة. اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true` لهذه
  النقاط النهائية.
- بعض الخلفيات المحلية الأصغر أو الأكثر صرامة تكون غير مستقرة مع بنية
  التلقين الكاملة الخاصة بوقت تشغيل الوكيل في OpenClaw، خاصة عند تضمين
  مخططات الأدوات. إذا كانت
  الخلفية تعمل مع استدعاءات `/v1/chat/completions` المباشرة الصغيرة لكنها تفشل في
  الأدوار العادية لوكيل OpenClaw، فجرّب أولًا
  `agents.defaults.experimental.localModelLean: true` لإزالة الأدوات الافتراضية
  الثقيلة مثل `browser` و`cron` و`message`؛ هذا
  علم تجريبي وليس إعدادًا افتراضيًا مستقرًا. راجع
  [الميزات التجريبية](/ar/concepts/experimental-features). وإذا استمر الفشل، فجرّب
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- إذا استمرت الخلفية في الفشل فقط مع تشغيلات OpenClaw الأكبر،
  فعادةً ما تكون المشكلة المتبقية في سعة النموذج/الخادم من الطرف العلوي
  أو في خطأ برمجي في الخلفية، وليس في طبقة النقل الخاصة بـ OpenClaw.

## استكشاف الأخطاء وإصلاحها

- هل يستطيع Gateway الوصول إلى الوكيل؟ `curl http://127.0.0.1:1234/v1/models`.
- هل تم إلغاء تحميل نموذج LM Studio؟ أعد تحميله؛ فالبدء البارد سبب شائع لـ “التعليق”.
- يحذّر OpenClaw عندما تكون نافذة السياق المكتشفة أقل من **32k** ويمنع التشغيل عندما تقل عن **16k**. إذا واجهت هذا الفحص المسبق، فارفع حد السياق في الخادم/النموذج أو اختر نموذجًا أكبر.
- أخطاء السياق؟ اخفض `contextWindow` أو ارفع حد الخادم لديك.
- هل يعيد الخادم المتوافق مع OpenAI الخطأ `messages[].content ... expected a string`؟
  أضف `compat.requiresStringContent: true` إلى إدخال ذلك النموذج.
- تعمل استدعاءات `/v1/chat/completions` الصغيرة المباشرة، لكن `openclaw infer model run`
  يفشل مع Gemma أو نموذج محلي آخر؟ عطّل مخططات الأدوات أولًا باستخدام
  `compat.supportsTools: false`، ثم اختبر مرة أخرى. إذا استمر الخادم في التعطل فقط
  مع تلقينات OpenClaw الأكبر، فاعتبر ذلك قيدًا في الخادم/النموذج من الطرف العلوي.
- الأمان: تتجاوز النماذج المحلية المرشحات الموجودة على جانب المزود؛ لذا أبقِ الوكلاء محدودي النطاق وفعّل Compaction للحد من نطاق تأثير حقن التلقين.
