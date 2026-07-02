---
read_when:
    - 你想了解 Task Flow 与后台任务的关系
    - 你会在发布说明或文档中遇到 Task Flow 或 openclaw tasks flow
    - 你想检查或管理持久的流程状态
summary: 后台任务之上的 Task Flow 编排层
title: 任务流程
x-i18n:
    generated_at: "2026-07-02T07:54:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

任务流是位于[后台任务](/zh-CN/automation/tasks)之上的流程编排底层能力。它管理具备自身状态、修订跟踪和同步语义的持久多步骤流程，而单个任务仍然是脱离式工作的单位。

## 何时使用任务流

当工作跨越多个顺序步骤或分支步骤，并且你需要在 Gateway 网关重启后仍能持久跟踪进度时，使用任务流。对于单个后台操作，普通[任务](/zh-CN/automation/tasks)就足够了。

| 场景                                  | 使用                 |
| ------------------------------------- | -------------------- |
| 单个后台作业                          | 普通任务             |
| 多步骤流水线（A 然后 B 然后 C）       | 任务流（托管）       |
| 观察外部创建的任务                    | 任务流（镜像）       |
| 一次性提醒                            | Cron 作业            |

## 可靠的定时工作流模式

对于市场情报简报等重复工作流，请将调度、编排和可靠性检查视为独立层：

1. 使用[定时任务](/zh-CN/automation/cron-jobs)处理时机。
2. 当工作流应基于先前上下文继续时，使用持久 cron 会话。
3. 使用 [Lobster](/zh-CN/tools/lobster) 处理确定性步骤、审批门和恢复令牌。
4. 使用任务流跨子任务、等待、重试和 Gateway 网关重启跟踪多步骤运行。

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

当重复工作流需要有意保留的历史、上次运行摘要或固定上下文时，使用 `session:<id>` 而不是 `isolated`。当每次运行都应从全新状态开始，并且所有必需状态都在工作流中显式给出时，使用 `isolated`。

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

推荐的预检检查：

- 浏览器可用性和配置文件选择，例如用于托管状态的 `openclaw`，或在需要已登录 Chrome 会话时使用 `user`。参见[浏览器](/zh-CN/tools/browser)。
- 每个来源的 API 凭据和配额。
- 所需端点的网络可达性。
- 为智能体启用的所需工具，例如 `lobster`、`browser` 和 `llm-task`。
- 为 cron 配置失败目标，使预检失败可见。参见[定时任务](/zh-CN/automation/cron-jobs#delivery-and-output)。

每个采集项推荐的数据溯源字段：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

让工作流在摘要生成前拒绝或标记过期项。LLM 步骤应只接收结构化 JSON，并应被要求在输出中保留 `sourceUrl`、`retrievedAt` 和 `asOf`。当你需要在工作流内使用经过架构验证的模型步骤时，请使用 [LLM 任务](/zh-CN/tools/llm-task)。

对于可复用的团队或社区工作流，请将 CLI、`.lobster` 文件以及任何设置说明打包为技能或插件，并通过 [ClawHub](/clawhub) 发布。除非插件 API 缺少所需的通用能力，否则将特定于工作流的护栏保留在该包中。

## 同步模式

### 托管模式

任务流端到端拥有生命周期。它将任务创建为流程步骤，驱动它们完成，并自动推进流程状态。

示例：一个周报流程会（1）收集数据，（2）生成报告，（3）交付报告。任务流将每个步骤创建为后台任务，等待完成，然后移动到下一步。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 镜像模式

任务流观察外部创建的任务，并在不接管任务创建所有权的情况下保持流程状态同步。当任务源自 cron 作业、CLI 命令或其他来源，而你希望以流程形式统一查看其进度时，这很有用。

示例：三个独立的 cron 作业共同构成“morning ops”例行流程。镜像流程会跟踪它们的整体进度，但不控制它们何时或如何运行。

## 持久状态和修订跟踪

每个流程都会持久化自身状态并跟踪修订，因此进度可以在 Gateway 网关重启后保留。当多个来源尝试同时推进同一流程时，修订跟踪可以启用冲突检测。
流程注册表使用 SQLite，并进行有界的预写日志维护，包括
定期检查点和关停检查点，因此长期运行的 Gateway 网关不会保留
无界的 `registry.sqlite-wal` 伴随文件。

## 取消行为

`openclaw tasks flow cancel` 会在流程上设置粘性的取消意图。流程内的活动任务会被取消，并且不会启动新步骤。取消意图会跨重启保留，因此即使 Gateway 网关在所有子任务终止前重启，已取消的流程也会保持取消状态。

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

流程协调任务，而不是替代任务。单个流程在其生命周期内可能驱动多个后台任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查编排流程。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) — 流程所协调的脱离式工作账本
- [CLI：任务](/zh-CN/cli/tasks) — `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/zh-CN/automation) — 所有自动化机制一览
- [Cron 作业](/zh-CN/automation/cron-jobs) — 可能馈入流程的定时作业
