---
read_when:
    - تريد فحص التزامات المتابعة المستنتجة
    - تريد تجاهل عمليات تسجيل الوصول المعلّقة
    - أنت تدقّق فيما قد يقدّمه Heartbeat
summary: مرجع CLI لـ `openclaw commitments` (فحص المتابعات المستنتجة واستبعادها)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T07:46:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

اعرض وأدر التزامات المتابعة المستنتجة.

الالتزامات هي ذكريات متابعة اختيارية وقصيرة الأجل تُنشأ من
سياق المحادثة. راجع [الالتزامات المستنتجة](/ar/concepts/commitments) للاطلاع على
الدليل المفاهيمي.

من دون أمر فرعي، يعرض `openclaw commitments` الالتزامات المعلّقة.

## الاستخدام

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## الخيارات

- `--all`: اعرض كل الحالات بدلاً من الالتزامات المعلّقة فقط.
- `--agent <id>`: صفِّ النتائج إلى معرّف وكيل واحد.
- `--status <status>`: صفِّ حسب الحالة. القيم: `pending`، و`sent`،
  و`dismissed`، و`snoozed`، أو `expired`.
- `--json`: أخرج JSON قابلاً للقراءة آلياً.

## أمثلة

اعرض الالتزامات المعلّقة:

```bash
openclaw commitments
```

اعرض كل التزام مخزّن:

```bash
openclaw commitments --all
```

صفِّ إلى وكيل واحد:

```bash
openclaw commitments --agent main
```

اعثر على الالتزامات المؤجلة:

```bash
openclaw commitments --status snoozed
```

استبعد التزاماً واحداً أو أكثر:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

صدّر كـ JSON:

```bash
openclaw commitments --all --json
```

## الإخراج

يتضمن الإخراج النصي:

- معرّف الالتزام
- الحالة
- النوع
- أقرب وقت استحقاق
- النطاق
- نص تسجيل الوصول المقترح

يتضمن إخراج JSON أيضاً مسار مخزن الالتزامات والسجلات المخزّنة الكاملة.

## ذو صلة

- [الالتزامات المستنتجة](/ar/concepts/commitments)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
