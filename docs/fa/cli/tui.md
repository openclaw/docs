---
read_when:
    - شما یک رابط کاربری ترمینالی برای Gateway می‌خواهید (مناسب برای استفاده از راه دور)
    - می‌خواهید url/token/session را از اسکریپت‌ها عبور دهید
    - می‌خواهید TUI را در حالت تعبیه‌شدهٔ محلی بدون Gateway اجرا کنید
    - می‌خواهید از openclaw chat یا openclaw tui --local استفاده کنید
summary: مرجع CLI برای `openclaw tui` (رابط کاربری ترمینال مبتنی بر Gateway یا محلیِ تعبیه‌شده)
title: TUI
x-i18n:
    generated_at: "2026-05-10T19:34:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

رابط کاربری ترمینالِ متصل به Gateway را باز کنید، یا آن را در حالت محلیِ تعبیه‌شده
اجرا کنید.

مرتبط:

- راهنمای TUI: [TUI](/fa/web/tui)

## گزینه‌ها

| پرچم                  | پیش‌فرض                                   | توضیح                                                                        |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | به‌جای Gateway، روی زمان اجرای عاملِ تعبیه‌شده محلی اجرا می‌شود.                 |
| `--url <url>`         | `gateway.remote.url` از پیکربندی          | URL مربوط به WebSocket برای Gateway.                                                             |
| `--token <token>`     | (هیچ‌کدام)                                    | توکن Gateway در صورت نیاز.                                                         |
| `--password <pass>`   | (هیچ‌کدام)                                    | گذرواژه Gateway در صورت نیاز.                                                      |
| `--session <key>`     | `main` (یا `global` وقتی دامنه global باشد) | کلید نشست. داخل فضای کاری یک عامل، مگر اینکه پیشوند داشته باشد، همان عامل را به‌طور خودکار انتخاب می‌کند. |
| `--deliver`           | `false`                                   | پاسخ‌های دستیار را از طریق کانال‌های پیکربندی‌شده تحویل می‌دهد.                             |
| `--thinking <level>`  | (پیش‌فرض مدل)                           | نادیده‌گرفتن سطح تفکر.                                                           |
| `--message <text>`    | (هیچ‌کدام)                                    | پس از اتصال، یک پیام اولیه ارسال می‌کند.                                          |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | مهلت زمانی عامل. مقدارهای نامعتبر هشدار ثبت می‌کنند و نادیده گرفته می‌شوند.                       |
| `--history-limit <n>` | `200`                                     | تعداد ورودی‌های تاریخچه که هنگام اتصال بارگذاری می‌شوند.                                                 |

نام‌های مستعار: `openclaw chat` و `openclaw terminal` همان فرمان را با `--local` ضمنی فراخوانی می‌کنند.

نکته‌ها:

- `chat` و `terminal` نام‌های مستعار برای `openclaw tui --local` هستند.
- `--local` را نمی‌توان با `--url`، `--token` یا `--password` ترکیب کرد.
- `tui` در صورت امکان SecretRefهای احراز هویت Gateway پیکربندی‌شده را برای احراز هویت توکن/گذرواژه resolve می‌کند (ارائه‌دهنده‌های `env`/`file`/`exec`).
- وقتی از داخل یک دایرکتوری فضای کاری عامل پیکربندی‌شده اجرا شود، TUI همان عامل را به‌طور خودکار برای پیش‌فرض کلید نشست انتخاب می‌کند (مگر اینکه `--session` صراحتاً `agent:<id>:...` باشد).
- حالت محلی مستقیماً از زمان اجرای عاملِ تعبیه‌شده استفاده می‌کند. بیشتر ابزارهای محلی کار می‌کنند، اما قابلیت‌های فقط-Gateway در دسترس نیستند.
- حالت محلی `/auth [provider]` را داخل سطح فرمان TUI اضافه می‌کند.
- دروازه‌های تأیید Plugin همچنان در حالت محلی اعمال می‌شوند. ابزارهایی که به تأیید نیاز دارند، تصمیم را در ترمینال درخواست می‌کنند؛ فقط به این دلیل که Gateway دخیل نیست، هیچ چیز بی‌صدا به‌طور خودکار تأیید نمی‌شود.

## نمونه‌ها

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## حلقه تعمیر پیکربندی

وقتی پیکربندی فعلی از قبل اعتبارسنجی می‌شود و می‌خواهید عاملِ
تعبیه‌شده آن را بررسی کند، با مستندات مقایسه کند، و از همان ترمینال
به تعمیر آن کمک کند، از حالت محلی استفاده کنید:

اگر `openclaw config validate` از قبل شکست می‌خورد، ابتدا از `openclaw configure` یا
`openclaw doctor --fix` استفاده کنید. `openclaw chat` محافظ پیکربندی نامعتبر را دور نمی‌زند.

```bash
openclaw chat
```

سپس داخل TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

اصلاحات هدفمند را با `openclaw config set` یا `openclaw configure` اعمال کنید، سپس
`openclaw config validate` را دوباره اجرا کنید. [TUI](/fa/web/tui) و [پیکربندی](/fa/cli/config) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [TUI](/fa/web/tui)
