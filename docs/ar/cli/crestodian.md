---
read_when:
    - تُشغِّل openclaw دون أي أمر وتريد فهم Crestodian
    - تحتاج إلى طريقة آمنة دون إعدادات لفحص OpenClaw أو إصلاحه
    - أنت بصدد تصميم وضع الإنقاذ لقنوات الرسائل أو تفعيله
summary: مرجع CLI ونموذج الأمان لـ Crestodian، مساعد الإعداد والإصلاح الآمن دون تهيئة
title: كريستوديان
x-i18n:
    generated_at: "2026-05-02T07:21:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian هو مساعد OpenClaw المحلي للإعداد والإصلاح والتكوين. صُمم ليبقى
قابلاً للوصول عندما يكون مسار الوكيل العادي معطلاً.

تشغيل `openclaw` بدون أمر يبدأ Crestodian في طرفية تفاعلية.
تشغيل `openclaw crestodian` يبدأ المساعد نفسه صراحةً.

## ما يعرضه Crestodian

عند بدء التشغيل، يفتح Crestodian التفاعلي واجهة TUI نفسها المستخدمة بواسطة
`openclaw tui`، مع خلفية دردشة Crestodian. يبدأ سجل الدردشة بتحية قصيرة:

- متى تبدأ Crestodian
- النموذج أو مسار المخطط الحتمي الذي يستخدمه Crestodian فعلياً
- صلاحية التكوين والوكيل الافتراضي
- قابلية الوصول إلى Gateway من أول فحص بدء تشغيل
- إجراء التصحيح التالي الذي يمكن لـ Crestodian تنفيذه

لا يفرغ الأسرار ولا يحمّل أوامر CLI الخاصة بالـ plugin لمجرد البدء. لا تزال TUI
توفر الرأس العادي، وسجل الدردشة، وسطر الحالة، والتذييل، والإكمال التلقائي،
وعناصر تحكم المحرر.

استخدم `status` للحصول على الجرد التفصيلي مع مسار التكوين، ومسارات المستندات/المصدر،
وفحوصات CLI المحلية، ووجود مفاتيح API، والوكلاء، والنموذج، وتفاصيل Gateway.

يستخدم Crestodian اكتشاف مراجع OpenClaw نفسه الذي تستخدمه الوكلاء العادية. في نسخة Git،
يشير إلى `docs/` المحلية وشجرة المصدر المحلية. في تثبيت حزمة npm، يستخدم
مستندات الحزمة المضمّنة ويربط إلى
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)، مع إرشاد صريح
لمراجعة المصدر كلما لم تكن المستندات كافية.

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

داخل TUI الخاصة بـ Crestodian:

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

## بدء التشغيل الآمن

مسار بدء تشغيل Crestodian صغير عمداً. يمكن تشغيله عندما:

- يكون `openclaw.json` مفقوداً
- يكون `openclaw.json` غير صالح
- يكون Gateway متوقفاً
- يكون تسجيل أوامر plugin غير متاح
- لم يتم تكوين أي وكيل بعد

لا يزال `openclaw --help` و`openclaw --version` يستخدمان المسارات السريعة العادية.
يخرج `openclaw` غير التفاعلي برسالة قصيرة بدلاً من طباعة مساعدة الجذر،
لأن المنتج بدون أمر هو Crestodian.

## العمليات والموافقة

يستخدم Crestodian عمليات ذات أنواع بدلاً من تحرير التكوين بطريقة مرتجلة.

يمكن تشغيل العمليات للقراءة فقط فوراً:

- عرض النظرة العامة
- سرد الوكلاء
- سرد الـ plugins المثبتة
- البحث في Plugins ClawHub
- عرض حالة النموذج/الخلفية
- تشغيل فحوصات الحالة أو الصحة
- التحقق من قابلية الوصول إلى Gateway
- تشغيل doctor بدون إصلاحات تفاعلية
- التحقق من صحة التكوين
- عرض مسار سجل التدقيق

تتطلب العمليات الدائمة موافقة حوارية في الوضع التفاعلي ما لم تمرر
`--yes` لأمر مباشر:

- كتابة التكوين
- تشغيل `config set`
- تعيين قيم SecretRef المدعومة عبر `config set-ref`
- تشغيل تمهيد الإعداد/الإلحاق
- تغيير النموذج الافتراضي
- بدء Gateway أو إيقافه أو إعادة تشغيله
- إنشاء الوكلاء
- تثبيت plugins من ClawHub أو npm
- إلغاء تثبيت plugins
- تشغيل إصلاحات doctor التي تعيد كتابة التكوين أو الحالة

تُسجل عمليات الكتابة المطبقة في:

```text
~/.openclaw/audit/crestodian.jsonl
```

لا يخضع الاكتشاف للتدقيق. لا تُسجل إلا العمليات والكتابات المطبقة.

يبدأ `openclaw onboard --modern` تشغيل Crestodian بصفته معاينة الإلحاق الحديثة.
لا يزال `openclaw onboard` العادي يشغل الإلحاق التقليدي.

## تمهيد الإعداد

`setup` هو تمهيد الإلحاق الذي يبدأ من الدردشة. يكتب فقط عبر عمليات تكوين
ذات أنواع ويطلب الموافقة أولاً.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

عندما لا يكون هناك نموذج مكوّن، يختار الإعداد أول خلفية قابلة للاستخدام بهذا
الترتيب ويخبرك بما اختاره:

- النموذج الصريح الموجود، إذا كان مكوّناً بالفعل
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

