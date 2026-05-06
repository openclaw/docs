---
read_when:
    - می‌خواهید به‌سرعت سلامت Gateway در حال اجرا را بررسی کنید
summary: مرجع CLI برای `openclaw health` (نمای لحظه‌ای سلامت Gateway از طریق RPC)
title: سلامت
x-i18n:
    generated_at: "2026-05-06T09:06:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

سلامت را از Gateway در حال اجرا دریافت کنید.

گزینه‌ها:

- `--json`: خروجی قابل‌خواندن توسط ماشین
- `--timeout <ms>`: مهلت زمانی اتصال بر حسب میلی‌ثانیه (پیش‌فرض `10000`)
- `--verbose`: ثبت گزارش با جزئیات
- `--debug`: نام مستعار برای `--verbose`

نمونه‌ها:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

نکته‌ها:

- `openclaw health` به‌صورت پیش‌فرض، نمایهٔ سلامت Gateway در حال اجرا را درخواست می‌کند. وقتی
  Gateway از قبل یک نمایهٔ کش‌شدهٔ تازه داشته باشد، می‌تواند همان بار دادهٔ کش‌شده را برگرداند و
  در پس‌زمینه به‌روزرسانی کند.
- `--verbose` یک کاوش زنده را اجباری می‌کند، جزئیات اتصال Gateway را چاپ می‌کند، و خروجی
  قابل‌خواندن برای انسان را برای همهٔ حساب‌ها و عامل‌های پیکربندی‌شده گسترش می‌دهد.
- وقتی چند عامل پیکربندی شده باشند، خروجی شامل ذخیره‌گاه‌های نشست به‌ازای هر عامل است.

## مرتبط

- [مرجع CLI](/fa/cli)
- [سلامت Gateway](/fa/gateway/health)
