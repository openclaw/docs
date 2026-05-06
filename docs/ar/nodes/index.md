---
read_when:
    - إقران عُقد iOS/Android بـ Gateway
    - استخدام لوحة الرسم/الكاميرا الخاصة بالعقدة لسياق الوكيل
    - إضافة أوامر Node جديدة أو أدوات مساعدة لـ CLI
summary: 'العُقد: الإقران، والإمكانات، والأذونات، ومساعدات CLI للوحة/الكاميرا/الشاشة/الجهاز/الإشعارات/النظام'
title: العُقد
x-i18n:
    generated_at: "2026-05-06T08:03:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

**node** هو جهاز مرافق (macOS/iOS/Android/بلا واجهة) يتصل بـ Gateway **WebSocket** (على المنفذ نفسه الخاص بالمشغّلين) مع `role: "node"` ويعرض سطح أوامر (مثل `canvas.*`، و`camera.*`، و`device.*`، و`notifications.*`، و`system.*`) عبر `node.invoke`. تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

النقل القديم: [بروتوكول Bridge](/ar/gateway/bridge-protocol) (TCP JSONL؛
تاريخي فقط بالنسبة إلى العقد الحالية).

يمكن لـ macOS أيضًا العمل في **وضع node**: يتصل تطبيق شريط القوائم بخادم WS الخاص بـ Gateway
ويعرض أوامر canvas/camera المحلية الخاصة به كـ node (بحيث يعمل
`openclaw nodes …` ضد هذا الـ Mac). في وضع Gateway البعيد، تتولى عقدة CLI المضيفة
أتمتة المتصفح (`openclaw node run` أو خدمة node المثبتة)، وليس node التطبيق الأصلي.

ملاحظات:

- الـ Nodes هي **أجهزة طرفية**، وليست gateways. إنها لا تشغّل خدمة gateway.
- تصل رسائل Telegram/WhatsApp/إلخ إلى **gateway**، وليس إلى nodes.
- دليل استكشاف الأخطاء وإصلاحها: [/nodes/troubleshooting](/ar/nodes/troubleshooting)

## الاقتران + الحالة

**تستخدم WS nodes اقتران الأجهزة.** تعرض Nodes هوية جهاز أثناء `connect`؛ وينشئ Gateway
طلب اقتران جهاز لـ `role: node`. وافق عليه عبر CLI الأجهزة (أو واجهة المستخدم).

CLI سريع:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

إذا أعادت node المحاولة بتفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)، فسيتم تجاوز
الطلب المعلّق السابق وإنشاء `requestId` جديد. أعد تشغيل
`openclaw devices list` قبل الموافقة.

ملاحظات:

- يضع `nodes status` علامة **مقترنة** على node عندما يتضمن دور اقتران جهازها `node`.
- سجل اقتران الجهاز هو عقد الدور الموافق عليه الدائم. يبقى تدوير الرمز
  داخل هذا العقد؛ ولا يمكنه ترقية node مقترنة إلى
  دور مختلف لم تمنحه موافقة الاقتران مطلقًا.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) هو مخزن اقتران node منفصل مملوك لـ gateway؛ وهو **لا** يقيّد مصافحة WS `connect`.
- يحذف `openclaw nodes remove --node <id|name|ip>` الإدخالات القديمة من
  مخزن اقتران node المنفصل المملوك لـ gateway.
- يتبع نطاق الموافقة الأوامر المعلنة في الطلب المعلّق:
  - طلب بلا أوامر: `operator.pairing`
  - أوامر node غير exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## مضيف node البعيد (system.run)

استخدم **مضيف node** عندما يعمل Gateway على جهاز وتريد تنفيذ الأوامر
على جهاز آخر. ما زال النموذج يتحدث إلى **gateway**؛ ويمرر gateway
استدعاءات `exec` إلى **مضيف node** عند اختيار `host=node`.

### ما الذي يعمل وأين

