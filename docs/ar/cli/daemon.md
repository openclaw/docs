---
read_when:
    - لا تزال تستخدم `openclaw daemon ...` في النصوص البرمجية
    - تحتاج إلى أوامر دورة حياة الخدمة (install/start/stop/restart/status)
summary: مرجع CLI لـ `openclaw daemon` (اسم مستعار قديم لإدارة خدمة Gateway)
title: البرنامج الخفي
x-i18n:
    generated_at: "2026-05-02T22:17:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

اسم مستعار قديم لأوامر إدارة خدمة Gateway.

يُطابق `openclaw daemon ...` واجهة التحكم في الخدمة نفسها مثل أوامر خدمة `openclaw gateway ...`.

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
- `restart`: `--force`, `--wait <duration>`, `--json`
- دورة الحياة (`uninstall|start|stop`): `--json`

ملاحظات:

- يحلّ `status` مراجع SecretRef للمصادقة المكوّنة من أجل مصادقة الفحص عندما يكون ذلك ممكنًا.
- إذا تعذّر حلّ SecretRef مطلوب للمصادقة في مسار هذا الأمر، فإن `daemon status --json` يبلّغ عن `rpc.authWarning` عند فشل اتصال الفحص أو المصادقة؛ مرّر `--token`/`--password` صراحةً أو حلّ مصدر السر أولًا.
- إذا نجح الفحص، تُكبت تحذيرات مراجع المصادقة غير المحلولة لتجنّب النتائج الإيجابية الكاذبة.
- يضيف `status --deep` فحصًا على مستوى النظام للخدمة بأفضل جهد. عندما يجد خدمات أخرى شبيهة بـ Gateway، تطبع المخرجات البشرية تلميحات للتنظيف وتحذّر من أن التوصية المعتادة لا تزال تشغيل Gateway واحد لكل جهاز.
- في تثبيتات Linux systemd، تشمل فحوصات انحراف الرمز المميز في `status` مصدري الوحدة `Environment=` و`EnvironmentFile=`.
- تحلّ فحوصات الانحراف مراجع SecretRef الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة، بيئة أمر الخدمة أولًا ثم بيئة العملية كخيار احتياطي.
- إذا لم تكن مصادقة الرمز المميز نشطة فعليًا، سواء بسبب `gateway.auth.mode` صريح بقيمة `password`/`none`/`trusted-proxy`، أو بسبب عدم ضبط الوضع عندما يمكن أن تكون كلمة المرور هي الفائزة ولا يمكن لأي مرشح رمز مميز أن يفوز، تتخطى فحوصات انحراف الرمز المميز حلّ رمز الإعدادات.
- عندما تتطلب مصادقة الرمز المميز رمزًا ويكون `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق `install` من أن SecretRef قابل للحل لكنه لا يحفظ الرمز المحلول في بيانات تعريف بيئة الخدمة.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef المكوّن للرمز غير محلول، يفشل التثبيت بإغلاق آمن.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت حتى يُضبط الوضع صراحةً.
- على macOS، يحافظ `install` على ملفات LaunchAgent plists مملوكة للمالك فقط، ويحمّل قيم بيئة الخدمة المُدارة عبر ملف ومغلّف مملوكين للمالك فقط بدلًا من تسلسل مفاتيح API أو مراجع بيئة ملف تعريف المصادقة في `EnvironmentVariables`.
- إذا كنت تشغّل عدة Gateway عمدًا على مضيف واحد، فاعزل المنافذ والإعدادات/الحالة ومساحات العمل؛ راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

## المفضّل

استخدم [`openclaw gateway`](/ar/cli/gateway) للاطلاع على الوثائق والأمثلة الحالية.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
