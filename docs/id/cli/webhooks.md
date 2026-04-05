---
read_when:
    - Anda ingin menghubungkan event Gmail Pub/Sub ke OpenClaw
    - Anda ingin perintah helper webhook
summary: Referensi CLI untuk `openclaw webhooks` (helper webhook + Gmail Pub/Sub)
title: webhooks
x-i18n:
    generated_at: "2026-04-05T13:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b22ce879c3a94557be57919b4d2b3e92ff4d41fbae7bc88d2ab07cd4bbeac83
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Helper webhook dan integrasi (Gmail Pub/Sub, helper webhook).

Terkait:

- Webhooks: [Webhooks](/id/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/id/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Konfigurasikan Gmail watch, Pub/Sub, dan pengiriman webhook OpenClaw.

Diperlukan:

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

Jalankan `gog watch serve` beserta loop perpanjangan otomatis watch.

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
