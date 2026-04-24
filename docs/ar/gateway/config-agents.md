---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، والتفكير، ومساحة العمل، وHeartbeat، والوسائط، وSkills)
    - تكوين التوجيه متعدد الوكلاء والروابط
    - ضبط سلوك الجلسة، وتسليم الرسائل، ووضع talk
summary: الإعدادات الافتراضية للوكيل، والتوجيه متعدد الوكلاء، والجلسة، والرسائل، وتكوين talk
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-04-24T07:40:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: de1587358404808b4a11a92a9392d7cc5bdd2b599773f8a0f7b4331551841991
    source_path: gateway/config-agents.md
    workflow: 15
---

مفاتيح التكوين الخاصة بنطاق الوكيل تحت `agents.*` و`multiAgent.*` و`session.*` و
`messages.*` و`talk.*`. بالنسبة إلى القنوات، والأدوات، وRuntime الخاص بـ Gateway، وغيرها من
المفاتيح ذات المستوى الأعلى، راجع [مرجع التكوين](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر المستودع الاختياري الذي يظهر في سطر Runtime في مطالبة النظام. إذا لم يتم ضبطه، يكتشفه OpenClaw تلقائيًا من خلال الصعود من مساحة العمل إلى الأعلى.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح Skills افتراضية اختيارية للوكلاء الذين لا يضبطون
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // يرث github, weather
      { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة القيم الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- تمثل قائمة `agents.list[].skills` غير الفارغة المجموعة النهائية لذلك الوكيل؛
  وهي لا تندمج مع القيم الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap الخاصة بمساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في توقيت حقن ملفات bootstrap الخاصة بمساحة العمل في مطالبة النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد اكتمال رد المساعد) إعادة حقن bootstrap الخاص بمساحة العمل، مما يقلل حجم المطالبة. أما تشغيلات Heartbeat وإعادات المحاولة بعد Compaction فتستمر في إعادة بناء السياق.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف لكل ملف bootstrap في مساحة العمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى لإجمالي الأحرف المحقونة عبر جميع ملفات bootstrap الخاصة بمساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عند اقتطاع سياق bootstrap.
الافتراضي: `"once"`.

- `"off"`: لا يحقن نص تحذير في مطالبة النظام مطلقًا.
- `"once"`: يحقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: يحقن التحذير في كل تشغيل عندما يوجد اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يحتوي OpenClaw على عدة ميزانيات كبيرة للمطالبة/السياق، وهي
مقسمة عمدًا حسب المنظومة الفرعية بدلًا من مرورها جميعًا عبر
مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن bootstrap العادي لمساحة العمل.
- `agents.defaults.startupContext.*`:
  المقدمة الافتتاحية لمرة واحدة في `/new` و`/reset`، بما في ذلك
  ملفات `memory/*.md` اليومية الحديثة.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في مطالبة النظام.
- `agents.defaults.contextLimits.*`:
  المقاطع المقيدة في وقت التشغيل والكتل المحقونة المملوكة لوقت التشغيل.
- `memory.qmd.limits.*`:
  حجم مقتطفات بحث الذاكرة المفهرسة والحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى
ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في المقدمة الافتتاحية لأول دور التي تُحقن عند تشغيلات `/new` و`/reset`
المجردة.

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

الإعدادات الافتراضية المشتركة لأسطح السياق المحدودة في وقت التشغيل.

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
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ `memory_get` عند حذف `lines`.
- `toolResultMaxChars`: الحد الأقصى لنتائج الأدوات الحية المستخدم للنتائج المحفوظة و
  استعادة الفائض.
- `postCompactionMaxChars`: الحد الأقصى لمقتطف AGENTS.md المستخدم أثناء حقن
  التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمقابض `contextLimits` المشتركة. وترث الحقول المحذوفة
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

الحد العام لقائمة Skills المضغوطة المحقونة في مطالبة النظام. لا يؤثر
هذا في قراءة ملفات `SKILL.md` عند الطلب.

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

الحد الأقصى لحجم البكسل لأطول ضلع في الصورة داخل كتل صور النص التفريغي/الأدوات قبل استدعاءات المزوّد.
الافتراضي: `1200`.

غالبًا ما تقلل القيم الأقل من استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات الثقيلة بلقطات الشاشة.
وتحافظ القيم الأعلى على قدر أكبر من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق مطالبة النظام (وليس للطوابع الزمنية للرسائل). وتعود إلى المنطقة الزمنية للمضيف.

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
      params: { cacheRetention: "long" }, // معلمات المزوّد الافتراضية العامة
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
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
  - صيغة الكائن تضبط النموذج الأساسي بالإضافة إلى نماذج الاحتياط المرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` كتكوين نموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما يتعذر على النموذج المحدد/الافتراضي قبول إدخال الصور.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولد الصور.
  - القيم المعتادة: `google/gemini-3.1-flash-image-preview` لتوليد الصور الأصلي في Gemini، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لـ OpenAI Images.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة المزوّد المطابقة (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2`، أو `FAL_KEY` لـ `fal/*`).
  - إذا تم حذفه، فلا يزال `image_generate` قادرًا على استنتاج مزوّد افتراضي مدعوم بالمصادقة. وهو يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الصور المسجلين بترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الموسيقى المشتركة وبواسطة الأداة المدمجة `music_generate`.
  - القيم المعتادة: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - إذا تم حذفه، فلا يزال `music_generate` قادرًا على استنتاج مزوّد افتراضي مدعوم بالمصادقة. وهو يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّف المزوّد.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة المزوّد/مفتاح API المطابق.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الفيديو المشتركة وبواسطة الأداة المدمجة `video_generate`.
  - القيم المعتادة: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا تم حذفه، فلا يزال `video_generate` قادرًا على استنتاج مزوّد افتراضي مدعوم بالمصادقة. وهو يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الفيديو المسجلين بترتيب معرّف المزوّد.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة المزوّد/مفتاح API المطابق.
  - يدعم مزوّد توليد الفيديو المضمّن Qwen ما يصل إلى 1 فيديو ناتج، و1 صورة إدخال، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد هي `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا تم حذفه، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي المحلَّل.
- `pdfMaxBytesMb`: الحد الافتراضي لحجم PDF لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي تؤخذ في الاعتبار بواسطة وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: المستوى الافتراضي للإسهاب للوكلاء. القيم: `"off"` أو `"on"` أو `"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: المستوى الافتراضي للمخرجات المرتفعة الصلاحية للوكلاء. القيم: `"off"` أو `"on"` أو `"ask"` أو `"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` (مثل `openai/gpt-5.4` للوصول عبر مفتاح API أو `openai-codex/gpt-5.5` لـ Codex OAuth). إذا حذفت المزوّد، يحاول OpenClaw أولًا اسمًا مستعارًا، ثم مطابقة فريدة لمزوّد مكوّن لذلك المعرّف الدقيق للنموذج، وبعدها فقط يعود إلى المزوّد الافتراضي المكوّن (سلوك توافق قديم، لذا يفضَّل استخدام `provider/model` الصريح). وإذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المكوّن، يعود OpenClaw إلى أول مزوّد/نموذج مكوّن بدلًا من إظهار افتراضي قديم لمزوّد تمت إزالته.
- `models`: فهرس النماذج المكوّن وقائمة السماح لـ `/model`. يمكن أن تتضمن كل قيمة `alias` (اختصار) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold`).
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات موجودة من قائمة السماح ما لم تمرر `--replace`.
  - تقوم تدفقات configure/onboarding ذات النطاق الخاص بالمزوّد بدمج نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين الآخرين المكوّنين وغير المرتبطين.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، يتم تفعيل Compaction على جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction على جانب خادم OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (في التكوين): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (للـ `agent id` المطابق) حسب المفتاح. راجع [التخزين المؤقت للمطالبة](/ar/reference/prompt-caching) للتفاصيل.
