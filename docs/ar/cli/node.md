---
read_when:
    - تشغيل مضيف Node بلا واجهة رسومية
    - إقران عقدة غير macOS من أجل `system.run`
summary: مرجع CLI لـ `openclaw node` (مضيف Node بلا واجهة)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:22:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

شغّل **مضيف Node بلا واجهة** يتصل بـ Gateway WebSocket ويكشف
`system.run` / `system.which` على هذا الجهاز.

## لماذا تستخدم مضيف Node؟

استخدم مضيف Node عندما تريد من الوكلاء **تشغيل أوامر على أجهزة أخرى** في
شبكتك من دون تثبيت تطبيق macOS مرافق كامل هناك.

حالات الاستخدام الشائعة:

- تشغيل الأوامر على أجهزة Linux/Windows بعيدة (خوادم البناء، أجهزة المختبر، NAS).
- إبقاء exec **داخل sandbox** على Gateway، مع تفويض التشغيلات المعتمدة إلى مضيفين آخرين.
- توفير هدف تنفيذ خفيف وبلا واجهة للأتمتة أو عقد CI.

لا يزال التنفيذ محميًا بواسطة **موافقات exec** وقوائم السماح لكل وكيل على
مضيف Node، بحيث يمكنك إبقاء الوصول إلى الأوامر محدد النطاق وصريحًا.

## وكيل المتصفح (بلا إعدادات)

تعلن مضيفات Node تلقائيًا عن وكيل متصفح إذا لم يكن `browser.enabled`
معطّلًا على العقدة. يتيح ذلك للوكيل استخدام أتمتة المتصفح على تلك العقدة
من دون إعدادات إضافية.

افتراضيًا، يكشف الوكيل سطح ملف تعريف المتصفح العادي الخاص بالعقدة. إذا
ضبطت `nodeHost.browserProxy.allowProfiles`، يصبح الوكيل تقييديًا:
يُرفض استهداف ملفات التعريف غير الموجودة في قائمة السماح، وتُحظر مسارات
إنشاء/حذف ملفات التعريف الدائمة عبر الوكيل.

عطّله على العقدة عند الحاجة:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## التشغيل (في المقدمة)

```bash
openclaw node run --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف Gateway WebSocket (الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket (الافتراضي: `18789`)
- `--tls`: استخدام TLS لاتصال Gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (sha256)
- `--node-id <id>`: تجاوز معرّف العقدة (يمسح رمز الاقتران)
- `--display-name <name>`: تجاوز اسم عرض العقدة

## مصادقة Gateway لمضيف Node

يحل `openclaw node run` و`openclaw node install` مصادقة Gateway من config/env (لا توجد أعلام `--token`/`--password` على أوامر العقدة):

- يتم فحص `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` أولًا.
- ثم الرجوع إلى الإعداد المحلي: `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، لا يرث مضيف Node عمدًا `gateway.remote.token` / `gateway.remote.password`.
- إذا تم إعداد `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يُحلّا، يفشل حل مصادقة العقدة بشكل مغلق (من دون إخفاء عبر رجوع بعيد).
- في `gateway.mode=remote`، تكون حقول العميل البعيد (`gateway.remote.token` / `gateway.remote.password`) مؤهلة أيضًا وفق قواعد أولوية البعيد.
- لا يراعي حل مصادقة مضيف Node إلا متغيرات env باسم `OPENCLAW_GATEWAY_*`.

بالنسبة إلى عقدة تتصل بـ Gateway نصي عادي `ws://`، يتم قبول loopback،
وقيم IP الخاصة الحرفية، و`.local`، ومضيفات Tailnet `*.ts.net`. بالنسبة إلى
أسماء DNS الخاصة الموثوقة الأخرى، اضبط `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`؛
من دونه، يفشل بدء تشغيل العقدة بشكل مغلق ويطلب منك استخدام `wss://`، أو نفق SSH، أو
Tailscale. هذا تفعيل اختياري عبر بيئة العملية، وليس مفتاح إعداد
`openclaw.json`.
يقوم `openclaw node install` بحفظه داخل خدمة العقدة الخاضعة للإشراف عندما
يكون موجودًا في بيئة أمر التثبيت.

## الخدمة (في الخلفية)

ثبّت مضيف Node بلا واجهة كخدمة مستخدم.

```bash
openclaw node install --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف Gateway WebSocket (الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket (الافتراضي: `18789`)
- `--tls`: استخدام TLS لاتصال Gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (sha256)
- `--node-id <id>`: تجاوز معرّف العقدة (يمسح رمز الاقتران)
- `--display-name <name>`: تجاوز اسم عرض العقدة
- `--runtime <runtime>`: Runtime الخدمة (`node` أو `bun`)
- `--force`: إعادة التثبيت/الكتابة فوق الموجود إذا كان مثبتًا بالفعل

إدارة الخدمة:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

استخدم `openclaw node run` لمضيف Node يعمل في المقدمة (من دون خدمة).

تقبل أوامر الخدمة `--json` لإخراج قابل للقراءة آليًا.

يعيد مضيف Node محاولة إعادة تشغيل Gateway وإغلاقات الشبكة داخل العملية. إذا
أبلغ Gateway عن إيقاف مصادقة نهائي بسبب token/password/bootstrap، يسجل مضيف Node
تفاصيل الإغلاق ويخرج برمز غير صفري حتى يتمكن launchd/systemd من إعادة تشغيله
بإعدادات وبيانات اعتماد جديدة. تبقى إيقافات طلب الاقتران في تدفق المقدمة
حتى يمكن الموافقة على الطلب المعلّق.

## الاقتران

ينشئ الاتصال الأول طلب اقتران جهاز معلّقًا (`role: node`) على Gateway.
وافق عليه عبر:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

في شبكات العقد الخاضعة لرقابة مشددة، يمكن لمشغّل Gateway تفعيل الموافقة
التلقائية صراحةً على اقتران العقدة لأول مرة من CIDR موثوقة:

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

هذا معطّل افتراضيًا. ينطبق فقط على اقتران `role: node` جديد
من دون نطاقات مطلوبة. لا يزال العملاء من نوع المشغّل/المتصفح، وControl UI، وWebChat، وترقيات الدور،
والنطاق، والبيانات الوصفية، أو المفتاح العام تتطلب موافقة يدوية.

إذا أعادت العقدة محاولة الاقتران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
يتم استبدال الطلب المعلّق السابق وإنشاء `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

يخزّن مضيف Node معرّف العقدة، والرمز، واسم العرض، ومعلومات اتصال Gateway في
`~/.openclaw/node.json`.

## موافقات exec

يخضع `system.run` لموافقات exec المحلية:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`، أو
  `~/.openclaw/exec-approvals.json` عندما لا يكون المتغير مضبوطًا
- [موافقات exec](/ar/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (التحرير من Gateway)

بالنسبة إلى exec غير المتزامن المعتمد على العقدة، يحضّر OpenClaw خطة `systemRunPlan`
قياسية قبل طلب الموافقة. يعيد تمرير `system.run` المعتمد لاحقًا استخدام تلك
الخطة المخزنة، لذلك تُرفض التعديلات على حقول الأمر/cwd/session بعد إنشاء
طلب الموافقة بدلًا من تغيير ما تنفذه العقدة.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [العقد](/ar/nodes)
