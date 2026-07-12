---
read_when:
    - می‌خواهید رویدادهای Pub/Sub جیمیل را به OpenClaw متصل کنید
    - به فهرست کامل پرچم‌ها و مقادیر پیش‌فرض نیاز دارید
summary: مرجع CLI برای `openclaw webhooks` (راه‌اندازی و اجراکنندهٔ Pub/Sub در Gmail)
title: وب‌هوک‌ها
x-i18n:
    generated_at: "2026-07-12T09:55:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

ابزارهای کمکی و یکپارچه‌سازی‌های Webhook. در حال حاضر، دامنهٔ این بخش به جریان‌های Gmail Pub/Sub مبتنی بر پایشگر همراه `gog` محدود است.

## زیرفرمان‌ها

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| زیرفرمان     | توضیحات                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| `gmail setup` | راه‌انداز یک‌باره: پایش Gmail، موضوع/اشتراک Pub/Sub و تحویل هوک به OpenClaw.              |
| `gmail run`   | اجرای `gog watch serve` به‌همراه حلقهٔ تمدید خودکار پایش در پیش‌زمینه.                    |

<Note>
پس از تنظیم `hooks.enabled=true` و `hooks.gmail.account` (که با `gmail setup` انجام می‌شود)، Gateway نیز هنگام راه‌اندازی، `gog gmail watch serve` را به‌طور خودکار اجرا می‌کند. `gmail run` همان منطق را در پیش‌زمینه اجرا می‌کند و برای اشکال‌زدایی یا زمانی که پایشگر Gateway غیرفعال است مفید است. برای جزئیات اجرای خودکار و انصراف با `OPENCLAW_SKIP_GMAIL_WATCHER`، به [یکپارچه‌سازی Gmail Pub/Sub](/fa/automation/cron-jobs#gmail-pubsub-integration) مراجعه کنید.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

اگر `gcloud` و `gog` موجود نباشند، آن‌ها را نصب می‌کند، احراز هویت `gcloud` را انجام می‌دهد، موضوع و اشتراک Pub/Sub را ایجاد می‌کند، پایش Gmail را آغاز می‌کند و پیکربندی `hooks.gmail` را با `hooks.enabled=true` می‌نویسد. سپس `Next: openclaw webhooks gmail run` را نمایش می‌دهد.

### الزامی

| پرچم                | توضیحات                      |
| ------------------- | ---------------------------- |
| `--account <email>` | حساب Gmail موردنظر برای پایش. |

### گزینه‌های Pub/Sub

| پرچم                    | پیش‌فرض               | توضیحات                                                                                                                                                       |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (هیچ‌کدام)            | شناسهٔ پروژهٔ GCP (مالک کلاینت OAuth). در صورت نبود، ابتدا از شناسهٔ پروژهٔ خود موضوع و سپس از پروژهٔ استخراج‌شده از اطلاعات احراز هویت `gog` استفاده می‌شود. |
| `--topic <name>`        | `gog-gmail-watch`      | نام موضوع Pub/Sub.                                                                                                                                            |
| `--subscription <name>` | `gog-gmail-watch-push` | نام اشتراک Pub/Sub.                                                                                                                                           |
| `--label <label>`       | `INBOX`                | برچسب Gmail موردنظر برای پایش.                                                                                                                                |
| `--push-endpoint <url>` | (هیچ‌کدام)            | نقطهٔ پایانی صریح ارسال Pub/Sub. Tailscale را نادیده می‌گیرد.                                                                                                 |

### گزینه‌های تحویل OpenClaw

| پرچم                   | پیش‌فرض                                       | توضیحات                     |
| ---------------------- | --------------------------------------------- | --------------------------- |
| `--hook-url <url>`     | ساخته‌شده از `hooks.path` و درگاه Gateway     | نشانی Webhook در OpenClaw.  |
| `--hook-token <token>` | `hooks.token` یا یک توکن تولیدشده             | توکن Webhook در OpenClaw.   |
| `--push-token <token>` | توکن تولیدشده                                 | توکن ارسال‌شده به `gog watch serve`. |

### گزینه‌های `gog watch serve`

| پرچم                  | پیش‌فرض        | توضیحات                                                                                                                                                                                      |
| --------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`    | میزبان اتصال `gog watch serve`.                                                                                                                                                              |
| `--port <port>`       | `8788`         | درگاه `gog watch serve`.                                                                                                                                                                     |
| `--path <path>`       | `/gmail-pubsub` | مسیر `gog watch serve`. وقتی Tailscale بدون مقصد صریح فعال باشد، به‌اجبار `/` می‌شود، زیرا Tailscale پیش از پراکسی‌کردن مسیر را حذف می‌کند.                                                   |
| `--include-body`      | `true`         | قطعه‌هایی از بدنهٔ ایمیل را شامل می‌شود. هیچ پرچم CLI برای غیرفعال‌کردن آن وجود ندارد؛ به‌جای آن `hooks.gmail.includeBody: false` را در پیکربندی تنظیم کنید.                                  |
| `--max-bytes <n>`     | `20000`        | حداکثر تعداد بایت برای هر قطعه از بدنه.                                                                                                                                                      |
| `--renew-minutes <n>` | `720` (۱۲ ساعت) | پایش Gmail را هر N دقیقه تمدید می‌کند.                                                                                                                                                        |

### دسترسی از طریق Tailscale

| پرچم                      | پیش‌فرض  | توضیحات                                                                 |
| ------------------------- | -------- | ----------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | نقطهٔ پایانی ارسال را از طریق Tailscale در معرض دسترسی قرار می‌دهد: `funnel`، `serve` یا `off`. |
| `--tailscale-path <path>` | (هیچ‌کدام) | مسیر برای سرویس‌دهی/تونل Tailscale.                                    |
| `--tailscale-target <t>`  | (هیچ‌کدام) | مقصد سرویس‌دهی/تونل Tailscale (درگاه، `host:port` یا URL).              |

### خروجی

| پرچم     | توضیحات                                            |
| -------- | -------------------------------------------------- |
| `--json` | به‌جای متن، خلاصه‌ای قابل‌خواندن برای ماشین چاپ می‌کند. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

`gog watch serve` را به‌همراه حلقهٔ تمدید خودکار پایش در پیش‌زمینه اجرا می‌کند و اگر `gog watch serve` به‌طور غیرمنتظره خارج شود، پس از ۲ ثانیه آن را دوباره راه‌اندازی می‌کند.

`run` همان پرچم‌های Pub/Sub، تحویل OpenClaw، `gog watch serve` و Tailscale در `setup` را می‌پذیرد، به‌جز موارد زیر:

- `--account` در `run` **اختیاری** است؛ در صورت نبود، از `hooks.gmail.account` استفاده می‌شود.
- `run` پرچم‌های `--project`، `--push-endpoint` یا `--json` را نمی‌پذیرد.
- هر پرچم ابتدا از مقدار پیکربندی متناظر `hooks.gmail.*` (نوشته‌شده توسط `setup`) و سپس از همان پیش‌فرض داخلی مورد استفادهٔ `setup` استفاده می‌کند، با یک استثنا: اگر نه پرچم و نه `hooks.gmail.tailscale.mode` تنظیم شده باشند، مقدار پیش‌فرض `--tailscale` در `run` برابر `off` است، نه `funnel`.

| دسته‌بندی       | پرچم‌ها                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| Pub/Sub          | `--account`، `--topic`، `--subscription`، `--label`                              |
| تحویل OpenClaw   | `--hook-url`، `--hook-token`، `--push-token`                                     |
| `gog watch serve` | `--bind`، `--port`، `--path`، `--include-body`، `--max-bytes`، `--renew-minutes` |
| Tailscale        | `--tailscale`، `--tailscale-path`، `--tailscale-target`                          |

<Note>
برای `run`، مقدار `--topic` مسیر کامل موضوع Pub/Sub است (`projects/.../topics/...`)، نه فقط نام کوتاه موضوع.
</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [خودکارسازی Webhook](/fa/automation/cron-jobs)
- [یکپارچه‌سازی Gmail Pub/Sub](/fa/automation/cron-jobs#gmail-pubsub-integration)
