---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين التوجيه والارتباطات متعددة الوكلاء
    - ضبط الجلسة وتسليم الرسائل وسلوك وضع التحدث
summary: الإعدادات الافتراضية للوكيل، والتوجيه متعدد الوكلاء، والجلسة، والرسائل، وإعدادات المحادثة
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-05-06T07:52:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b864cc3985db2f3ab2e82b18bcd1b1590a387d7474f5f0d0da3a1d36d9a276b9
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح الإعدادات ذات نطاق الوكيل ضمن `agents.*` و`multiAgent.*` و`session.*` و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات وتشغيل Gateway والمفاتيح الأخرى ذات المستوى الأعلى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## افتراضيات الوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime ضمن موجّه النظام. إذا لم يُعيّن، يكتشفه OpenClaw تلقائيًا عبر الانتقال صعودًا من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية للـ Skills للوكلاء الذين لا يعيّنون `agents.list[].skills`.

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

- احذف `agents.defaults.skills` لإتاحة Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة الافتراضيات.
- عيّن `agents.list[].skills: []` لعدم إتاحة أي Skills.
- القائمة غير الفارغة في `agents.list[].skills` هي المجموعة النهائية لذلك الوكيل؛ ولا تُدمج مع الافتراضيات.

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

يتحكم في وقت إدخال ملفات تمهيد مساحة العمل في موجّه النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة، بعد اكتمال استجابة المساعد، إعادة إدخال تمهيد مساحة العمل، مما يقلل حجم الموجّه. لا تزال عمليات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: يعطّل إدخال تمهيد مساحة العمل وملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة الموجّه بالكامل، مثل محركات السياق المخصصة أو بيئات التشغيل الأصلية التي تبني سياقها بنفسها أو سير العمل المتخصصة بلا تمهيد. تتخطى أدوار Heartbeat واسترداد Compaction الإدخال أيضًا.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف لكل ملف تمهيد في مساحة العمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

إجمالي الحد الأقصى للأحرف المُدخلة عبر جميع ملفات تمهيد مساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في إشعار موجّه النظام المرئي للوكيل عند اقتطاع سياق التمهيد.
الافتراضي: `"once"`.

- `"off"`: لا تُدخل نص إشعار الاقتطاع في موجّه النظام أبدًا.
- `"once"`: أدخل إشعارًا موجزًا مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: أدخل إشعارًا موجزًا في كل تشغيل عندما يوجد اقتطاع.

تبقى الأعداد الخام/المُدخلة التفصيلية وحقول ضبط الإعدادات في التشخيصات مثل تقارير السياق/الحالة والسجلات؛ ولا يحصل سياق المستخدم/التشغيل الاعتيادي في WebChat إلا على إشعار الاسترداد الموجز.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

لدى OpenClaw عدة ميزانيات عالية الحجم للموجّه/السياق، وهي مقسّمة عمدًا حسب النظام الفرعي بدلًا من تمريرها جميعًا عبر عنصر تحكم عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  إدخال تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  مقدمة تشغيل النموذج لمرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات `memory/*.md` اليومية الحديثة. يتم الإقرار بأوامر الدردشة المجردة `/new` و`/reset` دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة Skills الموجزة المُدخلة في موجّه النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات تشغيل محدودة وكتل مُدخلة مملوكة للتشغيل.
- `memory.qmd.limits.*`:
  حجم مقتطف بحث الذاكرة المفهرس والإدخال.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في مقدمة بدء التشغيل في الدور الأول التي تُدخل عند تشغيل النموذج لإعادة الضبط/بدء التشغيل. تقر أوامر الدردشة المجردة `/new` و`/reset` بإعادة الضبط دون استدعاء النموذج، لذلك لا تحمّل هذه المقدمة.

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

افتراضيات مشتركة لأسطح سياق التشغيل المحدودة.

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

- `memoryGetMaxChars`: حد مقتطف `memory_get` الافتراضي قبل إضافة بيانات الاقتطاع الوصفية وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة أسطر `memory_get` الافتراضية عند حذف `lines`.
- `toolResultMaxChars`: حد نتائج الأدوات المباشر المستخدم للنتائج المستمرة واسترداد الفائض.
- `postCompactionMaxChars`: حد مقتطف AGENTS.md المستخدم أثناء إدخال التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لعناصر التحكم المشتركة في `contextLimits`. ترث الحقول المحذوفة من `agents.defaults.contextLimits`.

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

