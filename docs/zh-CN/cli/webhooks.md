---
read_when:
    - 你想将 Gmail Pub/Sub 事件接入 OpenClaw
    - 你需要完整的标志列表和默认值
summary: '`openclaw webhooks` 的 CLI 参考（Gmail Pub/Sub 设置和运行程序）'
title: Webhooks
x-i18n:
    generated_at: "2026-07-11T20:28:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook 辅助工具和集成。目前，此功能仅适用于基于内置 `gog` 监视器构建的 Gmail Pub/Sub 流程。

## 子命令

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| 子命令        | 说明                                                                  |
| ------------- | --------------------------------------------------------------------- |
| `gmail setup` | 一次性向导：设置 Gmail 监视、Pub/Sub 主题和订阅，以及 OpenClaw Hook 投递。 |
| `gmail run`   | 在前台运行 `gog watch serve` 和监视自动续期循环。                      |

<Note>
设置 `hooks.enabled=true` 和 `hooks.gmail.account`（由 `gmail setup` 设置）后，Gateway 网关还会在启动时自动启动 `gog gmail watch serve`。`gmail run` 会在前台运行相同的逻辑，适用于调试或 Gateway 网关监视器已禁用的情况。有关自动启动的详细信息和用于选择退出的 `OPENCLAW_SKIP_GMAIL_WATCHER`，请参阅 [Gmail Pub/Sub 集成](/zh-CN/automation/cron-jobs#gmail-pubsub-integration)。
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

如果缺少 `gcloud` 和 `gog`，则安装它们；对 `gcloud` 进行身份验证；创建 Pub/Sub 主题和订阅；启动 Gmail 监视；并写入 `hooks.gmail` 配置，同时设置 `hooks.enabled=true`。随后输出 `Next: openclaw webhooks gmail run`。

### 必填项

| 标志                | 说明                  |
| ------------------- | --------------------- |
| `--account <email>` | 要监视的 Gmail 账号。 |

### Pub/Sub 选项

| 标志                    | 默认值                 | 说明                                                                                                                   |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | （无）                 | GCP 项目 ID（OAuth 客户端的所有者）。依次回退到主题所属项目的 ID，以及从 `gog` 凭据解析出的项目。                      |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub 主题名称。                                                                                                     |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub 订阅名称。                                                                                                     |
| `--label <label>`       | `INBOX`                | 要监视的 Gmail 标签。                                                                                                  |
| `--push-endpoint <url>` | （无）                 | 显式指定 Pub/Sub 推送端点。此选项会覆盖 Tailscale。                                                                    |

### OpenClaw 投递选项

| 标志                   | 默认值                                         | 说明                    |
| ---------------------- | ---------------------------------------------- | ----------------------- |
| `--hook-url <url>`     | 根据 `hooks.path` 和 Gateway 网关端口构建      | OpenClaw Webhook URL。   |
| `--hook-token <token>` | `hooks.token`，或生成的令牌                    | OpenClaw Webhook 令牌。  |
| `--push-token <token>` | 生成的令牌                                     | 转发给 `gog watch serve` 的推送令牌。 |

### `gog watch serve` 选项

| 标志                  | 默认值          | 说明                                                                                                                                      |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` 的绑定主机。                                                                                                            |
| `--port <port>`       | `8788`          | `gog watch serve` 的端口。                                                                                                                |
| `--path <path>`       | `/gmail-pubsub` | 当启用 Tailscale 且未显式指定目标时，由于 Tailscale 会在代理前移除路径，此项会被强制设为 `/`；否则为 `gog watch serve` 的路径。            |
| `--include-body`      | `true`          | 包含邮件正文片段。没有用于关闭此功能的 CLI 标志；请改为在配置中设置 `hooks.gmail.includeBody: false`。                                    |
| `--max-bytes <n>`     | `20000`         | 每个正文片段的最大字节数。                                                                                                                |
| `--renew-minutes <n>` | `720`（12 小时） | 每隔 N 分钟续期一次 Gmail 监视。                                                                                                          |

### Tailscale 暴露

| 标志                      | 默认值   | 说明                                                                |
| ------------------------- | -------- | ------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | 通过 Tailscale 暴露推送端点：`funnel`、`serve` 或 `off`。            |
| `--tailscale-path <path>` | （无）   | Tailscale serve/funnel 的路径。                                     |
| `--tailscale-target <t>`  | （无）   | Tailscale serve/funnel 的目标（端口、`host:port` 或 URL）。          |

### 输出

| 标志     | 说明                               |
| -------- | ---------------------------------- |
| `--json` | 输出机器可读的摘要，而不是文本。   |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

在前台运行 `gog watch serve` 和监视自动续期循环；如果 `gog watch serve` 意外退出，则延迟 2 秒后重新启动。

`run` 接受与 `setup` 相同的 Pub/Sub、OpenClaw 投递、`gog watch serve` 和 Tailscale 标志，但以下情况除外：

- `run` 中的 `--account` 为**可选项**；如果未指定，则回退到 `hooks.gmail.account`。
- `run` **不**接受 `--project`、`--push-endpoint` 或 `--json`。
- 每个标志都会先回退到对应的 `hooks.gmail.*` 配置值（由 `setup` 写入），再回退到 `setup` 使用的相同内置默认值，但有一个例外：如果既未设置该标志，也未设置 `hooks.gmail.tailscale.mode`，则 `run` 中的 `--tailscale` 默认为 `off`（而不是 `funnel`）。

| 类别                  | 标志                                                                             |
| --------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub               | `--account`、`--topic`、`--subscription`、`--label`                              |
| OpenClaw 投递         | `--hook-url`、`--hook-token`、`--push-token`                                     |
| `gog watch serve`     | `--bind`、`--port`、`--path`、`--include-body`、`--max-bytes`、`--renew-minutes` |
| Tailscale             | `--tailscale`、`--tailscale-path`、`--tailscale-target`                          |

<Note>
对于 `run`，`--topic` 的值是完整的 Pub/Sub 主题路径（`projects/.../topics/...`），而不只是简短的主题名称。
</Note>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Webhook 自动化](/zh-CN/automation/cron-jobs)
- [Gmail Pub/Sub 集成](/zh-CN/automation/cron-jobs#gmail-pubsub-integration)
