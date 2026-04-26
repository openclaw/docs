---
read_when:
    - تريد فحص سجلات مهام الخلفية أو تدقيقها أو إلغاءها
    - أنت توثّق أوامر TaskFlow ضمن `openclaw tasks flow`
summary: مرجع CLI لـ `openclaw tasks` (دفتر مهام الخلفية وحالة TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:26:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

افحص مهام الخلفية الدائمة وحالة TaskFlow. من دون أي أمر فرعي،
يكون `openclaw tasks` مكافئًا لـ `openclaw tasks list`.

راجع [مهام الخلفية](/ar/automation/tasks) للاطلاع على نموذج دورة الحياة والتسليم.

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

يسرد مهام الخلفية المتتبعة بدءًا من الأحدث.

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

يكشف سجلات المهام وTaskFlow القديمة أو المفقودة أو الفاشلة في التسليم أو غير المتسقة بأي شكل آخر. وتُعد المهام المفقودة المحتفظ بها حتى `cleanupAfter` تحذيرات؛ أما المهام المفقودة منتهية الصلاحية أو غير الموسومة فتُعد أخطاء.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

يعرض مسبقًا أو يطبّق التسوية والتنظيف الموسوم والتقليم لسجلات المهام وTaskFlow.
وبالنسبة إلى مهام Cron، تستخدم التسوية سجلات التشغيل/حالة الوظيفة المحفوظة قبل وسم
مهمة قديمة نشطة بأنها `lost`، حتى لا تتحول تشغيلات Cron المكتملة إلى أخطاء تدقيق
غير صحيحة لمجرد اختفاء حالة Gateway وقت التشغيل الموجودة في الذاكرة. ولا يُعد تدقيق
CLI في وضع عدم الاتصال مصدرًا موثوقًا لمجموعة الوظائف النشطة الخاصة بـ Cron والمحلية
لعملية Gateway.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

يفحص أو يلغي حالة TaskFlow الدائمة ضمن دفتر المهام.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [مهام الخلفية](/ar/automation/tasks)
