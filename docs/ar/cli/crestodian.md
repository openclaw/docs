---
read_when:
    - تشغّل openclaw بدون أي أمر بعد الإعداد وتريد فهم Crestodian
    - تحتاج إلى طريقة آمنة بلا إعدادات لفحص OpenClaw أو إصلاحه
    - أنت تصمم أو تفعّل وضع الإنقاذ لقناة الرسائل
summary: مرجع CLI ونموذج الأمان لـ Crestodian، مساعد الإعداد والإصلاح الآمن بدون تكوين
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T17:20:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian هو مساعد OpenClaw المحلي للإعداد والإصلاح والتكوين. صُمم ليبقى
قابلًا للوصول عندما يكون مسار الوكيل المعتاد معطلًا.

تشغيل `openclaw` دون أمر يبدأ أولًا الإعداد الكلاسيكي عند فقدان ملف التكوين
النشط أو عندما لا يحتوي على إعدادات مؤلفة (فارغ أو بيانات وصفية فقط). بعد أن
يحتوي ملف التكوين على إعدادات مؤلفة، فإن تشغيل `openclaw` دون أمر يبدأ
Crestodian في طرفية تفاعلية. تشغيل `openclaw crestodian` يبدأ المساعد نفسه
صراحة.

## ما يعرضه Crestodian

عند بدء التشغيل، يفتح Crestodian التفاعلي غلاف TUI نفسه المستخدم بواسطة
`openclaw tui`، مع خلفية دردشة Crestodian. يبدأ سجل الدردشة بتحية قصيرة:

- متى تبدأ Crestodian
- النموذج أو مسار المخطط الحتمي الذي يستخدمه Crestodian فعليًا
- صلاحية التكوين والوكيل الافتراضي
- قابلية الوصول إلى Gateway من فحص بدء التشغيل الأول
- إجراء التصحيح التالي الذي يستطيع Crestodian اتخاذه

لا يفرغ الأسرار أو يحمّل أوامر CLI الخاصة بالـ Plugin لمجرد البدء. ما زال TUI
يوفر الترويسة العادية، وسجل الدردشة، وسطر الحالة، والتذييل، والإكمال التلقائي،
وعناصر التحكم في المحرر.

استخدم `status` للحصول على الجرد المفصل مع مسار التكوين، ومسارات الوثائق/المصدر،
وفحوص CLI المحلية، ووجود مفتاح API، والوكلاء، والنموذج، وتفاصيل Gateway.

يستخدم Crestodian اكتشاف مراجع OpenClaw نفسه الذي يستخدمه الوكلاء العاديون. في نسخة Git،
يوجه نفسه إلى `docs/` المحلية وشجرة المصدر المحلية. في تثبيت حزمة npm، يستخدم
وثائق الحزمة المضمنة ويربط إلى
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)، مع إرشاد صريح
لمراجعة المصدر كلما لم تكن الوثائق كافية.

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

داخل TUI الخاص بـ Crestodian:

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
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## بدء تشغيل آمن

مسار بدء تشغيل Crestodian صغير عمدًا. يمكنه العمل عندما:

- يكون `openclaw.json` مفقودًا
- يكون `openclaw.json` غير صالح
- يكون Gateway متوقفًا
- يكون تسجيل أوامر Plugin غير متاح
- لم يتم تكوين أي وكيل بعد

ما زال `openclaw --help` و`openclaw --version` يستخدمان المسارات السريعة العادية.
يخرج `openclaw` العاري غير التفاعلي برسالة قصيرة بدلًا من طباعة مساعدة الجذر.
في تثبيت جديد، تشير الرسالة إلى الإعداد غير التفاعلي؛ وبعد الإعداد، تشير إلى
أوامر Crestodian أحادية التنفيذ.

## العمليات والموافقة

يستخدم Crestodian عمليات ذات أنواع محددة بدلًا من تحرير التكوين على نحو ارتجالي.

يمكن تشغيل العمليات للقراءة فقط فورًا:

- عرض النظرة العامة
- سرد الوكلاء
- سرد Plugins المثبتة
- البحث في Plugins الخاصة بـ ClawHub
- عرض حالة النموذج/الخلفية
- تشغيل فحوص الحالة أو السلامة
- فحص قابلية الوصول إلى Gateway
- تشغيل doctor دون إصلاحات تفاعلية
- التحقق من صحة التكوين
- عرض مسار سجل التدقيق

تتطلب العمليات الدائمة موافقة محادثية في الوضع التفاعلي ما لم تمرر `--yes`
لأمر مباشر:

