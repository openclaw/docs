---
read_when:
    - می‌خواهید سرویس Gateway و/یا وضعیت محلی را حذف کنید
    - ابتدا می‌خواهید یک اجرای آزمایشی انجام دهید
summary: مرجع CLI برای `openclaw uninstall` (حذف سرویس Gateway و داده‌های محلی)
title: حذف نصب
x-i18n:
    generated_at: "2026-07-12T09:55:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

سرویس Gateway و/یا داده‌های محلی را حذف نصب کنید. خود CLI حذف
نمی‌شود؛ آن را جداگانه از طریق npm/pnpm حذف نصب کنید.

## گزینه‌ها

| پرچم               | پیش‌فرض | توضیحات                                                    |
| ------------------- | ------- | ---------------------------------------------------------- |
| `--service`         | `false` | سرویس Gateway را حذف می‌کند.                               |
| `--state`           | `false` | وضعیت و پیکربندی را حذف می‌کند.                            |
| `--workspace`       | `false` | پوشه‌های فضای کاری را حذف می‌کند.                          |
| `--app`             | `false` | برنامه macOS را حذف می‌کند.                                |
| `--all`             | `false` | صورت کوتاه `--service --state --workspace --app` است.      |
| `--yes`             | `false` | اعلان‌های تأیید را رد می‌کند.                              |
| `--non-interactive` | `false` | اعلان‌ها را غیرفعال می‌کند؛ به `--yes` نیاز دارد.          |
| `--dry-run`         | `false` | اقدامات برنامه‌ریزی‌شده را بدون حذف فایل‌ها نمایش می‌دهد. |

اگر هیچ پرچم دامنه‌ای مشخص نشود، یک گزینش چندتایی تعاملی می‌پرسد کدام مؤلفه‌ها
حذف شوند (سرویس، وضعیت و فضای کاری به‌طور پیش‌فرض از پیش انتخاب شده‌اند).

## نمونه‌ها

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## نکات

- پیش از حذف وضعیت یا فضاهای کاری، ابتدا `openclaw backup create` را اجرا کنید
  تا یک نسخهٔ لحظه‌ای قابل‌بازیابی ایجاد شود.
- `--state` پوشه‌های فضای کاری پیکربندی‌شده را حفظ می‌کند، مگر اینکه
  `--workspace` نیز انتخاب شده باشد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [حذف نصب](/fa/install/uninstall)
