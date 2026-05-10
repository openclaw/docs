---
read_when:
    - ضبط افتراضيات الوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين التوجيه والارتباطات متعددة الوكلاء
    - ضبط الجلسة وتسليم الرسائل وسلوك وضع التحدث
summary: إعدادات الوكيل الافتراضية، وتوجيه الوكلاء المتعددين، والجلسة، والرسائل، وإعدادات talk
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-05-10T19:37:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 455c4f0db2ab42b699f920f90639f18d0d370ed4f98a5fa664f154318db99a11
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح إعدادات على نطاق الوكيل ضمن `agents.*` و`multiAgent.*` و`session.*` و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات وتشغيل Gateway والمفاتيح العلوية الأخرى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكلاء

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime في موجّه النظام. إذا لم يُضبط، يكتشفه OpenClaw تلقائياً بالصعود من مساحة العمل إلى الأعلى.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية لـSkills للوكلاء الذين لا يضبطون
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

- احذف `agents.defaults.skills` للسماح غير المقيّد بـSkills افتراضياً.
- احذف `agents.list[].skills` لتوريث الإعدادات الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛ فهي
  لا تُدمج مع الإعدادات الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات تمهيد مساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

يتخطّى إنشاء ملفات مساحة العمل الاختيارية المحددة مع الاستمرار في كتابة ملفات التمهيد المطلوبة. القيم الصالحة: `SOUL.md` و`USER.md` و`HEARTBEAT.md` و`IDENTITY.md`.

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

يتحكم في وقت حقن ملفات تمهيد مساحة العمل في موجّه النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطّى دورات المتابعة الآمنة (بعد استجابة مكتملة من المساعد) إعادة حقن تمهيد مساحة العمل، مما يقلل حجم الموجّه. ما زالت تشغيلات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: عطّل تمهيد مساحة العمل وحقن ملفات السياق في كل دورة. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة الموجّه بالكامل (محركات سياق مخصصة، أو بيئات تشغيل أصلية تبني سياقها الخاص، أو مسارات عمل متخصصة بلا تمهيد). تتخطّى أيضاً دورات Heartbeat واسترداد Compaction الحقن.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف لكل ملف تمهيد مساحة عمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى لإجمالي الأحرف المحقونة عبر جميع ملفات تمهيد مساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في إشعار موجّه النظام المرئي للوكيل عندما يُقتطع سياق التمهيد.
الافتراضي: `"once"`.

- `"off"`: لا تحقن أبداً نص إشعار الاقتطاع في موجّه النظام.
- `"once"`: احقن إشعاراً موجزاً مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: احقن إشعاراً موجزاً في كل تشغيل عندما يوجد اقتطاع.

تبقى الأعداد الخام/المحقونة المفصلة وحقول ضبط الإعدادات في التشخيصات مثل
تقارير السياق/الحالة والسجلات؛ ولا يحصل سياق مستخدم/تشغيل WebChat الروتيني إلا
على إشعار الاسترداد الموجز.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات عالية الحجم للموجّه/السياق، وهي
مقسّمة عمداً حسب النظام الفرعي بدلاً من تمريرها كلها عبر
مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  تمهيد تشغيل نموذج لمرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة. أوامر الدردشة المجردة `/new` و`/reset`
  يُقرّ بها من دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في موجّه النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات تشغيل محدودة وكتل محقونة مملوكة للتشغيل.
- `memory.qmd.limits.*`:
  مقتطف بحث الذاكرة المفهرس وحجم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء التشغيل للدورة الأولى الذي يُحقن عند تشغيل النموذج بعد إعادة الضبط/بدء التشغيل.
أوامر الدردشة المجردة `/new` و`/reset` تقرّ بإعادة الضبط دون استدعاء
النموذج، لذلك لا تحمّل هذا التمهيد.

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

إعدادات افتراضية مشتركة لأسطح سياق التشغيل المحدودة.

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

- `memoryGetMaxChars`: حد مقتطف `memory_get` الافتراضي قبل إضافة
  بيانات الاقتطاع الوصفية وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة أسطر `memory_get` الافتراضية عندما يُحذف
  `lines`.
- `toolResultMaxChars`: حد نتائج الأدوات المباشرة المستخدم للنتائج المستمرة
  واسترداد الفائض.
