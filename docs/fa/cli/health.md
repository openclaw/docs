---
read_when:
    - می‌خواهید سلامت Gateway در حال اجرا را سریع بررسی کنید
summary: مرجع CLI برای `openclaw health` (نمای لحظه‌ای سلامت Gateway از طریق RPC)
title: سلامت
x-i18n:
    generated_at: "2026-04-29T22:35:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

سلامت را از Gateway در حال اجرا دریافت کنید.

گزینه‌ها:

- `--json`: خروجی قابل خواندن برای ماشین
- `--timeout <ms>`: مهلت زمانی اتصال بر حسب میلی‌ثانیه (پیش‌فرض `10000`)
- `--verbose`: ثبت گزارش مفصل
- `--debug`: نام مستعار برای `--verbose`

نمونه‌ها:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

یادداشت‌ها:

- `openclaw health` به‌صورت پیش‌فرض از gateway در حال اجرا snapshot سلامت آن را درخواست می‌کند. وقتی
  gateway از قبل یک snapshot تازه و cache‌شده داشته باشد، می‌تواند همان payload cache‌شده را برگرداند و
  در پس‌زمینه refresh کند.
- `--verbose` یک probe زنده را اجباری می‌کند، جزئیات اتصال gateway را چاپ می‌کند، و
  خروجی قابل خواندن برای انسان را برای همه حساب‌ها و agentهای پیکربندی‌شده گسترش می‌دهد.
- خروجی، هنگام پیکربندی چند agent، session storeهای جداگانه هر agent را شامل می‌شود.

## مرتبط

- [مرجع CLI](/fa/cli)
- [سلامت Gateway](/fa/gateway/health)
