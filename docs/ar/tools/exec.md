---
read_when:
    - استخدام أداة exec أو تعديلها
    - تصحيح سلوك stdin أو TTY
summary: استخدام أداة Exec، وأوضاع stdin، ودعم TTY
title: أداة Exec
x-i18n:
    generated_at: "2026-04-24T08:08:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

شغّل أوامر shell في مساحة العمل. ويدعم التنفيذ في الواجهة الأمامية + الخلفية عبر `process`.
إذا كانت `process` غير مسموح بها، فإن `exec` تعمل بشكل متزامن وتتجاهل `yieldMs`/`background`.
تكون الجلسات الخلفية مقيّدة بكل وكيل؛ ولا ترى `process` إلا الجلسات التابعة للوكيل نفسه.

## المعلمات

<ParamField path="command" type="string" required>
أمر shell المطلوب تشغيله.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دليل العمل الخاص بالأمر.
</ParamField>

<ParamField path="env" type="object">
تجاوزات بيئة على شكل مفتاح/قيمة يتم دمجها فوق البيئة الموروثة.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
تحويل الأمر تلقائيًا إلى الخلفية بعد هذا التأخير (مللي ثانية).
</ParamField>

<ParamField path="background" type="boolean" default="false">
تشغيل الأمر في الخلفية فورًا بدلًا من انتظار `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
اقتل الأمر بعد هذا العدد من الثواني.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
شغّله في pseudo-terminal عند توفره. استخدمه لأدوات CLI التي لا تعمل إلا مع TTY، ولوكلاء البرمجة، وواجهات الطرفية.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
مكان التنفيذ. تحل `auto` إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطًا وإلى `gateway` بخلاف ذلك.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
وضع الإنفاذ لتنفيذ `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
سلوك مطالبة الموافقة لتنفيذ `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
معرّف/اسم Node عندما تكون `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
اطلب الوضع المرتفع — الخروج من sandbox إلى مسار المضيف المهيأ. يتم فرض `security=full` فقط عندما تُحل elevated إلى `full`.
</ParamField>

ملاحظات:

- القيمة الافتراضية لـ `host` هي `auto`: ‏sandbox عندما يكون وقت تشغيل sandbox نشطًا للجلسة، وإلا gateway.
- تمثل `auto` إستراتيجية التوجيه الافتراضية، وليست wildcard. يُسمح باستدعاء `host=node` لكل طلب من `auto`؛ أما `host=gateway` لكل طلب فلا يُسمح به إلا عندما لا يكون وقت تشغيل sandbox نشطًا.
- من دون إعداد إضافي، لا يزال `host=auto` "يعمل ببساطة": عدم وجود sandbox يعني أنه يُحل إلى `gateway`؛ ووجود sandbox حية يعني أنه يبقى داخل sandbox.
- تؤدي `elevated` إلى الخروج من sandbox إلى مسار المضيف المهيأ: `gateway` افتراضيًا، أو `node` عندما تكون `tools.exec.host=node` (أو عندما يكون افتراضي الجلسة هو `host=node`). وهي متاحة فقط عندما يكون الوصول المرتفع مفعّلًا للجلسة/المزوّد الحاليين.
- يتم التحكم في موافقات `gateway`/`node` عبر `~/.openclaw/exec-approvals.json`.
- تتطلب `node` وجود Node مقترنة (تطبيق مرافق أو مضيف عقدة بلا واجهة).
- إذا كانت عدة Nodes متاحة، فاضبط `exec.node` أو `tools.exec.node` لاختيار واحدة.
- تُعد `exec host=node` هي مسار تنفيذ shell الوحيد للعقد؛ وقد تمت إزالة الغلاف القديم `nodes.run`.
- على المضيفات غير Windows، تستخدم exec قيمة `SHELL` عند ضبطها؛ وإذا كانت `SHELL` هي `fish`، فإنه يفضّل `bash` (أو `sh`)
  من `PATH` لتجنب النصوص غير المتوافقة مع fish، ثم يرجع احتياطيًا إلى `SHELL` إذا لم يوجد أي منهما.
- على مضيفات Windows، تفضّل exec اكتشاف PowerShell 7 ‏(`pwsh`) (داخل Program Files، ثم ProgramW6432، ثم PATH)،
  ثم ترجع احتياطيًا إلى Windows PowerShell 5.1.
- يرفض تنفيذ المضيف (`gateway`/`node`) تجاوزات `env.PATH` وتجاوزات loader ‏(`LD_*`/`DYLD_*`) لمنع
  اختطاف الملفات التنفيذية أو حقن الشيفرة.
