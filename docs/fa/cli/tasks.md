---
read_when:
    - می‌خواهید رکوردهای وظایف پس‌زمینه را بررسی، ممیزی یا لغو کنید
    - شما دستورهای TaskFlow را زیر `openclaw tasks flow` مستند می‌کنید.
summary: مرجع CLI برای `openclaw tasks` (دفتر ثبت وظایف پس‌زمینه و وضعیت جریان کار)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:34:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
---

وظایف پس‌زمینهٔ پایدار و وضعیت Task Flow را بررسی کنید. بدون زیرفرمان،
`openclaw tasks` معادل `openclaw tasks list` است.

برای چرخهٔ حیات و مدل تحویل، [وظایف پس‌زمینه](/fa/automation/tasks) را ببینید.

## استفاده

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

## زیرفرمان‌ها

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

رکوردهای وظیفه و Task Flow را که کهنه، گم‌شده، دارای تحویل ناموفق، یا به‌شکلی دیگر ناسازگار هستند آشکار می‌کند. وظایف گم‌شده‌ای که تا `cleanupAfter` نگه داشته می‌شوند هشدار هستند؛ وظایف گم‌شدهٔ منقضی‌شده یا بدون مهر زمانی خطا هستند.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

همگام‌سازی وظیفه و Task Flow، ثبت مهر زمانی پاک‌سازی، هرس‌کردن،
و پاک‌سازی رجیستری نشست اجرای Cron کهنه را پیش‌نمایش یا اعمال می‌کند.
برای وظایف Cron، پیش از علامت‌گذاری یک وظیفهٔ فعال قدیمی به‌عنوان `lost`، همگام‌سازی از گزارش‌های اجرای ماندگار/وضعیت کار استفاده می‌کند؛ بنابراین اجراهای Cron تکمیل‌شده صرفاً به‌دلیل از بین رفتن وضعیت زمان اجرای درون‌حافظه‌ای Gateway به خطاهای حسابرسی کاذب تبدیل نمی‌شوند. حسابرسی آفلاین CLI برای مجموعهٔ کارهای فعال Cron محلیِ فرایند Gateway مرجع قطعی نیست. وظایف CLI دارای شناسهٔ اجرا/شناسهٔ منبع زمانی به‌عنوان `lost` علامت‌گذاری می‌شوند که زمینهٔ اجرای زندهٔ Gateway آن‌ها از بین رفته باشد، حتی اگر یک ردیف نشست فرزند قدیمی باقی مانده باشد.
هنگام اعمال، نگه‌داری همچنین ردیف‌های رجیستری نشست `cron:<jobId>:run:<uuid>` قدیمی‌تر از ۷ روز را هرس می‌کند، در حالی که کارهای Cron در حال اجرا را حفظ می‌کند و ردیف‌های نشست غیر Cron را دست‌نخورده می‌گذارد.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

وضعیت پایدار Task Flow را زیر دفترکل وظیفه بررسی یا لغو می‌کند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [وظایف پس‌زمینه](/fa/automation/tasks)
