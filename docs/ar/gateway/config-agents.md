---
read_when:
    - ضبط إعدادات الوكيل الافتراضية (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين التوجيه والارتباطات متعددة الوكلاء
    - ضبط الجلسة، وتسليم الرسائل، وسلوك وضع المحادثة
summary: إعدادات الوكيل الافتراضية، وتوجيه الوكلاء المتعددين، والجلسة، والرسائل، وإعدادات المحادثة
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-07-03T13:33:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3f5d217738a8eebc3c94b61261ca34221b13ac08ffdba9cad61c9a48ed1ac
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح التكوين المخصصة للنطاق الوكيل ضمن `agents.*` و`multiAgent.*` و`session.*`
و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات ووقت تشغيل Gateway والمفاتيح الأخرى
ذات المستوى الأعلى، راجع [مرجع التكوين](/ar/gateway/configuration-reference).

## افتراضيات الوكيل

### `agents.defaults.workspace`

الافتراضي: `OPENCLAW_WORKSPACE_DIR` عند تعيينه، وإلا `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

تكون لقيمة `agents.defaults.workspace` الصريحة أسبقية على
`OPENCLAW_WORKSPACE_DIR`. استخدم متغير البيئة لتوجيه الوكلاء الافتراضيين
إلى مساحة عمل مركبة عندما لا تريد كتابة ذلك المسار في التكوين.

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime في مطالبة النظام. إذا لم يتم تعيينه، يكتشف OpenClaw ذلك تلقائيا عبر الصعود من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح Skills افتراضية اختيارية للوكلاء الذين لا يعيّنون
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // يرث github وweather
      { id: "docs", skills: ["docs-search"] }, // يستبدل الافتراضيات
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للسماح غير المقيد بـ Skills افتراضيا.
- احذف `agents.list[].skills` لوراثة الافتراضيات.
- عيّن `agents.list[].skills: []` لعدم استخدام Skills.
- القائمة غير الفارغة `agents.list[].skills` هي المجموعة النهائية لذلك الوكيل؛ ولا
  تندمج مع الافتراضيات.

### `agents.defaults.skipBootstrap`

يعطل الإنشاء التلقائي لملفات تمهيد مساحة العمل (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

يتخطى إنشاء ملفات مساحة العمل الاختيارية المحددة مع الاستمرار في كتابة ملفات التمهيد المطلوبة. القيم الصالحة: `SOUL.md` و`USER.md` و`HEARTBEAT.md` و`IDENTITY.md`.

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

يتحكم في وقت حقن ملفات تمهيد مساحة العمل في مطالبة النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد استجابة مكتملة من المساعد) إعادة حقن تمهيد مساحة العمل، مما يقلل حجم المطالبة. لا تزال تشغيلات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: عطّل تمهيد مساحة العمل وحقن ملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة المطالبة بالكامل (محركات سياق مخصصة، أو أوقات تشغيل أصلية تبني سياقها الخاص، أو مسارات عمل متخصصة بلا تمهيد). تتخطى أدوار Heartbeat واسترداد Compaction الحقن أيضا.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

تجاوز لكل وكيل: `agents.list[].contextInjection`. القيم المحذوفة ترث
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف لكل ملف تمهيد مساحة عمل قبل الاقتطاع. الافتراضي: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

تجاوز لكل وكيل: `agents.list[].bootstrapMaxChars`. القيم المحذوفة ترث
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى لإجمالي الأحرف المحقونة عبر جميع ملفات تمهيد مساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

تجاوز لكل وكيل: `agents.list[].bootstrapTotalMaxChars`. القيم المحذوفة
ترث `agents.defaults.bootstrapTotalMaxChars`.

### تجاوزات ملف تعريف التمهيد لكل وكيل

استخدم تجاوزات ملف تعريف التمهيد لكل وكيل عندما يحتاج وكيل واحد إلى سلوك
حقن مطالبة مختلف عن الافتراضيات المشتركة. الحقول المحذوفة ترث من
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

يتحكم في إشعار مطالبة النظام المرئي للوكيل عند اقتطاع سياق التمهيد.
الافتراضي: `"always"`.

- `"off"`: لا تحقن نص إشعار الاقتطاع أبدا في مطالبة النظام.
- `"once"`: احقن إشعارا موجزا مرة واحدة لكل توقيع اقتطاع فريد.
- `"always"`: احقن إشعارا موجزا في كل تشغيل عند وجود اقتطاع (موصى به).

تبقى الأعداد الخام/المحقونة المفصلة وحقول ضبط التكوين في التشخيصات مثل
تقارير حالة/سياق والسجلات؛ ولا يحصل سياق مستخدم/وقت تشغيل WebChat الروتيني
إلا على إشعار الاسترداد الموجز.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات مطالبة/سياق عالية الحجم، وهي
مقسمة عمدا حسب النظام الفرعي بدلا من تمريرها جميعا عبر
مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  تمهيد تشغيل نموذج مرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة. يتم الإقرار بأوامر الدردشة المجردة
  `/new` و`/reset` من دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في مطالبة النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل محقونة يملكها وقت التشغيل.
- `memory.qmd.limits.*`:
  مقتطف البحث في الذاكرة المفهرسة وحجم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية
مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء الدور الأول المحقون عند تشغيلات نموذج إعادة الضبط/بدء التشغيل.
تقر أوامر الدردشة المجردة `/new` و`/reset` بإعادة الضبط من دون استدعاء
النموذج، لذلك لا تحمل هذا التمهيد.

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

افتراضيات مشتركة لأسطح سياق وقت التشغيل المحدودة.

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

- `memoryGetMaxChars`: حد مقتطف `memory_get` الافتراضي قبل إضافة
  بيانات الاقتطاع الوصفية وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة أسطر `memory_get` الافتراضية عندما يكون `lines`
  محذوفا.
- `toolResultMaxChars`: سقف متقدم مباشر لنتائج الأدوات يُستخدم للنتائج المستمرة
  واسترداد الفائض. اتركه غير معيّن لاستخدام حد سياق النموذج التلقائي:
  `16000` حرف تحت 100K رمز، و`32000` حرف عند 100K+ رمز، و`64000`
  حرف عند 200K+ رمز. تُقبل القيم الصريحة حتى `1000000`
  لنماذج السياق الطويل، لكن الحد الفعال يظل مقيدا بحوالي 30% من
  نافذة سياق النموذج. يطبع `openclaw doctor --deep` الحد الفعال،
  ولا يحذر doctor إلا عندما يكون التجاوز الصريح قديما أو بلا تأثير.
- `postCompactionMaxChars`: حد مقتطف AGENTS.md المستخدم أثناء حقن
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
          toolResultMaxChars: 8000, // سقف متقدم لهذا الوكيل
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

حد عام لقائمة Skills المضغوطة المحقونة في مطالبة النظام. هذا
لا يؤثر في قراءة ملفات `SKILL.md` عند الطلب.

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

تجاوز لكل وكيل لميزانية مطالبة Skills.

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

الحد الأقصى لحجم البكسل لأطول جانب في الصورة ضمن كتل صور النص/الأدوات قبل استدعاءات المزود.
الافتراضي: `1200`.

تقلل القيم الأقل عادة استخدام رموز الرؤية وحجم حمولة الطلب للتشغيلات الكثيفة بلقطات الشاشة.
تحافظ القيم الأعلى على مزيد من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

تفضيل ضغط/تفاصيل أداة الصور للصور المحملة من مسارات الملفات وعناوين URL ومراجع الوسائط.
الافتراضي: `auto`.

يكيف OpenClaw سلم تغيير الحجم مع نموذج الصور المحدد. على سبيل المثال، يمكن لنماذج Claude Opus 4.8 وOpenAI GPT-5.5 وQwen VL ونماذج رؤية Llama 4 المستضافة استخدام صور أكبر من مسارات الرؤية القديمة/الافتراضية عالية التفاصيل، بينما تضغط أدوار الصور المتعددة بقوة أكبر في وضع `auto` للتحكم في تكلفة الرموز وزمن الاستجابة.

القيم:

- `auto`: التكيف مع حدود النموذج وعدد الصور.
- `efficient`: تفضيل الصور الأصغر لتقليل استخدام الرموز والبايتات.
- `balanced`: استخدام سلم متوسط قياسي.
- `high`: الحفاظ على مزيد من التفاصيل للقطات الشاشة والمخططات وصور المستندات.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق مطالبة النظام (وليست طوابع وقت الرسائل). تعود إلى المنطقة الزمنية للمضيف عند عدم توفرها.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في مطالبة النظام. الافتراضي: `auto` (تفضيل نظام التشغيل).

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
      params: { cacheRetention: "long" }, // معلمات المزود الافتراضية العامة
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
  - يعيّن شكل الكائن النموذج الأساسي بالإضافة إلى نماذج تجاوز الفشل المرتّبة.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` كإعداد لنموذج الرؤية الخاص بها.
  - يُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرّفات المجردة للتوافق؛ إذا طابق معرّف مجرد بشكل فريد إدخالًا مهيأً قادرًا على الصور في `models.providers.*.models`، فإن OpenClaw يؤهله إلى ذلك المزوّد. تتطلب المطابقات المهيأة الغامضة بادئة مزوّد صريحة.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد صورًا.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لـ OpenAI Images، أو `openai/gpt-image-1.5` لإخراج OpenAI PNG/WebP بخلفية شفافة.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فهيّئ مصادقة المزوّد المطابقة أيضًا (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، أو `FAL_KEY` لـ `fal/*`).
  - إذا حُذف، فلا يزال بإمكان `image_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم مزوّدي توليد الصور المسجلين المتبقين بترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الموسيقى المشتركة وأداة `music_generate` المضمّنة.
  - القيم النموذجية: `google/lyria-3-clip-preview`، أو `google/lyria-3-pro-preview`، أو `minimax/music-2.6`.
  - إذا حُذف، فلا يزال بإمكان `music_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم مزوّدي توليد الموسيقى المسجلين المتبقين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فهيّئ مصادقة المزوّد/مفتاح API المطابق أيضًا.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الفيديو المشتركة وأداة `video_generate` المضمّنة.
  - القيم النموذجية: `qwen/wan2.6-t2v`، أو `qwen/wan2.6-i2v`، أو `qwen/wan2.6-r2v`، أو `qwen/wan2.6-r2v-flash`، أو `qwen/wan2.7-r2v`.
  - إذا حُذف، فلا يزال بإمكان `video_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم مزوّدي توليد الفيديو المسجلين المتبقين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فهيّئ مصادقة المزوّد/مفتاح API المطابق أيضًا.
  - يدعم Plugin توليد الفيديو الرسمي من Qwen ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات `size` و`aspectRatio` و`resolution` و`audio` و`watermark` على مستوى المزوّد.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/الافتراضي المحلول.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرَّر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يضعها وضع الاستخراج الاحتياطي في الاعتبار في أداة `pdf`.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `toolProgressDetail`: وضع التفاصيل لملخصات أدوات `/verbose` وأسطر أدوات مسودة التقدم. القيم: `"explain"` (الافتراضي، تسميات بشرية مختصرة) أو `"raw"` (إلحاق الأمر/التفاصيل الخام عند توفرها). يتجاوز `agents.list[].toolProgressDetail` الخاص بكل وكيل هذا الافتراضي.
- `reasoningDefault`: الرؤية الافتراضية للاستدلال للوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` الخاص بكل وكيل هذا الافتراضي. لا تُطبّق افتراضيات الاستدلال المهيأة إلا للمالكين، أو المرسلين المصرح لهم، أو سياقات Gateway الخاصة بمشرفي التشغيل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.5` للوصول عبر مفتاح API من OpenAI أو Codex OAuth). إذا حذفت المزوّد، يجرّب OpenClaw اسمًا مستعارًا أولًا، ثم مطابقة فريدة لمزوّد مهيأ لذلك المعرّف الدقيق للنموذج، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المهيأ (سلوك توافق مهجور، لذلك فضّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يعرض النموذج الافتراضي المهيأ، يعود OpenClaw إلى أول مزوّد/نموذج مهيأ بدلًا من إظهار افتراضي قديم لمزوّد تمت إزالته.
- `models`: كتالوج النماذج المهيأ وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، على سبيل المثال `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` وتوجيه OpenRouter `provider` و`chat_template_kwargs` و`extra_body`/`extraBody`).
  - استخدم إدخالات `provider/*` مثل `"openai/*": {}` أو `"vllm/*": {}` لإظهار كل النماذج المكتشفة لمزوّدين محددين دون سرد كل معرّف نموذج يدويًا.
  - أضف `agentRuntime` إلى إدخال `provider/*` عندما ينبغي لكل نموذج مكتشف ديناميكيًا لذلك المزوّد استخدام وقت التشغيل نفسه. لا تزال سياسة وقت التشغيل الدقيقة لـ `provider/model` تتغلب على حرف البدل.
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات قائمة السماح الحالية ما لم تمرر `--replace`.
  - تدمج تدفقات التهيئة/الإعداد محددة النطاق للمزوّد النماذج المحددة للمزوّد في هذه الخريطة وتحافظ على المزوّدين غير المرتبطين المهيأين مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، يتم تمكين Compaction من جهة الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction من جهة الخادم في OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معاملات المزوّد الافتراضية العامة التي تُطبّق على كل النماذج. تُعيّن في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (الإعداد): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (معرّف الوكيل المطابق) حسب المفتاح. راجع [تخزين المطالبات مؤقتًا](/ar/reference/prompt-caching) للتفاصيل.
- `models.providers.openrouter.params.provider`: سياسة توجيه المزوّد الافتراضية على مستوى OpenRouter. يمرر OpenClaw هذا إلى كائن `provider` في طلب OpenRouter؛ وتتجاوز `agents.defaults.models["openrouter/<model>"].params.provider` الخاصة بكل نموذج ومعاملات الوكيل حسب المفتاح. راجع [توجيه المزوّد في OpenRouter](/ar/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلب المولدة، يفوز الجسم الإضافي؛ ولا تزال مسارات completions غير الأصلية تزيل `store` الخاص بـ OpenAI فقط بعد ذلك.
- `params.chat_template_kwargs`: وسائط قوالب الدردشة المتوافقة مع vLLM/OpenAI المدمجة في أجسام طلبات `api: "openai-completions"` ذات المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ وتتجاوز `chat_template_kwargs` الصريحة الافتراضيات المولدة، ولا يزال لـ `extra_body.chat_template_kwargs` الأسبقية النهائية. تعرض نماذج التفكير Qwen وNemotron المهيأة في vLLM اختيارات `/think` ثنائية (`off`، `on`) بدلًا من سلم الجهد متعدد المستويات.
- `compat.thinkingFormat`: نمط حمولة التفكير المتوافق مع OpenAI. استخدم `"together"` لـ `reasoning.enabled` بنمط Together، أو `"qwen"` لـ `enable_thinking` ذي المستوى الأعلى بنمط Qwen، أو `"qwen-chat-template"` لـ `chat_template_kwargs.enable_thinking` على خلفيات عائلة Qwen التي تدعم kwargs لقوالب الدردشة على مستوى الطلب، مثل vLLM. يطابق OpenClaw التفكير المعطل إلى `false` والتفكير الممكّن إلى `true`، وتعرض نماذج Qwen المهيأة في vLLM اختيارات `/think` ثنائية لهذه التنسيقات.
- `compat.supportedReasoningEfforts`: قائمة جهود الاستدلال المتوافقة مع OpenAI لكل نموذج. ضمّن `"xhigh"` للنقاط النهائية المخصصة التي تقبله فعلًا؛ عندئذٍ يعرض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيحات الجلسة، والتحقق من CLI للوكيل، والتحقق من `llm-task` لذلك المزوّد/النموذج المهيأ. استخدم `compat.reasoningEffortMap` عندما تريد الخلفية قيمة خاصة بالمزوّد لمستوى معياري.
- `params.preserveThinking`: اشتراك خاص بـ Z.AI فقط للتفكير المحفوظ. عند تمكينه وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `localService`: مدير عمليات اختياري على مستوى المزوّد لخوادم النماذج المحلية/ذاتية الاستضافة. عندما ينتمي النموذج المحدد إلى ذلك المزوّد، يفحص OpenClaw `healthUrl` (أو `baseUrl + "/models"`)، ويبدأ `command` مع `args` إذا كانت نقطة النهاية متوقفة، وينتظر حتى `readyTimeoutMs`، ثم يرسل طلب النموذج. يجب أن يكون `command` مسارًا مطلقًا. يبقي `idleStopMs: 0` العملية نشطة حتى يخرج OpenClaw؛ وتوقف القيمة الموجبة العملية التي أطلقها OpenClaw بعد ذلك العدد من ميلي ثانية الخمول. راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- تنتمي سياسة وقت التشغيل إلى المزوّدين أو النماذج، وليس إلى `agents.defaults`. استخدم `models.providers.<provider>.agentRuntime` للقواعد على مستوى المزوّد أو `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` للقواعد الخاصة بالنموذج. تختار نماذج وكيل OpenAI على مزوّد OpenAI الرسمي Codex افتراضيًا.
- يحفظ كتّاب الإعدادات الذين يعدّلون هذه الحقول (على سبيل المثال أوامر `/models set` و`/models set-image` وإضافة/إزالة الاحتياطي) شكل الكائن المعياري ويحافظون على قوائم الاحتياط الحالية عند الإمكان.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكلاء المتوازية عبر الجلسات (تظل كل جلسة متسلسلة). الافتراضي: 4.

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

- `id`: ‏`"auto"`، أو `"openclaw"`، أو معرّف حزمة Plugin مسجّل، أو اسم مستعار مدعوم لواجهة CLI الخلفية. يسجّل Plugin Codex المضمّن `codex`؛ ويوفّر Plugin Anthropic المضمّن واجهة CLI الخلفية `claude-cli`.
- يتيح `id: "auto"` لحزم Plugin المسجّلة المطالبة بالدورات المدعومة، ويستخدم OpenClaw عندما لا تتطابق أي حزمة. يتطلب تشغيل Plugin صريح مثل `id: "codex"` تلك الحزمة ويفشل بشكل مغلق إذا لم تكن متاحة أو فشلت.
- لا يُقبل `id: "pi"` إلا كاسم مستعار مهمل لـ `openclaw` للحفاظ على الإعدادات المشحونة من v2026.5.22 وما قبله. يجب أن تستخدم الإعدادات الجديدة `openclaw`.
- تكون أسبقية التشغيل أولًا لسياسة النموذج المطابقة بدقة (`agents.list[].models["provider/model"]` أو `agents.defaults.models["provider/model"]` أو `models.providers.<provider>.models[]`)، ثم `agents.list[]` / `agents.defaults.models["provider/*"]`، ثم السياسة على مستوى المزوّد في `models.providers.<provider>.agentRuntime`.
- مفاتيح تشغيل الوكيل الكلي قديمة. يتم تجاهل `agents.defaults.agentRuntime` و`agents.list[].agentRuntime` وتثبيتات تشغيل الجلسة و`OPENCLAW_AGENT_RUNTIME` عند اختيار التشغيل. شغّل `openclaw doctor --fix` لإزالة القيم القديمة.
- تستخدم نماذج وكلاء OpenAI حزمة Codex افتراضيًا؛ وتظل `agentRuntime.id: "codex"` الخاصة بالمزوّد/النموذج صالحة عندما تريد جعل ذلك صريحًا.
- بالنسبة إلى نشرات Claude CLI، فضّل `model: "anthropic/claude-opus-4-8"` مع `agentRuntime.id: "claude-cli"` محدد النطاق للنموذج. لا تزال مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل للتوافق، لكن يجب أن تحافظ الإعدادات الجديدة على اختيار المزوّد/النموذج بشكل معياري وأن تضع واجهة التنفيذ الخلفية في سياسة تشغيل المزوّد/النموذج.
- يتحكم هذا فقط في تنفيذ دور وكيل النص. لا تزال عمليات توليد الوسائط والرؤية وPDF والموسيقى والفيديو وTTS تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار      | النموذج                         |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

تتغلب الأسماء المستعارة التي ضبطتها دائمًا على الافتراضيات.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI ‏`tool_stream` افتراضيًا لتدفق استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
يبقي Anthropic Claude Opus 4.8 التفكير معطّلًا افتراضيًا في OpenClaw؛ وعندما يتم تفعيل التفكير التكيّفي صراحة، يكون افتراضي الجهد المملوك لمزوّد Anthropic هو `high`. تكون نماذج Claude 4.6 افتراضيًا على `adaptive` عندما لا يُضبط مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية للتشغيلات الاحتياطية النصية فقط (من دون استدعاءات أدوات). مفيدة كنسخة احتياطية عندما تفشل مزوّدات API.

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

- واجهات CLI الخلفية تركّز على النص أولًا؛ يتم تعطيل الأدوات دائمًا.
- الجلسات مدعومة عند ضبط `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.
- يتيح `reseedFromRawTranscriptWhenUncompacted: true` لواجهة خلفية استرداد الجلسات الآمنة
  غير الصالحة من ذيل محدود لنص OpenClaw خام قبل وجود
  أول ملخص Compaction. تغييرات ملف تعريف المصادقة أو حقبة بيانات الاعتماد
  لا تعيد البذر الخام أبدًا.

### `agents.defaults.promptOverlays`

تراكبات موجهات مستقلة عن المزوّد تُطبّق حسب عائلة النموذج على أسطح الموجهات التي يجمعها OpenClaw. تتلقى معرفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر مسارات OpenClaw/المزوّد؛ يتحكم `personality` فقط في طبقة نمط التفاعل الودية. تحتفظ مسارات خادم تطبيق Codex الأصلية بتعليمات الأساس/النموذج المملوكة لـ Codex بدلًا من تراكب OpenClaw GPT-5 هذا، ويعطّل OpenClaw الشخصية المضمنة في Codex للخيوط الأصلية.

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

- تفعّل `"friendly"` (الافتراضي) و`"on"` طبقة نمط التفاعل الودية.
- يعطّل `"off"` الطبقة الودية فقط؛ ويظل عقد سلوك GPT-5 الموسوم مفعّلًا.
- لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ عندما لا يكون هذا الإعداد المشترك مضبوطًا.

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
- `includeSystemPromptSection`: عند ضبطها على false، تحذف قسم Heartbeat من موجه النظام وتتخطى حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند ضبطها على true، تمنع حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: أقصى وقت بالثواني مسموح به لدور وكيل Heartbeat قبل إجهاضه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds` عند ضبطه، وإلا تُستخدم وتيرة Heartbeat بحد أقصى 600 ثانية.
- `directPolicy`: سياسة التسليم المباشر/DM. يسمح `allow` (الافتراضي) بالتسليم إلى هدف مباشر. يمنع `block` التسليم إلى هدف مباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند ضبطها على true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتُبقي فقط `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند ضبطها على true، يعمل كل Heartbeat في جلسة جديدة بلا سجل محادثة سابق. نفس نمط العزل مثل Cron ‏`sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- `skipWhenBusy`: عند ضبطها على true، تؤجل تشغيلات Heartbeat عند وجود مسارات انشغال إضافية لذلك الوكيل: عمل الوكيل الفرعي الخاص به والمفتاح بالجلسة أو عمل أوامر متداخلة. تؤجل مسارات Cron دائمًا Heartbeats، حتى من دون هذا العلم.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، تعمل Heartbeats **لتلك الوكلاء فقط**.
- تشغّل Heartbeats أدوار وكيل كاملة — الفواصل الأقصر تستهلك رموزًا أكثر.

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

- `mode`: `default` أو `safeguard` (تلخيص مقسم للمحفوظات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin موفر Compaction مسجل. عند ضبطه، يُستدعى `summarize()` الخاص بالموفر بدلا من تلخيص LLM المدمج. يعود إلى المدمج عند الفشل. ضبط موفر يفرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: أقصى عدد ثوان مسموح به لعملية Compaction واحدة قبل أن يوقفها OpenClaw. الافتراضي: `180`.
- `keepRecentTokens`: ميزانية نقطة قطع الوكيل للاحتفاظ بذيل السجل النصي الأحدث حرفيا. يحترم `/compact` اليدوي هذا عند ضبطه صراحة؛ وإلا تكون Compaction اليدوية نقطة تحقق صارمة.
- `identifierPolicy`: `strict` (الافتراضي)، أو `off`، أو `custom`. يضيف `strict` إرشادات مدمجة للاحتفاظ بالمعرفات المعتمة في بداية تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرفات يُستخدم عند `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند مخرجات غير سليمة لتلخيصات safeguard. مفعلة افتراضيا في وضع safeguard؛ اضبط `enabled: false` لتخطي التدقيق.
- `midTurnPrecheck`: فحص اختياري لضغط حلقة الأدوات. عند `enabled: true`، يفحص OpenClaw ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسبا، يوقف المحاولة الحالية قبل إرسال الموجه، ويعيد استخدام مسار الاسترداد الحالي للفحص المسبق لاقتطاع نتائج الأدوات أو إجراء Compaction ثم إعادة المحاولة. يعمل مع وضعي Compaction: `default` و`safeguard`. الافتراضي: معطل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من AGENTS.md لإعادة حقنها بعد Compaction. تكون إعادة الحقن معطلة عند عدم الضبط أو عند الضبط إلى `[]`. الضبط الصريح إلى `["Session Startup", "Red Lines"]` يفعّل هذا الزوج ويحافظ على احتياطي `Every Session`/`Safety` القديم. فعّل هذا فقط عندما يكون السياق الإضافي مستحقا لمخاطرة تكرار إرشادات المشروع التي التقطها ملخص Compaction بالفعل.
- `model`: `provider/model-id` اختياري أو اسم مستعار مجرد من `agents.defaults.models` لتلخيص Compaction فقط. تُحل الأسماء المستعارة المجردة قبل الإرسال؛ وتحتفظ معرفات النماذج الحرفية المضبوطة بالأسبقية عند التعارض. استخدم هذا عندما ينبغي أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما تعمل تلخيصات Compaction على نموذج آخر؛ وعند عدم الضبط، تستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: عتبة اختيارية بالبايت (`number` أو سلاسل مثل `"20mb"`) تشغّل Compaction المحلية العادية قبل التشغيل عندما يتجاوز JSONL النشط العتبة. يتطلب `truncateAfterCompaction` كي تتمكن Compaction الناجحة من التدوير إلى سجل نصي لاحق أصغر. معطل عند عدم الضبط أو `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتمالها (مثلا، "Compacting context..." و"Compaction complete"). معطل افتراضيا لإبقاء Compaction صامتة.
- `memoryFlush`: دورة وكيلية صامتة قبل Compaction التلقائية لتخزين ذكريات دائمة. اضبط `model` إلى موفر/نموذج دقيق مثل `ollama/qwen3:8b` عندما ينبغي أن تبقى دورة الصيانة هذه على نموذج محلي؛ ولا يرث التجاوز سلسلة الاحتياط للجلسة النشطة. يُتخطى عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.runRetries`

حدود تكرارات إعادة المحاولة لحلقة التشغيل الخارجية في وقت تشغيل الوكيل المضمن لمنع حلقات التنفيذ اللانهائية أثناء الاسترداد من الفشل. لاحظ أن هذا الإعداد ينطبق حاليا فقط على وقت تشغيل الوكيل المضمن، وليس على أوقات تشغيل ACP أو CLI.

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
- `perProfile`: تكرارات إعادة محاولة تشغيل إضافية تُمنح لكل مرشح ملف تعريف احتياطي. الافتراضي: `8`.
- `min`: الحد الأدنى المطلق لتكرارات إعادة محاولة التشغيل. الافتراضي: `32`.
- `max`: الحد الأقصى المطلق لتكرارات إعادة محاولة التشغيل لمنع التنفيذ المنفلت. الافتراضي: `160`.

### `agents.defaults.contextPruning`

يشذب **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل الإرسال إلى LLM. لا يعدّل سجل الجلسة على القرص.

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

- `mode: "cache-ttl"` يفعّل جولات التشذيب.
- يتحكم `ttl` في عدد مرات إمكانية تشغيل التشذيب مجددا (بعد آخر لمس للتخزين المؤقت).
- يبدأ التشذيب باقتطاع نتائج الأدوات الزائدة حجما اقتطاعا خفيفا، ثم يمسح نتائج الأدوات الأقدم مسحا صارما عند الحاجة.
- يقبل `softTrimRatio` و`hardClearRatio` قيما من `0.0` إلى `1.0`؛ ويرفض تحقق الإعدادات القيم خارج هذا النطاق.

**الاقتطاع الخفيف** يحتفظ بالبداية + النهاية ويدرج `...` في الوسط.

**المسح الصارم** يستبدل نتيجة الأداة كاملة بالنص البديل.

ملاحظات:

- لا تُقتطع/تُمسح كتل الصور أبدا.
- النسب مبنية على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا وُجد عدد أقل من `keepLastAssistants` من رسائل المساعد، يُتخطى التشذيب.

</Accordion>

راجع [تشذيب الجلسة](/ar/concepts/session-pruning) لتفاصيل السلوك.

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

- تتطلب القنوات غير Telegram ضبطا صريحا لـ `*.blockStreaming: true` لتفعيل الردود الكتلية.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (والتنويعات لكل حساب). القيمة الافتراضية في Signal/Slack/Discord/Google Chat هي `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود الكتلية. `natural` = 800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [البث](/ar/concepts/streaming) لتفاصيل السلوك + التقسيم إلى مقاطع.

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

- الافتراضيات: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات غير المذكورة.
- تجاوزات لكل جلسة: `session.typingMode`، `session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

عزل اختياري في صندوق حماية للوكيل المضمن. راجع [العزل في صندوق الحماية](/ar/gateway/sandboxing) للدليل الكامل.

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

- `docker`: وقت تشغيل Docker المحلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم بـ SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يجسدها OpenClaw في ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مقابض سياسة مفتاح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` له الأسبقية على `identityFile`
- `certificateData` له الأسبقية على `certificateFile`
- `knownHostsData` له الأسبقية على `knownHostsFile`
- تُحل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة صندوق الحماية

**سلوك خلفية SSH:**

- تهيئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تُبقي مساحة عمل SSH البعيدة هي المرجع canonical
- توجه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيا
- لا تدعم حاويات متصفح صندوق الحماية

**وصول مساحة العمل:**

- `none`: مساحة عمل صندوق حماية لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل صندوق الحماية عند `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة/الكتابة عند `/workspace`

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

- `mirror`: يهيئ البعيد من المحلي قبل التنفيذ، ثم يزامن الرجوع بعد التنفيذ؛ وتبقى مساحة العمل المحلية هي المرجع المعتمد
- `remote`: يهيئ البعيد مرة واحدة عند إنشاء صندوق العزل، ثم يبقي مساحة العمل البعيدة هي المرجع المعتمد

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw إلى صندوق العزل تلقائيًا بعد خطوة التهيئة.
النقل هو SSH إلى صندوق عزل OpenShell، لكن Plugin يملك دورة حياة صندوق العزل والمزامنة الاختيارية بأسلوب mirror.

يعمل **`setupCommand`** مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج شبكي، وجذر قابل للكتابة، ومستخدم جذر.

**تستخدم الحاويات افتراضيًا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة جسر مخصصة) إذا كان الوكيل يحتاج إلى وصول خارجي.
`"host"` محظور. و`"container:<id>"` محظور افتراضيًا ما لم تضبط صراحة
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (إجراء طارئ).
تستخدم دورات خادم تطبيق Codex داخل صندوق عزل OpenClaw نشط إعداد الخروج نفسه لوصول الشبكة الأصلي في وضع الكود.

يتم تجهيز **المرفقات الواردة** في `media/inbound/*` داخل مساحة العمل النشطة.

يثبّت **`docker.binds`** أدلة مضيف إضافية؛ ويتم دمج التثبيتات العامة وتثبيتات كل وكيل.

**المتصفح المعزول** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. يتم حقن عنوان URL الخاص بـ noVNC في موجه النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول مراقب noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL برمز قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (الافتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة جسر مخصصة). اضبطها على `bridge` فقط عندما تريد صراحة اتصالًا عامًا عبر الجسر.
- يمكن لـ `cdpSourceRange` اختياريًا تقييد دخول CDP عند حافة الحاوية إلى نطاق CIDR (مثل `172.21.0.1/32`).
- يثبّت `sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية متصفح صندوق العزل فقط. عند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- تُعرّف افتراضات التشغيل في `scripts/sandbox-browser-entrypoint.sh` ومضبوطة لمضيفي الحاويات:
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
  - يتم تفعيل `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    افتراضيًا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الامتدادات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبط `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - الافتراضات هي خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع نقطة إدخال مخصصة
    لتغيير افتراضات الحاوية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` خاصان بـ Docker فقط.

ابنِ الصور (من نسخة مصدر محلية):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

لتثبيتات npm من دون نسخة مصدر محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح الوكيل مزود TTS أو صوتًا أو نموذجًا
أو نمطًا أو وضع TTS تلقائيًا خاصًا به. تُدمج كتلة الوكيل دمجًا عميقًا فوق
`messages.tts`، لذلك يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما يتجاوز
كل وكيل على حدة حقول الصوت أو المزود التي يحتاجها فقط. ينطبق تجاوز الوكيل النشط
على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، وأداة الوكيل
`tts`. راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
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

- `id`: معرّف وكيل ثابت (مطلوب).
- `default`: عند ضبط عدة عناصر، يفوز الأول (مع تسجيل تحذير). إذا لم يُضبط أي عنصر، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: يضبط شكل السلسلة نموذجًا أساسيًا صارمًا لكل وكيل من دون احتياطي للنماذج؛ وشكل الكائن `{ primary }` صارم أيضًا ما لم تضف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في الاحتياطي، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. مهام Cron التي تتجاوز `primary` فقط تظل ترث الاحتياطيات الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات بث لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النماذج بالكامل.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. تُدمج الكتلة دمجًا عميقًا فوق `messages.tts`، لذلك أبقِ بيانات اعتماد المزود المشتركة وسياسة الاحتياطي في `messages.tts` واضبط هنا فقط القيم الخاصة بالشخصية مثل المزود أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا أُغفلت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ تستبدل القائمة الصريحة الافتراضات بدل دمجها، و`[]` تعني عدم وجود Skills.
- `thinkingDefault`: مستوى thinking افتراضي اختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزود/النموذج المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، تُبقي `adaptive` التفكير الديناميكي المملوك للمزود (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: رؤية reasoning افتراضية اختيارية لكل وكيل (`on | off | stream`). يتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عندما لا يكون هناك تجاوز reasoning لكل رسالة أو جلسة.
- `fastModeDefault`: افتراضي اختياري لكل وكيل للوضع السريع (`"auto" | true | false`). ينطبق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `models`: كتالوج نماذج/تجاوزات تشغيل اختيارية لكل وكيل مفهرسة بمعرّفات `provider/model` الكاملة. استخدم `models["provider/model"].agentRuntime` لاستثناءات التشغيل لكل وكيل.
- `runtime`: واصف تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضات `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) عندما يجب أن يستخدم الوكيل جلسات حزمة ACP افتراضيًا.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL بنمط `http(s)`، أو URI بنمط `data:`.
- ملفات صور `identity.avatar` المحلية النسبية إلى مساحة العمل محدودة بـ 2 ميغابايت. لا تُفحص عناوين URL بنمط `http(s)` وURIs بنمط `data:` بحد حجم الملف المحلي.
- يشتق `identity` الافتراضات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح بمعرّفات الوكلاء المهيئين لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي هدف مهيأ؛ الافتراضي: الوكيل نفسه فقط). ضمّن معرّف الطالب عندما يجب السماح باستدعاءات `agentId` التي تستهدف نفسها. تُرفض الإدخالات القديمة التي حُذف تكوين وكيلها بواسطة `sessions_spawn` وتُحذف من `agents_list`؛ شغّل `openclaw doctor --fix` لتنظيفها، أو أضف إدخالًا أدنى في `agents.list[]` إذا كان يجب أن يبقى ذلك الهدف قابلًا للتوليد مع وراثة الافتراضات.
- حارس وراثة صندوق العزل: إذا كانت جلسة الطالب معزولة، يرفض `sessions_spawn` الأهداف التي ستعمل بلا عزل.
- `subagents.requireAgentId`: عند true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف التعريف صراحة؛ الافتراضي: false).

---

## توجيه متعدد الوكلاء

شغّل عدة وكلاء معزولين داخل Gateway واحد. راجع [متعدد الوكلاء](/ar/concepts/multi-agent).

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

- `type` (اختياري): `route` للتوجيه العادي (النوع المفقود يفترض route)، و`acp` لروابط محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ المحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (تطابق تام، بلا peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات ربط route أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="وصول كامل (بلا صندوق عزل)">

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

<Accordion title="أدوات للقراءة فقط + مساحة العمل">

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

راجع [صندوق عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة تفاصيل الأسبقية.

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

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات محادثات المجموعات.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق قناة.
  - `global`: يشارك جميع المشاركين في سياق قناة جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: طريقة تجميع الرسائل المباشرة.
  - `main`: تشترك كل الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: يربط المعرّفات القياسية بنظراء مسبوقين بالمزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر الإرساء مثل `/dock_discord` الخريطة نفسها لتبديل مسار رد الجلسة النشطة إلى نظير قناة مرتبط آخر؛ راجع [إرساء القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة الضبط الأساسية. يعيد `daily` الضبط عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` الضبط بعد `idleMinutes`. عند تكوينهما معًا، يفوز ما تنتهي صلاحيته أولًا. تستخدم حداثة إعادة الضبط اليومية قيمة `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة الضبط بسبب الخمول `lastInteractionAt`. يمكن لكتابات الخلفية/أحداث النظام مثل Heartbeat، وإيقاظات Cron، وإشعارات التنفيذ، ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تُبقي الجلسات اليومية/الخاملة حديثة.
- **`resetByType`**: تجاوزات حسب النوع (`direct`، و`group`، و`thread`). يُقبل `dm` القديم كاسم مستعار لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية المحادثة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`-`20`، الافتراضي: `5`). تعطل القيمة `0` تسلسل الرد المتبادل.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم المستعار القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. أول رفض يفوز.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات والاحتفاظ بها.
  - `mode`: يطبّق `enforce` التنظيف وهو الافتراضي؛ بينما يصدر `warn` تحذيرات فقط.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: العدد الأقصى للإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفًا دفعيًا مع هامش ماء عالٍ صغير للحدود ذات حجم الإنتاج؛ ويطبّق `openclaw sessions cleanup --enforce` الحد فورًا.
  - تستخدم جلسات فحص تشغيل نموذج Gateway قصيرة العمر مدة احتفاظ ثابتة قدرها `24h`، لكن التنظيف محكوم بالضغط: لا يزيل إلا صفوف فحص تشغيل النموذج الصارمة القديمة عند بلوغ ضغط صيانة/حد إدخالات الجلسات. وحدها مفاتيح الفحص الصريح الصارمة المطابقة لـ `agent:*:explicit:model-run-<uuid>` مؤهلة؛ ولا ترث جلسات المباشر، والمجموعة، والسلسلة، وCron، والخطاف، وHeartbeat، وACP، والوكلاء الفرعيين العادية مدة الاحتفاظ هذه البالغة 24 ساعة. عند تشغيل تنظيف تشغيل النموذج، يعمل قبل تنظيف الإدخالات القديمة الأوسع `pruneAfter` وحد `maxEntries`.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من التكوينات الأقدم.
  - `resetArchiveRetention`: الاحتفاظ بأرشيفات نصوص المحادثات `*.reset.<timestamp>`. يكون افتراضيًا إلى `pruneAfter`؛ اضبطه على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجّل تحذيرات؛ وفي وضع `enforce` يزيل أقدم القطع الأثرية/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. يكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين التجاوز؛ يستخدم Discord `channels.discord.threadBindings.enabled`)
  - `idleHours`: الإلغاء التلقائي للتركيز بسبب الخمول افتراضيًا بالساعات (`0` يعطل؛ ويمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم للعمر افتراضيًا بالساعات (`0` يعطل؛ ويمكن للمزوّدين التجاوز)
  - `spawnSessions`: بوابة افتراضية لإنشاء جلسات عمل مرتبطة بالسلاسل من `sessions_spawn` وعمليات إنشاء سلاسل ACP. تكون افتراضيًا `true` عند تمكين روابط السلاسل؛ ويمكن للمزوّدين/الحسابات التجاوز.
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

### بادئة الرد

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix`، و`channels.<channel>.accounts.<id>.responsePrefix`.

الحل (الأكثر تحديدًا يفوز): الحساب ← القناة ← العام. يعطّل `""` الإعداد ويوقف التسلسل. يشتق `"auto"` القيمة `[{identity.name}]`.

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

- يكون افتراضيًا إلى `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبطه على `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction`، و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب ← القناة ← `messages.ackReaction` ← بديل الهوية.
- النطاق: `group-mentions` (الافتراضي)، و`group-all`، و`direct`، و`all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد في القنوات القادرة على التفاعلات مثل Slack، وDiscord، وSignal، وTelegram، وWhatsApp، وiMessage.
- `messages.statusReactions.enabled`: يفعّل تفاعلات حالة دورة الحياة على Slack، وDiscord، وSignal، وTelegram، وWhatsApp.
  في Slack وDiscord، يؤدي عدم الضبط إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  في Signal وTelegram وWhatsApp، اضبطه صراحة على `true` لتمكين تفاعلات حالة دورة الحياة.
- `messages.statusReactions.emojis`: يتجاوز مفاتيح رموز دورة الحياة التعبيرية:
  `queued`، و`thinking`، و`compacting`، و`tool`، و`coding`، و`web`، و`deploy`، و`build`،
  و`concierge`، و`done`، و`error`، و`stallSoft`، و`stallHard`.
  لا يسمح Telegram إلا بمجموعة تفاعلات ثابتة، لذلك تعود الرموز التعبيرية المكوّنة غير المدعومة
  إلى أقرب متغير حالة مدعوم لتلك المحادثة.

### مهلة تجميع الوارد

تجمع الرسائل النصية السريعة فقط من المرسل نفسه في دور وكيل واحد. تُمرَّر الوسائط/المرفقات فورًا. تتجاوز أوامر التحكم التجميع.

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

- يتحكم `auto` في وضع تحويل النص إلى كلام التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. يمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` القيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- يكون `modelOverrides` مفعلا افتراضيا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك اختياري).
- تعود مفاتيح API احتياطيا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- مزودو الكلام المضمنون مملوكون للـ plugin. إذا تم تعيين `plugins.allow`، فأدرج كل TTS provider plugin تريد استخدامه، مثل `microsoft` لـ Edge TTS. يتم قبول معرف المزود القديم `edge` كاسم مستعار لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير تابعة لـ OpenAI، يتعامل OpenClaw معها كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

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

- يجب أن يطابق `talk.provider` مفتاحا في `talk.providers` عند تكوين عدة مزودين لوضع التحدث.
- مفاتيح التحدث المسطحة القديمة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط. شغل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى `talk.providers.<provider>`.
- تعود معرفات الأصوات احتياطيا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية عادية أو كائنات SecretRef.
- ينطبق الرجوع الاحتياطي إلى `ELEVENLABS_API_KEY` فقط عند عدم تكوين مفتاح API للتحدث.
- يسمح `providers.*.voiceAliases` لتوجيهات التحدث باستخدام أسماء مألوفة.
- يحدد `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا تم حذفه، يستخدم macOS `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر المساعد المضمن `openclaw-mlx-tts` عند وجوده، أو عبر ملف تنفيذي في `PATH`؛ ويتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد لأغراض التطوير.
- يتحكم `consultThinkingLevel` في مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات Control UI Talk الفورية `openclaw_agent_consult`. اتركه غير مضبوط للحفاظ على سلوك الجلسة/النموذج العادي.
- يضبط `consultFastMode` تجاوزا لمرة واحدة لوضع السرعة لاستشارات Control UI Talk الفورية دون تغيير إعداد وضع السرعة العادي للجلسة.
- يضبط `speechLocale` معرف اللغة BCP 47 المستخدم بواسطة تعرف الكلام في وضع التحدث على iOS/macOS. اتركه غير مضبوط لاستخدام الافتراضي في الجهاز.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع التحدث بعد صمت المستخدم قبل إرسال النص المنسوخ. الإبقاء عليه غير مضبوط يحافظ على نافذة التوقف المؤقت الافتراضية للمنصة (`700 ms on macOS and Android, 900 ms on iOS`).
- يضيف `realtime.instructions` تعليمات نظام موجهة للمزود إلى موجه OpenClaw الفوري المضمن، بحيث يمكن تكوين نمط الصوت دون فقدان إرشادات `openclaw_agent_consult` الافتراضية.
- يتحكم `realtime.consultRouting` في الرجوع الاحتياطي لترحيل Gateway عندما ينتج مزود الوقت الفعلي نصا نهائيا للمستخدم دون `openclaw_agent_consult`: يحافظ `provider-direct` على ردود المزود المباشرة، بينما يوجه `force-agent-consult` الطلب النهائي عبر OpenClaw.

---

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — جميع مفاتيح الإعدادات الأخرى
- [الإعدادات](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
