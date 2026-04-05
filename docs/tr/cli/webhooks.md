---
read_when:
    - Gmail Pub/Sub olaylarını OpenClaw'a bağlamak istiyorsunuz
    - Webhook yardımcı komutları istiyorsunuz
summary: '`openclaw webhooks` için CLI başvurusu (webhook yardımcıları + Gmail Pub/Sub)'
title: webhooks
x-i18n:
    generated_at: "2026-04-05T13:49:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b22ce879c3a94557be57919b4d2b3e92ff4d41fbae7bc88d2ab07cd4bbeac83
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Webhook yardımcıları ve entegrasyonları (Gmail Pub/Sub, webhook yardımcıları).

İlgili:

- Webhook'lar: [Webhooks](/tr/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/tr/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Gmail izlemeyi, Pub/Sub'ı ve OpenClaw webhook teslimini yapılandırın.

Gerekli:

- `--account <email>`

Seçenekler:

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

Örnekler:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

`gog watch serve` ile izleme otomatik yenileme döngüsünü çalıştırın.

Seçenekler:

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

Örnek:

```bash
openclaw webhooks gmail run --account you@example.com
```

Uçtan uca kurulum akışı ve operasyonel ayrıntılar için [Gmail Pub/Sub belgelerine](/tr/automation/cron-jobs#gmail-pubsub-integration) bakın.
