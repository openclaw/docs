---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين التوجيه والارتباطات متعددة الوكلاء
    - ضبط سلوك الجلسة وتسليم الرسائل ووضع التحدث
summary: إعدادات الوكيل الافتراضية، وتوجيه الوكلاء المتعددين، والجلسة، والرسائل، وتكوين المحادثة
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-05-07T13:18:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح إعدادات بنطاق الوكيل ضمن `agents.*` و`multiAgent.*` و`session.*` و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات ووقت تشغيل Gateway والمفاتيح الأخرى ذات المستوى الأعلى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## افتراضيات الوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر المستودع الاختياري المعروض في سطر وقت التشغيل ضمن موجه النظام. إذا لم يُضبط، يكتشفه OpenClaw تلقائيًا بالصعود من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة السماح الاختيارية الافتراضية للمهارات للوكلاء الذين لا يضبطون
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

- احذف `agents.defaults.skills` للسماح بمهارات غير مقيدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة الافتراضيات.
- اضبط `agents.list[].skills: []` لعدم وجود مهارات.
- قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛ فهي لا تندمج مع الافتراضيات.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات تمهيد مساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

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

يتحكم في وقت حقن ملفات تمهيد مساحة العمل في موجه النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد استجابة مساعد مكتملة) إعادة حقن تمهيد مساحة العمل، مما يقلل حجم الموجه. ما تزال عمليات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: يعطّل تمهيد مساحة العمل وحقن ملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة الموجه بالكامل (محركات سياق مخصصة، أوقات تشغيل أصلية تبني سياقها الخاص، أو مسارات عمل متخصصة بلا تمهيد). تتخطى أدوار Heartbeat واسترداد Compaction الحقن أيضًا.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى للأحرف لكل ملف تمهيد لمساحة العمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى الإجمالي للأحرف المحقونة عبر كل ملفات تمهيد مساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في إشعار موجه النظام المرئي للوكيل عند اقتطاع سياق التمهيد.
الافتراضي: `"once"`.

- `"off"`: لا تحقن نص إشعار الاقتطاع أبدًا في موجه النظام.
- `"once"`: احقن إشعارًا موجزًا مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: احقن إشعارًا موجزًا في كل تشغيل عند وجود اقتطاع.

تبقى العدادات الخام/المحقونة المفصلة وحقول ضبط الإعدادات في التشخيصات مثل تقارير السياق/الحالة والسجلات؛ ولا يحصل سياق مستخدم/وقت تشغيل WebChat الروتيني إلا على إشعار الاسترداد الموجز.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات عالية الحجم للموجه/السياق، وهي مقسمة عمدًا حسب النظام الفرعي بدلًا من تمريرها كلها عبر مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  تمهيد تشغيل النموذج لمرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات `memory/*.md` اليومية الأخيرة. تُقر أوامر الدردشة المجردة `/new` و`/reset` بإعادة الضبط دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills المدمجة المحقونة في موجه النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت التشغيل المحدودة والكتل المحقونة المملوكة لوقت التشغيل.
- `memory.qmd.limits.*`:
  حجم مقتطف بحث الذاكرة المفهرس والحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء التشغيل للدور الأول المحقون في عمليات تشغيل النموذج عند إعادة الضبط/بدء التشغيل. تقر أوامر الدردشة المجردة `/new` و`/reset` بإعادة الضبط دون استدعاء النموذج، لذلك لا تحمل هذا التمهيد.

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

الافتراضيات المشتركة لأسطح سياق وقت التشغيل المحدودة.

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

- `memoryGetMaxChars`: الحد الافتراضي لمقتطف `memory_get` قبل إضافة بيانات الاقتطاع الوصفية وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ`memory_get` عند حذف `lines`.
- `toolResultMaxChars`: حد نتائج الأدوات الحية المستخدم للنتائج المستمرة واسترداد الفائض.
- `postCompactionMaxChars`: حد مقتطف AGENTS.md المستخدم أثناء حقن التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمقابض `contextLimits` المشتركة. ترث الحقول المحذوفة من `agents.defaults.contextLimits`.

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

الحد العام لقائمة Skills المدمجة المحقونة في موجه النظام. لا يؤثر هذا في قراءة ملفات `SKILL.md` عند الطلب.

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

