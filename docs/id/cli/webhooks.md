---
read_when:
    - Anda ingin menghubungkan peristiwa Gmail Pub/Sub ke OpenClaw
    - Anda ingin perintah pembantu Webhook
summary: Referensi CLI untuk `openclaw webhooks` (pembantu Webhook + Gmail Pub/Sub)
title: Webhook
x-i18n:
    generated_at: "2026-04-24T09:03:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Pembantu Webhook dan integrasi (Gmail Pub/Sub, pembantu Webhook).

Terkait:

- Webhook: [Webhook](/id/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/id/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Konfigurasikan Gmail watch, Pub/Sub, dan pengiriman Webhook OpenClaw.

Wajib:

- `--account <email>`

Opsi:

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

Contoh:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Jalankan `gog watch serve` plus loop auto-renew watch.

Opsi:

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

Contoh:

```bash
openclaw webhooks gmail run --account you@example.com
```

Lihat [dokumentasi Gmail Pub/Sub](/id/automation/cron-jobs#gmail-pubsub-integration) untuk alur penyiapan end-to-end dan detail operasional.

## Terkait

- [Referensi CLI](/id/cli)
- [Otomatisasi Webhook](/id/automation/cron-jobs)
