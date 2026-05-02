---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين التوجيه والارتباطات متعددة الوكلاء
    - ضبط سلوك الجلسة وتسليم الرسائل ووضع التحدث
summary: إعدادات الوكيل الافتراضية، والتوجيه متعدد الوكلاء، والجلسة، والرسائل، وتكوين التحدث
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-05-02T07:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559bb427555768c91720bac10ee60bf2ba5a081117b741a02c140b14267ce1bf
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح التهيئة ذات نطاق الوكيل ضمن `agents.*` و`multiAgent.*` و`session.*`
و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات ووقت تشغيل Gateway والمفاتيح
الأخرى عالية المستوى، راجع [مرجع التهيئة](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكيل

### `agents.defaults.workspace`

القيمة الافتراضية: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime ضمن مطالبة النظام. إذا لم يُضبط، يكتشفه OpenClaw تلقائيا عبر الصعود من مساحة العمل.

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

- احذف `agents.defaults.skills` لإتاحة Skills بلا قيود افتراضيا.
- احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
- اضبط `agents.list[].skills: []` لعدم إتاحة أي Skills.
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

يتحكم في وقت حقن ملفات تمهيد مساحة العمل في مطالبة النظام. القيمة الافتراضية: `"always"`.

- `"continuation-skip"`: تتخطى دورات المتابعة الآمنة (بعد استجابة مكتملة من المساعد) إعادة حقن تمهيد مساحة العمل، مما يقلل حجم المطالبة. لا تزال تشغيلات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: عطّل تمهيد مساحة العمل وحقن ملفات السياق في كل دورة. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة مطالباتهم بالكامل (محركات سياق مخصصة، أو أوقات تشغيل أصلية تبني سياقها الخاص، أو تدفقات عمل متخصصة بلا تمهيد). تتخطى دورات Heartbeat واسترداد Compaction الحقن أيضا.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف لكل ملف تمهيد مساحة عمل قبل الاقتطاع. القيمة الافتراضية: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى الإجمالي لعدد الأحرف المحقونة عبر جميع ملفات تمهيد مساحة العمل. القيمة الافتراضية: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عند اقتطاع سياق التمهيد.
القيمة الافتراضية: `"once"`.

- `"off"`: لا تحقن نص التحذير أبدا في مطالبة النظام.
- `"once"`: احقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: احقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات كبيرة الحجم للمطالبة/السياق، وهي
مقسمة عمدا حسب النظام الفرعي بدلا من تمريرها كلها عبر مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  تمهيد أولي لمرة واحدة لتشغيل النموذج عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة. يتم الإقرار بأوامر الدردشة المجردة `/new` و`/reset`
  من دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في مطالبة النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل محقونة مملوكة لوقت التشغيل.
- `memory.qmd.limits.*`:
  حجم مقتطف بحث الذاكرة المفهرس والحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في التمهيد الأولي لدورة البدء الأولى المحقون عند تشغيلات النموذج الخاصة بإعادة الضبط/بدء التشغيل.
تقر أوامر الدردشة المجردة `/new` و`/reset` بإعادة الضبط من دون استدعاء
النموذج، لذلك لا تحمّل هذا التمهيد الأولي.

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

- `memoryGetMaxChars`: الحد الافتراضي لمقتطف `memory_get` قبل إضافة
  بيانات الاقتطاع الوصفية وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ `memory_get` عندما تُحذف
  `lines`.
- `toolResultMaxChars`: حد نتيجة الأداة المباشرة المستخدم للنتائج المستمرة
  واسترداد الفائض.
- `postCompactionMaxChars`: حد مقتطف AGENTS.md المستخدم أثناء حقن تحديث ما بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمقابض `contextLimits` المشتركة. الحقول المحذوفة ترث
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

الحد الأقصى لحجم البكسل لأطول ضلع في الصورة ضمن كتل صور النص/الأداة قبل استدعاءات المزوّد.
القيمة الافتراضية: `1200`.

عادة تقلل القيم الأقل استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات كثيرة لقطات الشاشة.
تحافظ القيم الأعلى على مزيد من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق مطالبة النظام (وليس الطوابع الزمنية للرسائل). تعود إلى المنطقة الزمنية للمضيف.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في مطالبة النظام. القيمة الافتراضية: `auto` (تفضيل نظام التشغيل).

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
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - يضبط شكل السلسلة النموذج الأساسي فقط.
  - يضبط شكل الكائن النموذج الأساسي بالإضافة إلى نماذج تجاوز فشل مرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يستخدمه مسار أداة `image` كتكوين نموذج الرؤية الخاص به.
  - ويستخدم أيضًا كتوجيه احتياطي عندما يتعذر على النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرفات المجردة للتوافق؛ إذا طابق معرف مجرد إدخالًا مهيأً قادرًا على الصور بشكل فريد في `models.providers.*.models`، فإن OpenClaw يؤهله لذلك الموفر. تتطلب المطابقات المهيأة المبهمة بادئة موفر صريحة.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة إنشاء الصور المشتركة وأي سطح أداة/Plugin مستقبلي ينشئ صورًا.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لإنشاء صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لصور OpenAI، أو `openai/gpt-image-1.5` لمخرجات OpenAI PNG/WebP ذات الخلفية الشفافة.
  - إذا اخترت موفرًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة الموفر المطابقة (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، أو `FAL_KEY` لـ `fal/*`).
  - إذا حُذف، فبإمكان `image_generate` مع ذلك استنتاج موفر افتراضي مدعوم بالمصادقة. يحاول الموفر الافتراضي الحالي أولًا، ثم بقية موفري إنشاء الصور المسجلين بترتيب معرف الموفر.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة إنشاء الموسيقى المشتركة وأداة `music_generate` المدمجة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.6`.
  - إذا حُذف، فبإمكان `music_generate` مع ذلك استنتاج موفر افتراضي مدعوم بالمصادقة. يحاول الموفر الافتراضي الحالي أولًا، ثم بقية موفري إنشاء الموسيقى المسجلين بترتيب معرف الموفر.
  - إذا اخترت موفرًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة الموفر/مفتاح API المطابق.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة إنشاء الفيديو المشتركة وأداة `video_generate` المدمجة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا حُذف، فبإمكان `video_generate` مع ذلك استنتاج موفر افتراضي مدعوم بالمصادقة. يحاول الموفر الافتراضي الحالي أولًا، ثم بقية موفري إنشاء الفيديو المسجلين بترتيب معرف الموفر.
  - إذا اخترت موفرًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة الموفر/مفتاح API المطابق.
  - يدعم موفر إنشاء الفيديو Qwen المضمّن ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى الموفر: `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه أداة `pdf` لتوجيه النماذج.
  - إذا حُذف، تعود أداة PDF احتياطيًا إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي المحلول.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي ينظر فيها وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `reasoningDefault`: ظهور الاستدلال الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` الخاص بكل وكيل هذا الافتراضي. لا تُطبّق افتراضيات الاستدلال المهيأة إلا للمالكين أو المرسلين المصرح لهم أو سياقات Gateway لمسؤول المشغّل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.5` للوصول بمفتاح API أو `openai-codex/gpt-5.5` لـ Codex OAuth). إذا حذفت الموفر، يحاول OpenClaw اسمًا مستعارًا أولًا، ثم مطابقة موفر مهيأ فريدة لمعرف النموذج الدقيق ذاك، وعندها فقط يعود إلى الموفر الافتراضي المهيأ (سلوك توافق مهمل، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك الموفر يوفّر النموذج الافتراضي المهيأ، يعود OpenClaw إلى أول موفر/نموذج مهيأ بدلًا من إظهار افتراضي موفر مُزال قديم.
- `models`: كتالوج النماذج المهيأ وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالموفر، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` و`chat_template_kwargs` و`extra_body`/`extraBody`).
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات قائمة السماح الحالية إلا إذا مررت `--replace`.
  - تدمج تدفقات الضبط/الإعداد المحصورة بالموفر نماذج الموفر المحددة في هذه الخريطة وتحافظ على الموفرين غير ذوي الصلة المهيئين مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، يتم تفعيل Compaction من جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction من جانب خادم OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات الموفر الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (التكوين): يتجاوز `agents.defaults.models["provider/model"].params` (لكل نموذج) `agents.defaults.params` (الأساس العام)، ثم يتجاوز `agents.list[].params` (معرف الوكيل المطابق) بحسب المفتاح. راجع [تخزين المطالبات مؤقتًا](/ar/reference/prompt-caching) للتفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمريري متقدم يُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلب المولّدة، يفوز الجسم الإضافي؛ ولا تزال مسارات الإكمال غير الأصلية تزيل `store` الخاص بـ OpenAI بعد ذلك.
- `params.chat_template_kwargs`: وسائط قالب الدردشة المتوافقة مع vLLM/OpenAI تُدمج في أجسام طلبات `api: "openai-completions"` ذات المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل vLLM Plugin المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ تتجاوز `chat_template_kwargs` الصريحة الافتراضيات المولّدة، ولا يزال لـ `extra_body.chat_template_kwargs` الأسبقية النهائية. لعناصر التحكم في تفكير vLLM Qwen، اضبط `params.qwenThinkingFormat` على `"chat-template"` أو `"top-level"` في إدخال ذلك النموذج.
- `compat.supportedReasoningEfforts`: قائمة جهود الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` لنقاط النهاية المخصصة التي تقبله فعلًا؛ عندها يعرض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيح الجلسة، والتحقق من CLI للوكيل، والتحقق من `llm-task` لذلك الموفر/النموذج المهيأ. استخدم `compat.reasoningEffortMap` عندما تريد الواجهة الخلفية قيمة خاصة بالموفر لمستوى معياري.
- `params.preserveThinking`: خيار تفعيل خاص بـ Z.AI فقط للتفكير المحفوظ. عند تفعيله وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: سياسة وقت تشغيل الوكيل منخفضة المستوى الافتراضية. المعرف المحذوف يعود افتراضيًا إلى OpenClaw Pi. استخدم `id: "pi"` لفرض مُسخّر PI المدمج، أو `id: "auto"` للسماح لمُسخّرات Plugin المسجلة بالمطالبة بالنماذج المدعومة، أو معرف مُسخّر مسجل مثل `id: "codex"`، أو اسمًا مستعارًا لواجهة CLI خلفية مدعومة مثل `id: "claude-cli"`. اضبط `fallback: "none"` لتعطيل الرجوع التلقائي إلى PI. تفشل أوقات تشغيل Plugin الصريحة مثل `codex` بشكل مغلق افتراضيًا ما لم تضبط `fallback: "pi"` في نطاق التجاوز نفسه. أبقِ مراجع النماذج معيارية كـ `provider/model`؛ اختر Codex وClaude CLI وGemini CLI وواجهات التنفيذ الخلفية الأخرى عبر تكوين وقت التشغيل بدلًا من بادئات موفر وقت التشغيل القديمة. راجع [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) لمعرفة كيف يختلف هذا عن اختيار الموفر/النموذج.
- كُتّاب التكوين الذين يغيّرون هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطيات) يحفظون شكل الكائن المعياري ويحافظون على قوائم الاحتياطيات الحالية عندما يكون ذلك ممكنًا.
- `maxConcurrent`: الحد الأقصى لتشغيل الوكلاء بالتوازي عبر الجلسات (تظل كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.agentRuntime`

يتحكم `agentRuntime` في أي منفذ منخفض المستوى يشغّل أدوار الوكيل. ينبغي لمعظم
عمليات النشر الإبقاء على وقت تشغيل OpenClaw Pi الافتراضي. استخدمه عندما يوفر Plugin
موثوق مُسخّرًا أصليًا، مثل مُسخّر خادم تطبيق Codex المضمّن،
أو عندما تريد واجهة CLI خلفية مدعومة مثل Claude CLI. وللنموذج الذهني،
راجع [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`، أو `"pi"`، أو معرّف عدة Plugin مسجلة، أو اسم مستعار مدعوم لواجهة خلفية في CLI. يسجّل Plugin Codex المضمّن `codex`؛ ويوفّر Plugin Anthropic المضمّن واجهة CLI الخلفية `claude-cli`.
- `fallback`: `"pi"` أو `"none"`. في `id: "auto"`، تكون قيمة fallback المحذوفة افتراضيًا `"pi"` حتى تتمكن الإعدادات القديمة من الاستمرار في استخدام PI عندما لا تطالب أي عدة Plugin بتشغيل ما. في وضع تشغيل Plugin الصريح، مثل `id: "codex"`، تكون قيمة fallback المحذوفة افتراضيًا `"none"` حتى يؤدي غياب العدة إلى فشل بدلًا من استخدام PI بصمت. لا ترث تجاوزات وقت التشغيل قيمة fallback من نطاق أوسع؛ عيّن `fallback: "pi"` إلى جانب وقت التشغيل الصريح عندما تريد هذا fallback المتوافق عمدًا. تظهر إخفاقات عدة Plugin المحددة مباشرة دائمًا.
- تجاوزات البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` قيمة `id`؛ ويتجاوز `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` قيمة fallback لتلك العملية.
- لعمليات النشر الخاصة بـ Codex فقط، عيّن `model: "openai/gpt-5.5"` و`agentRuntime.id: "codex"`. يمكنك أيضًا تعيين `agentRuntime.fallback: "none"` صراحةً لسهولة القراءة؛ فهي القيمة الافتراضية لأوقات تشغيل Plugin الصريحة.
- لعمليات نشر Claude CLI، يُفضَّل استخدام `model: "anthropic/claude-opus-4-7"` مع `agentRuntime.id: "claude-cli"`. لا تزال مراجع النموذج القديمة `claude-cli/claude-opus-4-7` تعمل للتوافق، لكن ينبغي أن تُبقي الإعدادات الجديدة اختيار المزوّد/النموذج وفق الصيغة القياسية، وأن تضع واجهة التنفيذ الخلفية في `agentRuntime.id`.
- يعيد `openclaw doctor --fix` كتابة مفاتيح سياسة وقت التشغيل الأقدم إلى `agentRuntime`.
- يثبَّت اختيار العدة لكل معرّف جلسة بعد أول تشغيل مضمّن. تؤثر تغييرات الإعدادات/البيئة في الجلسات الجديدة أو المعاد ضبطها، وليس في نص جلسة موجود. تُعامل الجلسات القديمة التي تحتوي على سجل نصي لكن بلا تثبيت مسجّل على أنها مثبتة على PI. يبلّغ `/status` عن وقت التشغيل الفعّال، مثل `Runtime: OpenClaw Pi Default` أو `Runtime: OpenAI Codex`.
- يتحكم هذا فقط في تنفيذ أدوار وكيل النص. لا يزال توليد الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS يستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمّنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار       | النموذج                                    |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

تتغلب الأسماء المستعارة التي أعددتها دائمًا على الإعدادات الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI خيار `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضيًا عند عدم تعيين مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية للتشغيلات الاحتياطية النصية فقط (من دون استدعاءات أدوات). مفيدة كنسخة احتياطية عند فشل موفري API.

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

- واجهات CLI الخلفية نصية أولًا؛ تُعطّل الأدوات دائمًا.
- تُدعم الجلسات عند تعيين `sessionArg`.
- يُدعم تمرير الصور عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل موجه النظام الكامل الذي يجمعه OpenClaw بسلسلة ثابتة. اضبطه على مستوى الإعدادات الافتراضية (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون القيم الخاصة بالوكيل ذات أولوية؛ ويتم تجاهل القيمة الفارغة أو المكوّنة من مسافات بيضاء فقط. مفيد لتجارب الموجهات المضبوطة.

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

طبقات موجه مستقلة عن المزوّد تُطبّق حسب عائلة النموذج. تتلقى معرّفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر المزوّدين؛ يتحكم `personality` فقط في طبقة أسلوب التفاعل الودود.

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
- يعطّل `"off"` الطبقة الودودة فقط؛ ويبقى عقد سلوك GPT-5 الموسوم مفعّلًا.
- لا يزال الإعداد القديم `plugins.entries.openai.config.personality` يُقرأ عندما لا يكون هذا الإعداد المشترك مضبوطًا.

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
- `includeSystemPromptSection`: عند ضبطها على false، تُحذف فقرة Heartbeat من موجه النظام ويتم تخطي حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند ضبطها على true، تُخفي حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: أقصى وقت بالثواني مسموح به لدور وكيل Heartbeat قبل إجهاضه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/الرسائل الخاصة. يسمح `allow` (الافتراضي) بالتسليم إلى هدف مباشر. يمنع `block` التسليم إلى هدف مباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند ضبطها على true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتُبقي فقط على `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند ضبطها على true، يعمل كل Heartbeat في جلسة جديدة من دون سجل محادثة سابق. نمط العزل نفسه مثل cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat من نحو 100 ألف إلى نحو 2-5 آلاف رمز.
- `skipWhenBusy`: عند ضبطها على true، تؤجل تشغيلات Heartbeat في مسارات الانشغال الإضافية: عمل الوكلاء الفرعيين أو الأوامر المتداخلة. تؤجل مسارات Cron دائمًا Heartbeats، حتى من دون هذا العلم.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، تعمل Heartbeats **لهؤلاء الوكلاء فقط**.
- تشغّل Heartbeats أدوار وكيل كاملة — الفواصل الأقصر تستهلك رموزًا أكثر.

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

- `mode`: `default` أو `safeguard` (تلخيص مجزأ للتواريخ الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف compaction provider plugin مسجّل. عند ضبطه، يتم استدعاء `summarize()` الخاص بالمزوّد بدل تلخيص LLM المضمّن. يعود إلى المضمّن عند الفشل. يفرض ضبط مزوّد `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يجهضها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة القطع في Pi للاحتفاظ بذيل النص الأحدث حرفيًا. يحترم `/compact` اليدوي هذا عند ضبطه صراحة؛ وإلا يكون الضغط اليدوي نقطة تحقق صارمة.
- `identifierPolicy`: `strict` (الافتراضي)، أو `off`، أو `custom`. يضيف `strict` إرشادات مضمّنة للاحتفاظ بالمعرّفات المعتمة في بداية تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرّفات يُستخدم عندما تكون `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند المخرجات سيئة التنسيق لملخصات الحماية. مفعّل افتراضيًا في وضع الحماية؛ اضبط `enabled: false` لتخطي التدقيق.
- `midTurnPrecheck`: فحص اختياري لضغط حلقة أدوات Pi. عند `enabled: true`، يتحقق OpenClaw من ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسبًا، فإنه يجهض المحاولة الحالية قبل إرسال الموجه ويعيد استخدام مسار التعافي الحالي للفحص المسبق لاقتطاع نتائج الأدوات أو إجراء Compaction ثم إعادة المحاولة. يعمل مع وضعي Compaction، `default` و`safeguard`. الافتراضي: معطّل.
- `postCompactionSections`: أسماء فقرات H2/H3 اختيارية من AGENTS.md لإعادة حقنها بعد Compaction. الإعداد الافتراضي هو `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. عند عدم الضبط أو عند الضبط صراحة على هذا الزوج الافتراضي، تُقبل أيضًا عناوين `Every Session`/`Safety` القديمة كاحتياط قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدمه عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم ضبطه، يستخدم Compaction نموذج الجلسة الأساسي.
- `maxActiveTranscriptBytes`: حد اختياري بالبايت (`number` أو سلاسل مثل `"20mb"`) يشغّل Compaction محليًا عاديًا قبل التشغيل عندما يتجاوز JSONL النشط الحد. يتطلب `truncateAfterCompaction` حتى تتمكن عملية Compaction الناجحة من التدوير إلى نص لاحق أصغر. معطّل عند عدم الضبط أو عند `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثلًا، "جارٍ ضغط السياق..." و"اكتمل الضغط"). معطّل افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دور وكيل صامت قبل الضغط التلقائي لتخزين الذكريات الدائمة. اضبط `model` على مزوّد/نموذج دقيق مثل `ollama/qwen3:8b` عندما ينبغي أن يبقى دور الصيانة هذا على نموذج محلي؛ لا يرث التجاوز سلسلة الاحتياط للجلسة النشطة. يتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يشذّب **نتائج الأدوات القديمة** من السياق داخل الذاكرة قبل الإرسال إلى LLM. **لا** يعدّل سجل الجلسة على القرص.

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
- يتحكم `ttl` في عدد مرات إمكان تشغيل التشذيب مجددًا (بعد آخر لمس للذاكرة المخبئية).
- يشذّب التشذيب نتائج الأدوات المفرطة الحجم تشذيبًا خفيفًا أولًا، ثم يمسح نتائج الأدوات الأقدم مسحًا صارمًا عند الحاجة.

**التشذيب الخفيف** يبقي البداية + النهاية ويدرِج `...` في الوسط.

**المسح الصارم** يستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا تُشذّب/تُمسح كتل الصور أبدًا.
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

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحة لتفعيل الردود الكتلية.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات كل حساب). تستخدم Signal/Slack/Discord/Google Chat القيمة الافتراضية `minChars: 1500`.
- `humanDelay`: إيقاف مؤقت عشوائي بين الردود الكتلية. `natural` = 800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

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

- القيم الافتراضية: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات التي لا تحتوي على إشارة.
- تجاوزات لكل جلسة: `session.typingMode`، `session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

عزل اختياري للوكيل المضمن. راجع [العزل في بيئة sandbox](/ar/gateway/sandboxing) للاطلاع على الدليل الكامل.

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

<Accordion title="تفاصيل sandbox">

**الخلفية:**

- `docker`: وقت تشغيل Docker المحلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم بـ SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعدادات خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: الجذر البعيد المطلق المستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمّنة أو SecretRefs يحولها OpenClaw إلى ملفات مؤقتة أثناء وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: عناصر ضبط سياسة مفاتيح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` له الأسبقية على `identityFile`
- `certificateData` له الأسبقية على `certificateFile`
- `knownHostsData` له الأسبقية على `knownHostsFile`
- تُحل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة sandbox

**سلوك خلفية SSH:**

- تهيئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تبقي مساحة عمل SSH البعيدة هي النسخة المعتمدة
- تمرر `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة عائدا إلى المضيف تلقائيا
- لا تدعم حاويات متصفح sandbox

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل sandbox لكل نطاق ضمن `~/.openclaw/sandboxes`
- `ro`: مساحة عمل sandbox في `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط في `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة/الكتابة في `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (بلا عزل بين الجلسات)

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

- `mirror`: يهيئ البعيد من المحلي قبل exec، ثم يزامن عائدا بعد exec؛ تبقى مساحة العمل المحلية هي النسخة المعتمدة
- `remote`: يهيئ البعيد مرة واحدة عند إنشاء sandbox، ثم يبقي مساحة العمل البعيدة هي النسخة المعتمدة

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw إلى sandbox تلقائيا بعد خطوة التهيئة.
يتم النقل عبر SSH إلى sandbox الخاصة بـ OpenShell، لكن Plugin يملك دورة حياة sandbox ومزامنة المرآة الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج شبكي، وجذر قابل للكتابة، ومستخدم جذر.

**تستخدم الحاويات افتراضيا `network: "none"`** — عيّنها إلى `"bridge"` (أو شبكة جسر مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
`"host"` محظور. `"container:<id>"` محظور افتراضيا ما لم تعيّن صراحة
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (للاستخدام الطارئ).

**المرفقات الواردة** تُجهّز في `media/inbound/*` ضمن مساحة العمل النشطة.

**`docker.binds`** يركّب أدلة مضيف إضافية؛ يتم دمج عمليات الربط العامة والخاصة بكل وكيل.

**متصفح sandbox** (`sandbox.browser.enabled`): Chromium + CDP في حاوية. يُحقن رابط noVNC في موجه النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول مراقب noVNC مصادقة VNC افتراضيا، ويصدر OpenClaw رابط رمز قصير العمر (بدلا من كشف كلمة المرور في الرابط المشترك).

- `allowHostControl: false` (الافتراضي) يمنع جلسات sandbox من استهداف متصفح المضيف.
- القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة جسر مخصصة). عيّنها إلى `bridge` فقط عندما تريد صراحة اتصالا عاما بالجسر.
- يمكن لـ `cdpSourceRange` تقييد دخول CDP اختياريا عند حافة الحاوية إلى نطاق CIDR (مثلا `172.21.0.1/32`).
- يركّب `sandbox.browser.binds` أدلة مضيف إضافية في حاوية متصفح sandbox فقط. عند تعيينه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- تُعرّف قيم التشغيل الافتراضية في `scripts/sandbox-browser-entrypoint.sh` ومضبوطة لمضيفي الحاويات:
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
  - `--disable-extensions` (مفعّل افتراضيا)
  - تكون `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعّلة افتراضيا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الامتدادات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ عيّن `0` لاستخدام حد العمليات
    الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - القيم الافتراضية هي خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع نقطة دخول مخصصة
    لتغيير القيم الافتراضية للحاوية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` خاصان بـ Docker فقط.

بناء الصور (من نسخة مصدر محلية):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

لتثبيتات npm دون نسخة مصدر محلية، راجع [العزل في بيئة sandbox § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح الوكيل مزود TTS أو صوتا أو نموذجا أو
نمطا أو وضع TTS تلقائيا خاصا به. تُدمج كتلة الوكيل بعمق فوق
`messages.tts` العامة، بحيث يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما يتجاوز
الوكلاء الفرديون حقول الصوت أو المزود التي يحتاجون إليها فقط. ينطبق تجاوز الوكيل النشط
على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، وأداة الوكيل
`tts`. راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
لأمثلة المزودين وأسبقية الإعدادات.

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
        agentRuntime: { id: "auto", fallback: "pi" },
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
- `default`: عند ضبط عدة وكلاء، يفوز الأول (مع تسجيل تحذير). إذا لم يُضبط أي واحد، يصبح أول إدخال في القائمة هو الافتراضي.
- `model`: يضبط نموذج السلسلة نموذجًا أساسيًا صارمًا لكل وكيل من دون بديل للنموذج؛ كما يكون نموذج الكائن `{ primary }` صارمًا أيضًا ما لم تُضف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في آلية البدائل، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. مهام Cron التي تتجاوز `primary` فقط لا تزال ترث البدائل الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معاملات بث لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج كاملًا.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. تُدمج الكتلة دمجًا عميقًا فوق `messages.tts`، لذلك أبقِ بيانات اعتماد المزوّد المشتركة وسياسة البدائل في `messages.tts` واضبط هنا فقط القيم الخاصة بالشخصية مثل المزوّد أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ وتحل القائمة الصريحة محل الافتراضيات بدل دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزوّد/النموذج المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، تُبقي `adaptive` التفكير الديناميكي المملوك للمزوّد (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: ظهور الاستدلال الافتراضي الاختياري لكل وكيل (`on | off | stream`). يتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عندما لا يكون هناك تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: القيمة الافتراضية الاختيارية للوضع السريع لكل وكيل (`true | false`). تُطبّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `agentRuntime`: تجاوز اختياري لسياسة وقت التشغيل منخفضة المستوى لكل وكيل. استخدم `{ id: "codex" }` لجعل وكيل واحد مخصصًا لـ Codex فقط بينما تحتفظ الوكلاء الأخرى ببديل PI الافتراضي في وضع `auto`.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) عندما ينبغي أن يعتمد الوكيل افتراضيًا على جلسات حاضنة ACP.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو URI من نوع `data:`.
- تستنتج `identity` الافتراضيات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط). ضمّن معرّف الطالب عندما ينبغي السماح باستدعاءات `agentId` التي تستهدف نفسها.
- حارس توريث صندوق العزل: إذا كانت جلسة الطالب معزولة، يرفض `sessions_spawn` الأهداف التي ستعمل بلا عزل.
- `subagents.requireAgentId`: عند ضبطه على true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار الملف الشخصي صراحة؛ الافتراضي: false).

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

- `type` (اختياري): `route` للتوجيه العادي (غياب النوع يعني التوجيه افتراضيًا)، و`acp` لروابط محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ الحذف = الحساب الافتراضي)
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

داخل كل طبقة، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw وفق هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب طبقات ربط التوجيه أعلاه.

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

راجع [صندوق عزل وأدوات متعدد الوكلاء](/ar/tools/multi-agent-sandbox-tools) لتفاصيل الأسبقية.

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

<Accordion title="تفاصيل حقل الجلسة">

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات الدردشة الجماعية.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة ضمن سياق قناة.
  - `global`: يشارك جميع المشاركين في سياق قناة جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشارك جميع الرسائل المباشرة الجلسة الرئيسية.
  - `per-peer`: عزل حسب معرف المرسل عبر القنوات.
  - `per-channel-peer`: عزل حسب القناة + المرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: عزل حسب الحساب + القناة + المرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرفات القياسية بالأطراف ذات بادئة الموفر لمشاركة الجلسات عبر القنوات. تستخدم أوامر الإرساء مثل `/dock_discord` الخريطة نفسها لتبديل مسار الرد للجلسة النشطة إلى طرف قناة مرتبط آخر؛ راجع [إرساء القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة التعيين الأساسية. يعيد `daily` التعيين عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` التعيين بعد `idleMinutes`. عند تكوينهما معا، يفوز ما تنتهي صلاحيته أولا. تستخدم حداثة إعادة التعيين اليومية قيمة `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة التعيين بسبب الخمول `lastInteractionAt`. يمكن لعمليات الكتابة الخلفية/أحداث النظام مثل Heartbeat، وتنبيهات Cron، وإشعارات التنفيذ، ومسك دفاتر Gateway أن تحدث `updatedAt`، لكنها لا تبقي جلسات اليومية/الخاملة حديثة.
- **`resetByType`**: تجاوزات حسب النوع (`direct`، `group`، `thread`). يقبل `dm` القديم كاسم بديل لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائما `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لجولات الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`–`5`). يعطل `0` تسلسل الردود المتبادلة.
- **`sendPolicy`**: المطابقة حسب `channel`، أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`)، أو `keyPrefix`، أو `rawKeyPrefix`. أول رفض يفوز.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: يصدر `warn` تحذيرات فقط؛ ويطبق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفا دفعيا مع هامش بسيط لمستوى الامتلاء المرتفع للحدود المناسبة للإنتاج؛ ويطبق `openclaw sessions cleanup --enforce` الحد فورا.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من التكوينات الأقدم.
  - `resetArchiveRetention`: الاحتفاظ بأرشيفات نصوص المحادثات `*.reset.<timestamp>`. يكون الافتراضي `pruneAfter`؛ اضبطه على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية اختيارية لمساحة قرص دليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم القطع الأثرية/الجلسات أولا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. يكون الافتراضي `80%` من `maxDiskBytes`.
- **`threadBindings`**: افتراضات عامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للموفرين تجاوزه؛ يستخدم Discord ‏`channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بسبب عدم النشاط بالساعات (`0` يعطل؛ يمكن للموفرين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطل؛ يمكن للموفرين التجاوز)
  - `spawnSessions`: البوابة الافتراضية لإنشاء جلسات عمل مرتبطة بالسلاسل من `sessions_spawn` وعمليات إنشاء سلاسل ACP. يكون الافتراضي `true` عند تمكين ارتباطات السلاسل؛ ويمكن للموفرين/الحسابات التجاوز.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي لعمليات الإنشاء المرتبطة بالسلاسل (`"fork"` أو `"isolated"`). يكون الافتراضي `"fork"`.

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

تجاوزات حسب القناة/الحساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

الحل (الأكثر تحديدا يفوز): الحساب ← القناة ← عام. يعطل `""` التسلسل ويوقفه. يستنتج `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير            | الوصف                  | مثال                       |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر    | `claude-opus-4-6`           |
| `{modelFull}`     | معرف النموذج الكامل    | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم الموفر             | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي   | `high`, `low`, `off`        |
| `{identity.name}` | اسم هوية الوكيل        | (مثل `"auto"`)              |

المتغيرات غير حساسة لحالة الأحرف. `{think}` اسم بديل لـ `{thinkingLevel}`.

### تفاعل الإقرار

- يكون الافتراضي `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبطه على `""` للتعطيل.
- تجاوزات حسب القناة: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب ← القناة ← `messages.ackReaction` ← بديل الهوية.
- النطاق: `group-mentions` (الافتراضي)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد على القنوات التي تدعم التفاعلات مثل Slack وDiscord وTelegram وWhatsApp وBlueBubbles.
- `messages.statusReactions.enabled`: يمكن تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  في Slack وDiscord، يبقي عدم الضبط تفاعلات الحالة مفعلة عندما تكون تفاعلات الإقرار نشطة.
  في Telegram، اضبطه صراحة على `true` لتمكين تفاعلات حالة دورة الحياة.

### تأخير الوارد

يجمع الرسائل النصية السريعة فقط من المرسل نفسه في دورة وكيل واحدة. تؤدي الوسائط/المرفقات إلى الإرسال الفوري. تتجاوز أوامر التحكم التأخير.

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off`، أو `always`، أو `inbound`، أو `tagged`. يمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعالة.
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للملخص التلقائي.
- يكون `modelOverrides` مفعلا افتراضيا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك صريح).
- تعود مفاتيح API احتياطيا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- موفرو الكلام المضمنون مملوكون لـ Plugin. إذا تم ضبط `plugins.allow`، فضمن كل Plugin موفر TTS تريد استخدامه، مثلا `microsoft` لـ Edge TTS. يقبل معرف الموفر القديم `edge` كاسم بديل لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو التكوين، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير تابعة لـ OpenAI، يتعامل OpenClaw معها كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## المحادثة

افتراضات وضع المحادثة (macOS/iOS/Android).

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
  },
}
```

- يجب أن يطابق `talk.provider` مفتاحا في `talk.providers` عند تكوين عدة موفري محادثة.
- مفاتيح المحادثة القديمة المسطحة (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) مخصصة للتوافق فقط ويتم ترحيلها تلقائيا إلى `talk.providers.<provider>`.
- تعود معرفات الأصوات احتياطيا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية عادية أو كائنات SecretRef.
- ينطبق بديل `ELEVENLABS_API_KEY` فقط عندما لا يكون أي مفتاح API للمحادثة مكونا.
- يتيح `providers.*.voiceAliases` لتوجيهات المحادثة استخدام أسماء مألوفة.
- يحدد `providers.mlx.modelId` مستودع Hugging Face المستخدم من مساعد MLX المحلي على macOS. إذا أغفل، يستخدم macOS ‏`mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر مساعد `openclaw-mlx-tts` المضمن عند وجوده، أو ملف تنفيذي على `PATH`؛ ويتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد للتطوير.
- يضبط `speechLocale` معرف لغة BCP 47 المستخدم في تعرف الكلام للمحادثة على iOS/macOS. اتركه غير مضبوط لاستخدام الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع المحادثة بعد صمت المستخدم قبل إرسال النص. يبقي عدم الضبط نافذة التوقف الافتراضية للنظام الأساسي (`700 ms on macOS and Android, 900 ms on iOS`).

---

## ذات صلة

- [مرجع التكوين](/ar/gateway/configuration-reference) — جميع مفاتيح التكوين الأخرى
- [التكوين](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة التكوين](/ar/gateway/configuration-examples)