- `postCompactionMaxChars`: حد مقتطف AGENTS.md المستخدم أثناء حقن التحديث
  بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمقابض `contextLimits` المشتركة. ترث الحقول المحذوفة
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

حد عام لقائمة Skills المضغوطة المحقونة في موجّه النظام. هذا
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

الحد الأقصى لحجم البكسل لأطول جانب في الصورة داخل كتل صور السجل/الأدوات قبل استدعاءات المزوّد.
الافتراضي: `1200`.

عادةً ما تقلل القيم الأدنى استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات الكثيفة بلقطات الشاشة.
تحافظ القيم الأعلى على مزيد من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجّه النظام (وليست طوابع وقت الرسائل). تعود إلى المنطقة الزمنية للمضيف.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في موجّه النظام. الافتراضي: `auto` (تفضيل نظام التشغيل).

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
  - يعيّن نموذج السلسلة النموذج الأساسي فقط.
  - يعيّن نموذج الكائن النموذج الأساسي إضافةً إلى نماذج تجاوز الفشل المرتّبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` كتكوين نموذج الرؤية الخاص به.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما يتعذر على النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرّفات المجرّدة للتوافق؛ إذا طابق معرّف مجرّد بشكل فريد إدخالًا مكوّنًا وقادرًا على الصور في `models.providers.*.models`، فإن OpenClaw يؤهله لذلك المزوّد. تتطلب المطابقات المكوّنة الملتبسة بادئة مزوّد صريحة.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لصور OpenAI، أو `openai/gpt-image-1.5` لمخرجات OpenAI PNG/WebP ذات الخلفية الشفافة.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فكوّن مصادقة المزوّد المطابقة أيضًا (مثلًا `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، أو `FAL_KEY` لـ `fal/*`).
  - إذا حُذف، فلا يزال بإمكان `image_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الصور المسجلين بترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الموسيقى المشتركة وأداة `music_generate` المدمجة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.6`.
  - إذا حُذف، فلا يزال بإمكان `music_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فكوّن مصادقة/مفتاح API الخاص بالمزوّد المطابق أيضًا.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الفيديو المشتركة وأداة `video_generate` المدمجة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا حُذف، فلا يزال بإمكان `video_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الفيديو المسجلين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فكوّن مصادقة/مفتاح API الخاص بالمزوّد المطابق أيضًا.
  - يدعم مزوّد توليد الفيديو Qwen المضمّن حتى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات `size` و`aspectRatio` و`resolution` و`audio` و`watermark` على مستوى المزوّد.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النماذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي المحلول.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرَّر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يضعها وضع الاستخراج الاحتياطي في الاعتبار في أداة `pdf`.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `toolProgressDetail`: وضع التفاصيل لملخصات أدوات `/verbose` وأسطر أدوات مسودة التقدم. القيم: `"explain"` (الافتراضي، تسميات بشرية مختصرة) أو `"raw"` (إلحاق الأمر/التفاصيل الخام عند توفرها). يتجاوز `agents.list[].toolProgressDetail` لكل وكيل هذا الافتراضي.
