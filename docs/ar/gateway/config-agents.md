---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين توجيه وربط الوكلاء المتعددين
    - ضبط الجلسة، وتسليم الرسائل، وسلوك وضع التحدث
summary: الإعدادات الافتراضية للوكيل، والتوجيه متعدد الوكلاء، والجلسة، والرسائل، وتكوين المحادثة
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-07-01T13:01:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح إعدادات مخصصة للوكيل ضمن `agents.*` و`multiAgent.*` و`session.*`
و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات ووقت تشغيل Gateway والمفاتيح
الأخرى ذات المستوى الأعلى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكلاء

### `agents.defaults.workspace`

الافتراضي: `OPENCLAW_WORKSPACE_DIR` عند ضبطه، وإلا `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

تكون لقيمة `agents.defaults.workspace` الصريحة الأولوية على
`OPENCLAW_WORKSPACE_DIR`. استخدم متغير البيئة لتوجيه الوكلاء الافتراضيين
إلى مساحة عمل مركبة عندما لا تريد كتابة ذلك المسار في الإعدادات.

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime في موجه النظام. إذا لم يُضبط، يكتشفه OpenClaw تلقائيا بالصعود من مساحة العمل إلى الأعلى.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية للمهارات للوكلاء الذين لا يضبطون
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

- احذف `agents.defaults.skills` للسماح غير المقيد بالمهارات افتراضيا.
- احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي مهارات.
- قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛ فهي
  لا تندمج مع الإعدادات الافتراضية.

### `agents.defaults.skipBootstrap`

يعطل الإنشاء التلقائي لملفات تمهيد مساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

يتخطى إنشاء ملفات مساحة عمل اختيارية محددة مع الاستمرار في كتابة ملفات التمهيد المطلوبة. القيم الصالحة: `SOUL.md` و`USER.md` و`HEARTBEAT.md` و`IDENTITY.md`.

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

يتحكم في وقت حقن ملفات تمهيد مساحة العمل في موجه النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد استجابة مساعد مكتملة) إعادة حقن تمهيد مساحة العمل، مما يقلل حجم الموجه. لا تزال تشغيلات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: تعطيل تمهيد مساحة العمل وحقن ملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة الموجه بالكامل (محركات سياق مخصصة، أو أوقات تشغيل أصلية تبني سياقها الخاص، أو تدفقات عمل متخصصة بلا تمهيد). تتخطى أدوار Heartbeat واسترداد Compaction الحقن أيضا.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

تجاوز لكل وكيل: `agents.list[].contextInjection`. القيم المحذوفة ترث
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى للأحرف لكل ملف تمهيد مساحة عمل قبل الاقتطاع. الافتراضي: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

تجاوز لكل وكيل: `agents.list[].bootstrapMaxChars`. القيم المحذوفة ترث
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى الإجمالي للأحرف المحقونة عبر جميع ملفات تمهيد مساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

تجاوز لكل وكيل: `agents.list[].bootstrapTotalMaxChars`. القيم المحذوفة
ترث `agents.defaults.bootstrapTotalMaxChars`.

### تجاوزات ملف تمهيد التعريف لكل وكيل

استخدم تجاوزات ملف تمهيد التعريف لكل وكيل عندما يحتاج وكيل واحد إلى سلوك حقن موجه
مختلف عن الإعدادات الافتراضية المشتركة. الحقول المحذوفة ترث من
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في إشعار موجه النظام المرئي للوكيل عندما يُقتطع سياق التمهيد.
الافتراضي: `"always"`.

- `"off"`: لا تحقن نص إشعار الاقتطاع أبدا في موجه النظام.
- `"once"`: احقن إشعارا موجزا مرة واحدة لكل توقيع اقتطاع فريد.
- `"always"`: احقن إشعارا موجزا في كل تشغيل عند وجود اقتطاع (موصى به).

تبقى الأعداد الخام/المحقونة التفصيلية وحقول ضبط الإعدادات في التشخيصات مثل
تقارير وحالات السياق والسجلات؛ أما سياق مستخدم/وقت تشغيل WebChat الروتيني
فيحصل فقط على إشعار الاسترداد الموجز.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات موجه/سياق كبيرة الحجم، وهي مقسمة عمدا حسب النظام
الفرعي بدلا من تمريرها كلها عبر مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  مقدمة تشغيل نموذج لمرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة. أوامر الدردشة المجردة `/new` و`/reset`
  يُقر بها من دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills الموجزة المحقونة في موجه النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل محقونة مملوكة لوقت التشغيل.
- `memory.qmd.limits.*`:
  مقتطف بحث الذاكرة المفهرس وتحجيم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في مقدمة بدء التشغيل للدور الأول المحقونة عند تشغيلات النموذج لإعادة الضبط/بدء التشغيل.
أوامر الدردشة المجردة `/new` و`/reset` تقر إعادة الضبط من دون استدعاء
النموذج، لذلك لا تحمل هذه المقدمة.

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

إعدادات افتراضية مشتركة لأسطح سياق وقت التشغيل المحدودة.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: سقف مقتطف `memory_get` الافتراضي قبل إضافة
  بيانات الاقتطاع الوصفية وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة أسطر `memory_get` الافتراضية عندما يُحذف
  `lines`.
- `toolResultMaxChars`: سقف متقدم لنتائج الأدوات الحية يُستخدم للنتائج
  المستمرة واسترداد الفائض. اتركه غير مضبوط لسقف سياق النموذج التلقائي:
  `16000` حرف دون 100K رمز، و`32000` حرف عند 100K+ رمز، و`64000`
  حرف عند 200K+ رمز. تُقبل القيم الصريحة حتى `1000000` للنماذج طويلة
  السياق، لكن السقف الفعال يظل محدودا بنحو 30% من نافذة سياق النموذج.
  يطبع `openclaw doctor --deep` السقف الفعال، ولا يحذر doctor إلا عندما
  يكون التجاوز الصريح قديما أو بلا تأثير.
- `postCompactionMaxChars`: سقف مقتطف AGENTS.md المستخدم أثناء حقن
  التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمقابض `contextLimits` المشتركة. الحقول المحذوفة ترث
من `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

