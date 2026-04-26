---
read_when:
    - إقران Nodes الخاصة بـ iOS/Android مع gateway
    - استخدام canvas/camera الخاصة بـ node لسياق الوكيل
    - إضافة أوامر Node جديدة أو مساعدات CLI جديدة
summary: 'Nodes: الإقران، والقدرات، والأذونات، ومساعدات CLI لـ canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-26T11:34:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

**Node** هي جهاز مرافق (macOS/iOS/Android/عديم الواجهة) يتصل بـ Gateway عبر **WebSocket** (على المنفذ نفسه الخاص بالمشغلين) باستخدام `role: "node"` ويعرض سطح أوامر (مثل `canvas.*` و`camera.*` و`device.*` و`notifications.*` و`system.*`) عبر `node.invoke`. تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

النقل القديم: [بروتوكول Bridge](/ar/gateway/bridge-protocol) ‏(TCP JSONL؛
للاستخدام التاريخي فقط مع Nodes الحالية).

يمكن لـ macOS أيضًا العمل في **وضع node**: يتصل تطبيق شريط القوائم بخادم WS الخاص بـ Gateway
ويعرض أوامر canvas/camera المحلية الخاصة به كـ node (بحيث يعمل
`openclaw nodes …` على هذا الـ Mac). وفي وضع gateway البعيدة، تتم
أتمتة المتصفح بواسطة مضيف CLI الخاص بـ node (`openclaw node run` أو
خدمة node المثبتة)، وليس بواسطة node التطبيق الأصلية.

ملاحظات:

- Nodes هي **أجهزة طرفية**، وليست Gateways. فهي لا تشغّل خدمة gateway.
- تصل رسائل Telegram/WhatsApp/إلخ إلى **gateway**، وليس إلى Nodes.
- دليل استكشاف الأخطاء وإصلاحها: [/nodes/troubleshooting](/ar/nodes/troubleshooting)

## الإقران + الحالة

**تستخدم Nodes عبر WS إقران الأجهزة.** تعرض Nodes هوية جهاز أثناء `connect`؛ وتقوم Gateway
بإنشاء طلب إقران جهاز للدور `role: node`. اعتمده عبر CLI الخاص بالأجهزة (أو واجهة المستخدم).

CLI سريع:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

إذا أعادت node المحاولة مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيتم استبدال الطلب المعلق السابق وإنشاء `requestId` جديد. أعد تشغيل
`openclaw devices list` قبل الاعتماد.

ملاحظات:

- يضع `nodes status` علامة **paired** على node عندما يتضمن دور إقران الجهاز `node`.
- يُعد سجل إقران الجهاز هو عقد الدور المعتمد الدائم. ويظل
  تدوير الرمز ضمن هذا العقد؛ ولا يمكنه ترقية node مقترنة إلى
  دور مختلف لم يمنحه اعتماد الإقران أصلًا.
- `node.pair.*` ‏(CLI: `openclaw nodes pending/approve/reject/rename`) هو مخزن إقران منفصل للـ node تملكه gateway؛
  وهو **لا** يتحكم في مصافحة WS `connect`.
- يتبع نطاق الاعتماد الأوامر المعلنة في الطلب المعلق:
  - طلب بلا أوامر: `operator.pairing`
  - أوامر node غير exec: ‏`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`:
    ‏`operator.pairing` + `operator.admin`

## مضيف node البعيد (`system.run`)

استخدم **مضيف node** عندما تعمل Gateway على جهاز وتريد تنفيذ الأوامر
على جهاز آخر. لا يزال النموذج يتحدث إلى **gateway**؛ وتقوم gateway
بتمرير استدعاءات `exec` إلى **مضيف node** عند اختيار `host=node`.

### ما الذي يعمل وأين

- **مضيف Gateway**: يستقبل الرسائل، ويشغّل النموذج، ويوجه استدعاءات الأدوات.
- **مضيف Node**: ينفذ `system.run`/`system.which` على جهاز node.
- **الموافقات**: تُفرض على مضيف node عبر `~/.openclaw/exec-approvals.json`.

ملاحظة بخصوص الموافقات:

- ترتبط تشغيلات node المدعومة بالموافقة بسياق الطلب الدقيق.
- بالنسبة إلى تنفيذ shell/runtime المباشر للملفات، يربط OpenClaw أيضًا بأفضل جهد
  مُعامل ملف محليًا محددًا واحدًا ويمنع التشغيل إذا تغيّر ذلك الملف قبل التنفيذ.
