---
read_when:
    - می‌خواهید ضمن حفظ نصب CLI، وضعیت محلی را پاک کنید
    - می‌خواهید پیش‌نمایشی آزمایشی از مواردی که حذف خواهند شد ببینید
summary: مرجع CLI برای `openclaw reset` (بازنشانی وضعیت/پیکربندی محلی)
title: بازنشانی
x-i18n:
    generated_at: "2026-07-12T09:54:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

پیکربندی/وضعیت محلی را بازنشانی می‌کند (CLI را نصب‌شده نگه می‌دارد).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## گزینه‌ها

- `--scope <scope>`: یکی از `config`، `config+creds+sessions` یا `full`
- `--yes`: از اعلان‌های تأیید عبور می‌کند
- `--non-interactive`: اعلان‌ها را غیرفعال می‌کند؛ به `--scope` و `--yes` نیاز دارد
- `--dry-run`: عملیات را بدون حذف فایل‌ها نمایش می‌دهد

## محدوده‌ها

| محدوده                 | موارد حذف‌شده                                                                                               | ابتدا Gateway را متوقف می‌کند |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `config`                | فقط فایل پیکربندی                                                                                           | خیر                           |
| `config+creds+sessions` | فایل پیکربندی، پوشه OAuth/اعتبارنامه‌ها و پوشه‌های نشست هر عامل                                            | بله                           |
| `full`                  | پوشه وضعیت (شامل پیکربندی/اعتبارنامه‌ها، اگر درون آن قرار داشته باشند)، به‌همراه پوشه‌های فضای کاری و گواهی‌های فضای کاری | بله                           |

`config+creds+sessions` و `full` پیش از حذف وضعیت، سرویس مدیریت‌شده Gateway در حال اجرا را متوقف می‌کنند.

## نکته‌ها

- پیش از حذف وضعیت محلی، ابتدا `openclaw backup create` را اجرا کنید تا یک اسنپ‌شات قابل‌بازیابی ایجاد شود.
- بدون `--scope`، دستور `openclaw reset` به‌صورت تعاملی محدوده‌ای را که باید حذف شود درخواست می‌کند.
- `--non-interactive` فقط زمانی معتبر است که هر دو گزینه `--scope` و `--yes` تنظیم شده باشند.
- `config+creds+sessions` و `full` پس از پایان، پیام `Next: openclaw onboard --install-daemon` را نمایش می‌دهند.

## مرتبط

- [مرجع CLI](/fa/cli)
