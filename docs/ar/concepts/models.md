---
read_when:
    - إضافة أو تعديل نماذج CLI (models list/set/scan/aliases/fallbacks)
    - تغيير سلوك الرجوع الاحتياطي للنموذج أو تجربة اختيار النموذج
    - تحديث مجسات فحص النماذج (الأدوات/الصور)
sidebarTitle: Models CLI
summary: 'Models CLI: السرد، التعيين، الأسماء المستعارة، البدائل الاحتياطية، الفحص، الحالة'
title: واجهة سطر أوامر النماذج
x-i18n:
    generated_at: "2026-06-27T17:30:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="تجاوز فشل النموذج" href="/ar/concepts/model-failover">
    تدوير ملفات تعريف المصادقة، وفترات التهدئة، وكيفية تفاعل ذلك مع البدائل.
  </Card>
  <Card title="موفّرو النماذج" href="/ar/concepts/model-providers">
    نظرة عامة سريعة على الموفّرين وأمثلة.
  </Card>
  <Card title="بيئات تشغيل الوكلاء" href="/ar/concepts/agent-runtimes">
    OpenClaw وCodex وبيئات تشغيل حلقات الوكلاء الأخرى.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/config-agents#agent-defaults">
    مفاتيح تهيئة النماذج.
  </Card>
</CardGroup>

تختار مراجع النماذج موفّرًا ونموذجًا. وهي لا تختار عادةً بيئة تشغيل الوكيل منخفضة المستوى. مراجع وكلاء OpenAI هي الاستثناء الرئيسي: يعمل `openai/gpt-5.5` عبر بيئة تشغيل خادم تطبيق Codex افتراضيًا على موفّر OpenAI الرسمي. يمكن أيضًا اختيار تشغيل مراجع اشتراك Copilot (`github-copilot/*`) عبر Plugin بيئة تشغيل وكيل GitHub Copilot الخارجي، ويبقى هذا المسار صريحًا (من دون بديل `auto`). تنتمي تجاوزات بيئة التشغيل الصريحة إلى سياسة الموفّر/النموذج، لا إلى الوكيل أو الجلسة بالكامل. في وضع بيئة تشغيل Codex، لا يعني المرجع `openai/gpt-*` الفوترة عبر مفتاح API؛ يمكن أن تأتي المصادقة من حساب Codex أو ملف تعريف OAuth باسم `openai`. راجع [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes) و[بيئة تشغيل وكيل GitHub Copilot](/ar/plugins/copilot).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

