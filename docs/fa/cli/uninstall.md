---
read_when:
    - می‌خواهید سرویس Gateway و/یا وضعیت محلی را حذف کنید
    - ابتدا یک اجرای آزمایشی می‌خواهید
summary: مرجع CLI برای `openclaw uninstall` (حذف سرویس Gateway + داده‌های محلی)
title: حذف نصب
x-i18n:
    generated_at: "2026-06-27T17:29:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

سرویس Gateway + داده‌های محلی را حذف نصب کنید (CLI باقی می‌ماند).

گزینه‌ها:

- `--service`: حذف سرویس Gateway
- `--state`: حذف وضعیت و پیکربندی
- `--workspace`: حذف پوشه‌های فضای کاری
- `--app`: حذف برنامه macOS
- `--all`: حذف سرویس، وضعیت، فضای کاری و برنامه
- `--yes`: رد کردن درخواست‌های تأیید
- `--non-interactive`: غیرفعال کردن درخواست‌ها؛ به `--yes` نیاز دارد
- `--dry-run`: چاپ اقدام‌ها بدون حذف فایل‌ها

نمونه‌ها:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

نکته‌ها:

- اگر پیش از حذف وضعیت یا فضاهای کاری یک اسنپ‌شات قابل بازیابی می‌خواهید، ابتدا `openclaw backup create` را اجرا کنید.
- `--state` پوشه‌های فضای کاری پیکربندی‌شده را حفظ می‌کند، مگر اینکه `--workspace` نیز انتخاب شده باشد.
- `--all` شکل کوتاه حذف هم‌زمان سرویس، وضعیت، فضای کاری و برنامه است.
- `--non-interactive` به `--yes` نیاز دارد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [حذف نصب](/fa/install/uninstall)
