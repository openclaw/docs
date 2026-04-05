---
read_when:
    - 你想将 Gmail Pub/Sub 事件接入 OpenClaw
    - 你需要 webhook 辅助命令
summary: '`openclaw webhooks` 的 CLI 参考（webhook 辅助命令 + Gmail Pub/Sub）'
title: webhooks
x-i18n:
    generated_at: "2026-04-05T08:20:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b22ce879c3a94557be57919b4d2b3e92ff4d41fbae7bc88d2ab07cd4bbeac83
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

webhook 辅助命令与集成（Gmail Pub/Sub、webhook 辅助命令）。

相关内容：

- Webhooks：[Webhooks](/automation/cron-jobs#webhooks)
- Gmail Pub/Sub：[Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

配置 Gmail watch、Pub/Sub 和 OpenClaw webhook 投递。

必需参数：

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

运行 `gog watch serve` 以及 watch 自动续订循环。

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

有关端到端设置流程和运行细节，请参阅 [Gmail Pub/Sub 文档](/automation/cron-jobs#gmail-pubsub-integration)。
