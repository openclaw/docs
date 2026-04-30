---
read_when:
    - تُشغّل openclaw دون تحديد أمر وتريد فهم Crestodian
    - تحتاج إلى طريقة آمنة دون إعدادات لفحص OpenClaw أو إصلاحه
    - أنت تصمّم أو تفعّل وضع الإنقاذ لقناة الرسائل
summary: مرجع CLI ونموذج الأمان لـ Crestodian، مساعد الإعداد والإصلاح الآمن بلا تهيئة
title: كريستوديان
x-i18n:
    generated_at: "2026-04-30T07:47:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian هو مساعد OpenClaw المحلي للإعداد والإصلاح والتكوين. وهو
مصمم ليبقى قابلاً للوصول عندما يكون مسار الوكيل العادي معطلاً.

تشغيل `openclaw` من دون أمر يبدأ Crestodian في طرفية تفاعلية.
تشغيل `openclaw crestodian` يبدأ المساعد نفسه صراحةً.

## ما يعرضه Crestodian

عند بدء التشغيل، يفتح Crestodian التفاعلي غلاف TUI نفسه الذي يستخدمه
`openclaw tui`، مع خلفية دردشة Crestodian. يبدأ سجل الدردشة بتحية قصيرة:

- متى تبدأ Crestodian
- النموذج أو مسار المخطط الحتمي الذي يستخدمه Crestodian فعلياً
- صلاحية التكوين والوكيل الافتراضي
- إمكانية الوصول إلى Gateway من أول فحص عند بدء التشغيل
- إجراء التصحيح التالي الذي يستطيع Crestodian تنفيذه

لا يفرغ الأسرار أو يحمّل أوامر Plugin CLI لمجرد البدء. لا يزال TUI
يوفر الرأس العادي، وسجل الدردشة، وسطر الحالة، والتذييل، والإكمال التلقائي،
وعناصر التحكم في المحرر.

استخدم `status` للحصول على الجرد التفصيلي مع مسار التكوين، ومسارات الوثائق/المصدر،
وفحوص CLI المحلية، ووجود مفاتيح API، والوكلاء، والنموذج، وتفاصيل Gateway.

يستخدم Crestodian آلية اكتشاف مراجع OpenClaw نفسها التي تستخدمها الوكلاء العاديون. في نسخة Git،
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
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## بدء تشغيل آمن

مسار بدء تشغيل Crestodian صغير عمداً. يمكنه العمل عندما:

- يكون `openclaw.json` مفقوداً
- يكون `openclaw.json` غير صالح
- يكون Gateway متوقفاً
- يكون تسجيل أوامر Plugin غير متاح
- لم يتم تكوين أي وكيل بعد

لا يزال `openclaw --help` و`openclaw --version` يستخدمان المسارات السريعة العادية.
أما `openclaw` غير التفاعلي فيخرج برسالة قصيرة بدلاً من طباعة مساعدة الجذر،
لأن المنتج من دون أمر هو Crestodian.

## العمليات والموافقة

يستخدم Crestodian عمليات نمطية بدلاً من تحرير التكوين بشكل ارتجالي.

يمكن تشغيل العمليات للقراءة فقط فوراً:

- عرض النظرة العامة
- سرد الوكلاء
- عرض حالة النموذج/الخلفية
- تشغيل فحوص الحالة أو الصحة
- التحقق من إمكانية الوصول إلى Gateway
- تشغيل doctor من دون إصلاحات تفاعلية
- التحقق من التكوين
- عرض مسار سجل التدقيق

تتطلب العمليات الدائمة موافقة حوارية في الوضع التفاعلي ما لم
تمرر `--yes` لأمر مباشر:

- كتابة التكوين
- تشغيل `config set`
- تعيين قيم SecretRef المدعومة عبر `config set-ref`
- تشغيل تمهيد الإعداد/التجهيز
- تغيير النموذج الافتراضي
- بدء Gateway أو إيقافه أو إعادة تشغيله
- إنشاء الوكلاء
- تشغيل إصلاحات doctor التي تعيد كتابة التكوين أو الحالة