الحد العام لقائمة Skills الموجزة المُدخلة في موجّه النظام. لا يؤثر هذا في قراءة ملفات `SKILL.md` عند الطلب.

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

الحد الأقصى لحجم البكسل لأطول جانب في الصورة داخل كتل صور النص/الأدوات قبل استدعاءات المزوّد.
الافتراضي: `1200`.

عادةً ما تقلل القيم الأدنى استخدام رموز الرؤية وحجم حمولة الطلب في عمليات التشغيل كثيفة لقطات الشاشة.
تحافظ القيم الأعلى على مزيد من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجّه النظام، وليس للطوابع الزمنية للرسائل. تعود إلى المنطقة الزمنية للمضيف عند عدم توفرها.

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
  - يضبط شكل السلسلة النصية النموذج الأساسي فقط.
  - يضبط شكل الكائن النموذج الأساسي إضافة إلى نماذج تجاوز الفشل المرتبة.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` كإعداد لنموذج الرؤية.
  - يُستخدم أيضًا كتوجيه احتياطي عندما يتعذر على النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرّفات المجردة للتوافق؛ إذا طابق معرّف مجرد بشكل فريد إدخالًا مهيأً يدعم الصور في `models.providers.*.models`، فإن OpenClaw يؤهله إلى ذلك المزوّد. تتطلب المطابقات المهيأة الملتبسة بادئة مزوّد صريحة.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد صورًا.
  - قيم نموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، و`fal/fal-ai/flux/dev` لـ fal، و`openai/gpt-image-2` لـ OpenAI Images، أو `openai/gpt-image-1.5` لمخرجات OpenAI PNG/WebP ذات الخلفية الشفافة.
  - إذا اخترت مزوّدًا/نموذجًا مباشرة، فاضبط أيضًا مصادقة المزوّد المطابقة (مثلًا `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، و`FAL_KEY` لـ `fal/*`).
  - إذا حُذف، فلا يزال بإمكان `image_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم مزوّدي توليد الصور المسجلين المتبقين بترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الموسيقى المشتركة وأداة `music_generate` المضمّنة.
  - قيم نموذجية: `google/lyria-3-clip-preview`، أو `google/lyria-3-pro-preview`، أو `minimax/music-2.6`.
  - إذا حُذف، فلا يزال بإمكان `music_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم مزوّدي توليد الموسيقى المسجلين المتبقين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرة، فاضبط أيضًا مصادقة المزوّد/مفتاح API المطابق.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الفيديو المشتركة وأداة `video_generate` المضمّنة.
  - قيم نموذجية: `qwen/wan2.6-t2v`، أو `qwen/wan2.6-i2v`، أو `qwen/wan2.6-r2v`، أو `qwen/wan2.6-r2v-flash`، أو `qwen/wan2.7-r2v`.
  - إذا حُذف، فلا يزال بإمكان `video_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم مزوّدي توليد الفيديو المسجلين المتبقين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرة، فاضبط أيضًا مصادقة المزوّد/مفتاح API المطابق.
  - يدعم مزوّد توليد الفيديو Qwen المضمّن ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/الافتراضي المحلول.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يراعيها وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `toolProgressDetail`: وضع التفاصيل لملخصات أدوات `/verbose` وسطور أدوات مسودة التقدم. القيم: `"explain"` (الافتراضي، تسميات بشرية موجزة) أو `"raw"` (إلحاق الأمر/التفاصيل الخام عند توفرها). يتجاوز `agents.list[].toolProgressDetail` الخاص بكل وكيل هذا الافتراضي.
- `reasoningDefault`: الظهور الافتراضي للاستدلال لدى الوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` الخاص بكل وكيل هذا الافتراضي. لا تُطبَّق افتراضيات الاستدلال المهيأة إلا للمالكين، أو المرسلين المصرح لهم، أو سياقات Gateway الخاصة بمسؤول المشغّل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` (مثل `openai/gpt-5.5` للوصول بمفتاح API أو `openai-codex/gpt-5.5` لـ Codex OAuth). إذا حذفت المزوّد، يجرّب OpenClaw اسمًا مستعارًا أولًا، ثم مطابقة مزوّد مهيأ فريدة لمعرّف النموذج الدقيق ذاك، وعندها فقط يعود إلى المزوّد الافتراضي المهيأ (سلوك توافق مهمل، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيأ، يعود OpenClaw إلى أول مزوّد/نموذج مهيأ بدل إظهار افتراضي قديم لمزوّد مُزال.
- `models`: كتالوج النماذج المهيأ وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصار) و`params` (خاصة بالمزوّد، مثل `temperature`، و`maxTokens`، و`cacheRetention`، و`context1m`، و`responsesServerCompaction`، و`responsesCompactThreshold`، و`chat_template_kwargs`، و`extra_body`/`extraBody`).
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات قائمة السماح الحالية ما لم تمرر `--replace`.
  - تدمج تدفقات الضبط/الإعداد ذات نطاق المزوّد نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين غير المرتبطين والمهيئين سابقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، تُفعَّل Compaction من جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction من جانب خادم OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على كل النماذج. تُضبط عند `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (الإعداد): يتجاوز `agents.defaults.models["provider/model"].params` (لكل نموذج) `agents.defaults.params` (الأساس العام)، ثم يتجاوز `agents.list[].params` (معرّف الوكيل المطابق) حسب المفتاح. راجع [التخزين المؤقت للموجهات](/ar/reference/prompt-caching) للتفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في أجسام طلبات `api: "openai-completions"` لوكلاء OpenAI المتوافقين. إذا تعارض مع مفاتيح الطلب المُنشأة، ينتصر الجسم الإضافي؛ لا تزال مسارات الإكمال غير الأصلية تزيل `store` الخاص بـ OpenAI بعد ذلك.
