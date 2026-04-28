---
read_when:
    - إضافة CLI للنماذج أو تعديله (`models list`/`set`/`scan`/`aliases`/`fallbacks`)
    - تغيير سلوك البدائل الاحتياطية للنموذج أو تجربة اختيار النموذج
    - تحديث مجسّات فحص النموذج (`tools`/`images`)
sidebarTitle: Models CLI
summary: 'CLI للنماذج: الإدراج، والتعيين، والأسماء المستعارة، والبدائل الاحتياطية، والفحص، والحالة'
title: CLI للنماذج
x-i18n:
    generated_at: "2026-04-26T11:27:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="التبديل الاحتياطي للنموذج" href="/ar/concepts/model-failover">
    تدوير ملفات تعريف المصادقة، وفترات التهدئة، وكيفية تفاعل ذلك مع البدائل الاحتياطية.
  </Card>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers">
    نظرة عامة سريعة على المزوّدين وأمثلة.
  </Card>
  <Card title="بيئات تشغيل الوكيل" href="/ar/concepts/agent-runtimes">
    PI وCodex وبيئات تشغيل حلقات الوكيل الأخرى.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults">
    مفاتيح إعدادات النموذج.
  </Card>
</CardGroup>

تختار مراجع النماذج مزوّدًا ونموذجًا. وهي لا تختار عادةً بيئة تشغيل الوكيل منخفضة المستوى. على سبيل المثال، يمكن تشغيل `openai/gpt-5.5` عبر مسار مزوّد OpenAI العادي أو عبر بيئة تشغيل خادم تطبيق Codex، وذلك بحسب `agents.defaults.agentRuntime.id`. راجع [بيئات تشغيل الوكيل](/ar/concepts/agent-runtimes).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

