---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين التوجيه والارتباطات للوكلاء المتعددين
    - ضبط سلوك الجلسة وتسليم الرسائل ووضع التحدث
summary: الإعدادات الافتراضية للوكيل، والتوجيه متعدد الوكلاء، والجلسة، والرسائل، وتكوين talk
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-05-12T12:51:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 517aec30ff6c65a269c7e5c8baefb5dc371dabe52d4c38a47a41cae1a1a785e1
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح التكوين المحددة بنطاق الوكيل ضمن `agents.*` و`multiAgent.*` و`session.*`،
و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات ووقت تشغيل Gateway والمفاتيح
العليا الأخرى، راجع [مرجع التكوين](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكلاء

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يُعرض في سطر Runtime ضمن موجه النظام. إذا لم يُضبط، يكتشفه OpenClaw تلقائيًا بالانتقال صعودًا من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية للـ Skills للوكلاء الذين لا يضبطون
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
- اضبط `agents.list[].skills: []` لعدم إتاحة Skills.
- قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛ فهي
  لا تُدمج مع الإعدادات الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات تهيئة مساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

يتخطى إنشاء ملفات مساحة العمل الاختيارية المحددة مع الاستمرار في كتابة ملفات التهيئة المطلوبة. القيم الصالحة: `SOUL.md` و`USER.md` و`HEARTBEAT.md` و`IDENTITY.md`.

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

يتحكم في وقت حقن ملفات تهيئة مساحة العمل في موجه النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد اكتمال رد المساعد) إعادة حقن تهيئة مساحة العمل، مما يقلل حجم الموجه. ما تزال تشغيلات Heartbeat ومحاولات ما بعد Compaction تعيد بناء السياق.
- `"never"`: يعطّل حقن تهيئة مساحة العمل وملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة الموجه بالكامل (محركات سياق مخصصة، أو أوقات تشغيل أصلية تبني سياقها بنفسها، أو مسارات عمل متخصصة بلا تهيئة). تتخطى أدوار Heartbeat واسترداد Compaction الحقن أيضًا.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف لكل ملف تهيئة لمساحة العمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

إجمالي الحد الأقصى للأحرف المحقونة عبر كل ملفات تهيئة مساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في إشعار موجه النظام المرئي للوكيل عند اقتطاع سياق التهيئة.
الافتراضي: `"once"`.

- `"off"`: لا تحقن نص إشعار الاقتطاع في موجه النظام أبدًا.
- `"once"`: احقن إشعارًا موجزًا مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: احقن إشعارًا موجزًا في كل تشغيل عند وجود اقتطاع.

تبقى العدادات الخام/المحقونة التفصيلية وحقول ضبط التكوين في التشخيصات مثل
تقارير السياق/الحالة والسجلات؛ ولا يحصل سياق مستخدم/وقت تشغيل WebChat الروتيني إلا
على إشعار الاسترداد الموجز.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات موجه/سياق عالية الحجم، وهي مقسمة عمدًا حسب النظام
الفرعي بدلًا من مرورها كلها عبر مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تهيئة مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  مقدمة تشغيل نموذج لمرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة. يجري الإقرار بأوامر المحادثة المجردة
  `/new` و`/reset` دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في موجه النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل محقونة مملوكة لوقت التشغيل.
- `memory.qmd.limits.*`:
  مقتطف بحث الذاكرة المفهرس وتحديد حجم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في مقدمة بدء التشغيل للدور الأول المحقونة عند تشغيلات النموذج لإعادة الضبط/بدء التشغيل.
تقر أوامر المحادثة المجردة `/new` و`/reset` بإعادة الضبط دون استدعاء
النموذج، لذلك لا تحمّل هذه المقدمة.

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
- `postCompactionMaxChars`: سقف مقتطف AGENTS.md المستخدم أثناء حقن تحديث ما بعد Compaction.

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

سقف عام لقائمة Skills المضغوطة المحقونة في موجه النظام. لا يؤثر هذا
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

الحجم الأقصى بالبكسل لأطول جانب في الصورة ضمن كتل صور النص/الأداة قبل استدعاءات المزوّد.
الافتراضي: `1200`.

