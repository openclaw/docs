---
read_when:
    - می‌خواهید تعهدات استنباط‌شده برای پیگیری را بررسی کنید
    - می‌خواهید اعلام حضورهای در انتظار را رد کنید
    - در حال ممیزی مواردی هستید که Heartbeat ممکن است تحویل دهد
summary: مرجع CLI برای `openclaw commitments` (بررسی و رد پیگیری‌های استنباط‌شده)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T15:43:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

تعهدهای پیگیری استنباط‌شده را فهرست و مدیریت کنید.

تعهدها قابلیت‌هایی اختیاری (`commitments.enabled`) و حافظه‌های پیگیری کوتاه‌مدتی هستند
که از بافت مکالمه ایجاد و از طریق Heartbeat ارائه می‌شوند. برای راهنمای مفهومی و پیکربندی، به
[تعهدهای استنباط‌شده](/fa/concepts/commitments) مراجعه کنید.

بدون زیرفرمان، `openclaw commitments` تعهدهای در انتظار را فهرست می‌کند.

## نحوه استفاده

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## گزینه‌ها

- `--all`: به‌جای فقط تعهدهای در انتظار، همه وضعیت‌ها را نمایش می‌دهد.
- `--agent <id>`: نتایج را به یک شناسه عامل محدود می‌کند.
- `--status <status>`: نتایج را بر اساس وضعیت فیلتر می‌کند. مقادیر: `pending`، `sent`،
  `dismissed`، `snoozed` یا `expired`. مقادیر ناشناخته با خطا خاتمه می‌یابند.
- `--json`: خروجی JSON قابل‌خواندن توسط ماشین تولید می‌کند.

`dismiss` شناسه‌های تعهد داده‌شده را با وضعیت `dismissed` علامت‌گذاری می‌کند تا Heartbeat
آن‌ها را ارائه نکند.

## مثال‌ها

فهرست‌کردن تعهدهای در انتظار:

```bash
openclaw commitments
```

فهرست‌کردن همه تعهدهای ذخیره‌شده:

```bash
openclaw commitments --all
```

فیلترکردن برای یک عامل:

```bash
openclaw commitments --agent main
```

یافتن تعهدهای به‌تعویق‌افتاده:

```bash
openclaw commitments --status snoozed
```

ردکردن یک یا چند تعهد:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

صدور به‌صورت JSON:

```bash
openclaw commitments --all --json
```

## خروجی

خروجی متنی تعداد تعهدها، مسیر پایگاه داده مشترک SQLite، فیلترهای فعال
و برای هر تعهد یک ردیف را چاپ می‌کند:

- شناسه تعهد
- وضعیت
- نوع (`event_check_in`، `deadline_check`، `care_check_in` یا `open_loop`)
- زودترین زمان سررسید
- دامنه (عامل/کانال/هدف)
- متن پیشنهادی برای پیگیری

خروجی JSON شامل تعداد، فیلترهای فعال وضعیت و عامل،
مسیر پایگاه داده مشترک SQLite و رکوردهای ذخیره‌شده کامل است.

## مرتبط

- [تعهدهای استنباط‌شده](/fa/concepts/commitments)
- [نمای کلی حافظه](/fa/concepts/memory)
- [Heartbeat](/fa/gateway/heartbeat)
- [وظایف زمان‌بندی‌شده](/fa/automation/cron-jobs)
