---
read_when:
    - استخدام أداة exec أو تعديلها
    - استكشاف أخطاء سلوك stdin أو TTY وإصلاحها
summary: استخدام أداة exec، وأوضاع stdin، ودعم TTY
title: أداة التنفيذ
x-i18n:
    generated_at: "2026-05-06T08:16:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9892f030f1eeb83ca0cebac462c469e5f9f000763e4c96d62d82b819f98c3084
    source_path: tools/exec.md
    workflow: 16
---

شغّل أوامر shell في مساحة العمل. يدعم التنفيذ في المقدمة + الخلفية عبر `process`.
إذا كان `process` غير مسموح، فسيعمل `exec` بشكل متزامن ويتجاهل `yieldMs`/`background`.
جلسات الخلفية مقيّدة النطاق لكل وكيل؛ يرى `process` الجلسات من الوكيل نفسه فقط.

## المعاملات

<ParamField path="command" type="string" required>
أمر Shell المطلوب تشغيله.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دليل العمل للأمر.
</ParamField>

<ParamField path="env" type="object">
تجاوزات بيئة على هيئة مفتاح/قيمة تُدمج فوق البيئة الموروثة.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
انقل الأمر تلقائياً إلى الخلفية بعد هذا التأخير (بالمللي ثانية).
</ParamField>

<ParamField path="background" type="boolean" default="false">
انقل الأمر إلى الخلفية فوراً بدلاً من انتظار `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
تجاوز مهلة exec المكوّنة لهذه الاستدعاء. عيّن `timeout: 0` فقط عندما يجب أن يعمل الأمر بدون مهلة عملية exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
شغّل داخل طرفية زائفة عندما تكون متاحة. استخدمه مع واجهات CLI التي تتطلب TTY، ووكلاء البرمجة، وواجهات الطرفية.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
مكان التنفيذ. يتحول `auto` إلى `sandbox` عند وجود وقت تشغيل sandbox نشط، وإلى `gateway` بخلاف ذلك.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
وضع الإنفاذ لتنفيذ `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
سلوك مطالبة الموافقة لتنفيذ `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
معرّف/اسم Node عندما يكون `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
اطلب الوضع المرفوع — اخرج من sandbox إلى مسار المضيف المكوّن. لا يُفرض `security=full` إلا عندما يُحلّ elevated إلى `full`.
</ParamField>

ملاحظات:

- القيمة الافتراضية لـ `host` هي `auto`: sandbox عندما يكون وقت تشغيل sandbox نشطاً للجلسة، وإلا فـ Gateway.
- يقبل `host` فقط `auto` أو `sandbox` أو `gateway` أو `node`. ليس محدد اسم مضيف؛ تُرفض القيم الشبيهة بأسماء المضيفين قبل تشغيل الأمر.
- `auto` هي استراتيجية التوجيه الافتراضية، وليست حرف بدل. يُسمح بـ `host=node` لكل استدعاء من `auto`؛ ولا يُسمح بـ `host=gateway` لكل استدعاء إلا عندما لا يكون وقت تشغيل sandbox نشطاً.
- بدون إعدادات إضافية، يظل `host=auto` "يعمل مباشرة": عدم وجود sandbox يعني أنه يتحول إلى `gateway`؛ ووجود sandbox حي يعني أنه يبقى داخل sandbox.
- يخرج `elevated` من sandbox إلى مسار المضيف المكوّن: `gateway` افتراضياً، أو `node` عندما يكون `tools.exec.host=node` (أو تكون قيمة الجلسة الافتراضية `host=node`). لا يتوفر إلا عندما يكون الوصول المرفوع مفعلاً للجلسة/المزوّد الحالي.
- تتحكم `~/.openclaw/exec-approvals.json` في موافقات `gateway`/`node`.
- يتطلب `node` Node مقترناً (تطبيقاً مرافقاً أو مضيف Node بلا واجهة).
- إذا توفرت عدة Nodes، فعيّن `exec.node` أو `tools.exec.node` لاختيار واحد.
- `exec host=node` هو مسار تنفيذ shell الوحيد لـ Nodes؛ أُزيل الغلاف القديم `nodes.run`.
- تنطبق `timeout` على التنفيذ في المقدمة، والخلفية، و`yieldMs`، وGateway، وsandbox، وتنفيذ `system.run` في Node. إذا حُذفت، يستخدم OpenClaw `tools.exec.timeoutSec`؛ وتعطّل `timeout: 0` الصريحة مهلة عملية exec لذلك الاستدعاء.
- على المضيفين غير Windows، يستخدم exec قيمة `SHELL` عند تعيينها؛ وإذا كانت `SHELL` هي `fish`، فإنه يفضّل `bash` (أو `sh`)
  من `PATH` لتجنب السكربتات غير المتوافقة مع fish، ثم يعود إلى `SHELL` إذا لم يوجد أي منهما.
