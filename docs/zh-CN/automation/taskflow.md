---
read_when:
    - 你想了解 Task Flow 与后台任务之间的关系
    - 你在发布说明或文档中看到 Task Flow 或 openclaw tasks flow
    - 你想检查或管理持久化流程状态
summary: 后台任务之上的 Task Flow 编排层
title: 任务流程
x-i18n:
    generated_at: "2026-07-11T20:18:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow 是位于[后台任务](/zh-CN/automation/tasks)之上的编排层。流程是多步骤工作的持久记录，拥有自己的状态、JSON 状态数据、修订计数器和关联的任务记录。流程可在 Gateway 网关重启后继续存在；单个任务仍是分离式工作的基本单位。

## 何时使用 Task Flow

| 场景                                    | 使用方式                                  |
| --------------------------------------- | ----------------------------------------- |
| 单个后台作业                            | 普通任务                                  |
| 由插件代码驱动的多步骤流水线            | Task Flow（托管模式）                     |
| 分离式 ACP 或子智能体生成               | Task Flow（镜像模式，自动创建）           |
| 一次性提醒                              | Cron 作业                                 |

## 同步模式

### 托管模式

托管流程具有控制器：插件代码通过插件运行时 Task Flow API 创建流程，提供目标和必需的控制器 ID，然后显式驱动该流程。

- 每个步骤都作为该流程下创建的后台任务运行；流程的所有者键和请求者来源会传递给子任务。
- 控制器推动流程在 `running`、`waiting` 和终止状态之间转换，并在流程记录中存储任意 JSON 步骤状态。
- 每次变更都传入流程的预期修订版本。过期写入会因修订冲突而被拒绝，而不会覆盖更新的状态。
- 请求取消后，系统会拒绝新的子任务；当不再有活动子任务时，流程最终变为 `cancelled`。

示例：每周报告流程依次执行（1）收集数据、（2）生成报告和（3）交付报告，每个步骤对应一个后台任务：

```
流程：weekly-report
  步骤 1：gather-data     → 已创建任务 → 成功
  步骤 2：generate-report → 已创建任务 → 成功
  步骤 3：deliver         → 已创建任务 → 运行中
```

### 镜像模式

当分离式 ACP 或子智能体运行启动时（具有可交付完成结果的会话范围任务），OpenClaw 会自动创建一个镜像的单任务流程。流程记录会镜像其唯一后端任务的状态、目标和时间信息，因此分离式生成无需控制器即可获得稳定的流程句柄，用于状态和重试界面。镜像流程在 CLI 中显示同步模式 `task_mirrored`。

## 流程状态

| 状态        | 含义                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | 已创建，尚未开始推进                                                       |
| `running`   | 流程正在主动推进                                                           |
| `waiting`   | 托管流程根据等待元数据暂停（计时器、外部事件）                             |
| `blocked`   | 某个步骤已完成但没有可用结果；`blockedTaskId`/摘要会指出具体步骤           |
| `succeeded` | 已成功完成                                                                 |
| `failed`    | 因错误而结束                                                               |
| `cancelled` | 已请求取消，并且所有子任务均已结束                                         |
| `lost`      | 流程丢失了其权威后端状态                                                   |

## 持久状态和修订跟踪

流程记录与任务记录一同持久化在共享 SQLite 状态数据库（`~/.openclaw/state/openclaw.sqlite` 的 `flow_runs` 表）中，因此进度可在 Gateway 网关重启后继续保留。每次写入都会递增流程的 `revision`；并发写入方如果传入过期的预期修订版本，就会收到冲突，并且必须重新读取。SQLite 自动检查点和定期被动检查点会限制 WAL 增长，关闭时还会执行截断检查点。旧安装中的旧版 `flows/registry.sqlite` 辅助数据库由 `openclaw doctor` 导入。

## 取消行为

`openclaw tasks flow cancel` 会在流程上设置持续有效的取消意图，取消其活动子任务，并拒绝新的托管子任务。当不再有活动子任务时，流程最终变为 `cancelled`——这可能立即发生，也可能在子任务需要更长时间才能结束时由维护扫描完成。该意图会被持久化，因此即使 Gateway 网关在所有子任务终止前重启，已取消的流程仍会保持取消状态。

## CLI 命令

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| 命令                              | 说明                                                                   |
| --------------------------------- | ---------------------------------------------------------------------- |
| `openclaw tasks flow list`        | 列出受跟踪流程及其同步模式、状态、修订版本、控制器和任务数量           |
| `openclaw tasks flow show <id>`   | 按流程 ID 或所有者键检查单个流程，包括关联任务                         |
| `openclaw tasks flow cancel <id>` | 取消正在运行的流程及其活动任务                                         |

`openclaw tasks audit`（查找过期或损坏的流程）和 `openclaw tasks maintenance`（完成卡住的取消操作，并在 7 天后清理终止流程）也会处理流程。

## 可靠的定时工作流模式

对于市场情报简报等周期性工作流，应将调度、编排和可靠性检查视为相互独立的层：

1. 使用[定时任务](/zh-CN/automation/cron-jobs)控制执行时间。
2. 当工作流需要基于先前上下文继续运行时，使用持久 Cron 会话。
3. 使用 [Lobster](/zh-CN/tools/lobster)实现确定性步骤、审批关卡和恢复令牌。
4. 使用 Task Flow 跨子任务、等待、重试和 Gateway 网关重启跟踪多步骤运行。

Cron 示例结构：

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

当周期性工作流需要有意保留历史记录、先前运行摘要或长期上下文时，请使用 `--session session:<id>`，而不是 `isolated`。当每次运行都应从全新状态开始，并且工作流中已显式提供所有必需状态时，请使用 `isolated`。

在工作流内部，将可靠性检查放在 LLM 摘要步骤之前：

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

建议的预检项目：

- 浏览器可用性和配置文件选择，例如使用 `openclaw` 管理状态，或在需要已登录的 Chrome 会话时使用 `user`。请参阅[浏览器](/zh-CN/tools/browser)。
- 每个数据源的 API 凭据和配额。
- 所需端点的网络可达性。
- 为智能体启用所需工具，例如 `lobster`、`browser` 和 `llm-task`。
- 为 Cron 配置失败通知目标，以便预检失败可见。请参阅[定时任务](/zh-CN/automation/cron-jobs#delivery-and-output)。

建议为每个收集项提供以下数据来源字段：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

让工作流在生成摘要之前拒绝过期项目或将其标记为过期。LLM 步骤应只接收结构化 JSON，并应被要求在输出中保留 `sourceUrl`、`retrievedAt` 和 `asOf`。当你需要在工作流中使用经过架构验证的模型步骤时，请使用 [LLM Task](/zh-CN/tools/llm-task)。

对于可供团队或社区复用的工作流，将 CLI、`.lobster` 文件和所有设置说明打包为 Skill 或插件，并通过 [ClawHub](/clawhub)发布。除非插件 API 缺少所需的通用能力，否则请将工作流专用的防护规则保留在该软件包中。

## 流程与任务的关系

流程负责协调任务，而不是取代任务。单个流程在其生命周期内可以驱动多个后台任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查负责统筹的流程。

## 相关内容

- [后台任务](/zh-CN/automation/tasks)——由流程协调的分离式工作账本
- [CLI：任务](/zh-CN/cli/tasks)——`openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/zh-CN/automation)——一览所有自动化机制
- [Cron 作业](/zh-CN/automation/cron-jobs)——可向流程提供任务的定时作业
