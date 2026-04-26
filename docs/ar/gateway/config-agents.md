---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، والتفكير، ومساحة العمل، وHeartbeat، والوسائط، وSkills)
    - تهيئة توجيه الوكلاء المتعددين وbindings
    - ضبط سلوك الجلسة وتسليم الرسائل ووضع talk
summary: الإعدادات الافتراضية للوكيل، وتوجيه الوكلاء المتعددين، وتهيئة الجلسات والرسائل وtalk
title: التهيئة — الوكلاء
x-i18n:
    generated_at: "2026-04-26T11:28:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

مفاتيح التهيئة على مستوى الوكيل ضمن `agents.*` و`multiAgent.*` و`session.*` و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات وبيئة تشغيل Gateway والمفاتيح الأخرى من المستوى الأعلى، راجع [مرجع التهيئة](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime ضمن مطالبة النظام. وإذا لم يتم تعيينه، يكتشفه OpenClaw تلقائيًا بالصعود من مساحة العمل إلى الأعلى.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية لـ Skills للوكلاء الذين لا يعيّنون
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
- احذف `agents.list[].skills` للوراثة من الإعدادات الافتراضية.
- عيّن `agents.list[].skills: []` لعدم وجود Skills.
- تمثل قائمة `agents.list[].skills` غير الفارغة المجموعة النهائية لذلك الوكيل؛
  ولا تُدمج مع الإعدادات الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap الخاصة بمساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في وقت حقن ملفات bootstrap الخاصة بمساحة العمل في مطالبة النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد اكتمال رد المساعد) إعادة حقن bootstrap الخاصة بمساحة العمل، مما يقلل حجم المطالبة. وتظل تشغيلات Heartbeat وعمليات إعادة المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: يعطّل حقن bootstrap الخاصة بمساحة العمل وملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة المطالبة بالكامل (محركات سياق مخصصة، أو بيئات تشغيل أصلية تبني سياقها بنفسها، أو تدفقات عمل متخصصة بلا bootstrap). كما تتخطى أدوار Heartbeat واسترداد Compaction الحقن أيضًا.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى للأحرف لكل ملف bootstrap في مساحة العمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى الإجمالي للأحرف المحقونة عبر جميع ملفات bootstrap الخاصة بمساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير الظاهر للوكيل عند اقتطاع سياق bootstrap.
الافتراضي: `"once"`.

- `"off"`: لا يحقن نص تحذير في مطالبة النظام أبدًا.
- `"once"`: يحقن التحذير مرة واحدة لكل بصمة اقتطاع فريدة (موصى به).
- `"always"`: يحقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يمتلك OpenClaw عدة ميزانيات كبيرة الحجم للمطالبة/السياق، وهي
مقسمة عمدًا حسب النظام الفرعي بدلًا من تدفقها جميعًا عبر
مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن bootstrap العادي لمساحة العمل.
- `agents.defaults.startupContext.*`:
  مقدمة بدء تشغيل لمرة واحدة لأوامر `/new` و`/reset`، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في مطالبة النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل محقونة يملكها وقت التشغيل.
- `memory.qmd.limits.*`:
  حجم مقتطفات بحث الذاكرة المفهرسة والحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى
ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في مقدمة سياق البدء للدور الأول المحقونة في تشغيلات `/new` و`/reset` العارية.

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

الإعدادات الافتراضية المشتركة لأسطح سياق وقت التشغيل المحدودة.

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
- `toolResultMaxChars`: الحد النشط لنتائج الأدوات المستخدم للنتائج المحفوظة
  واسترداد الفائض.
- `postCompactionMaxChars`: الحد الأقصى لمقتطف `AGENTS.md` المستخدم أثناء حقن
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

الحد العام لقائمة Skills المضغوطة المحقونة في مطالبة النظام. ولا
يؤثر هذا في قراءة ملفات `SKILL.md` عند الطلب.

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

الحد الأقصى لحجم البكسل لأطول ضلع في الصورة في كتل الصور ضمن النص/الأدوات قبل استدعاءات المزوّد.
الافتراضي: `1200`.