- `embeddedHarness`: سياسة وقت تشغيل الوكيل المضمّن منخفضة المستوى الافتراضية. استخدم `runtime: "auto"` للسماح لحزم Plugin المسجلة بادعاء النماذج المدعومة، أو `runtime: "pi"` لفرض harness المدمج PI، أو معرّف harness مسجل مثل `runtime: "codex"`. اضبط `fallback: "none"` لتعطيل الاحتياط التلقائي إلى PI.
- تقوم كاتبات التكوين التي تعدّل هذه الحقول (على سبيل المثال `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياط) بحفظ الصيغة القياسية للكائن والحفاظ على قوائم الاحتياط الموجودة عندما يكون ذلك ممكنًا.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكيل المتوازية عبر الجلسات (مع بقاء كل جلسة مُسلسلة). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في المنفّذ منخفض المستوى الذي يشغّل أدوار الوكيل المضمّن.
ينبغي لمعظم عمليات النشر الإبقاء على القيمة الافتراضية `{ runtime: "auto", fallback: "pi" }`.
استخدمه عندما يوفّر Plugin موثوق harness أصليًا، مثل
Codex app-server harness المضمّن.

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

- `runtime`: `"auto"` أو `"pi"` أو معرّف Plugin harness مسجل. يسجل Plugin ‏Codex المضمّن المعرف `codex`.
- `fallback`: `"pi"` أو `"none"`. تبقي `"pi"` على harness المدمج PI كاحتياط للتوافق عندما لا يتم اختيار أي Plugin harness. أما `"none"` فيجعل اختيار Plugin harness المفقود أو غير المدعوم يفشل بدلًا من استخدام PI بصمت. وتظهر دائمًا إخفاقات Plugin harness المحدد مباشرة.
- تجاوزات البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` القيمة `runtime`؛ ويعطّل `OPENCLAW_AGENT_HARNESS_FALLBACK=none` الاحتياط إلى PI لتلك العملية.
- بالنسبة إلى عمليات النشر المعتمدة على Codex فقط، اضبط `model: "openai/gpt-5.5"` و`embeddedHarness.runtime: "codex"` و`embeddedHarness.fallback: "none"`.
- يتم تثبيت اختيار harness لكل معرّف جلسة بعد أول تشغيل مضمّن. تؤثر تغييرات التكوين/البيئة في الجلسات الجديدة أو المعاد تعيينها، وليس في نص موجود. وتُعامل الجلسات القديمة ذات سجل النصوص ولكن من دون تثبيت مسجل على أنها مثبّتة على PI. يعرض `/status` معرّفات harness غير التابعة لـ PI مثل `codex` بجوار `Fast`.
- يتحكم هذا فقط في chat harness المضمّن. أما توليد الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS فلا تزال تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المدمجة** (تُطبّق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

| الاسم المستعار       | النموذج                                            |
| -------------------- | -------------------------------------------------- |
| `opus`               | `anthropic/claude-opus-4-6`                        |
| `sonnet`             | `anthropic/claude-sonnet-4-6`                      |
| `gpt`                | `openai/gpt-5.4` أو GPT-5.5 المكوّن عبر Codex OAuth |
| `gpt-mini`           | `openai/gpt-5.4-mini`                              |
| `gpt-nano`           | `openai/gpt-5.4-nano`                              |
| `gemini`             | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`       | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite`  | `google/gemini-3.1-flash-lite-preview`             |

تفوز أسماؤك المستعارة المكوّنة دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI الخيار `tool_stream` افتراضيًا لبث استدعاء الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` إلى `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضيًا عندما لا يتم ضبط مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الاحتياط النصية فقط (من دون استدعاءات أدوات). وهي مفيدة كنسخة احتياطية عندما تفشل مزوّدات API.

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
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- تكون الواجهات الخلفية CLI نصية أولًا؛ ويتم دائمًا تعطيل الأدوات.
- تكون الجلسات مدعومة عندما يتم ضبط `sessionArg`.
- يكون تمرير الصور مدعومًا عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل مطالبة النظام الكاملة التي يجمعها OpenClaw بسلسلة ثابتة. يمكن ضبطها على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). وتكون القيم الخاصة بكل وكيل أعلى أولوية؛ ويتم تجاهل القيمة الفارغة أو التي تحتوي على مسافات فقط. وهي مفيدة لتجارب المطالبة المضبوطة.

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

تراكبات مطالبة مستقلة عن المزوّد تُطبَّق حسب عائلة النموذج. تتلقى معرّفات نماذج GPT-5-family عقد السلوك المشترك عبر المزوّدين؛ ويتحكم `personality` فقط في طبقة أسلوب التفاعل الودي.

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

- يفعّل `"friendly"` (الافتراضي) و`"on"` طبقة أسلوب التفاعل الودي.
- يعطّل `"off"` الطبقة الودية فقط؛ بينما يبقى عقد السلوك الموسوم لـ GPT-5 مفعّلًا.
- لا يزال يتم قراءة `plugins.entries.openai.config.personality` القديم عندما لا يكون هذا الإعداد المشترك مضبوطًا.

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
        includeSystemPromptSection: true, // الافتراضي: true؛ وfalse يحذف قسم Heartbeat من مطالبة النظام
        lightContext: false, // الافتراضي: false؛ وtrue يُبقي فقط HEARTBEAT.md من ملفات bootstrap الخاصة بمساحة العمل
        isolatedSession: false, // الافتراضي: false؛ وtrue يشغّل كل Heartbeat في جلسة جديدة (من دون سجل محادثة)
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

- `every`: سلسلة مدة (`ms/s/m/h`). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). اضبطها على `0m` للتعطيل.
- `includeSystemPromptSection`: عندما تكون false، يحذف قسم Heartbeat من مطالبة النظام ويتخطى حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عندما تكون true، يمنع حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح لدور وكيل Heartbeat قبل إجهاضه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/للرسائل الخاصة. تسمح `allow` (الافتراضي) بالتسليم إلى الهدف المباشر. أما `block` فتمنع التسليم إلى الهدف المباشر وتصدر `reason=dm-blocked`.
- `lightContext`: عندما تكون true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap الخاصة بمساحة العمل.
- `isolatedSession`: عندما تكون true، يعمل كل Heartbeat في جلسة جديدة من دون أي سجل محادثة سابق. وهو نمط العزل نفسه المستخدم في Cron مع `sessionTarget: "isolated"`. ويقلل تكلفة الرموز المميزة لكل Heartbeat من نحو ~100K إلى ~2-5K رمز.
- لكل وكيل: اضبط `agents.list[].heartbeat`. وعندما يعرّف أي وكيل `heartbeat`، **تشغّل Heartbeats لهؤلاء الوكلاء فقط**.
- تعمل Heartbeats على أدوار وكيل كاملة — والفواصل الأقصر تستهلك مزيدًا من الرموز المميزة.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // معرّف Plugin مزود Compaction مسجل (اختياري)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // يُستخدم عندما يكون identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] يعطّل إعادة الحقن
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز اختياري للنموذج خاص بـ Compaction فقط
        notifyUser: true, // إرسال إشعارات موجزة عند بدء Compaction واكتماله (الافتراضي: false)
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

