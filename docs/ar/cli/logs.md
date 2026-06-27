---
read_when:
    - تحتاج إلى متابعة سجلات Gateway عن بُعد (بدون SSH)
    - تريد أسطر سجلات JSON للأدوات
summary: مرجع CLI لـ `openclaw logs` (متابعة سجلات Gateway عبر RPC)
title: السجلات
x-i18n:
    generated_at: "2026-06-27T17:21:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

تتبّع سجلات ملفات Gateway عبر RPC (يعمل في الوضع البعيد).

ذات صلة:

- نظرة عامة على التسجيل: [التسجيل](/ar/logging)
- CLI الخاص بـ Gateway: [gateway](/ar/cli/gateway)

## الخيارات

- `--limit <n>`: الحد الأقصى لعدد أسطر السجل المراد إرجاعها (الافتراضي `200`)
- `--max-bytes <n>`: الحد الأقصى للبايتات المراد قراءتها من ملف السجل (الافتراضي `250000`)
- `--follow`: اتبع تدفق السجل
- `--interval <ms>`: فاصل الاستطلاع أثناء المتابعة (الافتراضي `1000`)
- `--json`: أخرج أحداث JSON مفصولة بالأسطر
- `--plain`: إخراج نص عادي دون تنسيق مزخرف
- `--no-color`: عطّل ألوان ANSI
- `--local-time`: اعرض الطوابع الزمنية بمنطقتك الزمنية المحلية (افتراضي)
- `--utc`: اعرض الطوابع الزمنية بتوقيت UTC

## خيارات RPC المشتركة لـ Gateway

يقبل `openclaw logs` أيضًا أعلام عميل Gateway القياسية:

- `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway
- `--token <token>`: رمز Gateway
- `--timeout <ms>`: المهلة بالمللي ثانية (الافتراضي `30000`)
- `--expect-final`: انتظر استجابة نهائية عندما يكون استدعاء Gateway مدعومًا بوكيل

عند تمرير `--url`، لا يطبّق CLI بيانات اعتماد الإعدادات أو البيئة تلقائيًا. ضمّن `--token` صراحةً إذا كان Gateway الهدف يتطلب المصادقة.

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

- تُعرض الطوابع الزمنية بمنطقتك الزمنية المحلية افتراضيًا. استخدم `--utc` لإخراج UTC.
- إذا طلب Gateway الضمني عبر local loopback الاقتران، أو أُغلق أثناء الاتصال، أو انتهت مهلته قبل أن يجيب `logs.tail`، يعود `openclaw logs` تلقائيًا إلى سجل ملف Gateway المُعدّ. أهداف `--url` الصريحة لا تستخدم هذا الرجوع.
- لا يتابع `openclaw logs --follow` رجوعات الملفات المُعدّة بعد إخفاقات RPC الخاصة بـ Gateway المحلي الضمني. على Linux، يستخدم سجل Gateway النشط الخاص بـ user-systemd بحسب PID عند توفره ويطبع مصدر السجل المحدد؛ وإلا فيواصل إعادة محاولة Gateway الحي بدلًا من تتبّع ملف جانبي قديم محتمل.
- عند استخدام `--follow`، تؤدي انقطاعات gateway العابرة (إغلاق WebSocket، انتهاء المهلة، انقطاع الاتصال) إلى إعادة اتصال تلقائية مع تراجع أسي (حتى 8 محاولات، وبحد أقصى 30 ثانية بين المحاولات). تُطبع رسالة تحذير إلى stderr في كل إعادة محاولة، وتُطبع ملاحظة `[logs] gateway reconnected` بمجرد نجاح استطلاع. في وضع `--json`، يصدر كل من تحذير إعادة المحاولة وانتقال إعادة الاتصال كسجلات `{"type":"notice"}` على stderr. لا تزال الأخطاء غير القابلة للاسترداد (فشل المصادقة، إعدادات سيئة) تخرج فورًا.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [تسجيل Gateway](/ar/gateway/logging)
