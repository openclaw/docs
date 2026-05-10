---
read_when:
    - 你想了解任务流与后台任务的关系
    - 你在发布说明或文档中遇到 Task Flow 或 openclaw tasks flow
    - 你想检查或管理持久流状态
summary: 任务流程是位于后台任务之上的流程编排层
title: 任务流程
x-i18n:
    generated_at: "2026-05-10T19:21:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 135227b250840cd579f10a8ab4211e9319c447bb4d6df25907738ea138fc2d2a
    source_path: automation/taskflow.md
    workflow: 16
---

任务流是位于[后台任务](/zh-CN/automation/tasks)之上的流程编排基底。它管理带有自身状态、修订跟踪和同步语义的持久多步骤流程，而单个任务仍然是脱离式工作的单位。

## 何时使用任务流

当工作跨越多个顺序或分支步骤，并且你需要在 Gateway 网关重启后仍能持久跟踪进度时，使用任务流。对于单个后台操作，普通[任务](/zh-CN/automation/tasks)就足够了。

| 场景                                  | 使用方式             |
| ------------------------------------- | -------------------- |
| 单个后台作业                          | 普通任务             |
| 多步骤流水线（A 然后 B 然后 C）       | 任务流（托管）       |
| 观察外部创建的任务                    | 任务流（镜像）       |
| 一次性提醒                            | Cron 作业            |

## 可靠的定时工作流模式

对于市场情报简报等周期性工作流，将调度、编排和可靠性检查视为独立层：

1. 使用[定时任务](/zh-CN/automation/cron-jobs)来控制时间。
2. 当工作流应基于先前上下文继续构建时，使用持久 cron 会话。
3. 使用 [Lobster](/zh-CN/tools/lobster) 处理确定性步骤、审批门禁和恢复令牌。
4. 使用任务流跨子任务、等待、重试和 Gateway 网关重启来跟踪多步骤运行。

示例 cron 形态：

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

当周期性工作流需要有意保留历史、上次运行摘要或常驻上下文时，使用 `session:<id>` 而不是 `isolated`。当每次运行都应从零开始，并且所有必需状态都在工作流中显式声明时，使用 `isolated`。

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

建议的预检检查：

- 浏览器可用性和配置文件选择，例如为托管状态使用 `openclaw`，或在需要已登录的 Chrome 会话时使用 `user`。参见[浏览器](/zh-CN/tools/browser)。
- 每个来源的 API 凭证和配额。
- 所需端点的网络可达性。
- 为智能体启用所需工具，例如 `lobster`、`browser` 和 `llm-task`。
- 为 cron 配置失败目标位置，以便预检失败可见。参见[定时任务](/zh-CN/automation/cron-jobs#delivery-and-output)。

每个收集项建议的数据来源字段：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

让工作流在摘要生成前拒绝或标记过期项。LLM 步骤应仅接收结构化 JSON，并应要求它在输出中保留 `sourceUrl`、`retrievedAt` 和 `asOf`。当你需要在工作流中使用经过模式验证的模型步骤时，使用 [LLM 任务](/zh-CN/tools/llm-task)。

对于可复用的团队或社区工作流，将 CLI、`.lobster` 文件和任何设置说明打包为 skill 或插件，并通过 [ClawHub](/zh-CN/clawhub) 发布。除非插件 API 缺少所需的通用能力，否则将特定于工作流的防护规则保留在该包中。

## 同步模式

### 托管模式

任务流拥有端到端生命周期。它将任务创建为流程步骤，推动它们完成，并自动推进流程状态。

示例：一个每周报告流程会（1）收集数据，（2）生成报告，（3）交付报告。任务流将每个步骤创建为后台任务，等待完成，然后进入下一步。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 镜像模式

任务流观察外部创建的任务，并在不接管任务创建所有权的情况下保持流程状态同步。当任务来自 cron 作业、CLI 命令或其他来源，而你希望以流程形式统一查看它们的进度时，这很有用。

示例：三个独立的 cron 作业共同构成一个“早间运维”例程。镜像流程会跟踪它们的整体进度，但不控制它们何时或如何运行。

## 持久状态和修订跟踪

每个流程都会持久化自身状态并跟踪修订，因此进度可以在 Gateway 网关重启后保留。修订跟踪支持在多个来源尝试并发推进同一流程时检测冲突。
流程注册表使用 SQLite，并带有有界的预写日志维护，包括
周期性检查点和关机检查点，因此长时间运行的 Gateway 网关不会保留
无界的 `registry.sqlite-wal` 辅助文件。

## 取消行为

`openclaw tasks flow cancel` 会在流程上设置粘性取消意图。流程中的活动任务会被取消，并且不会启动新步骤。取消意图会跨重启保留，因此即使 Gateway 网关在所有子任务终止前重启，已取消的流程也会保持取消状态。

## CLI 命令

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| 命令                              | 描述                                      |
| --------------------------------- | ----------------------------------------- |
| `openclaw tasks flow list`        | 显示带有状态和同步模式的已跟踪流程        |
| `openclaw tasks flow show <id>`   | 按流程 ID 或查找键检查一个流程            |
| `openclaw tasks flow cancel <id>` | 取消正在运行的流程及其活动任务            |

## 流程与任务的关系

流程协调任务，而不是替代任务。单个流程在其生命周期中可能驱动多个后台任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查编排流程。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) — 流程所协调的脱离式工作账本
- [CLI：任务](/zh-CN/cli/tasks) — `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/zh-CN/automation) — 所有自动化机制一览
- [Cron 作业](/zh-CN/automation/cron-jobs) — 可能馈入流程的定时作业
