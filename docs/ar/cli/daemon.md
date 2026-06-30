---
read_when:
    - ما زلت تستخدم `openclaw daemon ...` في السكربتات
    - تحتاج إلى أوامر دورة حياة الخدمة (install/start/stop/restart/status)
summary: مرجع CLI لـ `openclaw daemon` (اسم مستعار قديم لإدارة خدمة Gateway)
title: الخدمة الخلفية
x-i18n:
    generated_at: "2026-06-30T14:04:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

اسم مستعار قديم لأوامر إدارة خدمة Gateway.

يرتبط `openclaw daemon ...` بسطح التحكم نفسه في الخدمة مثل أوامر خدمة `openclaw gateway ...`.

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

- يحل `status` مراجع SecretRefs للمصادقة المكوّنة لمصادقة الفحص عندما يكون ذلك ممكنًا.
- إذا كان SecretRef مطلوب للمصادقة غير محلول في مسار هذا الأمر، فإن `daemon status --json` يبلّغ عن `rpc.authWarning` عند فشل اتصال الفحص/المصادقة؛ مرّر `--token`/`--password` صراحةً أو حلّ مصدر السر أولًا.
- إذا نجح الفحص، تُكبت تحذيرات مراجع المصادقة غير المحلولة لتجنب النتائج الإيجابية الزائفة.
- يضيف `status --deep` فحصًا على مستوى النظام للخدمة بأفضل جهد. عندما يعثر على خدمات أخرى شبيهة بالـ Gateway، يطبع الإخراج البشري تلميحات تنظيف ويحذّر من أن التوصية الطبيعية ما زالت Gateway واحدًا لكل جهاز.
- يشغّل `status --deep` أيضًا التحقق من الإعدادات في وضع مدرك للـ Plugin ويعرض تحذيرات بيانات تعريف بيان الـ Plugin المكوّنة (مثل بيانات تعريف إعدادات القناة المفقودة) حتى تلتقطها فحوصات التثبيت والتحديث السريعة. يحافظ `status` الافتراضي على المسار السريع للقراءة فقط الذي يتجاوز تحقق الـ Plugin.
- في تثبيتات Linux systemd، تتضمن فحوصات انحراف الرمز المميز في `status` مصدري الوحدة `Environment=` و`EnvironmentFile=`.
- تحل فحوصات الانحراف مراجع SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كخيار احتياطي).
- إذا لم تكن مصادقة الرمز المميز نشطة فعليًا (`gateway.auth.mode` صريح بقيمة `password`/`none`/`trusted-proxy`، أو الوضع غير مضبوط حيث يمكن أن تفوز كلمة المرور ولا يمكن لأي مرشح رمز مميز أن يفوز)، تتجاوز فحوصات انحراف الرمز المميز حل رمز الإعدادات.
- عندما تتطلب مصادقة الرمز المميز رمزًا ويكون `gateway.auth.token` مدارًا عبر SecretRef، يتحقق `install` من أن SecretRef قابل للحل لكنه لا يحفظ الرمز المحلول في بيانات تعريف بيئة الخدمة.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يفشل التثبيت بإغلاق آمن.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت حتى يُضبط الوضع صراحةً.
- على macOS، يحافظ `install` على ملفات LaunchAgent plists مملوكة للمالك فقط ويحمّل قيم بيئة الخدمة المُدارة من خلال ملف وغلاف مملوكين للمالك فقط بدلًا من تسلسل مفاتيح API أو مراجع بيئة ملفات تعريف المصادقة داخل `EnvironmentVariables`.
- إذا كنت تشغّل عمدًا عدة Gateways على مضيف واحد، فاعزل المنافذ والإعدادات/الحالة ومساحات العمل؛ راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
- يطلب `restart --safe` من Gateway العامل إجراء فحص مسبق للعمل النشط وجدولة إعادة تشغيل واحدة مدمجة بعد تصريف العمل النشط. تنتظر إعادة التشغيل الآمنة الافتراضية العمل النشط حتى قيمة `gateway.reload.deferralTimeoutMs` المكوّنة (الافتراضي 5 دقائق)؛ عند انتهاء هذه المهلة تُفرض إعادة التشغيل. اضبط `gateway.reload.deferralTimeoutMs` على `0` لانتظار آمن غير محدد لا يفرض الإعادة أبدًا. يحافظ `restart` العادي على سلوك مدير الخدمة الحالي؛ ويبقى `--force` مسار التجاوز الفوري.
- يشغّل `restart --safe --skip-deferral` إعادة التشغيل الآمنة المدركة لـ OpenClaw لكنه يتجاوز بوابة تأجيل العمل النشط بحيث يصدر Gateway إعادة التشغيل فورًا حتى عند الإبلاغ عن عوائق. هذا منفذ هروب للمشغّل عندما يثبّت تشغيل مهمة عالقة إعادة التشغيل الآمنة؛ يتطلب `--safe`.

## المفضّل

استخدم [`openclaw gateway`](/ar/cli/gateway) للاطلاع على الوثائق والأمثلة الحالية.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
