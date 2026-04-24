---
read_when:
    - Gmail Pub/Sub イベントを OpenClaw に接続したい場合
    - Webhook ヘルパーコマンドが必要な場合
summary: '`openclaw webhooks` の CLI リファレンス（Webhook ヘルパー + Gmail Pub/Sub）'
title: Webhook
x-i18n:
    generated_at: "2026-04-24T04:52:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Webhook ヘルパーと統合機能（Gmail Pub/Sub、Webhook ヘルパー）。

関連:

- Webhook: [Webhook](/ja-JP/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/ja-JP/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Gmail watch、Pub/Sub、OpenClaw Webhook 配信を設定します。

必須:

- `--account <email>`

オプション:

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

例:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

`gog watch serve` と watch 自動更新ループを実行します。

オプション:

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

例:

```bash
openclaw webhooks gmail run --account you@example.com
```

エンドツーエンドのセットアップフローと運用の詳細については、[Gmail Pub/Sub ドキュメント](/ja-JP/automation/cron-jobs#gmail-pubsub-integration) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Webhook 自動化](/ja-JP/automation/cron-jobs)
