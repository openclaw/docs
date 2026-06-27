---
read_when:
    - استخدام أداة exec أو تعديلها
    - تصحيح أخطاء سلوك stdin أو TTY
summary: استخدام أداة التنفيذ، وأوضاع stdin، ودعم TTY
title: أداة التنفيذ
x-i18n:
    generated_at: "2026-06-27T18:41:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

شغّل أوامر shell في مساحة العمل. `exec` هو سطح shell قابل للتغيير: يمكن للأوامر إنشاء ملفات أو تعديلها أو حذفها في أي مكان يسمح به المضيف المحدد أو نظام ملفات sandbox. لا يجعل تعطيل أدوات نظام ملفات OpenClaw مثل `write` أو `edit` أو `apply_patch` الأداة `exec` للقراءة فقط.

يدعم التنفيذ في المقدمة + الخلفية عبر `process`. إذا كان `process` غير مسموح، فسيعمل `exec` بشكل متزامن ويتجاهل `yieldMs`/`background`.
تكون جلسات الخلفية محددة النطاق لكل وكيل؛ يرى `process` الجلسات من الوكيل نفسه فقط.

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
انقل الأمر تلقائيًا إلى الخلفية بعد هذا التأخير (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
انقل الأمر إلى الخلفية فورًا بدلًا من انتظار `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
تجاوز مهلة exec المكوّنة لهذا الاستدعاء. اضبط `timeout: 0` فقط عندما ينبغي تشغيل الأمر دون مهلة عملية exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
شغّل داخل طرفية وهمية عند توفرها. استخدمه لأدوات CLI التي تتطلب TTY فقط، ووكلاء البرمجة، وواجهات الطرفية.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
مكان التنفيذ. يتحول `auto` إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطًا، وإلى `gateway` بخلاف ذلك.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
يُتجاهل في استدعاءات الأدوات العادية. يتحكم
`tools.exec.security` وملف موافقات المضيف في أمان `gateway` / `node`؛ ويمكن للوضع المرفوع
فرض `security=full` فقط عندما يمنح المشغّل وصولًا مرفوعًا صراحةً.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
يأتي وضع السؤال الأساسي من `tools.exec.ask` وموافقات المضيف.
بالنسبة إلى استدعاءات النموذج الصادرة من قناة، يُتجاهل `ask` على مستوى الاستدعاء عندما يكون
وضع السؤال الفعال للمضيف هو `off`؛ وإلا فلا يمكنه إلا التشديد إلى وضع أكثر صرامة.
لا يتغير المتصلون الداخليون/API الموثوقون الذين ينشئون أدوات exec بقيمة
`ask` صريحة.
</ParamField>

<ParamField path="node" type="string">
معرّف/اسم Node عندما يكون `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
اطلب الوضع المرفوع — الخروج من sandbox إلى مسار المضيف المكوّن. يُفرض `security=full` فقط عندما يتحول الوضع المرفوع إلى `full`.
</ParamField>

ملاحظات:

- القيمة الافتراضية لـ `host` هي `auto`: sandbox عندما يكون وقت تشغيل sandbox نشطًا للجلسة، وإلا Gateway.
- يقبل `host` فقط `auto` أو `sandbox` أو `gateway` أو `node`. إنه ليس محددًا لاسم مضيف؛ تُرفض القيم الشبيهة بأسماء المضيف قبل تشغيل الأمر.
- `auto` هي استراتيجية التوجيه الافتراضية، وليست حرفًا بديلًا. يُسمح بـ `host=node` على مستوى الاستدعاء من `auto`؛ ولا يُسمح بـ `host=gateway` على مستوى الاستدعاء إلا عندما لا يكون وقت تشغيل sandbox نشطًا.
- `tools.exec.mode` هو مقبض السياسة المعياري. القيم هي `deny` و`allowlist` و`ask` و`auto` و`full`. يشغّل `auto` مطابقات القائمة المسموح بها/الثنائيات الآمنة الحتمية مباشرةً، ويوجه كل حالة موافقة exec متبقية عبر المراجع التلقائي الأصلي في OpenClaw قبل سؤال إنسان. لا يزال `ask` / `ask=always` يسأل إنسانًا في كل مرة.
- بدون إعدادات إضافية، يظل `host=auto` "يعمل مباشرة": عدم وجود sandbox يعني أنه يتحول إلى `gateway`؛ ووجود sandbox حي يعني أنه يبقى في sandbox.
- يخرج `elevated` من sandbox إلى مسار المضيف المكوّن: `gateway` افتراضيًا، أو `node` عندما يكون `tools.exec.host=node` (أو عندما تكون القيمة الافتراضية للجلسة هي `host=node`). لا يتوفر إلا عندما يكون الوصول المرفوع مفعّلًا للجلسة/الموفر الحالي.
- تتحكم ملفات موافقات المضيف في موافقات `gateway`/`node`.
- يتطلب `node` عقدة مقترنة (تطبيق مرافق أو مضيف Node بلا واجهة).
- إذا كانت عدة عقد متاحة، فاضبط `exec.node` أو `tools.exec.node` لاختيار واحدة.
- `exec host=node` هو مسار تنفيذ shell الوحيد للعقد؛ أُزيل الغلاف القديم `nodes.run`.
- تنطبق `timeout` على التنفيذ في المقدمة، والخلفية، و`yieldMs`، وGateway، وsandbox، وتنفيذ `system.run` في Node. إذا حُذفت، يستخدم OpenClaw `tools.exec.timeoutSec`؛ وتؤدي `timeout: 0` الصريحة إلى تعطيل مهلة عملية exec لذلك الاستدعاء.
- على مضيفي غير Windows، يستخدم exec المتغير `SHELL` عند تعيينه؛ إذا كان `SHELL` هو `fish`، فإنه يفضّل `bash` (أو `sh`)
  من `PATH` لتجنب النصوص غير المتوافقة مع fish، ثم يعود إلى `SHELL` إذا لم يوجد أي منهما.
- على مضيفي Windows، يفضّل exec اكتشاف PowerShell 7 (`pwsh`) (Program Files، ثم ProgramW6432، ثم PATH)،
  ثم يعود إلى Windows PowerShell 5.1.
- على مضيفي Gateway غير Windows، تستخدم أوامر exec الخاصة بـ bash وzsh لقطة بدء. يلتقط OpenClaw
  الأسماء المستعارة/الدوال القابلة للإدراج ومجموعة بيئة آمنة صغيرة من ملفات بدء shell داخل
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`، ثم يدرج تلك اللقطة قبل كل أمر exec.
  تُستثنى المتغيرات التي تبدو كأسرار؛ ولا يستخدم exec في sandbox وNode هذه اللقطة. اضبط
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` في بيئة عملية Gateway لتعطيل مسار اللقطة هذا.
- يرفض تنفيذ المضيف (`gateway`/`node`) تجاوزات `env.PATH` وتجاوزات المحمّل (`LD_*`/`DYLD_*`) من أجل
  منع اختطاف الثنائيات أو حقن الشفرة.
- يعيّن OpenClaw `OPENCLAW_SHELL=exec` في بيئة الأمر المُنشأ (بما في ذلك تنفيذ PTY وsandbox) حتى تتمكن قواعد shell/الملف الشخصي من اكتشاف سياق أداة exec.
- بالنسبة إلى التشغيلات الصادرة من قناة، يعرّض OpenClaw أيضًا حمولة JSON ضيقة لهوية المرسل/الدردشة في
  `OPENCLAW_CHANNEL_CONTEXT` عندما تقدم القناة تلك المعرّفات.
- يُحظر `openclaw channels login` من `exec` لأنه تدفق مصادقة قناة تفاعلي؛ شغّله في طرفية على مضيف Gateway، أو استخدم أداة تسجيل الدخول الأصلية للقناة من الدردشة عند وجودها.
- مهم: يكون sandboxing **معطلًا افتراضيًا**. إذا كان sandboxing معطلًا، فإن `host=auto` الضمني
  يتحول إلى `gateway`. لا يزال `host=sandbox` الصريح يفشل مغلقًا بدلًا من التشغيل بصمت
  على مضيف Gateway. فعّل sandboxing أو استخدم `host=gateway` مع الموافقات.
- لا تفحص تحققات ما قبل تشغيل النصوص (لأخطاء صياغة shell الشائعة في Python/Node) إلا الملفات داخل
  حد `workdir` الفعال. إذا تحول مسار نص إلى خارج `workdir`، يتم تخطي الفحص المسبق لذلك
  الملف.
- بالنسبة إلى العمل طويل الأمد الذي يبدأ الآن، ابدأه مرة واحدة واعتمد على
  إيقاظ الاكتمال التلقائي عندما يكون مفعّلًا ويصدر الأمر مخرجات أو يفشل.
  استخدم `process` للسجلات أو الحالة أو الإدخال أو التدخل؛ لا تحاكِ
  الجدولة بحلقات sleep أو حلقات timeout أو الاستطلاع المتكرر.
- بالنسبة إلى العمل الذي ينبغي أن يحدث لاحقًا أو وفق جدول، استخدم Cron بدلًا من
  أنماط sleep/delay في `exec`.

## الإعدادات

- `tools.exec.notifyOnExit` (الافتراضي: true): عندما تكون true، تضيف جلسات exec المنقولة إلى الخلفية حدث نظام إلى الطابور وتطلب Heartbeat عند الخروج.
- `tools.exec.approvalRunningNoticeMs` (الافتراضي: 10000): أصدِر إشعار "running" واحدًا عندما يعمل exec المحكوم بالموافقة مدة أطول من ذلك (0 يعطّل).
- `tools.exec.timeoutSec` (الافتراضي: 1800): مهلة exec الافتراضية لكل أمر بالثواني. تتجاوزها `timeout` على مستوى الاستدعاء؛ وتعطّل `timeout: 0` على مستوى الاستدعاء مهلة عملية exec.
- `tools.exec.host` (الافتراضي: `auto`؛ يتحول إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطًا، وإلى `gateway` بخلاف ذلك)
- `tools.exec.security` (الافتراضي: `deny` لـ sandbox، و`full` لـ Gateway + Node عندما لا يكون مضبوطًا)
- `tools.exec.ask` (الافتراضي: `off`)
- تنفيذ exec على المضيف بدون موافقة هو الافتراضي لـ Gateway + Node. إذا أردت سلوك الموافقات/القائمة المسموح بها، فشدّد كلًا من `tools.exec.*` وملف موافقات المضيف؛ راجع [موافقات Exec](/ar/tools/exec-approvals#yolo-mode-no-approval).
- يأتي YOLO من افتراضيات سياسة المضيف (`security=full` و`ask=off`)، وليس من `host=auto`. إذا أردت فرض توجيه Gateway أو Node، فاضبط `tools.exec.host` أو استخدم `/exec host=...`.
- في وضع `security=full` مع `ask=off`، يتبع exec على المضيف السياسة المكوّنة مباشرةً؛ ولا توجد طبقة إضافية لمرشح إخفاء أوامر استدلالي أو رفض فحص مسبق للنصوص.
- `tools.exec.node` (الافتراضي: غير مضبوط)
- `tools.exec.strictInlineEval` (الافتراضي: false): عندما تكون true، تتطلب صيغ تقييم المفسر المضمنة مثل `python -c` و`node -e` و`ruby -e` و`perl -e` و`php -r` و`lua -e` و`osascript -e` مراجعًا أو موافقة صريحة. في `mode=auto`، قد يسمح مسار موافقة exec العادي للمراجع التلقائي الأصلي بأمر مؤقت منخفض المخاطر بوضوح؛ ولا تزال استدعاءات `system.run` المباشرة على مضيف Node تتطلب موافقة صريحة لأنها لا تستطيع تسليم الأمر إلى مسار موافقة بشري. إذا طلب المراجع، ينتقل الطلب إلى إنسان. لا يزال بإمكان `allow-always` حفظ استدعاءات مفسر/نصوص حميدة، لكن صيغ التقييم المضمن لا تصبح قواعد سماح دائمة.
- `tools.exec.commandHighlighting` (الافتراضي: false): عندما تكون true، يمكن لمطالبات الموافقة إبراز مقاطع الأمر المستخرجة من المحلل في نص الأمر. اضبطها على `true` عالميًا أو لكل وكيل لتمكين إبراز نص الأمر دون تغيير سياسة موافقة exec.
- `tools.exec.pathPrepend`: قائمة أدلة تُضاف إلى بداية `PATH` لتشغيلات exec (Gateway + sandbox فقط).
- `tools.exec.safeBins`: ثنائيات آمنة تعمل من stdin فقط ويمكن تشغيلها دون إدخالات صريحة في القائمة المسموح بها. لتفاصيل السلوك، راجع [الثنائيات الآمنة](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: أدلة صريحة إضافية موثوقة لفحوصات مسار `safeBins`. لا تُوثق إدخالات `PATH` تلقائيًا أبدًا. الافتراضيات المدمجة هي `/bin` و`/usr/bin`.
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

- `host=gateway`: يدمج `PATH` الخاص بـ login-shell في بيئة exec. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف. لا يزال daemon نفسه يعمل بـ `PATH` أدنى:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - لمنع إعدادات shell الخاصة بالمستخدم (مثل `~/.zshenv` أو `/etc/zshenv`) من تجاوز مسارات الأولوية أثناء بدء التشغيل، تُضاف إدخالات `tools.exec.pathPrepend` بأمان إلى بداية `PATH` النهائي داخل أمر shell قبل التنفيذ مباشرةً.
- `host=sandbox`: يشغّل `sh -lc` (login shell) داخل الحاوية، لذلك قد يعيد `/etc/profile` ضبط `PATH`.
  يضيف OpenClaw `env.PATH` بعد إدراج الملف الشخصي عبر متغير بيئة داخلي (بدون استيفاء shell)؛
  وينطبق `tools.exec.pathPrepend` هنا أيضًا.
- `host=node`: لا تُرسل إلى Node إلا تجاوزات البيئة غير المحظورة التي تمررها. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف ويتجاهلها مضيفو Node. إذا كنت تحتاج إلى إدخالات PATH إضافية على Node،
  فكوّن بيئة خدمة مضيف Node (systemd/launchd) أو ثبّت الأدوات في مواقع قياسية.

ربط Node لكل وكيل (استخدم فهرس قائمة الوكلاء في الإعدادات):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

واجهة التحكم: تتضمن علامة تبويب Nodes لوحة صغيرة بعنوان "ربط Node لـ Exec" للإعدادات نفسها.

## تجاوزات الجلسة (`/exec`)

استخدم `/exec` لتعيين القيم الافتراضية **لكل جلسة** لكل من `host` و`security` و`ask` و`node`.
أرسل `/exec` دون وسائط لعرض القيم الحالية.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## نموذج التفويض

لا يُعتدّ بـ `/exec` إلا من **المرسلين المصرّح لهم** (قوائم سماح القنوات/الاقتران بالإضافة إلى `commands.useAccessGroups`).
إنه يحدّث **حالة الجلسة فقط** ولا يكتب الإعدادات. يمكن لمرسلي القنوات الخارجية المصرّح لهم
تعيين افتراضيات الجلسة هذه. يحتاج عملاء Gateway/webchat الداخليون إلى `operator.admin` لحفظها.
لتعطيل exec بالكامل، امنعه عبر سياسة الأدوات (`tools.deny: ["exec"]` أو لكل وكيل). تبقى موافقات المضيف
سارية ما لم تضبط صراحةً `security=full` و `ask=off`.

## موافقات exec (التطبيق المرافق / مضيف Node)

قد تتطلب الوكلاء المعزولون موافقة لكل طلب قبل تشغيل `exec` على Gateway أو مضيف Node.
راجع [موافقات exec](/ar/tools/exec-approvals) لمعرفة السياسة وقائمة السماح وتدفق واجهة المستخدم.

عند طلب الموافقات، تُرجع أداة exec فوراً
`status: "approval-pending"` ومعرّف موافقة. بعد الموافقة (أو الرفض / انتهاء المهلة)،
يبث Gateway أحداث نظام لتقدم الأمر واكتماله فقط للتشغيلات الموافق عليها
(`Exec running` / `Exec finished`). تكون الموافقات المرفوضة أو المنتهية مهلتها نهائية ولا
توقظ جلسة الوكيل بحدث نظام للرفض.
في القنوات التي تحتوي على بطاقات/أزرار موافقة أصلية، يجب أن يعتمد الوكيل على
واجهة المستخدم الأصلية أولاً، وألا يضمّن أمر `/approve` يدوياً إلا عندما
تقول نتيجة الأداة صراحةً إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي
المسار الوحيد.

## قائمة السماح + الثنائيات الآمنة

يطابق فرض قائمة السماح اليدوي مسارات الثنائيات المحلولة بنمط globs وأسماء الأوامر المجردة
بنمط globs. تطابق الأسماء المجردة فقط الأوامر المستدعاة عبر PATH، لذلك يمكن أن يطابق `rg`
المسار `/opt/homebrew/bin/rg` عندما يكون الأمر `rg`، لكن لا يطابق `./rg` أو `/tmp/rg`.
عندما تكون `security=allowlist`، لا يُسمح بأوامر الصدفة تلقائياً إلا إذا كان كل مقطع في خط الأنابيب
ضمن قائمة السماح أو ثنائياً آمناً. تُرفض السلاسل (`;` و `&&` و `||`) وإعادة التوجيه
في وضع قائمة السماح ما لم يستوفِ كل مقطع من المستوى الأعلى
قائمة السماح (بما في ذلك الثنائيات الآمنة). تظل إعادة التوجيه غير مدعومة.
ثقة `allow-always` الدائمة لا تتجاوز هذه القاعدة: لا يزال الأمر المتسلسل يتطلب مطابقة كل
مقطع من المستوى الأعلى.

`autoAllowSkills` مسار تسهيل منفصل في موافقات exec. وهو ليس مثل
إدخالات قائمة سماح المسارات اليدوية. للثقة الصريحة الصارمة، أبقِ `autoAllowSkills` معطلاً.

استخدم عنصري التحكم للمهام المختلفة:

- `tools.exec.safeBins`: مرشحات تدفق صغيرة تستقبل stdin فقط.
- `tools.exec.safeBinTrustedDirs`: أدلة إضافية موثوقة صراحةً لمسارات الثنائيات الآمنة القابلة للتنفيذ.
- `tools.exec.safeBinProfiles`: سياسة argv صريحة للثنائيات الآمنة المخصصة.
- قائمة السماح: ثقة صريحة لمسارات الملفات القابلة للتنفيذ.

لا تتعامل مع `safeBins` كقائمة سماح عامة، ولا تضف ثنائيات المفسرات/بيئات التشغيل (مثل `python3` و `node` و `ruby` و `bash`). إذا احتجت إليها، فاستخدم إدخالات قائمة سماح صريحة وأبقِ مطالبات الموافقة مفعلة.
يحذر `openclaw security audit` عندما تفتقد إدخالات `safeBins` للمفسرات/بيئات التشغيل إلى ملفات تعريف صريحة، ويمكن لـ `openclaw doctor --fix` إنشاء إدخالات `safeBinProfiles` مخصصة مفقودة.
يحذر `openclaw security audit` و `openclaw doctor` أيضاً عندما تضيف صراحةً ثنائيات واسعة السلوك مثل `jq` مرة أخرى إلى `safeBins`.
إذا أدرجت المفسرات صراحةً في قائمة السماح، ففعّل `tools.exec.strictInlineEval` حتى تظل صيغ تقييم الشيفرة المضمنة تتطلب مراجعاً أو موافقة صريحة.

للحصول على تفاصيل السياسة الكاملة والأمثلة، راجع [موافقات exec](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only) و[الثنائيات الآمنة مقابل قائمة السماح](/ar/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

الاستطلاع مخصص للحالة عند الطلب، وليس لحلقات الانتظار. إذا كان إيقاظ الإكمال التلقائي
مفعلاً، يمكن للأمر إيقاظ الجلسة عندما يصدر مخرجات أو يفشل.

إرسال مفاتيح (بنمط tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

إرسال (إرسال CR فقط):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

لصق (محاط بأقواس افتراضياً):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` أداة فرعية من `exec` للتحريرات المنظمة متعددة الملفات.
وهي مفعلة افتراضياً لنماذج OpenAI و OpenAI Codex. استخدم الإعدادات فقط
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
- لا تزال سياسة الأدوات سارية؛ `allow: ["write"]` يسمح ضمنياً بـ `apply_patch`.
- لا يمنع `deny: ["write"]` استخدام `apply_patch`؛ امنع `apply_patch` صراحةً أو استخدم `deny: ["group:fs"]` عندما يجب حظر كتابات التصحيح أيضاً.
- توجد الإعدادات ضمن `tools.exec.applyPatch`.
- القيمة الافتراضية لـ `tools.exec.applyPatch.enabled` هي `true`؛ اضبطها على `false` لتعطيل الأداة لنماذج OpenAI.
- القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (محصورة داخل مساحة العمل). اضبطها على `false` فقط إذا كنت تريد عمداً أن يكتب/يحذف `apply_patch` خارج دليل مساحة العمل.

## ذات صلة

- [موافقات exec](/ar/tools/exec-approvals) — بوابات الموافقة لأوامر الصدفة
- [العزل](/ar/gateway/sandboxing) — تشغيل الأوامر في بيئات معزولة
- [عملية الخلفية](/ar/gateway/background-process) — أداة exec والعملية طويلة التشغيل
- [الأمان](/ar/gateway/security) — سياسة الأدوات والوصول المرتفع
