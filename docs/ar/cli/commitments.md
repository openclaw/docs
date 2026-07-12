---
read_when:
    - تريد فحص التزامات المتابعة المستنتجة
    - تريد تجاهل تسجيلات الوصول المعلّقة
    - أنت تدقق في ما قد يسلّمه Heartbeat
summary: مرجع CLI للأمر `openclaw commitments` (فحص إجراءات المتابعة المستنتجة ورفضها)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T05:43:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

عرض التزامات المتابعة المستنتجة وإدارتها.

الالتزامات ميزة اختيارية (`commitments.enabled`)، وهي ذكريات متابعة قصيرة الأجل
تُنشأ من سياق المحادثة وتُسلَّم عبر Heartbeat. راجع
[الالتزامات المستنتجة](/ar/concepts/commitments) للاطلاع على الدليل المفاهيمي والإعدادات.

عند عدم تحديد أمر فرعي، يعرض `openclaw commitments` الالتزامات المعلّقة.

## الاستخدام

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## الخيارات

- `--all`: عرض جميع الحالات بدلًا من الالتزامات المعلّقة فقط.
- `--agent <id>`: التصفية حسب معرّف وكيل واحد.
- `--status <status>`: التصفية حسب الحالة. القيم: `pending` و`sent`
  و`dismissed` و`snoozed` و`expired`. تؤدي القيم غير المعروفة إلى الخروج مع ظهور خطأ.
- `--json`: إخراج JSON قابل للقراءة آليًا.

يضع `dismiss` علامة `dismissed` على معرّفات الالتزامات المحددة، كي لا
يسلّمها Heartbeat.

## أمثلة

عرض الالتزامات المعلّقة:

```bash
openclaw commitments
```

عرض جميع الالتزامات المخزّنة:

```bash
openclaw commitments --all
```

التصفية حسب وكيل واحد:

```bash
openclaw commitments --agent main
```

العثور على الالتزامات المؤجّلة:

```bash
openclaw commitments --status snoozed
```

استبعاد التزام واحد أو أكثر:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

التصدير بصيغة JSON:

```bash
openclaw commitments --all --json
```

## المخرجات

تطبع المخرجات النصية عدد الالتزامات ومسار التخزين وأي عوامل تصفية نشطة،
وصفًا واحدًا لكل التزام:

- معرّف الالتزام
- الحالة
- النوع (`event_check_in` أو `deadline_check` أو `care_check_in` أو `open_loop`)
- أقرب وقت استحقاق
- النطاق (الوكيل/القناة/الهدف)
- نص المتابعة المقترح

تتضمن مخرجات JSON العدد وعوامل تصفية الحالة والوكيل النشطة ومسار
تخزين الالتزامات والسجلات المخزّنة كاملةً.

## ذو صلة

- [الالتزامات المستنتجة](/ar/concepts/commitments)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