- على مضيفي Windows، يفضّل exec اكتشاف PowerShell 7 (`pwsh`) (Program Files، ثم ProgramW6432، ثم PATH)،
  ثم يعود إلى Windows PowerShell 5.1.
- يرفض تنفيذ المضيف (`gateway`/`node`) تجاوزات `env.PATH` وتجاوزات المحمّل (`LD_*`/`DYLD_*`) من أجل
  منع اختطاف الثنائيات أو حقن الشيفرة.
- يعيّن OpenClaw‏ `OPENCLAW_SHELL=exec` في بيئة الأمر المُنشأة (بما في ذلك تنفيذ PTY وsandbox) حتى تتمكن قواعد shell/profile من اكتشاف سياق أداة exec.
- يُحظر `openclaw channels login` من `exec` لأنه تدفق مصادقة قناة تفاعلي؛ شغّله في طرفية على مضيف Gateway، أو استخدم أداة تسجيل الدخول الأصلية للقناة من الدردشة عندما توجد.
- مهم: يكون sandboxing **معطلاً افتراضياً**. إذا كان sandboxing معطلاً، فإن `host=auto` الضمني
  يتحول إلى `gateway`. أما `host=sandbox` الصريح فيفشل بإغلاق بدلاً من التشغيل بصمت
  على مضيف Gateway. فعّل sandboxing أو استخدم `host=gateway` مع الموافقات.
- لا تفحص فحوصات ما قبل تشغيل السكربت (لأخطاء صياغة shell الشائعة في Python/Node) إلا الملفات داخل
  حد `workdir` الفعّال. إذا حُلّ مسار سكربت خارج `workdir`، يتم تخطي فحص ما قبل التشغيل لذلك
  الملف.
- للعمل طويل الأمد الذي يبدأ الآن، ابدأه مرة واحدة واعتمد على إيقاظ
  الإكمال التلقائي عندما يكون مفعلاً ويصدر الأمر مخرجات أو يفشل.
  استخدم `process` للسجلات أو الحالة أو الإدخال أو التدخل؛ لا تحاكِ
  الجدولة بحلقات sleep أو حلقات timeout أو الاستطلاع المتكرر.
- للعمل الذي يجب أن يحدث لاحقاً أو وفق جدول، استخدم cron بدلاً من
  أنماط sleep/delay في `exec`.

## الإعدادات

