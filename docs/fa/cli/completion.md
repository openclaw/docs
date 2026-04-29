---
read_when:
    - تکمیل‌های پوسته را برای zsh/bash/fish/PowerShell می‌خواهید
    - باید اسکریپت‌های تکمیل را در زیر مسیر وضعیت OpenClaw در حافظهٔ پنهان ذخیره کنید
summary: مرجع CLI برای `openclaw completion` (تولید/نصب اسکریپت‌های تکمیل پوسته)
title: تکمیل
x-i18n:
    generated_at: "2026-04-29T22:34:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

اسکریپت‌های تکمیل پوسته را تولید کنید و در صورت تمایل آن‌ها را در نمایه پوسته خود نصب کنید.

## نحوه استفاده

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## گزینه‌ها

- `-s, --shell <shell>`: پوسته هدف (`zsh`، `bash`، `powershell`، `fish`؛ پیش‌فرض: `zsh`)
- `-i, --install`: نصب تکمیل با افزودن یک خط منبع به نمایه پوسته شما
- `--write-state`: نوشتن اسکریپت(های) تکمیل در `$OPENCLAW_STATE_DIR/completions` بدون چاپ در خروجی استاندارد
- `-y, --yes`: رد کردن اعلان‌های تأیید نصب

## یادداشت‌ها

- `--install` یک بلوک کوچک «OpenClaw Completion» را در نمایه پوسته شما می‌نویسد و آن را به اسکریپت کش‌شده اشاره می‌دهد.
- بدون `--install` یا `--write-state`، فرمان اسکریپت را در خروجی استاندارد چاپ می‌کند.
- تولید تکمیل، درخت‌های فرمان را پیشاپیش بارگذاری می‌کند تا زیرفرمان‌های تودرتو نیز شامل شوند.

## مرتبط

- [مرجع CLI](/fa/cli)
