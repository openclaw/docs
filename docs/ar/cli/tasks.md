---
read_when:
    - تريد فحص سجلات المهام الخلفية أو تدقيقها أو إلغاءها
    - أنت توثّق أوامر TaskFlow ضمن `openclaw tasks flow`
summary: مرجع CLI لـ `openclaw tasks` (سجل المهام في الخلفية وحالة TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T05:48:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

افحص مهام الخلفية الدائمة وحالة Task Flow. عند عدم تحديد أمر فرعي،
يكون `openclaw tasks` مكافئًا لـ `openclaw tasks list`.

راجع [مهام الخلفية](/ar/automation/tasks) للتعرّف على نموذج دورة الحياة والتسليم،
وقسم `tasks audit` فيها للاطلاع على الأوصاف الكاملة للنتائج.

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

| العلامة             | الوصف                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | إخراج JSON.                                                                                        |
| `--runtime <name>` | التصفية حسب النوع: `subagent` أو `acp` أو `cron` أو `cli`.                                         |
| `--status <name>`  | التصفية حسب الحالة: `queued` أو `running` أو `succeeded` أو `failed` أو `timed_out` أو `cancelled` أو `lost`. |

## الأوامر الفرعية

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

يسرد مهام الخلفية المتتبَّعة بدءًا من الأحدث.

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

يكشف سجلات المهام وTask Flow القديمة أو المفقودة أو التي فشل تسليمها أو غير المتسقة
بخلاف ذلك. تُعد المهام المفقودة المحتفظ بها حتى `cleanupAfter` تحذيرات؛
أما المهام المفقودة المنتهية الصلاحية أو غير المختومة فتُعد أخطاء.

تقبل `--code` رموز المهام (`stale_queued` و`stale_running` و`lost`
و`delivery_failed` و`missing_cleanup` و`inconsistent_timestamps`) ورموز Task
Flow ‏(`restore_failed` و`stale_waiting` و`stale_blocked`
و`cancel_stuck` و`missing_linked_tasks` و`blocked_task_missing`). راجع
[مهام الخلفية](/ar/automation/tasks) للاطلاع على تفاصيل مستوى الخطورة ومشغّل كل
رمز.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

يعاين أو يطبّق تسوية المهام وTask Flow، وختم التنظيف،
والتشذيب، وتنظيف سجل جلسات تشغيل cron القديمة.

بالنسبة إلى مهام cron، تستخدم التسوية سجلات التشغيل وحالة الوظيفة المحفوظة قبل
وضع علامة `lost` على مهمة نشطة قديمة، حتى لا تتحول عمليات تشغيل cron المكتملة
إلى أخطاء تدقيق زائفة لمجرد اختفاء حالة تشغيل Gateway الموجودة في الذاكرة.
لا يُعد تدقيق CLI دون اتصال مرجعًا حاسمًا لمجموعة وظائف cron النشطة المحلية
لعملية Gateway. توضع علامة `lost` على مهام CLI التي لها معرّف تشغيل/معرّف مصدر
عند اختفاء سياق تشغيل Gateway المباشر الخاص بها، حتى إذا بقي صف قديم لجلسة فرعية.

عند التطبيق، تشذّب الصيانة أيضًا صفوف سجل الجلسات
`cron:<jobId>:run:<uuid>` الأقدم من 7 أيام، مع الحفاظ على وظائف cron قيد
التشغيل حاليًا وترك صفوف الجلسات غير التابعة لـ cron دون تغيير.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

يفحص حالة Task Flow الدائمة أو يلغيها ضمن دفتر المهام.
يقبل `flow list --status` القيم `queued` أو `running` أو `waiting` أو `blocked`
أو `succeeded` أو `failed` أو `cancelled` أو `lost`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [مهام الخلفية](/ar/automation/tasks)
