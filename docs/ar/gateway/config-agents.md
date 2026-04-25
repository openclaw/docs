---
read_when:
    - ضبط إعدادات الوكيل الافتراضية (النماذج، والتفكير، ومساحة العمل، وHeartbeat، والوسائط، وSkills)
    - ضبط التوجيه والارتباطات بين عدة وكلاء
    - ضبط سلوك الجلسة وتسليم الرسائل ووضع talk
summary: إعدادات الوكيل الافتراضية، والتوجيه بين عدة وكلاء، والجلسة، والرسائل، وإعدادات talk
title: الإعدادات — الوكلاء
x-i18n:
    generated_at: "2026-04-25T18:19:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb090bad584cab0d22bc4788652f0fd6d7f2931be1fe40d3907f8ef2123a433b
    source_path: gateway/config-agents.md
    workflow: 15
---

مفاتيح الإعدادات ضمن نطاق الوكيل تحت `agents.*` و`multiAgent.*` و`session.*` و
`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات ووقت تشغيل Gateway والمفاتيح
الأخرى ذات المستوى الأعلى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكيل

### `agents.defaults.workspace`

القيمة الافتراضية: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime في prompt النظام. إذا لم يتم ضبطه، يكتشف OpenClaw ذلك تلقائيًا عبر التقدّم إلى الأعلى انطلاقًا من مساحة العمل.

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
      { id: "writer" }, // يرث github وweather
      { id: "docs", skills: ["docs-search"] }, // يستبدل الإعدادات الافتراضية
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- تكون قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛ ولا تُدمج مع الإعدادات الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap الخاصة بمساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكّم في وقت حقن ملفات bootstrap الخاصة بمساحة العمل في prompt النظام. القيمة الافتراضية: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد اكتمال استجابة المساعد) إعادة حقن bootstrap لمساحة العمل، مما يقلّل حجم prompt. لا تزال تشغيلات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: يعطّل حقن bootstrap الخاص بمساحة العمل وملفات السياق في كل دور. استخدم هذا فقط مع الوكلاء الذين يديرون دورة حياة prompt الخاصة بهم بالكامل (محركات سياق مخصّصة، أو أوقات تشغيل أصلية تبني سياقها بنفسها، أو مسارات عمل متخصصة بلا bootstrap). كما تتخطى أدوار Heartbeat والاسترداد بعد Compaction الحقن أيضًا.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد المحارف لكل ملف bootstrap في مساحة العمل قبل الاقتطاع. القيمة الافتراضية: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى لإجمالي عدد المحارف المحقونة عبر جميع ملفات bootstrap الخاصة بمساحة العمل. القيمة الافتراضية: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكّم في نص التحذير المرئي للوكيل عند اقتطاع سياق bootstrap.
القيمة الافتراضية: `"once"`.

- `"off"`: لا يحقن نص تحذير في prompt النظام مطلقًا.
- `"once"`: يحقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: يحقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يحتوي OpenClaw على عدة ميزانيات كبيرة الحجم لـ prompt/السياق، وهي
مقسّمة عمدًا حسب النظام الفرعي بدلًا من مرورها كلها عبر
مفتاح عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  الحقن العادي لـ bootstrap الخاص بمساحة العمل.
- `agents.defaults.startupContext.*`:
  تمهيد بدء التشغيل لمرة واحدة في `/new` و`/reset`، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في prompt النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت التشغيل المقيّدة والكتل المملوكة لوقت التشغيل والمحقونة.
- `memory.qmd.limits.*`:
  قصاصة بحث الذاكرة المفهرسة وحجم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية
مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكّم في تمهيد بدء التشغيل لأول دور والذي يُحقن في تشغيلات `/new` و`/reset`
العادية.

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

إعدادات افتراضية مشتركة لأسطح سياق وقت التشغيل المقيّدة.

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
  بيانات وصفية للاقتطاع وإشعار بالمتابعة.
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ `memory_get` عندما يُحذف `lines`.
- `toolResultMaxChars`: الحد الأقصى الحي لنتائج الأدوات المستخدم للنتائج
  المحفوظة والاسترداد من الفائض.
- `postCompactionMaxChars`: الحد الأقصى لمقتطف AGENTS.md المستخدم أثناء حقن
  التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمفاتيح `contextLimits` المشتركة. الحقول المحذوفة تُورَّث
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

حد عام لقائمة Skills المضغوطة المحقونة في prompt النظام. هذا
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

تجاوز لكل وكيل لميزانية prompt الخاصة بـ Skills.

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

أقصى حجم بالبكسل لأطول ضلع في الصورة ضمن كتل صور السجل/الأدوات قبل استدعاءات المزوّد.
القيمة الافتراضية: `1200`.

تقلل القيم الأدنى عادةً استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات الثقيلة باللقطات.
أما القيم الأعلى فتحافظ على مزيد من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق prompt النظام (وليست للطوابع الزمنية للرسائل). تعود إلى المنطقة الزمنية للمضيف إذا لم تُضبط.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في prompt النظام. القيمة الافتراضية: `auto` (تفضيل نظام التشغيل).

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
      params: { cacheRetention: "long" }, // معلمات المزوّد الافتراضية العامة
      embeddedHarness: {
        runtime: "pi", // pi | auto | معرّف harness مسجّل، مثل codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - صيغة السلسلة تضبط النموذج الأساسي فقط.
  - صيغة الكائن تضبط النموذج الأساسي بالإضافة إلى نماذج التحويل الاحتياطي المرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` بوصفه إعداد نموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يتمكن النموذج المحدد/الافتراضي من قبول إدخال الصور.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الصور المشتركة وأي سطح أدوات/Plugin مستقبلي ينشئ الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لإنشاء الصور الأصلي في Gemini، أو `fal/fal-ai/flux/dev` في fal، أو `openai/gpt-image-2` في OpenAI Images.
  - إذا حددت مزوّدًا/نموذجًا مباشرةً، فاضبط مصادقة المزوّد المطابقة أيضًا (مثلًا `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2`، أو `FAL_KEY` لـ `fal/*`).
  - إذا تم حذفه، يظل بإمكان `image_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي إنشاء الصور المسجّلين بترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الموسيقى المشتركة وأداة `music_generate` المضمّنة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.6`.
  - إذا تم حذفه، يظل بإمكان `music_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي إنشاء الموسيقى المسجّلين بترتيب معرّف المزوّد.
  - إذا حددت مزوّدًا/نموذجًا مباشرةً، فاضبط كذلك مصادقة/مفتاح API المطابق لذلك المزوّد.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الفيديو المشتركة وأداة `video_generate` المضمّنة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا تم حذفه، يظل بإمكان `video_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي إنشاء الفيديو المسجّلين بترتيب معرّف المزوّد.
  - إذا حددت مزوّدًا/نموذجًا مباشرةً، فاضبط كذلك مصادقة/مفتاح API المطابق لذلك المزوّد.
  - يدعم مزوّد إنشاء الفيديو Qwen المضمّن ما يصل إلى فيديو خرج واحد، وصورة إدخال واحدة، و4 مقاطع فيديو إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد مثل `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا تم حذفه، تعود أداة PDF إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي تؤخذ في الاعتبار بواسطة وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: مستوى الإخراج المفصل الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. القيمة الافتراضية: `"off"`.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. القيمة الافتراضية: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.5` للوصول عبر مفتاح API أو `openai-codex/gpt-5.5` لـ Codex OAuth). إذا حذفت المزوّد، يحاول OpenClaw أولًا الاسم المستعار، ثم مطابقة مزوّد مضبوط فريد لذلك المعرّف الدقيق للنموذج، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المضبوط (سلوك توافق قديم، لذا يُفضّل استخدام `provider/model` صراحةً). إذا لم يعد ذلك المزوّد يعرّض النموذج الافتراضي المضبوط، يعود OpenClaw إلى أول مزوّد/نموذج مضبوط بدلًا من إظهار افتراضي قديم لمزوّد تمت إزالته.
