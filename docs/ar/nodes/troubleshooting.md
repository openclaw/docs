---
read_when:
    - العقدة متصلة لكن أدوات الكاميرا/Canvas/الشاشة/exec تفشل
    - تحتاج إلى النموذج الذهني للفرق بين اقتران العقدة والموافقات
summary: استكشاف أخطاء اقتران العقدة، ومتطلبات الواجهة الأمامية، والأذونات، وإخفاقات الأدوات وإصلاحها
title: استكشاف أخطاء العقدة وإصلاحها
x-i18n:
    generated_at: "2026-04-24T07:50:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

استخدم هذه الصفحة عندما تكون العقدة مرئية في الحالة لكن أدوات العقدة تفشل.

## تسلسل الأوامر

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

ثم شغّل الفحوصات الخاصة بالعقدة:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

إشارات السلامة:

- العقدة متصلة ومقترنة للدور `node`.
- يتضمن `nodes describe` الإمكانية التي تستدعيها.
- تعرض موافقات exec الوضع/قائمة السماح المتوقعين.

## متطلبات الواجهة الأمامية

تكون `canvas.*` و`camera.*` و`screen.*` مخصصة للواجهة الأمامية فقط على عقد iOS/Android.

فحص وإصلاح سريعان:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

إذا رأيت `NODE_BACKGROUND_UNAVAILABLE`، فأحضر تطبيق العقدة إلى الواجهة الأمامية ثم أعد المحاولة.

## مصفوفة الأذونات

| الإمكانية                    | iOS                                     | Android                                      | تطبيق عقدة macOS               | رمز الفشل المعتاد              |
| --------------------------- | --------------------------------------- | -------------------------------------------- | ------------------------------ | ------------------------------ |
| `camera.snap`, `camera.clip` | الكاميرا (+ الميكروفون لصوت المقطع)     | الكاميرا (+ الميكروفون لصوت المقطع)          | الكاميرا (+ الميكروفون لصوت المقطع) | `*_PERMISSION_REQUIRED`        |
| `screen.record`             | تسجيل الشاشة (+ الميكروفون اختياريًا)   | مطالبة التقاط الشاشة (+ الميكروفون اختياريًا) | تسجيل الشاشة                   | `*_PERMISSION_REQUIRED`        |
| `location.get`              | أثناء الاستخدام أو دائمًا (بحسب الوضع)  | موقع في الواجهة الأمامية/الخلفية بحسب الوضع  | إذن الموقع                     | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                | غير منطبق (مسار مضيف العقدة)            | غير منطبق (مسار مضيف العقدة)                 | يتطلب موافقات exec            | `SYSTEM_RUN_DENIED`            |

## الاقتران مقابل الموافقات

هذان حاجزان مختلفان:

1. **اقتران الجهاز**: هل تستطيع هذه العقدة الاتصال بـ gateway؟
2. **سياسة أوامر عقدة Gateway**: هل معرّف أمر RPC مسموح به عبر `gateway.nodes.allowCommands` / `denyCommands` والقيم الافتراضية للمنصة؟
3. **موافقات Exec**: هل تستطيع هذه العقدة تشغيل أمر shell محدد محليًا؟

فحوصات سريعة:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

إذا كان الاقتران مفقودًا، فوافق أولًا على جهاز العقدة.
إذا كان `nodes describe` يفتقد أمرًا ما، فتحقق من سياسة أوامر عقدة gateway وما إذا كانت العقدة قد أعلنت ذلك الأمر فعلًا عند الاتصال.
إذا كان الاقتران جيدًا لكن `system.run` يفشل، فأصلح موافقات exec/قائمة السماح على تلك العقدة.

يُعد اقتران العقدة حاجز هوية/ثقة، وليس سطح موافقة لكل أمر. وبالنسبة إلى `system.run`، فإن السياسة لكل عقدة توجد في ملف موافقات exec الخاص بتلك العقدة (`openclaw approvals get --node ...`)، وليس في سجل اقتران gateway.

بالنسبة إلى التشغيلات المعتمدة على الموافقة من نوع `host=node`، يربط gateway أيضًا التنفيذ بخطة `systemRunPlan` القانونية المجهزة. وإذا عدّل مستدعٍ لاحق الأمر أو `cwd` أو بيانات الجلسة الوصفية قبل تمرير التشغيل الموافق عليه، فإن gateway يرفض التشغيل باعتباره عدم تطابق في الموافقة بدلًا من الوثوق بالحمولة المحررة.

## رموز أخطاء العقدة الشائعة

- `NODE_BACKGROUND_UNAVAILABLE` → التطبيق في الخلفية؛ أحضره إلى الواجهة الأمامية.
- `CAMERA_DISABLED` → مفتاح الكاميرا معطل في إعدادات العقدة.
- `*_PERMISSION_REQUIRED` → إذن نظام التشغيل مفقود/مرفوض.
- `LOCATION_DISABLED` → وضع الموقع متوقف.
- `LOCATION_PERMISSION_REQUIRED` → وضع الموقع المطلوب غير ممنوح.
- `LOCATION_BACKGROUND_UNAVAILABLE` → التطبيق في الخلفية لكن إذن «أثناء الاستخدام» فقط موجود.
- `SYSTEM_RUN_DENIED: approval required` → طلب exec يحتاج إلى موافقة صريحة.
- `SYSTEM_RUN_DENIED: allowlist miss` → الأمر محظور بواسطة وضع قائمة السماح.
  على مضيفات عقد Windows، تُعامَل صيغ غلاف shell مثل `cmd.exe /c ...` على أنها إخفاقات في قائمة السماح في
  وضع قائمة السماح ما لم تتم الموافقة عليها عبر تدفق ask.

## حلقة استعادة سريعة

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

إذا بقيت عالقًا:

- أعد الموافقة على اقتران الجهاز.
- أعد فتح تطبيق العقدة (في الواجهة الأمامية).
- امنح أذونات نظام التشغيل مرة أخرى.
- أعد إنشاء/ضبط سياسة موافقة exec.

ذو صلة:

- [/nodes/index](/ar/nodes/index)
- [/nodes/camera](/ar/nodes/camera)
- [/nodes/location-command](/ar/nodes/location-command)
- [/tools/exec-approvals](/ar/tools/exec-approvals)
- [/gateway/pairing](/ar/gateway/pairing)

## ذو صلة

- [نظرة عامة على Nodes](/ar/nodes)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
