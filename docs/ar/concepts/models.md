---
read_when:
    - إضافة CLI النماذج أو تعديله (`models list`/`set`/`scan`/`aliases`/`fallbacks`)
    - تغيير سلوك الرجوع الاحتياطي للنموذج أو تجربة اختيار المستخدم
    - تحديث مجسات فحص النموذج (الأدوات/الصور)
summary: 'CLI الخاص بالنماذج: العرض، والضبط، والأسماء المستعارة، وعمليات الرجوع الاحتياطي، والفحص، والحالة'
title: CLI النماذج
x-i18n:
    generated_at: "2026-04-24T07:38:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

راجع [/concepts/model-failover](/ar/concepts/model-failover) لمعرفة تدوير ملفات تعريف
المصادقة، وفترات التهدئة، وكيف يتفاعل ذلك مع عمليات الرجوع الاحتياطي.
نظرة سريعة على المزوّدين + أمثلة: [/concepts/model-providers](/ar/concepts/model-providers).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

1. النموذج **الأساسي** (`agents.defaults.model.primary` أو `agents.defaults.model`).
2. **عمليات الرجوع الاحتياطي** في `agents.defaults.model.fallbacks` (بالترتيب).
3. يحدث **الرجوع الاحتياطي لمصادقة المزوّد** داخل المزوّد قبل الانتقال إلى
   النموذج التالي.

ذو صلة:

- يمثّل `agents.defaults.models` قائمة السماح/كتالوج النماذج التي يمكن لـ OpenClaw استخدامها (بالإضافة إلى الأسماء المستعارة).
- يُستخدم `agents.defaults.imageModel` **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
- يُستخدم `agents.defaults.pdfModel` بواسطة أداة `pdf`. وإذا لم يُضبط، فإن الأداة
  تعود احتياطيًا إلى `agents.defaults.imageModel`، ثم إلى
  النموذج الافتراضي/نموذج الجلسة المحلول.
- يُستخدم `agents.defaults.imageGenerationModel` بواسطة قدرة توليد الصور المشتركة. وإذا لم يُضبط، فما زال بإمكان `image_generate` استنتاج قيمة افتراضية لمزوّد مدعوم بالمصادقة. وهو يجرّب أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الصور المسجلين وفق ترتيب معرّفات المزوّدين. وإذا ضبطت مزودًا/نموذجًا محددًا، فقم أيضًا بتهيئة المصادقة/مفتاح API الخاص بذلك المزوّد.
- يُستخدم `agents.defaults.musicGenerationModel` بواسطة قدرة توليد الموسيقى المشتركة. وإذا لم يُضبط، فما زال بإمكان `music_generate` استنتاج قيمة افتراضية لمزوّد مدعوم بالمصادقة. وهو يجرّب أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الموسيقى المسجلين وفق ترتيب معرّفات المزوّدين. وإذا ضبطت مزودًا/نموذجًا محددًا، فقم أيضًا بتهيئة المصادقة/مفتاح API الخاص بذلك المزوّد.
- يُستخدم `agents.defaults.videoGenerationModel` بواسطة قدرة توليد الفيديو المشتركة. وإذا لم يُضبط، فما زال بإمكان `video_generate` استنتاج قيمة افتراضية لمزوّد مدعوم بالمصادقة. وهو يجرّب أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الفيديو المسجلين وفق ترتيب معرّفات المزوّدين. وإذا ضبطت مزودًا/نموذجًا محددًا، فقم أيضًا بتهيئة المصادقة/مفتاح API الخاص بذلك المزوّد.
- يمكن للقيم الافتراضية لكل وكيل تجاوز `agents.defaults.model` عبر `agents.list[].model` بالإضافة إلى الروابط (راجع [/concepts/multi-agent](/ar/concepts/multi-agent)).

## سياسة سريعة للنماذج

- اضبط نموذجك الأساسي على أقوى نموذج متاح لك من الجيل الأحدث.
- استخدم عمليات الرجوع الاحتياطي للمهام الحساسة من حيث التكلفة/الكمون وللدردشة الأقل أهمية.
- بالنسبة إلى الوكلاء المفعّلة لديهم الأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا كنت لا تريد تعديل التهيئة يدويًا، فشغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة لمزوّدين شائعين، بما في ذلك **اشتراك OpenAI Code (Codex)**
‏(OAuth) و**Anthropic** ‏(مفتاح API أو Claude CLI).

