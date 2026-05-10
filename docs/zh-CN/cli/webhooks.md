---
read_when:
    - 你想将 Gmail Pub/Sub 事件接入 OpenClaw
    - 你需要完整的标志列表和默认值
summary: '`openclaw webhooks` 的 CLI 参考（Gmail Pub/Sub 设置和运行器）'
title: 网络钩子
x-i18n:
    generated_at: "2026-05-10T19:29:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

网络钩子辅助工具和集成。目前，此接口范围限定为与内置 `gog` 监视器集成的 Gmail Pub/Sub 流程。

## 子命令

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| 子命令        | 描述                                                                               |
| ------------- | ---------------------------------------------------------------------------------- |
| `gmail setup` | 配置 Gmail 监视、Pub/Sub 主题/订阅，以及 OpenClaw 网络钩子投递目标。              |
| `gmail run`   | 运行 `gog watch serve` 以及监视自动续订循环。                                      |

## `webhooks gmail setup`

配置 Gmail 监视、Pub/Sub 和 OpenClaw 网络钩子投递。

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### 必需

| 标志                | 描述                  |
| ------------------- | --------------------- |
| `--account <email>` | 要监视的 Gmail 账号。 |

### Pub/Sub 选项

| 标志                    | 默认值                 | 描述                                               |
| ----------------------- | ---------------------- | -------------------------------------------------- |
| `--project <id>`        | （无）                 | GCP 项目 ID（OAuth 客户端所有者）。                |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub 主题名称。                                 |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub 订阅名称。                                 |
| `--label <label>`       | `INBOX`                | 要监视的 Gmail 标签。                              |
| `--push-endpoint <url>` | （无）                 | 显式 Pub/Sub 推送端点。会覆盖 Tailscale。          |

### OpenClaw 投递选项

| 标志                   | 默认值 | 描述                       |
| ---------------------- | ------ | -------------------------- |
| `--hook-url <url>`     | （无） | OpenClaw 网络钩子 URL。    |
| `--hook-token <token>` | （无） | OpenClaw 网络钩子令牌。    |
| `--push-token <token>` | （无） | 转发给 `gog watch serve` 的推送令牌。 |

### `gog watch serve` 选项

| 标志                  | 默认值          | 描述                                                              |
| --------------------- | --------------- | ----------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` 绑定主机。                                      |
| `--port <port>`       | `8788`          | `gog watch serve` 端口。                                          |
| `--path <path>`       | `/gmail-pubsub` | `gog watch serve` 路径。                                          |
| `--include-body`      | `true`          | 包含邮件正文片段。传入 `--no-include-body` 可禁用。               |
| `--max-bytes <n>`     | `20000`         | 每个正文片段的最大字节数。                                        |
| `--renew-minutes <n>` | `720`（12h）    | 每 N 分钟续订 Gmail 监视。                                        |

### Tailscale 暴露

| 标志                      | 默认值   | 描述                                                                  |
| ------------------------- | -------- | --------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | 通过 tailscale 暴露推送端点：`funnel`、`serve` 或 `off`。             |
| `--tailscale-path <path>` | （无）   | tailscale serve/funnel 的路径。                                       |
| `--tailscale-target <t>`  | （无）   | Tailscale serve/funnel 目标（端口、`host:port` 或 URL）。             |

### 输出

| 标志     | 描述                                      |
| -------- | ----------------------------------------- |
| `--json` | 打印机器可读摘要，而不是文本。            |

## `webhooks gmail run`

在前台运行 `gog watch serve` 以及监视自动续订循环。

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` 接受与 `setup` 相同的 `gog watch serve`、OpenClaw 投递、Pub/Sub 和 Tailscale 标志，但有以下例外：

- `--account` 在 `run` 中是**可选的**（它会回退到已配置的账号）。
- `run` **不**接受 `--project`、`--push-endpoint` 或 `--json`。
- `run` 标志没有内置默认值；缺失值会回退到 `setup` 写入的值。

| 类别              | 标志                                                                             |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`、`--topic`、`--subscription`、`--label`                              |
| OpenClaw 投递     | `--hook-url`、`--hook-token`、`--push-token`                                     |
| `gog watch serve` | `--bind`、`--port`、`--path`、`--include-body`、`--max-bytes`、`--renew-minutes` |
| Tailscale         | `--tailscale`、`--tailscale-path`、`--tailscale-target`                          |

<Note>
对于 `run`，`--topic` 值是完整的 Pub/Sub 主题路径（`projects/.../topics/...`），而不只是短主题名称。
</Note>

## 端到端流程

请参阅 [Gmail Pub/Sub 集成](/zh-CN/automation/cron-jobs#gmail-pubsub-integration)，了解与这些 CLI 命令配套使用的 GCP 项目、OAuth 和 Gateway 网关侧设置。

## 相关

- [CLI 参考](/zh-CN/cli)
- [网络钩子自动化](/zh-CN/automation/cron-jobs)
- [Gmail Pub/Sub](/zh-CN/automation/cron-jobs#gmail-pubsub-integration)