- `mode`: `default` أو `safeguard` (تلخيص مجزّأ للتواريخ الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزود Compaction مسجل. عند ضبطه، يتم استدعاء `summarize()` الخاصة بالمزوّد بدلًا من تلخيص LLM المدمج. ويعود إلى المدمج عند الفشل. ويفرض ضبط مزوّد استخدام `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح لعملية Compaction واحدة قبل أن يجهضها OpenClaw. الافتراضي: `900`.
- `identifierPolicy`: `strict` (الافتراضي) أو `off` أو `custom`. تقوم `strict` بإضافة إرشادات مدمجة للاحتفاظ بالمعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من AGENTS.md لإعادة حقنها بعد Compaction. الافتراضي هو `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. وعندما يكون غير مضبوط أو مضبوطًا صراحةً على ذلك الزوج الافتراضي، تُقبل أيضًا عناوين `Every Session`/`Safety` القديمة كاحتياط متوافق قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدمه عندما ينبغي أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما يجب أن تعمل ملخصات Compaction على نموذج آخر؛ وعندما لا يكون مضبوطًا، يستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عندما تكون `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثل "Compacting context..." و"Compaction complete"). ويكون معطّلًا افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. ويتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقلّم **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل إرسالها إلى LLM. **لا** يعدّل سجل الجلسات على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // مدة (ms/s/m/h)، ووحدة الدقائق هي الافتراضية
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

- يفعّل `mode: "cache-ttl"` عمليات التقليم.
- يتحكم `ttl` في عدد المرات التي يمكن فيها تشغيل التقليم مرة أخرى (بعد آخر لمسة للذاكرة المؤقتة).
- يقوم التقليم أولًا باقتطاع نتائج الأدوات الكبيرة بشكل مرن، ثم يزيل نتائج الأدوات الأقدم بشكل صارم إذا لزم الأمر.

**الاقتطاع المرن** يحتفظ بالبداية + النهاية ويُدرج `...` في المنتصف.

**الإزالة الصارمة** تستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا يتم أبدًا اقتطاع/إزالة كتل الصور.
- تعتمد النسب على الأحرف (تقريبية)، وليس على عدد الرموز المميزة بدقة.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، يتم تخطي التقليم.

</Accordion>

راجع [تقليم الجلسات](/ar/concepts/session-pruning) للحصول على تفاصيل السلوك.

### Block streaming

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

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحةً لتفعيل الردود الكتلية.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيراته لكل حساب). تستخدم Signal/Slack/Discord/Google Chat افتراضيًا `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود الكتلية. تعني `natural` = 800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [البث](/ar/concepts/streaming) للحصول على تفاصيل السلوك + التقسيم.

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

- القيم الافتراضية: `instant` للدردشات المباشرة/الإشارات، و`message` لدردشات المجموعات غير المشار إليها.
- تجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing اختياري للوكيل المضمّن. راجع [Sandboxing](/ar/gateway/sandboxing) للدليل الكامل.

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

<Accordion title="تفاصيل Sandbox">

**الواجهة الخلفية:**

- `docker`: Runtime محلي لـ Docker (الافتراضي)
- `ssh`: Runtime بعيد عام مدعوم بـ SSH
- `openshell`: Runtime خاص بـ OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بالـ Runtime إلى
`plugins.entries.openshell.config`.

**تكوين الواجهة الخلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل حسب النطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمّنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مقابض سياسة مفاتيح المضيف الخاصة بـ OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` يتغلب على `identityFile`
- `certificateData` يتغلب على `certificateFile`
- `knownHostsData` يتغلب على `knownHostsFile`
- يتم تحليل قيم `*Data` المدعومة بـ SecretRef من لقطة Runtime النشطة للأسرار قبل بدء جلسة sandbox

**سلوك الواجهة الخلفية SSH:**

- يزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يحافظ على مساحة عمل SSH البعيدة كمرجع أساسي
- يوجّه `exec`، وأدوات الملفات، ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيًا
- لا يدعم حاويات متصفح sandbox

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل sandbox حسب النطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل sandbox عند `/workspace`، ومساحة عمل الوكيل مركّبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركّبة للقراءة والكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**تكوين Plugin ‏OpenShell:**

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

- `mirror`: زرع البعيد من المحلي قبل exec، ثم مزامنته إلى الخلف بعد exec؛ وتبقى مساحة العمل المحلية هي المرجع الأساسي
- `remote`: زرع البعيد مرة واحدة عند إنشاء sandbox، ثم تبقى مساحة العمل البعيدة هي المرجع الأساسي

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تتم خارج OpenClaw إلى sandbox تلقائيًا بعد خطوة الزرع.
يكون النقل عبر SSH إلى OpenShell sandbox، لكن الـ Plugin هو الذي يمتلك دورة حياة sandbox والمزامنة العاكسة الاختيارية.

يُشغَّل `setupCommand` مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويحتاج إلى اتصال شبكي صادر، وجذر قابل للكتابة، ومستخدم root.

**تكون الحاويات افتراضيًا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يتم حظر `"host"`. كما يتم حظر `"container:<id>"` افتراضيًا ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (تجاوز طارئ).

**المرفقات الواردة** تُجهَّز في `media/inbound/*` داخل مساحة العمل النشطة.

**`docker.binds`** يربط أدلة مضيف إضافية؛ ويتم دمج الروابط العامة وروابط كل وكيل.

**المتصفح داخل sandbox** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. يتم حقن عنوان noVNC URL في مطالبة النظام. ولا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL ذا رمز قصير الأجل (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- يقوم `allowHostControl: false` (الافتراضي) بحظر الجلسات المعزولة من استهداف متصفح المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP على حافة الحاوية إلى نطاق CIDR (على سبيل المثال `172.21.0.1/32`).
- يربط `sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية متصفح sandbox فقط. وعند ضبطه (بما في ذلك `[]`) فإنه يستبدل `docker.binds` لحاوية المتصفح.
- تُعرَّف افتراضيات التشغيل في `scripts/sandbox-browser-entrypoint.sh` وهي مضبوطة لمضيفي الحاويات:
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
  - تكون الخيارات `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعلة افتراضيًا ويمكن تعطيلها عبر
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا تطلب استخدام WebGL/3D ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الامتدادات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه على `0` لاستخدام
    الحد الافتراضي لعدد العمليات في Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عندما يكون `noSandbox` مفعّلًا.
  - تمثل القيم الافتراضية خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير افتراضيات الحاوية.

</Accordion>

يكون sandboxing الخاص بالمتصفح و`sandbox.docker.binds` خاصين بـ Docker فقط.

أنشئ الصور:

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
        reasoningDefault: "on", // تجاوز مستوى إظهار reasoning لكل وكيل
        fastModeDefault: false, // تجاوز fast mode لكل وكيل
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // يتجاوز params الخاصة بـ defaults.models المطابقة حسب المفتاح
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
- `default`: عند ضبط أكثر من وكيل على هذا النحو، يفوز الأول (مع تسجيل تحذير). وإذا لم يتم ضبط أي وكيل، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: تتجاوز صيغة السلسلة `primary` فقط؛ بينما تتجاوز صيغة الكائن `{ primary, fallbacks }` كليهما (`[]` تعطل الاحتياطات العامة). وتستمر مهام Cron التي تتجاوز `primary` فقط في وراثة الاحتياطات الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات تدفق لكل وكيل يتم دمجها فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم ذلك للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `skills`: قائمة سماح Skills اختيارية لكل وكيل. وإذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ والقائمة الصريحة تستبدل القيم الافتراضية بدلًا من دمجها، بينما `[]` تعني عدم استخدام أي Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو لكل جلسة.
- `reasoningDefault`: القيمة الافتراضية الاختيارية لإظهار reasoning لكل وكيل (`on | off | stream`). وتُطبَّق عندما لا يوجد تجاوز reasoning لكل رسالة أو لكل جلسة.
- `fastModeDefault`: القيمة الافتراضية الاختيارية لـ fast mode لكل وكيل (`true | false`). وتُطبَّق عندما لا يوجد تجاوز fast-mode لكل رسالة أو لكل جلسة.
- `embeddedHarness`: تجاوز اختياري لسياسة harness منخفض المستوى لكل وكيل. استخدم `{ runtime: "codex", fallback: "none" }` لجعل وكيل واحد معتمدًا على Codex فقط بينما يحتفظ بقية الوكلاء بالاحتياط الافتراضي PI.
- `runtime`: واصف Runtime اختياري لكل وكيل. استخدم `type: "acp"` مع القيم الافتراضية لـ `runtime.acp` (`agent` و`backend` و`mode` و`cwd`) عندما ينبغي أن يستخدم الوكيل جلسات ACP harness افتراضيًا.
- `identity.avatar`: مسار نسبةً إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو URI من نوع `data:`.
- تشتق `identity` القيم الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لـ `sessions_spawn` (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حاجز وراثة sandbox: إذا كانت جلسة الطالب ضمن sandbox، فإن `sessions_spawn` يرفض الأهداف التي ستعمل من دون sandbox.
- `subagents.requireAgentId`: عندما تكون true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## التوجيه متعدد الوكلاء

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

- `type` (اختياري): `route` للتوجيه العادي (وعند غيابه يكون الافتراضي route)، أو `acp` لروابط المحادثات الدائمة الخاصة بـ ACP.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ والمحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ لـ `type: "acp"` فقط): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، من دون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يقوم OpenClaw بالتحليل حسب هوية المحادثة المطابقة تمامًا (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات route binding أعلاه.

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

راجع [sandbox والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) للحصول على تفاصيل الأسبقية.

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
    parentForkMaxTokens: 100000, // تخطَّ تفرع الخيط الأصل فوق هذا العدد من الرموز المميزة (0 يعطّل)
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
      idleHours: 24, // إلغاء التركيز التلقائي الافتراضي بعد الخمول بالساعات (`0` يعطّل)
      maxAgeHours: 0, // الحد الأقصى الافتراضي الصارم للعمر بالساعات (`0` يعطّل)
    },
    mainKey: "main", // قديم (يستخدم Runtime دائمًا "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="تفاصيل حقول الجلسة">

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات الدردشة الجماعية.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل الخاصة.
  - `main`: تشترك جميع الرسائل الخاصة في الجلسة الرئيسية.
  - `per-peer`: عزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: عزل حسب القناة + المرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: عزل حسب الحساب + القناة + المرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرّفات القياسية بالنظراء المسبوقين بالمزوّد لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. تقوم `daily` بإعادة التعيين عند `atHour` حسب التوقيت المحلي؛ وتقوم `idle` بإعادة التعيين بعد `idleMinutes`. وعندما يتم تكوين كلاهما، يفوز الذي تنتهي صلاحيته أولًا.
- **`resetByType`**: تجاوزات حسب النوع (`direct` و`group` و`thread`). ويُقبل `dm` القديم كاسم مستعار لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى لـ `totalTokens` في الجلسة الأصلية المسموح به عند إنشاء جلسة خيط متفرعة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` في الأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة خيط جديدة بدلًا من وراثة سجل النص الأصلي.
  - اضبط القيمة على `0` لتعطيل هذا الحاجز والسماح دائمًا بالتفرع من الأصل.
- **`mainKey`**: حقل قديم. يستخدم Runtime دائمًا القيمة `"main"` لسلة الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات الوكيل إلى الوكيل (عدد صحيح، المجال: `0`–`5`). تقوم `0` بتعطيل سلسلة ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم المستعار القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. ويفوز أول منع.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: تقوم `warn` بإصدار تحذيرات فقط؛ أما `enforce` فتطبّق التنظيف.
  - `pruneAfter`: حد العمر للمدخلات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد المدخلات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: يدوّر `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. وتكون افتراضيًا مساوية لـ `pruneAfter`؛ اضبطها على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية اختيارية لمساحة القرص الخاصة بدليل الجلسات. في وضع `warn` تسجل تحذيرات؛ وفي وضع `enforce` تزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. ويكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بالخيوط.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين تجاوزه؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بعد الخمول بالساعات (`0` يعطّل؛ ويمكن للمزوّدين تجاوزه)
  - `maxAgeHours`: الحد الأقصى الافتراضي الصارم للعمر بالساعات (`0` يعطّل؛ ويمكن للمزوّدين تجاوزه)

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

### بادئة الرد

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix`، و`channels.<channel>.accounts.<id>.responsePrefix`.

التحليل (الأكثر تحديدًا يفوز): الحساب → القناة → العام. تؤدي `""` إلى التعطيل وإيقاف التسلسل. وتشتق `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير            | الوصف                 | المثال                      |
| ------------------ | --------------------- | --------------------------- |
| `{model}`          | الاسم القصير للنموذج  | `claude-opus-4-6`           |
| `{modelFull}`      | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`       | اسم المزوّد           | `anthropic`                 |
| `{thinkingLevel}`  | مستوى التفكير الحالي  | `high`، `low`، `off`        |
| `{identity.name}`  | اسم هوية الوكيل       | (يماثل `"auto"`)           |

المتغيرات غير حساسة لحالة الأحرف. ويعد `{think}` اسمًا مستعارًا لـ `{thinkingLevel}`.

### تفاعل الإقرار

- تكون القيمة الافتراضية `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبطها على `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب التحليل: الحساب → القناة → `messages.ackReaction` → الاحتياط من الهوية.
- النطاق: `group-mentions` (الافتراضي)، أو `group-all`، أو `direct`، أو `all`.
- يقوم `removeAckAfterReply` بإزالة الإقرار بعد الرد في Slack وDiscord وTelegram.
- يفعّل `messages.statusReactions.enabled` تفاعلات الحالة الدورية في Slack وDiscord وTelegram.
  في Slack وDiscord، يبقي عدم الضبط تفاعلات الحالة مفعلة عندما تكون تفاعلات الإقرار نشطة.
  في Telegram، اضبطه صراحةً على `true` لتفعيل تفاعلات الحالة الدورية.

### إزالة الاهتزاز للرسائل الواردة

يجمع الرسائل النصية السريعة من المرسل نفسه في دور وكيل واحد. وتؤدي الوسائط/المرفقات إلى التفريغ فورًا. وتتجاوز أوامر التحكم إزالة الاهتزاز.

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
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، كما يعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ أما `modelOverrides.allowProvider` فتكون قيمته الافتراضية `false` (اشتراك اختياري).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يتجاوز `openai.baseUrl` نقطة نهاية OpenAI TTS. وترتيب التحليل هو: التكوين، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `openai.baseUrl` إلى نقطة نهاية غير تابعة لـ OpenAI، يتعامل OpenClaw معها على أنها خادم TTS متوافق مع OpenAI ويخفف من التحقق من النموذج/الصوت.

---

## Talk

الإعدادات الافتراضية لوضع Talk ‏(macOS/iOS/Android).

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
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- يجب أن تطابق `talk.provider` مفتاحًا في `talk.providers` عند تكوين عدة مزوّدات Talk.
- تكون مفاتيح Talk القديمة المسطحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) خاصة بالتوافق فقط، وتُنقل تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- يُطبّق الاحتياط `ELEVENLABS_API_KEY` فقط عندما لا يكون هناك مفتاح API لـ Talk مكوّن.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء ودية.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع Talk بعد صمت المستخدم قبل إرسال النص المنسوخ. وعند عدم ضبطه، يحتفظ بنافذة التوقف المؤقت الافتراضية الخاصة بالمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).

---

## ذو صلة

- [مرجع التكوين](/ar/gateway/configuration-reference) — جميع مفاتيح التكوين الأخرى
- [التكوين](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة التكوين](/ar/gateway/configuration-examples)
