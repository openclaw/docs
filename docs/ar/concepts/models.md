---
read_when:
    - إضافة واجهة CLI للنماذج أو تعديلها (models list/set/scan/aliases/fallbacks)
    - تغيير سلوك الرجوع الاحتياطي للنموذج أو تجربة مستخدم الاختيار
    - تحديث مسابر فحص النماذج (الأدوات/الصور)
sidebarTitle: Models CLI
summary: 'CLI للنماذج: العرض، التعيين، الأسماء المستعارة، البدائل الاحتياطية، الفحص، الحالة'
title: CLI الخاص بالنماذج
x-i18n:
    generated_at: "2026-05-02T07:25:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 620df60ee1117a32f0232bf4b56fbc5a9558be5cc3b73a31336f8ab64fd29ebb
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="تجاوز فشل النموذج" href="/ar/concepts/model-failover">
    تدوير ملفات تعريف المصادقة، وفترات التهدئة، وكيفية تفاعل ذلك مع نماذج الاحتياط.
  </Card>
  <Card title="مزودو النماذج" href="/ar/concepts/model-providers">
    نظرة عامة سريعة على المزودين وأمثلة.
  </Card>
  <Card title="بيئات تشغيل الوكلاء" href="/ar/concepts/agent-runtimes">
    PI وCodex وبيئات تشغيل حلقات الوكلاء الأخرى.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/config-agents#agent-defaults">
    مفاتيح تكوين النموذج.
  </Card>
</CardGroup>

