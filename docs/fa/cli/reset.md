---
read_when:
    - می‌خواهید وضعیت محلی را پاک کنید و در عین حال CLI نصب‌شده باقی بماند
    - می‌خواهید ببینید در یک اجرای آزمایشی چه چیزهایی حذف می‌شوند
summary: مرجع CLI برای `openclaw reset` (بازنشانی وضعیت/پیکربندی محلی)
title: بازنشانی
x-i18n:
    generated_at: "2026-04-29T22:38:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

پیکربندی/وضعیت محلی را بازنشانی کنید (CLI نصب‌شده باقی می‌ماند).

گزینه‌ها:

- `--scope <scope>`: `config`، `config+creds+sessions`، یا `full`
- `--yes`: پیام‌های تأیید را رد کنید
- `--non-interactive`: پیام‌ها را غیرفعال کنید؛ به `--scope` و `--yes` نیاز دارد
- `--dry-run`: اقدام‌ها را بدون حذف فایل‌ها چاپ کنید

مثال‌ها:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

نکات:

- اگر پیش از حذف وضعیت محلی یک نماگرفت قابل‌بازیابی می‌خواهید، ابتدا `openclaw backup create` را اجرا کنید.
- اگر `--scope` را حذف کنید، `openclaw reset` از یک پیام تعاملی برای انتخاب آنچه باید حذف شود استفاده می‌کند.
- `--non-interactive` فقط زمانی معتبر است که هر دو `--scope` و `--yes` تنظیم شده باشند.

## مرتبط

- [مرجع CLI](/fa/cli)
