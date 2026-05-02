---
read_when:
    - استخدام أداة exec أو تعديلها
    - تصحيح أخطاء سلوك stdin أو TTY
summary: استخدام أداة Exec، وأوضاع stdin، ودعم TTY
title: أداة التنفيذ
x-i18n:
    generated_at: "2026-05-02T22:24:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

شغّل أوامر الصدفة في مساحة العمل. يدعم التنفيذ في المقدمة + الخلفية عبر `process`.
إذا كان `process` غير مسموح به، فإن `exec` يعمل بشكل متزامن ويتجاهل `yieldMs`/`background`.
جلسات الخلفية محددة النطاق لكل وكيل؛ لا يرى `process` إلا الجلسات من الوكيل نفسه.

## المعاملات

<ParamField path="command" type="string" required>
أمر الصدفة المراد تشغيله.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دليل العمل للأمر.
</ParamField>

<ParamField path="env" type="object">
تجاوزات بيئة المفتاح/القيمة المدمجة فوق البيئة الموروثة.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
انقل الأمر تلقائيا إلى الخلفية بعد هذا التأخير (مللي ثانية).
</ParamField>

<ParamField path="background" type="boolean" default="false">
انقل الأمر إلى الخلفية فورا بدلا من انتظار `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
تجاوز مهلة `exec` المكوّنة لهذه الاستدعاء. عيّن `timeout: 0` فقط عندما يجب أن يعمل الأمر دون مهلة عملية `exec`.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
شغّل داخل طرفية زائفة عندما تكون متاحة. استخدمه لأدوات CLI التي تتطلب TTY فقط، ووكلاء البرمجة، وواجهات المستخدم الطرفية.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
مكان التنفيذ. يتحول `auto` إلى `sandbox` عندما يكون وقت تشغيل الصندوق الرملي نشطا، وإلى `gateway` خلاف ذلك.
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
اطلب الوضع المرتفع — الخروج من الصندوق الرملي إلى مسار المضيف المكوّن. لا يُفرض `security=full` إلا عندما يتحول الوضع المرتفع إلى `full`.
</ParamField>

ملاحظات:

- الإعداد الافتراضي لـ `host` هو `auto`: الصندوق الرملي عندما يكون وقت تشغيل الصندوق الرملي نشطا للجلسة، وإلا Gateway.
- لا يقبل `host` إلا `auto` أو `sandbox` أو `gateway` أو `node`. إنه ليس محدد اسم مضيف؛ تُرفض القيم التي تشبه أسماء المضيفين قبل تشغيل الأمر.
- `auto` هي استراتيجية التوجيه الافتراضية، وليست حرف بدل. يُسمح بـ `host=node` لكل استدعاء من `auto`؛ ولا يُسمح بـ `host=gateway` لكل استدعاء إلا عندما لا يكون وقت تشغيل الصندوق الرملي نشطا.
- من دون أي إعداد إضافي، يظل `host=auto` "يعمل فقط": يعني عدم وجود صندوق رملي أنه يتحول إلى `gateway`؛ ووجود صندوق رملي حي يعني أنه يبقى في الصندوق الرملي.
- يخرج `elevated` من الصندوق الرملي إلى مسار المضيف المكوّن: `gateway` افتراضيا، أو `node` عندما يكون `tools.exec.host=node` (أو يكون الإعداد الافتراضي للجلسة هو `host=node`). لا يكون متاحا إلا عندما يكون الوصول المرتفع مفعلا للجلسة/المزوّد الحالي.
- تتحكم `~/.openclaw/exec-approvals.json` في موافقات `gateway`/`node`.
- يتطلب `node` وجود Node مقترن (تطبيق مرافق أو مضيف Node بلا واجهة).
- إذا كانت عدة Nodes متاحة، فعيّن `exec.node` أو `tools.exec.node` لاختيار واحد منها.
- `exec host=node` هو مسار تنفيذ الصدفة الوحيد لـ Nodes؛ تمت إزالة غلاف `nodes.run` القديم.
- ينطبق `timeout` على التنفيذ في المقدمة والخلفية و`yieldMs` وGateway والصندوق الرملي وتنفيذ `system.run` على Node. إذا حُذف، يستخدم OpenClaw `tools.exec.timeoutSec`؛ ويعطل `timeout: 0` الصريح مهلة عملية `exec` لذلك الاستدعاء.
- على المضيفين غير Windows، يستخدم exec قيمة `SHELL` عند تعيينها؛ إذا كانت `SHELL` هي `fish`، فإنه يفضّل `bash` (أو `sh`)
  من `PATH` لتجنب السكربتات غير المتوافقة مع fish، ثم يعود إلى `SHELL` إذا لم يوجد أي منهما.
- على مضيفي Windows، يفضّل exec اكتشاف PowerShell 7 (`pwsh`) (Program Files، ثم ProgramW6432، ثم PATH)،
  ثم يعود إلى Windows PowerShell 5.1.
- يرفض تنفيذ المضيف (`gateway`/`node`) تجاوزات `env.PATH` والمحمّلات (`LD_*`/`DYLD_*`) من أجل
  منع اختطاف الثنائيات أو حقن الشيفرة.
- يعيّن OpenClaw `OPENCLAW_SHELL=exec` في بيئة الأمر المنشأ (بما في ذلك تنفيذ PTY والصندوق الرملي) حتى تتمكن قواعد الصدفة/الملف الشخصي من اكتشاف سياق أداة exec.
- يتم حظر `openclaw channels login` من `exec` لأنه تدفق مصادقة قناة تفاعلي؛ شغّله في طرفية على مضيف Gateway، أو استخدم أداة تسجيل الدخول الأصلية للقناة من الدردشة عندما تكون موجودة.
- مهم: الصندوق الرملي **معطل افتراضيا**. إذا كان الصندوق الرملي معطلا، فإن `host=auto` الضمني
  يتحول إلى `gateway`. يظل `host=sandbox` الصريح يفشل بشكل مغلق بدلا من التشغيل بصمت
  على مضيف Gateway. فعّل الصندوق الرملي أو استخدم `host=gateway` مع الموافقات.
- لا تفحص عمليات التحقق المسبق للسكربتات (لأخطاء صياغة الصدفة الشائعة في Python/Node) إلا الملفات داخل
  حد `workdir` الفعّال. إذا تحول مسار سكربت إلى خارج `workdir`، يتم تخطي التحقق المسبق لذلك
  الملف.
- للعمل طويل التشغيل الذي يبدأ الآن، ابدأه مرة واحدة واعتمد على إيقاظ
  الإكمال التلقائي عندما يكون مفعلا ويصدر الأمر مخرجات أو يفشل.
  استخدم `process` للسجلات أو الحالة أو الإدخال أو التدخل؛ لا تحاكِ
  الجدولة بحلقات النوم أو حلقات المهلة أو الاستقصاء المتكرر.
- للعمل الذي يجب أن يحدث لاحقا أو وفق جدول زمني، استخدم cron بدلا من
  أنماط النوم/التأخير في `exec`.

## الإعدادات

- `tools.exec.notifyOnExit` (الافتراضي: true): عندما تكون true، تضيف جلسات exec المنقولة إلى الخلفية حدث نظام إلى قائمة الانتظار وتطلب Heartbeat عند الخروج.
- `tools.exec.approvalRunningNoticeMs` (الافتراضي: 10000): أصدر إشعار “قيد التشغيل” واحدا عندما يعمل exec الخاضع للموافقة مدة أطول من ذلك (0 يعطل).
- `tools.exec.timeoutSec` (الافتراضي: 1800): مهلة exec الافتراضية لكل أمر بالثواني. يتجاوزها `timeout` لكل استدعاء؛ ويعطل `timeout: 0` لكل استدعاء مهلة عملية exec.
- `tools.exec.host` (الافتراضي: `auto`؛ يتحول إلى `sandbox` عندما يكون وقت تشغيل الصندوق الرملي نشطا، وإلى `gateway` خلاف ذلك)
- `tools.exec.security` (الافتراضي: `deny` للصندوق الرملي، و`full` لـ Gateway + Node عند عدم التعيين)
- `tools.exec.ask` (الافتراضي: `off`)
- تنفيذ المضيف دون موافقة هو الإعداد الافتراضي لـ Gateway + Node. إذا كنت تريد سلوك الموافقات/قائمة السماح، فشدّد كلا من `tools.exec.*` وملف المضيف `~/.openclaw/exec-approvals.json`؛ راجع [موافقات Exec](/ar/tools/exec-approvals#yolo-mode-no-approval).
- يأتي YOLO من الإعدادات الافتراضية لسياسة المضيف (`security=full`، `ask=off`)، وليس من `host=auto`. إذا أردت فرض توجيه Gateway أو Node، فعيّن `tools.exec.host` أو استخدم `/exec host=...`.
- في وضع `security=full` مع `ask=off`، يتبع exec على المضيف السياسة المكوّنة مباشرة؛ لا توجد طبقة إضافية لترشيح أوامر التعمية heuristically أو رفض التحقق المسبق للسكربتات.
- `tools.exec.node` (الافتراضي: غير معيّن)
- `tools.exec.strictInlineEval` (الافتراضي: false): عندما تكون true، تتطلب صيغ تقييم المفسّر المضمنة مثل `python -c` و`node -e` و`ruby -e` و`perl -e` و`php -r` و`lua -e` و`osascript -e` موافقة صريحة دائما. ما يزال بإمكان `allow-always` حفظ استدعاءات المفسّر/السكربت الحميدة، لكن صيغ التقييم المضمنة تظل تطلب الموافقة في كل مرة.
- `tools.exec.pathPrepend`: قائمة أدلة لإضافتها في بداية `PATH` لتشغيلات exec (Gateway + الصندوق الرملي فقط).
- `tools.exec.safeBins`: ثنائيات آمنة عبر stdin فقط يمكن تشغيلها دون إدخالات صريحة في قائمة السماح. لتفاصيل السلوك، راجع [الثنائيات الآمنة](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: أدلة صريحة إضافية موثوقة لفحوص مسار `safeBins`. لا تُوثق إدخالات `PATH` تلقائيا أبدا. الإعدادات الافتراضية المضمنة هي `/bin` و`/usr/bin`.
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

- `host=gateway`: يدمج `PATH` الخاص بصدفة تسجيل الدخول في بيئة التنفيذ. يتم رفض تجاوزات `env.PATH`
  عند التنفيذ على المضيف. يظل البرنامج الخفي نفسه يعمل باستخدام `PATH` حد أدنى:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: يشغّل `sh -lc` (صدفة تسجيل دخول) داخل الحاوية، لذلك قد يعيد `/etc/profile` ضبط `PATH`.
  يضيف OpenClaw قيمة `env.PATH` في البداية بعد تحميل الملف الشخصي عبر متغير بيئة داخلي (بلا استيفاء من الصدفة)؛
  وينطبق `tools.exec.pathPrepend` هنا أيضًا.
- `host=node`: لا تُرسل إلى العقدة إلا تجاوزات البيئة غير المحظورة التي تمرّرها. يتم رفض تجاوزات `env.PATH`
  عند التنفيذ على المضيف وتتجاهلها مضيفات العقد. إذا كنت تحتاج إلى إدخالات PATH إضافية على عقدة،
  فاضبط بيئة خدمة مضيف العقدة (systemd/launchd) أو ثبّت الأدوات في المواقع القياسية.

ربط عقدة لكل وكيل (استخدم فهرس قائمة الوكلاء في الإعداد):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

واجهة التحكم: تتضمن علامة تبويب العقد لوحة صغيرة باسم "ربط عقدة التنفيذ" للإعدادات نفسها.

## تجاوزات الجلسة (`/exec`)

استخدم `/exec` لتعيين القيم الافتراضية **لكل جلسة** لـ `host` و`security` و`ask` و`node`.
أرسل `/exec` بلا وسيطات لعرض القيم الحالية.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## نموذج التفويض

لا يُنفّذ `/exec` إلا لـ **المرسلين المصرّح لهم** (قوائم السماح/الإقران في القناة بالإضافة إلى `commands.useAccessGroups`).
يحدّث **حالة الجلسة فقط** ولا يكتب الإعداد. لتعطيل exec بشكل صارم، امنعه عبر سياسة الأدوات
(`tools.deny: ["exec"]` أو لكل وكيل). تظل موافقات المضيف سارية ما لم تضبط صراحةً
`security=full` و`ask=off`.

## موافقات exec (التطبيق المرافق / مضيف العقدة)

يمكن للوكلاء المعزولين طلب موافقة لكل طلب قبل تشغيل `exec` على Gateway أو مضيف العقدة.
راجع [موافقات exec](/ar/tools/exec-approvals) للاطلاع على السياسة وقائمة السماح وتدفق واجهة المستخدم.

عندما تكون الموافقات مطلوبة، تُرجع أداة exec فورًا
`status: "approval-pending"` ومعرّف موافقة. بعد الموافقة (أو الرفض / انتهاء المهلة)،
يبث Gateway أحداث نظام (`Exec finished` / `Exec denied`). إذا كان الأمر لا يزال
قيد التشغيل بعد `tools.exec.approvalRunningNoticeMs`، يتم بث إشعار واحد `Exec running`.
في القنوات التي تتضمن بطاقات/أزرار موافقة أصلية، ينبغي أن يعتمد الوكيل على
واجهة المستخدم الأصلية أولًا، وأن يضمّن أمر `/approve` يدويًا فقط عندما تفيد نتيجة
الأداة صراحةً بأن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار
الوحيد.

## قائمة السماح + الثنائيات الآمنة

يطابق فرض قائمة السماح اليدوية أنماط مسارات الملفات الثنائية المحلولة وأسماء
الأوامر المجردة. لا تطابق الأسماء المجردة إلا الأوامر المستدعاة عبر PATH، لذلك يمكن أن يطابق `rg`
المسار `/opt/homebrew/bin/rg` عندما يكون الأمر `rg`، لكن لا يطابق `./rg` أو `/tmp/rg`.
عندما يكون `security=allowlist`، لا يُسمح بأوامر الصدفة تلقائيًا إلا إذا كان كل مقطع في خط الأنابيب
مدرجًا في قائمة السماح أو ثنائيًا آمنًا. يتم رفض التسلسل (`;` و`&&` و`||`) وعمليات إعادة التوجيه
في وضع قائمة السماح ما لم يستوفِ كل مقطع على المستوى الأعلى
قائمة السماح (بما في ذلك الثنائيات الآمنة). تظل عمليات إعادة التوجيه غير مدعومة.
لا تتجاوز ثقة `allow-always` الدائمة تلك القاعدة: لا يزال الأمر المتسلسل يتطلب مطابقة كل
مقطع على المستوى الأعلى.

`autoAllowSkills` مسار تسهيل منفصل في موافقات exec. وهو ليس مثل
إدخالات قائمة السماح اليدوية للمسارات. للثقة الصريحة الصارمة، أبقِ `autoAllowSkills` معطّلًا.

استخدم عنصري التحكم للمهام المختلفة:

- `tools.exec.safeBins`: مرشحات تدفق صغيرة تعمل على stdin فقط.
- `tools.exec.safeBinTrustedDirs`: أدلة إضافية موثوقة صريحة لمسارات ملفات الثنائيات الآمنة القابلة للتنفيذ.
- `tools.exec.safeBinProfiles`: سياسة argv صريحة للثنائيات الآمنة المخصصة.
- قائمة السماح: ثقة صريحة لمسارات الملفات القابلة للتنفيذ.

لا تتعامل مع `safeBins` كقائمة سماح عامة، ولا تضف ثنائيات المفسرات/بيئات التشغيل (مثل `python3` و`node` و`ruby` و`bash`). إذا كنت تحتاج إليها، فاستخدم إدخالات قائمة سماح صريحة وأبقِ مطالبات الموافقة مفعّلة.
يحذّر `openclaw security audit` عندما تكون إدخالات `safeBins` الخاصة بالمفسرات/بيئات التشغيل بلا ملفات تعريف صريحة، ويمكن لـ `openclaw doctor --fix` إنشاء إدخالات `safeBinProfiles` مخصصة مفقودة.
يحذّر `openclaw security audit` و`openclaw doctor` أيضًا عندما تضيف صراحة ثنائيات واسعة السلوك مثل `jq` مرة أخرى إلى `safeBins`.
إذا سمحت صراحة بالمفسرات في قائمة السماح، ففعّل `tools.exec.strictInlineEval` حتى تظل أشكال تقييم الشيفرة المضمّنة تتطلب موافقة جديدة.

للحصول على تفاصيل السياسة الكاملة والأمثلة، راجع [موافقات Exec](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only) و[الثنائيات الآمنة مقابل قائمة السماح](/ar/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## أمثلة

في الواجهة:

```json
{ "tool": "exec", "command": "ls -la" }
```

في الخلفية + استعلام الحالة:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

استعلام الحالة مخصص للحالة عند الطلب، وليس لحلقات الانتظار. إذا كان تنبيه الاكتمال التلقائي
مفعّلًا، يمكن للأمر إيقاظ الجلسة عندما يصدر مخرجات أو يفشل.

إرسال مفاتيح (بنمط tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

إرسال (يرسل CR فقط):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

لصق (بين أقواس افتراضيًا):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` أداة فرعية من `exec` للتحريرات المنظمة متعددة الملفات.
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
- تظل سياسة الأداة سارية؛ `allow: ["write"]` يسمح ضمنيًا بـ `apply_patch`.
- توجد الإعدادات ضمن `tools.exec.applyPatch`.
- القيمة الافتراضية لـ `tools.exec.applyPatch.enabled` هي `true`؛ اضبطها على `false` لتعطيل الأداة لنماذج OpenAI.
- القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (محصورة داخل مساحة العمل). اضبطها على `false` فقط إذا كنت تقصد أن يكتب/يحذف `apply_patch` خارج دليل مساحة العمل.

## ذو صلة

- [موافقات Exec](/ar/tools/exec-approvals) — بوابات الموافقة لأوامر الصدفة
- [العزل](/ar/gateway/sandboxing) — تشغيل الأوامر في بيئات معزولة
- [عملية الخلفية](/ar/gateway/background-process) — أداة exec وprocess طويلة التشغيل
- [الأمان](/ar/gateway/security) — سياسة الأدوات والوصول المرتفع
