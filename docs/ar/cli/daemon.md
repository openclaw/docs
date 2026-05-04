---
read_when:
    - لا تزال تستخدم `openclaw daemon ...` في النصوص البرمجية
    - تحتاج إلى أوامر دورة حياة الخدمة (install/start/stop/restart/status)
summary: مرجع CLI لـ `openclaw daemon` (اسم مستعار قديم لإدارة خدمة Gateway)
title: البرنامج الخفي
x-i18n:
    generated_at: "2026-05-04T18:23:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

اسم مستعار قديم لأوامر إدارة خدمة Gateway.

يُطابِق `openclaw daemon ...` واجهة التحكم بالخدمة نفسها التي تستخدمها أوامر خدمة `openclaw gateway ...`.

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
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- دورة الحياة (`uninstall|start|stop`): `--json`

ملاحظات:

- يحلّ `status` مراجع SecretRefs للمصادقة المهيأة من أجل مصادقة الفحص عندما يكون ذلك ممكنًا.
- إذا تعذّر حلّ مرجع SecretRef مطلوب للمصادقة في مسار هذا الأمر، فإن `daemon status --json` يُبلغ عن `rpc.authWarning` عند فشل اتصال الفحص أو مصادقته؛ مرّر `--token`/`--password` صراحةً أو حلّ مصدر السر أولًا.
- إذا نجح الفحص، تُخفى تحذيرات مراجع المصادقة غير المحلولة لتجنب النتائج الإيجابية الكاذبة.
- يضيف `status --deep` فحصًا بأفضل جهد على مستوى النظام للخدمات. عندما يجد خدمات أخرى شبيهة بالبوابة، يطبع الإخراج الموجّه للبشر تلميحات تنظيف ويحذّر بأن وجود بوابة واحدة لكل جهاز لا يزال التوصية العادية.
- في تثبيتات Linux systemd، تشمل فحوصات انحراف الرمز المميز كلاً من مصدري الوحدة `Environment=` و`EnvironmentFile=`.
- تحلّ فحوصات الانحراف مراجع SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة تشغيل مدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كخيار احتياطي).
- إذا لم تكن مصادقة الرمز المميز نشطة فعليًا (`gateway.auth.mode` صريح بقيمة `password`/`none`/`trusted-proxy`، أو الوضع غير مضبوط حيث يمكن أن تفوز كلمة المرور ولا يمكن لأي مرشح رمز مميز أن يفوز)، تتجاوز فحوصات انحراف الرمز المميز حلّ رمز التهيئة.
- عندما تتطلب مصادقة الرمز المميز رمزًا ويكون `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق `install` من أن SecretRef قابل للحل لكنه لا يحفظ الرمز المحلول في بيانات تعريف بيئة الخدمة.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef للرمز المهيأ غير محلول، يفشل التثبيت بإغلاق آمن.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت حتى يُضبط الوضع صراحةً.
- على macOS، يُبقي `install` ملفات LaunchAgent plists مملوكة للمالك فقط، ويحمّل قيم بيئة الخدمة المُدارة عبر ملف ومغلّف مملوكين للمالك فقط بدلًا من تسلسل مفاتيح API أو مراجع بيئة ملف تعريف المصادقة إلى `EnvironmentVariables`.
- إذا كنت تشغّل عمدًا عدة بوابات على مضيف واحد، فاعزل المنافذ والتهيئة والحالة ومساحات العمل؛ راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
- يطلب `restart --safe` من Gateway العامل إجراء فحص مسبق للعمل النشط وجدولة إعادة تشغيل واحدة مدمجة بعد انتهاء العمل النشط. يحافظ `restart` العادي على سلوك مدير الخدمة الحالي؛ ويبقى `--force` مسار التجاوز الفوري.

## يُفضَّل

استخدم [`openclaw gateway`](/ar/cli/gateway) للاطلاع على الوثائق والأمثلة الحالية.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
