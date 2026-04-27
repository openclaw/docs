---
read_when:
    - 你想了解 Task Flow 与后台任务之间的关系
    - 你在发布说明或文档中遇到 Task Flow 或 openclaw tasks flow
    - 你想检查或管理持久化流程状态
summary: 位于后台任务之上的 Task Flow 流程编排层
title: Task flow
x-i18n:
    generated_at: "2026-04-27T12:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 15
---

Task Flow 是位于 [后台任务](/zh-CN/automation/tasks) 之上的流程编排基础层。它管理具备自身状态、修订跟踪和同步语义的持久化多步骤流程，而单个任务仍然是脱离式工作的基本单元。

## 何时使用 Task Flow

当工作跨越多个顺序或分支步骤，并且你需要在 Gateway 网关 重启后仍能持续跟踪进度时，请使用 Task Flow。对于单个后台操作，普通的 [任务](/zh-CN/automation/tasks) 就足够了。

| 场景 | 使用方式 |
| ------------------------------------- | -------------------- |
| 单个后台作业 | 普通任务 |
| 多步骤流水线（A 然后 B 然后 C） | Task Flow（托管） |
| 观察外部创建的任务 | Task Flow（镜像） |
| 一次性提醒 | Cron 作业 |

## 可靠的计划工作流模式

对于像市场情报简报这样的周期性工作流，请将计划、编排和可靠性检查视为独立的层：

1. 使用 [计划任务](/zh-CN/automation/cron-jobs) 负责时机控制。
2. 当工作流应基于先前上下文持续构建时，使用持久化的 cron 会话。
3. 使用 [Lobster](/zh-CN/tools/lobster) 实现确定性步骤、审批关卡和恢复令牌。
4. 使用 Task Flow 跨子任务、等待、重试和 Gateway 网关 重启来跟踪多步骤运行。

cron 形态示例：

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

当周期性工作流需要有意识地保留历史、前次运行摘要或长期上下文时，请使用 `session:<id>`，而不要使用 `isolated`。当每次运行都应从零开始，且所有必需状态都在工作流中明确给出时，请使用 `isolated`。

在工作流内部，请在 LLM 摘要步骤之前加入可靠性检查：

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

建议的预检项：

- 浏览器可用性和配置文件选择，例如用于受管状态的 `openclaw`，或在需要已登录 Chrome 会话时使用 `user`。参见 [Browser](/zh-CN/tools/browser)。
- 每个数据源的 API 凭证和配额。
- 对所需端点的网络可达性。
- 为智能体启用所需工具，例如 `lobster`、`browser` 和 `llm-task`。
- 为 cron 配置失败投递目标，以便预检失败可见。参见 [计划任务](/zh-CN/automation/cron-jobs#delivery-and-output)。

建议为每个采集条目提供的数据来源字段：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

在摘要之前，工作流应拒绝或标记过时条目。LLM 步骤应只接收结构化 JSON，并应被要求在输出中保留 `sourceUrl`、`retrievedAt` 和 `asOf`。当你需要在工作流内部使用经过 schema 验证的模型步骤时，请使用 [LLM Task](/zh-CN/tools/llm-task)。

对于可复用的团队或社区工作流，请将 CLI、`.lobster` 文件以及任何设置说明打包为 skill 或插件，并通过 [ClawHub](/zh-CN/tools/clawhub) 发布。除非插件 API 缺少所需的通用能力，否则请将工作流专用的防护规则保留在该包中。

## 同步模式

### 托管模式

Task Flow 端到端拥有整个生命周期。它将任务创建为流程步骤，驱动它们完成，并自动推进流程状态。

示例：一个每周报告流程，(1) 收集数据，(2) 生成报告，(3) 投递报告。Task Flow 将每个步骤创建为后台任务，等待其完成，然后进入下一步。

```
Flow: weekly-report
  Step 1: gather-data     → 已创建任务 → 已成功
  Step 2: generate-report → 已创建任务 → 已成功
  Step 3: deliver         → 已创建任务 → 运行中
```

### 镜像模式

Task Flow 会观察外部创建的任务，并在不接管任务创建的情况下保持流程状态同步。当任务来自 cron 作业、CLI 命令或其他来源，而你希望以流程形式统一查看其进度时，这种模式会很有用。

示例：三个彼此独立的 cron 作业共同构成一个“晨间运维”例行流程。镜像流程会跟踪它们的整体进度，而不控制它们何时或如何运行。

## 持久化状态与修订跟踪

每个流程都会持久化自身状态并跟踪修订，因此进度可以在 Gateway 网关 重启后保留。修订跟踪支持在多个来源尝试并发推进同一流程时进行冲突检测。
流程注册表使用 SQLite，并对预写日志维护进行有界控制，包括定期检查点和关闭时检查点，因此长时间运行的 Gateway 网关 不会保留无限增长的 `registry.sqlite-wal` 辅助文件。

## 取消行为

`openclaw tasks flow cancel` 会在流程上设置粘性取消意图。流程中的活动任务会被取消，且不会启动任何新步骤。取消意图会跨重启保留，因此即使 Gateway 网关 在所有子任务终止之前重启，被取消的流程也会保持取消状态。

## CLI 命令

```bash
# 列出活动和最近的流程
openclaw tasks flow list

# 显示特定流程的详细信息
openclaw tasks flow show <lookup>

# 取消一个正在运行的流程及其活动任务
openclaw tasks flow cancel <lookup>
```

| 命令 | 描述 |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list` | 显示已跟踪流程及其状态和同步模式 |
| `openclaw tasks flow show <id>` | 按流程 id 或查找键检查单个流程 |
| `openclaw tasks flow cancel <id>` | 取消正在运行的流程及其活动任务 |

## 流程与任务的关系

流程是协调任务，而不是取代任务。单个流程在其生命周期内可能会驱动多个后台任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查负责编排的流程。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) — 由流程协调的脱离式工作账本
- [CLI: tasks](/zh-CN/cli/tasks) — `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/zh-CN/automation) — 一览所有自动化机制
- [Cron Jobs](/zh-CN/automation/cron-jobs) — 可能会输入到流程中的计划作业
