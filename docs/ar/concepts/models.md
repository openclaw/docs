---
read_when:
    - إضافة أو تعديل CLI النماذج (models list/set/scan/aliases/fallbacks)
    - تغيير سلوك الرجوع الاحتياطي للنموذج أو تجربة مستخدم الاختيار
    - تحديث مسبارات فحص النماذج (الأدوات/الصور)
sidebarTitle: Models CLI
summary: 'CLI للنماذج: السرد، التعيين، الأسماء المستعارة، البدائل الاحتياطية، الفحص، الحالة'
title: واجهة CLI للنماذج
x-i18n:
    generated_at: "2026-05-11T20:30:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 346f0edaf0d821bc8e65b73bf1d2385fb343c4b93127e6a20e9dd783c5138c52
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="تجاوز فشل النموذج" href="/ar/concepts/model-failover">
    تدوير ملفات تعريف المصادقة، وفترات التهدئة، وكيفية تفاعل ذلك مع البدائل.
  </Card>
  <Card title="موفرو النماذج" href="/ar/concepts/model-providers">
    نظرة عامة سريعة على الموفر وأمثلة.
  </Card>
  <Card title="تشغيلات الوكلاء" href="/ar/concepts/agent-runtimes">
    PI وCodex وتشغيلات حلقات الوكلاء الأخرى.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/config-agents#agent-defaults">
    مفاتيح تكوين النموذج.
  </Card>
</CardGroup>

تختار مراجع النماذج موفرًا ونموذجًا. وهي عادةً لا تختار تشغيل الوكيل منخفض المستوى. مراجع وكلاء OpenAI هي الاستثناء الرئيسي: يعمل `openai/gpt-5.5` عبر تشغيل خادم تطبيق Codex افتراضيًا على موفر OpenAI الرسمي. تنتمي تجاوزات التشغيل الصريحة إلى سياسة الموفر/النموذج، لا إلى الوكيل أو الجلسة بالكامل. في وضع تشغيل Codex، لا يعني مرجع `openai/gpt-*` الفوترة عبر مفتاح API؛ يمكن أن تأتي المصادقة من حساب Codex أو ملف تعريف مصادقة `openai-codex`. راجع [تشغيلات الوكلاء](/ar/concepts/agent-runtimes).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

