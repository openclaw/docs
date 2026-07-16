---
read_when:
    - تشغيل مضيف Node بلا واجهة رسومية
    - إقران Node يعمل بنظام غير macOS لاستخدام system.run
summary: مرجع CLI لـ `openclaw node` (مضيف Node بلا واجهة رسومية)
title: Node
x-i18n:
    generated_at: "2026-07-16T14:02:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

شغّل **مضيف Node بلا واجهة رسومية** يتصل بـ WebSocket الخاص بـ Gateway ويتيح
`system.run` / `system.which` على هذا الجهاز.

على macOS، يضمّن تطبيق شريط القوائم بالفعل بيئة تشغيل مضيف Node هذه ضمن اتصال
Node الخاص به، ويضيف إمكانات Mac الأصلية. استخدم `openclaw node run` على جهاز
Mac فقط عندما تريد عمدًا Node بلا واجهة رسومية من دون التطبيق. يؤدي تشغيل
كليهما إلى إنشاء هويتين لـ Node على الجهاز نفسه.

## لماذا تستخدم مضيف Node؟

استخدم مضيف Node عندما تريد من الوكلاء **تشغيل أوامر على أجهزة أخرى** في
شبكتك من دون تثبيت تطبيق macOS مرافق كامل عليها.

حالات الاستخدام الشائعة:

- تشغيل الأوامر على أجهزة Linux/Windows بعيدة (خوادم البناء، وأجهزة المختبر، وNAS).
- إبقاء exec **داخل بيئة معزولة** على Gateway، مع تفويض عمليات التشغيل المعتمدة إلى مضيفين آخرين.
- توفير هدف تنفيذ خفيف وبلا واجهة رسومية للأتمتة أو عُقد CI.

يظل التنفيذ محميًا بواسطة **موافقات exec** وقوائم السماح الخاصة بكل وكيل على
مضيف Node، بحيث يمكنك إبقاء الوصول إلى الأوامر محدود النطاق وصريحًا.

يمكن لـ `openclaw node run` نشر أدوات مدعومة بإضافة أو MCP بعد اتصاله.
يثق Gateway افتراضيًا بالواصفات الواردة من Node المقترن، مع اشتراط بقاء
أمر كل واصف ضمن سطح الأوامر المعتمد في Node. يرى الوكيل كل واصف مقبول
بوصفه أداة إضافة عادية، لكن التنفيذ يظل يمر عبر `node.invoke`، لذا تؤدي
إزالة اتصال Node إلى إزالة الأداة من عمليات تشغيل الوكيل الجديدة. يمكن لمشغّلي
Gateway تعطيل النشر باستخدام `gateway.nodes.pluginTools.enabled: false`.