تؤدي القيم الأقل عادةً إلى تقليل استخدام رموز الرؤية وحجم حمولة الطلب للتشغيلات الثقيلة باللقطات.
أما القيم الأعلى فتحافظ على مزيد من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق مطالبة النظام (وليس للطوابع الزمنية للرسائل). وتعود إلى المنطقة الزمنية للمضيف عند عدم التعيين.

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
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
  - صيغة السلسلة تعيّن النموذج الأساسي فقط.
  - صيغة الكائن تعيّن النموذج الأساسي بالإضافة إلى نماذج التحويل الاحتياطي المرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` بوصفه تهيئة نموذج الرؤية.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الصور المشتركة وأي سطح أداة/Plugin مستقبلي ينشئ صورًا.
  - القيم المعتادة: `google/gemini-3.1-flash-image-preview` لإنشاء صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لـ OpenAI Images، أو `openai/gpt-image-1.5` لإخراج OpenAI PNG/WebP بخلفية شفافة.
  - إذا حددت مزوّدًا/نموذجًا مباشرة، فقم أيضًا بتهيئة مصادقة المزوّد المطابقة (مثل `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، و`FAL_KEY` لـ `fal/*`).
  - إذا حُذف، فلا يزال بإمكان `image_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. ويحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي إنشاء الصور المسجلين حسب ترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الموسيقى المشتركة وأداة `music_generate` المضمّنة.
  - القيم المعتادة: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.6`.
  - إذا حُذف، فلا يزال بإمكان `music_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. ويحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي إنشاء الموسيقى المسجلين حسب ترتيب معرّف المزوّد.
  - إذا حددت مزوّدًا/نموذجًا مباشرة، فقم أيضًا بتهيئة مصادقة/مفتاح API المطابق للمزوّد.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الفيديو المشتركة وأداة `video_generate` المضمّنة.
  - القيم المعتادة: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا حُذف، فلا يزال بإمكان `video_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. ويحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي إنشاء الفيديو المسجلين حسب ترتيب معرّف المزوّد.
  - إذا حددت مزوّدًا/نموذجًا مباشرة، فقم أيضًا بتهيئة مصادقة/مفتاح API المطابق للمزوّد.
  - يدعم مزوّد إنشاء الفيديو المضمّن Qwen ما يصل إلى 1 فيديو خرج، و1 صورة إدخال، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد هي `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- `pdfMaxBytesMb`: الحد الافتراضي لحجم PDF لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي ينظر إليها وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: مستوى verbose الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى الخرج elevated الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.5` للوصول بمفتاح API أو `openai-codex/gpt-5.5` لـ Codex OAuth). وإذا حذفت المزوّد، يحاول OpenClaw أولًا اسمًا بديلًا، ثم مطابقة فريدة لمزوّد مهيأ لذلك المعرّف النموذجي تمامًا، وبعدها فقط يعود إلى المزوّد الافتراضي المهيأ (سلوك توافق قديم، لذلك فضّل `provider/model` الصريح). وإذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيأ، يعود OpenClaw إلى أول مزوّد/نموذج مهيأ بدلًا من إظهار افتراضي قديم لمزوّد تمت إزالته.
- `models`: فهرس النماذج المهيأ وقائمة السماح لـ `/model`. ويمكن لكل إدخال أن يتضمن `alias` (اختصار) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` و`chat_template_kwargs` و`extra_body`/`extraBody`).
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. ويرفض `config set` عمليات الاستبدال التي من شأنها إزالة إدخالات قائمة السماح الحالية ما لم تمرر `--replace`.
  - تقوم تدفقات التهيئة/الإعداد الأولي على مستوى المزوّد بدمج نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين الآخرين المهيئين غير المرتبطين.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، يتم تمكين Compaction على جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction على جانب خادم OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على جميع النماذج. يتم تعيينها في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (في التهيئة): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم تتجاوز `agents.list[].params` (المطابقة لمعرّف الوكيل) حسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في هيئات طلبات `api: "openai-completions"` لوكلاء OpenAI-compatible proxy. وإذا تعارض مع مفاتيح الطلب التي أُنشئت، يفوز الجسم الإضافي؛ ومع ذلك، تظل مسارات completions غير الأصلية تزيل `store` الخاص بـ OpenAI بعد ذلك.
- `params.chat_template_kwargs`: وسيطات قالب الدردشة المتوافقة مع vLLM/OpenAI والتي تُدمج في هيئات الطلب ذات المستوى الأعلى لـ `api: "openai-completions"`. بالنسبة إلى `vllm/nemotron-3-*` مع تعطيل التفكير، يرسل OpenClaw تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ وتتجاوز `chat_template_kwargs` الصريحة هذه القيم الافتراضية، وتظل `extra_body.chat_template_kwargs` ذات الأسبقية النهائية.
- `params.preserveThinking`: تمكين اختياري خاص بـ Z.AI للحفاظ على التفكير. وعند التمكين مع تشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: سياسة بيئة تشغيل الوكيل منخفضة المستوى الافتراضية. وعند حذف المعرّف، يكون الافتراضي هو OpenClaw Pi. استخدم `id: "pi"` لفرض حزمة PI المضمّنة، أو `id: "auto"` للسماح لحِزم Plugin المسجلة بالمطالبة بالنماذج المدعومة، أو معرّف حزمة مسجلة مثل `id: "codex"`، أو اسمًا بديلًا لواجهة خلفية CLI مدعومة مثل `id: "claude-cli"`. عيّن `fallback: "none"` لتعطيل الرجوع التلقائي إلى PI. وتفشل بيئات تشغيل Plugin الصريحة مثل `codex` في الوضع المغلق افتراضيًا ما لم تعيّن `fallback: "pi"` في نطاق التجاوز نفسه. احتفظ بمراجع النموذج بصيغتها الأساسية `provider/model`؛ وحدد Codex وClaude CLI وGemini CLI وغيرها من واجهات التنفيذ الخلفية عبر تهيئة runtime بدلًا من بادئات مزوّد runtime القديمة. راجع [بيئات تشغيل الوكيل](/ar/concepts/agent-runtimes) لفهم الفرق بينها وبين اختيار المزوّد/النموذج.
- تحفظ أدوات كتابة التهيئة التي تعدّل هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة fallback) صيغة الكائن الأساسية وتحافظ على قوائم fallback الحالية قدر الإمكان.
- `maxConcurrent`: الحد الأقصى للتشغيلات المتوازية للوكلاء عبر الجلسات (مع بقاء كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.agentRuntime`

