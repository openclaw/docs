---
read_when:
    - أنت تشغّل openclaw بدون أمر وتريد فهم Crestodian
    - تحتاج إلى طريقة آمنة دون إعدادات لفحص OpenClaw أو إصلاحه
    - أنت تصمم أو تفعّل وضع الإنقاذ لقناة الرسائل
summary: مرجع CLI ونموذج الأمان لـ Crestodian، ومساعد الإعداد الآمن دون إعدادات والإصلاح
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian هو مساعد OpenClaw المحلي للإعداد والإصلاح والتهيئة. وقد صُمم
ليظل متاحًا عندما يتعطل المسار العادي للوكيل.

يؤدي تشغيل `openclaw` بدون أمر إلى بدء Crestodian في واجهة طرفية تفاعلية.
ويؤدي تشغيل `openclaw crestodian` إلى بدء المساعد نفسه بشكل صريح.

## ما الذي يعرضه Crestodian

عند بدء التشغيل، يفتح Crestodian التفاعلي نفس غلاف TUI المستخدم بواسطة
`openclaw tui`، ولكن مع خلفية دردشة خاصة بـ Crestodian. ويبدأ سجل الدردشة بتحية
قصيرة تتضمن:

- متى يجب بدء Crestodian
- مسار النموذج أو المخطط الحتمي الذي يستخدمه Crestodian فعليًا
- صلاحية الإعدادات والوكيل الافتراضي
- إمكانية الوصول إلى Gateway من أول فحص عند بدء التشغيل
- إجراء التصحيح التالي الذي يمكن لـ Crestodian اتخاذه

لا يقوم بتفريغ الأسرار أو تحميل أوامر CLI الخاصة بالـ Plugin فقط لأجل البدء. ولا تزال
واجهة TUI توفر الرأس المعتاد وسجل الدردشة وسطر الحالة والتذييل والإكمال التلقائي
وعناصر التحكم في المحرر.

استخدم `status` للحصول على الجرد التفصيلي الذي يتضمن مسار الإعدادات ومسارات
الوثائق/المصدر وفحوصات CLI المحلية ووجود مفاتيح API والوكلاء والنموذج
وتفاصيل Gateway.

يستخدم Crestodian نفس آلية اكتشاف المراجع في OpenClaw كما في الوكلاء العاديين. في نسخة Git،
يوجه نفسه إلى `docs/` المحلية وإلى شجرة المصدر المحلية. وفي تثبيت حزمة npm،
يستخدم وثائق الحزمة المضمنة ويربط إلى
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)، مع
إرشاد صريح إلى مراجعة المصدر عندما لا تكون الوثائق كافية.

## أمثلة

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

داخل واجهة Crestodian TUI:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## بدء تشغيل آمن

مسار بدء تشغيل Crestodian صغير عمدًا. ويمكنه العمل عندما:

- يكون `openclaw.json` مفقودًا
- يكون `openclaw.json` غير صالح
- تكون Gateway متوقفة
- لا يكون تسجيل أوامر Plugin متاحًا
- لم تتم تهيئة أي وكيل بعد

لا يزال `openclaw --help` و`openclaw --version` يستخدمان المسارات السريعة العادية.
أما `openclaw` غير التفاعلي فيخرج برسالة قصيرة بدلًا من طباعة
مساعدة الجذر، لأن منتج التشغيل بدون أمر هو Crestodian.

## العمليات والموافقة

يستخدم Crestodian عمليات مكتوبة النوع بدلًا من تعديل الإعدادات بشكل حر.

يمكن تشغيل العمليات للقراءة فقط فورًا:

- عرض النظرة العامة
- سرد الوكلاء
- عرض حالة النموذج/الواجهة الخلفية
- تشغيل فحوصات الحالة أو السلامة
- التحقق من إمكانية الوصول إلى Gateway
- تشغيل doctor بدون إصلاحات تفاعلية
- التحقق من صحة الإعدادات
- عرض مسار سجل التدقيق

تتطلب العمليات الدائمة موافقة حوارية في الوضع التفاعلي ما لم
تمرر `--yes` لأمر مباشر:

- كتابة الإعدادات
- تشغيل `config set`
- تعيين قيم SecretRef المدعومة عبر `config set-ref`
- تشغيل التمهيد الخاص بالإعداد/التهيئة الأولية
- تغيير النموذج الافتراضي
- بدء Gateway أو إيقافها أو إعادة تشغيلها
- إنشاء الوكلاء
- تشغيل إصلاحات doctor التي تعيد كتابة الإعدادات أو الحالة

