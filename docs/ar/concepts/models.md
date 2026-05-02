---
read_when:
    - إضافة نماذج CLI أو تعديلها (models list/set/scan/aliases/fallbacks)
    - تغيير سلوك الرجوع الاحتياطي للنموذج أو تجربة اختيار النموذج
    - تحديث مجسّات فحص النماذج (الأدوات/الصور)
sidebarTitle: Models CLI
summary: 'CLI النماذج: السرد، التعيين، الأسماء المستعارة، البدائل الاحتياطية، الفحص، الحالة'
title: CLI للنماذج
x-i18n:
    generated_at: "2026-05-02T20:44:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="التحويل الاحتياطي للنموذج" href="/ar/concepts/model-failover">
    تدوير ملفات تعريف المصادقة، وفترات التهدئة، وكيفية تفاعل ذلك مع البدائل الاحتياطية.
  </Card>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers">
    نظرة عامة سريعة على المزوّدين وأمثلة.
  </Card>
  <Card title="بيئات تشغيل الوكلاء" href="/ar/concepts/agent-runtimes">
    PI وCodex وبيئات تشغيل حلقات وكلاء أخرى.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults">
    مفاتيح إعدادات النموذج.
  </Card>
</CardGroup>

تختار مراجع النماذج مزوّدًا ونموذجًا. وهي لا تختار عادةً بيئة تشغيل الوكيل منخفضة المستوى. على سبيل المثال، يمكن تشغيل `openai/gpt-5.5` عبر مسار مزوّد OpenAI المعتاد أو عبر بيئة تشغيل خادم تطبيق Codex، بحسب `agents.defaults.agentRuntime.id`. في وضع بيئة تشغيل Codex، لا يعني مرجع `openai/gpt-*` الفوترة بمفتاح API؛ إذ يمكن أن تأتي المصادقة من حساب Codex أو ملف تعريف مصادقة `openai-codex`. راجع [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

<Steps>
  <Step title="النموذج الأساسي">
    `agents.defaults.model.primary` (أو `agents.defaults.model`).
  </Step>
  <Step title="البدائل الاحتياطية">
    `agents.defaults.model.fallbacks` (بالترتيب).
  </Step>
  <Step title="التحويل الاحتياطي لمصادقة المزوّد">
    يحدث التحويل الاحتياطي للمصادقة داخل المزوّد قبل الانتقال إلى النموذج التالي.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="أسطح النماذج ذات الصلة">
    - `agents.defaults.models` هي قائمة السماح/الفهرس للنماذج التي يستطيع OpenClaw استخدامها (إضافةً إلى الأسماء البديلة).
    - يُستخدم `agents.defaults.imageModel` **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
    - يُستخدم `agents.defaults.pdfModel` بواسطة أداة `pdf`. إذا حُذف، تعود الأداة إلى `agents.defaults.imageModel`، ثم نموذج الجلسة/الافتراضي الذي تم حله.
    - يُستخدم `agents.defaults.imageGenerationModel` بواسطة قدرة توليد الصور المشتركة. إذا حُذف، يمكن لـ `image_generate` مع ذلك استنتاج إعداد افتراضي لمزوّد مدعوم بالمصادقة. يجرّب مزوّد الإعداد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الصور المسجلين بترتيب معرّف المزوّد. إذا ضبطت مزوّدًا/نموذجًا محددًا، فاضبط أيضًا مصادقة ذلك المزوّد/مفتاح API الخاص به.
    - يُستخدم `agents.defaults.musicGenerationModel` بواسطة قدرة توليد الموسيقى المشتركة. إذا حُذف، يمكن لـ `music_generate` مع ذلك استنتاج إعداد افتراضي لمزوّد مدعوم بالمصادقة. يجرّب مزوّد الإعداد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّف المزوّد. إذا ضبطت مزوّدًا/نموذجًا محددًا، فاضبط أيضًا مصادقة ذلك المزوّد/مفتاح API الخاص به.
    - يُستخدم `agents.defaults.videoGenerationModel` بواسطة قدرة توليد الفيديو المشتركة. إذا حُذف، يمكن لـ `video_generate` مع ذلك استنتاج إعداد افتراضي لمزوّد مدعوم بالمصادقة. يجرّب مزوّد الإعداد الافتراضي الحالي أولًا، ثم بقية مزوّدي توليد الفيديو المسجلين بترتيب معرّف المزوّد. إذا ضبطت مزوّدًا/نموذجًا محددًا، فاضبط أيضًا مصادقة ذلك المزوّد/مفتاح API الخاص به.
    - يمكن للإعدادات الافتراضية لكل وكيل تجاوز `agents.defaults.model` عبر `agents.list[].model` بالإضافة إلى الارتباطات (راجع [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## مصدر الاختيار وسلوك البدائل الاحتياطية

يمكن أن يعني `provider/model` نفسه أشياء مختلفة بحسب مصدره:

- الإعدادات الافتراضية المضبوطة (`agents.defaults.model.primary` والأساسيات الخاصة بالوكلاء) هي نقطة البداية المعتادة وتستخدم `agents.defaults.model.fallbacks`.
- اختيارات البدائل الاحتياطية التلقائية هي حالة استرداد مؤقتة. تُخزَّن مع `modelOverrideSource: "auto"` حتى تستطيع الجولات اللاحقة الاستمرار في استخدام سلسلة البدائل الاحتياطية دون اختبار نموذج أساسي معروف بأنه غير صالح أولًا.
- اختيارات جلسة المستخدم دقيقة. تخزّن `/model`، ومنتقي النموذج، و`session_status(model=...)`، و`sessions.patch` القيمة `modelOverrideSource: "user"`؛ إذا كان ذلك المزوّد/النموذج المحدد غير قابل للوصول، يفشل OpenClaw بشكل مرئي بدلًا من الانتقال إلى نموذج آخر مضبوط.
- يمثّل Cron `--model` / حمولة `model` نموذجًا أساسيًا لكل مهمة. ما يزال يستخدم البدائل الاحتياطية المضبوطة إلا إذا وفرت المهمة حمولة `fallbacks` صريحة (استخدم `fallbacks: []` لتشغيل cron صارم).
- تحترم منتقيات النموذج الافتراضي في CLI وقائمة السماح `models.mode: "replace"` عبر إدراج `models.providers.*.models` الصريحة بدلًا من تحميل الفهرس المدمج الكامل.
- يطلب منتقي النموذج في واجهة التحكم من Gateway عرض النماذج المضبوط لديه: `agents.defaults.models` عند وجودها، وإلا `models.providers.*.models` الصريحة بالإضافة إلى المزوّدين ذوي المصادقة القابلة للاستخدام. يُحجز الفهرس المدمج الكامل لعروض التصفح الصريحة مثل `models.list` مع `view: "all"` أو `openclaw models list --all`.

## سياسة نموذج سريعة

- اضبط النموذج الأساسي على أقوى نموذج من الجيل الأحدث متاح لك.
- استخدم البدائل الاحتياطية للمهام الحساسة للتكلفة/زمن الاستجابة والدردشة الأقل حساسية.
- للوكلاء الممكّنين بالأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا كنت لا تريد تعديل الإعدادات يدويًا، فشغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة للمزوّدين الشائعين، بما في ذلك **اشتراك OpenAI Code (Codex)** (OAuth) و**Anthropic** (مفتاح API أو Claude CLI).

## مفاتيح الإعدادات (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة السماح + الأسماء البديلة + معاملات المزوّد)
- `models.providers` (مزوّدون مخصصون مكتوبون في `models.json`)

<Note>
تُطبّع مراجع النماذج إلى أحرف صغيرة. تُطبّع أسماء المزوّدين البديلة مثل `z.ai/*` إلى `zai/*`.

توجد أمثلة إعداد المزوّدين (بما في ذلك OpenCode) في [OpenCode](/ar/providers/opencode).
</Note>

### تعديلات قائمة السماح الآمنة

استخدم عمليات كتابة إضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد الحماية من الاستبدال غير المقصود">
    يحمي `openclaw config set` خرائط النماذج/المزوّدين من الاستبدال غير المقصود. يُرفض إسناد كائن عادي إلى `agents.defaults.models` أو `models.providers` أو `models.providers.<id>.models` عندما يزيل إدخالات موجودة. استخدم `--merge` للتغييرات الإضافية؛ واستخدم `--replace` فقط عندما يجب أن تصبح القيمة المقدمة هي القيمة الكاملة للهدف.

    يدمج إعداد المزوّد التفاعلي و`openclaw configure --section model` أيضًا الاختيارات محددة النطاق بالمزوّد داخل قائمة السماح الموجودة، لذا لا تؤدي إضافة Codex أو Ollama أو مزوّد آخر إلى إسقاط إدخالات نماذج غير مرتبطة. يحافظ Configure على `agents.defaults.model.primary` الموجود عند إعادة تطبيق مصادقة المزوّد. أما أوامر ضبط الإعداد الافتراضي الصريحة مثل `openclaw models auth login --provider <id> --set-default` و`openclaw models set <model>` فما تزال تستبدل `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا ضُبط `agents.defaults.models`، يصبح **قائمة السماح** لـ `/model` وتجاوزات الجلسة. عندما يختار مستخدم نموذجًا غير موجود في قائمة السماح تلك، يعيد OpenClaw:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
يحدث هذا **قبل** إنشاء رد عادي، لذا قد تبدو الرسالة وكأنها "لم ترد". الإصلاح هو أحد الخيارات التالية:

- إضافة النموذج إلى `agents.defaults.models`، أو
- مسح قائمة السماح (إزالة `agents.defaults.models`)، أو
- اختيار نموذج من `/model list`.

</Warning>

بالنسبة إلى النماذج المحلية/GGUF، خزّن المرجع الكامل ذي بادئة المزوّد في قائمة السماح،
على سبيل المثال `ollama/gemma4:26b` أو `lmstudio/Gemma4-26b-a4-it-gguf` أو
المزوّد/النموذج الدقيق الذي يعرضه `openclaw models list --provider <provider>`.
لا تكفي أسماء الملفات المحلية المجردة أو أسماء العرض عندما تكون قائمة السماح
نشطة.

مثال على إعداد قائمة السماح:

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
    - `/model` (و`/model list`) هو منتقي مدمج ومرقّم (عائلة النموذج + المزوّدون المتاحون).
    - على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يتضمن قوائم منسدلة للمزوّد والنموذج بالإضافة إلى خطوة إرسال.
    - على Telegram، تكون اختيارات منتقي `/models` محددة النطاق بالجلسة؛ ولا تغيّر الإعداد الافتراضي الدائم للوكيل في `openclaw.json`.
    - أصبح `/models add` مهملًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من الدردشة.
    - يختار `/model <#>` من ذلك المنتقي.

  </Accordion>
  <Accordion title="الاستمرارية والتبديل الحي">
    - يحفظ `/model` اختيار الجلسة الجديد فورًا.
    - إذا كان الوكيل خاملاً، يستخدم التشغيل التالي النموذج الجديد مباشرةً.
    - إذا كان هناك تشغيل نشط بالفعل، يعلّم OpenClaw التبديل الحي كقيد الانتظار ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا كان نشاط الأدوات أو إخراج الرد قد بدأ بالفعل، يمكن أن يبقى التبديل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو جولة المستخدم التالية.
    - يكون مرجع `/model` الذي يختاره المستخدم صارمًا لتلك الجلسة: إذا كان المزوّد/النموذج المحدد غير قابل للوصول، يفشل الرد بشكل مرئي بدلًا من الإجابة بصمت من `agents.defaults.model.fallbacks`. يختلف هذا عن الإعدادات الافتراضية المضبوطة والنماذج الأساسية لمهام cron، التي ما يزال بإمكانها استخدام سلاسل البدائل الاحتياطية.
    - `/model status` هو العرض المفصل (مرشحو المصادقة، وعند الضبط، نقطة نهاية المزوّد `baseUrl` + وضع `api`).

  </Accordion>
  <Accordion title="تحليل المرجع">
    - تُحلل مراجع النماذج بالتقسيم عند أول `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
    - إذا كان معرّف النموذج نفسه يحتوي على `/` (بأسلوب OpenRouter)، فيجب تضمين بادئة المزوّد (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - إذا حذفت المزوّد، يحل OpenClaw الإدخال بهذا الترتيب:
      1. تطابق الاسم البديل
      2. تطابق مزوّد مضبوط فريد لمعرّف النموذج غير المسبوق ببادئة نفسه بالضبط
      3. رجوع مهمل إلى مزوّد الإعداد الافتراضي المضبوط — إذا لم يعد ذلك المزوّد يوفّر نموذج الإعداد الافتراضي المضبوط، يعود OpenClaw بدلًا من ذلك إلى أول مزوّد/نموذج مضبوط لتجنب إظهار إعداد افتراضي قديم لمزوّد تمت إزالته.
  </Accordion>
</AccordionGroup>

سلوك الأمر/الإعداد الكامل: [أوامر الشرطة المائلة](/ar/tools/slash-commands).

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

`openclaw models` (بدون أمر فرعي) هو اختصار لـ `models status`.

### `models list`

يعرض النماذج المضبوطة/المتاحة بالمصادقة افتراضيًا. الأعلام المفيدة:

<ParamField path="--all" type="boolean">
  الكتالوج الكامل. يتضمن صفوف الكتالوج الثابتة المضمّنة والمملوكة لمزوّدي الخدمة قبل تكوين المصادقة، بحيث يمكن لعروض الاكتشاف فقط إظهار النماذج غير المتاحة إلى أن تضيف بيانات اعتماد مزوّد مطابقة.
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
  مخرجات قابلة للقراءة آليًا.
</ParamField>

### `models status`

يعرض النموذج الأساسي المحسوم، والبدائل الاحتياطية، ونموذج الصور، ونظرة عامة للمصادقة على المزوّدين المكوّنين. كما يعرض حالة انتهاء صلاحية OAuth للملفات الشخصية الموجودة في مخزن المصادقة (يحذّر خلال 24 ساعة افتراضيًا). يطبع `--plain` النموذج الأساسي المحسوم فقط.

<AccordionGroup>
  <Accordion title="سلوك المصادقة والفحص">
    - تُعرض حالة OAuth دائمًا (وتُضمَّن في مخرجات `--json`). إذا لم تكن لدى مزوّد مكوّن بيانات اعتماد، يطبع `models status` قسم **المصادقة مفقودة**.
    - يتضمن JSON ‏`auth.oauth` (نافذة التحذير + الملفات الشخصية) و`auth.providers` (المصادقة الفعلية لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة من البيئة). `auth.oauth` هو صحة ملفات مخزن المصادقة فقط؛ ولا تظهر فيه المزوّدات المعتمدة على البيئة فقط.
    - استخدم `--check` للأتمتة (رمز خروج `1` عند الفقدان/انتهاء الصلاحية، و`2` عند قرب انتهاء الصلاحية).
    - استخدم `--probe` لفحوصات المصادقة الحية؛ يمكن أن تأتي صفوف الفحص من ملفات المصادقة، أو بيانات اعتماد البيئة، أو `models.json`.
    - إذا أغفل `auth.order.<provider>` الصريح ملفًا شخصيًا مخزنًا، يبلّغ الفحص عن `excluded_by_auth_order` بدلًا من تجربته. إذا كانت المصادقة موجودة ولكن لا يمكن حسم نموذج قابل للفحص لذلك المزوّد، يبلّغ الفحص عن `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
يعتمد اختيار المصادقة على المزوّد/الحساب. بالنسبة إلى مضيفي Gateway العاملين دائمًا، تكون مفاتيح API عادةً الأكثر قابلية للتوقع؛ كما يُدعم أيضًا إعادة استخدام Claude CLI وملفات Anthropic OAuth/الرموز المميزة الموجودة.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (نماذج OpenRouter المجانية)

يفحص `openclaw models scan` **كتالوج النماذج المجانية** في OpenRouter ويمكنه اختياريًا فحص النماذج لدعم الأدوات والصور.

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
  مرشح بادئة المزوّد.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  حجم قائمة البدائل الاحتياطية.
</ParamField>
<ParamField path="--set-default" type="boolean">
  عيّن `agents.defaults.model.primary` إلى الاختيار الأول.
</ParamField>
<ParamField path="--set-image" type="boolean">
  عيّن `agents.defaults.imageModel.primary` إلى أول اختيار للصور.
</ParamField>

<Note>
كتالوج OpenRouter ‏`/models` عام، لذلك يمكن لفحوصات البيانات الوصفية فقط إدراج المرشحين المجانيين دون مفتاح. لا تزال الفحوصات والاستدلال تتطلب مفتاح OpenRouter API (من ملفات المصادقة أو `OPENROUTER_API_KEY`). إذا لم يتوفر مفتاح، يعود `openclaw models scan` إلى مخرجات البيانات الوصفية فقط ويترك التكوين دون تغيير. استخدم `--no-probe` لطلب وضع البيانات الوصفية فقط صراحةً.
</Note>

تُرتّب نتائج الفحص حسب:

1. دعم الصور
2. زمن استجابة الأدوات
3. حجم السياق
4. عدد المعلمات

المدخلات:

- قائمة OpenRouter ‏`/models` (عامل التصفية `:free`)
- تتطلب الفحوصات الحية مفتاح OpenRouter API من ملفات المصادقة أو `OPENROUTER_API_KEY` (راجع [متغيرات البيئة](/ar/help/environment))
- المرشحات الاختيارية: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- عناصر التحكم في الطلب/الفحص: `--timeout`، `--concurrency`

عند تشغيل الفحوصات الحية في TTY، يمكنك اختيار البدائل الاحتياطية تفاعليًا. في الوضع غير التفاعلي، مرّر `--yes` لقبول الإعدادات الافتراضية. نتائج البيانات الوصفية فقط معلوماتية؛ يتطلب `--set-default` و`--set-image` فحوصات حية حتى لا يكوّن OpenClaw نموذج OpenRouter بلا مفتاح وغير قابل للاستخدام.

## سجل النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن دليل الوكيل (الافتراضي `~/.openclaw/agents/<agentId>/agent/models.json`). يُدمج هذا الملف افتراضيًا ما لم يُضبط `models.mode` على `replace`.

<AccordionGroup>
  <Accordion title="أسبقية وضع الدمج">
    أسبقية وضع الدمج لمعرّفات المزوّدين المتطابقة:

    - يفوز `baseUrl` غير الفارغ الموجود مسبقًا في `models.json` الخاص بالوكيل.
    - يفوز `apiKey` غير الفارغ في `models.json` الخاص بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا عبر SecretRef في سياق التكوين/ملف المصادقة الحالي.
    - تُحدَّث قيم `apiKey` للمزوّد المُدار عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملفات/التنفيذ) بدلًا من الاحتفاظ بالأسرار المحسومة.
    - تُحدَّث قيم ترويسات المزوّد المُدار عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملفات/التنفيذ).
    - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة الخاصة بالوكيل إلى `models.providers` في التكوين.
    - تُحدَّث حقول المزوّد الأخرى من التكوين وبيانات الكتالوج المطبّعة.

  </Accordion>
</AccordionGroup>

<Note>
استمرارية العلامات موثوقة من المصدر: يكتب OpenClaw العلامات من لقطة تكوين المصدر النشط (قبل الحل)، وليس من قيم أسرار وقت التشغيل المحسومة. ينطبق هذا كلما أعاد OpenClaw توليد `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.
</Note>

## ذات صلة

- [تشغيل الوكلاء](/ar/concepts/agent-runtimes) — Pi وCodex وبيئات تشغيل حلقات الوكلاء الأخرى
- [مرجع التكوين](/ar/gateway/config-agents#agent-defaults) — مفاتيح تكوين النموذج
- [توليد الصور](/ar/tools/image-generation) — تكوين نموذج الصور
- [تجاوز فشل النماذج](/ar/concepts/model-failover) — سلاسل البدائل الاحتياطية
- [مزوّدو النماذج](/ar/concepts/model-providers) — توجيه المزوّدين والمصادقة
- [توليد الموسيقى](/ar/tools/music-generation) — تكوين نموذج الموسيقى
- [توليد الفيديو](/ar/tools/video-generation) — تكوين نموذج الفيديو