تختار مراجع النماذج مزودًا ونموذجًا. وهي لا تختار عادة بيئة تشغيل الوكيل منخفضة المستوى. على سبيل المثال، يمكن تشغيل `openai/gpt-5.5` عبر مسار مزود OpenAI العادي أو عبر بيئة تشغيل خادم تطبيق Codex، حسب `agents.defaults.agentRuntime.id`. في وضع بيئة تشغيل Codex، لا يعني مرجع `openai/gpt-*` الفوترة عبر مفتاح API؛ إذ يمكن أن تأتي المصادقة من حساب Codex أو من ملف تعريف مصادقة `openai-codex`. راجع [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

<Steps>
  <Step title="النموذج الأساسي">
    `agents.defaults.model.primary` (أو `agents.defaults.model`).
  </Step>
  <Step title="نماذج الاحتياط">
    `agents.defaults.model.fallbacks` (بالترتيب).
  </Step>
  <Step title="تجاوز فشل مصادقة المزود">
    يحدث تجاوز فشل المصادقة داخل المزود قبل الانتقال إلى النموذج التالي.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="أسطح النماذج ذات الصلة">
    - `agents.defaults.models` هي قائمة السماح/الفهرس للنماذج التي يمكن لـ OpenClaw استخدامها (بالإضافة إلى الأسماء البديلة).
    - `agents.defaults.imageModel` يُستخدم **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
    - `agents.defaults.pdfModel` تستخدمه أداة `pdf`. إذا حُذف، تعود الأداة إلى `agents.defaults.imageModel`، ثم النموذج المحلَّل للجلسة/الافتراضي.
    - `agents.defaults.imageGenerationModel` تستخدمه قدرة توليد الصور المشتركة. إذا حُذف، لا يزال بإمكان `image_generate` استنتاج مزود افتراضي مدعوم بالمصادقة. يجرب المزود الافتراضي الحالي أولًا، ثم بقية مزودي توليد الصور المسجلين بترتيب معرف المزود. إذا عيّنت مزودًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك المزود.
    - `agents.defaults.musicGenerationModel` تستخدمه قدرة توليد الموسيقى المشتركة. إذا حُذف، لا يزال بإمكان `music_generate` استنتاج مزود افتراضي مدعوم بالمصادقة. يجرب المزود الافتراضي الحالي أولًا، ثم بقية مزودي توليد الموسيقى المسجلين بترتيب معرف المزود. إذا عيّنت مزودًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك المزود.
    - `agents.defaults.videoGenerationModel` تستخدمه قدرة توليد الفيديو المشتركة. إذا حُذف، لا يزال بإمكان `video_generate` استنتاج مزود افتراضي مدعوم بالمصادقة. يجرب المزود الافتراضي الحالي أولًا، ثم بقية مزودي توليد الفيديو المسجلين بترتيب معرف المزود. إذا عيّنت مزودًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك المزود.
    - يمكن لإعدادات كل وكيل الافتراضية تجاوز `agents.defaults.model` عبر `agents.list[].model` مع الارتباطات (راجع [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## مصدر الاختيار وسلوك الاحتياط

يمكن أن يعني نفس `provider/model` أشياء مختلفة حسب مصدره:

- الإعدادات الافتراضية المضبوطة (`agents.defaults.model.primary` والنماذج الأساسية الخاصة بالوكلاء) هي نقطة البداية العادية وتستخدم `agents.defaults.model.fallbacks`.
- اختيارات الاحتياط التلقائية هي حالة استرداد مؤقتة. تُخزن مع `modelOverrideSource: "auto"` كي تتمكن الأدوار اللاحقة من الاستمرار في استخدام سلسلة الاحتياط دون اختبار نموذج أساسي معروف بأنه معطل أولًا.
- اختيارات جلسة المستخدم دقيقة. تخزن `/model`، ومنتقي النماذج، و`session_status(model=...)`، و`sessions.patch` القيمة `modelOverrideSource: "user"`؛ إذا تعذر الوصول إلى المزود/النموذج المحدد، يفشل OpenClaw بشكل ظاهر بدل الانتقال إلى نموذج آخر مضبوط.
- Cron `--model` / الحمولة `model` هو نموذج أساسي لكل مهمة. لا يزال يستخدم نماذج الاحتياط المضبوطة ما لم توفر المهمة حمولة `fallbacks` صريحة (استخدم `fallbacks: []` لتشغيل cron صارم).
- تحترم أدوات اختيار النموذج الافتراضي وقائمة السماح في CLI القيمة `models.mode: "replace"` من خلال سرد `models.providers.*.models` الصريحة بدل تحميل الفهرس المدمج الكامل.
- يطلب منتقي النماذج في واجهة التحكم من Gateway عرض النماذج المضبوط لديه: `agents.defaults.models` عند وجوده، وإلا `models.providers.*.models` الصريحة مع المزودين الذين لديهم مصادقة قابلة للاستخدام. يُحجز الفهرس المدمج الكامل لعروض التصفح الصريحة مثل `models.list` مع `view: "all"` أو `openclaw models list --all`.

## سياسة النماذج السريعة

- اضبط نموذجك الأساسي على أقوى نموذج من الجيل الأحدث متاح لك.
- استخدم نماذج الاحتياط للمهام الحساسة للتكلفة/زمن الاستجابة وللمحادثات منخفضة المخاطر.
- بالنسبة إلى الوكلاء الممكّنين بالأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## التهيئة الأولية (موصى بها)

إذا كنت لا تريد تحرير التكوين يدويًا، فشغّل التهيئة الأولية:

```bash
openclaw onboard
```

يمكنها إعداد النموذج + المصادقة للمزودين الشائعين، بما في ذلك **اشتراك OpenAI Code (Codex)** (OAuth) و**Anthropic** (مفتاح API أو Claude CLI).

## مفاتيح التكوين (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة السماح + الأسماء البديلة + معاملات المزود)
- `models.providers` (مزودون مخصصون مكتوبون في `models.json`)

<Note>
تُطبّع مراجع النماذج إلى أحرف صغيرة. تُطبّع الأسماء البديلة للمزودين مثل `z.ai/*` إلى `zai/*`.

توجد أمثلة تكوين المزودين (بما في ذلك OpenCode) في [OpenCode](/ar/providers/opencode).
</Note>

### تعديلات آمنة على قائمة السماح

استخدم عمليات كتابة إضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد الحماية من الاستبدال غير المقصود">
    يحمي `openclaw config set` خرائط النماذج/المزودين من الاستبدال غير المقصود. يُرفض إسناد كائن عادي إلى `agents.defaults.models` أو `models.providers` أو `models.providers.<id>.models` عندما يؤدي إلى إزالة إدخالات موجودة. استخدم `--merge` للتغييرات الإضافية؛ واستخدم `--replace` فقط عندما يجب أن تصبح القيمة المقدمة هي القيمة الهدف الكاملة.

    كما يدمج إعداد المزود التفاعلي و`openclaw configure --section model` الاختيارات محدودة النطاق بالمزود داخل قائمة السماح الموجودة، لذا فإن إضافة Codex أو Ollama أو مزود آخر لا تُسقط إدخالات النماذج غير ذات الصلة. يحافظ التكوين على `agents.defaults.model.primary` موجود عند إعادة تطبيق مصادقة المزود. ولا تزال أوامر ضبط الافتراضي الصريحة مثل `openclaw models auth login --provider <id> --set-default` و`openclaw models set <model>` تستبدل `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا ضُبط `agents.defaults.models`، فإنه يصبح **قائمة السماح** لـ `/model` ولتجاوزات الجلسة. عندما يختار مستخدم نموذجًا غير موجود في قائمة السماح تلك، يعيد OpenClaw:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
يحدث هذا **قبل** إنشاء رد عادي، لذلك قد تبدو الرسالة كأنها "لم تستجب". الحل هو أحد الخيارات التالية:

- إضافة النموذج إلى `agents.defaults.models`، أو
- مسح قائمة السماح (إزالة `agents.defaults.models`)، أو
- اختيار نموذج من `/model list`.

</Warning>

بالنسبة إلى النماذج المحلية/GGUF، خزّن المرجع الكامل المسبوق بالمزود في قائمة السماح،
على سبيل المثال `ollama/gemma4:26b` أو `lmstudio/Gemma4-26b-a4-it-gguf` أو
المزود/النموذج الدقيق الذي يعرضه `openclaw models list --provider <provider>`.
لا تكفي أسماء الملفات المحلية المجردة أو أسماء العرض عندما تكون قائمة السماح
نشطة.

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
    - `/model` (و`/model list`) هو منتقي موجز ومرقّم (عائلة النموذج + المزودون المتاحون).
    - على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يحتوي على قوائم منسدلة للمزود والنموذج بالإضافة إلى خطوة إرسال.
    - أصبح `/models add` مهملًا ويعيد الآن رسالة إهمال بدل تسجيل النماذج من المحادثة.
    - يختار `/model <#>` من ذلك المنتقي.

  </Accordion>
  <Accordion title="الاستمرارية والتبديل المباشر">
    - يحفظ `/model` اختيار الجلسة الجديد فورًا.
    - إذا كان الوكيل خاملًا، يستخدم التشغيل التالي النموذج الجديد مباشرة.
    - إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw علامة على التبديل المباشر باعتباره معلقًا ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا بدأ نشاط الأدوات أو خرج الرد بالفعل، يمكن أن يبقى التبديل المعلق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
    - مرجع `/model` الذي اختاره المستخدم صارم لتلك الجلسة: إذا تعذر الوصول إلى المزود/النموذج المحدد، يفشل الرد بشكل ظاهر بدل الإجابة بصمت من `agents.defaults.model.fallbacks`. يختلف هذا عن الإعدادات الافتراضية المضبوطة والنماذج الأساسية لمهام cron، التي يمكنها الاستمرار في استخدام سلاسل الاحتياط.
    - `/model status` هو العرض التفصيلي (مرشحو المصادقة، وعند الضبط، `baseUrl` لنقطة نهاية المزود + وضع `api`).

  </Accordion>
  <Accordion title="تحليل المرجع">
    - تُحلل مراجع النماذج بالتقسيم عند أول `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
    - إذا كان معرف النموذج نفسه يحتوي على `/` (بنمط OpenRouter)، فيجب تضمين بادئة المزود (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - إذا حذفت المزود، يحل OpenClaw الإدخال بهذا الترتيب:
      1. مطابقة الاسم البديل
      2. مطابقة مزود مضبوط فريدة لمعرف النموذج غير المسبوق نفسه
      3. احتياط مهمل إلى المزود الافتراضي المضبوط — إذا لم يعد ذلك المزود يعرض النموذج الافتراضي المضبوط، يعود OpenClaw بدلًا من ذلك إلى أول مزود/نموذج مضبوط لتجنب إظهار افتراضي قديم لمزود مُزال.
  </Accordion>
</AccordionGroup>

سلوك/تكوين الأمر الكامل: [أوامر الشرطة المائلة](/ar/tools/slash-commands).

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

`openclaw models` (دون أمر فرعي) اختصار لـ `models status`.

### `models list`

يعرض النماذج المضبوطة/المتاحة بالمصادقة افتراضيًا. علامات مفيدة:

<ParamField path="--all" type="boolean">
  الكتالوج الكامل. يتضمن صفوف الكتالوج الثابتة المضمّنة والمملوكة للمزوّد قبل إعداد المصادقة، بحيث يمكن لعروض الاكتشاف فقط إظهار نماذج غير متاحة حتى تضيف بيانات اعتماد المزوّد المطابقة.
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

يعرض النموذج الأساسي المحسوم، والبدائل الاحتياطية، ونموذج الصور، ونظرة عامة على مصادقة المزوّدين المكوّنين. كما يعرض حالة انتهاء صلاحية OAuth للملفات الشخصية الموجودة في مخزن المصادقة (يحذّر افتراضيًا ضمن 24 ساعة). يطبع `--plain` النموذج الأساسي المحسوم فقط.

<AccordionGroup>
  <Accordion title="سلوك المصادقة والفحص">
    - تُعرض حالة OAuth دائمًا (وتُضمَّن في خرج `--json`). إذا لم تكن لدى مزوّد مكوّن بيانات اعتماد، يطبع `models status` قسم **مصادقة مفقودة**.
    - يتضمن JSON ‏`auth.oauth` (نافذة التحذير + الملفات الشخصية) و`auth.providers` (المصادقة الفعلية لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة بمتغيرات البيئة). `auth.oauth` هو صحة ملفات مخزن المصادقة الشخصية فقط؛ لا تظهر فيه المزوّدات المعتمدة على متغيرات البيئة فقط.
    - استخدم `--check` للأتمتة (رمز الخروج `1` عند الفقدان/انتهاء الصلاحية، و`2` عند اقتراب انتهاء الصلاحية).
    - استخدم `--probe` لفحوصات المصادقة الحية؛ يمكن أن تأتي صفوف الفحص من ملفات المصادقة الشخصية، أو بيانات اعتماد البيئة، أو `models.json`.
    - إذا حذف `auth.order.<provider>` الصريح ملفًا شخصيًا مخزنًا، فسيبلغ الفحص عن `excluded_by_auth_order` بدلًا من تجربته. إذا كانت المصادقة موجودة لكن لا يمكن حسم نموذج قابل للفحص لذلك المزوّد، فسيبلغ الفحص عن `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
اختيار المصادقة يعتمد على المزوّد/الحساب. بالنسبة إلى مضيفات Gateway العاملة دائمًا، تكون مفاتيح API عادةً الأكثر قابلية للتنبؤ؛ كما يُدعم أيضًا إعادة استخدام Claude CLI وملفات OAuth/الرموز الحالية من Anthropic.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (نماذج OpenRouter المجانية)

يفحص `openclaw models scan` **كتالوج النماذج المجانية** في OpenRouter، ويمكنه اختياريًا فحص النماذج لدعم الأدوات والصور.

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
  مرشّح بادئة المزوّد.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  حجم قائمة البدائل الاحتياطية.
</ParamField>
<ParamField path="--set-default" type="boolean">
  اضبط `agents.defaults.model.primary` على الاختيار الأول.
</ParamField>
<ParamField path="--set-image" type="boolean">
  اضبط `agents.defaults.imageModel.primary` على أول اختيار للصور.
</ParamField>

<Note>
كتالوج OpenRouter ‏`/models` عام، لذا يمكن لعمليات الفحص المعتمدة على البيانات الوصفية فقط سرد المرشحين المجانيين بدون مفتاح. لا تزال الفحوصات والاستدلال تتطلب مفتاح OpenRouter API (من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY`). إذا لم يتوفر مفتاح، يعود `openclaw models scan` إلى خرج البيانات الوصفية فقط ويترك الإعدادات دون تغيير. استخدم `--no-probe` لطلب وضع البيانات الوصفية فقط صراحةً.
</Note>

تُرتَّب نتائج الفحص حسب:

1. دعم الصور
2. زمن استجابة الأدوات
3. حجم السياق
4. عدد المعلمات

الإدخال:

- قائمة OpenRouter ‏`/models` (مرشّح `:free`)
- تتطلب الفحوصات الحية مفتاح OpenRouter API من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY` (راجع [متغيرات البيئة](/ar/help/environment))
- المرشّحات الاختيارية: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- عناصر التحكم في الطلب/الفحص: `--timeout`، `--concurrency`

عند تشغيل الفحوصات الحية في TTY، يمكنك اختيار البدائل الاحتياطية تفاعليًا. في الوضع غير التفاعلي، مرّر `--yes` لقبول الإعدادات الافتراضية. نتائج البيانات الوصفية فقط معلوماتية؛ يتطلب `--set-default` و`--set-image` فحوصات حية حتى لا يكوّن OpenClaw نموذج OpenRouter غير قابل للاستخدام دون مفتاح.

## سجلّ النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن دليل الوكيل (الافتراضي `~/.openclaw/agents/<agentId>/agent/models.json`). يُدمج هذا الملف افتراضيًا ما لم يُضبط `models.mode` على `replace`.

<AccordionGroup>
  <Accordion title="أسبقية وضع الدمج">
    أسبقية وضع الدمج لمعرّفات المزوّدين المتطابقة:

    - يفوز `baseUrl` غير الفارغ الموجود مسبقًا في `models.json` الخاص بالوكيل.
    - يفوز `apiKey` غير الفارغ في `models.json` الخاص بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا بواسطة SecretRef في سياق الإعدادات/ملف المصادقة الشخصي الحالي.
    - تُحدَّث قيم `apiKey` للمزوّد المُدار بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلًا من حفظ الأسرار المحسومة.
    - تُحدَّث قيم ترويسات المزوّد المُدار بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
    - يعود `apiKey`/`baseUrl` الفارغ أو المفقود لدى الوكيل إلى `models.providers` في الإعدادات.
    - تُحدَّث حقول المزوّد الأخرى من الإعدادات وبيانات الكتالوج المطبّعة.

  </Accordion>
</AccordionGroup>

<Note>
استمرارية العلامات موثوقة من المصدر: يكتب OpenClaw العلامات من لقطة إعدادات المصدر النشطة (قبل الحسم)، وليس من قيم أسرار وقت التشغيل المحسومة. ينطبق هذا كلما أعاد OpenClaw توليد `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.
</Note>

## ذات صلة

- [أزمنة تشغيل الوكلاء](/ar/concepts/agent-runtimes) — Pi وCodex وأزمنة تشغيل حلقة الوكيل الأخرى
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — مفاتيح إعداد النماذج
- [توليد الصور](/ar/tools/image-generation) — إعداد نموذج الصور
- [تحويل النماذج عند الفشل](/ar/concepts/model-failover) — سلاسل البدائل الاحتياطية
- [مزوّدو النماذج](/ar/concepts/model-providers) — توجيه المزوّدين والمصادقة
- [توليد الموسيقى](/ar/tools/music-generation) — إعداد نموذج الموسيقى
- [توليد الفيديو](/ar/tools/video-generation) — إعداد نموذج الفيديو
