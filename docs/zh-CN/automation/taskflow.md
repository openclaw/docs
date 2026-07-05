---
read_when:
    - 你想了解 Task Flow 与后台任务之间的关系
    - 你会在发布说明或文档中遇到 Task Flow 或 OpenClaw 任务流
    - 你想检查或管理持久化流程状态
summary: Task Flow 编排层，位于后台任务之上
title: 任务流
x-i18n:
    generated_at: "2026-07-05T11:01:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow 是位于[后台任务](/zh-CN/automation/tasks)之上的编排层。一个 flow 是多步骤工作的持久记录，拥有自己的状态、JSON 状态、修订计数器以及关联的任务记录。Flow 会在 Gateway 网关重启后继续保留；单个任务仍然是脱离式工作的单位。

## 何时使用 Task Flow

| 场景                                      | 使用                                        |
| ----------------------------------------- | ------------------------------------------- |
| 单个后台作业                              | 普通任务                                    |
| 由插件代码驱动的多步骤流水线              | Task Flow（托管）                           |
| 脱离式 ACP 或子智能体生成                 | Task Flow（镜像，自动创建）                 |
| 一次性提醒                                | Cron 作业                                   |

## 同步模式

### 托管模式

托管 flow 有一个控制器：插件代码通过插件运行时 Task Flow API 创建 flow，提供目标和必需的控制器 ID，然后显式驱动它。

- 每个步骤都作为在 flow 下创建的后台任务运行；flow 的所有者键和请求者来源会传递给子任务。
- 控制器在 `running`、`waiting` 和终止状态之间推进 flow，并在 flow 记录上存储任意 JSON 步骤状态。
- 每次变更都会传入 flow 的预期修订版本。过期写入会作为修订冲突被拒绝，而不是覆盖较新的状态。
- 一旦请求取消，新的子任务会被拒绝；当没有子任务仍处于活动状态时，flow 最终确定为 `cancelled`。

示例：一个周报 flow，依次（1）收集数据，（2）生成报告，（3）交付报告，每一步对应一个后台任务：

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 镜像模式

当脱离式 ACP 或子智能体运行开始时（带有可交付完成结果的会话范围任务），OpenClaw 会自动创建一个镜像的单任务 flow。Flow 记录会镜像其单个底层任务的状态、目标和时间信息，因此脱离式生成无需控制器也能获得稳定的 flow 句柄，用于状态和重试界面。镜像 flow 在 CLI 中显示同步模式 `task_mirrored`。

## Flow 状态

| 状态        | 含义                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | 已创建，尚未推进                                                           |
| `running`   | Flow 正在主动推进                                                          |
| `waiting`   | 托管 flow 停驻在等待元数据上（计时器、外部事件）                           |
| `blocked`   | 某个步骤完成但没有可用结果；`blockedTaskId`/摘要会说明是哪一个              |
| `succeeded` | 已成功完成                                                                 |
| `failed`    | 已完成但出现错误                                                           |
| `cancelled` | 已请求取消，且所有子任务都已结束                                           |
| `lost`      | Flow 丢失了其权威底层状态                                                  |

## 持久状态和修订跟踪

Flow 记录与任务记录一起持久化在共享 SQLite 状态数据库（`~/.openclaw/state/openclaw.sqlite`，`flow_runs` 表）中，因此进度会在 Gateway 网关重启后继续保留。每次写入都会递增 flow 的 `revision`；传入过期预期修订版本的并发写入者会得到冲突，并且必须重新读取。WAL 增长由 SQLite 自动检查点和周期性被动检查点限制，关闭时会执行 truncate 检查点。旧安装中的旧版 `flows/registry.sqlite` sidecar 会由 `openclaw doctor` 导入。

## 取消行为

`openclaw tasks flow cancel` 会在 flow 上设置一个粘性取消意图，取消其活动子任务，并拒绝新的托管子任务。一旦没有子任务仍处于活动状态，flow 就会最终确定为 `cancelled`，可能立即完成，也可能在子任务需要更长时间结束时通过维护扫描完成。该意图会被持久化，因此即使 Gateway 网关在所有子任务终止前重启，已取消的 flow 也会保持取消状态。

## CLI 命令

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| 命令                              | 描述                                                                  |
| --------------------------------- | --------------------------------------------------------------------- |
| `openclaw tasks flow list`        | 跟踪的 flow，包含同步模式、状态、修订版本、控制器、任务数量           |
| `openclaw tasks flow show <id>`   | 按 flow ID 或所有者键检查单个 flow，包括关联任务                      |
| `openclaw tasks flow cancel <id>` | 取消正在运行的 flow 及其活动任务                                      |

Flow 也会被 `openclaw tasks audit`（过期或损坏的 flow 发现项）和 `openclaw tasks maintenance`（最终确定卡住的取消，在 7 天后清理终止 flow）覆盖。

## 可靠的定时工作流模式

对于市场情报简报等周期性工作流，应将调度、编排和可靠性检查视为分离的层：

1. 使用[定时任务](/zh-CN/automation/cron-jobs)处理时间安排。
2. 当工作流需要基于先前上下文构建时，使用持久 cron 会话。
3. 使用 [Lobster](/zh-CN/tools/lobster) 处理确定性步骤、审批门禁和恢复令牌。
4. 使用 Task Flow 跨子任务、等待、重试和 Gateway 网关重启跟踪多步骤运行。

Cron 示例形态：

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

当周期性工作流需要有意保留历史、先前运行摘要或固定上下文时，使用 `--session session:<id>` 而不是 `isolated`。当每次运行都应从全新状态开始，且所有必需状态都在工作流中显式提供时，使用 `isolated`。

在工作流内部，把可靠性检查放在 LLM 摘要步骤之前：

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

推荐的预检检查：

- 浏览器可用性和配置文件选择，例如使用 `openclaw` 管理状态，或在需要已登录的 Chrome 会话时使用 `user`。参见[浏览器](/zh-CN/tools/browser)。
- 每个来源的 API 凭证和配额。
- 必需端点的网络可达性。
- 为智能体启用所需工具，例如 `lobster`、`browser` 和 `llm-task`。
- 为 cron 配置失败目标，以便预检失败可见。参见[定时任务](/zh-CN/automation/cron-jobs#delivery-and-output)。

每个收集项推荐的数据出处字段：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

让工作流在摘要之前拒绝或标记过期项。LLM 步骤应只接收结构化 JSON，并应被要求在输出中保留 `sourceUrl`、`retrievedAt` 和 `asOf`。当你需要在工作流中使用经过架构验证的模型步骤时，使用 [LLM Task](/zh-CN/tools/llm-task)。

对于可复用的团队或社区工作流，将 CLI、`.lobster` 文件以及任何设置说明打包为 Skills 或插件，并通过 [ClawHub](/zh-CN/clawhub) 发布。除非插件 API 缺少所需的通用能力，否则将工作流专属的防护规则保留在该包中。

## Flow 与任务的关系

Flow 协调任务，而不是替代任务。单个 flow 在其生命周期中可以驱动多个后台任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查编排 flow。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) - flow 所协调的脱离式工作账本
- [CLI：tasks](/zh-CN/cli/tasks) - `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/zh-CN/automation) - 所有自动化机制一览
- [Cron 作业](/zh-CN/automation/cron-jobs) - 可输入 flow 的定时作业
