---
read_when:
    - تريد فحص سجلات مهام الخلفية أو تدقيقها أو إلغائها
    - أنت توثّق أوامر TaskFlow ضمن `openclaw tasks flow`
summary: مرجع CLI لـ `openclaw tasks` (سجل المهام الخلفية وحالة تدفق المهام)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

افحص مهام الخلفية الدائمة وحالة Task Flow. من دون أمر فرعي،
يكون `openclaw tasks` مكافئا لـ `openclaw tasks list`.

راجع [مهام الخلفية](/ar/automation/tasks) لمعرفة دورة الحياة ونموذج التسليم.

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

يسرد مهام الخلفية المتتبعة من الأحدث أولا.

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

يلغي مهمة خلفية قيد التشغيل.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

يكشف سجلات المهام وTask Flow القديمة أو المفقودة أو التي فشل تسليمها أو غير المتسقة بطريقة أخرى. المهام المفقودة المحتفظ بها حتى `cleanupAfter` تكون تحذيرات؛ أما المهام المفقودة المنتهية أو غير المختومة فهي أخطاء.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

يعاين أو يطبّق تسوية المهام وTask Flow، وختم التنظيف، والتقليم.
بالنسبة إلى مهام cron، تستخدم التسوية سجلات التشغيل/حالة المهمة المستمرة قبل وسم
مهمة نشطة قديمة بأنها `lost`، لذلك لا تتحول عمليات cron المكتملة إلى أخطاء تدقيق زائفة
لمجرد أن حالة تشغيل Gateway الموجودة في الذاكرة لم تعد موجودة. لا يكون تدقيق CLI غير المتصل
مرجعا موثوقا لمجموعة مهام cron النشطة المحلية الخاصة بعملية Gateway. تُوسم مهام CLI
التي لها معرّف تشغيل/معرّف مصدر بأنها `lost` عندما يختفي سياق تشغيل Gateway الحي الخاص بها،
حتى إذا بقي صف جلسة فرعية قديم.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

يفحص أو يلغي حالة Task Flow الدائمة ضمن سجل المهام.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [مهام الخلفية](/ar/automation/tasks)