سقف عام لقائمة Skills الموجزة المحقونة في موجه النظام. لا يؤثر هذا
في قراءة ملفات `SKILL.md` عند الطلب.

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

أقصى حجم بالبكسل لأطول جانب في الصورة ضمن كتل صور النسخ/الأدوات قبل استدعاءات الموفر.
الافتراضي: `1200`.

تقلل القيم الأدنى عادة استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات كثيرة لقطات الشاشة.
تحافظ القيم الأعلى على مزيد من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

تفضيل ضغط/تفاصيل أداة الصور للصور المحملة من مسارات الملفات وعناوين URL ومراجع الوسائط.
الافتراضي: `auto`.

يكيّف OpenClaw سلم تغيير الحجم مع نموذج الصور المحدد. على سبيل المثال، يمكن لنماذج Claude Opus 4.8 وOpenAI GPT-5.5 وQwen VL ونماذج رؤية Llama 4 المستضافة استخدام صور أكبر من مسارات الرؤية الأقدم/الافتراضية عالية التفاصيل، بينما تُضغط الأدوار متعددة الصور بقوة أكبر في وضع `auto` للتحكم في تكلفة الرموز وزمن الاستجابة.

القيم:

- `auto`: التكيف مع حدود النموذج وعدد الصور.
- `efficient`: تفضيل صور أصغر لتقليل استخدام الرموز والبايتات.
- `balanced`: استخدام السلم القياسي المتوسط.
- `high`: الحفاظ على مزيد من التفاصيل للقطات الشاشة والمخططات وصور المستندات.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجه النظام (وليست طوابع وقت الرسائل). تعود إلى المنطقة الزمنية للمضيف.

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

