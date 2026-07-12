---
read_when:
    - ما زلت تستخدم `openclaw daemon ...` في البرامج النصية
    - تحتاج إلى أوامر دورة حياة الخدمة (التثبيت/البدء/الإيقاف/إعادة التشغيل/الحالة)
summary: مرجع CLI للأمر `openclaw daemon` (اسم مستعار قديم لإدارة خدمة Gateway)
title: العملية الخفية
x-i18n:
    generated_at: "2026-07-12T05:43:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

اسم مستعار قديم لإدارة خدمة Gateway. يُطابق `openclaw daemon ...` أوامر التحكم في الخدمة نفسها التي يوفّرها `openclaw gateway ...`. يُفضّل استخدام [`openclaw gateway`](/ar/cli/gateway) في الوثائق والأمثلة الحالية.

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

| الأمر الفرعي | الخيارات |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status` | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install` | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json` |
| `uninstall` | `--json` |
| `start` | `--json` |
| `stop` | `--json`، `--disable` (في launchd فقط: تعطيل KeepAlive/RunAtLoad بصورة مستمرة حتى التشغيل التالي) |
| `restart` | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json` |

- `status`: يعرض حالة تثبيت الخدمة (launchd/systemd/schtasks) ويتحقق من سلامة Gateway.
- `install`: يثبّت الخدمة؛ ويعيد `--force` تثبيت التثبيت الموجود أو يستبدله.
- `restart --safe`: يطلب من Gateway قيد التشغيل إجراء فحص تمهيدي للعمل النشط وجدولة إعادة تشغيل واحدة مدمجة بعد انتهاء العمل، ضمن الحد الذي يحدده `gateway.reload.deferralTimeoutMs` (القيمة الافتراضية 300000 مللي ثانية/5 دقائق؛ اضبطه على `0` للانتظار إلى أجل غير مسمى). عند انتهاء هذه المهلة، تُفرض إعادة التشغيل في جميع الأحوال. يستخدم `restart` العادي مدير الخدمة مباشرةً؛ أما `--force` فهو التجاوز الفوري.
- `restart --safe --skip-deferral`: يتجاوز بوابة تأجيل العمل النشط، بحيث يُعاد تشغيل Gateway فورًا حتى عند الإبلاغ عن عوائق. يتطلب `--safe`.

## ملاحظات

- يحلّ `status` مراجع الأسرار SecretRefs للمصادقة المُعدّة من أجل مصادقة الفحص متى أمكن. إذا تعذّر حل SecretRef مطلوب، يُبلغ `status --json` عن `rpc.authWarning`؛ مرّر `--token`/`--password` صراحةً أو عالج مصدر السر أولًا. تُخفى تحذيرات تعذّر حل المصادقة بمجرد نجاح الفحص من الجوانب الأخرى.
- يضيف `status --deep` فحصًا على مستوى النظام وفق أفضل جهد بحثًا عن خدمات أخرى شبيهة بـ Gateway (ويطبع إرشادات التنظيف؛ وتظل التوصية هي تشغيل Gateway واحد لكل جهاز)، كما يُجري التحقق من الإعدادات في وضع واعٍ بالـ Plugin، ويُظهر تحذيرات بيان Plugin التي يتجاوزها المسار الافتراضي السريع.
- في عمليات تثبيت systemd على Linux، تفحص اختبارات انحراف الرمز المميز مصدري الوحدة `Environment=` و`EnvironmentFile=` كليهما.
- تحلّ اختبارات انحراف الرمز المميز مراجع الأسرار SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة وقت التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية). إذا لم تكن مصادقة الرمز المميز مفعّلة فعليًا (`gateway.auth.mode` مضبوط على `password`/`none`/`trusted-proxy`، أو غير مضبوط مع إمكانية تغلّب كلمة المرور)، فيُتخطى حل رمز الإعدادات المميز.
- يتحقق `install` من إمكانية حل `gateway.auth.token` المُدار عبر SecretRef، لكنه لا يحفظ القيمة المحلولة مطلقًا في بيانات بيئة الخدمة الوصفية؛ وإذا تعذّر حلها، يفشل التثبيت بصورة مغلقة وآمنة.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مُعدًّا وكان `gateway.auth.mode` غير مضبوط، يحظر `install` المتابعة حتى تضبط الوضع صراحةً.
- على macOS، يُبقي `install` ملفات plist الخاصة بـ LaunchAgent وملف البيئة/الغلاف المُنشأ مقتصرةً على المالك (الوضع `0600`/`0700`) بدلًا من تضمين الأسرار في `EnvironmentVariables`.
- لتشغيل عدة مثيلات Gateway على مضيف واحد: اعزل المنافذ والإعدادات/الحالة ومساحات العمل. راجع [مثيلات Gateway المتعددة](/ar/gateway#multiple-gateways-same-host).

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
