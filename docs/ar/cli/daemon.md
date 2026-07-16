---
read_when:
    - ما زلت تستخدم `openclaw daemon ...` في البرامج النصية
    - تحتاج إلى أوامر دورة حياة الخدمة (التثبيت/البدء/الإيقاف/إعادة التشغيل/الحالة)
summary: مرجع CLI لـ `openclaw daemon` (اسم مستعار قديم لإدارة خدمة Gateway)
title: خدمة خفية
x-i18n:
    generated_at: "2026-07-16T14:00:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

اسم مستعار قديم لإدارة خدمة Gateway. يرتبط `openclaw daemon ...` بأوامر التحكم في الخدمة نفسها التي يرتبط بها `openclaw gateway ...`. يُفضّل الرجوع إلى [`openclaw gateway`](/ar/cli/gateway) للاطلاع على الوثائق والأمثلة الحالية.

## الاستخدام

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## الأوامر الفرعية والخيارات

| الأمر الفرعي  | الخيارات                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (في launchd فقط: منع KeepAlive/RunAtLoad بصورة مستمرة حتى بدء التشغيل التالي) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: يعرض حالة تثبيت الخدمة (launchd/systemd/schtasks) ويتحقق من سلامة Gateway.
- `install`: يثبّت الخدمة؛ ويعيد `--force` تثبيت تثبيت موجود أو يستبدله.
- `restart --safe`: يطلب من Gateway قيد التشغيل إجراء فحص تمهيدي للعمل النشط وجدولة إعادة تشغيل واحدة مدمجة بعد انتهاء العمل، ضمن المهلة المحددة بواسطة `gateway.reload.deferralTimeoutMs` (القيمة الافتراضية 300000ms/5 دقائق؛ اضبطها على `0` للانتظار إلى أجل غير مسمى). عند انتهاء هذه المهلة، تُفرض إعادة التشغيل على أي حال. يستخدم `restart` العادي مدير الخدمة مباشرةً؛ ويُعد `--force` تجاوزًا فوريًا.
- `restart --safe --skip-deferral`: يتجاوز بوابة تأجيل العمل النشط لكي يُعاد تشغيل Gateway فورًا حتى عند الإبلاغ عن عوائق. يتطلب `--safe`.

## ملاحظات

- `status` يحل مراجع الأسرار SecretRefs للمصادقة المضبوطة لاستخدامها في مصادقة الفحص متى أمكن. إذا تعذر حل SecretRef مطلوب، يُبلغ `status --json` عن `rpc.authWarning`؛ مرّر `--token`/`--password` صراحةً أو قم أولًا بحل مصدر السر. تُمنع تحذيرات تعذر حل المصادقة بمجرد نجاح الفحص من النواحي الأخرى.
- `status --deep` يضيف فحصًا على مستوى النظام، وفق أفضل جهد، بحثًا عن خدمات أخرى شبيهة بـ Gateway (ويطبع إرشادات التنظيف؛ مع بقاء التوصية باستخدام Gateway واحد لكل جهاز)، ويشغّل التحقق من الإعدادات في وضع مدرك للـ Plugin، مما يُظهر تحذيرات بيان Plugin التي يتخطاها المسار الافتراضي السريع.
- في عمليات تثبيت systemd على Linux، تفحص عمليات التحقق من انحراف الرمز المميز مصدري الوحدات `Environment=` و`EnvironmentFile=` كليهما.
- تحل عمليات التحقق من انحراف الرمز المميز مراجع الأسرار SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة وقت التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية). إذا لم تكن مصادقة الرمز المميز نشطة فعليًا (`gateway.auth.mode` بقيمة `password`/`none`/`trusted-proxy`، أو غير مضبوطة مع قدرة كلمة المرور على أخذ الأولوية)، فيُتخطى حل رمز الإعدادات المميز.
- يتحقق `install` من إمكانية حل `gateway.auth.token` المُدار بواسطة SecretRef، لكنه لا يحفظ القيمة المحلولة مطلقًا في بيانات تعريف بيئة الخدمة؛ وإذا تعذر حله، يفشل التثبيت على نحو مغلق.
- إذا ضُبط كل من `gateway.auth.token` و`gateway.auth.password` ولم يُضبط `gateway.auth.mode`، فإن `install` يحظر المتابعة حتى تضبط الوضع صراحةً.
- على macOS، يحافظ `install` على ملفات plist الخاصة بـ LaunchAgent وملف البيئة/الغلاف المُنشأين بحيث لا يمكن الوصول إليها إلا من قِبل المالك (الوضع `0600`/`0700`) بدلًا من تضمين الأسرار في `EnvironmentVariables`.
- تشغيل عدة مثيلات من Gateway على مضيف واحد: اعزل المنافذ والإعدادات/الحالة ومساحات العمل. راجع [بوابات Gateway متعددة](/ar/gateway#multiple-gateways-same-host).

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
