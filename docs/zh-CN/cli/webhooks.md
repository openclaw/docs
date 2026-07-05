---
read_when:
    - 你想要将 Gmail Pub/Sub 事件接入 OpenClaw
    - 你需要完整的标志列表和默认值
summary: '`openclaw webhooks` 的 CLI 参考（Gmail Pub/Sub 设置和运行器）'
title: Webhooks
x-i18n:
    generated_at: "2026-07-05T11:11:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook 辅助工具和集成。目前此接口范围限定为基于内置 `gog` 监听器构建的 Gmail Pub/Sub 流程。

## 子命令

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| 子命令        | 描述                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| `gmail setup` | 一次性向导：Gmail watch、Pub/Sub 主题/订阅，以及 OpenClaw hook 交付。                  |
| `gmail run`   | 在前台运行 `gog watch serve` 加 watch 自动续期循环。                                    |

<Note>
Gateway 网关还会在启动时自动启动 `gog gmail watch serve`，前提是已设置 `hooks.enabled=true` 和 `hooks.gmail.account`（由 `gmail setup` 设置）。`gmail run` 是同样逻辑的前台版本，适合调试或 Gateway 网关监听器被禁用时使用。关于自动启动详情和 `OPENCLAW_SKIP_GMAIL_WATCHER` 退出选项，请参阅 [Gmail Pub/Sub 集成](/zh-CN/automation/cron-jobs#gmail-pubsub-integration)。
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

如果缺失则安装 `gcloud` 和 `gog`，对 `gcloud` 进行身份验证，创建 Pub/Sub 主题和订阅，启动 Gmail watch，并写入 `hooks.gmail` 配置且设置 `hooks.enabled=true`。输出 `Next: openclaw webhooks gmail run`。

### 必填

| 标志                | 描述                    |
| ------------------- | ----------------------- |
| `--account <email>` | 要监听的 Gmail 账号。   |

### Pub/Sub 选项

| 标志                    | 默认值                 | 描述                                                                                                                        |
| ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | （无）                 | GCP 项目 ID（OAuth 客户端所有者）。回退到主题自身的项目 ID，然后回退到从 `gog` 凭据解析出的项目。                         |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub 主题名称。                                                                                                          |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub 订阅名称。                                                                                                          |
| `--label <label>`       | `INBOX`                | 要监听的 Gmail 标签。                                                                                                       |
| `--push-endpoint <url>` | （无）                 | 显式 Pub/Sub 推送端点。会覆盖 Tailscale。                                                                                   |

### OpenClaw 交付选项

| 标志                   | 默认值                                      | 描述                          |
| ---------------------- | ------------------------------------------- | ----------------------------- |
| `--hook-url <url>`     | 由 `hooks.path` 和 Gateway 网关端口构建     | OpenClaw webhook URL。        |
| `--hook-token <token>` | `hooks.token`，或生成的 token               | OpenClaw webhook token。      |
| `--push-token <token>` | 生成的 token                                | 转发给 `gog watch serve` 的推送 token。 |

### `gog watch serve` 选项

| 标志                  | 默认值          | 描述                                                                                                                                  |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` 绑定主机。                                                                                                          |
| `--port <port>`       | `8788`          | `gog watch serve` 端口。                                                                                                              |
| `--path <path>`       | `/gmail-pubsub` | `gog watch serve` 路径。启用 Tailscale 且没有显式目标时强制为 `/`，因为 Tailscale 会在代理前剥离路径。                               |
| `--include-body`      | `true`          | 包含邮件正文片段。没有用于关闭此项的 CLI 标志；请改为在配置中设置 `hooks.gmail.includeBody: false`。                                  |
| `--max-bytes <n>`     | `20000`         | 每个正文片段的最大字节数。                                                                                                            |
| `--renew-minutes <n>` | `720` (12h)     | 每 N 分钟续期 Gmail watch。                                                                                                           |

### Tailscale 暴露

| 标志                      | 默认值   | 描述                                                              |
| ------------------------- | -------- | ----------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | 通过 tailscale 暴露推送端点：`funnel`、`serve` 或 `off`。         |
| `--tailscale-path <path>` | （无）   | tailscale serve/funnel 的路径。                                   |
| `--tailscale-target <t>`  | （无）   | Tailscale serve/funnel 目标（端口、`host:port` 或 URL）。         |

### 输出

| 标志     | 描述                                      |
| -------- | ----------------------------------------- |
| `--json` | 输出机器可读摘要，而不是文本。            |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

在前台运行 `gog watch serve` 加 watch 自动续期循环；如果 `gog watch serve` 意外退出，则在 2 秒延迟后重启。

`run` 接受与 `setup` 相同的 Pub/Sub、OpenClaw 交付、`gog watch serve` 和 Tailscale 标志，但以下情况除外：

- `--account` 在 `run` 上是**可选的**；它会回退到 `hooks.gmail.account`。
- `run` **不**接受 `--project`、`--push-endpoint` 或 `--json`。
- 每个标志都会回退到匹配的 `hooks.gmail.*` 配置值（由 `setup` 写入），然后回退到 `setup` 使用的相同内置默认值，但有一个例外：当既未设置该标志也未设置 `hooks.gmail.tailscale.mode` 时，`--tailscale` 在 `run` 上默认是 `off`（不是 `funnel`）。

| 类别              | 标志                                                                             |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`、`--topic`、`--subscription`、`--label`                              |
| OpenClaw 交付     | `--hook-url`、`--hook-token`、`--push-token`                                     |
| `gog watch serve` | `--bind`、`--port`、`--path`、`--include-body`、`--max-bytes`、`--renew-minutes` |
| Tailscale         | `--tailscale`、`--tailscale-path`、`--tailscale-target`                          |

<Note>
对于 `run`，`--topic` 值是完整的 Pub/Sub 主题路径（`projects/.../topics/...`），而不只是短主题名称。
</Note>

## 相关

- [CLI 参考](/zh-CN/cli)
- [Webhook 自动化](/zh-CN/automation/cron-jobs)
- [Gmail Pub/Sub 集成](/zh-CN/automation/cron-jobs#gmail-pubsub-integration)
