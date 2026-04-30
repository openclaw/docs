---
read_when:
    - إضافة واجهة CLI للنماذج أو تعديلها (models list/set/scan/aliases/fallbacks)
    - تغيير سلوك الرجوع إلى نموذج بديل أو تجربة اختيار النموذج
    - تحديث مجسات فحص النماذج (الأدوات/الصور)
sidebarTitle: Models CLI
summary: 'واجهة CLI للنماذج: عرض القائمة، التعيين، الأسماء المستعارة، البدائل الاحتياطية، الفحص، الحالة'
title: CLI للنماذج
x-i18n:
    generated_at: "2026-04-30T07:53:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64b97ddfcc6f804044580dfc9a441d426f737e9e7d007d78b0b045a52068b34f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="التبديل الاحتياطي للنموذج" href="/ar/concepts/model-failover">
    تدوير ملف تعريف المصادقة، وفترات التهدئة، وكيفية تفاعل ذلك مع البدائل الاحتياطية.
  </Card>
  <Card title="مزودو النماذج" href="/ar/concepts/model-providers">
    نظرة عامة سريعة على المزود مع أمثلة.
  </Card>
  <Card title="بيئات تشغيل الوكلاء" href="/ar/concepts/agent-runtimes">
    PI، وCodex، وبيئات تشغيل حلقات الوكلاء الأخرى.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/config-agents#agent-defaults">
    مفاتيح تكوين النموذج.
  </Card>
</CardGroup>