تُسجَّل عمليات الكتابة المطبقة في:

```text
~/.openclaw/audit/crestodian.jsonl
```

لا يتم تدقيق الاكتشاف. يتم تسجيل العمليات وعمليات الكتابة المطبقة فقط.

يبدأ `openclaw onboard --modern` Crestodian بوصفه معاينة التهيئة الأولى الحديثة.
أما `openclaw onboard` العادي فيظل يشغّل التهيئة الأولى الكلاسيكية.

## تمهيد الإعداد

`setup` هو تمهيد التهيئة الأولى المعتمد على الدردشة. وهو يكتب فقط عبر
عمليات إعدادات مكتوبة النوع ويطلب الموافقة أولًا.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

عندما لا يكون هناك نموذج مهيأ، يختار setup أول واجهة خلفية قابلة للاستخدام بهذا
الترتيب ويخبرك بما اختاره:

- النموذج الصريح الحالي، إذا كان مهيأ بالفعل
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

إذا لم يكن أي منها متاحًا، فسيستمر setup في كتابة مساحة العمل الافتراضية ويترك
النموذج بدون تعيين. قم بتثبيت Codex/Claude Code أو سجّل الدخول إليهما، أو عرّض
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`، ثم شغّل setup مرة أخرى.

## المخطط بمساعدة النموذج

يبدأ Crestodian دائمًا في الوضع الحتمي. وبالنسبة للأوامر غير الدقيقة التي لا
يفهمها المحلل الحتمي، يمكن لـ Crestodian المحلي إجراء دورة تخطيط واحدة
محدودة عبر مسارات وقت التشغيل العادية في OpenClaw. وهو يستخدم أولًا
نموذج OpenClaw المهيأ. وإذا لم يكن هناك نموذج مهيأ صالح للاستخدام بعد،
فيمكنه الرجوع إلى بيئات التشغيل المحلية الموجودة بالفعل على الجهاز:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` مع `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

لا يمكن للمخطط بمساعدة النموذج تعديل الإعدادات مباشرة. بل يجب عليه ترجمة
الطلب إلى أحد أوامر Crestodian المكتوبة النوع، ثم تُطبّق قواعد الموافقة
والتدقيق العادية. يطبع Crestodian النموذج الذي استخدمه والأمر الذي
فسّره قبل أن يشغّل أي شيء. دورات المخطط الاحتياطية المؤقتة دون إعدادات
تكون مؤقتة، ومعطلة الأدوات عندما تدعم بيئة التشغيل ذلك، وتستخدم
مساحة عمل/جلسة مؤقتة.

لا يستخدم وضع إنقاذ قناة الرسائل المخطط بمساعدة النموذج. إذ يظل الإنقاذ
عن بُعد حتميًا حتى لا يُستخدم المسار العادي المعطل أو المخترَق للوكيل
كمحرر إعدادات.

## التبديل إلى وكيل

استخدم محددًا بلغة طبيعية لمغادرة Crestodian وفتح واجهة TUI العادية:

```text
talk to agent
talk to work agent
switch to main agent
```

لا تزال `openclaw tui` و`openclaw chat` و`openclaw terminal` تفتح واجهة
TUI العادية للوكيل مباشرة. وهي لا تبدأ Crestodian.

بعد التبديل إلى واجهة TUI العادية، استخدم `/crestodian` للعودة إلى Crestodian.
ويمكنك تضمين طلب متابعة:

```text
/crestodian
/crestodian restart gateway
```

تترك عمليات تبديل الوكيل داخل TUI علامة تذكيرية بأن `/crestodian` متاح.

## وضع الإنقاذ عبر الرسائل

وضع الإنقاذ عبر الرسائل هو نقطة الدخول الخاصة بـ Crestodian عبر قناة الرسائل. وهو
مخصص للحالة التي يكون فيها وكيلك العادي متوقفًا، لكن قناة موثوقة مثل WhatsApp
لا تزال تستقبل الأوامر.

الأمر النصي المدعوم:

- `/crestodian <request>`

تدفق المشغّل:

```text
أنت، في رسالة خاصة موثوقة للمالك: /crestodian status
OpenClaw: وضع إنقاذ Crestodian. Gateway قابلة للوصول: لا. الإعدادات صالحة: لا.
أنت: /crestodian restart gateway
OpenClaw: الخطة: إعادة تشغيل Gateway. ردّ بـ /crestodian yes للتطبيق.
أنت: /crestodian yes
OpenClaw: تم التطبيق. تمت كتابة إدخال التدقيق.
```

يمكن أيضًا وضع إنشاء الوكيل في الطابور من الموجّه المحلي أو من وضع الإنقاذ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

وضع الإنقاذ عن بُعد سطح إدارة. ويجب التعامل معه مثل إصلاح إعدادات عن بُعد،
وليس مثل الدردشة العادية.

عقد الأمان للإنقاذ عن بُعد:

- يكون معطّلًا عندما تكون العزلة مفعلة. إذا كانت هناك عزلة على وكيل/جلسة،
  فيجب على Crestodian رفض الإنقاذ عن بُعد وشرح أن إصلاح CLI المحلي
  مطلوب.
- الحالة الفعلية الافتراضية هي `auto`: اسمح بالإنقاذ عن بُعد فقط في تشغيل
  YOLO الموثوق، حيث تكون لبيئة التشغيل بالفعل صلاحية محلية غير معزولة.
- يتطلب هوية مالك صريحة. ويجب ألا يقبل الإنقاذ قواعد مرسل عامة باستخدام wildcard،
  أو سياسة مجموعات مفتوحة، أو Webhook غير موثقة، أو قنوات مجهولة.
- الرسائل الخاصة للمالك فقط بشكل افتراضي. ويتطلب إنقاذ المجموعات/القنوات
  اشتراكًا صريحًا.
- لا يمكن للإنقاذ عن بُعد فتح واجهة TUI المحلية أو التبديل إلى جلسة وكيل
  تفاعلية. استخدم `openclaw` المحلي لتسليم التحكم إلى الوكيل.
- لا تزال عمليات الكتابة الدائمة تتطلب الموافقة، حتى في وضع الإنقاذ.
- قم بتدقيق كل عملية إنقاذ مطبقة. ويسجل إنقاذ قناة الرسائل القناة
  والحساب والمرسل وبيانات تعريف مصدر العنوان. كما تسجل العمليات
  المعدِّلة للإعدادات أيضًا تجزئات الإعدادات قبل وبعد.
- لا تُظهر الأسرار مطلقًا. يجب أن يبلغ فحص SecretRef عن التوفر، لا عن القيم.
- إذا كانت Gateway تعمل، ففضّل عمليات Gateway المكتوبة النوع. وإذا كانت Gateway
  متوقفة، فاستخدم فقط أقل سطح إصلاح محلي لا يعتمد على حلقة الوكيل
  العادية.

شكل الإعدادات:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

يجب أن يقبل `enabled` ما يلي:

- `"auto"`: الافتراضي. السماح فقط عندما تكون بيئة التشغيل الفعلية YOLO و
  تكون العزلة معطلة.
- `false`: لا تسمح أبدًا بالإنقاذ عبر قناة الرسائل.
- `true`: اسمح صراحةً بالإنقاذ عندما تنجح فحوصات المالك/القناة. ومع ذلك،
  يجب ألا يتجاوز هذا رفض العزلة.

الوضع الافتراضي `"auto"` الخاص بـ YOLO هو:

- يتم تحليل وضع sandbox إلى `off`
- يتم تحليل `tools.exec.security` إلى `full`
- يتم تحليل `tools.exec.ask` إلى `off`

يغطي مسار Docker الإنقاذ عن بُعد:

```bash
pnpm test:docker:crestodian-rescue
```

ويغطي احتياط المخطط المحلي دون إعدادات:

```bash
pnpm test:docker:crestodian-planner
```

ويجري فحص smoke اختياري لسطح أوامر القناة الحية للتحقق من `/crestodian status`
إضافة إلى دورة موافقة دائمة كاملة عبر معالج الإنقاذ:

```bash
pnpm test:live:crestodian-rescue-channel
```

ويغطي هذا المسار إعدادًا جديدًا دون إعدادات عبر Crestodian:

```bash
pnpm test:docker:crestodian-first-run
```

يبدأ هذا المسار بدليل حالة فارغ، ويوجّه `openclaw` المجرد إلى Crestodian،
ويضبط النموذج الافتراضي، وينشئ وكيلًا إضافيًا، ويهيئ Discord عبر
تفعيل Plugin بالإضافة إلى SecretRef للرمز المميز، ويتحقق من صحة الإعدادات، ويفحص
سجل التدقيق. كما يحتوي QA Lab أيضًا على سيناريو مدعوم بالمستودع لنفس
تدفق Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Doctor](/ar/cli/doctor)
- [TUI](/ar/cli/tui)
- [Sandbox](/ar/cli/sandbox)
- [الأمان](/ar/cli/security)
