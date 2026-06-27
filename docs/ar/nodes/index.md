---
read_when:
    - إقران عُقد iOS/Android بـ Gateway
    - استخدام عقدة canvas/camera لسياق الوكيل
    - إضافة أوامر Node جديدة أو أدوات مساعدة لـ CLI
summary: 'العُقَد: الاقتران، والإمكانات، والأذونات، ومساعدات CLI للوحة الرسم/الكاميرا/الشاشة/الجهاز/الإشعارات/النظام'
title: العُقَد
x-i18n:
    generated_at: "2026-06-27T17:55:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

**Node** هو جهاز مرافق (macOS/iOS/Android/بلا واجهة) يتصل بـ Gateway **WebSocket** (على المنفذ نفسه الخاص بالمشغلين) مع `role: "node"` ويعرض سطح أوامر (مثل `canvas.*` و`camera.*` و`device.*` و`notifications.*` و`system.*`) عبر `node.invoke`. تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

النقل القديم: [بروتوكول Bridge](/ar/gateway/bridge-protocol) (TCP JSONL؛
تاريخي فقط للعُقد الحالية).

يمكن لـ macOS أيضاً العمل في **وضع Node**: يتصل تطبيق شريط القوائم بخادم WS الخاص بـ Gateway
ويعرض أوامر canvas/camera المحلية الخاصة به كـ Node (لذلك
يعمل `openclaw nodes …` ضد جهاز Mac هذا). في وضع Gateway البعيد، تتولى
أتمتة المتصفح مضيف Node في CLI (`openclaw node run` أو
خدمة Node المثبتة)، وليس Node الخاص بالتطبيق الأصلي.

ملاحظات:

- العُقد هي **أجهزة طرفية**، وليست Gateways. إنها لا تشغل خدمة Gateway.
- تصل رسائل Telegram/WhatsApp/إلخ إلى **Gateway**، وليس إلى العُقد.
- دليل استكشاف الأخطاء وإصلاحها: [/nodes/troubleshooting](/ar/nodes/troubleshooting)

## الاقتران + الحالة

**تستخدم عُقد WS اقتران الأجهزة.** تعرض العُقد هوية جهاز أثناء `connect`؛ وينشئ Gateway
طلب اقتران جهاز لـ `role: node`. وافق عليه عبر CLI للأجهزة (أو الواجهة).

CLI سريع:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

إذا أعادت Node المحاولة بتفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)، فسيتم استبدال
الطلب المعلق السابق وإنشاء `requestId` جديد. أعد تشغيل
`openclaw devices list` قبل الموافقة.

ملاحظات:

- يضع `nodes status` علامة **مقترنة** على Node عندما يتضمن دور اقتران جهازها `node`.
- سجل اقتران الجهاز هو عقد الدور الموافق عليه الدائم. يبقى تدوير الرمز
  داخل ذلك العقد؛ ولا يمكنه ترقية Node مقترنة إلى
  دور مختلف لم تمنحه موافقة الاقتران.
- `node.pair.*` ‏(CLI: `openclaw nodes pending/approve/reject/remove/rename`) هو مخزن منفصل
  مملوك لـ Gateway لاقتران Node؛ وهو **لا** يضبط مصافحة `connect` الخاصة بـ WS.
- يزيل `openclaw nodes remove --node <id|name|ip>` اقتران Node. بالنسبة إلى
  Node مدعومة بجهاز، فإنه يلغي دور `node` للجهاز في `devices/paired.json`
  ويفصل جلسات دور Node الخاصة بذلك الجهاز — يحتفظ الجهاز متعدد الأدوار
  بصفه ويفقد فقط دور `node`، بينما يتم
  حذف صف جهاز Node فقط. كما يمسح أي إدخال مطابق من مخزن اقتران Node
  المنفصل المملوك لـ Gateway. قد يزيل `operator.pairing` صفوف Node غير المشغلة؛ ويحتاج
  مستدعي رمز الجهاز الذي يلغي دور Node الخاص به على جهاز متعدد الأدوار
  أيضاً إلى `operator.admin`.
- يتبع نطاق الموافقة الأوامر المعلنة في الطلب المعلق:
  - طلب بلا أوامر: `operator.pairing`
  - أوامر Node غير تنفيذية: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## مضيف Node البعيد (system.run)