- كتابة التكوين
- تشغيل `config set`
- تعيين قيم SecretRef المدعومة عبر `config set-ref`
- تشغيل تمهيد الإعداد/التهيئة
- تغيير النموذج الافتراضي
- بدء Gateway أو إيقافه أو إعادة تشغيله
- إنشاء الوكلاء
- تثبيت Plugins من ClawHub أو npm
- إلغاء تثبيت Plugins
- تشغيل إصلاحات doctor التي تعيد كتابة التكوين أو الحالة

تُسجل الكتابات المطبقة في:

```text
~/.openclaw/audit/crestodian.jsonl
```

لا يخضع الاكتشاف للتدقيق. لا تُسجل إلا العمليات والكتابات المطبقة.

`openclaw onboard --modern` يبدأ Crestodian كمعاينة الإعداد الحديثة.
أما `openclaw onboard` العادي فما زال يشغل الإعداد الكلاسيكي.

## تمهيد الإعداد

`setup` هو تمهيد الإعداد المعتمد على الدردشة أولًا. يكتب فقط عبر عمليات تكوين
ذات أنواع محددة ويطلب الموافقة أولًا.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

عندما لا يكون هناك نموذج مكوَّن، يختار الإعداد أول خلفية قابلة للاستخدام بهذا
الترتيب ويخبرك بما اختاره:

- النموذج الصريح الموجود، إذا كان مكوّنًا بالفعل
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> `openai/gpt-5.5` عبر حزمة تطبيق خادم Codex

