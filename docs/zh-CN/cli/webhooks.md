---
read_when:
    - 你希望将 Gmail Pub/Sub 事件接入 OpenClaw
    - 你希望使用 webhook 辅助命令
summary: '`openclaw webhooks` 的 CLI 参考（webhook 辅助命令 + Gmail Pub/Sub）'
title: Webhooks
x-i18n:
    generated_at: "2026-04-24T04:01:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Webhook 辅助命令和集成（Gmail Pub/Sub、webhook 辅助命令）。

相关内容：

- Webhooks：[Webhooks](/zh-CN/automation/cron-jobs#webhooks)
- Gmail Pub/Sub：[Gmail Pub/Sub](/zh-CN/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

配置 Gmail watch、Pub/Sub 和 OpenClaw webhook 投递。

必需项：

- `--account <email>`

选项：

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

示例：

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

运行 `gog watch serve` 以及 watch 自动续期循环。

选项：

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

示例：

```bash
openclaw webhooks gmail run --account you@example.com
```

有关端到端设置流程和操作细节，请参阅 [Gmail Pub/Sub documentation](/zh-CN/automation/cron-jobs#gmail-pubsub-integration)。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Webhook 自动化](/zh-CN/automation/cron-jobs)
