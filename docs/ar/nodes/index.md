---
read_when:
    - إقران عُقد iOS/Android بـ Gateway
    - استخدام عقد canvas/camera لسياق الوكيل
    - إضافة أوامر Node جديدة أو أدوات مساعدة لـ CLI
summary: 'العُقد: الاقتران، والإمكانات، والأذونات، ومساعدات CLI لـ canvas/camera/screen/device/notifications/system'
title: العُقَد
x-i18n:
    generated_at: "2026-07-03T09:39:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

العقدة **node** هي جهاز مصاحب (macOS/iOS/Android/بلا واجهة) يتصل بـ Gateway **WebSocket** (المنفذ نفسه الخاص بالمشغّلين) باستخدام `role: "node"` ويعرض سطح أوامر (مثل `canvas.*` و`camera.*` و`device.*` و`notifications.*` و`system.*`) عبر `node.invoke`. تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

النقل القديم: [بروتوكول Bridge](/ar/gateway/bridge-protocol) (TCP JSONL؛
تاريخي فقط للعقد الحالية).

يمكن لـ macOS أيضًا العمل في **وضع العقدة**: يتصل تطبيق شريط القوائم بخادم WS الخاص بـ Gateway ويعرض أوامر اللوحة/الكاميرا المحلية الخاصة به كعقدة (بحيث يعمل
`openclaw nodes …` على هذا Mac). في وضع Gateway البعيد، تتولى استضافة عقدة CLI (`openclaw node run` أو خدمة العقدة المثبّتة) أتمتة المتصفح، وليس عقدة التطبيق الأصلية.

ملاحظات:

- العقد هي **أجهزة طرفية**، وليست بوابات. لا تشغّل خدمة Gateway.
- تصل رسائل Telegram/WhatsApp/إلخ إلى **Gateway**، وليس إلى العقد.
- دليل استكشاف الأخطاء وإصلاحها: [/nodes/troubleshooting](/ar/nodes/troubleshooting)

## الاقتران + الحالة

**تستخدم عقد WS اقتران الأجهزة.** تعرض العقد هوية جهاز أثناء `connect`؛ وينشئ Gateway طلب اقتران جهاز لـ `role: node`. وافق عليه عبر CLI الأجهزة (أو واجهة المستخدم).

CLI سريع:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

إذا أعادت عقدة المحاولة مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)، فسيُستبدل الطلب المعلّق السابق ويُنشأ `requestId` جديد. أعد تشغيل
`openclaw devices list` قبل الموافقة.

ملاحظات:

- يضع `nodes status` علامة **مقترنة** على العقدة عندما يتضمن دور اقتران جهازها `node`.
- سجل اقتران الجهاز هو عقد الدور المعتمَد الدائم. يبقى تدوير الرمز داخل ذلك العقد؛ ولا يمكنه ترقية عقدة مقترنة إلى دور مختلف لم تمنحه موافقة الاقتران قط.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) هو مخزن منفصل لاقتران العقد تملكه Gateway؛ وهو **لا** يتحكم في مصافحة `connect` الخاصة بـ WS.
- يزيل `openclaw nodes remove --node <id|name|ip>` اقتران عقدة. وبالنسبة إلى عقدة مدعومة بجهاز، فإنه يسحب دور `node` الخاص بالجهاز في `devices/paired.json` ويفصل جلسات دور العقدة لذلك الجهاز — يحتفظ الجهاز متعدد الأدوار بصفه ويفقد دور `node` فقط، بينما يُحذف صف الجهاز ذي العقدة فقط. كما يمسح أي إدخال مطابق من مخزن اقتران العقد المنفصل المملوك لـ Gateway. قد يزيل `operator.pairing` صفوف العقد غير المشغّلة؛ ويحتاج مستدعي رمز جهاز يسحب دور عقدته الخاصة على جهاز متعدد الأدوار أيضًا إلى `operator.admin`.
- يتبع نطاق الموافقة الأوامر المعلنة في الطلب المعلّق:
  - طلب بلا أوامر: `operator.pairing`
  - أوامر عقدة غير تنفيذية: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## مضيف عقدة بعيد (system.run)