استخدم **مضيف Node** عندما يعمل Gateway لديك على جهاز وتريد تنفيذ الأوامر
على جهاز آخر. لا يزال النموذج يتحدث إلى **Gateway**؛ ويعيد Gateway
توجيه استدعاءات `exec` إلى **مضيف Node** عند اختيار `host=node`.

### ما الذي يعمل وأين

- **مضيف Gateway**: يستقبل الرسائل، يشغل النموذج، ويوجه استدعاءات الأدوات.
- **مضيف Node**: ينفذ `system.run`/`system.which` على جهاز Node.
- **الموافقات**: تُفرض على مضيف Node عبر `~/.openclaw/exec-approvals.json`.

ملاحظة الموافقة:

- تربط تشغيلات Node المدعومة بالموافقة سياق الطلب الدقيق.
- بالنسبة إلى تنفيذات ملفات shell/runtime المباشرة، يبذل OpenClaw أيضاً أفضل جهد لربط معامل ملف محلي
  ملموس واحد ويرفض التشغيل إذا تغير ذلك الملف قبل التنفيذ.
- إذا تعذر على OpenClaw تحديد ملف محلي ملموس واحد بالضبط لأمر مفسر/Runtime،
  فسيتم رفض التنفيذ المدعوم بالموافقة بدلاً من ادعاء تغطية Runtime كاملة. استخدم العزل،
  أو مضيفين منفصلين، أو قائمة سماح موثوقة/سير عمل كامل صريح لدلالات مفسر أوسع.

### بدء مضيف Node (في المقدمة)

على جهاز Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway بعيد عبر نفق SSH (ربط loopback)

إذا كان Gateway يرتبط بـ loopback (`gateway.bind=loopback`، الافتراضي في الوضع المحلي)،
فلن تتمكن مضيفات Node البعيدة من الاتصال مباشرة. أنشئ نفق SSH ووجّه
مضيف Node إلى الطرف المحلي للنفق.