يتحكم `agentRuntime` في المنفّذ منخفض المستوى الذي يشغّل أدوار الوكيل. يجب
أن تُبقي معظم عمليات النشر على بيئة تشغيل OpenClaw Pi الافتراضية. واستخدمه عندما
يوفر Plugin موثوق حزمة أصلية، مثل حزمة Codex app-server المضمّنة،
أو عندما تريد واجهة خلفية CLI مدعومة مثل Claude CLI. وللاطلاع على النموذج
الذهني، راجع [بيئات تشغيل الوكيل](/ar/concepts/agent-runtimes).

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

- `id`: إما `"auto"` أو `"pi"` أو معرّف حزمة Plugin مسجلة أو اسم بديل لواجهة خلفية CLI مدعومة. يسجّل Plugin Codex المضمّن `codex`؛ بينما يوفر Plugin Anthropic المضمّن الواجهة الخلفية `claude-cli` لـ CLI.
- `fallback`: إما `"pi"` أو `"none"`. في `id: "auto"`، يكون الرجوع غير المعيّن افتراضيًا `"pi"` حتى تتمكن التهيئات القديمة من مواصلة استخدام PI عندما لا تطالب أي حزمة Plugin بتشغيل ما. وفي وضع بيئة تشغيل Plugin الصريحة، مثل `id: "codex"`، يكون الرجوع غير المعيّن افتراضيًا `"none"` حتى يفشل غياب الحزمة بدلًا من استخدام PI بصمت. ولا ترث تجاوزات runtime قيمة fallback من نطاق أوسع؛ لذا عيّن `fallback: "pi"` إلى جانب بيئة التشغيل الصريحة عندما تريد عمدًا هذا الرجوع التوافقي. وتظهر دائمًا أعطال الحزمة Plugin المحددة مباشرة.
- تجاوزات البيئة: يؤدي `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` إلى تجاوز `id`؛ ويؤدي `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` إلى تجاوز fallback لتلك العملية.
- بالنسبة إلى عمليات نشر Codex فقط، عيّن `model: "openai/gpt-5.5"` و`agentRuntime.id: "codex"`. ويمكنك أيضًا تعيين `agentRuntime.fallback: "none"` صراحة لزيادة الوضوح؛ فهو الافتراضي لبيئات تشغيل Plugin الصريحة.
- بالنسبة إلى عمليات نشر Claude CLI، ففضّل `model: "anthropic/claude-opus-4-7"` مع `agentRuntime.id: "claude-cli"`. وما تزال مراجع النماذج القديمة مثل `claude-cli/claude-opus-4-7` تعمل للتوافق، لكن التهيئة الجديدة يجب أن تبقي اختيار المزوّد/النموذج بصيغته الأساسية وتضع واجهة التنفيذ الخلفية في `agentRuntime.id`.
- يعيد `openclaw doctor --fix` كتابة مفاتيح سياسات runtime الأقدم إلى `agentRuntime`.
- يتم تثبيت اختيار الحزمة لكل معرّف جلسة بعد أول تشغيل مضمّن. وتؤثر تغييرات التهيئة/البيئة في الجلسات الجديدة أو المعاد تعيينها، لا في نص موجود. وتُعامل الجلسات القديمة التي تملك سجل نصوص لكن من دون تثبيت مسجل على أنها مثبتة على PI. ويعرض `/status` بيئة التشغيل الفعلية، مثل `Runtime: OpenClaw Pi Default` أو `Runtime: OpenAI Codex`.
- يتحكم هذا فقط في تنفيذ أدوار الوكيل النصية. أما إنشاء الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS، فتظل تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**الأسماء البديلة المختصرة المضمّنة** (لا تُطبّق إلا عندما يكون النموذج ضمن `agents.defaults.models`):

