---
read_when:
    - 你使用 voice-call 插件，并希望每个 CLI 入口点
    - 你需要为 setup、smoke、call、continue、speak、dtmf、end、status、tail、latency、expose 和 start 提供标志表和默认值
summary: '`openclaw voicecall` 的 CLI 参考（voice-call 插件命令接口）'
title: 语音通话
x-i18n:
    generated_at: "2026-07-05T11:12:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` 是由插件提供的命令。它只会在语音通话插件已安装并启用时出现。

当 Gateway 网关运行时，操作命令（`call`、`start`、`continue`、`speak`、`dtmf`、`end`、`status`）会路由到该 Gateway 网关的语音通话运行时。如果没有可访问的 Gateway 网关，它们会回退到独立的 CLI 运行时。

## 子命令

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| 子命令 | 描述                                                     |
| ---------- | --------------------------------------------------------------- |
| `setup`    | 显示提供商和 webhook 就绪检查。                     |
| `smoke`    | 运行就绪检查；仅在带有 `--yes` 时发起实时测试呼叫。 |
| `call`     | 发起出站语音通话。                                |
| `start`    | `call` 的别名，要求提供 `--to`，`--message` 可选。 |
| `continue` | 播放一条消息并等待下一次响应。                 |
| `speak`    | 播放一条消息，但不等待响应。                 |
| `dtmf`     | 向活动通话发送 DTMF 数字。                             |
| `end`      | 挂断活动通话。                                         |
| `status`   | 检查活动通话（或通过 `--call-id` 检查单个通话）。                   |
| `tail`     | 跟踪 `calls.jsonl`（在提供商测试期间很有用）。              |
| `latency`  | 汇总来自 `calls.jsonl` 的轮次延迟指标。              |
| `expose`   | 为 webhook 端点切换 Tailscale serve/funnel。         |

## 设置和冒烟测试

### `setup`

默认打印人类可读的就绪检查。为脚本传入 `--json`。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

运行相同的就绪检查。只有同时存在 `--to` 和 `--yes` 时才会发起真实电话呼叫。

| 标志               | 默认值                           | 描述                             |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | （无）                            | 用于实时冒烟测试的呼叫电话号码。  |
| `--message <text>` | `OpenClaw voice call smoke test.` | 冒烟测试呼叫期间要播放的消息。 |
| `--mode <mode>`    | `notify`                          | 通话模式：`notify` 或 `conversation`。  |
| `--yes`            | `false`                           | 实际发起实时出站呼叫。  |
| `--json`           | `false`                           | 打印机器可读的 JSON。            |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
对于外部提供商（`plivo`、`telnyx`、`twilio`），`setup` 和 `smoke` 需要来自 `publicUrl`、隧道或 Tailscale 暴露的公共 webhook URL。环回地址或私有 serve 回退会被拒绝，因为运营商无法访问它。
</Note>

## 通话生命周期

### `call`

发起出站语音通话。

| 标志                   | 必填 | 默认值           | 描述                                                                |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | 是      | （无）            | 通话接通时要播放的消息。                                   |
| `-t, --to <phone>`     | 否       | 配置 `toNumber` | 要呼叫的 E.164 电话号码。                                                |
| `--mode <mode>`        | 否       | `conversation`    | 通话模式：`notify`（消息播放后挂断）或 `conversation`（保持打开）。 |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

`call` 的别名，默认标志形态不同。

| 标志               | 必填 | 默认值        | 描述                              |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | 是      | （无）         | 要呼叫的电话号码。                    |
| `--message <text>` | 否       | （无）         | 通话接通时要播放的消息。 |
| `--mode <mode>`    | 否       | `conversation` | 通话模式：`notify` 或 `conversation`。   |

### `continue`

播放一条消息并等待响应。

| 标志               | 必填 | 描述       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | 是      | 通话 ID。          |
| `--message <text>` | 是      | 要播放的消息。 |

### `speak`

播放一条消息，但不等待响应。

| 标志               | 必填 | 描述       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | 是      | 通话 ID。          |
| `--message <text>` | 是      | 要播放的消息。 |

### `dtmf`

向活动通话发送 DTMF 数字。

| 标志                | 必填 | 描述                                      |
| ------------------- | -------- | ------------------------------------------------ |
| `--call-id <id>`    | 是      | 通话 ID。                                         |
| `--digits <digits>` | 是      | DTMF 数字（例如用于等待的 `ww123456#`）。 |

### `end`

挂断活动通话。

| 标志             | 必填 | 描述 |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | 是      | 通话 ID。    |

### `status`

检查活动通话。

| 标志             | 默认值 | 描述                  |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | （无）  | 将输出限制为一个通话。 |
| `--json`         | `false` | 打印机器可读的 JSON。 |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## 日志和指标

### `tail`

跟踪语音通话 JSONL 日志。启动时打印最后 `--since` 行，然后随着写入流式输出新行。

| 标志            | 默认值                    | 描述                    |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | 从插件存储解析 | `calls.jsonl` 的路径。         |
| `--since <n>`   | `25`                       | 跟踪前要打印的行数。 |
| `--poll <ms>`   | `250`（最小 50）         | 轮询间隔，单位为毫秒。 |

### `latency`

汇总来自 `calls.jsonl` 的轮次延迟和监听等待指标。输出是包含 `recordsScanned`、`turnLatency` 和 `listenWait` 摘要的 JSON。

| 标志            | 默认值                    | 描述                          |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | 从插件存储解析 | `calls.jsonl` 的路径。               |
| `--last <n>`    | `200`（最小 1）          | 要分析的最近记录数。 |

## 暴露 webhooks

### `expose`

启用、禁用或更改语音 webhook 的 Tailscale serve/funnel 配置。

| 标志                  | 默认值                                   | 描述                                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`、`serve`（tailnet）或 `funnel`（公共）。 |
| `--path <path>`       | 配置 `tailscale.path` 或 `--serve-path` | 要暴露的 Tailscale 路径。                       |
| `--port <port>`       | 配置 `serve.port` 或 `3334`             | 本地 webhook 端口。                             |
| `--serve-path <path>` | 配置 `serve.path` 或 `/voice/webhook`   | 本地 webhook 路径。                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
只将 webhook 端点暴露给你信任的网络。可行时优先使用 Tailscale Serve，而不是 Funnel。
</Warning>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [语音通话插件](/zh-CN/plugins/voice-call)
