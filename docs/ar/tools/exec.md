---
read_when:
    - استخدام أداة exec أو تعديلها
    - تصحيح أخطاء سلوك stdin أو TTY
summary: استخدام أداة exec، وأوضاع stdin، ودعم TTY
title: أداة التنفيذ
x-i18n:
    generated_at: "2026-05-03T21:43:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

شغّل أوامر shell في مساحة العمل. يدعم التنفيذ في المقدمة + الخلفية عبر `process`.
إذا كان `process` غير مسموح، يعمل `exec` بشكل متزامن ويتجاهل `yieldMs`/`background`.
تُقيَّد جلسات الخلفية لكل وكيل؛ لا يرى `process` إلا الجلسات من الوكيل نفسه.

## المعاملات

<ParamField path="command" type="string" required>
أمر Shell المراد تشغيله.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دليل العمل للأمر.
</ParamField>

<ParamField path="env" type="object">
تجاوزات بيئة على هيئة مفتاح/قيمة تُدمج فوق البيئة الموروثة.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
انقل الأمر تلقائيًا إلى الخلفية بعد هذا التأخير (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
انقل الأمر إلى الخلفية فورًا بدلًا من انتظار `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
تجاوز مهلة exec المضبوطة لهذه الاستدعاء. اضبط `timeout: 0` فقط عندما ينبغي تشغيل الأمر بلا مهلة عملية exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
شغّل في طرفية وهمية عند توفرها. استخدمه لواجهات CLI التي تتطلب TTY فقط، ووكلاء البرمجة، وواجهات المستخدم الطرفية.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
مكان التنفيذ. يتحول `auto` إلى `sandbox` عندما يكون وقت تشغيل صندوق الحماية نشطًا، وإلى `gateway` خلاف ذلك.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
وضع فرض التنفيذ لـ `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
سلوك مطالبة الموافقة لتنفيذ `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
معرّف/اسم Node عندما يكون `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
اطلب الوضع المرتفع — اخرج من صندوق الحماية إلى مسار المضيف المضبوط. يُفرض `security=full` فقط عندما يتحول الوضع المرتفع إلى `full`.
</ParamField>

ملاحظات:

- القيمة الافتراضية لـ `host` هي `auto`: صندوق الحماية عندما يكون وقت تشغيل صندوق الحماية نشطًا للجلسة، وإلا Gateway.
- يقبل `host` فقط القيم `auto` أو `sandbox` أو `gateway` أو `node`. ليس محددًا لاسم مضيف؛ تُرفض القيم الشبيهة بأسماء المضيفين قبل تشغيل الأمر.
- `auto` هو استراتيجية التوجيه الافتراضية، وليس حرف بدل. يُسمح بـ `host=node` لكل استدعاء من `auto`؛ ولا يُسمح بـ `host=gateway` لكل استدعاء إلا عندما لا يكون وقت تشغيل صندوق الحماية نشطًا.
- بلا إعداد إضافي، يظل `host=auto` "يعمل ببساطة": عدم وجود صندوق حماية يعني أنه يتحول إلى `gateway`؛ ووجود صندوق حماية حي يعني أنه يبقى داخل صندوق الحماية.
- يخرج `elevated` من صندوق الحماية إلى مسار المضيف المضبوط: `gateway` افتراضيًا، أو `node` عندما يكون `tools.exec.host=node` (أو تكون القيمة الافتراضية للجلسة `host=node`). لا يتوفر إلا عندما يكون الوصول المرتفع ممكّنًا للجلسة/المزوّد الحالي.
- تتحكم `~/.openclaw/exec-approvals.json` في موافقات `gateway`/`node`.
- يتطلب `node` Node مقترنًا (تطبيقًا مرافقًا أو مضيف Node بلا واجهة).
- إذا توفرت عدة Nodes، فاضبط `exec.node` أو `tools.exec.node` لاختيار واحد.
- `exec host=node` هو مسار تنفيذ shell الوحيد لـ Nodes؛ أزيل الغلاف القديم `nodes.run`.
- ينطبق `timeout` على التنفيذ في المقدمة، والخلفية، و`yieldMs`، وGateway، وصندوق الحماية، وتنفيذ `system.run` على Node. إذا حُذف، يستخدم OpenClaw `tools.exec.timeoutSec`؛ تعطّل القيمة الصريحة `timeout: 0` مهلة عملية exec لذلك الاستدعاء.
- على المضيفين غير Windows، يستخدم exec قيمة `SHELL` عند ضبطها؛ وإذا كانت `SHELL` هي `fish`، فإنه يفضّل `bash` (أو `sh`)
  من `PATH` لتجنب السكربتات غير المتوافقة مع fish، ثم يعود إلى `SHELL` إذا لم يوجد أي منهما.
- على مضيفي Windows، يفضّل exec اكتشاف PowerShell 7 (`pwsh`) (Program Files، ثم ProgramW6432، ثم PATH)،
  ثم يعود إلى Windows PowerShell 5.1.
- يرفض تنفيذ المضيف (`gateway`/`node`) تجاوزات `env.PATH` وتجاوزات المُحمّل (`LD_*`/`DYLD_*`) من أجل
  منع اختطاف الثنائيات أو حقن الكود.
- يضبط OpenClaw `OPENCLAW_SHELL=exec` في بيئة الأمر المُنشأ (بما في ذلك تنفيذ PTY وصندوق الحماية) حتى تتمكن قواعد shell/الملف الشخصي من اكتشاف سياق أداة exec.
- يُحظر `openclaw channels login` من `exec` لأنه تدفق تفاعلي لمصادقة القناة؛ شغّله في طرفية على مضيف Gateway، أو استخدم أداة تسجيل الدخول الأصلية للقناة من الدردشة عند توفرها.
- مهم: صندوق الحماية **متوقف افتراضيًا**. إذا كان صندوق الحماية متوقفًا، فإن `host=auto` الضمني
  يتحول إلى `gateway`. أما `host=sandbox` الصريح فيفشل بشكل مغلق بدلًا من التشغيل بصمت
  على مضيف Gateway. فعّل صندوق الحماية أو استخدم `host=gateway` مع الموافقات.
- تفحص عمليات التحقق المسبق للسكربتات (لأخطاء صياغة shell الشائعة في Python/Node) الملفات داخل حدود
  `workdir` الفعالة فقط. إذا تحول مسار سكربت إلى خارج `workdir`، يُتجاوز الفحص المسبق لذلك
  الملف.
- للعمل طويل التشغيل الذي يبدأ الآن، ابدأه مرة واحدة واعتمد على إيقاظ الإكمال التلقائي
  عندما يكون ممكّنًا ويُصدر الأمر مخرجات أو يفشل.
  استخدم `process` للسجلات أو الحالة أو الإدخال أو التدخل؛ لا تحاكِ
  الجدولة بحلقات sleep أو حلقات timeout أو الاستطلاع المتكرر.
- للعمل الذي يجب أن يحدث لاحقًا أو وفق جدول، استخدم cron بدلًا من
  أنماط sleep/delay في `exec`.

## الإعدادات

- `tools.exec.notifyOnExit` (الافتراضي: true): عند true، تُدرج جلسات exec المنقولة إلى الخلفية حدثًا نظاميًا وتطلب Heartbeat عند الخروج.
- `tools.exec.approvalRunningNoticeMs` (الافتراضي: 10000): أصدر إشعار “running” واحدًا عندما يستمر exec المحكوم بالموافقة أكثر من هذه المدة (0 يعطّل ذلك).
- `tools.exec.timeoutSec` (الافتراضي: 1800): مهلة exec الافتراضية لكل أمر بالثواني. يتجاوزها `timeout` لكل استدعاء؛ وتعطّل `timeout: 0` لكل استدعاء مهلة عملية exec.
- `tools.exec.host` (الافتراضي: `auto`؛ يتحول إلى `sandbox` عندما يكون وقت تشغيل صندوق الحماية نشطًا، وإلى `gateway` خلاف ذلك)
- `tools.exec.security` (الافتراضي: `deny` لصندوق الحماية، و`full` لـ Gateway + Node عندما لا تكون مضبوطة)
- `tools.exec.ask` (الافتراضي: `off`)
- تنفيذ المضيف بلا موافقة هو الافتراضي لـ Gateway + Node. إذا أردت سلوك الموافقات/قائمة السماح، فشدّد كلاً من `tools.exec.*` وملف المضيف `~/.openclaw/exec-approvals.json`؛ راجع [موافقات Exec](/ar/tools/exec-approvals#yolo-mode-no-approval).
- يأتي YOLO من افتراضيات سياسة المضيف (`security=full`، و`ask=off`)، وليس من `host=auto`. إذا أردت فرض توجيه Gateway أو Node، فاضبط `tools.exec.host` أو استخدم `/exec host=...`.
- في وضع `security=full` مع `ask=off`، يتبع exec على المضيف السياسة المضبوطة مباشرة؛ لا توجد طبقة إضافية لمرشح مسبق استدلالي لتعمية الأوامر أو رفض الفحص المسبق للسكربتات.
- `tools.exec.node` (الافتراضي: غير مضبوط)
- `tools.exec.strictInlineEval` (الافتراضي: false): عند true، تتطلب أشكال تقييم المفسر المضمنة مثل `python -c` و`node -e` و`ruby -e` و`perl -e` و`php -r` و`lua -e` و`osascript -e` موافقة صريحة دائمًا. يمكن لـ `allow-always` أن يواصل حفظ استدعاءات المفسر/السكربت الحميدة، لكن أشكال inline-eval تظل تطلب الموافقة في كل مرة.
- `tools.exec.pathPrepend`: قائمة أدلة تُضاف إلى بداية `PATH` لتشغيلات exec (Gateway + صندوق الحماية فقط).
- `tools.exec.safeBins`: ثنائيات آمنة للإدخال القياسي فقط يمكن تشغيلها بلا إدخالات صريحة في قائمة السماح. لتفاصيل السلوك، راجع [الثنائيات الآمنة](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: أدلة صريحة إضافية موثوقة لفحوصات مسار `safeBins`. لا تُوثق إدخالات `PATH` تلقائيًا أبدًا. الافتراضيات المضمنة هي `/bin` و`/usr/bin`.
- `tools.exec.safeBinProfiles`: سياسة argv مخصصة اختيارية لكل ثنائي آمن (`minPositional`، و`maxPositional`، و`allowedValueFlags`، و`deniedFlags`).

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

- `host=gateway`: يدمج `PATH` الخاص بـ login-shell في بيئة exec. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف. يستمر daemon نفسه في العمل مع `PATH` محدود:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: يشغّل `sh -lc` (login shell) داخل الحاوية، لذلك قد يعيد `/etc/profile` ضبط `PATH`.
  يضيف OpenClaw قيمة `env.PATH` إلى البداية بعد تحميل الملف الشخصي عبر متغير بيئة داخلي (بلا استيفاء shell)؛
  ينطبق `tools.exec.pathPrepend` هنا أيضًا.
- `host=node`: تُرسل إلى Node فقط تجاوزات البيئة غير المحظورة التي تمررها. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف وتتجاهلها مضيفات Node. إذا احتجت إلى إدخالات PATH إضافية على Node،
  فاضبط بيئة خدمة مضيف Node (systemd/launchd) أو ثبّت الأدوات في مواقع قياسية.

ربط Node لكل وكيل (استخدم فهرس قائمة الوكلاء في الإعدادات):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

واجهة التحكم: تتضمن علامة تبويب Nodes لوحة صغيرة باسم “ربط Exec node” للإعدادات نفسها.

## تجاوزات الجلسة (`/exec`)

استخدم `/exec` لضبط الافتراضيات **لكل جلسة** لـ `host` و`security` و`ask` و`node`.
أرسل `/exec` بلا وسائط لعرض القيم الحالية.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## نموذج التفويض

يُحترم `/exec` فقط لـ **المرسلين المصرح لهم** (قوائم السماح/الاقتران للقنوات بالإضافة إلى `commands.useAccessGroups`).
إنه يحدّث **حالة الجلسة فقط** ولا يكتب الإعدادات. لتعطيل exec بشكل صارم، امنعه عبر سياسة الأداة
(`tools.deny: ["exec"]` أو لكل وكيل). تظل موافقات المضيف مطبقة ما لم تضبط صراحةً
`security=full` و`ask=off`.

## موافقات Exec (التطبيق المرافق / مضيف Node)

يمكن للوكلاء داخل صندوق الحماية طلب موافقة لكل طلب قبل أن يعمل `exec` على مضيف Gateway أو Node.
راجع [موافقات Exec](/ar/tools/exec-approvals) للاطلاع على السياسة وقائمة السماح وتدفق واجهة المستخدم.

عندما تكون الموافقات مطلوبة، تعود أداة exec فورًا مع
`status: "approval-pending"` ومعرّف موافقة. بمجرد الموافقة (أو الرفض / انتهاء المهلة)،
يصدر Gateway أحداثًا نظامية (`Exec finished` / `Exec denied`). إذا كان الأمر لا يزال
قيد التشغيل بعد `tools.exec.approvalRunningNoticeMs`، يصدر إشعار `Exec running` واحد.
على القنوات ذات بطاقات/أزرار الموافقة الأصلية، ينبغي للوكيل الاعتماد على واجهة المستخدم
الأصلية أولًا، وألا يضمّن أمر `/approve` يدويًا إلا عندما تقول نتيجة الأداة
صراحةً إن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي
المسار الوحيد.

## قائمة السماح + الثنائيات الآمنة

يطابق فرض قائمة السماح اليدوي أنماط glob لمسار الثنائي المحلول وأنماط glob لأسماء الأوامر المجردة.
لا تطابق الأسماء المجردة إلا الأوامر المستدعاة عبر PATH، لذلك يمكن أن يطابق `rg`
المسار `/opt/homebrew/bin/rg` عندما يكون الأمر `rg`، لكن ليس `./rg` أو `/tmp/rg`.
عندما يكون `security=allowlist`، لا يُسمح بأوامر shell تلقائيًا إلا إذا كان كل مقطع في خط الأنابيب
موجودًا في قائمة السماح أو ثنائيًا آمنًا. تُرفض السلسلة (`;`، و`&&`، و`||`) وعمليات إعادة التوجيه
في وضع قائمة السماح ما لم يلبِّ كل مقطع على المستوى الأعلى
قائمة السماح (بما في ذلك الثنائيات الآمنة). تظل عمليات إعادة التوجيه غير مدعومة.
لا تتجاوز ثقة `allow-always` الدائمة تلك القاعدة: لا يزال الأمر المتسلسل يتطلب مطابقة كل
مقطع على المستوى الأعلى.

`autoAllowSkills` هو مسار تسهيل منفصل في موافقات exec. ليس هو نفسه
إدخالات قائمة السماح اليدوية للمسارات. للثقة الصريحة الصارمة، أبقِ `autoAllowSkills` معطلًا.

استخدم عنصري التحكم لمهام مختلفة:

- `tools.exec.safeBins`: مرشحات تدفق صغيرة للإدخال القياسي فقط.
- `tools.exec.safeBinTrustedDirs`: أدلة إضافية موثوقة صريحة لمسارات ملفات تنفيذ الثنائيات الآمنة.
- `tools.exec.safeBinProfiles`: سياسة argv صريحة للثنائيات الآمنة المخصصة.
- قائمة السماح: ثقة صريحة لمسارات الملفات التنفيذية.

لا تتعامل مع `safeBins` كقائمة سماح عامة، ولا تضف ثنائيات المفسّرات/وقت التشغيل (مثل `python3` و`node` و`ruby` و`bash`). إذا كنت تحتاج إليها، فاستخدم إدخالات قائمة سماح صريحة واترك مطالبات الموافقة مفعّلة.
يحذّر `openclaw security audit` عندما تكون إدخالات `safeBins` الخاصة بالمفسّرات/وقت التشغيل بلا ملفات تعريف صريحة، ويمكن لـ `openclaw doctor --fix` إنشاء إدخالات `safeBinProfiles` مخصصة مفقودة مبدئياً.
يحذّر `openclaw security audit` و`openclaw doctor` أيضاً عندما تضيف صراحةً ثنائيات واسعة السلوك مثل `jq` مرة أخرى إلى `safeBins`.
إذا أضفت المفسّرات صراحةً إلى قائمة السماح، ففعّل `tools.exec.strictInlineEval` بحيث تظل صيغ تقييم الشيفرة المضمّنة تتطلب موافقة جديدة.

للحصول على تفاصيل السياسة الكاملة والأمثلة، راجع [موافقات exec](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only) و[الثنائيات الآمنة مقابل قائمة السماح](/ar/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## أمثلة

في الواجهة الأمامية:

```json
{ "tool": "exec", "command": "ls -la" }
```

في الخلفية + الاستطلاع:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

الاستطلاع مخصص للحالة عند الطلب، وليس لحلقات الانتظار. إذا كان تنبيه الإكمال التلقائي
مفعّلاً، يمكن للأمر تنبيه الجلسة عندما يصدر مخرجات أو يفشل.

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

اللصق (محاط بأقواس افتراضياً):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` أداة فرعية من `exec` للتعديلات المهيكلة متعددة الملفات.
وهي مفعّلة افتراضياً لنماذج OpenAI وOpenAI Codex. استخدم الإعدادات فقط
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
- `deny: ["write"]` لا يمنع `apply_patch`؛ امنع `apply_patch` صراحةً أو استخدم `deny: ["group:fs"]` عندما ينبغي حظر عمليات كتابة الرقع أيضاً.
- توجد الإعدادات ضمن `tools.exec.applyPatch`.
- القيمة الافتراضية لـ `tools.exec.applyPatch.enabled` هي `true`؛ اضبطها على `false` لتعطيل الأداة لنماذج OpenAI.
- القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (محصورة داخل مساحة العمل). اضبطها على `false` فقط إذا كنت تريد عمداً أن يكتب `apply_patch` أو يحذف خارج دليل مساحة العمل.

## ذات صلة

- [موافقات Exec](/ar/tools/exec-approvals) — بوابات الموافقة لأوامر الصدفة
- [العزل](/ar/gateway/sandboxing) — تشغيل الأوامر في بيئات معزولة
- [عملية الخلفية](/ar/gateway/background-process) — أداة exec والعمليات طويلة التشغيل
- [الأمان](/ar/gateway/security) — سياسة الأدوات والوصول المرفوع