استخدم **مضيف عقدة** عندما يعمل Gateway على جهاز وتريد تنفيذ الأوامر على جهاز آخر. لا يزال النموذج يتحدث إلى **Gateway**؛ ويعيد Gateway توجيه استدعاءات `exec` إلى **مضيف العقدة** عند تحديد `host=node`.

### ما الذي يعمل وأين

- **مضيف Gateway**: يستقبل الرسائل، ويشغّل النموذج، ويوجّه استدعاءات الأدوات.
- **مضيف العقدة**: ينفذ `system.run`/`system.which` على جهاز العقدة.
- **الموافقات**: تُفرض على مضيف العقدة عبر `~/.openclaw/exec-approvals.json`.

ملاحظة الموافقة:

- تربط عمليات تشغيل العقد المدعومة بالموافقة سياق الطلب الدقيق.
- بالنسبة إلى عمليات تنفيذ ملفات shell/runtime المباشرة، يبذل OpenClaw أيضًا أفضل جهد لربط مُعامل ملف محلي ملموس واحد ويرفض التشغيل إذا تغيّر ذلك الملف قبل التنفيذ.
- إذا تعذر على OpenClaw تحديد ملف محلي ملموس واحد بالضبط لأمر مفسّر/runtime، فسيُرفض التنفيذ المدعوم بالموافقة بدلًا من ادعاء تغطية runtime كاملة. استخدم العزل، أو مضيفات منفصلة، أو قائمة سماح موثوقة صريحة/سير عمل كاملًا لدلالات المفسّر الأوسع.

### بدء مضيف عقدة (في المقدمة)

على جهاز العقدة:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway بعيد عبر نفق SSH (ربط loopback)

إذا كان Gateway مربوطًا بـ loopback (`gateway.bind=loopback`، الافتراضي في الوضع المحلي)، فلا يمكن لمضيفات العقد البعيدة الاتصال مباشرة. أنشئ نفق SSH ووجّه مضيف العقدة إلى الطرف المحلي للنفق.

