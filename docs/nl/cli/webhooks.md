---
read_when:
    - Je wilt Gmail Pub/Sub-gebeurtenissen koppelen aan OpenClaw
    - Je wilt Webhook-helpercommando's
summary: CLI-referentie voor `openclaw webhooks` (Webhook-helpers + Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-04-29T22:36:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook-helpers en integraties (Gmail Pub/Sub, Webhook-helpers).

Gerelateerd:

- Webhooks: [Webhooks](/nl/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/nl/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Configureer Gmail-watch, Pub/Sub en OpenClaw Webhook-bezorging.

Vereist:

- `--account <email>`

Opties:

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

Voorbeelden:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Voer `gog watch serve` uit plus de lus voor automatisch vernieuwen van watch.

Opties:

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

Voorbeeld:

```bash
openclaw webhooks gmail run --account you@example.com
```

Zie de [Gmail Pub/Sub-documentatie](/nl/automation/cron-jobs#gmail-pubsub-integration) voor de end-to-end instelstroom en operationele details.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Webhook-automatisering](/nl/automation/cron-jobs)