| الاسم البديل         | النموذج                                    |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` أو `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

تنتصر الأسماء البديلة المهيأة لديك دائمًا على القيم الافتراضية.

تقوم نماذج Z.AI GLM-4.x تلقائيًا بتمكين وضع التفكير ما لم تعيّن `--thinking off` أو تُعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
وتقوم نماذج Z.AI بتمكين `tool_stream` افتراضيًا لبث استدعاءات الأدوات. عيّن `agents.defaults.models["zai/<model>"].params.tool_stream` إلى `false` لتعطيله.
وتستخدم نماذج Anthropic Claude 4.6 وضع التفكير `adaptive` افتراضيًا عند عدم تعيين مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات خلفية CLI اختيارية لتشغيلات الرجوع الاحتياطي النصية فقط (من دون استدعاءات أدوات). وهي مفيدة كنسخة احتياطية عند فشل مزوّدي API.

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
          // أو استخدم systemPromptFileArg عندما تقبل CLI علمًا لملف مطالبة.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- واجهات CLI الخلفية تعتمد على النص أولًا؛ ويتم دائمًا تعطيل الأدوات.
- تُدعَم الجلسات عند تعيين `sessionArg`.
- يُدعَم تمرير الصور عند قبول `imageArg` لمسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدال مطالبة النظام الكاملة التي يجمعها OpenClaw بسلسلة ثابتة. يتم تعيينها على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). وتكون القيم الخاصة بكل وكيل ذات أسبقية أعلى؛ ويتم تجاهل القيمة الفارغة أو التي تحتوي على مسافات بيضاء فقط. وهي مفيدة لتجارب المطالبات المضبوطة.

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

تراكبات مطالبات مستقلة عن المزوّد تُطبَّق حسب عائلة النموذج. وتتلقى معرّفات نماذج GPT-5 المشترَك السلوكي نفسه عبر المزوّدين؛ بينما يتحكم `personality` فقط في طبقة أسلوب التفاعل الودّي.

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

- يؤدي `"friendly"` (الافتراضي) و`"on"` إلى تمكين طبقة أسلوب التفاعل الودّي.
- يؤدي `"off"` إلى تعطيل الطبقة الودّية فقط؛ بينما يظل عقد السلوك المعلَّم لـ GPT-5 مفعّلًا.
- لا تزال القيمة القديمة `plugins.entries.openai.config.personality` تُقرأ عندما لا يكون هذا الإعداد المشترك معيّنًا.

### `agents.defaults.heartbeat`

تشغيلات Heartbeat الدورية.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m للتعطيل
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // الافتراضي: true؛ تؤدي false إلى حذف قسم Heartbeat من مطالبة النظام
        lightContext: false, // الافتراضي: false؛ تؤدي true إلى الإبقاء على HEARTBEAT.md فقط من ملفات bootstrap لمساحة العمل
        isolatedSession: false, // الافتراضي: false؛ تؤدي true إلى تشغيل كل Heartbeat في جلسة جديدة (من دون سجل محادثة)
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

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). عيّنها إلى `0m` للتعطيل.
- `includeSystemPromptSection`: عند تعيينه إلى false، يحذف قسم Heartbeat من مطالبة النظام ويتخطى حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند تعيينه إلى true، يتم كتم حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل Heartbeat قبل إلغائه. اتركه غير معيّن لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/الرسائل المباشرة. يسمح `allow` (الافتراضي) بالتسليم المباشر للهدف. أما `block` فيكتم التسليم المباشر للهدف ويصدر `reason=dm-blocked`.
- `lightContext`: عند تعيينه إلى true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيف الوزن وتبقي فقط `HEARTBEAT.md` من ملفات bootstrap لمساحة العمل.
- `isolatedSession`: عند تعيينه إلى true، تعمل كل Heartbeat في جلسة جديدة من دون أي سجل محادثة سابق. وهو نمط العزل نفسه في Cron `sessionTarget: "isolated"`. ويخفض تكلفة الرموز لكل Heartbeat من نحو 100 ألف إلى نحو 2-5 آلاف رمز.
- لكل وكيل: عيّن `agents.list[].heartbeat`. وعندما يعرّف أي وكيل `heartbeat`، **فإن هؤلاء الوكلاء فقط** هم الذين يشغّلون Heartbeat.
- تشغّل Heartbeat أدوار وكيل كاملة — وكلما كانت الفترات أقصر زاد استهلاك الرموز.

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
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // تُستخدم عندما يكون identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] لتعطيل إعادة الحقن
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز اختياري للنموذج مخصص لـ Compaction فقط
        notifyUser: true, // إرسال إشعارات مختصرة عندما يبدأ Compaction ويكتمل (الافتراضي: false)
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

