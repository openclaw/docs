---
read_when:
    - Chcesz podłączyć zdarzenia Gmail Pub/Sub do OpenClaw
    - Chcesz używać poleceń pomocniczych webhooków
summary: Dokumentacja CLI dla `openclaw webhooks` (narzędzia pomocnicze webhooków + Gmail Pub/Sub)
title: webhooks
x-i18n:
    generated_at: "2026-04-05T13:49:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b22ce879c3a94557be57919b4d2b3e92ff4d41fbae7bc88d2ab07cd4bbeac83
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Narzędzia pomocnicze webhooków i integracje (Gmail Pub/Sub, narzędzia pomocnicze webhooków).

Powiązane:

- Webhooki: [Webhooki](/pl/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/pl/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Skonfiguruj obserwowanie Gmail, Pub/Sub i dostarczanie webhooków OpenClaw.

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

Uruchom `gog watch serve` wraz z pętlą automatycznego odnawiania obserwowania.

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

Zobacz [dokumentację Gmail Pub/Sub](/pl/automation/cron-jobs#gmail-pubsub-integration), aby poznać kompletny przepływ konfiguracji oraz szczegóły operacyjne.
