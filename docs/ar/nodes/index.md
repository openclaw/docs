---
read_when:
    - إقران عُقد iOS/watchOS/Android بـ Gateway
    - استخدام لوحة Node/الكاميرا لسياق الوكيل
    - إضافة أوامر Node جديدة أو أدوات مساعدة لـ CLI
summary: 'العُقد: الاقتران والإمكانات والأذونات وأدوات CLI المساعدة للوحة الرسم/الكاميرا/الشاشة/الجهاز/الإشعارات/النظام'
title: العُقد
x-i18n:
    generated_at: "2026-07-16T14:16:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

**العقدة** هي جهاز مرافق (macOS/iOS/watchOS/Android/بلا واجهة رسومية) يتصل بـ Gateway باستخدام `role: "node"` ويوفّر سطح أوامر (مثل `canvas.*` و`camera.*` و`device.*` و`notifications.*` و`system.*`) عبر `node.invoke`. تستخدم معظم العقد WebSocket الخاص بـ Gateway على منفذ المشغّل. تستخدم عقدة Apple Watch المباشرة الاختيارية استقصاء HTTPS موقّعًا على المنفذ نفسه لأن watchOS يحظر الشبكات العامة منخفضة المستوى للتطبيقات العادية. تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

النقل القديم: [بروتوكول الجسر](/ar/gateway/bridge-protocol) (TCP JSONL؛ للاستخدام التاريخي فقط مع العقد الحالية).

يمكن أيضًا تشغيل macOS في **وضع العقدة**: يتصل تطبيق شريط القوائم بخادم
WS الخاص بـ Gateway بوصفه عقدة واحدة (وبذلك يعمل `openclaw nodes …` على جهاز Mac هذا). يضيف التطبيق
أوامر Canvas والكاميرا والشاشة والإشعارات والتحكم في الحاسوب الأصلية
إلى سطح أوامر مضيف العقدة نفسه الذي يستخدمه `openclaw node run`. لا تشغّل
عقدة CLI ثانية على جهاز Mac ذاك؛ إذ يشغّل التطبيق بيئة تشغيل مضيف عقدة CLI المطابقة
كعامل داخلي، ويظل اتصال Gateway الوحيد وهوية العقدة الوحيدة.

العقد **أجهزة طرفية** وليست بوابات: فهي لا تشغّل خدمة Gateway، وتصل رسائل القنوات (Telegram وWhatsApp وما إلى ذلك) إلى Gateway، لا إلى العقد.

دليل استكشاف الأخطاء وإصلاحها: [/nodes/troubleshooting](/ar/nodes/troubleshooting)

## الاقتران + الحالة

تستخدم العقد **اقتران الأجهزة**. تعرض العقدة هوية جهاز موقّعة أثناء الاتصال؛ وينشئ Gateway طلب اقتران جهاز لـ `role: node`. وافق عليه عبر CLI الخاص بالأجهزة (أو واجهة المستخدم). يستخدم إعداد Apple Watch المباشر رمز إعداد قصير العمر ومخصصًا للعقد فقط، يصدره مسؤول، للموافقة على سطح أوامره الثابت منخفض المخاطر؛ ويظل توسيع القدرات لاحقًا متطلبًا للموافقة العادية.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

تنتهي صلاحية طلبات الاقتران المعلّقة بعد 5 دقائق من آخر إعادة محاولة للجهاز — ويحافظ الجهاز الذي يستمر في إعادة الاتصال على طلبه المعلّق الوحيد (وعلى `requestId`) نشطًا بدلًا من إصدار مطالبة جديدة كل بضع دقائق؛ راجع [اقتران العقد](/ar/gateway/pairing) للاطلاع على دورة الطلب/الموافقة الكاملة. إذا أعادت عقدة المحاولة بتفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلّق السابق ويُنشأ `requestId` جديد — وتتلقى البرامج العميلة حدث `device.pair.resolved` للطلب المستبدل، وينبغي إعادة تشغيل `openclaw devices list` قبل الموافقة.

- `nodes status` يضع علامة على العقدة بأنها **مقترنة** عندما يتضمن دور اقتران جهازها `node`.
- يمكن لجهاز Mac أصلي متصل ولديه إذن إمكانية الوصول الإبلاغ عن نشاط
  الإدخال المادي المجمّع. يضع Gateway علامة على أحدث جهاز Mac مؤهل بأنه
  `active`، ويزوّد الوكيل بتلميح ثابت لمعرّف العقدة، ويوجّه تنبيهات اتصال العقدة
  إليه قبل الرجوع الاحتياطي المتأخر. راجع
  [وجود الحاسوب النشط](/nodes/presence) لمعرفة الإعداد والخصوصية والتوقيت
  واستكشاف الأخطاء وإصلاحها.
- سجل اقتران الجهاز هو عقد الأدوار المعتمدة الدائم. يظل تدوير الرمز المميز ضمن ذلك العقد؛ ولا يمكنه ترقية عقدة مقترنة إلى دور لم تمنحه موافقة الاقتران أصلًا.
- `node.pair.*` (CLI: ‏`openclaw nodes pending/approve/reject/remove/rename`) هو مخزن منفصل لاقتران العقد، مملوك لـ Gateway، ويتتبع سطح الأوامر/القدرات المعتمد للعقدة عبر عمليات إعادة الاتصال. وهو **لا** يتحكم في مصادقة النقل — فاقتران الجهاز هو الذي يفعل ذلك.
- `openclaw nodes remove --node <id|name|ip>` يزيل اقتران عقدة. وبالنسبة إلى عقدة مدعومة بجهاز، فإنه يلغي دور `node` للجهاز في مخزن الأجهزة المقترنة ويفصل جلسات دور العقدة لذلك الجهاز: يحتفظ الجهاز متعدد الأدوار بصفه ولا يفقد سوى دور `node`، بينما يُحذف صف الجهاز ذي دور العقدة فقط. كما يمحو أي إدخال مطابق من مخزن اقتران العقد المنفصل. قد يزيل `operator.pairing` صفوف العقد غير التابعة للمشغّل على أجهزة أخرى؛ ويحتاج مستدعٍ يستخدم رمز جهاز ويلغي دور عقدته بنفسه على جهاز متعدد الأدوار أيضًا إلى `operator.admin`.
- يتبع نطاق الموافقة الأوامر المعلنة في الطلب المعلّق:
  - طلب بلا أوامر: `operator.pairing`
  - أوامر العقد غير التنفيذية: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## تفاوت الإصدارات وترتيب الترقية

يقبل WebSocket الخاص بـ Gateway برامج عملاء العقد المصادق عليها ضمن نافذة بروتوكول N-1.
لذلك يقبل Gateway الحالي بالإصدار v4 عقد الإصدار v3 عندما يعلن الاتصال
كلا `role: "node"` و`client.mode: "node"`. يجب أن تستمر جلسات المشغّل وواجهة المستخدم
في استخدام البروتوكول الحالي.