مثال (مضيف العقدة -> مضيف Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

ملاحظات:

- يدعم `openclaw node run` المصادقة بالرمز أو كلمة المرور.
- يُفضَّل استخدام متغيرات البيئة: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- احتياطي الإعداد هو `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، يتجاهل مضيف العقدة عمدًا `gateway.remote.token` / `gateway.remote.password`.
- في الوضع البعيد، يكون `gateway.remote.token` / `gateway.remote.password` مؤهلين وفق قواعد أولوية البعيد.
- إذا كانت SecretRefs نشطة محلية لـ `gateway.auth.*` مكوّنة لكنها غير محلولة، تفشل مصادقة مضيف العقدة بشكل مغلق.
- لا يراعي حل مصادقة مضيف العقدة إلا متغيرات البيئة `OPENCLAW_GATEWAY_*`.

### بدء مضيف عقدة (خدمة)

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

إذا أعادت العقدة المحاولة مع تفاصيل مصادقة متغيرة، فأعد تشغيل `openclaw devices list`
ووافق على `requestId` الحالي.

خيارات التسمية:

- `--display-name` على `openclaw node run` / `openclaw node install` (يستمر في `~/.openclaw/node.json` على العقدة).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (تجاوز من Gateway).

### اسمح بالأوامر

موافقات exec هي **لكل مضيف عقدة**. أضف إدخالات قائمة السماح من Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

توجد الموافقات على مضيف العقدة في `~/.openclaw/exec-approvals.json`.

### وجّه exec إلى العقدة

اضبط الافتراضيات (إعداد Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

أو لكل جلسة:

```
/exec host=node security=allowlist node=<id-or-name>
```

بمجرد الضبط، يعمل أي استدعاء `exec` مع `host=node` على مضيف العقدة (خاضعًا لقائمة سماح/موافقات العقدة).

لن يختار `host=auto` العقدة ضمنيًا من تلقاء نفسه، لكن يُسمح بطلب `host=node` صريح لكل استدعاء من `auto`. إذا كنت تريد أن يكون exec على العقدة هو الافتراضي للجلسة، فاضبط `tools.exec.host=node` أو `/exec host=node ...` صراحة.

ذو صلة:

- [CLI مضيف العقدة](/ar/cli/node)
- [أداة exec](/ar/tools/exec)
- [موافقات exec](/ar/tools/exec-approvals)

### استدلال النموذج المحلي

يمكن لعقدة سطح مكتب أو خادم عرض نماذج قادرة على المحادثة من خادم Ollama يعمل على تلك العقدة. يستخدم الوكلاء أداة `node_inference` الخاصة بـ Plugin‏ Ollama لاكتشاف النماذج المثبّتة وتشغيل مطالبة محدودة عن بعد؛ ولا يحتاج Gateway إلى وصول شبكي مباشر إلى Ollama. راجع [استدلال Ollama المحلي على العقدة](/ar/providers/ollama#node-local-inference)
للإعداد، وتصفية النماذج، وأوامر التحقق المباشر.

## استدعاء الأوامر

مستوى منخفض (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

توجد مساعدين أعلى مستوى لسير عمل "منح الوكيل مرفق MEDIA" الشائع.

## سياسة الأوامر

يجب أن تجتاز أوامر العقد بوابتين قبل إمكان استدعائها:

1. يجب أن تعلن العقدة الأمر في قائمة WebSocket `connect.commands`.
2. يجب أن تسمح سياسة منصة Gateway بالأمر المعلن.

تسمح عقد Windows وmacOS المصاحبة افتراضيًا بأوامر معلنة آمنة مثل
`canvas.*` و`camera.list` و`location.get` و`screen.snapshot`.
العقد الموثوقة التي تعلن عن قدرة `talk` أو تعلن أوامر `talk.*`
تسمح أيضًا افتراضيًا بأوامر الضغط للتحدث المعلنة (`talk.ptt.start` و`talk.ptt.stop`
و`talk.ptt.cancel` و`talk.ptt.once`)، بغض النظر عن تسمية المنصة.
لا تزال الأوامر الخطرة أو الثقيلة الخصوصية مثل `camera.snap` و`camera.clip` و
`screen.record` تتطلب اشتراكًا صريحًا باستخدام
`gateway.nodes.allowCommands`. يتغلب `gateway.nodes.denyCommands` دائمًا على
الافتراضيات وإدخالات قائمة السماح الإضافية.

يمكن لأوامر العقد المملوكة لـ Plugin إضافة سياسة استدعاء عقدة في Gateway. تعمل تلك السياسة بعد فحص قائمة السماح وقبل التوجيه إلى العقدة، لذلك تشترك `node.invoke` الخام ومساعدات CLI وأدوات الوكيل المخصصة في حد إذن Plugin نفسه. لا تزال أوامر عقد Plugin الخطرة تتطلب اشتراكًا صريحًا عبر `gateway.nodes.allowCommands`.

بعد أن تغيّر عقدة قائمة أوامرها المعلنة، ارفض اقتران الجهاز القديم ووافق على الطلب الجديد كي يخزن Gateway لقطة الأوامر المحدثة.

## الإعداد (`openclaw.json`)

توجد الإعدادات المتعلقة بالعقد ضمن `gateway.nodes` و`tools.exec`:

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

استخدم أسماء أوامر العقد الدقيقة. يزيل `denyCommands` أمرًا حتى عندما كان افتراضي منصة أو إدخال `allowCommands` سيسمح به بخلاف ذلك. راجع
[مرجع إعداد Gateway](/ar/gateway/configuration-reference#gateway-field-details)
لتفاصيل حقول اقتران عقد Gateway وسياسة الأوامر.

تجاوز عقدة exec لكل وكيل:

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

إذا كانت العقدة تعرض Canvas (WebView)، فإن `canvas.snapshot` يعيد `{ format, base64 }`.

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

- يقبل `canvas present` عناوين URL أو مسارات ملفات محلية (`--target`)، إضافة إلى `--x/--y/--width/--height` الاختيارية للتموضع.
- يقبل `canvas eval` JS مضمنًا (`--js`) أو وسيطة موضعية.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

ملاحظات:

- تستخدم العُقد المحمولة صفحة A2UI مملوكة للتطبيق ومضمّنة للعرض القادر على تنفيذ الإجراءات.
- يُدعم فقط A2UI v0.8 JSONL (يُرفض v0.9/createSurface).
- يعرض iOS و Android صفحات Gateway Canvas البعيدة، لكن إجراءات أزرار A2UI لا تُرسل إلا من صفحة A2UI المملوكة للتطبيق والمضمّنة. تكون صفحات A2UI المستضافة على Gateway عبر HTTP/HTTPS للعرض فقط على عملاء الأجهزة المحمولة هؤلاء.

## الصور + مقاطع الفيديو (كاميرا العقدة)

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

- يجب أن تكون العقدة **في المقدمة** من أجل `canvas.*` و `camera.*` (تعيد الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE`).
- تُقيّد مدة المقطع (حاليًا `<= 60s`) لتجنب حمولات base64 كبيرة جدًا.
- سيطلب Android أذونات `CAMERA`/`RECORD_AUDIO` عندما يكون ذلك ممكنًا؛ تفشل الأذونات المرفوضة مع `*_PERMISSION_REQUIRED`.

