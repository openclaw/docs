---
read_when:
    - می‌خواهید سلامت Gateway در حال اجرا را سریع بررسی کنید
summary: مرجع CLI برای `openclaw health` (نمای کلی سلامت Gateway از طریق RPC)
title: سلامت
x-i18n:
    generated_at: "2026-05-10T19:32:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

وضعیت سلامت را از Gateway در حال اجرا دریافت کنید.

## گزینه‌ها

| پرچم             | پیش‌فرض | توضیح                                                        |
| ---------------- | ------- | ------------------------------------------------------------------ |
| `--json`         | `false` | به‌جای متن، JSON قابل‌خواندن توسط ماشین چاپ کنید.                       |
| `--timeout <ms>` | `10000` | مهلت اتصال برحسب میلی‌ثانیه.                                |
| `--verbose`      | `false` | ثبت گزارش مفصل. یک بررسی زنده را اجباری می‌کند و خروجی هر عامل را گسترش می‌دهد. |
| `--debug`        | `false` | نام مستعار برای `--verbose`.                                             |

نمونه‌ها:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

نکته‌ها:

- دستور پیش‌فرض `openclaw health` از Gateway در حال اجرا، نمای وضعیت سلامت آن را درخواست می‌کند. وقتی
  Gateway از قبل یک نمای کش‌شده تازه داشته باشد، می‌تواند همان payload کش‌شده را برگرداند و
  در پس‌زمینه تازه‌سازی کند.
- `--verbose` یک بررسی زنده را اجباری می‌کند، جزئیات اتصال Gateway را چاپ می‌کند، و
  خروجی قابل‌خواندن برای انسان را در همه حساب‌ها و عامل‌های پیکربندی‌شده گسترش می‌دهد.
- وقتی چند عامل پیکربندی شده باشند، خروجی شامل مخزن‌های نشست برای هر عامل است.

## مرتبط

- [مرجع CLI](/fa/cli)
- [وضعیت سلامت Gateway](/fa/gateway/health)
