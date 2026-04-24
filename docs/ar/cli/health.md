---
read_when:
    - تريد التحقق سريعًا من سلامة Gateway قيد التشغيل
summary: مرجع CLI لـ `openclaw health` (لقطة سلامة Gateway عبر RPC)
title: السلامة
x-i18n:
    generated_at: "2026-04-24T07:34:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

اجلب حالة السلامة من Gateway قيد التشغيل.

الخيارات:

- `--json`: مخرجات قابلة للقراءة الآلية
- `--timeout <ms>`: مهلة الاتصال بالمللي ثانية (الافتراضي `10000`)
- `--verbose`: تسجيل verbose
- `--debug`: اسم بديل لـ `--verbose`

أمثلة:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

ملاحظات:

- يطلب `openclaw health` الافتراضي من Gateway قيد التشغيل لقطة السلامة الخاصة به. وعندما
  يكون لدى Gateway بالفعل لقطة مخزنة مؤقتًا وحديثة، يمكنه إرجاع هذه الحمولة المخزنة مؤقتًا
  والتحديث في الخلفية.
- يفرض `--verbose` تنفيذ فحص مباشر، ويطبع تفاصيل اتصال Gateway، ويوسّع
  المخرجات المقروءة بشريًا عبر جميع الحسابات والوكلاء المضبوطين.
- تتضمن المخرجات مخازن الجلسات لكل وكيل عند إعداد عدة وكلاء.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [سلامة Gateway](/ar/gateway/health)