- يضبط OpenClaw القيمة `OPENCLAW_SHELL=exec` في بيئة الأمر المُولَّد (بما في ذلك تنفيذ PTY وsandbox) حتى تتمكن قواعد shell/profile من اكتشاف سياق أداة exec.
- مهم: تكون sandboxing **معطلة افتراضيًا**. إذا كانت sandboxing معطلة، فإن `host=auto`
  الضمنية تُحل إلى `gateway`. أما `host=sandbox` الصريحة فلا تزال تفشل بشكل مغلق بدلًا من التشغيل بصمت
  على مضيف gateway. فعّل sandboxing أو استخدم `host=gateway` مع الموافقات.
- لا تفحص فحوصات script preflight (للأخطاء الشائعة في صياغة shell الخاصة بـ Python/Node) إلا الملفات الموجودة داخل
  حد `workdir` الفعلي. وإذا تحلل مسار script إلى خارج `workdir`، يتم تخطي preflight
  لذلك الملف.
- بالنسبة إلى الأعمال طويلة التشغيل التي تبدأ الآن، ابدأها مرة واحدة واعتمد على
  التنبيه التلقائي عند الاكتمال عندما يكون مفعّلًا ويصدر الأمر مخرجات أو يفشل.
  استخدم `process` للسجلات، أو الحالة، أو الإدخال، أو التدخل؛ ولا تحاكِ
  الجدولة عبر حلقات sleep، أو حلقات timeout، أو polling المتكرر.
- بالنسبة إلى العمل الذي يجب أن يحدث لاحقًا أو وفق جدول زمني، فاستخدم Cron بدلًا من
  أنماط النوم/التأخير في `exec`.

## الإعداد