- `reasoningDefault`: رؤية الاستدلال الافتراضية للوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` لكل وكيل هذا الافتراضي. لا تُطبَّق افتراضيات الاستدلال المكوّنة إلا للمالكين، أو المرسلين المخوّلين، أو سياقات Gateway الخاصة بمشرف المشغّل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.5` للوصول عبر مفتاح API من OpenAI أو Codex OAuth). إذا حذفت المزوّد، يجرّب OpenClaw اسمًا بديلًا أولًا، ثم مطابقة مزوّد مكوّن فريدة لمعرّف النموذج الدقيق ذلك، وبعدها فقط يعود إلى المزوّد الافتراضي المكوّن (سلوك توافق مهمل، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يعرض النموذج الافتراضي المكوّن، يعود OpenClaw إلى أول مزوّد/نموذج مكوّن بدلًا من إظهار افتراضي قديم لمزوّد تمت إزالته.
- `models`: كتالوج النماذج المكوّن وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` و`chat_template_kwargs` و`extra_body`/`extraBody`).
  - استخدم إدخالات `provider/*` مثل `"openai-codex/*": {}` أو `"vllm/*": {}` لإظهار كل النماذج المكتشفة للمزوّدين المحددين دون إدراج كل معرّف نموذج يدويًا.
  - التعديلات الآمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات قائمة السماح الحالية إلا إذا مررت `--replace`.
  - تدمج تدفقات التكوين/الإعداد محددة المزوّد نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين غير المرتبطين المكوّنين مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، تُفعّل Compaction من جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [OpenAI Compaction من جانب الخادم](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على كل النماذج. تُعيّن في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (التكوين): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (معرّف الوكيل المطابق) حسب المفتاح. راجع [التخزين المؤقت للمطالبات](/ar/reference/prompt-caching) للحصول على التفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في نصوص طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلبات المولّدة، يفوز الجسم الإضافي؛ لا تزال مسارات الإكمالات غير الأصلية تزيل `store` الخاص بـ OpenAI بعد ذلك.
- `params.chat_template_kwargs`: وسائط قالب الدردشة المتوافقة مع vLLM/OpenAI تُدمج في المستوى الأعلى من نصوص طلبات `api: "openai-completions"`. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ تتجاوز `chat_template_kwargs` الصريحة الافتراضيات المولّدة، ولا يزال لـ `extra_body.chat_template_kwargs` الأسبقية النهائية. بالنسبة إلى عناصر التحكم في تفكير vLLM Qwen، عيّن `params.qwenThinkingFormat` إلى `"chat-template"` أو `"top-level"` في إدخال ذلك النموذج.
- `compat.thinkingFormat`: نمط حمولة التفكير المتوافق مع OpenAI. استخدم `"qwen"` لـ `enable_thinking` على المستوى الأعلى بأسلوب Qwen، أو `"qwen-chat-template"` لـ `chat_template_kwargs.enable_thinking` على واجهات Qwen-family الخلفية التي تدعم kwargs قالب الدردشة على مستوى الطلب، مثل vLLM. يطابق OpenClaw التفكير المعطّل إلى `false` والتفكير المفعّل إلى `true`.
- `compat.supportedReasoningEfforts`: قائمة جهود الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` لنقاط النهاية المخصصة التي تقبله حقًا؛ عندها يعرض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيحات الجلسات، والتحقق في CLI للوكيل، والتحقق من `llm-task` لذلك المزوّد/النموذج المكوّن. استخدم `compat.reasoningEffortMap` عندما تريد الواجهة الخلفية قيمة خاصة بالمزوّد لمستوى معياري.
- `params.preserveThinking`: اشتراك خاص بـ Z.AI فقط للتفكير المحفوظ. عند تفعيله وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `localService`: مدير عمليات اختياري على مستوى المزوّد لخوادم النماذج المحلية/ذاتية الاستضافة. عندما ينتمي النموذج المحدد إلى ذلك المزوّد، يفحص OpenClaw `healthUrl` (أو `baseUrl + "/models"`)، ويبدأ `command` مع `args` إذا كانت نقطة النهاية متوقفة، وينتظر حتى `readyTimeoutMs`، ثم يرسل طلب النموذج. يجب أن يكون `command` مسارًا مطلقًا. يُبقي `idleStopMs: 0` العملية قيد التشغيل حتى يخرج OpenClaw؛ توقف القيمة الموجبة العملية التي أنشأها OpenClaw بعد ذلك العدد من المللي ثواني الخاملة. راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- تنتمي سياسة وقت التشغيل إلى المزوّدين أو النماذج، لا إلى `agents.defaults`. استخدم `models.providers.<provider>.agentRuntime` للقواعد على مستوى المزوّد أو `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` للقواعد الخاصة بالنموذج. تختار نماذج وكلاء OpenAI على مزوّد OpenAI الرسمي Codex افتراضيًا.
- تحفظ كاتبات التكوين التي تغيّر هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة البدائل) صيغة الكائن المعيارية وتحافظ على قوائم البدائل الحالية عندما يكون ذلك ممكنًا.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكلاء المتوازية عبر الجلسات (تبقى كل جلسة متسلسلة). الافتراضي: 4.

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

- `id`: `"auto"` أو `"pi"` أو معرّف حزمة تشغيل Plugin مسجلة أو اسم مستعار مدعوم لواجهة CLI الخلفية. يسجل Plugin Codex المضمّن `codex`؛ ويوفر Plugin Anthropic المضمّن واجهة CLI الخلفية `claude-cli`.
- يسمح `id: "auto"` لحزم تشغيل Plugin المسجلة بالمطالبة بالدورات المدعومة ويستخدم PI عندما لا تطابق أي حزمة تشغيل. يتطلب وقت تشغيل Plugin صريح مثل `id: "codex"` تلك الحزمة ويفشل بإغلاق إذا كانت غير متاحة أو فشلت.
- مفاتيح وقت التشغيل على مستوى الوكيل بالكامل قديمة. يتم تجاهل `agents.defaults.agentRuntime` و`agents.list[].agentRuntime` وتثبيتات وقت تشغيل الجلسة و`OPENCLAW_AGENT_RUNTIME` بواسطة اختيار وقت التشغيل. شغّل `openclaw doctor --fix` لإزالة القيم القديمة.
- تستخدم نماذج وكلاء OpenAI حزمة تشغيل Codex افتراضيًا؛ يبقى `agentRuntime.id: "codex"` على مستوى المزوّد/النموذج صالحًا عندما تريد جعل ذلك صريحًا.
- بالنسبة إلى عمليات نشر Claude CLI، فضّل `model: "anthropic/claude-opus-4-7"` إضافةً إلى `agentRuntime.id: "claude-cli"` محدود النطاق بالنموذج. لا تزال مراجع النموذج القديمة `claude-cli/claude-opus-4-7` تعمل للتوافق، لكن يجب أن يحافظ التكوين الجديد على اختيار المزوّد/النموذج بصيغته المعيارية وأن يضع واجهة التنفيذ الخلفية في سياسة وقت تشغيل المزوّد/النموذج.
- يتحكم هذا فقط في تنفيذ دور وكيل النص. لا تزال توليدات الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء البديلة المدمجة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار      | النموذج                                |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

تكون للأسماء المستعارة التي ضبطتها الأولوية دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI الخيار `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضيًا عندما لا يتم ضبط مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الرجوع الاحتياطي النصية فقط (من دون استدعاءات أدوات). مفيدة كنسخة احتياطية عند فشل موفري API.

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

- واجهات CLI الخلفية نصية أولًا؛ يتم تعطيل الأدوات دائمًا.
- الجلسات مدعومة عند ضبط `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.
- يتيح `reseedFromRawTranscriptWhenUncompacted: true` للواجهة الخلفية استرداد الجلسات الآمنة
  المُبطلة من ذيل محدود لنص OpenClaw الخام قبل وجود
  أول ملخص Compaction. لا تُعاد البذرة الخام أبدًا عند تغييرات ملف تعريف المصادقة أو حقبة بيانات الاعتماد.

### `agents.defaults.systemPromptOverride`

استبدل موجه النظام الكامل الذي يجمعه OpenClaw بسلسلة ثابتة. اضبطه على مستوى القيم الافتراضية (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون لقيم الوكيل المحدد الأولوية؛ ويتم تجاهل القيمة الفارغة أو المكونة من مسافات بيضاء فقط. مفيد لتجارب الموجه المضبوطة.

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

طبقات موجه مستقلة عن الموفر تُطبَّق حسب عائلة النموذج. تتلقى معرّفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر الموفرين؛ يتحكم `personality` فقط في طبقة أسلوب التفاعل الودود.

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

- يفعّل `"friendly"` (الافتراضي) و`"on"` طبقة أسلوب التفاعل الودود.
- يعطّل `"off"` الطبقة الودودة فقط؛ يبقى عقد سلوك GPT-5 الموسوم مفعّلًا.
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

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). اضبطه على `0m` للتعطيل.
- `includeSystemPromptSection`: عند `false`، يحذف قسم Heartbeat من موجه النظام ويتخطى حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند `true`، يمنع حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل Heartbeat قبل إيقافه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/DM. يسمح `allow` (الافتراضي) بالتسليم إلى الهدف المباشر. يمنع `block` التسليم إلى الهدف المباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند `true`، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند `true`، تعمل كل Heartbeat في جلسة جديدة بلا سجل محادثات سابق. نمط العزل نفسه مثل Cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- `skipWhenBusy`: عند `true`، تؤجل تشغيلات Heartbeat عند وجود مسارات مشغولة إضافية: عمل وكيل فرعي أو أمر متداخل. تؤجل مسارات Cron دائمًا Heartbeat، حتى بدون هذه الراية.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، تعمل **تلك الوكلاء فقط** على تشغيل Heartbeat.
- تشغّل Heartbeat أدوار وكيل كاملة — الفواصل الأقصر تستهلك رموزًا أكثر.

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
- `provider`: معرّف Plugin موفر Compaction مسجل. عند ضبطه، يُستدعى `summarize()` الخاص بالموفر بدلًا من تلخيص LLM المدمج. يعود إلى المدمج عند الفشل. يؤدي ضبط موفر إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يوقفها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة قطع Pi للاحتفاظ بذيل النص الأحدث حرفيًا. يحترم `/compact` اليدوي هذا عند ضبطه صراحة؛ وإلا تكون Compaction اليدوية نقطة تحقق صارمة.
- `identifierPolicy`: `strict` (الافتراضي)، أو `off`، أو `custom`. يسبق `strict` إرشادات مدمجة للاحتفاظ بالمعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند الإخراج سيئ التنسيق لملخصات safeguard. مفعّلة افتراضيًا في وضع safeguard؛ اضبط `enabled: false` لتخطي التدقيق.
- `midTurnPrecheck`: فحص ضغط حلقة أدوات Pi اختياري. عند `enabled: true`، يتحقق OpenClaw من ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسبًا، يوقف المحاولة الحالية قبل إرسال الموجه ويعيد استخدام مسار استرداد الفحص المسبق الحالي لاقتطاع نتائج الأدوات أو إجراء Compaction وإعادة المحاولة. يعمل مع وضعي Compaction `default` و`safeguard`. الافتراضي: معطّل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية في AGENTS.md لإعادة حقنها بعد Compaction. الافتراضي هو `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. عند عدم الضبط أو الضبط الصريح على ذلك الزوج الافتراضي، تُقبل أيضًا عناوين `Every Session`/`Safety` الأقدم كبديل قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدمه عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ عند عدم الضبط، تستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: حد بايت اختياري (`number` أو سلاسل مثل `"20mb"`) يشغّل Compaction محلية عادية قبل التشغيل عندما يتجاوز ملف JSONL النشط الحد. يتطلب `truncateAfterCompaction` كي تتمكن Compaction الناجحة من التدوير إلى نص لاحق أصغر. معطّل عند عدم الضبط أو `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتمالها (مثلًا، "Compacting context..." و"Compaction complete"). معطّل افتراضيًا لإبقاء Compaction صامتة.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائية لتخزين الذكريات الدائمة. اضبط `model` على موفر/نموذج دقيق مثل `ollama/qwen3:8b` عندما ينبغي أن يبقى دور الصيانة هذا على نموذج محلي؛ لا يرث التجاوز سلسلة الرجوع الاحتياطي للجلسة النشطة. يتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يشذّب **نتائج الأدوات القديمة** من السياق في الذاكرة قبل الإرسال إلى LLM. لا يغيّر سجل الجلسة على القرص.

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
- يتحكم `ttl` في عدد مرات إمكانية تشغيل التشذيب مرة أخرى (بعد آخر لمس للذاكرة المؤقتة).
- يبدأ التشذيب باقتطاع نتائج الأدوات كبيرة الحجم اقتطاعًا خفيفًا، ثم يمسح نتائج الأدوات الأقدم مسحًا صارمًا إذا لزم الأمر.

**الاقتطاع الخفيف** يحتفظ بالبداية + النهاية ويدرج `...` في الوسط.

**المسح الصارم** يستبدل نتيجة الأداة كاملة بالعنصر النائب.

ملاحظات:

- لا يتم أبدًا اقتطاع/مسح كتل الصور.
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

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحة لتفعيل الردود الكتلية.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` (والنسخ الخاصة بكل حساب). تستخدم Signal/Slack/Discord/Google Chat القيمة الافتراضية `minChars: 1500`.
- `humanDelay`: توقف مؤقت عشوائي بين الردود الكتلية. `natural` = 800–2500ms. التجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [البث](/ar/concepts/streaming) لتفاصيل السلوك والتقسيم إلى مقاطع.

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

- القيم الافتراضية: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات غير المشار إليها.
- تجاوزات كل جلسة: `session.typingMode`، `session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

عزل اختياري للوكيل المضمن. راجع [العزل](/ar/gateway/sandboxing) للاطلاع على الدليل الكامل.

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

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: الجذر البعيد المطلق المستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يحولها OpenClaw إلى ملفات مؤقتة في وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح تحكم سياسة مفاتيح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` تتقدم على `identityFile`
- `certificateData` تتقدم على `certificateFile`
- `knownHostsData` تتقدم على `knownHostsFile`
- قيم `*Data` المدعومة بـ SecretRef تحل من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة العزل

**سلوك خلفية SSH:**

- تهيئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تبقي مساحة عمل SSH البعيدة هي المصدر المعتمد
- توجه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيا
- لا تدعم حاويات متصفح العزل

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل عزل لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل العزل في `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط في `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة/الكتابة في `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

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

- `mirror`: تهيئة البعيد من المحلي قبل التنفيذ، والمزامنة مرة أخرى بعد التنفيذ؛ تبقى مساحة العمل المحلية هي المصدر المعتمد
- `remote`: تهيئة البعيد مرة واحدة عند إنشاء العزل، ثم إبقاء مساحة العمل البعيدة هي المصدر المعتمد

في وضع `remote`، لا تزامن التعديلات المحلية على المضيف التي أجريت خارج OpenClaw إلى العزل تلقائيا بعد خطوة التهيئة.
النقل هو SSH إلى عزل OpenShell، لكن Plugin يملك دورة حياة العزل ومزامنة المرآة الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج شبكي، وجذر قابل للكتابة، ومستخدم جذر.

**تستخدم الحاويات افتراضيا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة جسر مخصصة) إذا كان الوكيل يحتاج إلى وصول خارجي.
`"host"` محظور. `"container:<id>"` محظور افتراضيا ما لم تضبط صراحة
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (إجراء طارئ).

**المرفقات الواردة** تجهز في `media/inbound/*` داخل مساحة العمل النشطة.

**`docker.binds`** يركب أدلة مضيف إضافية؛ تدمج التركيبات العامة وتركيبات كل وكيل.

**متصفح العزل** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. يحقن عنوان noVNC URL في مطالبة النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول مراقب noVNC مصادقة VNC افتراضيا، ويصدر OpenClaw عنوان URL برمز قصير العمر (بدلا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (الافتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة جسر مخصصة). اضبطها على `bridge` فقط عندما تريد صراحة اتصال الجسر العام.
- يمكن لـ `cdpSourceRange` اختياريا تقييد دخول CDP عند حافة الحاوية إلى نطاق CIDR (مثلا `172.21.0.1/32`).
- `sandbox.browser.binds` يركب أدلة مضيف إضافية داخل حاوية متصفح العزل فقط. عند ضبطه (بما في ذلك `[]`)، يستبدل `docker.binds` لحاوية المتصفح.
- تعرف إعدادات التشغيل الافتراضية في `scripts/sandbox-browser-entrypoint.sh` ومضبوطة لمضيفي الحاويات:
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
  - تكون `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعلة افتراضيا، ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبط `0` لاستخدام حد العمليات
    الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - القيم الافتراضية هي خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع نقطة دخول مخصصة
    لتغيير قيم الحاوية الافتراضية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` خاصان بـ Docker فقط.

ابن الصور (من نسخة مصدرية مسحوبة):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

لتثبيتات npm من دون نسخة مصدرية مسحوبة، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) للاطلاع على أوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح وكيل موفر TTS أو صوتا أو نموذجا أو
أسلوبا أو وضع TTS تلقائيا خاصا به. يدمج مقطع الوكيل بعمق فوق
`messages.tts` العام، بحيث يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما تتجاوز
الوكلاء الفردية حقول الصوت أو الموفر التي تحتاجها فقط. ينطبق تجاوز الوكيل النشط على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، و
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
- `default`: عند تعيين أكثر من واحد، يكون الأول هو المعتمد (مع تسجيل تحذير). إذا لم يُعيَّن أي منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: الصيغة النصية تعيّن نموذجًا أساسيًا صارمًا لكل وكيل من دون احتياطي للنموذج؛ والصيغة الكائنية `{ primary }` صارمة أيضًا ما لم تُضِف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في الاحتياط، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. مهام Cron التي تتجاوز `primary` فقط تظل ترث الاحتياطيات الافتراضية ما لم تعيّن `fallbacks: []`.
- `params`: معاملات تدفق خاصة بكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النماذج بالكامل.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. تُدمج هذه الكتلة بعمق فوق `messages.tts`، لذلك احتفظ ببيانات اعتماد المزوّد المشتركة وسياسة الاحتياط في `messages.tts`، واضبط هنا فقط القيم الخاصة بالشخصية مثل المزوّد أو الصوت أو النموذج أو الأسلوب أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية للـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ أما القائمة الصريحة فتستبدل الافتراضيات بدل دمجها، و`[]` تعني عدم استخدام Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزوّد/النموذج المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، يحافظ `adaptive` على التفكير الديناميكي المملوك للمزوّد (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: رؤية الاستدلال الافتراضية الاختيارية لكل وكيل (`on | off | stream`). تتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `fastModeDefault`: الإعداد الافتراضي الاختياري للوضع السريع لكل وكيل (`true | false`). يُطبّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `models`: تجاوزات اختيارية لكتالوج/وقت تشغيل النماذج لكل وكيل، مفهرسة بمعرّفات `provider/model` الكاملة. استخدم `models["provider/model"].agentRuntime` لاستثناءات وقت التشغيل لكل وكيل.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) عندما ينبغي أن يكون الوكيل افتراضيًا إلى جلسات عُدّة ACP.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو URI من نوع `data:`.
- `identity` يستنتج الافتراضيات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط). ضمّن معرّف الطالب عندما يجب السماح باستدعاءات `agentId` التي تستهدف نفسها.
- حارس وراثة الصندوق الرملي: إذا كانت جلسة الطالب داخل صندوق رملي، فإن `sessions_spawn` يرفض الأهداف التي ستعمل خارج الصندوق الرملي.
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

- `type` (اختياري): `route` للتوجيه العادي (النوع المفقود يُعد route افتراضيًا)، و`acp` لروابط محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ المحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، بلا نظير/نقابة/فريق)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw المطابقة حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات ربط المسار أعلاه.

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

<Accordion title="No filesystem access (messaging only)">

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

راجع [الصندوق الرملي والأدوات لمتعدد الوكلاء](/ar/tools/multi-agent-sandbox-tools) للحصول على تفاصيل الأسبقية.

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

<Accordion title="Session field details">

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات الدردشة الجماعية.
  - `per-sender` (افتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق قناة.
  - `global`: يشارك جميع المشاركين في سياق قناة جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشارك كل الرسائل المباشرة الجلسة الرئيسية.
  - `per-peer`: يعزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: يعزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: يعزل لكل حساب + قناة + مرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرّفات الأساسية بالأقران مسبوقي المزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر الإرساء مثل `/dock_discord` الخريطة نفسها لتحويل مسار رد الجلسة النشطة إلى قرين قناة مرتبط آخر؛ راجع [إرساء القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة الضبط الأساسية. يعيد `daily` الضبط عند الوقت المحلي `atHour`؛ ويعيد `idle` الضبط بعد `idleMinutes`. عند تكوينهما معًا، يفوز ما تنتهي صلاحيته أولًا. تستخدم حداثة إعادة الضبط اليومية قيمة `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة الضبط عند الخمول قيمة `lastInteractionAt`. يمكن لكتابات الخلفية/أحداث النظام مثل Heartbeat، وإيقاظات Cron، وإشعارات التنفيذ، ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تُبقي جلسات اليومية/الخمول حديثة.
- **`resetByType`**: تجاوزات لكل نوع (`direct`، `group`، `thread`). يُقبل `dm` القديم كاسم بديل لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لدورات الرد المتبادل بين الوكلاء أثناء التبادلات من وكيل إلى وكيل (عدد صحيح، النطاق: `0`–`5`). يعطّل `0` تسلسل الردود المتبادلة.
- **`sendPolicy`**: يطابق حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. أول منع يفوز.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: يصدر `warn` تحذيرات فقط؛ ويطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (افتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (افتراضي `500`). يكتب وقت التشغيل تنظيفًا دفعيًا مع هامش حد أعلى صغير للحدود المناسبة للإنتاج؛ ويطبّق `openclaw sessions cleanup --enforce` الحد فورًا.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من الإعدادات الأقدم.
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات نصوص المحادثات `*.reset.<timestamp>`. القيمة الافتراضية هي `pruneAfter`؛ اضبطه على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية اختيارية لقرص دليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم الآثار/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. القيمة الافتراضية هي `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بسلاسل المحادثة.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين التجاوز؛ يستخدم Discord ‏`channels.discord.threadBindings.enabled`)
  - `idleHours`: إزالة التركيز التلقائية الافتراضية بعد الخمول بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `spawnSessions`: بوابة افتراضية لإنشاء جلسات عمل مرتبطة بسلاسل المحادثة من `sessions_spawn` وتفريعات سلاسل ACP. تكون القيمة الافتراضية `true` عند تفعيل ارتباطات سلاسل المحادثة؛ ويمكن للمزوّدين/الحسابات التجاوز.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي للتفريعات المرتبطة بسلاسل المحادثة (`"fork"` أو `"isolated"`). القيمة الافتراضية هي `"fork"`.

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

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

الاستبانة (الأكثر تحديدًا يفوز): الحساب → القناة → العام. يعطّل `""` ويوقف التسلسل. يشتق `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف            | مثال                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر       | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد          | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`, `low`, `off`        |
| `{identity.name}` | اسم هوية الوكيل    | (مماثل لـ `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. يُعد `{think}` اسمًا بديلًا لـ `{thinkingLevel}`.

### تفاعل الإقرار

- القيمة الافتراضية هي `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبط `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الاستبانة: الحساب → القناة → `messages.ackReaction` → الرجوع إلى الهوية.
- النطاق: `group-mentions` (افتراضي)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد على القنوات القادرة على التفاعلات مثل Slack وDiscord وTelegram وWhatsApp وiMessage.
- `messages.statusReactions.enabled`: يفعّل تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  على Slack وDiscord، يؤدي عدم الضبط إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  على Telegram، اضبطه صراحةً على `true` لتفعيل تفاعلات حالة دورة الحياة.

### تأخير الوارد

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
- يتجاوز `summaryModel` القيمة `agents.defaults.model.primary` للملخص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ والقيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك اختياري).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- موفرو الكلام المضمّنون مملوكون للـ Plugin. إذا تم ضبط `plugins.allow`، فأدرج كل Plugin موفّر TTS تريد استخدامه، مثل `microsoft` من أجل Edge TTS. يُقبل معرّف المزوّد القديم `edge` كاسم بديل لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الاستبانة هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير OpenAI، يعاملها OpenClaw كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تكوين عدة موفري Talk.
- مفاتيح Talk المسطحة القديمة (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) للتوافق فقط. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية عادية أو كائنات SecretRef.
- ينطبق الرجوع إلى `ELEVENLABS_API_KEY` فقط عند عدم تكوين مفتاح API لوضع Talk.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء مألوفة.
- يحدد `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا حُذف، يستخدم macOS ‏`mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر مساعد `openclaw-mlx-tts` المضمّن عند وجوده، أو عبر ملف تنفيذي على `PATH`؛ ويتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد للتطوير.
- يتحكم `consultThinkingLevel` في مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات Control UI Talk الفورية `openclaw_agent_consult`. اتركه غير مضبوط للحفاظ على السلوك العادي للجلسة/النموذج.
- يضبط `consultFastMode` تجاوزًا لمرة واحدة لوضع السرعة لاستشارات Control UI Talk الفورية دون تغيير إعداد وضع السرعة العادي للجلسة.
- يضبط `speechLocale` معرّف لغة BCP 47 الذي يستخدمه تعرف الكلام في Talk على iOS/macOS. اتركه غير مضبوط لاستخدام القيمة الافتراضية للجهاز.
- يتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع Talk بعد صمت المستخدم قبل إرسال نص المحادثة. عند عدم ضبطه، يُبقي نافذة الإيقاف المؤقت الافتراضية للمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).
- يضيف `realtime.instructions` تعليمات نظام موجهة للمزوّد إلى موجه OpenClaw الفوري المدمج، بحيث يمكن تكوين نمط الصوت دون فقدان إرشادات `openclaw_agent_consult` الافتراضية.

---

## ذات صلة

- [مرجع التكوين](/ar/gateway/configuration-reference) — جميع مفاتيح التكوين الأخرى
- [التكوين](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة التكوين](/ar/gateway/configuration-examples)