<Steps>
  <Step title="النموذج الأساسي">
    `agents.defaults.model.primary` (أو `agents.defaults.model`).
  </Step>
  <Step title="البدائل">
    `agents.defaults.model.fallbacks` (بالترتيب).
  </Step>
  <Step title="تجاوز فشل مصادقة الموفّر">
    يحدث تجاوز فشل المصادقة داخل الموفّر قبل الانتقال إلى النموذج التالي.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="أسطح النماذج ذات الصلة">
    - `agents.defaults.models` هي قائمة السماح/الفهرس للنماذج التي يمكن لـ OpenClaw استخدامها (بالإضافة إلى الأسماء المستعارة). استخدم إدخالات `provider/*` لتقييد الموفّرين المرئيين مع إبقاء اكتشاف الموفّرين ديناميكيًا.
    - يُستخدم `agents.defaults.imageModel` **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
    - يُستخدم `agents.defaults.pdfModel` بواسطة أداة `pdf`. إذا أُغفل، تعود الأداة إلى `agents.defaults.imageModel`، ثم نموذج الجلسة/النموذج الافتراضي المحلول.
    - يُستخدم `agents.defaults.imageGenerationModel` بواسطة قدرة توليد الصور المشتركة. إذا أُغفل، فلا يزال بإمكان `image_generate` استنتاج افتراضي موفّر مدعوم بالمصادقة. يجرّب الموفّر الافتراضي الحالي أولًا، ثم بقية موفّري توليد الصور المسجلين بترتيب معرّف الموفّر. إذا عيّنت موفّرًا/نموذجًا محددًا، فهيّئ أيضًا مصادقة/مفتاح API لذلك الموفّر.
    - يُستخدم `agents.defaults.musicGenerationModel` بواسطة قدرة توليد الموسيقى المشتركة. إذا أُغفل، فلا يزال بإمكان `music_generate` استنتاج افتراضي موفّر مدعوم بالمصادقة. يجرّب الموفّر الافتراضي الحالي أولًا، ثم بقية موفّري توليد الموسيقى المسجلين بترتيب معرّف الموفّر. إذا عيّنت موفّرًا/نموذجًا محددًا، فهيّئ أيضًا مصادقة/مفتاح API لذلك الموفّر.
    - يُستخدم `agents.defaults.videoGenerationModel` بواسطة قدرة توليد الفيديو المشتركة. إذا أُغفل، فلا يزال بإمكان `video_generate` استنتاج افتراضي موفّر مدعوم بالمصادقة. يجرّب الموفّر الافتراضي الحالي أولًا، ثم بقية موفّري توليد الفيديو المسجلين بترتيب معرّف الموفّر. إذا عيّنت موفّرًا/نموذجًا محددًا، فهيّئ أيضًا مصادقة/مفتاح API لذلك الموفّر.
    - يمكن للافتراضيات الخاصة بكل وكيل تجاوز `agents.defaults.model` عبر `agents.list[].model` مع الارتباطات (راجع [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## مصدر الاختيار وسلوك البدائل

يمكن أن يعني `provider/model` نفسه أشياء مختلفة حسب مصدره:

- الافتراضيات المهيأة (`agents.defaults.model.primary` والنماذج الأساسية الخاصة بالوكلاء) هي نقطة البدء المعتادة وتستخدم `agents.defaults.model.fallbacks`.
- اختيارات البديل التلقائي هي حالة استرداد مؤقتة. تُخزّن مع `modelOverrideSource: "auto"` حتى تتمكن المنعطفات اللاحقة من الاستمرار في استخدام سلسلة البدائل من دون فحص نموذج أساسي معروف أنه سيئ في كل مرة؛ يفحص OpenClaw النموذج الأساسي الأصلي مرة أخرى دوريًا، ويمسح الاختيار التلقائي عند تعافيه، ويعلن انتقالات البديل/التعافي مرة واحدة لكل تغيير حالة.
- اختيارات جلسة المستخدم دقيقة. يخزّن `/model`، ومنتقي النماذج، و`session_status(model=...)`، و`sessions.patch` القيمة `modelOverrideSource: "user"`؛ إذا كان ذلك الموفّر/النموذج المحدد غير قابل للوصول، يفشل OpenClaw بشكل مرئي بدلًا من الانتقال إلى نموذج آخر مهيأ.
- لا تؤدي تغييرات `agents.defaults.model.primary` إلى إعادة كتابة اختيارات الجلسات الحالية. إذا قالت الحالة `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`، فامسح اختيار الجلسة الحالية باستخدام `/model default` حتى ترث النموذج الأساسي المهيأ مرة أخرى.
- ‏Cron `--model` / حمولة `model` هي نموذج أساسي لكل مهمة. ما زالت تستخدم البدائل المهيأة ما لم توفّر المهمة حمولة `fallbacks` صريحة (استخدم `fallbacks: []` لتشغيل cron صارم).
- تحترم منتقيات النموذج الافتراضي وقائمة السماح في CLI القيمة `models.mode: "replace"` عبر سرد `models.providers.*.models` الصريحة بدلًا من تحميل الفهرس المدمج الكامل.
- يطلب منتقي النماذج في واجهة التحكم من Gateway عرض النماذج المهيأ لديه: `agents.defaults.models` عند وجوده، بما في ذلك إدخالات `provider/*` على مستوى الموفّر، وإلا `models.providers.*.models` الصريحة بالإضافة إلى الموفّرين ذوي المصادقة القابلة للاستخدام. يُحجز الفهرس المدمج الكامل لعروض التصفح الصريحة مثل `models.list` مع `view: "all"` أو `openclaw models list --all`.

## سياسة نماذج سريعة

- عيّن النموذج الأساسي إلى أقوى نموذج من الجيل الأحدث متاح لك.
- استخدم البدائل للمهام الحساسة للتكلفة/زمن الاستجابة وللمحادثات الأقل حساسية.
- للوكلاء المفعّلة بالأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا كنت لا تريد تعديل التهيئة يدويًا، شغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة للموفّرين الشائعين، بما في ذلك **اشتراك OpenAI Code (Codex)** (OAuth) و**Anthropic** (مفتاح API أو Claude CLI).

## مفاتيح التهيئة (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة سماح + أسماء مستعارة + معلمات موفّر + إدخالات موفّر ديناميكية `provider/*`)
- `models.providers` (موفّرون مخصصون مكتوبون في `models.json`)

<Note>
تُطبّع مراجع النماذج إلى أحرف صغيرة. أما معرّفات الموفّرين فهي دقيقة كما هي؛ استخدم
معرّف الموفّر الذي يعلنه Plugin.

توجد أمثلة تهيئة الموفّرين (بما في ذلك OpenCode) في [OpenCode](/ar/providers/opencode).
</Note>

### تعديلات آمنة لقائمة السماح

استخدم الكتابات الإضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد الحماية من الاستبدال غير المقصود">
    يحمي `openclaw config set` خرائط النماذج/الموفّرين من الاستبدال غير المقصود. يُرفض تعيين كائن عادي إلى `agents.defaults.models` أو `models.providers` أو `models.providers.<id>.models` عندما يؤدي ذلك إلى إزالة إدخالات موجودة. استخدم `--merge` للتغييرات الإضافية؛ واستخدم `--replace` فقط عندما يجب أن تصبح القيمة المقدمة هي القيمة الهدف الكاملة.

    يدمج إعداد الموفّر التفاعلي و`openclaw configure --section model` أيضًا اختيارات نطاق الموفّر في قائمة السماح الحالية، لذلك لا تؤدي إضافة Codex أو Ollama أو موفّر آخر إلى إسقاط إدخالات نماذج غير ذات صلة. يحافظ configure على `agents.defaults.model.primary` موجود عند إعادة تطبيق مصادقة الموفّر. ما تزال أوامر تعيين الافتراضي الصريحة مثل `openclaw models auth login --provider <id> --set-default` و`openclaw models set <model>` تستبدل `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا عُيّن `agents.defaults.models`، يصبح **قائمة السماح** لـ `/model` ولتجاوزات الجلسات. عندما يختار المستخدم نموذجًا غير موجود في قائمة السماح تلك، يعيد OpenClaw:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
يحدث هذا **قبل** إنشاء رد عادي، لذلك قد تبدو الرسالة كما لو أنه "لم يرد". الحل هو أحد الآتي:

- أضف النموذج إلى `agents.defaults.models`، أو
- امسح قائمة السماح (أزل `agents.defaults.models`)، أو
- اختر نموذجًا من `/model list`.

</Warning>

عندما يتضمن الأمر المرفوض تجاوزًا لبيئة التشغيل مثل `/model openai/gpt-5.5 --runtime codex`، أصلح قائمة السماح أولًا، ثم أعد محاولة الأمر نفسه `/model ... --runtime ...`. للتنفيذ الأصلي عبر Codex، يظل النموذج المحدد هو `openai/gpt-5.5`؛ تختار بيئة التشغيل `codex` الحزمة وتستخدم مصادقة Codex بشكل منفصل.

للنماذج المحلية/GGUF، خزّن المرجع الكامل المسبوق بالموفّر في قائمة السماح،
مثل `ollama/gemma4:26b` أو `lmstudio/Gemma4-26b-a4-it-gguf` أو
الموفّر/النموذج الدقيق المعروض بواسطة `openclaw models list --provider <provider>`.
لا تكفي أسماء الملفات المحلية المجردة أو أسماء العرض عندما تكون قائمة السماح
نشطة.

إذا كنت تريد تقييد الموفّرين من دون سرد كل نموذج يدويًا، فأضف
إدخالات `provider/*` إلى `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

مع هذه السياسة، يعرض `/model` و`/models` ومنتقيات النماذج الفهرس
المكتشف لهؤلاء الموفّرين فقط. يمكن أن تظهر نماذج جديدة من الموفّرين المحددين
من دون تعديل قائمة السماح. يمكن خلط إدخالات `provider/model` الدقيقة
مع إدخالات `provider/*` عندما تحتاج إلى نموذج محدد واحد من موفّر آخر.

مثال على تهيئة قائمة السماح:

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

يمكنك تبديل النماذج للجلسة الحالية من دون إعادة التشغيل:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

<AccordionGroup>
  <Accordion title="سلوك المنتقي">
    - `/model` (و`/model list`) هو منتقي مدمج مرقّم (عائلة النموذج + الموفّرون المتاحون).
    - على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يتضمن قوائم منسدلة للموفّر والنموذج بالإضافة إلى خطوة إرسال.
    - على Telegram، تكون اختيارات منتقي `/models` مقيّدة بنطاق الجلسة؛ ولا تغيّر الافتراضي الدائم للوكيل في `openclaw.json`.
    - أصبح `/models add` مهجورًا ويعيد الآن رسالة إهجار بدلًا من تسجيل النماذج من المحادثة.
    - يختار `/model <#>` من ذلك المنتقي.

  </Accordion>
  <Accordion title="الاستمرارية والتبديل المباشر">
    - يحفظ `/model` اختيار الجلسة الجديد فورًا.
    - إذا كان الوكيل خاملاً، فسيستخدم التشغيل التالي النموذج الجديد مباشرةً.
    - إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw علامة على التبديل المباشر بأنه معلّق، ولا يعيد التشغيل بالنموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا بدأ نشاط الأدوات أو بدأ إخراج الرد بالفعل، فقد يبقى التبديل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو حتى دور المستخدم التالي.
    - يمسح `/model default` اختيار الجلسة ويعيد الجلسة إلى النموذج الافتراضي المضبوط.
    - يكون مرجع `/model` الذي اختاره المستخدم صارمًا لتلك الجلسة: إذا تعذر الوصول إلى المزوّد/النموذج المحدد، يفشل الرد بشكل ظاهر بدلاً من الإجابة بصمت من `agents.defaults.model.fallbacks`. يختلف هذا عن الإعدادات الافتراضية المضبوطة وأساسيات مهام cron، التي لا يزال بإمكانها استخدام سلاسل الرجوع الاحتياطية.
    - `/model status` هو العرض التفصيلي (مرشحو المصادقة، وعند ضبطها، نقطة نهاية المزوّد `baseUrl` + وضع `api`).

  </Accordion>
  <Accordion title="تحليل المراجع">
    - تُحلل مراجع النماذج بالتقسيم عند أول `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
    - إذا كان معرّف النموذج نفسه يحتوي على `/` (بنمط OpenRouter)، فيجب تضمين بادئة المزوّد (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - إذا حذفت المزوّد، يحل OpenClaw الإدخال بهذا الترتيب:
      1. تطابق الاسم المستعار
      2. تطابق مزوّد مضبوط وفريد لمعرّف النموذج غير المسبوق نفسه
      3. رجوع مهمل إلى المزوّد الافتراضي المضبوط — إذا لم يعد ذلك المزوّد يعرض النموذج الافتراضي المضبوط، يرجع OpenClaw بدلاً من ذلك إلى أول مزوّد/نموذج مضبوط لتجنب إظهار إعداد افتراضي قديم لمزوّد أزيل.
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

`openclaw models` (بلا أمر فرعي) هو اختصار لـ `models status`.

### `models list`

يعرض النماذج المضبوطة/المتاحة بالمصادقة افتراضيًا. علامات مفيدة:

<ParamField path="--all" type="boolean">
  الفهرس الكامل. يتضمن صفوف الفهرس الثابتة المملوكة للمزوّد والمضمّنة قبل ضبط المصادقة، بحيث يمكن لعروض الاكتشاف فقط إظهار النماذج غير المتاحة حتى تضيف بيانات اعتماد المزوّد المطابقة.
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
  إخراج قابل للقراءة آليًا.
</ParamField>

### `models status`

يعرض النموذج الأساسي المحلول، والاحتياطيات، ونموذج الصور، ونظرة عامة للمصادقة على المزوّدين المضبوطين. كما يُظهر حالة انتهاء صلاحية OAuth للملفات الشخصية الموجودة في مخزن المصادقة (يحذّر خلال 24 ساعة افتراضيًا). يطبع `--plain` النموذج الأساسي المحلول فقط.

<AccordionGroup>
  <Accordion title="سلوك المصادقة والفحص">
    - تُعرض حالة OAuth دائمًا (وتُضمّن في إخراج `--json`). إذا لم تكن لدى مزوّد مضبوط بيانات اعتماد، يطبع `models status` قسم **مصادقة مفقودة**.
    - يتضمن JSON `auth.oauth` (نافذة التحذير + الملفات الشخصية) و`auth.providers` (المصادقة الفعالة لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة بمتغيرات البيئة). `auth.oauth` هو لصحة ملفات مخزن المصادقة فقط؛ المزوّدون المعتمدون على البيئة فقط لا يظهرون هناك.
    - استخدم `--check` للأتمتة (رمز الخروج `1` عند الفقدان/الانتهاء، و`2` عند قرب الانتهاء).
    - استخدم `--probe` لفحوصات المصادقة المباشرة؛ يمكن أن تأتي صفوف الفحص من ملفات المصادقة الشخصية، أو بيانات اعتماد البيئة، أو `models.json`.
    - إذا حذف `auth.order.<provider>` الصريح ملفًا شخصيًا مخزنًا، يبلّغ الفحص عن `excluded_by_auth_order` بدلاً من تجربته. إذا كانت المصادقة موجودة ولكن لا يمكن حل نموذج قابل للفحص لذلك المزوّد، يبلّغ الفحص عن `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
يعتمد اختيار المصادقة على المزوّد/الحساب. بالنسبة إلى مضيفي Gateway الدائمين، تكون مفاتيح API عادةً الأكثر قابلية للتنبؤ؛ كما يُدعم إعادة استخدام Claude CLI وملفات Anthropic OAuth/الرموز الموجودة.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (نماذج OpenRouter المجانية)

يفحص `openclaw models scan` **فهرس النماذج المجانية** في OpenRouter، ويمكنه اختياريًا فحص النماذج لدعم الأدوات والصور.

<ParamField path="--no-probe" type="boolean">
  تخطَّ الفحوصات المباشرة (البيانات الوصفية فقط).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  الحد الأدنى لحجم المعاملات (بالمليارات).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  تخطَّ النماذج الأقدم.
</ParamField>
<ParamField path="--provider <name>" type="string">
  مرشح بادئة المزوّد.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  حجم قائمة الرجوع الاحتياطية.
</ParamField>
<ParamField path="--set-default" type="boolean">
  عيّن `agents.defaults.model.primary` إلى الاختيار الأول.
</ParamField>
<ParamField path="--set-image" type="boolean">
  عيّن `agents.defaults.imageModel.primary` إلى أول اختيار للصور.
</ParamField>

<Note>
فهرس OpenRouter `/models` عام، لذلك يمكن لعمليات الفحص المعتمدة على البيانات الوصفية فقط سرد المرشحين المجانيين من دون مفتاح. لا تزال الفحوصات والاستدلالات تتطلب مفتاح OpenRouter API (من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY`). إذا لم يتوفر مفتاح، يرجع `openclaw models scan` إلى إخراج البيانات الوصفية فقط ويترك الإعداد دون تغيير. استخدم `--no-probe` لطلب وضع البيانات الوصفية فقط صراحةً.
</Note>

تُرتب نتائج الفحص حسب:

1. دعم الصور
2. زمن استجابة الأدوات
3. حجم السياق
4. عدد المعاملات

الإدخال:

- قائمة OpenRouter `/models` (مرشح `:free`)
- تتطلب الفحوصات المباشرة مفتاح OpenRouter API من ملفات المصادقة الشخصية أو `OPENROUTER_API_KEY` (راجع [متغيرات البيئة](/ar/help/environment))
- مرشحات اختيارية: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- عناصر تحكم الطلب/الفحص: `--timeout`، `--concurrency`

عند تشغيل الفحوصات المباشرة في TTY، يمكنك تحديد الاحتياطيات تفاعليًا. في الوضع غير التفاعلي، مرر `--yes` لقبول الإعدادات الافتراضية. نتائج البيانات الوصفية فقط معلوماتية؛ يتطلب `--set-default` و`--set-image` فحوصات مباشرة حتى لا يضبط OpenClaw نموذج OpenRouter غير قابل للاستخدام بلا مفتاح.

## سجل النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن دليل الوكيل (افتراضيًا `~/.openclaw/agents/<agentId>/agent/models.json`). تُخزّن فهارس Plugin المزوّد كأجزاء فهرس مولّدة مملوكة للـ Plugin ضمن حالة Plugin الخاصة بالوكيل وتُحمّل تلقائيًا. يُدمج هذا الملف افتراضيًا ما لم يُعيّن `models.mode` إلى `replace`.

<AccordionGroup>
  <Accordion title="أسبقية وضع الدمج">
    أسبقية وضع الدمج لمعرّفات المزوّدين المطابقة:

    - يفوز `baseUrl` غير الفارغ الموجود مسبقًا في `models.json` الخاص بالوكيل.
    - يفوز `apiKey` غير الفارغ في `models.json` الخاص بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا عبر SecretRef في سياق الإعداد/ملف المصادقة الحالي.
    - تُحدّث قيم `apiKey` للمزوّد المُدار عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلاً من الاستمرار في حفظ الأسرار المحلولة.
    - تُحدّث قيم ترويسة المزوّد المُدار عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
    - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة في الوكيل إلى `models.providers` في الإعداد.
    - تُحدّث حقول المزوّد الأخرى من الإعداد وبيانات الفهرس المطبّعة.

  </Accordion>
</AccordionGroup>

<Note>
استمرارية العلامات موثوقة من المصدر: يكتب OpenClaw العلامات من لقطة إعداد المصدر النشطة (قبل الحل)، وليس من قيم أسرار وقت التشغيل المحلولة. ينطبق هذا كلما أعاد OpenClaw توليد `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.
</Note>

## ذات صلة

- [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes) — OpenClaw وCodex وبيئات تشغيل حلقات وكلاء أخرى
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — مفاتيح إعداد النماذج
- [توليد الصور](/ar/tools/image-generation) — إعداد نموذج الصور
- [تحويل النماذج عند الفشل](/ar/concepts/model-failover) — سلاسل الرجوع الاحتياطية
- [مزوّدو النماذج](/ar/concepts/model-providers) — توجيه المزوّدين والمصادقة
- [توليد الموسيقى](/ar/tools/music-generation) — إعداد نموذج الموسيقى
- [توليد الفيديو](/ar/tools/video-generation) — إعداد نموذج الفيديو