<Steps>
  <Step title="النموذج الأساسي">
    `agents.defaults.model.primary` (أو `agents.defaults.model`).
  </Step>
  <Step title="البدائل">
    `agents.defaults.model.fallbacks` (بالترتيب).
  </Step>
  <Step title="تجاوز فشل مصادقة الموفر">
    يحدث تجاوز فشل المصادقة داخل الموفر قبل الانتقال إلى النموذج التالي.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="أسطح النماذج ذات الصلة">
    - `agents.defaults.models` هي قائمة السماح/فهرس النماذج التي يستطيع OpenClaw استخدامها (بالإضافة إلى الأسماء المستعارة). استخدم إدخالات `provider/*` لتقييد الموفرين المرئيين مع إبقاء اكتشاف الموفر ديناميكيًا.
    - يُستخدم `agents.defaults.imageModel` **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
    - يُستخدم `agents.defaults.pdfModel` بواسطة أداة `pdf`. إذا حُذف، تعود الأداة إلى `agents.defaults.imageModel`، ثم نموذج الجلسة/النموذج الافتراضي المحسوم.
    - يُستخدم `agents.defaults.imageGenerationModel` بواسطة قدرة توليد الصور المشتركة. إذا حُذف، يمكن لـ `image_generate` مع ذلك استنتاج افتراضي لموفر مدعوم بالمصادقة. يحاول الموفر الافتراضي الحالي أولًا، ثم بقية موفري توليد الصور المسجلين بترتيب معرّف الموفر. إذا عيّنت موفرًا/نموذجًا محددًا، فاضبط أيضًا مصادقة ذلك الموفر/مفتاح API الخاص به.
    - يُستخدم `agents.defaults.musicGenerationModel` بواسطة قدرة توليد الموسيقى المشتركة. إذا حُذف، يمكن لـ `music_generate` مع ذلك استنتاج افتراضي لموفر مدعوم بالمصادقة. يحاول الموفر الافتراضي الحالي أولًا، ثم بقية موفري توليد الموسيقى المسجلين بترتيب معرّف الموفر. إذا عيّنت موفرًا/نموذجًا محددًا، فاضبط أيضًا مصادقة ذلك الموفر/مفتاح API الخاص به.
    - يُستخدم `agents.defaults.videoGenerationModel` بواسطة قدرة توليد الفيديو المشتركة. إذا حُذف، يمكن لـ `video_generate` مع ذلك استنتاج افتراضي لموفر مدعوم بالمصادقة. يحاول الموفر الافتراضي الحالي أولًا، ثم بقية موفري توليد الفيديو المسجلين بترتيب معرّف الموفر. إذا عيّنت موفرًا/نموذجًا محددًا، فاضبط أيضًا مصادقة ذلك الموفر/مفتاح API الخاص به.
    - يمكن للافتراضيات الخاصة بكل وكيل تجاوز `agents.defaults.model` عبر `agents.list[].model` بالإضافة إلى الارتباطات (راجع [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## مصدر الاختيار وسلوك البدائل

يمكن أن يعني نفس `provider/model` أشياء مختلفة حسب مصدره:

- الافتراضيات المضبوطة (`agents.defaults.model.primary` والأساسيات الخاصة بالوكلاء) هي نقطة البداية المعتادة وتستخدم `agents.defaults.model.fallbacks`.
- اختيارات البديل التلقائي هي حالة استرداد مؤقتة. تُخزن مع `modelOverrideSource: "auto"` حتى تتمكن المنعطفات اللاحقة من متابعة استخدام سلسلة البدائل دون اختبار نموذج أساسي معروف التعطل أولًا.
- اختيارات جلسة المستخدم دقيقة. تخزن `/model`، ومنتقي النموذج، و`session_status(model=...)`، و`sessions.patch` القيمة `modelOverrideSource: "user"`؛ إذا تعذر الوصول إلى ذلك الموفر/النموذج المحدد، يفشل OpenClaw بشكل ظاهر بدلًا من الانتقال إلى نموذج آخر مضبوط.
- يُعد Cron `--model` / حمولة `model` نموذجًا أساسيًا لكل مهمة. ولا يزال يستخدم البدائل المضبوطة إلا إذا وفرت المهمة حمولة `fallbacks` صريحة (استخدم `fallbacks: []` لتشغيل cron صارم).
- تحترم منتقيات النموذج الافتراضي وقائمة السماح في CLI القيمة `models.mode: "replace"` عبر سرد `models.providers.*.models` الصريحة بدلًا من تحميل الفهرس المدمج الكامل.
- يطلب منتقي النماذج في واجهة التحكم من Gateway عرض النموذج المضبوط لديه: `agents.defaults.models` عند وجوده، بما في ذلك إدخالات `provider/*` على مستوى الموفر، وإلا `models.providers.*.models` الصريحة بالإضافة إلى الموفرين ذوي المصادقة القابلة للاستخدام. يُحجز الفهرس المدمج الكامل لعروض التصفح الصريحة مثل `models.list` مع `view: "all"` أو `openclaw models list --all`.

## سياسة نموذج سريعة

- اضبط النموذج الأساسي على أقوى نموذج من أحدث جيل متاح لك.
- استخدم البدائل للمهام الحساسة للتكلفة/زمن الاستجابة والمحادثات الأقل خطورة.
- بالنسبة إلى الوكلاء الممكّنين بالأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا لم ترغب في تعديل التكوين يدويًا، شغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة للموفرين الشائعين، بما في ذلك **اشتراك OpenAI Code (Codex)** ‏(OAuth) و**Anthropic** (مفتاح API أو Claude CLI).

## مفاتيح التكوين (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة السماح + الأسماء المستعارة + معاملات الموفر + إدخالات الموفر الديناميكية `provider/*`)
- `models.providers` (موفرون مخصصون مكتوبون في `models.json`)

<Note>
تُطبّع مراجع النماذج إلى الأحرف الصغيرة. تُطبّع الأسماء المستعارة للموفرين مثل `z.ai/*` إلى `zai/*`.

توجد أمثلة تكوين الموفرين (بما في ذلك OpenCode) في [OpenCode](/ar/providers/opencode).
</Note>

### تعديلات قائمة السماح الآمنة

استخدم الكتابات الإضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد الحماية من الاستبدال">
    يحمي `openclaw config set` خرائط النماذج/الموفرين من الاستبدال العرضي. يُرفض إسناد كائن عادي إلى `agents.defaults.models` أو `models.providers` أو `models.providers.<id>.models` عندما يؤدي إلى إزالة إدخالات موجودة. استخدم `--merge` للتغييرات الإضافية؛ استخدم `--replace` فقط عندما ينبغي أن تصبح القيمة المقدمة هي القيمة الهدف الكاملة.

    يدمج إعداد الموفر التفاعلي و`openclaw configure --section model` أيضًا الاختيارات ذات نطاق الموفر في قائمة السماح الموجودة، لذلك لا تؤدي إضافة Codex أو Ollama أو موفر آخر إلى إسقاط إدخالات نماذج غير ذات صلة. يحافظ Configure على `agents.defaults.model.primary` موجود عند إعادة تطبيق مصادقة الموفر. أوامر تعيين الافتراضي الصريحة مثل `openclaw models auth login --provider <id> --set-default` و`openclaw models set <model>` لا تزال تستبدل `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا عُيّن `agents.defaults.models`، فإنه يصبح **قائمة السماح** لـ `/model` ولتجاوزات الجلسة. عندما يختار المستخدم نموذجًا غير موجود في قائمة السماح تلك، يعيد OpenClaw:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
يحدث هذا **قبل** توليد رد عادي، لذلك قد تبدو الرسالة كأنها "لم ترد". الحل هو إما:

- إضافة النموذج إلى `agents.defaults.models`، أو
- مسح قائمة السماح (إزالة `agents.defaults.models`)، أو
- اختيار نموذج من `/model list`.

</Warning>

عندما يتضمن الأمر المرفوض تجاوز تشغيل مثل `/model openai/gpt-5.5 --runtime codex`، أصلح قائمة السماح أولًا، ثم أعد محاولة الأمر نفسه `/model ... --runtime ...`. بالنسبة إلى تنفيذ Codex الأصلي، يظل النموذج المحدد هو `openai/gpt-5.5`؛ يحدد تشغيل `codex` الحزمة ويستخدم مصادقة Codex بشكل منفصل.

بالنسبة إلى النماذج المحلية/GGUF، خزّن المرجع الكامل المسبوق بالموفر في قائمة السماح،
على سبيل المثال `ollama/gemma4:26b` أو `lmstudio/Gemma4-26b-a4-it-gguf` أو
الموفر/النموذج الدقيق المعروض بواسطة `openclaw models list --provider <provider>`.
أسماء الملفات المحلية المجردة أو أسماء العرض ليست كافية عندما تكون قائمة السماح
نشطة.

إذا أردت تقييد الموفرين دون سرد كل نموذج يدويًا، فأضف
إدخالات `provider/*` إلى `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

مع هذه السياسة، يعرض `/model` و`/models` ومنتقيات النماذج الفهرس
المكتشف لهؤلاء الموفرين فقط. يمكن أن تظهر نماذج جديدة من الموفرين المحددين
دون تعديل قائمة السماح. يمكن مزج إدخالات `provider/model` الدقيقة
مع إدخالات `provider/*` عندما تحتاج إلى نموذج محدد واحد من موفر آخر.

مثال على تكوين قائمة السماح:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

## تبديل النماذج في المحادثة (`/model`)

يمكنك تبديل النماذج للجلسة الحالية دون إعادة التشغيل:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="سلوك المنتقي">
    - `/model` (و`/model list`) هو منتقي مدمج ومرقم (عائلة النموذج + الموفرون المتاحون).
    - على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يحتوي على قوائم منسدلة للموفر والنموذج بالإضافة إلى خطوة إرسال.
    - على Telegram، تكون اختيارات منتقي `/models` محددة بنطاق الجلسة؛ ولا تغيّر الافتراضي الدائم للوكيل في `openclaw.json`.
    - أصبح `/models add` مهمَلًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من المحادثة.
    - يختار `/model <#>` من ذلك المنتقي.

  </Accordion>
  <Accordion title="الاستمرارية والتبديل المباشر">
    - يحفظ `/model` اختيار الجلسة الجديد فورًا.
    - إذا كان الوكيل خاملًا، يستخدم التشغيل التالي النموذج الجديد مباشرة.
    - إذا كان تشغيل نشطًا بالفعل، يضع OpenClaw علامة على التبديل المباشر كقيد الانتظار ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا كان نشاط الأداة أو خرج الرد قد بدأ بالفعل، فقد يبقى التبديل المعلّق في الصف حتى فرصة إعادة محاولة لاحقة أو منعطف المستخدم التالي.
    - مرجع `/model` المحدد من المستخدم صارم لتلك الجلسة: إذا تعذر الوصول إلى الموفر/النموذج المحدد، يفشل الرد بشكل ظاهر بدلًا من الإجابة بصمت من `agents.defaults.model.fallbacks`. يختلف هذا عن الافتراضيات المضبوطة والأساسيات الخاصة بمهام cron، التي لا يزال بإمكانها استخدام سلاسل البدائل.
    - `/model status` هو العرض التفصيلي (مرشحو المصادقة، وعند ضبطه، `baseUrl` لنقطة نهاية الموفر + وضع `api`).

  </Accordion>
  <Accordion title="Ref parsing">
    - تُحلَّل مراجع النماذج عبر التقسيم عند **أول** `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
    - إذا كان معرّف النموذج نفسه يحتوي على `/` (بأسلوب OpenRouter)، فيجب تضمين بادئة المزوّد (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - إذا حذفت المزوّد، فإن OpenClaw يحلّ الإدخال بهذا الترتيب:
      1. تطابق الاسم المستعار
      2. تطابق فريد لمزوّد مهيأ مع معرّف النموذج غير المسبوق نفسه تمامًا
      3. رجوع احتياطي مهمل إلى المزوّد الافتراضي المهيأ — إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيأ، فإن OpenClaw يرجع بدلًا من ذلك إلى أول مزوّد/نموذج مهيأ لتجنب إظهار إعداد افتراضي قديم لمزوّد أُزيل.
  </Accordion>
</AccordionGroup>

السلوك/التكوين الكامل للأمر: [أوامر الشرطة المائلة](/ar/tools/slash-commands).

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

`openclaw models` (بلا أمر فرعي) اختصار لـ `models status`.

### `models list`

يعرض افتراضيًا النماذج المهيأة/المتاحة عبر المصادقة. علامات مفيدة:

<ParamField path="--all" type="boolean">
  الفهرس الكامل. يتضمن صفوف الفهرس الثابتة المملوكة للمزوّد والمضمّنة قبل تهيئة المصادقة، لذا يمكن لطرق العرض المخصصة للاستكشاف فقط إظهار نماذج غير متاحة إلى أن تضيف بيانات اعتماد المزوّد المطابقة.
</ParamField>
<ParamField path="--local" type="boolean">
  المزوّدون المحليون فقط.
</ParamField>
<ParamField path="--provider <id>" type="string">
  التصفية حسب معرّف المزوّد، مثل `moonshot`. لا تُقبل تسميات العرض من أدوات الاختيار التفاعلية.
</ParamField>
<ParamField path="--plain" type="boolean">
  نموذج واحد في كل سطر.
</ParamField>
<ParamField path="--json" type="boolean">
  خرج قابل للقراءة آليًا.
</ParamField>

### `models status`

يعرض النموذج الأساسي المحلول، وخيارات الرجوع الاحتياطية، ونموذج الصور، ونظرة عامة على مصادقة المزوّدين المهيئين. كما يُظهر حالة انتهاء صلاحية OAuth للملفات الشخصية الموجودة في مخزن المصادقة (يحذّر افتراضيًا خلال 24 ساعة). يطبع `--plain` النموذج الأساسي المحلول فقط.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - تُعرض حالة OAuth دائمًا (وتُضمَّن في خرج `--json`). إذا لم تكن لدى مزوّد مهيأ بيانات اعتماد، يطبع `models status` قسم **مصادقة مفقودة**.
    - يتضمن JSON ‏`auth.oauth` (نافذة التحذير + الملفات الشخصية) و`auth.providers` (المصادقة الفعلية لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة بالبيئة). `auth.oauth` هو صحة ملفات مخزن المصادقة الشخصية فقط؛ ولا تظهر فيه المزوّدات المعتمدة على البيئة فقط.
    - استخدم `--check` للأتمتة (رمز الخروج `1` عند الفقدان/انتهاء الصلاحية، و`2` عند قرب انتهاء الصلاحية).
    - استخدم `--probe` لفحوصات المصادقة الحية؛ يمكن أن تأتي صفوف الفحص من ملفات المصادقة الشخصية، أو بيانات اعتماد البيئة، أو `models.json`.
    - إذا حذف `auth.order.<provider>` الصريح ملفًا شخصيًا مخزنًا، يبلغ الفحص عن `excluded_by_auth_order` بدلًا من تجربته. إذا كانت المصادقة موجودة ولكن لا يمكن حل نموذج قابل للفحص لذلك المزوّد، يبلغ الفحص عن `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
يعتمد اختيار المصادقة على المزوّد/الحساب. بالنسبة لمضيفي Gateway الدائمين، تكون مفاتيح API عادةً الأكثر قابلية للتنبؤ؛ كما يُدعم أيضًا إعادة استخدام Claude CLI وملفات OAuth/الرموز الشخصية الحالية من Anthropic.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (نماذج OpenRouter المجانية)

يفحص `openclaw models scan` **فهرس النماذج المجانية** في OpenRouter ويمكنه اختياريًا فحص النماذج لدعم الأدوات والصور.

<ParamField path="--no-probe" type="boolean">
  تخطَّ الفحوصات الحية (بيانات وصفية فقط).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  الحد الأدنى لحجم المعلمات (بالمليارات).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  تخطَّ النماذج الأقدم.
</ParamField>
<ParamField path="--provider <name>" type="string">
  مرشّح بادئة المزوّد.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  حجم قائمة الرجوع الاحتياطي.
</ParamField>
<ParamField path="--set-default" type="boolean">
  اضبط `agents.defaults.model.primary` على أول اختيار.
</ParamField>
<ParamField path="--set-image" type="boolean">
  اضبط `agents.defaults.imageModel.primary` على أول اختيار للصور.
</ParamField>

<Note>
فهرس OpenRouter ‏`/models` عام، لذا يمكن للفحوصات المقتصرة على البيانات الوصفية سرد المرشحين المجانيين بلا مفتاح. لا تزال الفحوصات والاستدلال تتطلب مفتاح OpenRouter API (من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY`). إذا لم يتوفر مفتاح، يرجع `openclaw models scan` إلى خرج البيانات الوصفية فقط ويترك التكوين بلا تغيير. استخدم `--no-probe` لطلب وضع البيانات الوصفية فقط صراحةً.
</Note>

تُرتَّب نتائج الفحص حسب:

1. دعم الصور
2. زمن استجابة الأدوات
3. حجم السياق
4. عدد المعلمات

الإدخال:

- قائمة OpenRouter ‏`/models` (مرشّح `:free`)
- تتطلب الفحوصات الحية مفتاح OpenRouter API من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY` (راجع [متغيرات البيئة](/ar/help/environment))
- مرشحات اختيارية: `--max-age-days`، و`--min-params`، و`--provider`، و`--max-candidates`
- عناصر التحكم في الطلب/الفحص: `--timeout`، و`--concurrency`

عند تشغيل الفحوصات الحية في TTY، يمكنك تحديد خيارات الرجوع الاحتياطية تفاعليًا. في الوضع غير التفاعلي، مرّر `--yes` لقبول الإعدادات الافتراضية. نتائج البيانات الوصفية فقط معلوماتية؛ وتتطلب `--set-default` و`--set-image` فحوصات حية حتى لا يهيئ OpenClaw نموذج OpenRouter غير قابل للاستخدام بلا مفتاح.

## سجل النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن دليل الوكيل (الافتراضي `~/.openclaw/agents/<agentId>/agent/models.json`). يُدمج هذا الملف افتراضيًا ما لم تُضبط `models.mode` على `replace`.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    أسبقية وضع الدمج لمعرّفات المزوّدين المتطابقة:

    - يفوز `baseUrl` غير الفارغ الموجود بالفعل في `models.json` الخاص بالوكيل.
    - يفوز `apiKey` غير الفارغ في `models.json` الخاص بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا بواسطة SecretRef في سياق التكوين/ملف المصادقة الشخصي الحالي.
    - تُحدَّث قيم `apiKey` للمزوّدين المدارين بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلًا من حفظ الأسرار المحلولة.
    - تُحدَّث قيم ترويسات المزوّدين المدارين بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
    - يرجع `apiKey`/`baseUrl` الفارغ أو المفقود في الوكيل إلى `models.providers` في التكوين.
    - تُحدَّث حقول المزوّد الأخرى من التكوين وبيانات الفهرس المطبّعة.

  </Accordion>
</AccordionGroup>

<Note>
استمرار العلامات معتمد على المصدر: يكتب OpenClaw العلامات من لقطة تكوين المصدر النشطة (قبل الحل)، وليس من قيم أسرار وقت التشغيل المحلولة. ينطبق هذا كلما أعاد OpenClaw توليد `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.
</Note>

## ذو صلة

- [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes) — PI وCodex وبيئات تشغيل حلقات وكلاء أخرى
- [مرجع التكوين](/ar/gateway/config-agents#agent-defaults) — مفاتيح تكوين النماذج
- [توليد الصور](/ar/tools/image-generation) — تكوين نموذج الصور
- [تجاوز فشل النموذج](/ar/concepts/model-failover) — سلاسل الرجوع الاحتياطي
- [مزوّدو النماذج](/ar/concepts/model-providers) — توجيه المزوّدين والمصادقة
- [توليد الموسيقى](/ar/tools/music-generation) — تكوين نموذج الموسيقى
- [توليد الفيديو](/ar/tools/video-generation) — تكوين نموذج الفيديو
