---
read_when:
    - تريد فحص سجلات المهام في الخلفية أو تدقيقها أو إلغاءها
    - أنت توثق أوامر TaskFlow ضمن `openclaw tasks flow`
summary: مرجع CLI لـ `openclaw tasks` (سجل المهام في الخلفية وحالة TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T07:36:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

افحص المهام الدائمة في الخلفية وحالة TaskFlow. عند عدم استخدام أمر فرعي،
يكون `openclaw tasks` مكافئًا لـ `openclaw tasks list`.

راجع [المهام في الخلفية](/ar/automation/tasks) للاطلاع على دورة الحياة ونموذج التسليم.

## الاستخدام

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## خيارات الجذر

- `--json`: إخراج JSON.
- `--runtime <name>`: التصفية حسب النوع: `subagent` أو `acp` أو `cron` أو `cli`.
- `--status <name>`: التصفية حسب الحالة: `queued` أو `running` أو `succeeded` أو `failed` أو `timed_out` أو `cancelled` أو `lost`.

## الأوامر الفرعية

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

يعرض المهام المتتبعة في الخلفية من الأحدث أولًا.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

يعرض مهمة واحدة حسب معرّف المهمة أو معرّف التشغيل أو مفتاح الجلسة.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

يغيّر سياسة الإشعارات لمهمة قيد التشغيل.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

يلغي مهمة في الخلفية قيد التشغيل.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

يكشف سجلات المهام وTask Flow الراكدة أو المفقودة أو الفاشلة في التسليم أو غير المتسقة بأي شكل آخر.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

يعاين أو يطبق التسوية، ووضع طابع التنظيف، والإزالة للمهام وحالة TaskFlow.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

يفحص أو يلغي حالة TaskFlow الدائمة ضمن سجل المهام.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [المهام في الخلفية](/ar/automation/tasks)
