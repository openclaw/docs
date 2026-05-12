---
read_when:
    - ضبط افتراضيات الوكيل (النماذج، التفكير، مساحة العمل، Heartbeat، الوسائط، Skills)
    - تكوين التوجيه والارتباطات متعددة الوكلاء
    - ضبط سلوك الجلسة وتسليم الرسائل ووضع التحدث
summary: إعدادات الوكيل الافتراضية، والتوجيه متعدد الوكلاء، والجلسة، والرسائل، وإعدادات المحادثة
title: التكوين — الوكلاء
x-i18n:
    generated_at: "2026-05-12T23:30:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08ddc1b36f4b9408ebaa5f071693b1c1333cedc9b00f75df93f12e73081e1033
    source_path: gateway/config-agents.md
    workflow: 16
---

مفاتيح التهيئة ذات النطاق الخاص بالوكيل ضمن `agents.*` و`multiAgent.*` و`session.*`
و`messages.*` و`talk.*`. بالنسبة إلى القنوات والأدوات ووقت تشغيل Gateway والمفاتيح الأخرى
ذات المستوى الأعلى، راجع [مرجع التهيئة](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر المستودع الاختياري المعروض في سطر Runtime في مطالبة النظام. إذا لم يُضبط، يكتشف OpenClaw ذلك تلقائيًا عبر الصعود من مساحة العمل إلى أعلى.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة السماح الافتراضية الاختيارية للمهارات للوكلاء الذين لا يضبطون
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

- احذف `agents.defaults.skills` لإتاحة المهارات دون قيود افتراضيًا.
- احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
- اضبط `agents.list[].skills: []` لعدم إتاحة أي مهارات.
- تكون قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛ ولا
  تُدمج مع الإعدادات الافتراضية.

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

يتحكم في وقت حقن ملفات تمهيد مساحة العمل في مطالبة النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد اكتمال استجابة المساعد) إعادة حقن تمهيد مساحة العمل، مما يقلل حجم المطالبة. لا تزال عمليات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: يعطّل تمهيد مساحة العمل وحقن ملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يمتلكون دورة حياة مطالباتهم بالكامل (محركات سياق مخصصة، أو أوقات تشغيل أصلية تبني سياقها الخاص، أو سير عمل متخصصة دون تمهيد). تتخطى أدوار Heartbeat واسترداد Compaction الحقن أيضًا.

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

يتحكم في إشعار مطالبة النظام المرئي للوكيل عندما يُقتطع سياق التمهيد.
الافتراضي: `"once"`.

- `"off"`: لا يحقن نص إشعار الاقتطاع في مطالبة النظام أبدًا.
- `"once"`: يحقن إشعارًا موجزًا مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: يحقن إشعارًا موجزًا عند كل تشغيل عندما يوجد اقتطاع.

تبقى الأعداد الخام/المحقونة التفصيلية وحقول ضبط التهيئة في التشخيصات مثل
تقارير السياق/الحالة والسجلات؛ ولا يحصل سياق مستخدم/وقت تشغيل WebChat الروتيني إلا
على إشعار الاسترداد الموجز.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يمتلك OpenClaw عدة ميزانيات عالية الحجم للمطالبات/السياق، وهي
مقسمة عمدًا حسب النظام الفرعي بدلًا من تمريرها كلها عبر
مقبض عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن تمهيد مساحة العمل العادي.
- `agents.defaults.startupContext.*`:
  تمهيد تشغيل النموذج لمرة واحدة عند إعادة الضبط/بدء التشغيل، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة. تُقر أوامر الدردشة المجردة `/new` و`/reset`
  بإعادة الضبط دون استدعاء النموذج.
- `skills.limits.*`:
  قائمة المهارات المختصرة المحقونة في مطالبة النظام.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت التشغيل المحدودة والكتل المحقونة التي يملكها وقت التشغيل.
- `memory.qmd.limits.*`:
  مقتطف البحث في الذاكرة المفهرسة وحجم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل ما إلى ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء التشغيل للدور الأول المحقون عند تشغيلات النموذج الخاصة بإعادة الضبط/بدء التشغيل.
تقر أوامر الدردشة المجردة `/new` و`/reset` بإعادة الضبط دون استدعاء
النموذج، لذلك لا تُحمّل هذا التمهيد.

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
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ`memory_get` عندما يُحذف
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

الحد العام لقائمة المهارات المختصرة المحقونة في مطالبة النظام. هذا
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

تجاوز لكل وكيل لميزانية مطالبة المهارات.

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

الحد الأقصى لحجم البكسل لأطول ضلع في الصورة داخل كتل صور النص/الأداة قبل استدعاءات المزوّد.
الافتراضي: `1200`.

