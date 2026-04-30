---
read_when:
    - ما زلت تستخدم `openclaw daemon ...` في السكربتات
    - تحتاج إلى أوامر دورة حياة الخدمة (install/start/stop/restart/status)
summary: مرجع CLI لـ `openclaw daemon` (اسم مستعار قديم لإدارة خدمة Gateway)
title: الخدمة الخلفية
x-i18n:
    generated_at: "2026-04-30T07:47:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

اسم بديل قديم لأوامر إدارة خدمة Gateway.

يتطابق `openclaw daemon ...` مع سطح التحكم في الخدمة نفسه الخاص بأوامر خدمة `openclaw gateway ...`.

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
- دورة الحياة (`uninstall|start|stop|restart`): `--json`

ملاحظات:

- يحل `status` مراجع SecretRef المكوّنة للمصادقة عند الفحص متى أمكن.
- إذا لم يُحل مرجع SecretRef مطلوب للمصادقة في مسار هذا الأمر، فإن `daemon status --json` يبلّغ عن `rpc.authWarning` عند فشل اتصال الفحص أو المصادقة؛ مرّر `--token`/`--password` صراحةً أو حلّ مصدر السر أولًا.
- إذا نجح الفحص، تُكبت تحذيرات مراجع المصادقة غير المحلولة لتجنب النتائج الإيجابية الكاذبة.
- يضيف `status --deep` فحصًا لخدمة على مستوى النظام وفق أفضل جهد. عندما يعثر على خدمات أخرى شبيهة بـ Gateway، يطبع الإخراج البشري تلميحات للتنظيف وينبّه إلى أن وجود Gateway واحد لكل جهاز لا يزال هو التوصية المعتادة.
- في تثبيتات `systemd` على Linux، تشمل فحوصات انحراف الرمز المميز مصدري الوحدة `Environment=` و`EnvironmentFile=`.
- تحل فحوصات الانحراف مراجع SecretRef الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة، بدءًا ببيئة أمر الخدمة ثم بيئة العملية كخيار احتياطي.
- إذا لم تكن مصادقة الرمز المميز نشطة فعليًا، سواء عبر `gateway.auth.mode` صريح بقيمة `password`/`none`/`trusted-proxy`، أو عندما يكون الوضع غير مضبوط ويمكن لكلمة المرور أن تكون السائدة ولا يوجد مرشح رمز مميز يمكن أن يكون سائدًا، تتخطى فحوصات انحراف الرمز المميز حل رمز التكوين.
- عندما تتطلب مصادقة الرمز المميز رمزًا ويكون `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق `install` من أن SecretRef قابل للحل، لكنه لا يحفظ الرمز المحلول داخل بيانات تعريف بيئة الخدمة.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef المكوّن للرمز غير محلول، يفشل التثبيت بإغلاق آمن.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت إلى أن يُضبط الوضع صراحةً.
- على macOS، يُبقي `install` ملفات LaunchAgent plists مملوكة للمالك فقط، ويحمّل قيم بيئة الخدمة المُدارة عبر ملف ومغلّف مملوكين للمالك فقط بدلًا من تسلسل مفاتيح API أو مراجع بيئة ملف المصادقة الشخصي داخل `EnvironmentVariables`.
- إذا كنت تشغّل عمدًا عدة Gateways على مضيف واحد، فاعزل المنافذ والتكوين/الحالة ومساحات العمل؛ راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

## يُفضّل

استخدم [`openclaw gateway`](/ar/cli/gateway) للاطلاع على الوثائق والأمثلة الحالية.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
