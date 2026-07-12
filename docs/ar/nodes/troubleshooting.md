---
read_when:
    - Node متصل، لكن أدوات الكاميرا/لوحة الرسم/الشاشة/التنفيذ تفشل
    - تحتاج إلى فهم النموذج الذهني لإقران Node مقارنةً بالموافقات
summary: استكشاف أخطاء إقران Node ومتطلبات التشغيل في المقدمة والأذونات وإخفاقات الأدوات وإصلاحها
title: استكشاف أخطاء Node وإصلاحها
x-i18n:
    generated_at: "2026-07-12T06:12:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

استخدم هذه الصفحة عندما تكون Node ظاهرة في الحالة، لكن أدوات Node تفشل.

## تسلسل الأوامر

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

ثم نفّذ عمليات التحقق الخاصة بـ Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

مؤشرات السلامة:

- تكون Node متصلة ومقترنة للدور `node`.
- يتضمن `nodes describe` الإمكانية التي تستدعيها.
- تعرض موافقات التنفيذ الوضع/قائمة السماح المتوقعة.

## متطلبات التشغيل في الواجهة

لا تعمل `canvas.*` و`camera.*` و`screen.*` إلا عندما يكون التطبيق في الواجهة على عُقد iOS/Android.

تحقق وإصلاح سريعان:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

إذا ظهر `NODE_BACKGROUND_UNAVAILABLE`، فانقل تطبيق Node إلى الواجهة وأعد المحاولة.

## مصفوفة الأذونات

| الإمكانية                     | iOS                                      | Android                                            | تطبيق Node على macOS                     | رمز الفشل المعتاد                              |
| ---------------------------- | ---------------------------------------- | -------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| `camera.snap`, `camera.clip` | الكاميرا (+ الميكروفون لصوت المقطع)      | الكاميرا (+ الميكروفون لصوت المقطع)                | الكاميرا (+ الميكروفون لصوت المقطع)      | `*_PERMISSION_REQUIRED`                        |
| `screen.record`              | تسجيل الشاشة (+ الميكروفون اختياري)      | مطالبة التقاط الشاشة (+ الميكروفون اختياري)        | تسجيل الشاشة                             | `*_PERMISSION_REQUIRED`                        |
| `computer.act`               | غير متاح                                 | غير متاح                                           | تسهيلات الاستخدام + تسجيل الشاشة         | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED`  |
| `location.get`               | أثناء الاستخدام أو دائمًا (حسب الوضع)    | الموقع في الواجهة/الخلفية حسب الوضع                 | إذن الموقع                               | `LOCATION_PERMISSION_REQUIRED`                 |
| `system.run`                 | غير متاح (مسار مضيف Node)                | غير متاح (مسار مضيف Node)                          | موافقات التنفيذ مطلوبة                   | `SYSTEM_RUN_DENIED`                            |

## الاقتران مقابل الموافقات

تتحكم ثلاث بوابات منفصلة في نجاح أمر Node:

1. **اقتران الجهاز**: هل يمكن لهذه Node الاتصال بـ Gateway؟
2. **سياسة أوامر Node في Gateway**: هل معرّف أمر RPC مسموح به وفق `gateway.nodes.allowCommands` / `denyCommands` والإعدادات الافتراضية للمنصة؟
3. **موافقات التنفيذ**: هل يمكن لهذه Node تشغيل أمر shell محدد محليًا؟

اقتران Node هو بوابة هوية/ثقة، وليس واجهة موافقة لكل أمر. بالنسبة إلى `system.run`، توجد السياسة الخاصة بكل Node في ملف موافقات التنفيذ لتلك Node (`openclaw approvals get --node ...`)، وليس في سجل الاقتران في Gateway.

عمليات تحقق سريعة:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- الاقتران مفقود: وافق على جهاز Node أولًا.
- يفتقد `nodes describe` أمرًا: تحقق من سياسة أوامر Node في Gateway ومن أن Node أعلنت فعلًا عن ذلك الأمر عند الاتصال.
- الاقتران سليم لكن `system.run` يفشل: أصلح موافقات التنفيذ/قائمة السماح على تلك Node.

بالنسبة إلى عمليات التشغيل `host=node` المدعومة بالموافقة، يربط Gateway أيضًا التنفيذ بـ `systemRunPlan` الأساسي المُعَدّ. إذا عدّل مستدعٍ لاحق الأمر أو دليل العمل الحالي أو بيانات الجلسة الوصفية قبل تمرير التشغيل الموافق عليه، يرفض Gateway التشغيل باعتباره عدم تطابق في الموافقة بدلًا من الوثوق بالحمولة المعدّلة.

## رموز أخطاء Node الشائعة

| الرمز                                  | المعنى                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_BACKGROUND_UNAVAILABLE`          | التطبيق يعمل في الخلفية؛ انقله إلى الواجهة.                                                                                                                                                            |
| `CAMERA_DISABLED`                      | مفتاح تبديل الكاميرا معطّل في إعدادات Node.                                                                                                                                                            |
| `*_PERMISSION_REQUIRED`                | إذن نظام التشغيل مفقود/مرفوض.                                                                                                                                                                          |
| `LOCATION_DISABLED`                    | وضع الموقع متوقف.                                                                                                                                                                                       |
| `LOCATION_PERMISSION_REQUIRED`         | لم يُمنح وضع الموقع المطلوب.                                                                                                                                                                           |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | التطبيق يعمل في الخلفية، لكن المتاح فقط هو إذن أثناء الاستخدام.                                                                                                                                        |
| `COMPUTER_DISABLED`                    | فعّل **Allow Computer Control** في تطبيق macOS، ثم وافق على تحديث الاقتران.                                                                                                                             |
| `ACCESSIBILITY_REQUIRED`               | امنح تسهيلات الاستخدام لحزمة تطبيق OpenClaw الحالية في إعدادات نظام macOS.                                                                                                                            |
| `SYSTEM_RUN_DENIED: approval required` | يتطلب طلب التنفيذ موافقة صريحة.                                                                                                                                                                        |
| `SYSTEM_RUN_DENIED: allowlist miss`    | حُظر الأمر بواسطة وضع قائمة السماح. على مضيفات Node بنظام Windows، تُعامل صيغ أغلفة shell مثل `cmd.exe /c ...` على أنها غير موجودة في قائمة السماح عند استخدام وضع قائمة السماح، ما لم تتم الموافقة عليها عبر مسار السؤال. |

## حلقة الاسترداد السريع

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

إذا استمرت المشكلة:

- أعد الموافقة على اقتران الجهاز.
- أعد فتح تطبيق Node (في الواجهة).
- أعد منح أذونات نظام التشغيل.
- أعد إنشاء سياسة موافقة التنفيذ أو عدّلها.

للتحكم في الكمبيوتر، تحقق أيضًا من أن وكيلًا يدعم الرؤية يوفّر أداة `computer`، وأن `screen.snapshot` ينجح مع إذن تسجيل الشاشة، وأن `/phone status` يعرض تخويل Gateway المؤقت أو الدائم الذي قصدته. يتجاوز إدخال `gateway.nodes.denyCommands` دائمًا `allowCommands`.

## ذو صلة

- [نظرة عامة على العُقد](/ar/nodes)
- [عُقد الكاميرا](/ar/nodes/camera)
- [أمر الموقع](/ar/nodes/location-command)
- [استخدام الكمبيوتر](/ar/nodes/computer-use)
- [موافقات التنفيذ](/ar/tools/exec-approvals)
- [اقتران Gateway](/ar/gateway/pairing)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
