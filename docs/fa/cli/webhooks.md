---
read_when:
    - می‌خواهید رویدادهای Pub/Sub مربوط به Gmail را به OpenClaw متصل کنید
    - به فهرست کامل فلگ‌ها و مقادیر پیش‌فرض نیاز دارید
summary: مرجع CLI برای `openclaw webhooks` (راه‌اندازی و اجراکنندهٔ Gmail Pub/Sub)
title: Webhookها
x-i18n:
    generated_at: "2026-05-10T19:34:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

کمک‌ابزارها و یکپارچه‌سازی‌های Webhook. امروز این سطح به جریان‌های Gmail Pub/Sub محدود است که با پایشگر همراه `gog` یکپارچه می‌شوند.

## زیرفرمان‌ها

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| زیرفرمان      | توضیح                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| `gmail setup` | پیکربندی پایش Gmail، موضوع/اشتراک Pub/Sub، و مقصد تحویل Webhook در OpenClaw. |
| `gmail run`   | اجرای `gog watch serve` به‌همراه حلقه تمدید خودکار پایش.                                        |

## `webhooks gmail setup`

پیکربندی پایش Gmail، Pub/Sub، و تحویل Webhook در OpenClaw.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### الزامی

| فلگ                | توضیح             |
| ------------------- | ----------------------- |
| `--account <email>` | حساب Gmail برای پایش. |

### گزینه‌های Pub/Sub

| فلگ                    | پیش‌فرض                | توضیح                                          |
| ----------------------- | ---------------------- | ---------------------------------------------------- |
| `--project <id>`        | (هیچ‌کدام)                 | شناسه پروژه GCP (مالک کلاینت OAuth).             |
| `--topic <name>`        | `gog-gmail-watch`      | نام موضوع Pub/Sub.                                  |
| `--subscription <name>` | `gog-gmail-watch-push` | نام اشتراک Pub/Sub.                           |
| `--label <label>`       | `INBOX`                | برچسب Gmail برای پایش.                                |
| `--push-endpoint <url>` | (هیچ‌کدام)                 | نقطه پایانی push صریح Pub/Sub. Tailscale را بازنویسی می‌کند. |

### گزینه‌های تحویل OpenClaw

| فلگ                   | پیش‌فرض | توضیح                                |
| ---------------------- | ------- | ------------------------------------------ |
| `--hook-url <url>`     | (هیچ‌کدام)  | URL مربوط به Webhook در OpenClaw.                      |
| `--hook-token <token>` | (هیچ‌کدام)  | توکن Webhook در OpenClaw.                    |
| `--push-token <token>` | (هیچ‌کدام)  | توکن push که به `gog watch serve` فرستاده می‌شود. |

### گزینه‌های `gog watch serve`

| فلگ                  | پیش‌فرض         | توضیح                                                       |
| --------------------- | --------------- | ----------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | میزبان bind برای `gog watch serve`.                                      |
| `--port <port>`       | `8788`          | پورت `gog watch serve`.                                           |
| `--path <path>`       | `/gmail-pubsub` | مسیر `gog watch serve`.                                           |
| `--include-body`      | `true`          | قطعه‌هایی از متن ایمیل را شامل می‌کند. برای غیرفعال‌سازی، `--no-include-body` را ارسال کنید. |
| `--max-bytes <n>`     | `20000`         | بیشینه بایت برای هر قطعه متن.                                       |
| `--renew-minutes <n>` | `720` (12h)     | تمدید پایش Gmail هر N دقیقه.                                |

### در معرض قرار دادن با Tailscale

| فلگ                      | پیش‌فرض  | توضیح                                                      |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | در معرض قرار دادن نقطه پایانی push از طریق tailscale: `funnel`، `serve`، یا `off`. |
| `--tailscale-path <path>` | (هیچ‌کدام)   | مسیر برای tailscale serve/funnel.                                 |
| `--tailscale-target <t>`  | (هیچ‌کدام)   | مقصد Tailscale serve/funnel (پورت، `host:port`، یا URL).       |

### خروجی

| فلگ     | توضیح                                       |
| -------- | ------------------------------------------------- |
| `--json` | به‌جای متن، یک خلاصه قابل خواندن توسط ماشین چاپ می‌کند. |

## `webhooks gmail run`

اجرای `gog watch serve` به‌همراه حلقه تمدید خودکار پایش در پیش‌زمینه.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` همان فلگ‌های `gog watch serve`، تحویل OpenClaw، Pub/Sub، و Tailscale را مانند `setup` می‌پذیرد، به‌جز:

- `--account` در `run` **اختیاری** است (به حساب پیکربندی‌شده برمی‌گردد).
- `run` فلگ‌های `--project`، `--push-endpoint`، یا `--json` را نمی‌پذیرد.
- فلگ‌های `run` پیش‌فرض داخلی ندارند؛ مقدارهای جاافتاده به مقدارهایی برمی‌گردند که توسط `setup` نوشته شده‌اند.

| دسته             | فلگ‌ها                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| تحویل OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
برای `run`، مقدار `--topic` مسیر کامل موضوع Pub/Sub است (`projects/.../topics/...`)، نه فقط نام کوتاه موضوع.
</Note>

## جریان انتهابه‌انتها

برای راه‌اندازی پروژه GCP، OAuth، و سمت Gateway که با این فرمان‌های CLI جفت می‌شود، [یکپارچه‌سازی Gmail Pub/Sub](/fa/automation/cron-jobs#gmail-pubsub-integration) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [خودکارسازی Webhook](/fa/automation/cron-jobs)
- [Gmail Pub/Sub](/fa/automation/cron-jobs#gmail-pubsub-integration)
