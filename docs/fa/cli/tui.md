---
read_when:
    - شما یک رابط کاربری ترمینالی برای Gateway می‌خواهید (مناسب برای دسترسی از راه دور)
    - می‌خواهید url/token/session را از اسکریپت‌ها ارسال کنید
    - می‌خواهید TUI را در حالت تعبیه‌شدهٔ محلی و بدون Gateway اجرا کنید
    - می‌خواهید از `openclaw chat` یا `openclaw tui --local` استفاده کنید
summary: مرجع CLI برای `openclaw tui` (رابط کاربری ترمینالی مبتنی بر Gateway یا تعبیه‌شدهٔ محلی)
title: TUI
x-i18n:
    generated_at: "2026-07-12T09:47:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

رابط کاربری ترمینالِ متصل به Gateway را باز کنید، یا آن را در حالت محلیِ تعبیه‌شده اجرا کنید.

راهنمای مرتبط: [TUI](/fa/web/tui)

## گزینه‌ها

| پرچم                        | پیش‌فرض                                  | توضیحات                                                                                       |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | به‌جای Gateway، با محیط اجرای محلیِ تعبیه‌شدهٔ عامل اجرا شود.                                 |
| `--url <url>`                | `gateway.remote.url` از پیکربندی           | نشانی WebSocket مربوط به Gateway.                                                             |
| `--token <token>`            | (هیچ‌کدام)                                | توکن Gateway، در صورت نیاز.                                                                   |
| `--password <pass>`          | (هیچ‌کدام)                                | گذرواژهٔ Gateway، در صورت نیاز.                                                               |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | اثر انگشت مورد انتظار گواهی TLS برای یک Gateway سنجاق‌شده با `wss://`.                        |
| `--session <key>`            | `main` (یا `global` وقتی دامنه سراسری است) | کلید نشست. در فضای کاری یک عامل، مگر اینکه پیشوندی تعیین شود، همان عامل به‌طور خودکار انتخاب می‌شود. |
| `--deliver`                  | `false`                                   | پاسخ‌های دستیار از طریق کانال‌های پیکربندی‌شده تحویل داده شوند.                               |
| `--thinking <level>`         | (پیش‌فرض مدل)                             | بازنویسی سطح تفکر.                                                                            |
| `--message <text>`           | (هیچ‌کدام)                                | پس از اتصال، یک پیام آغازین ارسال شود.                                                        |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | مهلت زمانی عامل. مقادیر نامعتبر یک هشدار ثبت می‌کنند و نادیده گرفته می‌شوند.                  |
| `--history-limit <n>`        | `200`                                     | تعداد ورودی‌های تاریخچه که هنگام اتصال بارگیری می‌شوند.                                       |

نام‌های مستعار `openclaw chat` و `openclaw terminal` این فرمان را با فرض ضمنیِ `--local` فراخوانی می‌کنند.

## نکات

- `--local` را نمی‌توان با `--url`، `--token`، `--password` یا `--tls-fingerprint` ترکیب کرد.
- `tui` در صورت امکان، SecretRefهای پیکربندی‌شدهٔ احراز هویت Gateway را برای احراز هویت با توکن/گذرواژه برطرف می‌کند (ارائه‌دهندگان `env`/`file`/`exec`).
- وقتی هیچ نشانی یا درگاه صریحی مشخص نشده باشد، `tui` از درگاه فعال محلی Gateway که توسط Gateway در حال اجرا ثبت شده است پیروی می‌کند. `--url` صریح، `OPENCLAW_GATEWAY_URL`، `OPENCLAW_GATEWAY_PORT` و پیکربندی Gateway راه‌دور همچنان اولویت دارند.
- وقتی TUI از داخل دایرکتوری فضای کاری پیکربندی‌شدهٔ یک عامل اجرا شود، آن عامل را به‌طور خودکار برای مقدار پیش‌فرض کلید نشست انتخاب می‌کند (مگر اینکه `--session` به‌طور صریح به‌شکل `agent:<id>:...` باشد).
- برای نمایش نام میزبان Gateway در پاورقیِ اتصال‌های غیرمحلیِ مبتنی بر URL، فرمان `openclaw config set tui.footer.showRemoteHost true` را اجرا کنید. این گزینه به‌طور پیش‌فرض خاموش است و هرگز برای اتصال‌های local loopback یا محلیِ تعبیه‌شده نمایش داده نمی‌شود.
- حالت محلی مستقیماً از محیط اجرای تعبیه‌شدهٔ عامل استفاده می‌کند. بیشتر ابزارهای محلی کار می‌کنند، اما قابلیت‌های مختص Gateway در دسترس نیستند.
- حالت محلی `/auth [provider]` را به مجموعه فرمان‌های TUI اضافه می‌کند.
- دروازه‌های تأیید Plugin همچنان در حالت محلی اعمال می‌شوند: ابزارهایی که به تأیید نیاز دارند، تصمیم را در ترمینال درخواست می‌کنند و هیچ‌چیز به‌صورت بی‌صدا و خودکار تأیید نمی‌شود.
- [اهداف](/fa/tools/goal) نشست در پاورقی ظاهر می‌شوند و با `/goal` قابل مدیریت هستند.

## نمونه‌ها

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "پیکربندی من را با مستندات مقایسه کن و بگو چه چیزهایی را باید اصلاح کنم"
# هنگام اجرا در فضای کاری یک عامل، آن عامل را به‌طور خودکار تشخیص می‌دهد
openclaw tui --session bugfix
```

## چرخهٔ ترمیم پیکربندی

از حالت محلی استفاده کنید تا عامل تعبیه‌شده پیکربندی فعلی را بررسی کند، آن را با مستندات مقایسه کند و از همان ترمینال به ترمیم آن کمک کند.

اگر `openclaw config validate` از قبل با شکست مواجه می‌شود، ابتدا `openclaw configure` یا `openclaw doctor --fix` را اجرا کنید؛ `openclaw chat` محافظ پیکربندی نامعتبر را دور نمی‌زند.

```bash
openclaw chat
```

سپس درون TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

اصلاحات هدفمند را با `openclaw config set` یا `openclaw configure` اعمال کنید، سپس `openclaw config validate` را دوباره اجرا کنید. به [TUI](/fa/web/tui) و [پیکربندی](/fa/cli/config) مراجعه کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [TUI](/fa/web/tui)
- [هدف](/fa/tools/goal)
