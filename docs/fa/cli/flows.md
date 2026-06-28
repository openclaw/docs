---
read_when:
    - با `openclaw flows` در مستندات قدیمی‌تر یا یادداشت‌های انتشار روبه‌رو می‌شوید
    - شما یک مرجع سریع برای بررسی TaskFlow می‌خواهید
summary: 'تغییر مسیر: دستورهای flow در `openclaw tasks flow` قرار دارند'
title: جریان‌ها (تغییرمسیر)
x-i18n:
    generated_at: "2026-05-10T19:31:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw tasks flow`

هیچ فرمان سطح‌بالای `openclaw flows` وجود ندارد. بازرسی پایدار TaskFlow زیر `openclaw tasks flow` قرار دارد.

## زیرفرمان‌ها

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| زیرفرمان | توضیح                | آرگومان‌ها / گزینه‌ها                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | TaskFlowهای ردیابی‌شده را فهرست می‌کند.    | `--json` خروجی قابل‌خواندن توسط ماشین؛ `--status <name>` فیلتر (مقادیر وضعیت را در پایین ببینید). |
| `show`     | یک TaskFlow را نشان می‌دهد.         | `<lookup>` شناسهٔ جریان یا کلید مالک؛ `--json` خروجی قابل‌خواندن توسط ماشین.                    |
| `cancel`   | یک TaskFlow در حال اجرا را لغو می‌کند. | `<lookup>` شناسهٔ جریان یا کلید مالک.                                                      |

`<lookup>` یا یک شناسهٔ جریان را می‌پذیرد (که توسط `list` / `show` برگردانده می‌شود) یا کلید مالک جریان را (شناسهٔ پایداری که زیرسامانهٔ مالک برای ردیابی جریان استفاده می‌کند).

### مقادیر فیلتر وضعیت

`--status` روی `list` یکی از این موارد را می‌پذیرد:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## مثال‌ها

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

برای مفاهیم کامل TaskFlow و شیوهٔ نگارش، [TaskFlow](/fa/automation/taskflow) را ببینید. برای فرمان والد `tasks`، [مرجع CLI مربوط به tasks](/fa/cli/tasks) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [خودکارسازی](/fa/automation)
- [TaskFlow](/fa/automation/taskflow)
