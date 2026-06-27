---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - ضبط التوجيه والارتباطات متعددة الوكلاء
    - ضبط سلوك الجلسة وتسليم الرسائل ووضع التحدث
summary: إعدادات الوكيل الافتراضية، وتوجيه الوكلاء المتعددين، والجلسة، والرسائل، وإعدادات المحادثة
title: التهيئة — الوكلاء
x-i18n:
    generated_at: "2026-06-27T17:35:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح تكوين محددة النطاق للوكيل ضمن `agents.*` و`multiAgent.*` و`session.*` و
`messages.*` و`talk.*`. للقنوات والأدوات ووقت تشغيل Gateway والمفاتيح الأخرى
على المستوى الأعلى، راجع [مرجع التكوين](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكلاء

### `agents.defaults.workspace`

القيمة الافتراضية: `OPENCLAW_WORKSPACE_DIR` عند ضبطه، وإلا `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

تأخذ قيمة `agents.defaults.workspace` الصريحة الأسبقية على
`OPENCLAW_WORKSPACE_DIR`. استخدم متغير البيئة لتوجيه الوكلاء الافتراضيين
إلى مساحة عمل مركبة عندما لا تريد كتابة ذلك المسار في التكوين.

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime في موجّه النظام. إذا لم يُضبط، يكتشفه OpenClaw تلقائيا عبر الصعود من مساحة العمل.

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

- احذف `agents.defaults.skills` للسماح غير المقيد بـ Skills افتراضيا.
- احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
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

يتحكم في وقت حقن ملفات تمهيد مساحة العمل في موجّه النظام. القيمة الافتراضية: `"always"`.

- `"continuation-skip"`: تتخطى منعطفات الاستمرار الآمنة (بعد رد مساعد مكتمل) إعادة حقن تمهيد مساحة العمل، مما يقلل حجم الموجّه. لا تزال تشغيلات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: يعطل تمهيد مساحة العمل وحقن ملفات السياق في كل منعطف. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة موجّههم بالكامل (محركات سياق مخصصة، أو أوقات تشغيل أصلية تبني سياقها الخاص، أو سير عمل متخصص بلا تمهيد). تتخطى منعطفات Heartbeat واسترداد Compaction الحقن أيضا.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

تجاوز لكل وكيل: `agents.list[].contextInjection`. القيم المحذوفة ترث
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى للأحرف لكل ملف تمهيد مساحة عمل قبل الاقتطاع. القيمة الافتراضية: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

تجاوز لكل وكيل: `agents.list[].bootstrapMaxChars`. القيم المحذوفة ترث
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

إجمالي الحد الأقصى للأحرف المحقونة عبر جميع ملفات تمهيد مساحة العمل. القيمة الافتراضية: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

تجاوز لكل وكيل: `agents.list[].bootstrapTotalMaxChars`. القيم المحذوفة
ترث `agents.defaults.bootstrapTotalMaxChars`.

### تجاوزات ملف تعريف التمهيد لكل وكيل

استخدم تجاوزات ملف تعريف التمهيد لكل وكيل عندما يحتاج وكيل واحد إلى سلوك
حقن موجّه مختلف عن الإعدادات الافتراضية المشتركة. الحقول المحذوفة ترث من
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

يتحكم في إشعار موجّه النظام المرئي للوكيل عند اقتطاع سياق التمهيد.
القيمة الافتراضية: `"always"`.

- `"off"`: لا يحقن نص إشعار الاقتطاع في موجّه النظام أبدا.
- `"once"`: يحقن إشعارا موجزا مرة واحدة لكل توقيع اقتطاع فريد.
- `"always"`: يحقن إشعارا موجزا في كل تشغيل عند وجود اقتطاع (موصى به).

تبقى العدادات الخام/المحقونة التفصيلية وحقول ضبط التكوين في التشخيصات مثل
تقارير حالة/سياق والسجلات؛ ويحصل سياق مستخدم/وقت تشغيل WebChat الروتيني فقط
على إشعار الاسترداد الموجز.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات عالية الحجم للموجّه/السياق، وهي
مقسمة عمدا حسب النظام الفرعي بدلا من تدفقها كلها عبر
مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  مقدمة تشغيل نموذج لمرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة. أوامر الدردشة المجردة `/new` و`/reset` يتم
  الإقرار بها دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في موجّه النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل مملوكة لوقت التشغيل ومحقونة.
- `memory.qmd.limits.*`:
  مقتطف بحث الذاكرة المفهرس وأحجام الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في مقدمة بدء التشغيل لأول منعطف التي تُحقن عند تشغيلات نموذج إعادة الضبط/بدء التشغيل.
أوامر الدردشة المجردة `/new` و`/reset` تقر بإعادة الضبط دون استدعاء
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
  بيانات تعريف الاقتطاع وإشعار الاستمرار.
- `memoryGetDefaultLines`: نافذة أسطر `memory_get` الافتراضية عندما يكون `lines`
  محذوفا.
- `toolResultMaxChars`: سقف متقدم لنتائج الأدوات الحية يُستخدم للنتائج
  المحفوظة واسترداد الفائض. اتركه غير مضبوط لسقف سياق النموذج التلقائي:
  `16000` حرفا دون 100K رمز، و`32000` حرفا عند 100K+ رمز، و`64000`
  حرفا عند 200K+ رمز. تُقبل القيم الصريحة حتى `1000000` لنماذج
  السياق الطويل، لكن السقف الفعلي يظل محدودا بنحو 30% من نافذة
  سياق النموذج. يطبع `openclaw doctor --deep` السقف الفعلي،
  ولا يحذر doctor إلا عندما يكون التجاوز الصريح قديما أو بلا تأثير.
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

سقف عام لقائمة Skills المضغوطة المحقونة في موجّه النظام. هذا
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

تجاوز لكل وكيل لميزانية موجّه Skills.

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

أقصى حجم بالبكسل لأطول جانب في الصورة داخل كتل صور النص/الأداة قبل استدعاءات الموفر.
القيمة الافتراضية: `1200`.

القيم الأقل تقلل عادة استخدام رموز الرؤية وحجم حمولة الطلب للتشغيلات كثيرة لقطات الشاشة.
القيم الأعلى تحفظ تفاصيل بصرية أكثر.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

تفضيل ضغط/تفاصيل أداة الصور للصور المحملة من مسارات ملفات وURLs ومراجع وسائط.
القيمة الافتراضية: `auto`.

يكيّف OpenClaw سلم تغيير الحجم مع نموذج الصور المحدد. على سبيل المثال، يمكن لنماذج Claude Opus 4.8 وOpenAI GPT-5.5 وQwen VL ونماذج الرؤية المستضافة Llama 4 استخدام صور أكبر من مسارات الرؤية القديمة/الافتراضية عالية التفاصيل، بينما تُضغط المنعطفات متعددة الصور بقوة أكبر في وضع `auto` للتحكم في تكلفة الرموز وزمن الاستجابة.

القيم:

- `auto`: يكيّف مع حدود النموذج وعدد الصور.
- `efficient`: يفضل صورا أصغر لاستخدام أقل للرموز والبايتات.
- `balanced`: يستخدم سلم الوسط القياسي.
- `high`: يحفظ تفاصيل أكثر للقطات الشاشة والمخططات وصور المستندات.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجّه النظام (وليس طوابع الرسائل الزمنية). تعود إلى المنطقة الزمنية للمضيف.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في موجّه النظام. القيمة الافتراضية: `auto` (تفضيل نظام التشغيل).

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
  - يعيّن شكل الكائن النموذج الأساسي مع نماذج تجاوز الفشل المرتبة.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يستخدمه مسار أداة `image` كتكوين نموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرّفات المجردة للتوافق؛ إذا طابق معرّف مجرد بشكل فريد إدخالًا مكوّنًا قادرًا على الصور في `models.providers.*.models`، فإن OpenClaw يؤهله إلى ذلك المزوّد. تتطلب المطابقات المكوّنة الغامضة بادئة مزوّد صريحة.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد صورًا.
  - قيم نموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، و`fal/fal-ai/flux/dev` لـ fal، و`openai/gpt-image-2` لصور OpenAI، أو `openai/gpt-image-1.5` لإخراج OpenAI PNG/WebP بخلفية شفافة.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فكوّن مصادقة المزوّد المطابقة أيضًا (مثلًا `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، و`FAL_KEY` لـ `fal/*`).
  - إذا حُذف، يظل بإمكان `image_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الصور المسجلين بترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الموسيقى المشتركة والأداة المضمنة `music_generate`.
  - قيم نموذجية: `google/lyria-3-clip-preview`، أو `google/lyria-3-pro-preview`، أو `minimax/music-2.6`.
  - إذا حُذف، يظل بإمكان `music_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فكوّن مصادقة المزوّد/مفتاح API المطابق أيضًا.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الفيديو المشتركة والأداة المضمنة `video_generate`.
  - قيم نموذجية: `qwen/wan2.6-t2v`، أو `qwen/wan2.6-i2v`، أو `qwen/wan2.6-r2v`، أو `qwen/wan2.6-r2v-flash`، أو `qwen/wan2.7-r2v`.
  - إذا حُذف، يظل بإمكان `video_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الفيديو المسجلين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فكوّن مصادقة المزوّد/مفتاح API المطابق أيضًا.
  - يدعم Plugin توليد الفيديو الرسمي لـ Qwen ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد هي `size`، و`aspectRatio`، و`resolution`، و`audio`، و`watermark`.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي المحلول.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يضعها وضع الاستخراج الاحتياطي في الاعتبار في أداة `pdf`.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، و`"on"`، و`"full"`. الافتراضي: `"off"`.
- `toolProgressDetail`: وضع التفاصيل لملخصات أدوات `/verbose` وأسطر أدوات مسودة التقدم. القيم: `"explain"` (الافتراضي، تسميات بشرية موجزة) أو `"raw"` (إلحاق الأمر/التفصيل الخام عند توفره). يتجاوز `agents.list[].toolProgressDetail` لكل وكيل هذا الافتراضي.
- `reasoningDefault`: ظهور الاستدلال الافتراضي للوكلاء. القيم: `"off"`، و`"on"`، و`"stream"`. يتجاوز `agents.list[].reasoningDefault` لكل وكيل هذا الافتراضي. لا تُطبق افتراضيات الاستدلال المكوّنة إلا للمالكين، أو المرسلين المصرح لهم، أو سياقات Gateway لمسؤول المشغل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، و`"on"`، و`"ask"`، و`"full"`. الافتراضي: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.5` للوصول بمفتاح API لـ OpenAI أو Codex OAuth). إذا حذفت المزوّد، يجرّب OpenClaw اسمًا مستعارًا أولًا، ثم مطابقة مزوّد مكوّن فريدة لمعرّف النموذج الدقيق هذا، وعندها فقط يعود إلى المزوّد الافتراضي المكوّن (سلوك توافق مهمل، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المكوّن، يعود OpenClaw إلى أول مزوّد/نموذج مكوّن بدلًا من إظهار افتراضي مزوّد محذوف قديم.
- `models`: كتالوج النماذج المكوّن وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature`، و`maxTokens`، و`cacheRetention`، و`context1m`، و`responsesServerCompaction`، و`responsesCompactThreshold`، وتوجيه `provider` في OpenRouter، و`chat_template_kwargs`، و`extra_body`/`extraBody`).
  - استخدم إدخالات `provider/*` مثل `"openai/*": {}` أو `"vllm/*": {}` لإظهار كل النماذج المكتشفة للمزوّدين المحددين دون سرد كل معرّف نموذج يدويًا.
  - أضف `agentRuntime` إلى إدخال `provider/*` عندما ينبغي لكل نموذج مكتشف ديناميكيًا لذلك المزوّد أن يستخدم وقت التشغيل نفسه. تظل سياسة وقت التشغيل الدقيقة `provider/model` لها الأولوية على حرف البدل.
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي ستزيل إدخالات قائمة السماح الحالية ما لم تمرر `--replace`.
  - تدمج تدفقات التكوين/الإعداد المقيّدة بالمزوّد نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين غير المرتبطين المكوّنين مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، تُفعّل Compaction من جهة الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction من جهة خادم OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على كل النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أولوية دمج `params` (التكوين): يتجاوز `agents.defaults.models["provider/model"].params` (لكل نموذج) `agents.defaults.params` (الأساس العام)، ثم يتجاوز `agents.list[].params` (معرّف الوكيل المطابق) بحسب المفتاح. راجع [التخزين المؤقت للموجهات](/ar/reference/prompt-caching) للتفاصيل.
- `models.providers.openrouter.params.provider`: سياسة توجيه المزوّد الافتراضية على مستوى OpenRouter. يمرر OpenClaw هذا إلى كائن `provider` في طلب OpenRouter؛ وتتجاوز `agents.defaults.models["openrouter/<model>"].params.provider` لكل نموذج ومعلمات الوكيل بحسب المفتاح. راجع [توجيه مزوّد OpenRouter](/ar/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلب المولدة، يفوز الجسم الإضافي؛ ولا تزال مسارات الإكمالات غير الأصلية تزيل `store` الخاص بـ OpenAI بعد ذلك.
- `params.chat_template_kwargs`: وسيطات قالب الدردشة المتوافقة مع vLLM/OpenAI مدمجة في أجسام طلبات `api: "openai-completions"` على المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ وتتجاوز `chat_template_kwargs` الصريحة الافتراضيات المولدة، ولا يزال لـ `extra_body.chat_template_kwargs` الأولوية النهائية. تعرض نماذج التفكير Qwen وNemotron المكوّنة في vLLM خيارات `/think` ثنائية (`off`، و`on`) بدلًا من سلّم الجهد متعدد المستويات.
- `compat.thinkingFormat`: نمط حمولة التفكير المتوافق مع OpenAI. استخدم `"together"` لـ `reasoning.enabled` بنمط Together، أو `"qwen"` لـ `enable_thinking` ذي المستوى الأعلى بنمط Qwen، أو `"qwen-chat-template"` لـ `chat_template_kwargs.enable_thinking` في الخلفيات من عائلة Qwen التي تدعم وسيطات قالب الدردشة على مستوى الطلب، مثل vLLM. يربط OpenClaw التفكير المعطل بـ `false` والتفكير المفعّل بـ `true`، وتعرض نماذج Qwen المكوّنة في vLLM خيارات `/think` ثنائية لهذه التنسيقات.
- `compat.supportedReasoningEfforts`: قائمة جهد الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` لنقاط النهاية المخصصة التي تقبله فعلًا؛ عندها يعرض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيح الجلسة، والتحقق من CLI للوكيل، والتحقق من `llm-task` لذلك المزوّد/النموذج المكوّن. استخدم `compat.reasoningEffortMap` عندما تريد الخلفية قيمة خاصة بالمزوّد لمستوى قياسي.
- `params.preserveThinking`: اشتراك اختياري خاص بـ Z.AI للتفكير المحفوظ. عند تفعيله وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `localService`: مدير عمليات اختياري على مستوى المزوّد لخوادم النماذج المحلية/ذاتية الاستضافة. عندما ينتمي النموذج المحدد إلى ذلك المزوّد، يفحص OpenClaw `healthUrl` (أو `baseUrl + "/models"`)، ويبدأ `command` مع `args` إذا كانت نقطة النهاية متوقفة، وينتظر حتى `readyTimeoutMs`، ثم يرسل طلب النموذج. يجب أن يكون `command` مسارًا مطلقًا. يُبقي `idleStopMs: 0` العملية نشطة حتى خروج OpenClaw؛ وتؤدي القيمة الموجبة إلى إيقاف العملية التي أنشأها OpenClaw بعد ذلك العدد من المللي ثواني الخاملة. راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- تنتمي سياسة وقت التشغيل إلى المزوّدين أو النماذج، لا إلى `agents.defaults`. استخدم `models.providers.<provider>.agentRuntime` لقواعد على مستوى المزوّد أو `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` لقواعد خاصة بالنموذج. تختار نماذج وكلاء OpenAI على مزوّد OpenAI الرسمي Codex افتراضيًا.
- تحفظ كاتبات التكوين التي تعدّل هذه الحقول (مثل `/models set`، و`/models set-image`، وأوامر إضافة/إزالة الاحتياطيات) شكل الكائن القياسي وتحافظ على قوائم الاحتياط الحالية عندما يكون ذلك ممكنًا.
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

- `id`: `"auto"` أو `"openclaw"` أو معرف حزمة Plugin harness مسجل أو اسم مستعار مدعوم لخلفية CLI. يسجل Plugin Codex المضمن `codex`؛ ويوفر Plugin Anthropic المضمن خلفية CLI باسم `claude-cli`.
- يتيح `id: "auto"` لحزم plugin harnesses المسجلة المطالبة بالدورات المدعومة، ويستخدم OpenClaw عندما لا يطابق أي harness. يتطلب وقت تشغيل Plugin صريح مثل `id: "codex"` ذلك harness ويفشل بإغلاق آمن إذا لم يكن متاحا أو فشل.
- لا يقبل `id: "pi"` إلا كاسم مستعار مهمل لـ `openclaw` للحفاظ على الإعدادات المشحونة من v2026.5.22 وما قبلها. يجب أن تستخدم الإعدادات الجديدة `openclaw`.
- تكون أولوية وقت التشغيل أولا لسياسة النموذج الدقيقة (`agents.list[].models["provider/model"]` أو `agents.defaults.models["provider/model"]` أو `models.providers.<provider>.models[]`)، ثم `agents.list[]` / `agents.defaults.models["provider/*"]`، ثم السياسة على مستوى المزود في `models.providers.<provider>.agentRuntime`.
- مفاتيح وقت التشغيل على مستوى الوكيل بالكامل قديمة. يتم تجاهل `agents.defaults.agentRuntime` و`agents.list[].agentRuntime` وتثبيتات وقت تشغيل الجلسة و`OPENCLAW_AGENT_RUNTIME` عند اختيار وقت التشغيل. شغل `openclaw doctor --fix` لإزالة القيم القديمة.
- تستخدم نماذج وكلاء OpenAI حزمة Codex harness افتراضيا؛ يظل `agentRuntime.id: "codex"` الخاص بالمزود/النموذج صالحا عندما تريد جعل ذلك صريحا.
- لعمليات نشر Claude CLI، فضل `model: "anthropic/claude-opus-4-8"` مع `agentRuntime.id: "claude-cli"` محدد على نطاق النموذج. لا تزال مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل للتوافق، لكن يجب أن تبقي الإعدادات الجديدة اختيار المزود/النموذج بصيغته القياسية وأن تضع خلفية التنفيذ في سياسة وقت تشغيل المزود/النموذج.
- يتحكم هذا فقط في تنفيذ دور وكيل النص. لا تزال عمليات توليد الوسائط والرؤية وPDF والموسيقى والفيديو وTTS تستخدم إعدادات المزود/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار      | النموذج                         |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

الأسماء المستعارة التي تضبطها لها الأولوية دائما على الافتراضيات.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيا ما لم تضبط `--thinking off` أو تعرف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI خيار `tool_stream` افتراضيا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
يبقي Anthropic Claude Opus 4.8 التفكير متوقفا افتراضيا في OpenClaw؛ وعندما يتم تفعيل التفكير التكيفي صراحة، يكون افتراضي الجهد المملوك لمزود Anthropic هو `high`. تكون نماذج Claude 4.6 افتراضيا على `adaptive` عند عدم تعيين مستوى تفكير صريح.

### `agents.defaults.cliBackends`

خلفيات CLI اختيارية للتشغيلات الاحتياطية النصية فقط (بلا استدعاءات أدوات). مفيدة كنسخة احتياطية عندما يفشل مزودو API.

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

- خلفيات CLI نصية أولا؛ الأدوات معطلة دائما.
- الجلسات مدعومة عند تعيين `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.
- يتيح `reseedFromRawTranscriptWhenUncompacted: true` لخلفية ما استرداد الجلسات الآمنة
  التي تم إبطالها من ذيل نص OpenClaw خام محدود قبل وجود أول
  ملخص Compaction. لا تزال تغييرات ملف تعريف المصادقة أو حقبة بيانات الاعتماد
  لا تعيد البذر من الخام أبدا.

### `agents.defaults.promptOverlays`

طبقات موجه مستقلة عن المزود تطبق حسب عائلة النموذج على أسطح الموجه التي يجمعها OpenClaw. تتلقى معرفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر مسارات OpenClaw/المزود؛ يتحكم `personality` فقط في طبقة نمط التفاعل الودود. تحتفظ مسارات خادم تطبيق Codex الأصلية بتعليمات الأساس/النموذج المملوكة لـ Codex بدلا من طبقة OpenClaw GPT-5 هذه، ويعطل OpenClaw الشخصية المضمنة في Codex للخيوط الأصلية.

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

- تفعّل `"friendly"` (افتراضيا) و`"on"` طبقة نمط التفاعل الودود.
- تعطل `"off"` الطبقة الودودة فقط؛ ويبقى عقد سلوك GPT-5 الموسوم مفعلا.
- لا يزال `plugins.entries.openai.config.personality` القديم يقرأ عندما لا يكون هذا الإعداد المشترك معينا.

### `agents.defaults.heartbeat`

تشغيلات Heartbeat الدورية.

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
- `includeSystemPromptSection`: عند false، يحذف قسم Heartbeat من موجه النظام ويتجاوز حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند true، يخفي حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل Heartbeat قبل إحباطه. اتركه غير معين لاستخدام `agents.defaults.timeoutSeconds` عند تعيينه، وإلا فسيتم استخدام وتيرة Heartbeat بحد أقصى 600 ثانية.
- `directPolicy`: سياسة التسليم المباشر/DM. يسمح `allow` (افتراضيا) بالتسليم إلى الهدف المباشر. يحجب `block` التسليم إلى الهدف المباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند true، تعمل كل Heartbeat في جلسة جديدة من دون سجل محادثة سابق. نمط العزل نفسه مثل cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- `skipWhenBusy`: عند true، تؤجل تشغيلات Heartbeat عند انشغال المسارات الإضافية لذلك الوكيل: وكيله الفرعي الخاص بمفتاح الجلسة أو عمل الأوامر المتداخلة. تؤجل مسارات Cron دائما Heartbeats، حتى من دون هذا العلم.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرف أي وكيل `heartbeat`، تعمل Heartbeats **لهؤلاء الوكلاء فقط**.
- تشغل Heartbeats أدوار وكيل كاملة — الفواصل الأقصر تستهلك رموزا أكثر.

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

- `mode`:‏ `default` أو `safeguard` (تلخيص مقطّع للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزوّد Compaction مسجّل. عند ضبطه، تُستدعى `summarize()` الخاصة بالمزوّد بدلاً من تلخيص LLM المضمّن. يعود إلى المضمّن عند الفشل. ضبط مزوّد يفرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى للثواني المسموح بها لعملية Compaction واحدة قبل أن يلغيها OpenClaw. الافتراضي: `180`.
- `keepRecentTokens`: ميزانية نقطة القطع للوكيل للإبقاء على أحدث ذيل من النص المنسوخ حرفيًا. يحترم `/compact` اليدوي هذا عند ضبطه صراحةً؛ وإلا تكون Compaction اليدوية نقطة تحقق صارمة.
- `identifierPolicy`:‏ `strict` (الافتراضي)، أو `off`، أو `custom`. يضيف `strict` إرشادات الاحتفاظ بالمُعرّفات المعتمة المضمّنة مسبقًا أثناء تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصّص للحفاظ على المعرّفات يُستخدم عند `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند الخرج غير سليم البنية لملخصات الحماية. مفعّل افتراضيًا في وضع الحماية؛ اضبط `enabled: false` لتجاوز التدقيق.
- `midTurnPrecheck`: فحص اختياري لضغط حلقة الأدوات. عند `enabled: true`، يفحص OpenClaw ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسبًا، يلغي المحاولة الحالية قبل إرسال الموجّه ويعيد استخدام مسار الاسترداد الحالي للفحص المسبق لاقتطاع نتائج الأدوات أو تنفيذ Compaction ثم إعادة المحاولة. يعمل مع وضعي Compaction،‏ `default` و`safeguard`. الافتراضي: معطّل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من AGENTS.md لإعادة حقنها بعد Compaction. تكون إعادة الحقن معطّلة عند عدم الضبط أو عند ضبطها إلى `[]`. ضبط `["Session Startup", "Red Lines"]` صراحةً يفعّل هذا الزوج ويحافظ على المسار الاحتياطي القديم `Every Session`/`Safety`. فعّل هذا فقط عندما يكون السياق الإضافي جديرًا بمخاطرة تكرار إرشادات المشروع الملتقطة مسبقًا في ملخص Compaction.
- `model`: قيمة اختيارية `provider/model-id` أو اسم مستعار عارٍ من `agents.defaults.models` لتلخيص Compaction فقط. تُحل الأسماء المستعارة العارية قبل الإرسال؛ وتحتفظ معرّفات النماذج الحرفية المضبوطة بالأولوية عند التصادم. استخدم هذا عندما ينبغي للجلسة الرئيسية أن تحتفظ بنموذج واحد لكن ينبغي تشغيل ملخصات Compaction على نموذج آخر؛ وعند عدم الضبط، تستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: عتبة اختيارية بالبايت (`number` أو سلاسل مثل `"20mb"`) تؤدي إلى Compaction محلية عادية قبل التشغيل عندما يتجاوز JSONL النشط العتبة. تتطلب `truncateAfterCompaction` حتى تتمكن Compaction الناجحة من التدوير إلى نص منسوخ لاحق أصغر. معطّلة عند عدم الضبط أو `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتمالها (مثلًا، "جارٍ ضغط السياق..." و"اكتمل Compaction"). معطّل افتراضيًا لإبقاء Compaction صامتة.
- `memoryFlush`: دورة وكيلية صامتة قبل Compaction التلقائية لتخزين ذكريات دائمة. اضبط `model` إلى مزوّد/نموذج محدد مثل `ollama/qwen3:8b` عندما ينبغي أن تبقى دورة الصيانة هذه على نموذج محلي؛ لا يرث التجاوز سلسلة الرجوع الاحتياطية للجلسة النشطة. تُتجاوز عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.runRetries`

حدود تكرار إعادة محاولة حلقة التشغيل الخارجية لوقت تشغيل الوكيل المضمّن لمنع حلقات التنفيذ اللانهائية أثناء الاسترداد من الفشل. لاحظ أن هذا الإعداد ينطبق حاليًا فقط على وقت تشغيل الوكيل المضمّن، وليس على أوقات تشغيل ACP أو CLI.

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
        runRetries: { max: 50 }, // تجاوزات اختيارية لكل وكيل
      },
    ],
  },
}
```

- `base`: العدد الأساسي لتكرارات إعادة محاولة التشغيل لحلقة التشغيل الخارجية. الافتراضي: `24`.
- `perProfile`: تكرارات إضافية لإعادة محاولة التشغيل تُمنح لكل مرشح ملف تعريف احتياطي. الافتراضي: `8`.
- `min`: الحد الأدنى المطلق لتكرارات إعادة محاولة التشغيل. الافتراضي: `32`.
- `max`: الحد الأقصى المطلق لتكرارات إعادة محاولة التشغيل لمنع التنفيذ الجامح. الافتراضي: `160`.

### `agents.defaults.contextPruning`

يشذّب **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل الإرسال إلى LLM. لا يعدّل سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // مدة (ms/s/m/h)، الوحدة الافتراضية: دقائق
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[تم مسح محتوى نتيجة أداة قديمة]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="سلوك وضع cache-ttl">

- يفعّل `mode: "cache-ttl"` تمريرات التشذيب.
- يتحكم `ttl` في مدى تكرار إمكان تشغيل التشذيب مرة أخرى (بعد آخر لمس للذاكرة المؤقتة).
- يقلّص التشذيب نتائج الأدوات كبيرة الحجم أولًا، ثم يمسح بقوة نتائج الأدوات الأقدم عند الحاجة.
- يقبل `softTrimRatio` و`hardClearRatio` قيمًا من `0.0` حتى `1.0`؛ وترفض عملية تحقق الإعداد القيم خارج ذلك النطاق.

**التقليص اللين** يُبقي البداية + النهاية ويدرج `...` في الوسط.

**المسح الصارم** يستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا تُقلّص/تُمسح كتل الصور مطلقًا.
- النسب قائمة على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا وُجدت رسائل مساعد أقل من `keepLastAssistants`، يُتجاوز التشذيب.

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
      humanDelay: { mode: "natural" }, // off | natural | custom (استخدم minMs/maxMs)
    },
  },
}
```

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحةً لتفعيل ردود الكتل.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` (والصيغ لكل حساب). يكون الافتراضي في Signal/Slack/Discord/Google Chat هو `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين ردود الكتل. `natural` =‏ 800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [البث](/ar/concepts/streaming) لتفاصيل السلوك + التقسيم.

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

- الافتراضات: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات غير المشار إليها.
- تجاوزات لكل جلسة: `session.typingMode`، `session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

عزل اختياري للوكيل المضمّن. راجع [العزل](/ar/gateway/sandboxing) للاطلاع على الدليل الكامل.

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
          // SecretRefs / المحتويات المضمّنة مدعومة أيضًا:
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

<Accordion title="تفاصيل العزل">

**الخلفية:**

- `docker`: وقت تشغيل Docker المحلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم بـ SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد خلفية SSH:**

- `target`: هدف SSH بالصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمّنة أو SecretRefs يحوّلها OpenClaw إلى ملفات مؤقتة في وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: عناصر تحكم سياسة مفتاح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` يتفوق على `identityFile`
- `certificateData` يتفوق على `certificateFile`
- `knownHostsData` يتفوق على `knownHostsFile`
- تُحل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة العزل

**سلوك خلفية SSH:**

- تزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تُبقي مساحة عمل SSH البعيدة هي المرجعية
- تمرّر `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيًا
- لا تدعم حاويات متصفح العزل

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل عزل لكل نطاق ضمن `~/.openclaw/sandboxes`
- `ro`: مساحة عمل العزل عند `/workspace`، ومساحة عمل الوكيل مركّبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركّبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (بلا عزل عبر الجلسات)

**إعداد Plugin الخاص بـ OpenShell:**

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

- `mirror`: تهيئة البعيد من المحلي قبل التنفيذ، والمزامنة عائدًا بعد التنفيذ؛ تبقى مساحة العمل المحلية هي المرجعية
- `remote`: تهيئة البعيد مرة واحدة عند إنشاء صندوق العزل، ثم إبقاء مساحة العمل البعيدة هي المرجعية

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw إلى صندوق العزل تلقائيًا بعد خطوة التهيئة.
النقل يتم عبر SSH إلى صندوق عزل OpenShell، لكن الـ Plugin يملك دورة حياة صندوق العزل والمزامنة المرآتية الاختيارية.

يعمل **`setupCommand`** مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج شبكة، وجذر قابل للكتابة، ومستخدم root.

**تستخدم الحاويات افتراضيًا `network: "none"`** — عيّنها إلى `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يتم حظر `"host"`. ويتم حظر `"container:<id>"` افتراضيًا ما لم تعيّن صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (كإجراء طارئ).
تستخدم دورات خادم تطبيق Codex داخل صندوق عزل OpenClaw نشط إعداد الخروج نفسه هذا لوصول الشبكة الأصلي في وضع الكود.

يتم تجهيز **المرفقات الواردة** داخل `media/inbound/*` في مساحة العمل النشطة.

يركّب **`docker.binds`** دلائل مضيف إضافية؛ ويتم دمج عمليات الربط العامة والخاصة بكل وكيل.

**المتصفح المعزول** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. يتم إدخال عنوان URL لـ noVNC في موجه النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول مراقب noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL برمز قصير العمر (بدل كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (الافتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). عيّنها إلى `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند حافة الحاوية إلى نطاق CIDR (مثلًا `172.21.0.1/32`).
- يركّب `sandbox.browser.binds` دلائل مضيف إضافية في حاوية متصفح صندوق العزل فقط. عند تعيينه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- يتم تعريف افتراضيات التشغيل في `scripts/sandbox-browser-entrypoint.sh` وضبطها لمضيفي الحاويات:
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
  - تكون `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعّلة افتراضيًا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ عيّن `0` لاستخدام حد العمليات
    الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - الافتراضات هي خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة بنقطة دخول مخصصة
    لتغيير افتراضيات الحاوية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` متاحان عبر Docker فقط.

بناء الصور (من نسخة مصدرية):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

لتثبيتات npm بدون نسخة مصدرية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح الوكيل مزود TTS أو صوتًا أو نموذجًا أو
نمطًا أو وضع TTS تلقائي خاصًا به. يدمج قالب الوكيل دمجًا عميقًا فوق
`messages.tts`، لذا يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما تتجاوز
الوكلاء الفرديون فقط حقول الصوت أو المزود التي يحتاجونها. ينطبق تجاوز الوكيل النشط
على الردود المنطوقة التلقائية و`/tts audio` و`/tts status` وأداة الوكيل
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
- `default`: عند تعيين عدة وكلاء، يفوز الأول (مع تسجيل تحذير). إذا لم يتم تعيين أي منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: الصيغة النصية تعيّن نموذجًا أساسيًا صارمًا لكل وكيل بدون احتياط نموذج؛ وصيغة الكائن `{ primary }` صارمة أيضًا ما لم تضف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في الاحتياط، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. وظائف Cron التي تتجاوز `primary` فقط تظل ترث الاحتياطات الافتراضية ما لم تعيّن `fallbacks: []`.
- `params`: معاملات تدفق لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` بدون تكرار كتالوج النماذج بالكامل.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. يدمج القالب دمجًا عميقًا فوق `messages.tts`، لذا أبقِ بيانات اعتماد المزود المشتركة وسياسة الاحتياط في `messages.tts` وعيّن هنا فقط القيم الخاصة بالشخصية مثل المزود أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ وتستبدل القائمة الصريحة الافتراضيات بدل دمجها، و`[]` تعني عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يتم تعيين تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزود/النموذج المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، يحافظ `adaptive` على التفكير الديناميكي المملوك للمزود (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: رؤية الاستدلال الافتراضية الاختيارية لكل وكيل (`on | off | stream`). يتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عندما لا يتم تعيين تجاوز استدلال لكل رسالة أو جلسة.
- `fastModeDefault`: الافتراضي الاختياري لكل وكيل للوضع السريع (`"auto" | true | false`). ينطبق عندما لا يتم تعيين تجاوز للوضع السريع لكل رسالة أو جلسة.
- `models`: كتالوج نماذج/تجاوزات وقت تشغيل اختيارية لكل وكيل مفهرسة بمعرّفات `provider/model` الكاملة. استخدم `models["provider/model"].agentRuntime` لاستثناءات وقت التشغيل لكل وكيل.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent` و`backend` و`mode` و`cwd`) عندما ينبغي أن يستخدم الوكيل جلسات حاضنة ACP افتراضيًا.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو URI من نوع `data:`.
- ملفات صور `identity.avatar` المحلية النسبية إلى مساحة العمل محدودة بـ 2 MB. لا يتم فحص عناوين URL من نوع `http(s)` وURI من نوع `data:` بحد حجم الملف المحلي.
- تستمد `identity` الافتراضات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء المكوّنة لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي هدف مكوّن؛ الافتراضي: الوكيل نفسه فقط). أدرج معرّف الطالب عندما يجب السماح باستدعاءات `agentId` المستهدفة لنفسها. يتم رفض الإدخالات القديمة التي حُذف إعداد وكيلها بواسطة `sessions_spawn` وحذفها من `agents_list`؛ شغّل `openclaw doctor --fix` لتنظيفها، أو أضف إدخال `agents.list[]` أدنى إذا كان ينبغي أن يبقى ذلك الهدف قابلًا للتفريخ مع وراثة الافتراضات.
- حارس وراثة صندوق العزل: إذا كانت جلسة الطالب معزولة، يرفض `sessions_spawn` الأهداف التي ستعمل بدون عزل.
- `subagents.requireAgentId`: عند true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

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

- `type` (اختياري): `route` للتوجيه العادي (النوع المفقود يكون افتراضيًا route)، و`acp` لروابط محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ المحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب مطابقة حتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة دقيقة، بدون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات ربط المسار أعلاه.

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

<Accordion title="لا وصول إلى نظام الملفات (المراسلة فقط)">

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

راجع [أدوات وصندوق عزل الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) للاطلاع على تفاصيل الأسبقية.

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
  - `global`: يشارك جميع المشاركين في سياق قناة جلسة واحدة (استخدمه فقط عند قصد مشاركة السياق).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك كل الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرّفات القانونية بالأقران ذوي بادئة المزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر الإرساء مثل `/dock_discord` الخريطة نفسها لتحويل مسار رد الجلسة النشطة إلى نظير قناة مرتبط آخر؛ راجع [إرساء القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة الضبط الأساسية. يعيد `daily` الضبط عند الوقت المحلي `atHour`؛ ويعيد `idle` الضبط بعد `idleMinutes`. عند تكوين كليهما، يفوز ما تنتهي مدته أولًا. تستخدم حداثة إعادة الضبط اليومية `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة الضبط عند الخمول `lastInteractionAt`. يمكن لكتابات الخلفية/أحداث النظام مثل Heartbeat وتنبيهات Cron وإشعارات التنفيذ ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تُبقي جلسات daily/idle حديثة.
- **`resetByType`**: تجاوزات حسب النوع (`direct`، `group`، `thread`). يُقبل `dm` القديم كاسم مستعار لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية المحادثات المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لدورات الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`-`20`، الافتراضي: `5`). يعطّل `0` تسلسل الردود المتبادلة.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم المستعار القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. أول منع يفوز.
- **`maintenance`**: عناصر تحكم تنظيف مخزن الجلسات والاحتفاظ.
  - `mode`: يطبّق `enforce` التنظيف وهو الافتراضي؛ ولا يصدر `warn` إلا تحذيرات.
  - `pruneAfter`: حد العمر للمدخلات الراكدة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد المدخلات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفًا دفعيًا مع مخزن صغير للحد الأعلى للحدود المناسبة للإنتاج؛ ويطبّق `openclaw sessions cleanup --enforce` الحد فورًا.
  - تستخدم جلسات فحص تشغيل نموذج Gateway قصيرة العمر احتفاظًا ثابتًا قدره `24h`، لكن التنظيف مشروط بالضغط: لا يزيل إلا صفوف فحص تشغيل النموذج الصارمة الراكدة عند بلوغ ضغط صيانة/حد مدخلات الجلسة. لا تكون مؤهلة إلا مفاتيح الفحص الصريحة الصارمة المطابقة لـ `agent:*:explicit:model-run-<uuid>`؛ ولا ترث جلسات direct وgroup وthread وCron وhook وHeartbeat وACP والوكلاء الفرعيين العادية هذا الاحتفاظ لمدة 24 ساعة. عندما يعمل تنظيف تشغيل النموذج، يعمل قبل تنظيف المدخلات الراكدة الأوسع `pruneAfter` وحد `maxEntries`.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من التكوينات القديمة.
  - `resetArchiveRetention`: الاحتفاظ بأرشيفات نصوص المحادثات `*.reset.<timestamp>`. يكون افتراضيًا مساويًا لـ `pruneAfter`؛ اضبطه على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم الآثار/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. يكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين تجاوزه؛ يستخدم Discord `channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بعد الخمول بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `spawnSessions`: بوابة افتراضية لإنشاء جلسات عمل مرتبطة بالسلاسل من `sessions_spawn` وعمليات إنشاء سلاسل ACP. تكون افتراضيًا `true` عند تفعيل ربط السلاسل؛ ويمكن للمزوّدين/الحسابات التجاوز.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي للإنشاءات المرتبطة بالسلاسل (`"fork"` أو `"isolated"`). يكون افتراضيًا `"fork"`.

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

تجاوزات حسب القناة/الحساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

الحل (الأكثر تحديدًا يفوز): الحساب → القناة → العام. يعطّل `""` السلوك ويوقف التسلسل. يشتق `"auto"` من `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف            | المثال                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر       | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد          | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`, `low`, `off`        |
| `{identity.name}` | اسم هوية الوكيل    | (مثل `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. `{think}` اسم مستعار لـ `{thinkingLevel}`.

### تفاعل الإقرار

- يكون افتراضيًا `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبطه على `""` للتعطيل.
- تجاوزات حسب القناة: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → الرجوع إلى الهوية.
- النطاق: `group-mentions` (الافتراضي)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد في القنوات القادرة على التفاعلات مثل Slack وDiscord وTelegram وWhatsApp وiMessage.
- `messages.statusReactions.enabled`: يفعّل تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram وWhatsApp.
  في Slack وDiscord، يترك عدم الضبط تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  في Telegram وWhatsApp، اضبطه صراحةً على `true` لتفعيل تفاعلات حالة دورة الحياة.
- `messages.statusReactions.emojis`: يتجاوز مفاتيح رموز دورة الحياة:
  `queued` و`thinking` و`compacting` و`tool` و`coding` و`web` و`deploy` و`build`،
  و`concierge` و`done` و`error` و`stallSoft` و`stallHard`.
  لا يسمح Telegram إلا بمجموعة تفاعلات ثابتة، لذلك تعود الرموز التعبيرية المكوّنة غير المدعومة
  إلى أقرب متغير حالة مدعوم لتلك المحادثة.

### تأخير الوارد

يجمع الرسائل النصية السريعة فقط من المرسل نفسه في دورة وكيل واحدة. تُرسل الوسائط/المرفقات فورًا. تتجاوز أوامر التحكم التأخير.

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. يمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (تفعيل اختياري).
- تتراجع مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- موفرو الكلام المضمّنون مملوكون من Plugin. إذا تم ضبط `plugins.allow`، فأدرج كل Plugin لموفر TTS تريد استخدامه، مثلًا `microsoft` لـ Edge TTS. يتم قبول معرّف الموفر القديم `edge` كاسم بديل لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير OpenAI، يعامله OpenClaw كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## التحدث

الإعدادات الافتراضية لوضع Talk (macOS/iOS/Android).

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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تكوين عدة موفري Talk.
- مفاتيح Talk القديمة المسطحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى `talk.providers.<provider>`.
- تتراجع معرّفات الصوت إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نص عادي أو كائنات SecretRef.
- ينطبق تراجع `ELEVENLABS_API_KEY` فقط عندما لا يكون أي مفتاح API لـ Talk مكوّنًا.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء سهلة.
- يحدد `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا حُذف، يستخدم macOS القيمة `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر مساعد `openclaw-mlx-tts` المضمّن عند وجوده، أو عبر ملف تنفيذي في `PATH`؛ ويتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد لأغراض التطوير.
- يتحكم `consultThinkingLevel` في مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات Control UI Talk الفورية `openclaw_agent_consult`. اتركه غير مضبوط للحفاظ على سلوك الجلسة/النموذج المعتاد.
- يضبط `consultFastMode` تجاوزًا لمرة واحدة لوضع السرعة لاستشارات Control UI Talk الفورية من دون تغيير إعداد وضع السرعة المعتاد للجلسة.
- يضبط `speechLocale` معرّف اللغة BCP 47 المستخدم بواسطة تعرّف الكلام في Talk على iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع Talk بعد صمت المستخدم قبل إرسال النص المنسوخ. إبقاؤه غير مضبوط يحافظ على نافذة التوقف الافتراضية للمنصة (`700 ms on macOS and Android, 900 ms on iOS`).
- يضيف `realtime.instructions` تعليمات نظام مواجهة للموفر إلى الموجه الفوري المدمج في OpenClaw، بحيث يمكن تكوين نمط الصوت من دون فقدان إرشادات `openclaw_agent_consult` الافتراضية.
- يتحكم `realtime.consultRouting` في تراجع ترحيل Gateway عندما ينتج موفر الوقت الفعلي نص مستخدم نهائيًا من دون `openclaw_agent_consult`: يحافظ `provider-direct` على ردود الموفر المباشرة، بينما يوجّه `force-agent-consult` الطلب النهائي عبر OpenClaw.

---

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — جميع مفاتيح الإعدادات الأخرى
- [الإعدادات](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