إذا لم يتوفر أي منها، يظل الإعداد يكتب مساحة العمل الافتراضية ويترك
النموذج غير معيّن. ثبّت Codex/Claude Code أو سجّل الدخول إليهما، أو اكشف
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`، ثم شغّل الإعداد مرة أخرى.

## المخطط بمساعدة النموذج

يبدأ Crestodian دائماً في الوضع الحتمي. للأوامر الضبابية التي لا يفهمها
المحلل الحتمي، يمكن لـ Crestodian المحلي إجراء دورة مخطط واحدة محدودة
عبر مسارات وقت التشغيل العادية في OpenClaw. يستخدم أولاً نموذج OpenClaw
المكوّن. إذا لم يكن هناك نموذج مكوّن قابل للاستخدام بعد، يمكنه الرجوع إلى
أوقات التشغيل المحلية الموجودة بالفعل على الجهاز:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` with `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

لا يستطيع المخطط بمساعدة النموذج تعديل التكوين مباشرةً. يجب أن يترجم
الطلب إلى أحد أوامر Crestodian ذات الأنواع، ثم تطبق قواعد الموافقة والتدقيق
العادية. يطبع Crestodian النموذج الذي استخدمه والأمر المفسر قبل أن يشغّل
أي شيء. دورات مخطط الرجوع بلا تكوين مؤقتة، ومعطلة الأدوات حيث يدعم وقت
التشغيل ذلك، وتستخدم مساحة عمل/جلسة مؤقتة.

لا يستخدم وضع الإنقاذ عبر قناة الرسائل المخطط بمساعدة النموذج. يبقى
الإنقاذ البعيد حتمياً حتى لا يُستخدم مسار وكيل عادي معطل أو مخترق كمحرر
تكوين.

## التبديل إلى وكيل

استخدم محدداً باللغة الطبيعية لمغادرة Crestodian وفتح TUI العادية:

```text
talk to agent
talk to work agent
switch to main agent
```

لا تزال `openclaw tui` و`openclaw chat` و`openclaw terminal` تفتح TUI العادية
للوكيل مباشرةً. إنها لا تبدأ Crestodian.

بعد التبديل إلى TUI العادية، استخدم `/crestodian` للعودة إلى Crestodian.
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

أمر النص المدعوم:

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

يمكن أيضاً وضع إنشاء الوكيل في قائمة انتظار من الموجه المحلي أو وضع الإنقاذ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

وضع الإنقاذ البعيد هو سطح إدارة. يجب التعامل معه كإصلاح تكوين بعيد،
لا كدردشة عادية.

عقد الأمان للإنقاذ البعيد:

- معطل عندما تكون العزلة sandboxing نشطة. إذا كان وكيل/جلسة ضمن sandbox،
  يجب أن يرفض Crestodian الإنقاذ البعيد وأن يوضح أن إصلاح CLI المحلي مطلوب.
- الحالة الفعالة الافتراضية هي `auto`: اسمح بالإنقاذ البعيد فقط في تشغيل YOLO
  موثوق، حيث يملك وقت التشغيل أصلاً صلاحية محلية غير معزولة.
- يتطلب هوية مالك صريحة. يجب ألا يقبل الإنقاذ قواعد مرسل wildcard،
  أو سياسة مجموعة مفتوحة، أو Webhook غير موثق، أو قنوات مجهولة.
- رسائل المالك المباشرة فقط افتراضياً. يتطلب إنقاذ المجموعة/القناة اشتراكاً صريحاً.
- البحث عن Plugin والقائمة للقراءة فقط. تثبيت Plugin محلي فقط افتراضياً
  لأنه ينزّل شيفرة قابلة للتنفيذ. يمكن السماح بإلغاء تثبيت Plugin كعملية
  إصلاح معتمدة عندما تسمح سياسة الإنقاذ بالكتابات الدائمة.
- لا يستطيع الإنقاذ البعيد فتح TUI المحلية أو التبديل إلى جلسة وكيل تفاعلية.
  استخدم `openclaw` المحلي لتسليم الوكيل.
- لا تزال الكتابات الدائمة تتطلب موافقة، حتى في وضع الإنقاذ.
- دقق كل عملية إنقاذ مطبقة. يسجل إنقاذ قناة الرسائل بيانات وصفية للقناة،
  والحساب، والمرسل، وعنوان المصدر. تسجل العمليات التي تعدل التكوين أيضاً
  تجزئات التكوين قبلها وبعدها.
- لا تردد الأسرار أبداً. يجب أن يبلغ فحص SecretRef عن التوفر، لا القيم.
- إذا كان Gateway حياً، ففضّل عمليات Gateway ذات الأنواع. إذا كان Gateway
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

- `"auto"`: الافتراضي. اسمح فقط عندما يكون وقت التشغيل الفعال YOLO وتكون
  العزلة sandboxing متوقفة.
- `false`: لا تسمح أبداً بالإنقاذ عبر قناة الرسائل.
- `true`: اسمح صراحةً بالإنقاذ عندما تنجح فحوصات المالك/القناة. لا يزال
  هذا يجب ألا يتجاوز رفض العزلة sandboxing.

وضعية YOLO الافتراضية `"auto"` هي:

- يتحول وضع sandbox إلى `off`
- يتحول `tools.exec.security` إلى `full`
- يتحول `tools.exec.ask` إلى `off`

يغطي مسار Docker الإنقاذ البعيد:

```bash
pnpm test:docker:crestodian-rescue
```

يغطي ما يلي رجوع المخطط المحلي بلا تكوين:

```bash
pnpm test:docker:crestodian-planner
```

يفحص اختبار smoke اختياري لسطح أوامر القناة الحية `/crestodian status` بالإضافة إلى
جولة موافقة دائمة ذهاباً وإياباً عبر معالج الإنقاذ:

```bash
pnpm test:live:crestodian-rescue-channel
```

يغطي ما يلي الإعداد الجديد بلا تكوين عبر Crestodian:

```bash
pnpm test:docker:crestodian-first-run
```

يبدأ ذلك المسار بدليل حالة فارغ، ويوجه `openclaw` المجرد إلى Crestodian،
ويضبط النموذج الافتراضي، وينشئ وكيلاً إضافياً، ويكوّن Discord عبر تفعيل
Plugin بالإضافة إلى SecretRef للرمز، ويتحقق من صحة التكوين، ويفحص سجل التدقيق.
لدى QA Lab أيضاً سيناريو مدعوم بالمستودع لتدفق Ring 0 نفسه:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Doctor](/ar/cli/doctor)
- [TUI](/ar/cli/tui)
- [Sandbox](/ar/cli/sandbox)
- [الأمان](/ar/cli/security)
