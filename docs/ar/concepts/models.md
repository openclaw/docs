---
read_when:
    - إضافة أو تعديل CLI النماذج (models list/set/scan/aliases/fallbacks)
    - تغيير سلوك الرجوع الاحتياطي للنموذج أو تجربة مستخدم الاختيار
    - تحديث مجسّات فحص النماذج (الأدوات/الصور)
sidebarTitle: Models CLI
summary: 'CLI النماذج: سرد، تعيين، الأسماء المستعارة، البدائل الاحتياطية، الفحص، الحالة'
title: CLI النماذج
x-i18n:
    generated_at: "2026-05-10T19:35:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b4d473b9b437e213f8cd2b40cf0ae6000d8fb4a8fa3522813e14659cecc5450
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="تجاوز أعطال النموذج" href="/ar/concepts/model-failover">
    تدوير ملف تعريف المصادقة، وفترات التهدئة، وكيفية تفاعل ذلك مع البدائل.
  </Card>
  <Card title="مزودو النماذج" href="/ar/concepts/model-providers">
    نظرة عامة سريعة على المزودين وأمثلة.
  </Card>
  <Card title="بيئات تشغيل الوكلاء" href="/ar/concepts/agent-runtimes">
    PI وCodex وبيئات تشغيل حلقات وكلاء أخرى.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/config-agents#agent-defaults">
    مفاتيح تكوين النموذج.
  </Card>
</CardGroup>

