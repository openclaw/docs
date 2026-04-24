---
read_when:
    - تشغيل مضيف Node بلا واجهة
    - إقران Node غير macOS من أجل system.run
summary: مرجع CLI لـ `openclaw node` (مضيف Node بلا واجهة)
title: Node
x-i18n:
    generated_at: "2026-04-24T07:35:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

شغّل **مضيف Node بلا واجهة** يتصل بـ Gateway WebSocket ويكشف
`system.run` / `system.which` على هذا الجهاز.

## لماذا تستخدم مضيف Node؟

استخدم مضيف Node عندما تريد من الوكلاء **تشغيل أوامر على أجهزة أخرى** في
شبكتك من دون تثبيت تطبيق macOS مرافق كامل هناك.

حالات الاستخدام الشائعة:

- تشغيل الأوامر على أجهزة Linux/Windows بعيدة (خوادم البناء، وأجهزة المختبر، وNAS).
- الإبقاء على exec **ضمن sandbox** على gateway، مع تفويض التشغيلات الموافق عليها إلى مضيفين آخرين.
- توفير هدف تنفيذ خفيف وبلا واجهة لعُقد الأتمتة أو CI.

يظل التنفيذ محميًا بواسطة **موافقات exec** وallowlists الخاصة بكل وكيل على
مضيف node، بحيث يمكنك إبقاء الوصول إلى الأوامر محدودًا وصريحًا.

## وكيل المتصفح (من دون إعداد)

تعلن مضيفات Node تلقائيًا عن وكيل متصفح إذا لم يتم
تعطيل `browser.enabled` على الـ node. يتيح هذا للوكيل استخدام أتمتة المتصفح
على ذلك الـ node من دون إعداد إضافي.

افتراضيًا، يكشف الوكيل سطح ملف تعريف المتصفح العادي الخاص بالـ node. وإذا
قمت بتعيين `nodeHost.browserProxy.allowProfiles`، يصبح الوكيل مقيدًا:
يتم رفض استهداف ملفات التعريف غير الموجودة في allowlist، ويتم حظر مسارات
إنشاء/حذف ملفات التعريف الدائمة عبر الوكيل.

عطّله على الـ node عند الحاجة:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## التشغيل (المقدمة)

```bash
openclaw node run --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف Gateway WebSocket (الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket (الافتراضي: `18789`)
- `--tls`: استخدام TLS لاتصال gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (sha256)
- `--node-id <id>`: تجاوز معرّف node (يمسح رمز الاقتران)
- `--display-name <name>`: تجاوز الاسم المعروض للـ node

## مصادقة Gateway لمضيف node

يقوم `openclaw node run` و`openclaw node install` بحل مصادقة gateway من config/env (لا توجد علامات `--token`/`--password` على أوامر node):

- يتم التحقق أولًا من `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- ثم الرجوع الاحتياطي إلى الإعدادات المحلية: `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، لا يرث مضيف node عمدًا `gateway.remote.token` / `gateway.remote.password`.
- إذا كان `gateway.auth.token` / `gateway.auth.password` مهيأين صراحةً عبر SecretRef وغير محلولين، فإن حل مصادقة node يفشل بشكل مغلق (من دون رجوع احتياطي بعيد يُخفي المشكلة).
- في `gateway.mode=remote`، تكون حقول العميل البعيد (`gateway.remote.token` / `gateway.remote.password`) مؤهلة أيضًا وفق قواعد أولوية الوضع البعيد.
- لا يحترم حل مصادقة مضيف node إلا متغيرات البيئة `OPENCLAW_GATEWAY_*`.

بالنسبة إلى Node يتصل بـ Gateway غير loopback عبر `ws://` على شبكة خاصة
موثوقة، اضبط `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. ومن دون ذلك، يفشل
بدء تشغيل node بشكل مغلق ويطلب منك استخدام `wss://` أو نفق SSH أو Tailscale.
هذا اشتراك على مستوى بيئة العملية، وليس مفتاح إعدادات داخل `openclaw.json`.
يقوم `openclaw node install` بحفظه داخل خدمة node الخاضعة للإشراف عندما يكون
موجودًا في بيئة أمر التثبيت.

## الخدمة (الخلفية)

ثبّت مضيف Node بلا واجهة كخدمة مستخدم.

```bash
openclaw node install --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف Gateway WebSocket (الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket (الافتراضي: `18789`)
- `--tls`: استخدام TLS لاتصال gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (sha256)
- `--node-id <id>`: تجاوز معرّف node (يمسح رمز الاقتران)
- `--display-name <name>`: تجاوز الاسم المعروض للـ node
- `--runtime <runtime>`: وقت تشغيل الخدمة (`node` أو `bun`)
- `--force`: إعادة التثبيت/الاستبدال إذا كان مثبتًا بالفعل

إدارة الخدمة:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

استخدم `openclaw node run` لمضيف Node في المقدمة (من دون خدمة).

تقبل أوامر الخدمة الخيار `--json` للحصول على مخرجات قابلة للقراءة آليًا.

## الاقتران

ينشئ أول اتصال طلب اقتران جهاز معلق (`role: node`) على Gateway.
وافق عليه عبر:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

إذا أعاد الـ node محاولة الاقتران بتفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيتم استبدال الطلب المعلق السابق وإنشاء `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

يخزّن مضيف node معرّف node والرمز والاسم المعروض ومعلومات اتصال gateway في
`~/.openclaw/node.json`.

## موافقات Exec

يخضع `system.run` لموافقات exec المحلية:

- `~/.openclaw/exec-approvals.json`
- [موافقات Exec](/ar/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (تحرير من Gateway)

بالنسبة إلى exec غير المتزامن الموافق عليه على الـ node، يجهز OpenClaw
`systemRunPlan` قانونية قبل المطالبة. ويعيد توجيه `system.run` الموافق عليه لاحقًا
استخدام تلك الخطة المخزنة، لذلك يتم رفض التعديلات على حقول الأمر/‏cwd/‏الجلسة بعد
إنشاء طلب الموافقة بدلًا من تغيير ما ينفذه الـ node.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Nodes](/ar/nodes)
