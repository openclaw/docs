---
read_when:
    - می‌خواهید تعهدات پیگیریِ استنباط‌شده را بررسی کنید
    - می‌خواهید اعلام‌حضورهای در انتظار را رد کنید
    - در حال ممیزی این هستید که Heartbeat ممکن است چه چیزی تحویل دهد
summary: مرجع CLI برای `openclaw commitments` (بررسی و رد کردن پیگیری‌های استنباط‌شده)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-29T22:33:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

تعهدات پیگیری استنباط‌شده را فهرست و مدیریت کنید.

تعهدات، حافظه‌های پیگیری کوتاه‌عمر و اختیاری هستند که از
زمینهٔ گفت‌وگو ساخته می‌شوند. برای راهنمای مفهومی، [تعهدات استنباط‌شده](/fa/concepts/commitments) را ببینید.

بدون زیر‌دستور، `openclaw commitments` تعهدات در انتظار را فهرست می‌کند.

## استفاده

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## گزینه‌ها

- `--all`: به‌جای فقط تعهدات در انتظار، همهٔ وضعیت‌ها را نشان می‌دهد.
- `--agent <id>`: به یک شناسهٔ عامل محدود می‌کند.
- `--status <status>`: بر اساس وضعیت فیلتر می‌کند. مقادیر: `pending`، `sent`،
  `dismissed`، `snoozed`، یا `expired`.
- `--json`: خروجی JSON قابل خواندن برای ماشین تولید می‌کند.

## نمونه‌ها

فهرست کردن تعهدات در انتظار:

```bash
openclaw commitments
```

فهرست کردن هر تعهد ذخیره‌شده:

```bash
openclaw commitments --all
```

محدود کردن به یک عامل:

```bash
openclaw commitments --agent main
```

پیدا کردن تعهدات به تعویق افتاده:

```bash
openclaw commitments --status snoozed
```

رد کردن یک یا چند تعهد:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

صدور به‌صورت JSON:

```bash
openclaw commitments --all --json
```

## خروجی

خروجی متنی شامل موارد زیر است:

- شناسهٔ تعهد
- وضعیت
- نوع
- زودترین زمان سررسید
- دامنه
- متن پیشنهادی برای پیگیری

خروجی JSON همچنین مسیر ذخیره‌گاه تعهد و رکوردهای کامل ذخیره‌شده را شامل می‌شود.

## مرتبط

- [تعهدات استنباط‌شده](/fa/concepts/commitments)
- [نمای کلی حافظه](/fa/concepts/memory)
- [Heartbeat](/fa/gateway/heartbeat)
- [کارهای زمان‌بندی‌شده](/fa/automation/cron-jobs)