تختار مراجع النماذج مزودًا ونموذجًا. وهي لا تختار عادةً بيئة تشغيل الوكيل منخفضة المستوى. تُعد مراجع وكلاء OpenAI الاستثناء الرئيسي: يعمل `openai/gpt-5.5` عبر بيئة تشغيل خادم تطبيق Codex افتراضيًا على مزود OpenAI الرسمي. تنتمي تجاوزات بيئة التشغيل الصريحة إلى سياسة المزود/النموذج، وليس إلى الوكيل أو الجلسة بالكامل. في وضع بيئة تشغيل Codex، لا يعني مرجع `openai/gpt-*` الفوترة عبر مفتاح API؛ يمكن أن تأتي المصادقة من حساب Codex أو ملف تعريف مصادقة `openai-codex`. راجع [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

<Steps>
  <Step title="النموذج الأساسي">
    `agents.defaults.model.primary` (أو `agents.defaults.model`).
  </Step>
  <Step title="البدائل">
    `agents.defaults.model.fallbacks` (بالترتيب).
  </Step>
  <Step title="تجاوز أعطال مصادقة المزود">
    يحدث تجاوز أعطال المصادقة داخل المزود قبل الانتقال إلى النموذج التالي.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="أسطح النماذج ذات الصلة">
    - `agents.defaults.models` هي قائمة السماح/الفهرس للنماذج التي يمكن لـ OpenClaw استخدامها (بالإضافة إلى الأسماء المستعارة). استخدم إدخالات `provider/*` لتقييد المزودين المرئيين مع إبقاء اكتشاف المزود ديناميكيًا.
    - يُستخدم `agents.defaults.imageModel` **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
    - يُستخدم `agents.defaults.pdfModel` بواسطة أداة `pdf`. إذا حُذف، تعود الأداة إلى `agents.defaults.imageModel`، ثم نموذج الجلسة/الافتراضي المحلول.
    - يُستخدم `agents.defaults.imageGenerationModel` بواسطة إمكانية إنشاء الصور المشتركة. إذا حُذف، فلا يزال بإمكان `image_generate` استنتاج افتراضي لمزود مدعوم بالمصادقة. يجرب المزود الافتراضي الحالي أولًا، ثم مزودي إنشاء الصور المسجلين المتبقين بترتيب معرّف المزود. إذا عيّنت مزودًا/نموذجًا محددًا، فكوّن أيضًا مصادقة/API key ذلك المزود.
    - يُستخدم `agents.defaults.musicGenerationModel` بواسطة إمكانية إنشاء الموسيقى المشتركة. إذا حُذف، فلا يزال بإمكان `music_generate` استنتاج افتراضي لمزود مدعوم بالمصادقة. يجرب المزود الافتراضي الحالي أولًا، ثم مزودي إنشاء الموسيقى المسجلين المتبقين بترتيب معرّف المزود. إذا عيّنت مزودًا/نموذجًا محددًا، فكوّن أيضًا مصادقة/API key ذلك المزود.
    - يُستخدم `agents.defaults.videoGenerationModel` بواسطة إمكانية إنشاء الفيديو المشتركة. إذا حُذف، فلا يزال بإمكان `video_generate` استنتاج افتراضي لمزود مدعوم بالمصادقة. يجرب المزود الافتراضي الحالي أولًا، ثم مزودي إنشاء الفيديو المسجلين المتبقين بترتيب معرّف المزود. إذا عيّنت مزودًا/نموذجًا محددًا، فكوّن أيضًا مصادقة/API key ذلك المزود.
    - يمكن لافتراضيات كل وكيل تجاوز `agents.defaults.model` عبر `agents.list[].model` بالإضافة إلى الربط (راجع [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## مصدر الاختيار وسلوك البدائل

يمكن أن يعني `provider/model` نفسه أشياء مختلفة حسب مصدره:

- الافتراضيات المكوّنة (`agents.defaults.model.primary` والأساسيات الخاصة بالوكلاء) هي نقطة البداية العادية وتستخدم `agents.defaults.model.fallbacks`.
- اختيارات البديل التلقائي هي حالة استرداد مؤقتة. تُخزّن مع `modelOverrideSource: "auto"` حتى تتمكن الدورات اللاحقة من الاستمرار في استخدام سلسلة البدائل دون اختبار نموذج أساسي معروف بسوء حالته أولًا.
- اختيارات جلسة المستخدم دقيقة. تخزّن `/model`، ومنتقي النموذج، و`session_status(model=...)`، و`sessions.patch` القيمة `modelOverrideSource: "user"`؛ إذا تعذر الوصول إلى المزود/النموذج المحدد، يفشل OpenClaw بشكل مرئي بدلًا من الانتقال إلى نموذج مكوّن آخر.
- Cron `--model` / حمولة `model` هي نموذج أساسي لكل مهمة. لا تزال تستخدم البدائل المكوّنة ما لم توفر المهمة حمولة `fallbacks` صريحة (استخدم `fallbacks: []` لتشغيل Cron صارم).
- تحترم منتقيات النموذج الافتراضي في CLI وقائمة السماح `models.mode: "replace"` عبر إدراج `models.providers.*.models` الصريحة بدلًا من تحميل الفهرس المدمج الكامل.
- يطلب منتقي النماذج في واجهة التحكم من Gateway عرض النموذج المكوّن لديه: `agents.defaults.models` عند وجوده، بما في ذلك إدخالات `provider/*` على مستوى المزود، وإلا `models.providers.*.models` الصريحة بالإضافة إلى المزودين ذوي المصادقة القابلة للاستخدام. يُحجز الفهرس المدمج الكامل لعروض التصفح الصريحة مثل `models.list` مع `view: "all"` أو `openclaw models list --all`.

## سياسة نموذج سريعة

- عيّن النموذج الأساسي إلى أقوى نموذج من أحدث جيل متاح لك.
- استخدم البدائل للمهام الحساسة للتكلفة/زمن الاستجابة والدردشة الأقل خطورة.
- للوكلاء الممكّنين بالأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا كنت لا تريد تعديل التكوين يدويًا، فشغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة للمزودين الشائعين، بما في ذلك **اشتراك OpenAI Code (Codex)** (OAuth) و**Anthropic** (API key أو Claude CLI).

## مفاتيح التكوين (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة السماح + الأسماء المستعارة + معاملات المزود + إدخالات مزود ديناميكية `provider/*`)
- `models.providers` (مزودون مخصصون مكتوبون في `models.json`)

<Note>
تُطبّع مراجع النماذج إلى أحرف صغيرة. الأسماء المستعارة للمزود مثل `z.ai/*` تُطبّع إلى `zai/*`.

توجد أمثلة تكوين المزودين (بما في ذلك OpenCode) في [OpenCode](/ar/providers/opencode).
</Note>

### تعديلات آمنة لقائمة السماح

استخدم عمليات كتابة إضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد الحماية من الاستبدال غير المقصود">
    يحمي `openclaw config set` خرائط النماذج/المزودين من الاستبدال غير المقصود. يُرفض إسناد كائن عادي إلى `agents.defaults.models` أو `models.providers` أو `models.providers.<id>.models` عندما سيؤدي ذلك إلى إزالة إدخالات موجودة. استخدم `--merge` للتغييرات الإضافية؛ واستخدم `--replace` فقط عندما ينبغي أن تصبح القيمة المقدمة هي القيمة الهدف الكاملة.

    يدمج إعداد المزود التفاعلي و`openclaw configure --section model` أيضًا الاختيارات ذات نطاق المزود في قائمة السماح الحالية، لذا فإن إضافة Codex أو Ollama أو مزود آخر لا تُسقط إدخالات نماذج غير ذات صلة. يحافظ التكوين على `agents.defaults.model.primary` موجود عند إعادة تطبيق مصادقة المزود. لا تزال أوامر تعيين الافتراضي الصريحة مثل `openclaw models auth login --provider <id> --set-default` و`openclaw models set <model>` تستبدل `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا ضُبط `agents.defaults.models`، فإنه يصبح **قائمة السماح** لـ `/model` ولتجاوزات الجلسة. عندما يختار مستخدم نموذجًا غير موجود في قائمة السماح تلك، يُرجع OpenClaw:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
يحدث هذا **قبل** إنشاء رد عادي، لذا قد تبدو الرسالة كأنها "لم تستجب". الإصلاح هو أحد الآتي:

- أضف النموذج إلى `agents.defaults.models`، أو
- امسح قائمة السماح (أزل `agents.defaults.models`)، أو
- اختر نموذجًا من `/model list`.

</Warning>

عندما يتضمن الأمر المرفوض تجاوزًا لبيئة التشغيل مثل `/model openai/gpt-5.5 --runtime codex`، أصلح قائمة السماح أولًا، ثم أعد محاولة أمر `/model ... --runtime ...` نفسه. لتنفيذ Codex الأصلي، يظل النموذج المحدد هو `openai/gpt-5.5`؛ وتحدد بيئة تشغيل `codex` الحزمة وتستخدم مصادقة Codex بشكل منفصل.

للنماذج المحلية/GGUF، خزّن المرجع الكامل المسبوق بالمزود في قائمة السماح،
مثل `ollama/gemma4:26b` أو `lmstudio/Gemma4-26b-a4-it-gguf` أو
المزود/النموذج الدقيق الذي يعرضه `openclaw models list --provider <provider>`.
لا تكفي أسماء الملفات المحلية المجردة أو أسماء العرض عندما تكون قائمة السماح
نشطة.

إذا أردت تقييد المزودين دون إدراج كل نموذج يدويًا، فأضف
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

مع هذه السياسة، يعرض `/model` و`/models` ومنتقيات النماذج الفهرس المكتشف
لهؤلاء المزودين فقط. يمكن أن تظهر نماذج جديدة من المزودين المحددين
دون تعديل قائمة السماح. يمكن مزج إدخالات `provider/model` الدقيقة
مع إدخالات `provider/*` عندما تحتاج إلى نموذج محدد واحد من مزود آخر.

مثال على تكوين قائمة السماح:

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
    - `/model` (و`/model list`) هو منتقي مضغوط ومرقّم (عائلة النموذج + المزودون المتاحون).
    - على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للمزود والنموذج بالإضافة إلى خطوة إرسال.
    - على Telegram، تكون اختيارات منتقي `/models` محددة بنطاق الجلسة؛ ولا تغيّر الافتراضي الدائم للوكيل في `openclaw.json`.
    - أصبح `/models add` مهجورًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من الدردشة.
    - يختار `/model <#>` من ذلك المنتقي.

  </Accordion>
  <Accordion title="الاستمرارية والتبديل الحي">
    - يحفظ `/model` اختيار الجلسة الجديد فورًا.
    - إذا كان الوكيل خاملًا، يستخدم التشغيل التالي النموذج الجديد مباشرةً.
    - إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw علامة على التبديل الحي بأنه معلّق ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا كان نشاط الأدوات أو إخراج الرد قد بدأ بالفعل، فقد يظل التبديل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دورة المستخدم التالية.
    - يكون مرجع `/model` الذي اختاره المستخدم صارمًا لتلك الجلسة: إذا تعذر الوصول إلى المزود/النموذج المحدد، يفشل الرد بشكل مرئي بدلًا من الإجابة بصمت من `agents.defaults.model.fallbacks`. يختلف هذا عن الافتراضيات المكوّنة والنماذج الأساسية لمهام Cron، التي لا يزال بإمكانها استخدام سلاسل البدائل.
    - `/model status` هو العرض التفصيلي (مرشحو المصادقة، وعند التكوين، نقطة نهاية المزود `baseUrl` + وضع `api`).

  </Accordion>
  <Accordion title="تحليل المراجع">
    - تُحلَّل مراجع النماذج بالتقسيم عند **أول** `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
    - إذا كان معرّف النموذج نفسه يحتوي على `/` (بنمط OpenRouter)، فيجب تضمين بادئة المزوّد (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - إذا حذفت المزوّد، يحل OpenClaw الإدخال بهذا الترتيب:
      1. تطابق الاسم المستعار
      2. تطابق مزوّد مُعدّ فريد لمعرّف النموذج غير المسبوق نفسه بالضبط
      3. الرجوع الاحتياطي المهمل إلى المزوّد الافتراضي المُعدّ — إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المُعدّ، يرجع OpenClaw بدلاً من ذلك إلى أول مزوّد/نموذج مُعدّ لتجنّب إظهار افتراضي قديم لمزوّد مُزال.
  </Accordion>
</AccordionGroup>

سلوك/إعدادات الأمر الكاملة: [أوامر الشرطة المائلة](/ar/tools/slash-commands).

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

`openclaw models` (دون أمر فرعي) هو اختصار لـ `models status`.

### `models list`

يعرض النماذج المُعدّة/المتاحة بالمصادقة افتراضيًا. الأعلام المفيدة:

<ParamField path="--all" type="boolean">
  الفهرس الكامل. يتضمن صفوف الفهرس الثابت المملوكة للمزوّدين والمضمّنة قبل إعداد المصادقة، بحيث يمكن لعروض الاكتشاف فقط إظهار النماذج غير المتاحة حتى تضيف بيانات اعتماد المزوّد المطابقة.
</ParamField>
<ParamField path="--local" type="boolean">
  المزوّدون المحليون فقط.
</ParamField>
<ParamField path="--provider <id>" type="string">
  التصفية حسب معرّف المزوّد، على سبيل المثال `moonshot`. لا تُقبل تسميات العرض من أدوات الاختيار التفاعلية.
</ParamField>
<ParamField path="--plain" type="boolean">
  نموذج واحد في كل سطر.
</ParamField>
<ParamField path="--json" type="boolean">
  مخرجات قابلة للقراءة آليًا.
</ParamField>

### `models status`

يعرض النموذج الأساسي المحلول، والبدائل الاحتياطية، ونموذج الصور، ونظرة عامة على مصادقة المزوّدين المُعدّين. كما يبرز حالة انتهاء صلاحية OAuth للملفات الشخصية الموجودة في مخزن المصادقة (يحذّر خلال 24 ساعة افتراضيًا). يطبع `--plain` النموذج الأساسي المحلول فقط.

<AccordionGroup>
  <Accordion title="سلوك المصادقة والفحص">
    - تُعرض حالة OAuth دائمًا (وتُضمَّن في مخرجات `--json`). إذا لم تكن لدى مزوّد مُعدّ بيانات اعتماد، يطبع `models status` قسم **المصادقة مفقودة**.
    - يتضمن JSON الحقل `auth.oauth` (نافذة التحذير + الملفات الشخصية) و`auth.providers` (المصادقة الفعلية لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة بالبيئة). `auth.oauth` هو صحة ملفات مخزن المصادقة فقط؛ ولا تظهر فيه المزوّدات المعتمدة على البيئة فقط.
    - استخدم `--check` للأتمتة (رمز الخروج `1` عند الفقدان/انتهاء الصلاحية، و`2` عند قرب انتهاء الصلاحية).
    - استخدم `--probe` لفحوصات المصادقة الحية؛ يمكن أن تأتي صفوف الفحص من ملفات المصادقة الشخصية، أو بيانات اعتماد البيئة، أو `models.json`.
    - إذا حذف `auth.order.<provider>` الصريح ملفًا شخصيًا مخزنًا، يبلّغ الفحص عن `excluded_by_auth_order` بدلاً من تجربته. وإذا كانت المصادقة موجودة ولكن لا يمكن حل نموذج قابل للفحص لذلك المزوّد، يبلّغ الفحص عن `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
يعتمد اختيار المصادقة على المزوّد/الحساب. بالنسبة إلى مضيفات Gateway دائمة التشغيل، تكون مفاتيح API عادةً الأكثر قابلية للتنبؤ؛ كما يُدعم أيضًا إعادة استخدام Claude CLI وملفات Anthropic OAuth/الرموز المميّزة الموجودة.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (نماذج OpenRouter المجانية)

يفحص `openclaw models scan` **فهرس النماذج المجانية** في OpenRouter ويمكنه اختياريًا فحص النماذج لدعم الأدوات والصور.

<ParamField path="--no-probe" type="boolean">
  تخطَّ الفحوصات الحية (البيانات الوصفية فقط).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  الحد الأدنى لحجم المعلمات (بالمليارات).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  تخطَّ النماذج الأقدم.
</ParamField>
<ParamField path="--provider <name>" type="string">
  عامل تصفية بادئة المزوّد.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  حجم قائمة البدائل الاحتياطية.
</ParamField>
<ParamField path="--set-default" type="boolean">
  اضبط `agents.defaults.model.primary` على الاختيار الأول.
</ParamField>
<ParamField path="--set-image" type="boolean">
  اضبط `agents.defaults.imageModel.primary` على اختيار الصور الأول.
</ParamField>

<Note>
فهرس OpenRouter `/models` عام، لذلك يمكن للفحوصات المعتمدة على البيانات الوصفية فقط سرد المرشحين المجانيين دون مفتاح. لا تزال الفحوصات والاستدلال تتطلب مفتاح OpenRouter API (من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY`). إذا لم يتوفر مفتاح، يعود `openclaw models scan` إلى مخرجات البيانات الوصفية فقط ويترك الإعدادات دون تغيير. استخدم `--no-probe` لطلب وضع البيانات الوصفية فقط صراحةً.
</Note>

تُرتّب نتائج الفحص حسب:

1. دعم الصور
2. زمن استجابة الأدوات
3. حجم السياق
4. عدد المعلمات

الإدخال:

- قائمة OpenRouter `/models` (عامل التصفية `:free`)
- تتطلب الفحوصات الحية مفتاح OpenRouter API من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY` (راجع [متغيرات البيئة](/ar/help/environment))
- عوامل تصفية اختيارية: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- عناصر التحكم في الطلب/الفحص: `--timeout`، `--concurrency`

عند تشغيل الفحوصات الحية في TTY، يمكنك اختيار البدائل الاحتياطية تفاعليًا. في الوضع غير التفاعلي، مرّر `--yes` لقبول الإعدادات الافتراضية. نتائج البيانات الوصفية فقط معلوماتية؛ يتطلب `--set-default` و`--set-image` فحوصات حية حتى لا يهيئ OpenClaw نموذج OpenRouter غير قابل للاستخدام بدون مفتاح.

## سجل النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن دليل الوكيل (الافتراضي `~/.openclaw/agents/<agentId>/agent/models.json`). يُدمج هذا الملف افتراضيًا ما لم يُضبط `models.mode` على `replace`.

<AccordionGroup>
  <Accordion title="أسبقية وضع الدمج">
    أسبقية وضع الدمج لمعرّفات المزوّدين المتطابقة:

    - يفوز `baseUrl` غير الفارغ الموجود مسبقًا في `models.json` الخاص بالوكيل.
    - يفوز `apiKey` غير الفارغ في `models.json` الخاص بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا بواسطة SecretRef في سياق الإعدادات/ملف المصادقة الشخصي الحالي.
    - تُحدَّث قيم `apiKey` للمزوّد المُدار بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلاً من الاحتفاظ بالأسرار المحلولة.
    - تُحدَّث قيم ترويسات المزوّد المُدار بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
    - يعود `apiKey`/`baseUrl` الفارغ أو المفقود في الوكيل إلى `models.providers` في الإعدادات.
    - تُحدَّث حقول المزوّد الأخرى من الإعدادات وبيانات الفهرس المعيارية.

  </Accordion>
</AccordionGroup>

<Note>
استمرارية العلامات مرجعية المصدر: يكتب OpenClaw العلامات من لقطة إعدادات المصدر النشطة (قبل الحل)، لا من قيم أسرار وقت التشغيل المحلولة. ينطبق هذا كلما أعاد OpenClaw إنشاء `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.
</Note>

## ذات صلة

- [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes) — Pi وCodex وبيئات تشغيل حلقات الوكلاء الأخرى
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — مفاتيح إعدادات النماذج
- [توليد الصور](/ar/tools/image-generation) — إعداد نموذج الصور
- [تحويل النماذج عند الفشل](/ar/concepts/model-failover) — سلاسل البدائل الاحتياطية
- [مزوّدو النماذج](/ar/concepts/model-providers) — توجيه المزوّدين والمصادقة
- [توليد الموسيقى](/ar/tools/music-generation) — إعداد نموذج الموسيقى
- [توليد الفيديو](/ar/tools/video-generation) — إعداد نموذج الفيديو
