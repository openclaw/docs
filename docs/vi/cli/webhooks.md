---
read_when:
    - Bạn muốn kết nối các sự kiện Gmail Pub/Sub vào OpenClaw
    - Bạn muốn các lệnh hỗ trợ Webhook
summary: Tham chiếu CLI cho `openclaw webhooks` (trình trợ giúp Webhook + Gmail Pub/Sub)
title: Webhook
x-i18n:
    generated_at: "2026-04-29T22:35:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Các trình trợ giúp và tích hợp Webhook (Gmail Pub/Sub, trình trợ giúp Webhook).

Liên quan:

- Webhook: [Webhook](/vi/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/vi/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Cấu hình Gmail watch, Pub/Sub và phân phối Webhook của OpenClaw.

Bắt buộc:

- `--account <email>`

Tùy chọn:

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

Ví dụ:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Chạy `gog watch serve` cùng với vòng lặp tự động gia hạn watch.

Tùy chọn:

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

Ví dụ:

```bash
openclaw webhooks gmail run --account you@example.com
```

Xem [tài liệu Gmail Pub/Sub](/vi/automation/cron-jobs#gmail-pubsub-integration) để biết luồng thiết lập từ đầu đến cuối và chi tiết vận hành.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tự động hóa Webhook](/vi/automation/cron-jobs)