لترقيات الأسطول المرحلية، رقِّ Gateway أولًا، ثم رقِّ كل عقدة.
تظل عقدة N-1 ظاهرة وقابلة للإدارة أثناء ترقيتها؛ ويسجل Gateway
‏`legacy node protocol accepted` مع توصية بالترقية. يظل الاقتران
ومصادقة الجهاز وقوائم الأوامر المسموح بها وموافقات التنفيذ مطبّقة.
تظل القدرات والأوامر المملوكة لـ Plugin مخفية حتى تُرقّى العقدة إلى
البروتوكول الحالي. تتطلب العقد الأقدم من N-1 ترقية خارج النطاق قبل
إعادة الاتصال.

يتطلب نقل HTTPS المباشر في watchOS إصدار البروتوكول الحالي؛ حدّث
تطبيق الساعة مع Gateway قبل تمكين الوضع المباشر.

## مضيف عقدة بعيد (system.run)

استخدم **مضيف عقدة** عندما يعمل Gateway على جهاز وتريد تنفيذ الأوامر على جهاز آخر. يظل النموذج يتواصل مع **Gateway**؛ ويمرر Gateway استدعاءات `exec` إلى **مضيف العقدة** عند تحديد `host=node`.

| الدور         | المسؤولية                                                   |
| ------------ | ---------------------------------------------------------------- |
| مضيف Gateway | يستقبل الرسائل ويشغّل النموذج ويوجّه استدعاءات الأدوات.            |
| مضيف العقدة    | ينفّذ `system.run`/`system.which` على جهاز العقدة.        |
| الموافقات    | تُفرض على مضيف العقدة عبر `~/.openclaw/exec-approvals.json`. |

ملاحظة بشأن الموافقة:

- ترتبط عمليات تشغيل العقد المدعومة بالموافقة بسياق الطلب الدقيق. يُعِد مسار التنفيذ `systemRunPlan` أساسيًا قبل الموافقة؛ وبعد منحها، يمرر Gateway تلك الخطة المخزنة، لا أي حقول للأمر/دليل العمل/الجلسة يعدّلها المستدعي لاحقًا، ويعيد التحقق من دليل العمل قبل التشغيل.
- بالنسبة إلى عمليات التنفيذ المباشر لملفات الصدفة/بيئة التشغيل، يربط OpenClaw أيضًا، بأفضل جهد ممكن، مُعامل ملف محلي واحدًا محددًا، ويرفض التشغيل إذا تغيّر ذلك الملف قبل التنفيذ.
- إذا تعذر على OpenClaw تحديد ملف محلي محدد واحد بالضبط لأمر مفسر/بيئة تشغيل، يُرفض التنفيذ المدعوم بالموافقة بدلًا من التظاهر بتوفير تغطية كاملة لبيئة التشغيل. استخدم العزل، أو مضيفين منفصلين، أو قائمة سماح موثوقة صريحة/سير عمل كامل لدلالات المفسر الأوسع.

### بدء مضيف عقدة (في الواجهة الأمامية)

على جهاز العقدة:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

يقبل `node run` أيضًا `--context-path` (مسار سياق WS الخاص بـ Gateway)، و`--tls`، و`--tls-fingerprint <sha256>`، و`--node-id` (يتجاوز معرّف نسخة البرنامج العميل القديم؛ ولا يعيد هذا ضبط الاقتران).

### Gateway بعيد عبر نفق SSH (ربط الاسترجاع)

إذا ارتبط Gateway بعنوان الاسترجاع (`gateway.bind=loopback`، وهو الافتراضي في الوضع المحلي)، فلا يمكن لمضيفي العقد البعيدة الاتصال مباشرة. أنشئ نفق SSH ووجّه مضيف العقدة إلى الطرف المحلي للنفق.

مثال (مضيف العقدة -> مضيف Gateway):

```bash
# الطرفية A (اتركها قيد التشغيل): تمرير المنفذ المحلي 18790 -> ‏Gateway على 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# الطرفية B: صدّر رمز Gateway المميز واتصل عبر النفق
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

ملاحظات:

- يدعم `openclaw node run` المصادقة بالرمز المميز أو كلمة المرور.
- تُفضّل متغيرات البيئة: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- الإعداد الاحتياطي هو `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، يتجاهل مضيف العقدة عمدًا `gateway.remote.token` / `gateway.remote.password`.
- في الوضع البعيد، يكون `gateway.remote.token` / `gateway.remote.password` مؤهلين وفق قواعد أسبقية الوضع البعيد.
- إذا كانت SecretRefs المحلية النشطة `gateway.auth.*` مضبوطة ولكنها غير محلولة، تفشل مصادقة مضيف العقدة بحالة مغلقة.
- لا يحترم حل مصادقة مضيف العقدة سوى متغيرات البيئة `OPENCLAW_GATEWAY_*`.

### بدء مضيف عقدة (كخدمة)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

يقبل `node install` أيضًا `--context-path`، و`--tls`، و`--tls-fingerprint`، و`--node-id` (معرّف نسخة البرنامج العميل القديم فقط)، و`--runtime <node>` (الافتراضي: node)، و`--force` لإعادة التثبيت. تتوفر أيضًا `node status` و`node stop` و`node uninstall`.

### الاقتران + التسمية

على مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

إذا أعادت العقدة المحاولة بتفاصيل مصادقة متغيرة، فأعد تشغيل `openclaw devices list` ووافق على `requestId` الحالي.

خيارات التسمية:

- `--display-name` في `openclaw node run` / `openclaw node install` (يستمر في صف SQLite المشترك `node_host_config` إلى جانب معرّف نسخة البرنامج العميل وبيانات تعريف اتصال Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (تجاوز Gateway).

### خوادم MCP المستضافة على العقدة

اضبط خوادم MCP في `openclaw.json` على جهاز العقدة، لا على
Gateway:

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

يبدأ مضيف العقدة بلا واجهة رسومية هذه الخوادم، ويسرد أدواتها، وينشر
الواصفات بعد الاتصال. تعود استدعاءات الأدوات إلى تلك العقدة عبر
`mcp.tools.call.v1`؛ ولا يحتاج Gateway إلى إعداد MCP مطابق أو
Plugin بلغة JS. لا يدعم مسار v1 المستضاف على العقدة خوادم MCP التي تستخدم OAuth.

تعلن مضيفات العقد الحالية عن عائلة الأوامر المضمنة `mcp.tools.call.v1` أثناء
اقترانها الأولي حتى عند عدم ضبط أي خادم MCP. قد تطلب عقدة مقترنة باستخدام
إصدار أقدم من OpenClaw ترقية لمرة واحدة لسطح الأوامر بعد
تحديث مضيف العقدة. لا تتطلب إضافة الخوادم أو إزالتها أو تصفيتها بعد ذلك
إعادة الاقتران لأن عائلة الأوامر المعتمدة لم تتغير. أعد تشغيل
`openclaw node run` أو `openclaw node restart` لتطبيق تغييرات إعداد MCP للعقدة؛
فمضيف العقدة لا يراقب هذا الإعداد.

يمكن لمشغّلي Gateway تجاهل جميع الأدوات الظاهرة للوكيل التي تنشرها العقد المقترنة،
بما فيها أدوات MCP المستضافة على العقدة، باستخدام
`gateway.nodes.pluginTools.enabled: false`. كما تمنع حالات الرفض الدقيقة للأوامر مثل
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` التنفيذ.

### Skills المستضافة على العقدة

ثبّت Skills ضمن دليل Skills النشط لـ OpenClaw على جهاز العقدة،
وهو `~/.openclaw/skills` افتراضيًا. تنقل `OPENCLAW_HOME` و`OPENCLAW_STATE_DIR` و
`OPENCLAW_CONFIG_PATH` ذلك الملف الشخصي النشط. تكون الأولوية لـ `OPENCLAW_STATE_DIR`
بالنسبة إلى Skills؛ وإلا فإن `skills/` يكون بجوار المسار الذي يطبعه
`openclaw config file`. ينشر مضيف العقدة بلا واجهة رسومية ملفات `SKILL.md` الصالحة
بعد اتصاله، ويضيفها Gateway إلى لقطات Skills الخاصة بالوكيل فقط ما دامت
تلك العقدة متصلة. يجب أن يطابق اسم كل دليل Skill حقل الواجهة الأمامية `name`
كي يربط محدد موقع العقدة المجرّد بإدخال واحد من دون إضافة
حقل بروتوكول آخر.

يوافق الاقتران الأولي لدور العقدة على نشر Skills. ولا تتطلب إضافة Skills أو إزالتها أو
تغييرها اقترانًا آخر أو تغييرًا في إعدادات Gateway.
أعِد تشغيل `openclaw node run` أو `openclaw node restart` بعد تغيير
ملفات Skills الخاصة بالعقدة؛ فمضيف العقدة لا يراقب دليل Skills.

تحدد إدخالات Skills المستضافة على العقدة عقدتها وتحمل موقع تنفيذها.
وتظل ملفات Skills والمسارات النسبية المشار إليها والملفات الثنائية على تلك
العقدة. يقرأ الوكيل موقع `node://.../SKILL.md` المُعلَن باستخدام
أداة `read` العادية. تقبل `file_fetch` مسارات عقدة مطلقة وافق عليها المشغّل،
وليس محددات مواقع Skills الخاصة بالعقدة؛ ويمكن لبيئات التشغيل التي لا تتوفر فيها أداة القراءة العادية تشغيل
`cat SKILL.md` بدلًا من ذلك عبر `exec host=node node=<node-id>` مع استخدام دليل
`node://.../skills/<name>` المُعلَن بوصفه `workdir`. تستخدم الملفات والملفات الثنائية المشار إليها
هدف التنفيذ ودليل العمل نفسيهما. يحل مضيف العقدة محدد الموقع هذا استنادًا إلى
دليل حالة OpenClaw النشط لديه، لذا تُحل المسارات النسبية على العقدة بدلًا
من جهاز Gateway. يجب أن تكون العقدة الناشرة قد وافقت على `system.run`،
كما يجب أن تسمح سياسة التنفيذ الخاصة بالوكيل بـ `host=node`؛ وإلا تظل Skill
خارج لقطة ذلك الوكيل.

عيّن `nodeHost.skills.enabled: false` على العقدة لإيقاف النشر. يمكن لمشغّلي Gateway
تجاهل Skills من كل عقدة مقترنة باستخدام
`gateway.nodes.skills.enabled: false`.

### حالة الهوية بلا واجهة رسومية

تحتفظ العقدة بلا واجهة رسومية بثلاثة سجلات حالة منفصلة:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): معرّف مثيل العميل، واسم العرض، وبيانات تعريف اتصال Gateway.
- `~/.openclaw/identity/device.json`: زوج مفاتيح الجهاز الموقّع ومعرّف الجهاز المشفّر المشتق.
- `~/.openclaw/identity/device-auth.json`: رموز مصادقة الأجهزة المقترنة، المفهرسة حسب معرّف الجهاز المشفّر والدور.

