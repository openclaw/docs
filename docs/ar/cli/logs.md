---
read_when:
    - تحتاج إلى متابعة سجلات Gateway عن بُعد (بدون SSH)
    - تحتاج إلى أسطر سجلات JSON للأدوات
summary: مرجع CLI لـ `openclaw logs` (متابعة سجلات Gateway عبر RPC)
title: السجلات
x-i18n:
    generated_at: "2026-04-30T07:48:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

تابِع سجلات ملفات Gateway عبر RPC (يعمل في الوضع البعيد).

ذات صلة:

- نظرة عامة على التسجيل: [التسجيل](/ar/logging)
- CLI لـ Gateway: [gateway](/ar/cli/gateway)

## الخيارات

- `--limit <n>`: الحد الأقصى لعدد أسطر السجل المراد إرجاعها (الافتراضي `200`)
- `--max-bytes <n>`: الحد الأقصى للبايتات المراد قراءتها من ملف السجل (الافتراضي `250000`)
- `--follow`: متابعة تدفق السجل
- `--interval <ms>`: فاصل الاستطلاع أثناء المتابعة (الافتراضي `1000`)
- `--json`: إخراج أحداث JSON مفصولة بأسطر
- `--plain`: إخراج نص عادي بدون تنسيق مزيّن
- `--no-color`: تعطيل ألوان ANSI
- `--local-time`: عرض الطوابع الزمنية بمنطقتك الزمنية المحلية

## خيارات RPC المشتركة لـ Gateway

يقبل `openclaw logs` أيضًا أعلام عميل Gateway القياسية:

- `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway
- `--token <token>`: رمز Gateway
- `--timeout <ms>`: المهلة بالمللي ثانية (الافتراضي `30000`)
- `--expect-final`: انتظار استجابة نهائية عندما تكون استدعاءة Gateway مدعومة بوكيل

عند تمرير `--url`، لا يطبق CLI تلقائيًا إعدادات الاعتماد من التكوين أو البيئة. أدرج `--token` صراحةً إذا كان Gateway الهدف يتطلب المصادقة.

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

- استخدم `--local-time` لعرض الطوابع الزمنية بمنطقتك الزمنية المحلية.
- إذا طلب Gateway الضمني عبر local loopback الاقتران، أو أغلق الاتصال أثناء الاتصال، أو انتهت مهلته قبل أن يجيب `logs.tail`، فسيعود `openclaw logs` تلقائيًا إلى سجل ملف Gateway المكوّن. لا تستخدم أهداف `--url` الصريحة هذا الرجوع الاحتياطي.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [تسجيل Gateway](/ar/gateway/logging)