مثال (مضيف Node -> مضيف Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

ملاحظات:

- يدعم `openclaw node run` المصادقة بالرمز أو كلمة المرور.
- يفضل استخدام متغيرات البيئة: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- احتياطي الإعداد هو `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، يتجاهل مضيف Node عمداً `gateway.remote.token` / `gateway.remote.password`.
- في الوضع البعيد، تكون `gateway.remote.token` / `gateway.remote.password` مؤهلة حسب قواعد أولوية البعيد.
- إذا تم تكوين SecretRefs محلية نشطة من `gateway.auth.*` لكنها غير محلولة، تفشل مصادقة مضيف Node بشكل مغلق.
- لا يحترم حل مصادقة مضيف Node إلا متغيرات البيئة `OPENCLAW_GATEWAY_*`.

### بدء مضيف Node (خدمة)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### الاقتران + التسمية

على مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

إذا أعادت Node المحاولة بتفاصيل مصادقة متغيرة، فأعد تشغيل `openclaw devices list`
ووافق على `requestId` الحالي.

خيارات التسمية:

- `--display-name` في `openclaw node run` / `openclaw node install` (يستمر في `~/.openclaw/node.json` على Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (تجاوز من Gateway).

### السماح بالأوامر

موافقات Exec هي **لكل مضيف Node**. أضف إدخالات قائمة السماح من Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

توجد الموافقات على مضيف Node في `~/.openclaw/exec-approvals.json`.

### توجيه exec إلى Node

كوّن الإعدادات الافتراضية (إعداد Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

أو لكل جلسة:

```
/exec host=node security=allowlist node=<id-or-name>
```

بعد ضبطه، يعمل أي استدعاء `exec` مع `host=node` على مضيف Node (خاضعاً
لقائمة سماح/موافقات Node).

لن يختار `host=auto` الـ Node ضمنياً من تلقاء نفسه، لكن يُسمح بطلب صريح لكل استدعاء مع `host=node` من `auto`. إذا كنت تريد أن يكون تنفيذ Node هو الافتراضي للجلسة، فاضبط `tools.exec.host=node` أو `/exec host=node ...` صراحة.

ذو صلة:

- [CLI لمضيف Node](/ar/cli/node)
- [أداة Exec](/ar/tools/exec)
- [موافقات Exec](/ar/tools/exec-approvals)

## استدعاء الأوامر

مستوى منخفض (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

توجد مساعدات ذات مستوى أعلى لسير العمل الشائع "امنح الوكيل مرفق MEDIA".

## سياسة الأوامر

يجب أن تمر أوامر Node عبر بوابتين قبل إمكانية استدعائها:

1. يجب أن تعلن Node الأمر في قائمة WebSocket `connect.commands` الخاصة بها.
2. يجب أن تسمح سياسة منصة Gateway بالأمر المعلن.

تسمح عُقد Windows وmacOS المرافقة افتراضياً بأوامر معلنة آمنة مثل
`canvas.*` و`camera.list` و`location.get` و`screen.snapshot`.
كما تسمح العُقد الموثوقة التي تعلن قدرة `talk` أو تعلن أوامر `talk.*`
بأوامر اضغط-للتحدث المعلنة (`talk.ptt.start` و`talk.ptt.stop`
و`talk.ptt.cancel` و`talk.ptt.once`) افتراضياً، بغض النظر عن تسمية المنصة.
لا تزال الأوامر الخطرة أو كثيفة الخصوصية مثل `camera.snap` و`camera.clip` و
`screen.record` تتطلب اشتراكاً صريحاً عبر
`gateway.nodes.allowCommands`. تكون الغلبة دائماً لـ `gateway.nodes.denyCommands` على
الإعدادات الافتراضية وإدخالات قائمة السماح الإضافية.

يمكن لأوامر Node المملوكة لـ Plugin إضافة سياسة استدعاء Node في Gateway. تعمل تلك السياسة
بعد فحص قائمة السماح وقبل إعادة التوجيه إلى Node، بحيث تشترك
`node.invoke` الخام، ومساعدات CLI، وأدوات الوكيل المخصصة في حد
أذونات Plugin نفسه. لا تزال أوامر Node الخطرة الخاصة بـ Plugin تتطلب
اشتراكاً صريحاً عبر `gateway.nodes.allowCommands`.

بعد أن تغير Node قائمة الأوامر المعلنة الخاصة بها، ارفض اقتران الجهاز القديم
ووافق على الطلب الجديد حتى يخزن Gateway لقطة الأوامر المحدثة.

## الإعداد (`openclaw.json`)

توجد الإعدادات المتعلقة بـ Node تحت `gateway.nodes` و`tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

استخدم أسماء أوامر Node الدقيقة. يزيل `denyCommands` أمراً حتى عندما كان
الإعداد الافتراضي للمنصة أو إدخال `allowCommands` سيسمح به خلاف ذلك. راجع
[مرجع إعدادات Gateway](/ar/gateway/configuration-reference#gateway-field-details)
لتفاصيل حقول اقتران Node وسياسة الأوامر في Gateway.

تجاوز Node لتنفيذ exec لكل وكيل:

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

## لقطات الشاشة (لقطات canvas)

إذا كانت Node تعرض Canvas (WebView)، فسيعيد `canvas.snapshot` القيمة `{ format, base64 }`.

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

- يقبل `canvas present` عناوين URL أو مسارات ملفات محلية (`--target`)، بالإضافة إلى `--x/--y/--width/--height` الاختيارية لتحديد الموضع.
- يقبل `canvas eval` ‏JS مضمنة (`--js`) أو وسيطة موضعية.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

ملاحظات:

- تستخدم العُقد المحمولة صفحة A2UI مملوكة للتطبيق ومضمنة للعرض القادر على الإجراءات.
- لا يُدعم إلا A2UI v0.8 JSONL (يُرفض v0.9/createSurface).
- يعرض iOS وAndroid صفحات Gateway Canvas البعيدة، لكن إجراءات أزرار A2UI لا تُرسل إلا من صفحة A2UI المضمنة المملوكة للتطبيق. صفحات A2UI المستضافة على Gateway عبر HTTP/HTTPS مخصصة للعرض فقط على عملاء الجوال هؤلاء.

## الصور + مقاطع الفيديو (كاميرا Node)

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

- يجب أن تكون العقدة **في المقدمة** لاستخدام `canvas.*` و`camera.*` (تعيد الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE`).
- يتم تقييد مدة المقطع (حاليًا `<= 60s`) لتجنب حمولات base64 كبيرة جدًا.
- سيطلب Android أذونات `CAMERA`/`RECORD_AUDIO` عند الإمكان؛ وتفشل الأذونات المرفوضة مع `*_PERMISSION_REQUIRED`.

## تسجيلات الشاشة (العُقد)

تعرض العُقد المدعومة `screen.record` ‏(mp4). مثال:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

ملاحظات:

- يعتمد توفر `screen.record` على منصة العقدة.
- يتم تقييد تسجيلات الشاشة إلى `<= 60s`.
- يعطّل `--no-audio` التقاط الميكروفون على المنصات المدعومة.
- استخدم `--screen <index>` لاختيار شاشة عند توفر شاشات متعددة.

## الموقع (العُقد)

تعرض العُقد `location.get` عند تمكين الموقع في الإعدادات.

مساعد CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

ملاحظات:

- الموقع **متوقف افتراضيًا**.
- يتطلب "دائمًا" إذنًا من النظام؛ والجلب في الخلفية يُنفَّذ بأفضل جهد.
- تتضمن الاستجابة خط العرض/خط الطول، والدقة (بالأمتار)، والطابع الزمني.

## الرسائل القصيرة SMS (عُقد Android)

يمكن لعُقد Android عرض `sms.send` عندما يمنح المستخدم إذن **SMS** ويدعم الجهاز الاتصال الهاتفي.

استدعاء منخفض المستوى:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

ملاحظات:

- يجب قبول مطالبة الإذن على جهاز Android قبل الإعلان عن الإمكانية.
- لن تعلن الأجهزة التي تعمل عبر Wi-Fi فقط ولا تدعم الاتصال الهاتفي عن `sms.send`.

## أوامر جهاز Android والبيانات الشخصية

يمكن لعُقد Android الإعلان عن عائلات أوامر إضافية عند تمكين الإمكانات المقابلة.

العائلات المتاحة:

- `device.status`، `device.info`، `device.permissions`، `device.health`
- `device.apps` عند تمكين مشاركة التطبيقات المثبتة في إعدادات Android
- `notifications.list`، `notifications.actions`
- `photos.latest`
- `contacts.search`، `contacts.add`
- `calendar.events`، `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`، `motion.pedometer`

أمثلة على الاستدعاءات:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

ملاحظات:

- `device.apps` اختياري التفعيل ويعيد افتراضيا التطبيقات الظاهرة في المشغل.
- أوامر الحركة مقيّدة بالإمكانات حسب المستشعرات المتاحة.

## أوامر النظام (مضيف العقدة / عقدة Mac)

تعرض عقدة macOS الأوامر `system.run` و`system.notify` و`system.execApprovals.get/set`.
يعرض مضيف العقدة بلا واجهة الأوامر `system.run` و`system.which` و`system.execApprovals.get/set`.

أمثلة:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

ملاحظات:

- يعيد `system.run` المخرجات القياسية/مخرجات الخطأ/رمز الخروج ضمن الحمولة.
- يمر تنفيذ الصدفة الآن عبر أداة `exec` مع `host=node`؛ وتبقى `nodes` سطح RPC المباشر لأوامر العقدة الصريحة.
- لا يكشف `nodes invoke` عن `system.run` أو `system.run.prepare`؛ فهما يبقيان على مسار exec فقط.
- يجهز مسار exec خطة `systemRunPlan` معيارية قبل الموافقة. بمجرد منح
  الموافقة، يمرر Gateway تلك الخطة المخزنة، وليس أي حقول command/cwd/session
  يعدلها المستدعي لاحقا.
- يحترم `system.notify` حالة إذن الإشعارات في تطبيق macOS.
- تستخدم بيانات تعريف `platform` / `deviceFamily` غير المعروفة للعقدة قائمة سماح افتراضية محافظة تستبعد `system.run` و`system.which`. إذا كنت تحتاج عمدا إلى تلك الأوامر لمنصة غير معروفة، فأضفها صراحة عبر `gateway.nodes.allowCommands`.
- يدعم `system.run` الخيارات `--cwd` و`--env KEY=VAL` و`--command-timeout` و`--needs-screen-recording`.
- بالنسبة إلى مغلفات الصدفة (`bash|sh|zsh ... -c/-lc`)، تخفض قيم `--env` ذات نطاق الطلب إلى قائمة سماح صريحة (`TERM` و`LANG` و`LC_*` و`COLORTERM` و`NO_COLOR` و`FORCE_COLOR`).
- في قرارات السماح الدائم ضمن وضع قائمة السماح، تحفظ مغلفات الإرسال المعروفة (`env` و`flock` و`nice` و`nohup` و`stdbuf` و`timeout`) مسارات الملفات التنفيذية الداخلية بدلا من مسارات المغلفات. إذا لم يكن فك التغليف آمنا، فلا يستمر أي إدخال قائمة سماح تلقائيا.
- على مضيفي عقد Windows في وضع قائمة السماح، تتطلب عمليات تشغيل مغلف الصدفة عبر `cmd.exe /c` موافقة (إدخال قائمة السماح وحده لا يسمح تلقائيا بصيغة المغلف).
- يدعم `system.notify` الخيارين `--priority <passive|active|timeSensitive>` و`--delivery <system|overlay|auto>`.
- تتجاهل مضيفات العقد تجاوزات `PATH` وتزيل مفاتيح بدء التشغيل/الصدفة الخطرة (`DYLD_*` و`LD_*` و`BASHOPTS` و`FPATH` و`KSH_ENV` و`NODE_OPTIONS` و`NODE_REDIRECT_WARNINGS` و`NODE_REPL_EXTERNAL_MODULE` و`NODE_REPL_HISTORY` و`NODE_V8_COVERAGE` و`PYTHON*` و`PERL*` و`RUBYOPT` و`SHELLOPTS` و`PS4` و`TCLLIBPATH`). إذا كنت تحتاج إلى إدخالات PATH إضافية، فكوّن بيئة خدمة مضيف العقدة (أو ثبّت الأدوات في مواقع قياسية) بدلا من تمرير `PATH` عبر `--env`.
- في وضع عقدة macOS، يكون `system.run` مقيّدا بموافقات exec في تطبيق macOS (Settings → Exec approvals).
  تعمل ask/allowlist/full بالطريقة نفسها كما في مضيف العقدة بلا واجهة؛ وتعيد مطالبات الرفض `SYSTEM_RUN_DENIED`.
- على مضيف العقدة بلا واجهة، يكون `system.run` مقيّدا بموافقات exec (`~/.openclaw/exec-approvals.json`).

## ربط عقدة exec

عند توفر عدة عقد، يمكنك ربط exec بعقدة معينة.
يضبط هذا العقدة الافتراضية لـ `exec host=node` (ويمكن تجاوزه لكل وكيل).

الافتراضي العام:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

تجاوز لكل وكيل:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

ألغ الضبط للسماح بأي عقدة:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## خريطة الأذونات

قد تتضمن العقد خريطة `permissions` في `node.list` / `node.describe`، مفهرسة باسم الإذن (مثل `screenRecording` و`accessibility`) مع قيم منطقية (`true` = ممنوح).

## مضيف العقدة بلا واجهة (متعدد المنصات)

يمكن لـ OpenClaw تشغيل **مضيف عقدة بلا واجهة** (دون UI) يتصل بـ Gateway
WebSocket ويعرض `system.run` / `system.which`. هذا مفيد على Linux/Windows
أو لتشغيل عقدة صغيرة إلى جانب خادم.

ابدأ تشغيله:

```bash
openclaw node run --host <gateway-host> --port 18789
```

ملاحظات:

- لا يزال الاقتران مطلوبا (سيعرض Gateway مطالبة اقتران جهاز).
- يخزن مضيف العقدة معرف عقدته، والرمز المميز، واسم العرض، ومعلومات اتصال Gateway في `~/.openclaw/node.json`.
- تفرض موافقات exec محليا عبر `~/.openclaw/exec-approvals.json`
  (انظر [موافقات Exec](/ar/tools/exec-approvals)).
- على macOS، ينفذ مضيف العقدة بلا واجهة `system.run` محليا افتراضيا. اضبط
  `OPENCLAW_NODE_EXEC_HOST=app` لتوجيه `system.run` عبر مضيف exec في التطبيق المرافق؛ وأضف
  `OPENCLAW_NODE_EXEC_FALLBACK=0` لاشتراط مضيف التطبيق والفشل المغلق إذا كان غير متاح.
- أضف `--tls` / `--tls-fingerprint` عندما يستخدم Gateway WS بروتوكول TLS.

## وضع عقدة Mac

- يتصل تطبيق شريط قوائم macOS بخادم Gateway WS كعقدة (لذلك يعمل `openclaw nodes …` ضد جهاز Mac هذا).
- في الوضع البعيد، يفتح التطبيق نفق SSH لمنفذ Gateway ويتصل بـ `localhost`.