بالنسبة إلى عقدة موقّعة، يستخدم Gateway معرّف الجهاز المشفّر للاقتران
وتوجيه العقدة. أما معرّف مثيل العميل فهو مجرد بيانات تعريف للاتصال. لذلك لا تؤدي
تغييرات `--node-id` أو ترحيل `node.json` متقاعد إلى إعادة ضبط الاقتران. راجع
[حالة الهوية والاقتران](/ar/cli/node#identity-and-pairing-state) لمعرفة
مسار الإلغاء وإعادة الاقتران المدعوم وملاحظات الترقية.

### إضافة الأوامر إلى قائمة السماح

موافقات التنفيذ **خاصة بكل مضيف عقدة**. أضف إدخالات قائمة السماح من Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

توجد الموافقات على مضيف العقدة في `~/.openclaw/exec-approvals.json`.

### توجيه التنفيذ إلى العقدة

اضبط القيم الافتراضية (إعدادات Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

أو لكل جلسة:

```text
/exec host=node security=allowlist node=<id-or-name>
```

بعد الضبط، يُشغَّل أي استدعاء `exec` يتضمن `host=node` على مضيف العقدة (مع الخضوع لقائمة السماح/الموافقات الخاصة بالعقدة).

لن يختار `host=auto` العقدة ضمنيًا من تلقاء نفسه، ولكن يُسمح بطلب `host=node` صريح لكل استدعاء من `auto`. إذا أردت أن يكون التنفيذ على العقدة هو الإعداد الافتراضي للجلسة، فعيّن `tools.exec.host=node` أو `/exec host=node ...` صراحةً.

مواضيع ذات صلة:

- [CLI لمضيف العقدة](/ar/cli/node)
- [أداة التنفيذ](/ar/tools/exec)
- [موافقات التنفيذ](/ar/tools/exec-approvals)

### استدلال النموذج المحلي

يمكن لعقدة سطح مكتب أو خادم إتاحة نماذج قادرة على المحادثة من خادم Ollama يعمل على تلك العقدة. تستخدم الوكلاء أداة `node_inference` الخاصة بـ Plugin ‏Ollama لاكتشاف النماذج المثبتة وتشغيل مطالبة محدودة عن بُعد؛ ولا يحتاج Gateway إلى وصول مباشر عبر الشبكة إلى Ollama. راجع [الاستدلال المحلي على عقدة Ollama](/ar/providers/ollama#node-local-inference) لمعرفة الإعداد وتصفية النماذج وأوامر التحقق المباشر.

### جلسات Codex والنصوص المنسوخة

يمكن لـ Plugin الرسمي `codex` إتاحة جلسات Codex غير المؤرشفة على
مضيف عقدة بلا واجهة رسومية أو عقدة macOS أصلية. لم يعد تسجيل الفهرس يعتمد
على `supervision.enabled`؛ فهذا الخيار يتحكم في أدوات الإشراف الموجهة للوكيل.
عيّن `sessionCatalog.enabled: false` في إعدادات Plugin ‏Codex لتعطيل
فهرس المشغّل وأوامر فهرس العقد المقترنة من دون تعطيل
المزوّد أو حزام التشغيل.
ويجب أن يظل Plugin نشطًا على كلا الجهازين، كما يظل إعداد العقدة
موافقة محلية: فتمكين Gateway وحده لا يتيح قراءة حالة Codex على جهاز آخر.

تعلن العقدة عن أمري القراءة فقط ذوي الإصدار
`codex.appServer.threads.list.v1` و
`codex.appServer.thread.turns.list.v1`. كما تعلن العقدة الأصلية التي يتوفر عليها
CLI ‏Codex عن `codex.terminal.resume.v1`. وافق على ترقية اقتران العقدة
عند ظهور هذه الأوامر لأول مرة. يستدعيها Gateway عبر
سياسة عقد Plugin العادية ويعزل حالات الفشل حسب المضيف.

تظهر صفوف العقد المقترنة كمجموعة **Codex** في الشريط الجانبي العادي للجلسات.
افتراضيًا، يؤدي تحديد صف إلى فتح جزء الدردشة العادي وقراءة نصه المنسوخ المحفوظ
من خلال استدعاءات `thread/turns/list` محدودة ومرقّمة بالصفحات باستخدام المؤشر
مع إسقاط كامل للعناصر. استخدم قائمة الصف أو رأس العارض أو تفضيل **فتح جلسات Codex/Claude في** لبدء `codex resume <thread-id>` في طرفية المشغّل على الجهاز الذي يملك الجلسة. مسار طرفية العقدة المقترنة هو ترحيل PTY مدرج في قائمة السماح ويملكه Plugin ‏Codex، وليس تنفيذًا عشوائيًا لأوامر العقدة.

لا يوفر الترحيل عقود الاستمرار الكاملة لحزام تشغيل OpenClaw وملكية الأرشيف. لذلك لا يتوفر **المتابعة** و**الأرشفة** للصفوف البعيدة. على جهاز Gateway، يمكن للصفوف المخزنة والخاملة
بدء فرع دردشة منفصل مقيد بالنموذج. ولا يمكن أرشفة أي منهما إلا
بعد أن يؤكد المشغّل أن أي عميل Codex آخر لا يستخدمه؛ ويظل النشاط المباشر
لصف مخزن غير معروف. لا يمكن للصفوف النشطة إنشاء فرع أو الأرشفة.

راجع [الإشراف على جلسات Codex](/ar/plugins/codex-supervision) لمعرفة الإعداد
والترقيم بالصفحات والاستمرار المحلي وحد أمان بيانات التعريف.

### جلسات Claude والنصوص المنسوخة

يكتشف Plugin المضمّن `anthropic` افتراضيًا جلسات Claude CLI وClaude
Desktop غير المؤرشفة على Gateway والعقد المقترنة. عيّن
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` لتعطيل
فهرس المشغّل وأوامر فهرس العقد المقترنة من دون تعطيل نماذج Anthropic
أو الواجهة الخلفية لـ Claude CLI.
تعلن عقدة تطبيق macOS بعيدة عن
`anthropic.claude.sessions.list.v1` و`anthropic.claude.sessions.read.v1`
عندما يكون Plugin ‏Anthropic ممكّنًا ويكون `~/.claude/projects/` موجودًا. وافق
على ترقية اقتران العقدة عند ظهور هذه الأوامر لأول مرة.

كما تعلن العقدة الأصلية التي يتوفر عليها Claude CLI عن
`anthropic.claude.terminal.resume.v1`. ويمكن لصفوف CLI وDesktop المؤهلة فتح
`claude --resume <session-id>` في طرفية المشغّل على المضيف الذي يملكها.
وهذا استحواذ على الجلسة الأصلية؛ وعلى خلاف تبنّي OpenClaw، لا يؤدي إلى
تفريع جلسة Claude أولًا.

يجمع الفهرس سجلات فهرس مشاريع Claude CLI الصالحة مع بادئة
بيانات تعريف محدودة من ملفات JSONL الحالية في `sdk-cli`. توفر بيانات التعريف المحلية
لـ Claude Desktop عناوين Desktop وحالة الأرشفة. تكون الأولوية لبيانات تعريف Desktop عندما
يشير المصدران إلى معرّف جلسة Claude Code نفسه؛ وتظل النصوص المنسوخة الخاصة بـ CLI فقط
مرئية لأن CLI لا يملك علامة أرشفة. تستخدم قراءات النصوص المنسوخة مؤشرات مبهمة
لإزاحة البايت وقراءات ملفات عكسية محدودة، لذا لا يؤدي تحديد جلسة كبيرة
أو تحميل صفحة أقدم إلى قراءة سجل JSONL بالكامل ضمن
استجابة Gateway واحدة.

أوامر العرض والقراءة للقراءة فقط. ولا تعرض بيانات تعريف الفهرس ومحتوى النصوص المنسوخة
إلا عبر طريقتي `sessions.catalog.list` و
`sessions.catalog.read` العامتين لاتصال مشغّل مصادَق عليه يتضمن
`operator.write`. ويمكن تبنّي صف Claude CLI محلي في Gateway من محرر
الدردشة العادي: يستورد OpenClaw سجلًا مرئيًا محدودًا، ويستأنف باستخدام
`--fork-session` عند أول دور، ويترك النص المنسوخ المصدر دون تغيير.

يمكن لمضيف عقدة بلا واجهة رسومية الاشتراك في مسار الاستمرار نفسه:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

لا تعلن العقدة عن `agent.cli.claude.run.v1` إلا عندما يكون هذا الإعداد المحلي للعقدة
ممكّنًا ويُحل الملف التنفيذي `claude` على تلك العقدة. ولا يستطيع Gateway
تمكينه عن بُعد. كما يمر الأمر عبر سياسة موافقات التنفيذ الحالية للعقدة.
عندما تكون أوامر Claude الثلاثة كلها مُعلنة ومسموحًا بها وفق
سياسة أوامر العقدة الخاصة بـ Gateway، يصبح صف Claude CLI
على تلك العقدة قابلًا للاستمرار: يستورد OpenClaw سجلًا محدودًا، ويربط
الجلسة المتبنّاة بالعقدة ودليل عملها الذي أبلغ عنه الفهرس، ويشغّل
كل دور `claude -p` أحادي التنفيذ هناك. ويظل الدور الأول يستخدم
`--fork-session`، مما يحافظ على النص المنسوخ المصدر.

تستخدم الأدوار الموضوعة على العقدة إعدادات Claude الافتراضية الخاصة بالعقدة. في الإصدار v1 لا تتلقى
إعدادات MCP للاسترجاع الحلقي الخاصة بـ Gateway أو Plugin ‏Skills الخاص بـ Gateway، ولا يمكنها إعادة التهيئة من
نص منسوخ لـ Gateway، وترفض المرفقات والصور. تظل صفوف Claude Desktop
والعقد التي لا تعلن عن أمر التشغيل مخصصة للعرض فقط. ولا تعلن عقدة تطبيق
macOS عن هذا الأمر حتى الآن، لذا تظل صفوفها مخصصة للعرض فقط.

راجع [Anthropic: جلسات Claude عبر أجهزة متعددة](/ar/providers/anthropic#claude-sessions-across-computers)
لمعرفة سلوك واجهة التحكم ومصادر التخزين.

### جلسات OpenCode وPi

يكتشف Pluginا OpenCode وACPX المضمّنان أيضًا فهارس جلسات أصلية للقراءة فقط
على Gateway والعقد المقترنة. تعلن العقدة عن
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` عند تثبيت CLI ‏`opencode`،
وعن `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`
عند وجود دليل جلسات Pi. وافق على ترقية اقتران العقدة عند ظهور
أوامر جديدة لأول مرة. وعندما يتوفر CLI المطابق أيضًا، تضيف العقدة
`opencode.terminal.resume.v1` أو `acpx.pi.terminal.resume.v1`؛ ويمكن لقائمة الصف الحالية
ورأس العارض حينها إعادة فتح الجلسة المحددة في الطرفية المالكة لها
باستخدام `opencode --session <id>` أو `pi --session <id>`.

يقرأ OpenCode عبر واجهة JSON/التصدير الرسمية في CLI الخاص به. ويقرأ Pi
مخزن جلسات JSONL الموثق الخاص به، بما في ذلك دليلي جلسات `settings.json`
للمشروع والعام، إضافة إلى تجاوزات `PI_CODING_AGENT_DIR` و
`PI_CODING_AGENT_SESSION_DIR`. يكون كلا الفهرسين ممكّنًا افتراضيًا؛
عطّلهما في واجهة الويب ضمن **Config > Plugins**.

يستخدم استئناف الطرفية دليل عمل الجلسة المخزن وترحيل PTY مزدوج الاتجاه
المدرج في قائمة السماح نفسه الذي تستخدمه Codex وClaude. ولا يتيح تنفيذًا عشوائيًا
لأوامر العقدة.

### رفع الملفات إلى الطرفية

يمكن لواجهة التحكم سحب الملفات إلى طرفية مفتوحة لعقدة مقترنة. يعلن مضيف العقدة الأصلي عن أمر `terminal.upload` المخصص للمسؤول فقط؛ وافق على ترقية الاقتران عند ظهوره لأول مرة. يقتصر حجم كل ملف على 16 MiB، ويُجهّز في دليل مؤقت خاص على تلك العقدة، ويُعاد إلى الطرفية كمسار مقتبس وفق قواعد الصدفة من دون تنفيذه.

يدعم إدراج المسار PowerShell و`cmd.exe` وأصداف POSIX المعروفة (`sh` وBash وDash وAsh وKsh وZsh وFish)، بما في ذلك Git Bash على Windows. تُرفض تجاوزات الأصداف الأخرى لأنه لا يمكن استنتاج قواعد الاقتباس الخاصة بها بأمان؛ شغّل مضيف العقدة داخل WSL لاستخدام مسارات WSL الأصلية. كما تُرفض مسارات `cmd.exe` التي تحتوي على `%` أو `!` لأن تلك الصدفة توسّع هذه المحارف حتى داخل علامات الاقتباس المزدوجة.

## استدعاء الأوامر

مستوى منخفض (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

يحظر `nodes invoke` الأمرين `system.run` و`system.run.prepare`؛ ولا يُشغَّل هذان الأمران إلا عبر أداة `exec` مع `host=node` (راجع ما سبق). توجد أدوات مساعدة أعلى مستوى لمسارات العمل الشائعة «إعطاء الوكيل مرفق MEDIA» (اللوحة، والكاميرا، والشاشة، والموقع، أدناه).

تستخدم أوامر Node المتدفقة طويلة التشغيل أحداث `node.invoke.progress`
إضافية. يحمل كل حدث معرّف الاستدعاء ورقمًا تسلسليًا يبدأ من الصفر وجزءًا
نصيًا محدودًا بترميز UTF-8؛ ويرتّب Gateway الأجزاء قبل تسليمها إلى
المستدعي. تظل `node.invoke.result` الحالية هي الاستجابة النهائية
الوحيدة. يمكن للمستدعين المتدفقين تعيين مهلة خمول تبدأ مع أول حدث
تقدم وتُعاد تهيئتها بعد أحداث التقدم اللاحقة، مع الاحتفاظ بمهلة الاستدعاء
القصوى المنفصلة أثناء الموافقة والتنفيذ. تؤدي النتيجة وانتهاء المهلة القصوى
وانتهاء مهلة الخمول وانقطاع اتصال Node جميعها إلى التخلص من حالة التدفق
المعلقة. يؤدي إلغاء المستدعي إلى إصدار `node.invoke.cancel`؛ ثم ينهي مضيف Node
شجرة العمليات المطابقة. لا تتغير أوامر الطلب/الاستجابة الحالية.

## سياسة الأوامر

يجب أن تجتاز أوامر Node بوابتين قبل إمكان استدعائها:

1. يجب أن يعلن Node عن الأمر في بيانات تعريف اتصاله الموثَّق (`connect.commands`).
2. يجب أن تتضمن قائمة السماح في Gateway، المستمدة من المنصة والموافقة، الأمر المعلن.

قوائم السماح الافتراضية حسب المنصة (قبل إعدادات Plugin الافتراضية وتجاوزات `allowCommands`/`denyCommands`):

| المنصة | الأوامر المسموح بها افتراضيًا                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (تخضع أوامر مضيف Node مثل `system.run` للموافقة، انظر أدناه)                                                                                                                                                                                                                                  |

تصف هذه الصفوف الحد الأعلى لسياسة Gateway، لا الأوامر التي ينفذها كل تطبيق Node. لا يكون الأمر قابلًا للاستخدام إلا عندما يعلن عنه أيضًا Node المتصل. وعلى وجه الخصوص، لا يعلن تطبيق macOS الحالي عن مجموعات أوامر الجهاز والبيانات الشخصية المدرجة في صف سياسة macOS.

تُعد أوامر `canvas.*` ‏(`canvas.present` و`canvas.hide` و`canvas.navigate` و`canvas.eval` و`canvas.snapshot` و`canvas.a2ui.*`) إعدادًا افتراضيًا لـ Plugin على iOS وAndroid وmacOS وWindows وLinux والمنصات غير المعروفة. لا تعلن عنها عُقد Linux إلا عند وجود مقبس Canvas المحلي لتطبيق سطح المكتب. تُقيَّد جميع أوامر Canvas بالواجهة الأمامية على iOS.

يُسمح افتراضيًا بالأوامر `talk.ptt.start` و`talk.ptt.stop` و`talk.ptt.cancel` و`talk.ptt.once` لأي Node يعلن عن إمكانية `talk` أو يعلن عن أوامر `talk.*`، بصرف النظر عن تسمية المنصة.

لا تُعد أوامر مضيف سطح المكتب (`system.run` و`system.run.prepare` و`system.which` و`browser.proxy` و`mcp.tools.call.v1` و`screen.snapshot` على macOS/Windows) جزءًا من جدول الإعدادات الافتراضية الثابتة للمنصات أعلاه. تصبح متاحة بمجرد موافقة المشغّل على طلب إقران يعلن عنها، وبعد ذلك تحتفظ مجموعة الأوامر المعتمدة الخاصة بـ Node بها عند إعادة الاتصال.

تظل الأوامر الخطرة أو كثيفة التأثير في الخصوصية بحاجة إلى اشتراك صريح عبر `gateway.nodes.allowCommands`، حتى إن أعلن عنها Node: ‏`camera.snap` و`camera.clip` و`screen.record` و`computer.act` و`contacts.add` و`calendar.add` و`reminders.add` و`health.summary` و`sms.send` و`sms.search`. تكون الأولوية دائمًا لـ `gateway.nodes.denyCommands` على الإعدادات الافتراضية وإدخالات قائمة السماح الإضافية. راجع [ملخصات HealthKit](/platforms/ios-healthkit) لمعرفة بوابة موافقة iPhone و[استخدام الحاسوب](/ar/nodes/computer-use) لمعرفة بوابات macOS الإضافية وسياسة الأدوات والتسليح المتعلقة بإدخال سطح المكتب.

يمكن لأوامر Node المملوكة لـ Plugin إضافة سياسة استدعاء Node في Gateway. تُنفَّذ هذه السياسة بعد فحص قائمة السماح وقبل إعادة التوجيه إلى Node، بحيث تشترك `node.invoke` الأولية ومساعدات CLI وأدوات الوكيل المخصصة في حد أذونات Plugin نفسه. تظل أوامر Node الخطرة الخاصة بـ Plugin بحاجة إلى اشتراك صريح عبر `gateway.nodes.allowCommands`.

بعد تغيير Node لقائمة أوامره المعلنة، ارفض إقران الجهاز القديم ووافق على الطلب الجديد لكي يخزن Gateway لقطة الأوامر المحدَّثة.

## الإعدادات (`openclaw.json`)

توجد الإعدادات المتعلقة بـ Node ضمن `gateway.nodes` و`tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // وافق تلقائيًا على إقران Node لأول مرة من الشبكات الموثوقة (قائمة CIDR).
      // يكون معطلًا عند عدم تعيينه. ينطبق فقط على طلبات role:node لأول مرة
      // التي لا تطلب نطاقات؛ ولا يوافق تلقائيًا على الترقيات.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // الموافقة التلقائية المتحقق منها عبر SSH (الافتراضي: مفعّلة). توافق على إقران
        // Node لأول مرة عند تطابق مفتاح الجهاز تمامًا كما يُقرأ مجددًا عبر SSH.
        sshVerify: true,
      },
      // ثق بأدوات Plugin المرئية للوكيل التي تنشرها العُقد المقترنة (الافتراضي: true).
      pluginTools: {
        enabled: true,
      },
      // اشترك في أوامر Node الخطرة/كثيفة التأثير في الخصوصية (camera.snap، إلخ).
      allowCommands: ["camera.snap", "screen.record"],
      // احظر أسماء الأوامر المطابقة تمامًا حتى إن شملتها الإعدادات الافتراضية أو allowCommands.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // مضيف exec الافتراضي: يوجّه "node" جميع استدعاءات exec إلى Node مقترن.
      host: "node",
      // وضع الأمان لـ exec على Node: اسمح فقط بالأوامر المعتمدة/الموجودة في قائمة السماح.
      security: "allowlist",
      // ثبّت exec على Node محدد (المعرّف أو الاسم). احذفه للسماح بأي Node.
      node: "build-node",
    },
  },
}
```

استخدم أسماء أوامر Node الدقيقة. تزيل `denyCommands` أمرًا حتى عندما يسمح به افتراضي للمنصة أو إدخال `allowCommands` لولا ذلك. يمكن للعُقد المقترنة نشر واصفات أدوات Plugin المرئية للوكيل افتراضيًا، لكن يجب أن يظل أمر كل واصف ضمن سطح الأوامر المعتمد لـ Node. عيّن `gateway.nodes.pluginTools.enabled: false` لتجاهل جميع هذه الواصفات. راجع [مرجع إعدادات Gateway](/ar/gateway/configuration-reference#gateway) لمعرفة تفاصيل حقول إقران عُقد Gateway وسياسة الأوامر.

تجاوز Node الخاص بـ exec لكل وكيل:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## لقطات الشاشة (لقطات Canvas)

إذا كان Node يعرض Canvas ‏(WebView)، فتعيد `canvas.snapshot` القيمة `{ format, base64 }`.

مساعد CLI (يكتب إلى ملف مؤقت ويطبع المسار المحفوظ):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### عناصر تحكم Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

ملاحظات:

- تقبل `canvas present` عناوين URL أو مسارات الملفات المحلية (`--target`) على العُقد التي تدعم المسارات المحلية، إضافة إلى `--x/--y/--width/--height` الاختيارية لتحديد الموضع. تقبل Canvas على Linux عناوين HTTP(S) URL أو عارض A2UI المضمّن فيها.
- تقبل `canvas eval` شيفرة JS مضمّنة (`--js`) أو وسيطة موضعية.

### A2UI ‏(Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

ملاحظات:

- تستخدم عُقد الأجهزة المحمولة وسطح مكتب Linux صفحة A2UI مضمّنة مملوكة للتطبيق للعرض القادر على تنفيذ الإجراءات.
- لا يُدعم سوى A2UI v0.8 JSONL ‏(يُرفض v0.9/createSurface).
- يعرض iOS وAndroid صفحات Gateway Canvas البعيدة، لكن لا تُرسل إجراءات أزرار A2UI إلا من صفحة A2UI المضمّنة المملوكة للتطبيق. تكون صفحات A2UI المستضافة على Gateway عبر HTTP/HTTPS مخصصة للعرض فقط على عملاء الأجهزة المحمولة هؤلاء.
- يمكن لـ macOS إرسال الإجراءات من صفحة Gateway A2UI الدقيقة المحددة بنطاق الإمكانية والتي يختارها التطبيق. تظل صفحات HTTP/HTTPS الأخرى مخصصة للعرض فقط.
- يرسل Linux الإجراءات فقط من صفحة A2UI المضمّنة. تظل صفحات HTTP/HTTPS الأخرى مخصصة للعرض فقط، ولا يعلن Node على Linux دون واجهة رسومية ومن دون تطبيق سطح المكتب عن Canvas.

## الصور ومقاطع الفيديو (كاميرا Node)

الصور (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # الافتراضي: كلا الاتجاهين (سطران MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

مقاطع الفيديو (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

ملاحظات:

- يجب أن يكون Node **في الواجهة الأمامية** لتنفيذ `canvas.*` و`camera.*` (تعيد الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE`).
- تحدّ العُقد من مدة المقطع لإبقاء حمولة base64 قابلة للإدارة (راجع [التقاط الكاميرا](/ar/nodes/camera) لمعرفة الحدود الدقيقة لكل منصة). تحد أداة الوكيل `nodes` أيضًا قيمة `durationMs` المطلوبة عند 300000 (5 دقائق) قبل إعادة توجيه الاستدعاء؛ ويفرض Node نفسه الحد الأضيق.
- سيطلب Android أذونات `CAMERA`/`RECORD_AUDIO` عندما يكون ذلك ممكنًا؛ وتفشل الأذونات المرفوضة مع `*_PERMISSION_REQUIRED`.

## تسجيلات الشاشة (العُقد)

تعرض العُقد المدعومة `screen.record` ‏(mp4). مثال:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

ملاحظات:

- يعتمد توفر `screen.record` على منصة Node.
- تحد أداة الوكيل `nodes` قيمة `durationMs` المطلوبة عند 300000 (5 دقائق)؛ وقد تفرض Node حدًا أشد لتقييد الحمولة المُعادة.
- يعطّل `--no-audio` التقاط صوت الميكروفون على المنصات المدعومة.
- استخدم `--screen <index>` لتحديد شاشة عند توفر شاشات متعددة (0 = الأساسية).

## الموقع (عُقد Node)

تعرض عُقد Node الأمر `location.get` عند تمكين الموقع في الإعدادات.

أداة CLI المساعدة:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

ملاحظات:

- الموقع **معطّل افتراضيًا**.
- يتطلب "Always" إذنًا من النظام؛ ويُنفَّذ الجلب في الخلفية حسب أفضل جهد ممكن.
- تتضمن الاستجابة خط العرض/خط الطول، والدقة (بالأمتار)، والطابع الزمني.
- للبنية الكاملة للمعلمات/الاستجابة ورموز الأخطاء: [أمر الموقع](/ar/nodes/location-command).

## الرسائل النصية القصيرة (عُقد Android)

يمكن لعُقد Android عرض `sms.send` و`sms.search` عندما يمنح المستخدم إذن **SMS** ويدعم الجهاز الاتصالات الهاتفية. كلا الأمرين خطير افتراضيًا: يجب أيضًا على مشغّل Gateway إضافتهما إلى `gateway.nodes.allowCommands` قبل إمكان استدعائهما (راجع [سياسة الأوامر](#command-policy)).

للبحث للقراءة فقط في رسائل SMS، اشترك صراحةً في `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

أضف `sms.send` بصورة منفصلة فقط عندما ينبغي أن تتمكن Node أيضًا من إرسال الرسائل. إذن Android وتفويض أوامر Gateway مستقلان؛ فمنح إذن الهاتف لا يعدّل سياسة Gateway.

استدعاء منخفض المستوى:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

ملاحظات:

- يمكن الإعلان عن `sms.search` قبل منح `READ_SMS` لكي يتمكن الاستدعاء من إرجاع تشخيص للإذن؛ وتظل قراءة الرسائل متطلبة لذلك الإذن في Android.
- لن تعلن الأجهزة التي تعمل عبر Wi-Fi فقط ولا تدعم الاتصالات الهاتفية عن `sms.send`.
- يعني خطأ `requires explicit gateway.nodes.allowCommands opt-in` أن الهاتف أعلن عن الأمر، لكن مشغّل Gateway لم يفوّضه.

## أوامر الجهاز والبيانات الشخصية

تعلن عُقد iOS وAndroid افتراضيًا عن عدة أوامر بيانات للقراءة فقط (راجع جدول [سياسة الأوامر](#command-policy))؛ ويعرض Android بالإضافة إلى ذلك مجموعة أكبر تخضع لإعداداته الخاصة داخل التطبيق.

المجموعات المتاحة:

- `device.status`، `device.info` — ‏iOS وAndroid وWindows.
- `device.permissions`، `device.health`، `device.apps` — ‏Android فقط؛ يتطلب `device.apps` تمكين مشاركة Installed Apps في Android Settings، ويُرجع افتراضيًا التطبيقات الظاهرة في مشغّل التطبيقات.
- `notifications.list`، `notifications.actions` — ‏Android فقط.
- `photos.latest` — ‏iOS وAndroid.
- `contacts.search` — ‏iOS وAndroid (للقراءة فقط افتراضيًا)؛ يُعد `contacts.add` خطيرًا ويحتاج إلى `gateway.nodes.allowCommands`.
- `calendar.events` — ‏iOS وAndroid (للقراءة فقط افتراضيًا)؛ يُعد `calendar.add` خطيرًا ويحتاج إلى `gateway.nodes.allowCommands`.
- `reminders.list` — ‏iOS وAndroid (للقراءة فقط افتراضيًا)؛ يُعد `reminders.add` خطيرًا ويحتاج إلى `gateway.nodes.allowCommands`.
- `callLog.search` — ‏Android فقط.
- `motion.activity`، `motion.pedometer` — ‏iOS وAndroid؛ وتخضع للإمكانات وفق المستشعرات المتاحة.

أمثلة على الاستدعاءات:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## أوامر النظام (مضيف Node / ‏Node على Mac)

تعرض Node على macOS الأوامر `system.run` و`system.which` و`system.notify` و`system.execApprovals.get/set`. ويعرض مضيف Node بلا واجهة الأوامر `system.run.prepare` و`system.run` و`system.which` و`system.execApprovals.get/set`.

أمثلة:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

ملاحظات:

- يُرجع `system.run` المخرجات القياسية ومخرجات الأخطاء القياسية ورمز الخروج ضمن الحمولة.
- يمر تنفيذ الصدفة الآن عبر أداة `exec` باستخدام `host=node`؛ ويظل `nodes` سطح RPC المباشر لأوامر Node الصريحة.
- لا يعرض `nodes invoke` الخيارين `system.run` أو `system.run.prepare`؛ إذ يظلان متاحين في مسار التنفيذ فقط.
- يُعد مسار التنفيذ `systemRunPlan` معياريًا قبل الموافقة. وبمجرد منح الموافقة، يمرر Gateway تلك الخطة المخزنة، لا أي حقول للأمر أو دليل العمل أو الجلسة يعدّلها المستدعي لاحقًا.
- يراعي `system.notify` حالة إذن الإشعارات في تطبيق macOS؛ ويدعم `--priority <passive|active|timeSensitive>` و`--delivery <system|overlay|auto>`.
- تستخدم البيانات الوصفية غير المعروفة لـ `platform` / `deviceFamily` في Node قائمة سماح افتراضية متحفظة تستبعد `system.run` و`system.which`. إذا كنت تحتاج عمدًا إلى هذه الأوامر لمنصة غير معروفة، فأضفها صراحةً عبر `gateway.nodes.allowCommands`.
- يدعم `system.run` الخيارات `--cwd` و`--env KEY=VAL` و`--command-timeout` و`--needs-screen-recording`.
- بالنسبة إلى أغلفة الصدفة (`bash|sh|zsh ... -c/-lc`)، تُختزل قيم `--env` ذات نطاق الطلب إلى قائمة سماح صريحة (`TERM`، `LANG`، `LC_*`، `COLORTERM`، `NO_COLOR`، `FORCE_COLOR`).
- بالنسبة إلى قرارات السماح الدائم في وضع قائمة السماح، تحتفظ أغلفة التوجيه المعروفة (`env`، `flock`، `nice`، `nohup`، `stdbuf`، `timeout`) بمسارات الملفات التنفيذية الداخلية بدلًا من مسارات الأغلفة. وإذا لم يكن فك الغلاف آمنًا، فلا يُحتفظ تلقائيًا بأي إدخال في قائمة السماح.
- على مضيفي Node بنظام Windows في وضع قائمة السماح، تتطلب عمليات تشغيل غلاف الصدفة عبر `cmd.exe /c` موافقةً (فإدخال قائمة السماح وحده لا يسمح تلقائيًا بصيغة الغلاف).
- يتجاهل مضيفو Node تجاوزات `PATH` في `--env`، ويزيلون مجموعة كبيرة ومُصانة من متغيرات بدء تشغيل المفسّر/الصدفة (مثل `NODE_OPTIONS` و`PYTHONPATH` و`BASH_ENV` و`DYLD_*` و`LD_*`) قبل تشغيل الأمر. إذا احتجت إلى إدخالات PATH إضافية، فاضبط بيئة خدمة مضيف Node (أو ثبّت الأدوات في المواقع القياسية) بدلًا من تمرير `PATH` عبر `--env`.
- في وضع Node على macOS، يخضع `system.run` لموافقات التنفيذ في تطبيق macOS (Settings → Exec approvals). تعمل أوضاع الطلب/قائمة السماح/الكامل بالطريقة نفسها التي يعمل بها مضيف Node بلا واجهة؛ وتُرجع المطالبات المرفوضة `SYSTEM_RUN_DENIED`.
- على مضيف Node بلا واجهة، يخضع `system.run` لموافقات التنفيذ (`~/.openclaw/exec-approvals.json`)؛ وعلى macOS تحديدًا، راجع متغيرات بيئة توجيه مضيف التنفيذ ضمن [مضيف Node بلا واجهة](#headless-node-host-cross-platform) أدناه.

## ربط Node بالتنفيذ

عند توفر عدة عُقد Node، يمكنك ربط التنفيذ بعقدة محددة. يعيّن هذا عقدة Node الافتراضية لـ `exec host=node` (ويمكن تجاوزه لكل وكيل).

الإعداد الافتراضي العام:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

تجاوز خاص بكل وكيل:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

ألغِ التعيين للسماح بأي عقدة Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## خريطة الأذونات

قد تتضمن عُقد Node خريطة `permissions` في `node.list` / `node.describe`، مفهرسة باسم الإذن (مثل `screenRecording` و`accessibility` و`location`) وبقيم منطقية (`true` = ممنوح).

## مضيف Node بلا واجهة (متعدد المنصات)

يمكن تشغيل OpenClaw بوصفه **مضيف Node بلا واجهة** (من دون واجهة مستخدم)، يتصل بـ WebSocket الخاص بـ Gateway ويعرض `system.run` / `system.which`. يفيد هذا على Linux/Windows أو لتشغيل Node مصغّرة إلى جانب خادم.

لتشغيله:

```bash
openclaw node run --host <gateway-host> --port 18789
```

ملاحظات:

- لا يزال الاقتران مطلوبًا (سيعرض Gateway مطالبة باقتران الجهاز).
- تستخدم البيانات الوصفية لمثيل العميل وهوية الجهاز الموقّعة ومصادقة الاقتران ملفات منفصلة؛ راجع [حالة الهوية بلا واجهة](#headless-identity-state).
- تُفرض موافقات التنفيذ محليًا عبر `~/.openclaw/exec-approvals.json` (راجع [موافقات التنفيذ](/ar/tools/exec-approvals)).
- على macOS، ينفّذ مضيف Node بلا واجهة `system.run` محليًا افتراضيًا. عيّن `OPENCLAW_NODE_EXEC_HOST=app` لتوجيه `system.run` عبر مضيف التنفيذ في التطبيق المصاحب؛ وأضف `OPENCLAW_NODE_EXEC_FALLBACK=0` لاشتراط مضيف التطبيق والفشل المغلق إذا لم يكن متاحًا.
- أضف `--tls` / `--tls-fingerprint` عندما يستخدم WebSocket الخاص بـ Gateway بروتوكول TLS.

## وضع Node على Mac

- يتصل تطبيق شريط القوائم في macOS بخادم WebSocket الخاص بـ Gateway بوصفه Node (بحيث يعمل `openclaw nodes …` على جهاز Mac هذا).
- في الوضع البعيد، يفتح التطبيق نفق SSH لمنفذ Gateway ويتصل بـ `localhost`.
