---
read_when:
    - تشغيل مضيف Node دون واجهة رسومية
    - إقران عقدة لا تعمل بنظام macOS لاستخدام system.run
summary: مرجع CLI لـ `openclaw node` (مضيف Node بلا واجهة رسومية)
title: Node
x-i18n:
    generated_at: "2026-07-12T05:43:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

شغّل **مضيف Node بلا واجهة رسومية** يتصل بـ Gateway WebSocket ويتيح
`system.run` / `system.which` على هذا الجهاز.

## لماذا تستخدم مضيف Node؟

استخدم مضيف Node عندما تريد من الوكلاء **تشغيل الأوامر على أجهزة أخرى** في
شبكتك من دون تثبيت تطبيق macOS مرافق كامل عليها.

حالات الاستخدام الشائعة:

- تشغيل الأوامر على أجهزة Linux/Windows بعيدة (خوادم البناء، وأجهزة المختبر، وNAS).
- إبقاء التنفيذ **ضمن بيئة معزولة** على Gateway، مع تفويض عمليات التشغيل المعتمدة إلى مضيفين آخرين.
- توفير هدف تنفيذ خفيف وبلا واجهة رسومية للأتمتة أو عُقد CI.

يظل التنفيذ محميًا بواسطة **موافقات التنفيذ** وقوائم السماح الخاصة بكل وكيل على
مضيف Node، بحيث يمكنك إبقاء الوصول إلى الأوامر محدد النطاق وصريحًا.

يمكن لـ `openclaw node run` نشر أدوات مدعومة بـ Plugin أو MCP بعد اتصاله.
يثق Gateway افتراضيًا بالواصفات الواردة من Node المقترنة، مع اشتراط بقاء أمر
كل واصف ضمن سطح الأوامر المعتمدة في Node. يرى الوكيل كل واصف مقبول كأداة
Plugin عادية، لكن التنفيذ يظل يمر عبر `node.invoke`، لذا تؤدي إزالة اتصال
Node إلى إزالة الأداة من عمليات تشغيل الوكيل الجديدة. يمكن لمشغّلي Gateway
تعطيل النشر باستخدام `gateway.nodes.pluginTools.enabled: false`.