## مفاتيح التهيئة (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` ‏(قائمة السماح + الأسماء المستعارة + معلمات المزوّد)
- `models.providers` ‏(مزوّدون مخصصون يُكتبون في `models.json`)

تُطبَّع مراجع النماذج إلى أحرف صغيرة. كما تُطبَّع الأسماء المستعارة للمزوّدين مثل `z.ai/*`
إلى `zai/*`.

توجد أمثلة تهيئة المزوّدين (بما في ذلك OpenCode) في
[/providers/opencode](/ar/providers/opencode).

### تعديلات آمنة على قائمة السماح

استخدم كتابات إضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

يحمي `openclaw config set` خرائط النماذج/المزوّدين من الطمس العرضي. إذ
يُرفض إسناد كائن عادي إلى `agents.defaults.models` أو `models.providers` أو
`models.providers.<id>.models` عندما قد يزيل إدخالات موجودة.
استخدم `--merge` للتغييرات الإضافية؛ واستخدم `--replace` فقط عندما
يجب أن تصبح القيمة المقدمة هي القيمة الكاملة للهدف.

كما يقوم إعداد المزوّد التفاعلي و`openclaw configure --section model` بدمج
التحديدات الخاصة بنطاق المزوّد في قائمة السماح الموجودة، بحيث لا يؤدي إضافة Codex
أو Ollama أو مزوّد آخر إلى إسقاط إدخالات نماذج غير مرتبطة.

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا كان `agents.defaults.models` مضبوطًا، فإنه يصبح **قائمة السماح** لأمر `/model` ولـ
تجاوزات الجلسة. وعندما يختار المستخدم نموذجًا غير موجود في قائمة السماح تلك،
فإن OpenClaw يعيد:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

يحدث هذا **قبل** إنشاء رد عادي، لذلك قد يبدو وكأن الرسالة "لم تتلقَّ ردًا".
والحل هو أحد ما يلي:

- إضافة النموذج إلى `agents.defaults.models`, أو
- مسح قائمة السماح (إزالة `agents.defaults.models`), أو
- اختيار نموذج من `/model list`.

مثال على تهيئة قائمة السماح:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## تبديل النماذج في الدردشة (`/model`)

يمكنك تبديل النماذج للجلسة الحالية من دون إعادة التشغيل:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

ملاحظات:

