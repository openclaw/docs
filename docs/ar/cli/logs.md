---
read_when:
    - تحتاج إلى تتبّع سجلات Gateway عن بُعد (من دون SSH)
    - تريد أسطر سجلات JSON للأدوات
summary: مرجع CLI لـ `openclaw logs` (تتبّع سجلات Gateway عبر RPC)
title: السجلات
x-i18n:
    generated_at: "2026-04-24T07:34:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

تتبّع سجلات ملفات Gateway عبر RPC (يعمل في الوضع البعيد).

ذو صلة:

- نظرة عامة على التسجيل: [التسجيل](/ar/logging)
- CLI الخاص بـ Gateway: [gateway](/ar/cli/gateway)

## الخيارات

- `--limit <n>`: الحد الأقصى لعدد أسطر السجل المطلوب إرجاعها (الافتراضي `200`)
- `--max-bytes <n>`: الحد الأقصى للبايتات المطلوب قراءتها من ملف السجل (الافتراضي `250000`)
- `--follow`: تتبّع تدفق السجل
- `--interval <ms>`: فاصل الاقتراع أثناء التتبّع (الافتراضي `1000`)
- `--json`: إخراج أحداث JSON مفصولة بأسطر
- `--plain`: مخرجات نصية عادية من دون تنسيق مزخرف
- `--no-color`: تعطيل ألوان ANSI
- `--local-time`: عرض الطوابع الزمنية في منطقتك الزمنية المحلية

## خيارات Gateway RPC المشتركة

يقبل `openclaw logs` أيضًا علامات عميل Gateway القياسية:

- `--url <url>`: عنوان WebSocket URL الخاص بـ Gateway
- `--token <token>`: رمز Gateway
- `--timeout <ms>`: المهلة بالمللي ثانية (الافتراضي `30000`)
- `--expect-final`: انتظار استجابة نهائية عندما تكون مكالمة Gateway مدعومة بوكيل

عند تمرير `--url`، لا يطبق CLI تلقائيًا بيانات الاعتماد من الإعدادات أو البيئة. أدرج `--token` صراحةً إذا كان Gateway المستهدف يتطلب المصادقة.

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
- إذا طلب Gateway المحلي على local loopback اقترانًا، فإن `openclaw logs` يعود تلقائيًا إلى ملف السجل المحلي المضبوط. ولا تستخدم الأهداف الصريحة عبر `--url` هذا الرجوع.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [تسجيل Gateway](/ar/gateway/logging)
