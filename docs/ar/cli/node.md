---
read_when:
    - تشغيل مضيف Node عديم الواجهة
    - اقتران Node غير تابع لـ macOS من أجل `system.run`
summary: مرجع CLI لـ `openclaw node` (مضيف Node عديم الواجهة)
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

شغّل **مضيف Node عديم الواجهة** يتصل بـ Gateway WebSocket ويكشف
`system.run` / `system.which` على هذا الجهاز.

## لماذا تستخدم مضيف Node؟

استخدم مضيف Node عندما تريد من الوكلاء **تشغيل أوامر على أجهزة أخرى** في
شبكتك من دون تثبيت تطبيق macOS مرافق كامل عليها.

حالات الاستخدام الشائعة:

- تشغيل الأوامر على أجهزة Linux/Windows البعيدة (خوادم البناء، أجهزة المختبر، NAS).
- إبقاء exec **ضمن صندوق حماية** على Gateway، مع تفويض التشغيلات الموافق عليها إلى مضيفين آخرين.
- توفير هدف تنفيذ خفيف وعديم الواجهة لعُقد الأتمتة أو CI.

لا يزال التنفيذ محميًا بواسطة **موافقات exec** وقوائم السماح لكل وكيل على
مضيف Node، بحيث يمكنك إبقاء الوصول إلى الأوامر محددًا وصريحًا.

## وكيل المتصفح (بدون إعداد)

يعلن مضيف Node تلقائيًا عن وكيل متصفح إذا لم يتم
تعطيل `browser.enabled` على Node. وهذا يتيح للوكيل استخدام أتمتة المتصفح على ذلك Node
من دون إعداد إضافي.

بشكل افتراضي، يكشف الوكيل سطح ملفات تعريف المتصفح العادي في Node. وإذا
ضبطت `nodeHost.browserProxy.allowProfiles`، يصبح الوكيل مقيّدًا:
يُرفض استهداف ملفات التعريف غير المدرجة في قائمة السماح، وتُحظر
مسارات إنشاء/حذف ملفات التعريف الدائمة عبر الوكيل.

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

- `--host <host>`: مضيف Gateway WebSocket ‏(الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket ‏(الافتراضي: `18789`)
- `--tls`: استخدام TLS لاتصال Gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (`sha256`)
- `--node-id <id>`: تجاوز معرّف Node (يمسح رمز الاقتران)
- `--display-name <name>`: تجاوز اسم عرض Node

## مصادقة Gateway لمضيف Node

تستخرج الأوامر `openclaw node run` و`openclaw node install` مصادقة Gateway من الإعدادات/البيئة (لا توجد علامتا `--token`/`--password` على أوامر Node):

- يتم التحقق أولًا من `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- ثم الرجوع إلى الإعدادات المحلية: `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، لا يرث مضيف Node عمدًا `gateway.remote.token` / `gateway.remote.password`.
- إذا تم تهيئة `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وتعذر حلّهما، يفشل حل مصادقة Node بشكل مغلق (من دون إخفاء ذلك عبر رجوع احتياطي بعيد).
- في `gateway.mode=remote`، تكون حقول العميل البعيد (`gateway.remote.token` / `gateway.remote.password`) مؤهلة أيضًا وفق قواعد أولوية الوضع البعيد.
- لا يراعي حل مصادقة مضيف Node إلا متغيرات البيئة `OPENCLAW_GATEWAY_*`.

بالنسبة إلى Node يتصل بـ Gateway غير loopback عبر `ws://` على شبكة خاصة موثوقة،
اضبط `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. وبدون ذلك، يفشل بدء Node بشكل مغلق
ويطلب منك استخدام `wss://` أو نفق SSH أو Tailscale.
وهذا اشتراك على مستوى بيئة العملية، وليس مفتاح إعدادات في `openclaw.json`.
ويقوم `openclaw node install` بحفظه ضمن خدمة Node الخاضعة للإشراف عندما يكون
موجودًا في بيئة أمر التثبيت.

## الخدمة (في الخلفية)

ثبّت مضيف Node عديم الواجهة كخدمة مستخدم.

```bash
openclaw node install --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف Gateway WebSocket ‏(الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket ‏(الافتراضي: `18789`)
- `--tls`: استخدام TLS لاتصال Gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (`sha256`)
- `--node-id <id>`: تجاوز معرّف Node (يمسح رمز الاقتران)
- `--display-name <name>`: تجاوز اسم عرض Node
- `--runtime <runtime>`: بيئة تشغيل الخدمة (`node` أو `bun`)
- `--force`: إعادة التثبيت/الاستبدال إذا كانت مثبتة بالفعل

إدارة الخدمة:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

استخدم `openclaw node run` لمضيف Node يعمل في الواجهة الأمامية (من دون خدمة).

تقبل أوامر الخدمة الخيار `--json` لإخراج قابل للقراءة آليًا.

يعيد مضيف Node محاولة التعامل داخل العملية مع إعادة تشغيل Gateway وإغلاقات
الشبكة. وإذا أبلغ Gateway عن توقف مصادقة نهائي خاص بالرمز/كلمة المرور/التمهيد،
يسجل مضيف Node تفاصيل الإغلاق ويخرج بقيمة غير صفرية حتى يتمكن launchd/systemd
من إعادة تشغيله بإعدادات وبيانات اعتماد جديدة. أما حالات التوقف التي تتطلب
الاقتران فتبقى ضمن تدفق الواجهة الأمامية حتى يمكن الموافقة على الطلب المعلق.

## الاقتران

ينشئ أول اتصال طلب اقتران جهاز معلقًا (`role: node`) على Gateway.
وافِق عليه عبر:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

في شبكات Node الخاضعة للتحكم بإحكام، يمكن لمشغّل Gateway الاشتراك صراحةً
في الموافقة التلقائية على اقتران Node لأول مرة من CIDRات موثوقة:

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

يكون هذا معطلًا افتراضيًا. وينطبق فقط على اقتران `role: node` الجديد
من دون أي نطاقات مطلوبة. وما زال عملاء operator/browser وControl UI وWebChat،
وكذلك ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام، يتطلبون
موافقة يدوية.

إذا أعاد Node محاولة الاقتران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيُستبدل الطلب المعلق السابق ويُنشأ `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

يخزّن مضيف Node معرّف Node الخاص به، والرمز، واسم العرض، ومعلومات اتصال Gateway في
`~/.openclaw/node.json`.

## موافقات Exec

يكون `system.run` خاضعًا لموافقات exec المحلية:

- `~/.openclaw/exec-approvals.json`
- [موافقات Exec](/ar/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (للتعديل من Gateway)

بالنسبة إلى exec غير المتزامن الموافق عليه على Node، يُعدّ OpenClaw
`systemRunPlan` قياسيًا قبل المطالبة. ويعيد تمرير `system.run` الموافق عليه لاحقًا
استخدام تلك الخطة المخزنة، لذلك تُرفض التعديلات على حقول الأمر/`cwd`/الجلسة بعد
إنشاء طلب الموافقة بدلًا من تغيير ما ينفذه Node.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Nodes](/ar/nodes)
