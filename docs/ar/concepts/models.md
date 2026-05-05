---
read_when:
    - إضافة أو تعديل CLI النماذج (models list/set/scan/aliases/fallbacks)
    - تغيير سلوك الرجوع الاحتياطي للنموذج أو تجربة مستخدم الاختيار
    - تحديث مجسات فحص النماذج (الأدوات/الصور)
sidebarTitle: Models CLI
summary: 'CLI للنماذج: السرد، التعيين، الأسماء المستعارة، البدائل الاحتياطية، الفحص، الحالة'
title: CLI للنماذج
x-i18n:
    generated_at: "2026-05-05T01:45:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a1dcdb046b914d35513974d4b69fec03a415118d11860dd1c5107efc754ed4f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="تجاوز فشل النموذج" href="/ar/concepts/model-failover">
    تدوير ملف تعريف المصادقة، وفترات التهدئة، وكيفية تفاعل ذلك مع الاحتياطيات.
  </Card>
  <Card title="موفرو النماذج" href="/ar/concepts/model-providers">
    نظرة عامة سريعة على الموفرين وأمثلة.
  </Card>
  <Card title="بيئات تشغيل الوكلاء" href="/ar/concepts/agent-runtimes">
    Pi وCodex وبيئات تشغيل حلقات وكلاء أخرى.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults">
    مفاتيح إعدادات النموذج.
  </Card>
</CardGroup>