تقلل القيم الأقل عادةً استخدام رموز الرؤية وحجم حمولة الطلب للتشغيلات كثيرة لقطات الشاشة.
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
  - يضبط شكل السلسلة النصية النموذج الأساسي فقط.
  - يضبط شكل الكائن النموذج الأساسي إضافة إلى نماذج تجاوز الفشل المرتبة.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` كإعداد نموذج الرؤية الخاص بها.
  - يُستخدم أيضًا كتوجيه احتياطي عندما يتعذر على النموذج المحدد/الافتراضي قبول إدخال الصور.
  - فضّل مراجع `provider/model` الصريحة. تُقبل المعرفات المجردة للتوافق؛ إذا طابق معرف مجرد إدخالًا واحدًا مهيأً وقادرًا على الصور في `models.providers.*.models`، فإن OpenClaw يؤهله إلى ذلك المزوّد. تتطلب المطابقات المهيأة الملتبسة بادئة مزوّد صريحة.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد صورًا.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لصور OpenAI، أو `openai/gpt-image-1.5` لإخراج OpenAI PNG/WebP بخلفية شفافة.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فهيّئ أيضًا مصادقة المزوّد المطابقة (مثل `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2` / `openai/gpt-image-1.5`، أو `FAL_KEY` لـ `fal/*`).
  - إذا أُغفل، فلا يزال بإمكان `image_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم مزوّدي توليد الصور المسجلين المتبقين بترتيب معرف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الموسيقى المشتركة والأداة المدمجة `music_generate`.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.6`.
  - إذا أُغفل، فلا يزال بإمكان `music_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم مزوّدي توليد الموسيقى المسجلين المتبقين بترتيب معرف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فهيّئ أيضًا مصادقة المزوّد/مفتاح API المطابق.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الفيديو المشتركة والأداة المدمجة `video_generate`.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا أُغفل، فلا يزال بإمكان `video_generate` استنتاج مزوّد افتراضي مدعوم بالمصادقة. يجرّب المزوّد الافتراضي الحالي أولًا، ثم مزوّدي توليد الفيديو المسجلين المتبقين بترتيب معرف المزوّد.
  - إذا اخترت مزوّدًا/نموذجًا مباشرةً، فهيّئ أيضًا مصادقة المزوّد/مفتاح API المطابق.
  - يدعم مزوّد توليد الفيديو Qwen المضمّن ما يصل إلى فيديو إخراج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد وهي `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا أُغفل، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي المحلول.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يراعيها وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: مستوى الإسهاب الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"full"`. الافتراضي: `"off"`.
- `toolProgressDetail`: وضع التفصيل لملخصات أدوات `/verbose` وأسطر أدوات مسودة التقدم. القيم: `"explain"` (الافتراضي، تسميات بشرية موجزة) أو `"raw"` (إلحاق الأمر/التفاصيل الخام عند توفرها). يتجاوز `agents.list[].toolProgressDetail` الخاص بكل وكيل هذا الافتراضي.
- `reasoningDefault`: ظهور الاستدلال الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"stream"`. يتجاوز `agents.list[].reasoningDefault` الخاص بكل وكيل هذا الافتراضي. لا تُطبق افتراضيات الاستدلال المهيأة إلا للمالكين، أو المرسلين المصرح لهم، أو سياقات Gateway لمسؤول المشغّل عندما لا يكون هناك تجاوز استدلال لكل رسالة أو جلسة.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"`، `"on"`، `"ask"`، `"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` (مثل `openai/gpt-5.5` للوصول عبر مفتاح API لـ OpenAI أو Codex OAuth). إذا أغفلت المزوّد، يجرّب OpenClaw اسمًا مستعارًا أولًا، ثم مطابقة مزوّد مهيأ فريدة لمعرف النموذج المطابق تمامًا، وبعدها فقط يعود إلى المزوّد الافتراضي المهيأ (سلوك توافق مهجور، لذا فضّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يعرّض النموذج الافتراضي المهيأ، يعود OpenClaw إلى أول مزوّد/نموذج مهيأ بدلًا من إظهار افتراضي قديم لمزوّد مُزال.
- `models`: كتالوج النماذج المهيأ وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m` و`responsesServerCompaction` و`responsesCompactThreshold` و`chat_template_kwargs` و`extra_body`/`extraBody`).
  - استخدم إدخالات `provider/*` مثل `"openai-codex/*": {}` أو `"vllm/*": {}` لإظهار كل النماذج المكتشفة للمزوّدين المحددين دون إدراج كل معرف نموذج يدويًا.
  - التعديلات الآمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات قائمة السماح الحالية ما لم تمرر `--replace`.
  - تدمج تدفقات التهيئة/الإعداد المحددة النطاق بالمزوّد نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين غير المرتبطين المهيأين مسبقًا.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، تُفعّل Compaction من جهة الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز الحد. راجع [Compaction من جهة خادم OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (الإعداد): يتجاوز `agents.defaults.models["provider/model"].params` (لكل نموذج) `agents.defaults.params` (الأساس العام)، ثم يتجاوز `agents.list[].params` (لمعرف الوكيل المطابق) حسب المفتاح. راجع [التخزين المؤقت للمطالبات](/ar/reference/prompt-caching) للتفاصيل.
- `params.extra_body`/`params.extraBody`: JSON تمرير متقدم يُدمج في أجسام طلبات `api: "openai-completions"` للوكلاء المتوافقين مع OpenAI. إذا تعارض مع مفاتيح الطلب المولدة، يفوز الجسم الإضافي؛ ولا تزال مسارات completions غير الأصلية تزيل `store` الخاص بـ OpenAI فقط بعد ذلك.
- `params.chat_template_kwargs`: وسيطات قالب المحادثة المتوافقة مع vLLM/OpenAI تُدمج في المستوى الأعلى لأجسام طلبات `api: "openai-completions"`. بالنسبة إلى `vllm/nemotron-3-*` مع إيقاف التفكير، يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true`؛ وتتجاوز `chat_template_kwargs` الصريحة الافتراضيات المولدة، ولا يزال لـ `extra_body.chat_template_kwargs` الأسبقية النهائية. لعناصر التحكم في تفكير vLLM Qwen، اضبط `params.qwenThinkingFormat` إلى `"chat-template"` أو `"top-level"` على إدخال ذلك النموذج.
- `compat.thinkingFormat`: نمط حمولة التفكير المتوافق مع OpenAI. استخدم `"qwen"` لـ `enable_thinking` بالمستوى الأعلى بأسلوب Qwen، أو `"qwen-chat-template"` لـ `chat_template_kwargs.enable_thinking` على خلفيات عائلة Qwen التي تدعم kwargs لقالب المحادثة على مستوى الطلب، مثل vLLM. يعيّن OpenClaw التفكير المعطل إلى `false` والتفكير المفعّل إلى `true`.
- `compat.supportedReasoningEfforts`: قائمة جهود الاستدلال المتوافقة مع OpenAI لكل نموذج. أدرج `"xhigh"` للنقاط النهائية المخصصة التي تقبلها فعلًا؛ عندها يعرّض OpenClaw `/think xhigh` في قوائم الأوامر، وصفوف جلسات Gateway، والتحقق من ترقيع الجلسات، والتحقق من CLI للوكلاء، والتحقق من `llm-task` لذلك المزوّد/النموذج المهيأ. استخدم `compat.reasoningEffortMap` عندما تريد الخلفية قيمة خاصة بالمزوّد لمستوى قياسي.
- `params.preserveThinking`: اشتراك خاص بـ Z.AI للتفكير المحفوظ. عند تفعيله وتشغيل التفكير، يرسل OpenClaw `thinking.clear_thinking: false` ويعيد تشغيل `reasoning_content` السابق؛ راجع [تفكير Z.AI والتفكير المحفوظ](/ar/providers/zai#thinking-and-preserved-thinking).
- `localService`: مدير عمليات اختياري على مستوى المزوّد لخوادم النماذج المحلية/ذاتية الاستضافة. عندما ينتمي النموذج المحدد إلى ذلك المزوّد، يفحص OpenClaw `healthUrl` (أو `baseUrl + "/models"`)، ويبدأ `command` مع `args` إذا كانت نقطة النهاية متوقفة، وينتظر حتى `readyTimeoutMs`، ثم يرسل طلب النموذج. يجب أن يكون `command` مسارًا مطلقًا. يُبقي `idleStopMs: 0` العملية حية إلى أن يخرج OpenClaw؛ وتوقف القيمة الموجبة العملية التي أنشأها OpenClaw بعد ذلك العدد من ميلي ثانية الخمول. راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- تنتمي سياسة وقت التشغيل إلى المزوّدين أو النماذج، لا إلى `agents.defaults`. استخدم `models.providers.<provider>.agentRuntime` للقواعد على مستوى المزوّد أو `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` للقواعد الخاصة بالنموذج. تختار نماذج وكيل OpenAI على مزوّد OpenAI الرسمي Codex افتراضيًا.
- تحفظ كاتبات الإعداد التي تعدّل هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطي) شكل الكائن القياسي وتحافظ على قوائم الاحتياطي الحالية عند الإمكان.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكلاء المتوازية عبر الجلسات (تظل كل جلسة متسلسلة). الافتراضي: 4.

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

- `id`: `"auto"`، أو `"pi"`، أو معرف عدة Plugin مسجل، أو اسم مستعار مدعوم لخلفية CLI. يسجل Plugin Codex المضمّن `codex`؛ ويوفر Plugin Anthropic المضمّن خلفية CLI باسم `claude-cli`.
- يتيح `id: "auto"` لعدد Plugin المسجلة المطالبة بالدورات المدعومة ويستخدم PI عندما لا تطابق أي عدة. يتطلب وقت تشغيل Plugin صريح مثل `id: "codex"` تلك العدة ويفشل بإغلاق إذا لم تكن متاحة أو فشلت.
- مفاتيح وقت التشغيل على مستوى الوكيل الكامل قديمة. يتم تجاهل `agents.defaults.agentRuntime` و`agents.list[].agentRuntime` ودبابيس وقت تشغيل الجلسة و`OPENCLAW_AGENT_RUNTIME` عند اختيار وقت التشغيل. شغّل `openclaw doctor --fix` لإزالة القيم القديمة.
- تستخدم نماذج وكيل OpenAI عدة Codex افتراضيًا؛ ويظل `agentRuntime.id: "codex"` على مستوى المزوّد/النموذج صالحًا عندما تريد جعل ذلك صريحًا.
- بالنسبة إلى عمليات نشر Claude CLI، فضّل `model: "anthropic/claude-opus-4-7"` مع `agentRuntime.id: "claude-cli"` محدد النطاق بالنموذج. لا تزال مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل للتوافق، لكن ينبغي للإعداد الجديد إبقاء اختيار المزوّد/النموذج قياسيًا ووضع خلفية التنفيذ في سياسة وقت تشغيل المزوّد/النموذج.
- يتحكم هذا فقط في تنفيذ دور وكيل النص. لا يزال توليد الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المدمجة** (لا تنطبق إلا عندما يكون النموذج في `agents.defaults.models`):

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

الأسماء المستعارة التي ضبطتها لها الأولوية دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI الخيار `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضيًا عند عدم تعيين مستوى تفكير صريح.

### `agents.defaults.cliBackends`

خلفيات CLI اختيارية لتشغيلات fallback النصية فقط (بلا استدعاءات أدوات). مفيدة كنسخة احتياطية عند فشل مزوّدي API.

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

- خلفيات CLI مهيأة للنص أولًا؛ وتكون الأدوات معطّلة دائمًا.
- الجلسات مدعومة عند تعيين `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.
- يتيح `reseedFromRawTranscriptWhenUncompacted: true` للخلفية استرداد الجلسات الآمنة
  غير الصالحة من ذيل محدود لنص OpenClaw الخام قبل وجود أول ملخص Compaction.
  لا تُعاد البذرة الخام مطلقًا عند تغيّر ملف تعريف المصادقة أو حقبة بيانات الاعتماد.

### `agents.defaults.systemPromptOverride`

استبدل مطالبة النظام التي جمّعها OpenClaw بالكامل بسلسلة ثابتة. اضبطها على مستوى القيم الافتراضية (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). لقيم كل وكيل أولوية؛ ويتم تجاهل القيمة الفارغة أو المكوّنة من مسافات فقط. مفيد لتجارب المطالبات المضبوطة.

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

طبقات مطالبة مستقلة عن المزوّد تُطبّق حسب عائلة النموذج. تتلقى معرفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر المزوّدين؛ يتحكم `personality` فقط في طبقة أسلوب التفاعل الودود.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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
- `includeSystemPromptSection`: عند false، يحذف قسم Heartbeat من مطالبة النظام ويتجاوز حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند true، يكتم حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل Heartbeat قبل إجهاضه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/DM. تسمح `allow` (الافتراضية) بالتسليم إلى الهدف المباشر. تمنع `block` التسليم إلى الهدف المباشر وتصدر `reason=dm-blocked`.
- `lightContext`: عند true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap في مساحة العمل.
- `isolatedSession`: عند true، يعمل كل Heartbeat في جلسة جديدة بلا سجل محادثة سابق. نفس نمط العزل مثل `sessionTarget: "isolated"` في cron. يقلل تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- `skipWhenBusy`: عند true، تؤجل تشغيلات Heartbeat عند وجود مسارات انشغال إضافية لذلك الوكيل: وكيله الفرعي ذي مفتاح الجلسة أو عمل الأوامر المتداخلة. تؤجل مسارات Cron تشغيلات Heartbeat دائمًا، حتى من دون هذا العلم.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، **تعمل تلك الوكلاء فقط** على تشغيل Heartbeat.
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
- `provider`: معرّف Plugin مزوّد Compaction مسجّل. عند تعيينه، يُستدعى `summarize()` الخاص بالمزوّد بدل تلخيص LLM المضمّن. يعود إلى المضمّن عند الفشل. يفرض تعيين مزوّد `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يجهضها OpenClaw. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة القطع في Pi للاحتفاظ بذيل النص الأحدث حرفيًا. يلتزم `/compact` اليدوي بهذا عند تعيينه صراحة؛ وإلا يكون Compaction اليدوي نقطة فحص صارمة.
- `identifierPolicy`: `strict` (الافتراضي)، أو `off`، أو `custom`. يضيف `strict` إرشادات الاحتفاظ بالمعرّفات المعتمة المضمّنة في البداية أثناء تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند إخراج سيئ التنسيق لملخصات safeguard. مفعّلة افتراضيًا في وضع safeguard؛ اضبط `enabled: false` لتجاوز التدقيق.
- `midTurnPrecheck`: فحص اختياري لضغط حلقة أدوات Pi. عندما يكون `enabled: true`، يتحقق OpenClaw من ضغط السياق بعد إلحاق نتائج الأدوات وقبل استدعاء النموذج التالي. إذا لم يعد السياق مناسبًا، فإنه يجهض المحاولة الحالية قبل إرسال المطالبة ويعيد استخدام مسار الاسترداد الحالي لفحص ما قبل التشغيل لاقتطاع نتائج الأدوات أو إجراء Compaction وإعادة المحاولة. يعمل مع وضعي Compaction `default` و`safeguard`. الافتراضي: معطّل.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من AGENTS.md لإعادة حقنها بعد Compaction. الافتراضي هو `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. عند عدم التعيين أو عند تعيين زوج القيم الافتراضية هذا صراحة، تُقبل أيضًا عناوين `Every Session`/`Safety` القديمة كخيار توافق قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدمه عندما ينبغي للجلسة الرئيسية الاحتفاظ بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم تعيينه، يستخدم Compaction النموذج الأساسي للجلسة.
- `maxActiveTranscriptBytes`: عتبة بايت اختيارية (`number` أو سلاسل مثل `"20mb"`) تؤدي إلى Compaction محلي عادي قبل التشغيل عندما يتجاوز JSONL النشط العتبة. تتطلب `truncateAfterCompaction` كي يتمكن Compaction الناجح من التدوير إلى نص لاحق أصغر. معطّلة عند عدم التعيين أو عند `0`.
- `notifyUser`: عند `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (على سبيل المثال، "جارٍ ضغط السياق..." و"اكتمل Compaction"). معطّل افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. اضبط `model` على مزوّد/نموذج دقيق مثل `ollama/qwen3:8b` عندما ينبغي أن يبقى دور الصيانة هذا على نموذج محلي؛ لا يرث التجاوز سلسلة fallback للجلسة النشطة. يُتجاوز عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.runRetries`

حدود تكرار إعادة المحاولة لحلقة التشغيل الخارجية لمشغّل Pi المضمّن لمنع حلقات التنفيذ اللانهائية أثناء استرداد الفشل. لاحظ أن هذا الإعداد ينطبق حاليًا فقط على وقت تشغيل الوكيل المضمّن، وليس أوقات تشغيل ACP أو CLI.

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
- `perProfile`: تكرارات إعادة محاولة تشغيل إضافية تُمنح لكل مرشح ملف تعريف fallback. الافتراضي: `8`.
- `min`: الحد الأدنى المطلق لتكرارات إعادة محاولة التشغيل. الافتراضي: `32`.
- `max`: الحد الأقصى المطلق لتكرارات إعادة محاولة التشغيل لمنع التنفيذ المنفلت. الافتراضي: `160`.

### `agents.defaults.contextPruning`

يزيل **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل إرساله إلى LLM. لا يعدّل سجل الجلسة على القرص.

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

- يفعّل `mode: "cache-ttl"` تمريرات التقليم.
- يتحكم `ttl` في عدد مرات إمكانية تشغيل التقليم مرة أخرى (بعد آخر لمس للتخزين المؤقت).
- يقلّم التقليم نتائج الأدوات كبيرة الحجم تقليمًا خفيفًا أولًا، ثم يمسح نتائج الأدوات الأقدم مسحًا كاملًا عند الحاجة.

**التقليم الخفيف** يحتفظ بالبداية + النهاية ويدرج `...` في الوسط.

**المسح الكامل** يستبدل نتيجة الأداة بأكملها بالعنصر النائب.

ملاحظات:

- لا يتم تقليم/مسح كتل الصور أبدًا.
- النسب مبنية على الأحرف (تقريبية)، وليست أعداد رموز دقيقة.
- إذا وُجدت رسائل مساعد أقل من `keepLastAssistants`، يتم تخطي التقليم.

</Accordion>

راجع [تقليم الجلسة](/ar/concepts/session-pruning) للاطلاع على تفاصيل السلوك.

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
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (والصيغ الخاصة بكل حساب). القيمة الافتراضية في Signal/Slack/Discord/Google Chat هي `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين ردود الكتل. `natural` = 800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [البث](/ar/concepts/streaming) للاطلاع على تفاصيل السلوك + التقسيم إلى أجزاء.

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

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (افتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل حسب النطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يحولها OpenClaw إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح ضبط سياسة مفاتيح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- يتقدم `identityData` على `identityFile`
- يتقدم `certificateData` على `certificateFile`
- يتقدم `knownHostsData` على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة العزل

**سلوك خلفية SSH:**

- تهيئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تُبقي مساحة عمل SSH البعيدة هي المرجع المعتمد
- تمرر `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيًا
- لا تدعم حاويات متصفح العزل

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل عزل حسب النطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل العزل عند `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (افتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (بلا عزل بين الجلسات)

**إعداد Plugin الخاص بـ OpenShell:**

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

- `mirror`: تهيئة البعيد من المحلي قبل exec، ثم المزامنة مرة أخرى بعد exec؛ تظل مساحة العمل المحلية هي المرجع المعتمد
- `remote`: تهيئة البعيد مرة واحدة عند إنشاء العزل، ثم إبقاء مساحة العمل البعيدة هي المرجع المعتمد

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw إلى العزل تلقائيًا بعد خطوة التهيئة.
النقل هو SSH إلى عزل OpenShell، لكن Plugin يملك دورة حياة العزل والمزامنة المرآتية الاختيارية.

يعمل **`setupCommand`** مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). يحتاج إلى خروج إلى الشبكة، وجذر قابل للكتابة، ومستخدم root.

**تكون الحاويات افتراضيًا على `network: "none"`** — اضبطها إلى `"bridge"` (أو شبكة جسر مخصصة) إذا كان الوكيل يحتاج إلى وصول خارجي.
يتم حظر `"host"`. يتم حظر `"container:<id>"` افتراضيًا ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (إجراء طارئ).

**المرفقات الواردة** تُجهَّز في `media/inbound/*` داخل مساحة العمل النشطة.

**`docker.binds`** يركّب أدلة مضيف إضافية؛ يتم دمج عمليات الربط العامة والخاصة بكل وكيل.

**متصفح معزول** (`sandbox.browser.enabled`): Chromium + CDP في حاوية. يتم حقن رابط noVNC في موجّه النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول مراقب noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw رابط رمز قصير العمر (بدلًا من كشف كلمة المرور في الرابط المشترك).

- يمنع `allowHostControl: false` (افتراضي) الجلسات المعزولة من استهداف متصفح المضيف.
- القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة جسر مخصصة). اضبطها إلى `bridge` فقط عندما تريد صراحةً اتصالًا عامًا عبر الجسر.
- يمكن لـ `cdpSourceRange` اختياريًا تقييد دخول CDP عند حافة الحاوية إلى نطاق CIDR (على سبيل المثال `172.21.0.1/32`).
- يركّب `sandbox.browser.binds` أدلة مضيف إضافية في حاوية متصفح العزل فقط. عند ضبطه (بما في ذلك `[]`)، يستبدل `docker.binds` لحاوية المتصفح.
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
  - يتم تفعيل `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    افتراضيًا، ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبط `0` لاستخدام حد العمليات
    الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تفعيل `noSandbox`.
  - الإعدادات الافتراضية هي خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع نقطة دخول مخصصة
    لتغيير الإعدادات الافتراضية للحاوية.

</Accordion>

عزل المتصفح و`sandbox.docker.binds` مخصصان لـ Docker فقط.

أنشئ الصور (من نسخة مصدرية محلية):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

بالنسبة إلى عمليات تثبيت npm من دون نسخة مصدرية محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) للاطلاع على أوامر `docker build` المضمنة.

### `agents.list` (تجاوزات لكل وكيل)

استخدم `agents.list[].tts` لمنح الوكيل موفر TTS أو صوتًا أو نموذجًا أو
نمطًا أو وضع TTS تلقائيًا خاصًا به. تُدمج كتلة الوكيل دمجًا عميقًا فوق
`messages.tts` العام، لذلك يمكن أن تبقى بيانات الاعتماد المشتركة في مكان واحد بينما
يتجاوز الوكلاء الفرديون فقط حقول الصوت أو الموفّر التي يحتاجون إليها. ينطبق تجاوز
الوكيل النشط على الردود المنطوقة التلقائية، و`/tts audio`، و`/tts status`، و
أداة الوكيل `tts`. راجع [تحويل النص إلى كلام](/ar/tools/tts#per-agent-voice-overrides)
للاطلاع على أمثلة الموفّرين والأسبقية.

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
- `default`: عند تعيين عدة قيم، تفوز الأولى (مع تسجيل تحذير). إذا لم تُعيّن أي قيمة، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: تضبط الصيغة النصية نموذجًا أساسيًا صارمًا لكل وكيل من دون رجوع احتياطي للنماذج؛ وصيغة الكائن `{ primary }` صارمة أيضًا ما لم تضف `fallbacks`. استخدم `{ primary, fallbacks: [...] }` لإدخال ذلك الوكيل في الرجوع الاحتياطي، أو `{ primary, fallbacks: [] }` لجعل السلوك الصارم صريحًا. لا تزال مهام Cron التي تتجاوز `primary` فقط ترث الرجوعات الاحتياطية الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات بث لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النماذج بالكامل.
- `tts`: تجاوزات اختيارية لتحويل النص إلى كلام لكل وكيل. تُدمج الكتلة دمجًا عميقًا فوق `messages.tts`، لذلك أبقِ بيانات اعتماد الموفّر المشتركة وسياسة الرجوع الاحتياطي في `messages.tts` واضبط هنا فقط القيم الخاصة بالشخصية مثل الموفّر أو الصوت أو النموذج أو النمط أو الوضع التلقائي.
- `skills`: قائمة سماح اختيارية للـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ تستبدل القائمة الصريحة الإعدادات الافتراضية بدلًا من دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عند عدم تعيين تجاوز لكل رسالة أو جلسة. يتحكم ملف تعريف الموفّر/النموذج المحدد في القيم الصالحة؛ بالنسبة إلى Google Gemini، تُبقي `adaptive` التفكير الديناميكي المملوك للموفّر (`thinkingLevel` محذوفة في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: رؤية الاستدلال الافتراضية الاختيارية لكل وكيل (`on | off | stream`). تتجاوز `agents.defaults.reasoningDefault` لهذا الوكيل عند عدم تعيين تجاوز استدلال لكل رسالة أو جلسة.
- `fastModeDefault`: القيمة الافتراضية الاختيارية لكل وكيل للوضع السريع (`true | false`). تنطبق عند عدم تعيين تجاوز للوضع السريع لكل رسالة أو جلسة.
- `models`: تجاوزات اختيارية لكتالوج النماذج/وقت التشغيل لكل وكيل، مفهرسة بمعرّفات `provider/model` الكاملة. استخدم `models["provider/model"].agentRuntime` لاستثناءات وقت التشغيل لكل وكيل.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent`، و`backend`، و`mode`، و`cwd`) عندما يجب أن يكون الوكيل افتراضيًا على جلسات حزمة ACP.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو معرّف URI من نوع `data:`.
- تشتق `identity` الإعدادات الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لأهداف `sessions_spawn.agentId` الصريحة (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط). ضمّن معرّف الطالب عندما ينبغي السماح باستدعاءات `agentId` التي تستهدف الذات.
- حارس وراثة العزل: إذا كانت جلسة الطالب معزولة، يرفض `sessions_spawn` الأهداف التي ستعمل من دون عزل.
- `subagents.requireAgentId`: عندما تكون true، احظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

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

- `type` (اختياري): `route` للتوجيه العادي (النوع المحذوف يكون افتراضيًا route)، و`acp` لارتباطات محادثات ACP المستمرة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ محذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (دقيق، بلا peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل طبقة، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw وفق هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب طبقات ربط التوجيه أعلاه.

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

راجع [عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لتفاصيل الأسبقية.

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
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة ضمن سياق قناة.
  - `global`: يشارك جميع المشاركين في سياق قناة جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشارك جميع الرسائل المباشرة الجلسة الرئيسية.
  - `per-peer`: عزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: عزل حسب القناة + المرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: عزل حسب الحساب + القناة + المرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: يربط المعرّفات الأساسية بالأقران المسبوقين بمزوّد الخدمة لمشاركة الجلسات عبر القنوات. تستخدم أوامر الإرساء مثل `/dock_discord` الخريطة نفسها لتحويل مسار رد الجلسة النشطة إلى قرين قناة مرتبط آخر؛ راجع [إرساء القنوات](/ar/concepts/channel-docking).
- **`reset`**: سياسة إعادة الضبط الأساسية. يعيد `daily` الضبط عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` الضبط بعد `idleMinutes`. عند تكوين الاثنين معًا، يفوز أيهما ينتهي أولًا. تستخدم حداثة إعادة الضبط اليومية قيمة `sessionStartedAt` في صف الجلسة؛ وتستخدم حداثة إعادة الضبط بسبب الخمول `lastInteractionAt`. يمكن للكتابات الخلفية/أحداث النظام مثل Heartbeat، وتنبيهات Cron، وإشعارات التنفيذ، ومسك دفاتر Gateway أن تحدّث `updatedAt`، لكنها لا تُبقي جلسات إعادة الضبط اليومية/الخاملة حديثة.
- **`resetByType`**: تجاوزات حسب النوع (`direct`، `group`، `thread`). يُقبل `dm` القديم كاسم مستعار لـ `direct`.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لدورات الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`-`20`، الافتراضي: `5`). يعطّل `0` تسلسل الردود المتبادلة.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم المستعار القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. أول منع يفوز.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات والاحتفاظ.
  - `mode`: يصدر `warn` تحذيرات فقط؛ ويطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`). يكتب وقت التشغيل تنظيفًا دفعيًا مع مخزن حد أعلى صغير للحدود المناسبة للإنتاج؛ ويطبّق `openclaw sessions cleanup --enforce` الحد فورًا.
  - `rotateBytes`: مهمل ومتجاهل؛ يزيله `openclaw doctor --fix` من ملفات التكوين القديمة.
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النسخ النصية `*.reset.<timestamp>`. الإعداد الافتراضي هو `pruneAfter`؛ اضبطه على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. الإعداد الافتراضي هو `80%` من `maxDiskBytes`.
- **`threadBindings`**: الافتراضات العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين تجاوزه؛ يستخدم Discord `channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بعد عدم النشاط بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ يمكن للمزوّدين التجاوز)
  - `spawnSessions`: البوابة الافتراضية لإنشاء جلسات عمل مرتبطة بالسلاسل من `sessions_spawn` وتفريعات سلاسل ACP. الإعداد الافتراضي هو `true` عند تمكين روابط السلاسل؛ ويمكن للمزوّدين/الحسابات التجاوز.
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي الافتراضي لتفريعات السلاسل (`"fork"` أو `"isolated"`). الإعداد الافتراضي هو `"fork"`.

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

تجاوزات حسب القناة/الحساب: `channels.<channel>.responsePrefix`، و`channels.<channel>.accounts.<id>.responsePrefix`.

الحل (الأكثر تحديدًا يفوز): الحساب → القناة → عام. يعطّل `""` التسلسل ويوقفه. يشتق `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف            | مثال                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر       | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد          | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`، `low`، `off`        |
| `{identity.name}` | اسم هوية الوكيل    | (مثل `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. `{think}` هو اسم مستعار لـ `{thinkingLevel}`.

### تفاعل الإقرار

- الإعداد الافتراضي هو `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبطه على `""` للتعطيل.
- تجاوزات حسب القناة: `channels.<channel>.ackReaction`، و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → بديل الهوية.
- النطاق: `group-mentions` (الافتراضي)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: يزيل الإقرار بعد الرد على القنوات التي تدعم التفاعلات مثل Slack وDiscord وTelegram وWhatsApp وiMessage.
- `messages.statusReactions.enabled`: يفعّل تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  على Slack وDiscord، يؤدي عدم الضبط إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  على Telegram، اضبطه صراحةً على `true` لتمكين تفاعلات حالة دورة الحياة.

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
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للملخص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك اختياري).
- تعود مفاتيح API احتياطيًا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- مزوّدو الكلام المضمّنون مملوكون لـ Plugin. إذا تم ضبط `plugins.allow`، فأدرج كل Plugin لمزوّد TTS تريد استخدامه، مثل `microsoft` لـ Edge TTS. يُقبل معرّف المزوّد القديم `edge` كاسم مستعار لـ `microsoft`.
- يتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو التكوين، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `providers.openai.baseUrl` إلى نقطة نهاية غير تابعة لـ OpenAI، يتعامل OpenClaw معها كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تكوين عدة مزوّدي Talk.
- مفاتيح Talk المسطحة القديمة (`talk.voiceId`، و`talk.voiceAliases`، و`talk.modelId`، و`talk.outputFormat`، و`talk.apiKey`) مخصصة للتوافق فقط. شغّل `openclaw doctor --fix` لإعادة كتابة التكوين المحفوظ إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت احتياطيًا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- ينطبق بديل `ELEVENLABS_API_KEY` فقط عندما لا يكون أي مفتاح Talk API مكوّنًا.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء مألوفة.
- يختار `providers.mlx.modelId` مستودع Hugging Face الذي يستخدمه مساعد MLX المحلي على macOS. إذا حُذف، يستخدم macOS `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS من خلال مساعد `openclaw-mlx-tts` المضمّن عند وجوده، أو ملف تنفيذي على `PATH`؛ ويتجاوز `OPENCLAW_MLX_TTS_BIN` مسار المساعد للتطوير.
- يتحكم `consultThinkingLevel` في مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات `openclaw_agent_consult` الآنية في Control UI Talk. اتركه غير مضبوط للحفاظ على سلوك الجلسة/النموذج العادي.
- يضبط `consultFastMode` تجاوزًا لمرة واحدة لوضع السرعة لاستشارات Control UI Talk الآنية دون تغيير إعداد وضع السرعة العادي للجلسة.
- يضبط `speechLocale` معرّف لغة BCP 47 المستخدم بواسطة تعرف الكلام في Talk على iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- يتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع Talk بعد صمت المستخدم قبل إرسال النسخة النصية. عدم ضبطه يُبقي نافذة التوقف الافتراضية للمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).
- يضيف `realtime.instructions` تعليمات نظام موجهة للمزوّد إلى الموجّه الآني المضمّن في OpenClaw، بحيث يمكن تكوين نمط الصوت دون فقدان إرشادات `openclaw_agent_consult` الافتراضية.

---

## ذات صلة

- [مرجع التكوين](/ar/gateway/configuration-reference) — جميع مفاتيح التكوين الأخرى
- [التكوين](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة التكوين](/ar/gateway/configuration-examples)