- `model`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يعيّن شكل السلسلة النموذج الأساسي فقط.
  - يعيّن شكل الكائن النموذج الأساسي بالإضافة إلى نماذج تجاوز الفشل المرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` كتكوين نموذج الرؤية الخاص بها.
  - يُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرّفات المجردة للتوافق؛ إذا طابق معرّف مجرد بشكل فريد إدخالًا مكوّنًا قادرًا على الصور في `models.providers.*.models`، يؤهله OpenClaw إلى ذلك الموفّر. تتطلب المطابقات المكوّنة المبهمة بادئة موفّر صريحة.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لـ OpenAI Images، أو `openai/gpt-image-1.5` لمخرجات OpenAI PNG/WebP بخلفية شفافة.
  - إذا حددت موفّرًا/نموذجًا مباشرة، فكوّن أيضًا مصادقة الموفّر المطابقة (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، و`FAL_KEY` لـ `fal/*`).
  - إذا حُذف، لا يزال بإمكان `image_generate` استنتاج افتراضي موفّر مدعوم بالمصادقة. يجرّب الموفّر الافتراضي الحالي أولًا، ثم بقية موفّري توليد الصور المسجلين بترتيب معرّف الموفّر.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الموسيقى المشتركة وأداة `music_generate` المضمنة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.6`.
  - إذا حُذف، لا يزال بإمكان `music_generate` استنتاج افتراضي موفّر مدعوم بالمصادقة. يجرّب الموفّر الافتراضي الحالي أولًا، ثم بقية موفّري توليد الموسيقى المسجلين بترتيب معرّف الموفّر.
  - إذا حددت موفّرًا/نموذجًا مباشرة، فكوّن أيضًا مصادقة الموفّر/مفتاح API المطابق.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الفيديو المشتركة وأداة `video_generate` المضمنة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا حُذف، لا يزال بإمكان `video_generate` استنتاج افتراضي موفّر مدعوم بالمصادقة. يجرّب الموفّر الافتراضي الحالي أولًا، ثم بقية موفّري توليد الفيديو المسجلين بترتيب معرّف الموفّر.
  - إذا حددت موفّرًا/نموذجًا مباشرة، فكوّن أيضًا مصادقة الموفّر/مفتاح API المطابق.
  - يدعم Plugin توليد الفيديو الرسمي من Qwen ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى الموفّر وهي `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF احتياطيًا إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي الذي تم حله.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يأخذها وضع الاستخراج الاحتياطي في أداة `pdf` بالحسبان.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `toolProgressDetail`: وضع التفاصيل لملخصات أدوات `/verbose` وسطور أدوات مسودة التقدم. القيم: `"explain"` (افتراضي، تسميات بشرية موجزة) أو `"raw"` (إلحاق الأمر/التفصيل الخام عند توفره). يتجاوز `agents.list[].toolProgressDetail` لكل وكيل هذا الافتراضي.
- `reasoningDefault`: الرؤية الافتراضية للاستدلال لدى الوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` لكل وكيل هذا الافتراضي. لا تُطبق افتراضيات الاستدلال المكوّنة إلا للمالكين أو المرسلين المصرح لهم أو سياقات Gateway الخاصة بمسؤول المشغّل عندما لا يتم تعيين تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` (مثل `openai/gpt-5.5` للوصول عبر مفتاح API الخاص بـ OpenAI أو Codex OAuth). إذا حذفت الموفّر، يجرّب OpenClaw اسمًا مستعارًا أولًا، ثم مطابقة فريدة لموفّر مكوّن لمعرّف النموذج الدقيق هذا، وبعد ذلك فقط يعود إلى الموفّر الافتراضي المكوّن (سلوك توافق مهمل، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك الموفّر يوفّر النموذج الافتراضي المكوّن، يعود OpenClaw إلى أول موفّر/نموذج مكوّن بدلًا من إظهار افتراضي موفّر قديم تمت إزالته.
- `models`: كتالوج النماذج المكوّن وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالموفّر، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` وتوجيه OpenRouter `provider` و`chat_template_kwargs` و`extra_body`/`extraBody`).
  - استخدم إدخالات `provider/*` مثل `"openai/*": {}` أو `"vllm/*": {}` لإظهار كل النماذج المكتشفة للموفّرين المحددين دون سرد كل معرّف نموذج يدويًا.
  - أضف `agentRuntime` إلى إدخال `provider/*` عندما يجب أن يستخدم كل نموذج مكتشف ديناميكيًا لذلك الموفّر وقت التشغيل نفسه. لا تزال سياسة وقت التشغيل الدقيقة لـ `provider/model` تتغلب على حرف البدل.
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات قائمة السماح الحالية إلا إذا مررت `--replace`.
  - تدمج تدفقات التكوين/الإعداد ذات نطاق الموفّر نماذج الموفّر المحددة في هذه الخريطة وتحافظ على الموفّرين غير المرتبطين الذين تم تكوينهم مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، يتم تمكين Compaction من جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction من جانب خادم OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات الموفّر الافتراضية العامة المطبقة على كل النماذج. تُعيّن في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (التكوين): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (معرّف الوكيل المطابق) حسب المفتاح. راجع [التخزين المؤقت للمطالبات](/ar/reference/prompt-caching) للتفاصيل.
- `models.providers.openrouter.params.provider`: سياسة توجيه الموفّر الافتراضية على مستوى OpenRouter. يمرر OpenClaw هذا إلى كائن `provider` في طلب OpenRouter؛ تتجاوز `agents.defaults.models["openrouter/<model>"].params.provider` لكل نموذج ومعلمات الوكيل حسب المفتاح. راجع [توجيه موفّر OpenRouter](/ar/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلب المولدة، يفوز الجسم الإضافي؛ ولا تزال مسارات الإكمال غير الأصلية تزيل `store` الخاص بـ OpenAI بعد ذلك.
- `params.chat_template_kwargs`: وسيطات قالب المحادثة المتوافقة مع vLLM/OpenAI تُدمج في أجسام طلبات `api: "openai-completions"` ذات المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ وتتجاوز `chat_template_kwargs` الصريحة الافتراضات المولدة، ولا يزال لـ `extra_body.chat_template_kwargs` الأسبقية النهائية. تعرض نماذج التفكير Qwen وNemotron المكوّنة في vLLM اختيارات `/think` ثنائية (`off`، `on`) بدلًا من سلم الجهد متعدد المستويات.
- `compat.thinkingFormat`: نمط حمولة التفكير المتوافق مع OpenAI. استخدم `"together"` لـ `reasoning.enabled` بأسلوب Together، أو `"qwen"` لـ `enable_thinking` عالي المستوى بأسلوب Qwen، أو `"qwen-chat-template"` لـ `chat_template_kwargs.enable_thinking` على الخلفيات من عائلة Qwen التي تدعم وسيطات قالب المحادثة على مستوى الطلب، مثل vLLM. يعيّن OpenClaw التفكير المعطل إلى `false` والتفكير الممكّن إلى `true`، وتعرض نماذج Qwen المكوّنة في vLLM اختيارات `/think` ثنائية لهذه الصيغ.
- `compat.supportedReasoningEfforts`: قائمة جهد الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` لنقاط النهاية المخصصة التي تقبله فعلًا؛ عندها يعرض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من ترقيع الجلسات، والتحقق من CLI الوكيل، والتحقق من `llm-task` لذلك الموفّر/النموذج المكوّن. استخدم `compat.reasoningEffortMap` عندما تريد الخلفية قيمة خاصة بالموفّر لمستوى معياري.
- `params.preserveThinking`: خيار اشتراك خاص بـ Z.AI للتفكير المحفوظ. عند تمكينه وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `localService`: مدير عمليات اختياري على مستوى الموفّر لخوادم النماذج المحلية/ذاتية الاستضافة. عندما ينتمي النموذج المحدد إلى ذلك الموفّر، يفحص OpenClaw `healthUrl` (أو `baseUrl + "/models"`)، ويبدأ `command` مع `args` إذا كانت نقطة النهاية معطلة، وينتظر حتى `readyTimeoutMs`، ثم يرسل طلب النموذج. يجب أن يكون `command` مسارًا مطلقًا. يبقي `idleStopMs: 0` العملية حية حتى خروج OpenClaw؛ وتوقف القيمة الموجبة العملية التي أنشأها OpenClaw بعد ذلك العدد من المللي ثواني الخاملة. راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- تنتمي سياسة وقت التشغيل إلى الموفّرين أو النماذج، لا إلى `agents.defaults`. استخدم `models.providers.<provider>.agentRuntime` للقواعد على مستوى الموفّر أو `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` للقواعد الخاصة بالنموذج. تحدد نماذج وكيل OpenAI على موفّر OpenAI الرسمي Codex افتراضيًا.
- يحفظ كاتبو التكوين الذين يعدلون هذه الحقول (على سبيل المثال `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطي) شكل الكائن المعياري ويحافظون على قوائم الاحتياط الحالية عند الإمكان.
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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`، أو `"openclaw"`، أو معرّف مسخّر Plugin مسجّل، أو اسم بديل مدعوم لواجهة CLI الخلفية. يسجّل Plugin Codex المضمّن `codex`؛ ويوفّر Plugin Anthropic المضمّن واجهة CLI الخلفية `claude-cli`.
- يتيح `id: "auto"` لمسخّرات Plugin المسجّلة المطالبة بالدورات المدعومة، ويستخدم OpenClaw عندما لا يطابق أي مسخّر. يتطلب وقت تشغيل Plugin صريح مثل `id: "codex"` ذلك المسخّر ويفشل بإغلاق آمن إذا كان غير متاح أو فشل.
- لا يُقبل `id: "pi"` إلا كاسم بديل مهمل لـ `openclaw` للحفاظ على الإعدادات المشحونة من v2026.5.22 وما قبلها. يجب أن تستخدم الإعدادات الجديدة `openclaw`.
- تكون أولوية وقت التشغيل أولًا لسياسة النموذج الدقيقة (`agents.list[].models["provider/model"]`، أو `agents.defaults.models["provider/model"]`، أو `models.providers.<provider>.models[]`)، ثم `agents.list[]` / `agents.defaults.models["provider/*"]`، ثم السياسة على مستوى المزوّد في `models.providers.<provider>.agentRuntime`.
- مفاتيح وقت التشغيل على مستوى الوكيل بالكامل قديمة. يتجاهل اختيار وقت التشغيل `agents.defaults.agentRuntime` و`agents.list[].agentRuntime` وتثبيتات وقت تشغيل الجلسة و`OPENCLAW_AGENT_RUNTIME`. شغّل `openclaw doctor --fix` لإزالة القيم القديمة.
- تستخدم نماذج وكلاء OpenAI مسخّر Codex افتراضيًا؛ يظل `agentRuntime.id: "codex"` الخاص بالمزوّد/النموذج صالحًا عندما تريد جعل ذلك صريحًا.
- لعمليات نشر Claude CLI، فضّل `model: "anthropic/claude-opus-4-8"` مع `agentRuntime.id: "claude-cli"` محدود النطاق بالنموذج. ما زالت مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل للتوافق، لكن يجب أن تحافظ الإعدادات الجديدة على اختيار المزوّد/النموذج بصيغته القياسية وأن تضع واجهة التنفيذ الخلفية في سياسة وقت تشغيل المزوّد/النموذج.
- يتحكم هذا فقط في تنفيذ دور وكيل النص. ما زالت توليدات الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء البديلة المضمّنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| الاسم البديل        | النموذج                         |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

تتقدّم الأسماء البديلة التي أعددتها دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
يبقي Anthropic Claude Opus 4.8 التفكير متوقفًا افتراضيًا في OpenClaw؛ وعندما يُفعّل التفكير التكيّفي صراحةً، تكون قيمة الجهد الافتراضية المملوكة لمزوّد Anthropic هي `high`. نماذج Claude 4.6 تستخدم `adaptive` افتراضيًا عندما لا يُضبط مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الرجوع النصية فقط (بلا استدعاءات أدوات). مفيدة كنسخة احتياطية عندما يفشل مزوّدو API.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- واجهات CLI الخلفية تعطي النص الأولوية؛ الأدوات معطّلة دائمًا.
- تكون الجلسات مدعومة عندما يكون `sessionArg` مضبوطًا.
- يكون تمرير الصور مدعومًا عندما يقبل `imageArg` مسارات الملفات.
- يتيح `reseedFromRawTranscriptWhenUncompacted: true` لواجهة خلفية استعادة جلسات آمنة
  ومبطلة من ذيل نص OpenClaw خام ومحدود قبل وجود أول
  ملخص Compaction. تغييرات ملف تعريف المصادقة أو حقبة بيانات الاعتماد
  لا تعيد البذر الخام أبدًا.

### `agents.defaults.promptOverlays`

طبقات مطالبات مستقلة عن المزوّد تُطبّق حسب عائلة النموذج على أسطح المطالبات التي يجمعها OpenClaw. تتلقى معرّفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر مسارات OpenClaw/المزوّد؛ يتحكم `personality` فقط في طبقة نمط التفاعل الودّي. تحتفظ مسارات خادم تطبيق Codex الأصلية بتعليمات الأساس/النموذج المملوكة لـ Codex بدل طبقة OpenClaw GPT-5 هذه، ويعطّل OpenClaw شخصية Codex المضمّنة للسلاسل الأصلية.

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

- يفعّل `"friendly"` (افتراضي) و`"on"` طبقة نمط التفاعل الودّي.
- يعطّل `"off"` الطبقة الودّية فقط؛ يظل عقد سلوك GPT-5 الموسوم مفعّلًا.
- ما زال `plugins.entries.openai.config.personality` القديم يُقرأ عندما لا يكون هذا الإعداد المشترك مضبوطًا.

### `agents.defaults.heartbeat`

تشغيلات Heartbeat دورية.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). اضبطها على `0m` للتعطيل.
- `includeSystemPromptSection`: عند false، يحذف قسم Heartbeat من مطالبة النظام ويتجاوز حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند true، يكتم حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل Heartbeat قبل إلغائه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds` عندما يكون مضبوطًا، وإلا فسيُستخدم إيقاع Heartbeat بحد أقصى 600 ثانية.
- `directPolicy`: سياسة التسليم المباشر/DM. يسمح `allow` (افتراضي) بالتسليم إلى الهدف المباشر. يكتم `block` التسليم إلى الهدف المباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتبقي فقط `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند true، يعمل كل Heartbeat في جلسة جديدة بلا سجل محادثة سابق. نمط العزل نفسه مثل cron `sessionTarget: "isolated"`. يخفض تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- `skipWhenBusy`: عند true، تؤجّل تشغيلات Heartbeat عند انشغال المسارات الإضافية لذلك الوكيل: وكيله الفرعي الخاص المرتبط بمفتاح الجلسة أو عمل الأوامر المتداخل. تؤجّل مسارات Cron دائمًا Heartbeats، حتى بدون هذه العلامة.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، تعمل Heartbeats **لهؤلاء الوكلاء فقط**.
- تعمل Heartbeats كأدوار وكيل كاملة — الفواصل الأقصر تستهلك رموزًا أكثر.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: ‏`default` أو `safeguard` (تلخيص مقسّم للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزوّد Compaction مسجّل. عند تعيينه، تُستدعى `summarize()` الخاصة بالمزوّد بدلاً من تلخيص LLM المضمّن. يعود إلى المضمّن عند الفشل. يؤدي تعيين مزوّد إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: أقصى عدد من الثواني المسموح به لعملية Compaction واحدة قبل أن يوقفها OpenClaw. الافتراضي: `180`.
- `keepRecentTokens`: ميزانية نقطة القطع للوكيل للإبقاء على أحدث ذيل من النص المنسوخ كما هو حرفياً. يحترم `/compact` اليدوي هذا عند تعيينه صراحة؛ وإلا فالتكثيف اليدوي نقطة تحقق صارمة.
- `identifierPolicy`: ‏`strict` (الافتراضي)، أو `off`، أو `custom`. يضيف `strict` في المقدمة إرشادات مضمّنة للاحتفاظ بالمعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصّص للحفاظ على المعرّفات يُستخدم عندما تكون `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند وجود مخرجات مشوّهة لملخصات الحماية. مفعّلة افتراضياً في وضع الحماية؛ عيّن `enabled: false` لتخطي التدقيق.
- `midTurnPrecheck`: فحص اختياري لضغط حلقة الأدوات. عند `enabled: true`، يفحص OpenClaw ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسباً، يوقف المحاولة الحالية قبل إرسال المطالبة ويعيد استخدام مسار الاسترداد الحالي للفحص المسبق لاقتطاع نتائج الأدوات أو إجراء Compaction ثم إعادة المحاولة. يعمل مع وضعي Compaction،‏ `default` و`safeguard`. الافتراضي: معطّل.
- `postCompactionSections`: أسماء اختيارية لأقسام H2/H3 من AGENTS.md لإعادة حقنها بعد Compaction. تكون إعادة الحقن معطّلة عند عدم التعيين أو عند التعيين إلى `[]`. يؤدي تعيين `["Session Startup", "Red Lines"]` صراحة إلى تفعيل هذا الزوج والحفاظ على بديل `Every Session`/`Safety` القديم. فعّل هذا فقط عندما يكون السياق الإضافي مستحقاً لخطر تكرار إرشادات المشروع التي التقطها ملخص Compaction بالفعل.
- `model`: ‏`provider/model-id` اختياري أو اسم مستعار مجرد من `agents.defaults.models` لتلخيص Compaction فقط. تُحل الأسماء المستعارة المجردة قبل الإرسال؛ وتحتفظ معرّفات النماذج الحرفية المضبوطة بالأولوية عند التعارض. استخدم هذا عندما ينبغي للجلسة الرئيسية الاحتفاظ بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم تعيينه، يستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: عتبة اختيارية بالبايت (`number` أو سلاسل مثل `"20mb"`) تؤدي إلى تشغيل Compaction محلي عادي قبل التشغيل عندما يتجاوز JSONL النشط العتبة. يتطلب `truncateAfterCompaction` كي يتمكن Compaction الناجح من التدوير إلى نص لاحق أصغر. معطّل عند عدم التعيين أو `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عندما يبدأ Compaction وعندما يكتمل (مثلاً، "Compacting context..." و"Compaction complete"). معطّل افتراضياً لإبقاء Compaction صامتاً.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين ذكريات دائمة. عيّن `model` إلى مزوّد/نموذج دقيق مثل `ollama/qwen3:8b` عندما ينبغي أن يبقى دور الصيانة هذا على نموذج محلي؛ لا يرث التجاوز سلسلة الرجوع الاحتياطية للجلسة النشطة. يُتخطى عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.runRetries`

حدود تكرار إعادة المحاولة لحلقة التشغيل الخارجية في وقت تشغيل الوكيل المضمّن لمنع حلقات التنفيذ اللانهائية أثناء الاسترداد من الفشل. لاحظ أن هذا الإعداد ينطبق حالياً فقط على وقت تشغيل الوكيل المضمّن، وليس على أوقات تشغيل ACP أو CLI.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: العدد الأساسي لتكرارات إعادة محاولة التشغيل لحلقة التشغيل الخارجية. الافتراضي: `24`.
- `perProfile`: تكرارات إضافية لإعادة محاولة التشغيل تُمنح لكل مرشح ملف تعريف رجوع احتياطي. الافتراضي: `8`.
- `min`: الحد الأدنى المطلق لتكرارات إعادة محاولة التشغيل. الافتراضي: `32`.
- `max`: الحد الأقصى المطلق لتكرارات إعادة محاولة التشغيل لمنع التنفيذ المنفلت. الافتراضي: `160`.

### `agents.defaults.contextPruning`

يشذّب **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل الإرسال إلى LLM. لا يعدّل سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
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

<Accordion title="cache-ttl mode behavior">

- يفعّل `mode: "cache-ttl"` تمريرات التشذيب.
- يتحكم `ttl` في عدد المرات التي يمكن فيها تشغيل التشذيب مرة أخرى (بعد آخر لمس للذاكرة المؤقتة).
- يشذّب التشذيب أولاً نتائج الأدوات كبيرة الحجم تشذيباً خفيفاً، ثم يمسح نتائج الأدوات الأقدم مسحاً كاملاً إذا لزم الأمر.
- يقبل `softTrimRatio` و`hardClearRatio` قيماً من `0.0` إلى `1.0`؛ ويرفض تحقق الإعدادات القيم الواقعة خارج هذا النطاق.

**التشذيب الخفيف** يُبقي البداية + النهاية ويدرج `...` في الوسط.

**المسح الكامل** يستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا تُشذّب أو تُمسح كتل الصور أبداً.
- النسب مبنية على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا وُجدت رسائل مساعد أقل من `keepLastAssistants`، يُتخطى التشذيب.

</Accordion>

راجع [تشذيب الجلسة](/ar/concepts/session-pruning) لتفاصيل السلوك.

### تدفق الكتل

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

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحة لتفعيل ردود الكتل.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات لكل حساب). لدى Signal/Slack/Discord/Google Chat قيمة افتراضية `minChars: 1500`.
- `humanDelay`: إيقاف مؤقت عشوائي بين ردود الكتل. `natural` = ‏800-2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [التدفق](/ar/concepts/streaming) لمعرفة تفاصيل السلوك + التقسيم.

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

- الافتراضيات: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات التي لا تتضمن إشارة.
- تجاوزات لكل جلسة: `session.typingMode`،‏ `session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

وضع حماية اختياري للوكيل المضمّن. راجع [وضع الحماية](/ar/gateway/sandboxing) للدليل الكامل.

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

- `docker`: وقت تشغيل Docker محلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم بـ SSH
- `openshell`: وقت تشغيل OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: الجذر البعيد المطلق المستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يحققها OpenClaw في ملفات مؤقتة أثناء التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح ضبط سياسة مفاتيح مضيف OpenSSH

**أسبقية مصادقة SSH:**

- يتقدم `identityData` على `identityFile`
- يتقدم `certificateData` على `certificateFile`
- يتقدم `knownHostsData` على `knownHostsFile`
- تُحل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة وضع الحماية

**سلوك خلفية SSH:**

- يزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة عمل SSH البعيدة هي المصدر القانوني
- يوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائياً
- لا يدعم حاويات متصفح وضع الحماية

**وصول مساحة العمل:**

- `none`: مساحة عمل وضع حماية لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل وضع الحماية عند `/workspace`، ومساحة عمل الوكيل مركّبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركّبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (بلا عزل بين الجلسات)

**إعداد Plugin OpenShell:**

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

- `mirror`: يهيئ البعيد من المحلي قبل التنفيذ، ثم يزامن مرة أخرى بعد التنفيذ؛ وتبقى مساحة العمل المحلية هي المرجعية
- `remote`: يهيئ البعيد مرة واحدة عند إنشاء البيئة المعزولة، ثم يبقي مساحة العمل البعيدة هي المرجعية

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw إلى البيئة المعزولة تلقائيا بعد خطوة التهيئة.
النقل هو SSH إلى بيئة OpenShell المعزولة، لكن Plugin يملك دورة حياة البيئة المعزولة ومزامنة النسخ الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج للشبكة، وجذر قابل للكتابة، ومستخدم جذر.

**تستخدم الحاويات افتراضيا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة جسر مخصصة) إذا كان الوكيل يحتاج إلى وصول خارجي.
`"host"` محظور. `"container:<id>"` محظور افتراضيا ما لم تضبط صراحة
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (إجراء طارئ).
تستخدم دورات خادم تطبيق Codex داخل بيئة OpenClaw معزولة نشطة إعداد الخروج نفسه لوصول الشبكة الأصلي في وضع الكود.

**المرفقات الواردة** تُجهز في `media/inbound/*` داخل مساحة العمل النشطة.

**`docker.binds`** يركب أدلة مضيف إضافية؛ وتُدمج عمليات الربط العامة والخاصة بكل وكيل.

**المتصفح المعزول** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. يُحقن عنوان noVNC URL في مطالبة النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقب عبر noVNC مصادقة VNC افتراضيا، ويصدر OpenClaw عنوان URL قصير العمر برمز مميز (بدلا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (الافتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- `network` يكون افتراضيا `openclaw-sandbox-browser` (شبكة جسر مخصصة). اضبطه على `bridge` فقط عندما تريد صراحة اتصال جسر عاما.
- `cdpSourceRange` يقيد اختياريا دخول CDP عند حافة الحاوية إلى نطاق CIDR (مثلا `172.21.0.1/32`).
- `sandbox.browser.binds` يركب أدلة مضيف إضافية داخل حاوية المتصفح المعزول فقط. عند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- تُعرف افتراضات التشغيل في `scripts/sandbox-browser-entrypoint.sh` وتُضبط لمضيفي الحاويات:
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
  - `--disable-extensions` (مفعل افتراضيا)
  - `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعلة افتراضيا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` يعيد تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبط `0` لاستخدام حد العمليات
    الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عندما يكون `noSandbox` مفعلا.
  - الافتراضات هي خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة بنقطة دخول مخصصة
    لتغيير افتراضات الحاوية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` خاصان بـ Docker فقط.

ابن الصور (من نسخة مصدرية محلية):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

لتثبيتات npm بدون نسخة مصدرية محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح وكيل موفر TTS أو صوتا أو نموذجا
أو نمطا أو وضع TTS تلقائي خاصا به. يدمج مقطع الوكيل بعمق فوق
`messages.tts`، لذا يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما تتجاوز
الوكلاء الفردية فقط حقول الصوت أو الموفر التي تحتاجها. ينطبق تجاوز الوكيل النشط
على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، و
أداة الوكيل `tts`. راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
لأمثلة الموفرين والأسبقية.

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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

- `id`: معرف وكيل مستقر (مطلوب).
- `default`: عند ضبط عدة وكلاء، يفوز الأول (يُسجل تحذير). إذا لم يُضبط أي منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: صيغة السلسلة تضبط نموذجا أوليا صارما لكل وكيل بدون رجوع إلى نموذج بديل؛ وصيغة الكائن `{ primary }` صارمة أيضا ما لم تضف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في الرجوع إلى البدائل، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحا. تظل مهام Cron التي تتجاوز `primary` فقط ترث البدائل الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معاملات تدفق لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` بدون تكرار كتالوج النماذج بالكامل.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. يدمج المقطع بعمق فوق `messages.tts`، لذا احتفظ ببيانات اعتماد الموفر المشتركة وسياسة الرجوع في `messages.tts` واضبط هنا فقط قيما خاصة بالشخصية مثل الموفر أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح Skills اختيارية لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ وتستبدل القائمة الصريحة الافتراضيات بدلا من دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى تفكير افتراضي اختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف الموفر/النموذج المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، يبقي `adaptive` التفكير الديناميكي المملوك للموفر (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: ظهور استدلال افتراضي اختياري لكل وكيل (`on | off | stream`). يتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `fastModeDefault`: افتراضي اختياري لكل وكيل للوضع السريع (`"auto" | true | false`). ينطبق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `models`: تجاوزات اختيارية لكتالوج النماذج/وقت التشغيل لكل وكيل مفهرسة بمعرفات `provider/model` الكاملة. استخدم `models["provider/model"].agentRuntime` لاستثناءات وقت التشغيل لكل وكيل.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضات `runtime.acp` (`agent`، و`backend`، و`mode`، و`cwd`) عندما ينبغي للوكيل أن يستخدم جلسات حزام ACP افتراضيا.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL بنمط `http(s)`، أو URI بنمط `data:`.
- ملفات صور `identity.avatar` المحلية النسبية إلى مساحة العمل محدودة بـ 2 MB. لا تُفحص عناوين URL بنمط `http(s)` وURI بنمط `data:` بحد حجم الملف المحلي.
- يشتق `identity` الافتراضات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرفات الوكلاء المضبوطة لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي هدف مضبوط؛ الافتراضي: الوكيل نفسه فقط). أدرج معرف الطالب عندما ينبغي السماح باستدعاءات `agentId` التي تستهدف الذات. الإدخالات القديمة التي حُذف تكوين وكيلها يرفضها `sessions_spawn` وتُحذف من `agents_list`؛ شغل `openclaw doctor --fix` لتنظيفها، أو أضف إدخال `agents.list[]` بسيطا إذا كان ينبغي أن يبقى ذلك الهدف قابلا للتفريخ مع وراثة الافتراضيات.
- حارس وراثة البيئة المعزولة: إذا كانت جلسة الطالب معزولة، يرفض `sessions_spawn` الأهداف التي ستعمل بدون عزل.
- `subagents.requireAgentId`: عند ضبطه على true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## توجيه متعدد الوكلاء

شغل عدة وكلاء معزولين داخل Gateway واحد. راجع [متعدد الوكلاء](/ar/concepts/multi-agent).

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

- `type` (اختياري): `route` للتوجيه العادي (النوع المفقود يُعد route افتراضيا)، و`acp` لارتباطات محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ الحذف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (تطابق تام، بدون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل طبقة، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب طبقات ربط route أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="Full access (no sandbox)">

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

<Accordion title="Read-only tools + workspace">

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

راجع [بيئة عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة تفاصيل الأسبقية.

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
      mode: "enforce", // enforce (default) | warn
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
  - `global`: يشترك جميع المشاركين في سياق قناة واحد في جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك جميع الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: يعزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: يعزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: يعزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: يربط المعرّفات الأساسية بالنظراء ذوي بادئة المزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر الإرساء مثل `/dock_discord` الخريطة نفسها لتبديل مسار رد الجلسة النشطة إلى نظير قناة مرتبط آخر؛ راجع [إرساء القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة الضبط الأساسية. يعيد `daily` الضبط عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` الضبط بعد `idleMinutes`. عند تهيئة كليهما، يفوز أيهما تنتهي صلاحيته أولًا. تستخدم حداثة إعادة الضبط اليومية `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة الضبط بسبب الخمول `lastInteractionAt`. يمكن لكتابات الخلفية/أحداث النظام مثل Heartbeat، وتنبيهات Cron، وإشعارات exec، ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تُبقي جلسات daily/idle حديثة.
- **`resetByType`**: تجاوزات لكل نوع (`direct`، `group`، `thread`). يُقبل `dm` القديم كاسم مستعار لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لدورات الرد المتبادل بين الوكلاء أثناء التبادلات من وكيل إلى وكيل (عدد صحيح، النطاق: `0`-`20`، الافتراضي: `5`). يعطّل `0` تسلسل الردود المتبادلة.
- **`sendPolicy`**: يطابق حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم المستعار القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. أول رفض يفوز.
- **`maintenance`**: عناصر تحكم تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: يطبّق `enforce` التنظيف وهو الافتراضي؛ أما `warn` فيصدر تحذيرات فقط.
  - `pruneAfter`: حد العمر للإدخالات المتقادمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفًا دُفعيًا مع هامش صغير للحد الأعلى للقيود بحجم الإنتاج؛ يطبّق `openclaw sessions cleanup --enforce` الحد فورًا.
  - تستخدم جلسات فحص تشغيل نموذج Gateway قصيرة العمر احتفاظًا ثابتًا قدره `24h`، لكن التنظيف مقيد بالضغط: لا يزيل إلا صفوف فحص تشغيل النموذج الصارمة المتقادمة عند بلوغ ضغط صيانة/حد إدخالات الجلسات. المؤهلة فقط مفاتيح الفحص الصريحة الصارمة المطابقة لـ `agent:*:explicit:model-run-<uuid>`؛ ولا ترث جلسات direct وgroup وthread وCron وhook وHeartbeat وACP والوكلاء الفرعيين العادية هذا الاحتفاظ لمدة 24 ساعة. عند تشغيل تنظيف تشغيل النموذج، يعمل قبل تنظيف الإدخالات المتقادمة الأوسع `pruneAfter` وحد `maxEntries`.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من التهيئات الأقدم.
  - `resetArchiveRetention`: الاحتفاظ بأرشيفات نصوص المحادثة `*.reset.<timestamp>`. افتراضيًا يكون `pruneAfter`؛ اضبطه على `false` لتعطيله.
  - `maxDiskBytes`: ميزانية اختيارية لقرص دليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم الأثر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: الافتراضيات العامة لميزات الجلسات المرتبطة بالخيوط.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين تجاوزه؛ يستخدم Discord `channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بعد عدم النشاط بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `spawnSessions`: بوابة افتراضية لإنشاء جلسات عمل مرتبطة بالخيوط من `sessions_spawn` وعمليات إنشاء خيوط ACP. افتراضيًا تكون `true` عند تمكين روابط الخيوط؛ يمكن للمزوّدين/الحسابات التجاوز.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي لعمليات الإنشاء المرتبطة بالخيوط (`"fork"` أو `"isolated"`). افتراضيًا يكون `"fork"`.

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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

### بادئة الاستجابة

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

الحل (الأكثر تحديدًا يفوز): الحساب → القناة → العام. يعطّل `""` ويوقف التسلسل. يستنتج `"auto"` من `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف            | مثال                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر       | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد          | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`, `low`, `off`        |
| `{identity.name}` | اسم هوية الوكيل    | (مثل `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. `{think}` اسم مستعار لـ `{thinkingLevel}`.

### تفاعل الإقرار

- افتراضيًا يكون `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبط `""` لتعطيله.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → بديل الهوية.
- النطاق: `group-mentions` (الافتراضي)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد في القنوات الداعمة للتفاعلات مثل Slack وDiscord وTelegram وWhatsApp وiMessage.
- `messages.statusReactions.enabled`: يمكّن تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram وWhatsApp.
  على Slack وDiscord، يبقي عدم الضبط تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  على Telegram وWhatsApp، اضبطه صراحةً على `true` لتمكين تفاعلات حالة دورة الحياة.
- `messages.statusReactions.emojis`: يتجاوز مفاتيح رموز دورة الحياة:
  `queued` و`thinking` و`compacting` و`tool` و`coding` و`web` و`deploy` و`build`،
  و`concierge` و`done` و`error` و`stallSoft` و`stallHard`.
  يسمح Telegram بمجموعة تفاعلات ثابتة فقط، لذلك تعود الرموز التعبيرية غير المدعومة المهيأة
  إلى أقرب متغير حالة مدعوم لتلك الدردشة.

### تهدئة الوارد

يجمع الرسائل النصية السريعة فقط من المرسل نفسه في دورة وكيل واحدة. تُرسل الوسائط/المرفقات فورًا. تتجاوز أوامر التحكم التهدئة.

### TTS (تحويل النص إلى كلام)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- يتحكم `auto` في وضع auto-TTS الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. يمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- يكون `modelOverrides` مفعلا افتراضيا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك اختياري).
- تعود مفاتيح API احتياطيا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- موفرو الكلام المضمنون مملوكون من Plugin. إذا تم ضبط `plugins.allow`، فأدرج كل Plugin لموفر TTS تريد استخدامه، مثل `microsoft` من أجل Edge TTS. يتم قبول معرف الموفر القديم `edge` كاسم مستعار لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير OpenAI، يعامله OpenClaw كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## التحدث

الإعدادات الافتراضية لوضع التحدث (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
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
          speakerVoice: "cedar",
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

- يجب أن يطابق `talk.provider` مفتاحا في `talk.providers` عند تكوين عدة موفري وضع التحدث.
- مفاتيح وضع التحدث المسطحة القديمة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط. شغل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى `talk.providers.<provider>`.
- تعود معرفات الصوت احتياطيا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات `SecretRef`.
- لا ينطبق الاحتياط `ELEVENLABS_API_KEY` إلا عندما لا يكون أي مفتاح API لوضع التحدث مكونا.
- يتيح `providers.*.voiceAliases` لتوجيهات وضع التحدث استخدام أسماء مألوفة.
- يحدد `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا تم حذفه، يستخدم macOS القيمة `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر مساعد `openclaw-mlx-tts` المضمن عند وجوده، أو عبر ملف تنفيذي على `PATH`؛ ويتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد لأغراض التطوير.
- يتحكم `consultThinkingLevel` في مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات Control UI Talk الفورية `openclaw_agent_consult`. اتركه غير مضبوط للحفاظ على سلوك الجلسة/النموذج العادي.
- يضبط `consultFastMode` تجاوزا لمرة واحدة لوضع السرعة لاستشارات Control UI Talk الفورية من دون تغيير إعداد وضع السرعة العادي للجلسة.
- يضبط `speechLocale` معرف لغة BCP 47 المستخدم من قبل تعرف الكلام في وضع التحدث على iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع التحدث بعد صمت المستخدم قبل إرسال النص المنسوخ. إبقاؤه غير مضبوط يحافظ على نافذة التوقف المؤقت الافتراضية للمنصة (`700 ms on macOS and Android, 900 ms on iOS`).
- يضيف `realtime.instructions` تعليمات نظام موجهة للموفر إلى الموجه الفوري المدمج في OpenClaw، بحيث يمكن تكوين أسلوب الصوت من دون فقدان إرشادات `openclaw_agent_consult` الافتراضية.
- يتحكم `realtime.consultRouting` في احتياط ترحيل Gateway عندما ينتج الموفر الفوري نص مستخدم نهائيا من دون `openclaw_agent_consult`: يحافظ `provider-direct` على ردود الموفر المباشرة، بينما يوجه `force-agent-consult` الطلب النهائي عبر OpenClaw.

---

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — جميع مفاتيح الإعدادات الأخرى
- [الإعدادات](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
