---
read_when:
    - استخدام أداة exec أو تعديلها
    - تصحيح أخطاء سلوك stdin أو TTY
summary: استخدام أداة Exec، وأوضاع stdin، ودعم TTY
title: أداة التنفيذ
x-i18n:
    generated_at: "2026-05-10T20:03:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 445b09c1c6cdc1998c1c2a6b1223fdef438011413d246c4de0de0436465b448f
    source_path: tools/exec.md
    workflow: 16
---

شغّل أوامر shell في مساحة العمل. `exec` هو سطح shell يُحدِث تغييرات: يمكن للأوامر إنشاء ملفات أو تعديلها أو حذفها أينما يسمح المضيف المحدد أو نظام ملفات sandbox. لا يجعل تعطيل أدوات نظام الملفات في OpenClaw مثل `write` أو `edit` أو `apply_patch` أداة `exec` للقراءة فقط.

يدعم التنفيذ في المقدمة والخلفية عبر `process`. إذا كان `process` غير مسموح به، فسيعمل `exec` بشكل متزامن ويتجاهل `yieldMs`/`background`.
تكون جلسات الخلفية محددة النطاق لكل وكيل؛ لا يرى `process` إلا الجلسات من الوكيل نفسه.

## المعاملات

<ParamField path="command" type="string" required>
أمر shell المراد تشغيله.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دليل العمل للأمر.
</ParamField>

<ParamField path="env" type="object">
تجاوزات بيئة على شكل مفتاح/قيمة تُدمج فوق البيئة الموروثة.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
انقل الأمر تلقائيًا إلى الخلفية بعد هذا التأخير (مللي ثانية).
</ParamField>

<ParamField path="background" type="boolean" default="false">
شغّل الأمر في الخلفية فورًا بدلًا من انتظار `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
تجاوز مهلة exec المضبوطة لهذا الاستدعاء. اضبط `timeout: 0` فقط عندما يجب أن يعمل الأمر دون مهلة عملية exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
شغّل داخل طرفية وهمية عند توفرها. استخدمه لواجهات CLI التي تتطلب TTY فقط، ووكلاء البرمجة، وواجهات المستخدم الطرفية.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
مكان التنفيذ. يتحول `auto` إلى `sandbox` عندما يكون runtime الخاص بـ sandbox نشطًا، وإلى `gateway` خلاف ذلك.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
وضع الفرض لتنفيذ `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
سلوك مطالبة الموافقة لتنفيذ `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
معرّف/اسم Node عندما يكون `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
اطلب الوضع المرتفع — الخروج من sandbox إلى مسار المضيف المضبوط. يُفرض `security=full` فقط عندما يتحول elevated إلى `full`.
</ParamField>

ملاحظات:

- القيمة الافتراضية لـ `host` هي `auto`: sandbox عندما يكون runtime الخاص بـ sandbox نشطًا للجلسة، وإلا Gateway.
- لا يقبل `host` إلا `auto` أو `sandbox` أو `gateway` أو `node`. ليس محددًا لاسم مضيف؛ تُرفض القيم الشبيهة بأسماء المضيفين قبل تشغيل الأمر.
- `auto` هي استراتيجية التوجيه الافتراضية، وليست حرفًا بدلًا عامًا. يُسمح بـ `host=node` لكل استدعاء من `auto`؛ ولا يُسمح بـ `host=gateway` لكل استدعاء إلا عندما لا يكون runtime الخاص بـ sandbox نشطًا.
- دون إعدادات إضافية، يظل `host=auto` "يعمل مباشرة": عدم وجود sandbox يعني أنه يتحول إلى `gateway`؛ ووجود sandbox حي يعني أنه يبقى داخل sandbox.
- يخرج `elevated` من sandbox إلى مسار المضيف المضبوط: `gateway` افتراضيًا، أو `node` عندما يكون `tools.exec.host=node` (أو عندما تكون القيمة الافتراضية للجلسة هي `host=node`). لا يتوفر إلا عندما يكون الوصول المرتفع مفعّلًا للجلسة/المزوّد الحالي.
- تتحكم `~/.openclaw/exec-approvals.json` في موافقات `gateway`/`node`.
- يتطلب `node` عقدة مقترنة (تطبيقًا مرافقًا أو مضيف عقدة بلا واجهة).
- إذا توفرت عدة عقد، فاضبط `exec.node` أو `tools.exec.node` لاختيار واحدة.
- `exec host=node` هو مسار تنفيذ shell الوحيد للعقد؛ تمت إزالة الغلاف القديم `nodes.run`.
- ينطبق `timeout` على التنفيذ في المقدمة، والخلفية، و`yieldMs`، وGateway، وsandbox، وتنفيذ `system.run` على العقدة. إذا حُذف، يستخدم OpenClaw `tools.exec.timeoutSec`؛ أما `timeout: 0` الصريح فيعطل مهلة عملية exec لذلك الاستدعاء.
- على المضيفين غير Windows، يستخدم exec قيمة `SHELL` عند ضبطها؛ وإذا كانت `SHELL` هي `fish`، فيفضّل `bash` (أو `sh`)
  من `PATH` لتجنب السكربتات غير المتوافقة مع fish، ثم يعود إلى `SHELL` إذا لم يوجد أي منهما.
- على مضيفي Windows، يفضّل exec اكتشاف PowerShell 7 (`pwsh`) (Program Files، ثم ProgramW6432، ثم PATH)،
  ثم يعود إلى Windows PowerShell 5.1.
- يرفض تنفيذ المضيف (`gateway`/`node`) تجاوزات `env.PATH` وتجاوزات المحمّل (`LD_*`/`DYLD_*`) من أجل
  منع اختطاف الثنائيات أو حقن الشيفرة.
- يضبط OpenClaw القيمة `OPENCLAW_SHELL=exec` في بيئة الأمر المنشأ (بما في ذلك تنفيذ PTY وsandbox) حتى تتمكن قواعد shell/profile من اكتشاف سياق أداة exec.
- يُحظر `openclaw channels login` من `exec` لأنه مسار مصادقة قناة تفاعلي؛ شغّله في طرفية على مضيف Gateway، أو استخدم أداة تسجيل الدخول الأصلية للقناة من الدردشة عند توفرها.
- مهم: يكون sandboxing **معطلًا افتراضيًا**. إذا كان sandboxing معطلًا، فإن `host=auto` الضمني
  يتحول إلى `gateway`. أما `host=sandbox` الصريح فيفشل بإغلاق آمن بدلًا من التشغيل الصامت
  على مضيف Gateway. فعّل sandboxing أو استخدم `host=gateway` مع الموافقات.
- لا تفحص تحققات ما قبل التشغيل للسكربتات (لأخطاء صياغة shell الشائعة في Python/Node) إلا الملفات داخل
  حد `workdir` الفعّال. إذا تحول مسار سكربت إلى خارج `workdir`، فيُتخطى فحص ما قبل التشغيل لذلك
  الملف.
- للعمل طويل الأمد الذي يبدأ الآن، ابدأه مرة واحدة واعتمد على تنبيه
  الإكمال التلقائي عندما يكون مفعّلًا ويصدر الأمر خرجًا أو يفشل.
  استخدم `process` للسجلات أو الحالة أو الإدخال أو التدخل؛ لا تحاكِ
  الجدولة بحلقات sleep أو حلقات timeout أو الاستطلاع المتكرر.
- للعمل الذي يجب أن يحدث لاحقًا أو وفق جدول، استخدم Cron بدلًا من
  أنماط sleep/delay في `exec`.

## الإعدادات

