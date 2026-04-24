---
read_when:
    - Chcesz podłączyć zdarzenia Gmail Pub/Sub do OpenClaw
    - Chcesz polecenia pomocnicze Webhook
summary: Odwołanie CLI dla `openclaw webhooks` (pomocniki Webhook + Gmail Pub/Sub)
title: Webhooki
x-i18n:
    generated_at: "2026-04-24T09:04:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Pomocniki i integracje Webhook (Gmail Pub/Sub, pomocniki Webhook).

Powiązane:

- Webhooki: [Webhooks](/pl/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/pl/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Konfiguruje obserwację Gmail, Pub/Sub oraz dostarczanie Webhook OpenClaw.

Wymagane:

- `--account <email>`

Opcje:

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

Przykłady:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Uruchamia `gog watch serve` wraz z pętlą automatycznego odnawiania obserwacji.

Opcje:

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

Przykład:

```bash
openclaw webhooks gmail run --account you@example.com
```

Zobacz [dokumentację Gmail Pub/Sub](/pl/automation/cron-jobs#gmail-pubsub-integration), aby poznać pełny przepływ konfiguracji i szczegóły operacyjne.

## Powiązane

- [Odwołanie CLI](/pl/cli)
- [Automatyzacja Webhook](/pl/automation/cron-jobs)
