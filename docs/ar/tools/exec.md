---
read_when:
    - استخدام أداة exec أو تعديلها
    - تصحيح سلوك stdin أو TTY
summary: استخدام أداة Exec، وأوضاع stdin، ودعم TTY
title: أداة التنفيذ
x-i18n:
    generated_at: "2026-05-11T20:42:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

تشغيل أوامر shell في مساحة العمل. `exec` هو سطح shell مُغيِّر: يمكن للأوامر إنشاء الملفات أو تحريرها أو حذفها أينما يسمح نظام ملفات المضيف المحدد أو sandbox بذلك. لا يؤدي تعطيل أدوات نظام ملفات OpenClaw مثل `write` أو `edit` أو `apply_patch` إلى جعل `exec` للقراءة فقط.

يدعم التنفيذ في المقدمة + الخلفية عبر `process`. إذا كان `process` غير مسموح به، فسيعمل `exec` تزامنيًا ويتجاهل `yieldMs`/`background`.
جلسات الخلفية محددة النطاق لكل وكيل؛ لا يرى `process` إلا الجلسات من الوكيل نفسه.

## المعلمات

<ParamField path="command" type="string" required>
أمر Shell المراد تشغيله.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دليل العمل للأمر.
</ParamField>

<ParamField path="env" type="object">
تجاوزات بيئة على شكل مفتاح/قيمة تُدمج فوق البيئة الموروثة.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
إرسال الأمر تلقائيًا إلى الخلفية بعد هذا التأخير (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
إرسال الأمر إلى الخلفية فورًا بدلًا من انتظار `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
تجاوز مهلة exec المكوّنة لهذه الاستدعاء. اضبط `timeout: 0` فقط عندما ينبغي تشغيل الأمر من دون مهلة عملية exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
التشغيل في طرفية زائفة عند توفرها. استخدمه مع واجهات CLI التي تتطلب TTY فقط، ووكلاء البرمجة، وواجهات المستخدم الطرفية.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
مكان التنفيذ. تتحول `auto` إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطًا، وإلى `gateway` بخلاف ذلك.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
يُتجاهل لاستدعاءات الأدوات العادية. يتحكم
`tools.exec.security` و `~/.openclaw/exec-approvals.json` في أمان `gateway` / `node`؛ ويمكن للوضع المرتفع
فرض `security=full` فقط عندما يمنح المشغّل وصولًا مرتفعًا صراحةً.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
سلوك مطالبة الموافقة لتنفيذ `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
معرّف/اسم Node عندما يكون `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
طلب الوضع المرتفع — الخروج من sandbox إلى مسار المضيف المكوّن. لا يُفرض `security=full` إلا عندما يتحول elevated إلى `full`.
</ParamField>

ملاحظات:

- القيمة الافتراضية لـ `host` هي `auto`: sandbox عندما يكون وقت تشغيل sandbox نشطًا للجلسة، وإلا Gateway.
- لا يقبل `host` إلا `auto` أو `sandbox` أو `gateway` أو `node`. ليس محدد اسم مضيف؛ تُرفض القيم الشبيهة بأسماء المضيفين قبل تشغيل الأمر.
- `auto` هي استراتيجية التوجيه الافتراضية، وليست حرف بدل. يُسمح بـ `host=node` لكل استدعاء من `auto`؛ ولا يُسمح بـ `host=gateway` لكل استدعاء إلا عندما لا يكون وقت تشغيل sandbox نشطًا.
- من دون أي تكوين إضافي، يظل `host=auto` "يعمل مباشرة": عدم وجود sandbox يعني أنه يتحول إلى `gateway`؛ ووجود sandbox نشط يعني أنه يبقى داخل sandbox.
- يخرج `elevated` من sandbox إلى مسار المضيف المكوّن: `gateway` افتراضيًا، أو `node` عندما يكون `tools.exec.host=node` (أو عندما تكون القيمة الافتراضية للجلسة هي `host=node`). لا يتوفر إلا عند تمكين الوصول المرتفع للجلسة/المزوّد الحالي.
- تتحكم `~/.openclaw/exec-approvals.json` في موافقات `gateway`/`node`.
- يتطلب `node` عقدة مقترنة (تطبيقًا مرافقًا أو مضيف عقدة بلا واجهة).
- إذا كانت عدة عُقد متاحة، فاضبط `exec.node` أو `tools.exec.node` لاختيار واحدة.
- `exec host=node` هو مسار تنفيذ shell الوحيد للعُقد؛ وقد أُزيل الغلاف القديم `nodes.run`.
- تنطبق `timeout` على تنفيذ المقدمة، والخلفية، و`yieldMs`، وGateway، وsandbox، و`system.run` في node. إذا حُذفت، يستخدم OpenClaw `tools.exec.timeoutSec`؛ وتؤدي `timeout: 0` الصريحة إلى تعطيل مهلة عملية exec لذلك الاستدعاء.
- على مضيفي غير Windows، يستخدم exec المتغير `SHELL` عندما يكون مضبوطًا؛ وإذا كان `SHELL` هو `fish`، فإنه يفضّل `bash` (أو `sh`)
  من `PATH` لتجنب السكربتات غير المتوافقة مع fish، ثم يعود إلى `SHELL` إذا لم يوجد أي منهما.
- على مضيفي Windows، يفضّل exec اكتشاف PowerShell 7 (`pwsh`) (Program Files، ثم ProgramW6432، ثم PATH)،
  ثم يعود إلى Windows PowerShell 5.1.
- يرفض تنفيذ المضيف (`gateway`/`node`) تجاوزات `env.PATH` وتجاوزات المحمّل (`LD_*`/`DYLD_*`) من أجل
  منع اختطاف الثنائيات أو حقن الشيفرة.
- يضبط OpenClaw المتغير `OPENCLAW_SHELL=exec` في بيئة الأمر المُنشأة (بما في ذلك تنفيذ PTY وsandbox) حتى تتمكن قواعد shell/profile من اكتشاف سياق أداة exec.
- يُحظر `openclaw channels login` من `exec` لأنه تدفق مصادقة قناة تفاعلي؛ شغّله في طرفية على مضيف Gateway، أو استخدم أداة تسجيل الدخول الأصلية للقناة من الدردشة عندما تكون موجودة.
- مهم: يكون sandboxing **معطّلًا افتراضيًا**. إذا كان sandboxing معطّلًا، فإن `host=auto` الضمني
  يتحول إلى `gateway`. يظل `host=sandbox` الصريح يفشل بشكل مغلق بدلًا من التشغيل الصامت
  على مضيف Gateway. فعّل sandboxing أو استخدم `host=gateway` مع الموافقات.
- لا تفحص اختبارات التمهيد المسبق للسكربتات (لأخطاء صياغة shell الشائعة في Python/Node) إلا الملفات داخل
  حد `workdir` الفعّال. إذا تحول مسار سكربت إلى خارج `workdir`، فيُتخطى التمهيد المسبق لذلك
  الملف.
- بالنسبة للعمل طويل التشغيل الذي يبدأ الآن، ابدأه مرة واحدة واعتمد على تنبيه
  الاكتمال التلقائي عندما يكون مفعّلًا ويصدر الأمر مخرجات أو يفشل.
  استخدم `process` للسجلات، أو الحالة، أو الإدخال، أو التدخل؛ ولا تحاكِ
  الجدولة بحلقات sleep، أو حلقات timeout، أو الاستطلاع المتكرر.
- بالنسبة للعمل الذي يجب أن يحدث لاحقًا أو وفق جدول، استخدم Cron بدلًا من
  أنماط sleep/delay في `exec`.

## التكوين

- `tools.exec.notifyOnExit` (الافتراضي: true): عندما تكون true، تضع جلسات exec التي أُرسلت إلى الخلفية حدث نظام في قائمة الانتظار وتطلب Heartbeat عند الخروج.
- `tools.exec.approvalRunningNoticeMs` (الافتراضي: 10000): إصدار إشعار "قيد التشغيل" واحد عندما يعمل exec الخاضع للموافقة لمدة أطول من ذلك (0 يعطّل).
- `tools.exec.timeoutSec` (الافتراضي: 1800): مهلة exec الافتراضية لكل أمر بالثواني. تتجاوزها `timeout` لكل استدعاء؛ وتؤدي `timeout: 0` لكل استدعاء إلى تعطيل مهلة عملية exec.
- `tools.exec.host` (الافتراضي: `auto`؛ يتحول إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطًا، وإلى `gateway` بخلاف ذلك)
- `tools.exec.security` (الافتراضي: `deny` لـ sandbox، و`full` لـ Gateway + node عند عدم الضبط)
- `tools.exec.ask` (الافتراضي: `off`)
- تنفيذ exec على المضيف من دون موافقة هو الافتراضي لـ Gateway + node. إذا أردت سلوك الموافقات/قائمة السماح، فشدّد كلًا من `tools.exec.*` وملف المضيف `~/.openclaw/exec-approvals.json`؛ راجع [موافقات Exec](/ar/tools/exec-approvals#yolo-mode-no-approval).
- تأتي YOLO من افتراضات سياسة المضيف (`security=full`، `ask=off`)، وليس من `host=auto`. إذا أردت فرض توجيه Gateway أو node، فاضبط `tools.exec.host` أو استخدم `/exec host=...`.
- في وضع `security=full` مع `ask=off`، يتبع exec على المضيف السياسة المكوّنة مباشرةً؛ لا توجد طبقة إضافية لمرشح تمهيدي لاكتشاف تعمية الأوامر أو رفض التمهيد المسبق للسكربتات.
- `tools.exec.node` (الافتراضي: غير مضبوط)
- `tools.exec.strictInlineEval` (الافتراضي: false): عندما تكون true، تتطلب صيغ تقييم المفسّر المضمنة مثل `python -c` و`node -e` و`ruby -e` و`perl -e` و`php -r` و`lua -e` و`osascript -e` موافقة صريحة دائمًا. لا يزال بإمكان `allow-always` حفظ استدعاءات المفسّر/السكربت الحميدة، لكن صيغ inline-eval تظل تطلب الموافقة في كل مرة.
- `tools.exec.commandHighlighting` (الافتراضي: false): عندما تكون true، يمكن لمطالبات الموافقة تمييز مقاطع الأوامر المستخرجة من المحلل في نص الأمر. اضبطها على `true` عالميًا أو لكل وكيل لتمكين تمييز نص الأمر من دون تغيير سياسة موافقة exec.
- `tools.exec.pathPrepend`: قائمة أدلة تُضاف في بداية `PATH` لتشغيلات exec (Gateway + sandbox فقط).
- `tools.exec.safeBins`: ثنائيات آمنة مخصصة لـ stdin فقط ويمكن تشغيلها من دون إدخالات قائمة سماح صريحة. لتفاصيل السلوك، راجع [الثنائيات الآمنة](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: أدلة صريحة إضافية موثوقة لفحوصات مسار `safeBins`. لا تُوثق إدخالات `PATH` تلقائيًا أبدًا. الافتراضات المدمجة هي `/bin` و`/usr/bin`.
- `tools.exec.safeBinProfiles`: سياسة argv مخصصة اختيارية لكل ثنائي آمن (`minPositional`، `maxPositional`، `allowedValueFlags`، `deniedFlags`).

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

### معالجة PATH

- `host=gateway`: يدمج `PATH` الخاص بـ login-shell لديك في بيئة exec. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف. يظل daemon نفسه يعمل مع `PATH` أدنى:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: يشغّل `sh -lc` (login shell) داخل الحاوية، لذلك قد يعيد `/etc/profile` ضبط `PATH`.
  يضيف OpenClaw `env.PATH` في البداية بعد تحميل profile عبر متغير بيئة داخلي (من دون استيفاء shell)؛
  وينطبق `tools.exec.pathPrepend` هنا أيضًا.
- `host=node`: لا تُرسل إلى node إلا تجاوزات البيئة غير المحظورة التي تمررها. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف وتتجاهلها مضيفات node. إذا احتجت إلى إدخالات PATH إضافية على node،
  فكوّن بيئة خدمة مضيف node (systemd/launchd) أو ثبّت الأدوات في المواقع القياسية.

ربط node لكل وكيل (استخدم فهرس قائمة الوكلاء في التكوين):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

واجهة التحكم: تتضمن علامة تبويب Nodes لوحة صغيرة باسم "ربط node لـ Exec" للإعدادات نفسها.

## تجاوزات الجلسة (`/exec`)

استخدم `/exec` لضبط القيم الافتراضية **لكل جلسة** لـ `host` و`security` و`ask` و`node`.
أرسل `/exec` بلا وسيطات لعرض القيم الحالية.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## نموذج التخويل

لا يُقبل `/exec` إلا من **مرسلين مخوّلين** (قوائم سماح/اقتران القنوات بالإضافة إلى `commands.useAccessGroups`).
إنه يحدّث **حالة الجلسة فقط** ولا يكتب التكوين. لتعطيل exec بشكل صارم، امنعه عبر سياسة الأداة
(`tools.deny: ["exec"]` أو لكل وكيل). تظل موافقات المضيف سارية إلا إذا ضبطت صراحةً
`security=full` و`ask=off`.

## موافقات Exec (التطبيق المرافق / مضيف node)

يمكن للوكلاء داخل sandbox طلب موافقة لكل طلب قبل تشغيل `exec` على Gateway أو مضيف node.
راجع [موافقات Exec](/ar/tools/exec-approvals) لمعرفة السياسة، وقائمة السماح، وتدفق واجهة المستخدم.

عندما تكون الموافقات مطلوبة، تُرجع أداة exec فورًا
`status: "approval-pending"` ومعرّف موافقة. بعد الموافقة (أو الرفض / انتهاء المهلة)،
يصدر Gateway أحداث نظام (`Exec finished` / `Exec denied`). إذا كان الأمر لا يزال
قيد التشغيل بعد `tools.exec.approvalRunningNoticeMs`، يصدر إشعار `Exec running` واحد.
في القنوات التي تتضمن بطاقات/أزرار موافقة أصلية، ينبغي للوكيل الاعتماد على
واجهة المستخدم الأصلية تلك أولًا، وألا يضمّن أمر `/approve` يدويًا إلا عندما تقول نتيجة
الأداة صراحةً إن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي
المسار الوحيد.

## قائمة السماح + الثنائيات الآمنة

يطابق فرض قائمة السماح اليدوية globات مسارات الثنائيات المحلولة وglobات أسماء الأوامر
المجردة. لا تطابق الأسماء المجردة إلا الأوامر المستدعاة عبر PATH، لذلك يمكن أن يطابق `rg`
المسار `/opt/homebrew/bin/rg` عندما يكون الأمر هو `rg`، لكن لا يطابق `./rg` أو `/tmp/rg`.
عندما تكون `security=allowlist`، لا يُسمح بأوامر shell تلقائيًا إلا إذا كان كل مقطع من pipeline
مدرجًا في قائمة السماح أو ثنائيًا آمنًا. تُرفض السلسلة (`;`، `&&`، `||`) وإعادة التوجيه
في وضع قائمة السماح إلا إذا كان كل مقطع على المستوى الأعلى يستوفي
قائمة السماح (بما في ذلك الثنائيات الآمنة). تظل إعادة التوجيه غير مدعومة.
لا تتجاوز ثقة `allow-always` الدائمة تلك القاعدة: لا يزال الأمر المتسلسل يتطلب مطابقة كل
مقطع على المستوى الأعلى.

`autoAllowSkills` هو مسار ملاءمة منفصل في موافقات exec. ليس هو نفسه
إدخالات قائمة السماح اليدوية للمسار. للثقة الصريحة الصارمة، أبقِ `autoAllowSkills` معطّلًا.

استخدم عنصري التحكم لوظائف مختلفة:

- `tools.exec.safeBins`: مرشحات تدفق صغيرة تعمل عبر stdin فقط.
- `tools.exec.safeBinTrustedDirs`: أدلة موثوقة إضافية وصريحة لمسارات الملفات التنفيذية لـ safe-bin.
- `tools.exec.safeBinProfiles`: سياسة argv صريحة لـ safe bins مخصصة.
- قائمة السماح: ثقة صريحة لمسارات الملفات التنفيذية.

لا تتعامل مع `safeBins` كقائمة سماح عامة، ولا تضف ثنائيات المفسرات/بيئات التشغيل (مثل `python3`، و`node`، و`ruby`، و`bash`). إذا كنت تحتاج إليها، فاستخدم إدخالات قائمة سماح صريحة وأبق مطالبات الموافقة مفعلة.
يحذر `openclaw security audit` عندما تفتقد إدخالات `safeBins` الخاصة بالمفسرات/بيئات التشغيل إلى ملفات تعريف صريحة، ويمكن لـ `openclaw doctor --fix` إنشاء إدخالات `safeBinProfiles` مخصصة مفقودة كبنية أولية.
يحذر `openclaw security audit` و`openclaw doctor` أيضا عندما تضيف صراحة ثنائيات ذات سلوك واسع مثل `jq` مرة أخرى إلى `safeBins`.
إذا سمحت صراحة بالمفسرات في قائمة السماح، ففعّل `tools.exec.strictInlineEval` بحيث تظل صيغ تقييم الشيفرة المضمنة تتطلب موافقة جديدة.

للاطلاع على تفاصيل السياسة الكاملة والأمثلة، راجع [موافقات exec](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only) و[الثنائيات الآمنة مقابل قائمة السماح](/ar/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## أمثلة

الأمامية:

```json
{ "tool": "exec", "command": "ls -la" }
```

الخلفية + الاستطلاع:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

الاستطلاع مخصص للحالة عند الطلب، وليس لحلقات الانتظار. إذا كان إيقاظ الإكمال التلقائي
مفعلا، فيمكن للأمر إيقاظ الجلسة عندما يصدر مخرجات أو يفشل.

إرسال المفاتيح (بنمط tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

الإرسال (إرسال CR فقط):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

اللصق (بين أقواس افتراضيا):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` أداة فرعية من `exec` للتعديلات المنظمة متعددة الملفات.
تكون مفعلة افتراضيا لنماذج OpenAI وOpenAI Codex. استخدم الإعدادات فقط
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
- تظل سياسة الأدوات مطبقة؛ يسمح `allow: ["write"]` ضمنيا بـ `apply_patch`.
- لا يرفض `deny: ["write"]` استخدام `apply_patch`؛ ارفض `apply_patch` صراحة أو استخدم `deny: ["group:fs"]` عندما يجب أيضا حظر عمليات الكتابة عبر التصحيح.
- توجد الإعدادات ضمن `tools.exec.applyPatch`.
- القيمة الافتراضية لـ `tools.exec.applyPatch.enabled` هي `true`؛ اضبطها على `false` لتعطيل الأداة لنماذج OpenAI.
- القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (محصورة ضمن مساحة العمل). اضبطها على `false` فقط إذا كنت تريد عمدا أن يكتب `apply_patch` أو يحذف خارج دليل مساحة العمل.

## ذو صلة

- [موافقات exec](/ar/tools/exec-approvals) — بوابات الموافقة لأوامر shell
- [العزل](/ar/gateway/sandboxing) — تشغيل الأوامر في بيئات معزولة
- [عملية خلفية](/ar/gateway/background-process) — أداة exec وprocess طويلة التشغيل
- [الأمان](/ar/gateway/security) — سياسة الأدوات والوصول المرتفع
