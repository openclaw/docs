---
read_when:
    - 你想从终端查看或创建 Workboard 卡片
    - 你想从 CLI 调度 Workboard 工作节点运行任务
    - 你正在调试 Workboard CLI 或斜杠命令的行为
summary: '`openclaw workboard` 卡片、调度和工作节点运行的 CLI 参考'
title: Workboard CLI
x-i18n:
    generated_at: "2026-07-14T13:35:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` 是内置 [Workboard 插件](/zh-CN/plugins/workboard)的终端界面。操作员可使用它列出卡片、创建卡片、查看单张卡片，以及请求正在运行的 Gateway 网关将已就绪的工作分派给子智能体工作进程运行。

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
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

该命令读写由插件所有的同一个 SQLite 数据库，仪表板和 Workboard 智能体工具也使用此数据库。卡片 ID 是 UUID；接受卡片 ID 的命令也接受无歧义的 ID 前缀（紧凑文本输出会显示前 8 个字符）。

有效的 `status` 值：`triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`。有效的 `priority` 值：`low`、`normal`、`high`、`urgent`。

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

文本输出采用紧凑格式：

```text
7f4a2c10  ready     high    default agent-a  修复过期的工作进程 Heartbeat
```

各列依次为 ID 前缀、状态、优先级、看板 ID、可选的智能体 ID 和标题。

| 标志                 | 用途                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | 将结果限制为一个看板命名空间          |
| `--status <status>`  | 将结果限制为一种 Workboard 状态         |
| `--include-archived` | 在紧凑文本输出中包含已归档卡片 |
| `--json`             | 以机器可读 JSON 输出完整卡片列表      |

默认情况下，紧凑文本输出会隐藏已归档卡片，以便 CLI 与 `/workboard list` 保持一致。传入 `--include-archived` 可显示这些卡片。为兼容现有自动化，JSON 输出始终保留完整卡片列表，包括已归档卡片。

## `create`

```bash
openclaw workboard create "修复过期的工作进程 Heartbeat" --priority high --labels bug,workboard
openclaw workboard create "编写 Workboard 文档" --status ready --agent docs-agent --board docs --notes "涵盖 CLI、斜杠命令、分派和 SQLite 状态。"
```

| 标志                    | 用途                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | 初始卡片备注                      |
| `--status <status>`     | 初始状态，默认为 `todo`          |
| `--priority <priority>` | 优先级，默认为 `normal`              |
| `--agent <id>`          | 将卡片分配给智能体或所有者 ID |
| `--board <id>`          | 将卡片存储到看板命名空间中     |
| `--labels <items>`      | 以逗号分隔的标签                  |
| `--json`                | 以机器可读 JSON 输出创建的卡片  |

`create` 会直接写入 Workboard SQLite 状态。该卡片会立即显示在 Control UI 的 Workboard 标签页中，并可供 Workboard 工具使用。

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

文本输出会显示紧凑卡片行和备注。JSON 输出会返回完整的卡片记录，包括执行元数据、尝试记录、评论、链接、证明、工件、工作进程日志、协议状态、诊断信息和自动化元数据。

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` 使用与在仪表板中拖动卡片相同的手动操作员路径来更改卡片状态。它接受完整卡片 ID 或无歧义的前缀。活动的依赖项和计划暂停仍然生效。操作员无需智能体认领令牌即可移动已认领的卡片；认领令牌仍仅适用于智能体工具执行的变更，并会从 JSON 输出中删减。

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` 会先调用正在运行的 Gateway 网关 RPC 方法 `workboard.cards.dispatch`。该方法使用与仪表板分派操作相同的子智能体运行时，因此已就绪卡片会成为受任务跟踪的工作进程运行，并关联会话键。`--max-starts` 使用新增的 `workboard.cards.dispatchWithOptions` 方法，因此旧版 Gateway 网关会在启动任何工作进程前拒绝该选项；升级后，请先重启 Gateway 网关再使用此标志。已分配智能体的卡片使用智能体范围的子智能体会话键；未分配的卡片则保留无范围的子智能体键，从而继续使用 Gateway 网关中配置的默认智能体。

分派循环会：

1. 将依赖项已就绪的子卡片提升为 `ready`。
2. 阻止认领已过期或工作进程运行已超时的卡片。
3. 在已就绪卡片上记录分派元数据。
4. 选择一小批尚未认领的已就绪卡片。
5. 由分派器或已分配的智能体认领每张选中的卡片。
6. 使用有限的卡片上下文和卡片认领令牌启动子智能体工作进程运行。
7. 在卡片上存储工作进程运行 ID、会话键、Gateway 网关任务账本报告的任务关联、执行状态和工作进程日志。

