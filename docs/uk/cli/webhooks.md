---
read_when:
    - Ви хочете підключити події Gmail Pub/Sub до OpenClaw
    - Вам потрібні допоміжні команди для Webhook-ів
summary: Довідник CLI для `openclaw webhooks` (допоміжні засоби Webhook + Gmail Pub/Sub)
title: Webhook-и
x-i18n:
    generated_at: "2026-04-23T20:49:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e42359194d3682e824757b301d83d22042c68f6d24b5b1b0550b65a7e5e460d
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Допоміжні засоби та інтеграції Webhook (Gmail Pub/Sub, допоміжні засоби Webhook).

Пов’язане:

- Webhook-и: [Webhook-и](/uk/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Налаштувати Gmail watch, Pub/Sub і доставку Webhook OpenClaw.

Обов’язково:

- `--account <email>`

Параметри:

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

Приклади:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Запустити `gog watch serve` разом із циклом автоматичного поновлення watch.

Параметри:

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

Приклад:

```bash
openclaw webhooks gmail run --account you@example.com
```

Див. [документацію Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration) для повного процесу налаштування та експлуатаційних деталей.
