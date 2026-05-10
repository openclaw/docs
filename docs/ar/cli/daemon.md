---
read_when:
    - ما زلت تستخدم `openclaw daemon ...` في النصوص البرمجية
    - تحتاج إلى أوامر دورة حياة الخدمة (install/start/stop/restart/status)
summary: مرجع CLI لـ `openclaw daemon` (اسم مستعار قديم لإدارة خدمة Gateway)
title: الخدمة الخلفية
x-i18n:
    generated_at: "2026-05-10T19:30:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

اسم مستعار قديم لأوامر إدارة خدمة Gateway.

يعادل `openclaw daemon ...` سطح التحكم نفسه في الخدمة مثل أوامر خدمة `openclaw gateway ...`.

## الاستخدام

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## الأوامر الفرعية

- `status`: عرض حالة تثبيت الخدمة وفحص صحة Gateway
- `install`: تثبيت الخدمة (`launchd`/`systemd`/`schtasks`)
- `uninstall`: إزالة الخدمة
- `start`: بدء الخدمة
- `stop`: إيقاف الخدمة
- `restart`: إعادة تشغيل الخدمة

## الخيارات الشائعة

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- دورة الحياة (`uninstall|start|stop`): `--json`

ملاحظات:

- يحلّ `status` مراجع الأسرار SecretRefs للمصادقة المكوّنة من أجل مصادقة الفحص عندما يكون ذلك ممكنًا.
- إذا تعذّر حلّ مرجع سر SecretRef مطلوب في مسار هذا الأمر، فإن `daemon status --json` يبلّغ عن `rpc.authWarning` عندما يفشل اتصال الفحص أو المصادقة؛ مرّر `--token`/`--password` صراحةً أو حلّ مصدر السر أولًا.
- إذا نجح الفحص، تُكبت تحذيرات مراجع المصادقة غير المحلولة لتجنب النتائج الإيجابية الكاذبة.
- يضيف `status --deep` فحص خدمة على مستوى النظام بأفضل جهد. عندما يعثر على خدمات أخرى شبيهة بـ Gateway، يطبع الخرج البشري تلميحات تنظيف ويحذّر من أن Gateway واحدًا لكل جهاز لا يزال هو التوصية العادية.
- في تثبيتات Linux systemd، تشمل فحوصات انجراف الرمز المميز في `status` مصدري الوحدة `Environment=` و`EnvironmentFile=`.
- تحلّ فحوصات الانجراف مراجع الأسرار SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كخيار احتياطي).
- إذا لم تكن مصادقة الرمز المميز فعّالة عمليًا (`gateway.auth.mode` مضبوط صراحةً على `password`/`none`/`trusted-proxy`، أو كان الوضع غير مضبوط حيث يمكن لكلمة المرور أن تفوز ولا يمكن لأي مرشح رمز مميز أن يفوز)، تتخطى فحوصات انجراف الرمز المميز حلّ رمز التكوين.
- عندما تتطلب مصادقة الرمز المميز رمزًا ويكون `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق `install` من أن SecretRef قابل للحل لكنه لا يحفظ الرمز المحلول في بيانات تعريف بيئة الخدمة.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يفشل التثبيت بإغلاق آمن.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت حتى يُضبط الوضع صراحةً.
- على macOS، يبقي `install` ملفات LaunchAgent plists مقتصرة على المالك، ويحمّل قيم بيئة الخدمة المُدارة عبر ملف وغلاف مقتصرين على المالك بدلًا من تسلسل مفاتيح API أو مراجع بيئة ملف تعريف المصادقة داخل `EnvironmentVariables`.
- إذا كنت تشغّل عن قصد عدة Gateways على مضيف واحد، فاعزل المنافذ والتكوين/الحالة ومساحات العمل؛ راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
- يطلب `restart --safe` من Gateway الجاري تشغيله إجراء فحص مسبق للعمل النشط وجدولة إعادة تشغيل واحدة مدمجة بعد انتهاء العمل النشط. يحافظ `restart` العادي على سلوك مدير الخدمة الحالي؛ ويظل `--force` مسار التجاوز الفوري.
- يشغّل `restart --safe --skip-deferral` إعادة التشغيل الآمنة الواعية بـ OpenClaw لكنه يتجاوز بوابة تأجيل العمل النشط بحيث يصدر Gateway إعادة التشغيل فورًا حتى عند الإبلاغ عن عوائق. إنه مخرج طوارئ للمشغّل عندما يثبّت تشغيل مهمة عالقة إعادة التشغيل الآمنة؛ يتطلب `--safe`.

## الموصى به

استخدم [`openclaw gateway`](/ar/cli/gateway) للوثائق والأمثلة الحالية.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