- `tools.exec.notifyOnExit` (الافتراضي: true): عندما تكون true، تضيف جلسات exec الموضوعة في الخلفية حدث نظام إلى الطابور وتطلب Heartbeat عند الخروج.
- `tools.exec.approvalRunningNoticeMs` (الافتراضي: 10000): أصدر إشعار "running" واحدًا عندما يعمل exec المحكوم بالموافقة مدة أطول من هذه (0 يعطل ذلك).
- `tools.exec.timeoutSec` (الافتراضي: 1800): مهلة exec الافتراضية لكل أمر بالثواني. يتجاوزها `timeout` لكل استدعاء؛ ويعطل `timeout: 0` لكل استدعاء مهلة عملية exec.
- `tools.exec.host` (الافتراضي: `auto`؛ يتحول إلى `sandbox` عندما يكون runtime الخاص بـ sandbox نشطًا، وإلى `gateway` خلاف ذلك)
- `tools.exec.security` (الافتراضي: `deny` لـ sandbox، و`full` لـ Gateway + node عند عدم الضبط)
- `tools.exec.ask` (الافتراضي: `off`)
- تنفيذ exec على المضيف دون موافقة هو الافتراضي لـ Gateway + node. إذا كنت تريد سلوك الموافقات/قائمة السماح، فشدّد كلًا من `tools.exec.*` وملف المضيف `~/.openclaw/exec-approvals.json`؛ راجع [موافقات Exec](/ar/tools/exec-approvals#yolo-mode-no-approval).
- يأتي YOLO من افتراضيات سياسة المضيف (`security=full`، `ask=off`)، وليس من `host=auto`. إذا أردت فرض توجيه Gateway أو node، فاضبط `tools.exec.host` أو استخدم `/exec host=...`.
- في وضع `security=full` مع `ask=off`، يتبع exec على المضيف السياسة المضبوطة مباشرة؛ لا توجد طبقة إضافية لتصفية استدلالية لتعمية الأوامر أو رفض فحص ما قبل التشغيل للسكربتات.
- `tools.exec.node` (الافتراضي: غير مضبوط)
- `tools.exec.strictInlineEval` (الافتراضي: false): عندما تكون true، تتطلب صيغ تقييم المفسر السطرية مثل `python -c` و`node -e` و`ruby -e` و`perl -e` و`php -r` و`lua -e` و`osascript -e` موافقة صريحة دائمًا. يمكن أن يستمر `allow-always` في حفظ استدعاءات مفسر/سكربت حميدة، لكن صيغ inline-eval تظل تطلب الموافقة في كل مرة.
- `tools.exec.pathPrepend`: قائمة أدلة تُضاف إلى بداية `PATH` لتشغيلات exec (Gateway + sandbox فقط).
- `tools.exec.safeBins`: ثنائيات آمنة تقرأ من stdin فقط ويمكن تشغيلها دون إدخالات صريحة في قائمة السماح. لتفاصيل السلوك، راجع [الثنائيات الآمنة](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: أدلة صريحة إضافية موثوقة لفحوصات مسار `safeBins`. لا تُوثق إدخالات `PATH` تلقائيًا أبدًا. الافتراضيات المضمنة هي `/bin` و`/usr/bin`.
- `tools.exec.safeBinProfiles`: سياسة argv اختيارية مخصصة لكل ثنائي آمن (`minPositional`، `maxPositional`، `allowedValueFlags`، `deniedFlags`).

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

- `host=gateway`: يدمج `PATH` الخاص بـ login-shell لديك في بيئة exec. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف. يظل daemon نفسه يعمل مع `PATH` بسيط:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: يشغّل `sh -lc` (login shell) داخل الحاوية، لذلك قد يعيد `/etc/profile` ضبط `PATH`.
  يضيف OpenClaw قيمة `env.PATH` إلى البداية بعد تحميل profile عبر متغير بيئة داخلي (دون استيفاء shell)؛
  وينطبق `tools.exec.pathPrepend` هنا أيضًا.
- `host=node`: تُرسل إلى العقدة فقط تجاوزات البيئة غير المحظورة التي تمررها. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف وتتجاهلها مضيفات العقد. إذا احتجت إلى إدخالات PATH إضافية على عقدة،
  فاضبط بيئة خدمة مضيف العقدة (systemd/launchd) أو ثبّت الأدوات في المواقع القياسية.

ربط العقدة لكل وكيل (استخدم فهرس قائمة الوكلاء في الإعدادات):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

واجهة التحكم: تتضمن علامة تبويب Nodes لوحة صغيرة باسم "Exec node binding" للإعدادات نفسها.

## تجاوزات الجلسة (`/exec`)

استخدم `/exec` لضبط القيم الافتراضية **لكل جلسة** لـ `host` و`security` و`ask` و`node`.
أرسل `/exec` دون وسائط لعرض القيم الحالية.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## نموذج التفويض

لا يُقبل `/exec` إلا من **مرسلين مخوّلين** (قوائم السماح/الاقتران للقنوات بالإضافة إلى `commands.useAccessGroups`).
يحدّث **حالة الجلسة فقط** ولا يكتب الإعدادات. لتعطيل exec بشكل صارم، امنعه عبر سياسة الأداة
(`tools.deny: ["exec"]` أو لكل وكيل). تظل موافقات المضيف مطبقة ما لم تضبط صراحة
`security=full` و`ask=off`.

## موافقات Exec (التطبيق المرافق / مضيف العقدة)

يمكن للوكلاء داخل sandbox طلب موافقة لكل طلب قبل أن يعمل `exec` على مضيف Gateway أو مضيف العقدة.
راجع [موافقات Exec](/ar/tools/exec-approvals) لمعرفة السياسة، وقائمة السماح، وتدفق واجهة المستخدم.

عندما تكون الموافقات مطلوبة، تعيد أداة exec فورًا
`status: "approval-pending"` ومعرّف موافقة. بعد الموافقة (أو الرفض / انتهاء المهلة)،
يبث Gateway أحداث نظام (`Exec finished` / `Exec denied`). إذا ظل الأمر
قيد التشغيل بعد `tools.exec.approvalRunningNoticeMs`، يصدر إشعار `Exec running` واحد.
على القنوات التي تحتوي على بطاقات/أزرار موافقة أصلية، يجب أن يعتمد الوكيل على
واجهة المستخدم الأصلية تلك أولًا، وألا يضمّن أمر `/approve` يدويًا إلا عندما تقول نتيجة الأداة
صراحة إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي
المسار الوحيد.

## قائمة السماح + الثنائيات الآمنة

يطابق فرض قائمة السماح اليدوية أنماط glob لمسار الثنائي المحلول وأنماط glob لاسم الأمر المجرّد.
لا تطابق الأسماء المجرّدة إلا الأوامر المستدعاة عبر PATH، لذلك يمكن أن يطابق `rg`
`/opt/homebrew/bin/rg` عندما يكون الأمر `rg`، لكن ليس `./rg` أو `/tmp/rg`.
عندما يكون `security=allowlist`، لا يُسمح تلقائيًا بأوامر shell إلا إذا كان كل جزء من pipeline
موجودًا في قائمة السماح أو ثنائيًا آمنًا. تُرفض السلسلة (`;`، `&&`، `||`) وعمليات إعادة التوجيه
في وضع قائمة السماح ما لم يستوفِ كل جزء على المستوى الأعلى
قائمة السماح (بما في ذلك الثنائيات الآمنة). تظل عمليات إعادة التوجيه غير مدعومة.
لا تتجاوز ثقة `allow-always` الدائمة تلك القاعدة: لا يزال الأمر المتسلسل يتطلب مطابقة كل
جزء على المستوى الأعلى.

`autoAllowSkills` هو مسار تيسيري منفصل في موافقات exec. وهو ليس نفس
إدخالات قائمة السماح اليدوية للمسارات. للثقة الصريحة الصارمة، أبقِ `autoAllowSkills` معطلًا.

استخدم عنصري التحكم لوظائف مختلفة:

- `tools.exec.safeBins`: مرشحات تدفق صغيرة، تقرأ من stdin فقط.
- `tools.exec.safeBinTrustedDirs`: أدلة إضافية صريحة موثوقة لمسارات ملفات الثنائيات الآمنة القابلة للتنفيذ.
- `tools.exec.safeBinProfiles`: سياسة argv صريحة للثنائيات الآمنة المخصصة.
- قائمة السماح: ثقة صريحة لمسارات الملفات القابلة للتنفيذ.

لا تتعامل مع `safeBins` كقائمة سماح عامة، ولا تضف ثنائيات المفسرات/بيئات التشغيل (مثل `python3` و`node` و`ruby` و`bash`). إذا كنت تحتاج إليها، فاستخدم إدخالات قائمة سماح صريحة وأبقِ مطالبات الموافقة مفعّلة.
يحذّر `openclaw security audit` عندما تفتقر إدخالات `safeBins` الخاصة بالمفسرات/بيئات التشغيل إلى ملفات تعريف صريحة، ويمكن لـ `openclaw doctor --fix` إنشاء إدخالات `safeBinProfiles` مخصصة مفقودة كهيكل أولي.
يحذّر `openclaw security audit` و`openclaw doctor` أيضًا عندما تضيف صراحةً ثنائيات ذات سلوك واسع مثل `jq` مرة أخرى إلى `safeBins`.
إذا سمحت صراحةً بالمفسرات في قائمة السماح، ففعّل `tools.exec.strictInlineEval` بحيث تظل صيغ تقييم الشيفرة المضمّنة تتطلب موافقة جديدة.

للحصول على تفاصيل السياسة الكاملة والأمثلة، راجع [موافقات Exec](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only) و[الثنائيات الآمنة مقابل قائمة السماح](/ar/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## أمثلة

المقدمة:

```json
{ "tool": "exec", "command": "ls -la" }
```

الخلفية + الاستقصاء:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

الاستقصاء مخصص للحالة عند الطلب، وليس لحلقات الانتظار. إذا كان إيقاظ الإكمال التلقائي
مفعّلًا، يمكن للأمر إيقاظ الجلسة عندما يصدر مخرجات أو يفشل.

إرسال المفاتيح (بأسلوب tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

الإرسال (إرسال CR فقط):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

اللصق (بين أقواس افتراضيًا):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` أداة فرعية من `exec` لإجراء تعديلات منظمة على ملفات متعددة.
تكون مفعّلة افتراضيًا لنماذج OpenAI وOpenAI Codex. استخدم الإعدادات فقط
عندما تريد تعطيلها أو تقييدها بنماذج محددة:

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
- تظل سياسة الأداة سارية؛ يسمح `allow: ["write"]` ضمنيًا بـ `apply_patch`.
- لا يمنع `deny: ["write"]` استخدام `apply_patch`؛ امنع `apply_patch` صراحةً أو استخدم `deny: ["group:fs"]` عندما يجب حظر عمليات كتابة التصحيح أيضًا.
- توجد الإعدادات ضمن `tools.exec.applyPatch`.
- تكون القيمة الافتراضية لـ `tools.exec.applyPatch.enabled` هي `true`؛ اضبطها على `false` لتعطيل الأداة لنماذج OpenAI.
- تكون القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (محصورة ضمن مساحة العمل). اضبطها على `false` فقط إذا كنت تقصد عمدًا السماح لـ `apply_patch` بالكتابة/الحذف خارج دليل مساحة العمل.

## ذات صلة

- [موافقات Exec](/ar/tools/exec-approvals) — بوابات الموافقة لأوامر الصدفة
- [العزل](/ar/gateway/sandboxing) — تشغيل الأوامر في بيئات معزولة
- [عملية الخلفية](/ar/gateway/background-process) — أداة exec وprocess للعمليات طويلة التشغيل
- [الأمان](/ar/gateway/security) — سياسة الأدوات والوصول المرتفع
