---
read_when:
    - ما زلت تستخدم `openclaw daemon ...` في البرامج النصية
    - أنت بحاجة إلى أوامر دورة حياة الخدمة (install/start/stop/restart/status)
summary: مرجع CLI لـ `openclaw daemon` (اسم مستعار قديم لإدارة خدمة Gateway)
title: الخدمة الخلفية
x-i18n:
    generated_at: "2026-04-24T07:34:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

اسم مستعار قديم لأوامر إدارة خدمة Gateway.

يقابل `openclaw daemon ...` سطح التحكم في الخدمة نفسه المستخدم في أوامر خدمة `openclaw gateway ...`.

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

- `status`: عرض حالة تثبيت الخدمة وفحص سلامة Gateway
- `install`: تثبيت الخدمة (`launchd`/`systemd`/`schtasks`)
- `uninstall`: إزالة الخدمة
- `start`: بدء الخدمة
- `stop`: إيقاف الخدمة
- `restart`: إعادة تشغيل الخدمة

## الخيارات الشائعة

- `status`: ‏`--url` و`--token` و`--password` و`--timeout` و`--no-probe` و`--require-rpc` و`--deep` و`--json`
- `install`: ‏`--port` و`--runtime <node|bun>` و`--token` و`--force` و`--json`
- دورة الحياة (`uninstall|start|stop|restart`): ‏`--json`

ملاحظات:

- يقوم `status` بحل SecretRefs الخاصة بالمصادقة والمهيأة لمصادقة الفحص عند الإمكان.
- إذا كانت SecretRef مطلوبة للمصادقة غير محلولة في مسار هذا الأمر، فإن `daemon status --json` يبلّغ عن `rpc.authWarning` عندما يفشل اتصال/مصادقة الفحص؛ مرّر `--token`/`--password` صراحةً أو قم أولًا بحل مصدر السر.
- إذا نجح الفحص، فسيتم كتم تحذيرات auth-ref غير المحلولة لتجنب الإيجابيات الكاذبة.
- يضيف `status --deep` فحصًا على مستوى النظام للخدمة بأفضل جهد. وعندما يعثر على خدمات أخرى شبيهة بـ gateway، فإن المخرجات البشرية تطبع تلميحات للتنظيف وتحذر من أن Gateway واحدًا لكل جهاز لا يزال هو التوصية المعتادة.
- في تثبيتات Linux systemd، تتضمن فحوصات انحراف الرمز في `status` كلا المصدرين `Environment=` و`EnvironmentFile=` للوحدة.
- تحل فحوصات الانحراف SecretRefs الخاصة بـ `gateway.auth.token` باستخدام env وقت التشغيل المدمج (env أمر الخدمة أولًا، ثم الرجوع الاحتياطي إلى env العملية).
- إذا لم تكن مصادقة الرمز مفعّلة فعليًا (وجود `gateway.auth.mode` صريح بقيمة `password` أو `none` أو `trusted-proxy`، أو إذا كان الوضع غير معيّن بحيث يمكن لكلمة المرور أن تفوز ولا يوجد مرشح رمز يمكنه الفوز)، فإن فحوصات انحراف الرمز تتخطى حل رمز الإعدادات.
- عندما تتطلب مصادقة الرمز وجود رمز ويكون `gateway.auth.token` مُدارًا عبر SecretRef، فإن `install` يتحقق من أن SecretRef قابلة للحل لكنه لا يحفظ الرمز المحلول داخل بيانات تعريف بيئة الخدمة.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكانت SecretRef الخاصة بالرمز المهيأ غير محلولة، فإن التثبيت يفشل بشكل مغلق.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير معيّن، فسيتم حظر التثبيت حتى يتم تعيين الوضع صراحةً.
- إذا كنت تشغّل عمدًا عدة Gateways على مضيف واحد، فاعزل المنافذ، والإعدادات/الحالة، ومساحات العمل؛ راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

## المفضّل

استخدم [`openclaw gateway`](/ar/cli/gateway) للحصول على المستندات والأمثلة الحالية.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