تُسجل الكتابات المطبقة في:

```text
~/.openclaw/audit/crestodian.jsonl
```

لا يتم تدقيق الاكتشاف. لا يُسجل إلا العمليات والكتابات المطبقة.

يبدأ `openclaw onboard --modern` تشغيل Crestodian بصفته معاينة التجهيز الحديثة.
لا يزال `openclaw onboard` العادي يشغل التجهيز الكلاسيكي.

## تمهيد الإعداد

`setup` هو تمهيد التجهيز المعتمد على الدردشة أولاً. لا يكتب إلا عبر عمليات
تكوين نمطية ويطلب الموافقة أولاً.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

عندما لا يكون هناك نموذج مكوّن، يختار الإعداد أول خلفية قابلة للاستخدام بهذا
الترتيب ويخبرك بما اختاره:

- نموذج صريح موجود، إذا كان مكوّناً بالفعل
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

إذا لم يتوفر أي منها، فلا يزال الإعداد يكتب مساحة العمل الافتراضية ويترك
النموذج غير معين. ثبّت أو سجّل الدخول إلى Codex/Claude Code، أو أتح
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`، ثم شغّل الإعداد مرة أخرى.

## المخطط بمساعدة النموذج

يبدأ Crestodian دائماً في الوضع الحتمي. بالنسبة إلى الأوامر الغامضة التي لا
يفهمها المحلل الحتمي، يستطيع Crestodian المحلي إجراء دورة مخطط محدودة واحدة
عبر مسارات التشغيل العادية في OpenClaw. يستخدم أولاً نموذج OpenClaw
المكوّن. إذا لم يكن هناك نموذج مكوّن قابل للاستخدام بعد، فيمكنه الرجوع
إلى بيئات التشغيل المحلية الموجودة بالفعل على الجهاز:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- حزمة Codex app-server: `openai/gpt-5.5` مع `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

لا يستطيع المخطط بمساعدة النموذج تعديل التكوين مباشرةً. يجب أن يترجم
الطلب إلى أحد أوامر Crestodian النمطية، ثم تُطبق قواعد الموافقة والتدقيق
العادية. يطبع Crestodian النموذج الذي استخدمه والأمر الذي فسّره قبل أن
يشغل أي شيء. دورات مخطط الرجوع بلا تكوين تكون مؤقتة، ومعطلة الأدوات حيثما
تدعم بيئة التشغيل ذلك، وتستخدم مساحة عمل/جلسة مؤقتة.

لا يستخدم وضع الإنقاذ عبر قناة الرسائل المخطط بمساعدة النموذج. يبقى
الإنقاذ البعيد حتمياً حتى لا يمكن استخدام مسار وكيل عادي معطل أو مخترق
كمحرر تكوين.

## التبديل إلى وكيل

استخدم محدداً باللغة الطبيعية لمغادرة Crestodian وفتح TUI العادي:

```text
talk to agent
talk to work agent
switch to main agent
```

لا تزال `openclaw tui` و`openclaw chat` و`openclaw terminal` تفتح
TUI الوكيل العادي مباشرةً. وهي لا تبدأ Crestodian.

بعد التبديل إلى TUI العادي، استخدم `/crestodian` للعودة إلى Crestodian.
يمكنك تضمين طلب متابعة:

```text
/crestodian
/crestodian restart gateway
```

تترك تبديلات الوكيل داخل TUI أثراً يشير إلى أن `/crestodian` متاح.

## وضع الإنقاذ عبر الرسائل

وضع الإنقاذ عبر الرسائل هو نقطة دخول قناة الرسائل إلى Crestodian. وهو مخصص
للحالة التي يكون فيها وكيلك العادي متوقفاً، لكن قناة موثوقة مثل WhatsApp
لا تزال تستقبل الأوامر.

الأمر النصي المدعوم:

- `/crestodian <request>`

تدفق المشغل:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

يمكن أيضاً وضع إنشاء الوكيل في قائمة الانتظار من المطالبة المحلية أو وضع الإنقاذ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

وضع الإنقاذ البعيد سطح إداري. يجب التعامل معه مثل إصلاح تكوين بعيد،
وليس مثل دردشة عادية.

عقد الأمان للإنقاذ البعيد:

- معطل عندما يكون العزل الرملي نشطاً. إذا كان الوكيل/الجلسة ضمن عزل رملي،
  فيجب على Crestodian رفض الإنقاذ البعيد وشرح أن إصلاح CLI المحلي
  مطلوب.
- الحالة الفعالة الافتراضية هي `auto`: اسمح بالإنقاذ البعيد فقط في تشغيل YOLO
  موثوق، حيث تمتلك بيئة التشغيل بالفعل سلطة محلية غير معزولة.
- يتطلب هوية مالك صريحة. يجب ألا يقبل الإنقاذ قواعد مرسل عامة
  أو سياسة مجموعة مفتوحة أو Webhook غير مصادق أو قنوات مجهولة.
- رسائل المالك المباشرة فقط افتراضياً. يتطلب الإنقاذ في المجموعة/القناة اشتراكاً صريحاً.
- لا يستطيع الإنقاذ البعيد فتح TUI المحلي أو التبديل إلى جلسة وكيل تفاعلية.
  استخدم `openclaw` المحلي لتسليم الوكيل.
- لا تزال الكتابات الدائمة تتطلب الموافقة، حتى في وضع الإنقاذ.
- دقق كل عملية إنقاذ مطبقة. يسجل الإنقاذ عبر قناة الرسائل القناة،
  والحساب، والمرسل، وبيانات عنوان المصدر الوصفية. العمليات التي تعدّل التكوين تسجل أيضاً
  تجزئات التكوين قبل وبعد.
- لا تردد الأسرار أبداً. يجب أن يبلغ فحص SecretRef عن التوافر، لا
  القيم.
- إذا كان Gateway نشطاً، ففضّل عمليات Gateway النمطية. إذا كان Gateway
  متوقفاً، فاستخدم فقط سطح الإصلاح المحلي الأدنى الذي لا يعتمد على حلقة
  الوكيل العادية.

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

- `"auto"`: الافتراضي. اسمح فقط عندما تكون بيئة التشغيل الفعالة YOLO ويكون
  العزل الرملي متوقفاً.
- `false`: لا تسمح أبداً بالإنقاذ عبر قناة الرسائل.
- `true`: اسمح صراحةً بالإنقاذ عندما تنجح فحوص المالك/القناة. لا يزال
  هذا يجب ألا يتجاوز رفض العزل الرملي.

وضع YOLO الافتراضي لـ `"auto"` هو:

- يحل وضع العزل الرملي إلى `off`
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

يتحقق فحص حي اختياري لسطح أوامر القناة من `/crestodian status` إضافة إلى
جولة موافقة دائمة عبر معالج الإنقاذ:

```bash
pnpm test:live:crestodian-rescue-channel
```

يغطي ما يلي الإعداد الجديد بلا تكوين عبر Crestodian:

```bash
pnpm test:docker:crestodian-first-run
```

يبدأ ذلك المسار بدليل حالة فارغ، ويوجه `openclaw` المجرد إلى Crestodian،
ويعين النموذج الافتراضي، وينشئ وكيلاً إضافياً، ويكوّن Discord عبر
تمكين Plugin إضافة إلى SecretRef للرمز، ويتحقق من التكوين، ويفحص سجل التدقيق.
يمتلك QA Lab أيضاً سيناريو مدعوماً بالمستودع لتدفق Ring 0 نفسه:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Doctor](/ar/cli/doctor)
- [TUI](/ar/cli/tui)
- [العزل الرملي](/ar/cli/sandbox)
- [الأمان](/ar/cli/security)
