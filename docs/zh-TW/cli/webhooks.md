---
read_when:
    - 您想要將 Gmail Pub/Sub 事件串接到 OpenClaw
    - 你需要 Webhook 輔助命令
summary: '`openclaw webhooks` 的 CLI 參考（Webhook 輔助工具 + Gmail Pub/Sub）'
title: Webhook
x-i18n:
    generated_at: "2026-04-30T02:57:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook 輔助工具與整合（Gmail Pub/Sub、Webhook 輔助工具）。

相關：

- Webhooks：[Webhooks](/zh-TW/automation/cron-jobs#webhooks)
- Gmail Pub/Sub：[Gmail Pub/Sub](/zh-TW/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

設定 Gmail 監看、Pub/Sub，以及 OpenClaw Webhook 傳遞。

必要項目：

- `--account <email>`

選項：

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

範例：

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

執行 `gog watch serve`，並啟動監看的自動續約迴圈。

選項：

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

範例：

```bash
openclaw webhooks gmail run --account you@example.com
```

請參閱 [Gmail Pub/Sub 文件](/zh-TW/automation/cron-jobs#gmail-pubsub-integration)，了解端對端設定流程與操作詳細資料。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Webhook 自動化](/zh-TW/automation/cron-jobs)
