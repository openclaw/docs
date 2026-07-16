---
read_when:
    - تريد فحص التزامات المتابعة المستنتجة
    - تريد تجاهل تسجيلات الوصول المعلّقة
    - أنت تدقق فيما قد يسلّمه Heartbeat
summary: مرجع CLI لـ `openclaw commitments` (فحص المتابعات المستنتجة وتجاهلها)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T13:42:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

سرد التزامات المتابعة المستنتجة وإدارتها.

الالتزامات ميزة اختيارية (`commitments.enabled`)، وهي ذكريات متابعة قصيرة الأجل
تُنشأ من سياق المحادثة وتُسلَّم عبر Heartbeat. راجع
[الالتزامات المستنتجة](/ar/concepts/commitments) للاطلاع على الدليل المفاهيمي والإعدادات.

عند عدم تحديد أمر فرعي، يسرد `openclaw commitments` الالتزامات المعلّقة.

## الاستخدام

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## الخيارات

- `--all`: عرض جميع الحالات بدلًا من الالتزامات المعلّقة فقط.
- `--agent <id>`: التصفية حسب معرّف وكيل واحد.
- `--status <status>`: التصفية حسب الحالة. القيم: `pending`، و`sent`،
  و`dismissed`، و`snoozed`، أو `expired`. تؤدي القيم غير المعروفة إلى الخروج مع ظهور خطأ.
- `--json`: إخراج JSON قابل للقراءة آليًا.

يضع `dismiss` علامة `dismissed` على معرّفات الالتزامات المحددة، كي لا
يسلّمها Heartbeat.

## أمثلة

سرد الالتزامات المعلّقة:

```bash
openclaw commitments
```

سرد كل التزام مخزّن:

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

التصدير بتنسيق JSON:

```bash
openclaw commitments --all --json
```

## الإخراج

يطبع الإخراج النصي عدد الالتزامات، ومسار قاعدة بيانات SQLite المشتركة، وأي عوامل تصفية نشطة،
وصفًا واحدًا لكل التزام:

- معرّف الالتزام
- الحالة
- النوع (`event_check_in`، أو `deadline_check`، أو `care_check_in`، أو `open_loop`)
- أقرب موعد استحقاق
- النطاق (الوكيل/القناة/الهدف)
- النص المقترح للمتابعة

يتضمن إخراج JSON العدد، وعوامل تصفية الحالة والوكيل النشطة،
ومسار قاعدة بيانات SQLite المشتركة، والسجلات المخزّنة كاملةً.

## ذو صلة

- [الالتزامات المستنتجة](/ar/concepts/commitments)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
