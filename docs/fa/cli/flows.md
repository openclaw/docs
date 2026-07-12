---
read_when:
    - در مستندات قدیمی‌تر یا یادداشت‌های انتشار با `openclaw flows` مواجه می‌شوید
    - یک مرجع سریع برای بررسی TaskFlow می‌خواهید
summary: 'تغییر مسیر: فرمان‌های جریان در `openclaw tasks flow` قرار دارند'
title: جریان‌ها (تغییر مسیر)
x-i18n:
    generated_at: "2026-07-12T09:44:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

هیچ فرمان سطح‌بالایی به نام `openclaw flows` وجود ندارد. بازرسی پایدار TaskFlow در زیرمجموعهٔ `openclaw tasks flow` قرار دارد.

## زیرفرمان‌ها

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| زیرفرمان | توضیحات                     | آرگومان‌ها / گزینه‌ها                                                                                 |
| -------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `list`   | TaskFlowهای ردیابی‌شده را فهرست می‌کند. | خروجی ماشین‌خوان با `--json`؛ فیلتر `--status <name>` (مقادیر وضعیت را در ادامه ببینید). |
| `show`   | یک TaskFlow را نمایش می‌دهد. | شناسهٔ جریان یا کلید مالک در `<lookup>`؛ خروجی ماشین‌خوان با `--json`.                    |
| `cancel` | یک TaskFlow در حال اجرا را لغو می‌کند. | شناسهٔ جریان یا کلید مالک در `<lookup>`.                                                 |

`<lookup>` یا شناسهٔ جریان (که `list` / `show` برمی‌گرداند) را می‌پذیرد یا کلید مالک جریان را (شناسهٔ پایداری که زیرسامانهٔ مالک برای ردیابی جریان استفاده می‌کند).

### مقادیر فیلتر وضعیت

گزینهٔ `--status` در `list` یکی از این مقادیر را می‌پذیرد: `queued`، `running`، `waiting`، `blocked`، `succeeded`، `failed`، `cancelled`، `lost`.

## نمونه‌ها

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

برای مفاهیم TaskFlow و نحوهٔ نگارش آن، به [TaskFlow](/fa/automation/taskflow) مراجعه کنید. برای فرمان والد `tasks`، به [مرجع CLI فرمان tasks](/fa/cli/tasks) مراجعه کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [خودکارسازی](/fa/automation)
- [TaskFlow](/fa/automation/taskflow)