بالنسبة إلى أدوات MCP التعريفية، أضف بنية خادم MCP المعتادة ضمن
`nodeHost.mcp.servers` في `openclaw.json` على جهاز Node، ثم أعد تشغيل
مضيف Node. تعلن Node عن عائلة الأوامر `mcp.tools.call.v1` الخاضعة للموافقة
وتنشر الأدوات المدرجة بعد الاتصال؛ ولا يتطلب تغيير قائمة الخوادم لاحقًا
إعادة الاقتران. راجع
[خوادم MCP المستضافة على Node](/ar/nodes#node-hosted-mcp-servers).

## وكيل المتصفح (من دون إعداد)

تعلن مضيفات Node تلقائيًا عن وكيل متصفح إذا لم يكن `browser.enabled`
معطلًا على Node. يتيح ذلك للوكيل استخدام أتمتة المتصفح على تلك Node
من دون إعداد إضافي.

افتراضيًا، يتيح الوكيل سطح ملفات تعريف المتصفح المعتاد في Node. إذا ضبطت
`nodeHost.browserProxy.allowProfiles`، يصبح الوكيل تقييديًا:
يُرفض استهداف ملفات التعريف غير المدرجة في قائمة السماح، وتُحظر عبر الوكيل
مسارات إنشاء ملفات التعريف الدائمة وحذفها.

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

- `--host <host>`: مضيف Gateway WebSocket (الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket (الافتراضي: `18789`)
- `--context-path <path>`: مسار سياق Gateway WebSocket (مثل `/openclaw-gw`). يُلحق بعنوان URL الخاص بـ WebSocket.
- `--tls`: استخدام TLS لاتصال Gateway
- `--no-tls`: فرض اتصال Gateway بنص صريح حتى عندما يفعّل إعداد Gateway المحلي TLS
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (sha256)
- `--node-id <id>`: تجاوز معرّف مثيل العميل القديم المخزّن في `node.json` (لا يعيد ضبط الاقتران)
- `--display-name <name>`: تجاوز اسم عرض Node

## مصادقة Gateway لمضيف Node

يستمد `openclaw node run` و`openclaw node install` مصادقة Gateway من الإعداد/متغيرات البيئة (لا توجد رايتا `--token`/`--password` في أوامر Node):

- يُتحقق أولًا من `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- ثم يُستخدم الإعداد المحلي احتياطيًا: `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، لا يرث مضيف Node عمدًا `gateway.remote.token` / `gateway.remote.password`.
- إذا جرى إعداد `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم تُحلّ قيمتهما، يفشل استدلال مصادقة Node بصورة مغلقة وآمنة (من دون أن يخفي ذلك استخدام إعداد بعيد احتياطيًا).
- في `gateway.mode=remote`، تكون حقول العميل البعيد (`gateway.remote.token` / `gateway.remote.password`) مؤهلة أيضًا وفق قواعد أولوية الاتصال البعيد.
- لا يراعي استدلال مصادقة مضيف Node سوى متغيرات البيئة `OPENCLAW_GATEWAY_*`.

بالنسبة إلى Node تتصل بـ Gateway عبر نص صريح باستخدام `ws://`، تُقبل
عناوين local loopback، وعناوين IP الخاصة الصريحة، و`.local`، ومضيفو Tailnet
من النمط `*.ts.net`. بالنسبة إلى أسماء DNS الخاصة الموثوقة الأخرى، اضبط
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`؛ ومن دونه، يفشل بدء تشغيل Node
بصورة مغلقة وآمنة ويطلب منك استخدام `wss://`، أو نفق SSH، أو Tailscale.
هذا تفعيل اختياري عبر بيئة العملية، وليس مفتاح إعداد في `openclaw.json`.
يحتفظ `openclaw node install` به في خدمة Node الخاضعة للإشراف عندما يكون
موجودًا في بيئة أمر التثبيت.

## الخدمة (في الخلفية)

ثبّت مضيف Node بلا واجهة رسومية كخدمة مستخدم (launchd على macOS، وsystemd على
Linux، وWindows Task Scheduler على Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف Gateway WebSocket (الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket (الافتراضي: `18789`)
- `--context-path <path>`: مسار سياق Gateway WebSocket (مثل `/openclaw-gw`). يُلحق بعنوان URL الخاص بـ WebSocket.
- `--tls`: استخدام TLS لاتصال Gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (sha256)
- `--node-id <id>`: تجاوز معرّف مثيل العميل القديم المخزّن في `node.json` (لا يعيد ضبط الاقتران)
- `--display-name <name>`: تجاوز اسم عرض Node
- `--runtime <runtime>`: بيئة تشغيل الخدمة (`node` أو `bun`)
- `--force`: إعادة التثبيت/الكتابة فوق التثبيت إذا كان مثبتًا بالفعل

إدارة الخدمة:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

استخدم `openclaw node run` لتشغيل مضيف Node في الواجهة الأمامية (من دون خدمة).

تقبل أوامر الخدمة `--json` لإخراج قابل للقراءة آليًا.

يعيد مضيف Node محاولة الاتصال داخل العملية عند إعادة تشغيل Gateway أو إغلاق
الشبكة. إذا أبلغ Gateway عن إيقاف نهائي لمصادقة الرمز المميز/كلمة المرور/التهيئة
الأولية، يسجّل مضيف Node تفاصيل الإغلاق وينهي التشغيل برمز غير صفري كي تتمكن
launchd/systemd/Task Scheduler من إعادة تشغيله بإعداد وبيانات اعتماد حديثة.
أما حالات الإيقاف التي تتطلب الاقتران فتبقى في تدفق الواجهة الأمامية حتى يمكن
اعتماد الطلب المعلّق.

## الاقتران

ينشئ الاتصال الأول طلب اقتران جهاز معلّقًا (`role: node`) على Gateway.

عندما يتمكن مضيف Gateway من الاتصال بمضيف Node عبر SSH بصورة غير تفاعلية
(المستخدم نفسه، ومفتاح مضيف موثوق)، يُعتمد الطلب المعلّق تلقائيًا: يشغّل
Gateway الأمر `openclaw node identity --json` على مضيف Node عبر SSH
ويعتمد الطلب عند التطابق التام لمفتاح الجهاز. يكون هذا مفعّلًا افتراضيًا؛ راجع
[الاعتماد التلقائي للجهاز المتحقق منه عبر SSH](/ar/gateway/pairing#ssh-verified-device-auto-approval-default)
للاطلاع على المتطلبات وكيفية تعطيله (`gateway.nodes.pairing.sshVerify: false`).

وإلا فاعتمده يدويًا عبر:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

افحص هوية Node المحلية التي يتحقق منها Gateway:

```bash
openclaw node identity --json
```

يطبع هذا الأمر معرّف الجهاز والمفتاح العام من `identity/device.json`، ولا
ينشئ ملفات الهوية أو يعدّلها مطلقًا.

في شبكات Node الخاضعة لرقابة مشددة، يمكن لمشغّل Gateway الاشتراك صراحةً
في الاعتماد التلقائي لاقتران Node لأول مرة من نطاقات CIDR الموثوقة:

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

يكون هذا معطلًا افتراضيًا (`autoApproveCidrs` غير مضبوط). ولا ينطبق إلا على
اقتران `role: node` جديد من دون نطاقات مطلوبة، ومن عنوان IP لعميل يثق به
Gateway. تظل عملاء المشغّل/المتصفح، وواجهة Control UI، وWebChat، وترقيات
الدور، أو النطاق، أو البيانات الوصفية، أو المفتاح العام بحاجة إلى اعتماد يدوي.

إذا أعادت Node محاولة الاقتران بتفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
يُستبدل الطلب المعلّق السابق ويُنشأ `requestId` جديد.
شغّل `openclaw devices list` مجددًا قبل الاعتماد.

### حالة الهوية والاقتران

يفصل مضيف Node بلا واجهة رسومية معرّف مثيل العميل القديم عن هوية الجهاز
الموقعة التي يستخدمها Gateway للاقتران والتوجيه. توجد هذه الملفات في دليل
حالة OpenClaw (`~/.openclaw` افتراضيًا، أو `$OPENCLAW_STATE_DIR`
عند ضبطه):

| الملف                       | الغرض                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node.json`                 | معرّف مثيل العميل ضمن المفتاح القديم `nodeId`، واسم العرض، وبيانات تعريف اتصال Gateway. يرسل العميل هذه القيمة بوصفها `instanceId`.                    |
| `identity/device.json`      | زوج مفاتيح Ed25519 موقّع ومعرّف الجهاز المشتق. في الاتصالات الموقعة، يكون معرّف الجهاز هذا هو معرّف Node الموجّه وهوية الاقتران.                       |
| `identity/device-auth.json` | الرموز المميزة للأجهزة المقترنة، مفهرسة حسب معرّف الجهاز التشفيري والدور.                                                                               |

يغيّر `--node-id` معرّف مثيل العميل في `node.json` فقط. ولا يغيّر معرّف
الجهاز التشفيري أو يمسح مصادقة الاقتران. كذلك، لا تؤدي إزالة `node.json`
وحده إلى إعادة ضبط الاقتران. لإلغاء Node وإعادة اقترانها:

1. على Gateway، شغّل `openclaw nodes remove --node <id|name|ip>`.
2. على Node، أعد تشغيل الخدمة المثبتة باستخدام `openclaw node restart`، أو
   أوقف أمر الواجهة الأمامية `openclaw node run` وأعد تشغيله. يبدأ هذا
   تدفق اقتران الجهاز. إذا لم يعرض `openclaw devices list` طلبًا
   وأبلغت Node عن `AUTH_DEVICE_TOKEN_MISMATCH`، فأعد تشغيلها مرة
   أخرى. تمسح المحاولة المرفوضة الرمز المميز المحلي الملغى الآن؛ ويمكن
   للمحاولة التالية طلب الاقتران.
3. على Gateway، شغّل `openclaw devices list`، ثم
   `openclaw devices approve <deviceRequestId>`.
4. أعد تشغيل Node مرة أخرى. لا يستأنف العميل المتوقف للاقتران تلقائيًا
   بعد الاعتماد؛ إذ ينشئ هذا الاتصال الجديد طلبًا منفصلًا
   لسطح الأوامر.
5. على Gateway، شغّل `openclaw nodes pending`، ثم
   `openclaw nodes approve <nodeRequestId>`.

معرّفا الطلبين مختلفان. يمكن لسياسة CIDR موثوقة منطبقة أن تعتمد تلقائيًا
خطوة اقتران الجهاز لأول مرة؛ ويظل اعتماد سطح الأوامر فحصًا منفصلًا.

كان من الممكن أن تترك إصدارات OpenClaw الأقدم حقل `token` قديمًا في
`node.json`. لا يستخدم OpenClaw الحالي هذا الحقل، ويزيله في المرة التالية
التي يحفظ فيها مضيف Node الملف. أبقِ الملفين ضمن `identity/` خاصين؛ فهما
يحتويان على زوج مفاتيح الجهاز ورموز المصادقة المميزة.

## موافقات التنفيذ

تخضع `system.run` لموافقات التنفيذ المحلية:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`، أو
  `~/.openclaw/exec-approvals.json` عندما لا يكون المتغير مضبوطًا
- [موافقات التنفيذ](/ar/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (التحرير من Gateway)

بالنسبة إلى تنفيذ Node غير المتزامن المعتمد، يُعد OpenClaw مخطط
`systemRunPlan` موحدًا قبل طلب الموافقة. تعيد عملية إعادة توجيه
`system.run` المعتمدة لاحقًا استخدام ذلك المخطط المخزن، لذا تُرفض التعديلات
على حقول الأمر/دليل العمل/الجلسة بعد إنشاء طلب الموافقة بدلًا من تغيير ما
تنفذه Node.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [العُقد](/ar/nodes)
