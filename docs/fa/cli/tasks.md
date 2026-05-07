---
read_when:
    - می‌خواهید رکوردهای وظایف پس‌زمینه را بررسی، ممیزی یا لغو کنید
    - شما در حال مستندسازی فرمان‌های TaskFlow در زیر `openclaw tasks flow` هستید
summary: مرجع CLI برای `openclaw tasks` (دفتر ثبت وظایف پس‌زمینه و وضعیت جریان وظیفه)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

وظایف پس‌زمینهٔ بادوام و وضعیت جریان وظیفه را بررسی کنید. بدون زیر‌فرمان،
`openclaw tasks` معادل `openclaw tasks list` است.

برای چرخهٔ عمر و مدل تحویل، [وظایف پس‌زمینه](/fa/automation/tasks) را ببینید.

## کاربرد

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
- `--runtime <name>`: فیلتر بر اساس نوع: `subagent`، `acp`، `cron`، یا `cli`.
- `--status <name>`: فیلتر بر اساس وضعیت: `queued`، `running`، `succeeded`، `failed`، `timed_out`، `cancelled`، یا `lost`.

## زیر‌فرمان‌ها

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

وظایف پس‌زمینهٔ ردیابی‌شده را از جدیدترین به قدیمی‌ترین فهرست می‌کند.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

یک وظیفه را بر اساس شناسهٔ وظیفه، شناسهٔ اجرا، یا کلید نشست نشان می‌دهد.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

سیاست اعلان را برای یک وظیفهٔ در حال اجرا تغییر می‌دهد.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

یک وظیفهٔ پس‌زمینهٔ در حال اجرا را لغو می‌کند.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

رکوردهای کهنه، گم‌شده، ناموفق در تحویل، یا به‌شکل دیگری ناسازگارِ وظیفه و جریان وظیفه را آشکار می‌کند. وظایف گم‌شده‌ای که تا `cleanupAfter` نگه داشته شده‌اند هشدار هستند؛ وظایف گم‌شدهٔ منقضی‌شده یا بدون مهر زمانی خطا هستند.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

همگام‌سازی وظیفه و جریان وظیفه، مهرگذاری پاک‌سازی، و هرس را پیش‌نمایش یا اعمال می‌کند.
برای وظایف cron، همگام‌سازی پیش از علامت‌گذاری یک وظیفهٔ فعال قدیمی به‌عنوان `lost`، از لاگ‌های اجرای پایدارشده/وضعیت کار استفاده می‌کند؛ بنابراین اجراهای cron تکمیل‌شده فقط به این دلیل که وضعیت زمان اجرای درون‌حافظه‌ای Gateway از بین رفته است، به خطاهای حسابرسی کاذب تبدیل نمی‌شوند. حسابرسی آفلاین CLI برای مجموعهٔ کارهای فعال cron محلیِ فرایند Gateway مرجع قطعی نیست. وظایف CLI که شناسهٔ اجرا/شناسهٔ منبع دارند، وقتی زمینهٔ اجرای زندهٔ Gateway آن‌ها از بین رفته باشد، حتی اگر یک ردیف نشست فرزند قدیمی باقی مانده باشد، به‌عنوان `lost` علامت‌گذاری می‌شوند.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

وضعیت بادوام جریان وظیفه را زیر دفترکل وظیفه بررسی یا لغو می‌کند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [وظایف پس‌زمینه](/fa/automation/tasks)
