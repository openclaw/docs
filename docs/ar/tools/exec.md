---
read_when:
    - استخدام أداة exec أو تعديلها
    - استكشاف أخطاء سلوك stdin أو TTY وإصلاحها
summary: استخدام أداة Exec، وأوضاع stdin، ودعم TTY
title: أداة التنفيذ
x-i18n:
    generated_at: "2026-04-30T08:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

تشغيل أوامر shell في مساحة العمل. يدعم التنفيذ في المقدمة + الخلفية عبر `process`.
إذا كان `process` غير مسموح، فإن `exec` يعمل بشكل متزامن ويتجاهل `yieldMs`/`background`.
تُحدد جلسات الخلفية لكل وكيل؛ لا يرى `process` إلا الجلسات من الوكيل نفسه.

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
انقل الأمر تلقائياً إلى الخلفية بعد هذا التأخير (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
انقل الأمر إلى الخلفية فوراً بدلاً من انتظار `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
تجاوز مهلة exec المكوّنة لهذه الاستدعاء. عيّن `timeout: 0` فقط عندما يجب أن يعمل الأمر دون مهلة عملية exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
شغّل في طرفية زائفة عند توفرها. استخدمه لواجهات CLI التي تتطلب TTY فقط، ووكلاء البرمجة، وواجهات الطرفية.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
مكان التنفيذ. يتحول `auto` إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطاً، وإلى `gateway` بخلاف ذلك.
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
اطلب الوضع المرتفع — الخروج من sandbox إلى مسار المضيف المكوّن. لا يُفرض `security=full` إلا عندما يتحول elevated إلى `full`.
</ParamField>

ملاحظات:

- القيمة الافتراضية لـ `host` هي `auto`: sandbox عندما يكون وقت تشغيل sandbox نشطاً للجلسة، وإلا gateway.
- لا يقبل `host` إلا `auto` أو `sandbox` أو `gateway` أو `node`. إنه ليس محدد اسم مضيف؛ تُرفض القيم الشبيهة بأسماء المضيفين قبل تشغيل الأمر.
- `auto` هي استراتيجية التوجيه الافتراضية، وليست حرف بدل. يُسمح بـ `host=node` لكل استدعاء من `auto`؛ ولا يُسمح بـ `host=gateway` لكل استدعاء إلا عندما لا يكون وقت تشغيل sandbox نشطاً.
- من دون إعدادات إضافية، يظل `host=auto` "يعمل مباشرة": عدم وجود sandbox يعني أنه يتحول إلى `gateway`؛ ووجود sandbox حي يعني أنه يبقى داخل sandbox.
- يخرج `elevated` من sandbox إلى مسار المضيف المكوّن: `gateway` افتراضياً، أو `node` عندما يكون `tools.exec.host=node` (أو عندما يكون الافتراضي للجلسة هو `host=node`). لا يتوفر إلا عندما يكون الوصول المرتفع مفعّلاً للجلسة/المزوّد الحالي.
- تتحكم `~/.openclaw/exec-approvals.json` في موافقات `gateway`/`node`.
- يتطلب `node` وجود عقدة مقترنة (تطبيق مرافق أو مضيف node بلا واجهة).
- إذا توفرت عدة عقد، عيّن `exec.node` أو `tools.exec.node` لاختيار واحدة.
- `exec host=node` هو مسار تنفيذ shell الوحيد للعقد؛ أُزيل مغلف `nodes.run` القديم.
- تنطبق `timeout` على تنفيذ المقدمة، والخلفية، و`yieldMs`، وgateway، وsandbox، وتنفيذ node `system.run`. إذا حُذفت، يستخدم OpenClaw `tools.exec.timeoutSec`؛ وتؤدي `timeout: 0` الصريحة إلى تعطيل مهلة عملية exec لذلك الاستدعاء.
- على المضيفين غير Windows، يستخدم exec قيمة `SHELL` عند تعيينها؛ إذا كانت `SHELL` هي `fish`، فإنه يفضل `bash` (أو `sh`)
  من `PATH` لتجنب السكربتات غير المتوافقة مع fish، ثم يعود إلى `SHELL` إذا لم يوجد أي منهما.
- على مضيفي Windows، يفضل exec اكتشاف PowerShell 7 (`pwsh`) (Program Files، ثم ProgramW6432، ثم PATH)،
  ثم يعود إلى Windows PowerShell 5.1.
- يرفض تنفيذ المضيف (`gateway`/`node`) تجاوزات `env.PATH` وتجاوزات المحمّل (`LD_*`/`DYLD_*`) من أجل
  منع اختطاف الثنائيات أو حقن الشيفرة.
- يعيّن OpenClaw `OPENCLAW_SHELL=exec` في بيئة الأمر المُنشأ (بما في ذلك تنفيذ PTY وsandbox) حتى تتمكن قواعد shell/profile من اكتشاف سياق أداة exec.
- يُحظر `openclaw channels login` من `exec` لأنه تدفق تفاعلي لمصادقة القناة؛ شغّله في طرفية على مضيف gateway، أو استخدم أداة تسجيل الدخول الأصلية للقناة من الدردشة عندما توجد.
- مهم: يكون sandboxing **متوقفاً افتراضياً**. إذا كان sandboxing متوقفاً، فإن `host=auto` الضمني
  يتحول إلى `gateway`. يظل `host=sandbox` الصريح يفشل بشكل مغلق بدلاً من التشغيل بصمت
  على مضيف gateway. فعّل sandboxing أو استخدم `host=gateway` مع الموافقات.
- لا تفحص فحوصات ما قبل تشغيل السكربتات (لأخطاء صياغة shell الشائعة في Python/Node) إلا الملفات داخل
  حد `workdir` الفعّال. إذا تحول مسار سكربت إلى خارج `workdir`، يُتخطى فحص ما قبل التشغيل لذلك
  الملف.
- للعمل طويل الأمد الذي يبدأ الآن، ابدأه مرة واحدة واعتمد على إيقاظ
  الإكمال التلقائي عندما يكون مفعّلاً ويصدر الأمر مخرجات أو يفشل.
  استخدم `process` للسجلات أو الحالة أو الإدخال أو التدخل؛ لا تحاكِ
  الجدولة بحلقات النوم أو حلقات المهلة أو الاستطلاع المتكرر.
- للعمل الذي يجب أن يحدث لاحقاً أو وفق جدول، استخدم cron بدلاً من
  أنماط النوم/التأخير في `exec`.

## الإعدادات

- `tools.exec.notifyOnExit` (الافتراضي: true): عندما تكون true، تضع جلسات exec المنقولة إلى الخلفية حدث نظام في الصف وتطلب Heartbeat عند الخروج.
- `tools.exec.approvalRunningNoticeMs` (الافتراضي: 10000): أصدر إشعار “قيد التشغيل” واحداً عندما يعمل exec الخاضع للموافقة لمدة أطول من ذلك (0 يعطّل).
- `tools.exec.timeoutSec` (الافتراضي: 1800): مهلة exec الافتراضية لكل أمر بالثواني. تتجاوزها `timeout` لكل استدعاء؛ وتعطّل `timeout: 0` لكل استدعاء مهلة عملية exec.
- `tools.exec.host` (الافتراضي: `auto`؛ يتحول إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطاً، وإلى `gateway` بخلاف ذلك)
- `tools.exec.security` (الافتراضي: `deny` لـ sandbox، و`full` لـ gateway + node عند عدم التعيين)
- `tools.exec.ask` (الافتراضي: `off`)
- تنفيذ exec على المضيف بلا موافقة هو الافتراضي لـ gateway + node. إذا كنت تريد سلوك الموافقات/قائمة السماح، شدّد كلاً من `tools.exec.*` وملف المضيف `~/.openclaw/exec-approvals.json`؛ راجع [موافقات Exec](/ar/tools/exec-approvals#no-approval-yolo-mode).
- تأتي YOLO من افتراضيات سياسة المضيف (`security=full`، `ask=off`)، لا من `host=auto`. إذا أردت فرض توجيه gateway أو node، فعيّن `tools.exec.host` أو استخدم `/exec host=...`.
- في وضع `security=full` مع `ask=off`، يتبع تنفيذ exec على المضيف السياسة المكوّنة مباشرة؛ لا توجد طبقة إضافية لتصفية أوامر مشوشة إرشادياً أو رفض ما قبل تشغيل السكربتات.
- `tools.exec.node` (الافتراضي: غير معيّن)
- `tools.exec.strictInlineEval` (الافتراضي: false): عندما تكون true، تتطلب نماذج eval المضمنة للمفسرات مثل `python -c` و`node -e` و`ruby -e` و`perl -e` و`php -r` و`lua -e` و`osascript -e` موافقة صريحة دائماً. لا يزال بإمكان `allow-always` حفظ استدعاءات مفسر/سكربت حميدة، لكن نماذج inline-eval تظل تطلب الموافقة في كل مرة.
- `tools.exec.pathPrepend`: قائمة أدلة تُضاف إلى بداية `PATH` لتشغيلات exec (gateway + sandbox فقط).
- `tools.exec.safeBins`: ثنائيات آمنة تعتمد على stdin فقط ويمكن تشغيلها دون إدخالات صريحة في قائمة السماح. لتفاصيل السلوك، راجع [الثنائيات الآمنة](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: أدلة صريحة إضافية موثوقة لفحوصات مسارات `safeBins`. لا تُوثّق إدخالات `PATH` تلقائياً أبداً. القيم الافتراضية المضمنة هي `/bin` و`/usr/bin`.
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

### التعامل مع PATH

- `host=gateway`: يدمج `PATH` الخاص بواجهة login-shell في بيئة exec. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف. يظل daemon نفسه يعمل مع `PATH` محدود:
  - macOS: `/opt/homebrew/bin`، `/usr/local/bin`، `/usr/bin`، `/bin`
  - Linux: `/usr/local/bin`، `/usr/bin`، `/bin`
- `host=sandbox`: يشغّل `sh -lc` (login shell) داخل الحاوية، لذلك قد يعيد `/etc/profile` تعيين `PATH`.
  يضيف OpenClaw `env.PATH` إلى البداية بعد تحميل profile عبر متغير بيئة داخلي (دون interpolation من shell)؛
  ينطبق `tools.exec.pathPrepend` هنا أيضاً.
- `host=node`: تُرسل إلى node فقط تجاوزات البيئة غير المحظورة التي تمررها. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف وتتجاهلها مضيفات node. إذا احتجت إلى إدخالات PATH إضافية على node،
  فكوّن بيئة خدمة مضيف node (systemd/launchd) أو ثبّت الأدوات في مواقع قياسية.

ربط node لكل وكيل (استخدم فهرس قائمة الوكلاء في الإعدادات):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

واجهة التحكم: تتضمن علامة تبويب Nodes لوحة صغيرة باسم “ربط Exec node” للإعدادات نفسها.

## تجاوزات الجلسة (`/exec`)

استخدم `/exec` لتعيين القيم الافتراضية **لكل جلسة** لـ `host` و`security` و`ask` و`node`.
أرسل `/exec` دون وسيطات لإظهار القيم الحالية.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## نموذج التخويل

لا يُحترم `/exec` إلا من **المرسلين المخوّلين** (قوائم السماح/الاقتران للقنوات إضافة إلى `commands.useAccessGroups`).
إنه يحدّث **حالة الجلسة فقط** ولا يكتب الإعدادات. لتعطيل exec بشكل صارم، امنعه عبر سياسة الأداة
(`tools.deny: ["exec"]` أو لكل وكيل). تظل موافقات المضيف مطبّقة ما لم تعيّن صراحة
`security=full` و`ask=off`.

## موافقات Exec (التطبيق المرافق / مضيف node)

يمكن للوكلاء داخل sandbox طلب موافقة لكل طلب قبل تشغيل `exec` على مضيف gateway أو node.
راجع [موافقات Exec](/ar/tools/exec-approvals) لمعرفة السياسة وقائمة السماح وتدفق واجهة المستخدم.

عندما تكون الموافقات مطلوبة، تعود أداة exec فوراً مع
`status: "approval-pending"` ومعرّف موافقة. بعد الموافقة (أو الرفض / انتهاء المهلة)،
يبث Gateway أحداث النظام (`Exec finished` / `Exec denied`). إذا كان الأمر لا يزال
قيد التشغيل بعد `tools.exec.approvalRunningNoticeMs`، يصدر إشعار واحد `Exec running`.
في القنوات التي تحتوي على بطاقات/أزرار موافقة أصلية، يجب أن يعتمد الوكيل على
واجهة المستخدم الأصلية تلك أولاً، وألا يضمّن أمر `/approve` يدوياً إلا عندما
تقول نتيجة الأداة صراحة إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي
المسار الوحيد.

## قائمة السماح + الثنائيات الآمنة

يطابق فرض قائمة السماح اليدوي globs مسارات الثنائيات المحلولة وglobs أسماء الأوامر المجردة.
لا تطابق الأسماء المجردة إلا الأوامر المستدعاة عبر PATH، لذلك يمكن أن يطابق `rg`
`/opt/homebrew/bin/rg` عندما يكون الأمر `rg`، ولكن ليس `./rg` أو `/tmp/rg`.
عندما يكون `security=allowlist`، لا يُسمح بأوامر shell تلقائياً إلا إذا كان كل مقطع في pipeline
موجوداً في قائمة السماح أو ثنائياً آمناً. تُرفض السلسلة (`;`، `&&`، `||`) وعمليات إعادة التوجيه
في وضع قائمة السماح ما لم يستوف كل مقطع من المستوى الأعلى
قائمة السماح (بما في ذلك الثنائيات الآمنة). تظل عمليات إعادة التوجيه غير مدعومة.
لا تتجاوز ثقة `allow-always` الدائمة تلك القاعدة: يظل الأمر المتسلسل يتطلب مطابقة كل
مقطع من المستوى الأعلى.

`autoAllowSkills` هو مسار تسهيل منفصل في موافقات exec. إنه ليس مماثلاً
لإدخالات قائمة السماح اليدوية للمسارات. للثقة الصريحة الصارمة، اترك `autoAllowSkills` معطلاً.

استخدم عنصري التحكم للمهام المختلفة:

- `tools.exec.safeBins`: مرشحات تدفق صغيرة تعتمد على stdin فقط.
- `tools.exec.safeBinTrustedDirs`: أدلة موثوقة إضافية صريحة لمسارات تنفيذ الثنائيات الآمنة.
- `tools.exec.safeBinProfiles`: سياسة argv صريحة للثنائيات الآمنة المخصصة.
- قائمة السماح: ثقة صريحة لمسارات الملفات التنفيذية.

لا تعامل `safeBins` كقائمة سماح عامة، ولا تضف ثنائيات المفسرات/بيئات التشغيل (مثل `python3` و`node` و`ruby` و`bash`). إذا احتجت إليها، فاستخدم إدخالات قائمة سماح صريحة وأبقِ مطالبات الموافقة مفعلة.
يحذّر `openclaw security audit` عندما تفتقد إدخالات `safeBins` الخاصة بالمفسرات/بيئات التشغيل إلى ملفات تعريف صريحة، ويمكن لـ `openclaw doctor --fix` إنشاء إدخالات `safeBinProfiles` مخصصة مفقودة مبدئياً.
يحذّر `openclaw security audit` و`openclaw doctor` أيضاً عندما تضيف صراحةً ثنائيات ذات سلوك واسع مثل `jq` مرة أخرى إلى `safeBins`.
إذا سمحت صراحةً بالمفسرات في قائمة السماح، ففعّل `tools.exec.strictInlineEval` حتى تظل صيغ تقييم الشيفرة المضمنة تتطلب موافقة جديدة.

للحصول على تفاصيل السياسة الكاملة والأمثلة، راجع [موافقات exec](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only) و[الثنائيات الآمنة مقابل قائمة السماح](/ar/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## أمثلة

المقدمة:

```json
{ "tool": "exec", "command": "ls -la" }
```

الخلفية + الاستطلاع:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

الاستطلاع مخصص للحالة عند الطلب، وليس لحلقات الانتظار. إذا كان إيقاظ الإكمال التلقائي
مفعلاً، فيمكن للأمر إيقاظ الجلسة عندما يصدر مخرجات أو يفشل.

إرسال المفاتيح (بنمط tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

إرسال (إرسال CR فقط):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

لصق (موضوع بين أقواس افتراضياً):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` أداة فرعية من `exec` للتعديلات المنظمة متعددة الملفات.
تكون مفعلة افتراضياً لنماذج OpenAI وOpenAI Codex. استخدم الإعدادات فقط
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
- تظل سياسة الأدوات سارية؛ `allow: ["write"]` يسمح ضمنياً بـ `apply_patch`.
- توجد الإعدادات تحت `tools.exec.applyPatch`.
- القيمة الافتراضية لـ `tools.exec.applyPatch.enabled` هي `true`؛ اضبطها على `false` لتعطيل الأداة لنماذج OpenAI.
- القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (محصورة ضمن مساحة العمل). اضبطها على `false` فقط إذا كنت تريد عمداً أن يكتب `apply_patch` أو يحذف خارج دليل مساحة العمل.

## ذات صلة

- [موافقات Exec](/ar/tools/exec-approvals) — بوابات الموافقة لأوامر الصدفة
- [العزل الرملي](/ar/gateway/sandboxing) — تشغيل الأوامر في بيئات معزولة
- [عملية الخلفية](/ar/gateway/background-process) — أداة exec والعملية طويلة التشغيل
- [الأمان](/ar/gateway/security) — سياسة الأدوات والوصول المرفوع
