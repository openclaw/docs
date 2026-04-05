---
read_when:
    - 你想了解 Task Flow 与后台任务之间的关系
    - 你在发行说明或文档中遇到 Task Flow 或 openclaw tasks flow
    - 你想检查或管理持久化流程状态
summary: 位于后台任务之上的 Task Flow 流程编排层
title: Task Flow
x-i18n:
    generated_at: "2026-04-05T08:13:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172871206b839845db807d9c627015890f7733b862e276853d5dbfbe29e03883
    source_path: automation/taskflow.md
    workflow: 15
---

# Task Flow

Task Flow 是位于[后台任务](/automation/tasks)之上的流程编排基础层。它管理具有自身状态、修订跟踪和同步语义的持久化多步骤流程，而单个任务仍然是分离工作的基本单元。

## 何时使用 Task Flow

当工作跨越多个顺序或分支步骤，并且你需要在 Gateway 网关重启后仍能持续跟踪进度时，请使用 Task Flow。对于单个后台操作，普通的[任务](/automation/tasks)就已足够。

| 场景 | 使用方式 |
| ------------------------------------- | -------------------- |
| 单个后台作业 | 普通任务 |
| 多步骤流水线（A 然后 B 然后 C） | Task Flow（托管） |
| 观察外部创建的任务 | Task Flow（镜像） |
| 一次性提醒 | Cron 作业 |

## 同步模式

### 托管模式

Task Flow 端到端地拥有整个生命周期。它将任务创建为流程步骤，推动其完成，并自动推进流程状态。

示例：一个每周报告流程，(1) 收集数据，(2) 生成报告，以及 (3) 发送报告。Task Flow 会将每个步骤创建为后台任务，等待完成，然后移动到下一个步骤。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 镜像模式

Task Flow 会观察外部创建的任务，并在不接管任务创建的情况下保持流程状态同步。当任务来自 cron 作业、CLI 命令或其他来源，而你希望以流程形式统一查看其进度时，这种模式非常有用。

示例：三个彼此独立的 cron 作业共同组成了一个“早间运维”例程。镜像流程会跟踪它们的整体进度，但不会控制它们何时或如何运行。

## 持久化状态与修订跟踪

每个流程都会持久化自身状态并跟踪修订，因此即使 Gateway 网关重启，进度也能保留。修订跟踪可在多个来源同时尝试推进同一流程时进行冲突检测。

## 取消行为

`openclaw tasks flow cancel` 会在流程上设置粘性取消意图。流程中的活动任务会被取消，且不会启动任何新步骤。该取消意图会在重启后继续保留，因此即使 Gateway 网关在所有子任务终止之前重启，被取消的流程仍会保持取消状态。

## CLI 命令

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| 命令 | 说明 |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list` | 显示已跟踪流程的状态和同步模式 |
| `openclaw tasks flow show <id>` | 按流程 id 或查找键检查单个流程 |
| `openclaw tasks flow cancel <id>` | 取消正在运行的流程及其活动任务 |

## 流程与任务的关系

流程用于协调任务，而不是替代任务。单个流程在其生命周期内可能会驱动多个后台任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查负责协调的流程。

## 相关内容

- [后台任务](/automation/tasks) — 流程所协调的分离工作台账
- [CLI：tasks](/cli/index#tasks) — `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/automation) — 一览所有自动化机制
- [Cron 作业](/automation/cron-jobs) — 可能会输入到流程中的定时作业