- **مضيف Gateway**: يستقبل الرسائل، ويشغّل النموذج، ويوجّه استدعاءات الأدوات.
- **مضيف Node**: ينفذ `system.run`/`system.which` على جهاز node.
- **الموافقات**: تُفرض على مضيف node عبر `~/.openclaw/exec-approvals.json`.

ملاحظة الموافقة:

- تربط عمليات تشغيل node المدعومة بالموافقة سياق الطلب الدقيق.
- بالنسبة إلى عمليات تنفيذ ملفات shell/runtime المباشرة، يبذل OpenClaw أيضًا أفضل جهد لربط مُعامل ملف محلي ملموس واحد ويرفض التشغيل إذا تغيّر ذلك الملف قبل التنفيذ.
- إذا تعذر على OpenClaw تحديد ملف محلي ملموس واحد بالضبط لأمر interpreter/runtime،
  فسيتم رفض التنفيذ المدعوم بالموافقة بدلًا من ادعاء تغطية runtime كاملة. استخدم العزل،
  أو مضيفين منفصلين، أو قائمة سماح موثوقة/سير عمل كاملًا صريحًا لدلالات interpreter الأوسع.

### بدء مضيف node (في المقدمة)

على جهاز node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway بعيد عبر نفق SSH (ربط loopback)

إذا كان Gateway يرتبط بـ loopback (`gateway.bind=loopback`، وهو الافتراضي في الوضع المحلي)،
فلن تتمكن مضيفات node البعيدة من الاتصال مباشرة. أنشئ نفق SSH ووجّه
مضيف node إلى الطرف المحلي للنفق.