选择策略较为保守：默认情况下，一次分派最多启动三个工作进程，跳过已归档或已认领的卡片，并且单次处理时每个所有者或智能体只启动一张卡片。已由活动的运行中或审核中工作占用的所有者所拥有的卡片会留待后续分派。传入带正整数的 `--max-starts <count>` 可更改每次处理的上限；每个所有者一张卡片的规则仍然适用，因此实际启动数量可能更少。

如果卡片被认领后工作进程启动失败，Workboard 会阻止该卡片、清除认领，并将失败记录到卡片执行和工作进程日志元数据中，使启动失败保持可见，而不是悄悄将卡片退回队列。

如果未指定明确的 Gateway 网关目标，并且本地 Gateway 网关不可用或尚未公开 Workboard 分派方法，CLI 会回退到仅针对本地 Workboard 状态的数据分派。仅数据分派仍可提升依赖项、清理过期认领并阻止超时运行，但不会启动工作进程。身份验证、权限和验证失败，以及明确指定 `--url` 或 `--token` 目标时发生的失败，会直接报告，而不会触发回退。

文本输出会报告工作进程启动情况：

```text
分派完成：已启动=2，失败=0
```

回退输出会明确说明：

```text
Gateway 网关不可用；仅执行数据分派：已提升=1，已阻止=0
```

JSON 输出包含分派结果。由 Gateway 网关支持的分派可包含 `started` 和 `startFailures`；仅数据回退包含 `gatewayUnavailable: true`。卡片 JSON 输出中的认领令牌会被删减。

在仪表板中，同一分派结果会显示为简短摘要，使操作员无需打开卡片详情即可查看已启动、已提升、已阻止、已回收或失败的卡片数量。

## 与斜杠命令保持一致

支持命令的渠道可以使用对应的斜杠命令：

```text
/workboard list
/workboard show 7f4a2c10
/workboard create 修复过期的工作进程 Heartbeat
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

斜杠命令分派也使用 Gateway 网关的子智能体运行时，因此其认领、工作进程启动和失败行为与仪表板及 CLI 的 Gateway 网关路径相同。

`/workboard list` 和 `/workboard show` 是供已授权命令发送者使用的读取命令。`/workboard create`、`/workboard move` 和 `/workboard dispatch` 会变更看板状态，并要求聊天界面上的发送者具有所有者身份，或要求 Gateway 网关客户端具有 `operator.write` 或 `operator.admin`。

## 权限

CLI 分派路径通常会请求 Gateway 网关的 `operator.write` 和 `operator.read` 权限范围。绑定到工作区的卡片会直接在精确配置的智能体工作区中运行；工作树请求会被限制到该目录，而不是允许主机将受仓库控制的代码具现化。选中的工作进程必须拥有针对该精确工作区的可写、非共享 Docker 沙箱访问权限，容器哈希必须处于活动状态并与请求的挂载和策略匹配，而且不得具备逃逸到主机的能力。传入 `--admin` 可明确请求 `operator.admin`、允许使用另一个主机检出目录并采用常规的托管工作树设置；如果客户端未获准使用该权限范围，连接将失败。只读 Gateway 网关令牌可以通过读取方法查看 Workboard 数据，但不能创建卡片或分派工作进程。对于拥有 Workboard 变更权限的调用方，工作区限制不会以其他方式影响手动移动卡片。

本地 `list`、`create`、`show` 和 `move` 命令会操作当前配置文件使用的本地 OpenClaw 状态目录。需要使用不同的状态根目录时，请在顶层 `openclaw` 命令中使用 `--dev` 或 `--profile <name>`。

## 故障排除

### 未显示任何卡片

确认已为同一个配置文件和状态根目录启用插件：

```bash
openclaw plugins inspect workboard --runtime --json
```

如果仪表板显示卡片但 CLI 未显示，请检查两条命令是否使用相同的 `--dev` 或 `--profile` 设置。

### 分派提示仅数据模式

启动或重启 Gateway 网关：

```bash
openclaw gateway restart
openclaw gateway status --deep
```

然后重试 `openclaw workboard dispatch`。仅数据回退适合清理本地状态，但运行工作进程需要活动的 Gateway 网关。

### 分派未启动任何工作

检查是否至少有一张没有活动认领的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果同一个所有者已有运行中或审核中的工作，卡片也可能被跳过。将已完成的工作移至 `done`，通过 Workboard 工具释放过期认领，或等待活动工作进程结束后再次运行分派。

## 相关内容

- [Workboard 插件](/zh-CN/plugins/workboard)
- [CLI 参考](/zh-CN/cli)
- [斜杠命令](/zh-CN/tools/slash-commands)
- [Control UI](/zh-CN/web/control-ui)
