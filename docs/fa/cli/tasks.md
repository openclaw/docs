---
read_when:
    - می‌خواهید سوابق وظایف پس‌زمینه را بررسی، ممیزی یا لغو کنید
    - شما در حال مستندسازی دستورهای Task Flow زیر `openclaw tasks flow` هستید
summary: مرجع CLI برای `openclaw tasks` (دفترکل وظایف پس‌زمینه و وضعیت Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-29T22:39:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 16
---

کارهای پس‌زمینه‌ی ماندگار و وضعیت Task Flow را بررسی کنید. بدون زیرفرمان،
`openclaw tasks` معادل `openclaw tasks list` است.

برای چرخه‌ی عمر و مدل تحویل، [کارهای پس‌زمینه](/fa/automation/tasks) را ببینید.

## نحوه‌ی استفاده

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

## گزینه‌های ریشه

- `--json`: خروجی JSON.
- `--runtime <name>`: فیلتر بر اساس نوع: `subagent`، `acp`، `cron` یا `cli`.
- `--status <name>`: فیلتر بر اساس وضعیت: `queued`، `running`، `succeeded`، `failed`، `timed_out`، `cancelled` یا `lost`.

## زیرفرمان‌ها

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

کارهای پس‌زمینه‌ی ردیابی‌شده را از جدیدترین به قدیمی‌ترین فهرست می‌کند.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

یک کار را بر اساس شناسه‌ی کار، شناسه‌ی اجرا، یا کلید نشست نشان می‌دهد.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

سیاست اعلان را برای یک کار در حال اجرا تغییر می‌دهد.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

یک کار پس‌زمینه‌ی در حال اجرا را لغو می‌کند.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

رکوردهای کهنه، گم‌شده، دارای تحویل ناموفق، یا ناسازگار دیگر مربوط به کار و Task Flow را نمایان می‌کند. کارهای گم‌شده‌ای که تا `cleanupAfter` نگه داشته شده‌اند هشدار هستند؛ کارهای گم‌شده‌ی منقضی‌شده یا بدون مهر زمانی خطا هستند.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

همگام‌سازی کار و Task Flow، ثبت مهر پاک‌سازی، و هرس را پیش‌نمایش یا اعمال می‌کند.
برای کارهای cron، همگام‌سازی پیش از نشانه‌گذاری یک کار فعال قدیمی به‌عنوان `lost` از گزارش‌های اجرای ماندگار/وضعیت کار استفاده می‌کند، بنابراین اجراهای کامل‌شده‌ی cron فقط به این دلیل که وضعیت زمان اجرای درون‌حافظه‌ای Gateway از بین رفته است به خطاهای ممیزی کاذب تبدیل نمی‌شوند. ممیزی آفلاین CLI برای مجموعه‌ی کارهای فعال cron محلیِ فرایند Gateway مرجع قطعی نیست.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

وضعیت ماندگار Task Flow را زیر دفتر کل کار بررسی یا لغو می‌کند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [کارهای پس‌زمینه](/fa/automation/tasks)