- `tools.exec.notifyOnExit` (الافتراضي: true): عندما تكون true، تقوم جلسات exec الخلفية بإدراج حدث نظام وطلب Heartbeat عند الخروج.
- `tools.exec.approvalRunningNoticeMs` (الافتراضي: 10000): إصدار إشعار واحد "قيد التشغيل" عندما تستمر exec الخاضعة للموافقة لأكثر من هذه المدة (‏0 للتعطيل).
- `tools.exec.host` (الافتراضي: `auto`؛ وتُحل إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطًا، وإلى `gateway` بخلاف ذلك)
- `tools.exec.security` (الافتراضي: `deny` لـ sandbox، و`full` لـ gateway + node عند عدم الضبط)
- `tools.exec.ask` (الافتراضي: `off`)
- يمثل no-approval host exec الوضع الافتراضي لكل من gateway + node. وإذا كنت تريد سلوك الموافقات/قائمة السماح، فشدّد كلاً من `tools.exec.*` وسياسة المضيف في `~/.openclaw/exec-approvals.json`؛ راجع [موافقات Exec](/ar/tools/exec-approvals#no-approval-yolo-mode).
- يأتي YOLO من افتراضيات سياسة المضيف (`security=full`، و`ask=off`)، وليس من `host=auto`. وإذا كنت تريد فرض توجيه gateway أو node، فاضبط `tools.exec.host` أو استخدم `/exec host=...`.
- في وضع `security=full` مع `ask=off`، يتبع host exec السياسة المهيأة مباشرة؛ ولا توجد طبقة إضافية للاستدلال على إخفاء الأوامر أو رفض script-preflight.
- `tools.exec.node` (الافتراضي: غير مضبوط)
- `tools.exec.strictInlineEval` (الافتراضي: false): عندما تكون true، تتطلب صيغ eval المضمنة داخل المفسر مثل `python -c` و`node -e` و`ruby -e` و`perl -e` و`php -r` و`lua -e` و`osascript -e` دائمًا موافقة صريحة. ويمكن لـ `allow-always` أن تحفظ استدعاءات benign للمفسر/البرنامج النصي، لكن صيغ inline-eval لا تزال تطالب بالموافقة في كل مرة.
- `tools.exec.pathPrepend`: قائمة بالأدلة التي تُسبق إلى `PATH` في تشغيلات exec (gateway + sandbox فقط).
- `tools.exec.safeBins`: ملفات تنفيذية آمنة خاصة بـ stdin فقط يمكن تشغيلها من دون إدخالات صريحة في قائمة السماح. ولمعرفة تفاصيل السلوك، راجع [Safe bins](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: أدلة صريحة إضافية موثوقة لفحوصات مسارات الملفات التنفيذية في `safeBins`. ولا تُعتبر إدخالات `PATH` موثوقة تلقائيًا أبدًا. الافتراضيات المدمجة هي `/bin` و`/usr/bin`.
- `tools.exec.safeBinProfiles`: سياسة argv مخصصة اختيارية لكل safe bin (`minPositional`، و`maxPositional`، و`allowedValueFlags`، و`deniedFlags`).

مثال:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### التعامل مع PATH

- `host=gateway`: يدمج قيمة `PATH` الخاصة بـ login-shell في بيئة exec. ويتم
  رفض تجاوزات `env.PATH` لتنفيذ المضيف. أما daemon نفسها فلا تزال تعمل مع `PATH` دنيا:
  - macOS: ‏`/opt/homebrew/bin`، و`/usr/local/bin`، و`/usr/bin`، و`/bin`
  - Linux: ‏`/usr/local/bin`، و`/usr/bin`، و`/bin`
- `host=sandbox`: يشغّل `sh -lc` (login shell) داخل الحاوية، لذا قد تعيد `/etc/profile` ضبط `PATH`.
  يسبق OpenClaw قيمة `env.PATH` بعد تحميل profile عبر متغير env داخلي (من دون interpolation في shell)؛ وتنطبق `tools.exec.pathPrepend` هنا أيضًا.
- `host=node`: تُرسل إلى node فقط تجاوزات env التي تمر من الحظر. وتُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف ويتم تجاهلها من قِبل مضيفات node. وإذا كنت تحتاج إلى إدخالات PATH إضافية على node،
  فاضبط بيئة خدمة مضيف node ‏(systemd/launchd) أو ثبّت الأدوات في مواقع قياسية.

ربط Node لكل وكيل (استخدم فهرس قائمة الوكلاء في الإعداد):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

واجهة Control UI: تتضمن علامة تبويب Nodes لوحة صغيرة بعنوان “Exec node binding” للإعدادات نفسها.

## تجاوزات الجلسة (`/exec`)

استخدم `/exec` لضبط القيم الافتراضية **لكل جلسة** لـ `host`، و`security`، و`ask`، و`node`.
أرسل `/exec` من دون وسائط لعرض القيم الحالية.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## نموذج التفويض

لا يتم التعامل مع `/exec` إلا من **المرسلين المصرّح لهم** (قوائم السماح/الاقتران في القناة بالإضافة إلى `commands.useAccessGroups`).
وهو يحدّث **حالة الجلسة فقط** ولا يكتب الإعداد. ولتعطيل exec بشكل صارم، امنعه عبر سياسة الأداة
(`tools.deny: ["exec"]` أو لكل وكيل). ولا تزال موافقات المضيف تُطبّق ما لم تضبط صراحةً
`security=full` و`ask=off`.

## موافقات Exec (التطبيق المرافق / مضيف Node)

يمكن للوكلاء المعزولين عبر sandbox أن يطلبوا موافقة لكل طلب قبل أن تعمل `exec` على مضيف gateway أو node.
راجع [موافقات Exec](/ar/tools/exec-approvals) لمعرفة السياسة، وقائمة السماح، وتدفق واجهة المستخدم.

عندما تكون الموافقات مطلوبة، تعيد أداة exec فورًا
`status: "approval-pending"` ومعرّف موافقة. وبعد الموافقة (أو الرفض / انتهاء المهلة)،
تصدر Gateway أحداث نظام (`Exec finished` / `Exec denied`). وإذا ظل الأمر
قيد التشغيل بعد `tools.exec.approvalRunningNoticeMs`، فسيتم إصدار إشعار واحد `Exec running`.
وعلى القنوات التي تحتوي على بطاقات/أزرار موافقة أصلية، ينبغي أن يعتمد الوكيل على
واجهة المستخدم الأصلية تلك أولًا وألا يتضمن أمر `/approve` يدويًا إلا عندما
تقول نتيجة الأداة صراحةً إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية
هي المسار الوحيد.

## Allowlist + safe bins

يطابق إنفاذ قائمة السماح اليدوية **مسارات الملفات التنفيذية المحلولة فقط** (ولا توجد مطابقات لأسماء الأساس). عندما
تكون `security=allowlist`، يتم السماح تلقائيًا بأوامر shell فقط إذا كانت كل مقاطع pipeline
موجودة في قائمة السماح أو Safe bins. ويتم رفض chaining ‏(`;`، و`&&`، و`||`) وعمليات إعادة التوجيه في
وضع قائمة السماح ما لم يستوفِ كل مقطع من المقاطع العليا قائمة السماح (بما في ذلك Safe bins).
ولا تزال عمليات إعادة التوجيه غير مدعومة.
ولا تتجاوز الثقة الدائمة من نوع `allow-always` هذه القاعدة: فالأمر المتسلسل لا يزال يتطلب أن يطابق كل
مقطع من المقاطع العليا.

يمثل `autoAllowSkills` مسار راحة منفصلًا ضمن موافقات exec. وهو ليس الشيء نفسه مثل
إدخالات قائمة السماح للمسارات اليدوية. وإذا كنت تريد ثقة صريحة صارمة، فأبقِ `autoAllowSkills` معطلة.

استخدم أداة التحكمين هذين لوظيفتين مختلفتين:

- `tools.exec.safeBins`: مرشحات تدفق صغيرة خاصة بـ stdin فقط.
- `tools.exec.safeBinTrustedDirs`: أدلة موثوقة صريحة إضافية لمسارات الملفات التنفيذية الخاصة بـ safe-bin.
- `tools.exec.safeBinProfiles`: سياسة argv صريحة لـ safe bins المخصصة.
- allowlist: ثقة صريحة لمسارات الملفات التنفيذية.

لا تتعامل مع `safeBins` على أنها قائمة سماح عامة، ولا تضف ملفات تنفيذية خاصة بالمفسرات/بيئات التشغيل (مثل `python3`، أو `node`، أو `ruby`، أو `bash`). وإذا كنت تحتاج إلى هذه الملفات، فاستخدم إدخالات صريحة في قائمة السماح وأبقِ مطالبات الموافقة مفعّلة.
يحذّر `openclaw security audit` عندما تكون إدخالات `safeBins` الخاصة بالمفسرات/بيئات التشغيل تفتقد إلى profiles صريحة، ويمكن لـ `openclaw doctor --fix` إنشاء إدخالات `safeBinProfiles` المخصصة المفقودة.
كما يحذّر `openclaw security audit` و`openclaw doctor` أيضًا عندما تضيف صراحةً ملفات تنفيذية واسعة السلوك مثل `jq` مرة أخرى إلى `safeBins`.
إذا قمت بإضافة المفسرات صراحةً إلى قائمة السماح، ففعّل `tools.exec.strictInlineEval` بحيث لا تزال صيغ eval المضمنة تتطلب موافقة جديدة.

للتفاصيل الكاملة للسياسة والأمثلة، راجع [موافقات Exec](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only) و[Safe bins مقابل allowlist](/ar/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## أمثلة

الواجهة الأمامية:

```json
{ "tool": "exec", "command": "ls -la" }
```

الخلفية + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

يمثل polling حالة حسب الطلب، وليس حلقات انتظار. وإذا
كان التنبيه التلقائي عند الاكتمال مفعّلًا، فيمكن للأمر أن يوقظ الجلسة عندما يصدر مخرجات أو يفشل.

إرسال المفاتيح (على نمط tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

إرسال Submit ‏(إرسال CR فقط):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

اللصق (بشكل bracketed افتراضيًا):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

تُعد `apply_patch` أداة فرعية من `exec` من أجل تعديلات منظمة على عدة ملفات.
وهي مفعّلة افتراضيًا لنماذج OpenAI وOpenAI Codex. استخدم الإعداد فقط
عندما تريد تعطيلها أو تقييدها على نماذج محددة:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

ملاحظات:

- متاحة فقط لنماذج OpenAI/OpenAI Codex.
- لا تزال سياسة الأداة منطبقة؛ فالقيمة `allow: ["write"]` تسمح ضمنيًا بـ `apply_patch`.
- يعيش الإعداد تحت `tools.exec.applyPatch`.
- تكون `tools.exec.applyPatch.enabled` افتراضيًا `true`؛ اضبطها على `false` لتعطيل الأداة لنماذج OpenAI.
- تكون `tools.exec.applyPatch.workspaceOnly` افتراضيًا `true` (ضمن مساحة العمل). اضبطها على `false` فقط إذا كنت تريد عمدًا أن تقوم `apply_patch` بالكتابة/الحذف خارج دليل مساحة العمل.

## ذو صلة

- [موافقات Exec](/ar/tools/exec-approvals) — بوابات الموافقة لأوامر shell
- [Sandboxing](/ar/gateway/sandboxing) — تشغيل الأوامر في بيئات معزولة
- [عملية الخلفية](/ar/gateway/background-process) — exec طويلة التشغيل وأداة process
- [الأمان](/ar/gateway/security) — سياسة الأدوات والوصول المرتفع