- يُعد `/model` ‏(و`/model list`) أداة اختيار مدمجة ومرقمة (عائلة النموذج + المزوّدون المتاحون).
- في Discord، يفتح `/model` و`/models` أداة اختيار تفاعلية مع قوائم منسدلة للمزوّد والنموذج بالإضافة إلى خطوة Submit.
- يكون `/models add` متاحًا افتراضيًا ويمكن تعطيله عبر `commands.modelsWrite=false`.
- عند تفعيله، يكون `/models add <provider> <modelId>` هو المسار الأسرع؛ أما `/models add` وحده فيبدأ تدفقًا موجّهًا يبدأ بالمزوّد حيثما كان ذلك مدعومًا.
- بعد `/models add`، يصبح النموذج الجديد متاحًا في `/models` و`/model` من دون إعادة تشغيل Gateway.
- يختار `/model <#>` من أداة الاختيار تلك.
- يحفظ `/model` تحديد الجلسة الجديد فورًا.
- إذا كان الوكيل في وضع الخمول، فإن التشغيل التالي يستخدم النموذج الجديد مباشرةً.
- إذا كان التشغيل نشطًا بالفعل، فإن OpenClaw يعلّم التبديل الحي على أنه معلّق ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كانت أنشطة الأدوات أو إخراج الرد قد بدأت بالفعل، فقد يبقى التبديل المعلّق في الانتظار حتى فرصة إعادة محاولة لاحقة أو حتى دورة المستخدم التالية.
- يُعد `/model status` العرض التفصيلي (مرشحو المصادقة، وعند تهيئته، `baseUrl` لنقطة نهاية المزوّد + وضع `api`).
- تُحلَّل مراجع النماذج عبر التقسيم عند **أول** `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
- إذا كان معرّف النموذج نفسه يحتوي على `/` ‏(نمط OpenRouter)، فيجب تضمين بادئة المزوّد (مثال: `/model openrouter/moonshotai/kimi-k2`).
- إذا حذفت المزوّد، فإن OpenClaw يحل الإدخال بهذا الترتيب:
  1. مطابقة الاسم المستعار
  2. مطابقة مزوّد مهيأ فريد لذلك المعرّف غير المسبوق ببادئة تحديدًا
  3. رجوع احتياطي قديم إلى المزوّد الافتراضي المهيأ
     إذا لم يعد ذلك المزوّد يكشف النموذج الافتراضي المهيأ، فإن OpenClaw
     يعود بدلًا من ذلك إلى أول مزوّد/نموذج مهيأ لتجنب
     إظهار افتراضي قديم لمزوّد تمت إزالته.

السلوك/التهيئة الكاملة للأمر: [أوامر الشرطة المائلة](/ar/tools/slash-commands).

أمثلة:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## أوامر CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

يُعد `openclaw models` ‏(من دون أمر فرعي) اختصارًا لـ `models status`.

### `models list`

يعرض النماذج المهيأة افتراضيًا. من العلامات المفيدة:

- `--all`: الكتالوج الكامل
- `--local`: المزوّدون المحليون فقط
- `--provider <id>`: التصفية حسب معرّف المزوّد، مثل `moonshot`; ولا تُقبل
  التسميات المعروضة من أدوات الاختيار التفاعلية
- `--plain`: نموذج واحد في كل سطر
- `--json`: مخرجات قابلة للقراءة الآلية

يتضمن `--all` صفوف الكتالوج الثابتة المملوكة للمزوّد والمضمّنة قبل
تهيئة المصادقة، لذا يمكن لعروض الاكتشاف فقط أن تُظهر نماذج غير متاحة
حتى تضيف بيانات اعتماد المزوّد المطابقة.

### `models status`

يعرض النموذج الأساسي المحلول، وعمليات الرجوع الاحتياطي، ونموذج الصور، ونظرة عامة على المصادقة
للمزوّدين المهيئين. كما يُظهر أيضًا حالة انتهاء صلاحية OAuth لملفات التعريف الموجودة
في مخزن المصادقة (يحذّر خلال 24 ساعة افتراضيًا). يطبع `--plain` فقط
النموذج الأساسي المحلول.
تُعرض حالة OAuth دائمًا (وتُدرج في مخرجات `--json`). وإذا لم تكن لدى
مزوّد مهيأ أي بيانات اعتماد، فإن `models status` يطبع قسم **Missing auth**.
يتضمن JSON كلًا من `auth.oauth` ‏(نافذة التحذير + ملفات التعريف) و`auth.providers`
‏(المصادقة الفعالة لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة بمتغيرات البيئة). يمثّل `auth.oauth`
حالة ملفات تعريف مخزن المصادقة فقط؛ ولا تظهر المزوّدات المعتمدة على البيئة فقط هناك.
استخدم `--check` للأتمتة (رمز الخروج `1` عند الفقد/الانتهاء، و`2` عند قرب الانتهاء).
استخدم `--probe` لفحوصات المصادقة الحية؛ ويمكن أن تأتي صفوف المجسات من ملفات تعريف المصادقة أو
بيانات اعتماد البيئة أو `models.json`.
إذا حذفت `auth.order.<provider>` الصريحة ملف تعريف مخزنًا، فإن المجس يبلّغ
عن `excluded_by_auth_order` بدلًا من محاولة استخدامه. وإذا كانت المصادقة موجودة لكن لا يمكن حل أي نموذج قابل للفحص لذلك المزوّد، فإن المجس يبلّغ `status: no_model`.

يعتمد اختيار المصادقة على المزوّد/الحساب. وبالنسبة إلى مضيفات Gateway العاملة دائمًا، تكون مفاتيح API عادةً الأكثر قابلية للتنبؤ؛ كما أن إعادة استخدام Claude CLI وملفات تعريف OAuth/token الموجودة لـ Anthropic
مدعومة أيضًا.

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (نماذج OpenRouter المجانية)

يفحص `openclaw models scan` **كتالوج النماذج المجانية** في OpenRouter ويمكنه
اختياريًا إجراء مجسات للنماذج لمعرفة دعم الأدوات والصور.

العلامات الرئيسية:

- `--no-probe`: تخطّي المجسات الحية (بيانات وصفية فقط)
- `--min-params <b>`: الحد الأدنى لحجم المعلمات (بالمليارات)
- `--max-age-days <days>`: تخطّي النماذج الأقدم
- `--provider <name>`: مرشح بادئة المزوّد
- `--max-candidates <n>`: حجم قائمة الرجوع الاحتياطي
- `--set-default`: ضبط `agents.defaults.model.primary` على أول تحديد
- `--set-image`: ضبط `agents.defaults.imageModel.primary` على أول تحديد للصور

يتطلب الفحص مفتاح API لـ OpenRouter ‏(من ملفات تعريف المصادقة أو
`OPENROUTER_API_KEY`). ومن دون مفتاح، استخدم `--no-probe` لعرض المرشحين فقط.

تُرتّب نتائج الفحص وفق:

1. دعم الصور
2. كمون الأدوات
3. حجم السياق
4. عدد المعلمات

الإدخال

- قائمة OpenRouter ‏`/models` ‏(مرشح `:free`)
- يتطلب مفتاح API لـ OpenRouter من ملفات تعريف المصادقة أو `OPENROUTER_API_KEY` ‏(راجع [/environment](/ar/help/environment))
- مرشحات اختيارية: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- عناصر تحكم المجسات: `--timeout`, `--concurrency`

عند التشغيل داخل TTY، يمكنك اختيار عمليات الرجوع الاحتياطي تفاعليًا. وفي الوضع غير التفاعلي،
مرّر `--yes` لقبول القيم الافتراضية.

## سجل النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن
دليل الوكيل (الافتراضي `~/.openclaw/agents/<agentId>/agent/models.json`). ويُدمج هذا الملف
افتراضيًا ما لم يُضبط `models.mode` على `replace`.

أسبقية وضع الدمج لمعرّفات المزوّد المطابقة:

- تكون قيمة `baseUrl` غير الفارغة الموجودة مسبقًا في `models.json` الخاص بالوكيل هي الغالبة.
- تكون قيمة `apiKey` غير الفارغة في `models.json` الخاص بالوكيل هي الغالبة فقط عندما لا يكون ذلك المزوّد مُدارًا عبر SecretRef في سياق التهيئة/ملف تعريف المصادقة الحالي.
- تُحدَّث قيم `apiKey` الخاصة بالمزوّد المُدار عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec) بدلًا من حفظ الأسرار المحلولة.
- تُحدَّث قيم ترويسات المزوّد المُدار عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec).
- تعود القيم الفارغة أو المفقودة لـ `apiKey`/`baseUrl` الخاصة بالوكيل إلى `models.providers` في التهيئة.
- تُحدَّث حقول المزوّد الأخرى من التهيئة وبيانات الكتالوج المطبّعة.

ويكون حفظ العلامات معتمدًا على المصدر: يكتب OpenClaw العلامات من لقطة تهيئة المصدر النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة وقت التشغيل.
وينطبق هذا كلما أعاد OpenClaw توليد `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.

## ذو صلة

- [مزوّدو النماذج](/ar/concepts/model-providers) — توجيه المزوّد والمصادقة
- [الرجوع الاحتياطي للنموذج](/ar/concepts/model-failover) — سلاسل الرجوع الاحتياطي
- [توليد الصور](/ar/tools/image-generation) — تهيئة نموذج الصور
- [توليد الموسيقى](/ar/tools/music-generation) — تهيئة نموذج الموسيقى
- [توليد الفيديو](/ar/tools/video-generation) — تهيئة نموذج الفيديو
- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults) — مفاتيح تهيئة النموذج
