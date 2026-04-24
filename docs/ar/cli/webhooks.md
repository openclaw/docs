---
read_when:
    - تريد توصيل أحداث Gmail Pub/Sub إلى OpenClaw
    - تريد أوامر مساعدة لـ Webhook
summary: مرجع CLI لـ `openclaw webhooks` (مساعدات Webhook + Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-04-24T07:36:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

مساعدات Webhook والتكاملات (Gmail Pub/Sub، ومساعدات Webhook).

ذو صلة:

- Webhooks: [Webhooks](/ar/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/ar/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

هيّئ Gmail watch وPub/Sub وتسليم Webhook الخاص بـ OpenClaw.

مطلوب:

- `--account <email>`

الخيارات:

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

أمثلة:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

شغّل `gog watch serve` بالإضافة إلى حلقة التجديد التلقائي لـ watch.

الخيارات:

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

مثال:

```bash
openclaw webhooks gmail run --account you@example.com
```

راجع [توثيق Gmail Pub/Sub](/ar/automation/cron-jobs#gmail-pubsub-integration) لمعرفة تدفق الإعداد الكامل والتفاصيل التشغيلية.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [أتمتة Webhook](/ar/automation/cron-jobs)
