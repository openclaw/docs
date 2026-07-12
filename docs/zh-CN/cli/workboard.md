---
read_when:
    - 你想从终端查看或创建 Workboard 卡片
    - 你想从 CLI 调度 Workboard 工作节点运行任务
    - 你正在调试 Workboard CLI 或斜杠命令行为
summary: '`openclaw workboard` 卡片、调度和工作节点运行的 CLI 参考'
title: Workboard CLI
x-i18n:
    generated_at: "2026-07-11T20:26:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` 是内置 [Workboard 插件](/zh-CN/plugins/workboard)的终端界面。操作员可以使用它列出卡片、创建卡片、查看单张卡片，并要求正在运行的 Gateway 网关将就绪工作分派给子智能体工作进程运行。

使用该命令前，请先启用插件：

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

该命令读写控制面板和 Workboard 智能体工具所使用的同一个插件自有 SQLite 数据库。卡片 ID 是 UUID；接受卡片 ID 的命令也接受无歧义的 ID 前缀（紧凑文本输出显示前 8 个字符）。

有效的 `status` 值：`triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`。有效的 `priority` 值：`low`、`normal`、`high`、`urgent`。

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

文本输出采用紧凑格式：

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

各列依次为 ID 前缀、状态、优先级、看板 ID、可选的智能体 ID 和标题。

| 标志                 | 用途                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | 将结果限制在一个看板命名空间内          |
| `--status <status>`  | 将结果限制为一种 Workboard 状态         |
| `--include-archived` | 在紧凑文本输出中包含已归档卡片 |
| `--json`             | 以机器可读 JSON 输出完整卡片列表      |

紧凑文本输出默认隐藏已归档卡片，使 CLI 与 `/workboard list` 保持一致。传入 `--include-archived` 可显示这些卡片。为了兼容现有自动化，JSON 输出始终保留完整卡片列表，包括已归档卡片。

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| 标志                    | 用途                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | 初始卡片备注                      |
| `--status <status>`     | 初始状态，默认为 `todo`          |
| `--priority <priority>` | 优先级，默认为 `normal`              |
| `--agent <id>`          | 将卡片分配给智能体或所有者 ID |
| `--board <id>`          | 将卡片存储在某个看板命名空间中     |
| `--labels <items>`      | 以逗号分隔的标签                  |
| `--json`                | 以机器可读 JSON 输出已创建的卡片  |

`create` 直接写入 Workboard SQLite 状态。该卡片会立即显示在 Control UI 的 Workboard 标签页中，并可供 Workboard 工具使用。

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

文本输出会显示紧凑卡片行和备注。JSON 输出会返回完整卡片记录，包括执行元数据、尝试记录、评论、链接、证明、产物、工作进程日志、协议状态、诊断和自动化元数据。

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` 首先调用正在运行的 Gateway RPC 方法 `workboard.cards.dispatch`。该方法使用与控制面板分派操作相同的子智能体运行时，因此就绪卡片会转换为带任务跟踪的工作进程运行，并关联会话键。已分配智能体的卡片使用智能体范围的子智能体会话键；未分配的卡片保留无范围的子智能体键，从而保留 Gateway 网关中配置的默认智能体。

分派循环：

1. 将依赖项已就绪的子卡片提升为 `ready`。
2. 阻止声明已过期或运行超时的工作进程。
3. 在就绪卡片上记录分派元数据。
4. 选择一小批尚未声明的就绪卡片。
5. 由分派器或指定智能体声明每张选中的卡片。
6. 使用范围受限的卡片上下文和卡片声明令牌启动子智能体工作进程运行。
7. 在卡片上存储工作进程运行 ID、会话键、Gateway 网关任务账本报告的任务关联、执行状态和工作进程日志。

选择策略较为保守：默认情况下，一次分派最多启动三个工作进程；跳过已归档或已声明的卡片；并且在单次处理中，每个所有者或智能体只启动一张卡片。若某个所有者已有处于运行或审核状态的活动工作，则其卡片会留待后续分派。

如果卡片声明后工作进程启动失败，Workboard 会阻止该卡片、清除声明，并将失败记录到卡片执行信息和工作进程日志元数据中，让启动失败保持可见，而不是静默地将卡片放回队列。

如果未明确指定 Gateway 网关目标，并且本地 Gateway 网关不可用或尚未公开 Workboard 分派方法，CLI 会回退到仅针对本地 Workboard 状态的数据分派。仅数据分派仍可提升依赖项、清理过期声明并阻止超时运行，但不会启动工作进程。身份验证、权限和验证失败，以及明确指定 `--url` 或 `--token` 目标时发生的失败，会直接报告，而不会触发回退。

文本输出会报告工作进程启动情况：

```text
dispatch complete: started=2 failures=0
```

回退输出会明确说明情况：

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON 输出包含分派结果。由 Gateway 网关支持的分派可以包含 `started` 和 `startFailures`；仅数据回退包含 `gatewayUnavailable: true`。卡片 JSON 输出中的声明令牌会被隐去。

在控制面板中，相同的分派结果会显示为简短摘要，使操作员无需打开卡片详情，就能看到已启动、已提升、已阻止、已重新声明或失败的卡片数量。

## 斜杠命令对等功能

支持命令的渠道可以使用对应的斜杠命令：

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

斜杠命令分派也使用 Gateway 网关的子智能体运行时，因此其声明、工作进程启动和失败行为与控制面板及 CLI Gateway 网关路径一致。

对于获得授权的命令发送者，`/workboard list` 和 `/workboard show` 是读取命令。`/workboard create` 和 `/workboard dispatch` 会修改看板状态，因此在聊天界面中要求发送者具有所有者身份，或者要求 Gateway 网关客户端具有 `operator.write` 或 `operator.admin` 权限范围。

## 权限

CLI 分派路径使用 `operator.read` 和 `operator.write` 权限范围调用 Gateway RPC。只读 Gateway 网关令牌可以通过读取方法查看 Workboard 数据，但无法创建卡片或分派工作进程。

本地 `list`、`create` 和 `show` 命令在当前配置文件使用的本地 OpenClaw 状态目录上操作。如果需要使用其他状态根目录，请在顶层 `openclaw` 命令中使用 `--dev` 或 `--profile <name>`。

## 故障排查

### 未显示任何卡片

确认该插件已针对同一配置文件和状态根目录启用：

```bash
openclaw plugins inspect workboard --runtime --json
```

如果控制面板显示卡片但 CLI 未显示，请检查两者是否使用相同的 `--dev` 或 `--profile` 设置。

### 分派提示仅数据模式

启动或重启 Gateway 网关：

```bash
openclaw gateway restart
openclaw gateway status --deep
```

然后重试 `openclaw workboard dispatch`。仅数据回退适合清理本地状态，但工作进程运行需要实时可用的 Gateway 网关。

### 分派未启动任何任务

检查是否至少有一张没有活动声明的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果同一所有者已有处于运行或审核状态的工作，也可能跳过卡片。将已完成的工作移至 `done`，通过 Workboard 工具释放过期声明，或者在活动工作进程完成后再次运行分派。

## 相关内容

- [Workboard 插件](/zh-CN/plugins/workboard)
- [CLI 参考](/zh-CN/cli)
- [斜杠命令](/zh-CN/tools/slash-commands)
- [Control UI](/zh-CN/web/control-ui)
