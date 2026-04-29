---
read_when:
    - 决定如何使用 OpenClaw 自动化工作
    - 在心跳、cron、钩子和长期指令之间选择
    - 寻找合适的自动化入口点
summary: 自动化机制概览：任务、定时任务、钩子、常驻指令和任务流
title: 自动化与任务
x-i18n:
    generated_at: "2026-04-29T09:12:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: da79bdd32a231f90850697b94bf061a778e9d0ad81420119ccd3fa0d3bc16fc1
    source_path: automation/index.md
    workflow: 16
---

OpenClaw 通过任务、计划作业、事件钩子和常设指令在后台运行工作。本页帮助你选择合适的机制，并了解它们如何配合。

## 快速决策指南

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
```

| 用例                                | 推荐            | 原因                                              |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| 在上午 9 点准时发送每日报告         | 计划任务（Cron） | 精确计时，隔离执行                 |
| 20 分钟后提醒我                 | 计划任务（Cron） | 使用精确计时的一次性任务（`--at`）            |
| 运行每周深度分析                | 计划任务（Cron） | 独立任务，可使用不同模型         |
| 每 30 分钟检查收件箱                | 心跳              | 与其他检查批处理，感知上下文         |
| 监控日历中的即将到来的事件    | 心跳              | 自然适合周期性感知               |
| 检查子智能体或 ACP 运行的状态 | 后台任务       | 任务账本会跟踪所有分离的工作            |
| 审计运行了什么以及何时运行                 | 后台任务       | `openclaw tasks list` 和 `openclaw tasks audit` |
| 多步骤研究后总结      | 任务流              | 带修订跟踪的持久编排     |
| 在会话重置时运行脚本           | 钩子                  | 事件驱动，在生命周期事件上触发          |
| 每次工具调用时执行代码         | 插件钩子           | 进程内钩子可以拦截工具调用        |
| 回复前始终检查合规性 | 常设指令        | 自动注入到每个会话        |

### 计划任务（Cron）与心跳

| 维度       | 计划任务（Cron）              | 心跳                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| 计时          | 精确（cron 表达式、一次性任务）  | 近似（默认每 30 分钟）    |
| 会话上下文 | 全新（隔离）或共享          | 完整主会话上下文             |
| 任务记录    | 始终创建                      | 从不创建                         |
| 交付        | 渠道、webhook 或静默         | 内联在主会话中                |
| 最适合        | 报告、提醒、后台作业 | 收件箱检查、日历、通知 |

当你需要精确计时或隔离执行时，使用计划任务（Cron）。当工作受益于完整会话上下文且近似计时可以接受时，使用心跳。

## 核心概念

### 计划任务（cron）

Cron 是 Gateway 网关内置的精确计时调度器。它会持久化作业，在正确时间唤醒智能体，并可将输出交付到聊天渠道或 webhook 端点。支持一次性提醒、重复表达式和入站 webhook 触发器。

参见[计划任务](/zh-CN/automation/cron-jobs)。

### 任务

后台任务账本跟踪所有分离的工作：ACP 运行、子智能体生成、隔离 cron 执行和 CLI 操作。任务是记录，不是调度器。使用 `openclaw tasks list` 和 `openclaw tasks audit` 检查它们。

参见[后台任务](/zh-CN/automation/tasks)。

### 任务流

任务流是后台任务之上的流程编排基底。它通过托管和镜像同步模式、修订跟踪，以及用于检查的 `openclaw tasks flow list|show|cancel`，来管理持久的多步骤流程。

参见[任务流](/zh-CN/automation/taskflow)。

### 常设指令

常设指令授予智能体对已定义程序的永久操作权限。它们位于工作区文件中（通常为 `AGENTS.md`），并会注入到每个会话中。可与 cron 结合，用于基于时间的执行。

参见[常设指令](/zh-CN/automation/standing-orders)。

### 钩子

内部钩子是由智能体生命周期事件（`/new`、`/reset`、`/stop`）、会话压缩、Gateway 网关启动和消息流触发的事件驱动脚本。它们会从目录中自动发现，并可通过 `openclaw hooks` 管理。对于进程内工具调用拦截，请使用[插件钩子](/zh-CN/plugins/hooks)。

参见[钩子](/zh-CN/automation/hooks)。

### 心跳

心跳是周期性的主会话轮次（默认每 30 分钟一次）。它在一个带完整会话上下文的智能体轮次中批处理多个检查（收件箱、日历、通知）。心跳轮次不会创建任务记录，也不会延长每日/空闲会话重置的新鲜度。使用 `HEARTBEAT.md` 放置一个小型清单；如果你希望在心跳自身内部进行仅到期的周期性检查，也可以使用 `tasks:` 块。空心跳文件会以 `empty-heartbeat-file` 跳过；仅到期任务模式会以 `no-tasks-due` 跳过。当 cron 工作处于活动或排队状态时，心跳会延后；`heartbeat.skipWhenBusy` 也可以在子智能体或嵌套通道繁忙时延后心跳。

参见[心跳](/zh-CN/gateway/heartbeat)。

## 它们如何配合

- **Cron** 处理精确计划（每日报告、每周回顾）和一次性提醒。所有 cron 执行都会创建任务记录。
- **心跳** 在每 30 分钟一次的批处理轮次中处理例行监控（收件箱、日历、通知）。
- **钩子** 通过自定义脚本响应特定事件（会话重置、压缩、消息流）。插件钩子覆盖工具调用。
- **常设指令** 为智能体提供持久上下文和权限边界。
- **任务流** 在单个任务之上协调多步骤流程。
- **任务** 自动跟踪所有分离的工作，以便你检查和审计。

## 相关内容

- [计划任务](/zh-CN/automation/cron-jobs) — 精确调度和一次性提醒
- [后台任务](/zh-CN/automation/tasks) — 所有分离工作的任务账本
- [任务流](/zh-CN/automation/taskflow) — 持久的多步骤流程编排
- [钩子](/zh-CN/automation/hooks) — 事件驱动的生命周期脚本
- [插件钩子](/zh-CN/plugins/hooks) — 进程内工具、提示、消息和生命周期钩子
- [常设指令](/zh-CN/automation/standing-orders) — 持久智能体指令
- [心跳](/zh-CN/gateway/heartbeat) — 周期性主会话轮次
- [配置参考](/zh-CN/gateway/configuration-reference) — 所有配置键
