---
read_when:
    - إقران Nodes ‏iOS/Android مع gateway
    - استخدام canvas/camera الخاصة بـ Node من أجل سياق الوكيل
    - إضافة أوامر Node أو مساعدات CLI جديدة
summary: 'Nodes: الاقتران، والقدرات، والأذونات، ومساعدات CLI الخاصة بـ canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-24T07:50:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

إن **Node** هي جهاز مرافق (macOS/iOS/Android/headless) يتصل بـ Gateway عبر **WebSocket** ‏(المنفذ نفسه الخاص بالمشغّلين) باستخدام `role: "node"` ويكشف سطح أوامر (مثل `canvas.*` و`camera.*` و`device.*` و`notifications.*` و`system.*`) عبر `node.invoke`. تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

وسيلة النقل القديمة: [بروتوكول Bridge](/ar/gateway/bridge-protocol) ‏(‏TCP JSONL؛
تاريخي فقط بالنسبة إلى Nodes الحالية).

يمكن لـ macOS أيضًا العمل في **وضع node**: إذ يتصل تطبيق شريط القوائم بخادم WS الخاص بـ Gateway ويكشف أوامر canvas/camera المحلية الخاصة به باعتبارها node ‏(بحيث تعمل أوامر `openclaw nodes …` على هذا الـ Mac).

ملاحظات:

- تُعد Nodes **أجهزة طرفية**، وليست Gateways. فهي لا تشغّل خدمة gateway.
- تصل رسائل Telegram/WhatsApp/... إلى **gateway**، وليس إلى Nodes.
- دليل استكشاف الأخطاء وإصلاحها: [/nodes/troubleshooting](/ar/nodes/troubleshooting)

## الاقتران + الحالة

**تستخدم WS Nodes اقتران الأجهزة.** تعرض Nodes هوية جهاز أثناء `connect`؛ وينشئ Gateway
طلب اقتران جهاز للدور `role: node`. وافق عليه عبر CLI الخاصة بالأجهزة (أو واجهة المستخدم).

CLI سريعة:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

إذا أعادت node المحاولة مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيتم استبدال الطلب المعلّق السابق وإنشاء `requestId` جديد.
أعد تشغيل `openclaw devices list` قبل الموافقة.

ملاحظات:

- تضع `nodes status` علامة **paired** على node عندما يتضمن دور اقتران الجهاز القيمة `node`.
- سجل اقتران الجهاز هو العقد الدائم للأدوار الموافق عليها. ويظل
  تدوير الرمز داخل هذا العقد؛ ولا يمكنه ترقية node مقترنة إلى
  دور مختلف لم تمنحه موافقة الاقتران أصلًا.
- يشير `node.pair.*` ‏(CLI: ‏`openclaw nodes pending/approve/reject/rename`) إلى مخزن اقتران
  منفصل تملكه gateway؛ وهو لا يتحكم في مصافحة WS `connect`.
- يتبع نطاق الموافقة الأوامر المعلنة في الطلب المعلّق:
  - طلب بلا أوامر: `operator.pairing`
  - أوامر node غير الخاصة بـ exec: ‏`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: ‏`operator.pairing` + `operator.admin`

## مضيف node بعيد (`system.run`)

استخدم **مضيف node** عندما تعمل Gateway على جهاز واحد وتريد تنفيذ الأوامر
على جهاز آخر. ولا يزال النموذج يتحدث إلى **gateway**؛ وتقوم gateway
بإعادة توجيه استدعاءات `exec` إلى **مضيف node** عند اختيار `host=node`.

### ما الذي يعمل وأين

- **مضيف Gateway**: يستقبل الرسائل، ويشغّل النموذج، ويوجّه استدعاءات الأدوات.
- **مضيف Node**: ينفّذ `system.run`/`system.which` على جهاز node.
- **الموافقات**: تُفرض على مضيف node عبر `~/.openclaw/exec-approvals.json`.

ملاحظة الموافقة:

- تربط التشغيلات الخاصة بـ node والمدعومة بالموافقة سياق الطلب الدقيق.
- بالنسبة إلى عمليات تنفيذ shell/runtime المباشرة للملفات، يربط OpenClaw أيضًا بأفضل جهد
  معامل ملف محلي ملموسًا واحدًا ويرفض التشغيل إذا تغيّر ذلك الملف قبل التنفيذ.
- إذا لم يتمكن OpenClaw من تحديد ملف محلي ملموس واحد بالضبط لأمر مترجم/وقت تشغيل،
  فسيتم رفض التنفيذ المدعوم بالموافقة بدلًا من التظاهر بتغطية كاملة لوقت التشغيل. استخدم Sandboxing،
  أو مضيفين منفصلين، أو allowlist/full workflow موثوقة وصريحة لدلالات المترجم الأوسع.

### بدء مضيف node ‏(في المقدمة)

على جهاز node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway بعيدة عبر نفق SSH ‏(ربط loopback)

إذا كانت Gateway مرتبطة على loopback ‏(`gateway.bind=loopback`، وهو الافتراضي في الوضع المحلي)،
فلا يمكن لمضيفات node البعيدة الاتصال مباشرةً. أنشئ نفق SSH ووجّه
مضيف node إلى النهاية المحلية لذلك النفق.

مثال (مضيف node -> مضيف gateway):

```bash
# الطرفية A (اتركها تعمل): مرّر 18790 المحلي -> gateway ‏127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# الطرفية B: صدّر رمز gateway واتصل عبر النفق
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

