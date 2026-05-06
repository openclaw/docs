---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين التوجيه والارتباطات متعددة الوكلاء
    - ضبط سلوك الجلسة وتسليم الرسائل ووضع التحدث
summary: إعدادات الوكيل الافتراضية، وتوجيه الوكلاء المتعددين، والجلسة، والرسائل، وإعدادات التحدث
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-05-06T17:56:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0467260ad61f3d2a0b52cd952154d617a9341a588cdeda38f54bfae5985fa4f
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح التهيئة المحددة النطاق للوكيل ضمن `agents.*` و`multiAgent.*` و`session.*`
و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات ووقت تشغيل Gateway والمفاتيح
الأخرى ذات المستوى الأعلى، راجع [مرجع التهيئة](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكلاء

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime ضمن موجه النظام. إذا لم يُعيّن، يكتشفه OpenClaw تلقائيًا بالانتقال صعودًا من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية للـ Skills للوكلاء الذين لا يعيّنون
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

- احذف `agents.defaults.skills` لإتاحة Skills غير مقيدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
- عيّن `agents.list[].skills: []` لعدم إتاحة أي Skills.
- القائمة غير الفارغة `agents.list[].skills` هي المجموعة النهائية لذلك الوكيل؛ فهي
  لا تدمج مع الإعدادات الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات تمهيد مساحة العمل (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`).

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

- `"continuation-skip"`: أدوار المتابعة الآمنة (بعد استجابة مكتملة من المساعد) تتخطى إعادة حقن تمهيد مساحة العمل، مما يقلل حجم الموجه. لا تزال تشغيلات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: تعطيل تمهيد مساحة العمل وحقن ملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة الموجه بالكامل (محركات سياق مخصصة، أو أوقات تشغيل أصلية تبني سياقها الخاص، أو تدفقات عمل متخصصة بلا تمهيد). تتخطى أيضًا أدوار Heartbeat واسترداد Compaction الحقن.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى للأحرف لكل ملف تمهيد مساحة عمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى الإجمالي للأحرف المحقونة عبر جميع ملفات تمهيد مساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في الإشعار الظاهر للوكيل في موجه النظام عند اقتطاع سياق التمهيد.
الافتراضي: `"once"`.

- `"off"`: لا تحقن نص إشعار الاقتطاع مطلقًا في موجه النظام.
- `"once"`: احقن إشعارًا موجزًا مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: احقن إشعارًا موجزًا في كل تشغيل عند وجود اقتطاع.

تبقى الأعداد الخام/المحقونة التفصيلية وحقول ضبط التهيئة في التشخيصات مثل
تقارير حالة/سياق والسجلات؛ ولا يحصل سياق مستخدم/وقت تشغيل WebChat الروتيني إلا
على إشعار الاسترداد الموجز.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يمتلك OpenClaw عدة ميزانيات كبيرة الحجم للموجه/السياق، وهي
مقسمة عمدًا حسب النظام الفرعي بدلًا من تدفقها كلها عبر
مفتاح عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  تمهيد مسبق لمرة واحدة لتشغيل النموذج عند إعادة الضبط/بدء التشغيل، بما يشمل ملفات
  `memory/*.md` اليومية الحديثة. تتم الاستجابة لأوامر الدردشة المجردة `/new` و`/reset`
  دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills المدمجة المحقونة في موجه النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل محقونة مملوكة لوقت التشغيل.
- `memory.qmd.limits.*`:
  مقتطف البحث في الذاكرة المفهرس وحجم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء التشغيل للدور الأول المحقون عند تشغيلات النموذج بعد إعادة الضبط/بدء التشغيل.
تقر أوامر الدردشة المجردة `/new` و`/reset` بإعادة الضبط دون استدعاء
النموذج، ولذلك لا تحمّل هذا التمهيد.

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
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: سقف مقتطف `memory_get` الافتراضي قبل إضافة
  بيانات الاقتطاع الوصفية وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة أسطر `memory_get` الافتراضية عند حذف `lines`.
- `toolResultMaxChars`: سقف نتائج الأدوات الحية المستخدم للنتائج المستمرة
  واسترداد الفائض.
- `postCompactionMaxChars`: سقف مقتطف AGENTS.md المستخدم أثناء حقن
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

سقف عام لقائمة Skills المدمجة المحقونة في موجه النظام. هذا
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

أقصى حجم بالبكسل لأطول جانب في الصورة داخل كتل صور النص/الأدوات قبل استدعاءات المزوّد.
الافتراضي: `1200`.

تقلل القيم الأدنى عادةً استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات كثيفة لقطات الشاشة.
تحافظ القيم الأعلى على مزيد من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجه النظام (وليس الطوابع الزمنية للرسائل). ترجع إلى المنطقة الزمنية للمضيف عند عدم توفرها.

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

- `model`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - صيغة السلسلة النصية تضبط النموذج الأساسي فقط.
  - صيغة الكائن تضبط النموذج الأساسي بالإضافة إلى نماذج تجاوز الفشل المرتبة.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يستخدمه مسار أداة `image` كإعداد نموذج الرؤية الخاص به.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرّفات المجردة للتوافق؛ إذا طابق معرّف مجرد بشكل فريد إدخالًا مهيأ قادرًا على الصور في `models.providers.*.models`، فإن OpenClaw يؤهله إلى ذلك المزوّد. تتطلب المطابقات المهيأة الملتبسة بادئة مزوّد صريحة.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، و`fal/fal-ai/flux/dev` لـ fal، و`openai/gpt-image-2` لـ OpenAI Images، أو `openai/gpt-image-1.5` لمخرجات OpenAI بصيغة PNG/WebP ذات الخلفية الشفافة.
  - إذا حددت مزوّدًا/نموذجًا مباشرةً، فهيئ مصادقة المزوّد المطابقة أيضًا (مثلًا `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، و`FAL_KEY` لـ `fal/*`).
  - إذا تُرك، لا يزال بإمكان `image_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الصور المسجلين بترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الموسيقى المشتركة وأداة `music_generate` المضمنة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.6`.
  - إذا تُرك، لا يزال بإمكان `music_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّف المزوّد.
  - إذا حددت مزوّدًا/نموذجًا مباشرةً، فهيئ مصادقة المزوّد/مفتاح API المطابق أيضًا.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الفيديو المشتركة وأداة `video_generate` المضمنة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا تُرك، لا يزال بإمكان `video_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الفيديو المسجلين بترتيب معرّف المزوّد.
  - إذا حددت مزوّدًا/نموذجًا مباشرةً، فهيئ مصادقة المزوّد/مفتاح API المطابق أيضًا.
  - يدعم مزوّد توليد فيديو Qwen المضمن ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات `size` و`aspectRatio` و`resolution` و`audio` و`watermark` على مستوى المزوّد.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه أداة `pdf` لتوجيه النموذج.
  - إذا تُرك، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي المحلول.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يأخذها وضع الاستخراج الاحتياطي في أداة `pdf` في الحسبان.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `toolProgressDetail`: وضع التفاصيل لملخصات أدوات `/verbose` وأسطر أدوات مسودة التقدم. القيم: `"explain"` (الافتراضي، تسميات بشرية موجزة) أو `"raw"` (إلحاق الأمر/التفصيل الخام عند توفره). يتجاوز `agents.list[].toolProgressDetail` الخاص بكل وكيل هذا الافتراضي.
- `reasoningDefault`: الرؤية الافتراضية للاستدلال للوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` الخاص بكل وكيل هذا الافتراضي. لا تُطبق افتراضيات الاستدلال المهيأة إلا للمالكين أو المرسلين المصرح لهم أو سياقات Gateway لمسؤول المشغل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.5` للوصول عبر مفتاح API أو `openai-codex/gpt-5.5` لـ Codex OAuth). إذا حذفت المزوّد، يحاول OpenClaw استخدام اسم مستعار أولًا، ثم مطابقة مزوّد مهيأ فريدة لمعرّف النموذج الدقيق ذاك، وبعدها فقط يعود إلى المزوّد الافتراضي المهيأ (سلوك توافق مهمل، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يعرض النموذج الافتراضي المهيأ، يعود OpenClaw إلى أول مزوّد/نموذج مهيأ بدلًا من إظهار افتراضي قديم لمزوّد مُزال.
- `models`: كتالوج النماذج المهيأ وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` و`chat_template_kwargs` و`extra_body`/`extraBody`).
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات قائمة السماح الموجودة ما لم تمرر `--replace`.
  - تدمج تدفقات التهيئة/الإعداد المحددة بنطاق المزوّد نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين غير المرتبطين المهيئين مسبقًا.
  - في نماذج OpenAI Responses المباشرة، يُفعّل Compaction من جهة الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction من جهة خادم OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على كل النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (الإعداد): يتم تجاوز `agents.defaults.params` (القاعدة العامة) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (معرّف الوكيل المطابق) حسب المفتاح. راجع [تخزين المطالبات مؤقتًا](/ar/reference/prompt-caching) للتفاصيل.
- `params.extra_body`/`params.extraBody`: JSON متقدم يُمرر كما هو ويُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلب المنشأة، ينتصر الجسم الإضافي؛ لا تزال مسارات completions غير الأصلية تزيل `store` الخاص بـ OpenAI بعد ذلك.
- `params.chat_template_kwargs`: وسائط قالب الدردشة المتوافقة مع vLLM/OpenAI تُدمج في أجسام طلبات `api: "openai-completions"` على المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ تتجاوز `chat_template_kwargs` الصريحة الافتراضيات المنشأة، وتظل `extra_body.chat_template_kwargs` صاحبة الأسبقية النهائية. لعناصر تحكم التفكير في vLLM Qwen، اضبط `params.qwenThinkingFormat` على `"chat-template"` أو `"top-level"` في إدخال ذلك النموذج.
- `compat.supportedReasoningEfforts`: قائمة جهود الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` لنقاط النهاية المخصصة التي تقبله فعلًا؛ عندها يعرض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيح الجلسة، والتحقق من CLI للوكيل، والتحقق من `llm-task` لذلك المزوّد/النموذج المهيأ. استخدم `compat.reasoningEffortMap` عندما يريد الخلفية قيمة خاصة بالمزوّد لمستوى قياسي.
- `params.preserveThinking`: اشتراك خاص بـ Z.AI للتفكير المحفوظ. عند تفعيله وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: سياسة وقت تشغيل الوكيل منخفضة المستوى الافتراضية. المعرّف المحذوف يعود افتراضيًا إلى OpenClaw Pi. استخدم `id: "pi"` لفرض حزام PI المضمن، أو `id: "auto"` للسماح لأحزمة Plugin المسجلة بالمطالبة بالنماذج المدعومة واستخدام PI عندما لا توجد مطابقة، أو معرّف حزام مسجل مثل `id: "codex"` لاشتراط ذلك الحزام، أو اسمًا مستعارًا لخلفية CLI مدعومة مثل `id: "claude-cli"`. تفشل أوقات تشغيل Plugin الصريحة بإغلاق عند عدم توفر الحزام أو فشله. أبق مراجع النماذج قياسية بصيغة `provider/model`؛ اختر Codex وClaude CLI وGemini CLI وخلفيات التنفيذ الأخرى من خلال إعداد وقت التشغيل بدل بادئات مزوّد وقت التشغيل القديمة. راجع [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) لمعرفة اختلاف ذلك عن اختيار المزوّد/النموذج.
- كتاب الإعدادات الذين يغيرون هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطي) يحفظون صيغة الكائن القياسية ويحافظون على قوائم الاحتياط الموجودة عند الإمكان.
- `maxConcurrent`: الحد الأقصى لتشغيل الوكلاء المتوازي عبر الجلسات (مع بقاء كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.agentRuntime`

يتحكم `agentRuntime` في المنفذ منخفض المستوى الذي يشغل دورات الوكيل. ينبغي لمعظم
عمليات النشر الإبقاء على وقت تشغيل OpenClaw Pi الافتراضي. استخدمه عندما يوفر
Plugin موثوق حزامًا أصليًا، مثل حزام خادم تطبيق Codex المضمن،
أو عندما تريد خلفية CLI مدعومة مثل Claude CLI. للنموذج الذهني،
راجع [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes).

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

- `id`: `"auto"` أو `"pi"` أو معرّف حزام Plugin مسجل، أو اسم مستعار لخلفية CLI مدعومة. يسجل Plugin Codex المضمن `codex`؛ ويوفر Plugin Anthropic المضمن خلفية CLI باسم `claude-cli`.
- يسمح `id: "auto"` لأحزمة Plugin المسجلة بالمطالبة بالدورات المدعومة ويستخدم PI عندما لا يطابق أي حزام. يتطلب وقت تشغيل Plugin صريح مثل `id: "codex"` ذلك الحزام ويفشل بإغلاق إذا كان غير متاح أو فشل.
- تجاوز البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` قيمة `id` لتلك العملية.
- لعمليات نشر Codex فقط، اضبط `model: "openai/gpt-5.5"` و`agentRuntime.id: "codex"`.
- لعمليات نشر Claude CLI، فضّل `model: "anthropic/claude-opus-4-7"` بالإضافة إلى `agentRuntime.id: "claude-cli"`. لا تزال مراجع نموذج `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق، لكن ينبغي للإعداد الجديد إبقاء اختيار المزوّد/النموذج قياسيًا ووضع خلفية التنفيذ في `agentRuntime.id`.
- تُعاد كتابة مفاتيح سياسة وقت التشغيل الأقدم إلى `agentRuntime` بواسطة `openclaw doctor --fix`.
- يُثبّت اختيار الحزام لكل معرّف جلسة بعد أول تشغيل مضمّن. تؤثر تغييرات الإعداد/البيئة في الجلسات الجديدة أو المعاد ضبطها، لا في نص جلسة موجود. تُعامل الجلسات القديمة التي لها سجل نصي من دون تثبيت مسجل كأنها مثبتة على PI. يعرض `/status` وقت التشغيل الفعلي، مثل `Runtime: OpenClaw Pi Default` أو `Runtime: OpenAI Codex`.
- يتحكم هذا فقط في تنفيذ دورات وكيل النص. لا تزال عمليات توليد الوسائط والرؤية وPDF والموسيقى والفيديو وTTS تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار      | النموذج                                    |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

الأسماء المستعارة التي هيأتها تنتصر دائمًا على الافتراضيات.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضيًا عندما لا يتم ضبط مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الرجوع النصية فقط (بلا استدعاءات أدوات). مفيدة كاحتياط عندما يفشل مزوّدو API.

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

- واجهات CLI الخلفية تعطي الأولوية للنص؛ وتكون الأدوات معطّلة دائمًا.
- الجلسات مدعومة عند ضبط `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل موجه النظام الكامل الذي يجمّعه OpenClaw بسلسلة ثابتة. اضبطه على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون قيم الوكيل المحدد ذات أسبقية؛ ويتم تجاهل القيمة الفارغة أو المكوّنة من مسافات بيضاء فقط. مفيد لتجارب الموجهات المضبوطة.

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

تراكبات موجهات مستقلة عن المزوّد تُطبّق حسب عائلة النموذج. تتلقى معرّفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر المزوّدين؛ ويتحكم `personality` فقط في طبقة أسلوب التفاعل الودّي.

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

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). اضبطها على `0m` للتعطيل.
- `includeSystemPromptSection`: عند كونها false، تحذف قسم Heartbeat من موجه النظام وتتخطى حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند كونها true، تكتم حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: أقصى وقت بالثواني مسموح به لدورة وكيل Heartbeat قبل إجهاضها. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/DM. يسمح `allow` (الافتراضي) بالتسليم إلى هدف مباشر. يكتم `block` التسليم إلى هدف مباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند كونها true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند كونها true، يعمل كل Heartbeat في جلسة جديدة بلا سجل محادثة سابق. نمط العزل نفسه مثل cron `sessionTarget: "isolated"`. يخفض تكلفة الرموز لكل Heartbeat من نحو 100 ألف إلى نحو 2-5 آلاف رمز.
- `skipWhenBusy`: عند كونها true، تؤجّل تشغيلات Heartbeat عند وجود مسارات مشغولة إضافية: عمل وكيل فرعي أو أمر متداخل. تؤجّل مسارات Cron نبضات Heartbeat دائمًا، حتى من دون هذه العلامة.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، تشغّل **تلك الوكلاء فقط** نبضات Heartbeat.
- تشغّل Heartbeats دورات وكيل كاملة — الفواصل الأقصر تستهلك رموزًا أكثر.

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

- `mode`: `default` أو `safeguard` (تلخيص مجزّأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزوّد Compaction مسجّل. عند ضبطه، يتم استدعاء `summarize()` الخاص بالمزوّد بدل تلخيص LLM المدمج. يعود إلى المدمج عند الفشل. يفرض ضبط مزوّد `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: أقصى عدد ثوانٍ مسموح به لعملية Compaction واحدة قبل أن يجهضها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة قطع Pi للاحتفاظ بذيل النص الأخير حرفيًا. يلتزم `/compact` اليدوي بذلك عند ضبطه صراحة؛ وإلا يكون Compaction اليدوي نقطة تحقق صارمة.
- `identifierPolicy`: `strict` (الافتراضي)، أو `off`، أو `custom`. يضيف `strict` في البداية إرشادات مدمجة للاحتفاظ بالمعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري لحفظ المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `qualityGuard`: فحوص إعادة المحاولة عند المخرجات غير سليمة البنية لملخصات safeguard. مفعّلة افتراضيًا في وضع safeguard؛ اضبط `enabled: false` لتخطي التدقيق.
- `midTurnPrecheck`: فحص اختياري لضغط حلقة أدوات Pi. عند `enabled: true`، يتحقق OpenClaw من ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسبًا، فإنه يجهض المحاولة الحالية قبل إرسال الموجه ويعيد استخدام مسار استرداد الفحص المسبق القائم لاقتطاع نتائج الأدوات أو إجراء Compaction ثم إعادة المحاولة. يعمل مع وضعي Compaction `default` و`safeguard`. الافتراضي: معطّل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية في AGENTS.md لإعادة حقنها بعد Compaction. الافتراضي هو `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. عندما تكون غير مضبوطة أو مضبوطة صراحة على هذا الزوج الافتراضي، تُقبل أيضًا عناوين `Every Session`/`Safety` الأقدم كمسار رجوع قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدمه عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم ضبطه، يستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: حد اختياري بالبايت (`number` أو سلاسل مثل `"20mb"`) يفعّل Compaction محليًا عاديًا قبل التشغيل عندما يتجاوز JSONL النشط هذا الحد. يتطلب `truncateAfterCompaction` حتى يستطيع Compaction الناجح الدوران إلى نص لاحق أصغر. معطّل عند عدم ضبطه أو عند `0`.
- `notifyUser`: عند كونها `true`، ترسل إشعارات مختصرة إلى المستخدم عند بدء Compaction وعند اكتماله (على سبيل المثال، "جارٍ ضغط السياق..." و"اكتمل Compaction"). معطّل افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دورة وكيل صامتة قبل Compaction التلقائي لتخزين الذكريات الدائمة. اضبط `model` على مزوّد/نموذج دقيق مثل `ollama/qwen3:8b` عندما يجب أن تبقى دورة الصيانة هذه على نموذج محلي؛ ولا يرث التجاوز سلسلة الرجوع للجلسة النشطة. يتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

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

<Accordion title="سلوك وضع cache-ttl">

- يفعّل `mode: "cache-ttl"` تمريرات التشذيب.
- يتحكم `ttl` في مدى تكرار إمكانية تشغيل التشذيب مرة أخرى (بعد آخر لمس لذاكرة التخزين المؤقت).
- يشذّب التشذيب نتائج الأدوات كبيرة الحجم تشذيبًا ناعمًا أولًا، ثم يمسح نتائج الأدوات الأقدم مسحًا صارمًا عند الحاجة.

يحافظ **التشذيب الناعم** على البداية + النهاية ويدرج `...` في الوسط.

يستبدل **المسح الصارم** نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا يتم أبدًا تشذيب/مسح كتل الصور.
- النسب مبنية على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا وُجدت رسائل مساعد أقل من `keepLastAssistants`، يتم تخطي التشذيب.

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

- تتطلب القنوات غير Telegram ضبطًا صريحًا لـ `*.blockStreaming: true` لتفعيل ردود الكتل.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات كل حساب). الافتراضي في Signal/Slack/Discord/Google Chat هو `minChars: 1500`.
- `humanDelay`: إيقاف مؤقت عشوائي بين ردود الكتل. `natural` = 800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

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

- الإعدادات الافتراضية: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات التي لا تحتوي على إشارة.
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

- `docker`: وقت تشغيل Docker المحلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم بـ SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**تكوين خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: الجذر البعيد المطلق المستخدم لمساحات العمل حسب النطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يجسّدها OpenClaw في ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: خيارات ضبط سياسة مفاتيح المضيف في OpenSSH

**أولوية مصادقة SSH:**

- `identityData` تكون لها الأولوية على `identityFile`
- `certificateData` تكون لها الأولوية على `certificateFile`
- `knownHostsData` تكون لها الأولوية على `knownHostsFile`
- قيم `*Data` المدعومة بـ SecretRef تُحلّ من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة العزل

**سلوك خلفية SSH:**

- تهيّئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تبقي مساحة عمل SSH البعيدة هي المصدر المعتمد
- توجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة عائدًا إلى المضيف تلقائيًا
- لا تدعم حاويات متصفح العزل

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل عزل حسب النطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل العزل عند `/workspace`، ومساحة عمل الوكيل مركّبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركّبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (دون عزل بين الجلسات)

**تكوين OpenShell Plugin:**

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

- `mirror`: يهيّئ البعيد من المحلي قبل exec، ويزامن عائدًا بعد exec؛ تبقى مساحة العمل المحلية هي المصدر المعتمد
- `remote`: يهيّئ البعيد مرة واحدة عند إنشاء العزل، ثم يبقي مساحة العمل البعيدة هي المصدر المعتمد

في وضع `remote`، لا تُزامَن التعديلات المحلية على المضيف التي تتم خارج OpenClaw إلى العزل تلقائيًا بعد خطوة التهيئة الأولية.
النقل يتم عبر SSH إلى عزل OpenShell، لكن Plugin يملك دورة حياة العزل ومزامنة المرآة الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يتطلب خروجًا إلى الشبكة وجذرًا قابلًا للكتابة ومستخدم root.

**تستخدم الحاويات افتراضيًا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة جسر مخصصة) إذا احتاج الوكيل إلى وصول صادر.
`"host"` محظور. `"container:<id>"` محظور افتراضيًا ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (خيار طوارئ).

**المرفقات الواردة** تُحضَّر في `media/inbound/*` داخل مساحة العمل النشطة.

**`docker.binds`** يركّب أدلة مضيف إضافية؛ تُدمج عمليات الربط العامة وتلك الخاصة بكل وكيل.

**المتصفح المعزول** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. يُحقن عنوان URL الخاص بـ noVNC في موجه النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
وصول المراقب عبر noVNC يستخدم مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL برمز قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (الافتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- `network` تكون افتراضيًا `openclaw-sandbox-browser` (شبكة جسر مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصالًا عبر الجسر العام.
- `cdpSourceRange` يقيّد اختياريًا دخول CDP عند حد الحاوية إلى نطاق CIDR (مثل `172.21.0.1/32`).
- `sandbox.browser.binds` يركّب أدلة مضيف إضافية داخل حاوية متصفح العزل فقط. عند ضبطه (بما في ذلك `[]`)، يستبدل `docker.binds` لحاوية المتصفح.
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
  - `--disable-3d-apis`، و`--disable-software-rasterizer`، و`--disable-gpu`
    مفعّلة افتراضيًا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` يعيد تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبط `0` لاستخدام حد العمليات
    الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - الإعدادات الافتراضية هي خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    نقطة دخول مخصصة لتغيير إعدادات الحاوية الافتراضية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` خاصان بـ Docker فقط.

بناء الصور (من نسخة مصدر محلية):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

لتثبيتات npm دون نسخة مصدر محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) للاطلاع على أوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح الوكيل مزوّد TTS أو صوتًا أو نموذجًا أو
نمطًا أو وضع TTS تلقائيًا خاصًا به. يندمج مقطع الوكيل دمجًا عميقًا فوق
`messages.tts` العام، بحيث يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما
يتجاوز الوكلاء الأفراد حقول الصوت أو المزوّد التي يحتاجونها فقط. ينطبق تجاوز الوكيل
النشط على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، وأداة الوكيل
`tts`. راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
لأمثلة المزوّدين وترتيب الأولوية.

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

- `id`: معرّف وكيل ثابت (مطلوب).
- `default`: عند ضبط عدة عناصر، يفوز الأول (ويُسجَّل تحذير). إذا لم يُضبط أي منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: الصيغة النصية تضبط نموذجًا أساسيًا صارمًا لكل وكيل بلا fallback للنموذج؛ وصيغة الكائن `{ primary }` صارمة أيضًا ما لم تُضِف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في fallback، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. مهام Cron التي تتجاوز `primary` فقط تظل ترث fallback الافتراضي ما لم تضبط `fallbacks: []`.
- `params`: معاملات بث لكل وكيل تُدمَج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النماذج بالكامل.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. تُدمَج الكتلة بعمق فوق `messages.tts`، لذا احتفظ باعتمادات المزوّد المشتركة وسياسة fallback في `messages.tts` واضبط هنا فقط القيم الخاصة بالشخصية مثل المزوّد أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ وتستبدل القائمة الصريحة الافتراضيات بدل دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزوّد/النموذج المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، يحافظ `adaptive` على التفكير الديناميكي المملوك للمزوّد (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: ظهور الاستدلال الافتراضي الاختياري لكل وكيل (`on | off | stream`). يتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عندما لا يكون هناك تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: الإعداد الافتراضي الاختياري للوضع السريع لكل وكيل (`true | false`). يُطبَّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `agentRuntime`: تجاوز اختياري لسياسة وقت التشغيل منخفضة المستوى لكل وكيل. استخدم `{ id: "codex" }` لجعل وكيل واحد مقتصرًا على Codex بينما تحتفظ الوكلاء الآخرون بـ fallback الافتراضي إلى PI في وضع `auto`.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) عندما يجب أن يكون الوكيل افتراضيًا لجلسات حاضنة ACP.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو URI بنمط `data:`.
- تستمد `identity` الافتراضيات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط). أدرج معرّف الطالب عندما يجب السماح باستدعاءات `agentId` التي تستهدف نفسها.
- حارس وراثة sandbox: إذا كانت جلسة الطالب ضمن sandbox، يرفض `sessions_spawn` الأهداف التي ستعمل من دون sandbox.
- `subagents.requireAgentId`: عند true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## توجيه الوكلاء المتعددين

شغّل عدة وكلاء معزولين داخل Gateway واحد. راجع [الوكلاء المتعددون](/ar/concepts/multi-agent).

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

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، بلا peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw المطابقة حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات ربط التوجيه أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="وصول كامل (بلا sandbox)">

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
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق قناة.
  - `global`: يشارك جميع المشاركين في سياق قناة جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل الخاصة.
  - `main`: تشترك كل الرسائل الخاصة في الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرّفات الأساسية بالأقران مسبوقي المزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر الإرساء مثل `/dock_discord` الخريطة نفسها لتبديل مسار رد الجلسة النشطة إلى قرين قناة مرتبط آخر؛ راجع [إرساء القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة الضبط الأساسية. يعيد `daily` الضبط عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` الضبط بعد `idleMinutes`. عند تهيئة كليهما، يفوز أيهما تنتهي مدته أولًا. تستخدم حداثة إعادة الضبط اليومية قيمة `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة الضبط عند الخمول `lastInteractionAt`. يمكن لعمليات الكتابة في الخلفية/أحداث النظام مثل Heartbeat، واستيقاظات Cron، وإشعارات exec، ومسك سجلات Gateway أن تحدّث `updatedAt`، لكنها لا تُبقي جلسات daily/idle حديثة.
- **`resetByType`**: تجاوزات لكل نوع (`direct`، `group`، `thread`). يُقبل `dm` القديم كاسم بديل لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية المحادثة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لدورات الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`–`5`). تعطل القيمة `0` تسلسل ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel`، أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`)، أو `keyPrefix`، أو `rawKeyPrefix`. أول رفض يفوز.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات والاحتفاظ بها.
  - `mode`: يصدر `warn` تحذيرات فقط؛ يطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفًا دفعيًا مع مخزن مؤقت صغير للحد الأعلى للسقوف بحجم الإنتاج؛ يطبق `openclaw sessions cleanup --enforce` السقف فورًا.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من التهيئات الأقدم.
  - `resetArchiveRetention`: الاحتفاظ بأرشيفات نصوص المحادثات `*.reset.<timestamp>`. القيمة الافتراضية هي `pruneAfter`؛ اضبطه على `false` لتعطيله.
  - `maxDiskBytes`: ميزانية اختيارية لمساحة قرص دليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. القيمة الافتراضية هي `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بسلاسل المحادثات.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين تجاوزه؛ يستخدم Discord `channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي عند عدم النشاط بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `spawnSessions`: البوابة الافتراضية لإنشاء جلسات عمل مرتبطة بسلاسل المحادثات من `sessions_spawn` وعمليات إنشاء سلاسل ACP. القيمة الافتراضية هي `true` عندما تكون روابط سلاسل المحادثات مفعّلة؛ ويمكن للمزوّدين/الحسابات التجاوز.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي لعمليات الإنشاء المرتبطة بسلاسل المحادثات (`"fork"` أو `"isolated"`). القيمة الافتراضية هي `"fork"`.

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

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix`، و`channels.<channel>.accounts.<id>.responsePrefix`.

الدقة (الأكثر تحديدًا يفوز): الحساب ← القناة ← العام. يعطّل `""` ذلك ويوقف التسلسل. يستنتج `"auto"` القيمة من `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف            | مثال                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر       | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد          | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`, `low`, `off`        |
| `{identity.name}` | اسم هوية الوكيل    | (نفس `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. `{think}` اسم مستعار لـ `{thinkingLevel}`.

### تفاعل الإقرار

- يكون الافتراضي هو `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبطه على `""` لتعطيله.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction`، و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الدقة: الحساب ← القناة ← `messages.ackReaction` ← احتياطي الهوية.
- النطاق: `group-mentions` (افتراضي)، و`group-all`، و`direct`، و`all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد في القنوات التي تدعم التفاعلات مثل Slack وDiscord وTelegram وWhatsApp وBlueBubbles.
- `messages.statusReactions.enabled`: يفعّل تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  في Slack وDiscord، يؤدي تركه غير مضبوط إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  في Telegram، اضبطه صراحةً على `true` لتفعيل تفاعلات حالة دورة الحياة.

### إزالة ارتداد الوارد

يجمع الرسائل النصية السريعة فقط من المرسل نفسه في دور وكيل واحد. تؤدي الوسائط/المرفقات إلى الإرسال فورًا. تتجاوز أوامر التحكم إزالة الارتداد.

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. يمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعالة.
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اختياري بالتفعيل).
- تعود مفاتيح API احتياطيًا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- مزوّدو الكلام المضمّنون مملوكون للـ Plugin. إذا كان `plugins.allow` مضبوطًا، فأدرج كل Plugin لمزوّد TTS تريد استخدامه، على سبيل المثال `microsoft` لـ Edge TTS. يُقبل معرّف المزوّد القديم `edge` كاسم مستعار لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الدقة هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تكوين عدة مزوّدي Talk.
- مفاتيح Talk المسطحة القديمة (`talk.voiceId`، و`talk.voiceAliases`، و`talk.modelId`، و`talk.outputFormat`، و`talk.apiKey`) للتوافق فقط. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت احتياطيًا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نص عادي أو كائنات SecretRef.
- لا ينطبق احتياطي `ELEVENLABS_API_KEY` إلا عندما لا يكون أي مفتاح API لـ Talk مكوّنًا.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء مألوفة.
- يحدد `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا حُذف، يستخدم macOS `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر مساعد `openclaw-mlx-tts` المضمّن عند وجوده، أو عبر ملف قابل للتنفيذ على `PATH`؛ ويتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد للتطوير.
- يضبط `speechLocale` معرّف لغة BCP 47 الذي يستخدمه تعرف الكلام في Talk على iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع Talk بعد صمت المستخدم قبل إرسال النص المنسوخ. يؤدي تركه غير مضبوط إلى إبقاء نافذة التوقف الافتراضية للمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).

---

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — جميع مفاتيح الإعدادات الأخرى
- [الإعدادات](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
