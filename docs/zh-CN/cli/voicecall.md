---
read_when:
    - 你使用语音通话插件，并希望了解每个 CLI 入口点
    - 你需要 setup、smoke、call、continue、speak、dtmf、end、status、tail、latency、expose 和 start 的参数标志表及默认值
summary: '`openclaw voicecall` 的 CLI 参考（语音通话插件命令界面）'
title: 语音通话
x-i18n:
    generated_at: "2026-07-11T20:26:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` 是由插件提供的命令。仅当语音通话插件已安装并启用时，此命令才会出现。

当 Gateway 网关运行时，操作命令（`call`、`start`、`continue`、`speak`、`dtmf`、`end`、`status`）会路由到该 Gateway 网关的语音通话运行时。如果无法连接到任何 Gateway 网关，则会回退到独立的 CLI 运行时。

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

| 子命令     | 说明                                                       |
| ---------- | ---------------------------------------------------------- |
| `setup`    | 显示提供商和 webhook 就绪检查。                            |
| `smoke`    | 运行就绪检查；仅在使用 `--yes` 时拨打实时测试电话。        |
| `call`     | 发起出站语音通话。                                         |
| `start`    | `call` 的别名，要求提供 `--to`，`--message` 可选。         |
| `continue` | 播放一条消息并等待下一次响应。                             |
| `speak`    | 播放一条消息，不等待响应。                                 |
| `dtmf`     | 向正在进行的通话发送 DTMF 数字。                           |
| `end`      | 挂断正在进行的通话。                                       |
| `status`   | 检查正在进行的通话（或通过 `--call-id` 检查一通电话）。   |
| `tail`     | 持续查看 `calls.jsonl`（在提供商测试期间很有用）。         |
| `latency`  | 汇总 `calls.jsonl` 中的轮次延迟指标。                      |
| `expose`   | 为 webhook 端点切换 Tailscale Serve/Funnel。               |

## 设置和冒烟测试

### `setup`

默认输出易于阅读的就绪检查结果。脚本中请传入 `--json`。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

运行相同的就绪检查。仅当同时提供 `--to` 和 `--yes` 时，才会实际拨打电话。

| 标志               | 默认值                            | 说明                                 |
| ------------------ | --------------------------------- | ------------------------------------ |
| `-t, --to <phone>` | （无）                            | 实时冒烟测试要拨打的电话号码。       |
| `--message <text>` | `OpenClaw voice call smoke test.` | 冒烟测试通话期间要播放的消息。       |
| `--mode <mode>`    | `notify`                          | 通话模式：`notify` 或 `conversation`。 |
| `--yes`            | `false`                           | 实际拨打实时出站电话。               |
| `--json`           | `false`                           | 输出机器可读的 JSON。                |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # 试运行
openclaw voicecall smoke --to "+15555550123" --yes  # 实时通知通话
```

<Note>
对于外部提供商（`plivo`、`telnyx`、`twilio`），`setup` 和 `smoke` 要求通过 `publicUrl`、隧道或 Tailscale 暴露提供公开 webhook URL。系统会拒绝 local loopback 或私有 Serve 回退方案，因为运营商无法访问它。
</Note>

## 通话生命周期

### `call`

发起出站语音通话。

| 标志                   | 必需 | 默认值            | 说明                                                                  |
| ---------------------- | ---- | ----------------- | --------------------------------------------------------------------- |
| `-m, --message <text>` | 是   | （无）            | 通话接通时要播放的消息。                                              |
| `-t, --to <phone>`     | 否   | 配置中的 `toNumber` | 要拨打的 E.164 电话号码。                                             |
| `--mode <mode>`        | 否   | `conversation`    | 通话模式：`notify`（播放消息后挂断）或 `conversation`（保持通话）。   |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

`call` 的别名，使用不同的默认标志形式。

| 标志               | 必需 | 默认值         | 说明                                 |
| ------------------ | ---- | -------------- | ------------------------------------ |
| `--to <phone>`     | 是   | （无）         | 要拨打的电话号码。                   |
| `--message <text>` | 否   | （无）         | 通话接通时要播放的消息。             |
| `--mode <mode>`    | 否   | `conversation` | 通话模式：`notify` 或 `conversation`。 |

### `continue`

播放一条消息并等待响应。

| 标志               | 必需 | 说明             |
| ------------------ | ---- | ---------------- |
| `--call-id <id>`   | 是   | 通话 ID。        |
| `--message <text>` | 是   | 要播放的消息。   |

### `speak`

播放一条消息，不等待响应。

| 标志               | 必需 | 说明             |
| ------------------ | ---- | ---------------- |
| `--call-id <id>`   | 是   | 通话 ID。        |
| `--message <text>` | 是   | 要播放的消息。   |

### `dtmf`

向正在进行的通话发送 DTMF 数字。

| 标志                | 必需 | 说明                                              |
| ------------------- | ---- | ------------------------------------------------- |
| `--call-id <id>`    | 是   | 通话 ID。                                         |
| `--digits <digits>` | 是   | DTMF 数字（例如使用 `ww123456#` 表示等待）。      |

### `end`

挂断正在进行的通话。

| 标志             | 必需 | 说明      |
| ---------------- | ---- | --------- |
| `--call-id <id>` | 是   | 通话 ID。 |

### `status`

检查正在进行的通话。

| 标志             | 默认值  | 说明                         |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | （无）  | 将输出限制为一通电话。       |
| `--json`         | `false` | 输出机器可读的 JSON。        |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## 日志和指标

### `tail`

持续查看语音通话 JSONL 日志。启动时输出最后 `--since` 行，然后在写入新行时持续输出。

| 标志            | 默认值                     | 说明                               |
| --------------- | -------------------------- | ---------------------------------- |
| `--file <path>` | 从插件存储中解析           | `calls.jsonl` 的路径。             |
| `--since <n>`   | `25`                       | 开始持续查看前要输出的行数。       |
| `--poll <ms>`   | `250`（最小值为 50）       | 轮询间隔，单位为毫秒。             |

### `latency`

汇总 `calls.jsonl` 中的轮次延迟和监听等待指标。输出为 JSON，其中包含 `recordsScanned`、`turnLatency` 和 `listenWait` 的汇总信息。

| 标志            | 默认值                     | 说明                               |
| --------------- | -------------------------- | ---------------------------------- |
| `--file <path>` | 从插件存储中解析           | `calls.jsonl` 的路径。             |
| `--last <n>`    | `200`（最小值为 1）        | 要分析的近期记录数量。             |

## 暴露 webhook

### `expose`

启用、禁用或更改语音 webhook 的 Tailscale Serve/Funnel 配置。

| 标志                  | 默认值                                      | 说明                                             |
| --------------------- | ------------------------------------------- | ------------------------------------------------ |
| `--mode <mode>`       | `funnel`                                    | `off`、`serve`（tailnet）或 `funnel`（公开）。   |
| `--path <path>`       | 配置中的 `tailscale.path` 或 `--serve-path` | 要暴露的 Tailscale 路径。                        |
| `--port <port>`       | 配置中的 `serve.port` 或 `3334`             | 本地 webhook 端口。                              |
| `--serve-path <path>` | 配置中的 `serve.path` 或 `/voice/webhook`   | 本地 webhook 路径。                              |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
仅向你信任的网络暴露 webhook 端点。条件允许时，优先使用 Tailscale Serve，而不是 Funnel。
</Warning>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [语音通话插件](/zh-CN/plugins/voice-call)
