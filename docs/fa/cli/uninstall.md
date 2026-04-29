---
read_when:
    - می‌خواهید سرویس Gateway و/یا وضعیت محلی را حذف کنید
    - می‌خواهید ابتدا یک اجرای آزمایشی انجام دهید
summary: مرجع CLI برای `openclaw uninstall` (حذف سرویس Gateway + داده‌های محلی)
title: حذف نصب
x-i18n:
    generated_at: "2026-04-29T22:39:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

سرویس Gateway و داده‌های محلی را حذف نصب کنید (CLI باقی می‌ماند).

گزینه‌ها:

- `--service`: سرویس Gateway را حذف کنید
- `--state`: وضعیت و پیکربندی را حذف کنید
- `--workspace`: دایرکتوری‌های فضای کاری را حذف کنید
- `--app`: برنامه macOS را حذف کنید
- `--all`: سرویس، وضعیت، فضای کاری و برنامه را حذف کنید
- `--yes`: اعلان‌های تأیید را رد کنید
- `--non-interactive`: اعلان‌ها را غیرفعال کنید؛ به `--yes` نیاز دارد
- `--dry-run`: کنش‌ها را بدون حذف فایل‌ها چاپ کنید

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

- اگر پیش از حذف وضعیت یا فضاهای کاری، یک اسنپ‌شات قابل بازیابی می‌خواهید، ابتدا `openclaw backup create` را اجرا کنید.
- `--all` میانبری برای حذف هم‌زمان سرویس، وضعیت، فضای کاری و برنامه است.
- `--non-interactive` به `--yes` نیاز دارد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [حذف نصب](/fa/install/uninstall)