## تسجيلات الشاشة (العُقد)

تعرض العُقد المدعومة `screen.record` (mp4). مثال:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

ملاحظات:

- يعتمد توفر `screen.record` على منصة العقدة.
- تُقيّد تسجيلات الشاشة إلى `<= 60s`.
- يعطّل `--no-audio` التقاط الميكروفون على المنصات المدعومة.
- استخدم `--screen <index>` لتحديد شاشة عندما تتوفر شاشات متعددة.

## الموقع (العُقد)

تعرض العُقد `location.get` عندما يكون الموقع مفعّلًا في الإعدادات.

مساعد CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

ملاحظات:

- الموقع **متوقف افتراضيًا**.
- يتطلب "دائمًا" إذنًا من النظام؛ والجلب في الخلفية يُنفّذ بأفضل جهد.
- تتضمن الاستجابة خط العرض/خط الطول، والدقة (بالأمتار)، والطابع الزمني.

## الرسائل النصية القصيرة (عُقد Android)

يمكن لعُقد Android عرض `sms.send` عندما يمنح المستخدم إذن **SMS** ويدعم الجهاز الاتصالات الهاتفية.

استدعاء منخفض المستوى:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

ملاحظات:

- يجب قبول طلب الإذن على جهاز Android قبل الإعلان عن الإمكانية.
- لن تعلن الأجهزة التي تعمل عبر Wi-Fi فقط ولا تدعم الاتصالات الهاتفية عن `sms.send`.

## أوامر جهاز Android + البيانات الشخصية

يمكن لعُقد Android الإعلان عن عائلات أوامر إضافية عند تفعيل الإمكانات المقابلة.