- `models`: فهرس النماذج المضبوط وقائمة السماح الخاصة بـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` و`extra_body`/`extraBody`).
  - التعديلات الآمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` عمليات الاستبدال التي قد تزيل إدخالات موجودة من قائمة السماح ما لم تمرّر `--replace`.
  - تقوم مسارات الضبط/التهيئة الموجّهة حسب المزوّد بدمج نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدات الأخرى المضبوطة وغير المرتبطة.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، يتم تفعيل Compaction على جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [OpenAI server-side compaction](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (في الإعدادات): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم تتجاوزه `agents.list[].params` (وفق معرّف الوكيل المطابق) حسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح طلب مُنشأة، تكون أولوية الجسم الإضافي أعلى؛ بينما تستمر المسارات غير الأصلية لـ completions في إزالة `store` الخاص بـ OpenAI بعد ذلك.
- `embeddedHarness`: سياسة وقت التشغيل الافتراضية منخفضة المستوى للوكلاء المضمّنين. إذا حُذف `runtime`، يكون الافتراضي OpenClaw Pi. استخدم `runtime: "pi"` لفرض PI harness المضمّن، أو `runtime: "auto"` للسماح لـ harness من Plugin مسجّلة بادعاء النماذج المدعومة، أو معرّف harness مسجّل مثل `runtime: "codex"`. اضبط `fallback: "none"` لتعطيل الرجوع التلقائي إلى PI. تفشل أوقات تشغيل Plugin الصريحة مثل `codex` في الوضع المغلق افتراضيًا ما لم تضبط `fallback: "pi"` ضمن نفس نطاق التجاوز. أبقِ مراجع النماذج بالصيغة القياسية `provider/model`؛ واختر Codex وClaude CLI وGemini CLI وغيرها من خلفيات التنفيذ عبر إعدادات وقت التشغيل بدلًا من بادئات مزوّد وقت التشغيل القديمة. راجع [Agent runtimes](/ar/concepts/agent-runtimes) لمعرفة كيف يختلف ذلك عن اختيار المزوّد/النموذج.
- تُحفظ أدوات كتابة الإعدادات التي تعدّل هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة fallback) بصيغة الكائن القياسية وتحافظ على قوائم fallback الموجودة عندما يكون ذلك ممكنًا.
- `maxConcurrent`: الحد الأقصى للتشغيلات المتوازية للوكلاء عبر الجلسات (مع بقاء كل جلسة متسلسلة). القيمة الافتراضية: 4.

