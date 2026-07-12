---
read_when:
    - می‌خواهید تعهدات استنباط‌شده برای پیگیری را بررسی کنید
    - می‌خواهید اعلام‌حضورهای در انتظار را رد کنید
    - در حال بررسی این هستید که Heartbeat ممکن است چه چیزی تحویل دهد
summary: مرجع CLI برای `openclaw commitments` (بررسی و رد پیگیری‌های استنباط‌شده)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T09:49:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

تعهدات پیگیری استنباط‌شده را فهرست و مدیریت کنید.

تعهدات قابلیتی اختیاری (`commitments.enabled`) و حافظه‌های کوتاه‌مدتی برای پیگیری هستند که
از بافت مکالمه ایجاد و از طریق Heartbeat تحویل داده می‌شوند. برای راهنمای مفهومی و پیکربندی، به
[تعهدات استنباط‌شده](/fa/concepts/commitments) مراجعه کنید.

بدون زیرفرمان، `openclaw commitments` تعهدات در انتظار را فهرست می‌کند.

## نحوه استفاده

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## گزینه‌ها

- `--all`: به‌جای نمایش فقط تعهدات در انتظار، همه وضعیت‌ها را نمایش می‌دهد.
- `--agent <id>`: نتایج را به یک شناسه عامل محدود می‌کند.
- `--status <status>`: نتایج را بر اساس وضعیت محدود می‌کند. مقادیر: `pending`، `sent`،
  `dismissed`، `snoozed` یا `expired`. مقادیر ناشناخته باعث خروج همراه با خطا می‌شوند.
- `--json`: خروجی JSON قابل‌خواندن برای ماشین تولید می‌کند.

`dismiss` شناسه‌های تعهد داده‌شده را با وضعیت `dismissed` علامت‌گذاری می‌کند تا Heartbeat
آن‌ها را تحویل ندهد.

## نمونه‌ها

فهرست تعهدات در انتظار:

```bash
openclaw commitments
```

فهرست همه تعهدات ذخیره‌شده:

```bash
openclaw commitments --all
```

محدود کردن نتایج به یک عامل:

```bash
openclaw commitments --agent main
```

یافتن تعهدات به‌تعویق‌افتاده:

```bash
openclaw commitments --status snoozed
```

رد کردن یک یا چند تعهد:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

صدور در قالب JSON:

```bash
openclaw commitments --all --json
```

## خروجی

خروجی متنی تعداد تعهدات، مسیر محل ذخیره‌سازی، فیلترهای فعال و یک ردیف برای هر تعهد را نمایش می‌دهد:

- شناسه تعهد
- وضعیت
- نوع (`event_check_in`، `deadline_check`، `care_check_in` یا `open_loop`)
- زودترین زمان سررسید
- دامنه (عامل/کانال/مقصد)
- متن پیشنهادی برای پیگیری

خروجی JSON شامل تعداد، فیلترهای فعال وضعیت و عامل، مسیر محل ذخیره‌سازی تعهدات و
رکوردهای کامل ذخیره‌شده است.

## مرتبط

- [تعهدات استنباط‌شده](/fa/concepts/commitments)
- [نمای کلی حافظه](/fa/concepts/memory)
- [Heartbeat](/fa/gateway/heartbeat)
- [وظایف زمان‌بندی‌شده](/fa/automation/cron-jobs)