العائلات المتاحة:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` عندما تكون مشاركة التطبيقات المثبّتة مفعّلة في إعدادات Android
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

أمثلة استدعاء:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

ملاحظات:

- `device.apps` خيار اشتراك ويعيد التطبيقات الظاهرة في المشغّل افتراضيًا.
- أوامر الحركة مقيّدة بالإمكانات حسب المستشعرات المتاحة.

## أوامر النظام (مضيف العقدة / عقدة Mac)

تعرض عقدة macOS `system.run` و `system.notify` و `system.execApprovals.get/set`.
يعرض مضيف العقدة بلا واجهة `system.run` و `system.which` و `system.execApprovals.get/set`.

أمثلة:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

ملاحظات:

- يعيد `system.run` stdout/stderr/رمز الخروج في الحمولة.
- يمر تنفيذ الصدفة الآن عبر أداة `exec` مع `host=node`؛ وتبقى `nodes` سطح RPC المباشر لأوامر العقدة الصريحة.
- لا يعرّض `nodes invoke` الأمر `system.run` أو `system.run.prepare`؛ يبقيان على مسار exec فقط.
- يجهّز مسار exec خطة `systemRunPlan` معيارية قبل الموافقة. بمجرد منح
  الموافقة، يمرر Gateway تلك الخطة المخزنة، وليس أي حقول command/cwd/session
  معدّلة لاحقًا من المستدعي.
- يحترم `system.notify` حالة إذن الإشعارات في تطبيق macOS.
- تستخدم بيانات تعريف `platform` / `deviceFamily` غير المعروفة للعقدة قائمة سماح افتراضية محافظة تستبعد `system.run` و `system.which`. إذا كنت تحتاج عمدًا إلى هذه الأوامر لمنصة غير معروفة، فأضفها صراحة عبر `gateway.nodes.allowCommands`.
- يدعم `system.run` الخيارات `--cwd` و `--env KEY=VAL` و `--command-timeout` و `--needs-screen-recording`.
- بالنسبة لأغلفة الصدفة (`bash|sh|zsh ... -c/-lc`)، تُختزل قيم `--env` المحددة بنطاق الطلب إلى قائمة سماح صريحة (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- بالنسبة لقرارات السماح الدائم في وضع قائمة السماح، تحتفظ أغلفة الإرسال المعروفة (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) بمسارات الملفات التنفيذية الداخلية بدلًا من مسارات الأغلفة. إذا لم يكن فك الغلاف آمنًا، فلا يُحفظ أي إدخال في قائمة السماح تلقائيًا.
- على مضيفي عُقد Windows في وضع قائمة السماح، تتطلب عمليات تشغيل غلاف الصدفة عبر `cmd.exe /c` موافقة (لا يسمح إدخال قائمة السماح وحده بنموذج الغلاف تلقائيًا).
- يدعم `system.notify` الخيارين `--priority <passive|active|timeSensitive>` و `--delivery <system|overlay|auto>`.
- يتجاهل مضيفو العُقد تجاوزات `PATH` ويزيلون مفاتيح بدء التشغيل/الصدفة الخطرة (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). إذا كنت تحتاج إلى إدخالات PATH إضافية، فاضبط بيئة خدمة مضيف العقدة (أو ثبّت الأدوات في مواقع قياسية) بدلًا من تمرير `PATH` عبر `--env`.
- في وضع عقدة macOS، يكون `system.run` محكومًا بموافقات exec في تطبيق macOS (الإعدادات → موافقات Exec).
  تعمل أوضاع الطلب/قائمة السماح/الكامل بالطريقة نفسها كما في مضيف العقدة بلا واجهة؛ وتعيد المطالبات المرفوضة `SYSTEM_RUN_DENIED`.
- على مضيف العقدة بلا واجهة، يكون `system.run` محكومًا بموافقات exec (`~/.openclaw/exec-approvals.json`).

## ربط عقدة Exec

عندما تتوفر عُقد متعددة، يمكنك ربط exec بعقدة محددة.
يضبط هذا العقدة الافتراضية لـ `exec host=node` (ويمكن تجاوزه لكل وكيل).

الإعداد الافتراضي العام:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

تجاوز لكل وكيل:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

ألغِ الضبط للسماح بأي عقدة:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## خريطة الأذونات

قد تتضمن العُقد خريطة `permissions` في `node.list` / `node.describe`، مفهرسة باسم الإذن (مثل `screenRecording`, `accessibility`) مع قيم منطقية (`true` = ممنوح).

## مضيف العقدة بلا واجهة (عابر للمنصات)

يمكن لـ OpenClaw تشغيل **مضيف عقدة بلا واجهة** (دون واجهة مستخدم) يتصل بـ Gateway
WebSocket ويعرض `system.run` / `system.which`. هذا مفيد على Linux/Windows
أو لتشغيل عقدة محدودة بجانب خادم.

ابدأ تشغيله:

```bash
openclaw node run --host <gateway-host> --port 18789
```

ملاحظات:

- لا يزال الاقتران مطلوبًا (سيعرض Gateway مطالبة اقتران جهاز).
- يخزن مضيف العقدة معرّف العقدة، والرمز، واسم العرض، ومعلومات اتصال Gateway في `~/.openclaw/node.json`.
- تُفرض موافقات exec محليًا عبر `~/.openclaw/exec-approvals.json`
  (انظر [موافقات Exec](/ar/tools/exec-approvals)).
- على macOS، ينفذ مضيف العقدة بلا واجهة `system.run` محليًا افتراضيًا. عيّن
  `OPENCLAW_NODE_EXEC_HOST=app` لتوجيه `system.run` عبر مضيف exec في التطبيق المرافق؛ وأضف
  `OPENCLAW_NODE_EXEC_FALLBACK=0` لاشتراط مضيف التطبيق والفشل مغلقًا إذا لم يكن متاحًا.
- أضف `--tls` / `--tls-fingerprint` عندما يستخدم Gateway WS بروتوكول TLS.

## وضع عقدة Mac

- يتصل تطبيق شريط قوائم macOS بخادم Gateway WS كعقدة (لذلك يعمل `openclaw nodes …` مع جهاز Mac هذا).
- في الوضع البعيد، يفتح التطبيق نفق SSH لمنفذ Gateway ويتصل بـ `localhost`.
