---
read_when:
    - می‌خواهید رویدادهای Pub/Sub Gmail را به OpenClaw متصل کنید
    - به دستورهای کمکی Webhook نیاز دارید
summary: مرجع CLI برای `openclaw webhooks` (ابزارهای کمکی Webhook + Gmail Pub/Sub)
title: Webhookها
x-i18n:
    generated_at: "2026-04-29T22:40:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

کمک‌کننده‌ها و یکپارچه‌سازی‌های Webhook (Gmail Pub/Sub، کمک‌کننده‌های Webhook).

مرتبط:

- Webhookها: [Webhookها](/fa/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/fa/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

نظارت Gmail، Pub/Sub و تحویل Webhook در OpenClaw را پیکربندی کنید.

ضروری:

- `--account <email>`

گزینه‌ها:

- `--project <id>`
- `--topic <name>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`
- `--push-endpoint <url>`
- `--json`

نمونه‌ها:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

`gog watch serve` را همراه با حلقه تمدید خودکار نظارت اجرا کنید.

گزینه‌ها:

- `--account <email>`
- `--topic <topic>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`

نمونه:

```bash
openclaw webhooks gmail run --account you@example.com
```

برای جریان راه‌اندازی سرتاسری و جزئیات عملیاتی، [مستندات Gmail Pub/Sub](/fa/automation/cron-jobs#gmail-pubsub-integration) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [اتوماسیون Webhook](/fa/automation/cron-jobs)
