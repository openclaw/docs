---
read_when:
    - تشغيل مضيف Node بلا واجهة
    - إقران عقدة غير macOS لـ system.run
summary: مرجع CLI لـ `openclaw node` (مضيف Node دون واجهة رسومية)
title: Node
x-i18n:
    generated_at: "2026-07-01T13:01:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

شغّل **مضيف Node بدون واجهة** يتصل بـ Gateway WebSocket ويعرض
`system.run` / `system.which` على هذا الجهاز.

## لماذا تستخدم مضيف Node؟

استخدم مضيف Node عندما تريد من الوكلاء **تشغيل أوامر على أجهزة أخرى** في
شبكتك دون تثبيت تطبيق macOS companion كامل هناك.

حالات الاستخدام الشائعة:

- تشغيل الأوامر على أجهزة Linux/Windows بعيدة (خوادم البناء، أجهزة المختبر، NAS).
- إبقاء exec **معزولاً في sandbox** على Gateway، مع تفويض عمليات التشغيل المعتمدة إلى مضيفين آخرين.
- توفير هدف تنفيذ خفيف وبدون واجهة للأتمتة أو عُقد CI.

يبقى التنفيذ محمياً بواسطة **موافقات exec** وقوائم السماح لكل وكيل على
مضيف Node، حتى تتمكن من إبقاء الوصول إلى الأوامر محدوداً وصريحاً.

## وكيل المتصفح (بدون إعداد)

تعلن مضيفات Node تلقائياً عن وكيل متصفح إذا لم يكن `browser.enabled`
معطلاً على العقدة. يتيح هذا للوكيل استخدام أتمتة المتصفح على تلك العقدة
دون إعداد إضافي.

افتراضياً، يعرّض الوكيل سطح ملف تعريف المتصفح العادي للعقدة. إذا ضبطت
`nodeHost.browserProxy.allowProfiles`، يصبح الوكيل مقيّداً:
يُرفض استهداف ملفات التعريف غير المدرجة في قائمة السماح، وتُحظر مسارات
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
- `--context-path <path>`: مسار سياق Gateway WebSocket (مثل `/openclaw-gw`). يُضاف إلى WebSocket URL.
- `--tls`: استخدم TLS لاتصال Gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (sha256)
- `--node-id <id>`: تجاوز معرّف العقدة (يمسح رمز الاقتران)
- `--display-name <name>`: تجاوز اسم عرض العقدة

## مصادقة Gateway لمضيف Node

يحل `openclaw node run` و`openclaw node install` مصادقة Gateway من config/env (لا توجد أعلام `--token`/`--password` على أوامر العقدة):

- يتم فحص `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` أولاً.
- ثم خيار الرجوع إلى الإعداد المحلي: `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، لا يرث مضيف Node عمداً `gateway.remote.token` / `gateway.remote.password`.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يُحل، يفشل حل مصادقة العقدة بشكل مغلق (دون إخفاء عبر رجوع بعيد).
- في `gateway.mode=remote`، تكون حقول العميل البعيد (`gateway.remote.token` / `gateway.remote.password`) مؤهلة أيضاً وفق قواعد أسبقية الوضع البعيد.
- لا يراعي حل مصادقة مضيف Node إلا متغيرات env من نمط `OPENCLAW_GATEWAY_*`.

بالنسبة إلى عقدة تتصل بـ Gateway نصي صريح `ws://`، تُقبل عناوين حلقة الإرجاع، وعناوين IP
الخاصة الحرفية، و`.local`، ومضيفات Tailnet `*.ts.net`. بالنسبة إلى أسماء
private-DNS الموثوقة الأخرى، اضبط `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`؛ ومن دونه
يفشل بدء العقدة بشكل مغلق ويطلب منك استخدام `wss://`، أو نفق SSH، أو
Tailscale. هذا اشتراك على مستوى بيئة العملية، وليس مفتاح config في
`openclaw.json`.
يثبّته `openclaw node install` داخل خدمة العقدة المُدارة عندما يكون
موجوداً في بيئة أمر التثبيت.

## الخدمة (في الخلفية)

ثبّت مضيف Node بدون واجهة كخدمة مستخدم.

```bash
openclaw node install --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف Gateway WebSocket (الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket (الافتراضي: `18789`)
- `--context-path <path>`: مسار سياق Gateway WebSocket (مثل `/openclaw-gw`). يُضاف إلى WebSocket URL.
- `--tls`: استخدم TLS لاتصال Gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (sha256)
- `--node-id <id>`: تجاوز معرّف العقدة (يمسح رمز الاقتران)
- `--display-name <name>`: تجاوز اسم عرض العقدة
- `--runtime <runtime>`: وقت تشغيل الخدمة (`node` أو `bun`)
- `--force`: أعد التثبيت/اكتب فوق الموجود إذا كان مثبتاً بالفعل

إدارة الخدمة:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

استخدم `openclaw node run` لمضيف Node في المقدمة (بدون خدمة).

تقبل أوامر الخدمة `--json` لمخرجات قابلة للقراءة آلياً.

يعيد مضيف Node محاولة تشغيل Gateway وإغلاق الشبكة داخل العملية. إذا أبلغ
Gateway عن إيقاف مصادقة نهائي للرمز/كلمة المرور/bootstrap، يسجّل مضيف Node
تفاصيل الإغلاق ويخرج بقيمة غير صفرية حتى يتمكن launchd/systemd من إعادة تشغيله
بإعدادات وبيانات اعتماد جديدة. تبقى إيقافات الاقتران المطلوبة في مسار
المقدمة حتى يمكن اعتماد الطلب المعلّق.

## الاقتران

ينشئ الاتصال الأول طلب اقتران جهاز معلّقاً (`role: node`) على Gateway.
اعتمده عبر:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

في شبكات العقد الخاضعة لرقابة صارمة، يمكن لمشغّل Gateway الاشتراك صراحةً
في اعتماد اقتران العقدة لأول مرة تلقائياً من نطاقات CIDR موثوقة:

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

هذا معطّل افتراضياً. ولا ينطبق إلا على اقتران `role: node` جديد
دون نطاقات مطلوبة. ما تزال عملاء المشغّل/المتصفح، وControl UI، وWebChat، وترقيات الدور،
والنطاق، والبيانات الوصفية، أو المفتاح العام تتطلب اعتماداً يدوياً.

إذا أعادت العقدة محاولة الاقتران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
يتم تجاوز الطلب المعلّق السابق ويُنشأ `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الاعتماد.

يخزن مضيف Node معرّف العقدة، والرمز، واسم العرض، ومعلومات اتصال Gateway في
`~/.openclaw/node.json`.

## موافقات exec

`system.run` محمي بموافقات exec المحلية:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`، أو
  `~/.openclaw/exec-approvals.json` عندما لا يكون المتغير مضبوطاً
- [موافقات exec](/ar/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (تحرير من Gateway)

بالنسبة إلى exec عقدة غير متزامن معتمد، يحضّر OpenClaw `systemRunPlan` قانونية
قبل المطالبة. يستخدم توجيه `system.run` المعتمد لاحقاً تلك الخطة المخزنة
نفسها، لذلك تُرفض التعديلات على حقول command/cwd/session بعد إنشاء طلب
الموافقة بدلاً من تغيير ما تنفذه العقدة.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [العقد](/ar/nodes)
