---
read_when:
    - تريد فحص سجلات المهام في الخلفية أو تدقيقها أو إلغاءها
    - أنت توثّق أوامر TaskFlow ضمن `openclaw tasks flow`
summary: مرجع CLI الخاص بـ `openclaw tasks` (سجل مهام الخلفية وحالة TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

افحص مهام الخلفية الدائمة وحالة Task Flow. دون أمر فرعي،
يكون `openclaw tasks` مكافئًا لـ `openclaw tasks list`.

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

يسرد مهام الخلفية المتتبعة من الأحدث أولًا.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

يعرض مهمة واحدة بحسب معرف المهمة أو معرف التشغيل أو مفتاح الجلسة.

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

يكشف سجلات المهام وTask Flow القديمة أو المفقودة أو التي فشل تسليمها أو غير المتسقة بطريقة أخرى. تُعد المهام المفقودة المحتفَظ بها حتى `cleanupAfter` تحذيرات؛ أما المهام المفقودة المنتهية الصلاحية أو غير المختومة زمنيًا فهي أخطاء.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

يعرض معاينة أو يطبّق تسوية المهام وTask Flow، وختم التنظيف، والتقليم،
وتنظيف سجل جلسات تشغيل Cron القديمة.
بالنسبة إلى مهام Cron، تستخدم التسوية سجلات التشغيل/حالة المهام المستمرة قبل وسم مهمة نشطة قديمة بأنها `lost`، لذلك لا تتحول عمليات Cron المكتملة إلى أخطاء تدقيق زائفة لمجرد أن حالة تشغيل Gateway الموجودة في الذاكرة لم تعد موجودة. لا يُعد تدقيق CLI دون اتصال مصدرًا موثوقًا لمجموعة مهام Cron النشطة المحلية لعملية Gateway. تُوسم مهام CLI التي لها معرف تشغيل/معرف مصدر بأنها `lost` عندما يختفي سياق تشغيل Gateway الحي الخاص بها، حتى إذا بقي صف جلسة فرعية قديم.
عند التطبيق، تقلّم الصيانة أيضًا صفوف سجل الجلسات `cron:<jobId>:run:<uuid>` الأقدم من 7 أيام مع الحفاظ على مهام Cron قيد التشغيل حاليًا وترك صفوف الجلسات غير المرتبطة بـ Cron دون تغيير.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

يفحص حالة Task Flow الدائمة ضمن سجل المهام أو يلغيها.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [مهام الخلفية](/ar/automation/tasks)