- `mode`: إما `default` أو `safeguard` (تلخيص مجزّأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزوّد Compaction مسجّل. وعند تعيينه، يتم استدعاء `summarize()` الخاصة بالمزوّد بدلًا من تلخيص LLM المضمّن. ويعود إلى المضمّن عند الفشل. ويؤدي تعيين مزوّد إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى للثواني المسموح بها لعملية Compaction واحدة قبل أن يجهضها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة القطع في Pi للاحتفاظ بذيل النص الأحدث كما هو. ويحترم `/compact` اليدوي هذا الإعداد عندما يكون معينًا صراحة؛ وإلا يكون Compaction اليدوي نقطة تحقق صارمة.
- `identifierPolicy`: إما `strict` (الافتراضي) أو `off` أو `custom`. وتضيف `strict` إرشادات مضمّنة للاحتفاظ بالمعرّفات المعتمة في مقدمة تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند الخرج غير السليم لملخصات safeguard. وهي مفعّلة افتراضيًا في وضع safeguard؛ وعيّن `enabled: false` لتخطي التدقيق.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من `AGENTS.md` لإعادة حقنها بعد Compaction. والافتراضي هو `["Session Startup", "Red Lines"]`؛ وعيّن `[]` لتعطيل إعادة الحقن. وعندما تكون غير معيّنة أو معيّنة صراحة إلى هذا الزوج الافتراضي، يتم أيضًا قبول العناوين الأقدم `Every Session`/`Safety` كخيار رجوع قديم.
- `model`: تجاوز اختياري لـ `provider/model-id` لتلخيص Compaction فقط. استخدمه عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما يجب أن تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم تعيينه، يستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عند تعيينه إلى `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثل "Compacting context..." و"Compaction complete"). وهو معطّل افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دور وكيلي صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. ويتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقوم بتشذيب **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل إرسالها إلى LLM. وهو **لا** يغير سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // مدة (ms/s/m/h)، والوحدة الافتراضية: الدقائق
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

- يؤدي `mode: "cache-ttl"` إلى تمكين تمريرات التشذيب.
- يتحكم `ttl` في عدد مرات إمكانية تشغيل التشذيب مجددًا (بعد آخر لمسة على cache).
- يقوم التشذيب أولًا باقتطاع نتائج الأدوات الكبيرة اقتطاعًا ناعمًا، ثم يزيل نتائج الأدوات الأقدم إزالة صارمة إذا لزم الأمر.

**الاقتطاع الناعم** يبقي البداية + النهاية ويدرج `...` في الوسط.

**الإزالة الصارمة** تستبدل نتيجة الأداة بأكملها بالعنصر النائب.

ملاحظات:

- لا يتم اقتطاع/إزالة كتل الصور مطلقًا.
- تعتمد النسب على عدد الأحرف (تقريبية)، وليست على عدد الرموز بدقة.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، يتم تخطي التشذيب.

</Accordion>

راجع [Session Pruning](/ar/concepts/session-pruning) لمعرفة تفاصيل السلوك.

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

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحة لتمكين ردود الكتل.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات لكل حساب). وتكون Signal/Slack/Discord/Google Chat افتراضيًا `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين ردود الكتل. و`natural` = ‏800–2500ms. والتجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [Streaming](/ar/concepts/streaming) لمعرفة تفاصيل السلوك + التقسيم إلى كتل.

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

- الإعدادات الافتراضية: `instant` للدردشات المباشرة/الإشارات، و`message` للدردشات الجماعية غير المشار فيها.
- تجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [Typing Indicators](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

وضع sandbox اختياري للوكيل المضمّن. راجع [Sandboxing](/ar/gateway/sandboxing) للحصول على الدليل الكامل.

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
          // كذلك يتم دعم SecretRefs / المحتويات المضمّنة:
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

- `docker`: بيئة Docker محلية (الافتراضي)
- `ssh`: بيئة بعيدة عامة معتمدة على SSH
- `openshell`: بيئة OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة ببيئة التشغيل إلى
`plugins.entries.openshell.config`.

**تهيئة الواجهة الخلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمّنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مقابض سياسة مفاتيح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- تتغلب `identityData` على `identityFile`
- تتغلب `certificateData` على `certificateFile`
- تتغلب `knownHostsData` على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من لقطة بيئة الأسرار النشطة قبل بدء جلسة Sandbox

**سلوك الواجهة الخلفية SSH:**

- تزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تُبقي مساحة عمل SSH البعيدة هي المرجع الأساسي
- وتوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- ولا تزامن التغييرات البعيدة عكسيًا إلى المضيف تلقائيًا
- ولا تدعم حاويات المتصفح في Sandbox

**وصول مساحة العمل:**

- `none`: مساحة عمل Sandbox لكل نطاق ضمن `~/.openclaw/sandboxes`
- `ro`: مساحة عمل Sandbox عند `/workspace`، وتُركّب مساحة عمل الوكيل للقراءة فقط عند `/agent`
- `rw`: تُركّب مساحة عمل الوكيل للقراءة والكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**تهيئة Plugin الخاص بـ OpenShell:**

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

- `mirror`: يزرع البيئة البعيدة من البيئة المحلية قبل `exec`، ويزامنها عكسيًا بعد `exec`؛ وتبقى مساحة العمل المحلية هي المرجع الأساسي
- `remote`: يزرع البيئة البعيدة مرة واحدة عند إنشاء Sandbox، ثم يُبقي مساحة العمل البعيدة هي المرجع الأساسي

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw تلقائيًا إلى Sandbox بعد خطوة الزرع الأولية.
تكون وسيلة النقل عبر SSH إلى OpenShell Sandbox، لكن Plugin يملك دورة حياة Sandbox ومزامنة المرآة الاختيارية.

يعمل **`setupCommand`** مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويحتاج إلى خروج شبكي وجذر قابل للكتابة ومستخدم root.

**تستخدم الحاويات افتراضيًا `network: "none"`** — عيّنه إلى `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
ويتم حظر `"host"`. كما يتم حظر `"container:<id>"` افتراضيًا ما لم تعيّن صراحة
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (خيار طوارئ).

**المرفقات الواردة** يتم تجهيزها في `media/inbound/*` داخل مساحة العمل النشطة.

**`docker.binds`** يركّب أدلة إضافية من المضيف؛ ويتم دمج التركيبات العامة والتركيبات الخاصة بكل وكيل.

**المتصفح داخل Sandbox** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. ويتم حقن URL الخاص بـ noVNC في مطالبة النظام. ولا يتطلب `browser.enabled` في `openclaw.json`.
ويستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL برمز قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (الافتراضي) يمنع الجلسات داخل Sandbox من استهداف متصفح المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). عيّنها إلى `bridge` فقط عندما تريد صراحة اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند حافة الحاوية إلى نطاق CIDR (مثل `172.21.0.1/32`).
- يركّب `sandbox.browser.binds` أدلة إضافية من المضيف داخل حاوية متصفح Sandbox فقط. وعند تعيينه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- يتم تعريف افتراضيات الإطلاق في `scripts/sandbox-browser-entrypoint.sh` وضبطها لمضيفي الحاويات:
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
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تمكين الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ وعيّن `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تمكين `noSandbox`.
  - تمثل الافتراضيات خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير افتراضيات الحاوية.

</Accordion>

تتوفر عزل المتصفح و`sandbox.docker.binds` في Docker فقط.

ابنِ الصور:

```bash
scripts/sandbox-setup.sh           # صورة Sandbox الرئيسية
scripts/sandbox-browser-setup.sh   # صورة المتصفح الاختيارية
```

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح وكيل مزوّد TTS خاصًا به، أو صوتًا، أو نموذجًا،
أو نمطًا، أو وضع TTS تلقائيًا خاصًا به. وتُدمج كتلة الوكيل بعمق فوق
`messages.tts` العامة، بحيث يمكن أن تظل بيانات الاعتماد المشتركة في مكان
واحد بينما تتجاوز الوكلاء الأفراد فقط حقول الصوت أو المزوّد التي يحتاجونها. ويُطبَّق تجاوز
الوكيل النشط على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، وأداة
الوكيل `tts`. راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
للحصول على أمثلة للمزوّدين والأسبقية.

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
        reasoningDefault: "on", // تجاوز إظهار الاستدلال لكل وكيل
        fastModeDefault: false, // تجاوز الوضع السريع لكل وكيل
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // يتجاوز params المطابقة في defaults.models حسب المفتاح
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // يستبدل agents.defaults.skills عند تعيينه
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
- `default`: عند تعيين عدة وكلاء، يفوز الأول (مع تسجيل تحذير). وإذا لم يُعيَّن أي وكيل، يكون الإدخال الأول في القائمة هو الافتراضي.
- `model`: صيغة السلسلة تتجاوز `primary` فقط؛ أما صيغة الكائن `{ primary, fallbacks }` فتتجاوز كليهما (`[]` يعطّل fallbackات العامة). وتظل وظائف Cron التي تتجاوز `primary` فقط ترث fallbackات الافتراضية ما لم تعيّن `fallbacks: []`.
- `params`: معلمات تدفق خاصة بكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. وتُدمج هذه الكتلة بعمق فوق `messages.tts`، لذا احتفظ ببيانات اعتماد المزوّد المشتركة وسياسة fallback في `messages.tts`، وعيّن هنا فقط القيم الخاصة بالشخصية مثل المزوّد أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. وإذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ أما القائمة الصريحة فتستبدل الإعدادات الافتراضية بدلًا من دمجها، و`[]` تعني عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة. ويتحكم ملف تعريف المزوّد/النموذج المحدد في القيم الصالحة؛ وبالنسبة إلى Google Gemini، فإن `adaptive` يبقي التفكير الديناميكي المملوك للمزوّد (`thinkingLevel` يُحذف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: تجاوز اختياري لإظهار الاستدلال الافتراضي لكل وكيل (`on | off | stream`). ويُطبَّق عندما لا يكون هناك تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: الافتراضي الاختياري للوضع السريع لكل وكيل (`true | false`). ويُطبَّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `agentRuntime`: تجاوز اختياري لسياسة بيئة التشغيل منخفضة المستوى لكل وكيل. استخدم `{ id: "codex" }` لجعل وكيل واحد مخصّصًا لـ Codex بينما يبقي الوكلاء الآخرون fallback الافتراضي PI في وضع `auto`.
- `runtime`: واصف بيئة تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع الإعدادات الافتراضية لـ `runtime.acp` (`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يستخدم الوكيل افتراضيًا جلسات حزمة ACP.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو URL يبدأ بـ `http(s)`، أو URI يبدأ بـ `data:`.
- يستنتج `identity` القيم الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح بمعرّفات الوكلاء لـ `sessions_spawn` (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حاجز وراثة Sandbox: إذا كانت جلسة الطالب داخل Sandbox، فإن `sessions_spawn` يرفض الأهداف التي ستعمل من دون Sandbox.
- `subagents.requireAgentId`: عند تعيينه إلى true، يمنع استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## توجيه الوكلاء المتعددين

شغّل عدة وكلاء معزولين داخل Gateway واحدة. راجع [الوكلاء المتعددون](/ar/concepts/multi-agent).

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

### حقول مطابقة Binding

- `type` (اختياري): `route` للتوجيه العادي (عند غياب النوع يكون الافتراضي هو route)، و`acp` لروابط محادثات ACP الدائمة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ والحذف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقنوات)
- `acp` (اختياري؛ فقط لإدخالات `type: "acp"`): ‏`{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، من دون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل طبقة، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw المطابقة وفق هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب طبقات route binding أعلاه.

### ملفات وصول لكل وكيل

<Accordion title="وصول كامل (من دون Sandbox)">

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

راجع [Sandbox وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة تفاصيل الأسبقية.

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
    parentForkMaxTokens: 100000, // تخطي تفرع سلسلة الأصل فوق هذا العدد من الرموز (0 للتعطيل)
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
      idleHours: 24, // الافتراضي لإلغاء التركيز التلقائي بعد الخمول بالساعات (`0` للتعطيل)
      maxAgeHours: 0, // الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` للتعطيل)
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

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات الدردشة الجماعية.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة ضمن سياق القناة.
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون المقصود سياقًا مشتركًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك جميع الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: عزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: عزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: عزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: خريطة من المعرّفات الأساسية إلى peers ذوي بادئات المزوّد لمشاركة الجلسة عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. يقوم `daily` بإعادة التعيين عند `atHour` بالتوقيت المحلي؛ بينما يقوم `idle` بإعادة التعيين بعد `idleMinutes`. وعند تهيئة الاثنين معًا، يفوز أول من تنتهي صلاحيته. تستخدم حداثة إعادة التعيين اليومية قيمة `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة التعيين عند الخمول `lastInteractionAt`. وقد تحدّث كتابات الخلفية/أحداث النظام مثل Heartbeat وتنبيهات Cron وإشعارات exec وأعمال Gateway الإدارية قيمة `updatedAt`، لكنها لا تُبقي الجلسات اليومية/الخاملة حديثة.
- **`resetByType`**: تجاوزات حسب النوع (`direct` و`group` و`thread`). ويُقبل الاسم القديم `dm` كاسم بديل لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى لـ `totalTokens` في جلسة الأصل المسموح به عند إنشاء جلسة سلسلة متفرعة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` في الأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة سلسلة جديدة بدلًا من وراثة سجل نص الأصل.
  - عيّن `0` لتعطيل هذا الحاجز والسماح دائمًا بالتفرع من الأصل.
- **`mainKey`**: حقل قديم. ويستخدم وقت التشغيل دائمًا `"main"` لدلو الدردشة المباشرة الرئيسي.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`–`5`). وتعطّل القيمة `0` تسلسل ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. يفوز أول deny.
- **`maintenance`**: ضوابط تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: يؤدي `warn` إلى إصدار تحذيرات فقط؛ بينما يطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عند تجاوزه هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. والافتراضي هو `pruneAfter`؛ وعيّن `false` للتعطيل.
  - `maxDiskBytes`: ميزانية اختيارية لدليل الجلسات على القرص. وفي وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. والافتراضي `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين تجاوزه؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: الإلغاء التلقائي الافتراضي للتركيز بعد الخمول بالساعات (`0` للتعطيل؛ ويمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` للتعطيل؛ ويمكن للمزوّدين التجاوز)

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
      debounceMs: 2000, // 0 للتعطيل
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

آلية الحل (الأكثر تحديدًا يفوز): الحساب ← القناة ← العام. وتؤدي `""` إلى التعطيل وإيقاف التسلسل. أما `"auto"` فتشتق `[{identity.name}]`.

**متغيرات القالب:**

| المتغير            | الوصف                  | المثال                      |
| ------------------ | ---------------------- | --------------------------- |
| `{model}`          | اسم النموذج المختصر    | `claude-opus-4-6`           |
| `{modelFull}`      | معرّف النموذج الكامل   | `anthropic/claude-opus-4-6` |
| `{provider}`       | اسم المزوّد            | `anthropic`                 |
| `{thinkingLevel}`  | مستوى التفكير الحالي   | `high`، `low`، `off`        |
| `{identity.name}`  | اسم هوية الوكيل        | (نفس `"auto"`)              |

المتغيرات غير حساسة لحالة الأحرف. و`{think}` هو اسم بديل لـ `{thinkingLevel}`.

### تفاعل التأكيد

- تكون القيمة الافتراضية هي `identity.emoji` للوكيل النشط، وإلا `"👀"`. عيّن `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب ← القناة ← `messages.ackReaction` ← الرجوع إلى identity.
- النطاق: `group-mentions` (الافتراضي) أو `group-all` أو `direct` أو `all`.
- يقوم `removeAckAfterReply` بإزالة تفاعل التأكيد بعد الرد في القنوات القابلة للتفاعلات مثل Slack وDiscord وTelegram وWhatsApp وBlueBubbles.
- يؤدي `messages.statusReactions.enabled` إلى تمكين تفاعلات حالة دورة الحياة في Slack وDiscord وTelegram.
  في Slack وDiscord، يؤدي تركه غير معيّن إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات التأكيد نشطة.
  وفي Telegram، عيّنه صراحة إلى `true` لتمكين تفاعلات حالة دورة الحياة.

### إزالة الارتداد للرسائل الواردة

تجمع الرسائل النصية السريعة فقط من المرسل نفسه في دور وكيل واحد. وتُفرغ الوسائط/المرفقات فورًا. وتتجاوز أوامر التحكم إزالة الارتداد.

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
- تكون `modelOverrides` مفعّلة افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (تمكين اختياري).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يملك مزوّدو الكلام المضمّنون Plugins خاصة بهم. وإذا تم تعيين `plugins.allow`، فأدرج كل Plugin لمزوّد TTS تريد استخدامه، مثل `microsoft` لـ Edge TTS. ويُقبل معرّف المزوّد القديم `edge` كاسم بديل لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. وترتيب الحل هو التهيئة، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير OpenAI، يتعامل OpenClaw معها على أنها خادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## talk

الإعدادات الافتراضية لوضع talk ‏(macOS/iOS/Android).

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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تهيئة عدة مزوّدي talk.
- إن مفاتيح talk القديمة المسطحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط ويتم ترحيلها تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الأصوات إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- لا يُطبَّق الرجوع إلى `ELEVENLABS_API_KEY` إلا عندما لا يكون مفتاح API الخاص بـ talk معيّنًا.
- يسمح `providers.*.voiceAliases` لتوجيهات talk باستخدام أسماء ودية.
- يحدد `providers.mlx.modelId` مستودع Hugging Face المستخدم بواسطة المساعد المحلي MLX في macOS. وإذا حُذف، يستخدم macOS القيمة `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX في macOS عبر المساعد المضمّن `openclaw-mlx-tts` عند توفره، أو عبر ملف تنفيذي موجود في `PATH`؛ ويتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد لأغراض التطوير.
- يعيّن `speechLocale` معرّف اللغة المحلية BCP 47 المستخدم في التعرف على الكلام في وضع talk على iOS/macOS. اتركه غير معيّن لاستخدام افتراضي الجهاز.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع talk بعد صمت المستخدم قبل إرسال النص المنسوخ. ويؤدي تركه غير معيّن إلى الإبقاء على نافذة التوقف الافتراضية الخاصة بالنظام (`700 ms` على macOS وAndroid، و`900 ms` على iOS).

---

## ذو صلة

- [مرجع التهيئة](/ar/gateway/configuration-reference) — جميع مفاتيح التهيئة الأخرى
- [التهيئة](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة التهيئة](/ar/gateway/configuration-examples)