- إذا لم يستطع OpenClaw تحديد ملف محلي ملموس واحد بدقة لأمر interpreter/runtime،
  فسيُرفض التنفيذ المدعوم بالموافقة بدلًا من التظاهر بتغطية runtime كاملة. استخدم sandboxing،
  أو مضيفين منفصلين، أو قائمة سماح/تدفق موثوق صريح لمعاني interpreter الأوسع.

### ابدأ مضيف node (في المقدمة)

على جهاز node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway بعيدة عبر نفق SSH (ربط loopback)

إذا كانت Gateway ترتبط بـ loopback (`gateway.bind=loopback`، وهو الافتراضي في الوضع المحلي)،
فلن تتمكن مضيفات node البعيدة من الاتصال مباشرة. أنشئ نفق SSH ووجّه
مضيف node إلى الطرف المحلي للنفق.

مثال (مضيف node -> مضيف gateway):

```bash
# الطرفية A (أبقها قيد التشغيل): مرّر المنفذ المحلي 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# الطرفية B: صدّر gateway token واتصل عبر النفق
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

ملاحظات:

- يدعم `openclaw node run` المصادقة بالرمز أو كلمة المرور.
- تُفضَّل متغيرات البيئة: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- الاحتياط من الإعداد هو `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، يتجاهل مضيف node عمدًا `gateway.remote.token` / `gateway.remote.password`.
- في الوضع البعيد، تكون `gateway.remote.token` / `gateway.remote.password` مؤهلتين وفق قواعد أولوية الوضع البعيد.
- إذا كانت SecretRefs النشطة في `gateway.auth.*` مضبوطة لكنها غير محلولة، فستفشل مصادقة مضيف node فشلًا مغلقًا.
- لا تحترم دقة مصادقة مضيف node إلا متغيرات البيئة `OPENCLAW_GATEWAY_*`.

### ابدأ مضيف node (خدمة)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### الإقران + التسمية

على مضيف gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

إذا أعادت node المحاولة مع تفاصيل مصادقة متغيرة، فأعد تشغيل `openclaw devices list`
واعتمد `requestId` الحالي.

خيارات التسمية:

- `--display-name` في `openclaw node run` / `openclaw node install` (يُحفَظ في `~/.openclaw/node.json` على node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (تجاوز من gateway).

### أضف الأوامر إلى قائمة السماح

تكون موافقات exec **لكل مضيف node**. أضف إدخالات قائمة السماح من gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

توجد الموافقات على مضيف node في `~/.openclaw/exec-approvals.json`.

### وجّه exec إلى node

اضبط القيم الافتراضية (إعداد gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

أو لكل جلسة:

```
/exec host=node security=allowlist node=<id-or-name>
```

بمجرد الضبط، فإن أي استدعاء `exec` مع `host=node` سيعمل على مضيف node (مع الخضوع لـ
قائمة السماح/الموافقات الخاصة بـ node).

لن يختار `host=auto` الـ node ضمنيًا من تلقاء نفسه، لكن يُسمح بطلب `host=node` صريح لكل استدعاء من `auto`. إذا كنت تريد أن يكون exec على node هو الافتراضي للجلسة، فاضبط `tools.exec.host=node` أو `/exec host=node ...` صراحة.

ذو صلة:

- [Node host CLI](/ar/cli/node)
- [أداة Exec](/ar/tools/exec)
- [موافقات Exec](/ar/tools/exec-approvals)

## استدعاء الأوامر

منخفض المستوى (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

توجد مساعدات أعلى مستوى لسير العمل الشائع من نوع “أعطِ الوكيل مرفق MEDIA”.

## لقطات الشاشة (لقطات canvas)

إذا كانت node تعرض Canvas ‏(WebView)، فإن `canvas.snapshot` تعيد `{ format, base64 }`.

مساعد CLI ‏(يكتب إلى ملف مؤقت ويطبع `MEDIA:<path>`):

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

- يقبل `canvas present` عناوين URL أو مسارات ملفات محلية (`--target`) بالإضافة إلى `--x/--y/--width/--height` اختياريًا لتحديد الموضع.
- يقبل `canvas eval` JavaScript مضمنة (`--js`) أو وسيطة موضعية.

### A2UI ‏(Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

ملاحظات:

- لا يتم دعم إلا A2UI v0.8 JSONL ‏(ويتم رفض v0.9/createSurface).

## الصور + الفيديوهات (كاميرا node)

الصور (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # الافتراضي: كلا الاتجاهين (سطران من MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

مقاطع الفيديو (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

ملاحظات:

- يجب أن تكون node **في المقدمة** لكي تعمل `canvas.*` و`camera.*` (ترجع الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE`).
- يتم تقييد مدة المقاطع (حاليًا `<= 60s`) لتجنب حمولات base64 كبيرة الحجم.
- سيطلب Android أذونات `CAMERA`/`RECORD_AUDIO` عندما يكون ذلك ممكنًا؛ وتفشل الأذونات المرفوضة مع `*_PERMISSION_REQUIRED`.

## تسجيلات الشاشة (Nodes)

تعرض Nodes المدعومة `screen.record` ‏(mp4). مثال:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

ملاحظات:

- يعتمد توفر `screen.record` على منصة node.
- يتم تقييد تسجيلات الشاشة إلى `<= 60s`.
- يعطّل `--no-audio` التقاط الميكروفون على المنصات المدعومة.
- استخدم `--screen <index>` لاختيار شاشة عرض عند وجود عدة شاشات.

## الموقع (Nodes)

تعرض Nodes الأمر `location.get` عندما يكون الموقع مفعّلًا في الإعدادات.

مساعد CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

ملاحظات:

- يكون الموقع **معطلًا افتراضيًا**.
- يتطلب وضع “Always” إذن النظام؛ ويكون الجلب في الخلفية بأفضل جهد.
- تتضمن الاستجابة lat/lon، والدقة (بالأمتار)، والطابع الزمني.

## SMS ‏(Nodes Android)

يمكن لـ Nodes Android عرض `sms.send` عندما يمنح المستخدم إذن **SMS** ويدعم الجهاز الاتصالات الهاتفية.

استدعاء منخفض المستوى:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

ملاحظات:

- يجب قبول مطالبة الإذن على جهاز Android قبل الإعلان عن هذه القدرة.
- لن تعلن الأجهزة التي تعمل عبر Wi‑Fi فقط ولا تدعم الاتصالات الهاتفية عن `sms.send`.

## أوامر جهاز Android والبيانات الشخصية

يمكن لـ Nodes Android الإعلان عن عائلات أوامر إضافية عند تفعيل القدرات المقابلة.

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

- تكون أوامر الحركة مقيّدة بالقدرات بحسب المستشعرات المتاحة.

## أوامر النظام (مضيف node / node mac)

تعرض Node الخاصة بـ macOS الأوامر `system.run` و`system.notify` و`system.execApprovals.get/set`.
ويعرض مضيف node عديم الواجهة الأوامر `system.run` و`system.which` و`system.execApprovals.get/set`.

أمثلة:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

ملاحظات:

- يعيد `system.run` القيم stdout/stderr/رمز الخروج ضمن الحمولة.
- يمر تنفيذ shell الآن عبر أداة `exec` مع `host=node`؛ وتبقى `nodes` سطح RPC المباشر للأوامر الصريحة الخاصة بـ node.
- لا يعرض `nodes invoke` الأمرين `system.run` أو `system.run.prepare`؛ إذ يظلان ضمن مسار exec فقط.
- يقوم مسار exec بإعداد `systemRunPlan` معياري قبل الموافقة. وبمجرد منح
  الموافقة، تمرر gateway هذه الخطة المخزنة، وليس أي حقول أمر/`cwd`/جلسة
  قام المستدعي بتحريرها لاحقًا.
- يحترم `system.notify` حالة إذن الإشعارات في تطبيق macOS.
- تستخدم البيانات الوصفية غير المعروفة لـ `platform` / `deviceFamily` في node قائمة سماح افتراضية محافظة تستبعد `system.run` و`system.which`. وإذا كنت تحتاج عمدًا إلى تلك الأوامر لمنصة غير معروفة، فأضفها صراحة عبر `gateway.nodes.allowCommands`.
- يدعم `system.run` الخيارات `--cwd` و`--env KEY=VAL` و`--command-timeout` و`--needs-screen-recording`.
- بالنسبة إلى أغلفة shell ‏(`bash|sh|zsh ... -c/-lc`)، تُختزل قيم `--env` المحددة بنطاق الطلب إلى قائمة سماح صريحة (`TERM` و`LANG` و`LC_*` و`COLORTERM` و`NO_COLOR` و`FORCE_COLOR`).
- بالنسبة إلى قرارات السماح الدائم في وضع allowlist، تحفظ أغلفة الإرسال المعروفة (`env` و`nice` و`nohup` و`stdbuf` و`timeout`) مسارات الملفات التنفيذية الداخلية بدلًا من مسارات الأغلفة. وإذا لم يكن فك التغليف آمنًا، فلن يُحفَظ أي إدخال في قائمة السماح تلقائيًا.
- على مضيفات node التي تعمل بنظام Windows وفي وضع allowlist، تتطلب تشغيلات shell-wrapper عبر `cmd.exe /c` موافقة (ولا يؤدي إدخال allowlist وحده إلى السماح التلقائي بصيغة الغلاف).
- يدعم `system.notify` الخيارين `--priority <passive|active|timeSensitive>` و`--delivery <system|overlay|auto>`.
- تتجاهل مضيفات node تجاوزات `PATH` وتزيل مفاتيح بدء التشغيل/الـ shell الخطرة (`DYLD_*` و`LD_*` و`NODE_OPTIONS` و`PYTHON*` و`PERL*` و`RUBYOPT` و`SHELLOPTS` و`PS4`). وإذا كنت تحتاج إلى إدخالات PATH إضافية، فاضبط بيئة خدمة مضيف node (أو ثبّت الأدوات في مواقع قياسية) بدلًا من تمرير `PATH` عبر `--env`.
- في وضع node على macOS، يكون `system.run` مقيّدًا بموافقات exec في تطبيق macOS ‏(الإعدادات → موافقات Exec).
  وتعمل أوضاع ask/allowlist/full بالطريقة نفسها التي يعمل بها مضيف node عديم الواجهة؛ وتعيد المطالبات المرفوضة `SYSTEM_RUN_DENIED`.
- على مضيف node عديم الواجهة، يكون `system.run` مقيّدًا بموافقات exec ‏(`~/.openclaw/exec-approvals.json`).

## ربط exec بـ node

عند توفر عدة Nodes، يمكنك ربط exec بـ node محددة.
وهذا يضبط الـ node الافتراضية لـ `exec host=node` (ويمكن تجاوزها لكل وكيل).

الافتراضي العام:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

تجاوز لكل وكيل:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

أزل الإعداد للسماح بأي node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## خريطة الأذونات

قد تتضمن Nodes خريطة `permissions` في `node.list` / `node.describe`، مفهرسة باسم الإذن (مثل `screenRecording` أو `accessibility`) مع قيم منطقية (`true` = ممنوح).

## مضيف node عديم الواجهة (متعدد المنصات)

يمكن لـ OpenClaw تشغيل **مضيف node عديم الواجهة** (بدون UI) يتصل عبر Gateway
WebSocket ويعرض `system.run` / `system.which`. ويكون هذا مفيدًا على Linux/Windows
أو لتشغيل node بسيطة إلى جانب خادم.

ابدأ تشغيله:

```bash
openclaw node run --host <gateway-host> --port 18789
```

ملاحظات:

- لا يزال الإقران مطلوبًا (ستعرض Gateway مطالبة إقران جهاز).
- يخزن مضيف node معرّف node الخاص به، والرمز، واسم العرض، ومعلومات اتصال gateway في `~/.openclaw/node.json`.
- تُفرض موافقات exec محليًا عبر `~/.openclaw/exec-approvals.json`
  (راجع [موافقات Exec](/ar/tools/exec-approvals)).
- على macOS، ينفذ مضيف node عديم الواجهة `system.run` محليًا افتراضيًا. اضبط
  `OPENCLAW_NODE_EXEC_HOST=app` لتوجيه `system.run` عبر مضيف exec في التطبيق المرافق؛ وأضف
  `OPENCLAW_NODE_EXEC_FALLBACK=0` لاشتراط وجود مضيف التطبيق والفشل بشكل مغلق إذا لم يكن متاحًا.
- أضف `--tls` / `--tls-fingerprint` عندما يستخدم Gateway WS بروتوكول TLS.

## وضع node على Mac

- يتصل تطبيق شريط القوائم في macOS بخادم Gateway WS كـ node (بحيث يعمل `openclaw nodes …` على هذا الـ Mac).
- في الوضع البعيد، يفتح التطبيق نفق SSH لمنفذ Gateway ويتصل بـ `localhost`.