<Steps>
  <Step title="النموذج الأساسي">
    `agents.defaults.model.primary` (أو `agents.defaults.model`).
  </Step>
  <Step title="البدائل الاحتياطية">
    `agents.defaults.model.fallbacks` (بالترتيب).
  </Step>
  <Step title="التبديل الاحتياطي لمصادقة المزوّد">
    يحدث التبديل الاحتياطي للمصادقة داخل المزوّد قبل الانتقال إلى النموذج التالي.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="أسطح النماذج ذات الصلة">
    - `agents.defaults.models` هي قائمة السماح/الفهرس للنماذج التي يمكن لـ OpenClaw استخدامها (بالإضافة إلى الأسماء المستعارة).
    - `agents.defaults.imageModel` يُستخدم **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
    - `agents.defaults.pdfModel` يُستخدم بواسطة أداة `pdf`. وإذا تم حذفه، تعود الأداة إلى `agents.defaults.imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي المحلول.
    - `agents.defaults.imageGenerationModel` يُستخدم بواسطة قدرة توليد الصور المشتركة. وإذا تم حذفه، يمكن لـ `image_generate` مع ذلك استنتاج افتراضي مزوّد مدعوم بالمصادقة. ويحاول أولًا مزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الصور المسجلين بترتيب معرّفات المزوّدين. وإذا عيّنت مزوّدًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك المزوّد.
    - `agents.defaults.musicGenerationModel` يُستخدم بواسطة قدرة توليد الموسيقى المشتركة. وإذا تم حذفه، يمكن لـ `music_generate` مع ذلك استنتاج افتراضي مزوّد مدعوم بالمصادقة. ويحاول أولًا مزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّفات المزوّدين. وإذا عيّنت مزوّدًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك المزوّد.
    - `agents.defaults.videoGenerationModel` يُستخدم بواسطة قدرة توليد الفيديو المشتركة. وإذا تم حذفه، يمكن لـ `video_generate` مع ذلك استنتاج افتراضي مزوّد مدعوم بالمصادقة. ويحاول أولًا مزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الفيديو المسجلين بترتيب معرّفات المزوّدين. وإذا عيّنت مزوّدًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك المزوّد.
    - يمكن لافتراضيات كل وكيل على حدة تجاوز `agents.defaults.model` عبر `agents.list[].model` بالإضافة إلى الربط (راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## سياسة سريعة للنماذج

- اضبط النموذج الأساسي على أقوى نموذج من أحدث جيل متاح لك.
- استخدم البدائل الاحتياطية للمهام الحساسة للتكلفة/الكمون ولمحادثات الأقل أهمية.
- بالنسبة إلى الوكلاء الممكّنين بالأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا كنت لا تريد تعديل الإعدادات يدويًا، فشغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة للمزوّدين الشائعين، بما في ذلك **اشتراك OpenAI Code (Codex)** ‏(OAuth) و**Anthropic** ‏(مفتاح API أو Claude CLI).

## مفاتيح الإعدادات (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة السماح + الأسماء المستعارة + معاملات المزوّد)
- `models.providers` (مزوّدون مخصصون يُكتبون إلى `models.json`)

<Note>
تُطبَّع مراجع النماذج إلى أحرف صغيرة. وتُطبَّع الأسماء المستعارة للمزوّدين مثل `z.ai/*` إلى `zai/*`.

توجد أمثلة إعدادات المزوّد (بما في ذلك OpenCode) في [OpenCode](/ar/providers/opencode).
</Note>

### تعديلات آمنة على قائمة السماح

استخدم كتابات إضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد الحماية من الاستبدال المدمر">
    يحمي `openclaw config set` خرائط النماذج/المزوّدين من الاستبدال المدمر غير المقصود. يُرفض إسناد كائن عادي إلى `agents.defaults.models` أو `models.providers` أو `models.providers.<id>.models` عندما يؤدي إلى إزالة إدخالات موجودة. استخدم `--merge` للتغييرات الإضافية؛ واستخدم `--replace` فقط عندما تريد أن تصبح القيمة الممررة هي القيمة الكاملة للمسار المستهدف.

    يدمج إعداد المزوّد التفاعلي و`openclaw configure --section model` أيضًا الاختيارات ضمن نطاق المزوّد في قائمة السماح الحالية، لذلك لا يؤدي إضافة Codex أو Ollama أو مزوّد آخر إلى إسقاط إدخالات نماذج غير ذات صلة. ويحافظ configure على `agents.defaults.model.primary` الموجود عند إعادة تطبيق مصادقة المزوّد. أما أوامر التعيين الافتراضي الصريحة مثل `openclaw models auth login --provider <id> --set-default` و`openclaw models set <model>` فما زالت تستبدل `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا تم تعيين `agents.defaults.models`، فإنها تصبح **قائمة السماح** لـ `/model` ولتجاوزات الجلسة. وعندما يختار المستخدم نموذجًا غير موجود في تلك القائمة، يعرض OpenClaw:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
يحدث هذا **قبل** توليد رد عادي، لذلك قد تبدو الرسالة وكأنها "لم تستجب". والحل هو أحد الخيارات التالية:

- إضافة النموذج إلى `agents.defaults.models`، أو
- مسح قائمة السماح (إزالة `agents.defaults.models`)، أو
- اختيار نموذج من `/model list`.

</Warning>

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
  <Accordion title="سلوك أداة الاختيار">
    - `/model` (و`/model list`) هو منتقي مضغوط ومرقّم (عائلة النموذج + المزوّدون المتاحون).
    - في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للمزوّد والنموذج بالإضافة إلى خطوة إرسال.
    - `/models add` مهمل الآن ويعيد رسالة إهمال بدلًا من تسجيل النماذج من الدردشة.
    - يختار `/model <#>` من ذلك المنتقي.

  </Accordion>
  <Accordion title="الاستمرارية والتبديل الحي">
    - يحتفظ `/model` باختيار الجلسة الجديد فورًا.
    - إذا كان الوكيل في حالة خمول، يستخدم التشغيل التالي النموذج الجديد مباشرة.
    - إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw علامة على التبديل الحي على أنه معلق ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا كان نشاط الأدوات أو إخراج الرد قد بدأ بالفعل، فقد يبقى التبديل المعلق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
    - `/model status` هو العرض التفصيلي (مرشحو المصادقة، وعند التهيئة، `baseUrl` لنقطة نهاية المزوّد + وضع `api`).

  </Accordion>
  <Accordion title="تحليل المراجع">
    - تُحلَّل مراجع النماذج بالتقسيم على **أول** `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
    - إذا كان معرّف النموذج نفسه يحتوي على `/` (بنمط OpenRouter)، فيجب تضمين بادئة المزوّد (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - إذا حذفت المزوّد، يحل OpenClaw الإدخال بهذا الترتيب:
      1. مطابقة الاسم المستعار
      2. مطابقة مزوّد مُهيأ فريد لذلك معرّف النموذج غير المسبوق بالبادئة
      3. رجوع احتياطي مهمل إلى المزوّد الافتراضي المُهيأ — وإذا لم يعد ذلك المزوّد يكشف النموذج الافتراضي المُهيأ، فإن OpenClaw يرجع بدلًا من ذلك إلى أول مزوّد/نموذج مُهيأ لتجنب إظهار افتراضي قديم لمزوّد تمت إزالته.
  </Accordion>
</AccordionGroup>

سلوك الأوامر/الإعدادات الكامل: [الأوامر المائلة](/ar/tools/slash-commands).

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

يُعد `openclaw models` (من دون أمر فرعي) اختصارًا لـ `models status`.

### `models list`

يعرض النماذج المُهيأة افتراضيًا. أعلام مفيدة:

<ParamField path="--all" type="boolean">
  الفهرس الكامل. يتضمن صفوف الفهرس الثابتة المملوكة للمزوّد والمضمّنة قبل تهيئة المصادقة، بحيث يمكن لعروض الاكتشاف فقط إظهار النماذج غير المتاحة حتى تضيف بيانات اعتماد المزوّد المطابقة.
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

يعرض النموذج الأساسي المحلول، والبدائل الاحتياطية، ونموذج الصور، ونظرة عامة على المصادقة للمزوّدين المهيئين. كما يُظهر حالة انتهاء صلاحية OAuth لملفات التعريف الموجودة في مخزن المصادقة (ويحذّر ضمن 24 ساعة افتراضيًا). يطبع `--plain` النموذج الأساسي المحلول فقط.

<AccordionGroup>
  <Accordion title="سلوك المصادقة والمجسّات">
    - تُعرض حالة OAuth دائمًا (وتُدرج في مخرجات `--json`). وإذا لم تكن لدى مزوّد مُهيأ أي بيانات اعتماد، يطبع `models status` قسم **Missing auth**.
    - يتضمن JSON كلًا من `auth.oauth` (نافذة التحذير + ملفات التعريف) و`auth.providers` (المصادقة الفعلية لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة بالبيئة). يمثل `auth.oauth` فقط سلامة ملفات التعريف في مخزن المصادقة؛ ولا تظهر المزوّدات المعتمدة على البيئة فقط هناك.
    - استخدم `--check` للأتمتة (قيمة خروج `1` عند الفقد/الانتهاء، و`2` عند قرب الانتهاء).
    - استخدم `--probe` لفحوصات المصادقة الحية؛ ويمكن أن تأتي صفوف المجسّات من ملفات تعريف المصادقة أو بيانات اعتماد البيئة أو `models.json`.
    - إذا حذفت `auth.order.<provider>` الصريحة ملف تعريف مخزنًا، فسيبلغ المجس عن `excluded_by_auth_order` بدلًا من محاولة استخدامه. وإذا وُجدت المصادقة لكن تعذر حل نموذج قابل للمجس لذلك المزوّد، فسيبلغ المجس عن `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
يعتمد اختيار المصادقة على المزوّد/الحساب. بالنسبة إلى مضيفي Gateway الدائمين التشغيل، تكون مفاتيح API عادةً الأكثر قابلية للتنبؤ؛ كما أن إعادة استخدام Claude CLI وملفات تعريف OAuth/الرموز الموجودة لـ Anthropic مدعومة أيضًا.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (نماذج OpenRouter المجانية)

يقوم `openclaw models scan` بفحص **فهرس النماذج المجانية** في OpenRouter ويمكنه اختياريًا إجراء مجسّات للنماذج للتحقق من دعم الأدوات والصور.

<ParamField path="--no-probe" type="boolean">
  تخطَّ المجسّات الحية (البيانات الوصفية فقط).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  الحد الأدنى لحجم المعاملات (بالمليارات).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  تخطَّ النماذج الأقدم.
</ParamField>
<ParamField path="--provider <name>" type="string">
  عامل تصفية لبادئة المزوّد.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  حجم قائمة البدائل الاحتياطية.
</ParamField>
<ParamField path="--set-default" type="boolean">
  اضبط `agents.defaults.model.primary` على أول اختيار.
</ParamField>
<ParamField path="--set-image" type="boolean">
  اضبط `agents.defaults.imageModel.primary` على أول اختيار للصور.
</ParamField>

<Note>
فهرس OpenRouter `/models` عام، لذلك يمكن لعمليات الفحص التي تعتمد على البيانات الوصفية فقط إدراج المرشحين المجانيين من دون مفتاح. لكن المجسّات والاستدلال لا يزالان يتطلبان مفتاح API لـ OpenRouter (من ملفات تعريف المصادقة أو `OPENROUTER_API_KEY`). وإذا لم يكن أي مفتاح متاحًا، يعود `openclaw models scan` إلى مخرجات تعتمد على البيانات الوصفية فقط ويترك الإعدادات دون تغيير. استخدم `--no-probe` لطلب وضع البيانات الوصفية فقط بشكل صريح.
</Note>

تُرتّب نتائج الفحص حسب:

1. دعم الصور
2. كمون الأدوات
3. حجم السياق
4. عدد المعاملات

المدخلات:

- قائمة OpenRouter `/models` ‏(عامل التصفية `:free`)
- تتطلب المجسّات الحية مفتاح API لـ OpenRouter من ملفات تعريف المصادقة أو `OPENROUTER_API_KEY` ‏(راجع [متغيرات البيئة](/ar/help/environment))
- عوامل التصفية الاختيارية: `--max-age-days` و`--min-params` و`--provider` و`--max-candidates`
- عناصر التحكم في الطلب/المجس: `--timeout` و`--concurrency`

عندما تعمل المجسّات الحية في TTY، يمكنك اختيار البدائل الاحتياطية تفاعليًا. وفي الوضع غير التفاعلي، مرّر `--yes` لقبول الإعدادات الافتراضية. وتكون النتائج المعتمدة على البيانات الوصفية فقط معلوماتية؛ ويتطلب كل من `--set-default` و`--set-image` مجسّات حية حتى لا يهيّئ OpenClaw نموذج OpenRouter غير قابل للاستخدام من دون مفتاح.

## سجل النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن دليل الوكيل (الافتراضي `~/.openclaw/agents/<agentId>/agent/models.json`). ويُدمج هذا الملف افتراضيًا ما لم يتم تعيين `models.mode` إلى `replace`.

<AccordionGroup>
  <Accordion title="أولوية وضع الدمج">
    أولوية وضع الدمج لمعرّفات المزوّد المطابقة:

    - القيمة غير الفارغة لـ `baseUrl` الموجودة بالفعل في `models.json` الخاص بالوكيل هي التي تفوز.
    - القيمة غير الفارغة لـ `apiKey` في `models.json` الخاص بالوكيل تفوز فقط عندما لا يكون ذلك المزوّد مُدارًا عبر SecretRef في سياق الإعدادات/ملف تعريف المصادقة الحالي.
    - تُحدَّث قيم `apiKey` للمزوّدات المُدارة عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec) بدلًا من حفظ الأسرار المحلولة.
    - تُحدَّث قيم ترويسات المزوّدات المُدارة عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec).
    - تعود القيم الفارغة أو المفقودة لـ `apiKey`/`baseUrl` في الوكيل إلى `models.providers` في الإعدادات.
    - تُحدَّث حقول المزوّد الأخرى من الإعدادات وبيانات الفهرس المطبّعة.

  </Accordion>
</AccordionGroup>

<Note>
استمرارية العلامات تعتمد على المصدر: يكتب OpenClaw العلامات من لقطة الإعدادات المصدرية النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة وقت التشغيل. وينطبق ذلك كلما أعاد OpenClaw توليد `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.
</Note>

## ذو صلة

- [بيئات تشغيل الوكيل](/ar/concepts/agent-runtimes) — PI وCodex وبيئات تشغيل حلقات الوكيل الأخرى
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — مفاتيح إعدادات النموذج
- [توليد الصور](/ar/tools/image-generation) — إعدادات نموذج الصور
- [التبديل الاحتياطي للنموذج](/ar/concepts/model-failover) — سلاسل البدائل الاحتياطية
- [مزوّدو النماذج](/ar/concepts/model-providers) — توجيه المزوّد والمصادقة
- [توليد الموسيقى](/ar/tools/music-generation) — إعدادات نموذج الموسيقى
- [توليد الفيديو](/ar/tools/video-generation) — إعدادات نموذج الفيديو