### `agents.defaults.embeddedHarness`

يتحكّم `embeddedHarness` في المنفّذ منخفض المستوى الذي يشغّل أدوار الوكيل المضمّنة.
يجب أن تبقي معظم البيئات على وقت التشغيل الافتراضي OpenClaw Pi.
استخدمه عندما يوفّر Plugin موثوق به harness أصليًا، مثل
Codex app-server harness المضمّن. ولتصور المفهوم ذهنيًا، راجع
[Agent runtimes](/ar/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: إما `"auto"` أو `"pi"` أو معرّف harness مسجّل من Plugin. يسجّل Plugin Codex المضمّن المعرف `codex`.
- `fallback`: إما `"pi"` أو `"none"`. في `runtime: "auto"`، يكون fallback المحذوف افتراضيًا `"pi"` حتى تتمكن الإعدادات القديمة من مواصلة استخدام PI عندما لا يطالب أي Plugin harness بالتشغيل. في وضع وقت تشغيل Plugin الصريح، مثل `runtime: "codex"`، يكون fallback المحذوف افتراضيًا `"none"` بحيث يفشل غياب harness بدلًا من استخدام PI بصمت. لا ترث تجاوزات وقت التشغيل fallback من نطاق أوسع؛ اضبط `fallback: "pi"` إلى جانب وقت التشغيل الصريح عندما تريد ذلك التوافق عمدًا. وتظهر إخفاقات Plugin harness المحدد دائمًا مباشرةً.
- تجاوزات البيئة: يقوم `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` بتجاوز `runtime`؛ ويقوم `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` بتجاوز fallback لتلك العملية.
- لبيئات Codex فقط، اضبط `model: "openai/gpt-5.5"` و`embeddedHarness.runtime: "codex"`. يمكنك أيضًا ضبط `embeddedHarness.fallback: "none"` صراحةً لتحسين الوضوح؛ فهو الافتراضي لأوقات تشغيل Plugin الصريحة.
- يتم تثبيت اختيار Harness لكل معرّف جلسة بعد أول تشغيل مضمن. تؤثر تغييرات الإعدادات/البيئة في الجلسات الجديدة أو المعاد تعيينها، وليس في سجل موجود. تُعامل الجلسات القديمة التي لها سجل محادثة ولكن من دون تثبيت مسجّل على أنها مثبّتة على PI. يبلّغ `/status` عن وقت التشغيل الفعّال، مثل `Runtime: OpenClaw Pi Default` أو `Runtime: OpenAI Codex`.
- هذا يتحكّم فقط في chat harness المضمّن. أما إنشاء الوسائط والرؤية وPDF والموسيقى والفيديو وTTS فما زالت تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمّنة** (تنطبق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

| الاسم المستعار | النموذج |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` أو `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

تتغلب أسماؤك المستعارة المضبوطة دائمًا على الإعدادات الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI الخيار `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضيًا عندما لا يكون هناك مستوى تفكير محدد صراحةً.

### `agents.defaults.cliBackends`

خلفيات CLI اختيارية لتشغيلات fallback النصية فقط (من دون استدعاءات أدوات). مفيدة كخطة احتياطية عند فشل مزوّدي API.

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
          // أو استخدم systemPromptFileArg إذا كانت CLI تقبل وسيط ملف prompt.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- خلفيات CLI موجهة للنص أولًا؛ وتُعطّل الأدوات دائمًا.
- تُدعَم الجلسات عندما يتم ضبط `sessionArg`.
- يُدعم تمرير الصور عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل prompt النظام بالكامل الذي يجمعه OpenClaw بسلسلة ثابتة. يُضبط على مستوى الإعداد الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون لقيم كل وكيل أولوية أعلى؛ ويتم تجاهل القيمة الفارغة أو التي تحتوي على مسافات فقط. هذا مفيد لتجارب prompt المنضبطة.

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

طبقات prompt إضافية مستقلة عن المزوّد تُطبَّق حسب عائلة النموذج. تتلقى معرّفات نماذج GPT-5 السلوك التعاقدي المشترك عبر المزوّدين؛ ويتحكّم `personality` فقط في طبقة أسلوب التفاعل الودود.

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

- `"friendly"` (الافتراضي) و`"on"` يفعّلان طبقة أسلوب التفاعل الودود.
- `"off"` يعطّل الطبقة الودودة فقط؛ ويظل عقد سلوك GPT-5 الموسوم مفعّلًا.
- لا يزال يُقرأ الإعداد القديم `plugins.entries.openai.config.personality` عندما لا يكون هذا الإعداد المشترك مضبوطًا.

### `agents.defaults.heartbeat`

تشغيلات Heartbeat الدورية.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m يعطّل
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // الافتراضي: true؛ false يحذف قسم Heartbeat من prompt النظام
        lightContext: false, // الافتراضي: false؛ true يُبقي فقط HEARTBEAT.md من ملفات bootstrap الخاصة بمساحة العمل
        isolatedSession: false, // الافتراضي: false؛ true يشغّل كل heartbeat في جلسة جديدة (من دون سجل محادثة)
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

- `every`: سلسلة مدة (ms/s/m/h). القيمة الافتراضية: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). اضبطها على `0m` للتعطيل.
- `includeSystemPromptSection`: عند ضبطه على false، يحذف قسم Heartbeat من prompt النظام ويتخطى حقن `HEARTBEAT.md` في سياق bootstrap. القيمة الافتراضية: `true`.
- `suppressToolErrorWarnings`: عند ضبطه على true، يمنع حمولات تحذير أخطاء الأدوات أثناء تشغيلات heartbeat.
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لدور وكيل heartbeat واحد قبل إلغائه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/الرسائل الخاصة. يتيح `allow` (الافتراضي) التسليم المباشر إلى الهدف. يمنع `block` التسليم المباشر إلى الهدف ويصدر `reason=dm-blocked`.
- `lightContext`: عند ضبطه على true، تستخدم تشغيلات heartbeat سياق bootstrap خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap الخاصة بمساحة العمل.
- `isolatedSession`: عند ضبطه على true، يعمل كل heartbeat في جلسة جديدة من دون أي سجل محادثة سابق. وهو نمط العزل نفسه في Cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل heartbeat من نحو 100 ألف إلى نحو 2-5 آلاف رمز.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، **تشغّل هذه الوكلاء فقط** Heartbeats.
- تشغّل Heartbeats أدوار وكيل كاملة — والفترات الأقصر تستهلك مزيدًا من الرموز.

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
        postCompactionSections: ["Session Startup", "Red Lines"], // [] يعطّل إعادة الحقن
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز اختياري لنموذج Compaction فقط
        notifyUser: true, // إرسال إشعارات موجزة للمستخدم عند بدء Compaction واكتماله (الافتراضي: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: إما `default` أو `safeguard` (تلخيص مقسّم للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزوّد Compaction مسجّل. عند ضبطه، يتم استدعاء `summarize()` الخاص بالمزوّد بدلًا من تلخيص LLM المضمّن. ويعود إلى المضمّن عند الفشل. يؤدي ضبط مزوّد إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يقوم OpenClaw بإلغائها. القيمة الافتراضية: `900`.
- `keepRecentTokens`: ميزانية نقطة القطع في Pi للاحتفاظ بذيل السجل الأحدث حرفيًا. يراعي `/compact` اليدوي هذا عند ضبطه صراحةً؛ وإلا فإن Compaction اليدوي يكون نقطة تحقق صارمة.
- `identifierPolicy`: إما `strict` (الافتراضي) أو `off` أو `custom`. يضيف `strict` إرشادات مضمّنة للاحتفاظ بالمعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عندما `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند المخرجات غير الصالحة لتلخيصات safeguard. تكون مفعلة افتراضيًا في وضع safeguard؛ اضبط `enabled: false` لتخطي التدقيق.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من AGENTS.md لإعادة حقنها بعد Compaction. القيمة الافتراضية هي `["Session Startup", "Red Lines"]`؛ اضبطها على `[]` لتعطيل إعادة الحقن. عند تركها غير مضبوطة أو ضبطها صراحةً على هذا الزوج الافتراضي، تُقبل أيضًا العناوين الأقدم `Every Session`/`Safety` كحل احتياطي قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما ينبغي أن تحافظ الجلسة الرئيسية على نموذج معين بينما تعمل تلخيصات Compaction على نموذج آخر؛ وعند عدم ضبطه، يستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عند ضبطه على `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction واكتماله (مثل "Compacting context..." و"Compaction complete"). يكون معطّلًا افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. يتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقصّ **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل إرسالها إلى LLM. ولا **يعدّل** سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // مدة (ms/s/m/h)، وحدة القياس الافتراضية: الدقائق
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

- يفعّل `mode: "cache-ttl"` تمريرات القص.
- يتحكم `ttl` في عدد المرات التي يمكن أن يعمل فيها القص مرة أخرى (بعد آخر لمسة لذاكرة التخزين المؤقت).
- يقوم القص أولًا باقتطاع نتائج الأدوات كبيرة الحجم بشكل جزئي، ثم يمسح نتائج الأدوات الأقدم بالكامل عند الحاجة.

**الاقتطاع الجزئي** يحتفظ بالبداية + النهاية ويُدرج `...` في الوسط.

**المسح الكامل** يستبدل نتيجة الأداة بالكامل بالنص النائب.

ملاحظات:

- لا يتم أبدًا اقتطاع/مسح كتل الصور.
- النسب قائمة على عدد المحارف (تقريبية)، وليست على أعداد الرموز الدقيقة.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، يتم تخطي القص.

</Accordion>

راجع [Session Pruning](/ar/concepts/session-pruning) للحصول على تفاصيل السلوك.

### البث الكتلي

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

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحةً لتمكين الردود الكتلية.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات كل حساب). تكون القيم الافتراضية لـ Signal/Slack/Discord/Google Chat هي `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود الكتلية. يعني `natural` = 800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [Streaming](/ar/concepts/streaming) للحصول على تفاصيل السلوك + التجزئة.

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

- القيم الافتراضية: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات من دون إشارة.
- تجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [Typing Indicators](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

وضع sandbox اختياري للوكيل المضمّن. راجع [Sandboxing](/ar/gateway/sandboxing) للاطلاع على الدليل الكامل.

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
          // تُدعَم أيضًا SecretRefs / المحتويات المضمنة:
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

<Accordion title="تفاصيل Sandbox">

**الخلفية:**

- `docker`: وقت تشغيل Docker محلي (الافتراضي)
- `ssh`: وقت تشغيل عام بعيد مدعوم عبر SSH
- `openshell`: وقت تشغيل OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل الخاصة بكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يحولها OpenClaw إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح سياسة مفاتيح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- يتغلب `identityData` على `identityFile`
- يتغلب `certificateData` على `certificateFile`
- يتغلب `knownHostsData` على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من اللقطة النشطة لوقت تشغيل الأسرار قبل بدء جلسة sandbox

**سلوك خلفية SSH:**

- يبذر مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة عمل SSH البعيدة هي المرجع الأساسي
- يوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة إلى المضيف تلقائيًا
- لا يدعم حاويات متصفح sandbox

**وصول مساحة العمل:**

- `none`: مساحة عمل sandbox خاصة بكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل sandbox عند `/workspace`، ومساحة عمل الوكيل مركّبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركّبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

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
          gateway: "lab", // اختياري
          gatewayEndpoint: "https://lab.example", // اختياري
          policy: "strict", // معرّف سياسة OpenShell اختياري
          providers: ["openai"], // اختياري
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**وضع OpenShell:**

- `mirror`: يبذر البعيد من المحلي قبل التنفيذ، ويزامن عكسيًا بعد التنفيذ؛ وتبقى مساحة العمل المحلية هي المرجع الأساسي
- `remote`: يبذر البعيد مرة واحدة عند إنشاء sandbox، ثم يُبقي مساحة العمل البعيدة هي المرجع الأساسي

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تتم خارج OpenClaw إلى sandbox تلقائيًا بعد خطوة البذر.
يكون النقل عبر SSH إلى OpenShell sandbox، لكن Plugin يملك دورة حياة sandbox والمزامنة الانعكاسية الاختيارية.

**`setupCommand`** يُشغَّل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج شبكي، وجذر قابل للكتابة، ومستخدم root.

**الحاويات تستخدم افتراضيًا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يتم حظر `"host"`. ويتم حظر `"container:<id>"` افتراضيًا ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (للاستخدام الطارئ).

**المرفقات الواردة** تُجهَّز ضمن `media/inbound/*` في مساحة العمل النشطة.

**`docker.binds`** يركّب أدلة إضافية من المضيف؛ ويتم دمج الربوط العامة وربوط كل وكيل.

**متصفح sandbox** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. يتم حقن عنوان noVNC URL في prompt النظام. ولا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL برمز مميز قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (الافتراضي) يمنع جلسات sandbox من استهداف متصفح المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند حافة الحاوية إلى نطاق CIDR (مثل `172.21.0.1/32`).
- يقوم `sandbox.browser.binds` بتركيب أدلة إضافية من المضيف داخل حاوية متصفح sandbox فقط. وعند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- تُعرَّف إعدادات التشغيل الافتراضية في `scripts/sandbox-browser-entrypoint.sh` ومضبوطة لمضيفي الحاويات:
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/الرسوم ثلاثية الأبعاد يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كانت
    مسارات عملك تعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه على `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - الإعدادات الافتراضية هي خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    نقطة دخول مخصصة لتغيير الإعدادات الافتراضية للحاوية.

</Accordion>

يقتصر Browser sandboxing و`sandbox.docker.binds` على Docker فقط.

ابنِ الصور:

```bash
scripts/sandbox-setup.sh           # صورة sandbox الرئيسية
scripts/sandbox-browser-setup.sh   # صورة المتصفح الاختيارية
```

### `agents.list` (تجاوزات لكل وكيل)

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
        model: "anthropic/claude-opus-4-6", // أو { primary, fallbacks }
        thinkingDefault: "high", // تجاوز مستوى التفكير لكل وكيل
        reasoningDefault: "on", // تجاوز افتراضي لإظهار الاستدلال لكل وكيل
        fastModeDefault: false, // تجاوز الوضع السريع لكل وكيل
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // يتجاوز مفاتيح params المطابقة في defaults.models
        skills: ["docs-search"], // يستبدل agents.defaults.skills عند ضبطه
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
- `default`: عند ضبط عدة وكلاء، يفوز الأول (مع تسجيل تحذير). وإذا لم يُضبط أي منها، يكون الإدخال الأول في القائمة هو الافتراضي.
- `model`: صيغة السلسلة تتجاوز `primary` فقط؛ وصيغة الكائن `{ primary, fallbacks }` تتجاوز الاثنين معًا (`[]` يعطّل fallbacks العامة). تظل مهام Cron التي تتجاوز `primary` فقط ترث fallbacks الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات تدفق لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ وتستبدل القائمة الصريحة الإعدادات الافتراضية بدلًا من دمجها، بينما تعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزوّد/النموذج المحدد في القيم الصالحة؛ وبالنسبة إلى Google Gemini، يحافظ `adaptive` على التفكير الديناميكي الذي يملكه المزوّد (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: الإعداد الافتراضي الاختياري لإظهار الاستدلال لكل وكيل (`on | off | stream`). يُطبَّق عندما لا يكون هناك تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: الإعداد الافتراضي الاختياري للوضع السريع لكل وكيل (`true | false`). يُطبَّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `embeddedHarness`: تجاوز اختياري لسياسة harness منخفضة المستوى لكل وكيل. استخدم `{ runtime: "codex" }` لجعل وكيل واحد خاصًا بـ Codex بينما تحتفظ الوكلاء الأخرى بالرجوع الافتراضي إلى PI في وضع `auto`.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع الإعدادات الافتراضية `runtime.acp` (`agent` و`backend` و`mode` و`cwd`) عندما ينبغي أن يبدأ الوكيل افتراضيًا بجلسات ACP harness.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL بـ `http(s)`، أو URI من نوع `data:`.
- يستمد `identity` الإعدادات الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح بمعرّفات الوكلاء لأجل `sessions_spawn` (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حاجز وراثة Sandbox: إذا كانت جلسة الطالب ضمن sandbox، يرفض `sessions_spawn` الأهداف التي ستعمل من دون sandbox.
- `subagents.requireAgentId`: عندما يكون true، يمنع استدعاءات `sessions_spawn` التي تُهمل `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## التوجيه بين عدة وكلاء

شغّل عدة وكلاء معزولين داخل Gateway واحد. راجع [Multi-Agent](/ar/concepts/multi-agent).

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

### حقول مطابقة الارتباط

- `type` (اختياري): `route` للتوجيه العادي (ويكون النوع المفقود افتراضيًا هو route)، و`acp` لارتباطات محادثات ACP الدائمة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ المحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، من دون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة كلها)
6. الوكيل الافتراضي

ضمن كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يقوم OpenClaw بالحل حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات route binding أعلاه.

### ملفات وصول لكل وكيل

<Accordion title="وصول كامل (من دون sandbox)">

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

<Accordion title="أدوات + مساحة عمل للقراءة فقط">

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

<Accordion title="من دون وصول إلى نظام الملفات (مراسلة فقط)">

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

راجع [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) للحصول على تفاصيل الأسبقية.

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
    parentForkMaxTokens: 100000, // تخطَّ تفرّع السلسلة الأصلية فوق هذا العدد من الرموز (0 يعطّل)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // مدة أو false
      maxDiskBytes: "500mb", // ميزانية صارمة اختيارية
      highWaterBytes: "400mb", // هدف تنظيف اختياري
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // الإلغاء التلقائي للتركيز الافتراضي بعد عدم النشاط بالساعات (`0` يعطّل)
      maxAgeHours: 0, // الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل)
    },
    mainKey: "main", // قديم (يستخدم وقت التشغيل دائمًا "main")
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
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك جميع الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: يعزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: يعزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: يعزل لكل حساب + قناة + مرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرّفات القياسية بالأطراف المسبوقة باسم المزوّد لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. يعيد `daily` التعيين عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` التعيين بعد `idleMinutes`. وعند ضبط كليهما، يفوز أول ما تنتهي صلاحيته.
- **`resetByType`**: تجاوزات حسب النوع (`direct` و`group` و`thread`). ولا يزال `dm` القديم مقبولًا كاسم بديل لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى المسموح به لـ `totalTokens` في الجلسة الأصلية عند إنشاء جلسة سلسلة متفرعة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` في الأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة سلسلة جديدة بدلًا من وراثة سجل المحادثة من الأصل.
  - اضبطه على `0` لتعطيل هذا الحاجز والسماح دائمًا بالتفرع من الأصل.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية المحادثة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`–`5`). يؤدي `0` إلى تعطيل سلاسل ping-pong.
- **`sendPolicy`**: طابق حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. يفوز أول منع.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات والاحتفاظ بها.
  - `mode`: يطلق `warn` تحذيرات فقط؛ بينما يطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: يدير `sessions.json` عند تجاوزه هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات السجل `*.reset.<timestamp>`. وتكون افتراضيًا مساوية لـ `pruneAfter`؛ اضبطها على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجّل تحذيرات؛ وفي وضع `enforce` يزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد التنظيف وفق الميزانية. ويكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدات تجاوزه؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: الإلغاء التلقائي للتركيز الافتراضي بعد عدم النشاط بالساعات (`0` يعطّل؛ ويمكن للمزوّدات تجاوزه)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ ويمكن للمزوّدات تجاوزه)

</Accordion>

---

## الرسائل

```json5
{
  messages: {
    responsePrefix: "🦞", // أو "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 يعطّل
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### بادئة الاستجابة

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix` و`channels.<channel>.accounts.<id>.responsePrefix`.

آلية الحل (الأكثر تحديدًا يفوز): الحساب ← القناة ← العام. يؤدي `""` إلى التعطيل وإيقاف التسلسل. ويشتق `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير | الوصف | المثال |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | الاسم المختصر للنموذج | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high` أو `low` أو `off`        |
| `{identity.name}` | اسم هوية الوكيل | (مماثل لـ `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. ويُعد `{think}` اسمًا بديلًا لـ `{thinkingLevel}`.

### تفاعل الإقرار

- يكون افتراضيًا `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبط `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب ← القناة ← `messages.ackReaction` ← الرجوع إلى الهوية.
- النطاق: `group-mentions` (الافتراضي) أو `group-all` أو `direct` أو `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد على Slack وDiscord وTelegram.
- `messages.statusReactions.enabled`: يفعّل تفاعلات الحالة الدورية على Slack وDiscord وTelegram.
  على Slack وDiscord، يؤدي تركه غير مضبوط إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  على Telegram، اضبطه صراحةً على `true` لتمكين تفاعلات الحالة الدورية.

### تأخير الإدخال الوارد

يجمع الرسائل النصية السريعة من المرسل نفسه في دور وكيل واحد. ويتم تفريغ الوسائط/المرفقات فورًا. وتتجاوز أوامر التحكم آلية التأخير.

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن للأمر `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` القيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (يتطلب تفعيلًا صريحًا).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- مزوّدو الكلام المضمّنون مملوكون من Plugin. إذا تم ضبط `plugins.allow`، فأدرج كل Plugin لمزوّد TTS تريد استخدامه، مثل `microsoft` من أجل Edge TTS. ويُقبل معرّف المزوّد القديم `edge` كاسم بديل لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو: الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير تابعة لـ OpenAI، يتعامل OpenClaw معها على أنها خادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## talk

الإعدادات الافتراضية لوضع talk (macOS/iOS/Android).

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
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عندما يتم ضبط عدة مزوّدات لـ talk.
- مفاتيح talk القديمة المسطحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط، ويتم ترحيلها تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الأصوات إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- لا يُطبَّق الرجوع إلى `ELEVENLABS_API_KEY` إلا عندما لا يكون مفتاح API الخاص بـ talk مضبوطًا.
- يسمح `providers.*.voiceAliases` لتوجيهات talk باستخدام أسماء ودية.
- يحدد `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي في macOS. وإذا تم حذفه، يستخدم macOS القيمة `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX في macOS عبر المساعد المضمّن `openclaw-mlx-tts` عند وجوده، أو عبر ملف تنفيذي موجود على `PATH`؛ ويقوم `OPENCLAW_MLX_TTS_BIN` بتجاوز مسار المساعد لأغراض التطوير.
- يتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع talk بعد صمت المستخدم قبل إرسال النسخة النصية. ويؤدي تركه غير مضبوط إلى الإبقاء على نافذة التوقف الافتراضية للمنصة (`700 ms` على macOS وAndroid، و`900 ms` على iOS).

---

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — جميع مفاتيح الإعدادات الأخرى
- [الإعدادات](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة على الإعدادات](/ar/gateway/configuration-examples)