مثال (مضيف node -> مضيف gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

ملاحظات:

- يدعم `openclaw node run` المصادقة بالرمز أو كلمة المرور.
- يُفضّل استخدام متغيرات البيئة: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- الاحتياطي في التكوين هو `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، يتجاهل مضيف node عمدًا `gateway.remote.token` / `gateway.remote.password`.
- في الوضع البعيد، تكون `gateway.remote.token` / `gateway.remote.password` مؤهلة وفق قواعد أولوية البعيد.
- إذا كانت SecretRefs المحلية النشطة `gateway.auth.*` مكوّنة ولكن غير محلولة، تفشل مصادقة مضيف node بإغلاق آمن.
- لا يحترم حل مصادقة مضيف node إلا متغيرات البيئة `OPENCLAW_GATEWAY_*`.

### بدء مضيف node (كخدمة)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### الاقتران + التسمية

على مضيف gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

إذا أعادت node المحاولة بتفاصيل مصادقة متغيرة، فأعد تشغيل `openclaw devices list`
ووافق على `requestId` الحالي.

خيارات التسمية:

- `--display-name` في `openclaw node run` / `openclaw node install` (يستمر في `~/.openclaw/node.json` على node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (تجاوز gateway).

### إضافة الأوامر إلى قائمة السماح

موافقات exec هي **لكل مضيف node**. أضف إدخالات قائمة السماح من gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

توجد الموافقات على مضيف node في `~/.openclaw/exec-approvals.json`.

### توجيه exec إلى node

اضبط الافتراضيات (تكوين gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

أو لكل جلسة:

```
/exec host=node security=allowlist node=<id-or-name>
```

بعد ضبط ذلك، يعمل أي استدعاء `exec` مع `host=node` على مضيف node (مع الخضوع
لقائمة سماح/موافقات node).

لن يختار `host=auto` الـ node ضمنيًا من تلقاء نفسه، لكن يُسمح بطلب صريح لكل استدعاء `host=node` من `auto`. إذا كنت تريد أن يكون exec على node هو الافتراضي للجلسة، فاضبط `tools.exec.host=node` أو `/exec host=node ...` صراحة.

ذات صلة:

- [CLI مضيف Node](/ar/cli/node)
- [أداة Exec](/ar/tools/exec)
- [موافقات Exec](/ar/tools/exec-approvals)

## استدعاء الأوامر

منخفض المستوى (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

توجد أدوات مساعدة أعلى مستوى لسير عمل "أعطِ الوكيل مرفق MEDIA" الشائع.

## سياسة الأوامر

يجب أن تمر أوامر Node عبر بوابتين قبل أن يمكن استدعاؤها:

1. يجب أن تعلن node الأمر في قائمة WebSocket `connect.commands` الخاصة بها.
2. يجب أن تسمح سياسة منصة gateway بالأمر المعلن.

تسمح nodes المرافقة على Windows وmacOS افتراضيًا بالأوامر الآمنة المعلنة مثل
`canvas.*`، و`camera.list`، و`location.get`، و`screen.snapshot`.
كما تسمح nodes الموثوقة التي تعلن عن قدرة `talk` أو تعلن أوامر `talk.*`
بأوامر اضغط للتحدث المعلنة (`talk.ptt.start`، و`talk.ptt.stop`،
و`talk.ptt.cancel`، و`talk.ptt.once`) افتراضيًا، بغض النظر عن وسم المنصة.
أما الأوامر الخطرة أو شديدة الحساسية للخصوصية مثل `camera.snap`، و`camera.clip`، و
`screen.record` فما زالت تتطلب اشتراكًا صريحًا عبر
`gateway.nodes.allowCommands`. تتغلب `gateway.nodes.denyCommands` دائمًا على
الافتراضيات وإدخالات قائمة السماح الإضافية.

يمكن لأوامر node المملوكة لـ Plugin إضافة سياسة node-invoke في Gateway. تعمل تلك السياسة
بعد فحص قائمة السماح وقبل التمرير إلى node، لذا يشترك
`node.invoke` الخام، وأدوات CLI المساعدة، وأدوات الوكيل المخصصة في حدود أذونات Plugin نفسها.
ما زالت أوامر node الخطرة الخاصة بـ Plugin تتطلب اشتراكًا صريحًا في
`gateway.nodes.allowCommands`.

بعد أن تغيّر node قائمة الأوامر المعلنة الخاصة بها، ارفض اقتران الجهاز القديم
ووافق على الطلب الجديد كي يخزّن gateway لقطة الأوامر المحدّثة.

## لقطات الشاشة (لقطات canvas)

إذا كانت node تعرض Canvas (WebView)، فسيعيد `canvas.snapshot` القيمة `{ format, base64 }`.

أداة CLI مساعدة (تكتب إلى ملف مؤقت وتطبع `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### عناصر التحكم في Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

ملاحظات:

- يقبل `canvas present` عناوين URL أو مسارات ملفات محلية (`--target`)، بالإضافة إلى `--x/--y/--width/--height` الاختيارية لتحديد الموضع.
- يقبل `canvas eval` JS مضمنًا (`--js`) أو وسيطة موضعية.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

ملاحظات:

- لا يُدعم إلا A2UI v0.8 JSONL (ويُرفض v0.9/createSurface).

## الصور + مقاطع الفيديو (كاميرا node)

الصور (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

مقاطع الفيديو (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

ملاحظات:

- يجب أن تكون node **في المقدمة** لأوامر `canvas.*` و`camera.*` (تعيد استدعاءات الخلفية `NODE_BACKGROUND_UNAVAILABLE`).
- مدة المقطع محدودة (حاليًا `<= 60s`) لتجنب حمولات base64 كبيرة جدًا.
- سيطلب Android أذونات `CAMERA`/`RECORD_AUDIO` عندما يكون ذلك ممكنًا؛ وتفشل الأذونات المرفوضة مع `*_PERMISSION_REQUIRED`.

## تسجيلات الشاشة (nodes)

تعرض nodes المدعومة `screen.record` (mp4). مثال:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

ملاحظات:

- يعتمد توفر `screen.record` على منصة node.
- تُحدد تسجيلات الشاشة بحد أقصى `<= 60s`.
- يعطّل `--no-audio` التقاط الميكروفون على المنصات المدعومة.
- استخدم `--screen <index>` لاختيار شاشة عرض عند توفر شاشات متعددة.

## الموقع (nodes)

تعرض Nodes الأمر `location.get` عندما يكون Location مفعّلًا في الإعدادات.

أداة CLI مساعدة:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

ملاحظات:

- يكون Location **متوقفًا افتراضيًا**.
- يتطلب "Always" إذن النظام؛ والجلب في الخلفية يبذل أفضل جهد.
- تتضمن الاستجابة lat/lon، والدقة (بالأمتار)، والطابع الزمني.

## SMS (Android nodes)

يمكن لـ Android nodes عرض `sms.send` عندما يمنح المستخدم إذن **SMS** ويدعم الجهاز الاتصال الهاتفي.

استدعاء منخفض المستوى:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

ملاحظات:

- يجب قبول مطالبة الإذن على جهاز Android قبل الإعلان عن القدرة.
- لن تعلن الأجهزة العاملة عبر Wi-Fi فقط من دون اتصال هاتفي عن `sms.send`.

## أوامر جهاز Android + البيانات الشخصية

يمكن لـ Android nodes الإعلان عن عائلات أوامر إضافية عندما تكون القدرات المقابلة مفعّلة.

العائلات المتاحة:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

أمثلة على الاستدعاءات:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

ملاحظات:

- أوامر الحركة مقيّدة بالإمكانات حسب المستشعرات المتاحة.

## أوامر النظام (مضيف Node / Node على Mac)

يكشف Node الخاص بـ macOS الأوامر `system.run` و`system.notify` و`system.execApprovals.get/set`.
يكشف مضيف Node بلا واجهة الأوامر `system.run` و`system.which` و`system.execApprovals.get/set`.

أمثلة:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

ملاحظات:

- يعيد `system.run` stdout/stderr/رمز الخروج في الحمولة.
- يمر تنفيذ Shell الآن عبر أداة `exec` مع `host=node`؛ وتبقى `nodes` سطح RPC المباشر لأوامر Node الصريحة.
- لا يكشف `nodes invoke` الأمرين `system.run` أو `system.run.prepare`؛ فهما يبقيان على مسار exec فقط.
- يجهّز مسار exec خطة `systemRunPlan` معيارية قبل الموافقة. بمجرد
  منح الموافقة، يمرر Gateway تلك الخطة المخزنة، وليس أي حقول command/cwd/session
  يعدّلها المستدعي لاحقًا.
- يحترم `system.notify` حالة إذن الإشعارات في تطبيق macOS.
- تستخدم بيانات تعريف Node غير المعروفة `platform` / `deviceFamily` قائمة سماح افتراضية محافظة تستبعد `system.run` و`system.which`. إذا كنت تحتاج عمدًا إلى تلك الأوامر لمنصة غير معروفة، فأضفها صراحة عبر `gateway.nodes.allowCommands`.
- يدعم `system.run` الخيارات `--cwd` و`--env KEY=VAL` و`--command-timeout` و`--needs-screen-recording`.
- بالنسبة إلى مغلفات Shell (`bash|sh|zsh ... -c/-lc`)، تُخفض قيم `--env` ضمن نطاق الطلب إلى قائمة سماح صريحة (`TERM` و`LANG` و`LC_*` و`COLORTERM` و`NO_COLOR` و`FORCE_COLOR`).
- بالنسبة إلى قرارات السماح الدائم في وضع قائمة السماح، تحفظ مغلفات الإرسال المعروفة (`env` و`nice` و`nohup` و`stdbuf` و`timeout`) مسارات الملفات التنفيذية الداخلية بدلًا من مسارات المغلفات. إذا لم يكن فك التغليف آمنًا، فلا يتم حفظ أي إدخال في قائمة السماح تلقائيًا.
- على مضيفات Node في Windows في وضع قائمة السماح، تتطلب عمليات تشغيل مغلف Shell عبر `cmd.exe /c` موافقة (لا يكفي إدخال قائمة السماح وحده للسماح تلقائيًا بشكل المغلف).
- يدعم `system.notify` الخيارين `--priority <passive|active|timeSensitive>` و`--delivery <system|overlay|auto>`.
- تتجاهل مضيفات Node تجاوزات `PATH` وتزيل مفاتيح بدء التشغيل/Shell الخطرة (`DYLD_*` و`LD_*` و`NODE_OPTIONS` و`PYTHON*` و`PERL*` و`RUBYOPT` و`SHELLOPTS` و`PS4`). إذا كنت تحتاج إلى إدخالات PATH إضافية، فاضبط بيئة خدمة مضيف Node (أو ثبّت الأدوات في المواقع القياسية) بدلًا من تمرير `PATH` عبر `--env`.
- في وضع Node على macOS، يكون `system.run` مقيّدًا بموافقات exec في تطبيق macOS (الإعدادات → موافقات Exec).
  تعمل أوضاع السؤال/قائمة السماح/الكامل بالطريقة نفسها كما في مضيف Node بلا واجهة؛ وتعيد المطالبات المرفوضة `SYSTEM_RUN_DENIED`.
- في مضيف Node بلا واجهة، يكون `system.run` مقيّدًا بموافقات exec (`~/.openclaw/exec-approvals.json`).

## ربط exec بـ Node

عند توفر عدة Nodes، يمكنك ربط exec بـ Node محدد.
يعيّن هذا Node الافتراضي لـ `exec host=node` (ويمكن تجاوزه لكل وكيل).

الإعداد الافتراضي العام:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

تجاوز لكل وكيل:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

ألغِ التعيين للسماح بأي Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## خريطة الأذونات

قد تتضمن Nodes خريطة `permissions` في `node.list` / `node.describe`، مفهرسة حسب اسم الإذن (مثل `screenRecording` و`accessibility`) مع قيم منطقية (`true` = ممنوح).

## مضيف Node بلا واجهة (متعدد المنصات)

يمكن لـ OpenClaw تشغيل **مضيف Node بلا واجهة** (من دون واجهة مستخدم) يتصل بـ WebSocket الخاص بـ Gateway
ويكشف `system.run` / `system.which`. هذا مفيد على Linux/Windows
أو لتشغيل Node بسيط بجانب خادم.

ابدأ تشغيله:

```bash
openclaw node run --host <gateway-host> --port 18789
```

ملاحظات:

- لا يزال الاقتران مطلوبًا (سيعرض Gateway مطالبة اقتران جهاز).
- يخزّن مضيف Node معرّف Node والرمز المميز واسم العرض ومعلومات اتصال Gateway في `~/.openclaw/node.json`.
- تُفرض موافقات exec محليًا عبر `~/.openclaw/exec-approvals.json`
  (راجع [موافقات Exec](/ar/tools/exec-approvals)).
- على macOS، ينفذ مضيف Node بلا واجهة `system.run` محليًا افتراضيًا. عيّن
  `OPENCLAW_NODE_EXEC_HOST=app` لتوجيه `system.run` عبر مضيف exec في التطبيق المرافق؛ وأضف
  `OPENCLAW_NODE_EXEC_FALLBACK=0` لاشتراط مضيف التطبيق والفشل بشكل مغلق إذا لم يكن متاحًا.
- أضف `--tls` / `--tls-fingerprint` عندما يستخدم Gateway WS بروتوكول TLS.

## وضع Node على Mac

- يتصل تطبيق شريط القوائم في macOS بخادم Gateway WS باعتباره Node (لذلك يعمل `openclaw nodes …` ضد هذا الـ Mac).
- في الوضع البعيد، يفتح التطبيق نفق SSH لمنفذ Gateway ويتصل بـ `localhost`.
