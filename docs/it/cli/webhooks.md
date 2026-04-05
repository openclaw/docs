---
read_when:
    - Vuoi collegare gli eventi Gmail Pub/Sub a OpenClaw
    - Vuoi i comandi helper per webhook
summary: Riferimento CLI per `openclaw webhooks` (helper webhook + Gmail Pub/Sub)
title: webhooks
x-i18n:
    generated_at: "2026-04-05T13:48:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b22ce879c3a94557be57919b4d2b3e92ff4d41fbae7bc88d2ab07cd4bbeac83
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Helper webhook e integrazioni (Gmail Pub/Sub, helper webhook).

Correlati:

- Webhook: [Webhooks](/it/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/it/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Configura Gmail watch, Pub/Sub e la consegna webhook di OpenClaw.

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
