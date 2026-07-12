---
read_when:
    - برای zsh/bash/fish/PowerShell تکمیل خودکار پوسته می‌خواهید
    - باید اسکریپت‌های تکمیل خودکار را در وضعیت OpenClaw ذخیره‌سازی موقت کنید
summary: مرجع CLI برای `openclaw completion` (تولید/نصب اسکریپت‌های تکمیل خودکار پوسته)
title: تکمیل
x-i18n:
    generated_at: "2026-07-12T09:44:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

اسکریپت‌های تکمیل پوسته را ایجاد می‌کند، آن‌ها را در وضعیت OpenClaw ذخیره می‌کند و در صورت تمایل، آن‌ها را در پروفایل پوسته شما نصب می‌کند.

## نحوه استفاده

```bash
openclaw completion                          # چاپ اسکریپت zsh در خروجی استاندارد
openclaw completion --shell fish             # چاپ اسکریپت fish
openclaw completion --write-state            # ذخیره اسکریپت‌ها برای همه پوسته‌ها
openclaw completion --write-state --install  # ذخیره و سپس نصب در یک مرحله
openclaw completion --shell bash --write-state
```

## گزینه‌ها

- `-s, --shell <shell>`: پوسته هدف (`zsh`، `bash`، `powershell`، `fish`؛ پیش‌فرض: `zsh`)
- `-i, --install`: نصب تکمیل با افزودن یک خط `source` برای اسکریپت ذخیره‌شده به پروفایل پوسته
- `--write-state`: نوشتن اسکریپت یا اسکریپت‌های تکمیل در `$OPENCLAW_STATE_DIR/completions` (پیش‌فرض: `~/.openclaw/completions`) بدون چاپ در خروجی استاندارد؛ همراه با `--shell` فقط اسکریپت همان پوسته و در غیر این صورت اسکریپت هر چهار پوسته را می‌نویسد
- `-y, --yes`: رد کردن درخواست‌های تأیید نصب (غیرتعاملی)

## فرایند نصب

گزینه `--install` پروفایل شما را به اسکریپت ذخیره‌شده ارجاع می‌دهد؛ بنابراین ابتدا باید کش موجود باشد: اگر کش وجود نداشته باشد، فرمان با خطا متوقف می‌شود و از شما می‌خواهد `openclaw completion --write-state` را اجرا کنید. برای انجام هر دو کار در یک مرحله، `--write-state --install` را با هم استفاده کنید. بدون `--shell`، گزینه `--install` پوسته را از `$SHELL` تشخیص می‌دهد (و در صورت ناموفق بودن، از zsh استفاده می‌کند).

نصب، یک بلوک کوچک `# OpenClaw Completion` را در پروفایل پوسته شما می‌نویسد و هر خط قدیمی و کند `source <(openclaw completion ...)` را با خط `source` مربوط به اسکریپت ذخیره‌شده جایگزین می‌کند:

| پوسته      | پروفایل                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (اگر `~/.bashrc` موجود نباشد، از `~/.bash_profile` استفاده می‌شود)                                                                                                             |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (در Windows:‏ `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`، یا برای Windows PowerShell مسیر `Documents/WindowsPowerShell/...`) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## نکته‌ها

- بدون `--install` یا `--write-state`، فرمان اسکریپت را در خروجی استاندارد چاپ می‌کند.
- ایجاد تکمیل، کل درخت فرمان را از ابتدا بارگیری می‌کند؛ از جمله فرمان‌های CLI مربوط به Plugin، بنابراین زیرفرمان‌های تو‌در‌تو نیز گنجانده می‌شوند.
- `openclaw update` پس از به‌روزرسانی موفق، کش تکمیل را به‌طور خودکار تازه‌سازی می‌کند؛ `openclaw doctor` می‌تواند پیکربندی‌های تکمیل مفقود یا منسوخ را ترمیم کند.

## مرتبط

- [مرجع CLI](/fa/cli)
