---
read_when:
    - 你想从终端检查或创建 Workboard 卡片
    - 你想从 CLI 调度 Workboard worker 运行
    - 你正在调试 Workboard CLI 或斜杠命令行为
summary: '`openclaw workboard` 卡片、调度和工作器运行的 CLI 参考'
title: Workboard CLI
x-i18n:
    generated_at: "2026-06-27T01:45:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` 是内置 [Workboard 插件](/zh-CN/plugins/workboard) 的终端界面。它让操作员可以列出卡片、创建卡片、查看单张卡片，并请求正在运行的 Gateway 网关将就绪工作调度到子智能体 worker 运行中。

使用该命令前先启用插件：

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## 用法

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

该命令读写由插件拥有的同一个 SQLite 数据库，dashboard 和 Workboard 智能体工具也使用它。当命令接受卡片 ID 时，可以传入完整 ID，也可以传入无歧义的前缀。

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

文本输出很紧凑：

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

列依次是 ID 前缀、状态、优先级、看板 ID、可选的智能体 ID 和标题。

标志：

| 标志                 | 用途                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | 将结果限制到一个看板命名空间          |
| `--status <status>`  | 将结果限制到一个 Workboard 状态         |
| `--include-archived` | 在紧凑文本输出中包含已归档卡片 |
| `--json`             | 以机器 JSON 打印完整卡片列表      |

默认情况下，紧凑文本输出会隐藏已归档卡片，因此 CLI 与 `/workboard list` 命令保持一致。传入 `--include-archived` 可显示它们。JSON 输出会保留完整卡片列表，包括已归档卡片，以兼容现有自动化。

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

标志：

| 标志                    | 用途                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | 初始卡片备注                      |
| `--status <status>`     | 初始状态，默认 `todo`          |
| `--priority <priority>` | 优先级，默认 `normal`              |
| `--agent <id>`          | 将卡片分配给一个智能体或 owner ID |
| `--board <id>`          | 将卡片存储在一个看板命名空间中     |
| `--labels <items>`      | 逗号分隔的标签                  |
| `--json`                | 以机器 JSON 打印已创建的卡片  |

`create` 会直接写入 Workboard SQLite 状态。该卡片会立即显示在 Control UI 的 Workboard 标签页中，也会立即对 Workboard 工具可见。

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

文本输出会打印紧凑卡片行和备注。JSON 输出会返回完整卡片记录，包括执行元数据、尝试次数、评论、链接、证明、工件、worker 日志、协议状态、诊断信息和自动化元数据。

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` 会先调用正在运行的 Gateway 网关 RPC 方法 `workboard.cards.dispatch`。该路径使用与 dashboard 调度操作相同的子智能体运行时，因此就绪卡片会变成带有链接会话键的任务跟踪 worker 运行。已分配智能体的卡片会使用智能体范围的子智能体会话键；未分配的卡片会保留无范围的子智能体键，因此会保留 Gateway 网关已配置的默认智能体。

调度循环：

1. 将依赖已就绪的子卡片提升为 `ready`。
2. 阻止过期 claim 或超时的 worker 运行。
3. 在就绪卡片上记录调度元数据。
4. 选择一小批未 claim 的就绪卡片。
5. 为 dispatcher 或已分配的智能体 claim 每张选中的卡片。
6. 使用有界卡片上下文和卡片 claim token 启动一个子智能体 worker 运行。
7. 在卡片上存储 worker 运行 ID、会话键、当 Gateway 网关任务 ledger 报告时的任务链接、执行状态和 worker 日志。

选择逻辑有意保持保守。默认情况下，一次调度最多启动三个 worker，会跳过已归档或已被 claim 的卡片，并且在单次遍历中每个 owner 或智能体只启动一张卡片。已经由活跃运行或 review 工作拥有的卡片会留到之后的调度处理。

如果卡片被 claim 后 worker 启动失败，Workboard 会阻止该卡片、清除 claim，并在卡片执行和 worker-log 元数据中记录失败。这会让启动失败保持可见，而不是静默地把卡片退回队列。

如果没有提供显式 Gateway 网关目标，并且本地 Gateway 网关不可用或尚未暴露 Workboard 调度方法，CLI 会回退到针对本地 Workboard 状态的仅数据调度。仅数据调度仍可提升依赖、清理陈旧 claim，并阻止超时运行，但不会启动 worker。鉴权、权限、验证失败，以及显式 `--url` 或 `--token` 目标的失败会被直接报告。

文本输出会报告 worker 启动情况：

```text
dispatch complete: started=2 failures=0
```

回退输出是明确的：

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON 输出包含调度结果。由 Gateway 网关支持的调度可能包含 `started` 和 `startFailures`；仅数据回退包含 `gatewayUnavailable: true`。卡片 JSON 输出中会隐藏 claim token。

在 dashboard 中，同一个调度结果会显示为简短摘要，让操作员无需打开卡片详情即可看到已启动、已提升、已阻止、已回收或失败的卡片数量。

## 斜杠命令一致性

支持命令的渠道可以使用匹配的斜杠命令：

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

斜杠命令调度也使用 Gateway 网关子智能体运行时，因此它遵循与 dashboard 和 CLI Gateway 网关路径相同的 claim、worker-start 和失败行为。

`/workboard list` 和 `/workboard show` 是面向已授权命令发送者的读取命令。`/workboard create` 和 `/workboard dispatch` 会更改看板状态，并且在聊天界面上需要 owner 状态，或者需要具有 `operator.write` 或 `operator.admin` 的 Gateway 网关客户端。

## 权限

CLI 调度路径会使用 `operator.read` 和 `operator.write` 范围调用 Gateway 网关 RPC。只读 Gateway 网关 token 可以通过读取方法查看 Workboard 数据，但不能创建卡片或调度 worker。

本地 `list`、`create` 和 `show` 命令会操作当前配置文件使用的本地 OpenClaw 状态目录。当你需要不同的状态根目录时，请在顶层 `openclaw` 命令上使用 `--dev` 或 `--profile <name>`。

## 故障排除

### 没有卡片出现

确认该插件已为同一个配置文件和状态根目录启用：

```bash
openclaw plugins inspect workboard --runtime --json
```

如果 dashboard 显示卡片但 CLI 不显示，请检查两个命令是否使用相同的 `--dev` 或 `--profile` 设置。

### 调度提示仅数据

启动或重启 Gateway 网关：

```bash
openclaw gateway restart
openclaw gateway status --deep
```

然后重试 `openclaw workboard dispatch`。仅数据回退对本地状态清理有用，但 worker 运行需要一个在线 Gateway 网关。

### 调度没有启动任何内容

检查至少有一张没有活跃 claim 的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

当同一个 owner 已经有正在运行或 review 中的工作时，卡片也可能被跳过。将已完成工作移动到 `done`，通过 Workboard 工具释放陈旧 claim，或在活跃 worker 完成后再次运行调度。

## 相关

- [Workboard 插件](/zh-CN/plugins/workboard)
- [CLI 参考](/zh-CN/cli)
- [斜杠命令](/zh-CN/tools/slash-commands)
- [Control UI](/zh-CN/web/control-ui)