- `params.chat_template_kwargs`: وسائط قالب الدردشة المتوافقة مع vLLM/OpenAI تُدمج في أجسام طلبات `api: "openai-completions"` ذات المستوى الأعلى. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ تتجاوز `chat_template_kwargs` الصريحة الافتراضيات المُنشأة، وتظل `extra_body.chat_template_kwargs` صاحبة الأسبقية النهائية. بالنسبة إلى عناصر تحكم التفكير في vLLM Qwen، اضبط `params.qwenThinkingFormat` على `"chat-template"` أو `"top-level"` في إدخال ذلك النموذج.
- `compat.supportedReasoningEfforts`: قائمة جهود الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` للنقاط الطرفية المخصصة التي تقبله فعلًا؛ يعرض OpenClaw عندها `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من تصحيحات الجلسة، والتحقق في CLI الوكيل، والتحقق من `llm-task` لذلك المزوّد/النموذج المهيأ. استخدم `compat.reasoningEffortMap` عندما تريد الواجهة الخلفية قيمة خاصة بالمزوّد لمستوى معياري.
- `params.preserveThinking`: اشتراك خاص بـ Z.AI فقط للتفكير المحفوظ. عند تفعيله وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: سياسة وقت تشغيل الوكيل منخفضة المستوى الافتراضية. يكون المعرّف المحذوف افتراضيًا OpenClaw Pi. استخدم `id: "pi"` لفرض حزمة PI المضمّنة، أو `id: "auto"` للسماح لحزم Plugin المسجلة بادعاء النماذج المدعومة واستخدام PI عند عدم وجود مطابقة، أو معرّف حزمة مسجلة مثل `id: "codex"` لطلب تلك الحزمة، أو اسمًا مستعارًا مدعومًا لواجهة CLI خلفية مثل `id: "claude-cli"`. تفشل أوقات تشغيل Plugin الصريحة بشكل مغلق عندما تكون الحزمة غير متاحة أو تفشل. أبقِ مراجع النماذج معيارية بصيغة `provider/model`؛ حدّد Codex، وClaude CLI، وGemini CLI، وغيرها من واجهات التنفيذ الخلفية عبر إعداد وقت التشغيل بدل بادئات مزوّد وقت التشغيل القديمة. راجع [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) لمعرفة اختلاف ذلك عن تحديد المزوّد/النموذج.
- كتّاب الإعداد الذين يغيّرون هذه الحقول (مثل `/models set`، و`/models set-image`، وأوامر إضافة/إزالة الاحتياطيات) يحفظون شكل الكائن المعياري ويحافظون على قوائم الاحتياطيات الحالية متى أمكن.
- `maxConcurrent`: الحد الأقصى لتشغيل الوكلاء بالتوازي عبر الجلسات (تظل كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.agentRuntime`

يتحكم `agentRuntime` في المنفّذ منخفض المستوى الذي يشغّل أدوار الوكيل. ينبغي لمعظم
عمليات النشر الإبقاء على وقت تشغيل OpenClaw Pi الافتراضي. استخدمه عندما يوفّر Plugin
موثوق حزمة أصلية، مثل حزمة خادم تطبيق Codex المضمّنة،
أو عندما تريد واجهة CLI خلفية مدعومة مثل Claude CLI. للنموذج الذهني،
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

- `id`: `"auto"`، أو `"pi"`، أو معرّف حزمة Plugin مسجلة، أو اسم مستعار مدعوم لواجهة CLI خلفية. يسجل Plugin Codex المضمّن `codex`؛ ويوفر Plugin Anthropic المضمّن واجهة CLI الخلفية `claude-cli`.
- يتيح `id: "auto"` لحزم Plugin المسجلة ادعاء الأدوار المدعومة ويستخدم PI عندما لا تطابق أي حزمة. يتطلب وقت تشغيل Plugin صريح مثل `id: "codex"` تلك الحزمة ويفشل بشكل مغلق إذا كانت غير متاحة أو فشلت.
- تجاوز البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` قيمة `id` لذلك العملية.
- لعمليات نشر Codex فقط، اضبط `model: "openai/gpt-5.5"` و`agentRuntime.id: "codex"`.
- لعمليات نشر Claude CLI، فضّل `model: "anthropic/claude-opus-4-7"` إضافة إلى `agentRuntime.id: "claude-cli"`. لا تزال مراجع النموذج القديمة `claude-cli/claude-opus-4-7` تعمل للتوافق، لكن ينبغي للإعداد الجديد إبقاء تحديد المزوّد/النموذج معياريًا ووضع واجهة التنفيذ الخلفية في `agentRuntime.id`.
- يعيد `openclaw doctor --fix` كتابة مفاتيح سياسة وقت التشغيل الأقدم إلى `agentRuntime`.
- يُثبَّت اختيار الحزمة لكل معرّف جلسة بعد أول تشغيل مضمن. تؤثر تغييرات الإعداد/البيئة في الجلسات الجديدة أو المعاد ضبطها، لا في سجل محادثة قائم. تُعامل الجلسات القديمة التي تحتوي سجل محادثة لكن لا تحتوي تثبيتًا مسجلًا على أنها مثبتة على PI. يبلّغ `/status` عن وقت التشغيل الفعّال، مثل `Runtime: OpenClaw Pi Default` أو `Runtime: OpenAI Codex`.
- يتحكم هذا فقط في تنفيذ أدوار وكيل النصوص. لا تزال توليدات الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمّنة** (لا تنطبق إلا عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار      | النموذج                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

تنتصر الأسماء المستعارة التي هيأتها دائمًا على الافتراضيات.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضيًا عندما لا يُضبط مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لعمليات التشغيل الاحتياطية النصية فقط (من دون استدعاءات أدوات). مفيدة كنسخة احتياطية عند فشل موفّري API.

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

- واجهات CLI الخلفية موجّهة للنص أولًا؛ وتكون الأدوات معطّلة دائمًا.
- الجلسات مدعومة عند ضبط `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل مطالبة النظام الكاملة التي يجمّعها OpenClaw بسلسلة ثابتة. اضبط ذلك على مستوى الافتراضيات (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون لقيم كل وكيل أولوية؛ ويتم تجاهل القيمة الفارغة أو المكوّنة من مسافات فقط. مفيد لتجارب المطالبات المضبوطة.

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

طبقات مطالبات مستقلة عن الموفّر تُطبّق حسب عائلة النموذج. تتلقى معرّفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر الموفّرين؛ ويتحكم `personality` فقط في طبقة أسلوب التفاعل الودّي.

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

- يفعّل `"friendly"` (افتراضيًا) و`"on"` طبقة أسلوب التفاعل الودّي.
- يعطّل `"off"` الطبقة الودّية فقط؛ ويظل عقد سلوك GPT-5 الموسوم مفعّلًا.
- لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ عندما لا يكون هذا الإعداد المشترك مضبوطًا.

### `agents.defaults.heartbeat`

عمليات Heartbeat دورية.

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
- `includeSystemPromptSection`: عند ضبطها على false، تحذف قسم Heartbeat من مطالبة النظام وتتجاوز حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند ضبطها على true، تكبت حمولات تحذير أخطاء الأدوات أثناء عمليات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل Heartbeat قبل إجهاضه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/DM. يسمح `allow` (افتراضيًا) بالتسليم إلى الهدف المباشر. يكبت `block` التسليم إلى الهدف المباشر ويصدر `reason=dm-blocked`.
- `lightContext`: عند ضبطها على true، تستخدم عمليات Heartbeat سياق تمهيد خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند ضبطها على true، تعمل كل Heartbeat في جلسة جديدة من دون سجل محادثات سابق. النمط نفسه لعزل Cron `sessionTarget: "isolated"`. يقلّل تكلفة الرموز لكل Heartbeat من نحو 100 ألف إلى نحو 2-5 آلاف رمز.
- `skipWhenBusy`: عند ضبطها على true، تؤجل عمليات Heartbeat عند وجود مسارات انشغال إضافية: عمل وكيل فرعي أو أمر متداخل. تؤجل مسارات Cron عمليات Heartbeat دائمًا، حتى من دون هذا العلم.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، تعمل Heartbeat **لهؤلاء الوكلاء فقط**.
- تشغّل Heartbeat أدوار وكيل كاملة؛ تحرق الفواصل الأقصر مزيدًا من الرموز.

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
- `provider`: معرّف Plugin موفّر Compaction مسجّل. عند ضبطه، يُستدعى `summarize()` الخاص بالموفّر بدل تلخيص LLM المدمج. يعود إلى المدمج عند الفشل. ضبط موفّر يفرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى للثواني المسموح بها لعملية Compaction واحدة قبل أن يجهضها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة قطع Pi للاحتفاظ بذيل النص الأحدث حرفيًا. يحترم `/compact` اليدوي هذا عند ضبطه صراحة؛ وإلا يكون Compaction اليدوي نقطة تحقق صارمة.
- `identifierPolicy`: `strict` (افتراضيًا)، أو `off`، أو `custom`. يضيف `strict` إرشادات مدمجة للاحتفاظ بالمعرّفات المعتمة في بداية تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند وجود مخرجات مشوّهة لملخصات الحماية. مفعّلة افتراضيًا في وضع الحماية؛ اضبط `enabled: false` لتجاوز التدقيق.
- `midTurnPrecheck`: فحص اختياري لضغط حلقة أدوات Pi. عند `enabled: true`، يتحقق OpenClaw من ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسبًا، يجهض المحاولة الحالية قبل إرسال المطالبة ويعيد استخدام مسار الاسترداد الحالي قبل الفحص لاقتطاع نتائج الأدوات أو إجراء Compaction وإعادة المحاولة. يعمل مع وضعي Compaction `default` و`safeguard`. الافتراضي: معطّل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من AGENTS.md لإعادة حقنها بعد Compaction. الافتراضي `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. عند عدم الضبط أو الضبط صراحة على هذا الزوج الافتراضي، تُقبل أيضًا عناوين `Every Session`/`Safety` القديمة كبديل تراثي.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدمه عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم ضبطه، يستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: حد اختياري بالبايت (`number` أو سلاسل مثل `"20mb"`) يفعّل Compaction محليًا عاديًا قبل التشغيل عندما يتجاوز JSONL النشط الحد. يتطلب `truncateAfterCompaction` حتى تتمكن عملية Compaction الناجحة من التدوير إلى نص لاحق أصغر. معطّل عند عدم الضبط أو عند `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثل "ضغط السياق..." و"اكتمل Compaction"). معطّل افتراضيًا للحفاظ على صمت Compaction.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين ذكريات دائمة. اضبط `model` على موفّر/نموذج دقيق مثل `ollama/qwen3:8b` عندما يجب أن يبقى دور الصيانة هذا على نموذج محلي؛ لا يرث التجاوز سلسلة احتياطي الجلسة النشطة. يُتجاوز عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يشذّب **نتائج الأدوات القديمة** من السياق داخل الذاكرة قبل الإرسال إلى LLM. لا يعدّل سجل الجلسة على القرص.

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
- يتحكم `ttl` في عدد مرات إمكانية تشغيل التشذيب مرة أخرى (بعد آخر لمس للذاكرة المؤقتة).
- يبدأ التشذيب بقصّ نتائج الأدوات كبيرة الحجم قصًا خفيفًا، ثم يمسح نتائج الأدوات الأقدم مسحًا صارمًا عند الحاجة.

**القص الخفيف** يحتفظ بالبداية + النهاية ويدرج `...` في الوسط.

**المسح الصارم** يستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا تُقصّ/تُمسح كتل الصور أبدًا.
- النسب مبنية على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا وُجد أقل من `keepLastAssistants` من رسائل المساعد، يتم تجاوز التشذيب.

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

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحةً لتفعيل ردود الكتل.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات كل حساب). تكون القيم الافتراضية في Signal/Slack/Discord/Google Chat هي `minChars: 1500`.
- `humanDelay`: إيقاف عشوائي بين ردود الكتل. `natural` = 800-2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

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

- الإعدادات الافتراضية: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات غير المشار إليك فيها.
- التجاوزات لكل جلسة: `session.typingMode`، و`session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

عزل اختياري للوكيل المضمَّن. راجع [العزل](/ar/gateway/sandboxing) للاطلاع على الدليل الكامل.

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

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**تكوين خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (افتراضي: `ssh`)
- `workspaceRoot`: الجذر البعيد المطلق المستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: عناصر ضبط سياسة مفتاح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` يتغلب على `identityFile`
- `certificateData` يتغلب على `certificateFile`
- `knownHostsData` يتغلب على `knownHostsFile`
- قيم `*Data` المدعومة بـ SecretRef تُحل من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة البيئة المعزولة

**سلوك خلفية SSH:**

- يهيئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يبقي مساحة عمل SSH البعيدة هي النسخة المعيارية
- يوجّه `exec`، وأدوات الملفات، ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيًا
- لا يدعم حاويات متصفح البيئة المعزولة

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل بيئة معزولة لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل البيئة المعزولة عند `/workspace`، ومساحة عمل الوكيل مركّبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركّبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (افتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (بلا عزل بين الجلسات)

**تكوين Plugin الخاص بـ OpenShell:**

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

- `mirror`: تهيئة البعيد من المحلي قبل exec، ثم المزامنة مرة أخرى بعد exec؛ تبقى مساحة العمل المحلية هي النسخة المعيارية
- `remote`: تهيئة البعيد مرة واحدة عند إنشاء البيئة المعزولة، ثم إبقاء مساحة العمل البعيدة هي النسخة المعيارية

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تتم خارج OpenClaw إلى البيئة المعزولة تلقائيًا بعد خطوة التهيئة.
يكون النقل عبر SSH إلى بيئة OpenShell المعزولة، لكن الـ Plugin يملك دورة حياة البيئة المعزولة والمزامنة المرآتية الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج للشبكة، وجذر قابل للكتابة، ومستخدم root.

**تستخدم الحاويات افتراضيًا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة bridge مخصصة) إذا احتاج الوكيل إلى وصول صادر.
`"host"` محظور. `"container:<id>"` محظور افتراضيًا إلا إذا ضبطت صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (إجراء طارئ).

**المرفقات الواردة** تُجهَّز في `media/inbound/*` داخل مساحة العمل النشطة.

**`docker.binds`** يركّب أدلة مضيف إضافية؛ ويتم دمج عمليات الربط العامة وتلك الخاصة بكل وكيل.

**متصفح معزول** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. يُحقن عنوان URL الخاص بـ noVNC في موجّه النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقب عبر noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL قصير العمر برمز مميز (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- `allowHostControl: false` (افتراضي) يمنع الجلسات المعزولة من استهداف متصفح المضيف.
- تكون قيمة `network` افتراضيًا `openclaw-sandbox-browser` (شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند طرف الحاوية إلى نطاق CIDR (مثلًا `172.21.0.1/32`).
- يركّب `sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية متصفح البيئة المعزولة فقط. عند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- تُعرَّف إعدادات الإطلاق الافتراضية في `scripts/sandbox-browser-entrypoint.sh` ومضبوطة لمضيفي الحاويات:
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
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه على `0` لاستخدام حد عمليات
    Chromium الافتراضي.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - الإعدادات الافتراضية هي خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة بنقطة دخول مخصصة
    لتغيير إعدادات الحاوية الافتراضية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` خاصان بـ Docker فقط.

ابنِ الصور (من نسخة مصدرية محلية):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

لتثبيتات npm من دون نسخة مصدرية محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) للاطلاع على أوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح الوكيل مزوّد TTS، أو صوتًا، أو نموذجًا،
أو أسلوبًا، أو وضع TTS تلقائيًا خاصًا به. يدمج كتلة الوكيل دمجًا عميقًا فوق
`messages.tts` العامة، وبذلك يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما تتجاوز
الوكلاء الفرديون حقول الصوت أو المزوّد التي يحتاجون إليها فقط. ينطبق تجاوز الوكيل النشط
على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، وأداة الوكيل `tts`.
راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
للاطلاع على أمثلة المزوّدين والأسبقية.

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
- `default`: عند ضبط أكثر من واحد، يفوز الأول (يُسجَّل تحذير). إذا لم يُضبط أي منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: صيغة السلسلة تضبط نموذجًا أساسيًا صارمًا لكل وكيل دون رجوع احتياطي للنموذج؛ وصيغة الكائن `{ primary }` تكون صارمة أيضًا ما لم تُضِف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في الرجوع الاحتياطي، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. وظائف Cron التي تتجاوز `primary` فقط تظل ترث الرجوعات الاحتياطية الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معاملات بث لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` دون تكرار كتالوج النماذج كله.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. تُدمج الكتلة بعمق فوق `messages.tts`، لذا أبقِ بيانات اعتماد المزوّد المشتركة وسياسة الرجوع الاحتياطي في `messages.tts` واضبط هنا فقط القيم الخاصة بالشخصية مثل المزوّد أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية للمهارات لكل وكيل. إذا أُغفلت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ والقائمة الصريحة تستبدل الافتراضيات بدل دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عند عدم ضبط تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف المزوّد/النموذج المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، يحافظ `adaptive` على التفكير الديناميكي المملوك للمزوّد (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: رؤية الاستدلال الافتراضية الاختيارية لكل وكيل (`on | off | stream`). يتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عند عدم ضبط تجاوز استدلال لكل رسالة أو جلسة.
- `fastModeDefault`: الإعداد الافتراضي الاختياري لكل وكيل للوضع السريع (`true | false`). يُطبَّق عند عدم ضبط تجاوز للوضع السريع لكل رسالة أو جلسة.
- `agentRuntime`: تجاوز اختياري منخفض المستوى لسياسة وقت التشغيل لكل وكيل. استخدم `{ id: "codex" }` لجعل وكيل واحد مخصصًا لـ Codex فقط بينما يحتفظ الوكلاء الآخرون بالرجوع الاحتياطي الافتراضي إلى PI في وضع `auto`.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) عندما ينبغي أن يكون الافتراضي للوكيل هو جلسات إطار ACP.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL ‏`http(s)`، أو URI ‏`data:`.
- يستمد `identity` الافتراضيات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط). ضمّن معرّف الطالب عندما ينبغي السماح باستدعاءات `agentId` التي تستهدف الذات.
- حارس وراثة العزل: إذا كانت جلسة الطالب معزولة، يرفض `sessions_spawn` الأهداف التي ستعمل دون عزل.
- `subagents.requireAgentId`: عند ضبطها على true، احظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض تحديد ملف التعريف صراحة؛ الافتراضي: false).

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

- `type` (اختياري): `route` للتوجيه العادي (النوع المفقود يُعامل افتراضيًا كمسار)، و`acp` لروابط محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ المحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة دقيقة، دون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw المطابقة حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات ربط المسار أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="وصول كامل (بدون عزل)">

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

راجع [صندوق عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) للاطلاع على تفاصيل الأسبقية.

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
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق قناة.
  - `global`: يشارك جميع المشاركين في سياق قناة واحد جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك كل الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرّفات القانونية بالأقران ذوي بادئة المزوّد لمشاركة الجلسات عبر القنوات. تستخدم أوامر الربط مثل `/dock_discord` الخريطة نفسها لتحويل مسار رد الجلسة النشطة إلى قرين قناة مرتبط آخر؛ راجع [ربط القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة التعيين الأساسية. يعيد `daily` التعيين عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` التعيين بعد `idleMinutes`. عند تكوينهما معا، يفوز أيهما تنتهي صلاحيته أولا. تستخدم حداثة إعادة التعيين اليومية `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة التعيين بسبب الخمول `lastInteractionAt`. يمكن لكتابات الخلفية/أحداث النظام مثل Heartbeat، وتنبيهات Cron، وإشعارات exec، ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تبقي الجلسات اليومية/الخاملة حديثة.
- **`resetByType`**: تجاوزات حسب النوع (`direct`، `group`، `thread`). يُقبل `dm` القديم كاسم مستعار لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائما `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء التبادلات من وكيل إلى وكيل (عدد صحيح، النطاق: `0`-`5`). يعطّل `0` سلسلة الردود المتبادلة.
- **`sendPolicy`**: يطابق حسب `channel`، أو `chatType` (`direct|group|channel`، مع الاسم المستعار القديم `dm`)، أو `keyPrefix`، أو `rawKeyPrefix`. أول رفض يفوز.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات والاحتفاظ.
  - `mode`: يصدر `warn` تحذيرات فقط؛ ويطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات الراكدة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفا على دفعات مع مخزن علوي صغير للحدود ذات حجم الإنتاج؛ ويطبّق `openclaw sessions cleanup --enforce` الحد فورا.
  - `rotateBytes`: مهمل ويتم تجاهله؛ يزيله `openclaw doctor --fix` من الإعدادات القديمة.
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات نصوص المحادثات `*.reset.<timestamp>`. تكون افتراضيا `pruneAfter`؛ اضبطها على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم العناصر/الجلسات أولا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. الافتراضي هو `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين التجاوز؛ يستخدم Discord `channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بعد الخمول بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `spawnSessions`: البوابة الافتراضية لإنشاء جلسات عمل مرتبطة بالسلاسل من `sessions_spawn` وعمليات إنشاء سلاسل ACP. تكون افتراضيا `true` عندما تكون روابط السلاسل مفعّلة؛ ويمكن للمزوّدين/الحسابات التجاوز.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي لعمليات الإنشاء المرتبطة بالسلاسل (`"fork"` أو `"isolated"`). يكون افتراضيا `"fork"`.

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

الحسم (الأكثر تحديدًا يفوز): الحساب → القناة → العام. يعطّل `""` الإعداد ويوقف التسلسل. تستنتج `"auto"` القيمة من `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف            | مثال                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر       | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد          | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`, `low`, `off`        |
| `{identity.name}` | اسم هوية الوكيل    | (مثل `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. `{think}` هو اسم بديل لـ `{thinkingLevel}`.

### تفاعل الإقرار

- الإعداد الافتراضي هو `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبطه على `""` للتعطيل.
- تجاوزات حسب القناة: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحسم: الحساب → القناة → `messages.ackReaction` → الرجوع إلى الهوية.
- النطاق: `group-mentions` (افتراضي)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد في القنوات التي تدعم التفاعلات مثل Slack وDiscord وTelegram وWhatsApp وBlueBubbles.
- `messages.statusReactions.enabled`: يفعّل تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  على Slack وDiscord، تركه غير مضبوط يبقي تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  على Telegram، اضبطه صراحةً على `true` لتفعيل تفاعلات حالة دورة الحياة.

### تهدئة الوارد

يجمع الرسائل النصية السريعة فقط من المرسل نفسه في دورة وكيل واحدة. تؤدي الوسائط/المرفقات إلى الإرسال فورًا. تتجاوز أوامر التحكم التهدئة.

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
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ والقيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك اختياري).
- تعود مفاتيح API احتياطيًا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- مزوّدو الكلام المضمّنون مملوكون لـ Plugin. إذا ضُبط `plugins.allow`، فضمّن كل Plugin مزوّد TTS تريد استخدامه، مثل `microsoft` من أجل Edge TTS. يُقبل معرّف المزوّد القديم `edge` كاسم بديل لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحسم هو التكوين، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تكوين عدة مزوّدي تحدث.
- مفاتيح التحدث القديمة المسطّحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصّصة للتوافق فقط وتُرحّل تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت احتياطيًا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- ينطبق الرجوع الاحتياطي إلى `ELEVENLABS_API_KEY` فقط عندما لا يكون هناك مفتاح API مكوّن للتحدث.
- يتيح `providers.*.voiceAliases` لتوجيهات التحدث استخدام أسماء ودّية.
- يحدد `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا حُذف، يستخدم macOS القيمة `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر مساعد `openclaw-mlx-tts` المضمّن عند وجوده، أو عبر ملف تنفيذي على `PATH`؛ يتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد لأغراض التطوير.
- يضبط `speechLocale` معرّف لغة BCP 47 المستخدم من قِبل التعرف على الكلام في وضع التحدث على iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع التحدث بعد صمت المستخدم قبل إرسال النص المفرغ. تركه غير مضبوط يبقي نافذة الإيقاف المؤقت الافتراضية للمنصة (`700 ms on macOS and Android, 900 ms on iOS`).

---

## ذات صلة

- [مرجع التكوين](/ar/gateway/configuration-reference) — جميع مفاتيح التكوين الأخرى
- [التكوين](/ar/gateway/configuration) — مهام شائعة وإعداد سريع
- [أمثلة التكوين](/ar/gateway/configuration-examples)