بالنسبة إلى أدوات MCP التعريفية، أضف بنية خادم MCP المعتادة ضمن
`nodeHost.mcp.servers` في `openclaw.json` على جهاز Node، ثم أعد تشغيل
مضيف Node. يعلن Node عن عائلة أوامر `mcp.tools.call.v1` الخاضعة للموافقة
وينشر الأدوات المدرجة بعد الاتصال؛ ولا يتطلب تغيير قائمة الخوادم لاحقًا
إعادة الاقتران. راجع
[خوادم MCP المستضافة على Node](/ar/nodes#node-hosted-mcp-servers).

## وكيل المتصفح (دون إعداد)

تعلن مضيفات Node تلقائيًا عن وكيل متصفح إذا لم يكن `browser.enabled`
معطّلًا على Node. يتيح ذلك للوكيل استخدام أتمتة المتصفح على Node ذاك
من دون إعداد إضافي.

يكشف الوكيل افتراضيًا سطح ملفات تعريف المتصفح العادي في Node. إذا ضبطت
`nodeHost.browserProxy.allowProfiles`، يصبح الوكيل مقيّدًا:
يُرفض استهداف ملفات التعريف غير المدرجة في قائمة السماح، وتُحظر مسارات
إنشاء ملفات التعريف الدائمة وحذفها عبر الوكيل.

عطّله على Node عند الحاجة:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## التشغيل (في الواجهة الأمامية)

```bash
openclaw node run --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف WebSocket الخاص بـ Gateway (الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ WebSocket الخاص بـ Gateway (الافتراضي: `18789`)
- `--context-path <path>`: مسار سياق WebSocket الخاص بـ Gateway (مثل `/openclaw-gw`). يُلحق بعنوان URL الخاص بـ WebSocket.
- `--tls`: استخدام TLS لاتصال Gateway
- `--no-tls`: فرض اتصال Gateway بنص صريح حتى عندما يفعّل إعداد Gateway المحلي TLS
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (sha256)
- `--node-id <id>`: تجاوز معرّف نسخة العميل المخزّن في حالة SQLite المشتركة (لا يعيد ضبط الاقتران)
- `--display-name <name>`: تجاوز اسم عرض Node

## مصادقة Gateway لمضيف Node

يحلّ `openclaw node run` و`openclaw node install` مصادقة Gateway من الإعداد/البيئة (لا توجد علامتا `--token`/`--password` في أوامر Node):

- يُتحقق أولًا من `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- ثم يُستخدم الإعداد المحلي احتياطيًا: `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، لا يرث مضيف Node عمدًا `gateway.remote.token` / `gateway.remote.password`.
- إذا ضُبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وظل دون حل، يفشل حل مصادقة Node بصورة مغلقة آمنة (من دون إخفاء ذلك بالرجوع الاحتياطي البعيد).
- في `gateway.mode=remote`، تكون حقول العميل البعيد (`gateway.remote.token` / `gateway.remote.password`) مؤهلة أيضًا وفق قواعد أولوية الاتصال البعيد.
- لا يراعي حل مصادقة مضيف Node سوى متغيرات البيئة `OPENCLAW_GATEWAY_*`.

بالنسبة إلى Node يتصل بـ Gateway ذي `ws://` بنص صريح، تُقبل عناوين
الاسترجاع، وعناوين IP الخاصة الصريحة، و`.local`، ومضيفات
`*.ts.net` في Tailnet. لأسماء DNS الخاصة الموثوقة الأخرى، اضبط
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`؛ ومن دونه، يفشل بدء تشغيل Node بصورة مغلقة آمنة ويطلب
استخدام `wss://` أو نفق SSH أو Tailscale. هذا اشتراك اختياري عبر
بيئة العملية، وليس مفتاح إعداد `openclaw.json`.
يحفظه `openclaw node install` في خدمة Node الخاضعة للإشراف عندما يكون موجودًا
في بيئة أمر التثبيت.

## الخدمة (في الخلفية)

ثبّت مضيف Node بلا واجهة رسومية بوصفه خدمة مستخدم (launchd على macOS، وsystemd
على Linux، وWindows Task Scheduler على Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف WebSocket الخاص بـ Gateway (الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ WebSocket الخاص بـ Gateway (الافتراضي: `18789`)
- `--context-path <path>`: مسار سياق WebSocket الخاص بـ Gateway (مثل `/openclaw-gw`). يُلحق بعنوان URL الخاص بـ WebSocket.
- `--tls`: استخدام TLS لاتصال Gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (sha256)
- `--node-id <id>`: تجاوز معرّف نسخة العميل المخزّن في حالة SQLite المشتركة (لا يعيد ضبط الاقتران)
- `--display-name <name>`: تجاوز اسم عرض Node
- `--runtime <runtime>`: بيئة تشغيل الخدمة (`node`)
- `--force`: إعادة التثبيت/الاستبدال إذا كانت مثبتة بالفعل

إدارة الخدمة:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

استخدم `openclaw node run` لمضيف Node في الواجهة الأمامية (من دون خدمة).

تقبل أوامر الخدمة `--json` للحصول على مخرجات قابلة للقراءة آليًا.

يعيد مضيف Node محاولة الاتصال داخل العملية عند إعادة تشغيل Gateway وإغلاق
الشبكة. إذا أبلغ Gateway عن إيقاف نهائي لمصادقة الرمز المميز/كلمة المرور/التمهيد،
يسجّل مضيف Node تفاصيل الإغلاق وينهي التنفيذ برمز غير صفري، لكي تتمكن
launchd/systemd/Task Scheduler من إعادة تشغيله بإعداد وبيانات اعتماد محدّثة.
تبقى حالات الإيقاف التي تتطلب الاقتران ضمن تدفق الواجهة الأمامية حتى يمكن
اعتماد الطلب المعلّق.

## الاقتران

ينشئ الاتصال الأول طلب اقتران جهاز معلّقًا (`role: node`) على Gateway.

عندما يستطيع مضيف Gateway الاتصال بمضيف Node عبر SSH من دون تفاعل (المستخدم
نفسه، ومفتاح مضيف موثوق)، يُعتمد الطلب المعلّق تلقائيًا: يشغّل Gateway
`openclaw node identity --json` على مضيف Node عبر SSH ويعتمد الطلب عند تطابق مفتاح
الجهاز تطابقًا تامًا. يكون هذا مفعّلًا افتراضيًا؛ راجع
[الاعتماد التلقائي للجهاز بعد التحقق عبر SSH](/ar/gateway/pairing#ssh-verified-device-auto-approval-default)
لمعرفة المتطلبات وكيفية تعطيله (`gateway.nodes.pairing.sshVerify: false`).

وإلا، فاعتمده يدويًا عبر:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

افحص هوية Node المحلية التي يتحقق منها Gateway:

```bash
openclaw node identity --json
```

يطبع هذا معرّف الجهاز والمفتاح العام من `identity/device.json` ولا ينشئ
ملفات الهوية أو يعدّلها أبدًا.

في شبكات Node الخاضعة لتحكم صارم، يمكن لمشغّل Gateway الاشتراك صراحةً
في الاعتماد التلقائي لاقتران Node للمرة الأولى من نطاقات CIDR الموثوقة:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

يكون هذا معطّلًا افتراضيًا (`autoApproveCidrs` غير مضبوط). ولا ينطبق إلا على
اقتران `role: node` جديد من دون نطاقات مطلوبة، ومن عنوان IP للعميل يثق
به Gateway. تظل عملاء المشغّل/المتصفح، وControl UI، وWebChat، وترقيات الدور
أو النطاق أو بيانات التعريف أو المفتاح العام بحاجة إلى اعتماد يدوي.

إذا أعاد Node محاولة الاقتران بتفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
يُستبدل الطلب المعلّق السابق ويُنشأ `requestId` جديد.
شغّل `openclaw devices list` مجددًا قبل الاعتماد.

### حالة الهوية والاقتران

يفصل Node بلا واجهة رسومية معرّف نسخة العميل الخاص به عن هوية الجهاز
الموقّعة التي يستخدمها Gateway للاقتران والتوجيه. توجد هذه الحالة في دليل حالة
OpenClaw ‏(`~/.openclaw` افتراضيًا، أو `$OPENCLAW_STATE_DIR`
عند ضبطه):

| الحالة                                        | الغرض                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | معرّف نسخة العميل، واسم العرض، وبيانات تعريف اتصال Gateway. يرسل العميل هذا المعرّف بوصفه `instanceId`.                     |
| `identity/device.json`                       | زوج مفاتيح Ed25519 موقّع ومعرّف جهاز مشتق. بالنسبة إلى الاتصالات الموقّعة، يكون معرّف الجهاز هذا هو معرّف Node الموجّه وهوية الاقتران. |
| `identity/device-auth.json`                  | رموز الأجهزة المقترنة، مفهرسة حسب معرّف الجهاز التشفيري والدور.                                                                 |

يغيّر `--node-id` معرّف نسخة العميل فقط في حالة SQLite المشتركة. ولا
يغيّر معرّف الجهاز التشفيري أو يمسح مصادقة الاقتران. كذلك لا تؤدي ترحيل
`node.json` متقاعد باستخدام `openclaw doctor --fix` إلى إعادة ضبط الاقتران.
لإلغاء Node وإعادة إقرانه:

1. على Gateway، شغّل `openclaw nodes remove --node <id|name|ip>`.
2. على Node، أعد تشغيل الخدمة المثبتة باستخدام `openclaw node restart`، أو
   أوقف أمر `openclaw node run` في الواجهة الأمامية وأعد تشغيله. يبدأ هذا
   تدفق اقتران الجهاز. إذا لم يعرض `openclaw devices list` طلبًا
   وأبلغ Node عن `AUTH_DEVICE_TOKEN_MISMATCH`، فأعد تشغيله مرة
   أخرى. تمسح المحاولة المرفوضة الرمز المميز المحلي الذي أُلغي الآن؛ ويمكن
   للمحاولة التالية طلب الاقتران.
3. على Gateway، شغّل `openclaw devices list`، ثم
   `openclaw devices approve <deviceRequestId>`.
4. أعد تشغيل Node مرة أخرى. لا يستأنف العميل المتوقف للاقتران
   تلقائيًا بعد الاعتماد؛ ينشئ إعادة الاتصال هذه طلب سطح الأوامر
   المنفصل.
5. على Gateway، شغّل `openclaw nodes pending`، ثم
   `openclaw nodes approve <nodeRequestId>`.

معرّفا الطلبين مختلفان. يمكن لسياسة CIDR موثوقة قابلة للتطبيق أن
تعتمد تلقائيًا خطوة اقتران الجهاز للمرة الأولى؛ ويظل اعتماد سطح الأوامر
فحصًا منفصلًا.

كانت إصدارات OpenClaw الأقدم تخزّن حالة مضيف Node في `node.json` وقد تترك
حقل `token` متقادمًا فيه. أوقف مضيف Node وشغّل `openclaw doctor --fix`
مرة واحدة؛ يستورد Doctor حقول الهوية والاتصال المدعومة إلى SQLite،
ويتخلص من حقل الرمز المميز غير المستخدم، ويتحقق من الصف، ويزيل الملف المتقاعد.
تفشل أوامر Node العادية بصورة مغلقة آمنة مع تعليمات الإصلاح هذه ما دام الملف
أو مطالبة Doctor منقطعة موجودًا. أبقِ كلا الملفين ضمن `identity/` خاصين؛
فهما يحتويان على زوج مفاتيح الجهاز ورموز المصادقة.

## موافقات exec

يخضع `system.run` لموافقات exec المحلية:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`، أو
  `~/.openclaw/exec-approvals.json` عندما يكون المتغير غير مضبوط
- [موافقات exec](/ar/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (عدّله من Gateway)

بالنسبة إلى exec غير المتزامن المعتمد على Node، يُعدّ OpenClaw
`systemRunPlan` قياسيًا قبل طلب الموافقة. تعيد عملية تمرير
`system.run` المعتمدة لاحقًا استخدام تلك الخطة المخزنة، لذا تُرفض
التعديلات على حقول الأمر/cwd/الجلسة بعد إنشاء طلب الموافقة بدلًا من تغيير
ما ينفذه Node.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [عُقد Node](/ar/nodes)
