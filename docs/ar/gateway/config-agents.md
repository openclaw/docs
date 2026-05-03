---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين التوجيه والارتباطات متعددة الوكلاء
    - ضبط سلوك الجلسة وتسليم الرسائل ووضع التحدث
summary: الإعدادات الافتراضية للوكيل، والتوجيه متعدد الوكلاء، والجلسة، والرسائل، وإعدادات المحادثة
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-05-03T07:30:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: b25371c34b9f8b0cacce021879e43e6a65b86d626dc87d5bfa05dcae80ac32e4
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح تكوين مقيّدة بالنطاق الخاص بالوكيل ضمن `agents.*` و`multiAgent.*` و`session.*`،
و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات ووقت تشغيل Gateway والمفاتيح الأخرى
ذات المستوى الأعلى، راجع [مرجع التكوين](/ar/gateway/configuration-reference).

## افتراضيات الوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime داخل موجّه النظام. إذا لم يُضبط، يكتشفه OpenClaw تلقائيًا عبر الصعود من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية للمهارات للوكلاء الذين لا يضبطون
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

- احذف `agents.defaults.skills` للسماح غير المقيّد بالمهارات افتراضيًا.
- احذف `agents.list[].skills` لتوريث الافتراضيات.
- اضبط `agents.list[].skills: []` لعدم إتاحة أي مهارات.
- القائمة غير الفارغة `agents.list[].skills` هي المجموعة النهائية لذلك الوكيل؛ فهي
  لا تُدمَج مع الافتراضيات.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات تمهيد مساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

يتجاوز إنشاء ملفات مساحة عمل اختيارية محددة مع الاستمرار في كتابة ملفات التمهيد المطلوبة. القيم الصالحة: `SOUL.md` و`USER.md` و`HEARTBEAT.md` و`IDENTITY.md`.

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

- `"continuation-skip"`: أدوار المتابعة الآمنة (بعد استجابة مكتملة من المساعد) تتجاوز إعادة حقن تمهيد مساحة العمل، مما يقلل حجم الموجّه. ما تزال عمليات Heartbeat ومحاولات إعادة المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: يعطّل حقن تمهيد مساحة العمل وملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة الموجّه بالكامل (محركات سياق مخصصة، أوقات تشغيل أصلية تبني سياقها الخاص، أو تدفقات عمل متخصصة بلا تمهيد). تتجاوز أدوار Heartbeat واسترداد Compaction الحقن أيضًا.

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

الحد الأقصى الإجمالي للأحرف المحقونة عبر جميع ملفات تمهيد مساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عندما يُقتطع سياق التمهيد.
الافتراضي: `"once"`.

- `"off"`: لا يحقن نص التحذير أبدًا في موجّه النظام.
- `"once"`: يحقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: يحقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات عالية الحجم للموجّه/السياق، وهي
مقسمة عمدًا حسب النظام الفرعي بدلًا من تمريرها كلها عبر مقبض عام
واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  تمهيد تشغيل نموذج لمرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة. أوامر المحادثة المجردة `/new` و`/reset`
  تُقَرّ دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة المهارات المدمجة المحقونة في موجّه النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل محقونة مملوكة لوقت التشغيل.
- `memory.qmd.limits.*`:
  مقتطف البحث في الذاكرة المفهرسة وحجم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية
مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء التشغيل للدور الأول المحقون عند تشغيلات نموذج إعادة الضبط/بدء التشغيل.
أوامر المحادثة المجردة `/new` و`/reset` تقرّ بإعادة الضبط دون استدعاء
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

افتراضيات مشتركة لأسطح سياق وقت التشغيل المحدودة.

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
  بيانات تعريف الاقتطاع وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة أسطر `memory_get` الافتراضية عندما يُحذف
  `lines`.
- `toolResultMaxChars`: سقف نتيجة الأداة الحية المستخدم للنتائج المستمرة
  واسترداد الفائض.
- `postCompactionMaxChars`: سقف مقتطف AGENTS.md المستخدم أثناء حقن التحديث
  بعد Compaction.

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

السقف العام لقائمة المهارات المدمجة المحقونة في موجّه النظام. هذا
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

تجاوز لكل وكيل لميزانية موجّه المهارات.

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