إذا لم يكن أي منها متاحًا، يظل الإعداد يكتب مساحة العمل الافتراضية ويترك
النموذج غير مضبوط. ثبّت Codex/Claude Code أو سجّل الدخول إليهما، أو أتح
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`، ثم شغّل الإعداد مرة أخرى.

## المخطط بمساعدة النموذج

يبدأ Crestodian دائمًا في الوضع الحتمي. بالنسبة إلى الأوامر الغامضة التي لا
يفهمها المحلل الحتمي، يمكن لـ Crestodian المحلي إجراء دورة مخطط واحدة محدودة
عبر مسارات وقت التشغيل العادية في OpenClaw. يستخدم أولًا نموذج OpenClaw
المكوّن. إذا لم يكن هناك نموذج مكوّن قابل للاستخدام بعد، فيمكنه الرجوع إلى
أوقات التشغيل المحلية الموجودة بالفعل على الجهاز:

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- حزمة تطبيق خادم Codex: `openai/gpt-5.5`

لا يستطيع المخطط بمساعدة النموذج تعديل التكوين مباشرة. يجب أن يترجم الطلب إلى
أحد أوامر Crestodian ذات الأنواع المحددة، ثم تُطبق قواعد الموافقة والتدقيق
العادية. يطبع Crestodian النموذج الذي استخدمه والأمر المفسر قبل تشغيل أي شيء.
دورات مخطط الرجوع بلا تكوين مؤقتة، ومعطلة الأدوات حيث يدعم وقت التشغيل ذلك،
وتستخدم مساحة عمل/جلسة مؤقتة.

لا يستخدم وضع الإنقاذ عبر قناة الرسائل المخطط بمساعدة النموذج. يبقى الإنقاذ
البعيد حتميًا حتى لا يُستخدم مسار وكيل عادي معطل أو مخترق كمحرر تكوين.

## التبديل إلى وكيل

استخدم محددًا بلغة طبيعية لمغادرة Crestodian وفتح TUI العادي:

```text
talk to agent
talk to work agent
switch to main agent
```

ما زالت `openclaw tui` و`openclaw chat` و`openclaw terminal` تفتح TUI الوكيل
العادي مباشرة. إنها لا تبدأ Crestodian.

بعد التبديل إلى TUI العادي، استخدم `/crestodian` للعودة إلى Crestodian.
يمكنك تضمين طلب متابعة:

```text
/crestodian
/crestodian restart gateway
```

تترك تبديلات الوكلاء داخل TUI أثرًا يدل على أن `/crestodian` متاح.

## وضع الإنقاذ عبر الرسائل

وضع الإنقاذ عبر الرسائل هو نقطة دخول قناة الرسائل إلى Crestodian. وهو مخصص
للحالة التي يكون فيها وكيلك العادي متوقفًا، لكن قناة موثوقة مثل WhatsApp
ما زالت تستقبل الأوامر.

أمر النص المدعوم:

- `/crestodian <request>`

تدفق المشغّل:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

يمكن أيضًا وضع إنشاء الوكيل في قائمة الانتظار من المطالبة المحلية أو وضع الإنقاذ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

وضع الإنقاذ البعيد سطح إداري. يجب التعامل معه كإصلاح تكوين بعيد، لا كدردشة عادية.

عقد الأمان للإنقاذ البعيد:

- معطل عندما يكون وضع العزل نشطًا. إذا كان وكيل/جلسة معزولًا، فيجب أن يرفض
  Crestodian الإنقاذ البعيد ويوضح أن إصلاح CLI المحلي مطلوب.
- الحالة الفعلية الافتراضية هي `auto`: السماح بالإنقاذ البعيد فقط في تشغيل YOLO
  موثوق، حيث يكون لدى وقت التشغيل بالفعل سلطة محلية غير معزولة.
- يتطلب هوية مالك صريحة. يجب ألا يقبل الإنقاذ قواعد مرسل عامة، أو سياسة مجموعة
  مفتوحة، أو Webhooks غير مصادق عليها، أو قنوات مجهولة.
- رسائل المالك المباشرة فقط افتراضيًا. يتطلب إنقاذ المجموعة/القناة اشتراكًا صريحًا.
- البحث عن Plugin وسرده للقراءة فقط. تثبيت Plugin محلي فقط افتراضيًا لأنه ينزل
  كودًا قابلًا للتنفيذ. يمكن السماح بإلغاء تثبيت Plugin كعملية إصلاح معتمدة
  عندما تسمح سياسة الإنقاذ بالكتابات الدائمة.
- لا يستطيع الإنقاذ البعيد فتح TUI المحلي أو التبديل إلى جلسة وكيل تفاعلية.
  استخدم `openclaw` المحلي لتسليم الوكيل.
- ما زالت الكتابات الدائمة تتطلب موافقة، حتى في وضع الإنقاذ.
- دقق كل عملية إنقاذ مطبقة. يسجل إنقاذ قناة الرسائل القناة والحساب والمرسل
  وبيانات تعريف عنوان المصدر. وتسجل العمليات التي تعدل التكوين أيضًا تجزئات
  التكوين قبل وبعد.
- لا تردد الأسرار أبدًا. يجب أن يبلّغ فحص SecretRef عن التوافر، لا القيم.
- إذا كان Gateway حيًا، ففضّل عمليات Gateway ذات الأنواع المحددة. إذا كان Gateway
  متوقفًا، فاستخدم فقط سطح الإصلاح المحلي الأدنى الذي لا يعتمد على حلقة الوكيل
  العادية.

شكل التكوين:

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

يجب أن يقبل `enabled`:

- `"auto"`: الافتراضي. السماح فقط عندما يكون وقت التشغيل الفعلي هو YOLO ويكون
  العزل متوقفًا.
- `false`: عدم السماح أبدًا بالإنقاذ عبر قناة الرسائل.
- `true`: السماح صراحة بالإنقاذ عندما تنجح فحوص المالك/القناة. ما زال هذا
  يجب ألا يتجاوز رفض العزل.

وضع YOLO الافتراضي `"auto"` هو:

- يحل وضع العزل إلى `off`
- يحل `tools.exec.security` إلى `full`
- يحل `tools.exec.ask` إلى `off`

يغطي مسار Docker الإنقاذ البعيد:

```bash
pnpm test:docker:crestodian-rescue
```

يغطي ما يلي رجوع المخطط المحلي بلا تكوين:

```bash
pnpm test:docker:crestodian-planner
```

يفحص اختبار دخان سطح أوامر قناة حي اختياري `/crestodian status` بالإضافة إلى
رحلة موافقة دائمة ذهابًا وإيابًا عبر معالج الإنقاذ:

```bash
pnpm test:live:crestodian-rescue-channel
```

يغطي ما يلي الإعداد بلا تكوين عبر أوامر Crestodian الصريحة:

```bash
pnpm test:docker:crestodian-first-run
```

يبدأ ذلك المسار بدليل حالة فارغ، ويتحقق من نقطة دخول Crestodian الحديثة عبر
onboard، ويعيّن النموذج الافتراضي، وينشئ وكيلًا إضافيًا، ويكوّن Discord عبر
تمكين Plugin بالإضافة إلى SecretRef للرمز، ويتحقق من صحة التكوين، ويفحص سجل
التدقيق. لدى QA Lab أيضًا سيناريو مدعومًا من المستودع لتدفق Ring 0 نفسه:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Doctor](/ar/cli/doctor)
- [TUI](/ar/cli/tui)
- [العزل](/ar/cli/sandbox)
- [الأمان](/ar/cli/security)
