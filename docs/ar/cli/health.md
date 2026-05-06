---
read_when:
    - تريد التحقق سريعًا من سلامة Gateway قيد التشغيل
summary: مرجع CLI لـ `openclaw health` (لقطة صحة Gateway عبر RPC)
title: الصحة
x-i18n:
    generated_at: "2026-05-06T07:45:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

اجلب حالة الصحة من Gateway قيد التشغيل.

الخيارات:

- `--json`: مخرجات قابلة للقراءة آليًا
- `--timeout <ms>`: مهلة الاتصال بالمللي ثانية (الافتراضي `10000`)
- `--verbose`: تسجيل مفصّل
- `--debug`: اسم مستعار لـ `--verbose`

أمثلة:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

ملاحظات:

- يستعلم `openclaw health` الافتراضي من Gateway قيد التشغيل عن لقطة حالة الصحة الخاصة به. عندما تكون لدى
  Gateway بالفعل لقطة حديثة مخزنة مؤقتًا، يمكنه إرجاع تلك الحمولة المخزنة مؤقتًا و
  التحديث في الخلفية.
- يفرض `--verbose` فحصًا مباشرًا، ويطبع تفاصيل اتصال Gateway، ويوسّع
  المخرجات القابلة للقراءة البشرية عبر جميع الحسابات والوكلاء المُكوّنين.
- تتضمن المخرجات مخازن جلسات لكل وكيل عند تكوين عدة وكلاء.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [صحة Gateway](/ar/gateway/health)