ملاحظات:

- يدعم `openclaw node run` المصادقة بالرمز أو كلمة المرور.
- تُفضَّل متغيرات البيئة: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- الرجوع الاحتياطي في الإعدادات هو `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، يتجاهل مضيف node عمدًا `gateway.remote.token` / `gateway.remote.password`.
- في الوضع البعيد، تكون `gateway.remote.token` / `gateway.remote.password` مؤهلة وفق قواعد أولوية الوضع البعيد.
- إذا كانت SecretRefs النشطة في `gateway.auth.*` مهيأة ولكن غير محلولة، فإن مصادقة مضيف node تفشل بشكل مغلق.
- لا يحترم حل مصادقة مضيف node إلا متغيرات البيئة `OPENCLAW_GATEWAY_*`.

### بدء مضيف node ‏(كخدمة)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### الاقتران + التسمية

على مضيف gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

إذا أعادت node المحاولة مع تفاصيل مصادقة متغيرة، فأعد تشغيل `openclaw devices list`
ووافق على `requestId` الحالية.

خيارات التسمية:

- `--display-name` على `openclaw node run` / `openclaw node install` ‏(يُحفظ في `~/.openclaw/node.json` على node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` ‏(تجاوز من gateway).

### إضافة الأوامر إلى allowlist

تكون موافقات Exec **لكل مضيف node**. أضف إدخالات allowlist من gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

توجد الموافقات على مضيف node في `~/.openclaw/exec-approvals.json`.

### توجيه exec إلى node

