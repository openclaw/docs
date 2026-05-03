---
read_when:
    - تحتاج إلى متابعة سجلات Gateway عن بُعد (بدون SSH)
    - تريد أسطر سجلات JSON للأدوات
summary: مرجع CLI لـ `openclaw logs` (تتبّع سجلات Gateway عبر RPC)
title: السجلات
x-i18n:
    generated_at: "2026-05-03T21:28:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

تابِع سجلات ملف Gateway عبر RPC (يعمل في الوضع البعيد).

ذات صلة:

- نظرة عامة على التسجيل: [التسجيل](/ar/logging)
- CLI الخاص بـ Gateway: [gateway](/ar/cli/gateway)

## الخيارات

- `--limit <n>`: الحد الأقصى لعدد أسطر السجل المراد إرجاعها (الافتراضي `200`)
- `--max-bytes <n>`: الحد الأقصى للبايتات المراد قراءتها من ملف السجل (الافتراضي `250000`)
- `--follow`: متابعة تدفق السجل
- `--interval <ms>`: فاصل الاستقصاء أثناء المتابعة (الافتراضي `1000`)
- `--json`: إخراج أحداث JSON مفصولة بالأسطر
- `--plain`: إخراج نص عادي دون تنسيق مزيّن
- `--no-color`: تعطيل ألوان ANSI
- `--local-time`: عرض الطوابع الزمنية في منطقتك الزمنية المحلية

## خيارات RPC المشتركة لـ Gateway

يقبل `openclaw logs` أيضًا أعلام عميل Gateway القياسية:

- `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway
- `--token <token>`: رمز Gateway
- `--timeout <ms>`: المهلة بالمللي ثانية (الافتراضي `30000`)
- `--expect-final`: انتظار استجابة نهائية عندما يكون استدعاء Gateway مدعومًا بوكيل

عند تمرير `--url`، لا يطبّق CLI تلقائيًا بيانات اعتماد الإعدادات أو البيئة. ضمّن `--token` صراحةً إذا كان Gateway الهدف يتطلب المصادقة.

## أمثلة

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## ملاحظات

- استخدم `--local-time` لعرض الطوابع الزمنية في منطقتك الزمنية المحلية.
- إذا طلب Gateway الضمني عبر local loopback المحلي الاقتران، أو أُغلق أثناء الاتصال، أو انتهت مهلته قبل أن يجيب `logs.tail`، يعود `openclaw logs` تلقائيًا إلى سجل ملف Gateway المُعدّ. أهداف `--url` الصريحة لا تستخدم هذا الرجوع الاحتياطي.
- عند استخدام `--follow`، تؤدي انقطاعات Gateway العابرة (إغلاق WebSocket، انتهاء المهلة، انقطاع الاتصال) إلى إعادة اتصال تلقائية مع تراجع أسي (حتى 8 محاولات، وبحد أقصى 30 ثانية بين المحاولات). يُطبع تحذير إلى stderr عند كل إعادة محاولة، وتُطبع ملاحظة `[logs] gateway reconnected` بمجرد نجاح استقصاء. في وضع `--json`، يُصدر كل من تحذير إعادة المحاولة وانتقال إعادة الاتصال كسجلات `{"type":"notice"}` على stderr. لا تزال الأخطاء غير القابلة للاسترداد (فشل المصادقة، إعدادات سيئة) تخرج فورًا.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [تسجيل Gateway](/ar/gateway/logging)
