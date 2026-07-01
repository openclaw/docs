---
read_when:
    - تحتاج إلى متابعة سجلات Gateway عن بُعد (بدون SSH)
    - تريد أسطر سجلات JSON للأدوات
summary: مرجع CLI لـ `openclaw logs` (تتبّع سجلات Gateway عبر RPC)
title: السجلات
x-i18n:
    generated_at: "2026-07-01T15:25:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

تابع سجلات ملفات Gateway عبر RPC (يعمل في الوضع البعيد).

ذات صلة:

- نظرة عامة على التسجيل: [التسجيل](/ar/logging)
- CLI لـ Gateway: [gateway](/ar/cli/gateway)

## الخيارات

- `--limit <n>`: الحد الأقصى لعدد أسطر السجل المراد إرجاعها (الافتراضي `200`)
- `--max-bytes <n>`: الحد الأقصى للبايتات المراد قراءتها من ملف السجل (الافتراضي `250000`)
- `--follow`: متابعة تدفق السجل
- `--interval <ms>`: فاصل الاستقصاء أثناء المتابعة (الافتراضي `1000`)
- `--json`: إصدار أحداث JSON محددة بسطر
- `--plain`: إخراج نص عادي بدون تنسيق نمطي
- `--no-color`: تعطيل ألوان ANSI
- `--local-time`: عرض الطوابع الزمنية بالمنطقة الزمنية المحلية لديك (الافتراضي)
- `--utc`: عرض الطوابع الزمنية بتوقيت UTC

## خيارات RPC المشتركة لـ Gateway

يقبل `openclaw logs` أيضًا علامات عميل Gateway القياسية:

- `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway
- `--token <token>`: رمز Gateway
- `--timeout <ms>`: المهلة بالمللي ثانية (الافتراضي `30000`)
- `--expect-final`: انتظار استجابة نهائية عندما يكون استدعاء Gateway مدعومًا بوكيل

عند تمرير `--url`، لا يطبق CLI بيانات اعتماد الإعدادات أو البيئة تلقائيًا. أدرج `--token` صراحة إذا كان Gateway الهدف يتطلب المصادقة.

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## ملاحظات

- تُعرض الطوابع الزمنية بالمنطقة الزمنية المحلية لديك افتراضيًا. استخدم `--utc` للإخراج بتوقيت UTC.
- إذا طلب Gateway الضمني عبر local loopback الاقتران، أو أُغلق أثناء الاتصال، أو انتهت مهلته قبل أن يجيب `logs.tail`، يعود `openclaw logs` تلقائيًا إلى سجل ملف Gateway المُعد. لا تستخدم أهداف `--url` الصريحة هذا الرجوع الاحتياطي.
- لا يتابع `openclaw logs --follow` الرجوعات الاحتياطية للملفات المُعدة بعد إخفاقات RPC الضمنية لـ Gateway المحلي. على Linux، يستخدم سجل Gateway النشط الخاص بـ user-systemd حسب PID عند توفره ويطبع مصدر السجل المحدد؛ وإلا فيواصل إعادة محاولة Gateway المباشر بدلًا من متابعة ملف جانبي قديم محتمل.
- عند استخدام `--follow`، تؤدي انقطاعات gateway العابرة (إغلاق WebSocket، انتهاء المهلة، انقطاع الاتصال) إلى إعادة اتصال تلقائية بتراجع أسي (حتى 8 محاولات، بحد أقصى 30 ثانية بين المحاولات). تُطبع رسالة تحذير إلى stderr في كل إعادة محاولة، وتُطبع ملاحظة `[logs] gateway reconnected` عند نجاح استقصاء. في وضع `--json`، يُصدر كل من تحذير إعادة المحاولة وانتقال إعادة الاتصال كسجلات `{"type":"notice"}` على stderr. أما الأخطاء غير القابلة للاسترداد (فشل المصادقة، إعدادات سيئة) فتخرج فورًا.
- في وضع `--follow --json`، تُصدر انتقالات مصدر السجل كسجلات `{"type":"meta"}`. ينبغي للمستهلكين تتبع المؤشرات لكل `sourceKind`: يمكن أن ينتقل التدفق من إخراج ملف Gateway (`sourceKind: "file"`) إلى الرجوع الاحتياطي للسجل المحلي (`sourceKind: "journal"`، و`localFallback: true`، مع `service.pid`/`service.unit`) ثم العودة إلى إخراج ملف Gateway بعد الاسترداد. لا تفترض وجود مصدر أو مؤشر واحد ثابت لجلسة المتابعة كلها، وتحمّل الأسطر المتداخلة عندما يعيد الاسترداد تشغيل مؤشر ملف Gateway.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [تسجيل Gateway](/ar/gateway/logging)