اضبط القيم الافتراضية (إعدادات gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

أو لكل جلسة:

```
/exec host=node security=allowlist node=<id-or-name>
```

بمجرد ضبط ذلك، فإن أي استدعاء `exec` مع `host=node` يعمل على مضيف node ‏(مع مراعاة
allowlist/الموافقات الخاصة بـ node).

لن يختار `host=auto` الـ node ضمنيًا من تلقاء نفسه، لكن يُسمح بطلب صريح لكل استدعاء باستخدام `host=node` انطلاقًا من `auto`. وإذا كنت تريد أن يكون exec على node هو الافتراضي للجلسة، فاضبط `tools.exec.host=node` أو `/exec host=node ...` صراحةً.

ذو صلة:

- [CLI الخاص بمضيف Node](/ar/cli/node)
- [أداة Exec](/ar/tools/exec)
- [موافقات Exec](/ar/tools/exec-approvals)

## استدعاء الأوامر

مستوى منخفض (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

توجد مساعدات على مستوى أعلى لسير العمل الشائع من نوع "أعطِ الوكيل مرفق MEDIA".

## لقطات الشاشة (لقطات canvas)

إذا كانت node تعرض Canvas ‏(WebView)، فإن `canvas.snapshot` يعيد `{ format, base64 }`.

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

- تقبل `canvas present` عناوين URL أو مسارات ملفات محلية (`--target`)، بالإضافة إلى `--x/--y/--width/--height` اختياريًا لتحديد الموضع.
- تقبل `canvas eval` JavaScript مضمنة (`--js`) أو وسيطة موضعية.

### A2UI ‏(Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

ملاحظات:

- لا يتم دعم إلا JSONL الخاصة بـ A2UI v0.8 ‏(ويتم رفض v0.9/createSurface).

## الصور + الفيديوهات (كاميرا node)

الصور (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # الافتراضي: كلا الاتجاهين (سطران MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

مقاطع الفيديو (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

ملاحظات:

- يجب أن تكون node **في المقدمة** بالنسبة إلى `canvas.*` و`camera.*` ‏(تعيد الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE`).
- يتم تقييد مدة المقطع (حاليًا `<= 60s`) لتجنب حمولات base64 كبيرة الحجم.
- سيطلب Android أذونات `CAMERA`/`RECORD_AUDIO` عندما يكون ذلك ممكنًا؛ وتفشل الأذونات المرفوضة مع `*_PERMISSION_REQUIRED`.

## تسجيلات الشاشة (Nodes)

تكشف Nodes المدعومة `screen.record` ‏(`mp4`). مثال:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

ملاحظات:

- يعتمد توفر `screen.record` على منصة node.
- يتم تقييد تسجيلات الشاشة إلى `<= 60s`.
- يعطّل `--no-audio` التقاط الميكروفون على المنصات المدعومة.
- استخدم `--screen <index>` لاختيار شاشة عند توفر عدة شاشات.

## الموقع (Nodes)

تكشف Nodes الأمر `location.get` عندما يكون Location مفعّلًا في الإعدادات.

مساعد CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

ملاحظات:

- يكون Location **معطّلًا افتراضيًا**.
- يتطلب "Always" إذن النظام؛ ويكون الجلب في الخلفية بأفضل جهد.
- تتضمن الاستجابة خطوط العرض/الطول، والدقة (بالمتر)، والطابع الزمني.

## SMS ‏(Nodes Android)

يمكن لـ Nodes Android كشف `sms.send` عندما يمنح المستخدم إذن **SMS** ويدعم الجهاز الاتصالات الهاتفية.

استدعاء منخفض المستوى:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

ملاحظات:

- يجب قبول مطالبة الإذن على جهاز Android قبل الإعلان عن القدرة.
- لن تعلن الأجهزة التي تعمل عبر Wi‑Fi فقط ومن دون اتصالات هاتفية عن `sms.send`.

## أوامر جهاز Android والبيانات الشخصية

يمكن لـ Nodes Android الإعلان عن عائلات أوامر إضافية عند تمكين القدرات المقابلة.

العائلات المتاحة:

- `device.status` و`device.info` و`device.permissions` و`device.health`
- `notifications.list` و`notifications.actions`
- `photos.latest`
- `contacts.search` و`contacts.add`
- `calendar.events` و`calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity` و`motion.pedometer`

أمثلة على الاستدعاءات:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

ملاحظات:

- تكون أوامر الحركة مقيّدة بالقدرة وفق المستشعرات المتاحة.

## أوامر النظام (مضيف node / mac node)

تكشف macOS node الأوامر `system.run` و`system.notify` و`system.execApprovals.get/set`.
ويكشف مضيف node بلا واجهة الأوامر `system.run` و`system.which` و`system.execApprovals.get/set`.

أمثلة:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

ملاحظات:

- تعيد `system.run` ‏stdout/stderr/رمز الخروج داخل الحمولة.
- يمر تنفيذ shell الآن عبر أداة `exec` مع `host=node`؛ بينما تبقى `nodes` السطح المباشر لـ RPC لأوامر node الصريحة.
- لا تكشف `nodes invoke` الأمرين `system.run` أو `system.run.prepare`؛ إذ يبقيان على مسار exec فقط.
- يجهّز مسار exec القيمة `systemRunPlan` القانونية قبل الموافقة. وبعد منح
  الموافقة، تعيد gateway توجيه تلك الخطة المخزنة، وليس أي حقول أمر/‏cwd/‏جلسة
  عدّلها المستدعي لاحقًا.
- تحترم `system.notify` حالة أذونات الإشعارات في تطبيق macOS.
- تستخدم البيانات الوصفية غير المعروفة الخاصة بـ `platform` / `deviceFamily` في node قيمة allowlist افتراضية محافظة تستبعد `system.run` و`system.which`. وإذا كنت تحتاج عمدًا إلى هذه الأوامر لمنصة غير معروفة، فأضفها صراحةً عبر `gateway.nodes.allowCommands`.
- تدعم `system.run` الخيارات `--cwd` و`--env KEY=VAL` و`--command-timeout` و`--needs-screen-recording`.
- بالنسبة إلى wrappers الخاصة بـ shell ‏(`bash|sh|zsh ... -c/-lc`)، يتم تقليص قيم `--env` ذات نطاق الطلب إلى allowlist صريحة (`TERM` و`LANG` و`LC_*` و`COLORTERM` و`NO_COLOR` و`FORCE_COLOR`).
- بالنسبة إلى قرارات السماح الدائم في وضع allowlist، تحتفظ dispatch wrappers المعروفة (`env` و`nice` و`nohup` و`stdbuf` و`timeout`) بمسارات الملفات التنفيذية الداخلية بدلًا من مسارات wrapper. وإذا لم يكن فكّ التغليف آمنًا، فلن يتم الاحتفاظ بأي إدخال allowlist تلقائيًا.
- على مضيفات node في Windows في وضع allowlist، تتطلب تشغيلات wrapper الخاصة بـ shell عبر `cmd.exe /c` موافقة (فإدخال allowlist وحده لا يسمح تلقائيًا بشكل wrapper).
- تدعم `system.notify` الخيارين `--priority <passive|active|timeSensitive>` و`--delivery <system|overlay|auto>`.
- تتجاهل مضيفات Node تجاوزات `PATH` وتزيل مفاتيح startup/shell الخطرة (`DYLD_*` و`LD_*` و`NODE_OPTIONS` و`PYTHON*` و`PERL*` و`RUBYOPT` و`SHELLOPTS` و`PS4`). وإذا كنت تحتاج إلى إدخالات PATH إضافية، فاضبط بيئة خدمة مضيف node (أو ثبّت الأدوات في مواقع قياسية) بدلًا من تمرير `PATH` عبر `--env`.
- في وضع macOS node، يكون `system.run` محكومًا بموافقات exec داخل تطبيق macOS ‏(Settings → Exec approvals).
  وتتصرّف أوضاع ask/allowlist/full بالطريقة نفسها كما في مضيف node بلا واجهة؛ وتعيد المطالبات المرفوضة القيمة `SYSTEM_RUN_DENIED`.
- في مضيف node بلا واجهة، يكون `system.run` محكومًا بموافقات exec ‏(`~/.openclaw/exec-approvals.json`).

## ربط exec بـ node

عندما تكون عدة Nodes متاحة، يمكنك ربط exec بـ node محددة.
وهذا يضبط node الافتراضية لـ `exec host=node` ‏(ويمكن تجاوزها لكل وكيل).

القيمة الافتراضية العامة:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

تجاوز لكل وكيل:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

أزل التعيين للسماح بأي node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## خريطة الأذونات

قد تتضمن Nodes خريطة `permissions` في `node.list` / `node.describe`، مفاتيحها أسماء الأذونات (مثل `screenRecording` و`accessibility`) وقيمها منطقية (`true` = ممنوح).

## مضيف node بلا واجهة (متعدد المنصات)

يمكن لـ OpenClaw تشغيل **مضيف node بلا واجهة** ‏(من دون واجهة مستخدم) يتصل بـ Gateway
WebSocket ويكشف `system.run` / `system.which`. ويُعد ذلك مفيدًا على Linux/Windows
أو عند تشغيل node بسيطة إلى جانب خادم.

ابدأه:

```bash
openclaw node run --host <gateway-host> --port 18789
```

ملاحظات:

- لا يزال الاقتران مطلوبًا (ستعرض Gateway مطالبة اقتران جهاز).
- يخزّن مضيف node معرّف node والرمز والاسم المعروض ومعلومات اتصال gateway في `~/.openclaw/node.json`.
- تُفرض موافقات Exec محليًا عبر `~/.openclaw/exec-approvals.json`
  (راجع [موافقات Exec](/ar/tools/exec-approvals)).
- على macOS، ينفّذ مضيف node بلا واجهة الأمر `system.run` محليًا افتراضيًا. اضبط
  `OPENCLAW_NODE_EXEC_HOST=app` لتوجيه `system.run` عبر مضيف exec في التطبيق المرافق؛ وأضف
  `OPENCLAW_NODE_EXEC_FALLBACK=0` لاشتراط مضيف التطبيق والفشل بشكل مغلق إذا لم يكن متاحًا.
- أضف `--tls` / `--tls-fingerprint` عندما يستخدم Gateway WS بروتوكول TLS.

## وضع mac node

- يتصل تطبيق شريط القوائم في macOS بخادم Gateway WS باعتباره node ‏(بحيث تعمل أوامر `openclaw nodes …` على هذا الـ Mac).
- في الوضع البعيد، يفتح التطبيق نفق SSH لمنفذ Gateway ويتصل بـ `localhost`.