الحد الأقصى لحجم البكسل لأطول جانب في الصورة ضمن كتل صور النص/الأداة قبل استدعاءات المزوّد.
الافتراضي: `1200`.

تقلل القيم الأدنى عادةً استخدام رموز الرؤية وحجم حمولة الطلب في عمليات التشغيل كثيفة لقطات الشاشة.
تحافظ القيم الأعلى على تفاصيل مرئية أكثر.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجه النظام (وليس الطوابع الزمنية للرسائل). تعود إلى المنطقة الزمنية للمضيف عند عدم الضبط.

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
      },
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
  - صيغة السلسلة تعيّن النموذج الأساسي فقط.
  - صيغة الكائن تعيّن النموذج الأساسي إضافة إلى نماذج تجاوز الفشل المرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يستخدمه مسار أداة `image` بوصفه تكوين نموذج الرؤية الخاص بها.
  - يُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرّفات المجرّدة للتوافق؛ إذا طابق معرّف مجرد بشكل فريد إدخالًا مكوّنًا قادرًا على الصور في `models.providers.*.models`، فإن OpenClaw يؤهله إلى ذلك المزوّد. تتطلب المطابقات المكوّنة الملتبسة بادئة مزوّد صريحة.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، و`fal/fal-ai/flux/dev` لـ fal، و`openai/gpt-image-2` لـ OpenAI Images، أو `openai/gpt-image-1.5` لمخرجات OpenAI PNG/WebP ذات الخلفية الشفافة.
  - إذا حددت مزوّدًا/نموذجًا مباشرة، فاضبط مصادقة المزوّد المطابقة أيضًا (مثلًا `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، و`FAL_KEY` لـ `fal/*`).
  - إذا حُذف، فلا يزال بإمكان `image_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الصور المسجلين بترتيب معرف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الموسيقى المشتركة وأداة `music_generate` المضمّنة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.6`.
  - إذا حُذف، فلا يزال بإمكان `music_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرف المزوّد.
  - إذا حددت مزوّدًا/نموذجًا مباشرة، فاضبط مصادقة المزوّد/مفتاح API المطابق أيضًا.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الفيديو المشتركة وأداة `video_generate` المضمّنة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا حُذف، فلا يزال بإمكان `video_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الفيديو المسجلين بترتيب معرف المزوّد.
  - إذا حددت مزوّدًا/نموذجًا مباشرة، فاضبط مصادقة المزوّد/مفتاح API المطابق أيضًا.
  - يدعم مزوّد توليد الفيديو Qwen المضمّن ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد هي `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/الافتراضي الذي تم حله.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يأخذها وضع الاستخراج الاحتياطي في أداة `pdf` في الاعتبار.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `toolProgressDetail`: وضع التفاصيل لملخصات أداة `/verbose` وأسطر أداة مسودة التقدم. القيم: `"explain"` (افتراضي، تسميات بشرية موجزة) أو `"raw"` (إلحاق الأمر/التفاصيل الخام عند توفرها). يتجاوز `agents.list[].toolProgressDetail` الخاص بكل وكيل هذا الافتراضي.
- `reasoningDefault`: ظهور الاستدلال الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` الخاص بكل وكيل هذا الافتراضي. لا تُطبّق افتراضات الاستدلال المكوّنة إلا للمالكين، أو المرسلين المخوّلين، أو سياقات Gateway الخاصة بمسؤول المشغّل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى المخرجات المرتفعة الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` (مثل `openai/gpt-5.5` للوصول عبر مفتاح OpenAI API أو Codex OAuth). إذا حذفت المزوّد، يجرّب OpenClaw اسمًا مستعارًا أولًا، ثم مطابقة مزوّد مكوّن فريدة لمعرف النموذج الدقيق ذاك، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المكوّن (سلوك توافق مهمل، لذلك فضّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المكوّن، يعود OpenClaw إلى أول مزوّد/نموذج مكوّن بدلًا من إظهار افتراضي مزوّد قديم تمت إزالته.
- `models`: كتالوج النماذج المكوّن وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` و`chat_template_kwargs` و`extra_body`/`extraBody`).
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات قائمة السماح الحالية ما لم تمرر `--replace`.
  - تدمج تدفقات التكوين/الإعداد المحددة بنطاق المزوّد نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين غير المرتبطين المكوّنين مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، يُفعّل Compaction من جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction من جانب خادم OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معاملات المزوّد الافتراضية العامة المطبّقة على جميع النماذج. تُعيّن عند `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (التكوين): يتجاوز `agents.defaults.models["provider/model"].params` (لكل نموذج) `agents.defaults.params` (الأساس العام)، ثم يتجاوز `agents.list[].params` (معرّف الوكيل المطابق) حسب المفتاح. راجع [تخزين المحفزات مؤقتًا](/ar/reference/prompt-caching) للتفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمريري متقدم يُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلب المولّدة، يفوز الجسم الإضافي؛ ولا تزال مسارات الإكمال غير الأصلية تزيل `store` الخاص بـ OpenAI بعد ذلك.
- `params.chat_template_kwargs`: وسيطات قالب الدردشة المتوافقة مع vLLM/OpenAI تُدمج في أجسام طلبات `api: "openai-completions"` ذات المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ تتجاوز `chat_template_kwargs` الصريحة الافتراضات المولّدة، ولا يزال لـ `extra_body.chat_template_kwargs` الأسبقية النهائية. بالنسبة إلى عناصر تحكم تفكير Qwen في vLLM، عيّن `params.qwenThinkingFormat` إلى `"chat-template"` أو `"top-level"` في إدخال ذلك النموذج.
- `compat.supportedReasoningEfforts`: قائمة جهد الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` لنقاط النهاية المخصصة التي تقبله فعلًا؛ عندها يعرّض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيحات الجلسات، والتحقق من CLI للوكيل، والتحقق من `llm-task` لذلك المزوّد/النموذج المكوّن. استخدم `compat.reasoningEffortMap` عندما تتطلب الواجهة الخلفية قيمة خاصة بالمزوّد لمستوى معياري.
- `params.preserveThinking`: خيار اشتراك خاص بـ Z.AI فقط لحفظ التفكير. عند تمكينه وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: سياسة وقت تشغيل الوكيل منخفضة المستوى الافتراضية. يعيّن المعرّف المحذوف افتراضيًا إلى OpenClaw Pi. استخدم `id: "pi"` لفرض مشغّل PI المضمّن، أو `id: "auto"` للسماح لمشغّلات Plugin المسجلة بالمطالبة بالنماذج المدعومة واستخدام PI عندما لا يتطابق أي منها، أو معرّف مشغّل مسجل مثل `id: "codex"` لاشتراط ذلك المشغّل، أو اسمًا مستعارًا مدعومًا لواجهة CLI الخلفية مثل `id: "claude-cli"`. تفشل أوقات تشغيل Plugin الصريحة بشكل مغلق عندما لا يتوفر المشغّل أو يفشل. أبقِ مراجع النماذج معيارية بصيغة `provider/model`؛ اختر Codex وClaude CLI وGemini CLI وواجهات التنفيذ الخلفية الأخرى عبر تكوين وقت التشغيل بدلًا من بادئات مزوّد وقت التشغيل القديمة. راجع [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes) لمعرفة كيف يختلف هذا عن اختيار المزوّد/النموذج.
- كتّاب التكوين الذين يعدّلون هذه الحقول (مثل أوامر `/models set` و`/models set-image` وأوامر إضافة/إزالة النماذج الاحتياطية) يحفظون صيغة الكائن المعيارية ويحافظون على قوائم النماذج الاحتياطية الحالية عندما يكون ذلك ممكنًا.
- `maxConcurrent`: الحد الأقصى لعمليات تشغيل الوكلاء المتوازية عبر الجلسات (تظل كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.agentRuntime`

يتحكم `agentRuntime` في المنفّذ منخفض المستوى الذي يشغّل أدوار الوكيل. ينبغي لمعظم
عمليات النشر الاحتفاظ بوقت تشغيل OpenClaw Pi الافتراضي. استخدمه عندما يوفر
Plugin موثوق مشغّلًا أصليًا، مثل مشغّل خادم تطبيق Codex المضمّن،
أو عندما تريد واجهة CLI خلفية مدعومة مثل Claude CLI. وللنموذج الذهني،
راجع [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`، أو `"pi"`، أو معرّف مشغّل Plugin مسجل، أو اسم مستعار مدعوم لواجهة CLI خلفية. يسجل Plugin Codex المضمّن `codex`؛ ويوفر Plugin Anthropic المضمّن واجهة CLI الخلفية `claude-cli`.
- يتيح `id: "auto"` لمشغّلات Plugin المسجلة المطالبة بالأدوار المدعومة ويستخدم PI عندما لا يتطابق أي مشغّل. يتطلب وقت تشغيل Plugin صريح مثل `id: "codex"` ذلك المشغّل ويفشل بشكل مغلق إذا لم يكن متاحًا أو فشل.
- تجاوز البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` قيمة `id` لتلك العملية.
- تستخدم نماذج وكيل OpenAI مشغّل Codex افتراضيًا؛ يظل `agentRuntime.id: "codex"` صالحًا عندما تريد جعل ذلك صريحًا.
- بالنسبة إلى عمليات نشر Claude CLI، فضّل `model: "anthropic/claude-opus-4-7"` مع `agentRuntime.id: "claude-cli"`. لا تزال مراجع نموذج `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق، لكن يجب أن يحافظ التكوين الجديد على اختيار المزوّد/النموذج معياريًا ويضع واجهة التنفيذ الخلفية في `agentRuntime.id`.
- تُعاد كتابة مفاتيح سياسة وقت التشغيل الأقدم إلى `agentRuntime` بواسطة `openclaw doctor --fix`.
- يُثبّت اختيار المشغّل لكل معرّف جلسة بعد أول تشغيل مضمّن. تؤثر تغييرات التكوين/البيئة في الجلسات الجديدة أو المعاد ضبطها، وليس في نسخة نصية قائمة. تستخدم جلسات OpenAI القديمة التي لها سجل نسخ نصية لكن لا تحتوي على تثبيت مسجل Codex؛ يمكن إصلاح تثبيتات OpenAI PI القديمة باستخدام `openclaw doctor --fix`. يبلّغ `/status` عن وقت التشغيل الفعلي، مثل `Runtime: OpenClaw Pi Default` أو `Runtime: OpenAI Codex`.
- يتحكم هذا فقط في تنفيذ أدوار وكيل النص. لا يزال توليد الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS يستخدم إعدادات المزوّد/النموذج الخاصة به.

**اختصارات الأسماء المستعارة المضمّنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار       | النموذج                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

تنتصر الأسماء المستعارة التي كوّنتها دائمًا على الافتراضيات.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI الخيار `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضيًا عند عدم ضبط مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI الخلفية الاختيارية للتشغيلات الاحتياطية النصية فقط (دون استدعاءات أدوات). مفيدة كخطة احتياطية عند فشل موفري API.

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

- واجهات CLI الخلفية تبدأ بالنص؛ تكون الأدوات معطلة دائمًا.
- الجلسات مدعومة عند ضبط `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل مطالبة النظام الكاملة التي جمعها OpenClaw بسلسلة ثابتة. اضبطها على مستوى الافتراضيات (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون لقيم كل وكيل أولوية؛ ويتم تجاهل القيمة الفارغة أو المكوّنة من مسافات بيضاء فقط. مفيد لتجارب المطالبات المضبوطة.

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

تراكبات مطالبات مستقلة عن الموفّر تُطبّق حسب عائلة النموذج. تتلقى معرفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر الموفّرين؛ يتحكم `personality` فقط في طبقة أسلوب التفاعل الودّي.

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

- يفعّل `"friendly"` (الافتراضي) و`"on"` طبقة أسلوب التفاعل الودّي.
- يعطّل `"off"` الطبقة الودّية فقط؛ ويبقى عقد سلوك GPT-5 الموسوم مفعّلًا.
- لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ عندما لا يكون هذا الإعداد المشترك مضبوطًا.

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
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
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

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). اضبطه على `0m` للتعطيل.
- `includeSystemPromptSection`: عند ضبطه على false، يحذف قسم Heartbeat من مطالبة النظام ويتخطى حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند ضبطه على true، يمنع حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدورة وكيل Heartbeat قبل إجهاضها. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/DM. يسمح `allow` (الافتراضي) بالتسليم إلى الهدف المباشر. يمنع `block` التسليم إلى الهدف المباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند ضبطه على true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيف الوزن وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند ضبطه على true، يعمل كل Heartbeat في جلسة جديدة دون سجل محادثة سابق. نمط العزل نفسه مثل Cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- `skipWhenBusy`: عند ضبطه على true، تؤجل تشغيلات Heartbeat على مسارات انشغال إضافية: عمل الوكيل الفرعي أو الأوامر المتداخلة. تؤجل مسارات Cron دائمًا Heartbeats، حتى من دون هذه العلامة.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، تعمل **هذه الوكلاء فقط** على Heartbeats.
- تنفّذ Heartbeats دورات وكيل كاملة — الفواصل الأقصر تستهلك رموزًا أكثر.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
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

- `mode`: `default` أو `safeguard` (تلخيص مجزأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرف Plugin موفّر Compaction مسجل. عند ضبطه، يُستدعى `summarize()` الخاص بالموفّر بدل تلخيص LLM المدمج. يعود إلى المدمج عند الفشل. يفرض ضبط موفّر `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يجهضها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة القطع في Pi للاحتفاظ بذيل النص الأخير حرفيًا. يلتزم `/compact` اليدوي بهذا عند ضبطه صراحة؛ وإلا فإن Compaction اليدوي نقطة تحقق صارمة.
- `identifierPolicy`: `strict` (الافتراضي)، أو `off`، أو `custom`. يضيف `strict` إرشادات مدمجة للاحتفاظ بالمعرّفات المعتمة في بداية تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند المخرجات المشوهة لملخصات الحماية. مفعّلة افتراضيًا في وضع الحماية؛ اضبط `enabled: false` لتخطي التدقيق.
- `midTurnPrecheck`: فحص اختياري لضغط حلقة أدوات Pi. عند `enabled: true`، يفحص OpenClaw ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق يتسع، يجهض المحاولة الحالية قبل إرسال المطالبة ويعيد استخدام مسار استرداد الفحص المسبق الحالي لاقتطاع نتائج الأدوات أو إجراء Compaction وإعادة المحاولة. يعمل مع وضعي Compaction، `default` و`safeguard`. الافتراضي: معطل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية في AGENTS.md لإعادة حقنها بعد Compaction. الافتراضي هو `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. عند عدم الضبط أو الضبط صراحة على هذا الزوج الافتراضي، تُقبل أيضًا عناوين `Every Session`/`Safety` القديمة كخطة رجوع قديمة.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما ينبغي للجلسة الرئيسية أن تبقى على نموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ عند عدم الضبط، يستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: عتبة بايت اختيارية (`number` أو سلاسل مثل `"20mb"`) تُشغّل Compaction المحلي العادي قبل التشغيل عندما يتجاوز JSONL النشط العتبة. يتطلب `truncateAfterCompaction` حتى يتمكن Compaction الناجح من التدوير إلى نص لاحق أصغر. معطل عند عدم الضبط أو عند `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثلًا، "ضغط السياق..." و"اكتمل Compaction"). معطل افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دورة وكيل صامتة قبل Compaction التلقائي لتخزين الذكريات الدائمة. اضبط `model` على موفّر/نموذج دقيق مثل `ollama/qwen3:8b` عندما ينبغي أن تبقى دورة الصيانة هذه على نموذج محلي؛ لا يرث التجاوز سلسلة الرجوع للجلسة النشطة. يتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقلّم **نتائج الأدوات القديمة** من السياق داخل الذاكرة قبل الإرسال إلى LLM. لا يعدّل سجل الجلسة على القرص.

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

<Accordion title="سلوك وضع cache-ttl">

- يفعّل `mode: "cache-ttl"` تمريرات التقليم.
- يتحكم `ttl` في مدى تكرار إمكانية تشغيل التقليم مرة أخرى (بعد آخر لمس لذاكرة التخزين المؤقت).
- يبدأ التقليم باقتطاع نتائج الأدوات الضخمة اقتطاعًا لينًا، ثم يمسح نتائج الأدوات الأقدم مسحًا صارمًا إذا لزم الأمر.

**الاقتطاع اللين** يحتفظ بالبداية + النهاية ويدرِج `...` في الوسط.

**المسح الصارم** يستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا يتم أبدًا اقتطاع/مسح كتل الصور.
- النسب مبنية على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا كان هناك عدد أقل من رسائل المساعد من `keepLastAssistants`، يتم تخطي التقليم.

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

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحة لتفعيل الردود الكتلية.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات لكل حساب). تكون قيمة Signal/Slack/Discord/Google Chat الافتراضية `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود الكتلية. `natural` = 800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [البث](/ar/concepts/streaming) لتفاصيل السلوك + التجزئة.

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

- القيم الافتراضية: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات التي لا تتضمن إشارة.
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
- `ssh`: وقت تشغيل بعيد عام مدعوم بـ SSH
- `openshell`: وقت تشغيل OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعدادات خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (افتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يحولها OpenClaw إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: عناصر ضبط سياسة مفاتيح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` يتغلب على `identityFile`
- `certificateData` يتغلب على `certificateFile`
- `knownHostsData` يتغلب على `knownHostsFile`
- تُحل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة العزل

**سلوك خلفية SSH:**

- تهيئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تُبقي مساحة عمل SSH البعيدة هي المرجعية
- تمرر `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة تلقائيًا مرة أخرى إلى المضيف
- لا تدعم حاويات متصفح العزل

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل عزل لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل العزل عند `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (افتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (بدون عزل بين الجلسات)

**إعدادات Plugin لـ OpenShell:**

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

- `mirror`: تهيئة البعيد من المحلي قبل التنفيذ، والمزامنة مرة أخرى بعد التنفيذ؛ تبقى مساحة العمل المحلية هي المرجعية
- `remote`: تهيئة البعيد مرة واحدة عند إنشاء العزل، ثم إبقاء مساحة العمل البعيدة هي المرجعية

في وضع `remote`، لا تُزامن التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw تلقائيًا إلى العزل بعد خطوة التهيئة.
النقل يتم عبر SSH إلى عزل OpenShell، لكن Plugin يملك دورة حياة العزل ومزامنة النسخ الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج للشبكة، وجذر قابل للكتابة، ومستخدم root.

**تستخدم الحاويات افتراضيًا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
`"host"` محظور. `"container:<id>"` محظور افتراضيًا إلا إذا ضبطت صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (إجراء طارئ).

**المرفقات الواردة** تُجهز في `media/inbound/*` داخل مساحة العمل النشطة.

**`docker.binds`** يركب أدلة مضيف إضافية؛ وتُدمج عمليات الربط العامة والخاصة بكل وكيل.

**متصفح معزول** (`sandbox.browser.enabled`): Chromium + CDP في حاوية. يُحقن عنوان URL لـ noVNC في موجه النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول مراقب noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL برمز قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (افتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- `network` افتراضيًا هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- `cdpSourceRange` يقيّد اختياريًا دخول CDP عند طرف الحاوية إلى نطاق CIDR (مثل `172.21.0.1/32`).
- `sandbox.browser.binds` يركب أدلة مضيف إضافية داخل حاوية متصفح العزل فقط. عند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- تُعرّف افتراضيات التشغيل في `scripts/sandbox-browser-entrypoint.sh` وتُضبط لمضيفي الحاويات:
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
  - `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعّلة افتراضيًا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` يعيد تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبط `0` لاستخدام حد العمليات
    الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - الافتراضيات هي خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع نقطة دخول مخصصة
    لتغيير افتراضيات الحاوية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` خاصان بـ Docker فقط.

بناء الصور (من نسخة مصدر محلية):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

لتثبيتات npm بدون نسخة مصدر محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) للحصول على أوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح وكيل مزود TTS أو صوتًا أو نموذجًا أو
نمطًا أو وضع TTS تلقائيًا خاصًا به. تُدمج كتلة الوكيل بعمق فوق
`messages.tts` العام، لذا يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما يتجاوز الوكلاء
الفرادي فقط حقول الصوت أو المزود التي يحتاجون إليها. ينطبق تجاوز الوكيل النشط
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
        agentRuntime: { id: "auto" },
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

- `id`: معرّف وكيل مستقر (مطلوب).
- `default`: عند تعيين عدة قيم، تفوز الأولى (يُسجَّل تحذير). إذا لم تُعيَّن أي قيمة، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: الصيغة النصية تعيّن نموذجًا أساسيًا صارمًا لكل وكيل من دون رجوع احتياطي للنموذج؛ وصيغة الكائن `{ primary }` تكون صارمة أيضًا ما لم تضف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في الرجوع الاحتياطي، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. مهام Cron التي تتجاوز `primary` فقط تظل ترث الرجوع الاحتياطي الافتراضي ما لم تضبط `fallbacks: []`.
- `params`: معاملات تدفق لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النماذج بالكامل.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. تُدمج الكتلة بعمق فوق `messages.tts`، لذلك أبقِ بيانات اعتماد المزود المشتركة وسياسة الرجوع الاحتياطي في `messages.tts` واضبط هنا فقط القيم الخاصة بالشخصية مثل المزود أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية للمهارات لكل وكيل. إذا أُغفلت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ والقائمة الصريحة تستبدل الافتراضيات بدل دمجها، وتعني `[]` عدم وجود مهارات.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عند عدم تعيين تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزود/النموذج المحدد في القيم الصالحة؛ وبالنسبة إلى Google Gemini، تُبقي `adaptive` التفكير الديناميكي المملوك للمزود (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: رؤية الاستدلال الافتراضية الاختيارية لكل وكيل (`on | off | stream`). تتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عند عدم تعيين تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: القيمة الافتراضية الاختيارية للوضع السريع لكل وكيل (`true | false`). تُطبّق عند عدم تعيين تجاوز للوضع السريع لكل رسالة أو جلسة.
- `agentRuntime`: تجاوز اختياري لسياسة وقت التشغيل منخفضة المستوى لكل وكيل. استخدم `{ id: "codex" }` لجعل وكيل واحد مقتصرًا على Codex بينما يحتفظ الوكلاء الآخرون برجوع Pi الاحتياطي الافتراضي في وضع `auto`.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) عندما ينبغي أن يتجه الوكيل افتراضيًا إلى جلسات حزام ACP.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو معرّف URI من نوع `data:`.
- `identity` يشتق الافتراضيات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح بمعرّفات الوكلاء لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي؛ الافتراضي: الوكيل نفسه فقط). ضمّن معرّف الطالب عندما ينبغي السماح باستدعاءات `agentId` التي تستهدف نفسها.
- حاجز وراثة البيئة المعزولة: إذا كانت جلسة الطالب معزولة، يرفض `sessions_spawn` الأهداف التي ستعمل من دون عزل.
- `subagents.requireAgentId`: عندما تكون true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف التعريف صراحة؛ الافتراضي: false).

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

- `type` (اختياري): `route` للتوجيه العادي (يكون النوع المفقود افتراضيًا route)، و`acp` لربوط محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ المحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (تطابق تام، من دون ند/نقابة/فريق)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw الربط حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات ربط المسار أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="وصول كامل (من دون بيئة معزولة)">

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

<Accordion title="بلا وصول إلى نظام الملفات (للمراسلة فقط)">

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

راجع [أدوات وصندوق عزل الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة تفاصيل الأسبقية.

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

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات محادثات المجموعات.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يشارك جميع المشاركين في سياق القناة جلسة واحدة (استخدمه فقط عند قصد مشاركة السياق).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشارك كل الرسائل المباشرة الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: يربط المعرّفات القانونية بالنظراء ذوي بادئة المزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر الربط مثل `/dock_discord` الخريطة نفسها لتحويل مسار رد الجلسة النشطة إلى نظير قناة مرتبط آخر؛ راجع [ربط القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة الضبط الأساسية. يعيد `daily` الضبط عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` الضبط بعد `idleMinutes`. عند تكوين الاثنين، يفوز أيهما تنتهي مدته أولًا. تستخدم حداثة إعادة الضبط اليومية قيمة `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة الضبط بسبب الخمول `lastInteractionAt`. يمكن لعمليات الكتابة في الخلفية/أحداث النظام مثل Heartbeat، وتنبيهات Cron، وإشعارات التنفيذ، ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تُبقي الجلسات اليومية/الخاملة حديثة.
- **`resetByType`**: تجاوزات حسب النوع (`direct`، و`group`، و`thread`). يُقبل `dm` القديم كاسم بديل لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية المحادثة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لجولات الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`–`5`). يعطّل `0` التسلسل المتبادل.
- **`sendPolicy`**: المطابقة حسب `channel`، أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`)، أو `keyPrefix`، أو `rawKeyPrefix`. أول رفض يفوز.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات والاحتفاظ بها.
  - `mode`: يصدر `warn` تحذيرات فقط؛ ويطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات الراكدة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفًا دُفعيًا مع هامش صغير مرتفع المستوى للحدود المناسبة للإنتاج؛ ويطبّق `openclaw sessions cleanup --enforce` الحد فورًا.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من التكوينات الأقدم.
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. تكون افتراضيًا `pruneAfter`؛ اضبطها على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية اختيارية لمساحة قرص دليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم الآثار/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. يكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بالخيوط.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين تجاوزه؛ يستخدم Discord‏ `channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بعد الخمول بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `spawnSessions`: بوابة افتراضية لإنشاء جلسات عمل مرتبطة بالخيوط من `sessions_spawn` وعمليات إنشاء خيوط ACP. تكون افتراضيًا `true` عند تمكين ربط الخيوط؛ ويمكن للمزوّدين/الحسابات التجاوز.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي لعمليات الإنشاء المرتبطة بالخيوط (`"fork"` أو `"isolated"`). يكون افتراضيًا `"fork"`.

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

### بادئة الاستجابة

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

الحل (الأكثر تحديدًا هو الذي يفوز): الحساب → القناة → العام. `""` يعطّل ويوقف التسلسل. `"auto"` يستخرج `[{identity.name}]`.

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

- الإعداد الافتراضي هو `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبطه على `""` لتعطيله.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → احتياطي الهوية.
- النطاق: `group-mentions` (افتراضي)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد في القنوات القادرة على التفاعلات مثل Slack وDiscord وTelegram وWhatsApp وBlueBubbles.
- `messages.statusReactions.enabled`: يفعّل تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  على Slack وDiscord، يؤدي تركه غير مضبوط إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  على Telegram، اضبطه صراحة على `true` لتفعيل تفاعلات حالة دورة الحياة.

### تأخير الرسائل الواردة

يجمع الرسائل النصية السريعة فقط من المرسل نفسه في دورة وكيل واحدة. تؤدي الوسائط/المرفقات إلى الإرسال فورًا. تتجاوز أوامر التحكم التأخير.

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
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (يتطلب الاشتراك).
- تعود مفاتيح API احتياطيًا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- مزوّدو الكلام المضمّنون مملوكون لـ Plugin. إذا كان `plugins.allow` مضبوطًا، فأدرج Plugin مزوّد TTS الذي تريد استخدامه لكل مزوّد، على سبيل المثال `microsoft` لـ Edge TTS. يُقبل معرّف المزوّد القديم `edge` كاسم مستعار لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير OpenAI، يتعامل OpenClaw معها كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## التحدث

الإعدادات الافتراضية لوضع التحدث (macOS/iOS/Android).

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تكوين عدة مزوّدين للتحدث.
- مفاتيح التحدث المسطحة القديمة (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) مخصّصة للتوافق فقط. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت احتياطيًا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نص عادي أو كائنات SecretRef.
- ينطبق احتياطي `ELEVENLABS_API_KEY` فقط عند عدم تكوين مفتاح API للتحدث.
- يتيح `providers.*.voiceAliases` لتوجيهات التحدث استخدام أسماء مألوفة.
- يحدد `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا حُذف، يستخدم macOS `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر مساعد `openclaw-mlx-tts` المضمّن عند وجوده، أو عبر ملف تنفيذي على `PATH`؛ يتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد للتطوير.
- يضبط `speechLocale` معرّف اللغة المحلية BCP 47 المستخدم من خلال تعرّف الكلام في وضع التحدث على iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع التحدث بعد صمت المستخدم قبل إرسال النص المنسوخ. يؤدي تركه غير مضبوط إلى إبقاء نافذة الإيقاف المؤقت الافتراضية للمنصة (`700 ms on macOS and Android, 900 ms on iOS`).

---

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — جميع مفاتيح الإعدادات الأخرى
- [الإعدادات](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
