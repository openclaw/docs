---
read_when:
    - Vuoi collegare gli eventi Gmail Pub/Sub a OpenClaw
    - Vuoi comandi helper per Webhook
summary: Riferimento CLI per `openclaw webhooks` (helper Webhook + Gmail Pub/Sub)
title: Webhook
x-i18n:
    generated_at: "2026-04-24T08:35:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Helper e integrazioni Webhook (Gmail Pub/Sub, helper Webhook).

Correlati:

- Webhook: [Webhooks](/it/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/it/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Configura Gmail watch, Pub/Sub e la consegna Webhook di OpenClaw.

Obbligatorio:

- `--account <email>`

Opzioni:

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

Esempi:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Esegue `gog watch serve` più il ciclo di rinnovo automatico del watch.

Opzioni:

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

Esempio:

```bash
openclaw webhooks gmail run --account you@example.com
```

Vedi la [documentazione Gmail Pub/Sub](/it/automation/cron-jobs#gmail-pubsub-integration) per il flusso di configurazione end-to-end e i dettagli operativi.

## Correlati

- [Riferimento CLI](/it/cli)
- [Automazione Webhook](/it/automation/cron-jobs)
