---
read_when:
    - یک رابط کاربری ترمینالی برای Gateway می‌خواهید (مناسب برای راه دور)
    - می‌خواهید url/token/session را از اسکریپت‌ها عبور دهید
    - می‌خواهید TUI را در حالت تعبیه‌شدهٔ محلی بدون Gateway اجرا کنید
    - می‌خواهید از openclaw chat یا openclaw tui --local استفاده کنید
summary: مرجع CLI برای `openclaw tui` (رابط کاربری ترمینال پشتیبانی‌شده با Gateway یا محلیِ تعبیه‌شده)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:29:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

رابط کاربری ترمینالِ متصل به Gateway را باز کنید، یا آن را در حالت تعبیه‌شده محلی اجرا کنید.

مرتبط:

- راهنمای TUI: [TUI](/fa/web/tui)

## گزینه‌ها

| پرچم                  | پیش‌فرض                                   | توضیح                                                                        |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | به‌جای Gateway، روی زمان اجرای عاملِ تعبیه‌شده محلی اجرا شود.                 |
| `--url <url>`         | `gateway.remote.url` از پیکربندی          | نشانی WebSocket مربوط به Gateway.                                                             |
| `--token <token>`     | (هیچ‌کدام)                                    | توکن Gateway در صورت نیاز.                                                         |
| `--password <pass>`   | (هیچ‌کدام)                                    | گذرواژه Gateway در صورت نیاز.                                                      |
| `--session <key>`     | `main` (یا `global` وقتی دامنه global است) | کلید نشست. داخل فضای کاری یک عامل، مگر با پیشوند مشخص شود، همان عامل را به‌طور خودکار انتخاب می‌کند. |
| `--deliver`           | `false`                                   | پاسخ‌های دستیار را از طریق کانال‌های پیکربندی‌شده تحویل دهد.                             |
| `--thinking <level>`  | (پیش‌فرض مدل)                           | تنظیم جایگزین سطح تفکر.                                                           |
| `--message <text>`    | (هیچ‌کدام)                                    | پس از اتصال، یک پیام اولیه ارسال کند.                                          |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | مهلت زمانی عامل. مقدارهای نامعتبر یک هشدار ثبت می‌کنند و نادیده گرفته می‌شوند.                       |
| `--history-limit <n>` | `200`                                     | تعداد ورودی‌های تاریخچه برای بارگذاری هنگام اتصال.                                                 |

نام‌های مستعار: `openclaw chat` و `openclaw terminal` همان فرمان را با `--local` ضمنی فراخوانی می‌کنند.

نکته‌ها:

- `chat` و `terminal` نام‌های مستعار `openclaw tui --local` هستند.
- `--local` را نمی‌توان با `--url`، `--token` یا `--password` ترکیب کرد.
- `tui` در صورت امکان، SecretRefs احراز هویت Gateway پیکربندی‌شده را برای احراز هویت با توکن/گذرواژه حل می‌کند (ارائه‌دهنده‌های `env`/`file`/`exec`).
- وقتی از داخل دایرکتوری فضای کاری یک عامل پیکربندی‌شده اجرا شود، TUI آن عامل را به‌طور خودکار به‌عنوان پیش‌فرض کلید نشست انتخاب می‌کند (مگر اینکه `--session` صراحتاً `agent:<id>:...` باشد).
- برای نمایش نام میزبان Gateway در پانوشت برای اتصال‌های غیرمحلیِ مبتنی بر URL، `openclaw config set tui.footer.showRemoteHost true` را اجرا کنید. برچسب میزبان به‌طور پیش‌فرض خاموش است و هرگز برای اتصال‌های loopback یا اتصال‌های محلی تعبیه‌شده ظاهر نمی‌شود.
- حالت محلی مستقیماً از زمان اجرای عاملِ تعبیه‌شده استفاده می‌کند. بیشتر ابزارهای محلی کار می‌کنند، اما قابلیت‌های فقط-Gateway در دسترس نیستند.
- حالت محلی `/auth [provider]` را داخل سطح فرمان TUI اضافه می‌کند.
- دروازه‌های تأیید Plugin همچنان در حالت محلی اعمال می‌شوند. ابزارهایی که به تأیید نیاز دارند، تصمیم را در ترمینال درخواست می‌کنند؛ صرفاً به این دلیل که Gateway دخیل نیست، هیچ‌چیز بی‌صدا به‌طور خودکار تأیید نمی‌شود.
- [اهداف](/fa/tools/goal) نشست در پانوشت ظاهر می‌شوند و می‌توان آن‌ها را با `/goal` مدیریت کرد.

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

## چرخه تعمیر پیکربندی

وقتی پیکربندی فعلی از قبل اعتبارسنجی می‌شود و می‌خواهید عامل تعبیه‌شده آن را بررسی کند، با مستندات مقایسه کند، و از همان ترمینال به تعمیر آن کمک کند، از حالت محلی استفاده کنید:

اگر `openclaw config validate` از قبل شکست می‌خورد، ابتدا از `openclaw configure` یا `openclaw doctor --fix` استفاده کنید. `openclaw chat` محافظ پیکربندی نامعتبر را دور نمی‌زند.

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

اصلاحات هدفمند را با `openclaw config set` یا `openclaw configure` اعمال کنید، سپس `openclaw config validate` را دوباره اجرا کنید. [TUI](/fa/web/tui) و [پیکربندی](/fa/cli/config) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [TUI](/fa/web/tui)
- [هدف](/fa/tools/goal)