- `tools.exec.notifyOnExit` (الافتراضي: true): عند true، تضع جلسات exec المنقولة إلى الخلفية حدث نظام في الطابور وتطلب Heartbeat عند الخروج.
- `tools.exec.approvalRunningNoticeMs` (الافتراضي: 10000): أصدِر إشعار "running" واحداً عندما يعمل exec المحكوم بالموافقة لأكثر من هذه المدة (0 يعطّل ذلك).
- `tools.exec.timeoutSec` (الافتراضي: 1800): مهلة exec الافتراضية لكل أمر بالثواني. تتجاوزها `timeout` لكل استدعاء؛ وتعطّل `timeout: 0` لكل استدعاء مهلة عملية exec.
- `tools.exec.host` (الافتراضي: `auto`؛ يتحول إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطاً، وإلى `gateway` بخلاف ذلك)
- `tools.exec.security` (الافتراضي: `deny` لـ sandbox، و`full` لـ gateway + node عند عدم التعيين)
- `tools.exec.ask` (الافتراضي: `off`)
- exec على المضيف بدون موافقة هو الافتراضي لـ gateway + node. إذا أردت سلوك الموافقات/قائمة السماح، فشدّد كلاً من `tools.exec.*` و`~/.openclaw/exec-approvals.json` على المضيف؛ راجع [موافقات Exec](/ar/tools/exec-approvals#yolo-mode-no-approval).
- يأتي YOLO من افتراضيات سياسة المضيف (`security=full`، `ask=off`)، وليس من `host=auto`. إذا أردت فرض توجيه gateway أو node، فعيّن `tools.exec.host` أو استخدم `/exec host=...`.
- في وضع `security=full` مع `ask=off`، يتبع exec على المضيف السياسة المكوّنة مباشرة؛ لا توجد طبقة إضافية لترشيح استدلالي لإخفاء الأوامر أو رفض ما قبل تشغيل السكربتات.
- `tools.exec.node` (الافتراضي: غير معيّن)
- `tools.exec.strictInlineEval` (الافتراضي: false): عند true، تتطلب نماذج تقييم المفسّر المضمنة مثل `python -c` و`node -e` و`ruby -e` و`perl -e` و`php -r` و`lua -e` و`osascript -e` موافقة صريحة دائماً. لا يزال بإمكان `allow-always` حفظ استدعاءات مفسّر/سكربت سليمة، لكن نماذج inline-eval تظل تطلب الموافقة كل مرة.
- `tools.exec.pathPrepend`: قائمة أدلة تُضاف في بداية `PATH` لتشغيلات exec (gateway + sandbox فقط).
- `tools.exec.safeBins`: ثنائيات آمنة تعمل عبر stdin فقط ويمكن تشغيلها بدون إدخالات قائمة سماح صريحة. لتفاصيل السلوك، راجع [الثنائيات الآمنة](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: أدلة صريحة إضافية موثوقة لفحوصات مسار `safeBins`. لا تُوثق إدخالات `PATH` تلقائياً أبداً. الافتراضيات المدمجة هي `/bin` و`/usr/bin`.
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

- `host=gateway`: يدمج `PATH` الخاص بصدفة تسجيل الدخول في بيئة exec. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف. يظل daemon نفسه يعمل بـ `PATH` محدود:
  - macOS: `/opt/homebrew/bin`، `/usr/local/bin`، `/usr/bin`، `/bin`
  - Linux: `/usr/local/bin`، `/usr/bin`، `/bin`
- `host=sandbox`: يشغّل `sh -lc` (صدفة تسجيل دخول) داخل الحاوية، لذا قد يعيد `/etc/profile` تعيين `PATH`.
  يضيف OpenClaw‏ `env.PATH` إلى البداية بعد تحميل profile عبر متغير بيئة داخلي (بدون استيفاء shell)؛
  وينطبق `tools.exec.pathPrepend` هنا أيضاً.
- `host=node`: لا تُرسل إلى Node إلا تجاوزات البيئة غير المحظورة التي تمررها. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف وتتجاهلها مضيفات Node. إذا احتجت إلى إدخالات PATH إضافية على Node،
  فكوّن بيئة خدمة مضيف Node (systemd/launchd) أو ثبّت الأدوات في المواقع القياسية.

ربط Node لكل وكيل (استخدم فهرس قائمة الوكلاء في الإعدادات):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

واجهة التحكم: تتضمن علامة تبويب Nodes لوحة صغيرة باسم "ربط Exec بـ Node" للإعدادات نفسها.

## تجاوزات الجلسة (`/exec`)

استخدم `/exec` لتعيين القيم الافتراضية **لكل جلسة** لكل من `host` و`security` و`ask` و`node`.
أرسل `/exec` بدون وسيطات لعرض القيم الحالية.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## نموذج التفويض

لا يُحترم `/exec` إلا لـ **المرسلين المصرح لهم** (قوائم سماح/اقتران القنوات بالإضافة إلى `commands.useAccessGroups`).
إنه يحدّث **حالة الجلسة فقط** ولا يكتب الإعدادات. لتعطيل exec بشكل صارم، امنعه عبر سياسة الأداة
(`tools.deny: ["exec"]` أو لكل وكيل). تظل موافقات المضيف سارية ما لم تعيّن صراحةً
`security=full` و`ask=off`.

## موافقات Exec (التطبيق المرافق / مضيف Node)

يمكن للوكلاء المعزولين داخل sandbox طلب موافقة لكل طلب قبل تشغيل `exec` على Gateway أو مضيف Node.
راجع [موافقات Exec](/ar/tools/exec-approvals) لمعرفة السياسة وقائمة السماح وتدفق واجهة المستخدم.

عندما تكون الموافقات مطلوبة، تعود أداة exec فوراً مع
`status: "approval-pending"` ومعرّف موافقة. بعد الموافقة (أو الرفض / انتهاء المهلة)،
يبث Gateway أحداث نظام (`Exec finished` / `Exec denied`). إذا ظل الأمر
يعمل بعد `tools.exec.approvalRunningNoticeMs`، يصدر إشعار واحد `Exec running`.
في القنوات التي تحتوي على بطاقات/أزرار موافقة أصلية، يجب أن يعتمد الوكيل على
واجهة المستخدم الأصلية تلك أولاً، وألا يضمّن أمر `/approve` يدوياً إلا عندما
تقول نتيجة الأداة صراحةً إن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي
المسار الوحيد.

## قائمة السماح + الثنائيات الآمنة

يطابق إنفاذ قائمة السماح اليدوي أنماط مسار الثنائي المحلول وأسماء الأوامر
المجردة. لا تطابق الأسماء المجردة إلا الأوامر المستدعاة عبر PATH، لذلك يمكن أن يطابق `rg`
المسار `/opt/homebrew/bin/rg` عندما يكون الأمر `rg`، لكن ليس `./rg` أو `/tmp/rg`.
عندما يكون `security=allowlist`، لا يُسمح بأوامر shell تلقائياً إلا إذا كان كل مقطع في pipeline
مدرجاً في قائمة السماح أو ثنائياً آمناً. تُرفض السلسلة (`;`، `&&`، `||`) وإعادة التوجيه
في وضع قائمة السماح ما لم يستوفِ كل مقطع على المستوى الأعلى
قائمة السماح (بما في ذلك الثنائيات الآمنة). تظل إعادة التوجيه غير مدعومة.
لا تتجاوز ثقة `allow-always` الدائمة تلك القاعدة: لا يزال الأمر المتسلسل يتطلب من كل
مقطع على المستوى الأعلى أن يطابق.

`autoAllowSkills` مسار راحة منفصل في موافقات exec. ليس هو نفسه
إدخالات قائمة السماح اليدوية للمسارات. للثقة الصريحة الصارمة، أبقِ `autoAllowSkills` معطلاً.

استخدم عنصري التحكم للمهام المختلفة:

- `tools.exec.safeBins`: مرشحات دفق صغيرة تعمل عبر stdin فقط.
- `tools.exec.safeBinTrustedDirs`: أدلة موثوقة إضافية صريحة لمسارات الملفات التنفيذية للثنائيات الآمنة.
- `tools.exec.safeBinProfiles`: سياسة argv صريحة للثنائيات الآمنة المخصصة.
- قائمة السماح: ثقة صريحة لمسارات الملفات التنفيذية.

لا تتعامل مع `safeBins` كقائمة سماح عامة، ولا تضف ثنائيات المفسّر/وقت التشغيل (على سبيل المثال `python3` و`node` و`ruby` و`bash`). إذا كنت تحتاج إليها، فاستخدم إدخالات قائمة سماح صريحة وأبقِ مطالبات الموافقة مفعّلة.
يحذّر `openclaw security audit` عندما تفتقد إدخالات `safeBins` الخاصة بالمفسّر/وقت التشغيل ملفات تعريف صريحة، ويمكن لـ `openclaw doctor --fix` إنشاء هيكل إدخالات `safeBinProfiles` المخصصة المفقودة.
يحذّر `openclaw security audit` و`openclaw doctor` أيضًا عندما تضيف صراحةً ثنائيات واسعة السلوك مثل `jq` مرة أخرى إلى `safeBins`.
إذا أضفت المفسّرات صراحةً إلى قائمة السماح، ففعّل `tools.exec.strictInlineEval` بحيث تظل صيغ تقييم الشيفرة المضمّنة تتطلب موافقة جديدة.

للحصول على تفاصيل السياسة الكاملة والأمثلة، راجع [موافقات Exec](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only) و[الثنائيات الآمنة مقابل قائمة السماح](/ar/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## أمثلة

في المقدمة:

```json
{ "tool": "exec", "command": "ls -la" }
```

في الخلفية + الاستطلاع:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

الاستطلاع مخصص للحالة عند الطلب، وليس لحلقات الانتظار. إذا كان تنبيه الإكمال التلقائي
مفعّلًا، يمكن للأمر تنبيه الجلسة عندما يصدر مخرجات أو يفشل.

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

لصق (محاط بأقواس افتراضيًا):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` أداة فرعية من `exec` للتعديلات المنظمة متعددة الملفات.
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
- تظل سياسة الأداة مطبقة؛ `allow: ["write"]` يسمح ضمنيًا بـ `apply_patch`.
- لا يرفض `deny: ["write"]` استخدام `apply_patch`؛ ارفض `apply_patch` صراحةً أو استخدم `deny: ["group:fs"]` عندما ينبغي أيضًا حظر عمليات الكتابة عبر الرقعة.
- توجد الإعدادات ضمن `tools.exec.applyPatch`.
- القيمة الافتراضية لـ `tools.exec.applyPatch.enabled` هي `true`؛ اضبطها على `false` لتعطيل الأداة لنماذج OpenAI.
- القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (محصورة داخل مساحة العمل). اضبطها على `false` فقط إذا كنت تريد عمدًا أن يكتب `apply_patch` أو يحذف خارج دليل مساحة العمل.

## ذات صلة

- [موافقات Exec](/ar/tools/exec-approvals) — بوابات الموافقة لأوامر الصدفة
- [العزل](/ar/gateway/sandboxing) — تشغيل الأوامر في بيئات معزولة
- [عملية الخلفية](/ar/gateway/background-process) — أداة exec وprocess طويلة التشغيل
- [الأمان](/ar/gateway/security) — سياسة الأداة والوصول المرتفع
