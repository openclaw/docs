---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين توجيه الوكلاء المتعددين والارتباطات
    - ضبط سلوك الجلسة وتسليم الرسائل ووضع التحدث
summary: إعدادات الوكيل الافتراضية، وتوجيه الوكلاء المتعددين، والجلسة، والرسائل، وتكوين talk
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-05-11T20:31:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbc8f9ff61cb1780dc038c71e3b2f2dd2d5d9fe6582ddf76d44a7dba21d13908
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح إعدادات بنطاق الوكيل ضمن `agents.*`، و`multiAgent.*`، و`session.*`،
و`messages.*`، و`talk.*`. بالنسبة إلى القنوات، والأدوات، ووقت تشغيل Gateway، والمفاتيح الأخرى
ذات المستوى الأعلى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## إعدادات الوكيل الافتراضية

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime ضمن موجه النظام. إذا لم يُضبط، يكتشفه OpenClaw تلقائيًا بالانتقال صعودًا من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية لـ Skills للوكلاء الذين لا يضبطون
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- احذف `agents.defaults.skills` لجعل Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة القيم الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛ ولا
  تُدمج مع القيم الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات تهيئة مساحة العمل (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

يتخطى إنشاء ملفات مساحة عمل اختيارية محددة مع الاستمرار في كتابة ملفات التهيئة المطلوبة. القيم الصالحة: `SOUL.md`، و`USER.md`، و`HEARTBEAT.md`، و`IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

يتحكم في توقيت حقن ملفات تهيئة مساحة العمل في موجه النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى دورات المتابعة الآمنة (بعد استجابة مكتملة من المساعد) إعادة حقن تهيئة مساحة العمل، مما يقلل حجم الموجه. لا تزال عمليات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: يعطّل حقن تهيئة مساحة العمل وملفات السياق في كل دورة. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة الموجه بالكامل (محركات سياق مخصصة، أو أوقات تشغيل أصلية تبني سياقها الخاص، أو مسارات عمل متخصصة بلا تهيئة). تتخطى دورات Heartbeat والتعافي من Compaction الحقن أيضًا.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف لكل ملف تهيئة مساحة عمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى الإجمالي لعدد الأحرف المحقونة عبر جميع ملفات تهيئة مساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في إشعار موجه النظام المرئي للوكيل عند اقتطاع سياق التهيئة.
الافتراضي: `"once"`.

- `"off"`: لا يحقن نص إشعار الاقتطاع أبدًا في موجه النظام.
- `"once"`: يحقن إشعارًا موجزًا مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: يحقن إشعارًا موجزًا في كل تشغيل عند وجود اقتطاع.

تبقى أعداد raw/المحقونة التفصيلية وحقول ضبط الإعدادات في التشخيصات مثل
تقارير السياق/الحالة والسجلات؛ ولا يحصل سياق مستخدم/وقت تشغيل WebChat الروتيني إلا
على إشعار التعافي الموجز.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات عالية الحجم للموجه/السياق، وهي
مقسّمة عمدًا حسب النظام الفرعي بدلًا من تمريرها كلها عبر
مفتاح عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تهيئة مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  تمهيد تشغيل النموذج لمرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة. تُقرّ أوامر الدردشة المجردة `/new` و`/reset`
  بإعادة الضبط دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills المدمجة المحقونة في موجه النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل محقونة مملوكة لوقت التشغيل.
- `memory.qmd.limits.*`:
  مقتطف بحث الذاكرة المفهرس وحجم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء التشغيل للدورة الأولى المحقون في عمليات تشغيل النموذج عند إعادة الضبط/بدء التشغيل.
تُقرّ أوامر الدردشة المجردة `/new` و`/reset` بإعادة الضبط دون استدعاء
النموذج، لذلك لا تُحمّل هذا التمهيد.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

قيم افتراضية مشتركة لأسطح سياق وقت التشغيل المحدودة.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: الحد الافتراضي لمقتطف `memory_get` قبل إضافة
  بيانات الاقتطاع الوصفية وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة أسطر `memory_get` الافتراضية عند حذف `lines`.
- `toolResultMaxChars`: حد نتيجة الأداة الحي المستخدم للنتائج المستمرة
  والتعافي من الفائض.
- `postCompactionMaxChars`: حد مقتطف AGENTS.md المستخدم أثناء حقن
  التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمفاتيح `contextLimits` المشتركة. ترث الحقول المحذوفة
من `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

الحد العام لقائمة Skills المدمجة المحقونة في موجه النظام. لا
يؤثر هذا في قراءة ملفات `SKILL.md` عند الطلب.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

تجاوز لكل وكيل لميزانية موجه Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

أقصى حجم بالبكسل للجانب الأطول من الصورة في كتل صور المحادثة/الأداة قبل استدعاءات المزوّد.
الافتراضي: `1200`.

عادةً ما تقلل القيم الأقل استخدام رموز الرؤية وحجم حمولة الطلب للتشغيلات كثيرة لقطات الشاشة.
تحافظ القيم الأعلى على مزيد من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجه النظام (وليس الطوابع الزمنية للرسائل). تعود إلى المنطقة الزمنية للمضيف.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في موجه النظام. الافتراضي: `auto` (تفضيل نظام التشغيل).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يعيّن شكل السلسلة النصية النموذج الأساسي فقط.
  - يعيّن شكل الكائن النموذج الأساسي بالإضافة إلى نماذج تجاوز الفشل المرتبة.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` كتكوين نموذج الرؤية الخاص بها.
  - يُستخدم أيضًا كتوجيه احتياطي عندما يتعذر على النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرّفات المجردة للتوافق؛ إذا طابق معرّف مجرد بشكل فريد إدخالًا مُعدًا قادرًا على الصور في `models.providers.*.models`، يؤهله OpenClaw إلى ذلك المزوّد. تتطلب التطابقات المُعدة الملتبسة بادئة مزوّد صريحة.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، و`fal/fal-ai/flux/dev` لـ fal، و`openai/gpt-image-2` لـ OpenAI Images، أو `openai/gpt-image-1.5` لمخرجات OpenAI PNG/WebP ذات الخلفية الشفافة.
  - إذا حددت مزوّدًا/نموذجًا مباشرةً، فقم أيضًا بتكوين مصادقة المزوّد المطابقة (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، و`FAL_KEY` لـ `fal/*`).
  - إذا حُذف، لا يزال بإمكان `image_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الصور المسجلين بترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الموسيقى المشتركة وأداة `music_generate` المضمنة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.6`.
  - إذا حُذف، لا يزال بإمكان `music_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّف المزوّد.
  - إذا حددت مزوّدًا/نموذجًا مباشرةً، فقم أيضًا بتكوين مصادقة المزوّد/مفتاح API المطابق.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الفيديو المشتركة وأداة `video_generate` المضمنة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا حُذف، لا يزال بإمكان `video_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الفيديو المسجلين بترتيب معرّف المزوّد.
  - إذا حددت مزوّدًا/نموذجًا مباشرةً، فقم أيضًا بتكوين مصادقة المزوّد/مفتاح API المطابق.
  - يدعم مزوّد توليد الفيديو Qwen المضمن ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد هي `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي الذي تم حله.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يضعها وضع الرجوع لاستخراج المحتوى في الاعتبار في أداة `pdf`.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `toolProgressDetail`: وضع التفاصيل لملخصات أدوات `/verbose` وأسطر أدوات مسودة التقدم. القيم: `"explain"` (افتراضي، تسميات بشرية موجزة) أو `"raw"` (إلحاق الأمر/التفاصيل الخام عند توفرها). يتجاوز `agents.list[].toolProgressDetail` لكل وكيل هذا الافتراضي.
- `reasoningDefault`: مستوى إظهار الاستدلال الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` لكل وكيل هذا الافتراضي. لا تُطبق افتراضيات الاستدلال المُعدة إلا للمالكين أو المرسلين المخولين أو سياقات Gateway لمسؤول المشغّل عندما لا يُضبط تجاوز للاستدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى المخرجات المرفوعة الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.5` للوصول عبر مفتاح API من OpenAI أو Codex OAuth). إذا حذفت المزوّد، يجرّب OpenClaw اسمًا مستعارًا أولًا، ثم تطابقًا فريدًا ضمن المزوّدين المُعدين لمعرّف النموذج الدقيق هذا، وعندها فقط يعود إلى المزوّد الافتراضي المُعد (سلوك توافق متقادم، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يعرض النموذج الافتراضي المُعد، يعود OpenClaw إلى أول مزوّد/نموذج مُعد بدلًا من إظهار افتراضي مزوّد قديم تمت إزالته.
- `models`: كتالوج النماذج المُعد وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` و`chat_template_kwargs` و`extra_body`/`extraBody`).
  - استخدم إدخالات `provider/*` مثل `"openai-codex/*": {}` أو `"vllm/*": {}` لإظهار جميع النماذج المكتشفة للمزوّدين المحددين دون إدراج كل معرّف نموذج يدويًا.
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي ستزيل إدخالات قائمة السماح الحالية ما لم تمرر `--replace`.
  - تدمج مسارات التكوين/الإعداد محددة النطاق للمزوّد نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين غير ذوي الصلة المُعدين مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، تُفعّل Compaction من جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction من جانب خادم OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (التكوين): يتم تجاوز `agents.defaults.params` (القاعدة العامة) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (معرّف الوكيل المطابق) حسب المفتاح. راجع [تخزين الموجهات مؤقتًا](/ar/reference/prompt-caching) لمزيد من التفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلب المُولدة، تكون الأولوية للجسم الإضافي؛ ولا تزال مسارات completions غير الأصلية تزيل `store` الخاص بـ OpenAI بعد ذلك.
- `params.chat_template_kwargs`: وسائط قالب المحادثة المتوافقة مع vLLM/OpenAI تُدمج في أجسام طلبات `api: "openai-completions"` ذات المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ تتجاوز `chat_template_kwargs` الصريحة الافتراضيات المُولدة، وتبقى الأولوية النهائية لـ `extra_body.chat_template_kwargs`. بالنسبة إلى عناصر التحكم في التفكير لـ vLLM Qwen، اضبط `params.qwenThinkingFormat` على `"chat-template"` أو `"top-level"` في إدخال ذلك النموذج.
- `compat.thinkingFormat`: نمط حمولة التفكير المتوافق مع OpenAI. استخدم `"qwen"` لـ `enable_thinking` بمستوى أعلى على نمط Qwen، أو `"qwen-chat-template"` لـ `chat_template_kwargs.enable_thinking` على خلفيات عائلة Qwen التي تدعم kwargs لقالب المحادثة على مستوى الطلب، مثل vLLM. يربط OpenClaw التفكير المعطل بـ `false` والتفكير المفعّل بـ `true`.
- `compat.supportedReasoningEfforts`: قائمة جهود الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` لنقاط النهاية المخصصة التي تقبله فعلًا؛ عندها يعرض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيحات الجلسة، والتحقق من CLI للوكيل، والتحقق من `llm-task` لذلك المزوّد/النموذج المُعد. استخدم `compat.reasoningEffortMap` عندما تريد الخلفية قيمة خاصة بالمزوّد لمستوى معياري.
- `params.preserveThinking`: تمكين اختياري خاص بـ Z.AI للحفاظ على التفكير. عند تفعيله وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `localService`: مدير عمليات اختياري على مستوى المزوّد لخوادم النماذج المحلية/المستضافة ذاتيًا. عندما ينتمي النموذج المحدد إلى ذلك المزوّد، يفحص OpenClaw `healthUrl` (أو `baseUrl + "/models"`)، ويبدأ `command` مع `args` إذا كانت نقطة النهاية متوقفة، وينتظر حتى `readyTimeoutMs`، ثم يرسل طلب النموذج. يجب أن يكون `command` مسارًا مطلقًا. يبقي `idleStopMs: 0` العملية حية حتى خروج OpenClaw؛ وتوقف القيمة الموجبة العملية التي أنشأها OpenClaw بعد ذلك العدد من المللي ثواني الخاملة. راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- تنتمي سياسة وقت التشغيل إلى المزوّدين أو النماذج، وليس إلى `agents.defaults`. استخدم `models.providers.<provider>.agentRuntime` للقواعد على مستوى المزوّد أو `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` للقواعد الخاصة بالنموذج. تحدد نماذج وكلاء OpenAI على مزوّد OpenAI الرسمي Codex افتراضيًا.
- يحفظ كتّاب التكوين الذين يعدّلون هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة عناصر الاحتياط) شكل الكائن المعياري ويحافظون على قوائم الاحتياط الحالية عند الإمكان.
- `maxConcurrent`: الحد الأقصى لتشغيل الوكلاء بالتوازي عبر الجلسات (تظل كل جلسة متسلسلة). الافتراضي: 4.

### سياسة وقت التشغيل

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"` أو `"pi"` أو معرّف حاضنة Plugin مسجلة أو اسم مستعار مدعوم لخلفية CLI. يسجل Plugin Codex المضمن `codex`؛ ويوفر Plugin Anthropic المضمن خلفية CLI باسم `claude-cli`.
- يتيح `id: "auto"` لحاضنات Plugin المسجلة المطالبة بالأدوار المدعومة ويستخدم PI عندما لا تطابق أي حاضنة. يتطلب وقت تشغيل Plugin صريح مثل `id: "codex"` تلك الحاضنة ويفشل بشكل مغلق إذا لم تكن متاحة أو فشلت.
- مفاتيح وقت التشغيل لكامل الوكيل قديمة. يتم تجاهل `agents.defaults.agentRuntime` و`agents.list[].agentRuntime` وتثبيتات وقت تشغيل الجلسة و`OPENCLAW_AGENT_RUNTIME` عند اختيار وقت التشغيل. شغّل `openclaw doctor --fix` لإزالة القيم القديمة.
- تستخدم نماذج وكلاء OpenAI حاضنة Codex افتراضيًا؛ ويبقى `agentRuntime.id: "codex"` على مستوى المزوّد/النموذج صالحًا عندما تريد جعل ذلك صريحًا.
- بالنسبة إلى عمليات نشر Claude CLI، فضّل `model: "anthropic/claude-opus-4-7"` مع `agentRuntime.id: "claude-cli"` محدد النطاق للنموذج. لا تزال مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل للتوافق، لكن يجب أن يحافظ التكوين الجديد على اختيار المزوّد/النموذج بالشكل المعياري ويضع خلفية التنفيذ في سياسة وقت تشغيل المزوّد/النموذج.
- يتحكم هذا فقط في تنفيذ أدوار وكيل النص. لا تزال توليد الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمنة** (لا تنطبق إلا عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار               | النموذج                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

الأسماء المستعارة التي ضبطتها لها الأولوية دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI الخيار `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضيًا عند عدم ضبط مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات احتياطية نصية فقط (بلا استدعاءات أدوات). مفيدة كخيار احتياطي عند فشل مزوّدي API.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // أو استخدم systemPromptFileArg عندما يقبل CLI علم ملف مطالبة.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- واجهات CLI الخلفية نصية أولًا؛ الأدوات معطّلة دائمًا.
- الجلسات مدعومة عند ضبط `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.
- يتيح `reseedFromRawTranscriptWhenUncompacted: true` للواجهة الخلفية استرداد الجلسات الآمنة
  غير الصالحة من ذيل محدود لنص OpenClaw الخام قبل وجود أول
  ملخص Compaction. لا تزال تغييرات ملف تعريف المصادقة أو حقبة بيانات الاعتماد
  لا تُعاد تهيئتها من الخام مطلقًا.

### `agents.defaults.systemPromptOverride`

استبدل مطالبة النظام التي يجمعها OpenClaw بالكامل بسلسلة ثابتة. اضبطها على مستوى القيم الافتراضية (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). لقيم الوكيل أولوية؛ ويتم تجاهل القيمة الفارغة أو المكوّنة من مسافات بيضاء فقط. مفيد لتجارب المطالبات المضبوطة.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

طبقات مطالبات مستقلة عن المزوّد تُطبّق حسب عائلة النموذج. تتلقى معرّفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر المزوّدين؛ يتحكم `personality` فقط في طبقة أسلوب التفاعل الودّي.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- يفعّل `"friendly"` (افتراضي) و`"on"` طبقة أسلوب التفاعل الودّي.
- يعطّل `"off"` الطبقة الودّية فقط؛ ويبقى عقد سلوك GPT-5 المعلّم مفعّلًا.
- لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ عندما لا يكون هذا الإعداد المشترك مضبوطًا.

### `agents.defaults.heartbeat`

تشغيلات Heartbeat دورية.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m يعطل
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // الافتراضي: true؛ false يحذف قسم Heartbeat من مطالبة النظام
        lightContext: false, // الافتراضي: false؛ true يُبقي HEARTBEAT.md فقط من ملفات تمهيد مساحة العمل
        isolatedSession: false, // الافتراضي: false؛ true يشغّل كل Heartbeat في جلسة جديدة (بلا سجل محادثة)
        skipWhenBusy: false, // الافتراضي: false؛ true ينتظر أيضًا مسارات الوكيل الفرعي/المتداخلة
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (الافتراضي) | block
        target: "none", // الافتراضي: none | الخيارات: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). اضبطه على `0m` للتعطيل.
- `includeSystemPromptSection`: عند false، يحذف قسم Heartbeat من مطالبة النظام ويتخطى حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند true، يكتم حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدورة وكيل Heartbeat قبل إجهاضها. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة تسليم الرسائل المباشرة/DM. يسمح `allow` (افتراضي) بالتسليم إلى هدف مباشر. يمنع `block` التسليم إلى هدف مباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتُبقي `HEARTBEAT.md` فقط من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند true، يعمل كل Heartbeat في جلسة جديدة بلا سجل محادثة سابق. نمط العزل نفسه كما في Cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat من نحو 100 ألف إلى نحو 2-5 آلاف رمز.
- `skipWhenBusy`: عند true، تؤجّل تشغيلات Heartbeat عند وجود مسارات مشغولة إضافية: عمل وكيل فرعي أو أمر متداخل. تؤجّل مسارات Cron دائمًا Heartbeats، حتى من دون هذا العلم.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، **تعمل Heartbeats لهؤلاء الوكلاء فقط**.
- تعمل Heartbeats كدورات وكيل كاملة — الفواصل الأقصر تستهلك رموزًا أكثر.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // معرّف Plugin مزوّد Compaction مسجّل (اختياري)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // يُستخدم عندما identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // فحص ضغط حلقة أدوات Pi اختياري
        postCompactionSections: ["Session Startup", "Red Lines"], // [] يعطل إعادة الحقن
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز نموذج اختياري لـ Compaction فقط
        truncateAfterCompaction: true, // تدوير إلى JSONL لاحق أصغر بعد Compaction
        maxActiveTranscriptBytes: "20mb", // محفّز Compaction محلي قبل التشغيل اختياري
        notifyUser: true, // أرسل إشعارات موجزة عند بدء Compaction واكتماله (الافتراضي: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // تجاوز نموذج اختياري لتفريغ الذاكرة فقط
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: ‏`default` أو `safeguard` (تلخيص مجزأ للتواريخ الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزوّد Compaction مسجّل. عند ضبطه، يُستدعى `summarize()` الخاص بالمزوّد بدل تلخيص LLM المدمج. يعود إلى المدمج عند الفشل. يفرض ضبط مزوّد `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى للثواني المسموح بها لعملية Compaction واحدة قبل أن يجهضها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة قطع Pi للاحتفاظ بذيل النص الأحدث حرفيًا. يحترم `/compact` اليدوي هذا عند ضبطه صراحة؛ وإلا يكون Compaction اليدوي نقطة تحقق صارمة.
- `identifierPolicy`: ‏`strict` (افتراضي)، أو `off`، أو `custom`. يضيف `strict` في المقدمة إرشادات مدمجة للاحتفاظ بالمعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عندما `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند الإخراج سيئ التكوين لملخصات safeguard. مفعّلة افتراضيًا في وضع safeguard؛ اضبط `enabled: false` لتخطي التدقيق.
- `midTurnPrecheck`: فحص ضغط حلقة أدوات Pi اختياري. عند `enabled: true`، يتحقق OpenClaw من ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسبًا، فإنه يجهض المحاولة الحالية قبل إرسال المطالبة ويعيد استخدام مسار استرداد الفحص القبلي الحالي لاقتطاع نتائج الأدوات أو تنفيذ Compaction ثم إعادة المحاولة. يعمل مع وضعي Compaction: ‏`default` و`safeguard`. الافتراضي: معطّل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية في AGENTS.md لإعادة حقنها بعد Compaction. الافتراضي `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. عندما تكون غير مضبوطة أو مضبوطة صراحة على هذا الزوج الافتراضي، تُقبل أيضًا عناوين `Every Session`/`Safety` القديمة كبديل توافق.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما ينبغي للجلسة الرئيسية الاحتفاظ بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ عندما لا يُضبط، يستخدم Compaction نموذج الجلسة الأساسي.
- `maxActiveTranscriptBytes`: حد بايت اختياري (`number` أو سلاسل مثل `"20mb"`) يفعّل Compaction المحلي العادي قبل تشغيل عندما يتجاوز ملف JSONL النشط الحد. يتطلب `truncateAfterCompaction` حتى يتمكن Compaction الناجح من التدوير إلى نص لاحق أصغر. معطّل عند عدم ضبطه أو عند `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثلًا، "Compacting context..." و"Compaction complete"). معطّل افتراضيًا للحفاظ على صمت Compaction.
- `memoryFlush`: دورة وكيل صامتة قبل Compaction التلقائي لتخزين ذكريات دائمة. اضبط `model` على مزوّد/نموذج دقيق مثل `ollama/qwen3:8b` عندما ينبغي أن تبقى دورة الصيانة هذه على نموذج محلي؛ لا يرث التجاوز سلسلة الاحتياط النشطة للجلسة. يتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يزيل **نتائج الأدوات القديمة** من السياق داخل الذاكرة قبل الإرسال إلى LLM. **لا** يعدّل سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // المدة (ms/s/m/h)، الوحدة الافتراضية: دقائق
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="سلوك وضع cache-ttl">

- يفعّل `mode: "cache-ttl"` جولات الإزالة.
- يتحكم `ttl` في عدد مرات إمكانية إعادة تشغيل الإزالة (بعد آخر لمس للتخزين المؤقت).
- تقتطع الإزالة نتائج الأدوات الضخمة أولًا، ثم تمسح نتائج الأدوات الأقدم مسحًا كاملًا إذا لزم الأمر.

**الاقتطاع الخفيف** يُبقي البداية + النهاية ويدرج `...` في المنتصف.

**المسح الكامل** يستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا يتم اقتطاع/مسح كتل الصور مطلقًا.
- النسب مبنية على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا وُجد عدد رسائل مساعد أقل من `keepLastAssistants`، يتم تخطي الإزالة.

</Accordion>

راجع [تقليم الجلسة](/ar/concepts/session-pruning) لتفاصيل السلوك.

### بث الكتل

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحة لتمكين الردود الكتلية.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات لكل حساب). تكون القيمة الافتراضية في Signal/Slack/Discord/Google Chat هي `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود الكتلية. `natural` = 800-2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [البث](/ar/concepts/streaming) لمعرفة تفاصيل السلوك والتقسيم إلى أجزاء.

### مؤشرات الكتابة

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- القيم الافتراضية: `instant` للمحادثات المباشرة/الإشارات، و`message` للمحادثات الجماعية غير المشار إليها.
- تجاوزات لكل جلسة: `session.typingMode`، و`session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

عزل اختياري للوكيل المضمن. راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**الخلفية:**

- `docker`: وقت تشغيل Docker المحلي (افتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم بواسطة SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعدادات خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (افتراضيًا: `ssh`)
- `workspaceRoot`: الجذر البعيد المطلق المستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يحولها OpenClaw إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: عناصر ضبط سياسة مفتاح مضيف OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` يتغلب على `identityFile`
- `certificateData` يتغلب على `certificateFile`
- `knownHostsData` يتغلب على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة العزل

**سلوك خلفية SSH:**

- تزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تبقي مساحة عمل SSH البعيدة مرجعية
- توجه `exec`، وأدوات الملفات، ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة تلقائيًا مرة أخرى إلى المضيف
- لا تدعم حاويات متصفح العزل

**وصول مساحة العمل:**

- `none`: مساحة عمل عزل لكل نطاق ضمن `~/.openclaw/sandboxes`
- `ro`: مساحة عمل العزل عند `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (افتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (بدون عزل بين الجلسات)

**إعدادات Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**وضع OpenShell:**

- `mirror`: ازرع البعيد من المحلي قبل exec، وزامن مرة أخرى بعد exec؛ تبقى مساحة العمل المحلية مرجعية
- `remote`: ازرع البعيد مرة واحدة عند إنشاء العزل، ثم أبق مساحة العمل البعيدة مرجعية

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تتم خارج OpenClaw تلقائيًا إلى العزل بعد خطوة الزرع.
يكون النقل عبر SSH إلى عزل OpenShell، لكن Plugin يملك دورة حياة العزل ومزامنة المرآة الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج إلى الشبكة، وجذر قابل للكتابة، ومستخدم جذر.

**تكون الحاويات افتراضيًا على `network: "none"`** — عيّنها إلى `"bridge"` (أو شبكة جسر مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يتم حظر `"host"`. ويتم حظر `"container:<id>"` افتراضيًا ما لم تضبط صراحة
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (إجراء طوارئ).

**المرفقات الواردة** يتم تجهيزها في `media/inbound/*` ضمن مساحة العمل النشطة.

**`docker.binds`** يركب أدلة مضيف إضافية؛ يتم دمج عمليات الربط العامة ولكل وكيل.

**متصفح معزول** (`sandbox.browser.enabled`): Chromium + CDP في حاوية. يتم حقن عنوان URL لـ noVNC في موجه النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول مراقب noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL برمز قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (افتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- تكون `network` افتراضيًا `openclaw-sandbox-browser` (شبكة جسر مخصصة). اضبطها إلى `bridge` فقط عندما تريد صراحة اتصال الجسر العام.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند حافة الحاوية إلى نطاق CIDR (على سبيل المثال `172.21.0.1/32`).
- يركب `sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية متصفح العزل فقط. عند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- يتم تعريف قيم التشغيل الافتراضية في `scripts/sandbox-browser-entrypoint.sh` وضبطها لمضيفي الحاويات:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (مفعّل افتراضيًا)
  - تكون `--disable-3d-apis`، و`--disable-software-rasterizer`، و`--disable-gpu`
    مفعّلة افتراضيًا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبط `0` لاستخدام حد العمليات
    الافتراضي في Chromium.
  - إضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - القيم الافتراضية هي خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع نقطة دخول مخصصة
    لتغيير القيم الافتراضية للحاوية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` مخصصان لـ Docker فقط.

ابن الصور (من نسخة مصدر محلية):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

لتثبيتات npm بدون نسخة مصدر محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح الوكيل مزود TTS أو صوتًا أو نموذجًا أو
نمطًا أو وضع TTS تلقائيًا خاصًا به. يدمج حظر الوكيل بعمق فوق
`messages.tts` العام، بحيث يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما تتجاوز
الوكلاء الفرديون فقط حقول الصوت أو المزود التي يحتاجون إليها. ينطبق تجاوز الوكيل النشط
على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، و
أداة الوكيل `tts`. راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
لأمثلة المزودين والأسبقية.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: معرّف وكيل ثابت (مطلوب).
- `default`: عند تعيين عدة عناصر، يفوز الأول (يُسجَّل تحذير). إذا لم يُعيَّن أي عنصر، يكون أول مدخل في القائمة هو الافتراضي.
- `model`: صيغة السلسلة تعيّن نموذجًا أساسيًا صارمًا خاصًا بالوكيل من دون احتياطي نموذج؛ وصيغة الكائن `{ primary }` تكون صارمة أيضًا ما لم تُضِف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لتمكين الاحتياطي لذلك الوكيل، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. مهام Cron التي تتجاوز `primary` فقط ترث الاحتياطيات الافتراضية رغم ذلك ما لم تعيّن `fallbacks: []`.
- `params`: معلمات بث خاصة بالوكيل تُدمج فوق مدخل النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النماذج بالكامل.
- `tts`: تجاوزات اختيارية خاصة بالوكيل لتحويل النص إلى كلام. تُدمَج الكتلة دمجًا عميقًا فوق `messages.tts`، لذا أبقِ بيانات اعتماد المزوّد المشتركة وسياسة الاحتياطي في `messages.tts` واضبط هنا فقط القيم الخاصة بالشخصية مثل المزوّد أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية خاصة بالوكيل لـ Skills. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ وتستبدل القائمة الصريحة القيم الافتراضية بدل دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري الخاص بالوكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يُعيَّن تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزوّد/النموذج المحدد في القيم الصالحة؛ وبالنسبة إلى Google Gemini، تُبقي `adaptive` التفكير الديناميكي المملوك للمزوّد (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: رؤية الاستدلال الافتراضية الاختيارية الخاصة بالوكيل (`on | off | stream`). يتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عندما لا يُعيَّن تجاوز استدلال لكل رسالة أو جلسة.
- `fastModeDefault`: الإعداد الافتراضي الاختياري للوضع السريع الخاص بالوكيل (`true | false`). يُطبّق عندما لا يُعيَّن تجاوز للوضع السريع لكل رسالة أو جلسة.
- `models`: تجاوزات اختيارية خاصة بالوكيل لكتالوج النماذج/وقت التشغيل، مفهرسة بمعرّفات `provider/model` الكاملة. استخدم `models["provider/model"].agentRuntime` لاستثناءات وقت التشغيل الخاصة بالوكيل.
- `runtime`: واصف وقت تشغيل اختياري خاص بالوكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) عندما ينبغي أن يستخدم الوكيل جلسات حاضنة ACP افتراضيًا.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL بنمط `http(s)`، أو URI بنمط `data:`.
- `identity` يستنتج القيم الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط). ضمّن معرّف الطالب عندما ينبغي السماح باستدعاءات `agentId` الموجهة إلى الذات.
- حماية توريث العزل: إذا كانت جلسة الطالب معزولة، يرفض `sessions_spawn` الأهداف التي ستعمل بلا عزل.
- `subagents.requireAgentId`: عندما تكون true، تُحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض تحديد ملف تعريف صريحًا؛ الافتراضي: false).

---

## توجيه متعدد الوكلاء

شغّل عدة وكلاء معزولين داخل Gateway واحد. راجع [تعدد الوكلاء](/ar/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### حقول مطابقة الربط

- `type` (اختياري): `route` للتوجيه العادي (النوع المحذوف يكون افتراضيًا route)، و`acp` لربوط محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ محذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (تطابق دقيق، بلا peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول مدخل مطابق في `bindings`.

بالنسبة إلى مداخل `type: "acp"`، يحل OpenClaw حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات ربط المسار أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="وصول كامل (بلا عزل)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="أدوات للقراءة فقط + مساحة عمل">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="بلا وصول إلى نظام الملفات (المراسلة فقط)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

راجع [عزل وأدوات تعدد الوكلاء](/ar/tools/multi-agent-sandbox-tools) للحصول على تفاصيل الأسبقية.

---

## الجلسة

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="تفاصيل حقول الجلسة">

- **`scope`**: استراتيجية التجميع الأساسية للجلسات في سياقات الدردشة الجماعية.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يتشارك جميع المشاركين في سياق القناة جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تتشارك جميع الرسائل المباشرة الجلسة الرئيسية.
  - `per-peer`: عزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: عزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: عزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: يربط المعرّفات الأساسية بالأقران ذوي بادئة المزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر Dock مثل `/dock_discord` الخريطة نفسها لتبديل مسار رد الجلسة النشطة إلى نظير قناة مرتبط آخر؛ راجع [إرساء القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة التعيين الأساسية. يعيد `daily` التعيين في التوقيت المحلي `atHour`؛ ويعيد `idle` التعيين بعد `idleMinutes`. عند تكوينهما معًا، يفوز أيهما تنتهي مدته أولًا. تستخدم حداثة إعادة التعيين اليومية قيمة `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة التعيين بسبب الخمول `lastInteractionAt`. يمكن لعمليات الكتابة في الخلفية/أحداث النظام مثل Heartbeat، وإيقاظات Cron، وإشعارات exec، ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تُبقي جلسات daily/idle حديثة.
- **`resetByType`**: تجاوزات لكل نوع (`direct`، `group`، `thread`). يُقبل `dm` القديم كاسم بديل لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لعدد دورات الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`-`20`، الافتراضي: `5`). يعطّل `0` تسلسل الردود المتبادلة.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. أول رفض هو الذي يسري.
- **`maintenance`**: تنظيف مخزن الجلسات + عناصر التحكم في الاحتفاظ.
  - `mode`: يصدر `warn` تحذيرات فقط؛ ويطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: العدد الأقصى للإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفًا دفعياً مع مخزن مؤقت صغير للحد الأعلى للقيود ذات حجم الإنتاج؛ ويطبّق `openclaw sessions cleanup --enforce` الحد فورًا.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من الإعدادات الأقدم.
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات نصوص المحادثات `*.reset.<timestamp>`. تكون افتراضيًا `pruneAfter`؛ اضبطها على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية اختيارية لمساحة قرص دليل الجلسات. في وضع `warn` يسجّل تحذيرات؛ وفي وضع `enforce` يزيل أقدم الآثار/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. تكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح التبديل الافتراضي الرئيسي (يمكن للمزوّدين التجاوز؛ يستخدم Discord ‏`channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بعد عدم النشاط بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `spawnSessions`: البوابة الافتراضية لإنشاء جلسات عمل مرتبطة بالسلاسل من `sessions_spawn` وعمليات إنشاء سلاسل ACP. تكون افتراضيًا `true` عند تمكين روابط السلاسل؛ ويمكن للمزوّدين/الحسابات التجاوز.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي لعمليات الإنشاء المرتبطة بالسلاسل (`"fork"` أو `"isolated"`). يكون افتراضيًا `"fork"`.

</Accordion>

---

## الرسائل

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### بادئة الرد

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix`، ‏`channels.<channel>.accounts.<id>.responsePrefix`.

الحل (الأكثر تحديدًا يفوز): الحساب → القناة → العام. يعطّل `""` ويوقف التسلسل. يشتق `"auto"` القيمة من `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف            | مثال                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر       | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد          | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`, `low`, `off`        |
| `{identity.name}` | اسم هوية الوكيل    | (مثل `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. `{think}` اسم بديل لـ `{thinkingLevel}`.

### تفاعل الإقرار

- يكون افتراضيًا `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبطه على `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction`، ‏`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → الرجوع إلى الهوية.
- النطاق: `group-mentions` (الافتراضي)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد في القنوات الداعمة للتفاعلات مثل Slack وDiscord وTelegram وWhatsApp وiMessage.
- `messages.statusReactions.enabled`: يمكّن تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  في Slack وDiscord، يظل غير المضبوط مفعّلًا لتفاعلات الحالة عندما تكون تفاعلات الإقرار نشطة.
  في Telegram، اضبطه صراحة على `true` لتمكين تفاعلات حالة دورة الحياة.

### تأخير الوارد

يجمع الرسائل النصية السريعة فقط من المرسل نفسه في دورة وكيل واحدة. الوسائط/المرفقات تُرسل فورًا. أوامر التحكم تتجاوز التأخير.

### TTS (تحويل النص إلى كلام)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. يمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للملخص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ وتكون `modelOverrides.allowProvider` افتراضيًا `false` (اشتراك اختياري).
- تعود مفاتيح API احتياطيًا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- مزوّدو الكلام المضمّنون مملوكون لـ Plugin. إذا ضُبط `plugins.allow`، فأدرج كل Plugin مزوّد TTS تريد استخدامه، مثل `microsoft` لـ Edge TTS. يُقبل معرّف المزوّد القديم `edge` كاسم بديل لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو الإعداد، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير تابعة لـ OpenAI، يعامله OpenClaw كخادم TTS متوافق مع OpenAI ويخفّف التحقق من النموذج/الصوت.

---

## Talk

الإعدادات الافتراضية لوضع Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تكوين عدة مزوّدي Talk.
- مفاتيح Talk المسطحة القديمة (`talk.voiceId`، ‏`talk.voiceAliases`، ‏`talk.modelId`، ‏`talk.outputFormat`، ‏`talk.apiKey`) مخصصة للتوافق فقط. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت احتياطيًا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نص عادي أو كائنات SecretRef.
- ينطبق الرجوع الاحتياطي `ELEVENLABS_API_KEY` فقط عندما لا يكون هناك مفتاح API مضبوط لـ Talk.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء مألوفة.
- يحدد `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا حُذف، يستخدم macOS ‏`mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر مساعد `openclaw-mlx-tts` المضمّن عند وجوده، أو عبر ملف تنفيذي على `PATH`؛ ويتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد للتطوير.
- يتحكم `consultThinkingLevel` في مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات `openclaw_agent_consult` الفورية في Talk ضمن Control UI. اتركه غير مضبوط للحفاظ على سلوك الجلسة/النموذج العادي.
- يضبط `consultFastMode` تجاوزًا لمرة واحدة لوضع السرعة لاستشارات Talk الفورية في Control UI دون تغيير إعداد وضع السرعة العادي للجلسة.
- يضبط `speechLocale` معرّف اللغة BCP 47 المستخدم بواسطة تعرف الكلام في Talk على iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع Talk بعد صمت المستخدم قبل إرسال النص. عند عدم ضبطه، تُستخدم نافذة التوقف الافتراضية للمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).
- يضيف `realtime.instructions` تعليمات نظام موجهة للمزوّد إلى موجه OpenClaw الفوري المضمّن، بحيث يمكن تكوين نمط الصوت دون فقدان إرشادات `openclaw_agent_consult` الافتراضية.

---

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — جميع مفاتيح الإعداد الأخرى
- [الإعدادات](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
