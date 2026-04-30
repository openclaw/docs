---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين توجيه متعدد الوكلاء والارتباطات
    - تعديل سلوك الجلسة وتسليم الرسائل ووضع التحدث
summary: الإعدادات الافتراضية للوكيل، والتوجيه متعدد الوكلاء، والجلسة، والرسائل، وإعدادات المحادثة
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-04-30T16:28:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6a38f42c35c6c6e46d6d00ad710c6c80d78703e0b7e3388f5631cf91eb17084
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح الإعدادات ذات النطاق الخاص بالوكيل ضمن `agents.*` و`multiAgent.*` و`session.*`،
و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات وزمن تشغيل Gateway والمفاتيح الأخرى
ذات المستوى الأعلى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## إعدادات الوكيل الافتراضية

### `agents.defaults.workspace`

القيمة الافتراضية: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime ضمن موجه النظام. إذا لم يُضبط، يكتشف OpenClaw ذلك تلقائيًا عبر الصعود من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح اختيارية افتراضية للمهارات للوكلاء الذين لا يضبطون
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

- احذف `agents.defaults.skills` لإتاحة المهارات بلا قيود افتراضيًا.
- احذف `agents.list[].skills` لوراثة القيم الافتراضية.
- اضبط `agents.list[].skills: []` لعدم إتاحة أي مهارات.
- قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛ فهي
  لا تندمج مع القيم الافتراضية.

### `agents.defaults.skipBootstrap`

يعطل الإنشاء التلقائي لملفات تمهيد مساحة العمل (`AGENTS.md`، و`SOUL.md`، و`TOOLS.md`، و`IDENTITY.md`، و`USER.md`، و`HEARTBEAT.md`، و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في وقت حقن ملفات تمهيد مساحة العمل في موجه النظام. القيمة الافتراضية: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد استجابة مكتملة من المساعد) إعادة حقن تمهيد مساحة العمل، مما يقلل حجم الموجه. ما زالت عمليات Heartbeat وإعادة المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: يعطل تمهيد مساحة العمل وحقن ملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة الموجه بالكامل (محركات سياق مخصصة، أو أزمنة تشغيل أصلية تبني سياقها الخاص، أو مسارات عمل متخصصة بلا تمهيد). تتخطى أيضًا أدوار Heartbeat واسترداد Compaction الحقن.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

أقصى عدد أحرف لكل ملف تمهيد مساحة عمل قبل الاقتطاع. القيمة الافتراضية: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

أقصى إجمالي أحرف يُحقن عبر جميع ملفات تمهيد مساحة العمل. القيمة الافتراضية: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عندما يُقتطع سياق التمهيد.
القيمة الافتراضية: `"once"`.

- `"off"`: لا يحقن نص التحذير في موجه النظام أبدًا.
- `"once"`: يحقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: يحقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات عالية الحجم للموجه/السياق، وهي
مقسمة عمدًا حسب النظام الفرعي بدلًا من مرورها كلها عبر مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  تمهيد تشغيل النموذج لمرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة. تُقر أوامر الدردشة المجردة `/new` و`/reset`
  بإعادة الضبط دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في موجه النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات زمن التشغيل المحدودة والكتل المحقونة المملوكة لزمن التشغيل.
- `memory.qmd.limits.*`:
  مقتطف بحث الذاكرة المفهرس وأحجام الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء التشغيل للدور الأول المحقون عند تشغيلات نموذج إعادة الضبط/بدء التشغيل.
تُقر أوامر الدردشة المجردة `/new` و`/reset` بإعادة الضبط دون استدعاء
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

القيم الافتراضية المشتركة لأسطح سياق زمن التشغيل المحدودة.

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
- `memoryGetDefaultLines`: نافذة أسطر `memory_get` الافتراضية عند حذف `lines`.
- `toolResultMaxChars`: حد نتيجة الأداة الحية المستخدم للنتائج المحفوظة
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

الحد العام لقائمة Skills المضغوطة المحقونة في موجه النظام. هذا
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

أقصى حجم بالبكسل لأطول ضلع في الصورة ضمن كتل صور النص/الأداة قبل استدعاءات المزود.
القيمة الافتراضية: `1200`.

تقلل القيم الأقل عادةً استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات كثيرة لقطات الشاشة.
تحافظ القيم الأعلى على مزيد من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجه النظام (وليس الطوابع الزمنية للرسائل). تعود إلى المنطقة الزمنية للمضيف عند عدم توفرها.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في موجه النظام. القيمة الافتراضية: `auto` (تفضيل نظام التشغيل).

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