تختار مراجع النماذج مزودًا ونموذجًا. وهي لا تختار عادةً بيئة تشغيل الوكيل منخفضة المستوى. على سبيل المثال، يمكن تشغيل `openai/gpt-5.5` عبر مسار مزود OpenAI العادي أو عبر بيئة تشغيل خادم تطبيق Codex، وذلك حسب `agents.defaults.agentRuntime.id`. راجع [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

<Steps>
  <Step title="النموذج الأساسي">
    `agents.defaults.model.primary` (أو `agents.defaults.model`).
  </Step>
  <Step title="البدائل الاحتياطية">
    `agents.defaults.model.fallbacks` (بالترتيب).
  </Step>
  <Step title="التبديل الاحتياطي لمصادقة المزود">
    يحدث التبديل الاحتياطي للمصادقة داخل المزود قبل الانتقال إلى النموذج التالي.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="واجهات النماذج ذات الصلة">
    - `agents.defaults.models` هي قائمة السماح/الفهرس للنماذج التي يستطيع OpenClaw استخدامها (بالإضافة إلى الأسماء المستعارة).
    - يُستخدم `agents.defaults.imageModel` **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
    - تُستخدم `agents.defaults.pdfModel` بواسطة أداة `pdf`. إذا أُهملت، تعود الأداة إلى `agents.defaults.imageModel`، ثم إلى نموذج الجلسة/الافتراضي المحسوم.
    - تُستخدم `agents.defaults.imageGenerationModel` بواسطة قدرة توليد الصور المشتركة. إذا أُهملت، يمكن لـ `image_generate` مع ذلك استنتاج افتراضي مزود مدعوم بالمصادقة. يحاول أولًا مزود الافتراضي الحالي، ثم بقية مزودي توليد الصور المسجلين بترتيب معرف المزود. إذا عيّنت مزودًا/نموذجًا محددًا، فكوّن أيضًا مصادقة/مفتاح API لذلك المزود.
    - تُستخدم `agents.defaults.musicGenerationModel` بواسطة قدرة توليد الموسيقى المشتركة. إذا أُهملت، يمكن لـ `music_generate` مع ذلك استنتاج افتراضي مزود مدعوم بالمصادقة. يحاول أولًا مزود الافتراضي الحالي، ثم بقية مزودي توليد الموسيقى المسجلين بترتيب معرف المزود. إذا عيّنت مزودًا/نموذجًا محددًا، فكوّن أيضًا مصادقة/مفتاح API لذلك المزود.
    - تُستخدم `agents.defaults.videoGenerationModel` بواسطة قدرة توليد الفيديو المشتركة. إذا أُهملت، يمكن لـ `video_generate` مع ذلك استنتاج افتراضي مزود مدعوم بالمصادقة. يحاول أولًا مزود الافتراضي الحالي، ثم بقية مزودي توليد الفيديو المسجلين بترتيب معرف المزود. إذا عيّنت مزودًا/نموذجًا محددًا، فكوّن أيضًا مصادقة/مفتاح API لذلك المزود.
    - يمكن لافتراضيات كل وكيل تجاوز `agents.defaults.model` عبر `agents.list[].model` بالإضافة إلى الربط (راجع [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## مصدر الاختيار وسلوك البدائل الاحتياطية

يمكن أن يعني نفس `provider/model` أشياء مختلفة بحسب مصدره:

- الافتراضيات المكوّنة (`agents.defaults.model.primary` والنماذج الأساسية الخاصة بالوكلاء) هي نقطة البدء العادية وتستخدم `agents.defaults.model.fallbacks`.
- اختيارات البديل الاحتياطي التلقائية هي حالة استرداد مؤقتة. تُخزن مع `modelOverrideSource: "auto"` كي تتمكن الأدوار اللاحقة من متابعة استخدام سلسلة البدائل الاحتياطية دون اختبار نموذج أساسي معروف الفشل أولًا.
- اختيارات جلسة المستخدم دقيقة. تخزن `/model`، ومنتقي النموذج، و`session_status(model=...)`، و`sessions.patch` القيمة `modelOverrideSource: "user"`؛ إذا تعذر الوصول إلى ذلك المزود/النموذج المحدد، يفشل OpenClaw بشكل ظاهر بدل الانتقال إلى نموذج مكوّن آخر.
- يكون Cron `--model` / الحمولة `model` نموذجًا أساسيًا لكل مهمة. ولا يزال يستخدم البدائل الاحتياطية المكوّنة ما لم توفر المهمة حمولة `fallbacks` صريحة (استخدم `fallbacks: []` لتشغيل cron صارم).
- تحترم منتقيات النموذج الافتراضي وقائمة السماح في CLI الإعداد `models.mode: "replace"` عبر عرض `models.providers.*.models` الصريحة بدل تحميل الفهرس المدمج الكامل.
- يطلب منتقي النموذج في واجهة التحكم من Gateway عرض النموذج المكوّن لديه: `agents.defaults.models` عند وجوده، وإلا `models.providers.*.models` الصريحة بالإضافة إلى المزودين ذوي المصادقة القابلة للاستخدام. يُحجز الفهرس المدمج الكامل لعروض التصفح الصريحة مثل `models.list` مع `view: "all"` أو `openclaw models list --all`.

## سياسة نموذج سريعة

- عيّن النموذج الأساسي إلى أقوى نموذج من الجيل الأحدث المتاح لك.
- استخدم البدائل الاحتياطية للمهام الحساسة للتكلفة/زمن الاستجابة وللدردشة الأقل خطورة.
- للوكلاء الممكّنين بالأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا كنت لا تريد تعديل التكوين يدويًا، فشغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة للمزودين الشائعين، بما في ذلك **اشتراك OpenAI Code (Codex)** (OAuth) و**Anthropic** (مفتاح API أو Claude CLI).

## مفاتيح التكوين (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة السماح + الأسماء المستعارة + معاملات المزود)
- `models.providers` (مزودون مخصصون يُكتبون في `models.json`)

<Note>
تُطبّع مراجع النماذج إلى أحرف صغيرة. تُطبّع الأسماء المستعارة للمزودين مثل `z.ai/*` إلى `zai/*`.

توجد أمثلة تكوين المزودين (بما في ذلك OpenCode) في [OpenCode](/ar/providers/opencode).
</Note>

### تعديلات آمنة لقائمة السماح

استخدم الكتابات الإضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد الحماية من الاستبدال غير المقصود">
    يحمي `openclaw config set` خرائط النماذج/المزودين من الاستبدال العرضي. يُرفض تعيين كائن عادي إلى `agents.defaults.models` أو `models.providers` أو `models.providers.<id>.models` عندما يؤدي إلى إزالة إدخالات موجودة. استخدم `--merge` للتغييرات الإضافية؛ واستخدم `--replace` فقط عندما يجب أن تصبح القيمة المقدمة هي قيمة الهدف الكاملة.

    يدمج إعداد المزود التفاعلي و`openclaw configure --section model` أيضًا الاختيارات ذات نطاق المزود في قائمة السماح الحالية، لذا فإن إضافة Codex أو Ollama أو مزود آخر لا تُسقط إدخالات النماذج غير ذات الصلة. يحافظ Configure على `agents.defaults.model.primary` موجود عند إعادة تطبيق مصادقة المزود. أما أوامر تعيين الافتراضي الصريحة مثل `openclaw models auth login --provider <id> --set-default` و`openclaw models set <model>` فما تزال تستبدل `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا عُيّنت `agents.defaults.models`، فإنها تصبح **قائمة السماح** لـ `/model` ولتجاوزات الجلسة. عندما يختار مستخدم نموذجًا غير موجود في قائمة السماح تلك، يعيد OpenClaw:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
يحدث هذا **قبل** توليد رد عادي، لذا قد تبدو الرسالة كما لو أنها "لم تستجب". الحل هو أحد الخيارات التالية:

- إضافة النموذج إلى `agents.defaults.models`، أو
- مسح قائمة السماح (إزالة `agents.defaults.models`)، أو
- اختيار نموذج من `/model list`.

</Warning>

بالنسبة إلى النماذج المحلية/GGUF، خزّن المرجع الكامل المسبوق بالمزود في قائمة السماح،
مثل `ollama/gemma4:26b` أو `lmstudio/Gemma4-26b-a4-it-gguf` أو
المزود/النموذج الدقيق الذي يعرضه `openclaw models list --provider <provider>`.
لا تكفي أسماء الملفات المحلية العارية أو أسماء العرض عندما تكون قائمة السماح
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
    - أصبح `/models add` مهملاً ويعيد الآن رسالة إهمال بدل تسجيل النماذج من الدردشة.
    - يختار `/model <#>` من ذلك المنتقي.

  </Accordion>
  <Accordion title="الاستمرارية والتبديل الحي">
    - يحفظ `/model` اختيار الجلسة الجديد فورًا.
    - إذا كان الوكيل خاملاً، يستخدم التشغيل التالي النموذج الجديد مباشرة.
    - إذا كان التشغيل نشطًا بالفعل، يضع OpenClaw علامة على التبديل الحي باعتباره معلقًا ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا بدأ نشاط الأداة أو إخراج الرد بالفعل، فقد يظل التبديل المعلق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
    - يكون مرجع `/model` الذي يختاره المستخدم صارمًا لتلك الجلسة: إذا تعذر الوصول إلى المزود/النموذج المحدد، يفشل الرد بشكل ظاهر بدل الإجابة بصمت من `agents.defaults.model.fallbacks`. يختلف هذا عن الافتراضيات المكوّنة والنماذج الأساسية لمهام cron، التي لا تزال تستطيع استخدام سلاسل البدائل الاحتياطية.
    - `/model status` هو العرض التفصيلي (مرشحو المصادقة، وعند التكوين، `baseUrl` لنقطة نهاية المزود + وضع `api`).

  </Accordion>
  <Accordion title="تحليل المرجع">
    - تُحلل مراجع النماذج بالتقسيم عند أول `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
    - إذا كان معرف النموذج نفسه يحتوي على `/` (بأسلوب OpenRouter)، فيجب تضمين بادئة المزود (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - إذا حذفت المزود، يحسم OpenClaw الإدخال بهذا الترتيب:
      1. مطابقة الاسم المستعار
      2. مطابقة مزود مكوّن فريدة لذلك المعرف غير المسبوق للموديل بالضبط
      3. بديل احتياطي مهمل إلى المزود الافتراضي المكوّن — إذا لم يعد ذلك المزود يعرّض النموذج الافتراضي المكوّن، ينتقل OpenClaw بدلًا من ذلك إلى أول مزود/نموذج مكوّن لتجنب إظهار افتراضي مزود مُزال وقديم.
  </Accordion>
</AccordionGroup>

سلوك الأمر/التكوين الكامل: [أوامر الشرطة المائلة](/ar/tools/slash-commands).

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

`openclaw models` (بلا أمر فرعي) هو اختصار لـ `models status`.

### `models list`

يعرض النماذج المكوّنة/المتاحة بالمصادقة افتراضيًا. الأعلام المفيدة:

<ParamField path="--all" type="boolean">
  الفهرس الكامل. يتضمن صفوف الفهرس الثابتة المدمجة التي يملكها المزود قبل تكوين المصادقة، لذلك يمكن لعروض الاكتشاف فقط عرض النماذج غير المتاحة إلى أن تضيف بيانات اعتماد المزود المطابقة.
</ParamField>
<ParamField path="--local" type="boolean">
  المزودون المحليون فقط.
</ParamField>
<ParamField path="--provider <id>" type="string">
  التصفية حسب معرف المزود، مثل `moonshot`. لا تُقبل تسميات العرض من المنتقيات التفاعلية.
</ParamField>
<ParamField path="--plain" type="boolean">
  نموذج واحد في كل سطر.
</ParamField>
<ParamField path="--json" type="boolean">
  إخراج قابل للقراءة آليًا.
</ParamField>

### `models status`

يعرض النموذج الأساسي الذي تم حله، والنماذج الاحتياطية، ونموذج الصور، ونظرة عامة على المصادقة للمزوّدين المهيّئين. كما يعرض حالة انتهاء OAuth للملفات الشخصية الموجودة في مخزن المصادقة (يحذّر افتراضيًا خلال 24 ساعة). يطبع `--plain` النموذج الأساسي الذي تم حله فقط.

<AccordionGroup>
  <Accordion title="سلوك المصادقة والفحص">
    - تُعرض حالة OAuth دائمًا (وتُضمّن في مخرجات `--json`). إذا لم تكن لدى مزوّد مهيّأ بيانات اعتماد، يطبع `models status` قسم **مصادقة مفقودة**.
    - تتضمن JSON الحقل `auth.oauth` (نافذة التحذير + الملفات الشخصية) والحقل `auth.providers` (المصادقة الفعلية لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة من البيئة). يمثل `auth.oauth` صحة الملفات الشخصية في مخزن المصادقة فقط؛ ولا تظهر هناك المزوّدات المعتمدة على البيئة فقط.
    - استخدم `--check` للأتمتة (الخروج بالقيمة `1` عند الفقدان/الانتهاء، و`2` عند قرب الانتهاء).
    - استخدم `--probe` لفحوصات المصادقة الحية؛ يمكن أن تأتي صفوف الفحص من ملفات المصادقة الشخصية، أو بيانات اعتماد البيئة، أو `models.json`.
    - إذا حذف `auth.order.<provider>` الصريح ملفًا شخصيًا مخزنًا، يبلّغ الفحص عن `excluded_by_auth_order` بدلًا من تجربته. إذا كانت المصادقة موجودة لكن لا يمكن حل نموذج قابل للفحص لذلك المزوّد، يبلّغ الفحص عن `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
يعتمد اختيار المصادقة على المزوّد/الحساب. بالنسبة إلى مضيفي Gateway الدائمين، تكون مفاتيح API عادةً الأكثر قابلية للتنبؤ؛ كما يُدعم أيضًا إعادة استخدام Claude CLI وملفات Anthropic OAuth/token الشخصية الموجودة.
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
  الحد الأدنى لحجم المعاملات (بالمليارات).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  تخطَّ النماذج الأقدم.
</ParamField>
<ParamField path="--provider <name>" type="string">
  مرشّح بادئة المزوّد.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  حجم قائمة النماذج الاحتياطية.
</ParamField>
<ParamField path="--set-default" type="boolean">
  عيّن `agents.defaults.model.primary` إلى أول اختيار.
</ParamField>
<ParamField path="--set-image" type="boolean">
  عيّن `agents.defaults.imageModel.primary` إلى أول اختيار للصور.
</ParamField>

<Note>
كتالوج OpenRouter `/models` عام، لذلك يمكن للفحوصات المعتمدة على البيانات الوصفية فقط سرد المرشحين المجانيين من دون مفتاح. لا تزال الفحوصات والاستدلال تتطلب مفتاح OpenRouter API (من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY`). إذا لم يتوفر مفتاح، يعود `openclaw models scan` إلى مخرجات البيانات الوصفية فقط ويترك التهيئة من دون تغيير. استخدم `--no-probe` لطلب وضع البيانات الوصفية فقط صراحةً.
</Note>

تُرتَّب نتائج الفحص حسب:

1. دعم الصور
2. زمن استجابة الأدوات
3. حجم السياق
4. عدد المعاملات

الإدخال:

- قائمة OpenRouter `/models` (المرشّح `:free`)
- تتطلب الفحوصات الحية مفتاح OpenRouter API من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY` (راجع [متغيرات البيئة](/ar/help/environment))
- مرشحات اختيارية: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- عناصر التحكم في الطلب/الفحص: `--timeout`، `--concurrency`

عندما تعمل الفحوصات الحية في TTY، يمكنك اختيار النماذج الاحتياطية تفاعليًا. في الوضع غير التفاعلي، مرّر `--yes` لقبول الافتراضيات. نتائج البيانات الوصفية فقط معلوماتية؛ ويتطلب `--set-default` و`--set-image` فحوصات حية حتى لا يهيّئ OpenClaw نموذج OpenRouter غير قابل للاستخدام بلا مفتاح.

## سجل النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن دليل الوكيل (افتراضيًا `~/.openclaw/agents/<agentId>/agent/models.json`). يُدمج هذا الملف افتراضيًا ما لم يُعيّن `models.mode` إلى `replace`.

<AccordionGroup>
  <Accordion title="أسبقية وضع الدمج">
    أسبقية وضع الدمج لمعرّفات المزوّدين المتطابقة:

    - تفوز قيمة `baseUrl` غير الفارغة الموجودة بالفعل في `models.json` الخاص بالوكيل.
    - تفوز قيمة `apiKey` غير الفارغة في `models.json` الخاص بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا عبر SecretRef في سياق التهيئة/ملف المصادقة الشخصي الحالي.
    - تُحدَّث قيم `apiKey` للمزوّد المُدار عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلًا من حفظ الأسرار المحلولة.
    - تُحدَّث قيم ترويسات المزوّد المُدار عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
    - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة لدى الوكيل إلى `models.providers` في التهيئة.
    - تُحدَّث حقول المزوّد الأخرى من التهيئة وبيانات الكتالوج المُطبَّعة.

  </Accordion>
</AccordionGroup>

<Note>
استمرارية العلامات موثوقة المصدر: يكتب OpenClaw العلامات من لقطة تهيئة المصدر النشطة (قبل الحل)، لا من قيم أسرار وقت التشغيل المحلولة. ينطبق ذلك كلما أعاد OpenClaw توليد `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.
</Note>

## ذو صلة

- [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes) — PI وCodex وبيئات تشغيل حلقات وكلاء أخرى
- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults) — مفاتيح تهيئة النماذج
- [توليد الصور](/ar/tools/image-generation) — تهيئة نموذج الصور
- [تجاوز فشل النماذج](/ar/concepts/model-failover) — سلاسل النماذج الاحتياطية
- [مزوّدو النماذج](/ar/concepts/model-providers) — توجيه المزوّدين والمصادقة
- [توليد الموسيقى](/ar/tools/music-generation) — تهيئة نموذج الموسيقى
- [توليد الفيديو](/ar/tools/video-generation) — تهيئة نموذج الفيديو