تختار مراجع النماذج موفرًا ونموذجًا. وهي لا تختار عادةً بيئة تشغيل الوكيل منخفضة المستوى. على سبيل المثال، يمكن تشغيل `openai/gpt-5.5` عبر مسار موفر OpenAI العادي أو عبر بيئة تشغيل خادم تطبيق Codex، حسب `agents.defaults.agentRuntime.id`. في وضع بيئة تشغيل Codex، لا يعني المرجع `openai/gpt-*` فوترة بمفتاح API؛ يمكن أن تأتي المصادقة من حساب Codex أو ملف تعريف مصادقة `openai-codex`. راجع [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

<Steps>
  <Step title="النموذج الأساسي">
    `agents.defaults.model.primary` (أو `agents.defaults.model`).
  </Step>
  <Step title="الاحتياطيات">
    `agents.defaults.model.fallbacks` (بالترتيب).
  </Step>
  <Step title="تجاوز فشل مصادقة الموفر">
    يحدث تجاوز فشل المصادقة داخل الموفر قبل الانتقال إلى النموذج التالي.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="أسطح النماذج ذات الصلة">
    - `agents.defaults.models` هي قائمة السماح/الفهرس للنماذج التي يمكن لـ OpenClaw استخدامها (إضافةً إلى الأسماء المستعارة).
    - يُستخدم `agents.defaults.imageModel` **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
    - يستخدم أداة `pdf` المفتاح `agents.defaults.pdfModel`. إذا حُذف، تعود الأداة إلى `agents.defaults.imageModel`، ثم إلى نموذج الجلسة/الافتراضي الذي تم حله.
    - يستخدم `agents.defaults.imageGenerationModel` من قِبل قدرة توليد الصور المشتركة. إذا حُذف، فلا يزال بإمكان `image_generate` استنتاج افتراضي موفر مدعوم بالمصادقة. يحاول الموفر الافتراضي الحالي أولًا، ثم بقية موفري توليد الصور المسجلين بترتيب معرّف الموفر. إذا عيّنت موفرًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك الموفر.
    - يستخدم `agents.defaults.musicGenerationModel` من قِبل قدرة توليد الموسيقى المشتركة. إذا حُذف، فلا يزال بإمكان `music_generate` استنتاج افتراضي موفر مدعوم بالمصادقة. يحاول الموفر الافتراضي الحالي أولًا، ثم بقية موفري توليد الموسيقى المسجلين بترتيب معرّف الموفر. إذا عيّنت موفرًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك الموفر.
    - يستخدم `agents.defaults.videoGenerationModel` من قِبل قدرة توليد الفيديو المشتركة. إذا حُذف، فلا يزال بإمكان `video_generate` استنتاج افتراضي موفر مدعوم بالمصادقة. يحاول الموفر الافتراضي الحالي أولًا، ثم بقية موفري توليد الفيديو المسجلين بترتيب معرّف الموفر. إذا عيّنت موفرًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك الموفر.
    - يمكن للافتراضيات الخاصة بكل وكيل تجاوز `agents.defaults.model` عبر `agents.list[].model` إضافةً إلى الربط (راجع [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## مصدر الاختيار وسلوك الاحتياطي

يمكن أن يعني `provider/model` نفسه أشياء مختلفة حسب مصدره:

- الافتراضيات المضبوطة (`agents.defaults.model.primary` والنماذج الأساسية الخاصة بالوكلاء) هي نقطة البدء العادية وتستخدم `agents.defaults.model.fallbacks`.
- اختيارات الاحتياطي التلقائية هي حالة تعافٍ مؤقتة. تُخزن مع `modelOverrideSource: "auto"` حتى تتمكن الأدوار اللاحقة من مواصلة استخدام سلسلة الاحتياطيات بدون اختبار نموذج أساسي معروف التعطل أولًا.
- اختيارات جلسة المستخدم دقيقة. يخزن `/model`، ومنتقي النموذج، و`session_status(model=...)`، و`sessions.patch` القيمة `modelOverrideSource: "user"`؛ وإذا تعذر الوصول إلى ذلك الموفر/النموذج المحدد، يفشل OpenClaw بوضوح بدلًا من الانتقال إلى نموذج مضبوط آخر.
- يُعد Cron `--model` / حمولة `model` نموذجًا أساسيًا لكل مهمة. ولا يزال يستخدم الاحتياطيات المضبوطة ما لم توفر المهمة حمولة `fallbacks` صريحة (استخدم `fallbacks: []` لتشغيل cron صارم).
- تحترم منتقيات النموذج الافتراضي وقائمة السماح في CLI القيمة `models.mode: "replace"` عبر سرد `models.providers.*.models` الصريحة بدلًا من تحميل الفهرس المضمّن الكامل.
- يطلب منتقي النموذج في واجهة التحكم من Gateway عرض النموذج المضبوط لديه: `agents.defaults.models` عند وجوده، وإلا `models.providers.*.models` الصريحة إضافةً إلى الموفرين ذوي المصادقة القابلة للاستخدام. الفهرس المضمّن الكامل محجوز لعروض التصفح الصريحة مثل `models.list` مع `view: "all"` أو `openclaw models list --all`.

## سياسة نموذج سريعة

- اضبط نموذجك الأساسي على أقوى نموذج من أحدث جيل متاح لك.
- استخدم الاحتياطيات للمهام الحساسة للتكلفة/زمن الاستجابة والدردشة منخفضة المخاطر.
- للوكلاء الممكّنين بالأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا كنت لا تريد تعديل الإعدادات يدويًا، فشغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة للموفرين الشائعين، بما في ذلك **اشتراك OpenAI Code (Codex)** (OAuth) و**Anthropic** (مفتاح API أو Claude CLI).

## مفاتيح الإعدادات (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة السماح + الأسماء المستعارة + معاملات الموفر)
- `models.providers` (موفرون مخصصون مكتوبون في `models.json`)

<Note>
تُطبّع مراجع النماذج إلى أحرف صغيرة. تُطبّع الأسماء المستعارة للموفر مثل `z.ai/*` إلى `zai/*`.

توجد أمثلة إعداد الموفرين (بما في ذلك OpenCode) في [OpenCode](/ar/providers/opencode).
</Note>

### تعديلات آمنة على قائمة السماح

استخدم عمليات كتابة إضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد الحماية من الاستبدال غير المقصود">
    يحمي `openclaw config set` خرائط النماذج/الموفرين من الاستبدال غير المقصود. يُرفض إسناد كائن عادي إلى `agents.defaults.models` أو `models.providers` أو `models.providers.<id>.models` عندما يؤدي إلى إزالة إدخالات موجودة. استخدم `--merge` للتغييرات الإضافية؛ واستخدم `--replace` فقط عندما يجب أن تصبح القيمة المقدمة هي قيمة الهدف الكاملة.

    يدمج إعداد الموفر التفاعلي و`openclaw configure --section model` أيضًا الاختيارات محددة النطاق بالموفر في قائمة السماح الحالية، لذا فإن إضافة Codex أو Ollama أو موفر آخر لا تُسقط إدخالات نماذج غير مرتبطة. يحافظ Configure على `agents.defaults.model.primary` موجود عند إعادة تطبيق مصادقة الموفر. أما أوامر تعيين الافتراضي الصريحة مثل `openclaw models auth login --provider <id> --set-default` و`openclaw models set <model>` فلا تزال تستبدل `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا كان `agents.defaults.models` مضبوطًا، فإنه يصبح **قائمة السماح** لـ `/model` ولتجاوزات الجلسة. عندما يختار مستخدم نموذجًا غير موجود في قائمة السماح تلك، يعيد OpenClaw:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
يحدث هذا **قبل** إنشاء رد عادي، لذلك قد تبدو الرسالة وكأنها "لم ترد". يكون الإصلاح بأحد الخيارات التالية:

- إضافة النموذج إلى `agents.defaults.models`، أو
- مسح قائمة السماح (إزالة `agents.defaults.models`)، أو
- اختيار نموذج من `/model list`.

</Warning>

عندما يتضمن الأمر المرفوض تجاوزًا لبيئة التشغيل مثل `/model openai/gpt-5.5 --runtime codex`، أصلح قائمة السماح أولًا، ثم أعد محاولة أمر `/model ... --runtime ...` نفسه. بالنسبة لتنفيذ Codex الأصلي، يظل النموذج المحدد `openai/gpt-5.5`؛ وتختار بيئة التشغيل `codex` الحاضنة وتستخدم مصادقة Codex بشكل منفصل.

بالنسبة إلى النماذج المحلية/GGUF، خزّن المرجع الكامل المسبوق بالموفر في قائمة السماح،
على سبيل المثال `ollama/gemma4:26b` أو `lmstudio/Gemma4-26b-a4-it-gguf` أو
الموفر/النموذج الدقيق المعروض بواسطة `openclaw models list --provider <provider>`.
أسماء الملفات المحلية المجردة أو أسماء العرض لا تكفي عندما تكون قائمة السماح
نشطة.

مثال إعداد قائمة السماح:

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

يمكنك تبديل النماذج للجلسة الحالية بدون إعادة التشغيل:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="سلوك المنتقي">
    - `/model` (و`/model list`) هو منتقي مدمج مرقم (عائلة النموذج + الموفرون المتاحون).
    - على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للموفر والنموذج إضافةً إلى خطوة إرسال.
    - على Telegram، تكون اختيارات منتقي `/models` محددة النطاق بالجلسة؛ ولا تغيّر الافتراضي الدائم للوكيل في `openclaw.json`.
    - أصبح `/models add` مهملًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من الدردشة.
    - يختار `/model <#>` من ذلك المنتقي.

  </Accordion>
  <Accordion title="الاستمرارية والتبديل الحي">
    - يحفظ `/model` اختيار الجلسة الجديد فورًا.
    - إذا كان الوكيل خاملًا، يستخدم التشغيل التالي النموذج الجديد مباشرة.
    - إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw علامة على تبديل حي باعتباره معلقًا ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا كان نشاط الأداة أو إخراج الرد قد بدأ بالفعل، فقد يبقى التبديل المعلق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
    - يكون مرجع `/model` المحدد من المستخدم صارمًا لتلك الجلسة: إذا تعذر الوصول إلى الموفر/النموذج المحدد، يفشل الرد بوضوح بدلًا من الإجابة بصمت من `agents.defaults.model.fallbacks`. يختلف ذلك عن الافتراضيات المضبوطة والنماذج الأساسية لمهام cron، التي لا يزال بإمكانها استخدام سلاسل الاحتياطيات.
    - `/model status` هو العرض التفصيلي (مرشحو المصادقة، وعند الضبط، نقطة نهاية الموفر `baseUrl` + وضع `api`).

  </Accordion>
  <Accordion title="تحليل المرجع">
    - تُحلل مراجع النماذج بالتقسيم عند **أول** `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
    - إذا كان معرّف النموذج نفسه يحتوي على `/` (بنمط OpenRouter)، فيجب تضمين بادئة الموفر (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - إذا حذفت الموفر، يحل OpenClaw الإدخال بهذا الترتيب:
      1. تطابق الاسم المستعار
      2. تطابق موفر مضبوط فريد لمعرّف النموذج غير المسبوق ذلك بالضبط
      3. احتياطي مهمل إلى الموفر الافتراضي المضبوط — إذا لم يعد ذلك الموفر يعرض النموذج الافتراضي المضبوط، فإن OpenClaw يعود بدلًا من ذلك إلى أول موفر/نموذج مضبوط لتجنب إظهار افتراضي موفر أزيل وأصبح قديمًا.
  </Accordion>
</AccordionGroup>

سلوك الأمر/الإعدادات الكامل: [أوامر Slash](/ar/tools/slash-commands).

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

يعرض النماذج المهيأة/المتاحة للمصادقة افتراضياً. علامات مفيدة:

<ParamField path="--all" type="boolean">
  الكتالوج الكامل. يتضمن صفوف كتالوج ثابتة مضمّنة ومملوكة للمزوّد قبل تهيئة المصادقة، بحيث يمكن لعروض الاكتشاف فقط عرض النماذج غير المتاحة حتى تضيف بيانات اعتماد المزوّد المطابقة.
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
  مخرجات قابلة للقراءة آلياً.
</ParamField>

### `models status`

يعرض النموذج الأساسي المحلول، والنماذج الاحتياطية، ونموذج الصور، ونظرة عامة على مصادقة المزوّدين المهيأين. كما يعرض حالة انتهاء صلاحية OAuth للملفات الشخصية الموجودة في مخزن المصادقة (يحذّر خلال 24 ساعة افتراضياً). يطبع `--plain` النموذج الأساسي المحلول فقط.

<AccordionGroup>
  <Accordion title="سلوك المصادقة والفحص">
    - تُعرض حالة OAuth دائماً (وتُدرج في مخرجات `--json`). إذا لم تكن لدى مزوّد مهيأ أي بيانات اعتماد، يطبع `models status` قسم **مصادقة مفقودة**.
    - يتضمن JSON كلاً من `auth.oauth` (نافذة التحذير + الملفات الشخصية) و`auth.providers` (المصادقة الفعلية لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة بمتغيرات البيئة). `auth.oauth` يعرض سلامة ملفات مخزن المصادقة الشخصية فقط؛ ولا تظهر فيه المزوّدات المعتمدة على البيئة فقط.
    - استخدم `--check` للأتمتة (رمز الخروج `1` عند الفقدان/انتهاء الصلاحية، و`2` عند قرب انتهاء الصلاحية).
    - استخدم `--probe` لفحوصات المصادقة الحية؛ يمكن أن تأتي صفوف الفحص من ملفات المصادقة الشخصية، أو بيانات اعتماد البيئة، أو `models.json`.
    - إذا كان `auth.order.<provider>` الصريح يحذف ملفاً شخصياً مخزناً، يبلّغ الفحص عن `excluded_by_auth_order` بدلاً من محاولة استخدامه. إذا كانت المصادقة موجودة ولكن لا يمكن حل نموذج قابل للفحص لذلك المزوّد، يبلّغ الفحص عن `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
يعتمد اختيار المصادقة على المزوّد/الحساب. لمضيفي Gateway العاملين دائماً، تكون مفاتيح API عادةً الأكثر قابلية للتنبؤ؛ كما يُدعم أيضاً إعادة استخدام Claude CLI وملفات OAuth/الرموز الحالية من Anthropic.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (نماذج OpenRouter المجانية)

يفحص `openclaw models scan` **كتالوج النماذج المجانية** في OpenRouter ويمكنه اختيارياً فحص النماذج لدعم الأدوات والصور.

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
  حجم قائمة الاحتياط.
</ParamField>
<ParamField path="--set-default" type="boolean">
  اضبط `agents.defaults.model.primary` على الاختيار الأول.
</ParamField>
<ParamField path="--set-image" type="boolean">
  اضبط `agents.defaults.imageModel.primary` على اختيار الصورة الأول.
</ParamField>

<Note>
كتالوج OpenRouter `/models` عام، لذا يمكن للفحوصات المعتمدة على البيانات الوصفية فقط إدراج المرشحين المجانيين من دون مفتاح. لا تزال الفحوصات والاستدلال تتطلب مفتاح OpenRouter API (من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY`). إذا لم يتوفر مفتاح، يعود `openclaw models scan` إلى مخرجات البيانات الوصفية فقط ويترك الإعدادات دون تغيير. استخدم `--no-probe` لطلب وضع البيانات الوصفية فقط صراحةً.
</Note>

تُرتّب نتائج الفحص حسب:

1. دعم الصور
2. زمن استجابة الأدوات
3. حجم السياق
4. عدد المعلمات

الإدخال:

- قائمة OpenRouter `/models` (مرشح `:free`)
- تتطلب الفحوصات الحية مفتاح OpenRouter API من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY` (راجع [متغيرات البيئة](/ar/help/environment))
- مرشحات اختيارية: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- عناصر التحكم في الطلب/الفحص: `--timeout`، `--concurrency`

عند تشغيل الفحوصات الحية في TTY، يمكنك تحديد النماذج الاحتياطية تفاعلياً. في الوضع غير التفاعلي، مرّر `--yes` لقبول الإعدادات الافتراضية. نتائج البيانات الوصفية فقط معلوماتية؛ يتطلب `--set-default` و`--set-image` فحوصات حية حتى لا يهيئ OpenClaw نموذج OpenRouter غير قابل للاستخدام بلا مفتاح.

## سجل النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن دليل الوكيل (افتراضياً `~/.openclaw/agents/<agentId>/agent/models.json`). يُدمج هذا الملف افتراضياً ما لم يُضبط `models.mode` على `replace`.

<AccordionGroup>
  <Accordion title="أسبقية وضع الدمج">
    أسبقية وضع الدمج لمعرّفات المزوّدين المطابقة:

    - يفوز `baseUrl` غير الفارغ الموجود مسبقاً في `models.json` الخاص بالوكيل.
    - يفوز `apiKey` غير الفارغ في `models.json` الخاص بالوكيل فقط عندما لا يكون ذلك المزوّد مُداراً بواسطة SecretRef في سياق الإعداد/ملف المصادقة الشخصي الحالي.
    - تُحدّث قيم `apiKey` للمزوّد المُدار بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلاً من الاحتفاظ بالأسرار المحلولة.
    - تُحدّث قيم ترويسات المزوّد المُدار بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
    - يعود `apiKey`/`baseUrl` الفارغ أو المفقود لدى الوكيل إلى `models.providers` في الإعدادات.
    - تُحدّث حقول المزوّد الأخرى من الإعدادات وبيانات الكتالوج المطبّعة.

  </Accordion>
</AccordionGroup>

<Note>
استمرارية العلامات معتمدة على المصدر: يكتب OpenClaw العلامات من لقطة إعدادات المصدر النشطة (قبل الحل)، لا من قيم أسرار وقت التشغيل المحلولة. ينطبق ذلك كلما أعاد OpenClaw توليد `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.
</Note>

## ذات صلة

- [أزمنة تشغيل الوكلاء](/ar/concepts/agent-runtimes) — PI وCodex وأزمنة تشغيل حلقات وكلاء أخرى
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — مفاتيح إعدادات النماذج
- [توليد الصور](/ar/tools/image-generation) — إعداد نموذج الصور
- [تجاوز فشل النماذج](/ar/concepts/model-failover) — سلاسل الاحتياط
- [مزوّدو النماذج](/ar/concepts/model-providers) — توجيه المزوّدين والمصادقة
- [توليد الموسيقى](/ar/tools/music-generation) — إعداد نموذج الموسيقى
- [توليد الفيديو](/ar/tools/video-generation) — إعداد نموذج الفيديو
