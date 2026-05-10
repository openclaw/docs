---
read_when:
    - تريد التحقق بسرعة من صحة Gateway قيد التشغيل
summary: مرجع CLI لـ `openclaw health` (لقطة صحة Gateway عبر RPC)
title: الصحة
x-i18n:
    generated_at: "2026-05-10T19:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

اجلب حالة الصحة من الـ Gateway قيد التشغيل.

## الخيارات

| الخيار           | الافتراضي | الوصف                                                              |
| ---------------- | --------- | ------------------------------------------------------------------ |
| `--json`         | `false`   | اطبع JSON قابلا للقراءة آليا بدلا من النص.                         |
| `--timeout <ms>` | `10000`   | مهلة الاتصال بالمللي ثانية.                                        |
| `--verbose`      | `false`   | تسجيل مفصل. يفرض فحصا حيا ويوسع مخرجات كل وكيل.                   |
| `--debug`        | `false`   | اسم بديل لـ `--verbose`.                                           |

أمثلة:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

ملاحظات:

- يطلب `openclaw health` الافتراضي من الـ Gateway قيد التشغيل لقطة حالة الصحة الخاصة به. عندما تكون لدى
  الـ Gateway بالفعل لقطة مخزنة مؤقتا وحديثة، يمكنه إرجاع تلك الحمولة المخزنة مؤقتا
  والتحديث في الخلفية.
- يفرض `--verbose` فحصا حيا، ويطبع تفاصيل اتصال Gateway، ويوسع
  المخرجات القابلة للقراءة البشرية عبر جميع الحسابات والوكلاء المكوّنين.
- تتضمن المخرجات مخازن جلسات لكل وكيل عند تكوين عدة وكلاء.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [حالة صحة Gateway](/ar/gateway/health)
