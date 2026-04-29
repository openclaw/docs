---
read_when:
    - شما یک رابط کاربری ترمینالی برای Gateway می‌خواهید (مناسب برای استفاده از راه دور)
    - می‌خواهید url/token/session را از اسکریپت‌ها منتقل کنید
    - می‌خواهید TUI را در حالت تعبیه‌شدهٔ محلی بدون Gateway اجرا کنید.
    - می‌خواهید از openclaw chat یا openclaw tui --local استفاده کنید
summary: مرجع CLI برای `openclaw tui` (با پشتوانه Gateway یا رابط کاربری ترمینال تعبیه‌شده محلی)
title: TUI
x-i18n:
    generated_at: "2026-04-29T22:40:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

رابط کاربری ترمینال متصل به Gateway را باز کنید، یا آن را در حالت محلی تعبیه‌شده اجرا کنید.

مرتبط:

- راهنمای TUI: [TUI](/fa/web/tui)

نکته‌ها:

- `chat` و `terminal` نام‌های مستعار برای `openclaw tui --local` هستند.
- `--local` را نمی‌توان با `--url`، `--token` یا `--password` ترکیب کرد.
- `tui` در صورت امکان SecretRefs احراز هویت Gateway پیکربندی‌شده را برای احراز هویت token/password حل می‌کند (ارائه‌دهنده‌های `env`/`file`/`exec`).
- وقتی از داخل یک دایرکتوری فضای کاری عامل پیکربندی‌شده اجرا شود، TUI به‌طور خودکار آن عامل را برای پیش‌فرض کلید نشست انتخاب می‌کند (مگر اینکه `--session` صریحاً به‌صورت `agent:<id>:...` باشد).
- حالت محلی مستقیماً از زمان‌اجرای عامل تعبیه‌شده استفاده می‌کند. بیشتر ابزارهای محلی کار می‌کنند، اما قابلیت‌هایی که فقط مخصوص Gateway هستند در دسترس نیستند.
- حالت محلی `/auth [provider]` را داخل سطح فرمان TUI اضافه می‌کند.
- دروازه‌های تأیید Plugin همچنان در حالت محلی اعمال می‌شوند. ابزارهایی که به تأیید نیاز دارند، در ترمینال برای تصمیم‌گیری درخواست می‌دهند؛ صرفاً به این دلیل که Gateway دخیل نیست، هیچ‌چیز بی‌صدا به‌طور خودکار تأیید نمی‌شود.

## مثال‌ها

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

وقتی پیکربندی فعلی از قبل اعتبارسنجی می‌شود و می‌خواهید عامل تعبیه‌شده آن را بررسی کند، با مستندات مقایسه کند و از همان ترمینال به تعمیر آن کمک کند، از حالت محلی استفاده کنید:

اگر `openclaw config validate` از قبل ناموفق است، ابتدا از `openclaw configure` یا `openclaw doctor --fix` استفاده کنید. `openclaw chat` محافظ پیکربندی نامعتبر را دور نمی‌زند.

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

اصلاحات هدفمند را با `openclaw config set` یا `openclaw configure` اعمال کنید، سپس دوباره `openclaw config validate` را اجرا کنید. [TUI](/fa/web/tui) و [پیکربندی](/fa/cli/config) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [TUI](/fa/web/tui)