عادةً ما تقلل القيم الأقل استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات كثيفة لقطات الشاشة.
تحافظ القيم الأعلى على مزيد من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجه النظام (وليست الطوابع الزمنية للرسائل). تعود إلى المنطقة الزمنية للمضيف عند عدم الضبط.

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
  - يعيّن شكل الكائن النموذج الأساسي إضافةً إلى نماذج تجاوز الفشل المرتبة.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يستخدمه مسار أداة `image` كتكوين نموذج الرؤية الخاص به.
  - يُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرفات المجردة للتوافق؛ إذا طابق معرف مجرد بشكل فريد إدخالًا مكوّنًا يدعم الصور في `models.providers.*.models`، يؤهله OpenClaw لذلك المزود. تتطلب المطابقات المكوّنة الملتبسة بادئة مزود صريحة.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه إمكانية توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد الصور.
  - القيم المعتادة: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لـ OpenAI Images، أو `openai/gpt-image-1.5` لإخراج OpenAI PNG/WebP بخلفية شفافة.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فكوّن أيضًا مصادقة المزود المطابقة (مثلًا `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، أو `FAL_KEY` لـ `fal/*`).
  - إذا حُذف، لا يزال بإمكان `image_generate` استنتاج مزود افتراضي مدعوم بالمصادقة. يحاول المزود الافتراضي الحالي أولًا، ثم بقية مزودي توليد الصور المسجلين بترتيب معرف المزود.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه إمكانية توليد الموسيقى المشتركة وأداة `music_generate` المضمّنة.
  - القيم المعتادة: `google/lyria-3-clip-preview`، أو `google/lyria-3-pro-preview`، أو `minimax/music-2.6`.
  - إذا حُذف، لا يزال بإمكان `music_generate` استنتاج مزود افتراضي مدعوم بالمصادقة. يحاول المزود الافتراضي الحالي أولًا، ثم بقية مزودي توليد الموسيقى المسجلين بترتيب معرف المزود.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فكوّن أيضًا مصادقة المزود/مفتاح API المطابق.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه إمكانية توليد الفيديو المشتركة وأداة `video_generate` المضمّنة.
  - القيم المعتادة: `qwen/wan2.6-t2v`، أو `qwen/wan2.6-i2v`، أو `qwen/wan2.6-r2v`، أو `qwen/wan2.6-r2v-flash`، أو `qwen/wan2.7-r2v`.
  - إذا حُذف، لا يزال بإمكان `video_generate` استنتاج مزود افتراضي مدعوم بالمصادقة. يحاول المزود الافتراضي الحالي أولًا، ثم بقية مزودي توليد الفيديو المسجلين بترتيب معرف المزود.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فكوّن أيضًا مصادقة المزود/مفتاح API المطابق.
  - يدعم مزود توليد الفيديو Qwen المضمّن ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات `size` و`aspectRatio` و`resolution` و`audio` و`watermark` على مستوى المزود.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه أداة `pdf` لتوجيه النماذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي المحلول.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يأخذها وضع الرجوع الاحتياطي للاستخراج في أداة `pdf` بالحسبان.
- `verboseDefault`: مستوى التفصيل الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `toolProgressDetail`: وضع التفصيل لملخصات أداة `/verbose` وأسطر أداة مسودة التقدم. القيم: `"explain"` (الافتراضي، تسميات بشرية موجزة) أو `"raw"` (إلحاق الأمر/التفصيل الخام عند توفره). يتجاوز `agents.list[].toolProgressDetail` لكل وكيل هذا الافتراضي.
- `reasoningDefault`: رؤية الاستدلال الافتراضية للوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` لكل وكيل هذا الافتراضي. لا تُطبّق افتراضيات الاستدلال المكوّنة إلا للمالكين أو المرسلين المصرح لهم أو سياقات Gateway الخاصة بمسؤول المشغل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` (مثل `openai/gpt-5.5` للوصول عبر مفتاح API لـ OpenAI أو Codex OAuth). إذا حذفت المزود، يحاول OpenClaw اسمًا مستعارًا أولًا، ثم مطابقة مزود مكوّن فريدة لذلك المعرف الدقيق للنموذج، وبعدها فقط يعود إلى المزود الافتراضي المكوّن (سلوك توافق مهمل، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك المزود يعرّض النموذج الافتراضي المكوّن، يعود OpenClaw إلى أول مزود/نموذج مكوّن بدلًا من عرض افتراضي قديم لمزود مُزال.
- `models`: كتالوج النماذج المكوّن وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزود، مثل `temperature`، و`maxTokens`، و`cacheRetention`، و`context1m`، و`responsesServerCompaction`، و`responsesCompactThreshold`، و`chat_template_kwargs`، و`extra_body`/`extraBody`).
  - استخدم إدخالات `provider/*` مثل `"openai-codex/*": {}` أو `"vllm/*": {}` لإظهار كل النماذج المكتشفة للمزودين المحددين دون سرد كل معرف نموذج يدويًا.
  - التعديلات الآمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات قائمة سماح موجودة ما لم تمرر `--replace`.
  - تدمج تدفقات التكوين/التهيئة المحددة بنطاق المزود نماذج المزود المحددة في هذه الخريطة وتحافظ على المزودين غير المرتبطين المكوّنين مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، يتم تمكين Compaction من جهة الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction من جهة الخادم في OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزود الافتراضية العامة المطبقة على كل النماذج. تُعيّن عند `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (التكوين): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (معرف الوكيل المطابق) حسب المفتاح. راجع [التخزين المؤقت للمطالبة](/ar/reference/prompt-caching) للتفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمريري متقدم يُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلب المولدة، يفوز الجسم الإضافي؛ ولا تزال مسارات الإكمال غير الأصلية تزيل `store` الخاصة بـ OpenAI فقط بعد ذلك.
- `params.chat_template_kwargs`: وسائط قالب المحادثة المتوافقة مع vLLM/OpenAI تُدمج في أجسام طلبات `api: "openai-completions"` ذات المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ تتجاوز `chat_template_kwargs` الصريحة الافتراضيات المولدة، ويظل لـ `extra_body.chat_template_kwargs` الأسبقية النهائية. لعناصر تحكم التفكير في vLLM Qwen، عيّن `params.qwenThinkingFormat` إلى `"chat-template"` أو `"top-level"` في إدخال ذلك النموذج.
- `compat.thinkingFormat`: نمط حمولة التفكير المتوافق مع OpenAI. استخدم `"qwen"` لـ `enable_thinking` ذي المستوى الأعلى بنمط Qwen، أو `"qwen-chat-template"` لـ `chat_template_kwargs.enable_thinking` على خلفيات عائلة Qwen التي تدعم kwargs لقالب المحادثة على مستوى الطلب، مثل vLLM. يربط OpenClaw التفكير المعطل بـ `false` والتفكير الممكّن بـ `true`.
- `compat.supportedReasoningEfforts`: قائمة جهد الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` لنقاط النهاية المخصصة التي تقبله فعلًا؛ عندها يعرّض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيحات الجلسة، والتحقق من CLI الوكيل، والتحقق من `llm-task` لذلك المزود/النموذج المكوّن. استخدم `compat.reasoningEffortMap` عندما تريد الخلفية قيمة خاصة بالمزود لمستوى قياسي.
- `params.preserveThinking`: اشتراك خاص بـ Z.AI فقط للتفكير المحفوظ. عند تمكينه وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `localService`: مدير عمليات اختياري على مستوى المزود لخوادم النماذج المحلية/ذاتية الاستضافة. عندما ينتمي النموذج المحدد إلى ذلك المزود، يفحص OpenClaw `healthUrl` (أو `baseUrl + "/models"`)، ويبدأ `command` مع `args` إذا كانت نقطة النهاية معطلة، وينتظر حتى `readyTimeoutMs`، ثم يرسل طلب النموذج. يجب أن يكون `command` مسارًا مطلقًا. يبقي `idleStopMs: 0` العملية حية حتى خروج OpenClaw؛ توقف القيمة الموجبة العملية التي أنشأها OpenClaw بعد ذلك العدد من ميلي ثانية الخمول. راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- تنتمي سياسة وقت التشغيل إلى المزودين أو النماذج، وليس إلى `agents.defaults`. استخدم `models.providers.<provider>.agentRuntime` لقواعد على مستوى المزود أو `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` لقواعد خاصة بالنموذج. تختار نماذج وكلاء OpenAI على مزود OpenAI الرسمي Codex افتراضيًا.
- تحفظ كاتبات التكوين التي تغيّر هذه الحقول (مثل أوامر `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطيات) شكل الكائن القياسي وتحافظ على قوائم الاحتياطيات الموجودة عند الإمكان.
- `maxConcurrent`: الحد الأقصى لعمليات تشغيل الوكلاء المتوازية عبر الجلسات (تظل كل جلسة متسلسلة). الافتراضي: 4.

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

- `id`: `"auto"`، أو `"pi"`، أو معرف حاضنة Plugin مسجل، أو اسم مستعار مدعوم لخلفية CLI. يسجل Plugin Codex المضمّن `codex`؛ ويوفر Plugin Anthropic المضمّن خلفية CLI باسم `claude-cli`.
- يتيح `id: "auto"` لحاضنات Plugin المسجلة المطالبة بالدورات المدعومة ويستخدم PI عندما لا توجد حاضنة مطابقة. يتطلب وقت تشغيل Plugin صريح مثل `id: "codex"` تلك الحاضنة ويفشل بشكل مغلق إذا كانت غير متاحة أو فشلت.
- مفاتيح وقت التشغيل على مستوى الوكيل بأكمله قديمة. يتم تجاهل `agents.defaults.agentRuntime` و`agents.list[].agentRuntime` ودبابيس وقت تشغيل الجلسة و`OPENCLAW_AGENT_RUNTIME` عند اختيار وقت التشغيل. شغّل `openclaw doctor --fix` لإزالة القيم القديمة.
- تستخدم نماذج وكلاء OpenAI حاضنة Codex افتراضيًا؛ يظل `agentRuntime.id: "codex"` على مستوى المزود/النموذج صالحًا عندما تريد جعل ذلك صريحًا.
- لنشرات Claude CLI، فضّل `model: "anthropic/claude-opus-4-7"` مع `agentRuntime.id: "claude-cli"` محدد بنطاق النموذج. لا تزال مراجع نموذج `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق، لكن ينبغي للتكوين الجديد إبقاء اختيار المزود/النموذج قياسيًا ووضع خلفية التنفيذ في سياسة وقت تشغيل المزود/النموذج.
- يتحكم هذا فقط في تنفيذ دور وكيل النص. لا تزال عمليات توليد الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS تستخدم إعدادات المزود/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمّنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار       | النموذج                                |
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
تفعّل نماذج Z.AI خيار `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 وضع التفكير `adaptive` افتراضيًا عند عدم تعيين مستوى تفكير صريح.

### `agents.defaults.cliBackends`

خلفيات CLI اختيارية لتشغيلات الرجوع النصية فقط (بلا استدعاءات أدوات). مفيدة كنسخة احتياطية عند فشل مزوّدي API.

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

- خلفيات CLI تركّز على النص أولًا؛ تكون الأدوات معطلة دائمًا.
- تكون الجلسات مدعومة عند ضبط `sessionArg`.
- يكون تمرير الصور مدعومًا عندما يقبل `imageArg` مسارات الملفات.
- يتيح `reseedFromRawTranscriptWhenUncompacted: true` للخلفية استعادة الجلسات الآمنة
  التي أُبطلت من ذيل خام محدود لنص OpenClaw قبل وجود
  أول ملخص Compaction. ولا تزال تغييرات ملف تعريف المصادقة أو حقبة بيانات الاعتماد
  لا تعيد البذر الخام مطلقًا.

### `agents.defaults.systemPromptOverride`

استبدل مطالبة النظام الكاملة التي يجمعها OpenClaw بسلسلة ثابتة. اضبطها على مستوى القيم الافتراضية (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون قيم كل وكيل ذات أولوية؛ ويتم تجاهل القيمة الفارغة أو المكوّنة من مسافات بيضاء فقط. مفيد لتجارب المطالبات المضبوطة.

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

طبقات مطالبة مستقلة عن المزوّد تُطبّق حسب عائلة النموذج. تتلقى معرّفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر المزوّدين؛ يتحكم `personality` فقط في طبقة أسلوب التفاعل الودّي.

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
- `includeSystemPromptSection`: عند false، يحذف قسم Heartbeat من مطالبة النظام ويتجاوز إدخال `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند true، يكتم حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدوران وكيل Heartbeat قبل إجهاضه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/DM. يسمح `allow` (الافتراضي) بالتسليم إلى الهدف المباشر. يمنع `block` التسليم إلى الهدف المباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا ولا تحتفظ إلا بملف `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند true، يعمل كل Heartbeat في جلسة جديدة بلا سجل محادثة سابق. نمط العزل نفسه مثل cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- `skipWhenBusy`: عند true، تؤجل تشغيلات Heartbeat عند وجود مسارات انشغال إضافية: عمل وكيل فرعي أو أمر متداخل. تؤجل مسارات Cron تشغيلات Heartbeat دائمًا، حتى من دون هذا العلم.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، تعمل **تلك الوكلاء فقط** على تشغيل Heartbeats.
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

- `mode`: `default` أو `safeguard` (تلخيص مجزأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزوّد Compaction مسجل. عند ضبطه، يُستدعى `summarize()` الخاص بالمزوّد بدل تلخيص LLM المدمج. يعود إلى المدمج عند الفشل. يفرض ضبط مزوّد `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى للثواني المسموح بها لعملية Compaction واحدة قبل أن يجهضها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة القطع في Pi للاحتفاظ بذيل النص الأحدث حرفيًا. يحترم `/compact` اليدوي هذا عند ضبطه صراحة؛ وإلا يكون Compaction اليدوي نقطة تحقق صارمة.
- `identifierPolicy`: `strict` (الافتراضي)، أو `off`، أو `custom`. يسبق `strict` إرشادات مدمجة للاحتفاظ بالمعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عند `identifierPolicy=custom`.
- `qualityGuard`: فحوص إعادة المحاولة عند المخرجات سيئة التشكيل لملخصات safeguard. مفعّل افتراضيًا في وضع safeguard؛ اضبط `enabled: false` لتجاوز التدقيق.
- `midTurnPrecheck`: فحص اختياري لضغط حلقة أدوات Pi. عند `enabled: true`، يفحص OpenClaw ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسبًا، يجهض المحاولة الحالية قبل إرسال المطالبة ويعيد استخدام مسار استرداد الفحص المسبق الحالي لاقتطاع نتائج الأدوات أو إجراء Compaction ثم إعادة المحاولة. يعمل مع وضعي Compaction `default` و`safeguard`. الافتراضي: معطل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية في AGENTS.md لإعادة إدخالها بعد Compaction. الافتراضي هو `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الإدخال. عند تركه غير مضبوط أو ضبطه صراحة على هذا الزوج الافتراضي، تُقبل أيضًا عناوين `Every Session`/`Safety` الأقدم كخيار رجوع قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما ينبغي للجلسة الرئيسية الاحتفاظ بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم ضبطه، يستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: حد بايت اختياري (`number` أو سلاسل مثل `"20mb"`) يطلق Compaction المحلي العادي قبل التشغيل عندما يتجاوز JSONL النشط الحد. يتطلب `truncateAfterCompaction` حتى يتمكن Compaction الناجح من التدوير إلى نص لاحق أصغر. معطل عند عدم ضبطه أو عند `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثل "Compacting context..." و"Compaction complete"). معطل افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دورة وكيل صامتة قبل Compaction التلقائي لتخزين الذكريات الدائمة. اضبط `model` على مزوّد/نموذج دقيق مثل `ollama/qwen3:8b` عندما ينبغي أن تبقى دورة الصيانة هذه على نموذج محلي؛ لا يرث التجاوز سلسلة الرجوع للجلسة النشطة. يتم تجاوزه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.runRetries`

حدود تكرار إعادة محاولة حلقة التشغيل الخارجية لمشغّل Pi المضمّن لمنع حلقات التنفيذ اللانهائية أثناء الاسترداد من الفشل. لاحظ أن هذا الإعداد ينطبق حاليًا فقط على وقت تشغيل الوكيل المضمّن، وليس على أوقات تشغيل ACP أو CLI.

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
- `perProfile`: تكرارات إعادة محاولة تشغيل إضافية تُمنح لكل مرشح ملف تعريف رجوع. الافتراضي: `8`.
- `min`: الحد الأدنى المطلق لتكرارات إعادة محاولة التشغيل. الافتراضي: `32`.
- `max`: الحد الأقصى المطلق لتكرارات إعادة محاولة التشغيل لمنع التنفيذ المنفلت. الافتراضي: `160`.

### `agents.defaults.contextPruning`

يقلّم **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل الإرسال إلى LLM. لا يعدّل سجل الجلسة على القرص.

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

- يفعّل `mode: "cache-ttl"` عمليات التقليم.
- يتحكم `ttl` في عدد المرات التي يمكن فيها تشغيل التقليم مرة أخرى (بعد آخر لمس لذاكرة التخزين المؤقت).
- يقلّم التقليم نتائج الأدوات كبيرة الحجم تقليمًا خفيفًا أولًا، ثم يمسح نتائج الأدوات الأقدم مسحًا كاملًا عند الحاجة.

**التقليم الخفيف** يحتفظ بالبداية + النهاية ويدرِج `...` في الوسط.

**المسح الكامل** يستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا يتم أبدًا تقليم/مسح كتل الصور.
- النسب مبنية على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا وُجدت رسائل مساعد أقل من `keepLastAssistants`، يتم تخطي التقليم.

</Accordion>

راجع [تقليم الجلسة](/ar/concepts/session-pruning) لتفاصيل السلوك.

### البث الكتلي

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

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحةً لتفعيل الردود الكتلية.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات لكل حساب). القيم الافتراضية في Signal/Slack/Discord/Google Chat هي `minChars: 1500`.
- `humanDelay`: إيقاف مؤقت عشوائي بين الردود الكتلية. `natural` = 800–2500ms. التجاوز لكل وكيل: `agents.list[].humanDelay`.

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

- القيم الافتراضية: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات التي لا تتضمن إشارة.
- تجاوزات لكل جلسة: `session.typingMode`، و`session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

عزل اختياري للوكيل المضمّن. راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل.

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

<Accordion title="تفاصيل العزل">

**الخلفية:**

- `docker`: وقت تشغيل Docker المحلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم عبر SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعدادات خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يجسّدها OpenClaw كملفات مؤقتة في وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مقابض سياسة مفاتيح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` يتغلب على `identityFile`
- `certificateData` يتغلب على `certificateFile`
- `knownHostsData` يتغلب على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة العزل

**سلوك خلفية SSH:**

- يزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة عمل SSH البعيدة مرجعية
- يوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة تلقائيًا إلى المضيف
- لا يدعم حاويات متصفح العزل

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل عزل لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل العزل عند `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (بدون عزل بين الجلسات)

**إعدادات Plugin الخاص بـ OpenShell:**

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

- `mirror`: زرع البعيد من المحلي قبل exec، ثم المزامنة مرة أخرى بعد exec؛ تبقى مساحة العمل المحلية مرجعية
- `remote`: زرع البعيد مرة واحدة عند إنشاء العزل، ثم إبقاء مساحة العمل البعيدة مرجعية

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw تلقائيًا إلى العزل بعد خطوة الزرع.
النقل هو SSH إلى عزل OpenShell، لكن Plugin يملك دورة حياة العزل ومزامنة المرآة الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج شبكي، وجذر قابل للكتابة، ومستخدم root.

**تكون الحاويات افتراضيًا على `network: "none"`** — عيّنها إلى `"bridge"` (أو شبكة جسر مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
`"host"` محظور. `"container:<id>"` محظور افتراضيًا إلا إذا عيّنت صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (كسر زجاج الطوارئ).

**المرفقات الواردة** يتم تجهيزها في `media/inbound/*` ضمن مساحة العمل النشطة.

**`docker.binds`** يركّب أدلة مضيف إضافية؛ يتم دمج عمليات الربط العامة ولكل وكيل.

**متصفح معزول** (`sandbox.browser.enabled`): Chromium + CDP في حاوية. يتم حقن عنوان URL الخاص بـ noVNC في موجه النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول مراقب noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL قصير العمر برمز مميز (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (الافتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- تكون `network` افتراضيًا `openclaw-sandbox-browser` (شبكة جسر مخصصة). عيّنها إلى `bridge` فقط عندما تريد صراحةً اتصالًا عامًا بالجسر.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند حافة الحاوية إلى نطاق CIDR (مثل `172.21.0.1/32`).
- يركّب `sandbox.browser.binds` أدلة مضيف إضافية في حاوية متصفح العزل فقط. عند تعيينه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- يتم تعريف إعدادات التشغيل الافتراضية في `scripts/sandbox-browser-entrypoint.sh` وضبطها لمضيفي الحاويات:
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
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ عيّن `0` لاستخدام حد عمليات Chromium
    الافتراضي.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - القيم الافتراضية هي خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع نقطة دخول مخصصة
    لتغيير القيم الافتراضية للحاوية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` خاصان بـ Docker فقط.

ابنِ الصور (من نسخة مصدرية محلية):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

بالنسبة إلى تثبيتات npm بدون نسخة مصدرية محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح الوكيل موفّر TTS أو صوتًا أو نموذجًا أو
نمطًا أو وضع TTS تلقائيًا خاصًا به. تُدمج كتلة الوكيل دمجًا عميقًا فوق
`messages.tts` العام، لذلك يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما
يتجاوز الوكلاء الفرديون فقط حقول الصوت أو الموفّر التي يحتاجون إليها. ينطبق تجاوز
الوكيل النشط على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، وأداة الوكيل
`tts`. راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
للحصول على أمثلة الموفّرين والأسبقية.

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
- `default`: عند تعيين عدة وكلاء، يفوز الأول (مع تسجيل تحذير). إذا لم يُعيَّن أي وكيل، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: الصيغة النصية تضبط نموذجًا أساسيًا صارمًا لكل وكيل بلا احتياطي للنموذج؛ وصيغة الكائن `{ primary }` صارمة أيضًا ما لم تضف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في الاحتياطي، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. تظل مهام Cron التي تتجاوز `primary` فقط ترث الاحتياطيات الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معاملات بث لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` دون تكرار كتالوج النماذج بالكامل.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. تُدمج الكتلة دمجًا عميقًا فوق `messages.tts`، لذلك أبقِ بيانات اعتماد الموفّر المشتركة وسياسة الاحتياطي في `messages.tts` واضبط هنا فقط القيم الخاصة بالشخصية مثل الموفّر أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح Skills اختيارية لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ وتستبدل القائمة الصريحة الافتراضيات بدلًا من دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة. يتحكم ملف موفّر/نموذج التعريف المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، تُبقي `adaptive` التفكير الديناميكي المملوك للموفّر (`thinkingLevel` محذوف على Gemini 3/3.1، و`thinkingBudget: -1` على Gemini 2.5).
- `reasoningDefault`: رؤية الاستدلال الافتراضية الاختيارية لكل وكيل (`on | off | stream`). تتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عندما لا يكون هناك تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: قيمة افتراضية اختيارية للوضع السريع لكل وكيل (`true | false`). تُطبَّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `models`: تجاوزات اختيارية لكتالوج النماذج/وقت التشغيل لكل وكيل، مفهرسة بمعرّفات `provider/model` الكاملة. استخدم `models["provider/model"].agentRuntime` لاستثناءات وقت التشغيل لكل وكيل.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) عندما يجب أن يستخدم الوكيل جلسات حاضنة ACP افتراضيًا.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو URI من نوع `data:`.
- تستمد `identity` الافتراضيات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح بمعرّفات الوكلاء لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط). أدرج معرّف الطالب عندما يجب السماح باستدعاءات `agentId` التي تستهدف الذات.
- حارس وراثة صندوق العزل: إذا كانت جلسة الطالب معزولة، يرفض `sessions_spawn` الأهداف التي ستعمل بلا عزل.
- `subagents.requireAgentId`: عند true، تُحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

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

- `type` (اختياري): `route` للتوجيه العادي (النوع المفقود يُفترض أنه route)، و`acp` لروابط محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ محذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة دقيقة، بلا peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw الربط حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات ربط المسار أعلاه.

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

<Accordion title="بلا وصول إلى نظام الملفات (مراسلة فقط)">

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

راجع [صندوق عزل وأدوات تعدد الوكلاء](/ar/tools/multi-agent-sandbox-tools) لتفاصيل الأسبقية.

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
  - `per-sender` (الافتراضي): يحصل كل مُرسل على جلسة معزولة ضمن سياق قناة.
  - `global`: يشارك جميع المشاركين في سياق قناة جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشارك جميع الرسائل المباشرة الجلسة الرئيسية.
  - `per-peer`: يعزل حسب معرّف المُرسل عبر القنوات.
  - `per-channel-peer`: يعزل لكل قناة + مُرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: يعزل لكل حساب + قناة + مُرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرّفات الأساسية بالأقران ذات البادئة الخاصة بالمزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر الإرساء مثل `/dock_discord` الخريطة نفسها لتبديل مسار رد الجلسة النشطة إلى قرين قناة آخر مرتبط؛ راجع [إرساء القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة الضبط الأساسية. يعيد `daily` الضبط عند الوقت المحلي `atHour`؛ ويعيد `idle` الضبط بعد `idleMinutes`. عند تكوينهما معًا، يفوز الذي تنتهي مدته أولًا. تستخدم حداثة إعادة الضبط اليومية قيمة `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة الضبط بسبب الخمول `lastInteractionAt`. يمكن لعمليات الكتابة في الخلفية/أحداث النظام مثل Heartbeat، وتنبيهات Cron، وإشعارات التنفيذ، ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تبقي جلسات إعادة الضبط اليومية/الخاملة حديثة.
- **`resetByType`**: تجاوزات لكل نوع (`direct`، و`group`، و`thread`). يُقبل `dm` القديم كاسم بديل لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية المحادثة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لدورات الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`-`20`، الافتراضي: `5`). تعطل القيمة `0` تسلسل الردود المتبادلة.
- **`sendPolicy`**: يطابق حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. أول منع يفوز.
- **`maintenance`**: تنظيف مخزن الجلسات + عناصر التحكم في الاحتفاظ.
  - `mode`: يصدر `warn` تحذيرات فقط؛ يطبق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفًا دفعيًا مع مخزن مؤقت صغير للحد الأعلى لسعات الإنتاج؛ يطبق `openclaw sessions cleanup --enforce` الحد فورًا.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من التكوينات الأقدم.
  - `resetArchiveRetention`: الاحتفاظ بأرشيفات نصوص المحادثات `*.reset.<timestamp>`. الافتراضي هو `pruneAfter`؛ اضبطه على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. الافتراضي هو `80%` من `maxDiskBytes`.
- **`threadBindings`**: الافتراضات العامة لميزات الجلسات المرتبطة بسلاسل المحادثات.
  - `enabled`: مفتاح التفعيل الافتراضي الرئيسي (يمكن للمزوّدين تجاوزه؛ يستخدم Discord ‏`channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بسبب عدم النشاط بالساعات (`0` يعطل؛ يمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطل؛ يمكن للمزوّدين التجاوز)
  - `spawnSessions`: بوابة افتراضية لإنشاء جلسات عمل مرتبطة بسلاسل المحادثات من `sessions_spawn` وتفرعات سلاسل ACP. الافتراضي هو `true` عند تمكين ربط سلاسل المحادثات؛ يمكن للمزوّدين/الحسابات التجاوز.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي للتفرعات المرتبطة بسلاسل المحادثات (`"fork"` أو `"isolated"`). الافتراضي هو `"fork"`.

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

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix`، و`channels.<channel>.accounts.<id>.responsePrefix`.

الحل (الأكثر تحديدًا يفوز): الحساب ← القناة ← العام. يعطل `""` ويوقف التسلسل. يشتق `"auto"` من `[{identity.name}]`.

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

- يكون افتراضيًا `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبط `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction`، و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب ← القناة ← `messages.ackReaction` ← بديل الهوية.
- النطاق: `group-mentions` (الافتراضي)، و`group-all`، و`direct`، و`all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد على القنوات التي تدعم التفاعلات مثل Slack، وDiscord، وTelegram، وWhatsApp، وiMessage.
- `messages.statusReactions.enabled`: يمكّن تفاعلات حالة دورة الحياة على Slack، وDiscord، وTelegram.
  على Slack وDiscord، يؤدي عدم ضبطه إلى إبقاء تفاعلات الحالة مفعلة عندما تكون تفاعلات الإقرار نشطة.
  على Telegram، اضبطه صراحة على `true` لتمكين تفاعلات حالة دورة الحياة.

### تأخير الرسائل الواردة

يجمع الرسائل النصية السريعة فقط من المُرسل نفسه في دورة وكيل واحدة. تؤدي الوسائط/المرفقات إلى الإرسال فورًا. تتجاوز أوامر التحكم التأخير.

### تحويل النص إلى كلام (TTS)

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
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ والقيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك صريح).
- تعود مفاتيح API احتياطيًا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- مزوّدو الكلام المضمّنون مملوكون من Plugin. إذا تم ضبط `plugins.allow`، فأدرج كل Plugin مزوّد TTS تريد استخدامه، مثل `microsoft` من أجل Edge TTS. يُقبل معرّف المزوّد القديم `edge` كاسم بديل لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو التكوين، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية ليست تابعة لـ OpenAI، يعاملها OpenClaw كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## التحدث

افتراضات وضع التحدث (macOS/iOS/Android).

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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تكوين عدة مزوّدي تحدث.
- مفاتيح التحدث المسطحة القديمة (`talk.voiceId`، و`talk.voiceAliases`، و`talk.modelId`، و`talk.outputFormat`، و`talk.apiKey`) للتوافق فقط. شغّل `openclaw doctor --fix` لإعادة كتابة التكوين المحفوظ إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت احتياطيًا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية عادية أو كائنات SecretRef.
- ينطبق بديل `ELEVENLABS_API_KEY` فقط عند عدم تكوين مفتاح API للتحدث.
- يتيح `providers.*.voiceAliases` لتوجيهات التحدث استخدام أسماء سهلة.
- يحدد `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا تم حذفه، يستخدم macOS ‏`mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر المساعد المضمّن `openclaw-mlx-tts` عند وجوده، أو عبر ملف تنفيذي على `PATH`؛ يتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد لأغراض التطوير.
- يتحكم `consultThinkingLevel` في مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات `openclaw_agent_consult` في الوقت الحقيقي لواجهة التحكم في التحدث. اتركه غير مضبوط للحفاظ على سلوك الجلسة/النموذج الطبيعي.
- يضبط `consultFastMode` تجاوزًا لمرة واحدة لوضع السرعة لاستشارات الوقت الحقيقي للتحدث في واجهة التحكم من دون تغيير إعداد وضع السرعة الطبيعي للجلسة.
- يضبط `speechLocale` معرّف لغة BCP 47 المستخدم بواسطة تعرّف الكلام في التحدث على iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع التحدث بعد صمت المستخدم قبل أن يرسل النص. يؤدي عدم ضبطه إلى الحفاظ على نافذة التوقف المؤقت الافتراضية للمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).
- يضيف `realtime.instructions` تعليمات نظام موجهة إلى المزوّد إلى موجه الوقت الحقيقي المضمّن في OpenClaw، بحيث يمكن تكوين نمط الصوت دون فقدان إرشادات `openclaw_agent_consult` الافتراضية.

---

## ذو صلة

- [مرجع التكوين](/ar/gateway/configuration-reference) — كل مفاتيح التكوين الأخرى
- [التكوين](/ar/gateway/configuration) — مهام شائعة وإعداد سريع
- [أمثلة التكوين](/ar/gateway/configuration-examples)
