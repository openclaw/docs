---
read_when:
    - Gmail Pub/Sub olaylarını OpenClaw'a bağlamak istiyorsunuz
    - Webhook yardımcı komutları istiyorsunuz
summary: '`openclaw webhooks` için CLI başvurusu (Webhook yardımcıları + Gmail Pub/Sub)'
title: Webhook'lar
x-i18n:
    generated_at: "2026-04-24T09:04:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Webhook yardımcıları ve entegrasyonlar (Gmail Pub/Sub, Webhook yardımcıları).

İlgili:

- Webhook'lar: [Webhook'lar](/tr/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/tr/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Gmail watch, Pub/Sub ve OpenClaw Webhook teslimatını yapılandırın.

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

`gog watch serve` ile birlikte watch otomatik yenileme döngüsünü çalıştırın.

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

## İlgili

- [CLI başvurusu](/tr/cli)
- [Webhook otomasyonu](/tr/automation/cron-jobs)