تقلل القيم الأدنى عادةً استخدام رموز الرؤية وحجم حمولة الطلب للتشغيلات كثيرة لقطات الشاشة.
تحافظ القيم الأعلى على مزيد من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجّه النظام (وليس الطوابع الزمنية للرسائل). تعود إلى المنطقة الزمنية للمضيف.

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
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
  - يعيّن شكل السلسلة النصية النموذج الأساسي فقط.
  - يعيّن شكل الكائن النموذج الأساسي بالإضافة إلى نماذج تجاوز فشل مرتّبة.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` كإعدادات نموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرّفات المجردة للتوافق؛ إذا تطابق معرّف مجرد بشكل فريد مع إدخال مكوّن يدعم الصور في `models.providers.*.models`، فإن OpenClaw يربطه بذلك المزوّد. تتطلب التطابقات المكوّنة الملتبسة بادئة مزوّد صريحة.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد الصور.
  - القيم الشائعة: `google/gemini-3.1-flash-image-preview` لتوليد الصور الأصلي في Gemini، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لـ OpenAI Images، أو `openai/gpt-image-1.5` لإخراج OpenAI PNG/WebP بخلفية شفافة.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فقم بتكوين مصادقة المزوّد المطابقة أيضًا (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، أو `FAL_KEY` لـ `fal/*`).
  - إذا حُذف، لا يزال بإمكان `image_generate` استنتاج إعداد افتراضي لمزوّد مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الصور المسجلين بترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الموسيقى المشتركة وأداة `music_generate` المضمّنة.
  - القيم الشائعة: `google/lyria-3-clip-preview`، أو `google/lyria-3-pro-preview`، أو `minimax/music-2.6`.
  - إذا حُذف، لا يزال بإمكان `music_generate` استنتاج إعداد افتراضي لمزوّد مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فقم بتكوين مصادقة/API key المزوّد المطابقة أيضًا.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الفيديو المشتركة وأداة `video_generate` المضمّنة.
  - القيم الشائعة: `qwen/wan2.6-t2v`، أو `qwen/wan2.6-i2v`، أو `qwen/wan2.6-r2v`، أو `qwen/wan2.6-r2v-flash`، أو `qwen/wan2.7-r2v`.
  - إذا حُذف، لا يزال بإمكان `video_generate` استنتاج إعداد افتراضي لمزوّد مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الفيديو المسجلين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فقم بتكوين مصادقة/API key المزوّد المطابقة أيضًا.
  - يدعم مزوّد توليد الفيديو Qwen المضمّن ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد هي `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/الافتراضي المحلول.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي ينظر فيها وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `reasoningDefault`: مستوى رؤية الاستدلال الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` لكل وكيل هذا الإعداد الافتراضي. لا تُطبّق إعدادات الاستدلال الافتراضية المكوّنة إلا للمالكين، أو المرسلين المصرّح لهم، أو سياقات Gateway الخاصة بمسؤول المشغّل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` (مثل `openai/gpt-5.5` للوصول باستخدام API key أو `openai-codex/gpt-5.5` لـ Codex OAuth). إذا حذفت المزوّد، يجرّب OpenClaw اسمًا مستعارًا أولًا، ثم تطابق مزوّد مكوّن فريدًا لمعرّف النموذج الدقيق ذاك، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المكوّن (سلوك توافق مهمل، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يعرّض النموذج الافتراضي المكوّن، يعود OpenClaw إلى أول مزوّد/نموذج مكوّن بدلًا من إظهار إعداد افتراضي قديم لمزوّد مُزال.
- `models`: كتالوج النماذج المكوّن وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` و`chat_template_kwargs` و`extra_body`/`extraBody`).
  - التعديلات الآمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي ستزيل إدخالات قائمة السماح الموجودة ما لم تمرر `--replace`.
  - تدمج تدفقات التكوين/الإعداد المقيّدة بالمزوّد نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين غير المرتبطين المكوّنين مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، يتم تمكين Compaction من جهة الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف إدخال `context_management`، أو `params.responsesCompactThreshold` لتجاوز الحد. راجع [OpenAI Compaction من جهة الخادم](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على كل النماذج. تُعيّن في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (الإعدادات): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (لمعرّف الوكيل المطابق) حسب المفتاح. راجع [التخزين المؤقت للمطالبات](/ar/reference/prompt-caching) للحصول على التفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في أجسام طلبات `api: "openai-completions"` لوكلاء OpenAI المتوافقين. إذا تعارض مع مفاتيح الطلب المولّدة، فإن الجسم الإضافي يفوز؛ لا تزال مسارات الإكمال غير الأصلية تزيل `store` الخاص بـ OpenAI بعد ذلك.
- `params.chat_template_kwargs`: وسيطات قالب الدردشة المتوافقة مع vLLM/OpenAI التي تُدمج في أجسام طلبات `api: "openai-completions"` على المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ تتجاوز `chat_template_kwargs` الصريحة الإعدادات الافتراضية المولّدة، ولا يزال `extra_body.chat_template_kwargs` يملك الأسبقية النهائية. بالنسبة إلى عناصر تحكم التفكير في vLLM Qwen، عيّن `params.qwenThinkingFormat` إلى `"chat-template"` أو `"top-level"` في إدخال ذلك النموذج.
- `compat.supportedReasoningEfforts`: قائمة جهود الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` لنقاط النهاية المخصصة التي تقبله فعليًا؛ عندها يعرّض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيحات الجلسات، والتحقق من CLI للوكيل، والتحقق من `llm-task` لذلك المزوّد/النموذج المكوّن. استخدم `compat.reasoningEffortMap` عندما تريد الواجهة الخلفية قيمة خاصة بالمزوّد لمستوى قياسي.
- `params.preserveThinking`: اشتراك اختياري خاص بـ Z.AI للتفكير المحفوظ. عند تمكينه وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: سياسة وقت تشغيل الوكيل منخفضة المستوى الافتراضية. يعيّن المعرّف المحذوف افتراضيًا إلى OpenClaw Pi. استخدم `id: "pi"` لفرض أداة PI المضمّنة، أو `id: "auto"` للسماح لأدوات Plugin المسجلة بالمطالبة بالنماذج المدعومة واستخدام PI عندما لا يطابق أي منها، أو معرّف أداة مسجلة مثل `id: "codex"` لاشتراط تلك الأداة، أو اسمًا مستعارًا مدعومًا لواجهة CLI خلفية مثل `id: "claude-cli"`. تفشل أوقات تشغيل Plugin الصريحة بشكل مغلق عندما تكون الأداة غير متاحة أو تفشل. أبقِ مراجع النماذج قياسية كـ `provider/model`؛ اختر Codex وClaude CLI وGemini CLI وخلفيات التنفيذ الأخرى من خلال إعدادات وقت التشغيل بدلًا من بادئات مزوّد وقت التشغيل القديمة. راجع [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) لمعرفة كيف يختلف هذا عن اختيار المزوّد/النموذج.
- كتّاب الإعدادات الذين يعدّلون هذه الحقول (على سبيل المثال `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطي) يحفظون شكل الكائن القياسي ويحافظون على قوائم الاحتياطي الموجودة عندما يكون ذلك ممكنًا.
- `maxConcurrent`: الحد الأقصى لتشغيل الوكلاء بالتوازي عبر الجلسات (تظل كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.agentRuntime`

يتحكم `agentRuntime` في المنفّذ منخفض المستوى الذي يشغّل أدوار الوكيل. ينبغي لمعظم
عمليات النشر الإبقاء على وقت تشغيل OpenClaw Pi الافتراضي. استخدمه عندما يوفّر Plugin
موثوق أداة أصلية، مثل أداة خادم تطبيق Codex المضمّنة،
أو عندما تريد واجهة CLI خلفية مدعومة مثل Claude CLI. للفهم
المفاهيمي، راجع [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes).

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

- `id`: `"auto"`، أو `"pi"`، أو معرّف أداة Plugin مسجلة، أو اسم مستعار مدعوم لواجهة CLI خلفية. يسجل Plugin Codex المضمّن `codex`؛ ويوفر Plugin Anthropic المضمّن واجهة CLI الخلفية `claude-cli`.
- يتيح `id: "auto"` لأدوات Plugin المسجلة المطالبة بالأدوار المدعومة ويستخدم PI عندما لا تطابق أي أداة. يتطلب وقت تشغيل Plugin صريح مثل `id: "codex"` تلك الأداة ويفشل بشكل مغلق إذا كانت غير متاحة أو فشلت.
- تجاوز البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` قيمة `id` لتلك العملية.
- لعمليات النشر الخاصة بـ Codex فقط، عيّن `model: "openai/gpt-5.5"` و`agentRuntime.id: "codex"`.
- لعمليات نشر Claude CLI، فضّل `model: "anthropic/claude-opus-4-7"` بالإضافة إلى `agentRuntime.id: "claude-cli"`. لا تزال مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل للتوافق، لكن ينبغي للإعدادات الجديدة إبقاء اختيار المزوّد/النموذج قياسيًا ووضع خلفية التنفيذ في `agentRuntime.id`.
- تُعاد كتابة مفاتيح سياسة وقت التشغيل الأقدم إلى `agentRuntime` بواسطة `openclaw doctor --fix`.
- يتم تثبيت اختيار الأداة لكل معرّف جلسة بعد أول تشغيل مضمّن. تؤثر تغييرات الإعدادات/البيئة في الجلسات الجديدة أو المعاد ضبطها، وليس في نص جلسة موجود. تُعامل الجلسات القديمة التي لديها سجل نصي لكن لا يوجد تثبيت مسجل كأنها مثبتة على PI. يبلّغ `/status` عن وقت التشغيل الفعلي، مثل `Runtime: OpenClaw Pi Default` أو `Runtime: OpenAI Codex`.
- يتحكم هذا فقط في تنفيذ أدوار وكلاء النص. لا تزال عمليات توليد الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمّنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

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

تتغلب الأسماء المستعارة التي كوّنتها دائمًا على الإعدادات الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائياً ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI الخيار `tool_stream` افتراضياً لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضياً عند عدم تعيين مستوى تفكير صريح.

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

- خلفيات CLI تركّز على النص أولاً؛ الأدوات معطّلة دائماً.
- تُدعم الجلسات عند ضبط `sessionArg`.
- يُدعم تمرير الصور عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل موجّه النظام الكامل الذي جمّعه OpenClaw بسلسلة ثابتة. اضبطه على مستوى القيم الافتراضية (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). قيم الوكيل المحدد لها الأولوية؛ تُتجاهل القيمة الفارغة أو المكوّنة من مسافات فقط. مفيد لتجارب الموجّهات المضبوطة.

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

تراكبات موجّهات مستقلة عن المزوّد تُطبّق حسب عائلة النموذج. تتلقى معرّفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر المزوّدين؛ يتحكم `personality` فقط في طبقة أسلوب التفاعل الودّي.

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
- يعطّل `"off"` الطبقة الودّية فقط؛ يبقى عقد سلوك GPT-5 الموسوم مفعّلاً.
- لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ عندما لا يكون هذا الإعداد المشترك مضبوطاً.

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
- `includeSystemPromptSection`: عند كونها false، تُحذف فقرة Heartbeat من موجّه النظام ويُتخطى حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند كونها true، تكبت حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل Heartbeat قبل إلغائه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/DM. يسمح `allow` (الافتراضي) بالتسليم إلى الهدف المباشر. يكبت `block` التسليم إلى الهدف المباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند كونها true، تستخدم تشغيلات Heartbeat سياق تمهيد خفيفاً وتُبقي فقط `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند كونها true، تعمل كل Heartbeat في جلسة جديدة بلا سجل محادثة سابق. نمط العزل نفسه مثل cron `sessionTarget: "isolated"`. يقلّل تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- `skipWhenBusy`: عند كونها true، تؤجل تشغيلات Heartbeat في مسارات الانشغال الإضافية: عمل الوكيل الفرعي أو الأوامر المتداخلة. تؤجل مسارات Cron دائماً Heartbeat، حتى من دون هذه العلامة.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، تعمل **تلك الوكلاء فقط** على تشغيل Heartbeats.
- تشغّل Heartbeats أدوار وكيل كاملة — الفواصل الأقصر تستهلك رموزاً أكثر.

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
- `provider`: معرّف Plugin مزوّد Compaction مسجل. عند ضبطه، يُستدعى `summarize()` الخاص بالمزوّد بدلاً من تلخيص LLM المدمج. يعود إلى المدمج عند الفشل. يفرض ضبط مزوّد `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى للثواني المسموح بها لعملية Compaction واحدة قبل أن يلغيها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة قطع Pi للاحتفاظ بذيل النص الأحدث حرفياً. يحترم `/compact` اليدوي هذا عند ضبطه صراحة؛ وإلا يكون Compaction اليدوي نقطة تحقق صارمة.
- `identifierPolicy`: `strict` (الافتراضي)، أو `off`، أو `custom`. يضيف `strict` إرشادات احتفاظ مدمجة للمعرّفات المعتمة في بداية تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند المخرجات المشوّهة لملخصات safeguard. مفعّلة افتراضياً في وضع safeguard؛ اضبط `enabled: false` لتخطي التدقيق.
- `midTurnPrecheck`: فحص اختياري لضغط حلقة أدوات Pi. عند `enabled: true`، يفحص OpenClaw ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسباً، يلغي المحاولة الحالية قبل إرسال الموجّه ويعيد استخدام مسار استرداد الفحص المسبق الموجود لاقتطاع نتائج الأدوات أو تنفيذ Compaction ثم إعادة المحاولة. يعمل مع وضعي Compaction `default` و`safeguard`. الافتراضي: معطّل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من AGENTS.md لإعادة حقنها بعد Compaction. القيمة الافتراضية هي `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. عند عدم ضبطها أو ضبطها صراحة على ذلك الزوج الافتراضي، تُقبل أيضاً عناوين `Every Session`/`Safety` القديمة كرجوع توافق قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدمه عندما ينبغي للجلسة الرئيسية الاحتفاظ بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ عند عدم ضبطه، يستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: حد بايتات اختياري (`number` أو سلاسل مثل `"20mb"`) يشغّل Compaction محلياً عادياً قبل التشغيل عندما يتجاوز JSONL النشط الحد. يتطلب `truncateAfterCompaction` حتى يتمكن Compaction الناجح من التدوير إلى نص لاحق أصغر. معطّل عند عدم ضبطه أو عند `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عندما يبدأ Compaction وعندما يكتمل (مثلاً، "Compacting context..." و"Compaction complete"). معطّل افتراضياً للحفاظ على صمت Compaction.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. اضبط `model` على مزوّد/نموذج دقيق مثل `ollama/qwen3:8b` عندما ينبغي أن يبقى دور التدبير هذا على نموذج محلي؛ لا يرث التجاوز سلسلة الرجوع للجلسة النشطة. يُتخطى عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يشذّب **نتائج الأدوات القديمة** من السياق داخل الذاكرة قبل إرسالها إلى LLM. لا يعدّل سجل الجلسة على القرص.

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
- يشذّب التشذيب نتائج الأدوات كبيرة الحجم تشذيباً ليناً أولاً، ثم يمحو نتائج الأدوات الأقدم محواً صارماً عند الحاجة.

يحافظ **التشذيب اللين** على البداية + النهاية ويدرج `...` في الوسط.

يستبدل **المحو الصارم** نتيجة الأداة كاملة بالعنصر النائب.

ملاحظات:

- لا تُشذّب كتل الصور ولا تُمحى أبداً.
- النسب مبنية على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، يُتخطى التشذيب.

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
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (والتنويعات لكل حساب). القيم الافتراضية لـ Signal/Slack/Discord/Google Chat هي `minChars: 1500`.
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

- القيم الافتراضية: `instant` للدردشات المباشرة/الإشارات، و`message` لدردشات المجموعات التي لا تتضمن إشارة.
- التجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

عزل اختياري للوكيل المضمن. راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل.

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

- `docker`: بيئة تشغيل Docker محلية (الافتراضية)
- `ssh`: بيئة تشغيل بعيدة عامة مدعومة بـ SSH
- `openshell`: بيئة تشغيل OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة ببيئة التشغيل إلى
`plugins.entries.openshell.config`.

**إعدادات خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يحولها OpenClaw إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: عناصر ضبط سياسة مفتاح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` يتقدم على `identityFile`
- `certificateData` يتقدم على `certificateFile`
- `knownHostsData` يتقدم على `knownHostsFile`
- تُحل قيم `*Data` المدعومة بـ SecretRef من لقطة بيئة تشغيل الأسرار النشطة قبل بدء جلسة العزل

**سلوك خلفية SSH:**

- تهيئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تُبقي مساحة عمل SSH البعيدة هي النسخة المرجعية
- تمرر `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيا
- لا تدعم حاويات متصفح العزل

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل عزل لكل نطاق ضمن `~/.openclaw/sandboxes`
- `ro`: مساحة عمل العزل عند `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة/الكتابة عند `/workspace`

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

- `mirror`: يهيئ البعيد من المحلي قبل exec، ثم يزامن مرة أخرى بعد exec؛ وتبقى مساحة العمل المحلية هي النسخة المرجعية
- `remote`: يهيئ البعيد مرة واحدة عند إنشاء العزل، ثم يُبقي مساحة العمل البعيدة هي النسخة المرجعية

في وضع `remote`، لا تُزامن التعديلات المحلية على المضيف التي تتم خارج OpenClaw إلى العزل تلقائيا بعد خطوة التهيئة.
النقل يتم عبر SSH إلى عزل OpenShell، لكن Plugin يملك دورة حياة العزل ومزامنة المرآة الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج إلى الشبكة، وجذر قابل للكتابة، ومستخدم root.

**تستخدم الحاويات افتراضيا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة جسر مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
`"host"` محظور. `"container:<id>"` محظور افتراضيا ما لم تضبط صراحة
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (خيار طوارئ).

**المرفقات الواردة** تُجهز في `media/inbound/*` داخل مساحة العمل النشطة.

**`docker.binds`** يركب أدلة مضيف إضافية؛ وتُدمج عمليات الربط العامة وتلك الخاصة بكل وكيل.

**المتصفح المعزول** (`sandbox.browser.enabled`): Chromium + CDP في حاوية. يُحقن عنوان URL لـ noVNC في مطالبة النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول مراقب noVNC مصادقة VNC افتراضيا، ويصدر OpenClaw عنوان URL برمز قصير العمر (بدلا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (الافتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة جسر مخصصة). اضبطها على `bridge` فقط عندما تريد صراحة اتصال الجسر العام.
- يقيّد `cdpSourceRange` اختياريا دخول CDP عند حافة الحاوية إلى نطاق CIDR (مثلا `172.21.0.1/32`).
- يركب `sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية متصفح العزل فقط. عند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
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
  - `--disable-extensions` (مفعّل افتراضيا)
  - `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu` تكون
    مفعّلة افتراضيا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا تطلب استخدام WebGL/3D ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الامتدادات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبط `0` لاستخدام حد العمليات
    الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - الافتراضيات هي خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    نقطة دخول مخصصة لتغيير افتراضيات الحاوية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` متاحان لـ Docker فقط.

ابن الصور (من checkout للمصدر):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

لعمليات تثبيت npm بدون checkout للمصدر، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح وكيل مزود TTS أو صوتا أو نموذجا أو
نمطا أو وضع TTS تلقائيا خاصا به. يُدمج قالب الوكيل بعمق فوق
`messages.tts` العام، وبذلك يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما
يتجاوز الوكلاء الفرديون فقط حقول الصوت أو المزود التي يحتاجون إليها. ينطبق تجاوز الوكيل النشط
على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، وأداة الوكيل `tts`. راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
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

- `id`: معرّف وكيل ثابت (مطلوب).
- `default`: عند تعيين عدة قيم، تفوز الأولى (يُسجَّل تحذير). إذا لم تُعيَّن أي قيمة، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: الصيغة النصية تعيّن نموذجًا أساسيًا صارمًا لكل وكيل بلا احتياطي للنموذج؛ وصيغة الكائن `{ primary }` صارمة أيضًا ما لم تضف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في الاحتياطي، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. مهام Cron التي تتجاوز `primary` فقط تظل ترث الاحتياطيات الافتراضية ما لم تعيّن `fallbacks: []`.
- `params`: معاملات بث لكل وكيل تُدمَج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النماذج كله.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. تُدمَج الكتلة دمجًا عميقًا فوق `messages.tts`، لذا أبقِ بيانات اعتماد المزوّد المشتركة وسياسة الاحتياطي في `messages.tts` وعيّن هنا فقط القيم الخاصة بالشخصية مثل المزوّد أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية للـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ والقائمة الصريحة تستبدل الافتراضيات بدلًا من دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عند عدم تعيين تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزوّد/النموذج المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، تُبقي `adaptive` التفكير الديناميكي المملوك للمزوّد (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: الظهور الافتراضي الاختياري للاستدلال لكل وكيل (`on | off | stream`). يتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عند عدم تعيين تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: الافتراضي الاختياري لكل وكيل للوضع السريع (`true | false`). ينطبق عند عدم تعيين تجاوز للوضع السريع لكل رسالة أو جلسة.
- `agentRuntime`: تجاوز اختياري منخفض المستوى لسياسة وقت التشغيل لكل وكيل. استخدم `{ id: "codex" }` لجعل وكيل واحد خاصًا بـ Codex فقط بينما تحتفظ الوكلاء الأخرى باحتياطي PI الافتراضي في وضع `auto`.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) عندما ينبغي أن يكون الوكيل افتراضيًا لجلسات حاضنة ACP.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو URI من نوع `data:`.
- تستمد `identity` الافتراضيات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط). ضمّن معرّف الطالب عندما ينبغي السماح باستدعاءات `agentId` التي تستهدف نفسها.
- حارس وراثة صندوق العزل: إذا كانت جلسة الطالب داخل صندوق عزل، يرفض `sessions_spawn` الأهداف التي ستعمل خارج صندوق العزل.
- `subagents.requireAgentId`: عند كونها true، احظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف التعريف صراحةً؛ الافتراضي: false).

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

- `type` (اختياري): `route` للتوجيه العادي (النوع المحذوف يكون افتراضيًا route)، و`acp` لروابط محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ محذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة دقيقة، بلا نظير/نقابة/فريق)
5. `match.accountId: "*"` (على نطاق القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw الربط بحسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات ربط المسار أعلاه.

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

راجع [رمل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لتفاصيل الأولوية.

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

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات دردشة المجموعات.
  - `per-sender` (الافتراضي): يحصل كل مُرسِل على جلسة معزولة داخل سياق قناة.
  - `global`: يتشارك كل المشاركين في سياق قناة واحد جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تتشارك كل الرسائل المباشرة الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المُرسِل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مُرسِل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مُرسِل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرّفات الأساسية بالأقران ذوي بادئة المزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر الإرساء مثل `/dock_discord` الخريطة نفسها لتبديل مسار رد الجلسة النشطة إلى قرين قناة مرتبط آخر؛ راجع [إرساء القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة الضبط الأساسية. يعيد `daily` الضبط في الوقت المحلي `atHour`؛ ويعيد `idle` الضبط بعد `idleMinutes`. عند تكوينهما معًا، يفوز أيهما تنتهي مدته أولًا. تستخدم حداثة إعادة الضبط اليومية قيمة `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة الضبط عند الخمول `lastInteractionAt`. يمكن لكتابات الخلفية/أحداث النظام مثل Heartbeat، وتنبيهات Cron، وإشعارات exec، ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تبقي جلسات اليومي/الخمول حديثة.
- **`resetByType`**: تجاوزات حسب النوع (`direct`، `group`، `thread`). يُقبل `dm` القديم كاسم بديل لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لدورات الرد المتبادل بين الوكلاء أثناء تبادلات وكيل-إلى-وكيل (عدد صحيح، النطاق: `0`–`5`). يعطّل `0` تسلسل الردود المتبادلة.
- **`sendPolicy`**: المطابقة حسب `channel`، أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`)، أو `keyPrefix`، أو `rawKeyPrefix`. أول منع يفوز.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات والاحتفاظ.
  - `mode`: يصدر `warn` تحذيرات فقط؛ ويطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات الراكدة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفًا دفعيًا مع مخزن تجاوز صغير للحدود ذات حجم الإنتاج؛ ويطبّق `openclaw sessions cleanup --enforce` الحد فورًا.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من التكوينات الأقدم.
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات نصوص `*.reset.<timestamp>`. تكون افتراضيًا `pruneAfter`؛ اضبطها على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية اختيارية لقرص دليل الجلسات. في وضع `warn` يسجّل تحذيرات؛ وفي وضع `enforce` يزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. يكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: الافتراضيات العامة لميزات الجلسات المرتبطة بالمحادثات.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين تجاوزه؛ يستخدم Discord `channels.discord.threadBindings.enabled`)
  - `idleHours`: الإلغاء التلقائي الافتراضي للتركيز عند الخمول بالساعات (`0` يعطّل؛ يمكن للمزوّدين تجاوزه)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ يمكن للمزوّدين تجاوزه)
  - `spawnSessions`: بوابة افتراضية لإنشاء جلسات عمل مرتبطة بالمحادثات من `sessions_spawn` وعمليات إنشاء محادثات ACP. يكون افتراضيًا `true` عندما تكون ارتباطات المحادثات مفعّلة؛ ويمكن للمزوّدين/الحسابات تجاوزه.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي للإنشاءات المرتبطة بالمحادثات (`"fork"` أو `"isolated"`). يكون افتراضيًا `"fork"`.

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

الحسم (الأكثر تحديدًا يفوز): الحساب → القناة → العام. يعطّل `""` السلوك ويوقف التسلسل. تستمد `"auto"` القيمة من `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف            | مثال                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر       | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد          | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`, `low`, `off`        |
| `{identity.name}` | اسم هوية الوكيل    | (مثل `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. يُعد `{think}` اسمًا مستعارًا لـ `{thinkingLevel}`.

### تفاعل الإقرار

- يكون افتراضيًا `identity.emoji` للوكيل النشط، وإلا `"👀"`. عيّن `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحسم: الحساب → القناة → `messages.ackReaction` → احتياطي الهوية.
- النطاق: `group-mentions` (افتراضي)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد في القنوات القادرة على التفاعلات مثل Slack وDiscord وTelegram وWhatsApp وBlueBubbles.
- `messages.statusReactions.enabled`: يفعّل تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  على Slack وDiscord، يبقي عدم ضبطها تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  على Telegram، اضبطها صراحةً على `true` لتفعيل تفاعلات حالة دورة الحياة.

### تأخير الرسائل الواردة

يجمع الرسائل النصية السريعة فقط من المرسل نفسه في دور وكيل واحد. تؤدي الوسائط/المرفقات إلى الإرسال فورًا. تتجاوز أوامر التحكم التأخير.

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. يمكن أن يتجاوز `/tts on|off` التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك صريح).
- تعود مفاتيح API احتياطيًا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- مزوّدو الكلام المضمّنون مملوكون للـ Plugin. إذا تم ضبط `plugins.allow`، فأدرج كل Plugin مزوّد TTS تريد استخدامه، مثل `microsoft` لـ Edge TTS. يُقبل معرّف المزوّد القديم `edge` كاسم مستعار لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحسم هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية ليست OpenAI، يتعامل OpenClaw معها كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

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
  },
}
```

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تكوين عدة مزوّدي التحدث.
- مفاتيح التحدث المسطحة القديمة (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) مخصّصة للتوافق فقط، وتُرحّل تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت احتياطيًا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- ينطبق احتياطي `ELEVENLABS_API_KEY` فقط عندما لا يكون مفتاح API للتحدث مكوّنًا.
- يتيح `providers.*.voiceAliases` لتوجيهات التحدث استخدام أسماء ودية.
- يختار `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا أُغفل، يستخدم macOS `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر مساعد `openclaw-mlx-tts` المضمّن عند وجوده، أو عبر ملف تنفيذي على `PATH`؛ يتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد لأغراض التطوير.
- يضبط `speechLocale` معرّف اللغة BCP 47 المستخدم من خلال التعرف على الكلام في وضع التحدث على iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع التحدث بعد صمت المستخدم قبل أن يرسل النص المنسوخ. عند عدم ضبطه، يُبقي نافذة الإيقاف الافتراضية للمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).

---

## ذو صلة

- [مرجع التكوين](/ar/gateway/configuration-reference) — جميع مفاتيح التكوين الأخرى
- [التكوين](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة التكوين](/ar/gateway/configuration-examples)
