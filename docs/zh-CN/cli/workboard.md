---
read_when:
    - 你想从终端检查或创建 Workboard 卡片
    - 你想从 CLI 调度 Workboard worker 运行
    - 你正在调试 Workboard CLI 或斜杠命令行为
summary: '`openclaw workboard` 卡片、调度和 Worker 运行的 CLI 参考'
title: Workboard CLI
x-i18n:
    generated_at: "2026-07-05T11:12:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` 是内置 [Workboard 插件](/zh-CN/plugins/workboard)的终端界面。它让操作员列出卡片、创建卡片、查看单张卡片，并请求正在运行的 Gateway 网关将已就绪的工作分派到子智能体 worker 运行中。

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

该命令读取和写入与仪表板及 Workboard 智能体工具相同的插件自有 SQLite 数据库。卡片 id 是 UUID；接受卡片 id 的命令也接受无歧义的 id 前缀（紧凑文本输出会显示前 8 个字符）。

有效的 `status` 值：`triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`。有效的 `priority` 值：`low`、`normal`、`high`、`urgent`。

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

列依次是 id 前缀、状态、优先级、看板 id、可选的智能体 id 和标题。

| 标志                 | 用途                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | 将结果限制为一个看板命名空间          |
| `--status <status>`  | 将结果限制为一种 Workboard 状态         |
| `--include-archived` | 在紧凑文本输出中包含已归档卡片 |
| `--json`             | 以机器 JSON 打印完整卡片列表      |

紧凑文本输出默认隐藏已归档卡片，因此 CLI 与 `/workboard list` 保持一致。传入 `--include-archived` 可显示它们。JSON 输出始终保留完整卡片列表，包括已归档卡片，以兼容现有自动化。

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| 标志                    | 用途                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | 初始卡片备注                      |
| `--status <status>`     | 初始状态，默认 `todo`          |
| `--priority <priority>` | 优先级，默认 `normal`              |
| `--agent <id>`          | 将卡片分配给智能体或 owner id |
| `--board <id>`          | 将卡片存储到看板命名空间     |
| `--labels <items>`      | 逗号分隔的标签                  |
| `--json`                | 以机器 JSON 打印创建的卡片  |

`create` 会直接写入 Workboard SQLite 状态。该卡片会立即出现在 Control UI 的 Workboard 标签页和 Workboard 工具中。

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

文本输出会打印紧凑卡片行和备注。JSON 输出会返回完整卡片记录，包括执行元数据、尝试次数、评论、链接、证明、工件、worker 日志、协议状态、诊断和自动化元数据。

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` 首先调用正在运行的 Gateway 网关 RPC 方法 `workboard.cards.dispatch`，该方法使用与仪表板分派操作相同的子智能体运行时，因此已就绪卡片会变成带任务跟踪的 worker 运行，并链接会话键。已分配智能体的卡片会使用智能体范围的子智能体会话键；未分配卡片会保留无范围子智能体键，以便保留 Gateway 网关配置的默认智能体。

分派循环会：

1. 将依赖已就绪的子卡片提升为 `ready`。
2. 阻塞过期认领或超时的 worker 运行。
3. 在已就绪卡片上记录分派元数据。
4. 选择一小批未认领的已就绪卡片。
5. 为分派器或已分配智能体认领每张选中的卡片。
6. 使用有界卡片上下文和卡片认领令牌启动子智能体 worker 运行。
7. 在卡片上存储 worker 运行 id、会话键、Gateway 网关任务账本报告时的任务链接、执行状态和 worker 日志。

选择策略较保守：一次分派默认最多启动三个 worker，会跳过已归档或已认领的卡片，并且一次遍历中每个 owner 或智能体只启动一张卡片。已有活跃运行中或 review 工作拥有的卡片会留到后续分派处理。

如果卡片被认领后 worker 启动失败，Workboard 会阻塞该卡片、清除认领，并将失败记录到卡片执行和 worker 日志元数据中，让启动失败保持可见，而不是静默地将卡片放回队列。

如果没有给出显式 Gateway 网关目标，并且本地 Gateway 网关不可用或尚未公开 Workboard 分派方法，CLI 会回退到针对本地 Workboard 状态的仅数据分派。仅数据分派仍可提升依赖、清理陈旧认领并阻塞超时运行，但不会启动 worker。凭证、权限和验证失败，以及显式 `--url` 或 `--token` 目标的失败，会直接报告，而不会触发回退。

文本输出会报告 worker 启动情况：

```text
dispatch complete: started=2 failures=0
```

回退输出会明确说明：

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON 输出包含分派结果。由 Gateway 网关支持的分派可包含 `started` 和 `startFailures`；仅数据回退包含 `gatewayUnavailable: true`。卡片 JSON 输出中会隐去认领令牌。

在仪表板中，同一分派结果会显示为简短摘要，让操作员无需打开卡片详情即可看到启动、提升、阻塞、重新认领或失败的卡片数量。

## 斜杠命令对等性

支持命令的渠道可以使用对应的斜杠命令：

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

斜杠命令分派也使用 Gateway 网关子智能体运行时，因此它遵循与仪表板和 CLI Gateway 网关路径相同的认领、worker 启动和失败行为。

`/workboard list` 和 `/workboard show` 是授权命令发送者可用的读取命令。`/workboard create` 和 `/workboard dispatch` 会修改看板状态，并且在聊天界面上需要 owner 身份，或需要具有 `operator.write` 或 `operator.admin` 的 Gateway 网关客户端。

## 权限

CLI 分派路径使用 `operator.read` 和 `operator.write` 权限范围调用 Gateway 网关 RPC。只读 Gateway 网关令牌可以通过读取方法查看 Workboard 数据，但不能创建卡片或分派 worker。

本地 `list`、`create` 和 `show` 命令会操作当前配置文件使用的本地 OpenClaw 状态目录。当需要不同的状态根目录时，请在顶层 `openclaw` 命令上使用 `--dev` 或 `--profile <name>`。

## 故障排查

### 没有显示卡片

确认该插件已为同一配置文件和状态根目录启用：

```bash
openclaw plugins inspect workboard --runtime --json
```

如果仪表板显示卡片但 CLI 不显示，请检查两个命令是否使用相同的 `--dev` 或 `--profile` 设置。

### 分派提示仅数据

启动或重启 Gateway 网关：

```bash
openclaw gateway restart
openclaw gateway status --deep
```

然后重试 `openclaw workboard dispatch`。仅数据回退对本地状态清理很有用，但 worker 运行需要可用的实时 Gateway 网关。

### 分派未启动任何内容

检查是否至少有一张没有活跃认领的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

当同一个 owner 已有运行中或 review 工作时，卡片也可能被跳过。将已完成工作移到 `done`，通过 Workboard 工具释放陈旧认领，或在活跃 worker 完成后再次运行分派。

## 相关

- [Workboard 插件](/zh-CN/plugins/workboard)
- [CLI 参考](/zh-CN/cli)
- [斜杠命令](/zh-CN/tools/slash-commands)
- [Control UI](/zh-CN/web/control-ui)