- `model`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يضبط شكل السلسلة النصية النموذج الأساسي فقط.
  - يضبط شكل الكائن النموذج الأساسي بالإضافة إلى نماذج تجاوز الفشل المرتبة.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يستخدمه مسار أداة `image` كتكوين نموذج الرؤية الخاص بها.
  - يستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرفات المجردة للتوافق؛ إذا طابق معرف مجرد بشكل فريد إدخالًا مهيأً يدعم الصور في `models.providers.*.models`، يؤهله OpenClaw لذلك المزوّد. تتطلب المطابقات المهيأة الملتبسة بادئة مزوّد صريحة.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولد الصور.
  - القيم المعتادة: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لصور OpenAI، أو `openai/gpt-image-1.5` لإخراج OpenAI بصيغة PNG/WebP بخلفية شفافة.
  - إذا اخترت مزوّدًا/نموذجًا مباشرة، فهيّئ مصادقة المزوّد المطابقة أيضًا (مثلًا `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، أو `FAL_KEY` لـ `fal/*`).
  - إذا حُذف، فما يزال بإمكان `image_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يحاول المزوّد الافتراضي الحالي أولًا، ثم باقي مزوّدي توليد الصور المسجلين بترتيب معرف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الموسيقى المشتركة وأداة `music_generate` المضمنة.
  - القيم المعتادة: `google/lyria-3-clip-preview`، أو `google/lyria-3-pro-preview`، أو `minimax/music-2.6`.
  - إذا حُذف، فما يزال بإمكان `music_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يحاول المزوّد الافتراضي الحالي أولًا، ثم باقي مزوّدي توليد الموسيقى المسجلين بترتيب معرف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرة، فهيّئ مصادقة المزوّد/مفتاح API المطابق أيضًا.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه قدرة توليد الفيديو المشتركة وأداة `video_generate` المضمنة.
  - القيم المعتادة: `qwen/wan2.6-t2v`، أو `qwen/wan2.6-i2v`، أو `qwen/wan2.6-r2v`، أو `qwen/wan2.6-r2v-flash`، أو `qwen/wan2.7-r2v`.
  - إذا حُذف، فما يزال بإمكان `video_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يحاول المزوّد الافتراضي الحالي أولًا، ثم باقي مزوّدي توليد الفيديو المسجلين بترتيب معرف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرة، فهيّئ مصادقة المزوّد/مفتاح API المطابق أيضًا.
  - يدعم مزوّد توليد الفيديو Qwen المضمن ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد هي `size`، و`aspectRatio`، و`resolution`، و`audio`، و`watermark`.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تستخدمه أداة `pdf` لتوجيه النماذج.
  - إذا حُذف، تعود أداة PDF احتياطيًا إلى `imageModel`، ثم إلى نموذج الجلسة/الافتراضي المحلول.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي ينظر فيها وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، و`"on"`، و`"full"`. الافتراضي: `"off"`.
- `reasoningDefault`: ظهور الاستدلال الافتراضي للوكلاء. القيم: `"off"`، و`"on"`، و`"stream"`. يتجاوز `agents.list[].reasoningDefault` الخاص بكل وكيل هذا الافتراضي. لا تُطبق افتراضيات الاستدلال المهيأة إلا للمالكين، أو المرسلين المصرح لهم، أو سياقات Gateway الخاصة بمشرف التشغيل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، و`"on"`، و`"ask"`، و`"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` (مثل `openai/gpt-5.5` للوصول بمفتاح API أو `openai-codex/gpt-5.5` لـ Codex OAuth). إذا حذفت المزوّد، يحاول OpenClaw اسمًا مستعارًا أولًا، ثم مطابقة مزوّد مهيأ فريدة لمعرف النموذج الدقيق هذا، وبعد ذلك فقط يعود احتياطيًا إلى المزوّد الافتراضي المهيأ (سلوك توافق مهمل، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يعرض النموذج الافتراضي المهيأ، يعود OpenClaw احتياطيًا إلى أول مزوّد/نموذج مهيأ بدلًا من إظهار افتراضي مزوّد قديم أُزيل.
- `models`: كتالوج النماذج المهيأ وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature`، و`maxTokens`، و`cacheRetention`، و`context1m`، و`responsesServerCompaction`، و`responsesCompactThreshold`، و`chat_template_kwargs`، و`extra_body`/`extraBody`).
  - التعديلات الآمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي ستزيل إدخالات قائمة السماح الحالية ما لم تمرر `--replace`.
  - تدمج تدفقات التهيئة/الإعداد المحصورة بالمزوّد نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين غير المرتبطين المهيأين مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، تُفعّل Compaction من جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [OpenAI server-side compaction](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة التي تطبق على كل النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (التكوين): يتجاوز `agents.defaults.models["provider/model"].params` (لكل نموذج) `agents.defaults.params` (الأساس العام)، ثم يتجاوز `agents.list[].params` (لمعرف الوكيل المطابق) حسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلب المولدة، ينتصر الجسم الإضافي؛ وما تزال مسارات completions غير الأصلية تزيل `store` الخاص بـ OpenAI فقط بعد ذلك.
- `params.chat_template_kwargs`: وسائط قالب المحادثة المتوافقة مع vLLM/OpenAI، تُدمج في أجسام طلبات `api: "openai-completions"` في المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ تتجاوز `chat_template_kwargs` الصريحة الافتراضيات المولدة، وما يزال `extra_body.chat_template_kwargs` له الأسبقية النهائية. لعناصر تحكم التفكير في vLLM Qwen، اضبط `params.qwenThinkingFormat` على `"chat-template"` أو `"top-level"` في إدخال ذلك النموذج.
- `compat.supportedReasoningEfforts`: قائمة جهد الاستدلال المتوافقة مع OpenAI لكل نموذج. ضمّن `"xhigh"` للنقاط النهائية المخصصة التي تقبله فعلًا؛ عندها يعرض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيحات الجلسات، والتحقق من CLI للوكيل، والتحقق من `llm-task` لذلك المزوّد/النموذج المهيأ. استخدم `compat.reasoningEffortMap` عندما يريد الخلفية قيمة خاصة بالمزوّد لمستوى معياري.
- `params.preserveThinking`: تفعيل اختياري خاص بـ Z.AI للتفكير المحفوظ. عند تفعيله وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [Z.AI thinking and preserved thinking](/ar/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: سياسة تشغيل الوكيل منخفضة المستوى الافتراضية. المعرف المحذوف يفترض OpenClaw Pi. استخدم `id: "pi"` لفرض مشغل PI المضمن، أو `id: "auto"` للسماح لمشغلات Plugin المسجلة بالمطالبة بالنماذج المدعومة، أو معرف مشغل مسجلًا مثل `id: "codex"`، أو اسمًا مستعارًا لخلفية CLI مدعومة مثل `id: "claude-cli"`. اضبط `fallback: "none"` لتعطيل العودة التلقائية إلى PI. تفشل تشغيلات Plugin الصريحة مثل `codex` بشكل مغلق افتراضيًا ما لم تضبط `fallback: "pi"` في نطاق التجاوز نفسه. أبقِ مراجع النماذج معيارية بصيغة `provider/model`؛ حدد Codex وClaude CLI وGemini CLI وخلفيات التنفيذ الأخرى عبر تكوين وقت التشغيل بدل بادئات مزوّد وقت التشغيل القديمة. راجع [Agent runtimes](/ar/concepts/agent-runtimes) لمعرفة كيف يختلف ذلك عن اختيار المزوّد/النموذج.
- تحفظ كاتبات التكوين التي تغير هذه الحقول (مثل `/models set`، و`/models set-image`، وأوامر إضافة/إزالة الاحتياطي) شكل الكائن المعياري وتحافظ على قوائم الاحتياطي الحالية عندما يكون ذلك ممكنًا.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكلاء المتوازية عبر الجلسات (تبقى كل جلسة مسلسلة). الافتراضي: 4.

### `agents.defaults.agentRuntime`

يتحكم `agentRuntime` في المنفذ منخفض المستوى الذي يشغل أدوار الوكيل. يجب على معظم
عمليات النشر إبقاء وقت تشغيل OpenClaw Pi الافتراضي. استخدمه عندما يوفر Plugin
موثوق مشغلًا أصليًا، مثل مشغل خادم تطبيق Codex المضمن،
أو عندما تريد خلفية CLI مدعومة مثل Claude CLI. للنموذج الذهني،
راجع [Agent runtimes](/ar/concepts/agent-runtimes).

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

- `id`: `"auto"`، أو `"pi"`، أو معرف مشغل Plugin مسجل، أو اسم مستعار لخلفية CLI مدعومة. يسجل Plugin Codex المضمن `codex`؛ ويوفر Plugin Anthropic المضمن خلفية CLI باسم `claude-cli`.
- `fallback`: `"pi"` أو `"none"`. في `id: "auto"`، يكون الاحتياطي المحذوف افتراضيًا `"pi"` بحيث يمكن للتكوينات القديمة الاستمرار في استخدام PI عندما لا يطالب أي مشغل Plugin بتشغيل. في وضع وقت تشغيل Plugin الصريح، مثل `id: "codex"`، يكون الاحتياطي المحذوف افتراضيًا `"none"` بحيث يفشل المشغل المفقود بدل استخدام PI بصمت. لا ترث تجاوزات وقت التشغيل الاحتياطي من نطاق أوسع؛ اضبط `fallback: "pi"` إلى جانب وقت التشغيل الصريح عندما تريد احتياطي التوافق هذا عمدًا. تظهر إخفاقات مشغل Plugin المحدد مباشرة دائمًا.
- تجاوزات البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` قيمة `id`؛ ويتجاوز `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` الاحتياطي لتلك العملية.
- لعمليات نشر Codex فقط، اضبط `model: "openai/gpt-5.5"` و`agentRuntime.id: "codex"`. يمكنك أيضًا ضبط `agentRuntime.fallback: "none"` صراحةً للوضوح؛ فهو الافتراضي لأوقات تشغيل Plugin الصريحة.
- لعمليات نشر Claude CLI، فضّل `model: "anthropic/claude-opus-4-7"` بالإضافة إلى `agentRuntime.id: "claude-cli"`. ما تزال مراجع نماذج `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق، لكن يجب أن يحافظ التكوين الجديد على معيارية اختيار المزوّد/النموذج وأن يضع خلفية التنفيذ في `agentRuntime.id`.
- يعيد `openclaw doctor --fix` كتابة مفاتيح سياسة وقت التشغيل القديمة إلى `agentRuntime`.
- يُثبّت اختيار المشغل لكل معرف جلسة بعد أول تشغيل مضمن. تؤثر تغييرات التكوين/البيئة في الجلسات الجديدة أو المعاد ضبطها، لا في نص جلسة موجود. تُعامل الجلسات القديمة التي لديها سجل نصي دون تثبيت مسجل كأنها مثبتة على PI. يبلّغ `/status` عن وقت التشغيل الفعال، مثلًا `Runtime: OpenClaw Pi Default` أو `Runtime: OpenAI Codex`.
- يتحكم هذا فقط في تنفيذ أدوار وكيل النص. ما تزال توليد الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار       | النموذج                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` أو `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

تكون الأسماء المستعارة التي ضبطتها أنت لها الأولوية دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI `tool_stream` افتراضيًا لتدفّق استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تعتمد نماذج Anthropic Claude 4.6 افتراضيًا على التفكير `adaptive` عندما لا يُضبط مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الرجوع النصية فقط (بلا استدعاءات أدوات). مفيدة كنسخة احتياطية عند فشل مزودي API.

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

- واجهات CLI الخلفية نصية أولًا؛ تكون الأدوات معطّلة دائمًا.
- الجلسات مدعومة عند ضبط `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل موجه النظام الكامل الذي يجمعه OpenClaw بسلسلة ثابتة. اضبطه على مستوى القيم الافتراضية (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون القيم الخاصة بالوكيل لها الأولوية؛ ويتم تجاهل القيمة الفارغة أو المكوّنة من مسافات بيضاء فقط. مفيد لتجارب الموجهات المضبوطة.

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

طبقات موجهات مستقلة عن المزود تُطبّق حسب عائلة النموذج. تتلقى معرّفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر المزودين؛ يتحكم `personality` فقط في طبقة أسلوب التفاعل الودّي.

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
- ما يزال `plugins.entries.openai.config.personality` القديم يُقرأ عندما لا يكون هذا الإعداد المشترك مضبوطًا.

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
- `includeSystemPromptSection`: عند false، يحذف قسم Heartbeat من موجه النظام ويتخطى حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند true، يكتم حمولات تحذيرات أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: أقصى وقت بالثواني مسموح به لدورة وكيل Heartbeat قبل إجهاضها. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/DM. تسمح `allow` (الافتراضية) بالتسليم إلى هدف مباشر. تكتم `block` التسليم إلى هدف مباشر وتصدر `reason=dm-blocked`.
- `lightContext`: عند true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند true، تعمل كل Heartbeat في جلسة جديدة بلا سجل محادثة سابق. نفس نمط العزل مثل Cron `sessionTarget: "isolated"`. يقلل تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- `skipWhenBusy`: عند true، تؤجل تشغيلات Heartbeat عند وجود مسارات مشغولة إضافية: عمل وكيل فرعي أو أوامر متداخلة. تؤجل مسارات Cron تشغيلات Heartbeat دائمًا، حتى بدون هذا العلم.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، تعمل Heartbeat **لهؤلاء الوكلاء فقط**.
- تُشغّل Heartbeat دورات وكيل كاملة — الفواصل الأقصر تستهلك رموزًا أكثر.

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

- `mode`: ‏`default` أو `safeguard` (تلخيص مجزأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزود Compaction مسجل. عند ضبطه، يُستدعى `summarize()` الخاص بالمزود بدل تلخيص LLM المدمج. يعود إلى المدمج عند الفشل. ضبط مزود يفرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: أقصى عدد ثوانٍ مسموح به لعملية Compaction واحدة قبل أن يجهضها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة قطع Pi للاحتفاظ بذيل النص المنسوخ الأحدث حرفيًا. يراعي `/compact` اليدوي ذلك عند ضبطه صراحة؛ وإلا يكون Compaction اليدوي نقطة تحقق صارمة.
- `identifierPolicy`: ‏`strict` (الافتراضي)، أو `off`، أو `custom`. يسبق `strict` إرشادات الاحتفاظ بالمعرّفات المبهمة المدمجة أثناء تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند الإخراج المشوّه لملخصات safeguard. مفعّلة افتراضيًا في وضع safeguard؛ اضبط `enabled: false` لتخطي التدقيق.
- `midTurnPrecheck`: فحص ضغط اختياري لحلقة أدوات Pi. عند `enabled: true`، يفحص OpenClaw ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسبًا، فإنه يجهض المحاولة الحالية قبل إرسال الموجه ويعيد استخدام مسار استرداد الفحص المسبق الحالي لاقتطاع نتائج الأدوات أو إجراء Compaction ثم إعادة المحاولة. يعمل مع وضعي Compaction `default` و`safeguard`. الافتراضي: معطّل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية في AGENTS.md لإعادة حقنها بعد Compaction. الافتراضي `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. عندما تكون غير مضبوطة أو مضبوطة صراحة على ذلك الزوج الافتراضي، تُقبل أيضًا عناوين `Every Session`/`Safety` القديمة كرجوع للتوافق.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم ضبطه، يستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: عتبة بايت اختيارية (`number` أو سلاسل مثل `"20mb"`) تُشغّل Compaction المحلي العادي قبل التشغيل عندما يتجاوز JSONL النشط العتبة. يتطلب `truncateAfterCompaction` حتى يتمكن Compaction الناجح من التدوير إلى نص منسوخ لاحق أصغر. معطّل عند عدم ضبطه أو عند `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثلًا، "Compacting context..." و"Compaction complete"). معطّل افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دورة وكيل صامتة قبل Compaction التلقائي لتخزين الذاكرات الدائمة. اضبط `model` على مزود/نموذج دقيق مثل `ollama/qwen3:8b` عندما يجب أن تبقى دورة الصيانة هذه على نموذج محلي؛ لا يرث التجاوز سلسلة الرجوع للجلسة النشطة. يتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يشذب **نتائج الأدوات القديمة** من السياق داخل الذاكرة قبل الإرسال إلى LLM. لا يعدّل سجل الجلسة على القرص.

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

- يفعّل `mode: "cache-ttl"` تمريرات التشذيب.
- يتحكم `ttl` في عدد مرات إمكانية تشغيل التشذيب مرة أخرى (بعد آخر لمس لذاكرة التخزين المؤقت).
- يشذب التشذيب نتائج الأدوات الضخمة تشذيبًا خفيفًا أولًا، ثم يمحو نتائج الأدوات الأقدم بصرامة عند الحاجة.

**التشذيب الخفيف** يحتفظ بالبداية + النهاية ويدرج `...` في الوسط.

**المحو الصارم** يستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا يتم تشذيب/محو كتل الصور أبدًا.
- النسب مبنية على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا كان هناك عدد أقل من `keepLastAssistants` من رسائل المساعد، يتم تخطي التشذيب.

</Accordion>

راجع [تشذيب الجلسات](/ar/concepts/session-pruning) لتفاصيل السلوك.

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

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحة لتفعيل الردود الكتلية.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` (والصيغ الخاصة بكل حساب). تعتمد Signal/Slack/Discord/Google Chat افتراضيا `minChars: 1500`.
- `humanDelay`: إيقاف مؤقت عشوائي بين الردود الكتلية. `natural` = 800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [البث](/ar/concepts/streaming) للحصول على تفاصيل السلوك والتقسيم إلى مقاطع.

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

- `docker`: وقت تشغيل Docker المحلي (افتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم بـ SSH
- `openshell`: وقت تشغيل OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**تهيئة خلفية SSH:**

- `target`: هدف SSH بالصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: الجذر البعيد المطلق المستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يجسدها OpenClaw في ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مقابض سياسة مفاتيح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` يتقدم على `identityFile`
- `certificateData` يتقدم على `certificateFile`
- `knownHostsData` يتقدم على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة العزل

**سلوك خلفية SSH:**

- تزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تبقي مساحة عمل SSH البعيدة هي المرجعية
- توجه `exec`، وأدوات الملفات، ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيا
- لا تدعم حاويات متصفح العزل

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل معزولة لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة العمل المعزولة عند `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (افتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (بلا عزل بين الجلسات)

**تهيئة OpenShell Plugin:**

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

- `mirror`: يزرع البعيد من المحلي قبل exec، ثم يزامن عائدا بعد exec؛ تبقى مساحة العمل المحلية هي المرجعية
- `remote`: يزرع البعيد مرة واحدة عند إنشاء العزل، ثم يبقي مساحة العمل البعيدة هي المرجعية

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تتم خارج OpenClaw إلى العزل تلقائيا بعد خطوة الزرع.
يتم النقل عبر SSH إلى عزل OpenShell، لكن Plugin يمتلك دورة حياة العزل ومزامنة المرآة الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج شبكي، وجذر قابل للكتابة، ومستخدم root.

**تعتمد الحاويات افتراضيا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة جسر مخصصة) إذا كان الوكيل يحتاج إلى وصول خارجي.
`"host"` محظور. `"container:<id>"` محظور افتراضيا ما لم تضبط صراحة
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (إجراء طارئ).

**المرفقات الواردة** يتم تجهيزها في `media/inbound/*` داخل مساحة العمل النشطة.

**`docker.binds`** يركب أدلة مضيف إضافية؛ يتم دمج التركيبات العامة وتلك الخاصة بكل وكيل.

**متصفح معزول** (`sandbox.browser.enabled`): Chromium + CDP في حاوية. يتم حقن عنوان URL الخاص بـ noVNC في موجه النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول مراقب noVNC مصادقة VNC افتراضيا، ويصدر OpenClaw عنوان URL برمز قصير العمر (بدلا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (افتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة جسر مخصصة). اضبطها على `bridge` فقط عندما تريد صراحة اتصالا عاما بالجسر.
- يقيّد `cdpSourceRange` اختياريا دخول CDP عند حافة الحاوية إلى نطاق CIDR (على سبيل المثال `172.21.0.1/32`).
- يركب `sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية متصفح العزل فقط. عند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
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
  - `--disable-extensions` (مفعّل افتراضيا)
  - `--disable-3d-apis`، و`--disable-software-rasterizer`، و`--disable-gpu` تكون
    مفعّلة افتراضيا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبط `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عندما يكون `noSandbox` مفعّلا.
  - الافتراضيات هي خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    نقطة دخول مخصصة لتغيير افتراضيات الحاوية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` خاصان بـ Docker فقط.

ابن الصور:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح وكيل مزود TTS أو صوتا أو نموذجا أو
نمطا أو وضع TTS تلقائيا خاصا به. تدمج كتلة الوكيل بعمق فوق
`messages.tts` العامة، لذلك يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما يتجاوز
الوكلاء الفرديون حقول الصوت أو المزود التي يحتاجون إليها فقط. ينطبق تجاوز الوكيل النشط
على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، و
أداة الوكيل `tts`. راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
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

- `id`: معرّف وكيل ثابت (مطلوب).
- `default`: عند ضبط عدة وكلاء، تكون الأولوية للأول (مع تسجيل تحذير). إذا لم يُضبط أي منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: صيغة السلسلة تضبط نموذجا أساسيا صارما لكل وكيل من دون نموذج احتياطي؛ وصيغة الكائن `{ primary }` صارمة أيضا ما لم تضف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في آلية الاحتياطي، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحا. مهام Cron التي تتجاوز `primary` فقط تظل ترث النماذج الاحتياطية الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات تدفق لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النماذج كاملا.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. تُدمج الكتلة دمجا عميقا فوق `messages.tts`، لذا احتفظ ببيانات اعتماد المزوّد المشتركة وسياسة الاحتياطي في `messages.tts` واضبط هنا فقط القيم الخاصة بالشخصية مثل المزوّد أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية للمهارات لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ أما القائمة الصريحة فتستبدل الافتراضيات بدلا من دمجها، و`[]` تعني عدم وجود مهارات.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزوّد/النموذج المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، يحافظ `adaptive` على التفكير الديناميكي المملوك للمزوّد (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: ظهور الاستدلال الافتراضي الاختياري لكل وكيل (`on | off | stream`). يتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عندما لا يكون هناك تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: الافتراضي الاختياري للوضع السريع لكل وكيل (`true | false`). يُطبّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `agentRuntime`: تجاوز اختياري لسياسة وقت التشغيل منخفضة المستوى لكل وكيل. استخدم `{ id: "codex" }` لجعل وكيل واحد مقتصرا على Codex بينما يحتفظ الوكلاء الآخرون باحتياطي PI الافتراضي في وضع `auto`.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) عندما ينبغي أن يستخدم الوكيل جلسات أداة ACP افتراضيا.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL بصيغة `http(s)`، أو URI بصيغة `data:`.
- تستمد `identity` الافتراضيات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط). أدرج معرّف الطالب عندما ينبغي السماح باستدعاءات `agentId` التي تستهدف الذات.
- حارس وراثة صندوق الرمل: إذا كانت جلسة الطالب داخل صندوق رمل، يرفض `sessions_spawn` الأهداف التي قد تعمل من دون صندوق رمل.
- `subagents.requireAgentId`: عند ضبطها على true، تحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف التعريف صراحة؛ الافتراضي: false).

---

## التوجيه متعدد الوكلاء

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

### حقول مطابقة الربط

- `type` (اختياري): `route` للتوجيه العادي (النوع المحذوف يُعد route افتراضيا)، و`acp` لارتباطات محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ المحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط من أجل `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، من دون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw المطابقة بهوية المحادثة التامة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات ربط المسار أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="وصول كامل (دون صندوق رمل)">

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

راجع [صندوق رمل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لتفاصيل الأسبقية.

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
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

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات دردشة المجموعات.
  - `per-sender` (الافتراضي): يحصل كل مُرسِل على جلسة معزولة داخل سياق القناة.
  - `global`: يشارك جميع المشاركين في سياق القناة جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك جميع الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المُرسِل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مُرسِل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مُرسِل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرّفات القانونية بالأطراف ذات بادئة المزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر الربط مثل `/dock_discord` الخريطة نفسها لتبديل مسار رد الجلسة النشطة إلى طرف قناة مرتبط آخر؛ راجع [ربط القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة التعيين الأساسية. يعيد `daily` التعيين عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` التعيين بعد `idleMinutes`. عند ضبطهما معًا، يفوز أيهما تنتهي مدته أولًا. تستخدم حداثة إعادة التعيين اليومية `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة التعيين عند الخمول `lastInteractionAt`. يمكن لكتابات الخلفية/أحداث النظام مثل Heartbeat، وتنبيهات Cron، وإشعارات التنفيذ، ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تُبقي الجلسات اليومية/الخاملة حديثة.
- **`resetByType`**: تجاوزات حسب النوع (`direct`، `group`، `thread`). يُقبل `dm` القديم كاسم بديل لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى لقيمة `totalTokens` في جلسة الأصل المسموح به عند إنشاء جلسة سلسلة متفرعة (الافتراضي `100000`).
  - إذا كانت `totalTokens` للأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة سلسلة جديدة بدلًا من وراثة سجل نصوص الأصل.
  - اضبط `0` لتعطيل هذا الحارس والسماح دائمًا بتفريع الأصل.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`–`5`). يعطل `0` تسلسل ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. أول رفض يفوز.
- **`maintenance`**: عناصر تحكم تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: يطلق `warn` التحذيرات فقط؛ ويطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات الراكدة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفًا دُفعيًا مع مخزن حدٍّ أعلى صغير للحدود المناسبة للإنتاج؛ ويطبّق `openclaw sessions cleanup --enforce` الحد فورًا.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من الإعدادات الأقدم.
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات سجل النصوص `*.reset.<timestamp>`. القيمة الافتراضية هي `pruneAfter`؛ اضبط `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم الآثار/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. القيمة الافتراضية هي `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين تجاوزه؛ يستخدم Discord ‏`channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي عند عدم النشاط بالساعات (`0` يعطل؛ يمكن للمزوّدين تجاوزه)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطل؛ يمكن للمزوّدين تجاوزه)

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

الحل (الأكثر تحديدًا يفوز): الحساب → القناة → العام. يعطل `""` ويوقف التسلسل. يستنتج `"auto"` القيمة من `[{identity.name}]`.

**متغيرات القالب:**

| المتغير           | الوصف                 | مثال                       |
| ----------------- | --------------------- | -------------------------- |
| `{model}`         | اسم النموذج المختصر   | `claude-opus-4-6`          |
| `{modelFull}`     | معرّف النموذج الكامل   | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد           | `anthropic`                |
| `{thinkingLevel}` | مستوى التفكير الحالي  | `high`, `low`, `off`       |
| `{identity.name}` | اسم هوية الوكيل       | (مثل `"auto"`)             |

المتغيرات غير حساسة لحالة الأحرف. `{think}` اسم بديل لـ `{thinkingLevel}`.

### تفاعل الإقرار

- القيمة الافتراضية هي `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبط `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → الرجوع إلى الهوية.
- النطاق: `group-mentions` (الافتراضي)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد على القنوات القادرة على التفاعلات مثل Slack وDiscord وTelegram وWhatsApp وBlueBubbles.
- `messages.statusReactions.enabled`: يفعّل تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  على Slack وDiscord، يؤدي عدم الضبط إلى إبقاء تفاعلات الحالة مفعلة عندما تكون تفاعلات الإقرار نشطة.
  على Telegram، اضبطه صراحةً على `true` لتفعيل تفاعلات حالة دورة الحياة.

### مهلة تجميع الوارد

يجمع الرسائل النصية السريعة فقط من المُرسِل نفسه في دور وكيل واحد. تُرسَل الوسائط/المرفقات فورًا. تتجاوز أوامر التحكم التجميع.

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
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للملخص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ والقيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك صريح).
- ترجع مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- مزوّدو الكلام المضمنون مملوكون لـ Plugin. إذا كان `plugins.allow` مضبوطًا، فأدرج كل مزوّد TTS Plugin تريد استخدامه، مثل `microsoft` لـ Edge TTS. يُقبل معرّف المزوّد القديم `edge` كاسم بديل لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو الإعداد، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير تابعة لـ OpenAI، يعاملها OpenClaw كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند ضبط عدة مزوّدي Talk.
- مفاتيح Talk المسطحة القديمة (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) مخصصة للتوافق فقط، ويتم ترحيلها تلقائيًا إلى `talk.providers.<provider>`.
- ترجع معرّفات الأصوات إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية عادية أو كائنات SecretRef.
- ينطبق الرجوع إلى `ELEVENLABS_API_KEY` فقط عند عدم ضبط مفتاح API لوضع Talk.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء ودية.
- يحدد `providers.mlx.modelId` مستودع Hugging Face المستخدم بواسطة مساعد MLX المحلي في macOS. عند حذفه، يستخدم macOS ‏`mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل macOS MLX عبر مساعد `openclaw-mlx-tts` المضمن عند وجوده، أو عبر ملف تنفيذي على `PATH`؛ ويتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد للتطوير.
- يعيّن `speechLocale` معرّف اللغة المحلية BCP 47 المستخدم بواسطة التعرف على كلام Talk في iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع Talk بعد صمت المستخدم قبل إرسال النص المنسوخ. يؤدي عدم الضبط إلى إبقاء نافذة التوقف الافتراضية للمنصة (`700 ms on macOS and Android, 900 ms on iOS`).

---

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — جميع مفاتيح الإعداد الأخرى
- [الإعدادات](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
